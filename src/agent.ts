// src/agent.ts
import "dotenv/config";
import readline from "readline";
import { ACPClient } from "./acp";
import type { ACPMessage, ACPTextMessage, ACPToolCallMessage, SessionEntry } from "./types";
import { ToolHandler } from "./handlers/tool-handler";
import { saveUserSession } from "./session";
import { CONFIG } from "./config";

class Agent {
  private client: ACPClient;
  private toolHandler: ToolHandler;
  private session: SessionEntry[] = [];
  private rl: readline.Interface;

  constructor() {
    this.client = new ACPClient(CONFIG.ACP_URL, CONFIG.CLAUDE_API_KEY);
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    this.toolHandler = new ToolHandler(this.client, this.yesNo.bind(this));
  }

  async start(): Promise<void> {
    console.log("Agent starting. Connecting to", CONFIG.ACP_URL);
    
    try {
      await this.client.connect();
      console.log("Connected to ACP server.");
    } catch (error) {
      console.error("Failed to connect:", error);
      throw error;
    }

    this.setupMessageHandlers();
    await this.runCLILoop();
  }

  private setupMessageHandlers(): void {
    this.client.onMessage(async (msg: ACPMessage) => {
      this.session.push({ incoming: msg, ts: Date.now() });

      if (msg.type === "text") {
        const textMsg = msg as ACPTextMessage;
        console.log("\n[Model]", textMsg.content);
      } else if (msg.type === "tool_call") {
        const toolCall = msg as ACPToolCallMessage;
        await this.toolHandler.handleToolCall(toolCall);
      } else {
        console.log("\n[MSG]", msg);
      }
    });

    this.client.onError((error) => {
      console.error("\n[Error]", error);
    });

    this.client.onClose((code, reason) => {
      console.log("\n[Connection closed]", code, reason);
    });
  }

  private async prompt(question: string): Promise<string> {
    return new Promise<string>((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer);
      });
    });
  }

  private async yesNo(promptText: string, defaultYes = false): Promise<boolean> {
    const def = defaultYes ? "Y/n" : "y/N";
    const answer = await this.prompt(`${promptText} (${def}) `);
    if (!answer.trim()) return defaultYes;
    return /^y/i.test(answer.trim());
  }

  private async runCLILoop(): Promise<void> {
    while (true) {
      const input = (await this.prompt("\n> ")).trim();
      
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
      };
      
      this.session.push({ outgoing: message, ts: Date.now() });
      this.client.send(message);
    }

    await this.shutdown();
  }

  private async shutdown(): Promise<void> {
    this.rl.close();
    const sessionName = `session-${Date.now()}`;
    const sessionFile = await saveUserSession(sessionName, {
      messages: this.session,
    });
    
    console.log("Session saved to", sessionFile);
    this.client.close();
    process.exit(0);
  }
}

async function main(): Promise<void> {
  try {
    const agent = new Agent();
    await agent.start();
  } catch (error) {
    console.error("Agent error:", error);
    process.exit(1);
  }
}

main();
