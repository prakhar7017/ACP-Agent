import fs from "fs/promises";
import path from "path";
import type { SessionData } from "./types";
import type { Config } from "./config";

export interface SessionMetadata {
  model?: string;
  workspace?: string;
  createdAt?: number;
  lastUpdated?: number;
}

export interface SessionDataWithMetadata extends SessionData {
  metadata?: SessionMetadata;
}

export async function saveUserSession(
  name: string,
  data: SessionData,
  metadata?: SessionMetadata
): Promise<string> {
  const sessionsDir = path.resolve(process.cwd(), "sessions");
  
  try {
    await fs.mkdir(sessionsDir, { recursive: true });
  } catch (error) {

    if (error instanceof Error && !error.message.includes("EEXIST")) {
      throw error;
    }
  }
  
  const file = path.join(sessionsDir, `${name}.json`);
  const dataWithMetadata: SessionDataWithMetadata = {
    ...data,
    metadata: {
      ...metadata,
      lastUpdated: Date.now(),
    },
  };
  
  await fs.writeFile(file, JSON.stringify(dataWithMetadata, null, 2), "utf8");
  return file;
}

export async function loadSession(name: string): Promise<SessionDataWithMetadata | null> {
  try {
    const sessionsDir = path.resolve(process.cwd(), "sessions");
    const file = path.join(sessionsDir, `${name}.json`);
    
    const content = await fs.readFile(file, "utf8");
    const data = JSON.parse(content) as SessionDataWithMetadata;
    return data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load session "${name}": ${errorMessage}`);
  }
}

export async function listSessions(): Promise<Array<{ name: string; path: string; metadata?: SessionMetadata }>> {
  try {
    const sessionsDir = path.resolve(process.cwd(), "sessions");

    try {
      await fs.access(sessionsDir);
    } catch {

      return [];
    }
    
    const files = await fs.readdir(sessionsDir);
    const sessions: Array<{ name: string; path: string; metadata?: SessionMetadata }> = [];
    
    for (const file of files) {
      if (!file.endsWith(".json")) {
        continue;
      }
      
      const sessionName = file.replace(/\.json$/, "");
      const filePath = path.join(sessionsDir, file);
      
      try {

        const content = await fs.readFile(filePath, "utf8");
        const data = JSON.parse(content) as SessionDataWithMetadata;
        
        sessions.push({
          name: sessionName,
          path: filePath,
          metadata: data.metadata,
        });
      } catch {

        sessions.push({
          name: sessionName,
          path: filePath,
        });
      }
    }

    sessions.sort((a, b) => {
      const aTime = a.metadata?.lastUpdated || a.metadata?.createdAt || 0;
      const bTime = b.metadata?.lastUpdated || b.metadata?.createdAt || 0;
      return bTime - aTime;
    });
    
    return sessions;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to list sessions: ${errorMessage}`);
  }
}

export async function getSessionInfo(name: string): Promise<SessionDataWithMetadata | null> {
  try {
    return await loadSession(name);
  } catch {
    return null;
  }
}
