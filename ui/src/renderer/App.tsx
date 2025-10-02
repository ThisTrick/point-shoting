/**
 * Main Application Component
 * 
 * Root React component that integrates all UI components into a cohesive
 * desktop animation application. This is a simplified version that works with
 * the existing component structure.
 */

import React, { useEffect, useState } from 'react';
import { LoadingSpinner } from './components/utils/LoadingSpinner';
import { MainLayout } from './components/MainLayout';
import { ErrorBoundary } from './components/utils/ErrorBoundary';

// Context Providers
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { AnimationProvider } from './contexts/AnimationContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { I18nProvider } from './i18n/config';

// Styles
import './styles/global.css';
import './styles/themes.css';

// Types
import type { ApplicationState } from './types/index';
import type { ErrorReport } from './types/errors';

interface AppProps {
  developmentMode?: boolean;
}

// Inner component that can use settings context
const AppContent: React.FC<{ developmentMode: boolean }> = ({ developmentMode }) => {
  const { state: settingsState } = useSettings();
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [appState, setAppState] = useState<ApplicationState>({
    isLoading: true,
    currentView: 'main',
    hasUnsavedChanges: false,
    performanceMetrics: {
      fps: 0,
      frameTime: 0,
      memoryUsage: 0,
      particleCount: 0
    }
  });

  // Dynamic theme switching - listen for theme changes and update DOM
  useEffect(() => {
    if (settingsState.settings?.theme) {
      document.documentElement.setAttribute('data-theme', settingsState.settings.theme);
    }
  }, [settingsState.settings?.theme]);

  // Dynamic language switching - listen for language changes and update document
  useEffect(() => {
    if (settingsState.settings?.language) {
      document.documentElement.lang = settingsState.settings.language;
      document.documentElement.dir = settingsState.settings.language === 'uk' ? 'ltr' : 'ltr'; // Both are LTR for now
    }
  }, [settingsState.settings?.language]);

  // Note: Performance monitoring is done via useEffect below
  // to avoid hooks count issues with conditional rendering

  // Theme initialization and system preference detection
  useEffect(() => {
    const initializeTheme = () => {
      // Get saved theme preference or detect system preference
      const savedTheme = localStorage.getItem('app-theme');
      const systemPrefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
      
      const theme = savedTheme || settingsState.settings?.theme || 'system';
      
      // Apply theme to document
      document.documentElement.setAttribute('data-theme', theme);
      
      if (systemPrefersHighContrast) {
        document.documentElement.setAttribute('data-contrast', 'high');
      }
      
      // Mark theme as loaded to prevent flash
      document.documentElement.setAttribute('data-theme-loaded', 'true');
      
      // Enable debug mode in development
      if (developmentMode) {
        document.documentElement.setAttribute('data-debug', 'true');
      }
    };

    const initializeApplication = async () => {
      try {
        // Initialize theme first to prevent flash
        initializeTheme();
        
        // Initialize Electron IPC if running in Electron
        if (window.electronAPI) {
          // Test IPC connection with existing API
          await window.electronAPI.settings.get();
          console.log('✅ Electron IPC connection established');
        }
        
        // Set up system preference listeners
        const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const contrastQuery = window.matchMedia('(prefers-contrast: high)');
        
        const handleThemeChange = () => {
          const currentTheme = document.documentElement.getAttribute('data-theme');
          if (currentTheme === 'system') {
            // Re-apply system theme detection
            initializeTheme();
          }
        };
        
        darkModeQuery.addEventListener('change', handleThemeChange);
        contrastQuery.addEventListener('change', handleThemeChange);
        
        // Application is ready
        setAppState((prev: ApplicationState) => ({ ...prev, isLoading: false }));
        setIsInitialized(true);
        
        // Cleanup function would be returned here in real implementation
        
      } catch (error) {
        console.error('❌ Application initialization failed:', error);
        setInitializationError(
          error instanceof Error ? error.message : 'Unknown initialization error'
        );
        setAppState((prev: ApplicationState) => ({ ...prev, isLoading: false }));
      }
    };

    initializeApplication();
  }, [developmentMode, settingsState.settings?.theme]);

  // Keyboard shortcuts setup
  useEffect(() => {
    if (!isInitialized) return;
    
    const handleKeyboardShortcuts = (event: KeyboardEvent) => {
      // Global keyboard shortcuts that work regardless of focus
      const { ctrlKey, metaKey, key } = event;
      const modifier = ctrlKey || metaKey;
      
      // Prevent default browser shortcuts that might interfere
      const preventedCombinations = [
        // Prevent browser zoom
        { modifier: true, key: '+' },
        { modifier: true, key: '-' },
        { modifier: true, key: '0' },
        // Prevent browser navigation
        { modifier: true, key: 'r' },
        { modifier: true, key: 'f' },
        // Allow our custom shortcuts
        { modifier: true, key: ',' }, // Settings
        { modifier: true, key: 'k' }, // Search focus
      ];
      
      const shouldPrevent = preventedCombinations.some(combo => 
        (combo.modifier ? modifier : true) && 
        combo.key === key.toLowerCase()
      );
      
      if (shouldPrevent && !event.defaultPrevented) {
        event.preventDefault();
      }
    };
    
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    return () => {
      document.removeEventListener('keydown', handleKeyboardShortcuts);
    };
  }, [isInitialized]);

  // Performance monitoring in development
  useEffect(() => {
    if (!developmentMode || !isInitialized) return;
    
    let animationFrameId: number;
    let lastTime = performance.now();
    let frameCount = 0;
    
    const measurePerformance = (currentTime: number) => {
      frameCount++;
      const deltaTime = currentTime - lastTime;
      
      // Update FPS every second
      if (deltaTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / deltaTime);
        const avgFrameTime = deltaTime / frameCount;
        
        setAppState((prev: ApplicationState) => ({
          ...prev,
          performanceMetrics: {
            ...prev.performanceMetrics,
            fps,
            frameTime: avgFrameTime
          }
        }));
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      animationFrameId = requestAnimationFrame(measurePerformance);
    };
    
    animationFrameId = requestAnimationFrame(measurePerformance);
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [developmentMode, isInitialized]);

  // Error handler for application-level errors
  // MUST be defined before any conditional returns (Rules of Hooks)
  const handleApplicationError = React.useCallback((error: Error, errorInfo: React.ErrorInfo, report: ErrorReport) => {
    console.error('Application error:', { error, errorInfo, report });
    
    // Log to external error tracking service in production
    if (!developmentMode && typeof window !== 'undefined' && (window as any).errorTracker) {
      (window as any).errorTracker.logError(report);
    }
  }, [developmentMode]);

  // Loading state - NOW safe to return early after all hooks
  if (!isInitialized && !initializationError) {
    return (
      <div className="app-loading">
        <LoadingSpinner size="large" />
        <p>Initializing Point Shooting Animation...</p>
        
        <style>{`
          .app-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: var(--bg-primary);
            color: var(--text-primary);
            gap: 2rem;
          }
          
          .app-loading p {
            font-size: var(--font-size-lg);
            color: var(--text-secondary);
          }
        `}</style>
      </div>
    );
  }

  // Initialization error state
  if (initializationError) {
    return (
      <div className="app-error">
        <h1>⚠️ Initialization Failed</h1>
        <p>{initializationError}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="btn btn-primary"
        >
          Reload Application
        </button>
        
        <style>{`
          .app-error {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 2rem;
            background: var(--bg-primary);
            color: var(--text-primary);
            text-align: center;
            gap: 1rem;
          }
          
          .app-error h1 {
            color: var(--color-error);
            font-size: var(--font-size-2xl);
          }
          
          .app-error p {
            color: var(--text-secondary);
            max-width: 500px;
          }
        `}</style>
      </div>
    );
  }

  // Main application render
  return (
    <ErrorBoundary
      identifier="Application Root"
      level="page"
      enableRetry={true}
      enableReporting={!developmentMode}
      onError={handleApplicationError}
    >
      <I18nProvider 
        defaultLocale="en"
        locale={settingsState.settings?.language}
      >
        <ErrorBoundary
          identifier="Notification System"
          level="feature"
          enableRetry={false}
        >
          <NotificationProvider>
            <ErrorBoundary
              identifier="Animation System"
              level="feature"
              enableRetry={true}
            >
              <AnimationProvider>
                <div 
                  className="app"
                  data-development={developmentMode}
                  data-initialized={isInitialized}
                >
                  {/* Skip link for accessibility */}
                  <a href="#main-content" className="skip-link">
                    Skip to main content
                  </a>
                  
                  {/* Main application layout */}
                  <ErrorBoundary
                    identifier="Main Layout"
                    level="component"
                    enableRetry={true}
                  >
                    <MainLayout />
                  </ErrorBoundary>
                  
                  {/* Development tools in development mode */}
                  {developmentMode && (
                    <div className="development-tools">
                      <div className="perf-monitor">
                        <span>FPS: {appState.performanceMetrics.fps}</span>
                        <span>Frame: {appState.performanceMetrics.frameTime.toFixed(1)}ms</span>
                      </div>
                    </div>
                  )}
                </div>
              </AnimationProvider>
            </ErrorBoundary>
          </NotificationProvider>
        </ErrorBoundary>
      </I18nProvider>
    </ErrorBoundary>
  );
};

const App: React.FC<AppProps> = ({ 
  developmentMode = process.env.NODE_ENV === 'development' 
}) => {
  return (
    <ErrorBoundary
      identifier="Settings System"
      level="feature"
      enableRetry={true}
    >
      <SettingsProvider>
        <AppContent developmentMode={developmentMode} />
      </SettingsProvider>
    </ErrorBoundary>
  );
};

export default App;
