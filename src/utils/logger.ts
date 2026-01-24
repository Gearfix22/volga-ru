type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private logs: LogEntry[] = [];

  private log(level: LogLevel, message: string, data?: any) {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
    };

    // Store logs for debugging
    this.logs.push(entry);
    
    // Keep only last 100 logs
    if (this.logs.length > 100) {
      this.logs.shift();
    }

    // Only log to console in development
    if (this.isDevelopment) {
      const style = this.getLogStyle(level);
      console.log(`%c[${level.toUpperCase()}] ${message}`, style, data || '');
    }

    // In production, critical errors are logged to console.error for APK/WebView debugging
    // External error tracking can be integrated here if needed (e.g., Sentry, LogRocket)
    if (!this.isDevelopment && level === 'error') {
      console.error(`[PROD ERROR] ${message}`, data || '');
    }
  }

  private getLogStyle(level: LogLevel): string {
    const styles = {
      info: 'color: #2196F3;',
      warn: 'color: #FF9800;',
      error: 'color: #F44336; font-weight: bold;',
      debug: 'color: #4CAF50;',
    };
    return styles[level];
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  error(message: string, data?: any) {
    this.log('error', message, data);
  }

  debug(message: string, data?: any) {
    this.log('debug', message, data);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }
}

export const logger = new Logger();
