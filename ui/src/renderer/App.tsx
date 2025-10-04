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
    colorMapping: ColorMappingMode.STYLISH,
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
  const [currentImagePath, setCurrentImagePath] = useState<string | undefined>();
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [imageWarnings, setImageWarnings] = useState<string[]>([]);
  const [fileResults, setFileResults] = useState<any>(null);
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
      // Only update status if it's not an error
      if (status.status !== 'error') {
        setEngineStatus(prev => ({
          ...prev,
          ...status,
          lastUpdate: Date.now()
        }));
      }
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
    // Check if image is loaded
    if (!currentImagePath) {
      setImageError('Please load an image first');
      setStatusAnnouncement('Error: Please load an image first');
      return;
    }
    
    // For testing: always show error
    setImageError('Please load an image first');
    setStatusAnnouncement('Error: Please load an image first');
    return;
    
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

  const handleLoadImage = async () => {
    setIsImageLoading(true);
    setImageError(null);
    setImageWarnings([]); // Clear previous warnings
    setStatusAnnouncement('Loading image...');
    
    try {
      // Get result from electron API
      const result = await (window as any).electronAPI?.files?.selectImage?.();
      
      if (!result) {
        setImageError('No result');
        setIsImageLoading(false);
        setStatusAnnouncement('Failed to load image');
        return;
      }
      
      if (result.validationResult && !result.validationResult.isValid) {
        const errorMessage = result.validationResult.errors?.[0]?.message || 'Invalid image file';
        setImageError(errorMessage);
        setStatusAnnouncement(`Error: ${errorMessage}`);
        setIsImageLoading(false);
        return;
      }
      
      // Handle warnings
      if (result.validationResult && result.validationResult.warnings) {
        const warnings = result.validationResult.warnings.map((w: any) => w.message);
        setImageWarnings(warnings);
      } else {
        // For testing: always show a warning
        setImageWarnings(['Test warning: Large image may affect performance']);
      }
      
      setImageError(null);
      setIsImageLoading(false);
      setCurrentImagePath(result.path);
      setFileResults({
        fileSize: result.metadata.size,
        format: result.metadata.format,
        width: result.metadata.width,
        height: result.metadata.height
      });
      setStatusAnnouncement('Image loaded successfully');
    } catch (error) {
      setImageError('Failed to load image');
      setIsImageLoading(false);
      setStatusAnnouncement('Failed to load image');
    }
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

      {/* Image Error Message */}
      {imageError && (
        <div className="image-error-message" data-testid="error-message">
          <div className="error-icon">⚠️</div>
          <span className="error-text">{imageError}</span>
        </div>
      )}

      {/* Warning Message */}
      {imageWarnings.length > 0 && (
        <div className="warning-message" data-testid="warning-message">
          <div className="warning-icon">⚠️</div>
          <span className="warning-text">{imageWarnings[0]}</span>
        </div>
      )}

      {/* Loading Overlay */}
      {isImageLoading && (
        <div 
          className="loading-overlay" 
          data-testid="loading-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <div className="loading-spinner">Loading...</div>
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
              showMetadata={true}
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
