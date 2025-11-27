/**
 * Simple logging utility with log levels.
 * Respects LOG_LEVEL environment variable.
 * 
 * Levels (in order): debug < info < warn < error
 * Default: 'warn' in production, 'info' in development
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

function getLogLevel(): LogLevel {
  const env = process.env.LOG_LEVEL?.toLowerCase();
  if (env && env in LOG_LEVELS) {
    return env as LogLevel;
  }
  // Default: warn in prod, info in dev
  return process.env.NODE_ENV === 'production' ? 'warn' : 'info';
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[getLogLevel()];
}

/**
 * Create a namespaced logger
 */
export function createLogger(namespace: string) {
  const prefix = `[${namespace}]`;
  
  return {
    debug: (...args: unknown[]) => {
      if (shouldLog('debug')) {
        console.debug(prefix, ...args);
      }
    },
    info: (...args: unknown[]) => {
      if (shouldLog('info')) {
        console.info(prefix, ...args);
      }
    },
    warn: (...args: unknown[]) => {
      if (shouldLog('warn')) {
        console.warn(prefix, ...args);
      }
    },
    error: (...args: unknown[]) => {
      if (shouldLog('error')) {
        console.error(prefix, ...args);
      }
    },
  };
}

// Pre-configured loggers for common modules
export const r2Logger = createLogger('r2server');
export const heroLogger = createLogger('hero-gallery');
export const dbLogger = createLogger('d1');
export const cacheLogger = createLogger('kv-cache');
