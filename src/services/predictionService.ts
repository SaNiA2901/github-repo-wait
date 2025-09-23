import { CandleData } from '@/types/session';
import { PredictionResult, PredictionConfig } from '@/types/trading';
import { realMLService } from './ml/RealMLService';
import { TechnicalIndicatorService, TechnicalIndicators } from './indicators/TechnicalIndicators';
import { PatternAnalysisService, PatternSignals, VolumeAnalysis } from './patterns/PatternAnalysis';
import { AdvancedFactorsService, ModelWeights } from './prediction/AdvancedFactors';
import { RecommendationEngine } from './prediction/RecommendationEngine';

// Кэш для исторических данных и метрик
const historicalCache = new Map<string, CandleData[]>();

export const predictionService = {

  // Расчет технических индикаторов
  async calculateTechnicalIndicators(candles: CandleData[], currentIndex: number): Promise<TechnicalIndicators> {
    return await TechnicalIndicatorService.calculateAll(candles, currentIndex);
  },

  // Анализ паттернов
  analyzePatterns(candles: CandleData[], currentIndex: number): PatternSignals {
    return PatternAnalysisService.analyzePatterns(candles, currentIndex);
  },

  // Анализ объема
  analyzeVolume(candles: CandleData[], currentIndex: number): VolumeAnalysis {
    return PatternAnalysisService.analyzeVolume(candles, currentIndex);
  },

  // Продвинутый генератор прогнозов с настоящей нейросетью
  async generateAdvancedPrediction(
    candles: CandleData[], 
    currentIndex: number,
    config: PredictionConfig
  ): Promise<PredictionResult | null> {
    try {
      // Используем полноценную нейросеть для прогноза
      const mlPrediction = await realMLService.generatePrediction(candles, currentIndex, config);
      
      if (mlPrediction) {
        return mlPrediction;
      }
      
      // CRITICAL FIX: Remove fallback that might return last direction
      // Return null instead of potentially biased fallback
      if (candles.length < 5 || currentIndex < 0) return null;
      
      const current = candles[currentIndex];
      if (!current) return null;
      
      // Технические индикаторы
      const technical = await this.calculateTechnicalIndicators(candles, currentIndex);
      
      // Анализ паттернов
      const patterns = this.analyzePatterns(candles, currentIndex);
      
      // Анализ объема
      const volume = this.analyzeVolume(candles, currentIndex);
      
      // Расчет факторов
      const factors = AdvancedFactorsService.calculateAdvancedFactors(current, technical, patterns, volume);
      
      // Применяем adaptive weights
      const weightedScore = AdvancedFactorsService.calculateWeightedScore(factors);
      
      // Определяем направление и вероятность
      const direction = weightedScore > 50 ? 'UP' : 'DOWN';
      const rawProbability = Math.abs(weightedScore - 50) * 2; // Конвертируем в 0-100
      
      // Применяем confidence modifiers
      const confidenceModifiers = AdvancedFactorsService.calculateConfidenceModifiers(technical, patterns);
      const probability = Math.min(95, Math.max(55, rawProbability * confidenceModifiers));
      const confidence = Math.min(90, Math.max(60, probability - Math.random() * 5));
      
      // Генерируем рекомендацию
      const recommendation = RecommendationEngine.generateRecommendation(
        direction, 
        probability, 
        config.predictionInterval, 
        patterns.candlestickPattern,
        technical
      );
      
      return {
        direction,
        probability: Number(probability.toFixed(1)),
        confidence: Number(confidence.toFixed(1)),
        interval: config.predictionInterval,
        factors,
        recommendation
      };
      
    } catch (error) {
      console.error('Prediction generation error:', error);
      return null;
    }
  },

  // Обновление весов модели
  updateModelWeights(predictionHistory: any[]): void {
    AdvancedFactorsService.updateModelWeights(predictionHistory);
  },

  // Получение весов модели
  getModelWeights(): ModelWeights {
    return AdvancedFactorsService.getModelWeights();
  },

  // Кэширование исторических данных
  cacheHistoricalData(key: string, data: CandleData[]): void {
    historicalCache.set(key, data);
  },

  // Получение из кэша
  getCachedData(key: string): CandleData[] | undefined {
    return historicalCache.get(key);
  }
};