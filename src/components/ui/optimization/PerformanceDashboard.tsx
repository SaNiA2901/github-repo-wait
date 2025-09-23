/**
 * Performance Dashboard Component
 * Displays performance metrics and optimization recommendations
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, 
  TrendingUp, 
  Clock, 
  MemoryStick, 
  Activity,
  AlertTriangle,
  CheckCircle,
  BarChart3
} from 'lucide-react';
import { PerformanceOptimizer, OptimizationReport } from '@/services/optimization/PerformanceOptimizer';

export const PerformanceDashboard: React.FC = () => {
  const [optimizationReport, setOptimizationReport] = useState<OptimizationReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    runPerformanceAnalysis();
  }, []);

  const runPerformanceAnalysis = async () => {
    setIsLoading(true);
    try {
      const optimizer = PerformanceOptimizer.getInstance();
      const report = await optimizer.analyzePerformance();
      setOptimizationReport(report);
    } catch (error) {
      console.error('Performance analysis failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return 'default';
    if (score >= 70) return 'secondary';
    if (score >= 50) return 'outline';
    return 'destructive';
  };

  const getMetricIcon = (metricName: string) => {
    switch (metricName.toLowerCase()) {
      case 'memory usage':
      case 'memory limit':
        return <MemoryStick className="h-4 w-4" />;
      case 'frame rate':
        return <Activity className="h-4 w-4" />;
      case 'cache hit rate':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getMetricStatus = (metric: any) => {
    if (!metric.threshold) return 'info';
    
    if (metric.value >= metric.threshold.critical) return 'critical';
    if (metric.value >= metric.threshold.warning) return 'warning';
    return 'good';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      case 'good': return 'text-emerald-600';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'good': return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      default: return <BarChart3 className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Performance Dashboard</h1>
            <p className="text-muted-foreground">Monitor and optimize application performance</p>
          </div>
        </div>
        <Button 
          onClick={runPerformanceAnalysis} 
          disabled={isLoading}
          className="gap-2"
        >
          <Activity className="h-4 w-4" />
          {isLoading ? 'Analyzing...' : 'Run Analysis'}
        </Button>
      </div>

      {optimizationReport && (
        <>
          {/* Performance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getScoreColor(optimizationReport.overallScore)}`}>
                  {optimizationReport.overallScore}/100
                </div>
                <Progress value={optimizationReport.overallScore} className="mt-2" />
                <Badge variant={getScoreBadge(optimizationReport.overallScore)} className="mt-2">
                  {optimizationReport.overallScore >= 90 ? 'Excellent' :
                   optimizationReport.overallScore >= 70 ? 'Good' :
                   optimizationReport.overallScore >= 50 ? 'Fair' : 'Poor'}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{optimizationReport.metrics.length}</div>
                <p className="text-sm text-muted-foreground">
                  Performance indicators
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Bottlenecks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">
                  {optimizationReport.bottlenecks.length}
                </div>
                <p className="text-sm text-muted-foreground">
                  Issues identified
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Last Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium">
                  {optimizationReport.timestamp.toLocaleTimeString()}
                </div>
                <p className="text-sm text-muted-foreground">
                  {optimizationReport.timestamp.toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {optimizationReport.metrics.map((metric, index) => {
                  const status = getMetricStatus(metric);
                  return (
                    <Card key={index} className="border-l-4 border-l-primary/20">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getMetricIcon(metric.name)}
                            <span className="font-medium text-sm">{metric.name}</span>
                          </div>
                          {getStatusIcon(status)}
                        </div>
                        <div className={`text-2xl font-bold ${getStatusColor(status)}`}>
                          {metric.value.toFixed(1)} {metric.unit}
                        </div>
                        {metric.threshold && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Warning: {metric.threshold.warning}{metric.unit} | 
                            Critical: {metric.threshold.critical}{metric.unit}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Bottlenecks */}
          {optimizationReport.bottlenecks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  Performance Bottlenecks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {optimizationReport.bottlenecks.map((bottleneck, index) => (
                    <Alert key={index} variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{bottleneck}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Optimization Recommendations */}
          <Tabs defaultValue="recommendations" className="space-y-4">
            <TabsList>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="recommendations">
              <Card>
                <CardHeader>
                  <CardTitle>Optimization Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {optimizationReport.recommendations.map((recommendation, index) => (
                      <Alert key={index}>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>{recommendation}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Performance History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                    <p>Performance history will be available after multiple analyses.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {!optimizationReport && !isLoading && (
        <Card>
          <CardContent className="text-center py-8">
            <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Performance Data Available</h3>
            <p className="text-muted-foreground mb-4">
              Run a performance analysis to get insights and optimization recommendations.
            </p>
            <Button onClick={runPerformanceAnalysis}>
              Run Performance Analysis
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};