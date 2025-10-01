/**
 * Smart logging utility that automatically disables debug logs in production
 * while preserving error logs for monitoring
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  level: LogLevel;
  isDevelopment: boolean;
  enableConsole: boolean;
}

class Logger {
  private config!: LoggerConfig;

  constructor() {
    this.updateConfig();
  }

  private updateConfig() {
    this.config = {
      level: this.getLogLevel(),
      isDevelopment: process.env.NODE_ENV === 'development',
      enableConsole: this.shouldEnableConsole(),
    };
  }

  private getLogLevel(): LogLevel {
    // In production, only show errors and warnings
    if (process.env.NODE_ENV === 'production') {
      return 'warn';
    }

    // In development, show all logs
    return 'debug';
  }

  private shouldEnableConsole(): boolean {
    // Always enable console in development and test
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.NODE_ENV === 'test'
    ) {
      return true;
    }

    // In production, only enable for server-side or if explicitly enabled
    return (
      typeof window === 'undefined' ||
      process.env.ENABLE_CONSOLE_LOGS === 'true'
    );
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enableConsole) return false;

    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);

    return messageLevelIndex >= currentLevelIndex;
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    ...args: unknown[]
  ): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    if (args.length > 0) {
      return `${prefix} ${message}`;
    }

    return `${prefix} ${message}`;
  }

  debug(message: string, ...args: unknown[]): void {
    if (!this.shouldLog('debug')) return;

    console.log(this.formatMessage('debug', message), ...args);
  }

  info(message: string, ...args: unknown[]): void {
    if (!this.shouldLog('info')) return;

    console.info(this.formatMessage('info', message), ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    if (!this.shouldLog('warn')) return;

    console.warn(this.formatMessage('warn', message), ...args);
  }

  error(message: string, ...args: unknown[]): void {
    if (!this.shouldLog('error')) return;

    console.error(this.formatMessage('error', message), ...args);
  }

  // Performance-specific logging
  perf(message: string, ...args: unknown[]): void {
    if (!this.config.isDevelopment) return;

    console.log(`[PERF] ${message}`, ...args);
  }

  // API-specific logging
  api(message: string, ...args: unknown[]): void {
    if (!this.config.isDevelopment) return;

    console.log(`[API] ${message}`, ...args);
  }

  // Component-specific logging
  component(message: string, ...args: unknown[]): void {
    if (!this.config.isDevelopment) return;

    console.log(`[COMPONENT] ${message}`, ...args);
  }

  // Analytics-specific logging
  analytics(message: string, ...args: unknown[]): void {
    if (!this.config.isDevelopment) return;

    console.log(`[ANALYTICS] ${message}`, ...args);
  }
}

// Create singleton instance
const logger = new Logger();

// Export both the instance and the class for testing
export { logger, Logger };
export default logger;
