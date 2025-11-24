import { WebSocketServer } from "ws";
const wss = new WebSocketServer({ port: 9000 }, () => {
  console.log("Mock ACP server listening on ws://127.0.0.1:9000");
});

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (raw) => {
    console.log("RECV:", raw.toString());
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch (e) { msg = null; }

    if (msg && msg.type === "client_message") {
      ws.send(JSON.stringify({ type: "text", content: `Echo: ${msg.content || ""}` }));

      setTimeout(() => {
        ws.send(JSON.stringify({
          type: "tool_call",
          id: "mock-write-1",
          tool: "write_file",
          args: {
            path: "workspace/hello.txt",
            content: `Hello from mock ACP (for prompt: ${msg.content || ""})\n`,
            mode: "create"
          }
        }));
      }, 500);
    }

    if (msg && msg.type === "tool_result") {
      console.log("Tool result received:", msg);
      ws.send(JSON.stringify({ type: "text", content: `Agent reported tool_result: ${msg.success ? "ok" : "fail"}` }));
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});
