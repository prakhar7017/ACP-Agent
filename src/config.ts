import path from "path";
import fs from "fs/promises";
import { validateConfig, ValidationError } from "./utils/validation";
import { log } from "./utils/logger";

export interface Config {
  ACP_URL: string;
  CLAUDE_API_KEY?: string;
  MODEL?: string;
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

  const url = options?.url || process.env.ACP_WS_URL || "ws://127.0.0.1:9000";
  const isLocalhost = url.includes("127.0.0.1") || url.includes("localhost");
  
  // If connecting to localhost (mock server) and no model explicitly provided,
  // don't use the env var - allow running without a model
  const model = options?.model !== undefined 
    ? options.model 
    : (isLocalhost ? undefined : (process.env.MODEL || undefined));

  const configValues = {
    url: url,
    apiKey: options?.apiKey || process.env.CLAUDE_API_KEY || undefined,
    model: model,
    workspaceDir: workspaceDir,
    timeout: 5000,
  };

  try {
    validateConfig(configValues);
  } catch (error) {
    if (error instanceof ValidationError) {
      log.error(`Configuration error: ${error.message}`);
      throw error;
    }
    throw error;
  }

  try {
    await fs.mkdir(workspaceDir, { recursive: true });
  } catch (error) {

    const errorMessage = error instanceof Error ? error.message : String(error);
    if (!errorMessage.includes("EEXIST")) {
      log.warn(`Could not create workspace directory "${workspaceDir}": ${errorMessage}`);
    }
  }

  return {
    ACP_URL: configValues.url,
    CLAUDE_API_KEY: configValues.apiKey,
    MODEL: configValues.model || undefined,
    WORKSPACE_DIR: workspaceDir,
    SESSIONS_DIR: path.resolve(process.cwd(), "sessions"),
    CONNECT_TIMEOUT_MS: configValues.timeout,
  };
}

export function createConfigSync(options?: {
  model?: string;
  workspace?: string;
  url?: string;
  apiKey?: string;
}): Config {
  const workspaceDir = options?.workspace 
    ? path.resolve(options.workspace)
    : (process.env.WORKSPACE_DIR ? path.resolve(process.env.WORKSPACE_DIR) : process.cwd());

  const url = options?.url || process.env.ACP_WS_URL || "ws://127.0.0.1:9000";
  const isLocalhost = url.includes("127.0.0.1") || url.includes("localhost");
  
  // If connecting to localhost (mock server) and no model explicitly provided,
  // don't use the env var - allow running without a model
  const model = options?.model !== undefined 
    ? options.model 
    : (isLocalhost ? undefined : (process.env.MODEL || undefined));

  return {
    ACP_URL: url,
    CLAUDE_API_KEY: options?.apiKey || process.env.CLAUDE_API_KEY || undefined,
    MODEL: model,
    WORKSPACE_DIR: workspaceDir,
    SESSIONS_DIR: path.resolve(process.cwd(), "sessions"),
    CONNECT_TIMEOUT_MS: 5000,
  };
}

export const CONFIG = createConfigSync();

