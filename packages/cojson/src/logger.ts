export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

export interface LogSystem {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

// Default console-based logging system
export class ConsoleLogSystem implements LogSystem {
  debug(message: string, ...args: any[]) {
    console.debug(message, ...args);
  }
  info(message: string, ...args: any[]) {
    console.info(message, ...args);
  }
  warn(message: string, ...args: any[]) {
    console.warn(message, ...args);
  }
  error(message: string, ...args: any[]) {
    console.error(message, ...args);
  }
}

export class Logger {
  private level: LogLevel;
  private logSystem: LogSystem;

  constructor(
    level: LogLevel = LogLevel.INFO,
    logSystem: LogSystem = new ConsoleLogSystem(),
  ) {
    this.level = level;
    this.logSystem = logSystem;
  }

  setLevel(level: LogLevel) {
    this.level = level;
  }

  setLogSystem(logSystem: LogSystem) {
    this.logSystem = logSystem;
  }

  debug(message: string, ...args: any[]) {
    if (this.level <= LogLevel.DEBUG) {
      this.logSystem.debug(message, ...args);
    }
  }

  info(message: string, ...args: any[]) {
    if (this.level <= LogLevel.INFO) {
      this.logSystem.info(message, ...args);
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.level <= LogLevel.WARN) {
      this.logSystem.warn(message, ...args);
    }
  }

  error(message: string, ...args: any[]) {
    if (this.level <= LogLevel.ERROR) {
      this.logSystem.error(message, ...args);
    }
  }
}

// Create default logger instance
export const logger = new Logger();
