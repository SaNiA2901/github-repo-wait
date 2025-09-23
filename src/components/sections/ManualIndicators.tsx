import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, TrendingUp, BarChart3 } from "lucide-react";
import { useStateManager } from "@/hooks/useStateManager";

interface ManualIndicatorsProps {
  pair: string;
  timeframe: string;
}

export function ManualIndicators({ pair, timeframe }: ManualIndicatorsProps) {
  const { currentSession, candles } = useStateManager();

  // Простые вычисления индикаторов для демонстрации
  const calculateSMA = (data: number[], period: number) => {
    if (data.length < period) return null;
    const slice = data.slice(-period);
    return slice.reduce((sum, val) => sum + val, 0) / period;
  };

  const calculateRSI = (closes: number[], period = 14) => {
    if (closes.length < period + 1) return null;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = closes.length - period; i < closes.length; i++) {
      const change = closes[i] - closes[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  };

  const closes = candles.map(c => c.close);
  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);
  const rsi = calculateRSI(closes);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Индикаторы сессии</h1>
          <p className="text-muted-foreground">
            {currentSession 
              ? `Технические индикаторы для сессии "${currentSession.session_name}"`
              : "Выберите сессию для расчета индикаторов"
            }
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{pair}</span>
          <span>•</span>
          <span>{timeframe}</span>
        </div>
      </div>

      {!currentSession ? (
        <Card className="trading-card">
          <CardContent className="p-12 text-center">
            <Activity className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">Сессия не выбрана</h3>
            <p className="text-sm text-muted-foreground">
              Выберите активную сессию в разделе "Ручной режим" для расчета индикаторов
            </p>
          </CardContent>
        </Card>
      ) : candles.length < 20 ? (
        <Card className="trading-card">
          <CardContent className="p-12 text-center">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">Недостаточно данных</h3>
            <p className="text-sm text-muted-foreground">
              Для расчета индикаторов требуется минимум 20 свечей. 
              Текущее количество: {candles.length}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Основные индикаторы */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-trading-success" />
                  RSI (14)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground">
                    {rsi ? rsi.toFixed(2) : 'N/A'}
                  </div>
                  <div className="text-sm text-muted-foreground">Relative Strength Index</div>
                </div>
                
                <div className="space-y-2">
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        rsi && rsi > 70 ? 'bg-trading-danger' : 
                        rsi && rsi < 30 ? 'bg-trading-success' : 
                        'bg-trading-warning'
                      }`}
                      style={{ width: `${rsi || 0}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0</span>
                    <span>30</span>
                    <span>70</span>
                    <span>100</span>
                  </div>
                </div>

                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Сигнал:</span>
                    <span className={
                      rsi && rsi > 70 ? 'text-trading-danger font-medium' :
                      rsi && rsi < 30 ? 'text-trading-success font-medium' :
                      'text-muted-foreground font-medium'
                    }>
                      {rsi && rsi > 70 ? 'ПЕРЕПРОДАННОСТЬ' :
                       rsi && rsi < 30 ? 'ПЕРЕКУПЛЕННОСТЬ' :
                       'НЕЙТРАЛЬНО'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  SMA 20/50
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">SMA 20:</span>
                    <span className="font-medium">{sma20 ? sma20.toFixed(5) : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">SMA 50:</span>
                    <span className="font-medium">{sma50 ? sma50.toFixed(5) : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Текущая цена:</span>
                    <span className="font-medium">{closes[closes.length - 1]?.toFixed(5)}</span>
                  </div>
                </div>

                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Тренд:</span>
                    <span className={
                      sma20 && sma50 && sma20 > sma50 ? 'text-trading-success font-medium' :
                      sma20 && sma50 && sma20 < sma50 ? 'text-trading-danger font-medium' :
                      'text-muted-foreground font-medium'
                    }>
                      {sma20 && sma50 && sma20 > sma50 ? 'ВОСХОДЯЩИЙ' :
                       sma20 && sma50 && sma20 < sma50 ? 'НИСХОДЯЩИЙ' :
                       'НЕОПРЕДЕЛЕН'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Позиция цены:</span>
                    <span className={
                      sma20 && closes[closes.length - 1] > sma20 ? 'text-trading-success font-medium' :
                      sma20 && closes[closes.length - 1] < sma20 ? 'text-trading-danger font-medium' :
                      'text-muted-foreground font-medium'
                    }>
                      {sma20 && closes[closes.length - 1] > sma20 ? 'ВЫШЕ SMA20' :
                       sma20 && closes[closes.length - 1] < sma20 ? 'НИЖЕ SMA20' :
                       'НА УРОВНЕ'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-trading-warning" />
                  Волатильность
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Средний размах (20):</span>
                    <span className="font-medium">
                      {candles.length >= 20 ? 
                        (candles.slice(-20).reduce((sum, c) => sum + (c.high - c.low), 0) / 20).toFixed(5) : 'N/A'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Текущий размах:</span>
                    <span className="font-medium">
                      {candles.length > 0 ? 
                        (candles[candles.length - 1].high - candles[candles.length - 1].low).toFixed(5) : 'N/A'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">ATR (приблиз.):</span>
                    <span className="font-medium">
                      {candles.length >= 14 ? 
                        (candles.slice(-14).reduce((sum, c) => sum + (c.high - c.low), 0) / 14).toFixed(5) : 'N/A'
                      }
                    </span>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Уровень волатильности</div>
                  <div className="text-lg font-bold text-trading-warning">
                    {candles.length >= 20 ? 'УМЕРЕННЫЙ' : 'НЕДОСТАТОЧНО ДАННЫХ'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Дополнительные индикаторы */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle>Дополнительные индикаторы</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium">Поддержка и сопротивление</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Сопротивление:</span>
                      <span className="font-medium text-trading-danger">
                        {Math.max(...candles.slice(-20).map(c => c.high)).toFixed(5)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Поддержка:</span>
                      <span className="font-medium text-trading-success">
                        {Math.min(...candles.slice(-20).map(c => c.low)).toFixed(5)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Средний уровень:</span>
                      <span className="font-medium">
                        {((Math.max(...candles.slice(-20).map(c => c.high)) + 
                           Math.min(...candles.slice(-20).map(c => c.low))) / 2).toFixed(5)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Объемный анализ</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Средний объем:</span>
                      <span className="font-medium">
                        {Math.round(candles.reduce((sum, c) => sum + c.volume, 0) / candles.length).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Текущий объем:</span>
                      <span className="font-medium">
                        {candles[candles.length - 1]?.volume.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Соотношение:</span>
                      <span className={
                        candles[candles.length - 1]?.volume > 
                        (candles.reduce((sum, c) => sum + c.volume, 0) / candles.length) ? 
                        'font-medium text-trading-success' : 'font-medium text-trading-danger'
                      }>
                        {candles.length > 0 ? 
                          ((candles[candles.length - 1]?.volume / 
                            (candles.reduce((sum, c) => sum + c.volume, 0) / candles.length)) * 100).toFixed(0) + '%' : 'N/A'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Свечной анализ</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Восходящие свечи:</span>
                      <span className="font-medium text-trading-success">
                        {((candles.filter(c => c.close > c.open).length / candles.length) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Нисходящие свечи:</span>
                      <span className="font-medium text-trading-danger">
                        {((candles.filter(c => c.close < c.open).length / candles.length) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Последняя свеча:</span>
                      <span className={
                        candles[candles.length - 1]?.close > candles[candles.length - 1]?.open ? 
                        'font-medium text-trading-success' : 'font-medium text-trading-danger'
                      }>
                        {candles[candles.length - 1]?.close > candles[candles.length - 1]?.open ? 'БЫЧЬЯ' : 'МЕДВЕЖЬЯ'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}