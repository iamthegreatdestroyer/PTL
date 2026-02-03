/**
 * Logger Utilities
 *
 * Lightweight logging utilities for PTL packages.
 */

import type { Logger, LogLevel } from '../types.js';

/**
 * Log level priority (lower = more verbose)
 */
const LOG_LEVELS: Record<LogLevel, number> = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  silent: 5,
};

/**
 * Console colors for each log level
 */
const LOG_COLORS: Record<Exclude<LogLevel, 'silent'>, string> = {
  trace: '\x1b[90m',  // Gray
  debug: '\x1b[36m',  // Cyan
  info: '\x1b[32m',   // Green
  warn: '\x1b[33m',   // Yellow
  error: '\x1b[31m',  // Red
};

const RESET = '\x1b[0m';

/**
 * Create a logger with a given prefix and minimum level
 *
 * @param prefix - Logger prefix (typically package name)
 * @param minLevel - Minimum log level to output
 * @returns Logger instance
 */
export function createLogger(prefix: string, minLevel: LogLevel = 'info'): Logger {
  const minPriority = LOG_LEVELS[minLevel];

  const log = (level: Exclude<LogLevel, 'silent'>, message: string, ...args: unknown[]) => {
    if (LOG_LEVELS[level] < minPriority) return;

    const timestamp = new Date().toISOString().slice(11, 23);
    const color = LOG_COLORS[level];
    const levelStr = level.toUpperCase().padEnd(5);

    // Format: [HH:mm:ss.SSS] LEVEL [prefix] message
    const formatted = `${color}[${timestamp}] ${levelStr}${RESET} [${prefix}] ${message}`;

    if (level === 'error') {
      console.error(formatted, ...args);
    } else if (level === 'warn') {
      console.warn(formatted, ...args);
    } else {
      console.log(formatted, ...args);
    }
  };

  return {
    trace: (message, ...args) => log('trace', message, ...args),
    debug: (message, ...args) => log('debug', message, ...args),
    info: (message, ...args) => log('info', message, ...args),
    warn: (message, ...args) => log('warn', message, ...args),
    error: (message, ...args) => log('error', message, ...args),
  };
}

/**
 * No-op logger for silent mode
 */
export const noopLogger: Logger = {
  trace: () => {},
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

/**
 * Get log level from environment
 *
 * Checks PTL_LOG_LEVEL, LOG_LEVEL, and DEBUG environment variables.
 *
 * @param defaultLevel - Default level if not set
 * @returns Log level
 */
export function getLogLevelFromEnv(defaultLevel: LogLevel = 'info'): LogLevel {
  const env = typeof process !== 'undefined' ? process.env : {};

  const level = env.PTL_LOG_LEVEL ?? env.LOG_LEVEL;
  if (level && level in LOG_LEVELS) {
    return level as LogLevel;
  }

  // DEBUG=* means debug level
  if (env.DEBUG) {
    return 'debug';
  }

  return defaultLevel;
}

/**
 * Parse log level string
 *
 * @param level - Log level string
 * @returns Valid log level or undefined
 */
export function parseLogLevel(level: string): LogLevel | undefined {
  const normalized = level.toLowerCase().trim();
  if (normalized in LOG_LEVELS) {
    return normalized as LogLevel;
  }
  return undefined;
}
