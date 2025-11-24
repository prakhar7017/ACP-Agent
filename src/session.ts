// src/session.ts
import fs from "fs/promises";
import path from "path";
import type { SessionData } from "./types";
import { CONFIG } from "./config";

export async function saveUserSession(name: string, data: SessionData): Promise<string> {
  try {
    await fs.mkdir(CONFIG.SESSIONS_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist, ignore error
    if (error instanceof Error && !error.message.includes("EEXIST")) {
      throw error;
    }
  }
  
  const file = path.join(CONFIG.SESSIONS_DIR, `${name}.json`);
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
  return file;
}
