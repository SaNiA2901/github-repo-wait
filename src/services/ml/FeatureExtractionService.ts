/**
 * Feature Extraction Service
 * Modular service for extracting and engineering features from candle data
 * Separated from monolithic RealMLService for better maintainability
 */

import { CandleData } from '@/types/session';
import { TechnicalIndicatorService } from '../indicators/TechnicalIndicators';
import { PatternAnalysisService } from '../patterns/PatternAnalysis';
import { logger } from '@/utils/logger';
import { errorHandler, ErrorCategory } from '@/utils/errorHandler';

export interface FeatureSet {
  technical: number[];
  pattern: number[];
  volume: number[];
  price: number[];
  momentum: number[];
  timestamp: number;
  candleIndex: number;
}

export interface FeatureExtractionConfig {
  lookbackPeriod: number;
  includeVolume: boolean;
  includeMomentum: boolean;
  includePatterns: boolean;
  normalizationMethod: 'minmax' | 'zscore' | 'robust';
}

export class FeatureExtractionService {
  private static instance: FeatureExtractionService;
  private featureCache: Map<string, FeatureSet> = new Map();
  private readonly maxCacheSize = 1000;

  private constructor() {}

  static getInstance(): FeatureExtractionService {
    if (!FeatureExtractionService.instance) {
      FeatureExtractionService.instance = new FeatureExtractionService();
    }
    return FeatureExtractionService.instance;
  }

  /**
   * Extract comprehensive features from candle data
   * CRITICAL: Ensures no look-ahead bias by only using data up to currentIndex
   */
  async extractFeatures(
    candles: CandleData[], 
    currentIndex: number,
    config: FeatureExtractionConfig = this.getDefaultConfig()
  ): Promise<FeatureSet | null> {
    return errorHandler.safeExecute(async () => {
      // Validate inputs
      if (currentIndex < 0 || currentIndex >= candles.length) {
        throw new Error(`Invalid currentIndex: ${currentIndex}`);
      }

      if (candles.length < config.lookbackPeriod) {
        return null;
      }

      const cacheKey = this.generateCacheKey(candles, currentIndex, config);
      
      // Check cache
      if (this.featureCache.has(cacheKey)) {
        const cached = this.featureCache.get(cacheKey)!;
        logger.debug('Feature cache hit', { currentIndex, cacheKey });
        return cached;
      }

      logger.timeStart(`feature-extraction-${currentIndex}`);

      // TEMPORAL SAFETY: Only use candles up to currentIndex (no future data)
      const lookback = Math.min(config.lookbackPeriod, currentIndex);
      const historicalCandles = candles.slice(Math.max(0, currentIndex - lookback), currentIndex + 1);
      const current = candles[currentIndex];

      // Extract different feature categories
      const [technical, patterns, volume] = await Promise.all([
        this.extractTechnicalFeatures(candles, currentIndex),
        config.includePatterns ? this.extractPatternFeatures(candles, currentIndex) : [],
        config.includeVolume ? this.extractVolumeFeatures(historicalCandles) : []
      ]);

      const price = this.extractPriceFeatures(historicalCandles);
      const momentum = config.includeMomentum ? this.extractMomentumFeatures(historicalCandles) : [];

      const featureSet: FeatureSet = {
        technical,
        pattern: patterns,
        volume,
        price,
        momentum,
        timestamp: typeof current.timestamp === 'number' ? current.timestamp : Date.now(),
        candleIndex: currentIndex
      };

      // Normalize features
      this.normalizeFeatures(featureSet, config.normalizationMethod);

      // Cache result
      this.cacheFeatures(cacheKey, featureSet);

      logger.timeEnd(`feature-extraction-${currentIndex}`);
      
      return featureSet;

    }, ErrorCategory.DATA_PROCESSING, { 
      operation: 'feature-extraction',
      currentIndex,
      candleCount: candles.length 
    });
  }

  /**
   * Extract technical indicator features
   */
  private async extractTechnicalFeatures(candles: CandleData[], currentIndex: number): Promise<number[]> {
    const technical = await TechnicalIndicatorService.calculateAll(candles, currentIndex);
    const current = candles[currentIndex];
    
    return [
      this.normalize(technical.rsi, 0, 100),
      this.normalize(technical.macd.line, -1, 1),
      this.normalize(technical.macd.signal, -1, 1),
      this.normalize(technical.macd.histogram, -0.5, 0.5),
      this.normalize(technical.stochastic.k, 0, 100),
      this.normalize(technical.stochastic.d, 0, 100),
      this.normalize(technical.adx, 0, 100),
      this.normalize(technical.bollingerBands.upper - technical.bollingerBands.lower, 0, current.close * 0.2),
      this.calculateBBPosition(current.close, technical.bollingerBands)
    ];
  }

  /**
   * Extract pattern-based features
   */
  private extractPatternFeatures(candles: CandleData[], currentIndex: number): number[] {
    const patterns = PatternAnalysisService.analyzePatterns(candles, currentIndex);
    
    return [
      patterns.strength,
      patterns.isReversal ? 1 : 0,
      patterns.isContinuation ? 1 : 0,
      this.encodePattern(patterns.candlestickPattern),
      this.calculatePatternReliability(patterns),
      this.calculatePatternFrequency(patterns)
    ];
  }

  /**
   * Extract volume-based features
   */
  private extractVolumeFeatures(candles: CandleData[]): number[] {
    if (candles.length === 0) return [0, 0, 0, 0];

    const volumes = candles.map(c => c.volume);
    const avgVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
    const currentVolume = candles[candles.length - 1].volume;
    
    const volumeRatio = avgVolume > 0 ? currentVolume / avgVolume : 1;
    const volumeTrend = this.calculateVolumeTrend(volumes);
    const volumeOscillator = this.calculateVolumeOscillator(volumes);
    const onBalanceVolume = this.calculateOBV(candles);

    return [
      this.normalize(volumeRatio, 0.1, 5),
      this.normalize(volumeTrend, -1, 1),
      this.normalize(volumeOscillator, -100, 100),
      this.normalize(onBalanceVolume, -1000000, 1000000)
    ];
  }

  /**
   * Extract price-based features
   */
  private extractPriceFeatures(candles: CandleData[]): number[] {
    if (candles.length === 0) return [0, 0, 0, 0, 0, 0];

    const current = candles[candles.length - 1];
    
    return [
      this.normalize(current.open / current.close, 0.95, 1.05),
      this.normalize(current.high / current.close, 1, 1.1),
      this.normalize(current.low / current.close, 0.9, 1),
      this.calculatePriceVelocity(candles),
      this.calculateTrendStrength(candles),
      this.calculateVolatility(candles)
    ];
  }

  /**
   * Extract momentum-based features
   */
  private extractMomentumFeatures(candles: CandleData[]): number[] {
    return [
      this.calculateMomentum(candles, 1),
      this.calculateMomentum(candles, 3),
      this.calculateMomentum(candles, 5),
      this.calculateMomentum(candles, 10),
      this.calculateAcceleration(candles),
      this.calculateMeanReversion(candles)
    ];
  }

  /**
   * Flatten features into a single vector for ML model
   */
  flattenFeatures(features: FeatureSet, targetSize: number = 30): number[] {
    const flattened = [
      ...features.technical,
      ...features.pattern,
      ...features.volume,
      ...features.price,
      ...features.momentum
    ];

    // Pad or truncate to target size
    if (flattened.length > targetSize) {
      return flattened.slice(0, targetSize);
    } else if (flattened.length < targetSize) {
      const padding = new Array(targetSize - flattened.length).fill(0);
      return [...flattened, ...padding];
    }

    return flattened;
  }

  /**
   * Normalize features using different methods
   */
  private normalizeFeatures(features: FeatureSet, method: 'minmax' | 'zscore' | 'robust'): void {
    const arrays = [features.technical, features.pattern, features.volume, features.price, features.momentum];
    
    arrays.forEach(array => {
      if (array.length === 0) return;
      
      switch (method) {
        case 'minmax':
          this.minMaxNormalize(array);
          break;
        case 'zscore':
          this.zScoreNormalize(array);
          break;
        case 'robust':
          this.robustNormalize(array);
          break;
      }
    });
  }

  // Utility normalization methods
  private normalize(value: number, min: number, max: number): number {
    if (max === min) return 0;
    return Math.max(-1, Math.min(1, (value - min) / (max - min) * 2 - 1));
  }

  private minMaxNormalize(array: number[]): void {
    const min = Math.min(...array);
    const max = Math.max(...array);
    if (max === min) return;
    
    for (let i = 0; i < array.length; i++) {
      array[i] = (array[i] - min) / (max - min) * 2 - 1;
    }
  }

  private zScoreNormalize(array: number[]): void {
    const mean = array.reduce((sum, val) => sum + val, 0) / array.length;
    const std = Math.sqrt(array.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / array.length);
    
    if (std === 0) return;
    
    for (let i = 0; i < array.length; i++) {
      array[i] = (array[i] - mean) / std;
    }
  }

  private robustNormalize(array: number[]): void {
    const sorted = [...array].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const mad = sorted.map(x => Math.abs(x - median)).sort((a, b) => a - b)[Math.floor(sorted.length / 2)];
    
    if (mad === 0) return;
    
    for (let i = 0; i < array.length; i++) {
      array[i] = (array[i] - median) / mad;
    }
  }

  // Feature calculation helpers
  private calculateBBPosition(price: number, bb: any): number {
    if (bb.upper === bb.lower) return 0.5;
    return (price - bb.lower) / (bb.upper - bb.lower);
  }

  private encodePattern(pattern: string | null): number {
    const patterns: { [key: string]: number } = {
      'Doji': 0.1, 'Hammer': 0.2, 'Shooting Star': 0.3,
      'Bullish Engulfing': 0.4, 'Bearish Engulfing': 0.5,
      'Three White Soldiers': 0.6, 'Three Black Crows': 0.7
    };
    return pattern ? (patterns[pattern] || 0) : 0;
  }

  private calculatePatternReliability(patterns: any): number {
    // Implementation for pattern reliability calculation
    return patterns.strength * 0.8 + (patterns.isReversal ? 0.2 : 0);
  }

  private calculatePatternFrequency(patterns: any): number {
    // Implementation for pattern frequency calculation
    return patterns.candlestickPattern ? 0.5 : 0;
  }

  private calculateVolumeTrend(volumes: number[]): number {
    if (volumes.length < 2) return 0;
    const recent = volumes.slice(-3);
    const older = volumes.slice(-6, -3);
    const recentAvg = recent.reduce((sum, v) => sum + v, 0) / recent.length;
    const olderAvg = older.reduce((sum, v) => sum + v, 0) / older.length;
    return olderAvg > 0 ? (recentAvg - olderAvg) / olderAvg : 0;
  }

  private calculateVolumeOscillator(volumes: number[]): number {
    if (volumes.length < 10) return 0;
    const short = volumes.slice(-5).reduce((sum, v) => sum + v, 0) / 5;
    const long = volumes.slice(-10).reduce((sum, v) => sum + v, 0) / 10;
    return long > 0 ? ((short - long) / long) * 100 : 0;
  }

  private calculateOBV(candles: CandleData[]): number {
    let obv = 0;
    for (let i = 1; i < candles.length; i++) {
      if (candles[i].close > candles[i-1].close) {
        obv += candles[i].volume;
      } else if (candles[i].close < candles[i-1].close) {
        obv -= candles[i].volume;
      }
    }
    return obv;
  }

  private calculatePriceVelocity(candles: CandleData[]): number {
    if (candles.length < 3) return 0;
    const prices = candles.map(c => c.close);
    const velocity = (prices[prices.length - 1] - prices[prices.length - 2]) - 
                     (prices[prices.length - 2] - prices[prices.length - 3]);
    return Math.tanh(velocity / prices[prices.length - 1]);
  }

  private calculateTrendStrength(candles: CandleData[]): number {
    if (candles.length < 5) return 0;
    const prices = candles.map(c => c.close);
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const totalChange = (lastPrice - firstPrice) / firstPrice;
    
    let trendCount = 0;
    for (let i = 1; i < prices.length; i++) {
      if (totalChange > 0 && prices[i] > prices[i-1]) trendCount++;
      if (totalChange < 0 && prices[i] < prices[i-1]) trendCount++;
    }
    
    const trendStrength = trendCount / (prices.length - 1);
    return Math.tanh(totalChange * trendStrength);
  }

  private calculateVolatility(candles: CandleData[]): number {
    if (candles.length < 2) return 0;
    const returns = [];
    for (let i = 1; i < candles.length; i++) {
      returns.push((candles[i].close - candles[i-1].close) / candles[i-1].close);
    }
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    return Math.tanh(Math.sqrt(variance) * 100);
  }

  private calculateMomentum(candles: CandleData[], period: number): number {
    if (candles.length <= period) return 0;
    const current = candles[candles.length - 1].close;
    const past = candles[candles.length - 1 - period].close;
    return Math.tanh((current - past) / past);
  }

  private calculateAcceleration(candles: CandleData[]): number {
    if (candles.length < 4) return 0;
    const prices = candles.map(c => c.close);
    const len = prices.length;
    const velocity1 = prices[len - 1] - prices[len - 2];
    const velocity2 = prices[len - 2] - prices[len - 3];
    const acceleration = velocity1 - velocity2;
    return Math.tanh(acceleration / prices[len - 1]);
  }

  private calculateMeanReversion(candles: CandleData[]): number {
    if (candles.length < 10) return 0;
    const prices = candles.map(c => c.close);
    const sma = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const currentPrice = prices[prices.length - 1];
    return Math.tanh((currentPrice - sma) / sma);
  }

  // Cache management
  private generateCacheKey(candles: CandleData[], currentIndex: number, config: FeatureExtractionConfig): string {
    const candleHash = candles.slice(Math.max(0, currentIndex - 20), currentIndex + 1)
      .map(c => `${c.close}_${c.volume}`)
      .join('|');
    return `${currentIndex}_${candleHash}_${JSON.stringify(config)}`;
  }

  private cacheFeatures(key: string, features: FeatureSet): void {
    this.featureCache.set(key, features);
    
    // Manage cache size
    if (this.featureCache.size > this.maxCacheSize) {
      const firstKey = this.featureCache.keys().next().value;
      this.featureCache.delete(firstKey);
    }
  }

  private getDefaultConfig(): FeatureExtractionConfig {
    return {
      lookbackPeriod: 20,
      includeVolume: true,
      includeMomentum: true,
      includePatterns: true,
      normalizationMethod: 'zscore'
    };
  }

  // Public utilities
  clearCache(): void {
    this.featureCache.clear();
  }

  getCacheStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.featureCache.size,
      maxSize: this.maxCacheSize,
      hitRate: 0 // TODO: Implement hit rate tracking
    };
  }
}

export const featureExtractionService = FeatureExtractionService.getInstance();