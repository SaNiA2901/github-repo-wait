/**
 * DOMAIN: Prediction Types
 * Строго типизированные интерфейсы для прогнозирования
 */

export interface PredictionId {
  readonly value: string;
}

export interface Probability {
  readonly value: number; // 0-100
}

export interface Confidence {
  readonly value: number; // 0-100
}

export interface PredictionDirection {
  readonly value: 'UP' | 'DOWN';
}

export interface PredictionInterval {
  readonly minutes: number;
}

export interface PredictionEntity {
  readonly id: PredictionId;
  readonly sessionId: string;
  readonly candleIndex: number;
  readonly direction: PredictionDirection;
  readonly probability: Probability;
  readonly confidence: Confidence;
  readonly interval: PredictionInterval;
  readonly factors: FactorAnalysis;
  readonly outcome?: PredictionOutcome;
  readonly metadata: PredictionMetadata;
}

export interface FactorAnalysis {
  readonly technical: FactorScore;
  readonly volume: FactorScore;
  readonly momentum: FactorScore;
  readonly volatility: FactorScore;
  readonly pattern: FactorScore;
  readonly trend: FactorScore;
  readonly weights: FactorWeights;
}

export interface FactorScore {
  readonly value: number; // 0-100
  readonly weight: number; // 0-1
  readonly confidence: number; // 0-1
}

export interface FactorWeights {
  readonly technical: number;
  readonly volume: number;
  readonly momentum: number;
  readonly volatility: number;
  readonly pattern: number;
  readonly trend: number;
}

export interface PredictionOutcome {
  readonly actual: PredictionDirection;
  readonly correct: boolean;
  readonly actualPrice: number;
  readonly targetPrice: number;
  readonly timestamp: Date;
}

export interface PredictionMetadata {
  readonly createdAt: Date;
  readonly modelVersion: string;
  readonly algorithm: string;
  readonly parameters: Record<string, unknown>;
  readonly confidence_level: 'high' | 'medium' | 'low';
}

export interface ModelPerformance {
  readonly totalPredictions: number;
  readonly correctPredictions: number;
  readonly accuracy: number;
  readonly precisionUp: number;
  readonly precisionDown: number;
  readonly recallUp: number;
  readonly recallDown: number;
  readonly f1Score: number;
  readonly sharpeRatio: number;
  readonly maxDrawdown: number;
}

// Value Objects Factory
export const PredictionValueObjects = {
  predictionId: (value: string): PredictionId => ({ value }),
  
  probability: (value: number): Probability => {
    if (value < 0 || value > 100) {
      throw new Error('Probability must be between 0 and 100');
    }
    return { value };
  },
  
  confidence: (value: number): Confidence => {
    if (value < 0 || value > 100) {
      throw new Error('Confidence must be between 0 and 100');
    }
    return { value };
  },
  
  predictionDirection: (value: string): PredictionDirection => {
    if (value !== 'UP' && value !== 'DOWN') {
      throw new Error('Direction must be UP or DOWN');
    }
    return { value };
  },
  
  predictionInterval: (minutes: number): PredictionInterval => {
    if (minutes <= 0 || minutes > 1440) {
      throw new Error('Interval must be between 1 and 1440 minutes');
    }
    return { minutes };
  },
  
  factorScore: (value: number, weight: number = 1, confidence: number = 1): FactorScore => {
    if (value < 0 || value > 100) {
      throw new Error('Factor score must be between 0 and 100');
    }
    if (weight < 0 || weight > 1) {
      throw new Error('Weight must be between 0 and 1');
    }
    if (confidence < 0 || confidence > 1) {
      throw new Error('Confidence must be between 0 and 1');
    }
    return { value, weight, confidence };
  },
  
  factorWeights: (weights: Partial<FactorWeights>): FactorWeights => {
    const defaultWeights: FactorWeights = {
      technical: 0.30,
      volume: 0.15,
      momentum: 0.25,
      volatility: 0.15,
      pattern: 0.10,
      trend: 0.05
    };
    
    const result = { ...defaultWeights, ...weights };
    
    // Validate weights sum to 1.0
    const sum = Object.values(result).reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 1.0) > 0.01) {
      throw new Error('Factor weights must sum to 1.0');
    }
    
    return result;
  }
};