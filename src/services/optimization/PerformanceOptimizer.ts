/**
 * Performance Optimization Service
 * Analyzes and optimizes application performance
 */

import { secureLogger } from '@/utils/secureLogger';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  threshold?: {
    warning: number;
    critical: number;
  };
}

export interface OptimizationReport {
  timestamp: Date;
  metrics: PerformanceMetric[];
  recommendations: string[];
  overallScore: number; // 0-100
  bottlenecks: string[];
}

export interface CacheStrategy {
  key: string;
  ttl: number;
  strategy: 'memory' | 'localStorage' | 'sessionStorage' | 'indexedDB';
  maxSize?: number;
}

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private metricsHistory: PerformanceMetric[] = [];
  private cacheStrategies: Map<string, CacheStrategy> = new Map();

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  constructor() {
    this.initializeCacheStrategies();
  }

  private initializeCacheStrategies() {
    // Define optimal caching strategies for different data types
    this.cacheStrategies.set('candle-data', {
      key: 'candle-data',
      ttl: 5 * 60 * 1000, // 5 minutes
      strategy: 'memory',
      maxSize: 1000
    });

    this.cacheStrategies.set('predictions', {
      key: 'predictions',
      ttl: 2 * 60 * 1000, // 2 minutes
      strategy: 'memory',
      maxSize: 100
    });

    this.cacheStrategies.set('session-data', {
      key: 'session-data',
      ttl: 30 * 60 * 1000, // 30 minutes
      strategy: 'localStorage',
      maxSize: 50
    });

    this.cacheStrategies.set('ml-models', {
      key: 'ml-models',
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      strategy: 'indexedDB',
      maxSize: 10
    });
  }

  async analyzePerformance(): Promise<OptimizationReport> {
    secureLogger.info('Starting performance analysis...');

    const metrics: PerformanceMetric[] = [];

    // Collect current performance metrics
    metrics.push(...await this.collectMemoryMetrics());
    metrics.push(...await this.collectRenderMetrics());
    metrics.push(...await this.collectNetworkMetrics());
    metrics.push(...await this.collectCacheMetrics());

    // Store metrics history
    this.metricsHistory.push(...metrics);

    const report = this.generateOptimizationReport(metrics);
    secureLogger.info(`Performance analysis completed: Score ${report.overallScore}/100`);

    return report;
  }

  private async collectMemoryMetrics(): Promise<PerformanceMetric[]> {
    const metrics: PerformanceMetric[] = [];

    if ('memory' in performance) {
      const memoryInfo = (performance as any).memory;
      
      metrics.push({
        name: 'Memory Usage',
        value: Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024),
        unit: 'MB',
        timestamp: new Date(),
        threshold: { warning: 50, critical: 100 }
      });

      metrics.push({
        name: 'Memory Limit',
        value: Math.round(memoryInfo.jsHeapSizeLimit / 1024 / 1024),
        unit: 'MB',
        timestamp: new Date()
      });
    }

    return metrics;
  }

  private async collectRenderMetrics(): Promise<PerformanceMetric[]> {
    const metrics: PerformanceMetric[] = [];

    // Collect paint timing metrics
    const paintEntries = performance.getEntriesByType('paint');
    
    paintEntries.forEach(entry => {
      metrics.push({
        name: entry.name,
        value: Math.round(entry.startTime),
        unit: 'ms',
        timestamp: new Date(),
        threshold: { warning: 1000, critical: 3000 }
      });
    });

    // Frame rate estimation
    const frameRate = this.estimateFrameRate();
    metrics.push({
      name: 'Frame Rate',
      value: frameRate,
      unit: 'fps',
      timestamp: new Date(),
      threshold: { warning: 30, critical: 15 }
    });

    return metrics;
  }

  private async collectNetworkMetrics(): Promise<PerformanceMetric[]> {
    const metrics: PerformanceMetric[] = [];

    // Collect resource timing
    const resourceEntries = performance.getEntriesByType('resource');
    
    if (resourceEntries.length > 0) {
      const avgLoadTime = resourceEntries.reduce((sum, entry) => sum + entry.duration, 0) / resourceEntries.length;
      
      metrics.push({
        name: 'Average Resource Load Time',
        value: Math.round(avgLoadTime),
        unit: 'ms',
        timestamp: new Date(),
        threshold: { warning: 500, critical: 2000 }
      });
    }

    return metrics;
  }

  private async collectCacheMetrics(): Promise<PerformanceMetric[]> {
    const metrics: PerformanceMetric[] = [];

    // Estimate cache hit rate
    const cacheHitRate = this.estimateCacheHitRate();
    metrics.push({
      name: 'Cache Hit Rate',
      value: cacheHitRate,
      unit: '%',
      timestamp: new Date(),
      threshold: { warning: 70, critical: 50 }
    });

    return metrics;
  }

  private estimateFrameRate(): number {
    // Simple frame rate estimation
    // In a real implementation, this would use requestAnimationFrame timing
    return 60; // Placeholder
  }

  private estimateCacheHitRate(): number {
    // Estimate cache effectiveness
    // In a real implementation, this would track actual cache hits/misses
    return 85; // Placeholder - 85% hit rate
  }

  private generateOptimizationReport(metrics: PerformanceMetric[]): OptimizationReport {
    const recommendations: string[] = [];
    const bottlenecks: string[] = [];
    let totalScore = 100;

    // Analyze metrics and generate recommendations
    metrics.forEach(metric => {
      if (metric.threshold) {
        if (metric.value >= metric.threshold.critical) {
          totalScore -= 20;
          bottlenecks.push(`Critical: ${metric.name} (${metric.value}${metric.unit})`);
          recommendations.push(`Urgent optimization needed for ${metric.name}`);
        } else if (metric.value >= metric.threshold.warning) {
          totalScore -= 10;
          bottlenecks.push(`Warning: ${metric.name} (${metric.value}${metric.unit})`);
          recommendations.push(`Consider optimizing ${metric.name}`);
        }
      }
    });

    // Add general recommendations
    recommendations.push(
      'Implement lazy loading for heavy components',
      'Optimize bundle size with code splitting',
      'Use React.memo for expensive components',
      'Implement virtual scrolling for large lists',
      'Optimize image loading with appropriate formats',
      'Consider using Web Workers for heavy computations'
    );

    return {
      timestamp: new Date(),
      metrics,
      recommendations,
      overallScore: Math.max(0, totalScore),
      bottlenecks
    };
  }

  getCacheStrategy(dataType: string): CacheStrategy | undefined {
    return this.cacheStrategies.get(dataType);
  }

  getMetricsHistory(): PerformanceMetric[] {
    return this.metricsHistory;
  }

  async optimizeBundle(): Promise<string[]> {
    const optimizations: string[] = [];

    // Suggest bundle optimizations
    optimizations.push('Enable tree shaking for unused code elimination');
    optimizations.push('Implement dynamic imports for route-based code splitting');
    optimizations.push('Optimize third-party library imports');
    optimizations.push('Enable gzip/brotli compression');
    optimizations.push('Implement service worker for caching');

    return optimizations;
  }

  async optimizeMemory(): Promise<string[]> {
    const optimizations: string[] = [];

    // Memory optimization suggestions
    optimizations.push('Implement proper cleanup in useEffect hooks');
    optimizations.push('Use weak references for large objects');
    optimizations.push('Optimize image and asset loading');
    optimizations.push('Implement garbage collection friendly patterns');

    return optimizations;
  }
}