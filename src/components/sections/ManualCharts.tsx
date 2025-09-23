import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Maximize } from "lucide-react";
import PriceChart from "@/components/ui/PriceChart";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { useStateManager } from "@/hooks/useStateManager";

interface ManualChartsProps {
  pair: string;
  timeframe: string;
}

export function ManualCharts({ pair, timeframe }: ManualChartsProps) {
  const { currentSession, candles } = useStateManager();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Графики сессии</h1>
          <p className="text-muted-foreground">
            {currentSession 
              ? `Анализ графиков сессии "${currentSession.session_name}"`
              : "Выберите сессию для просмотра графиков"
            }
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{pair}</span>
          <span>•</span>
          <span>{timeframe}</span>
          {currentSession && (
            <>
              <span>•</span>
              <span>{candles.length} свечей</span>
            </>
          )}
        </div>
      </div>

      {!currentSession ? (
        <Card className="trading-card">
          <CardContent className="p-12 text-center">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">Сессия не выбрана</h3>
            <p className="text-sm text-muted-foreground">
              Выберите активную сессию в разделе "Ручной режим" для просмотра графиков
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Основной график */}
            <Card className="lg:col-span-3 trading-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  График сессии "{currentSession.session_name}"
                </CardTitle>
                <Maximize className="h-5 w-5 text-muted-foreground hover:text-foreground cursor-pointer" />
              </CardHeader>
              <CardContent>
                <ErrorBoundary>
                  <PriceChart pair={pair} timeframe={timeframe} />
                </ErrorBoundary>
              </CardContent>
            </Card>

            {/* Информация о сессии */}
            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="text-sm">Информация о сессии</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Название</div>
                  <div className="font-medium text-sm">{currentSession.session_name}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Валютная пара</div>
                  <div className="font-medium text-sm">{currentSession.pair}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Таймфрейм</div>
                  <div className="font-medium text-sm">{currentSession.timeframe}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Начало</div>
                  <div className="font-medium text-sm">
                    {new Date(currentSession.start_time).toLocaleString('ru-RU')}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Свечей</div>
                  <div className="font-medium text-sm">{candles.length}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Статистика по свечам */}
          {candles.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="trading-card">
                <CardHeader>
                  <CardTitle className="text-sm">Ценовой диапазон</CardTitle>
                </CardHeader>
                <CardContent>
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
                      <span>Текущая:</span>
                      <span className="font-medium">{candles[candles.length - 1]?.close.toFixed(5)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="trading-card">
                <CardHeader>
                  <CardTitle className="text-sm">Объемы</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Общий:</span>
                      <span className="font-medium">{candles.reduce((sum, c) => sum + c.volume, 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Средний:</span>
                      <span className="font-medium">{Math.round(candles.reduce((sum, c) => sum + c.volume, 0) / candles.length).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Максимальный:</span>
                      <span className="font-medium">{Math.max(...candles.map(c => c.volume)).toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="trading-card">
                <CardHeader>
                  <CardTitle className="text-sm">Движения</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Восходящих:</span>
                      <span className="text-trading-success font-medium">
                        {candles.filter(c => c.close > c.open).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Нисходящих:</span>
                      <span className="text-trading-danger font-medium">
                        {candles.filter(c => c.close < c.open).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Доджи:</span>
                      <span className="text-muted-foreground font-medium">
                        {candles.filter(c => c.close === c.open).length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="trading-card">
                <CardHeader>
                  <CardTitle className="text-sm">Прогнозы</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Всего:</span>
                      <span className="font-medium">
                        {candles.filter(c => c.prediction_direction).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Покупка:</span>
                      <span className="text-trading-success font-medium">
                        {candles.filter(c => c.prediction_direction === 'up').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Продажа:</span>
                      <span className="text-trading-danger font-medium">
                        {candles.filter(c => c.prediction_direction === 'down').length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}