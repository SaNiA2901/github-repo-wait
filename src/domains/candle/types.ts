/**
 * DOMAIN: Candle Data Types
 * Строго типизированные интерфейсы для свечных данных
 */

export interface CandleId {
  readonly value: string;
}

export interface CandleIndex {
  readonly value: number;
}

export interface Price {
  readonly value: number;
}

export interface Volume {
  readonly value: number;
}

export interface CandleEntity {
  readonly id: CandleId;
  readonly index: CandleIndex;
  readonly sessionId: string;
  readonly timestamp: Date;
  readonly ohlcv: OHLCV;
  readonly prediction?: PredictionData;
  readonly indicators?: IndicatorData;
  readonly metadata: CandleMetadata;
}

export interface OHLCV {
  readonly open: Price;
  readonly high: Price;
  readonly low: Price;
  readonly close: Price;
  readonly volume: Volume;
}

export interface PredictionData {
  readonly direction: 'UP' | 'DOWN';
  readonly probability: number;
  readonly confidence: number;
  readonly interval: number;
  readonly actualOutcome?: boolean;
  readonly factors: PredictionFactors;
}

export interface PredictionFactors {
  readonly technical: number;
  readonly volume: number;
  readonly momentum: number;
  readonly volatility: number;
  readonly pattern: number;
  readonly trend: number;
}

export interface IndicatorData {
  readonly rsi: number;
  readonly macd: MACDData;
  readonly bollingerBands: BollingerBandsData;
  readonly ema: EMAData;
  readonly stochastic: StochasticData;
  readonly atr: number;
  readonly adx: number;
}

export interface MACDData {
  readonly line: number;
  readonly signal: number;
  readonly histogram: number;
}

export interface BollingerBandsData {
  readonly upper: number;
  readonly middle: number;
  readonly lower: number;
}

export interface EMAData {
  readonly ema12: number;
  readonly ema26: number;
}

export interface StochasticData {
  readonly k: number;
  readonly d: number;
}

export interface CandleMetadata {
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly source: 'manual' | 'api' | 'import';
  readonly validated: boolean;
  readonly quality: 'high' | 'medium' | 'low';
}

// Value Objects Factory
export const CandleValueObjects = {
  candleId: (value: string): CandleId => ({ value }),
  candleIndex: (value: number): CandleIndex => {
    if (value < 0) {
      throw new Error('Candle index must be non-negative');
    }
    return { value };
  },
  price: (value: number): Price => {
    if (value <= 0 || !isFinite(value)) {
      throw new Error('Price must be positive and finite');
    }
    return { value };
  },
  volume: (value: number): Volume => {
    if (value < 0 || !isFinite(value)) {
      throw new Error('Volume must be non-negative and finite');
    }
    return { value };
  },
  ohlcv: (open: number, high: number, low: number, close: number, volume: number): OHLCV => {
    const o = CandleValueObjects.price(open);
    const h = CandleValueObjects.price(high);
    const l = CandleValueObjects.price(low);
    const c = CandleValueObjects.price(close);
    const v = CandleValueObjects.volume(volume);
    
    // Validate OHLC relationships
    if (h.value < Math.max(o.value, h.value, l.value, c.value)) {
      throw new Error('High must be the highest price');
    }
    if (l.value > Math.min(o.value, h.value, l.value, c.value)) {
      throw new Error('Low must be the lowest price');
    }
    
    return { open: o, high: h, low: l, close: c, volume: v };
  }
};