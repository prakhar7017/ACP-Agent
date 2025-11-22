import { ACPClient } from "./acp";

const client = new ACPClient(
  process.env.ACP_WS_URL || "wss://example.com/acp",
  process.env.CLAUDE_API_KEY
);

async function main() {
  console.log("Connecting...");

  await client.connect();
  console.log("Connected!");

  client.onMessage((msg) => console.log("Received:", msg));
  client.onError((e) => console.error("Error:", e));
  client.onClose(() => console.log("Connection closed."));

  // Test sending ping message
  client.send({
    type: "client_message",
    role: "user",
    content: "Hello from ACP test!",
  });
}

main();
