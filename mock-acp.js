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
      const textResponse = { type: "text", content: `Echo: ${msg.content || ""}` };
      console.log("SENDING text:", JSON.stringify(textResponse));
      ws.send(JSON.stringify(textResponse));

      setTimeout(() => {
        // Extract filename from user's message
        let filename = "hello.txt"; // default
        const content = msg.content || "";
        console.log("[Mock Server] Extracting filename from:", content);
        
        // Try to extract filename from common patterns
        // Pattern 1: "create file bubble.txt" or "create bubble.txt"
        let match = content.match(/(?:create|make|write|new)\s+(?:file\s+)?([a-zA-Z0-9_.-]+\.\w+)/i);
        if (match && match[1]) {
          filename = match[1];
          console.log("[Mock Server] Matched pattern 1, filename:", filename);
        } else {
          // Pattern 2: "file bubble.txt"
          match = content.match(/file\s+([a-zA-Z0-9_.-]+\.\w+)/i);
          if (match && match[1]) {
            filename = match[1];
            console.log("[Mock Server] Matched pattern 2, filename:", filename);
          } else {
            // Pattern 3: Just look for any filename with extension
            match = content.match(/([a-zA-Z0-9_.-]+\.\w+)/i);
            if (match && match[1]) {
              filename = match[1];
              console.log("[Mock Server] Matched pattern 3, filename:", filename);
            }
          }
        }
        
        // Ensure filename has .txt extension if no extension found
        if (!filename.includes('.')) {
          filename = filename + '.txt';
        }
        
        // Use filename directly (without workspace/ prefix)
        // The client will resolve it relative to the configured workspace
        const filePath = filename;
        console.log("[Mock Server] Final file path:", filePath);
        
        const toolCall = {
          type: "tool_call",
          id: "mock-write-1",
          tool: "write_file",
          args: {
            path: filePath,
            content: `Hello from mock ACP (for prompt: ${msg.content || ""})\n`,
            mode: "create"
          }
        };
        console.log("SENDING tool_call:", JSON.stringify(toolCall));
        ws.send(JSON.stringify(toolCall));
      }, 500);
    }

    if (msg && msg.type === "tool_result") {
      console.log("Tool result received:", msg);
      const response = { type: "text", content: `Agent reported tool_result: ${msg.success ? "ok" : "fail"}` };
      console.log("SENDING response:", JSON.stringify(response));
      ws.send(JSON.stringify(response));
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});
