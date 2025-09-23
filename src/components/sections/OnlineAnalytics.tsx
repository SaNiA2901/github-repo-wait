import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, TrendingUp, BarChart3, Activity } from "lucide-react";
import AdvancedAnalytics from "@/components/ui/AdvancedAnalytics";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

interface OnlineAnalyticsProps {
  pair: string;
  timeframe: string;
}

export function OnlineAnalytics({ pair, timeframe }: OnlineAnalyticsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Аналитика</h1>
          <p className="text-muted-foreground">Глубокая аналитика валютных пар</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{pair}</span>
          <span>•</span>
          <span>{timeframe}</span>
        </div>
      </div>

      {/* Основная аналитика */}
      <Card className="trading-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-primary" />
            Расширенная аналитика
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorBoundary>
            <AdvancedAnalytics pair={pair} timeframe={timeframe} />
          </ErrorBoundary>
        </CardContent>
      </Card>

      {/* Аналитические панели */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="trading-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-trading-success" />
              Трендовый анализ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Основной тренд</span>
                <span className="text-trading-success font-medium">Восходящий</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Сила тренда</span>
                <span className="font-medium">78%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Продолжительность</span>
                <span className="font-medium">5 дней</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="trading-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4 text-primary" />
              Волатильность
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Текущая</span>
                <span className="font-medium">0.034%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Средняя (30д)</span>
                <span className="font-medium">0.042%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Максимальная</span>
                <span className="font-medium">0.089%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="trading-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4 text-trading-warning" />
              Ликвидность
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Уровень</span>
                <span className="text-trading-success font-medium">Высокий</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Спред</span>
                <span className="font-medium">0.8 пипса</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Объем (24ч)</span>
                <span className="font-medium">$2.4B</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Корреляционный анализ */}
      <Card className="trading-card">
        <CardHeader>
          <CardTitle>Корреляционный анализ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { pair: "GBP/USD", correlation: 0.76, color: "text-trading-success" },
              { pair: "AUD/USD", correlation: 0.64, color: "text-trading-success" },
              { pair: "USD/JPY", correlation: -0.45, color: "text-trading-danger" },
              { pair: "USD/CHF", correlation: -0.82, color: "text-trading-danger" }
            ].map((item) => (
              <div key={item.pair} className="p-3 bg-muted/20 rounded-lg">
                <div className="text-sm font-medium">{item.pair}</div>
                <div className={`text-lg font-bold ${item.color}`}>
                  {item.correlation > 0 ? '+' : ''}{item.correlation}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}