/**
 * ML Experiment Tracking Service
 * Tracks training experiments, hyperparameters, and results
 */

import { secureLogger } from '@/utils/secureLogger';

export interface ExperimentConfig {
  id: string;
  name: string;
  description?: string;
  algorithm: string;
  hyperparameters: Record<string, any>;
  dataset: {
    size: number;
    features: string[];
    target: string;
    split: {
      train: number;
      validation: number;
      test: number;
    };
  };
}

export interface ExperimentResult {
  id: string;
  experimentId: string;
  timestamp: Date;
  duration: number; // seconds
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    loss: number;
    valAccuracy?: number;
    valLoss?: number;
  };
  confusion_matrix?: number[][];
  feature_importance?: Record<string, number>;
  model_size?: number; // bytes
  status: 'running' | 'completed' | 'failed' | 'stopped';
  error?: string;
}

export interface ExperimentComparison {
  experiments: ExperimentResult[];
  bestModel: ExperimentResult;
  rankings: {
    byAccuracy: ExperimentResult[];
    byF1Score: ExperimentResult[];
    bySpeed: ExperimentResult[];
  };
}

class ExperimentTrackerService {
  private experiments = new Map<string, ExperimentConfig>();
  private results = new Map<string, ExperimentResult[]>();
  private activeExperiments = new Set<string>();

  /**
   * Create new experiment
   */
  createExperiment(config: ExperimentConfig): void {
    this.experiments.set(config.id, config);
    this.results.set(config.id, []);

    secureLogger.info('Experiment created', {
      experimentId: config.id,
      algorithm: config.algorithm,
      datasetSize: config.dataset.size,
      component: 'experiment-tracker'
    });
  }

  /**
   * Start experiment run
   */
  startRun(experimentId: string): string {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    const runId = `run-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.activeExperiments.add(runId);

    const result: ExperimentResult = {
      id: runId,
      experimentId,
      timestamp: new Date(),
      duration: 0,
      metrics: {
        accuracy: 0,
        precision: 0,
        recall: 0,
        f1Score: 0,
        loss: 0
      },
      status: 'running'
    };

    const runs = this.results.get(experimentId) || [];
    runs.push(result);
    this.results.set(experimentId, runs);

    secureLogger.info('Experiment run started', {
      experimentId,
      runId,
      component: 'experiment-tracker'
    });

    return runId;
  }

  /**
   * Complete experiment run
   */
  completeRun(
    runId: string, 
    metrics: ExperimentResult['metrics'],
    additionalData?: Partial<ExperimentResult>
  ): void {
    const run = this.findRun(runId);
    if (!run) {
      throw new Error(`Run ${runId} not found`);
    }

    run.metrics = metrics;
    run.status = 'completed';
    run.duration = (Date.now() - run.timestamp.getTime()) / 1000;
    
    if (additionalData) {
      Object.assign(run, additionalData);
    }

    this.activeExperiments.delete(runId);

    secureLogger.info('Experiment run completed', {
      runId,
      experimentId: run.experimentId,
      accuracy: metrics.accuracy,
      f1Score: metrics.f1Score,
      duration: run.duration,
      component: 'experiment-tracker'
    });
  }

  /**
   * Fail experiment run
   */
  failRun(runId: string, error: string): void {
    const run = this.findRun(runId);
    if (!run) {
      throw new Error(`Run ${runId} not found`);
    }

    run.status = 'failed';
    run.error = error;
    run.duration = (Date.now() - run.timestamp.getTime()) / 1000;
    
    this.activeExperiments.delete(runId);

    secureLogger.error('Experiment run failed', {
      runId,
      experimentId: run.experimentId,
      error,
      component: 'experiment-tracker'
    });
  }

  /**
   * Find run by ID
   */
  private findRun(runId: string): ExperimentResult | null {
    for (const runs of this.results.values()) {
      const run = runs.find(r => r.id === runId);
      if (run) return run;
    }
    return null;
  }

  /**
   * Get experiment results
   */
  getExperimentResults(experimentId: string): ExperimentResult[] {
    return this.results.get(experimentId) || [];
  }

  /**
   * Get best run for experiment
   */
  getBestRun(experimentId: string, metric: keyof ExperimentResult['metrics'] = 'accuracy'): ExperimentResult | null {
    const runs = this.getExperimentResults(experimentId)
      .filter(run => run.status === 'completed');
    
    if (runs.length === 0) return null;

    return runs.reduce((best, current) => 
      current.metrics[metric] > best.metrics[metric] ? current : best
    );
  }

  /**
   * Compare experiments
   */
  compareExperiments(experimentIds: string[]): ExperimentComparison {
    const allRuns = experimentIds.flatMap(id => 
      this.getExperimentResults(id).filter(run => run.status === 'completed')
    );

    if (allRuns.length === 0) {
      throw new Error('No completed runs found for comparison');
    }

    const bestModel = allRuns.reduce((best, current) => 
      current.metrics.accuracy > best.metrics.accuracy ? current : best
    );

    const rankings = {
      byAccuracy: [...allRuns].sort((a, b) => b.metrics.accuracy - a.metrics.accuracy),
      byF1Score: [...allRuns].sort((a, b) => b.metrics.f1Score - a.metrics.f1Score),
      bySpeed: [...allRuns].sort((a, b) => a.duration - b.duration)
    };

    return {
      experiments: allRuns,
      bestModel,
      rankings
    };
  }

  /**
   * Get experiment history
   */
  getExperimentHistory(experimentId: string): {
    runs: ExperimentResult[];
    summary: {
      totalRuns: number;
      successfulRuns: number;
      averageAccuracy: number;
      bestAccuracy: number;
      averageDuration: number;
    };
  } {
    const runs = this.getExperimentResults(experimentId);
    const completedRuns = runs.filter(run => run.status === 'completed');

    const summary = {
      totalRuns: runs.length,
      successfulRuns: completedRuns.length,
      averageAccuracy: completedRuns.length > 0 
        ? completedRuns.reduce((sum, run) => sum + run.metrics.accuracy, 0) / completedRuns.length
        : 0,
      bestAccuracy: completedRuns.length > 0 
        ? Math.max(...completedRuns.map(run => run.metrics.accuracy))
        : 0,
      averageDuration: completedRuns.length > 0
        ? completedRuns.reduce((sum, run) => sum + run.duration, 0) / completedRuns.length
        : 0
    };

    return { runs, summary };
  }

  /**
   * Export experiment data
   */
  exportExperiment(experimentId: string): string {
    const experiment = this.experiments.get(experimentId);
    const results = this.getExperimentResults(experimentId);

    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    const exportData = {
      experiment,
      results,
      exportedAt: new Date(),
      version: '1.0'
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Get active experiments
   */
  getActiveExperiments(): string[] {
    return Array.from(this.activeExperiments);
  }

  /**
   * Get all experiments
   */
  getAllExperiments(): ExperimentConfig[] {
    return Array.from(this.experiments.values());
  }
}

export const experimentTracker = new ExperimentTrackerService();