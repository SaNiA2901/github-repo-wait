/**
 * CRYPTOGRAPHICALLY SECURE RANDOM GENERATION
 * Replaces Math.random() for security-critical operations
 */

import { secureLogger } from './secureLogger';

export class SecureRandom {
  private static fallbackSeed = Date.now();

  /**
   * Generate cryptographically secure random number [0, 1)
   */
  static random(): number {
    try {
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        return array[0] / (0xffffffff + 1);
      }
    } catch (error) {
      secureLogger.warn('Crypto API unavailable, using fallback', { error });
    }
    
    // Fallback using a simple PRNG (not cryptographically secure but better than Math.random)
    return this.fallbackRandom();
  }

  /**
   * Generate secure random integer in range [min, max)
   */
  static randomInt(min: number, max: number): number {
    if (min >= max) {
      throw new Error('min must be less than max');
    }
    return Math.floor(this.random() * (max - min)) + min;
  }

  /**
   * Generate secure random float in range [min, max)
   */
  static randomFloat(min: number, max: number): number {
    if (min >= max) {
      throw new Error('min must be less than max');
    }
    return this.random() * (max - min) + min;
  }

  /**
   * Generate secure random boolean
   */
  static randomBoolean(): boolean {
    return this.random() < 0.5;
  }

  /**
   * Generate random bytes
   */
  static randomBytes(length: number): Uint8Array {
    try {
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return array;
      }
    } catch (error) {
      secureLogger.warn('Crypto API unavailable for randomBytes', { error });
    }
    
    // Fallback
    const array = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(this.fallbackRandom() * 256);
    }
    return array;
  }

  /**
   * Generate secure UUID v4
   */
  static uuid(): string {
    try {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
      }
    } catch (error) {
      secureLogger.warn('crypto.randomUUID unavailable', { error });
    }
    
    // Fallback UUID generation
    const bytes = this.randomBytes(16);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10
    
    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  }

  /**
   * Generate cryptographically secure random string
   */
  static randomString(length: number, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'): string {
    const bytes = this.randomBytes(length);
    return Array.from(bytes).map(byte => charset[byte % charset.length]).join('');
  }

  /**
   * Secure array shuffle using Fisher-Yates algorithm
   */
  static shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = this.randomInt(0, i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Secure random selection from array
   */
  static choice<T>(array: T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot choose from empty array');
    }
    return array[this.randomInt(0, array.length)];
  }

  /**
   * Generate secure random Gaussian (normal) distribution
   * Using Box-Muller transform
   */
  static randomGaussian(mean = 0, stdDev = 1): number {
    let u = 0, v = 0;
    while (u === 0) u = this.random(); // Converting [0,1) to (0,1)
    while (v === 0) v = this.random();
    
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * stdDev + mean;
  }

  /**
   * Simple PRNG fallback (Linear Congruential Generator)
   * NOT cryptographically secure but deterministic and better than Math.random for testing
   */
  private static fallbackRandom(): number {
    this.fallbackSeed = (this.fallbackSeed * 1664525 + 1013904223) % (2 ** 32);
    return this.fallbackSeed / (2 ** 32);
  }

  /**
   * Set seed for fallback PRNG (for testing only)
   */
  static setSeed(seed: number): void {
    this.fallbackSeed = seed;
    secureLogger.warn('Using seeded PRNG - not cryptographically secure!');
  }

  /**
   * Test if crypto API is available
   */
  static isCryptoAvailable(): boolean {
    return typeof crypto !== 'undefined' && !!crypto.getRandomValues;
  }
}

// Legacy Math.random replacement for easy migration
export const secureMath = {
  random: () => SecureRandom.random(),
  randomInt: (min: number, max: number) => SecureRandom.randomInt(min, max),
  randomFloat: (min: number, max: number) => SecureRandom.randomFloat(min, max),
}

// Backwards compatibility aliases
export const secureCrypto = {
  generateId: () => SecureRandom.uuid(),
  generateSecure: () => SecureRandom.uuid()
};
