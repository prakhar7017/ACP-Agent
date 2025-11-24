// src/config.ts
import path from "path";

export const CONFIG = {
  ACP_URL: process.env.ACP_WS_URL || "ws://127.0.0.1:9000",
  CLAUDE_API_KEY: process.env.CLAUDE_API_KEY,
  SESSIONS_DIR: path.resolve(process.cwd(), "sessions"),
  CONNECT_TIMEOUT_MS: 5000,
} as const;

