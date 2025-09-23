/**
 * ML Computation Web Worker
 * Handles heavy ML computations in background thread to prevent UI blocking
 */

import { FeatureExtractionService } from '../services/ml/FeatureExtractionService';
import { PredictionEngineService } from '../services/ml/PredictionEngineService';
import { NetworkTrainingService } from '../services/ml/NetworkTrainingService';

// Message types
interface MLWorkerMessage {
  id: string;
  type: 'FEATURE_EXTRACTION' | 'PREDICTION' | 'TRAINING' | 'CANCEL';
  payload: any;
}

interface MLWorkerResponse {
  id: string;
  type: 'SUCCESS' | 'ERROR' | 'PROGRESS';
  payload: any;
}

// Global services
let featureService: FeatureExtractionService;
let predictionService: PredictionEngineService;
let trainingService: NetworkTrainingService;

// Active computations tracking
const activeComputations = new Map<string, AbortController>();

// Initialize services with getInstance pattern
const initializeServices = () => {
  featureService = FeatureExtractionService.getInstance();
  predictionService = PredictionEngineService.getInstance();
  trainingService = NetworkTrainingService.getInstance();
};

// Progress reporting utility
const reportProgress = (id: string, progress: number, status: string) => {
  const response: MLWorkerResponse = {
    id,
    type: 'PROGRESS',
    payload: { progress, status }
  };
  self.postMessage(response);
};

// Feature extraction handler
const handleFeatureExtraction = async (id: string, payload: any) => {
  try {
    const { candleData, config } = payload;
    
    reportProgress(id, 0, 'Starting feature extraction...');
    
    const features = await featureService.extractFeatures(candleData, {
      ...config,
      onProgress: (progress: number) => reportProgress(id, progress * 0.8, 'Extracting features...')
    });
    
    reportProgress(id, 100, 'Feature extraction completed');
    
    const response: MLWorkerResponse = {
      id,
      type: 'SUCCESS',
      payload: { features }
    };
    
    self.postMessage(response);
  } catch (error) {
    const response: MLWorkerResponse = {
      id,
      type: 'ERROR',
      payload: { error: error instanceof Error ? error.message : 'Feature extraction failed' }
    };
    
    self.postMessage(response);
  }
};

// Prediction handler
const handlePrediction = async (id: string, payload: any) => {
  try {
    const { candleData, historicalData, config } = payload;
    
    reportProgress(id, 0, 'Preparing prediction data...');
    
    // Extract features
    const { candleData: candles, currentIndex } = candleData;
    const features = await featureService.extractFeatures(candles, currentIndex);
    reportProgress(id, 20, 'Features extracted, generating prediction...');
    
    // Generate prediction
    const prediction = await predictionService.generatePrediction(candles, currentIndex, config);
    
    reportProgress(id, 100, 'Prediction completed');
    
    const response: MLWorkerResponse = {
      id,
      type: 'SUCCESS',
      payload: { prediction }
    };
    
    self.postMessage(response);
  } catch (error) {
    const response: MLWorkerResponse = {
      id,
      type: 'ERROR',
      payload: { error: error instanceof Error ? error.message : 'Prediction failed' }
    };
    
    self.postMessage(response);
  }
};

// Training handler
const handleTraining = async (id: string, payload: any) => {
  try {
    const { trainingData, config } = payload;
    
    reportProgress(id, 0, 'Initializing training...');
    
    const result = await trainingService.trainNetwork(trainingService.initializeNetwork(10, 20), trainingData, {
      ...config,
      onProgress: (progress: number, status: string) => reportProgress(id, progress, status),
      onEpochComplete: (epoch: number, loss: number) => {
        reportProgress(id, (epoch / config.epochs) * 100, `Epoch ${epoch}: Loss ${loss.toFixed(4)}`);
      }
    });
    
    reportProgress(id, 100, 'Training completed');
    
    const response: MLWorkerResponse = {
      id,
      type: 'SUCCESS',
      payload: { result }
    };
    
    self.postMessage(response);
  } catch (error) {
    const response: MLWorkerResponse = {
      id,
      type: 'ERROR',
      payload: { error: error instanceof Error ? error.message : 'Training failed' }
    };
    
    self.postMessage(response);
  }
};

// Cancel computation handler
const handleCancel = (id: string) => {
  const controller = activeComputations.get(id);
  if (controller) {
    controller.abort();
    activeComputations.delete(id);
    
    const response: MLWorkerResponse = {
      id,
      type: 'SUCCESS',
      payload: { cancelled: true }
    };
    
    self.postMessage(response);
  }
};

// Main message handler
self.onmessage = async (event: MessageEvent<MLWorkerMessage>) => {
  const { id, type, payload } = event.data;
  
  // Create abort controller for this computation
  const controller = new AbortController();
  activeComputations.set(id, controller);
  
  try {
    switch (type) {
      case 'FEATURE_EXTRACTION':
        await handleFeatureExtraction(id, payload);
        break;
      
      case 'PREDICTION':
        await handlePrediction(id, payload);
        break;
      
      case 'TRAINING':
        await handleTraining(id, payload);
        break;
      
      case 'CANCEL':
        handleCancel(id);
        return;
      
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    const response: MLWorkerResponse = {
      id,
      type: 'ERROR',
      payload: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
    
    self.postMessage(response);
  } finally {
    activeComputations.delete(id);
  }
};

// Initialize services when worker starts
initializeServices();

// Handle worker errors
self.onerror = (error) => {
  console.error('ML Worker error:', error);
};

self.onunhandledrejection = (event) => {
  console.error('ML Worker unhandled rejection:', event.reason);
};