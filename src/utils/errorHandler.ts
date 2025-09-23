/**
 * Centralized error handling system
 * Provides comprehensive error management for the trading platform
 */

import { logger } from './logger';

export enum ErrorCategory {
  VALIDATION = 'validation',
  NETWORK = 'network',
  ML_PREDICTION = 'ml_prediction',
  DATA_PROCESSING = 'data_processing',
  USER_INPUT = 'user_input',
  AUTHENTICATION = 'authentication',
  BUSINESS_LOGIC = 'business_logic',
  SYSTEM = 'system'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface TradingError {
  id: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  timestamp: Date;
  context: Record<string, any>;
  stack?: string;
  correlationId?: string;
  retryable: boolean;
  errorCode: string;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorHistory: TradingError[] = [];
  private maxHistorySize = 200;
  private errorCounts: Map<string, number> = new Map();

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle error with comprehensive logging and categorization
   */
  handleError(
    error: Error | string,
    category: ErrorCategory,
    context: Record<string, any> = {},
    userMessage?: string
  ): TradingError {
    const errorId = this.generateErrorId();
    const timestamp = new Date();
    
    let message: string;
    let stack: string | undefined;
    
    if (error instanceof Error) {
      message = error.message;
      stack = error.stack;
    } else {
      message = error;
    }

    const severity = this.determineSeverity(category, message);
    const errorCode = this.generateErrorCode(category, message);
    
    const tradingError: TradingError = {
      id: errorId,
      category,
      severity,
      message,
      userMessage: userMessage || this.generateUserMessage(category, message),
      timestamp,
      context,
      stack,
      correlationId: context.correlationId,
      retryable: this.isRetryable(category, message),
      errorCode
    };

    // Track error frequency
    this.trackErrorFrequency(errorCode);

    // Log error
    this.logError(tradingError);

    // Store in history
    this.addToHistory(tradingError);

    // Handle critical errors
    if (severity === ErrorSeverity.CRITICAL) {
      this.handleCriticalError(tradingError);
    }

    return tradingError;
  }

  /**
   * Safe execution wrapper with error handling
   */
  async safeExecute<T>(
    operation: () => Promise<T> | T,
    category: ErrorCategory,
    context: Record<string, any> = {},
    fallback?: T
  ): Promise<T | null> {
    try {
      const result = await operation();
      return result;
    } catch (error) {
      const tradingError = this.handleError(error as Error, category, context);
      
      if (tradingError.retryable && this.shouldRetry(tradingError.errorCode)) {
        logger.info('Retrying operation after error', { 
          errorId: tradingError.id,
          operation: context.operation || 'unknown'
        });
        
        try {
          const retryResult = await operation();
          return retryResult;
        } catch (retryError) {
          this.handleError(retryError as Error, category, {
            ...context,
            isRetry: true,
            originalErrorId: tradingError.id
          });
        }
      }

      return fallback ?? null;
    }
  }

  /**
   * Validate and sanitize user input with error handling
   */
  validateInput<T>(
    input: any,
    validator: (input: any) => T,
    fieldName: string
  ): T {
    try {
      return validator(input);
    } catch (error) {
      throw this.handleError(
        error as Error,
        ErrorCategory.VALIDATION,
        { fieldName, input },
        `Invalid value for ${fieldName}`
      );
    }
  }

  /**
   * Get error statistics for monitoring
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByCategory: Record<ErrorCategory, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    topErrors: Array<{ code: string; count: number }>;
    recentErrors: TradingError[];
  } {
    const errorsByCategory = {} as Record<ErrorCategory, number>;
    const errorsBySeverity = {} as Record<ErrorSeverity, number>;

    Object.values(ErrorCategory).forEach(cat => errorsByCategory[cat] = 0);
    Object.values(ErrorSeverity).forEach(sev => errorsBySeverity[sev] = 0);

    this.errorHistory.forEach(error => {
      errorsByCategory[error.category]++;
      errorsBySeverity[error.severity]++;
    });

    const topErrors = Array.from(this.errorCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([code, count]) => ({ code, count }));

    return {
      totalErrors: this.errorHistory.length,
      errorsByCategory,
      errorsBySeverity,
      topErrors,
      recentErrors: this.errorHistory.slice(-20)
    };
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateErrorCode(category: ErrorCategory, message: string): string {
    const hash = this.simpleHash(message);
    return `${category.toUpperCase()}_${hash}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36).toUpperCase();
  }

  private determineSeverity(category: ErrorCategory, message: string): ErrorSeverity {
    const lowerMessage = message.toLowerCase();
    
    // Critical patterns
    if (
      lowerMessage.includes('security') ||
      lowerMessage.includes('unauthorized') ||
      lowerMessage.includes('authentication failed') ||
      category === ErrorCategory.AUTHENTICATION
    ) {
      return ErrorSeverity.CRITICAL;
    }

    // High severity patterns
    if (
      lowerMessage.includes('database') ||
      lowerMessage.includes('network') ||
      lowerMessage.includes('timeout') ||
      category === ErrorCategory.NETWORK
    ) {
      return ErrorSeverity.HIGH;
    }

    // Medium severity patterns
    if (
      category === ErrorCategory.ML_PREDICTION ||
      category === ErrorCategory.DATA_PROCESSING ||
      lowerMessage.includes('prediction')
    ) {
      return ErrorSeverity.MEDIUM;
    }

    return ErrorSeverity.LOW;
  }

  private generateUserMessage(category: ErrorCategory, message: string): string {
    const userMessages = {
      [ErrorCategory.VALIDATION]: 'Please check your input and try again.',
      [ErrorCategory.NETWORK]: 'Connection error. Please check your internet connection.',
      [ErrorCategory.ML_PREDICTION]: 'Unable to generate prediction. Please try again.',
      [ErrorCategory.DATA_PROCESSING]: 'Error processing data. Please refresh and try again.',
      [ErrorCategory.USER_INPUT]: 'Invalid input provided. Please correct and try again.',
      [ErrorCategory.AUTHENTICATION]: 'Authentication error. Please log in again.',
      [ErrorCategory.BUSINESS_LOGIC]: 'Operation cannot be completed. Please try again.',
      [ErrorCategory.SYSTEM]: 'System error occurred. Please try again later.'
    };

    return userMessages[category] || 'An error occurred. Please try again.';
  }

  private isRetryable(category: ErrorCategory, message: string): boolean {
    const retryableCategories = [
      ErrorCategory.NETWORK,
      ErrorCategory.ML_PREDICTION,
      ErrorCategory.DATA_PROCESSING
    ];

    const nonRetryablePatterns = [
      'authentication',
      'unauthorized',
      'validation',
      'invalid input'
    ];

    const lowerMessage = message.toLowerCase();
    const hasNonRetryablePattern = nonRetryablePatterns.some(pattern => 
      lowerMessage.includes(pattern)
    );

    return retryableCategories.includes(category) && !hasNonRetryablePattern;
  }

  private trackErrorFrequency(errorCode: string): void {
    const current = this.errorCounts.get(errorCode) || 0;
    this.errorCounts.set(errorCode, current + 1);
  }

  private shouldRetry(errorCode: string): boolean {
    const count = this.errorCounts.get(errorCode) || 0;
    return count < 3; // Max 3 retries per error type
  }

  private logError(error: TradingError): void {
    const logContext = {
      errorId: error.id,
      category: error.category,
      severity: error.severity,
      errorCode: error.errorCode,
      context: error.context,
      correlationId: error.correlationId
    };

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        logger.critical(error.message, logContext);
        break;
      case ErrorSeverity.HIGH:
        logger.error(error.message, logContext);
        break;
      case ErrorSeverity.MEDIUM:
        logger.warn(error.message, logContext);
        break;
      case ErrorSeverity.LOW:
        logger.info(error.message, logContext);
        break;
    }
  }

  private addToHistory(error: TradingError): void {
    this.errorHistory.push(error);
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.shift();
    }
  }

  private handleCriticalError(error: TradingError): void {
    // Critical errors might need immediate attention
    // TODO: Send alert to monitoring system
    logger.critical('Critical error detected', {
      errorId: error.id,
      message: error.message,
      context: error.context
    });
  }

  clearErrorHistory(): void {
    this.errorHistory = [];
    this.errorCounts.clear();
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();