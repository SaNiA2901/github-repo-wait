/**
 * COMPREHENSIVE INPUT VALIDATION SYSTEM
 * Protects against XSS, injection attacks, and malformed data
 */

import { z } from 'zod';
import { secureLogger } from '../secureLogger';

// Security-focused validation schemas
export const ValidationSchemas = {
  // Trading Data Validation
  CandleData: z.object({
    timestamp: z.number().int().positive(),
    open: z.number().positive().finite(),
    high: z.number().positive().finite(),
    low: z.number().positive().finite(),
    close: z.number().positive().finite(),
    volume: z.number().nonnegative().finite().optional(),
  }).refine(
    (data) => data.high >= data.open && data.high >= data.close && data.high >= data.low,
    { message: "High price must be >= open, close, and low prices" }
  ).refine(
    (data) => data.low <= data.open && data.low <= data.close && data.low <= data.high,
    { message: "Low price must be <= open, close, and high prices" }
  ),

  // Session Management
  SessionData: z.object({
    session_name: z.string()
      .min(1, "Session name is required")
      .max(50, "Session name too long")
      .regex(/^[a-zA-Z0-9_\-\s]+$/, "Invalid characters in session name"),
    pair: z.string()
      .regex(/^[A-Z]{3}\/[A-Z]{3}$/, "Invalid currency pair format (e.g., EUR/USD)"),
    timeframe: z.enum(['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w']),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
    start_time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)"),
  }),

  // Prediction Configuration
  PredictionConfig: z.object({
    predictionInterval: z.number().int().min(1).max(60),
    confidence_threshold: z.number().min(0).max(1),
    use_ml: z.boolean(),
    risk_level: z.enum(['low', 'medium', 'high']),
  }),

  // User Input Sanitization
  UserText: z.string()
    .max(1000, "Text too long")
    .regex(/^[^<>;"'&]*$/, "Invalid characters detected"),

  // File Upload Validation
  FileUpload: z.object({
    name: z.string().regex(/^[a-zA-Z0-9._-]+\.(csv|json|txt)$/, "Invalid file type"),
    size: z.number().max(10 * 1024 * 1024, "File too large (max 10MB)"),
    type: z.enum(['text/csv', 'application/json', 'text/plain']),
  }),
};

export class InputValidator {
  // Sanitize HTML to prevent XSS
  static sanitizeHtml(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // Sanitize SQL to prevent injection
  static sanitizeSql(input: string): string {
    return input.replace(/['"`;\\]/g, '');
  }

  // Rate limiting check
  private static rateLimitMap = new Map<string, { count: number; resetTime: number }>();

  static checkRateLimit(identifier: string, maxRequests = 100, windowMs = 60000): boolean {
    const now = Date.now();
    const window = this.rateLimitMap.get(identifier);

    if (!window || now > window.resetTime) {
      this.rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (window.count >= maxRequests) {
      secureLogger.warn('Rate limit exceeded', { identifier, count: window.count });
      return false;
    }

    window.count++;
    return true;
  }

  // Validate and sanitize candle data
  static validateCandleData(data: unknown): z.infer<typeof ValidationSchemas.CandleData> | null {
    try {
      return ValidationSchemas.CandleData.parse(data);
    } catch (error) {
      secureLogger.error('Invalid candle data', { error: error instanceof Error ? error.message : 'Unknown error', data });
      return null;
    }
  }

  // Validate session data
  static validateSessionData(data: unknown): z.infer<typeof ValidationSchemas.SessionData> | null {
    try {
      const result = ValidationSchemas.SessionData.parse(data);
      // Additional security checks
      if (new Date(result.start_date) > new Date()) {
        throw new Error('Start date cannot be in the future');
      }
      return result;
    } catch (error) {
      secureLogger.error('Invalid session data', { error: error instanceof Error ? error.message : 'Unknown error' });
      return null;
    }
  }

  // Validate prediction config
  static validatePredictionConfig(data: unknown): z.infer<typeof ValidationSchemas.PredictionConfig> | null {
    try {
      return ValidationSchemas.PredictionConfig.parse(data);
    } catch (error) {
      secureLogger.error('Invalid prediction config', { error: error instanceof Error ? error.message : 'Unknown error' });
      return null;
    }
  }

  // Generic validation with schema
  static validate<T>(schema: z.ZodSchema<T>, data: unknown): T | null {
    try {
      return schema.parse(data);
    } catch (error) {
      secureLogger.error('Validation failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        schemaType: typeof schema
      });
      return null;
    }
  }

  // Check for suspicious patterns
  static detectSuspiciousActivity(data: Record<string, any>): boolean {
    const suspiciousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /data:text\/html/gi,
      /vbscript:/gi,
      /on\w+\s*=/gi,
      /union\s+select/gi,
      /drop\s+table/gi,
      /delete\s+from/gi,
    ];

    const dataStr = JSON.stringify(data).toLowerCase();
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(dataStr)) {
        secureLogger.warn('Suspicious pattern detected', { pattern: pattern.source });
        return true;
      }
    }
    
    return false;
  }
}

// Input sanitization decorators
export function ValidateInput(schema: z.ZodSchema) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = function (...args: any[]) {
      const validatedArgs = args.map(arg => {
        const result = InputValidator.validate(schema, arg);
        if (result === null) {
          throw new Error(`Invalid input for ${propertyName}`);
        }
        return result;
      });
      
      return method.apply(this, validatedArgs);
    };
  };
}

// Security headers for responses
export const SecurityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
} as const;