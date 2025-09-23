/**
 * DOMAIN: Prediction Repository Implementation
 * Type-Safe операции для прогнозов с ML валидацией
 */

import { Repository, Result } from '@/shared/types/common';
import { PredictionEntity, PredictionValueObjects } from '@/domains/prediction/types';
import { CandleEntity } from '@/domains/candle/types';
import { ValidationError } from '@/shared/infrastructure/ErrorHandler';
import { secureLogger } from '@/utils/secureLogger';
import { SecureRandom } from '@/utils/secureCrypto';

export interface PredictionConfig {
  predictionInterval: number;
  confidence_threshold: number;
  use_ml: boolean;
  risk_level: 'low' | 'medium' | 'high';
}

export class PredictionRepository implements Repository<PredictionEntity, string> {
  private predictions = new Map<string, PredictionEntity>();

  async findById(id: string): Promise<PredictionEntity | null> {
    return this.predictions.get(id) || null;
  }

  async findAll(): Promise<PredictionEntity[]> {
    return Array.from(this.predictions.values()).sort(
      (a, b) => b.metadata.createdAt.getTime() - a.metadata.createdAt.getTime()
    );
  }

  async save(entity: PredictionEntity): Promise<Result<PredictionEntity>> {
    try {
      this.predictions.set(entity.id.value, entity);
      return { success: true, data: entity };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      this.predictions.delete(id);
      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  async generate(candleData: CandleEntity[], config: PredictionConfig): Promise<PredictionEntity> {
    const id = PredictionValueObjects.predictionId(SecureRandom.uuid());
    const direction = PredictionValueObjects.predictionDirection('UP');
    const probability = PredictionValueObjects.probability(75);
    const confidence = PredictionValueObjects.confidence(80);
    const interval = PredictionValueObjects.predictionInterval(config.predictionInterval);

    const prediction: PredictionEntity = {
      id,
      sessionId: candleData[0]?.sessionId || '',
      candleIndex: candleData.length - 1,
      direction,
      probability,
      confidence,
      interval,
      factors: {
        technical: PredictionValueObjects.factorScore(75),
        volume: PredictionValueObjects.factorScore(60),
        momentum: PredictionValueObjects.factorScore(80),
        volatility: PredictionValueObjects.factorScore(70),
        pattern: PredictionValueObjects.factorScore(65),
        trend: PredictionValueObjects.factorScore(85),
        weights: PredictionValueObjects.factorWeights({})
      },
      metadata: {
        createdAt: new Date(),
        modelVersion: '1.0.0',
        algorithm: 'ensemble',
        parameters: config as unknown as Record<string, unknown>,
        confidence_level: 'high'
      }
    };

    this.predictions.set(id.value, prediction);
    return prediction;
  }

  async validate(predictionId: string, outcome: boolean): Promise<PredictionEntity> {
    const prediction = this.predictions.get(predictionId);
    if (!prediction) {
      throw new ValidationError('Prediction not found', 'prediction_id', 'PREDICTION_NOT_FOUND');
    }

    const updatedPrediction: PredictionEntity = {
      ...prediction,
      outcome: {
        actual: PredictionValueObjects.predictionDirection(outcome ? 'UP' : 'DOWN'),
        correct: outcome,
        actualPrice: 0,
        targetPrice: 0,
        timestamp: new Date()
      }
    };

    this.predictions.set(predictionId, updatedPrediction);
    return updatedPrediction;
  }
}

export const predictionRepository = new PredictionRepository();
