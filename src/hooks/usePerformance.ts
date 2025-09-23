/**
 * Performance Monitoring Hook
 * Tracks and optimizes application performance across components
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { logger } from '@/utils/logger';

export interface PerformanceMetrics {
  componentName: string;
  renderTime: number;
  memoryUsage: number;
  renderCount: number;
  lastRender: number;
  averageRenderTime: number;
}

export interface PerformanceBudget {
  maxRenderTime: number;
  maxMemoryUsage: number;
  maxRenderCount: number;
}

export const usePerformance = (
  componentName: string,
  budget: Partial<PerformanceBudget> = {}
) => {
  const renderStartTime = useRef<number>(0);
  const renderTimes = useRef<number[]>([]);
  const renderCount = useRef<number>(0);
  const lastRender = useRef<number>(0);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  const defaultBudget: PerformanceBudget = {
    maxRenderTime: 16, // 60fps target
    maxMemoryUsage: 50 * 1024 * 1024, // 50MB
    maxRenderCount: 100,
    ...budget
  };

  // Start performance measurement
  const startMeasurement = useCallback(() => {
    renderStartTime.current = performance.now();
  }, []);

  // End performance measurement
  const endMeasurement = useCallback(() => {
    const renderTime = performance.now() - renderStartTime.current;
    renderCount.current++;
    renderTimes.current.push(renderTime);
    lastRender.current = Date.now();

    // Keep only recent render times (last 20 renders)
    if (renderTimes.current.length > 20) {
      renderTimes.current.shift();
    }

    // Calculate average render time
    const averageRenderTime = renderTimes.current.reduce((sum, time) => sum + time, 0) / renderTimes.current.length;

    // Get memory usage if available
    const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;

    const currentMetrics: PerformanceMetrics = {
      componentName,
      renderTime,
      memoryUsage,
      renderCount: renderCount.current,
      lastRender: lastRender.current,
      averageRenderTime
    };

    setMetrics(currentMetrics);

    // Check performance budget violations
    checkPerformanceBudget(currentMetrics, defaultBudget);

    // Log slow renders
    if (renderTime > defaultBudget.maxRenderTime) {
      logger.warn('Slow render detected', {
        component: componentName,
        renderTime: Math.round(renderTime * 100) / 100,
        budget: defaultBudget.maxRenderTime
      });
    }

  }, [componentName, defaultBudget]);

  // Check performance budget violations
  const checkPerformanceBudget = useCallback((
    metrics: PerformanceMetrics,
    budget: PerformanceBudget
  ) => {
    const violations: string[] = [];

    if (metrics.renderTime > budget.maxRenderTime) {
      violations.push(`Render time: ${metrics.renderTime.toFixed(2)}ms > ${budget.maxRenderTime}ms`);
    }

    if (metrics.memoryUsage > budget.maxMemoryUsage) {
      violations.push(`Memory usage: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB > ${(budget.maxMemoryUsage / 1024 / 1024).toFixed(2)}MB`);
    }

    if (metrics.renderCount > budget.maxRenderCount) {
      violations.push(`Render count: ${metrics.renderCount} > ${budget.maxRenderCount}`);
    }

    if (violations.length > 0) {
      logger.warn('Performance budget violations', {
        component: componentName,
        violations,
        metrics
      });
    }
  }, [componentName]);

  // Optimized performance measurement to avoid cycles
  useEffect(() => {
    startMeasurement();
    
    // Use timeout to avoid blocking the main thread
    const timeout = setTimeout(() => {
      endMeasurement();
    }, 0);
    
    return () => clearTimeout(timeout);
  }, [startMeasurement, endMeasurement]);

  // Performance optimization suggestions
  const getOptimizationSuggestions = useCallback(() => {
    if (!metrics) return [];

    const suggestions: string[] = [];

    if (metrics.averageRenderTime > 10) {
      suggestions.push('Consider using React.memo() to prevent unnecessary re-renders');
      suggestions.push('Check if expensive calculations can be memoized with useMemo()');
    }

    if (metrics.renderCount > 50) {
      suggestions.push('Component is re-rendering frequently - check dependencies in useEffect/useMemo');
      suggestions.push('Consider moving state closer to components that actually need it');
    }

    if (metrics.memoryUsage > 30 * 1024 * 1024) {
      suggestions.push('High memory usage detected - check for memory leaks');
      suggestions.push('Consider implementing virtual scrolling for large lists');
    }

    return suggestions;
  }, [metrics]);

  // Get performance score (0-100)
  const getPerformanceScore = useCallback(() => {
    if (!metrics) return 100;

    let score = 100;

    // Render time penalty
    const renderTimeRatio = metrics.averageRenderTime / defaultBudget.maxRenderTime;
    if (renderTimeRatio > 1) {
      score -= Math.min(50, (renderTimeRatio - 1) * 30);
    }

    // Memory usage penalty
    const memoryRatio = metrics.memoryUsage / defaultBudget.maxMemoryUsage;
    if (memoryRatio > 1) {
      score -= Math.min(30, (memoryRatio - 1) * 20);
    }

    // Render count penalty
    const renderCountRatio = metrics.renderCount / defaultBudget.maxRenderCount;
    if (renderCountRatio > 1) {
      score -= Math.min(20, (renderCountRatio - 1) * 15);
    }

    return Math.max(0, Math.round(score));
  }, [metrics, defaultBudget]);

  // Force garbage collection if available (Chrome DevTools)
  const forceGarbageCollection = useCallback(() => {
    if ((window as any).gc) {
      (window as any).gc();
      logger.debug('Forced garbage collection', { component: componentName });
    }
  }, [componentName]);

  // Reset metrics
  const resetMetrics = useCallback(() => {
    renderTimes.current = [];
    renderCount.current = 0;
    setMetrics(null);
    logger.debug('Performance metrics reset', { component: componentName });
  }, [componentName]);

  // Export performance data
  const exportMetrics = useCallback(() => {
    return {
      ...metrics,
      performanceScore: getPerformanceScore(),
      optimizationSuggestions: getOptimizationSuggestions(),
      budget: defaultBudget,
      renderTimes: [...renderTimes.current]
    };
  }, [metrics, getPerformanceScore, getOptimizationSuggestions, defaultBudget]);

  return {
    metrics,
    performanceScore: getPerformanceScore(),
    optimizationSuggestions: getOptimizationSuggestions(),
    forceGarbageCollection,
    resetMetrics,
    exportMetrics,
    
    // Helper functions for manual measurement
    startMeasurement,
    endMeasurement
  };
};
