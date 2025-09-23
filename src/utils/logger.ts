/**
 * Production-safe logging utility
 * Replaces console.log with structured logging
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  correlationId?: string;
  stack?: string;
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private correlationId: string | null = null;
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 100;

  private constructor() {
    // Set log level based on environment
    this.logLevel = import.meta.env.NODE_ENV === 'production' 
      ? LogLevel.WARN 
      : LogLevel.DEBUG;
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setCorrelationId(id: string): void {
    this.correlationId = id;
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: Record<string, any>, error?: Error): void {
    const contextWithError = {
      ...context,
      ...(error && {
        errorName: error.name,
        errorMessage: error.message,
        stack: error.stack
      })
    };
    this.log(LogLevel.ERROR, message, contextWithError, error?.stack);
  }

  critical(message: string, context?: Record<string, any>, error?: Error): void {
    const contextWithError = {
      ...context,
      ...(error && {
        errorName: error.name,
        errorMessage: error.message,
        stack: error.stack
      })
    };
    this.log(LogLevel.CRITICAL, message, contextWithError, error?.stack);
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, stack?: string): void {
    if (level < this.logLevel) {
      return; // Skip logs below configured level
    }

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      correlationId: this.correlationId || undefined,
      stack
    };

    // Add to buffer
    this.logBuffer.push(logEntry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }

    // Output based on environment
    if (import.meta.env.NODE_ENV === 'development') {
      this.consoleOutput(logEntry);
    } else {
      this.productionOutput(logEntry);
    }
  }

  private consoleOutput(entry: LogEntry): void {
    const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL'];
    const levelName = levelNames[entry.level];
    
    const baseMessage = `[${entry.timestamp}] ${levelName}: ${entry.message}`;
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(baseMessage, entry.context || '');
        break;
      case LogLevel.INFO:
        console.info(baseMessage, entry.context || '');
        break;
      case LogLevel.WARN:
        console.warn(baseMessage, entry.context || '');
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(baseMessage, entry.context || '', entry.stack || '');
        break;
    }
  }

  private productionOutput(entry: LogEntry): void {
    // In production, send to monitoring service
    // For now, only critical errors go to console
    if (entry.level >= LogLevel.CRITICAL) {
      console.error(`CRITICAL: ${entry.message}`, {
        timestamp: entry.timestamp,
        correlationId: entry.correlationId,
        context: entry.context
      });
    }

    // TODO: Send to external monitoring service (Sentry, LogRocket, etc.)
    // this.sendToMonitoringService(entry);
  }

  // Get recent logs for debugging
  getRecentLogs(count = 50): LogEntry[] {
    return this.logBuffer.slice(-count);
  }

  // Clear log buffer
  clearLogs(): void {
    this.logBuffer = [];
  }

  // Performance logging
  timeStart(operation: string): void {
    this.debug(`Started: ${operation}`, { operation, action: 'start' });
  }

  timeEnd(operation: string): void {
    this.debug(`Completed: ${operation}`, { operation, action: 'end' });
  }

  // ML specific logging
  mlPrediction(
    direction: string, 
    probability: number, 
    confidence: number, 
    modelVersion?: string
  ): void {
    this.info('ML Prediction Generated', {
      direction,
      probability,
      confidence,
      modelVersion,
      component: 'ml-service'
    });
  }

  mlTraining(
    accuracy: number, 
    trainingExamples: number, 
    epochTime: number
  ): void {
    this.info('ML Model Training Completed', {
      accuracy,
      trainingExamples,
      epochTime,
      component: 'ml-training'
    });
  }

  // Trading specific logging
  candleProcessed(
    candleIndex: number, 
    sessionId: string, 
    processingTime: number
  ): void {
    this.debug('Candle Processed', {
      candleIndex,
      sessionId,
      processingTime,
      component: 'candle-processing'
    });
  }

  tradingSignal(
    signal: string, 
    strength: number, 
    indicators: Record<string, any>
  ): void {
    this.info('Trading Signal Generated', {
      signal,
      strength,
      indicators,
      component: 'trading-signals'
    });
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Utility functions
export const logDebug = (message: string, context?: Record<string, any>) => 
  logger.debug(message, context);

export const logInfo = (message: string, context?: Record<string, any>) => 
  logger.info(message, context);

export const logWarn = (message: string, context?: Record<string, any>) => 
  logger.warn(message, context);

export const logError = (message: string, context?: Record<string, any>, error?: Error) => 
  logger.error(message, context, error);

export const logCritical = (message: string, context?: Record<string, any>, error?: Error) => 
  logger.critical(message, context, error);