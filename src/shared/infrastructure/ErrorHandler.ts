/**
 * INFRASTRUCTURE: Centralized Error Handling
 * Type-Safe Error Management с классификацией и восстановлением
 */

import { secureLogger } from '@/utils/secureLogger';
import { Result } from '@/shared/types/common';

// Error Types Hierarchy
export abstract class AppError extends Error {
  abstract readonly type: string;
  abstract readonly code: string;
  abstract readonly severity: 'low' | 'medium' | 'high' | 'critical';
  abstract readonly recoverable: boolean;
  
  constructor(
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  abstract toJSON(): Record<string, unknown>;
}

// Domain Errors
export class ValidationError extends AppError {
  readonly type = 'validation';
  readonly severity = 'medium' as const;
  readonly recoverable = true;
  
  constructor(
    message: string,
    public readonly field: string,
    public readonly code: string,
    context?: Record<string, unknown>
  ) {
    super(message, context);
  }

  toJSON() {
    return {
      type: this.type,
      code: this.code,
      message: this.message,
      field: this.field,
      severity: this.severity,
      recoverable: this.recoverable,
      context: this.context
    };
  }
}

export class BusinessLogicError extends AppError {
  readonly type = 'business';
  readonly severity = 'high' as const;
  readonly recoverable = false;
  
  constructor(
    message: string,
    public readonly code: string,
    context?: Record<string, unknown>
  ) {
    super(message, context);
  }

  toJSON() {
    return {
      type: this.type,
      code: this.code,
      message: this.message,
      severity: this.severity,
      recoverable: this.recoverable,
      context: this.context
    };
  }
}

export class SecurityError extends AppError {
  readonly type = 'security';
  readonly severity = 'critical' as const;
  readonly recoverable = false;
  
  constructor(
    message: string,
    public readonly code: string,
    context?: Record<string, unknown>
  ) {
    super(message, context);
  }

  toJSON() {
    return {
      type: this.type,
      code: this.code,
      message: this.message,
      severity: this.severity,
      recoverable: this.recoverable,
      context: this.context
    };
  }
}

export class InfrastructureError extends AppError {
  readonly type = 'infrastructure';
  readonly severity = 'high' as const;
  readonly recoverable = true;
  
  constructor(
    message: string,
    public readonly code: string,
    public readonly service: string,
    context?: Record<string, unknown>
  ) {
    super(message, context);
  }

  toJSON() {
    return {
      type: this.type,
      code: this.code,
      message: this.message,
      service: this.service,
      severity: this.severity,
      recoverable: this.recoverable,
      context: this.context
    };
  }
}

export class MLError extends AppError {
  readonly type = 'ml';
  readonly severity = 'medium' as const;
  readonly recoverable = true;
  
  constructor(
    message: string,
    public readonly code: string,
    public readonly modelVersion?: string,
    context?: Record<string, unknown>
  ) {
    super(message, context);
  }

  toJSON() {
    return {
      type: this.type,
      code: this.code,
      message: this.message,
      modelVersion: this.modelVersion,
      severity: this.severity,
      recoverable: this.recoverable,
      context: this.context
    };
  }
}

// Error Handler Service
export class ErrorHandlerService {
  private static instance: ErrorHandlerService;
  private errorHistory: AppError[] = [];
  private maxHistorySize = 100;
  private errorCounts = new Map<string, number>();

  static getInstance(): ErrorHandlerService {
    if (!this.instance) {
      this.instance = new ErrorHandlerService();
    }
    return this.instance;
  }

  // Handle errors with automatic classification and logging
  handle(error: Error | AppError, context?: Record<string, unknown>): void {
    let appError: AppError;

    // Convert regular errors to AppErrors
    if (error instanceof AppError) {
      appError = error;
    } else {
      appError = this.classifyError(error, context);
    }

    // Log error
    this.logError(appError);
    
    // Store in history
    this.addToHistory(appError);
    
    // Update error counts
    this.updateErrorCounts(appError);
    
    // Handle recovery if possible
    if (appError.recoverable) {
      this.attemptRecovery(appError);
    }
  }

  // Async error handling with Result pattern
  async handleAsync<T>(
    operation: () => Promise<T>,
    context?: Record<string, unknown>
  ): Promise<Result<T>> {
    try {
      const result = await operation();
      return { success: true, data: result };
    } catch (error) {
      this.handle(error as Error, context);
      return { 
        success: false, 
        error: error instanceof AppError ? error : this.classifyError(error as Error, context)
      };
    }
  }

  // Sync error handling with Result pattern
  handleSync<T>(
    operation: () => T,
    context?: Record<string, unknown>
  ): Result<T> {
    try {
      const result = operation();
      return { success: true, data: result };
    } catch (error) {
      this.handle(error as Error, context);
      return { 
        success: false, 
        error: error instanceof AppError ? error : this.classifyError(error as Error, context)
      };
    }
  }

  // Get error statistics
  getErrorStats(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    recentErrors: AppError[];
  } {
    const errorsByType: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};

    this.errorHistory.forEach(error => {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
    });

    return {
      totalErrors: this.errorHistory.length,
      errorsByType,
      errorsBySeverity,
      recentErrors: this.errorHistory.slice(-10)
    };
  }

  // Clear error history
  clearHistory(): void {
    this.errorHistory = [];
    this.errorCounts.clear();
    secureLogger.info('Error history cleared');
  }

  private classifyError(error: Error, context?: Record<string, unknown>): AppError {
    const message = error.message.toLowerCase();
    
    // Security-related errors
    if (message.includes('unauthorized') || message.includes('forbidden') || 
        message.includes('csrf') || message.includes('xss')) {
      return new SecurityError(error.message, 'SECURITY_VIOLATION', context);
    }
    
    // Validation errors
    if (message.includes('validation') || message.includes('invalid') || 
        message.includes('required') || message.includes('format')) {
      return new ValidationError(error.message, 'unknown', 'VALIDATION_FAILED', context);
    }
    
    // Infrastructure errors
    if (message.includes('network') || message.includes('timeout') || 
        message.includes('connection') || message.includes('fetch')) {
      return new InfrastructureError(error.message, 'NETWORK_ERROR', 'unknown', context);
    }
    
    // ML-related errors
    if (message.includes('model') || message.includes('prediction') || 
        message.includes('training') || message.includes('onnx')) {
      return new MLError(error.message, 'ML_ERROR', undefined, context);
    }
    
    // Default to business logic error
    return new BusinessLogicError(error.message, 'UNKNOWN_ERROR', context);
  }

  private logError(error: AppError): void {
    const logData = {
      type: error.type,
      code: error.code,
      message: error.message,
      severity: error.severity,
      recoverable: error.recoverable,
      context: error.context,
      stack: error.stack
    };

    switch (error.severity) {
      case 'critical':
        secureLogger.error('Critical error occurred', logData);
        break;
      case 'high':
        secureLogger.error('High severity error', logData);
        break;
      case 'medium':
        secureLogger.warn('Medium severity error', logData);
        break;
      case 'low':
        secureLogger.info('Low severity error', logData);
        break;
    }
  }

  private addToHistory(error: AppError): void {
    this.errorHistory.push(error);
    
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(-this.maxHistorySize);
    }
  }

  private updateErrorCounts(error: AppError): void {
    const key = `${error.type}:${error.code}`;
    this.errorCounts.set(key, (this.errorCounts.get(key) || 0) + 1);
  }

  private attemptRecovery(error: AppError): void {
    secureLogger.info('Attempting error recovery', {
      type: error.type,
      code: error.code,
      recoverable: error.recoverable
    });

    // Implement specific recovery strategies based on error type
    switch (error.type) {
      case 'infrastructure':
        // Could implement retry logic, fallback services, etc.
        break;
      case 'ml':
        // Could implement fallback prediction models
        break;
      case 'validation':
        // Could implement data sanitization
        break;
    }
  }
}

// Global error handler instance
export const errorHandler = ErrorHandlerService.getInstance();

// Utility functions
export function wrapAsync<T>(
  fn: (...args: any[]) => Promise<T>
): (...args: any[]) => Promise<Result<T>> {
  return async (...args: any[]) => {
    return errorHandler.handleAsync(() => fn(...args));
  };
}

export function wrapSync<T>(
  fn: (...args: any[]) => T
): (...args: any[]) => Result<T> {
  return (...args: any[]) => {
    return errorHandler.handleSync(() => fn(...args));
  };
}