// src/utils/validation.ts
// Configuration value validation utilities

export class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Validate WebSocket URL
 */
export function validateWebSocketURL(url: string): void {
  if (!url || typeof url !== "string") {
    throw new ValidationError("URL must be a non-empty string", "url");
  }

  try {
    const urlObj = new URL(url);
    if (urlObj.protocol !== "ws:" && urlObj.protocol !== "wss:") {
      throw new ValidationError(
        `URL protocol must be 'ws://' or 'wss://', got '${urlObj.protocol}'`,
        "url"
      );
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError(`Invalid URL format: ${url}`, "url");
  }
}

/**
 * Validate file/directory path
 */
export function validatePath(pathStr: string, field: string = "path"): void {
  if (!pathStr || typeof pathStr !== "string") {
    throw new ValidationError(`${field} must be a non-empty string`, field);
  }

  // Basic validation - path should not be empty after trim
  const trimmed = pathStr.trim();
  if (trimmed.length === 0) {
    throw new ValidationError(`${field} cannot be empty or whitespace only`, field);
  }

  // Check for invalid characters (basic check)
  // Note: This is OS-dependent, but we check for common issues
  const invalidChars = /[<>:"|?*\x00-\x1f]/;
  if (invalidChars.test(trimmed) && process.platform === "win32") {
    throw new ValidationError(
      `${field} contains invalid characters for Windows: ${trimmed}`,
      field
    );
  }
}

/**
 * Validate model name
 */
export function validateModel(model: string): void {
  if (!model || typeof model !== "string") {
    throw new ValidationError("Model must be a non-empty string", "model");
  }

  const trimmed = model.trim();
  if (trimmed.length === 0) {
    throw new ValidationError("Model name cannot be empty or whitespace only", "model");
  }

  // Allow common model name patterns
  // Examples: claude-3-opus, claude-3-sonnet, claude-3-haiku, claude-3-5-sonnet
  const modelPattern = /^[a-zA-Z0-9._-]+$/;
  if (!modelPattern.test(trimmed)) {
    throw new ValidationError(
      `Invalid model name format: ${trimmed}. Model names should contain only alphanumeric characters, dots, dashes, and underscores.`,
      "model"
    );
  }
}

/**
 * Validate API key (basic format check)
 */
export function validateAPIKey(apiKey: string | undefined): void {
  if (apiKey === undefined || apiKey === null) {
    return; // API key is optional
  }

  if (typeof apiKey !== "string") {
    throw new ValidationError("API key must be a string if provided", "apiKey");
  }

  const trimmed = apiKey.trim();
  if (trimmed.length === 0) {
    throw new ValidationError("API key cannot be empty or whitespace only", "apiKey");
  }

  // Basic length check (API keys are typically at least 20 characters)
  if (trimmed.length < 10) {
    throw new ValidationError("API key appears to be too short", "apiKey");
  }
}

/**
 * Validate timeout value
 */
export function validateTimeout(timeoutMs: number): void {
  if (typeof timeoutMs !== "number" || isNaN(timeoutMs)) {
    throw new ValidationError("Timeout must be a valid number", "timeout");
  }

  if (timeoutMs < 0) {
    throw new ValidationError("Timeout must be non-negative", "timeout");
  }

  if (timeoutMs > 60000) {
    throw new ValidationError("Timeout should not exceed 60 seconds (60000ms)", "timeout");
  }
}

/**
 * Validate all configuration values
 */
export interface ConfigValidationOptions {
  url?: string;
  apiKey?: string;
  model?: string;
  workspaceDir?: string;
  timeout?: number;
}

export function validateConfig(options: ConfigValidationOptions): void {
  const errors: ValidationError[] = [];

  if (options.url !== undefined) {
    try {
      validateWebSocketURL(options.url);
    } catch (error) {
      if (error instanceof ValidationError) {
        errors.push(error);
      }
    }
  }

  if (options.apiKey !== undefined) {
    try {
      validateAPIKey(options.apiKey);
    } catch (error) {
      if (error instanceof ValidationError) {
        errors.push(error);
      }
    }
  }

  if (options.model !== undefined) {
    try {
      validateModel(options.model);
    } catch (error) {
      if (error instanceof ValidationError) {
        errors.push(error);
      }
    }
  }

  if (options.workspaceDir !== undefined) {
    try {
      validatePath(options.workspaceDir, "workspace");
    } catch (error) {
      if (error instanceof ValidationError) {
        errors.push(error);
      }
    }
  }

  if (options.timeout !== undefined) {
    try {
      validateTimeout(options.timeout);
    } catch (error) {
      if (error instanceof ValidationError) {
        errors.push(error);
      }
    }
  }

  if (errors.length > 0) {
    const errorMessages = errors.map((e) => `  - ${e.field}: ${e.message}`).join("\n");
    throw new ValidationError(
      `Configuration validation failed:\n${errorMessages}`,
      "config"
    );
  }
}

