import { useState, useEffect } from "react";
import { ModernLayout } from "@/components/layout/ModernLayout";
import { OnlineMode } from "@/components/modes/OnlineMode";
import { ManualMode } from "@/components/modes/ManualMode";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, LineChart } from "lucide-react";

// Подразделы для онлайн режима
import { OnlineCharts } from "@/components/sections/OnlineCharts";
import { OnlineAnalytics } from "@/components/sections/OnlineAnalytics";
import { OnlineIndicators } from "@/components/sections/OnlineIndicators";
import { OnlinePatterns } from "@/components/sections/OnlinePatterns";
import { OnlinePredictions } from "@/components/sections/OnlinePredictions";
import { OnlineSources } from "@/components/sections/OnlineSources";

// Подразделы для ручного режима
import { ManualCharts } from "@/components/sections/ManualCharts";
import { ManualAnalytics } from "@/components/sections/ManualAnalytics";
import { ManualIndicators } from "@/components/sections/ManualIndicators";
import { ManualPatterns } from "@/components/sections/ManualPatterns";
import { ManualPredictions } from "@/components/sections/ManualPredictions";

// Настройки
import { SettingsPage } from "@/components/sections/SettingsPage";

export default function Index() {
  const [activeMode, setActiveMode] = useState("online");
  const [activeSubsection, setActiveSubsection] = useState("");
  const [selectedPair, setSelectedPair] = useState("EUR/USD");
  const [timeframe, setTimeframe] = useState("1h");

  // Инициализация из localStorage
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem('active-mode') || 'online';
      const savedSubsection = localStorage.getItem('active-subsection') || '';
      setActiveMode(savedMode);
      setActiveSubsection(savedSubsection);
    } catch {
      // Значения по умолчанию уже установлены
    }
  }, []);

  // Слушаем события навигации из sidebar
  useEffect(() => {
    const handleNavigationChange = (event: CustomEvent) => {
      const { mode, subsection } = event.detail;
      setActiveMode(mode);
      setActiveSubsection(subsection);
    };

    window.addEventListener('navigation-change', handleNavigationChange as EventListener);
    return () => {
      window.removeEventListener('navigation-change', handleNavigationChange as EventListener);
    };
  }, []);

  // Обновляем localStorage при изменении
  useEffect(() => {
    try {
      localStorage.setItem('active-mode', activeMode);
      localStorage.setItem('active-subsection', activeSubsection);
    } catch {
      // Игнорируем ошибки сохранения
    }
  }, [activeMode, activeSubsection]);

  // Обработчик переключения режимов через табы
  const handleModeChange = (mode: string) => {
    setActiveMode(mode);
    setActiveSubsection("");
    try {
      localStorage.setItem('active-mode', mode);
      localStorage.setItem('active-subsection', '');
    } catch {
      // Игнорируем ошибки сохранения
    }
  };

  // Функция для рендера активного контента
  const renderActiveContent = () => {
    // Если выбраны настройки
    if (activeSubsection === "settings") {
      return <SettingsPage />;
    }

    // Подразделы онлайн режима
    if (activeMode === "online") {
      switch (activeSubsection) {
        case "charts":
          return <OnlineCharts pair={selectedPair} timeframe={timeframe} />;
        case "analytics":
          return <OnlineAnalytics pair={selectedPair} timeframe={timeframe} />;
        case "indicators":
          return <OnlineIndicators pair={selectedPair} timeframe={timeframe} />;
        case "patterns":
          return <OnlinePatterns pair={selectedPair} timeframe={timeframe} />;
        case "predictions":
          return <OnlinePredictions pair={selectedPair} timeframe={timeframe} />;
        case "sources":
          return <OnlineSources />;
        default:
          return <OnlineMode />;
      }
    }

    // Подразделы ручного режима
    if (activeMode === "manual") {
      switch (activeSubsection) {
        case "charts":
          return <ManualCharts pair={selectedPair} timeframe={timeframe} />;
        case "analytics":
          return <ManualAnalytics pair={selectedPair} timeframe={timeframe} />;
        case "indicators":
          return <ManualIndicators pair={selectedPair} timeframe={timeframe} />;
        case "patterns":
          return <ManualPatterns pair={selectedPair} timeframe={timeframe} />;
        case "predictions":
          return <ManualPredictions pair={selectedPair} timeframe={timeframe} />;
        default:
          return <ManualMode pair={selectedPair} timeframe={timeframe} />;
      }
    }

    return <OnlineMode />;
  };

  return (
    <ModernLayout
      selectedPair={selectedPair}
      onPairChange={setSelectedPair}
      timeframe={timeframe}
      onTimeframeChange={setTimeframe}
    >
      <div className="space-y-6">
        {/* Показываем табы только если нет активного подраздела */}
        {!activeSubsection && (
          <Tabs value={activeMode} onValueChange={handleModeChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted/30 p-1">
              <TabsTrigger 
                value="online" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Онлайн режим
              </TabsTrigger>
              <TabsTrigger 
                value="manual" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <LineChart className="h-4 w-4 mr-2" />
                Ручной режим
              </TabsTrigger>
            </TabsList>

            <TabsContent value="online" className="mt-6">
              <OnlineMode />
            </TabsContent>

            <TabsContent value="manual" className="mt-6">
              <ManualMode pair={selectedPair} timeframe={timeframe} />
            </TabsContent>
          </Tabs>
        )}

        {/* Показываем активный контент, если выбран подраздел */}
        {activeSubsection && (
          <div className="space-y-6">
            {renderActiveContent()}
          </div>
        )}
      </div>
    </ModernLayout>
  );
}