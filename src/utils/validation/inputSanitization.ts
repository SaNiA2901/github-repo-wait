
/**
 * Input sanitization and XSS protection utilities
 * Comprehensive security measures for user inputs
 */

import { z } from 'zod';

export class InputSanitizer {
  private static readonly HTML_ESCAPE_MAP: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };

  /**
   * Escape HTML to prevent XSS attacks
   */
  static escapeHtml(unsafe: string): string {
    if (typeof unsafe !== 'string') {
      return String(unsafe);
    }
    
    return unsafe.replace(/[&<>"'`=\/]/g, (s) => InputSanitizer.HTML_ESCAPE_MAP[s]);
  }

  /**
   * Sanitize string input by removing dangerous characters
   */
  static sanitizeString(input: string, options: {
    allowNumbers?: boolean;
    allowSpecialChars?: boolean;
    maxLength?: number;
  } = {}): string {
    const {
      allowNumbers = true,
      allowSpecialChars = false,
      maxLength = 1000
    } = options;

    if (typeof input !== 'string') {
      return '';
    }

    let sanitized = input.trim();
    
    // Remove null bytes and control characters
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
    
    // Remove potentially dangerous patterns
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=/gi, '');
    sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '');
    sanitized = sanitized.replace(/<iframe[^>]*>.*?<\/iframe>/gi, '');
    sanitized = sanitized.replace(/<object[^>]*>.*?<\/object>/gi, '');
    sanitized = sanitized.replace(/<embed[^>]*>/gi, '');

    // Character filtering
    if (!allowNumbers) {
      sanitized = sanitized.replace(/\d/g, '');
    }
    
    if (!allowSpecialChars) {
      sanitized = sanitized.replace(/[^\w\s.-]/g, '');
    }

    // Truncate to max length
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return InputSanitizer.escapeHtml(sanitized);
  }

  /**
   * Validate and sanitize numerical input for trading data
   */
  static sanitizeNumber(
    input: string | number, 
    options: {
      min?: number;
      max?: number;
      decimals?: number;
      allowNegative?: boolean;
    } = {}
  ): number {
    const {
      min = Number.MIN_SAFE_INTEGER,
      max = Number.MAX_SAFE_INTEGER,
      decimals = 8,
      allowNegative = true
    } = options;

    let numValue: number;

    if (typeof input === 'string') {
      // Remove non-numeric characters except decimal point and minus
      const cleaned = input.replace(/[^\d.-]/g, '');
      numValue = parseFloat(cleaned);
    } else {
      numValue = input;
    }

    // Validate number
    if (isNaN(numValue) || !isFinite(numValue)) {
      throw new Error('Invalid numerical input');
    }

    // Check negative values
    if (!allowNegative && numValue < 0) {
      throw new Error('Negative values are not allowed');
    }

    // Apply min/max constraints
    numValue = Math.max(min, Math.min(max, numValue));

    // Round to specified decimal places
    if (decimals >= 0) {
      numValue = Math.round(numValue * Math.pow(10, decimals)) / Math.pow(10, decimals);
    }

    return numValue;
  }
}

// Zod schemas for comprehensive validation
export const TradingDataSchemas = {
  candleData: z.object({
    open: z.number().min(0).max(1000000),
    high: z.number().min(0).max(1000000),
    low: z.number().min(0).max(1000000),
    close: z.number().min(0).max(1000000),
    volume: z.number().min(0).max(Number.MAX_SAFE_INTEGER),
    timestamp: z.number().int().positive()
  }).refine(data => {
    // OHLC logical validation
    return data.high >= Math.max(data.open, data.close) &&
           data.low <= Math.min(data.open, data.close) &&
           data.high >= data.low;
  }, {
    message: "Invalid OHLC relationships"
  }),

  predictionConfig: z.object({
    predictionInterval: z.enum(['1m', '5m', '15m', '30m', '1h', '4h', '1d']),
    confidence: z.number().min(0).max(100),
    riskLevel: z.enum(['low', 'medium', 'high']),
    stopLoss: z.number().min(0).max(100).optional(),
    takeProfit: z.number().min(0).max(1000).optional()
  })
};

// Legacy functions (backward compatibility)
export const sanitizeNumericInput = (value: string): string => {
  if (!value) return '';
  
  // Убираем все символы кроме цифр, точки и минуса
  let sanitized = value.replace(/[^0-9.-]/g, '');
  
  // Обрабатываем множественные точки
  const parts = sanitized.split('.');
  if (parts.length > 2) {
    sanitized = parts[0] + '.' + parts.slice(1).join('');
  }
  
  // Обрабатываем множественные минусы (только в начале)
  const minusCount = (sanitized.match(/-/g) || []).length;
  if (minusCount > 1) {
    const hasLeadingMinus = sanitized.startsWith('-');
    sanitized = sanitized.replace(/-/g, '');
    if (hasLeadingMinus) {
      sanitized = '-' + sanitized;
    }
  }
  
  // Ограничиваем количество знаков после запятой
  if (sanitized.includes('.')) {
    const [integer, decimal] = sanitized.split('.');
    sanitized = integer + '.' + decimal.slice(0, 8);
  }
  
  return sanitized;
};

export const sanitizeSessionName = (name: string): string => {
  return InputSanitizer.sanitizeString(name, { maxLength: 100 });
};

export const sanitizeCurrencyPair = (pair: string): string => {
  return InputSanitizer.sanitizeString(pair.trim().toUpperCase(), { 
    allowSpecialChars: false, 
    maxLength: 10 
  });
};

// New secure exports
export const sanitizeString = InputSanitizer.sanitizeString;
export const sanitizeNumber = InputSanitizer.sanitizeNumber;
export const escapeHtml = InputSanitizer.escapeHtml;
