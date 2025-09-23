/**
 * Enhanced Real-time Market Data Service
 * Optimized version with better performance and caching
 */

import { CandleData } from '@/types/session';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { errorHandler, ErrorCategory } from '@/utils/errorHandler';
import { isPreviewEnvironment } from '@/utils/previewOptimization';

export interface EnhancedMarketConfig {
  symbol: string;
  interval: '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
  autoReconnect: boolean;
  maxReconnectAttempts: number;
  bufferSize: number;
}

export interface PriceUpdate {
  symbol: string;
  price: number;
  volume: number;
  timestamp: number;
  change: number;
  changePercent: number;
}

export class EnhancedRealTimeMarketService {
  private static instance: EnhancedRealTimeMarketService;
  private wsConnection: WebSocket | null = null;
  private subscriptions: Map<string, Set<(data: any) => void>> = new Map();
  private reconnectAttempts = 0;
  private isConnecting = false;
  private dataBuffer: Map<string, CandleData[]> = new Map();
  private config: EnhancedMarketConfig;

  private constructor() {
    this.config = {
      symbol: 'BTCUSDT',
      interval: '1m',
      autoReconnect: true,
      maxReconnectAttempts: 5,
      bufferSize: 100
    };
  }

  static getInstance(): EnhancedRealTimeMarketService {
    if (!EnhancedRealTimeMarketService.instance) {
      EnhancedRealTimeMarketService.instance = new EnhancedRealTimeMarketService();
    }
    return EnhancedRealTimeMarketService.instance;
  }

  async connect(config: Partial<EnhancedMarketConfig> = {}): Promise<void> {
    this.config = { ...this.config, ...config };

    if (this.isConnecting || this.wsConnection?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isConnecting = true;

    try {
      await this.initializeMockConnection();
      logger.info('Enhanced market service connected', { 
        symbol: this.config.symbol,
        interval: this.config.interval 
      });

    } catch (error) {
      this.isConnecting = false;
      errorHandler.handleError(error as Error, ErrorCategory.NETWORK, {
        context: 'enhanced_market_connection',
        symbol: this.config.symbol
      });
      
      if (this.config.autoReconnect && this.reconnectAttempts < this.config.maxReconnectAttempts) {
        setTimeout(() => this.connect(config), 1000 * Math.pow(2, this.reconnectAttempts));
        this.reconnectAttempts++;
      }
    }
  }

  private async initializeMockConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.wsConnection = {
          readyState: WebSocket.OPEN,
          close: () => {},
          send: () => {}
        } as any;

        this.startMockDataGeneration();
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        resolve();

      } catch (error) {
        reject(error);
      }
    });
  }

  private startMockDataGeneration(): void {
    let basePrice = 45000;
    let candleCount = 0;

    const generateCandle = () => {
      const volatility = 0.02;
      const trend = Math.sin(candleCount * 0.1) * 0.001;
      const randomWalk = (Math.random() - 0.5) * volatility;
      
      const priceChange = basePrice * (trend + randomWalk);
      const open = basePrice;
      const close = open + priceChange;
      const high = Math.max(open, close) + Math.random() * Math.abs(priceChange) * 0.5;
      const low = Math.min(open, close) - Math.random() * Math.abs(priceChange) * 0.5;
      const volume = 10 + Math.random() * 90;

      basePrice = close;
      candleCount++;

      const candleData: CandleData = {
        id: `enhanced_${Date.now()}_${candleCount}`,
        session_id: 'enhanced_session',
        candle_index: candleCount,
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume: Number(volume.toFixed(2)),
        candle_datetime: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      this.bufferData(this.config.symbol, candleData);
      this.notifySubscribers('candle_update', candleData);

      const priceUpdate: PriceUpdate = {
        symbol: this.config.symbol,
        price: close,
        volume: volume,
        timestamp: Date.now(),
        change: priceChange,
        changePercent: (priceChange / open) * 100
      };

      this.notifySubscribers('price_update', priceUpdate);
    };

    generateCandle();
    const intervalMs = this.getIntervalMs(this.config.interval);
    setInterval(generateCandle, intervalMs);
  }

  private getIntervalMs(interval: string): number {
    const intervals = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000
    };
    return intervals[interval as keyof typeof intervals] || 60 * 1000;
  }

  private bufferData(symbol: string, candle: CandleData): void {
    if (!this.dataBuffer.has(symbol)) {
      this.dataBuffer.set(symbol, []);
    }

    const buffer = this.dataBuffer.get(symbol)!;
    buffer.push(candle);

    if (buffer.length > this.config.bufferSize) {
      buffer.shift();
    }

    if (buffer.length % 10 === 0) {
      this.persistBufferedData(symbol);
    }
  }

  private async persistBufferedData(symbol: string): Promise<void> {
    try {
      const buffer = this.dataBuffer.get(symbol);
      if (!buffer || buffer.length === 0) return;

      // Skip database operations in preview environment
      if (isPreviewEnvironment()) {
        logger.debug('Database persistence skipped in preview environment');
        return;
      }

      if (supabase) {
        await supabase
          .from('candle_data')
          .upsert(buffer.slice(-10), { onConflict: 'id' });

        logger.debug('Enhanced market data persisted', { 
          symbol, 
          count: Math.min(10, buffer.length) 
        });
      }

    } catch (error) {
      errorHandler.handleError(error as Error, ErrorCategory.DATA_PROCESSING, {
        context: 'enhanced_market_persistence',
        symbol
      });
    }
  }

  subscribe(event: 'candle_update' | 'price_update', callback: (data: any) => void): () => void {
    if (!this.subscriptions.has(event)) {
      this.subscriptions.set(event, new Set());
    }

    this.subscriptions.get(event)!.add(callback);

    return () => {
      this.subscriptions.get(event)?.delete(callback);
    };
  }

  private notifySubscribers(event: string, data: any): void {
    const subscribers = this.subscriptions.get(event);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          logger.error('Enhanced subscriber callback error', { event, error });
        }
      });
    }
  }

  getBufferedData(symbol: string, limit?: number): CandleData[] {
    const buffer = this.dataBuffer.get(symbol) || [];
    return limit ? buffer.slice(-limit) : [...buffer];
  }

  isConnected(): boolean {
    return this.wsConnection?.readyState === WebSocket.OPEN;
  }

  getCurrentPrice(symbol: string): number | null {
    const buffer = this.dataBuffer.get(symbol);
    return buffer && buffer.length > 0 ? buffer[buffer.length - 1].close : null;
  }

  disconnect(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }

    this.subscriptions.clear();
    this.isConnecting = false;
    this.reconnectAttempts = 0;

    logger.info('Enhanced market service disconnected');
  }

  updateConfig(config: Partial<EnhancedMarketConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.isConnected()) {
      this.disconnect();
      this.connect(this.config);
    }
  }

  getMetrics() {
    return {
      isConnected: this.isConnected(),
      subscriptionCount: Array.from(this.subscriptions.values())
        .reduce((total, set) => total + set.size, 0),
      bufferedDataCount: Array.from(this.dataBuffer.values())
        .reduce((total, buffer) => total + buffer.length, 0),
      reconnectAttempts: this.reconnectAttempts,
      symbols: Array.from(this.dataBuffer.keys())
    };
  }
}

export const enhancedRealTimeMarketService = EnhancedRealTimeMarketService.getInstance();