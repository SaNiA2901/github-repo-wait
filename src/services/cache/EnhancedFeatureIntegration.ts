/**
 * Enhanced Feature Integration
 * High-performance feature caching with compression and batch operations
 */

import { redisClient } from './RedisClient';
import { FeatureSet } from '../ml/FeatureExtractionService';
import { TechnicalIndicators } from '../indicators/TechnicalIndicators';
import { logger } from '@/utils/logger';
import { errorHandler, ErrorCategory } from '@/utils/errorHandler';

export interface EnhancedFeatureVector {
  features: FeatureSet;
  indicators: TechnicalIndicators;
  metadata: {
    candleIndex: number;
    sessionId: string;
    computedAt: number;
    version: string;
    confidence: number;
  };
}

export interface EnhancedCacheConfig {
  ttlSeconds: number;
  compressionEnabled: boolean;
  batchSize: number;
  maxRetries: number;
}

export class EnhancedFeatureIntegration {
  private static instance: EnhancedFeatureIntegration;
  private config: EnhancedCacheConfig;
  private cacheHits = 0;
  private cacheMisses = 0;
  private compressionCache = new Map<string, any>();

  private constructor() {
    this.config = {
      ttlSeconds: 3600, // 1 hour
      compressionEnabled: true,
      batchSize: 50,
      maxRetries: 3
    };
  }

  static getInstance(): EnhancedFeatureIntegration {
    if (!EnhancedFeatureIntegration.instance) {
      EnhancedFeatureIntegration.instance = new EnhancedFeatureIntegration();
    }
    return EnhancedFeatureIntegration.instance;
  }

  async storeFeatures(
    sessionId: string,
    candleIndex: number,
    features: EnhancedFeatureVector
  ): Promise<boolean> {
    try {
      const key = this.generateFeatureKey(sessionId, candleIndex);
      
      const data = this.config.compressionEnabled 
        ? await this.compressFeatures(features)
        : features;

      const success = await redisClient.set(key, data, this.config.ttlSeconds);
      
      if (success) {
        logger.debug('Enhanced features cached', { sessionId, candleIndex, key });
        await this.updateMetadata(sessionId, candleIndex, features.metadata);
      }
      
      return success;

    } catch (error) {
      errorHandler.handleError(error as Error, ErrorCategory.DATA_PROCESSING, {
        context: 'enhanced_feature_store',
        sessionId,
        candleIndex
      });
      return false;
    }
  }

  async getFeatures(
    sessionId: string,
    candleIndex: number
  ): Promise<EnhancedFeatureVector | null> {
    try {
      const key = this.generateFeatureKey(sessionId, candleIndex);
      const data = await redisClient.get<any>(key);

      if (data) {
        this.cacheHits++;
        
        const features = this.config.compressionEnabled
          ? await this.decompressFeatures(data)
          : data;

        logger.debug('Enhanced features retrieved', { sessionId, candleIndex });
        return features;
      }

      this.cacheMisses++;
      return null;

    } catch (error) {
      errorHandler.handleError(error as Error, ErrorCategory.DATA_PROCESSING, {
        context: 'enhanced_feature_get',
        sessionId,
        candleIndex
      });
      this.cacheMisses++;
      return null;
    }
  }

  async storeFeaturesInBatch(
    sessionId: string,
    featuresMap: Map<number, EnhancedFeatureVector>
  ): Promise<number> {
    let successCount = 0;
    const entries = Array.from(featuresMap.entries());

    for (let i = 0; i < entries.length; i += this.config.batchSize) {
      const batch = entries.slice(i, i + this.config.batchSize);
      
      const promises = batch.map(([candleIndex, features]) =>
        this.storeFeatures(sessionId, candleIndex, features)
      );

      try {
        const results = await Promise.allSettled(promises);
        successCount += results.filter(r => r.status === 'fulfilled' && r.value).length;

      } catch (error) {
        logger.error('Enhanced batch storage error', { sessionId, batchSize: batch.length, error });
      }
    }

    logger.info('Enhanced batch storage completed', { 
      sessionId, 
      total: entries.length, 
      successful: successCount 
    });

    return successCount;
  }

  async getFeaturesRange(
    sessionId: string,
    startIndex: number,
    endIndex: number
  ): Promise<Map<number, EnhancedFeatureVector>> {
    const result = new Map<number, EnhancedFeatureVector>();
    const promises: Promise<void>[] = [];

    for (let i = startIndex; i <= endIndex; i++) {
      promises.push(
        this.getFeatures(sessionId, i).then(features => {
          if (features) {
            result.set(i, features);
          }
        })
      );
    }

    await Promise.allSettled(promises);
    
    logger.debug('Enhanced features range retrieved', { 
      sessionId, 
      startIndex, 
      endIndex, 
      found: result.size 
    });

    return result;
  }

  async invalidateSession(sessionId: string): Promise<number> {
    try {
      const metadataKey = this.generateMetadataKey(sessionId);
      const metadata = await redisClient.get<{ keys: string[] }>(metadataKey);

      if (metadata?.keys) {
        const deletePromises = metadata.keys.map(key => redisClient.delete(key));
        const results = await Promise.allSettled(deletePromises);
        
        const deletedCount = results.filter(r => 
          r.status === 'fulfilled' && r.value > 0
        ).length;

        await redisClient.delete(metadataKey);

        logger.info('Enhanced session features invalidated', { sessionId, deletedCount });
        return deletedCount;
      }

      return 0;

    } catch (error) {
      errorHandler.handleError(error as Error, ErrorCategory.DATA_PROCESSING, {
        context: 'enhanced_feature_invalidate',
        sessionId
      });
      return 0;
    }
  }

  getCacheStats() {
    const totalRequests = this.cacheHits + this.cacheMisses;
    const hitRate = totalRequests > 0 ? (this.cacheHits / totalRequests) * 100 : 0;

    return {
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: Number(hitRate.toFixed(2)),
      compressionEnabled: this.config.compressionEnabled,
      ttlSeconds: this.config.ttlSeconds
    };
  }

  resetStats(): void {
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  updateConfig(config: Partial<EnhancedCacheConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('Enhanced feature cache config updated', this.config);
  }

  // Private helper methods
  private generateFeatureKey(sessionId: string, candleIndex: number): string {
    return `enhanced:features:${sessionId}:${candleIndex}`;
  }

  private generateMetadataKey(sessionId: string): string {
    return `enhanced:features:meta:${sessionId}`;
  }

  private async compressFeatures(features: EnhancedFeatureVector): Promise<any> {
    try {
      const compressed = {
        f: features.features,
        i: this.compressIndicators(features.indicators),
        m: features.metadata
      };

      return compressed;

    } catch (error) {
      logger.warn('Enhanced compression failed', { error });
      return features;
    }
  }

  private async decompressFeatures(data: any): Promise<EnhancedFeatureVector> {
    try {
      if (data.f && data.i && data.m) {
        return {
          features: data.f,
          indicators: this.decompressIndicators(data.i),
          metadata: data.m
        };
      }

      return data;

    } catch (error) {
      logger.warn('Enhanced decompression failed', { error });
      return data;
    }
  }

  private compressIndicators(indicators: TechnicalIndicators): any {
    return {
      r: Number(indicators.rsi?.toFixed(4) || 0),
      m: indicators.macd ? {
        l: Number(indicators.macd.line?.toFixed(4) || 0),
        s: Number(indicators.macd.signal?.toFixed(4) || 0),
        h: Number(indicators.macd.histogram?.toFixed(4) || 0)
      } : null,
      bb: indicators.bollingerBands ? {
        u: Number(indicators.bollingerBands.upper?.toFixed(4) || 0),
        m: Number(indicators.bollingerBands.middle?.toFixed(4) || 0),
        l: Number(indicators.bollingerBands.lower?.toFixed(4) || 0)
      } : null,
      e: indicators.ema ? {
        e12: Number(indicators.ema.ema12?.toFixed(4) || 0),
        e26: Number(indicators.ema.ema26?.toFixed(4) || 0)
      } : null,
      st: indicators.stochastic ? {
        k: Number(indicators.stochastic.k?.toFixed(2) || 0),
        d: Number(indicators.stochastic.d?.toFixed(2) || 0)
      } : null,
      atr: Number(indicators.atr?.toFixed(4) || 0),
      adx: Number(indicators.adx?.toFixed(4) || 0)
    };
  }

  private decompressIndicators(data: any): TechnicalIndicators {
    return {
      rsi: data.r || 0,
      macd: data.m ? {
        line: data.m.l || 0,
        signal: data.m.s || 0,
        histogram: data.m.h || 0
      } : { line: 0, signal: 0, histogram: 0 },
      bollingerBands: data.bb ? {
        upper: data.bb.u || 0,
        middle: data.bb.m || 0,
        lower: data.bb.l || 0
      } : { upper: 0, middle: 0, lower: 0 },
      ema: data.e ? {
        ema12: data.e.e12 || 0,
        ema26: data.e.e26 || 0
      } : { ema12: 0, ema26: 0 },
      stochastic: data.st ? {
        k: data.st.k || 0,
        d: data.st.d || 0
      } : { k: 0, d: 0 },
      atr: data.atr || 0,
      adx: data.adx || 0
    };
  }

  private async updateMetadata(
    sessionId: string,
    candleIndex: number,
    metadata: EnhancedFeatureVector['metadata']
  ): Promise<void> {
    try {
      const metadataKey = this.generateMetadataKey(sessionId);
      const featureKey = this.generateFeatureKey(sessionId, candleIndex);
      
      const existing = await redisClient.get<{ keys: string[] }>(metadataKey);
      const keys = existing?.keys || [];
      
      if (!keys.includes(featureKey)) {
        keys.push(featureKey);
        await redisClient.set(metadataKey, { keys }, this.config.ttlSeconds);
      }

    } catch (error) {
      logger.warn('Enhanced metadata update failed', { sessionId, candleIndex, error });
    }
  }
}

export const enhancedFeatureIntegration = EnhancedFeatureIntegration.getInstance();