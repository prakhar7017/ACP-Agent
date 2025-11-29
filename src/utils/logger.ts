// src/utils/logger.ts
// Logger utility with log levels and debug control

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private level: LogLevel;
  private debugEnabled: boolean;

  constructor() {
    // Check if DEBUG environment variable is set
    this.debugEnabled = process.env.DEBUG === "1" || process.env.DEBUG === "true";
    
    // Set log level based on environment
    const logLevel = process.env.LOG_LEVEL?.toUpperCase();
    switch (logLevel) {
      case "DEBUG":
        this.level = LogLevel.DEBUG;
        break;
      case "INFO":
        this.level = LogLevel.INFO;
        break;
      case "WARN":
        this.level = LogLevel.WARN;
        break;
      case "ERROR":
        this.level = LogLevel.ERROR;
        break;
      default:
        // Default: INFO in production, DEBUG if DEBUG env var is set
        this.level = this.debugEnabled ? LogLevel.DEBUG : LogLevel.INFO;
    }
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.DEBUG && this.debugEnabled) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.INFO) {
      console.log(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }

  // Helper for debug logs that should only appear in debug mode
  debugOnly(message: string, ...args: unknown[]): void {
    if (this.debugEnabled) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  // Set log level at runtime
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  // Enable/disable debug mode
  setDebug(enabled: boolean): void {
    this.debugEnabled = enabled;
    if (enabled && this.level > LogLevel.DEBUG) {
      this.level = LogLevel.DEBUG;
    }
  }
}

// Singleton logger instance
export const logger = new Logger();

// Convenience functions
export const log = {
  debug: (message: string, ...args: unknown[]) => logger.debug(message, ...args),
  info: (message: string, ...args: unknown[]) => logger.info(message, ...args),
  warn: (message: string, ...args: unknown[]) => logger.warn(message, ...args),
  error: (message: string, ...args: unknown[]) => logger.error(message, ...args),
  debugOnly: (message: string, ...args: unknown[]) => logger.debugOnly(message, ...args),
};

