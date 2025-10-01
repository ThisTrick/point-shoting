/**
 * useAnimationState Hook
 * Custom hook for managing animation state with enhanced utilities
 */

import { useContext, useCallback, useMemo } from 'react';
import { AnimationContext } from '../contexts/AnimationContext';
import type { 
  AnimationStage, 
  AnimationConfig,
  WatermarkConfig,
  EngineMetrics
} from '../contexts/AnimationContext';

// Animation control utilities
interface AnimationProgress {
  stage: AnimationStage | null;
  progress: number; // 0-1
  elapsedTime: number;
  estimatedTimeRemaining?: number;
  stageProgress: {
    current: number; // Progress within current stage (0-1)
    total: number;   // Overall progress (0-1)
  };
}

interface EngineStatus {
  isRunning: boolean;
  isHealthy: boolean;
  lastHeartbeat?: number;
  responseTime?: number;
  memoryUsage?: number;
  cpuUsage?: number;
}

interface AnimationHookOptions {
  autoRestart?: boolean;
  healthCheckInterval?: number;
  progressUpdateInterval?: number;
}

// Stage order for progress calculations
const STAGE_ORDER: AnimationStage[] = [
  'PRE_START',
  'BURST', 
  'CHAOS',
  'CONVERGING',
  'FORMATION',
  'FINAL_BREATHING'
];

const STAGE_DURATIONS = {
  PRE_START: 2000,
  BURST: 3000,
  CHAOS: 8000,
  CONVERGING: 12000,
  FORMATION: 15000,
  FINAL_BREATHING: 0 // Infinite/until stopped
};

export function useAnimationState(options: AnimationHookOptions = {}) {
  const context = useContext(AnimationContext);
  
  if (!context) {
    throw new Error('useAnimationState must be used within an AnimationProvider');
  }

  const {
    state,
    startEngine,
    stopEngine,
    restartEngine,
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
  } = context;

  const {
    autoRestart = false
  } = options;

  // Computed animation progress
  const animationProgress: AnimationProgress = useMemo(() => {
    const { currentStage, progress, elapsedTime } = state;
    
    if (!currentStage) {
      return {
        stage: null,
        progress: 0,
        elapsedTime: 0,
        stageProgress: { current: 0, total: 0 }
      };
    }

    // Calculate stage-specific progress
    const stageIndex = STAGE_ORDER.indexOf(currentStage);
    const totalStages = STAGE_ORDER.length - 1; // Exclude FINAL_BREATHING from total
    
    const stageProgress = {
      current: progress,
      total: stageIndex / totalStages + (progress / totalStages)
    };

    // Estimate time remaining (excluding FINAL_BREATHING)
    let estimatedTimeRemaining: number | undefined;
    if (currentStage !== 'FINAL_BREATHING') {
      const remainingStages = STAGE_ORDER.slice(stageIndex + 1, -1); // Exclude FINAL_BREATHING
      const currentStageDuration = STAGE_DURATIONS[currentStage];
      const currentStageRemaining = currentStageDuration * (1 - progress);
      const remainingStageTime = remainingStages.reduce((sum, stage) => 
        sum + STAGE_DURATIONS[stage], 0
      );
      estimatedTimeRemaining = currentStageRemaining + remainingStageTime;
    }

    return {
      stage: currentStage,
      progress,
      elapsedTime,
      estimatedTimeRemaining,
      stageProgress
    };
  }, [state.currentStage, state.progress, state.elapsedTime]);

  // Computed engine status
  const engineStatus: EngineStatus = useMemo(() => {
    const { isEngineRunning, engineHealth } = state;
    
    return {
      isRunning: isEngineRunning,
      isHealthy: engineHealth?.isResponding || false,
      lastHeartbeat: engineHealth?.lastHeartbeat,
      responseTime: engineHealth?.lastHeartbeat ? Date.now() - engineHealth.lastHeartbeat : undefined,
      memoryUsage: engineHealth?.memoryUsage,
      cpuUsage: engineHealth?.cpuUsage
    };
  }, [state.isEngineRunning, state.engineHealth]);

  // Animation control with enhanced logic
  const play = useCallback(async (config?: AnimationConfig) => {
    if (state.isPaused) {
      // Resume if paused
      await resumeAnimation();
    } else if (!state.isAnimationRunning && config) {
      // Start new animation
      await startAnimation(config);
    } else if (state.loadedImage && !config) {
      // Start with loaded image (need to get current settings)
      const defaultConfig: AnimationConfig = {
        imagePath: state.loadedImage.path,
        settings: {}, // Would need to get from settings context
        watermark: state.watermarkConfig || undefined
      };
      await startAnimation(defaultConfig);
    }
  }, [state.isPaused, state.isAnimationRunning, state.loadedImage, state.watermarkConfig, resumeAnimation, startAnimation]);

  const pause = useCallback(async () => {
    if (state.isAnimationRunning && !state.isPaused) {
      await pauseAnimation();
    }
  }, [state.isAnimationRunning, state.isPaused, pauseAnimation]);

  const stop = useCallback(async () => {
    if (state.isAnimationRunning) {
      await stopAnimation();
    }
  }, [state.isAnimationRunning, stopAnimation]);

  const restart = useCallback(async (config?: AnimationConfig) => {
    await stop();
    if (config || state.loadedImage) {
      await play(config);
    }
  }, [stop, play, state.loadedImage]);

  const skipToEnd = useCallback(async () => {
    if (state.isAnimationRunning) {
      await skipToFinal();
    }
  }, [state.isAnimationRunning, skipToFinal]);

  // Engine management with error handling
  const ensureEngineRunning = useCallback(async (): Promise<boolean> => {
    if (!state.isEngineRunning) {
      try {
        await startEngine();
        return true;
      } catch (error) {
        console.error('Failed to start engine:', error);
        return false;
      }
    }
    return true;
  }, [state.isEngineRunning, startEngine]);

  const safeEngineOperation = useCallback(async <T>(operation: () => Promise<T>): Promise<T | null> => {
    try {
      const isRunning = await ensureEngineRunning();
      if (!isRunning) {
        throw new Error('Engine is not available');
      }
      return await operation();
    } catch (error) {
      console.error('Engine operation failed:', error);
      if (autoRestart) {
        try {
          await restartEngine();
        } catch (restartError) {
          console.error('Engine restart failed:', restartError);
        }
      }
      throw error;
    }
  }, [ensureEngineRunning, autoRestart, restartEngine]);

  // Image management with validation
  const changeImage = useCallback(async (imagePath: string) => {
    return safeEngineOperation(() => loadImage(imagePath));
  }, [loadImage, safeEngineOperation]);

  const changeWatermark = useCallback(async (watermark: WatermarkConfig | null) => {
    return safeEngineOperation(() => setWatermark(watermark));
  }, [setWatermark, safeEngineOperation]);

  const updateSettings = useCallback(async (settings: any) => {
    return safeEngineOperation(() => updateEngineSettings(settings));
  }, [updateEngineSettings, safeEngineOperation]);

  // Stage utilities
  const isAtStage = useCallback((stage: AnimationStage) => {
    return state.currentStage === stage;
  }, [state.currentStage]);

  const hasReachedStage = useCallback((stage: AnimationStage) => {
    if (!state.currentStage) return false;
    const currentIndex = STAGE_ORDER.indexOf(state.currentStage);
    const targetIndex = STAGE_ORDER.indexOf(stage);
    return currentIndex >= targetIndex;
  }, [state.currentStage]);

  const getStageProgress = useCallback((stage: AnimationStage) => {
    if (!hasReachedStage(stage)) return 0;
    if (state.currentStage === stage) return state.progress;
    return 1; // Completed stages are 100%
  }, [hasReachedStage, state.currentStage, state.progress]);

  // Performance metrics utilities
  const getPerformanceMetrics = useCallback((): EngineMetrics | null => {
    return state.metrics;
  }, [state.metrics]);

  const isPerformanceHealthy = useCallback((): boolean => {
    if (!state.metrics) return false;
    
    const { fps, memoryUsage } = state.metrics;
    const targetFps = 55; // From specs
    const maxMemoryMB = 300; // From specs
    
    return fps >= targetFps && memoryUsage <= maxMemoryMB;
  }, [state.metrics]);

  // Error management
  const hasErrors = state.error !== null || state.engineErrors.length > 0;
  const latestError = state.engineErrors[0] || null;

  const clearAllErrors = useCallback(() => {
    clearError();
    clearEngineErrors();
  }, [clearError, clearEngineErrors]);

  // Animation state helpers
  const canStart = !state.isAnimationRunning && state.isEngineRunning && state.loadedImage;
  const canPause = state.isAnimationRunning && !state.isPaused;
  const canResume = state.isAnimationRunning && state.isPaused;
  const canStop = state.isAnimationRunning;
  const canSkip = state.isAnimationRunning && state.currentStage !== 'FINAL_BREATHING';

  // Loading states
  const isLoading = state.isStartingEngine || state.isLoadingImage || state.isProcessingCommand;
  const isEngineOperational = state.isEngineRunning && engineStatus.isHealthy;

  return {
    // Current state
    state: state,
    animationProgress,
    engineStatus,
    
    // Content info
    loadedImage: state.loadedImage,
    watermark: state.watermarkConfig,
    metrics: state.metrics,
    
    // Control capabilities
    canStart,
    canPause,
    canResume,
    canStop,
    canSkip,
    
    // Animation controls
    play,
    pause,
    stop,
    restart,
    skipToEnd,
    
    // Engine management
    startEngine,
    stopEngine,
    restartEngine,
    ensureEngineRunning,
    isEngineOperational,
    
    // Content management
    changeImage,
    changeWatermark,
    updateSettings,
    
    // Stage utilities
    isAtStage,
    hasReachedStage,
    getStageProgress,
    currentStage: state.currentStage,
    
    // Performance
    getPerformanceMetrics,
    isPerformanceHealthy,
    
    // Status
    isLoading,
    hasErrors,
    latestError,
    clearAllErrors,
    
    // Progress details
    progress: animationProgress.progress,
    elapsedTime: animationProgress.elapsedTime,
    estimatedTimeRemaining: animationProgress.estimatedTimeRemaining,
    stageProgress: animationProgress.stageProgress
  };
}
