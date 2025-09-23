/**
 * Prediction Engine Service
 * High-performance prediction service with ensemble models and caching
 * Separated from monolithic service for better performance and maintainability
 */

import { CandleData } from '@/types/session';
import { PredictionResult, PredictionConfig } from '@/types/trading';
import { NetworkWeights } from './NetworkTrainingService';
import { FeatureSet, featureExtractionService } from './FeatureExtractionService';
import { logger } from '@/utils/logger';
import { errorHandler, ErrorCategory } from '@/utils/errorHandler';

export interface PredictionContext {
  modelVersion: string;
  confidence: number;
  signalStrength: number;
  features: FeatureSet;
  processingTime: number;
}

export interface EnsembleModel {
  id: string;
  weights: NetworkWeights;
  accuracy: number;
  weight: number; // Ensemble weight based on performance
  lastUpdated: number;
}

export interface PredictionCache {
  key: string;
  result: PredictionResult;
  context: PredictionContext;
  timestamp: number;
  candleIndex: number;
}

export class PredictionEngineService {
  private static instance: PredictionEngineService;
  private ensembleModels: Map<string, EnsembleModel> = new Map();
  private predictionCache: Map<string, PredictionCache> = new Map();
  private performanceMetrics: Map<string, number[]> = new Map();
  private readonly maxCacheSize = 500;
  private readonly cacheExpiryMs = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    this.initializeDefaultModel();
  }

  static getInstance(): PredictionEngineService {
    if (!PredictionEngineService.instance) {
      PredictionEngineService.instance = new PredictionEngineService();
    }
    return PredictionEngineService.instance;
  }

  /**
   * Generate prediction using ensemble of models with caching
   */
  async generatePrediction(
    candles: CandleData[],
    currentIndex: number,
    config: PredictionConfig
  ): Promise<PredictionResult | null> {
    return errorHandler.safeExecute(async () => {
      const startTime = performance.now();
      
      // Validate inputs
      if (candles.length < 20 || currentIndex < 19) {
        return null;
      }

      // Check cache first
      const cacheKey = this.generateCacheKey(candles, currentIndex, config);
      const cached = this.getCachedPrediction(cacheKey);
      if (cached) {
        logger.debug('Prediction cache hit', { currentIndex, cacheKey });
        return cached.result;
      }

      // Extract features
      const features = await featureExtractionService.extractFeatures(
        candles,
        currentIndex,
        {
          lookbackPeriod: 20,
          includeVolume: true,
          includeMomentum: true,
          includePatterns: true,
          normalizationMethod: 'zscore'
        }
      );

      if (!features) {
        return null;
      }

      // Generate ensemble prediction
      const ensemblePrediction = await this.generateEnsemblePrediction(features, config);
      
      if (!ensemblePrediction) {
        return null;
      }

      const processingTime = performance.now() - startTime;

      // Create prediction context
      const context: PredictionContext = {
        modelVersion: this.getEnsembleVersion(),
        confidence: ensemblePrediction.confidence,
        signalStrength: ensemblePrediction.signalStrength,
        features,
        processingTime
      };

      // Generate final prediction result
      const result: PredictionResult = {
        direction: ensemblePrediction.direction,
        probability: ensemblePrediction.probability,
        confidence: ensemblePrediction.confidence,
        interval: config.predictionInterval,
        factors: this.generateFactors(features, ensemblePrediction),
        recommendation: this.generateRecommendation(
          ensemblePrediction.direction,
          ensemblePrediction.probability,
          ensemblePrediction.confidence,
          features
        )
      };

      // Cache the prediction
      this.cachePrediction(cacheKey, result, context, currentIndex);

      // Log prediction
      logger.mlPrediction(
        result.direction,
        result.probability,
        result.confidence,
        context.modelVersion
      );

      return result;

    }, ErrorCategory.ML_PREDICTION, {
      operation: 'prediction-generation',
      currentIndex,
      candleCount: candles.length
    });
  }

  /**
   * Generate prediction using ensemble of models
   */
  private async generateEnsemblePrediction(
    features: FeatureSet,
    config: PredictionConfig
  ): Promise<{
    direction: 'UP' | 'DOWN';
    probability: number;
    confidence: number;
    signalStrength: number;
  } | null> {
    const inputVector = featureExtractionService.flattenFeatures(features, 30);
    const normalizedInput = this.normalizeVector(inputVector);

    if (this.ensembleModels.size === 0) {
      return null;
    }

    let weightedSum = 0;
    let totalWeight = 0;
    let confidenceSum = 0;
    const predictions: Array<{ output: number; weight: number; confidence: number }> = [];

    // Get predictions from all models
    for (const [modelId, model] of this.ensembleModels) {
      try {
        const { output } = this.feedForward(normalizedInput, model.weights);
        const probability = this.sigmoid(output);
        const confidence = this.calculateModelConfidence(probability, features, model);
        
        predictions.push({
          output: probability,
          weight: model.weight,
          confidence
        });

        weightedSum += probability * model.weight;
        totalWeight += model.weight;
        confidenceSum += confidence * model.weight;

      } catch (error) {
        logger.warn('Model prediction failed', { modelId, error });
        continue;
      }
    }

    if (totalWeight === 0) {
      return null;
    }

    // Calculate ensemble prediction
    const ensembleProbability = weightedSum / totalWeight;
    const ensembleConfidence = confidenceSum / totalWeight;
    const direction = ensembleProbability > 0.5 ? 'UP' : 'DOWN';
    const adjustedProbability = direction === 'UP' ? ensembleProbability * 100 : (1 - ensembleProbability) * 100;
    
    // Calculate signal strength
    const signalStrength = this.calculateSignalStrength(predictions, features);

    // Apply confidence modifiers
    const finalConfidence = this.applyConfidenceModifiers(
      ensembleConfidence,
      signalStrength,
      features,
      config
    );

    return {
      direction,
      probability: Math.round(adjustedProbability * 10) / 10,
      confidence: Math.round(finalConfidence * 10) / 10,
      signalStrength
    };
  }

  /**
   * Neural network forward pass
   */
  private feedForward(input: number[], weights: NetworkWeights): { hiddenOutputs: number[]; output: number } {
    // Hidden layer
    const hiddenOutputs = weights.hidden_bias.map((bias, i) => {
      let sum = bias;
      for (let j = 0; j < input.length; j++) {
        sum += input[j] * weights.input_hidden[j][i];
      }
      return this.relu(sum);
    });

    // Output layer
    let output = weights.output_bias;
    for (let i = 0; i < hiddenOutputs.length; i++) {
      output += hiddenOutputs[i] * weights.hidden_output[i];
    }

    return { hiddenOutputs, output };
  }

  /**
   * Calculate model-specific confidence
   */
  private calculateModelConfidence(
    probability: number,
    features: FeatureSet,
    model: EnsembleModel
  ): number {
    // Base confidence from signal strength
    const signalStrength = Math.abs(probability - 0.5) * 2;
    let confidence = 60 + (signalStrength * 20);

    // Model accuracy modifier
    confidence *= (0.5 + model.accuracy * 0.5);

    // Feature-based modifiers
    if (features.pattern.length > 0 && features.pattern[0] > 0.7) confidence += 5;
    if (features.volume.length > 2 && features.volume[2] !== 0) confidence += 3;
    if (features.momentum.length > 0 && Math.abs(features.momentum[0]) > 0.5) confidence += 2;

    // Technical agreement
    const technicalAgreement = this.calculateTechnicalAgreement(features.technical);
    confidence += technicalAgreement * 10;

    return Math.min(95, Math.max(50, confidence));
  }

  /**
   * Calculate signal strength from ensemble predictions
   */
  private calculateSignalStrength(
    predictions: Array<{ output: number; weight: number; confidence: number }>,
    features: FeatureSet
  ): number {
    // Measure prediction consensus
    const probabilities = predictions.map(p => p.output);
    const mean = probabilities.reduce((sum, p) => sum + p, 0) / probabilities.length;
    const variance = probabilities.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / probabilities.length;
    const consensus = 1 - Math.sqrt(variance); // Low variance = high consensus

    // Signal strength from features
    const technicalStrength = Math.abs(features.technical[0] || 0); // RSI deviation
    const momentumStrength = Math.abs(features.momentum[0] || 0); // Price momentum
    const volumeStrength = Math.abs(features.volume[0] || 0); // Volume indicator

    const combinedStrength = (consensus * 0.4) + (technicalStrength * 0.3) + 
                            (momentumStrength * 0.2) + (volumeStrength * 0.1);

    return Math.min(1, Math.max(0, combinedStrength));
  }

  /**
   * Apply confidence modifiers based on market conditions
   */
  private applyConfidenceModifiers(
    baseConfidence: number,
    signalStrength: number,
    features: FeatureSet,
    config: PredictionConfig
  ): number {
    let adjustedConfidence = baseConfidence;

    // Signal strength modifier
    adjustedConfidence *= (0.7 + signalStrength * 0.3);

    // Time interval modifier (shorter intervals = less confidence)
    const intervalModifier = {
      '1m': 0.8,
      '5m': 0.9,
      '15m': 0.95,
      '30m': 1.0,
      '1h': 1.05,
      '4h': 1.1,
      '1d': 1.15
    };
    adjustedConfidence *= intervalModifier[config.predictionInterval] || 1.0;

    // Volatility modifier
    if (features.price.length > 5) {
      const volatility = features.price[5]; // Volatility feature
      if (Math.abs(volatility) > 0.8) {
        adjustedConfidence *= 0.9; // Reduce confidence in high volatility
      }
    }

    return Math.min(95, Math.max(55, adjustedConfidence));
  }

  /**
   * Calculate technical agreement between indicators
   */
  private calculateTechnicalAgreement(technical: number[]): number {
    if (technical.length < 3) return 0;

    const signals = [
      technical[0] > 0.4 ? 1 : technical[0] < -0.4 ? -1 : 0, // RSI
      technical[1] > technical[2] ? 1 : -1, // MACD line vs signal
      technical[4] > 0.6 ? 1 : technical[4] < -0.6 ? -1 : 0  // Stochastic
    ];

    const agreement = Math.abs(signals.reduce((sum, signal) => sum + signal, 0)) / signals.length;
    return agreement;
  }

  /**
   * Generate trading factors for the prediction
   */
  private generateFactors(features: FeatureSet, prediction: any): any {
    return {
      technical_strength: features.technical[0] || 0, // RSI normalized
      momentum_factor: features.momentum[0] || 0,
      pattern_confidence: features.pattern[0] || 0,
      volume_factor: features.volume[0] || 0,
      trend_factor: features.price[4] || 0,
      signal_strength: prediction.signalStrength,
      ensemble_consensus: prediction.confidence / 100
    };
  }

  /**
   * Generate human-readable recommendation
   */
  private generateRecommendation(
    direction: 'UP' | 'DOWN',
    probability: number,
    confidence: number,
    features: FeatureSet
  ): string {
    const strength = probability > 75 ? 'strong' : probability > 65 ? 'moderate' : 'weak';
    const confidenceLevel = confidence > 80 ? 'high' : confidence > 70 ? 'medium' : 'low';
    
    let recommendation = `${strength.charAt(0).toUpperCase() + strength.slice(1)} ${direction.toLowerCase()} signal (${probability.toFixed(1)}%) with ${confidenceLevel} confidence.`;
    
    // Add pattern information
    if (features.pattern.length > 0 && features.pattern[0] > 0.5) {
      recommendation += ' Pattern detected.';
    }
    
    // Add volume information
    if (features.volume.length > 2 && features.volume[2] !== 0) {
      recommendation += ` Volume ${features.volume[2] > 0 ? 'increasing' : 'decreasing'}.`;
    }
    
    return recommendation;
  }

  // Model management
  addModel(id: string, weights: NetworkWeights, accuracy: number): void {
    const model: EnsembleModel = {
      id,
      weights: this.deepCopyWeights(weights),
      accuracy: Math.max(0.5, Math.min(1.0, accuracy)), // Clamp between 0.5 and 1.0
      weight: this.calculateModelWeight(accuracy),
      lastUpdated: Date.now()
    };

    this.ensembleModels.set(id, model);
    this.rebalanceEnsemble();

    logger.info('Model added to ensemble', {
      modelId: id,
      accuracy,
      weight: model.weight,
      ensembleSize: this.ensembleModels.size
    });
  }

  removeModel(id: string): boolean {
    const removed = this.ensembleModels.delete(id);
    if (removed) {
      this.rebalanceEnsemble();
      logger.info('Model removed from ensemble', { modelId: id });
    }
    return removed;
  }

  updateModelAccuracy(id: string, accuracy: number): void {
    const model = this.ensembleModels.get(id);
    if (model) {
      model.accuracy = Math.max(0.5, Math.min(1.0, accuracy));
      model.weight = this.calculateModelWeight(accuracy);
      model.lastUpdated = Date.now();
      this.rebalanceEnsemble();
      
      logger.info('Model accuracy updated', { modelId: id, accuracy, newWeight: model.weight });
    }
  }

  private calculateModelWeight(accuracy: number): number {
    // Weight models based on their accuracy with exponential scaling
    return Math.pow(accuracy, 3);
  }

  private rebalanceEnsemble(): void {
    if (this.ensembleModels.size === 0) return;

    const totalWeight = Array.from(this.ensembleModels.values())
      .reduce((sum, model) => sum + model.weight, 0);

    // Normalize weights to sum to 1
    for (const model of this.ensembleModels.values()) {
      model.weight = model.weight / totalWeight;
    }
  }

  private initializeDefaultModel(): void {
    // This would be loaded from storage in a real implementation
    const defaultWeights = this.createDefaultWeights(30, 64);
    this.addModel('default', defaultWeights, 0.6);
  }

  private createDefaultWeights(inputSize: number, hiddenSize: number): NetworkWeights {
    return {
      input_hidden: Array(inputSize).fill(0).map(() => Array(hiddenSize).fill(0.1)),
      hidden_output: Array(hiddenSize).fill(0.1),
      hidden_bias: Array(hiddenSize).fill(0),
      output_bias: 0
    };
  }

  // Cache management
  private generateCacheKey(candles: CandleData[], currentIndex: number, config: PredictionConfig): string {
    const recentCandles = candles.slice(Math.max(0, currentIndex - 5), currentIndex + 1);
    const candleHash = recentCandles.map(c => `${c.close.toFixed(2)}_${c.volume}`).join('|');
    return `${currentIndex}_${candleHash}_${JSON.stringify(config)}`;
  }

  private getCachedPrediction(key: string): PredictionCache | null {
    const cached = this.predictionCache.get(key);
    if (!cached) return null;

    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.cacheExpiryMs) {
      this.predictionCache.delete(key);
      return null;
    }

    return cached;
  }

  private cachePrediction(
    key: string,
    result: PredictionResult,
    context: PredictionContext,
    candleIndex: number
  ): void {
    const cache: PredictionCache = {
      key,
      result,
      context,
      timestamp: Date.now(),
      candleIndex
    };

    this.predictionCache.set(key, cache);

    // Manage cache size
    if (this.predictionCache.size > this.maxCacheSize) {
      const oldestKey = this.predictionCache.keys().next().value;
      this.predictionCache.delete(oldestKey);
    }
  }

  // Utility functions
  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
  }

  private relu(x: number): number {
    return Math.max(0, x);
  }

  private normalizeVector(vector: number[]): number[] {
    const mean = vector.reduce((sum, val) => sum + val, 0) / vector.length;
    const std = Math.sqrt(vector.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / vector.length);
    
    if (std === 0) return vector;
    return vector.map(val => (val - mean) / std);
  }

  private deepCopyWeights(weights: NetworkWeights): NetworkWeights {
    return {
      input_hidden: weights.input_hidden.map(row => [...row]),
      hidden_output: [...weights.hidden_output],
      hidden_bias: [...weights.hidden_bias],
      output_bias: weights.output_bias
    };
  }

  private getEnsembleVersion(): string {
    return `ensemble_v1.0_${this.ensembleModels.size}models`;
  }

  // Public getters for monitoring
  getEnsembleInfo(): {
    modelCount: number;
    models: Array<{ id: string; accuracy: number; weight: number }>;
    cacheSize: number;
    cacheHitRate: number;
  } {
    const models = Array.from(this.ensembleModels.values()).map(model => ({
      id: model.id,
      accuracy: model.accuracy,
      weight: model.weight
    }));

    return {
      modelCount: this.ensembleModels.size,
      models,
      cacheSize: this.predictionCache.size,
      cacheHitRate: 0 // TODO: Implement hit rate tracking
    };
  }

  clearCache(): void {
    this.predictionCache.clear();
  }

  clearModels(): void {
    this.ensembleModels.clear();
    this.initializeDefaultModel();
  }
}

export const predictionEngineService = PredictionEngineService.getInstance();