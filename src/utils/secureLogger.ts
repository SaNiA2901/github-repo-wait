/**
 * SECURITY-FIRST Logger System
 * Prevents sensitive data leakage in production
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  context?: Record<string, any>;
  source?: string;
}

class SecureLogger {
  private isProduction = import.meta.env.PROD;
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 100;
  
  // Sensitive data patterns to sanitize
  private sensitivePatterns = [
    /bearer\s+[a-zA-Z0-9._-]+/gi,
    /api[_-]?key['":\s]*[a-zA-Z0-9._-]+/gi,
    /password['":\s]*[^"'\s,}]+/gi,
    /token['":\s]*[a-zA-Z0-9._-]+/gi,
    /secret['":\s]*[a-zA-Z0-9._-]+/gi,
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi, // emails
    /\b\d{16,19}\b/g, // credit card numbers
  ];

  private sanitizeData(data: any): any {
    if (typeof data === 'string') {
      let sanitized = data;
      this.sensitivePatterns.forEach(pattern => {
        sanitized = sanitized.replace(pattern, '[REDACTED]');
      });
      return sanitized;
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized: Record<string, any> = {};
      Object.keys(data).forEach(key => {
        // Sanitize sensitive keys
        if (/password|secret|token|key|auth/i.test(key)) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = this.sanitizeData(data[key]);
        }
      });
      return sanitized;
    }
    
    return data;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    source?: string
  ): LogEntry {
    return {
      level,
      message: this.sanitizeData(message),
      timestamp: Date.now(),
      context: context ? this.sanitizeData(context) : undefined,
      source
    };
  }

  private logToConsole(entry: LogEntry) {
    if (this.isProduction && entry.level === 'debug') {
      return; // Never log debug in production
    }

    const timestamp = new Date(entry.timestamp).toISOString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}]${entry.source ? ` [${entry.source}]` : ''}`;
    
    switch (entry.level) {
      case 'error':
        console.error(prefix, entry.message, entry.context);
        break;
      case 'warn':
        console.warn(prefix, entry.message, entry.context);
        break;
      case 'info':
        console.info(prefix, entry.message, entry.context);
        break;
      case 'debug':
        console.debug(prefix, entry.message, entry.context);
        break;
    }
  }

  private addToBuffer(entry: LogEntry) {
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }
  }

  debug(message: string, context?: Record<string, any>, source?: string) {
    const entry = this.createLogEntry('debug', message, context, source);
    this.logToConsole(entry);
    this.addToBuffer(entry);
  }

  info(message: string, context?: Record<string, any>, source?: string) {
    const entry = this.createLogEntry('info', message, context, source);
    this.logToConsole(entry);
    this.addToBuffer(entry);
  }

  warn(message: string, context?: Record<string, any>, source?: string) {
    const entry = this.createLogEntry('warn', message, context, source);
    this.logToConsole(entry);
    this.addToBuffer(entry);
  }

  error(message: string, context?: Record<string, any>, source?: string) {
    const entry = this.createLogEntry('error', message, context, source);
    this.logToConsole(entry);
    this.addToBuffer(entry);
  }

  // Get sanitized logs for debugging
  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logBuffer.filter(entry => entry.level === level);
    }
    return [...this.logBuffer];
  }

  // Clear log buffer
  clearLogs() {
    this.logBuffer = [];
  }

  // Performance timing
  time(label: string) {
    if (!this.isProduction) {
      console.time(label);
    }
  }

  timeEnd(label: string) {
    if (!this.isProduction) {
      console.timeEnd(label);
    }
  }
}

// Export singleton instance
export const secureLogger = new SecureLogger();

// Legacy console replacement for easy migration
export const logger = {
  debug: (message: string, ...args: any[]) => secureLogger.debug(message, { args }),
  log: (message: string, ...args: any[]) => secureLogger.info(message, { args }),
  info: (message: string, ...args: any[]) => secureLogger.info(message, { args }),
  warn: (message: string, ...args: any[]) => secureLogger.warn(message, { args }),
  error: (message: string, ...args: any[]) => secureLogger.error(message, { args }),
  time: (label: string) => secureLogger.time(label),
  timeEnd: (label: string) => secureLogger.timeEnd(label),
};