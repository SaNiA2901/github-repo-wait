import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, TrendingUp, Target, Zap } from "lucide-react";
import MLPredictions from "@/components/ui/MLPredictions";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

interface OnlinePredictionsProps {
  pair: string;
  timeframe: string;
}

export function OnlinePredictions({ pair, timeframe }: OnlinePredictionsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">ИИ Прогнозы</h1>
          <p className="text-muted-foreground">Прогнозы нейронных сетей для {pair}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{pair}</span>
          <span>•</span>
          <span>{timeframe}</span>
        </div>
      </div>

      {/* Основные прогнозы ML */}
      <Card className="trading-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Прогнозы машинного обучения
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorBoundary>
            <MLPredictions pair={pair} timeframe={timeframe} />
          </ErrorBoundary>
        </CardContent>
      </Card>

      {/* Детальные прогнозы по моделям */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="trading-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-trading-success" />
              LSTM модель
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Направление:</span>
                <span className="text-trading-success font-medium">ПОКУПКА</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Уверенность:</span>
                <span className="font-medium">87.3%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Цель:</span>
                <span className="font-medium">1.0920</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Стоп:</span>
                <span className="font-medium">1.0785</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="trading-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4 text-primary" />
              GRU модель
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Направление:</span>
                <span className="text-trading-success font-medium">ПОКУПКА</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Уверенность:</span>
                <span className="font-medium">72.1%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Цель:</span>
                <span className="font-medium">1.0895</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Стоп:</span>
                <span className="font-medium">1.0810</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="trading-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Zap className="h-4 w-4 text-trading-warning" />
              Transformer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Направление:</span>
                <span className="text-muted-foreground font-medium">НЕЙТРАЛЬНО</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Уверенность:</span>
                <span className="font-medium">54.6%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Диапазон:</span>
                <span className="font-medium">1.0810-1.0890</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Консенсус прогноз */}
      <Card className="trading-card">
        <CardHeader>
          <CardTitle>Консенсус прогноз</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-trading-success">ПОКУПКА</div>
              <div className="text-sm text-muted-foreground">Общий сигнал</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">79.4%</div>
              <div className="text-sm text-muted-foreground">Средняя уверенность</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">1.0905</div>
              <div className="text-sm text-muted-foreground">Целевая цена</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">1.0798</div>
              <div className="text-sm text-muted-foreground">Стоп-лосс</div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-muted/20 rounded-lg">
            <h4 className="font-medium mb-2">Рекомендация:</h4>
            <p className="text-sm text-muted-foreground">
              Большинство моделей указывают на восходящий тренд с высокой уверенностью. 
              Рекомендуется открывать длинные позиции с целью 1.0905 и стоп-лоссом на уровне 1.0798. 
              Соотношение риск/прибыль: 1:2.1
            </p>
          </div>
        </CardContent>
      </Card>

      {/* История точности */}
      <Card className="trading-card">
        <CardHeader>
          <CardTitle>История точности моделей</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted/20 rounded-lg">
              <div className="text-lg font-bold">LSTM</div>
              <div className="text-sm text-muted-foreground mb-2">Последние 30 дней</div>
              <div className="text-xl font-bold text-trading-success">74.2%</div>
            </div>
            <div className="p-4 bg-muted/20 rounded-lg">
              <div className="text-lg font-bold">GRU</div>
              <div className="text-sm text-muted-foreground mb-2">Последние 30 дней</div>
              <div className="text-xl font-bold text-primary">68.7%</div>
            </div>
            <div className="p-4 bg-muted/20 rounded-lg">
              <div className="text-lg font-bold">Transformer</div>
              <div className="text-sm text-muted-foreground mb-2">Последние 30 дней</div>
              <div className="text-xl font-bold text-trading-warning">71.5%</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}