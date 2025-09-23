/**
 * DOMAIN: Session Management Types
 * Строго типизированные интерфейсы для сессий
 */

export interface SessionId {
  readonly value: string;
}

export interface SessionName {
  readonly value: string;
}

export interface TradingPair {
  readonly base: string;
  readonly quote: string;
  readonly symbol: string; // "EUR/USD"
}

export interface TimeFrame {
  readonly value: '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w';
  readonly milliseconds: number;
}

export interface SessionStatus {
  readonly value: 'active' | 'paused' | 'completed' | 'archived';
}

export interface SessionEntity {
  readonly id: SessionId;
  readonly name: SessionName;
  readonly pair: TradingPair;
  readonly timeframe: TimeFrame;
  readonly status: SessionStatus;
  readonly startDate: Date;
  readonly endDate?: Date;
  readonly metadata: SessionMetadata;
  readonly stats: SessionStats;
}

export interface SessionMetadata {
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdBy?: string;
  readonly description?: string;
  readonly tags: readonly string[];
}

export interface SessionStats {
  readonly totalCandles: number;
  readonly totalPredictions: number;
  readonly accuratePredictions: number;
  readonly accuracy: number;
  readonly lastPrice: number | null;
  readonly priceChange: number;
  readonly volume: number;
  readonly volatility: number;
}

// Value Objects Factory
export const SessionValueObjects = {
  sessionId: (value: string): SessionId => ({ value }),
  sessionName: (value: string): SessionName => {
    if (!value || value.length < 1 || value.length > 50) {
      throw new Error('Session name must be 1-50 characters');
    }
    return { value };
  },
  tradingPair: (symbol: string): TradingPair => {
    const parts = symbol.split('/');
    if (parts.length !== 2) {
      throw new Error('Invalid trading pair format');
    }
    return {
      base: parts[0],
      quote: parts[1],
      symbol
    };
  },
  timeFrame: (value: string): TimeFrame => {
    const timeframes = {
      '1m': 60000,
      '5m': 300000,
      '15m': 900000,
      '30m': 1800000,
      '1h': 3600000,
      '4h': 14400000,
      '1d': 86400000,
      '1w': 604800000
    };
    
    if (!(value in timeframes)) {
      throw new Error('Invalid timeframe');
    }
    
    return {
      value: value as TimeFrame['value'],
      milliseconds: timeframes[value as keyof typeof timeframes]
    };
  },
  sessionStatus: (value: string): SessionStatus => {
    const validStatuses = ['active', 'paused', 'completed', 'archived'];
    if (!validStatuses.includes(value)) {
      throw new Error('Invalid session status');
    }
    return { value: value as SessionStatus['value'] };
  }
};