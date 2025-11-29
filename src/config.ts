// src/config.ts
import path from "path";
import fs from "fs/promises";
import { validateConfig, ValidationError } from "./utils/validation";
import { log } from "./utils/logger";

export interface Config {
  ACP_URL: string;
  CLAUDE_API_KEY?: string;
  MODEL: string;
  WORKSPACE_DIR: string;
  SESSIONS_DIR: string;
  CONNECT_TIMEOUT_MS: number;
}

export async function createConfig(options?: {
  model?: string;
  workspace?: string;
  url?: string;
  apiKey?: string;
}): Promise<Config> {
  const workspaceDir = options?.workspace 
    ? path.resolve(options.workspace)
    : (process.env.WORKSPACE_DIR ? path.resolve(process.env.WORKSPACE_DIR) : process.cwd());

  // Prepare configuration values
  const configValues = {
    url: options?.url || process.env.ACP_WS_URL || "ws://127.0.0.1:9000",
    apiKey: options?.apiKey || process.env.CLAUDE_API_KEY || undefined,
    model: options?.model || process.env.MODEL || "claude-3-sonnet",
    workspaceDir: workspaceDir,
    timeout: 5000,
  };

  // Validate configuration values
  try {
    validateConfig(configValues);
  } catch (error) {
    if (error instanceof ValidationError) {
      log.error(`Configuration error: ${error.message}`);
      throw error;
    }
    throw error;
  }

  // Ensure workspace directory exists
  try {
    await fs.mkdir(workspaceDir, { recursive: true });
  } catch (error) {
    // Directory might already exist or there might be permission issues
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (!errorMessage.includes("EEXIST")) {
      log.warn(`Could not create workspace directory "${workspaceDir}": ${errorMessage}`);
    }
  }

  return {
    ACP_URL: configValues.url,
    CLAUDE_API_KEY: configValues.apiKey,
    MODEL: configValues.model,
    WORKSPACE_DIR: workspaceDir,
    SESSIONS_DIR: path.resolve(process.cwd(), "sessions"),
    CONNECT_TIMEOUT_MS: configValues.timeout,
  };
}

// Synchronous version for backward compatibility (creates config but doesn't ensure workspace exists)
export function createConfigSync(options?: {
  model?: string;
  workspace?: string;
  url?: string;
  apiKey?: string;
}): Config {
  const workspaceDir = options?.workspace 
    ? path.resolve(options.workspace)
    : (process.env.WORKSPACE_DIR ? path.resolve(process.env.WORKSPACE_DIR) : process.cwd());

  return {
    ACP_URL: options?.url || process.env.ACP_WS_URL || "ws://127.0.0.1:9000",
    CLAUDE_API_KEY: options?.apiKey || process.env.CLAUDE_API_KEY || undefined,
    MODEL: options?.model || process.env.MODEL || "claude-3-sonnet",
    WORKSPACE_DIR: workspaceDir,
    SESSIONS_DIR: path.resolve(process.cwd(), "sessions"),
    CONNECT_TIMEOUT_MS: 5000,
  };
}

// Default config for backward compatibility (synchronous version)
export const CONFIG = createConfigSync();

