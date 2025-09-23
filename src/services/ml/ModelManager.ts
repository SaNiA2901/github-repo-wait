/**
 * Enhanced ML Model Management Service
 * Handles model lifecycle, versioning, deployment, and monitoring
 */

import { secureLogger } from '@/utils/secureLogger';

export interface ModelMetadata {
  id: string;
  name: string;
  version: string;
  accuracy: number;
  trainingDate: Date;
  size: number; // bytes
  format: 'onnx' | 'tensorflow' | 'pytorch';
  status: 'training' | 'ready' | 'deployed' | 'archived';
  performance: {
    inferenceTime: number; // ms
    memoryUsage: number; // MB
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  };
  deployment?: {
    environment: 'development' | 'staging' | 'production';
    deployedAt: Date;
    traffic: number; // percentage
    health: 'healthy' | 'degraded' | 'unhealthy';
  };
}

export interface ModelConfig {
  batchSize: number;
  inputShape: number[];
  outputShape: number[];
  preprocessing: {
    normalize: boolean;
    scale: boolean;
    features: string[];
  };
}

class EnhancedModelManagerService {
  private models = new Map<string, ModelMetadata>();
  private activeModel: string | null = null;
  private modelCache = new Map<string, any>();
  private deploymentQueue: Array<{ modelId: string; priority: number }> = [];

  /**
   * Register a new model with enhanced metadata
   */
  registerModel(metadata: ModelMetadata): void {
    this.models.set(metadata.id, metadata);
    
    secureLogger.info('Enhanced model registered', {
      modelId: metadata.id,
      version: metadata.version,
      accuracy: metadata.accuracy,
      format: metadata.format,
      component: 'enhanced-model-manager'
    });
  }

  /**
   * Enhanced model deployment with health monitoring
   */
  async deployModel(modelId: string, environment: 'development' | 'staging' | 'production' = 'development'): Promise<{ success: boolean; error?: string }> {
    const model = this.models.get(modelId);
    if (!model) {
      secureLogger.error('Model not found for deployment', {
        modelId,
        component: 'enhanced-model-manager'
      });
      return { success: false, error: 'Model not found' };
    }

    try {
      // Pre-deployment validation
      if (!await this.validateModelIntegrity(modelId)) {
        throw new Error('Model integrity validation failed');
      }

      // Load model into memory
      await this.loadModel(modelId);
      
      // Set as active
      this.activeModel = modelId;
      
      // Update deployment metadata
      model.status = 'deployed';
      model.deployment = {
        environment,
        deployedAt: new Date(),
        traffic: 100,
        health: 'healthy'
      };
      this.models.set(modelId, model);

      // Start health monitoring
      this.startHealthMonitoring(modelId);

      secureLogger.info('Enhanced model deployed successfully', {
        modelId,
        version: model.version,
        environment,
        component: 'enhanced-model-manager'
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      secureLogger.error('Enhanced model deployment failed', {
        modelId,
        error: errorMessage,
        component: 'enhanced-model-manager'
      });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Validate model integrity before deployment
   */
  private async validateModelIntegrity(modelId: string): Promise<boolean> {
    try {
      const model = this.models.get(modelId);
      if (!model) return false;

      // Check file size
      if (model.size < 1000) {
        secureLogger.warn('Model file suspiciously small', {
          modelId,
          size: model.size,
          component: 'enhanced-model-manager'
        });
        return false;
      }

      // Check accuracy threshold
      if (model.accuracy < 0.5) {
        secureLogger.warn('Model accuracy below threshold', {
          modelId,
          accuracy: model.accuracy,
          component: 'enhanced-model-manager'
        });
        return false;
      }

      return true;
    } catch (error) {
      secureLogger.error('Model integrity validation error', {
        modelId,
        error: error instanceof Error ? error.message : String(error),
        component: 'enhanced-model-manager'
      });
      return false;
    }
  }

  /**
   * Start health monitoring for deployed model
   */
  private startHealthMonitoring(modelId: string): void {
    setInterval(async () => {
      const health = await this.checkModelHealth(modelId);
      const model = this.models.get(modelId);
      
      if (model && model.deployment) {
        model.deployment.health = health;
        this.models.set(modelId, model);

        if (health === 'unhealthy') {
          secureLogger.error('Model health check failed', {
            modelId,
            health,
            component: 'enhanced-model-manager'
          });
        }
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Check model health status
   */
  private async checkModelHealth(modelId: string): Promise<'healthy' | 'degraded' | 'unhealthy'> {
    try {
      // Simulate health check with test prediction
      const start = performance.now();
      // Would make actual test prediction here
      const duration = performance.now() - start;

      if (duration > 1000) return 'unhealthy';
      if (duration > 500) return 'degraded';
      return 'healthy';
    } catch {
      return 'unhealthy';
    }
  }

  /**
   * Enhanced load model with caching
   */
  private async loadModel(modelId: string): Promise<void> {
    if (this.modelCache.has(modelId)) {
      return; // Already loaded
    }

    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    // Simulate model loading with progress tracking
    secureLogger.info('Loading model into cache', {
      modelId,
      size: model.size,
      component: 'enhanced-model-manager'
    });

    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Cache the model
    this.modelCache.set(modelId, {
      metadata: model,
      loadedAt: new Date(),
      weights: {}, // Placeholder for actual model weights
      lastUsed: new Date()
    });

    secureLogger.debug('Model loaded into cache', {
      modelId,
      cacheSize: this.modelCache.size,
      component: 'enhanced-model-manager'
    });
  }

  /**
   * Canary deployment with gradual traffic increase
   */
  async canaryDeploy(modelId: string, trafficPercentage: number = 10): Promise<boolean> {
    const model = this.models.get(modelId);
    if (!model) return false;

    try {
      // Deploy with limited traffic
      await this.deployModel(modelId);
      
      if (model.deployment) {
        model.deployment.traffic = trafficPercentage;
        this.models.set(modelId, model);
      }

      secureLogger.info('Canary deployment started', {
        modelId,
        trafficPercentage,
        component: 'enhanced-model-manager'
      });

      // Monitor performance and gradually increase traffic
      this.scheduleTrafficIncrease(modelId);

      return true;
    } catch (error) {
      secureLogger.error('Canary deployment failed', {
        modelId,
        error: error instanceof Error ? error.message : String(error),
        component: 'enhanced-model-manager'
      });
      return false;
    }
  }

  /**
   * Schedule gradual traffic increase for canary deployment
   */
  private scheduleTrafficIncrease(modelId: string): void {
    const increaseInterval = setInterval(async () => {
      const model = this.models.get(modelId);
      if (!model?.deployment) {
        clearInterval(increaseInterval);
        return;
      }

      // Check if model is healthy before increasing traffic
      if (model.deployment.health !== 'healthy') {
        secureLogger.warn('Stopping traffic increase due to poor health', {
          modelId,
          health: model.deployment.health,
          component: 'enhanced-model-manager'
        });
        clearInterval(increaseInterval);
        return;
      }

      // Increase traffic by 10% each step
      const newTraffic = Math.min(100, model.deployment.traffic + 10);
      model.deployment.traffic = newTraffic;
      this.models.set(modelId, model);

      secureLogger.info('Traffic increased for canary deployment', {
        modelId,
        newTraffic,
        component: 'enhanced-model-manager'
      });

      // Stop when we reach 100%
      if (newTraffic >= 100) {
        clearInterval(increaseInterval);
        secureLogger.info('Canary deployment completed successfully', {
          modelId,
          component: 'enhanced-model-manager'
        });
      }
    }, 60000); // Increase every minute
  }

  /**
   * Automatic rollback on performance degradation
   */
  async autoRollback(modelId: string): Promise<boolean> {
    try {
      // Find previous stable model
      const stableModel = Array.from(this.models.values())
        .filter(m => m.id !== modelId && m.deployment?.health === 'healthy')
        .sort((a, b) => (b.deployment?.deployedAt.getTime() || 0) - (a.deployment?.deployedAt.getTime() || 0))[0];

      if (!stableModel) {
        secureLogger.error('No stable model found for rollback', {
          modelId,
          component: 'enhanced-model-manager'
        });
        return false;
      }

      // Deploy the stable model
      await this.deployModel(stableModel.id);

      secureLogger.info('Automatic rollback completed', {
        fromModel: modelId,
        toModel: stableModel.id,
        component: 'enhanced-model-manager'
      });

      return true;
    } catch (error) {
      secureLogger.error('Automatic rollback failed', {
        modelId,
        error: error instanceof Error ? error.message : String(error),
        component: 'enhanced-model-manager'
      });
      return false;
    }
  }

  /**
   * Get comprehensive model analytics
   */
  getModelAnalytics(modelId: string): any {
    const model = this.models.get(modelId);
    if (!model) return null;

    const cached = this.modelCache.get(modelId);
    
    return {
      metadata: model,
      cache: {
        loaded: !!cached,
        loadedAt: cached?.loadedAt,
        lastUsed: cached?.lastUsed,
        memoryUsage: this.getModelMemoryUsage(modelId)
      },
      deployment: model.deployment,
      performance: model.performance
    };
  }

  /**
   * Get model memory usage
   */
  private getModelMemoryUsage(modelId: string): number {
    const cached = this.modelCache.get(modelId);
    if (!cached) return 0;
    
    const model = this.models.get(modelId);
    return model?.size || 0;
  }

  /**
   * Optimize model cache based on usage patterns
   */
  optimizeCache(): void {
    const maxCacheSize = 5; // Maximum number of models in cache
    
    if (this.modelCache.size <= maxCacheSize) return;

    // Sort by last used time
    const cachedModels = Array.from(this.modelCache.entries())
      .sort((a, b) => b[1].lastUsed.getTime() - a[1].lastUsed.getTime());

    // Remove least recently used models
    const toRemove = cachedModels.slice(maxCacheSize);
    
    toRemove.forEach(([modelId]) => {
      this.modelCache.delete(modelId);
      secureLogger.debug('Removed model from cache', {
        modelId,
        reason: 'LRU optimization',
        component: 'enhanced-model-manager'
      });
    });
  }

  /**
   * Get deployment status overview
   */
  getDeploymentStatus(): any {
    const deployed = Array.from(this.models.values())
      .filter(m => m.status === 'deployed');

    return {
      totalDeployed: deployed.length,
      healthyModels: deployed.filter(m => m.deployment?.health === 'healthy').length,
      degradedModels: deployed.filter(m => m.deployment?.health === 'degraded').length,
      unhealthyModels: deployed.filter(m => m.deployment?.health === 'unhealthy').length,
      cacheSize: this.modelCache.size,
      memoryUsage: this.getTotalMemoryUsage()
    };
  }

  /**
   * Get total memory usage of all cached models
   */
  private getTotalMemoryUsage(): number {
    return Array.from(this.modelCache.keys())
      .reduce((total, modelId) => total + this.getModelMemoryUsage(modelId), 0);
  }

  /**
   * Backwards compatibility methods
   */
  getAllModelConfigurations(): any[] {
    return Array.from(this.models.values());
  }

  getModelConfiguration(modelId: string): any {
    return this.models.get(modelId);
  }
}

export const enhancedModelManager = new EnhancedModelManagerService();

// Export original modelManager for backwards compatibility
export const modelManager = enhancedModelManager;