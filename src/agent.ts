// src/agent.ts
import "dotenv/config";
import { ACPClient } from "./acp";
import type { ACPMessage } from "./acp";
import { writeFile, readFile, runShell } from "./tools";
import { showWritePreview, yesNo } from "./ui";
import { saveUserSessiontoSessions } from "./session";
import fs from "fs/promises";
import path from "path";
import readline from "readline";

const ACP_URL = process.env.ACP_WS_URL || "ws://127.0.0.1:9000";

async function prompt(question: string) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise<string>((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
}

async function handleToolCall(client: ACPClient, call: ACPMessage) {
  const { tool, args, id } = call;
  console.log("\n[Tool call]", tool, id);
  if (tool === "write_file") {
    const pathArg = args.path;
    const content = args.content;
    let old: string | null = null;
    try { old = await fs.readFile(pathArg, "utf8"); } catch { old = null; }
    showWritePreview(old, content);
    const ok = yesNo(`Approve writing ${pathArg}?`);
    if (!ok) {
      client.send({ type: "tool_result", tool_call_id: id, success: false, error: "user_rejected" });
      return;
    }
    const res = await writeFile(pathArg, content, args.mode);
    client.send({ type: "tool_result", tool_call_id: id, success: true, stdout: res.message });
  } else if (tool === "read_file") {
    const pathArg = args.path;
    const res = await readFile(pathArg);
    client.send({ type: "tool_result", tool_call_id: id, success: res.success, stdout: res.content || "", stderr: res.error || "" });
  } else if (tool === "run_shell") {
    console.log("Model requests running shell:", args.cmd);
    const ok = yesNo(`Approve running shell command: ${args.cmd}?`);
    if (!ok) {
      client.send({ type: "tool_result", tool_call_id: id, success: false, error: "user_rejected" });
      return;
    }
    const cwd = args.cwd || process.cwd();
    const res = await runShell(args.cmd, cwd);
    client.send({ type: "tool_result", tool_call_id: id, success: res.success, stdout: res.stdout, stderr: res.stderr, code: res.code });
  } else {
    client.send({ type: "tool_result", tool_call_id: id, success: false, error: "unknown_tool" });
  }
}

async function main() {
  console.log("Agent starting. Connecting to", ACP_URL);
  const client = new ACPClient(ACP_URL);

  await client.connect();
  console.log("Connected to mock ACP.");

  // session log
  const session: any[] = [];
  client.onMessage(async (msg) => {
    session.push({ incoming: msg, ts: Date.now() });
    if (msg.type === "text") {
      console.log("\n[Model]", msg.content);
    } else if (msg.type === "tool_call") {
      await handleToolCall(client, msg);
    } else {
      console.log("\n[MSG]", msg);
    }
  });

  // simple CLI loop
  while (true) {
    const input = (await prompt("\n> ")).trim();
    if (!input) continue;
    if (input === "exit" || input === "quit") break;

    const message = { type: "client_message", role: "user", content: input };
    session.push({ outgoing: message, ts: Date.now() });
    client.send(message);
  }

  // save session
  const sessFile = await saveUserSessiontoSessions(`session-${Date.now()}`, { messages: session });
  console.log("Session saved to", sessFile);
  client.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("Agent error:", err);
  process.exit(1);
});
