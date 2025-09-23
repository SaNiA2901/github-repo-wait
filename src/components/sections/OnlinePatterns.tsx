import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

interface OnlinePatternsProps {
  pair: string;
  timeframe: string;
}

export function OnlinePatterns({ pair, timeframe }: OnlinePatternsProps) {
  const detectedPatterns = [
    {
      name: "Голова и плечи",
      type: "reversal",
      reliability: 85,
      direction: "bearish",
      timeframe: "4H",
      status: "completed"
    },
    {
      name: "Восходящий треугольник",
      type: "continuation",
      reliability: 72,
      direction: "bullish", 
      timeframe: "1H",
      status: "forming"
    },
    {
      name: "Двойное дно",
      type: "reversal",
      reliability: 78,
      direction: "bullish",
      timeframe: "1D",
      status: "confirmed"
    },
    {
      name: "Флаг",
      type: "continuation",
      reliability: 91,
      direction: "bullish",
      timeframe: "30M",
      status: "forming"
    }
  ];

  const candlestickPatterns = [
    { name: "Молот", reliability: 76, direction: "bullish", candles: 1 },
    { name: "Доджи", reliability: 65, direction: "neutral", candles: 1 },
    { name: "Поглощение медвежье", reliability: 82, direction: "bearish", candles: 2 },
    { name: "Утренняя звезда", reliability: 88, direction: "bullish", candles: 3 }
  ];

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
          <h1 className="text-3xl font-bold text-foreground">Анализ паттернов</h1>
          <p className="text-muted-foreground">Обнаружение графических и свечных паттернов</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{pair}</span>
          <span>•</span>
          <span>{timeframe}</span>
        </div>
      </div>

      {/* Графические паттерны */}
      <Card className="trading-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Графические паттерны
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {detectedPatterns.map((pattern, index) => (
              <div key={index} className="p-4 border border-border/50 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{pattern.name}</h4>
                  <Badge 
                    variant={pattern.status === "completed" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {pattern.status === "completed" ? "Завершен" : 
                     pattern.status === "confirmed" ? "Подтвержден" : "Формируется"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Тип:</span>
                    <div className="font-medium">
                      {pattern.type === "reversal" ? "Разворот" : "Продолжение"}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Таймфрейм:</span>
                    <div className="font-medium">{pattern.timeframe}</div>
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
                  <div className="text-sm">
                    <span className="text-muted-foreground">Надежность: </span>
                    <span className="font-bold">{pattern.reliability}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Свечные паттерны */}
      <Card className="trading-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Свечные паттерны
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {candlestickPatterns.map((pattern, index) => (
              <div key={index} className="p-4 border border-border/50 rounded-lg space-y-2">
                <h4 className="font-medium">{pattern.name}</h4>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Свечей:</span>
                  <span className="font-medium">{pattern.candles}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Надежность:</span>
                  <span className="font-bold">{pattern.reliability}%</span>
                </div>
                <div className={`flex items-center gap-1 ${getDirectionColor(pattern.direction)}`}>
                  {getDirectionIcon(pattern.direction)}
                  <span className="text-sm font-medium">
                    {pattern.direction === "bullish" ? "Восходящий" : 
                     pattern.direction === "bearish" ? "Нисходящий" : "Нейтральный"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Сводка паттернов */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="trading-card">
          <CardHeader>
            <CardTitle className="text-sm">Паттерны разворота</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Обнаружено:</span>
                <span className="font-medium">7</span>
              </div>
              <div className="flex justify-between">
                <span>Восходящие:</span>
                <span className="text-trading-success font-medium">4</span>
              </div>
              <div className="flex justify-between">
                <span>Нисходящие:</span>
                <span className="text-trading-danger font-medium">3</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="trading-card">
          <CardHeader>
            <CardTitle className="text-sm">Паттерны продолжения</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Обнаружено:</span>
                <span className="font-medium">5</span>
              </div>
              <div className="flex justify-between">
                <span>Восходящие:</span>
                <span className="text-trading-success font-medium">3</span>
              </div>
              <div className="flex justify-between">
                <span>Нисходящие:</span>
                <span className="text-trading-danger font-medium">2</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="trading-card">
          <CardHeader>
            <CardTitle className="text-sm">Общая статистика</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Всего паттернов:</span>
                <span className="font-medium">16</span>
              </div>
              <div className="flex justify-between">
                <span>Средняя надежность:</span>
                <span className="font-medium">78%</span>
              </div>
              <div className="flex justify-between">
                <span>Сильные сигналы:</span>
                <span className="text-primary font-medium">6</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}