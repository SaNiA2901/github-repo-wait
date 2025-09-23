import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { useStateManager } from "@/hooks/useStateManager";

interface ManualPatternsProps {
  pair: string;
  timeframe: string;
}

export function ManualPatterns({ pair, timeframe }: ManualPatternsProps) {
  const { currentSession, candles } = useStateManager();

  // Простое определение паттернов на основе данных свечей
  const detectPatterns = () => {
    if (candles.length < 3) return [];

    const patterns = [];
    const recentCandles = candles.slice(-10); // Последние 10 свечей

    // Паттерн "Молот"
    for (let i = 0; i < recentCandles.length; i++) {
      const candle = recentCandles[i];
      const bodySize = Math.abs(candle.close - candle.open);
      const lowerShadow = Math.min(candle.open, candle.close) - candle.low;
      const upperShadow = candle.high - Math.max(candle.open, candle.close);
      
      if (lowerShadow > bodySize * 2 && upperShadow < bodySize * 0.5) {
        patterns.push({
          name: "Молот",
          type: "reversal",
          reliability: 72,
          direction: "bullish",
          candleIndex: candle.candle_index,
          description: "Потенциальный разворот вверх"
        });
      }
    }

    // Паттерн "Поглощение"
    for (let i = 1; i < recentCandles.length; i++) {
      const prev = recentCandles[i - 1];
      const curr = recentCandles[i];
      
      if (prev.close < prev.open && curr.close > curr.open && 
          curr.open < prev.close && curr.close > prev.open) {
        patterns.push({
          name: "Бычье поглощение",
          type: "reversal", 
          reliability: 78,
          direction: "bullish",
          candleIndex: curr.candle_index,
          description: "Сильный сигнал разворота вверх"
        });
      }
    }

    // Паттерн "Доджи"
    for (let i = 0; i < recentCandles.length; i++) {
      const candle = recentCandles[i];
      const bodySize = Math.abs(candle.close - candle.open);
      const totalRange = candle.high - candle.low;
      
      if (bodySize < totalRange * 0.1) {
        patterns.push({
          name: "Доджи",
          type: "indecision",
          reliability: 65,
          direction: "neutral",
          candleIndex: candle.candle_index,
          description: "Неопределенность на рынке"
        });
      }
    }

    return patterns;
  };

  const detectedPatterns = candles.length >= 3 ? detectPatterns() : [];

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case "bullish": return "text-trading-success";
      case "bearish": return "text-trading-danger"; 
      case "neutral": return "text-muted-foreground";
      default: return "text-foreground";
    }
  };

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case "bullish": return <TrendingUp className="h-4 w-4" />;
      case "bearish": return <TrendingDown className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Паттерны сессии</h1>
          <p className="text-muted-foreground">
            {currentSession 
              ? `Анализ паттернов для сессии "${currentSession.session_name}"`
              : "Выберите сессию для анализа паттернов"
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
            <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">Сессия не выбрана</h3>
            <p className="text-sm text-muted-foreground">
              Выберите активную сессию в разделе "Ручной режим" для анализа паттернов
            </p>
          </CardContent>
        </Card>
      ) : candles.length < 3 ? (
        <Card className="trading-card">
          <CardContent className="p-12 text-center">
            <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">Недостаточно данных</h3>
            <p className="text-sm text-muted-foreground">
              Для анализа паттернов требуется минимум 3 свечи. 
              Текущее количество: {candles.length}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Обнаруженные паттерны */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Обнаруженные паттерны ({detectedPatterns.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {detectedPatterns.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">Паттерны не обнаружены</p>
                  <p className="text-sm text-muted-foreground">Добавьте больше свечей для анализа</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {detectedPatterns.map((pattern, index) => (
                    <div key={index} className="p-4 border border-border/50 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{pattern.name}</h4>
                        <Badge variant="secondary" className="text-xs">
                          Свеча #{pattern.candleIndex}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Тип:</span>
                          <div className="font-medium">
                            {pattern.type === "reversal" ? "Разворот" : 
                             pattern.type === "continuation" ? "Продолжение" : "Неопределенность"}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Надежность:</span>
                          <div className="font-medium">{pattern.reliability}%</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Направление:</span>
                          <div className={`flex items-center gap-1 ${getDirectionColor(pattern.direction)}`}>
                            {getDirectionIcon(pattern.direction)}
                            <span className="font-medium">
                              {pattern.direction === "bullish" ? "Восходящий" : 
                               pattern.direction === "bearish" ? "Нисходящий" : "Нейтральный"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {pattern.description}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Статистика свечей */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle>Анализ свечных формаций</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-trading-success">
                    {candles.filter(c => c.close > c.open).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Бычьих свечей</div>
                  <div className="text-xs text-muted-foreground">
                    {((candles.filter(c => c.close > c.open).length / candles.length) * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-trading-danger">
                    {candles.filter(c => c.close < c.open).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Медвежьих свечей</div>
                  <div className="text-xs text-muted-foreground">
                    {((candles.filter(c => c.close < c.open).length / candles.length) * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-muted-foreground">
                    {candles.filter(c => c.close === c.open).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Доджи</div>
                  <div className="text-xs text-muted-foreground">
                    {candles.length > 0 ? ((candles.filter(c => c.close === c.open).length / candles.length) * 100).toFixed(1) : 0}%
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {detectedPatterns.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Всего паттернов</div>
                  <div className="text-xs text-muted-foreground">
                    Обнаружено
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Детальный анализ последних свечей */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle>Последние свечи</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {candles.slice(-5).reverse().map((candle, index) => {
                  const bodySize = Math.abs(candle.close - candle.open);
                  const totalRange = candle.high - candle.low;
                  const upperShadow = candle.high - Math.max(candle.open, candle.close);
                  const lowerShadow = Math.min(candle.open, candle.close) - candle.low;
                  const isBullish = candle.close > candle.open;

                  return (
                    <div key={candle.candle_index} className="p-3 border border-border/50 rounded-lg">
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Свеча:</span>
                          <div className="font-medium">#{candle.candle_index}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Тип:</span>
                          <div className={`font-medium ${isBullish ? 'text-trading-success' : 'text-trading-danger'}`}>
                            {isBullish ? 'Бычья' : 'Медвежья'}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Размер тела:</span>
                          <div className="font-medium">{bodySize.toFixed(5)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Диапазон:</span>
                          <div className="font-medium">{totalRange.toFixed(5)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Верх. тень:</span>
                          <div className="font-medium">{upperShadow.toFixed(5)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Нижн. тень:</span>
                          <div className="font-medium">{lowerShadow.toFixed(5)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}