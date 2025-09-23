import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SessionCreatorProps {
  onSessionCreated: (session: any) => void;
}

export function SessionCreator({ onSessionCreated }: SessionCreatorProps) {
  const [sessionName, setSessionName] = useState("");
  const [pair, setPair] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const pairs = [
    "EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF", "AUD/USD",
    "USD/CAD", "NZD/USD", "EUR/GBP", "EUR/JPY", "GBP/JPY",
    "BTC/USD", "ETH/USD", "XRP/USD"
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

  const handleCreateSession = async () => {
    if (!sessionName.trim() || !pair || !timeframe || !startDate || !startTime) {
      toast({
        title: "Ошибка",
        description: "Заполните все поля для создания сессии",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      const session = {
        id: Date.now().toString(),
        session_name: sessionName.trim(),
        pair,
        timeframe,
        start_time: `${startDate}T${startTime}`,
        created_at: new Date().toISOString(),
        candles_count: 0,
        status: 'active'
      };

      // Сохраняем в localStorage
      const existingSessions = JSON.parse(localStorage.getItem('trading_sessions') || '[]');
      existingSessions.push(session);
      localStorage.setItem('trading_sessions', JSON.stringify(existingSessions));

      onSessionCreated(session);
      
      // Очищаем форму
      setSessionName("");
      setPair("");
      setTimeframe("");
      setStartDate("");
      setStartTime("");

      toast({
        title: "Успешно",
        description: `Сессия "${session.session_name}" создана`,
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось создать сессию",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Устанавливаем текущую дату и время по умолчанию
  const getCurrentDateTime = () => {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0].substring(0, 5);
    return { date, time };
  };

  const handleSetCurrentTime = () => {
    const { date, time } = getCurrentDateTime();
    setStartDate(date);
    setStartTime(time);
  };

  return (
    <Card className="trading-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlusCircle className="h-5 w-5 text-primary" />
          Создать новую сессию
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sessionName">Название сессии</Label>
            <Input
              id="sessionName"
              placeholder="Например: EUR/USD Анализ"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pair">Валютная пара</Label>
            <Select value={pair} onValueChange={setPair}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите пару" />
              </SelectTrigger>
              <SelectContent>
                {pairs.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeframe">Таймфрейм</Label>
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите таймфрейм" />
              </SelectTrigger>
              <SelectContent>
                {timeframes.map((tf) => (
                  <SelectItem key={tf.value} value={tf.value}>{tf.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Время начала сессии</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSetCurrentTime}
              className="w-full"
            >
              <Clock className="h-4 w-4 mr-2" />
              Текущее время
            </Button>
          </div>
        </div>

        <Button 
          onClick={handleCreateSession} 
          disabled={isCreating}
          className="w-full"
        >
          {isCreating ? "Создаем..." : "Создать сессию"}
        </Button>
      </CardContent>
    </Card>
  );
}