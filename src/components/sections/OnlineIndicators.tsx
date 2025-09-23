import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, TrendingUp, BarChart3, Target } from "lucide-react";
import TechnicalIndicators from "@/components/ui/TechnicalIndicators";
import RSIIndicator from "@/components/ui/RSIIndicator";
import MACDIndicator from "@/components/ui/MACDIndicator";
import MovingAveragesIndicator from "@/components/ui/MovingAveragesIndicator";
import StochasticIndicator from "@/components/ui/StochasticIndicator";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { useIndicatorData } from "@/hooks/useIndicatorData";

interface OnlineIndicatorsProps {
  pair: string;
  timeframe: string;
}

export function OnlineIndicators({ pair, timeframe }: OnlineIndicatorsProps) {
  const { indicators, indicatorData } = useIndicatorData(pair, timeframe);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Технические индикаторы</h1>
          <p className="text-muted-foreground">Анализ технических индикаторов для {pair}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{pair}</span>
          <span>•</span>
          <span>{timeframe}</span>
        </div>
      </div>

      {/* Общий обзор индикаторов */}
      <Card className="trading-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Обзор технических индикаторов
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorBoundary>
            <TechnicalIndicators pair={pair} timeframe={timeframe} />
          </ErrorBoundary>
        </CardContent>
      </Card>

      {/* Основные индикаторы */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="trading-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-trading-success" />
              RSI (Relative Strength Index)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ErrorBoundary>
              <RSIIndicator rsi={indicators.rsi} />
            </ErrorBoundary>
          </CardContent>
        </Card>

        <Card className="trading-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              MACD
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ErrorBoundary>
              <MACDIndicator macd={indicators.macd} chartData={indicatorData} />
            </ErrorBoundary>
          </CardContent>
        </Card>
      </div>

      {/* Дополнительные индикаторы */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="trading-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-trading-warning" />
              Скользящие средние
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ErrorBoundary>
              <MovingAveragesIndicator ma20={indicators.ma20} ma50={indicators.ma50} />
            </ErrorBoundary>
          </CardContent>
        </Card>

        <Card className="trading-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-trading-info" />
              Стохастический осциллятор
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ErrorBoundary>
              <StochasticIndicator stochastic={indicators.stochastic} />
            </ErrorBoundary>
          </CardContent>
        </Card>
      </div>

      {/* Сводка сигналов */}
      <Card className="trading-card">
        <CardHeader>
          <CardTitle>Сводка торговых сигналов</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-trading-success">Покупка</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>RSI (14)</span>
                  <span className="text-trading-success">ПОКУПКА</span>
                </div>
                <div className="flex justify-between">
                  <span>MA (20/50)</span>
                  <span className="text-trading-success">ПОКУПКА</span>
                </div>
                <div className="flex justify-between">
                  <span>Bollinger Bands</span>
                  <span className="text-trading-success">ПОКУПКА</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-muted-foreground">Нейтрально</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>MACD</span>
                  <span className="text-muted-foreground">НЕЙТРАЛЬНО</span>
                </div>
                <div className="flex justify-between">
                  <span>Stochastic</span>
                  <span className="text-muted-foreground">НЕЙТРАЛЬНО</span>
                </div>
                <div className="flex justify-between">
                  <span>Williams %R</span>
                  <span className="text-muted-foreground">НЕЙТРАЛЬНО</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-trading-danger">Продажа</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>CCI (20)</span>
                  <span className="text-trading-danger">ПРОДАЖА</span>
                </div>
                <div className="flex justify-between">
                  <span>ADX (14)</span>
                  <span className="text-trading-danger">ПРОДАЖА</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}