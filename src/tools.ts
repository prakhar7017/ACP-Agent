// src/tools.ts
import fs from "fs/promises";
import path from "path";
import { spawn } from "child_process";

export interface WriteFileResult {
  success: true;
  message: string;
}

export interface ReadFileResult {
  success: boolean;
  content?: string;
  error?: string;
}

export interface RunShellResult {
  success: boolean;
  stdout: string;
  stderr: string;
  code: number | null;
}

export async function writeFile(
  pathStr: string,
  content: string,
  mode: "create" | "edit" | "patch" = "create"
): Promise<WriteFileResult> {
  // Normalize the path but preserve the exact filename
  const normalizedPath = path.normalize(pathStr);
  
  // Ensure directory exists (create if needed)
  const fullDirectory = path.dirname(normalizedPath);
  if (fullDirectory && fullDirectory !== "." && fullDirectory !== normalizedPath) {
    await fs.mkdir(fullDirectory, { recursive: true });
  }
  
  // Write file with the exact filename as provided (normalized for path safety)
  await fs.writeFile(normalizedPath, content, "utf8");
  
  return {
    success: true,
    message: `File ${normalizedPath} ${mode === "create" ? "created" : mode === "edit" ? "updated" : "patched"} successfully`,
  };
}

export async function readFile(pathStr: string): Promise<ReadFileResult> {
  try {
    const content = await fs.readFile(pathStr, "utf8");
    return { success: true, content };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}

export async function runShell(cmd: string, cwd?: string): Promise<RunShellResult> {
  return new Promise<RunShellResult>((resolve) => {
    const isWindows = process.platform === "win32";
    const shell = isWindows ? "cmd.exe" : "/bin/sh";
    const args = isWindows ? ["/c", cmd] : ["-c", cmd];
    const sh = spawn(shell, args, { cwd, shell: false });
    let out = "";
    let err = "";
    
    sh.stdout.on("data", (d) => {
      out += d.toString();
    });
    
    sh.stderr.on("data", (d) => {
      err += d.toString();
    });
    
    sh.on("close", (code) => {
      resolve({ success: code === 0, stdout: out, stderr: err, code });
    });
    
    sh.on("error", (error) => {
      resolve({
        success: false,
        stdout: out,
        stderr: err + (error.message || String(error)),
        code: null,
      });
    });
  });
}