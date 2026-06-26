import type { LoggerConfig } from "../core/types.js";

/**
 * Tiny console logger used by the database runtime.
 *
 * @example
 * ```ts
 * const logger = new Logger({ enabled: true, colors: true });
 * logger.info("Connected");
 * ```
 */
export class Logger {
  private enabled: boolean;
  private colors: boolean;

  /**
   * Creates a logger with optional colors and enabled flag.
   */
  constructor(config?: LoggerConfig) {
    this.enabled = config?.enabled ?? false;
    this.colors = config?.colors ?? false;
  }

  private formatMessage(
    level: "info" | "warn" | "error" | "debug",
    message: string,
  ): string {
    const timestamp = new Date().toISOString();
    const levelUpper = level.toUpperCase();

    if (!this.colors) {
      return `[${timestamp}] [${levelUpper}] ${message}`;
    }

    const colors: Record<string, string> = {
      info: "\x1b[36m",
      warn: "\x1b[33m",
      error: "\x1b[31m",
      debug: "\x1b[35m",
    };

    const reset = "\x1b[0m";
    const color = colors[level] || "";

    return `[${timestamp}] ${color}[${levelUpper}]${reset} ${message}`;
  }

  /**
   * Writes an info message when logging is enabled.
   */
  info(message: string): void {
    if (this.enabled) {
      console.log(this.formatMessage("info", message));
    }
  }

  /**
   * Writes a warning message when logging is enabled.
   */
  warn(message: string): void {
    if (this.enabled) {
      console.warn(this.formatMessage("warn", message));
    }
  }

  /**
   * Writes an error message when logging is enabled.
   */
  error(message: string): void {
    if (this.enabled) {
      console.error(this.formatMessage("error", message));
    }
  }

  /**
   * Writes a debug message when logging is enabled.
   */
  debug(message: string): void {
    if (this.enabled) {
      console.log(this.formatMessage("debug", message));
    }
  }
}
