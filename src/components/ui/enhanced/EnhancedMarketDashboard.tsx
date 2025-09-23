/**
 * Enhanced Market Dashboard
 * Интегрирует Enhanced сервисы для real-time мониторинга рынка
 */

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Zap, 
  Database,
  WifiOff,
  Wifi,
  BarChart3
} from 'lucide-react';
import { enhancedRealTimeMarketService, PriceUpdate } from '@/services/data/EnhancedRealTimeMarketService';
import { enhancedFeatureIntegration } from '@/services/cache/EnhancedFeatureIntegration';
import { usePerformance } from '@/hooks/usePerformance';
import { CandleData } from '@/types/session';

interface EnhancedMarketDashboardProps {
  pair: string;
  timeframe: string;
}

const EnhancedMarketDashboard = ({ pair, timeframe }: EnhancedMarketDashboardProps) => {
  const [priceUpdate, setPriceUpdate] = useState<PriceUpdate | null>(null);
  const [latestCandle, setLatestCandle] = useState<CandleData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [serviceMetrics, setServiceMetrics] = useState<any>(null);
  
  const { 
    metrics, 
    performanceScore, 
    optimizationSuggestions,
    startMeasurement,
    endMeasurement 
  } = usePerformance('EnhancedMarketDashboard');

  useEffect(() => {
    startMeasurement();
    
    // Подключение к enhanced market service
    enhancedRealTimeMarketService.connect({
      symbol: pair,
      interval: timeframe as any,
      autoReconnect: true,
      maxReconnectAttempts: 5,
      bufferSize: 100
    });

    // Подписка на обновления цен
    const unsubscribePrice = enhancedRealTimeMarketService.subscribe(
      'price_update',
      (update: PriceUpdate) => {
        setPriceUpdate(update);
      }
    );

    // Подписка на новые свечи
    const unsubscribeCandle = enhancedRealTimeMarketService.subscribe(
      'candle_update',
      (candle: CandleData) => {
        setLatestCandle(candle);
      }
    );

    // Мониторинг состояния подключения
    const checkConnection = () => {
      setIsConnected(enhancedRealTimeMarketService.isConnected());
      setServiceMetrics(enhancedRealTimeMarketService.getMetrics());
    };

    // Мониторинг кэша
    const updateCacheStats = () => {
      setCacheStats(enhancedFeatureIntegration.getCacheStats());
    };

    checkConnection();
    updateCacheStats();

    const connectionInterval = setInterval(checkConnection, 5000);
    const cacheInterval = setInterval(updateCacheStats, 10000);

    return () => {
      unsubscribePrice();
      unsubscribeCandle();
      clearInterval(connectionInterval);
      clearInterval(cacheInterval);
      endMeasurement();
    };
  }, [pair, timeframe, startMeasurement, endMeasurement]);

  const formatPrice = (price: number) => {
    return price.toFixed(pair.includes('JPY') ? 3 : 5);
  };

  const formatChange = (change: number) => {
    return change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2);
  };

  return (
    <div className="space-y-4">
      {/* Статус подключения */}
      <Card className="p-4 bg-card/50 border-border/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isConnected ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            <span className="font-medium">
              Enhanced Market Service
            </span>
          </div>
          <Badge variant={isConnected ? "default" : "destructive"}>
            {isConnected ? "Подключено" : "Отключено"}
          </Badge>
        </div>
        
        {serviceMetrics && (
          <div className="mt-3 grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            <div>
              <div className="text-muted-foreground">Подписки</div>
              <div className="font-medium">{serviceMetrics.subscriptionCount}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Буфер данных</div>
              <div className="font-medium">{serviceMetrics.bufferedDataCount}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Попытки переподключения</div>
              <div className="font-medium">{serviceMetrics.reconnectAttempts}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Символы</div>
              <div className="font-medium">{serviceMetrics.symbols?.length || 0}</div>
            </div>
          </div>
        )}
      </Card>

      {/* Текущая цена */}
      {priceUpdate && (
        <Card className="p-4 bg-card/50 border-border/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-primary" />
              <span className="font-semibold">{priceUpdate.symbol}</span>
            </div>
            <Badge variant="outline">Real-time</Badge>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Цена</div>
              <div className="text-2xl font-bold">
                {formatPrice(priceUpdate.price)}
              </div>
            </div>
            
            <div>
              <div className="text-sm text-muted-foreground">Изменение</div>
              <div className={`text-lg font-semibold flex items-center space-x-1 ${
                priceUpdate.change >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {priceUpdate.change >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span>{formatChange(priceUpdate.change)}</span>
              </div>
            </div>
            
            <div>
              <div className="text-sm text-muted-foreground">Изменение %</div>
              <div className={`text-lg font-semibold ${
                priceUpdate.changePercent >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {formatChange(priceUpdate.changePercent)}%
              </div>
            </div>
            
            <div>
              <div className="text-sm text-muted-foreground">Объем</div>
              <div className="text-lg font-semibold">
                {priceUpdate.volume.toFixed(2)}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Последняя свеча */}
      {latestCandle && (
        <Card className="p-4 bg-card/50 border-border/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span className="font-medium">Последняя свеча</span>
            </div>
            <Badge variant="secondary">#{latestCandle.candle_index}</Badge>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            <div>
              <div className="text-muted-foreground">Open</div>
              <div className="font-medium">{formatPrice(latestCandle.open)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">High</div>
              <div className="font-medium text-green-500">{formatPrice(latestCandle.high)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Low</div>
              <div className="font-medium text-red-500">{formatPrice(latestCandle.low)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Close</div>
              <div className="font-medium">{formatPrice(latestCandle.close)}</div>
            </div>
          </div>
        </Card>
      )}

      {/* Статистика кэша */}
      {cacheStats && (
        <Card className="p-4 bg-card/50 border-border/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-primary" />
              <span className="font-medium">Кэш Enhanced Features</span>
            </div>
            <Badge variant="outline">
              Hit Rate: {cacheStats.hitRate}%
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Cache Hits</div>
              <div className="text-lg font-semibold text-green-500">
                {cacheStats.hits}
              </div>
            </div>
            
            <div>
              <div className="text-sm text-muted-foreground">Cache Misses</div>
              <div className="text-lg font-semibold text-red-500">
                {cacheStats.misses}
              </div>
            </div>
            
            <div>
              <div className="text-sm text-muted-foreground">TTL</div>
              <div className="text-lg font-semibold">
                {Math.round(cacheStats.ttlSeconds / 60)}m
              </div>
            </div>
          </div>
          
          <div className="mt-3">
            <div className="flex justify-between text-sm mb-1">
              <span>Cache Efficiency</span>
              <span>{cacheStats.hitRate}%</span>
            </div>
            <Progress 
              value={cacheStats.hitRate} 
              className="h-2"
            />
          </div>
        </Card>
      )}

      {/* Производительность компонента */}
      {metrics && (
        <Card className="p-4 bg-card/50 border-border/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-primary" />
              <span className="font-medium">Производительность</span>
            </div>
            <Badge variant={performanceScore > 80 ? "default" : performanceScore > 60 ? "secondary" : "destructive"}>
              {performanceScore}/100
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            <div>
              <div className="text-muted-foreground">Время рендера</div>
              <div className="font-medium">{metrics.averageRenderTime.toFixed(2)}ms</div>
            </div>
            <div>
              <div className="text-muted-foreground">Рендеры</div>
              <div className="font-medium">{metrics.renderCount}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Память</div>
              <div className="font-medium">
                {(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB
              </div>
            </div>
          </div>
          
          {optimizationSuggestions.length > 0 && (
            <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
              <div className="text-sm font-medium text-yellow-600 mb-1">
                Рекомендации по оптимизации:
              </div>
              <ul className="text-xs text-yellow-600/80 space-y-1">
                {optimizationSuggestions.slice(0, 2).map((suggestion, index) => (
                  <li key={index}>• {suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default EnhancedMarketDashboard;