import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Maximize } from "lucide-react";
import PriceChart from "@/components/ui/PriceChart";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

interface OnlineChartsProps {
  pair: string;
  timeframe: string;
}

export function OnlineCharts({ pair, timeframe }: OnlineChartsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Графики</h1>
          <p className="text-muted-foreground">Анализ графиков валютных пар онлайн</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{pair}</span>
          <span>•</span>
          <span>{timeframe}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Основной график */}
        <Card className="lg:col-span-3 trading-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              График {pair}
            </CardTitle>
            <Maximize className="h-5 w-5 text-muted-foreground hover:text-foreground cursor-pointer" />
          </CardHeader>
          <CardContent>
            <ErrorBoundary>
              <PriceChart pair={pair} timeframe={timeframe} />
            </ErrorBoundary>
          </CardContent>
        </Card>

        {/* Панель инструментов */}
        <Card className="trading-card">
          <CardHeader>
            <CardTitle className="text-sm">Инструменты графика</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Стиль отображения</h4>
              <div className="grid grid-cols-2 gap-2">
                <button className="p-2 text-xs bg-primary text-primary-foreground rounded">Свечи</button>
                <button className="p-2 text-xs bg-muted text-muted-foreground rounded">Линия</button>
                <button className="p-2 text-xs bg-muted text-muted-foreground rounded">Бары</button>
                <button className="p-2 text-xs bg-muted text-muted-foreground rounded">Область</button>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Временные рамки</h4>
              <div className="grid grid-cols-2 gap-1 text-xs">
                {["1M", "5M", "15M", "30M", "1H", "4H", "1D", "1W"].map((tf) => (
                  <button 
                    key={tf}
                    className={`p-1 rounded ${tf === timeframe.toUpperCase() ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Дополнительные графики */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="trading-card">
          <CardHeader>
            <CardTitle className="text-sm">Объемы</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-32 bg-muted/20 rounded flex items-center justify-center">
              <span className="text-sm text-muted-foreground">График объемов</span>
            </div>
          </CardContent>
        </Card>

        <Card className="trading-card">
          <CardHeader>
            <CardTitle className="text-sm">Глубина рынка</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-32 bg-muted/20 rounded flex items-center justify-center">
              <span className="text-sm text-muted-foreground">Стакан заявок</span>
            </div>
          </CardContent>
        </Card>

        <Card className="trading-card">
          <CardHeader>
            <CardTitle className="text-sm">Тепловая карта</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-32 bg-muted/20 rounded flex items-center justify-center">
              <span className="text-sm text-muted-foreground">Корреляция пар</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}