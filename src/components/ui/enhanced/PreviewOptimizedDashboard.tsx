/**
 * Preview Optimized Dashboard
 * Lightweight version for Lovable preview environment
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, BarChart3, Zap } from 'lucide-react';

export const PreviewOptimizedDashboard: React.FC = () => {
  // Mock data for preview
  const mockData = {
    currentPrice: 45250.75,
    change: 1250.25,
    changePercent: 2.84,
    volume: 15420.5,
    prediction: {
      direction: 'bullish' as const,
      confidence: 0.78,
      timeFrame: '1h'
    },
    marketStatus: 'active' as const
  };

  return (
    <div className="space-y-6 p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Trading Analytics
          </h1>
          <p className="text-muted-foreground">
            Preview Mode - Live data disabled for optimal performance
          </p>
        </div>
        <Badge variant="outline" className="bg-gradient-primary text-white">
          Preview Environment
        </Badge>
      </div>

      {/* Market Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="trading-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">BTC/USDT</CardTitle>
            <TrendingUp className="h-4 w-4 text-trading-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${mockData.currentPrice.toLocaleString()}
            </div>
            <p className="text-xs text-trading-success">
              +${mockData.change.toFixed(2)} ({mockData.changePercent}%)
            </p>
          </CardContent>
        </Card>

        <Card className="trading-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">24h Volume</CardTitle>
            <BarChart3 className="h-4 w-4 text-trading-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {mockData.volume.toLocaleString()}K
            </div>
            <p className="text-xs text-muted-foreground">
              Active trading session
            </p>
          </CardContent>
        </Card>

        <Card className="trading-card-success">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Prediction</CardTitle>
            <Zap className="h-4 w-4 text-trading-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-trading-success">
              BULLISH
            </div>
            <p className="text-xs text-trading-success-foreground">
              {(mockData.prediction.confidence * 100).toFixed(0)}% confidence
            </p>
          </CardContent>
        </Card>

        <Card className="trading-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Status</CardTitle>
            <div className="h-2 w-2 bg-trading-success rounded-full animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground capitalize">
              {mockData.marketStatus}
            </div>
            <p className="text-xs text-muted-foreground">
              Real-time data available
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Panel */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="trading-card">
          <CardHeader>
            <CardTitle className="text-foreground">Performance Metrics</CardTitle>
            <CardDescription>
              System performance indicators
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Prediction Accuracy</span>
                <span className="font-medium text-foreground">78%</span>
              </div>
              <Progress value={78} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Data Processing</span>
                <span className="font-medium text-foreground">92%</span>
              </div>
              <Progress value={92} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">System Health</span>
                <span className="font-medium text-trading-success">Optimal</span>
              </div>
              <Progress value={100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="trading-card">
          <CardHeader>
            <CardTitle className="text-foreground">Preview Features</CardTitle>
            <CardDescription>
              Available in full environment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-trading-success rounded-full" />
              <span className="text-sm text-foreground">Real-time market data</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-trading-success rounded-full" />
              <span className="text-sm text-foreground">ML-powered predictions</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-trading-success rounded-full" />
              <span className="text-sm text-foreground">Advanced technical analysis</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-trading-warning rounded-full" />
              <span className="text-sm text-muted-foreground">WebSocket connections (disabled)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-trading-warning rounded-full" />
              <span className="text-sm text-muted-foreground">Database persistence (disabled)</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        <Button className="trading-button-success">
          View Full Dashboard
        </Button>
        <Button variant="outline">
          Download Demo Data
        </Button>
        <Button variant="ghost">
          Learn More
        </Button>
      </div>
    </div>
  );
};