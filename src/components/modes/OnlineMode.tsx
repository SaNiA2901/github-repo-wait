import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Settings, 
  TrendingUp, 
  Brain, 
  BarChart3,
  Activity,
  Target,
  PieChart,
  Zap,
  Key
} from "lucide-react";
import { cn } from "@/lib/utils";

const currencyPairs = [
  "EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF", "AUD/USD", 
  "USD/CAD", "NZD/USD", "EUR/GBP", "EUR/JPY", "GBP/JPY"
];

const timeframes = [
  { value: "1m", label: "1 минута" },
  { value: "5m", label: "5 минут" },
  { value: "15m", label: "15 минут" },
  { value: "30m", label: "30 минут" },
  { value: "1h", label: "1 час" },
  { value: "4h", label: "4 часа" },
  { value: "1d", label: "1 день" }
];

const providers = [
  { value: "alpha_vantage", label: "Alpha Vantage" },
  { value: "finhub", label: "Finnhub" },
  { value: "twelve_data", label: "Twelve Data" },
  { value: "yahoo_finance", label: "Yahoo Finance" }
];

export function OnlineMode() {
  const [selectedPair, setSelectedPair] = useState("EUR/USD");
  const [selectedTimeframe, setSelectedTimeframe] = useState("1h");
  const [selectedProvider, setSelectedProvider] = useState("alpha_vantage");
  const [apiKey, setApiKey] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    // Имитация анализа
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 3000);
  };

  const analysisStatus = [
    { name: "Технический анализ", status: "completed", accuracy: 85 },
    { name: "Анализ паттернов", status: "completed", accuracy: 78 },
    { name: "Индикаторы", status: "completed", accuracy: 92 },
    { name: "ИИ модель", status: "processing", accuracy: null },
    { name: "Сентимент анализ", status: "pending", accuracy: null }
  ];

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Онлайн режим</h1>
          <p className="text-muted-foreground">Анализ валютных пар с использованием поставщиков котировок</p>
        </div>
        <Badge variant="secondary" className="bg-trading-success/10 text-trading-success">
          <div className="w-2 h-2 bg-trading-success rounded-full mr-2" />
          Подключено
        </Badge>
      </div>

      {/* Настройки анализа */}
      <Card className="trading-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Настройки анализа
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Валютная пара</Label>
              <Select value={selectedPair} onValueChange={setSelectedPair}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencyPairs.map((pair) => (
                    <SelectItem key={pair} value={pair}>
                      {pair}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Таймфрейм</Label>
              <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeframes.map((tf) => (
                    <SelectItem key={tf.value} value={tf.value}>
                      {tf.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Поставщик данных</Label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.value} value={provider.value}>
                      {provider.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              API ключ
            </Label>
            <Input
              type="password"
              placeholder="Введите API ключ поставщика данных"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>

          <Button 
            onClick={handleAnalyze}
            disabled={isAnalyzing || !apiKey}
            className="w-full trading-button-primary"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                Анализируем...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Запустить анализ
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Статус анализа */}
      {isAnalyzing && (
        <Card className="trading-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary animate-pulse" />
              Статус анализа
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysisStatus.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      item.status === "completed" && "bg-trading-success",
                      item.status === "processing" && "bg-trading-warning animate-pulse",
                      item.status === "pending" && "bg-muted-foreground/30"
                    )} />
                    <span className="font-medium">{item.name}</span>
                  </div>
                  {item.accuracy && (
                    <Badge variant="secondary">
                      {item.accuracy}% точность
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Краткие результаты */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="trading-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-trading-success/10 rounded-xl">
                <TrendingUp className="h-6 w-6 text-trading-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Общий прогноз</p>
                <p className="text-xl font-bold text-trading-success">Восходящий тренд</p>
                <p className="text-sm text-muted-foreground">Вероятность: 78%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="trading-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ИИ уверенность</p>
                <p className="text-xl font-bold text-foreground">85.4%</p>
                <p className="text-sm text-muted-foreground">Высокая точность</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="trading-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-trading-warning/10 rounded-xl">
                <Target className="h-6 w-6 text-trading-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Рекомендация</p>
                <p className="text-xl font-bold text-foreground">ПОКУПКА</p>
                <p className="text-sm text-muted-foreground">До 1.0950</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}