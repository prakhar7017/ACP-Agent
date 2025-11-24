import fs from "fs/promises";
import path from "path";
import { spawn } from "child_process";

export async function writeFile(pathStr: string, content: string, mode: "create" | "edit" | "patch" = "create") {
    const fullDirectory = path.dirname(pathStr);
    await fs.mkdir(fullDirectory, { recursive: true });
    await fs.writeFile(pathStr, content, "utf8");
    return {
        success: true,
        message: `File ${pathStr} created successfully`,
    };
}

export async function readFile(pathStr: string) {
    try {
      const content = await fs.readFile(pathStr, "utf8");
      return { success: true, content };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }


  export async function runShell(cmd: string, cwd?: string) {
    return new Promise<{ success: boolean; stdout: string; stderr: string; code: number | null }>((resolve) => {
      const isWindows = process.platform === "win32";
      const shell = isWindows ? "cmd.exe" : "/bin/sh";
      const args = isWindows ? ["/c", cmd] : ["-c", cmd];
      const sh = spawn(shell, args, { cwd, shell: false });
      let out = "";
      let err = "";
      sh.stdout.on("data", (d) => out += d.toString());
      sh.stderr.on("data", (d) => err += d.toString());
      sh.on("close", (code) => resolve({ success: code === 0, stdout: out, stderr: err, code }));
    });
  }