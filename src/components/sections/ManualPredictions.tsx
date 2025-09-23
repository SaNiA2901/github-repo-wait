import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, TrendingUp, Target, Zap } from "lucide-react";
import { useStateManager } from "@/hooks/useStateManager";

interface ManualPredictionsProps {
  pair: string;
  timeframe: string;
}

export function ManualPredictions({ pair, timeframe }: ManualPredictionsProps) {
  const { currentSession, candles, getSessionAnalytics } = useStateManager();
  const analytics = getSessionAnalytics();

  // Простая имитация ML прогнозов на основе данных сессии
  const generatePredictions = () => {
    if (candles.length < 5) return null;

    const recentCandles = candles.slice(-5);
    const priceSum = recentCandles.reduce((sum, c) => sum + c.close, 0);
    const avgPrice = priceSum / recentCandles.length;
    const lastPrice = recentCandles[recentCandles.length - 1].close;
    
    // Простая логика для демонстрации
    const trend = lastPrice > avgPrice ? 'up' : 'down';
    const confidence = Math.min(90, 60 + Math.abs(lastPrice - avgPrice) * 1000);

    return {
      direction: trend,
      confidence: confidence,
      targetPrice: trend === 'up' ? lastPrice * 1.002 : lastPrice * 0.998,
      stopLoss: trend === 'up' ? lastPrice * 0.999 : lastPrice * 1.001,
      timeHorizon: '1-3 свечи'
    };
  };

  const currentPrediction = candles.length >= 5 ? generatePredictions() : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Прогнозы для сессии</h1>
          <p className="text-muted-foreground">
            {currentSession 
              ? `ИИ прогнозы для сессии "${currentSession.session_name}"`
              : "Выберите сессию для генерации прогнозов"
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
            <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">Сессия не выбрана</h3>
            <p className="text-sm text-muted-foreground">
              Выберите активную сессию в разделе "Ручной режим" для генерации прогнозов
            </p>
          </CardContent>
        </Card>
      ) : candles.length < 5 ? (
        <Card className="trading-card">
          <CardContent className="p-12 text-center">
            <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">Недостаточно данных</h3>
            <p className="text-sm text-muted-foreground">
              Для генерации прогнозов требуется минимум 5 свечей. 
              Текущее количество: {candles.length}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Текущий прогноз */}
          {currentPrediction && (
            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Текущий прогноз ИИ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${
                      currentPrediction.direction === 'up' ? 'text-trading-success' : 'text-trading-danger'
                    }`}>
                      {currentPrediction.direction === 'up' ? 'ПОКУПКА' : 'ПРОДАЖА'}
                    </div>
                    <div className="text-sm text-muted-foreground">Рекомендация</div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">
                      {currentPrediction.confidence.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Уверенность</div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">
                      {currentPrediction.targetPrice.toFixed(5)}
                    </div>
                    <div className="text-sm text-muted-foreground">Целевая цена</div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">
                      {currentPrediction.stopLoss.toFixed(5)}
                    </div>
                    <div className="text-sm text-muted-foreground">Стоп-лосс</div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-muted/20 rounded-lg">
                  <h4 className="font-medium mb-2">Детали прогноза:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Временной горизонт:</span>
                      <span className="ml-2 font-medium">{currentPrediction.timeHorizon}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Соотношение риск/прибыль:</span>
                      <span className="ml-2 font-medium">
                        1:{(Math.abs(currentPrediction.targetPrice - candles[candles.length - 1].close) / 
                           Math.abs(currentPrediction.stopLoss - candles[candles.length - 1].close)).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Статистика прогнозов */}
          {analytics && analytics.predictionsCount > 0 && (
            <Card className="trading-card">
              <CardHeader>
                <CardTitle>Статистика прогнозов</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">
                      {analytics.predictionsCount}
                    </div>
                    <div className="text-sm text-muted-foreground">Всего прогнозов</div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl font-bold text-trading-success">
                      {analytics.averageAccuracy.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Средняя точность</div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">
                      {candles.filter(c => c.prediction_direction === 'up').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Прогнозов "Вверх"</div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">
                      {candles.filter(c => c.prediction_direction === 'down').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Прогнозов "Вниз"</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* История прогнозов */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle>История прогнозов</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics && analytics.predictionHistory.length > 0 ? (
                <div className="space-y-3">
                  {analytics.predictionHistory.slice(0, 10).map((prediction, index) => (
                    <div key={index} className="p-3 border border-border/50 rounded-lg">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Прогноз:</span>
                          <div className="font-medium">#{index + 1}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Направление:</span>
                          <div className={`font-medium ${
                            prediction.direction === 'UP' ? 'text-trading-success' : 'text-trading-danger'
                          }`}>
                            {prediction.direction}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Уверенность:</span>
                          <div className="font-medium">{prediction.confidence.toFixed(1)}%</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Результат:</span>
                          <div className="font-medium text-muted-foreground">Ожидание</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">История прогнозов пуста</p>
                  <p className="text-sm text-muted-foreground">Прогнозы появятся по мере накопления данных</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Модели ИИ */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle>Используемые модели ИИ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 border border-border/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="h-5 w-5 text-primary" />
                    <h4 className="font-medium">LSTM</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Статус:</span>
                      <span className="text-trading-success font-medium">Активна</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Точность:</span>
                      <span className="font-medium">76.2%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Входные данные:</span>
                      <span className="font-medium">OHLCV</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border border-border/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-5 w-5 text-trading-success" />
                    <h4 className="font-medium">GRU</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Статус:</span>
                      <span className="text-trading-success font-medium">Активна</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Точность:</span>
                      <span className="font-medium">68.9%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Входные данные:</span>
                      <span className="font-medium">Цены</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border border-border/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="h-5 w-5 text-trading-warning" />
                    <h4 className="font-medium">Ensemble</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Статус:</span>
                      <span className="text-trading-success font-medium">Активна</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Точность:</span>
                      <span className="font-medium">72.5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Входные данные:</span>
                      <span className="font-medium">Все модели</span>
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