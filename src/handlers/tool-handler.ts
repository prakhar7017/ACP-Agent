import path from "path";
import chalk from "chalk";
import type { ACPClient } from "../acp";
import type { ACPToolCallMessage, WriteFileArgs, ReadFileArgs, RunShellArgs, ToolResult } from "../types";
import { writeFile, readFile, runShell } from "../tools";
import { showWritePreview, MessageFormatter, withSpinner } from "../ui/index";

export class ToolHandler {
  constructor(
    private client: ACPClient,
    private yesNo: (prompt: string, defaultYes?: boolean) => Promise<boolean>,
    private workspaceDir: string = process.cwd()
  ) {}
  
  private resolvePath(filePath: string): string {

    if (path.isAbsolute(filePath)) {
      return filePath;
    }


    let cleanPath = filePath;
    if (cleanPath.startsWith("workspace/") || cleanPath.startsWith("workspace\\")) {
      cleanPath = cleanPath.replace(/^workspace[/\\]/, "");
    }

    return path.resolve(this.workspaceDir, cleanPath);
  }
  
  private getRelativePath(absolutePath: string): string {

    try {
      const relative = path.relative(this.workspaceDir, absolutePath);

      if (relative.startsWith("..")) {
        return absolutePath;
      }
      return relative;
    } catch {
      return absolutePath;
    }
  }

  async handleToolCall(call: ACPToolCallMessage): Promise<void> {
    const { tool, args, id } = call;

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
          MessageFormatter.error(`Unknown tool: ${tool}`);
          this.sendToolResult(id, { success: false, error: `Unknown tool: ${tool}` });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      MessageFormatter.error(`Tool error: ${errorMessage}`);
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

    const relativePath = args.path.trim();
    const content = args.content;
    const requestedMode = args.mode || "create";

    if (!relativePath || relativePath.length === 0) {
      this.sendToolResult(id, { success: false, error: "File path cannot be empty" });
      return;
    }

    const filePath = this.resolvePath(relativePath);
    const displayPath = this.getRelativePath(filePath);

    let oldContent: string | null = null;
    let fileExists = false;
    try {
      const result = await readFile(filePath);
      if (result.success && result.content) {
        oldContent = result.content;
        fileExists = true;
      }
    } catch {

      oldContent = null;
      fileExists = false;
    }

    let actualMode = requestedMode;
    let modeText: string;
    
    if (!fileExists) {

      actualMode = "create";
      modeText = "create";
      MessageFormatter.fileOperation("create", displayPath);
    } else {

      if (requestedMode === "create") {

        modeText = "overwrite";
        actualMode = "create";
        MessageFormatter.warning(`File "${displayPath}" already exists. This will overwrite it.`);
      } else if (requestedMode === "edit") {
        modeText = "edit";
        actualMode = "edit";
        MessageFormatter.fileOperation("edit", displayPath);
      } else {
        modeText = "update";
        actualMode = requestedMode;
      }
    }

    showWritePreview(oldContent, content);
    
    MessageFormatter.info(`Approval required for file: ${displayPath}`);
    const approved = await this.yesNo(`Approve ${modeText}ing "${displayPath}"?`);

    if (!approved) {
      MessageFormatter.warning("File write cancelled by user.");
      this.sendToolResult(id, { success: false, error: "user_rejected" });
      return;
    }

    const result = await withSpinner(`Writing file: ${displayPath}...`, async () => {
      return await writeFile(filePath, content, actualMode);
    });

    const successMessage = result.message.replace(filePath, displayPath);
    MessageFormatter.success(successMessage);
    this.sendToolResult(id, { success: true, stdout: result.message });
  }

  private async handleReadFile(id: string, args: ReadFileArgs): Promise<void> {
    const relativePath = args.path.trim();
    if (!relativePath || relativePath.length === 0) {
      MessageFormatter.error("File path cannot be empty");
      this.sendToolResult(id, { success: false, error: "File path cannot be empty" });
      return;
    }
    
    const filePath = this.resolvePath(relativePath);
    const displayPath = this.getRelativePath(filePath);
    MessageFormatter.fileOperation("read", displayPath);
    
    const result = await withSpinner(`Reading file: ${displayPath}...`, async () => {
      return await readFile(filePath);
    });
    
    if (result.success) {
      MessageFormatter.success(`File read successfully: ${displayPath}`);
    } else {
      MessageFormatter.error(`Failed to read file: ${result.error || "Unknown error"}`);
    }
    
    this.sendToolResult(id, {
      success: result.success,
      stdout: result.content || "",
      stderr: result.error || "",
    });
  }

  private async handleRunShell(id: string, args: RunShellArgs): Promise<void> {
    const { cmd, cwd } = args;
    const workingDir = cwd ? this.resolvePath(cwd) : this.workspaceDir;
    const displayCwd = this.getRelativePath(workingDir);
    
    MessageFormatter.info(`Shell command requested: ${cmd}`);
    MessageFormatter.info(`Working directory: ${displayCwd}`);
    
    const approved = await this.yesNo(`Approve running shell command: ${cmd}?`);
    if (!approved) {
      MessageFormatter.warning("Shell command cancelled by user.");
      this.sendToolResult(id, { success: false, error: "user_rejected" });
      return;
    }

    const result = await withSpinner(`Running: ${cmd}...`, async () => {
      return await runShell(cmd, workingDir);
    });
    
    if (result.success) {
      MessageFormatter.success(`Command completed successfully (exit code: ${result.code || 0})`);
      if (result.stdout) {
        console.log(chalk.dim("STDOUT:"));
        console.log(result.stdout);
      }
      if (result.stderr) {
        console.log(chalk.yellow("STDERR:"));
        console.log(result.stderr);
      }
    } else {
      MessageFormatter.error(`Command failed (exit code: ${result.code || "unknown"})`);
      if (result.stderr) {
        console.log(chalk.red("STDERR:"));
        console.log(result.stderr);
      }
    }
    
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

