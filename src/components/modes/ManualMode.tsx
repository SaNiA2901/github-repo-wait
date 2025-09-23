import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ManualCharts } from "@/components/sections/ManualCharts";
import { ManualAnalytics } from "@/components/sections/ManualAnalytics";
import { ManualIndicators } from "@/components/sections/ManualIndicators";
import { ManualPatterns } from "@/components/sections/ManualPatterns";
import { ManualPredictions } from "@/components/sections/ManualPredictions";
import { SessionCreator } from "@/components/ui/session/SessionCreator";
import { SessionList } from "@/components/ui/session/SessionList";
import { CandleDataInput } from "@/components/ui/candle/CandleDataInput";
import { Database, BarChart3 } from "lucide-react";

interface ManualModeProps {
  pair?: string;
  timeframe?: string;
}

interface Session {
  id: string;
  session_name: string;
  pair: string;
  timeframe: string;
  start_time: string;
  created_at: string;
  candles_count: number;
  status: 'active' | 'paused' | 'completed';
}

interface CandleData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: string;
}

export function ManualMode({ pair = "EUR/USD", timeframe = "1h" }: ManualModeProps = {}) {
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [sessionCandles, setSessionCandles] = useState<CandleData[]>([]);

  useEffect(() => {
    // Загружаем последнюю активную сессию при монтировании
    const sessions = JSON.parse(localStorage.getItem('trading_sessions') || '[]');
    const activeSession = sessions.find((s: Session) => s.status === 'active');
    if (activeSession) {
      setCurrentSession(activeSession);
      loadSessionCandles(activeSession.id);
    }
  }, []);

  const loadSessionCandles = (sessionId: string) => {
    const candles = JSON.parse(localStorage.getItem(`session_candles_${sessionId}`) || '[]');
    setSessionCandles(candles);
  };

  const handleSessionCreated = (session: Session) => {
    setCurrentSession(session);
    setSessionCandles([]);
  };

  const handleSessionSelect = (session: Session) => {
    setCurrentSession(session);
    loadSessionCandles(session.id);
  };

  const handleSessionDelete = (sessionId: string) => {
    if (currentSession?.id === sessionId) {
      setCurrentSession(null);
      setSessionCandles([]);
    }
    // Удаляем данные свечей сессии
    localStorage.removeItem(`session_candles_${sessionId}`);
  };

  const getNextCandleTime = () => {
    if (!currentSession) return new Date().toISOString();
    
    if (sessionCandles.length === 0) {
      return currentSession.start_time;
    }

    const lastCandle = sessionCandles[sessionCandles.length - 1];
    const lastTime = new Date(lastCandle.timestamp);
    
    // Добавляем интервал в зависимости от таймфрейма
    const timeframeMinutes = {
      '1m': 1,
      '5m': 5,
      '15m': 15,
      '30m': 30,
      '1h': 60,
      '4h': 240,
      '1d': 1440
    };

    const minutes = timeframeMinutes[currentSession.timeframe as keyof typeof timeframeMinutes] || 1;
    lastTime.setMinutes(lastTime.getMinutes() + minutes);
    
    return lastTime.toISOString();
  };

  const handleCandleAdded = (candle: CandleData) => {
    if (!currentSession) return;

    const updatedCandles = [...sessionCandles, candle];
    setSessionCandles(updatedCandles);
    
    // Сохраняем свечи в localStorage
    localStorage.setItem(`session_candles_${currentSession.id}`, JSON.stringify(updatedCandles));
    
    // Обновляем счетчик свечей в сессии
    const sessions = JSON.parse(localStorage.getItem('trading_sessions') || '[]');
    const updatedSessions = sessions.map((s: Session) => 
      s.id === currentSession.id ? { ...s, candles_count: updatedCandles.length } : s
    );
    localStorage.setItem('trading_sessions', JSON.stringify(updatedSessions));
    
    setCurrentSession(prev => prev ? { ...prev, candles_count: updatedCandles.length } : null);
  };

  if (!currentSession) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Ручной режим</h1>
          <p className="text-muted-foreground">
            Создайте сессию и вводите данные OHLCV вручную для анализа
          </p>
        </div>

        <SessionCreator onSessionCreated={handleSessionCreated} />
        <SessionList 
          currentSession={currentSession}
          onSessionSelect={handleSessionSelect}
          onSessionDelete={handleSessionDelete}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Ручной режим</h1>
          <p className="text-muted-foreground">
            Сессия: {currentSession.session_name} • {currentSession.pair} • {currentSession.timeframe}
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          Свечей: {sessionCandles.length}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CandleDataInput 
          session={currentSession}
          onCandleAdded={handleCandleAdded}
          nextCandleTime={getNextCandleTime()}
        />
        <SessionList 
          currentSession={currentSession}
          onSessionSelect={handleSessionSelect}
          onSessionDelete={handleSessionDelete}
        />
      </div>

      <Tabs defaultValue="charts" className="w-full">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="charts">Графики</TabsTrigger>
          <TabsTrigger value="analytics">Аналитика</TabsTrigger>
          <TabsTrigger value="indicators">Индикаторы</TabsTrigger>
          <TabsTrigger value="patterns">Паттерны</TabsTrigger>
          <TabsTrigger value="predictions">Прогнозы</TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="space-y-6">
          <ManualCharts pair={currentSession.pair} timeframe={currentSession.timeframe} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <ManualAnalytics pair={currentSession.pair} timeframe={currentSession.timeframe} />
        </TabsContent>

        <TabsContent value="indicators" className="space-y-6">
          <ManualIndicators pair={currentSession.pair} timeframe={currentSession.timeframe} />
        </TabsContent>

        <TabsContent value="patterns" className="space-y-6">
          <ManualPatterns pair={currentSession.pair} timeframe={currentSession.timeframe} />
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          <ManualPredictions pair={currentSession.pair} timeframe={currentSession.timeframe} />
        </TabsContent>
      </Tabs>
    </div>
  );
}