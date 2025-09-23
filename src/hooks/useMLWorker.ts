/**
 * ML Worker Hook
 * Interface for offloading ML computations to web workers
 */

import { useRef, useCallback, useEffect, useState } from 'react';
import { errorHandler, ErrorCategory } from '@/utils/errorHandler';
import { logger } from '@/utils/logger';
import { isPreviewEnvironment } from '@/utils/previewOptimization';

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

interface PendingRequest {
  resolve: (value: any) => void;
  reject: (error: any) => void;
  onProgress?: (progress: number, status: string) => void;
}

export const useMLWorker = () => {
  const workerRef = useRef<Worker | null>(null);
  const pendingRequests = useRef<Map<string, PendingRequest>>(new Map());
  const [isWorkerAvailable, setIsWorkerAvailable] = useState(false);

  // Initialize worker with timeout and fallback
  useEffect(() => {
    let initTimeout: NodeJS.Timeout;
    
    // Skip worker in preview environment for performance
    if (isPreviewEnvironment()) {
      logger.info('ML Worker disabled in preview environment');
      setIsWorkerAvailable(false);
      return;
    }
    
    try {
      // Add timeout for worker initialization
      initTimeout = setTimeout(() => {
        logger.warn('ML Worker initialization timeout, using fallback');
        setIsWorkerAvailable(false);
      }, 5000);
      
      workerRef.current = new Worker(
        new URL('../workers/mlWorker.ts', import.meta.url),
        { type: 'module' }
      );
      
      clearTimeout(initTimeout);
      setIsWorkerAvailable(true);
      logger.info('ML Worker initialized successfully');

      // Handle worker messages
      workerRef.current.onmessage = (event: MessageEvent<MLWorkerResponse>) => {
        const { id, type, payload } = event.data;
        const request = pendingRequests.current.get(id);

        if (!request) {
          logger.warn('Received response for unknown request', { id });
          return;
        }

        switch (type) {
          case 'SUCCESS':
            request.resolve(payload);
            pendingRequests.current.delete(id);
            break;

          case 'ERROR':
            request.reject(new Error(payload.error || 'ML Worker error'));
            pendingRequests.current.delete(id);
            break;

          case 'PROGRESS':
            if (request.onProgress) {
              request.onProgress(payload.progress, payload.status);
            }
            break;
        }
      };

      // Handle worker errors
      workerRef.current.onerror = (error) => {
        logger.error('ML Worker error', { error });
        errorHandler.handleError(
          new Error('ML Worker error'), 
          ErrorCategory.ML_PREDICTION, 
          { context: 'ml-worker' }
        );
        setIsWorkerAvailable(false);
      };

      workerRef.current.onmessageerror = (error) => {
        logger.error('ML Worker message error', { error });
        errorHandler.handleError(
          new Error('ML Worker message error'), 
          ErrorCategory.ML_PREDICTION, 
          { context: 'ml-worker-message' }
        );
      };

    } catch (error) {
      logger.error('Failed to initialize ML Worker', { error });
      setIsWorkerAvailable(false);
    }

    return () => {
      if (workerRef.current) {
        // Cancel all pending requests
        pendingRequests.current.forEach(request => {
          request.reject(new Error('Worker terminated'));
        });
        pendingRequests.current.clear();

        workerRef.current.terminate();
        workerRef.current = null;
        setIsWorkerAvailable(false);
      }
    };
  }, []);

  // Generate unique request ID
  const generateRequestId = useCallback(() => {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Send message to worker
  const sendMessage = useCallback(
    <T = any>(
      type: MLWorkerMessage['type'],
      payload: any,
      onProgress?: (progress: number, status: string) => void
    ): Promise<T> => {
      return new Promise((resolve, reject) => {
        if (!workerRef.current || !isWorkerAvailable) {
          reject(new Error('ML Worker not available'));
          return;
        }

        const id = generateRequestId();
        
        pendingRequests.current.set(id, {
          resolve,
          reject,
          onProgress
        });

        const message: MLWorkerMessage = { id, type, payload };
        
        try {
          workerRef.current.postMessage(message);
        } catch (error) {
          pendingRequests.current.delete(id);
          reject(error);
        }
      });
    },
    [isWorkerAvailable, generateRequestId]
  );

  // Feature extraction
  const extractFeatures = useCallback(
    (candleData: any, config?: any, onProgress?: (progress: number, status: string) => void) => {
      return sendMessage('FEATURE_EXTRACTION', { candleData, config }, onProgress);
    },
    [sendMessage]
  );

  // Generate prediction
  const generatePrediction = useCallback(
    (
      candleData: any, 
      historicalData?: any, 
      config?: any, 
      onProgress?: (progress: number, status: string) => void
    ) => {
      return sendMessage('PREDICTION', { candleData, historicalData, config }, onProgress);
    },
    [sendMessage]
  );

  // Train model
  const trainModel = useCallback(
    (
      trainingData: any, 
      config?: any, 
      onProgress?: (progress: number, status: string) => void
    ) => {
      return sendMessage('TRAINING', { trainingData, config }, onProgress);
    },
    [sendMessage]
  );

  // Cancel computation
  const cancelComputation = useCallback(
    (requestId: string) => {
      if (pendingRequests.current.has(requestId)) {
        return sendMessage('CANCEL', { requestId });
      }
      return Promise.resolve();
    },
    [sendMessage]
  );

  // Cancel all computations
  const cancelAllComputations = useCallback(() => {
    const promises = Array.from(pendingRequests.current.keys()).map(id => 
      cancelComputation(id)
    );
    return Promise.allSettled(promises);
  }, [cancelComputation]);

  return {
    isWorkerAvailable,
    extractFeatures,
    generatePrediction,
    trainModel,
    cancelComputation,
    cancelAllComputations,
    pendingRequestsCount: pendingRequests.current.size
  };
};