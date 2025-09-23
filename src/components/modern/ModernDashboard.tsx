import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import BinaryOptionsPredictor from "@/components/ui/BinaryOptionsPredictor";
import PriceChart from "@/components/ui/PriceChart";
import TechnicalIndicators from "@/components/ui/TechnicalIndicators";
import MLPredictions from "@/components/ui/MLPredictions";
import AdvancedAnalytics from "@/components/ui/AdvancedAnalytics";
import SessionBasedMarketOverview from "@/components/ui/SessionBasedMarketOverview";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Brain, 
  Target,
  Zap,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ModernDashboardProps {
  selectedPair: string;
  timeframe: string;
}

export function ModernDashboard({ selectedPair, timeframe }: ModernDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data for demonstration
  const marketStats = [
    {
      title: "Portfolio Value",
      value: "$24,689.50",
      change: "+2.34%",
      positive: true,
      icon: DollarSign
    },
    {
      title: "Today's P&L",
      value: "+$1,247.80",
      change: "+5.32%",
      positive: true,
      icon: TrendingUp
    },
    {
      title: "Active Positions",
      value: "12",
      change: "+2",
      positive: true,
      icon: Target
    },
    {
      title: "Win Rate",
      value: "67.8%",
      change: "+3.2%",
      positive: true,
      icon: Activity
    }
  ];

  const quickActions = [
    { title: "New Position", icon: Target, variant: "default" as const },
    { title: "AI Analysis", icon: Brain, variant: "secondary" as const },
    { title: "Market Scan", icon: BarChart3, variant: "secondary" as const },
    { title: "Alerts", icon: Zap, variant: "secondary" as const }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {marketStats.map((stat, index) => (
          <Card key={index} className="trading-card hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {stat.positive ? (
                      <ArrowUpRight className="h-4 w-4 text-trading-success" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-trading-danger" />
                    )}
                    <span className={cn(
                      "text-sm font-medium",
                      stat.positive ? "text-trading-success" : "text-trading-danger"
                    )}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className={cn(
                  "p-3 rounded-xl",
                  stat.positive ? "bg-trading-success/10" : "bg-trading-danger/10"
                )}>
                  <stat.icon className={cn(
                    "h-6 w-6",
                    stat.positive ? "text-trading-success" : "text-trading-danger"
                  )} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="trading-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant}
                className="h-auto p-4 flex flex-col items-center gap-2 trading-button-primary"
              >
                <action.icon className="h-6 w-6" />
                <span className="text-sm font-medium">{action.title}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Market Overview */}
        <div className="lg:col-span-1">
          <ErrorBoundary>
            <SessionBasedMarketOverview pair={selectedPair} timeframe={timeframe} />
          </ErrorBoundary>
        </div>

        {/* Main Trading Interface */}
        <div className="lg:col-span-3">
          <Card className="trading-card">
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="border-b border-border/50 px-6 pt-6">
                  <TabsList className="grid w-full grid-cols-5 bg-muted/30">
                    <TabsTrigger 
                      value="overview" 
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger 
                      value="trading" 
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Trading
                    </TabsTrigger>
                    <TabsTrigger 
                      value="analysis" 
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <Activity className="h-4 w-4 mr-2" />
                      Analysis
                    </TabsTrigger>
                    <TabsTrigger 
                      value="ai" 
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      AI
                    </TabsTrigger>
                    <TabsTrigger 
                      value="analytics" 
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <PieChart className="h-4 w-4 mr-2" />
                      Analytics
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="p-6">
                  <TabsContent value="overview" className="mt-0">
                    <ErrorBoundary>
                      <PriceChart pair={selectedPair} timeframe={timeframe} />
                    </ErrorBoundary>
                  </TabsContent>

                  <TabsContent value="trading" className="mt-0">
                    <ErrorBoundary>
                      <BinaryOptionsPredictor pair={selectedPair} timeframe={timeframe} />
                    </ErrorBoundary>
                  </TabsContent>

                  <TabsContent value="analysis" className="mt-0">
                    <ErrorBoundary>
                      <TechnicalIndicators pair={selectedPair} timeframe={timeframe} />
                    </ErrorBoundary>
                  </TabsContent>

                  <TabsContent value="ai" className="mt-0">
                    <ErrorBoundary>
                      <MLPredictions pair={selectedPair} timeframe={timeframe} />
                    </ErrorBoundary>
                  </TabsContent>

                  <TabsContent value="analytics" className="mt-0">
                    <ErrorBoundary>
                      <AdvancedAnalytics pair={selectedPair} timeframe={timeframe} />
                    </ErrorBoundary>
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}