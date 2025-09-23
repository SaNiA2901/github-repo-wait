/**
 * Redis Client Manager - BROWSER-SAFE VERSION
 * Mock implementation for browser environment
 * Real Redis functionality should only be used in Edge Functions
 */

import { logger } from '@/utils/logger';
import { errorHandler, ErrorCategory } from '@/utils/errorHandler';

export interface RedisConfig {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  database?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  connectTimeoutMs?: number;
  commandTimeoutMs?: number;
  keyPrefix?: string;
  compression?: boolean;
  maxMemoryPolicy?: string;
}

export interface RedisMetrics {
  totalCommands: number;
  successfulCommands: number;
  failedCommands: number;
  connectionTime: number;
  lastError?: string;
  errorCount: number;
  cacheHits: number;
  cacheMisses: number;
  averageResponseTime: number;
}

export interface CacheEntry {
  value: any;
  expires?: number;
  tags?: string[];
}

/**
 * Browser-safe Redis Client Mock
 * Uses localStorage as fallback for caching in browser environment
 */
class BrowserRedisClientManager {
  private static instance: BrowserRedisClientManager;
  private config: RedisConfig;
  private metrics: RedisMetrics;
  private storage: Map<string, CacheEntry> = new Map();

  private constructor() {
    this.config = {
      host: 'localhost',
      port: 6379,
      maxRetries: 3,
      retryDelayMs: 1000,
      connectTimeoutMs: 5000,
      commandTimeoutMs: 5000,
      keyPrefix: 'trading:',
      compression: true,
      maxMemoryPolicy: 'allkeys-lru'
    };

    this.metrics = {
      totalCommands: 0,
      successfulCommands: 0,
      failedCommands: 0,
      connectionTime: 0,
      errorCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageResponseTime: 0
    };

    console.warn('Redis Client running in browser mode - using localStorage fallback');
  }

  static getInstance(): BrowserRedisClientManager {
    if (!BrowserRedisClientManager.instance) {
      BrowserRedisClientManager.instance = new BrowserRedisClientManager();
    }
    return BrowserRedisClientManager.instance;
  }

  async connect(): Promise<void> {
    // Mock connection - always succeeds in browser
    console.log('Redis mock client connected');
  }

  async disconnect(): Promise<void> {
    this.storage.clear();
    console.log('Redis mock client disconnected');
  }

  async ping(): Promise<string> {
    return 'PONG';
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    try {
      this.metrics.totalCommands++;
      
      const entry: CacheEntry = {
        value: JSON.stringify(value),
        expires: ttlSeconds ? Date.now() + (ttlSeconds * 1000) : undefined
      };

      this.storage.set(this.config.keyPrefix + key, entry);
      
      // Also store in localStorage as backup
      try {
        localStorage.setItem(
          `redis_cache_${this.config.keyPrefix}${key}`, 
          JSON.stringify(entry)
        );
      } catch (e) {
        // Ignore localStorage errors
      }

      this.metrics.successfulCommands++;
      return true;
    } catch (error) {
      this.metrics.failedCommands++;
      this.metrics.errorCount++;
      console.warn('Redis mock set failed:', error);
      return false;
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      this.metrics.totalCommands++;
      
      const fullKey = this.config.keyPrefix + key;
      let entry = this.storage.get(fullKey);

      // Fallback to localStorage
      if (!entry) {
        try {
          const stored = localStorage.getItem(`redis_cache_${fullKey}`);
          if (stored) {
            entry = JSON.parse(stored);
          }
        } catch (e) {
          // Ignore localStorage errors
        }
      }

      if (!entry) {
        this.metrics.cacheMisses++;
        return null;
      }

      // Check expiration
      if (entry.expires && Date.now() > entry.expires) {
        this.storage.delete(fullKey);
        try {
          localStorage.removeItem(`redis_cache_${fullKey}`);
        } catch (e) {
          // Ignore localStorage errors
        }
        this.metrics.cacheMisses++;
        return null;
      }

      this.metrics.cacheHits++;
      this.metrics.successfulCommands++;
      
      return JSON.parse(entry.value) as T;
    } catch (error) {
      this.metrics.failedCommands++;
      this.metrics.errorCount++;
      console.warn('Redis mock get failed:', error);
      return null;
    }
  }

  async delete(key: string): Promise<number> {
    try {
      this.metrics.totalCommands++;
      
      const fullKey = this.config.keyPrefix + key;
      const existed = this.storage.has(fullKey);
      
      this.storage.delete(fullKey);
      
      try {
        localStorage.removeItem(`redis_cache_${fullKey}`);
      } catch (e) {
        // Ignore localStorage errors
      }

      this.metrics.successfulCommands++;
      return existed ? 1 : 0;
    } catch (error) {
      this.metrics.failedCommands++;
      this.metrics.errorCount++;
      console.warn('Redis mock delete failed:', error);
      return 0;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      this.metrics.totalCommands++;
      
      const fullKey = this.config.keyPrefix + key;
      const entry = this.storage.get(fullKey);
      
      if (!entry) {
        this.metrics.successfulCommands++;
        return false;
      }

      // Check expiration
      if (entry.expires && Date.now() > entry.expires) {
        this.storage.delete(fullKey);
        this.metrics.successfulCommands++;
        return false;
      }

      this.metrics.successfulCommands++;
      return true;
    } catch (error) {
      this.metrics.failedCommands++;
      this.metrics.errorCount++;
      console.warn('Redis mock exists failed:', error);
      return false;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      this.metrics.totalCommands++;
      
      const allKeys = Array.from(this.storage.keys());
      const matchingKeys = allKeys.filter(key => {
        // Simple pattern matching (only supports * wildcard at the end)
        if (pattern.endsWith('*')) {
          const prefix = pattern.slice(0, -1);
          return key.startsWith(this.config.keyPrefix + prefix);
        }
        return key === this.config.keyPrefix + pattern;
      });

      this.metrics.successfulCommands++;
      return matchingKeys.map(key => key.replace(this.config.keyPrefix!, ''));
    } catch (error) {
      this.metrics.failedCommands++;
      this.metrics.errorCount++;
      console.warn('Redis mock keys failed:', error);
      return [];
    }
  }

  async flushAll(): Promise<void> {
    try {
      this.metrics.totalCommands++;
      this.storage.clear();
      
      // Clear localStorage cache entries
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('redis_cache_')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          // Ignore localStorage errors
        }
      });

      this.metrics.successfulCommands++;
    } catch (error) {
      this.metrics.failedCommands++;
      this.metrics.errorCount++;
      console.warn('Redis mock flushAll failed:', error);
    }
  }

  getMetrics(): RedisMetrics {
    return { ...this.metrics };
  }

  updateConfig(config: Partial<RedisConfig>): void {
    this.config = { ...this.config, ...config };
  }

  isConnected(): boolean {
    // Always connected in browser mock mode
    return true;
  }

  getClient(): any {
    // Return mock client interface
    return {
      set: this.set.bind(this),
      get: this.get.bind(this),
      del: this.delete.bind(this),
      exists: this.exists.bind(this),
      keys: this.keys.bind(this),
      flushAll: this.flushAll.bind(this),
      ping: this.ping.bind(this),
      quit: this.disconnect.bind(this)
    };
  }
}

// Export singleton instance and class
export const redisClient = BrowserRedisClientManager.getInstance();
export { BrowserRedisClientManager as RedisClientManager };