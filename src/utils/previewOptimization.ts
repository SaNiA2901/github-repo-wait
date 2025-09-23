/**
 * Preview Environment Optimizations
 * Handles performance optimizations for Lovable preview environment
 */

export interface PreviewConfig {
  disableHeavyComponents: boolean;
  reduceAnimations: boolean;
  limitDataSize: boolean;
  skipExternalConnections: boolean;
}

export const getPreviewConfig = (): PreviewConfig => {
  const isPreview = window.location.hostname.includes('lovable.app') || 
                   window.location.hostname.includes('preview');
  
  return {
    disableHeavyComponents: isPreview,
    reduceAnimations: isPreview,
    limitDataSize: isPreview,
    skipExternalConnections: isPreview
  };
};

export const isPreviewEnvironment = (): boolean => {
  return window.location.hostname.includes('lovable.app') || 
         window.location.hostname.includes('preview') ||
         process.env.NODE_ENV === 'development';
};

export const optimizeForPreview = <T>(
  heavyComponent: T, 
  lightComponent: T
): T => {
  return isPreviewEnvironment() ? lightComponent : heavyComponent;
};

export const previewSafeAsyncOperation = async <T>(
  operation: () => Promise<T>,
  fallback: T,
  timeout: number = 3000
): Promise<T> => {
  if (isPreviewEnvironment()) {
    try {
      return await Promise.race([
        operation(),
        new Promise<T>((_, reject) => 
          setTimeout(() => reject(new Error('Preview timeout')), timeout)
        )
      ]);
    } catch (error) {
      console.warn('Preview async operation failed, using fallback:', error);
      return fallback;
    }
  }
  
  return operation();
};