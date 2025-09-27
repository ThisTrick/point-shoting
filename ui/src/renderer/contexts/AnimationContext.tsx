/**
 * AnimationContext Provider
 * React context for managing animation state and engine communication
 */

import { createContext, useContext, useEffect, useReducer, useCallback, ReactNode } from 'react';
import '../../types/electron';

// Animation-specific types
interface AnimationState {
  // Engine status
  isEngineRunning: boolean;
  engineHealth: EngineHealthStatus | null;
  
  // Animation state
  currentStage: AnimationStage | null;
  isAnimationRunning: boolean;
  isPaused: boolean;
  progress: number; // 0-1
  elapsedTime: number;
  
  // Loaded content
  loadedImage: ImageInfo | null;
  watermarkConfig: WatermarkConfig | null;
  
  // Performance metrics
  metrics: EngineMetrics | null;
  
  // Error state
  error: string | null;
  engineErrors: EngineError[];
  
  // Loading states
  isStartingEngine: boolean;
  isLoadingImage: boolean;
  isProcessingCommand: boolean;
}

type AnimationStage = 'PRE_START' | 'BURST' | 'CHAOS' | 'CONVERGING' | 'FORMATION' | 'FINAL_BREATHING';

interface EngineHealthStatus {
  isResponding: boolean;
  lastHeartbeat: number;
  memoryUsage?: number;
  cpuUsage?: number;
}

interface ImageInfo {
  path: string;
  filename: string;
  dimensions: { width: number; height: number };
  fileSize: number;
  format: string;
  aspectRatio: number;
  hasTransparency: boolean;
}

interface WatermarkConfig {
  enabled: boolean;
  path?: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity: number;
  scale: number;
}

interface EngineMetrics {
  fps: number;
  particleCount: number;
  memoryUsage: number;
  recognitionAccuracy?: number;
}

interface EngineError {
  code: string;
  message: string;
  details?: any;
  timestamp: number;
}

interface AnimationConfig {
  imagePath: string;
  settings: any; // Engine settings from UI settings
  watermark?: WatermarkConfig;
}

// Animation actions
type AnimationAction =
  | { type: 'ENGINE_START_REQUESTED' }
  | { type: 'ENGINE_STARTED'; health: EngineHealthStatus }
  | { type: 'ENGINE_START_FAILED'; error: string }
  | { type: 'ENGINE_STOPPED' }
  | { type: 'ENGINE_HEALTH_UPDATE'; health: EngineHealthStatus }
  | { type: 'ANIMATION_START_REQUESTED' }
  | { type: 'ANIMATION_STARTED' }
  | { type: 'ANIMATION_PAUSED' }
  | { type: 'ANIMATION_RESUMED' }
  | { type: 'ANIMATION_STOPPED' }
  | { type: 'STAGE_CHANGED'; stage: AnimationStage }
  | { type: 'PROGRESS_UPDATE'; progress: number; elapsedTime: number }
  | { type: 'IMAGE_LOAD_START' }
  | { type: 'IMAGE_LOADED'; image: ImageInfo }
  | { type: 'IMAGE_LOAD_FAILED'; error: string }
  | { type: 'WATERMARK_SET'; watermark: WatermarkConfig | null }
  | { type: 'METRICS_UPDATE'; metrics: EngineMetrics }
  | { type: 'ENGINE_ERROR'; error: EngineError }
  | { type: 'COMMAND_START' }
  | { type: 'COMMAND_COMPLETE' }
  | { type: 'COMMAND_FAILED'; error: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'CLEAR_ENGINE_ERRORS' };

// Animation context interface
interface AnimationContextValue {
  // State
  state: AnimationState;
  
  // Engine control
  startEngine: () => Promise<void>;
  stopEngine: () => Promise<void>;
  restartEngine: () => Promise<void>;
  getEngineHealth: () => Promise<void>;
  
  // Animation control
  startAnimation: (config: AnimationConfig) => Promise<void>;
  pauseAnimation: () => Promise<void>;
  resumeAnimation: () => Promise<void>;
  stopAnimation: () => Promise<void>;
  skipToFinal: () => Promise<void>;
  
  // Content management
  loadImage: (imagePath: string) => Promise<void>;
  setWatermark: (watermark: WatermarkConfig | null) => Promise<void>;
  updateEngineSettings: (settings: any) => Promise<void>;
  
  // Utility
  clearError: () => void;
  clearEngineErrors: () => void;
}

// Initial state
const initialState: AnimationState = {
  isEngineRunning: false,
  engineHealth: null,
  currentStage: null,
  isAnimationRunning: false,
  isPaused: false,
  progress: 0,
  elapsedTime: 0,
  loadedImage: null,
  watermarkConfig: null,
  metrics: null,
  error: null,
  engineErrors: [],
  isStartingEngine: false,
  isLoadingImage: false,
  isProcessingCommand: false
};

// Animation reducer
function animationReducer(state: AnimationState, action: AnimationAction): AnimationState {
  switch (action.type) {
    case 'ENGINE_START_REQUESTED':
      return {
        ...state,
        isStartingEngine: true,
        error: null
      };
      
    case 'ENGINE_STARTED':
      return {
        ...state,
        isEngineRunning: true,
        engineHealth: action.health,
        isStartingEngine: false,
        error: null
      };
      
    case 'ENGINE_START_FAILED':
      return {
        ...state,
        isEngineRunning: false,
        isStartingEngine: false,
        error: action.error
      };
      
    case 'ENGINE_STOPPED':
      return {
        ...state,
        isEngineRunning: false,
        engineHealth: null,
        isAnimationRunning: false,
        isPaused: false,
        currentStage: null,
        progress: 0,
        elapsedTime: 0
      };
      
    case 'ENGINE_HEALTH_UPDATE':
      return {
        ...state,
        engineHealth: action.health
      };
      
    case 'ANIMATION_START_REQUESTED':
      return {
        ...state,
        isProcessingCommand: true,
        error: null
      };
      
    case 'ANIMATION_STARTED':
      return {
        ...state,
        isAnimationRunning: true,
        isPaused: false,
        progress: 0,
        elapsedTime: 0,
        isProcessingCommand: false
      };
      
    case 'ANIMATION_PAUSED':
      return {
        ...state,
        isPaused: true,
        isProcessingCommand: false
      };
      
    case 'ANIMATION_RESUMED':
      return {
        ...state,
        isPaused: false,
        isProcessingCommand: false
      };
      
    case 'ANIMATION_STOPPED':
      return {
        ...state,
        isAnimationRunning: false,
        isPaused: false,
        currentStage: null,
        progress: 0,
        isProcessingCommand: false
      };
      
    case 'STAGE_CHANGED':
      return {
        ...state,
        currentStage: action.stage
      };
      
    case 'PROGRESS_UPDATE':
      return {
        ...state,
        progress: action.progress,
        elapsedTime: action.elapsedTime
      };
      
    case 'IMAGE_LOAD_START':
      return {
        ...state,
        isLoadingImage: true,
        error: null
      };
      
    case 'IMAGE_LOADED':
      return {
        ...state,
        loadedImage: action.image,
        isLoadingImage: false,
        error: null
      };
      
    case 'IMAGE_LOAD_FAILED':
      return {
        ...state,
        isLoadingImage: false,
        error: action.error
      };
      
    case 'WATERMARK_SET':
      return {
        ...state,
        watermarkConfig: action.watermark
      };
      
    case 'METRICS_UPDATE':
      return {
        ...state,
        metrics: action.metrics
      };
      
    case 'ENGINE_ERROR':
      return {
        ...state,
        engineErrors: [action.error, ...state.engineErrors].slice(0, 10) // Keep last 10 errors
      };
      
    case 'COMMAND_START':
      return {
        ...state,
        isProcessingCommand: true,
        error: null
      };
      
    case 'COMMAND_COMPLETE':
      return {
        ...state,
        isProcessingCommand: false
      };
      
    case 'COMMAND_FAILED':
      return {
        ...state,
        isProcessingCommand: false,
        error: action.error
      };
      
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
      
    case 'CLEAR_ENGINE_ERRORS':
      return {
        ...state,
        engineErrors: []
      };
      
    default:
      return state;
  }
}

// Create context
export const AnimationContext = createContext<AnimationContextValue | null>(null);

// Provider component
interface AnimationProviderProps {
  children: ReactNode;
}

export function AnimationProvider({ children }: AnimationProviderProps) {
  const [state, dispatch] = useReducer(animationReducer, initialState);

  // Engine control functions
  const startEngine = useCallback(async () => {
    dispatch({ type: 'ENGINE_START_REQUESTED' });
    try {
      const result = await window.electronAPI?.engine.start();
      if (result?.success) {
        const health = await window.electronAPI?.engine.getHealth();
        dispatch({ type: 'ENGINE_STARTED', health });
      } else {
        dispatch({ type: 'ENGINE_START_FAILED', error: result?.error || 'Engine failed to start' });
      }
    } catch (error) {
      dispatch({ type: 'ENGINE_START_FAILED', error: error instanceof Error ? error.message : 'Failed to start engine' });
    }
  }, []);

  const stopEngine = useCallback(async () => {
    dispatch({ type: 'COMMAND_START' });
    try {
      await window.electronAPI?.engine.stop();
      dispatch({ type: 'ENGINE_STOPPED' });
    } catch (error) {
      dispatch({ type: 'COMMAND_FAILED', error: error instanceof Error ? error.message : 'Failed to stop engine' });
    }
  }, []);

  const restartEngine = useCallback(async () => {
    dispatch({ type: 'COMMAND_START' });
    try {
      const result = await window.electronAPI?.engine.restart();
      if (result?.success) {
        const health = await window.electronAPI?.engine.getHealth();
        dispatch({ type: 'ENGINE_STARTED', health });
      } else {
        dispatch({ type: 'ENGINE_START_FAILED', error: result?.error || 'Engine failed to restart' });
      }
    } catch (error) {
      dispatch({ type: 'COMMAND_FAILED', error: error instanceof Error ? error.message : 'Failed to restart engine' });
    }
  }, []);

  const getEngineHealth = useCallback(async () => {
    try {
      const health = await window.electronAPI?.engine.getHealth();
      dispatch({ type: 'ENGINE_HEALTH_UPDATE', health });
    } catch (error) {
      console.error('Failed to get engine health:', error);
    }
  }, []);

  // Animation control functions
  const startAnimation = useCallback(async (config: AnimationConfig) => {
    dispatch({ type: 'ANIMATION_START_REQUESTED' });
    try {
      await window.electronAPI?.engine.startAnimation(config);
      dispatch({ type: 'ANIMATION_STARTED' });
    } catch (error) {
      dispatch({ type: 'COMMAND_FAILED', error: error instanceof Error ? error.message : 'Failed to start animation' });
    }
  }, []);

  const pauseAnimation = useCallback(async () => {
    dispatch({ type: 'COMMAND_START' });
    try {
      await window.electronAPI?.engine.pauseAnimation();
      dispatch({ type: 'ANIMATION_PAUSED' });
    } catch (error) {
      dispatch({ type: 'COMMAND_FAILED', error: error instanceof Error ? error.message : 'Failed to pause animation' });
    }
  }, []);

  const resumeAnimation = useCallback(async () => {
    dispatch({ type: 'COMMAND_START' });
    try {
      await window.electronAPI?.engine.resumeAnimation();
      dispatch({ type: 'ANIMATION_RESUMED' });
    } catch (error) {
      dispatch({ type: 'COMMAND_FAILED', error: error instanceof Error ? error.message : 'Failed to resume animation' });
    }
  }, []);

  const stopAnimation = useCallback(async () => {
    dispatch({ type: 'COMMAND_START' });
    try {
      await window.electronAPI?.engine.stopAnimation();
      dispatch({ type: 'ANIMATION_STOPPED' });
    } catch (error) {
      dispatch({ type: 'COMMAND_FAILED', error: error instanceof Error ? error.message : 'Failed to stop animation' });
    }
  }, []);

  const skipToFinal = useCallback(async () => {
    dispatch({ type: 'COMMAND_START' });
    try {
      await window.electronAPI?.engine.skipToFinal();
      dispatch({ type: 'COMMAND_COMPLETE' });
    } catch (error) {
      dispatch({ type: 'COMMAND_FAILED', error: error instanceof Error ? error.message : 'Failed to skip to final' });
    }
  }, []);

  // Content management functions
  const loadImage = useCallback(async (imagePath: string) => {
    dispatch({ type: 'IMAGE_LOAD_START' });
    try {
      const result = await window.electronAPI?.engine.loadImage(imagePath);
      if (result?.success) {
        // Get image metadata
        const metadata = await window.electronAPI?.files.getImageMetadata(imagePath);
        const imageInfo: ImageInfo = {
          path: imagePath,
          filename: imagePath.split('/').pop() || '',
          dimensions: result.dimensions || { width: 0, height: 0 },
          fileSize: metadata?.fileSize || 0,
          format: metadata?.format || 'Unknown',
          aspectRatio: metadata?.aspectRatio || 1,
          hasTransparency: metadata?.hasTransparency || false
        };
        dispatch({ type: 'IMAGE_LOADED', image: imageInfo });
      } else {
        dispatch({ type: 'IMAGE_LOAD_FAILED', error: result?.error || 'Failed to load image' });
      }
    } catch (error) {
      dispatch({ type: 'IMAGE_LOAD_FAILED', error: error instanceof Error ? error.message : 'Failed to load image' });
    }
  }, []);

  const setWatermark = useCallback(async (watermark: WatermarkConfig | null) => {
    dispatch({ type: 'COMMAND_START' });
    try {
      await window.electronAPI?.engine.setWatermark(watermark);
      dispatch({ type: 'WATERMARK_SET', watermark });
    } catch (error) {
      dispatch({ type: 'COMMAND_FAILED', error: error instanceof Error ? error.message : 'Failed to set watermark' });
    }
  }, []);

  const updateEngineSettings = useCallback(async (settings: any) => {
    dispatch({ type: 'COMMAND_START' });
    try {
      await window.electronAPI?.engine.updateSettings(settings);
      dispatch({ type: 'COMMAND_COMPLETE' });
    } catch (error) {
      dispatch({ type: 'COMMAND_FAILED', error: error instanceof Error ? error.message : 'Failed to update engine settings' });
    }
  }, []);

  // Utility functions
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const clearEngineErrors = useCallback(() => {
    dispatch({ type: 'CLEAR_ENGINE_ERRORS' });
  }, []);

  // Set up engine event listeners
  useEffect(() => {
    // Status updates
    const unsubscribeStatus = window.electronAPI?.engine.onStatusUpdate((status: any) => {
      if (status.stage) {
        dispatch({ type: 'STAGE_CHANGED', stage: status.stage });
      }
      if (typeof status.progress === 'number' && typeof status.elapsedTime === 'number') {
        dispatch({ type: 'PROGRESS_UPDATE', progress: status.progress, elapsedTime: status.elapsedTime });
      }
    });

    // Stage changes
    const unsubscribeStage = window.electronAPI?.engine.onStageChange((stage: AnimationStage) => {
      dispatch({ type: 'STAGE_CHANGED', stage });
    });

    // Metrics updates
    const unsubscribeMetrics = window.electronAPI?.engine.onMetricsUpdate((metrics: EngineMetrics) => {
      dispatch({ type: 'METRICS_UPDATE', metrics });
    });

    // Engine errors
    const unsubscribeError = window.electronAPI?.engine.onError((error: EngineError) => {
      dispatch({ type: 'ENGINE_ERROR', error });
    });

    // Cleanup on unmount
    return () => {
      unsubscribeStatus?.();
      unsubscribeStage?.();
      unsubscribeMetrics?.();
      unsubscribeError?.();
    };
  }, []);

  // Check engine status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (state.isEngineRunning) {
        getEngineHealth();
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [state.isEngineRunning, getEngineHealth]);

  const contextValue: AnimationContextValue = {
    state,
    startEngine,
    stopEngine,
    restartEngine,
    getEngineHealth,
    startAnimation,
    pauseAnimation,
    resumeAnimation,
    stopAnimation,
    skipToFinal,
    loadImage,
    setWatermark,
    updateEngineSettings,
    clearError,
    clearEngineErrors
  };

  return (
    <AnimationContext.Provider value={contextValue}>
      {children}
    </AnimationContext.Provider>
  );
}

// Custom hook to use animation context
export function useAnimation() {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error('useAnimation must be used within an AnimationProvider');
  }
  return context;
}

// Export types for use in components
export type { 
  AnimationState, 
  AnimationStage, 
  ImageInfo, 
  WatermarkConfig, 
  EngineMetrics, 
  EngineError, 
  AnimationConfig,
  EngineHealthStatus
};
