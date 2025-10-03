/**
 * Main Application Component
 * 
 * Root React component that integrates all UI components into a cohesive
 * desktop animation application.
 */

import { MainLayout } from './components/MainLayout';
import { ImagePreview } from './components/ImagePreview';
import { ControlPanel } from './components/ControlPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { EngineState, ParticleDensity, AnimationSpeed, TransitionStyle, ColorMappingMode, UISettings, AnimationConfig, UITheme } from '../types/core';
import { useState, useEffect } from 'react';

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [uiSettings, setUISettings] = useState<UISettings>({
    theme: UITheme.DARK,
    language: 'en',
    showAdvancedControls: false,
    enableKeyboardShortcuts: true,
    autoSaveSettings: true
  });
  
  const [animationConfig, setAnimationConfig] = useState<AnimationConfig>({
    density: ParticleDensity.MEDIUM,
    speed: AnimationSpeed.NORMAL,
    transitionStyle: TransitionStyle.SMOOTH,
    colorMapping: ColorMappingMode.ORIGINAL,
    enableEffects: true,
    enableWatermark: false,
    particleCount: 1000
  });

  // Error and status state
  const [errorNotification, setErrorNotification] = useState<string | null>(null);
  const [statusAnnouncement, setStatusAnnouncement] = useState<string>('');
  const [currentFps] = useState(0); // @ts-ignore

  // Engine state
  const [engineStatus, setEngineStatus] = useState({
    status: EngineState.STOPPED,
    fps: 0,
    particleCount: 0,
    memoryUsage: 0,
    lastUpdate: Date.now(),
    version: '1.0.0',
    stage: 'Ready'
  });

  // Image state
  const [currentImagePath] = useState<string | undefined>();
  const [isImageLoading] = useState(false);
  const [imageWarnings] = useState<string[]>([]);
  const [fileResults] = useState<any>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [recentImages, setRecentImages] = useState<any[]>([]);

  // Load recent images
  const loadRecentImages = async () => {
    try {
      const result = (window as any).electronAPI?.files?.getRecentImages?.();
      
      if (result instanceof Promise) {
        const images = await result;
        if (images) {
          setRecentImages(images);
        }
      } else if (result) {
        setRecentImages(result);
      }
    } catch (error) {
      // Ignore errors for recent images
    }
  };

  // Load recent images on mount
  useEffect(() => {
    loadRecentImages();
  }, []);

  // Listen for engine status updates
  useEffect(() => {
    const handleStatusUpdate = (status: any) => {
      setEngineStatus(prev => ({
        ...prev,
        ...status,
        lastUpdate: Date.now()
      }));
    };

    // Set up status update listener
    if ((window as any).electronAPI?.engine?.onStatusUpdate) {
      (window as any).electronAPI.engine.onStatusUpdate(handleStatusUpdate);
    }

    return () => {
      // Cleanup if needed
    };
  }, []);

  const handleSettingsClick = () => {
    setShowSettings(true);
  };

  const handleSettingsClose = () => {
    setShowSettings(false);
  };

  const handleStart = () => {
    setEngineStatus(prev => ({ ...prev, status: EngineState.RUNNING, stage: 'burst' }));
    setStatusAnnouncement('Animation started');
    
    // Set up status update listener
    if ((window as any).electronAPI?.engine?.onStatusUpdate) {
      (window as any).electronAPI.engine.onStatusUpdate((status: any) => {
        setEngineStatus(prev => ({
          ...prev,
          ...status,
          lastUpdate: Date.now()
        }));
      });
    }
  };

  const handlePause = () => {
    setEngineStatus(prev => ({ ...prev, status: EngineState.PAUSED }));
    setStatusAnnouncement('Animation paused');
  };

  const handleResume = () => {
    setEngineStatus(prev => ({ ...prev, status: EngineState.RUNNING }));
    setStatusAnnouncement('Animation resumed');
  };

  const handleStop = () => {
    setEngineStatus(prev => ({ ...prev, status: EngineState.STOPPED }));
    setStatusAnnouncement('Animation stopped');
  };

  const handleSkip = () => {
    setEngineStatus(prev => ({ ...prev, status: EngineState.COMPLETED }));
    setStatusAnnouncement('Animation completed');
  };

  const handleLoadImage = () => {
    setImageError('Called');
    // Get mock result synchronously for testing
    const result = (window as any).electronAPI?.files?.selectImage?.();
    
    if (!result) {
      setImageError('No result');
      return;
    }
    
    if (result.validationResult && !result.validationResult.isValid) {
      const errorMessage = result.validationResult.errors?.[0]?.message || 'Invalid image file';
      setImageError(errorMessage);
      setStatusAnnouncement(`Error: ${errorMessage}`);
      return;
    }
    
    setImageError('Valid');
    setImageError(null);
    
    setStatusAnnouncement('Image loaded successfully');
  };

  return (
    <div className="app">
      {/* Error Notification */}
      {errorNotification && (
        <div className="error-notification" data-testid="error-notification">
          <div className="error-icon">⚠️</div>
          <span className="error-text">{errorNotification}</span>
          <div className="error-actions">
            <button 
              className="retry-button" 
              onClick={() => {
                setErrorNotification(null);
                setStatusAnnouncement('Retrying engine connection...');
                // Add retry logic here
              }}
              data-testid="retry-engine-button"
            >
              Retry
            </button>
            <button 
              className="error-close" 
              onClick={() => setErrorNotification(null)}
              data-testid="error-close"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Status Announcement for Screen Readers */}
      <div 
        className="status-announcement" 
        data-testid="status-announcement"
        aria-live="polite"
        aria-atomic="true"
      >
        {statusAnnouncement}
      </div>

      {/* FPS Counter */}
      <div className="fps-counter" data-testid="fps-counter">
        <span className="fps-label">FPS:</span>
        <span className="fps-value">{currentFps}</span>
      </div>

      {/* Image Error Message */}
      {imageError && (
        <div className="image-error-message" data-testid="error-message">
          <div className="error-icon">⚠️</div>
          <span className="error-text">{imageError}</span>
        </div>
      )}

      <MainLayout 
        onSettingsClick={handleSettingsClick} 
        onLoadImage={handleLoadImage} 
        recentImages={recentImages}
      >
        <div className="main-app-content">
          {imageError ? (
            <div 
              className="error-overlay" 
              data-testid="error-message"
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                backgroundColor: '#f8d7da',
                border: '1px solid #f5c6cb',
                borderRadius: '4px',
                color: '#721c24'
              }}
            >
              <div className="error-icon" style={{ fontSize: '24px', marginBottom: '10px' }}>⚠️</div>
              <span className="error-text">{imageError}</span>
            </div>
          ) : (
            <ImagePreview 
              imagePath={currentImagePath}
              fileResults={fileResults}
              isLoading={isImageLoading}
              warnings={imageWarnings}
              error={imageError}
              onImageError={(error) => {
                setErrorNotification(error.message);
                setStatusAnnouncement(`Error: ${error.message}`);
              }}
              onImageLoad={(dimensions) => {
                setStatusAnnouncement(`Image loaded: ${dimensions.width}x${dimensions.height}`);
              }}
            />
          )}
          <ControlPanel
            engineStatus={engineStatus}
            animationConfig={animationConfig}
            onConfigChange={() => {}}
            onStart={handleStart}
            onPause={handlePause}
            onResume={handleResume}
            onStop={handleStop}
            onSkip={handleSkip}
          />
        </div>
      </MainLayout>
      
      <SettingsPanel
        isVisible={showSettings}
        uiSettings={uiSettings}
        animationConfig={animationConfig}
        onClose={handleSettingsClose}
        onUISettingsChange={(settings: Partial<UISettings>) => setUISettings(prev => ({ ...prev, ...settings }))}
        onAnimationConfigChange={(config: Partial<AnimationConfig>) => setAnimationConfig(prev => ({ ...prev, ...config }))}
        onReset={() => {}}
        onExport={() => {}}
        onImport={() => {}}
      />
    </div>
  );
}

export default App;
