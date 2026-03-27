type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: any;
  context?: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private minLevel: LogLevel = __DEV__ ? 'debug' : 'warn';
  private logs: LogEntry[] = [];
  private maxLogs = 100;

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel];
  }

  private formatMessage(level: LogLevel, context: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] [${context}] ${message}`;
  }

  private addToHistory(entry: LogEntry) {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  debug(context: string, message: string, data?: any) {
    if (!this.shouldLog('debug')) return;
    
    const entry: LogEntry = {
      level: 'debug',
      message,
      timestamp: new Date().toISOString(),
      data,
      context,
    };
    
    this.addToHistory(entry);
    console.log(this.formatMessage('debug', context, message), data ?? '');
  }

  info(context: string, message: string, data?: any) {
    if (!this.shouldLog('info')) return;
    
    const entry: LogEntry = {
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      data,
      context,
    };
    
    this.addToHistory(entry);
    console.log(this.formatMessage('info', context, message), data ?? '');
  }

  warn(context: string, message: string, data?: any) {
    if (!this.shouldLog('warn')) return;
    
    const entry: LogEntry = {
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      data,
      context,
    };
    
    this.addToHistory(entry);
    console.warn(this.formatMessage('warn', context, message), data ?? '');
  }

  error(context: string, message: string, error?: Error | any) {
    const entry: LogEntry = {
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      data: error instanceof Error ? { 
        name: error.name, 
        message: error.message, 
        stack: error.stack 
      } : error,
      context,
    };
    
    this.addToHistory(entry);
    console.error(this.formatMessage('error', context, message), error ?? '');
  }

  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  getErrorLogs(): LogEntry[] {
    return this.logs.filter(log => log.level === 'error');
  }

  clearLogs() {
    this.logs = [];
  }

  setMinLevel(level: LogLevel) {
    this.minLevel = level;
  }
}

export const logger = new Logger();

export const createContextLogger = (context: string) => ({
  debug: (message: string, data?: any) => logger.debug(context, message, data),
  info: (message: string, data?: any) => logger.info(context, message, data),
  warn: (message: string, data?: any) => logger.warn(context, message, data),
  error: (message: string, error?: Error | any) => logger.error(context, message, error),
});
