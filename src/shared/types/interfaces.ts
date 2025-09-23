/**
 * SHARED: Type Interfaces
 * Быстрые заглушки для доменных типов
 */

export interface SessionEntity {
  id: { value: string };
  name: { value: string };
  pair: { symbol: string };
  timeframe: { value: string };
  status: { value: string };
  startDate: Date;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    description?: string;
    tags: string[];
  };
  stats: {
    totalCandles: number;
    totalPredictions: number;
    accuratePredictions: number;
    accuracy: number;
    lastPrice: number | null;
    priceChange: number;
    volume: number;
    volatility: number;
  };
}

export interface CandleEntity {
  id: { value: string };
  index: { value: number };
  sessionId: string;
  timestamp: Date;
  ohlcv: {
    open: { value: number };
    high: { value: number };
    low: { value: number };
    close: { value: number };
    volume: { value: number };
  };
  prediction?: {
    direction: 'UP' | 'DOWN';
    probability: number;
    confidence: number;
    interval: number;
    factors: any;
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    source: string;
    validated: boolean;
    quality: string;
  };
}

export interface PredictionEntity {
  id: { value: string };
  sessionId: string;
  candleIndex: number;
  direction: { value: 'UP' | 'DOWN' };
  probability: { value: number };
  confidence: { value: number };
  interval: { minutes: number };
  factors: any;
  outcome?: any;
  metadata: {
    createdAt: Date;
    modelVersion: string;
    algorithm: string;
    parameters: any;
    confidence_level: string;
  };
}

export interface ModelPerformance {
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  precisionUp: number;
  precisionDown: number;
  recallUp: number;
  recallDown: number;
  f1Score: number;
  sharpeRatio: number;
  maxDrawdown: number;
}

export interface CreateSessionData {
  session_name: string;
  pair: string;
  timeframe: string;
  start_date: string;
  start_time: string;
  description?: string;
  tags?: string[];
}

export interface CreateCandleData {
  session_id: string;
  candle_index: number;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface UpdateCandleData {
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
}