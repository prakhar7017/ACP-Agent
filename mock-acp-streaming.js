import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 9000 }, () => {
  console.log("Mock ACP server with streaming support listening on ws://127.0.0.1:9000");
  console.log("Note: This version sends streaming messages");
});

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (raw) => {
    console.log("RECV:", raw.toString());
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch (e) { msg = null; }

    if (msg && msg.type === "client_message") {
      const streamId = `stream-${Date.now()}`;
      const content = `Echo: ${msg.content || ""}`;

      const chunks = content.split(" ");
      let accumulated = "";
      
      chunks.forEach((chunk, index) => {
        setTimeout(() => {
          accumulated += (index > 0 ? " " : "") + chunk;
          const isLast = index === chunks.length - 1;
          
          const streamMsg = {
            type: "stream",
            stream_type: "text",
            stream_id: streamId,
            delta: (index > 0 ? " " : "") + chunk,
            done: isLast
          };
          
          console.log(`SENDING stream chunk ${index + 1}/${chunks.length}:`, JSON.stringify(streamMsg));
          ws.send(JSON.stringify(streamMsg));
        }, index * 100);
      });

      // Only send tool_call if user explicitly mentions creating/writing a file
      const hasFileCreationIntent = /(?:create|make|write|new)\s+(?:a\s+)?(?:file|files)/i.test(msg.content || "");
      
      if (hasFileCreationIntent) {
        setTimeout(() => {
          let filename = "hello.txt";
          const userContent = msg.content || "";

          // Pattern 1: "create file filename.ext" or "make a file filename.ext"
          let match = userContent.match(/(?:create|make|write|new)\s+(?:a\s+)?(?:file\s+)?([a-zA-Z0-9_.-]+\.\w+)/i);
          if (match && match[1]) {
            filename = match[1];
          } else {
            // Pattern 2: "file filename.ext"
            match = userContent.match(/file\s+([a-zA-Z0-9_.-]+\.\w+)/i);
            if (match && match[1]) {
              filename = match[1];
            } else {
              // Pattern 3: "create filename.ext" (without "file" keyword)
              match = userContent.match(/(?:create|make|write|new)\s+([a-zA-Z0-9_.-]+\.\w+)/i);
              if (match && match[1]) {
                filename = match[1];
              }
            }
          }
          
          if (!filename.includes('.')) {
            filename = filename + '.txt';
          }
          
          const toolCall = {
            type: "tool_call",
            id: "mock-write-1",
            tool: "write_file",
            args: {
              path: filename,
              content: `Hello from streaming mock ACP (for prompt: ${userContent})\n`,
              mode: "create"
            }
          };
          console.log("SENDING tool_call:", JSON.stringify(toolCall));
          ws.send(JSON.stringify(toolCall));
        }, chunks.length * 100 + 200);
      }
    }

    if (msg && msg.type === "tool_result") {
      console.log("Tool result received:", msg);

      const responseText = `Agent reported tool_result: ${msg.success ? "ok" : "fail"}`;
      const streamId = `stream-${Date.now()}`;
      const chars = responseText.split("");
      
      chars.forEach((char, index) => {
        setTimeout(() => {
          const isLast = index === chars.length - 1;
          const streamMsg = {
            type: "text_delta",
            stream_id: streamId,
            delta: char,
            done: isLast
          };
          ws.send(JSON.stringify(streamMsg));
        }, index * 20);
      });
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

