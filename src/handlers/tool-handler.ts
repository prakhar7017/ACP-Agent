// src/handlers/tool-handler.ts
import type { ACPClient } from "../acp";
import type { ACPToolCallMessage, WriteFileArgs, ReadFileArgs, RunShellArgs, ToolResult } from "../types";
import { writeFile, readFile, runShell } from "../tools";
import { showWritePreview } from "../ui";

export class ToolHandler {
  constructor(
    private client: ACPClient,
    private yesNo: (prompt: string, defaultYes?: boolean) => Promise<boolean>
  ) {}

  async handleToolCall(call: ACPToolCallMessage): Promise<void> {
    const { tool, args, id } = call;
    console.log("\n[Tool call]", tool, id);

    try {
      switch (tool) {
        case "write_file":
          await this.handleWriteFile(id, this.validateWriteFileArgs(args));
          break;
        case "read_file":
          await this.handleReadFile(id, this.validateReadFileArgs(args));
          break;
        case "run_shell":
          await this.handleRunShell(id, this.validateRunShellArgs(args));
          break;
        default:
          this.sendToolResult(id, { success: false, error: `Unknown tool: ${tool}` });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.sendToolResult(id, { success: false, error: errorMessage });
    }
  }

  private validateWriteFileArgs(args: Record<string, unknown>): WriteFileArgs {
    if (typeof args.path !== "string" || typeof args.content !== "string") {
      throw new Error("Invalid write_file args: path and content must be strings");
    }
    return {
      path: args.path,
      content: args.content,
      mode: args.mode as "create" | "edit" | "patch" | undefined,
    };
  }

  private validateReadFileArgs(args: Record<string, unknown>): ReadFileArgs {
    if (typeof args.path !== "string") {
      throw new Error("Invalid read_file args: path must be a string");
    }
    return { path: args.path };
  }

  private validateRunShellArgs(args: Record<string, unknown>): RunShellArgs {
    if (typeof args.cmd !== "string") {
      throw new Error("Invalid run_shell args: cmd must be a string");
    }
    return {
      cmd: args.cmd,
      cwd: typeof args.cwd === "string" ? args.cwd : undefined,
    };
  }

  private async handleWriteFile(id: string, args: WriteFileArgs): Promise<void> {
    const { path: filePath, content, mode = "create" } = args;
    
    // Try to read existing file for preview
    let oldContent: string | null = null;
    try {
      const result = await readFile(filePath);
      if (result.success && result.content) {
        oldContent = result.content;
      }
    } catch {
      // File doesn't exist, which is fine for new files
      oldContent = null;
    }

    showWritePreview(oldContent, content);
    const approved = await this.yesNo(`Approve writing ${filePath}?`);

    if (!approved) {
      this.sendToolResult(id, { success: false, error: "user_rejected" });
      return;
    }

    const result = await writeFile(filePath, content, mode);
    this.sendToolResult(id, { success: true, stdout: result.message });
  }

  private async handleReadFile(id: string, args: ReadFileArgs): Promise<void> {
    const { path: filePath } = args;
    const result = await readFile(filePath);
    
    this.sendToolResult(id, {
      success: result.success,
      stdout: result.content || "",
      stderr: result.error || "",
    });
  }

  private async handleRunShell(id: string, args: RunShellArgs): Promise<void> {
    const { cmd, cwd } = args;
    console.log("Model requests running shell:", cmd);
    
    const approved = await this.yesNo(`Approve running shell command: ${cmd}?`);
    if (!approved) {
      this.sendToolResult(id, { success: false, error: "user_rejected" });
      return;
    }

    const result = await runShell(cmd, cwd || process.cwd());
    this.sendToolResult(id, {
      success: result.success,
      stdout: result.stdout,
      stderr: result.stderr,
      code: result.code,
    });
  }

  private sendToolResult(toolCallId: string, result: ToolResult): void {
    this.client.send({
      type: "tool_result",
      tool_call_id: toolCallId,
      ...result,
    });
  }
}

