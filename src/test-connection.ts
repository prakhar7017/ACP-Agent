import { ACPClient } from "./acp";
import { CONFIG } from "./config";

const client = new ACPClient(CONFIG.ACP_URL, CONFIG.CLAUDE_API_KEY);

async function main() {
  console.log("Connecting...");

  await client.connect();
  console.log("Connected!");

  client.onMessage((msg) => console.log("Received:", msg));
  client.onError((e) => console.error("Error:", e));
  client.onClose(() => console.log("Connection closed."));

  client.send({
    type: "client_message",
    role: "user",
    content: "Hello from ACP test!",
  });
}

main();
