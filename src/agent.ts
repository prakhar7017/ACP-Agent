import "dotenv/config";
import readline from "readline";
import path from "path";
import { ACPClient } from "./acp";
import type { ACPMessage, ACPTextMessage, ACPToolCallMessage, SessionEntry } from "./types";
import { ToolHandler } from "./handlers/tool-handler";
import { saveUserSession, loadSession, listSessions, type SessionMetadata } from "./session";
import { createConfig, type Config } from "./config";
import { parseArgs, printHelp } from "./cli";
import { MessageFormatter, withSpinner } from "./ui/index";
import { streamingDisplay } from "./ui/streaming";
import { StreamingAccumulator } from "./streaming/accumulator";

class Agent {
  private client: ACPClient;
  private toolHandler: ToolHandler;
  private session: SessionEntry[] = [];
  private rl: readline.Interface;
  private promptQueue: Array<{ question: string; resolve: (value: string) => void; priority: boolean }> = [];
  private currentPrompt: { question: string; resolve: (value: string) => void } | null = null;
  private config: Config;
  private model: string;
  private sessionName: string | null = null;
  private streamAccumulator: StreamingAccumulator = new StreamingAccumulator();
  private currentStreamId: string | null = null;

  constructor(config: Config, sessionName?: string) {
    this.config = config;
    this.model = config.MODEL;
    this.sessionName = sessionName || null;
    this.client = new ACPClient(config.ACP_URL, config.CLAUDE_API_KEY);
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    
    this.rl.on('line', (line: string) => {
      if (this.currentPrompt) {
        const resolve = this.currentPrompt.resolve;
        this.currentPrompt = null;
        resolve(line);
        setImmediate(() => this.processNextPrompt());
      }
    });
    
    this.rl.setPrompt('');
    
    this.toolHandler = new ToolHandler(this.client, this.yesNo.bind(this), this.config.WORKSPACE_DIR);
  }

  async start(initialSession?: SessionEntry[]): Promise<void> {
    MessageFormatter.section("Agent Starting");
    MessageFormatter.info(`Model: ${this.model}`);
    MessageFormatter.info(`Workspace: ${this.config.WORKSPACE_DIR}`);
    
    if (this.sessionName) {
      MessageFormatter.info(`Resuming session: ${this.sessionName}`);
      if (initialSession && initialSession.length > 0) {
        MessageFormatter.info(`   Loaded ${initialSession.length} previous message(s)`);
      }
    }
    
    MessageFormatter.connecting(this.config.ACP_URL);
    try {
      await withSpinner("Connecting to ACP server...", async () => {
        await this.client.connect();
      });
      MessageFormatter.connected();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      MessageFormatter.connectionFailed(errorMessage);
      throw error;
    }

    if (initialSession) {
      this.session = [...initialSession];
    }

    this.setupMessageHandlers();
    await this.runCLILoop();
  }

  private setupMessageHandlers(): void {
    this.client.onStreamChunk((chunk: string, done: boolean, streamId: string) => {
      if (!this.currentStreamId || !streamingDisplay.isStreaming()) {
        this.currentStreamId = streamId;
        streamingDisplay.start(streamId);
      }

      const accumulated = this.streamAccumulator.accumulate(streamId, chunk, done);
      
      streamingDisplay.update(accumulated);

      if (done) {
        const finalContent = this.streamAccumulator.getContent(streamId);
        streamingDisplay.complete(finalContent);
        
        const textMsg: ACPTextMessage = {
          type: "text",
          content: finalContent,
        };
        this.session.push({ incoming: textMsg, ts: Date.now() });
        
        this.currentStreamId = null;
        this.streamAccumulator.reset(streamId);
      }
    });

    this.client.onMessage(async (msg: ACPMessage) => {
      if (msg.type === "text_chunk" || msg.type === "text_delta" || msg.type === "stream") {
        return;
      }

      this.session.push({ incoming: msg, ts: Date.now() });

      if (msg.type === "text") {
        const textMsg = msg as ACPTextMessage;
        
        if (!streamingDisplay.isStreaming()) {
          MessageFormatter.modelMessage(textMsg.content);
        }
      } else if (msg.type === "tool_call") {
        if (streamingDisplay.isStreaming()) {
          streamingDisplay.cancel();
          this.currentStreamId = null;
        }
        
        const toolCall = msg as ACPToolCallMessage;
        MessageFormatter.toolCall(toolCall.tool, toolCall.id);
        try {
          await this.toolHandler.handleToolCall(toolCall);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          MessageFormatter.error(`Tool handler error: ${errorMessage}`);
        }
      } else {
        MessageFormatter.info(`Received message: ${JSON.stringify(msg)}`);
      }
    });

    this.client.onError((error) => {
      if (streamingDisplay.isStreaming()) {
        streamingDisplay.cancel();
        this.currentStreamId = null;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      MessageFormatter.error(`Connection error: ${errorMessage}`);
    });

    this.client.onClose((code, reason) => {
      if (streamingDisplay.isStreaming()) {
        streamingDisplay.cancel();
        this.currentStreamId = null;
      }
      MessageFormatter.warning(`Connection closed (code: ${code}, reason: ${reason || "none"})`);
    });
  }

  private processNextPrompt(): void {
    if (this.currentPrompt) {
      return;
    }
    
    const priorityIndex = this.promptQueue.findIndex(p => p.priority);
    if (priorityIndex >= 0) {
      const prompt = this.promptQueue.splice(priorityIndex, 1)[0];
      this.showPrompt(prompt);
      return;
    }
    
    if (this.promptQueue.length > 0) {
      const prompt = this.promptQueue.shift()!;
      this.showPrompt(prompt);
    }
  }

  private showPrompt(prompt: { question: string; resolve: (value: string) => void }): void {
    this.currentPrompt = prompt;
    process.stdout.write(prompt.question);
    this.rl.setPrompt('');
    this.rl.prompt();
  }

  private async prompt(question: string, priority = false): Promise<string> {
    return new Promise<string>((resolve) => {
      if (priority && this.currentPrompt) {
        const oldPrompt = this.currentPrompt;
        this.currentPrompt = null;
        this.promptQueue.unshift({ 
          question: oldPrompt.question, 
          resolve: oldPrompt.resolve,
          priority: false 
        });
      }
      
      if (priority) {
        this.promptQueue.unshift({ question, resolve, priority });
      } else {
        this.promptQueue.push({ question, resolve, priority });
      }
      
      if (!this.currentPrompt) {
        this.processNextPrompt();
      }
    });
  }

  private async yesNo(promptText: string, defaultYes = false): Promise<boolean> {
    const def = defaultYes ? "Y/n" : "y/N";
    const answer = await this.prompt(`\n${promptText} (${def}) `, true);
    if (!answer.trim()) return defaultYes;
    return /^y/i.test(answer.trim());
  }

  private async runCLILoop(): Promise<void> {
    while (true) {
      const input = (await this.prompt("\n> ", false)).trim();
      
      if (!input) {
        continue;
      }
      
      if (input === "exit" || input === "quit") {
        break;
      }

      const message: ACPMessage = {
        type: "client_message",
        role: "user",
        content: input,
        model: this.model,
      };
      
      MessageFormatter.userMessage(input);
      this.session.push({ outgoing: message, ts: Date.now() });
      this.client.send(message);
    }

    await this.shutdown();
  }

  private async shutdown(): Promise<void> {
    this.rl.close();
    
    const sessionName = this.sessionName || `session-${Date.now()}`;
    
    const metadata: SessionMetadata = {
      model: this.model,
      workspace: this.config.WORKSPACE_DIR,
      lastUpdated: Date.now(),
    };
    
    if (!this.sessionName) {
      metadata.createdAt = Date.now();
    }
    
    const sessionFile = await withSpinner("Saving session...", async () => {
      return await saveUserSession(sessionName, {
        messages: this.session,
      }, metadata);
    });
    
    MessageFormatter.success(`Session saved to ${sessionFile}`);
    this.client.close();
    process.exit(0);
  }
  
}

async function printSessionList(): Promise<void> {
  try {
    const sessions = await listSessions();
    
    if (sessions.length === 0) {
      MessageFormatter.info("No saved sessions found.");
      return;
    }
    
    MessageFormatter.section("Available Sessions");
    
    sessions.forEach((session, index) => {
      const num = (index + 1).toString().padStart(2);
      const metadata = session.metadata;
      const dateStr = metadata?.lastUpdated 
        ? new Date(metadata.lastUpdated).toLocaleString()
        : "Unknown date";
      const model = metadata?.model || "Unknown model";
      const workspace = metadata?.workspace 
        ? path.relative(process.cwd(), metadata.workspace) || metadata.workspace
        : "Unknown workspace";
      
      MessageFormatter.info(`${num}. ${session.name}`);
      MessageFormatter.info(`   Model: ${model} | Workspace: ${workspace} | Updated: ${dateStr}`);
    });
    
    MessageFormatter.info(`Total: ${sessions.length} session(s)`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    MessageFormatter.error(`Failed to list sessions: ${errorMessage}`);
    process.exit(1);
  }
}

async function main(): Promise<void> {
  try {
    const args = parseArgs(process.argv.slice(2));
    
    if (args.help) {
      printHelp();
      process.exit(0);
    }
    
    if (args.listSessions) {
      await printSessionList();
      process.exit(0);
    }
    
    let sessionData: SessionEntry[] | undefined;
    let sessionName: string | undefined;
    
    if (args.session) {
      try {
        const loaded = await loadSession(args.session);
        if (loaded && loaded.messages) {
          sessionData = loaded.messages;
          sessionName = args.session;
          
          if (loaded.metadata) {
            if (!args.model && loaded.metadata.model) {
              args.model = loaded.metadata.model;
            }
            if (!args.workspace && loaded.metadata.workspace) {
              args.workspace = loaded.metadata.workspace;
            }
          }
          
          MessageFormatter.success(`Loaded session "${args.session}" with ${sessionData.length} message(s)`);
        } else {
          MessageFormatter.error(`Session "${args.session}" found but contains no messages.`);
          process.exit(1);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        MessageFormatter.error(`Failed to load session "${args.session}": ${errorMessage}`);
        process.exit(1);
      }
    }
    
    const config = await createConfig({
      model: args.model,
      workspace: args.workspace,
      url: args.url,
      apiKey: args.apiKey,
    });
    
    const agent = new Agent(config, sessionName);
    await agent.start(sessionData);
  } catch (error) {
    MessageFormatter.error(`Agent error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

main();
