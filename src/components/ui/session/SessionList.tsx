import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Play, Pause, Calendar, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

interface SessionListProps {
  currentSession: Session | null;
  onSessionSelect: (session: Session) => void;
  onSessionDelete: (sessionId: string) => void;
}

export function SessionList({ currentSession, onSessionSelect, onSessionDelete }: SessionListProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = () => {
    const stored = localStorage.getItem('trading_sessions');
    if (stored) {
      setSessions(JSON.parse(stored));
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(updatedSessions);
    localStorage.setItem('trading_sessions', JSON.stringify(updatedSessions));
    onSessionDelete(sessionId);
    
    toast({
      title: "Сессия удалена",
      description: "Сессия успешно удалена",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-trading-success text-white';
      case 'paused': return 'bg-trading-warning text-white';
      case 'completed': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Активна';
      case 'paused': return 'Приостановлена';
      case 'completed': return 'Завершена';
      default: return 'Неизвестно';
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (sessions.length === 0) {
    return (
      <Card className="trading-card">
        <CardContent className="p-12 text-center">
          <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">Нет созданных сессий</h3>
          <p className="text-sm text-muted-foreground">
            Создайте новую сессию для начала работы с данными
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="trading-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Мои сессии ({sessions.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                currentSession?.id === session.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => onSessionSelect(session)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-foreground">{session.session_name}</h4>
                    <Badge className={getStatusColor(session.status)}>
                      {getStatusText(session.status)}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-center gap-4">
                      <span>{session.pair}</span>
                      <span>•</span>
                      <span>{session.timeframe}</span>
                      <span>•</span>
                      <span>{session.candles_count} свечей</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      <span>Начата: {formatDateTime(session.start_time)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {currentSession?.id === session.id && (
                    <Badge variant="outline" className="text-xs">
                      Активна
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSession(session.id);
                    }}
                    className="text-trading-danger hover:text-trading-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}