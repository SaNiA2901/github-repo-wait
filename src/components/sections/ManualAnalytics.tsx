import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, TrendingUp, BarChart3, Activity } from "lucide-react";
import { useStateManager } from "@/hooks/useStateManager";

interface ManualAnalyticsProps {
  pair: string;
  timeframe: string;
}

export function ManualAnalytics({ pair, timeframe }: ManualAnalyticsProps) {
  const { currentSession, candles, getSessionAnalytics } = useStateManager();
  const analytics = getSessionAnalytics();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Аналитика сессии</h1>
          <p className="text-muted-foreground">
            {currentSession 
              ? `Детальная аналитика сессии "${currentSession.session_name}"`
              : "Выберите сессию для просмотра аналитики"
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
            <PieChart className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">Сессия не выбрана</h3>
            <p className="text-sm text-muted-foreground">
              Выберите активную сессию в разделе "Ручной режим" для просмотра аналитики
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Основная статистика */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="trading-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Всего свечей</p>
                    <p className="text-2xl font-bold text-foreground">{analytics?.totalCandles || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="trading-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-trading-success/10 rounded-xl">
                    <TrendingUp className="h-6 w-6 text-trading-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Прогнозов</p>
                    <p className="text-2xl font-bold text-foreground">{analytics?.predictionsCount || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="trading-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-trading-warning/10 rounded-xl">
                    <Activity className="h-6 w-6 text-trading-warning" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Точность</p>
                    <p className="text-2xl font-bold text-foreground">{analytics?.averageAccuracy?.toFixed(1) || 0}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="trading-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-muted/30 rounded-xl">
                    <PieChart className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Продолжительность</p>
                    <p className="text-lg font-bold text-foreground">
                      {Math.round((new Date().getTime() - new Date(currentSession.start_time).getTime()) / (1000 * 60 * 60 * 24))} дн.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Детальная аналитика */}
          {candles.length > 0 && (
            <>
              {/* Ценовой анализ */}
              <Card className="trading-card">
                <CardHeader>
                  <CardTitle>Ценовой анализ</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Ценовые уровни</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Максимум:</span>
                          <span className="font-medium">{Math.max(...candles.map(c => c.high)).toFixed(5)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Минимум:</span>
                          <span className="font-medium">{Math.min(...candles.map(c => c.low)).toFixed(5)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Размах:</span>
                          <span className="font-medium">
                            {(Math.max(...candles.map(c => c.high)) - Math.min(...candles.map(c => c.low))).toFixed(5)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Средняя цена:</span>
                          <span className="font-medium">
                            {(candles.reduce((sum, c) => sum + (c.high + c.low + c.close + c.open) / 4, 0) / candles.length).toFixed(5)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Движения свечей</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Восходящие:</span>
                          <span className="text-trading-success font-medium">
                            {candles.filter(c => c.close > c.open).length} ({((candles.filter(c => c.close > c.open).length / candles.length) * 100).toFixed(1)}%)
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Нисходящие:</span>
                          <span className="text-trading-danger font-medium">
                            {candles.filter(c => c.close < c.open).length} ({((candles.filter(c => c.close < c.open).length / candles.length) * 100).toFixed(1)}%)
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Доджи:</span>
                          <span className="text-muted-foreground font-medium">
                            {candles.filter(c => c.close === c.open).length}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Волатильность</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Средний размер тела:</span>
                          <span className="font-medium">
                            {(candles.reduce((sum, c) => sum + Math.abs(c.close - c.open), 0) / candles.length).toFixed(5)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Средний размах:</span>
                          <span className="font-medium">
                            {(candles.reduce((sum, c) => sum + (c.high - c.low), 0) / candles.length).toFixed(5)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Макс. размах:</span>
                          <span className="font-medium">
                            {Math.max(...candles.map(c => c.high - c.low)).toFixed(5)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Анализ объемов */}
              <Card className="trading-card">
                <CardHeader>
                  <CardTitle>Анализ объемов</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground">
                        {candles.reduce((sum, c) => sum + c.volume, 0).toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Общий объем</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground">
                        {Math.round(candles.reduce((sum, c) => sum + c.volume, 0) / candles.length).toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Средний объем</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground">
                        {Math.max(...candles.map(c => c.volume)).toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Максимальный</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground">
                        {Math.min(...candles.map(c => c.volume)).toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Минимальный</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Анализ прогнозов */}
              {analytics && analytics.predictionsCount > 0 && (
                <Card className="trading-card">
                  <CardHeader>
                    <CardTitle>Анализ прогнозов</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-medium">Общая статистика</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Всего прогнозов:</span>
                            <span className="font-medium">{analytics.predictionsCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Средняя точность:</span>
                            <span className="font-medium">{analytics.averageAccuracy.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Покрытие:</span>
                            <span className="font-medium">
                              {((analytics.predictionsCount / analytics.totalCandles) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-medium">По направлениям</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Покупка (UP):</span>
                            <span className="text-trading-success font-medium">
                              {candles.filter(c => c.prediction_direction === 'up').length}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Продажа (DOWN):</span>
                            <span className="text-trading-danger font-medium">
                              {candles.filter(c => c.prediction_direction === 'down').length}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-medium">Последние прогнозы</h4>
                        <div className="space-y-2 text-xs">
                          {analytics.predictionHistory.slice(0, 5).map((pred, index) => (
                            <div key={index} className="flex justify-between">
                              <span>#{index + 1}:</span>
                              <span className={pred.direction === 'UP' ? 'text-trading-success' : 'text-trading-danger'}>
                                {pred.direction} ({pred.confidence.toFixed(1)}%)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}