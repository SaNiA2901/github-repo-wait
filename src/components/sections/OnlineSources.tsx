import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Zap, Key, Settings, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

const providers = [
  {
    id: "alpha_vantage",
    name: "Alpha Vantage",
    status: "connected",
    features: ["Real-time", "Historical", "Forex", "Crypto"],
    rateLimit: "5 calls/min",
    latency: "~200ms"
  },
  {
    id: "finnhub", 
    name: "Finnhub",
    status: "not_configured",
    features: ["Real-time", "Forex", "Stocks"],
    rateLimit: "60 calls/min",
    latency: "~100ms"
  },
  {
    id: "twelve_data",
    name: "Twelve Data",
    status: "error",
    features: ["Real-time", "Historical", "Forex", "Crypto", "Commodities"],
    rateLimit: "800 calls/day",
    latency: "~150ms"
  },
  {
    id: "yahoo_finance",
    name: "Yahoo Finance",
    status: "connected",
    features: ["Historical", "Forex", "Stocks"],
    rateLimit: "2000 calls/hour",
    latency: "~300ms"
  }
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case "connected": return <CheckCircle className="h-4 w-4 text-trading-success" />;
    case "error": return <XCircle className="h-4 w-4 text-trading-danger" />;
    default: return <AlertTriangle className="h-4 w-4 text-trading-warning" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "connected": return <Badge className="bg-trading-success/10 text-trading-success">Подключен</Badge>;
    case "error": return <Badge className="bg-trading-danger/10 text-trading-danger">Ошибка</Badge>;
    default: return <Badge className="bg-trading-warning/10 text-trading-warning">Не настроен</Badge>;
  }
};

export function OnlineSources() {
  const [selectedProvider, setSelectedProvider] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isConfiguring, setIsConfiguring] = useState(false);

  const handleConfigureProvider = async () => {
    setIsConfiguring(true);
    // Имитация настройки
    setTimeout(() => {
      setIsConfiguring(false);
      setApiKey("");
      setSelectedProvider("");
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Источники данных</h1>
          <p className="text-muted-foreground">Настройка поставщиков котировок и API ключей</p>
        </div>
        <Badge variant="secondary" className="bg-trading-success/10 text-trading-success">
          <div className="w-2 h-2 bg-trading-success rounded-full mr-2" />
          2 из 4 подключены
        </Badge>
      </div>

      {/* Настройка нового провайдера */}
      <Card className="trading-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Настройка провайдера
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Выберите провайдера</Label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите провайдера" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                API ключ
              </Label>
              <Input
                type="password"
                placeholder="Введите API ключ"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
          </div>

          <Button 
            onClick={handleConfigureProvider}
            disabled={isConfiguring || !selectedProvider || !apiKey}
            className="trading-button-primary"
          >
            {isConfiguring ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                Настраиваем...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Подключить провайдера
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Список провайдеров */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {providers.map((provider) => (
          <Card key={provider.id} className="trading-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(provider.status)}
                  {provider.name}
                </CardTitle>
                {getStatusBadge(provider.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Лимит запросов:</span>
                  <div className="font-medium">{provider.rateLimit}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Задержка:</span>
                  <div className="font-medium">{provider.latency}</div>
                </div>
              </div>

              <div>
                <span className="text-sm text-muted-foreground">Поддерживаемые функции:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {provider.features.map((feature) => (
                    <Badge key={feature} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  {provider.status === "connected" ? "Переподключить" : "Настроить"}
                </Button>
                <Button variant="outline" size="sm">
                  Тест
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Статистика использования */}
      <Card className="trading-card">
        <CardHeader>
          <CardTitle>Статистика использования API</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">1,247</div>
              <div className="text-sm text-muted-foreground">Запросов сегодня</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-trading-success">99.8%</div>
              <div className="text-sm text-muted-foreground">Доступность</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">156ms</div>
              <div className="text-sm text-muted-foreground">Средняя задержка</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-trading-warning">76%</div>
              <div className="text-sm text-muted-foreground">Использование лимита</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Настройки синхронизации */}
      <Card className="trading-card">
        <CardHeader>
          <CardTitle>Настройки синхронизации</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Интервал обновления</Label>
              <Select defaultValue="1s">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1s">1 секунда</SelectItem>
                  <SelectItem value="5s">5 секунд</SelectItem>
                  <SelectItem value="10s">10 секунд</SelectItem>
                  <SelectItem value="30s">30 секунд</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Приоритетный провайдер</Label>
              <Select defaultValue="alpha_vantage">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alpha_vantage">Alpha Vantage</SelectItem>
                  <SelectItem value="yahoo_finance">Yahoo Finance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Резервный провайдер</Label>
              <Select defaultValue="yahoo_finance">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yahoo_finance">Yahoo Finance</SelectItem>
                  <SelectItem value="alpha_vantage">Alpha Vantage</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button className="trading-button-primary">
            Сохранить настройки
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}