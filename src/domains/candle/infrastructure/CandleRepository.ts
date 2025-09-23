/**
 * DOMAIN: Candle Repository Implementation
 * Type-Safe CRUD операции для свечных данных с валидацией OHLCV
 */

import { Repository, Result } from '@/shared/types/common';
import { CandleEntity, CandleValueObjects } from '@/domains/candle/types';
import { ValidationError } from '@/shared/infrastructure/ErrorHandler';
import { InputValidator } from '@/utils/validation/secureValidation';
import { secureLogger } from '@/utils/secureLogger';
import { SecureRandom } from '@/utils/secureCrypto';

export interface CreateCandleData {
  session_id: string;
  candle_index: number;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  source?: 'manual' | 'api' | 'import';
}

export interface UpdateCandleData {
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
  prediction_direction?: 'UP' | 'DOWN';
  prediction_probability?: number;
  prediction_confidence?: number;
}

export class CandleRepository implements Repository<CandleEntity, string> {
  private candles = new Map<string, CandleEntity>();
  private indexBySession = new Map<string, Set<string>>();

  async findById(id: string): Promise<CandleEntity | null> {
    try {
      const candle = this.candles.get(id);
      return candle || null;
    } catch (error) {
      secureLogger.error('Failed to find candle by ID', {
        candleId: id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  async findAll(): Promise<CandleEntity[]> {
    try {
      return Array.from(this.candles.values()).sort(
        (a, b) => a.index.value - b.index.value
      );
    } catch (error) {
      secureLogger.error('Failed to find all candles', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  async findBySessionId(sessionId: string): Promise<CandleEntity[]> {
    try {
      const candleIds = this.indexBySession.get(sessionId) || new Set();
      const candles = Array.from(candleIds)
        .map(id => this.candles.get(id))
        .filter((candle): candle is CandleEntity => candle !== undefined)
        .sort((a, b) => a.index.value - b.index.value);

      return candles;
    } catch (error) {
      secureLogger.error('Failed to find candles by session ID', {
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  async findByIndexRange(
    sessionId: string, 
    startIndex: number, 
    endIndex: number
  ): Promise<CandleEntity[]> {
    try {
      const sessionCandles = await this.findBySessionId(sessionId);
      return sessionCandles.filter(
        candle => candle.index.value >= startIndex && candle.index.value <= endIndex
      );
    } catch (error) {
      secureLogger.error('Failed to find candles by index range', {
        sessionId,
        startIndex,
        endIndex,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  async create(data: CreateCandleData): Promise<CandleEntity> {
    try {
      // Validate input data
      const validatedData = InputValidator.validateCandleData({
        timestamp: data.timestamp,
        open: data.open,
        high: data.high,
        low: data.low,
        close: data.close,
        volume: data.volume
      });

      if (!validatedData) {
        throw new ValidationError('Invalid candle data', 'candle_data', 'VALIDATION_FAILED');
      }

      // Check for duplicate candle index in session
      const existingCandles = await this.findBySessionId(data.session_id);
      const duplicateIndex = existingCandles.find(c => c.index.value === data.candle_index);
      
      if (duplicateIndex) {
        throw new ValidationError(
          'Candle with this index already exists in session',
          'candle_index',
          'DUPLICATE_CANDLE_INDEX'
        );
      }

      // Create value objects
      const id = CandleValueObjects.candleId(SecureRandom.uuid());
      const index = CandleValueObjects.candleIndex(data.candle_index);
      const ohlcv = CandleValueObjects.ohlcv(
        validatedData.open,
        validatedData.high,
        validatedData.low,
        validatedData.close,
        validatedData.volume || 0
      );

      // Create candle entity
      const candle: CandleEntity = {
        id,
        index,
        sessionId: data.session_id,
        timestamp: new Date(validatedData.timestamp),
        ohlcv,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          source: data.source || 'manual',
          validated: true,
          quality: this.assessDataQuality(ohlcv)
        }
      };

      // Store candle
      this.candles.set(id.value, candle);
      
      // Update session index
      if (!this.indexBySession.has(data.session_id)) {
        this.indexBySession.set(data.session_id, new Set());
      }
      this.indexBySession.get(data.session_id)!.add(id.value);

      secureLogger.info('Candle created successfully', {
        candleId: id.value,
        sessionId: data.session_id,
        index: data.candle_index,
        price: validatedData.close
      });

      return candle;
    } catch (error) {
      secureLogger.error('Failed to create candle', {
        data,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async save(entity: CandleEntity): Promise<Result<CandleEntity>> {
    try {
      const updatedEntity = {
        ...entity,
        metadata: {
          ...entity.metadata,
          updatedAt: new Date()
        }
      };

      this.candles.set(entity.id.value, updatedEntity);

      secureLogger.debug('Candle saved successfully', {
        candleId: entity.id.value
      });

      return { success: true, data: updatedEntity };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      secureLogger.error('Failed to save candle', {
        candleId: entity.id.value,
        error: errorMessage
      });
      return { success: false, error: new Error(errorMessage) };
    }
  }

  async update(id: string, updates: UpdateCandleData): Promise<CandleEntity> {
    try {
      const existingCandle = this.candles.get(id);
      if (!existingCandle) {
        throw new ValidationError('Candle not found', 'candle_id', 'CANDLE_NOT_FOUND');
      }

      // Validate OHLCV updates if provided
      let newOhlcv = existingCandle.ohlcv;
      if (updates.open || updates.high || updates.low || updates.close || updates.volume !== undefined) {
        newOhlcv = CandleValueObjects.ohlcv(
          updates.open ?? existingCandle.ohlcv.open.value,
          updates.high ?? existingCandle.ohlcv.high.value,
          updates.low ?? existingCandle.ohlcv.low.value,
          updates.close ?? existingCandle.ohlcv.close.value,
          updates.volume ?? existingCandle.ohlcv.volume.value
        );
      }

      // Update prediction if provided
      let newPrediction = existingCandle.prediction;
      if (updates.prediction_direction || updates.prediction_probability || updates.prediction_confidence) {
        newPrediction = {
          direction: updates.prediction_direction || existingCandle.prediction?.direction || 'UP',
          probability: updates.prediction_probability || existingCandle.prediction?.probability || 50,
          confidence: updates.prediction_confidence || existingCandle.prediction?.confidence || 50,
          interval: existingCandle.prediction?.interval || 5,
          factors: existingCandle.prediction?.factors || {
            technical: 50,
            volume: 50,
            momentum: 50,
            volatility: 50,
            pattern: 50,
            trend: 50
          }
        };
      }

      // Create updated candle
      const updatedCandle: CandleEntity = {
        ...existingCandle,
        ohlcv: newOhlcv,
        prediction: newPrediction,
        metadata: {
          ...existingCandle.metadata,
          updatedAt: new Date(),
          quality: this.assessDataQuality(newOhlcv)
        }
      };

      this.candles.set(id, updatedCandle);

      secureLogger.info('Candle updated successfully', {
        candleId: id,
        updates: Object.keys(updates)
      });

      return updatedCandle;
    } catch (error) {
      secureLogger.error('Failed to update candle', {
        candleId: id,
        updates,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      const existingCandle = this.candles.get(id);
      if (!existingCandle) {
        throw new ValidationError('Candle not found', 'candle_id', 'CANDLE_NOT_FOUND');
      }

      // Remove from session index
      const sessionCandles = this.indexBySession.get(existingCandle.sessionId);
      if (sessionCandles) {
        sessionCandles.delete(id);
        if (sessionCandles.size === 0) {
          this.indexBySession.delete(existingCandle.sessionId);
        }
      }

      this.candles.delete(id);

      secureLogger.info('Candle deleted successfully', {
        candleId: id,
        sessionId: existingCandle.sessionId
      });

      return { success: true, data: undefined };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      secureLogger.error('Failed to delete candle', {
        candleId: id,
        error: errorMessage
      });
      return { success: false, error: new Error(errorMessage) };
    }
  }

  async deleteBySessionId(sessionId: string): Promise<Result<void>> {
    try {
      const candleIds = this.indexBySession.get(sessionId) || new Set();
      
      for (const candleId of candleIds) {
        this.candles.delete(candleId);
      }
      
      this.indexBySession.delete(sessionId);

      secureLogger.info('Session candles deleted successfully', {
        sessionId,
        deletedCount: candleIds.size
      });

      return { success: true, data: undefined };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      secureLogger.error('Failed to delete session candles', {
        sessionId,
        error: errorMessage
      });
      return { success: false, error: new Error(errorMessage) };
    }
  }

  async getLatestCandle(sessionId: string): Promise<CandleEntity | null> {
    try {
      const candles = await this.findBySessionId(sessionId);
      if (candles.length === 0) return null;
      
      return candles[candles.length - 1];
    } catch (error) {
      secureLogger.error('Failed to get latest candle', {
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  async getSessionSummary(sessionId: string): Promise<{
    totalCandles: number;
    priceRange: { min: number; max: number } | null;
    volumeStats: { min: number; max: number; avg: number } | null;
    lastPrice: number | null;
  }> {
    try {
      const candles = await this.findBySessionId(sessionId);
      
      if (candles.length === 0) {
        return {
          totalCandles: 0,
          priceRange: null,
          volumeStats: null,
          lastPrice: null
        };
      }

      const prices = candles.map(c => c.ohlcv.close.value);
      const volumes = candles.map(c => c.ohlcv.volume.value);

      return {
        totalCandles: candles.length,
        priceRange: {
          min: Math.min(...prices),
          max: Math.max(...prices)
        },
        volumeStats: {
          min: Math.min(...volumes),
          max: Math.max(...volumes),
          avg: volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length
        },
        lastPrice: prices[prices.length - 1]
      };
    } catch (error) {
      secureLogger.error('Failed to get session summary', {
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return {
        totalCandles: 0,
        priceRange: null,
        volumeStats: null,
        lastPrice: null
      };
    }
  }

  // Bulk operations
  async bulkCreate(candles: CreateCandleData[]): Promise<CandleEntity[]> {
    try {
      const createdCandles: CandleEntity[] = [];
      
      for (const candleData of candles) {
        const candle = await this.create(candleData);
        createdCandles.push(candle);
      }

      secureLogger.info('Bulk candle creation completed', {
        count: createdCandles.length
      });

      return createdCandles;
    } catch (error) {
      secureLogger.error('Bulk candle creation failed', {
        count: candles.length,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private assessDataQuality(ohlcv: CandleEntity['ohlcv']): 'high' | 'medium' | 'low' {
    const { open, high, low, close, volume } = ohlcv;
    
    // Basic quality checks
    const hasVolume = volume.value > 0;
    const priceSpread = (high.value - low.value) / close.value;
    const isReasonableSpread = priceSpread < 0.1; // Less than 10% spread
    
    if (hasVolume && isReasonableSpread) return 'high';
    if (hasVolume || isReasonableSpread) return 'medium';
    return 'low';
  }

  // Clear all candles (for testing/reset)
  async clear(): Promise<void> {
    try {
      this.candles.clear();
      this.indexBySession.clear();
      secureLogger.info('All candles cleared');
    } catch (error) {
      secureLogger.error('Failed to clear candles', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
}

// Singleton instance
export const candleRepository = new CandleRepository();
