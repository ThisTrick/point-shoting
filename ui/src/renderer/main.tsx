/**
 * Main Entry Point for Renderer Process
 * 
 * This file serves as the entry point for the Electron renderer process.
 * It sets up React rendering, error boundaries, and development tools.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Development tools
if (process.env.NODE_ENV === 'development') {
  // Enable React strict mode in development
  console.log('🔧 Development mode enabled');
  
  // Log React version
  console.log(`⚛️ React version: ${React.version}`);
  
  // Enable performance profiling
  if ('measureUserAgentSpecificMemory' in performance) {
    (performance as any).measureUserAgentSpecificMemory().then((result: any) => {
      console.log('💾 Initial memory usage:', Math.round(result.bytes / 1024 / 1024), 'MB');
    }).catch(console.warn);
  }
}

// Global error boundary for unhandled React errors
const GlobalErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  
  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setHasError(true);
      setError(new Error(event.message));
    };
    
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setHasError(true);
      setError(new Error(`Unhandled Promise Rejection: ${event.reason}`));
    };
    
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
  
  if (hasError) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: '#1f2937',
        color: '#f9fafb'
      }}>
        <h1 style={{ color: '#ef4444', marginBottom: '1rem' }}>
          🚨 Critical Application Error
        </h1>
        <p style={{ marginBottom: '2rem', textAlign: 'center', maxWidth: '600px' }}>
          The application encountered a fatal error and cannot continue. 
          Please restart the application or contact support if this problem persists.
        </p>
        <details style={{ 
          background: '#374151', 
          padding: '1rem', 
          borderRadius: '0.5rem',
          marginBottom: '2rem',
          maxWidth: '800px',
          width: '100%'
        }}>
          <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
            Error Details
          </summary>
          <pre style={{ 
            marginTop: '1rem', 
            fontSize: '0.875rem', 
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}>
            {error?.message || 'Unknown error'}
            {error?.stack && `\n\n${error.stack}`}
          </pre>
        </details>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              setHasError(false);
              setError(null);
            }}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500'
            }}
          >
            Try Again
          </button>
          <button
            onClick={() => {
              window.location.reload();
            }}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500'
            }}
          >
            Restart Application
          </button>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
};

// Main render function
const renderApp = () => {
  const container = document.getElementById('root');
  
  if (!container) {
    throw new Error('Root container not found. Make sure there is an element with id="root" in your HTML.');
  }
  
  // Clear any existing content (like the loading spinner)
  container.innerHTML = '';
  
  const root = createRoot(container);
  
  // Render the application
  if (process.env.NODE_ENV === 'development') {
    // Enable React Strict Mode in development for additional checks
    root.render(
      <React.StrictMode>
        <GlobalErrorBoundary>
          <App />
        </GlobalErrorBoundary>
      </React.StrictMode>
    );
  } else {
    // Production render without Strict Mode
    root.render(
      <GlobalErrorBoundary>
        <App />
      </GlobalErrorBoundary>
    );
  }
  
  console.log('✅ React application rendered successfully');
};

// Initialize the application
const initializeApp = async () => {
  try {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve);
      });
    }
    
    // Mark theme as loaded to prevent flash
    document.documentElement.setAttribute('data-theme-loaded', 'true');
    
    // Initialize Electron API if available
    if (window.electronAPI) {
      console.log('🔌 Electron API detected');
      
      // Test basic IPC connection
      try {
        await window.electronAPI.settings.get();
        console.log('✅ IPC connection verified');
      } catch (error) {
        console.warn('⚠️ IPC connection test failed:', error);
      }
    } else {
      console.log('🌐 Running in browser mode');
    }
    
    // Render the application
    renderApp();
    
    // Performance logging in development
    if (process.env.NODE_ENV === 'development') {
      // Log when app is fully rendered
      setTimeout(() => {
        const renderTime = performance.now();
        console.log(`⚡ Application rendered in ${Math.round(renderTime)}ms`);
      }, 0);
    }
    
  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
    
    // Show a basic error message if React fails to render
    const container = document.getElementById('root');
    if (container) {
      container.innerHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 2rem;
          font-family: system-ui, -apple-system, sans-serif;
          background-color: #1f2937;
          color: #f9fafb;
          text-align: center;
        ">
          <h1 style="color: #ef4444; margin-bottom: 1rem;">
            ⚠️ Failed to Load Application
          </h1>
          <p style="margin-bottom: 2rem; max-width: 500px;">
            The Point Shooting Animation application failed to load. 
            Please restart the application or check the console for more details.
          </p>
          <button 
            onclick="location.reload()" 
            style="
              padding: 0.75rem 1.5rem;
              background-color: #2563eb;
              color: white;
              border: none;
              border-radius: 0.5rem;
              cursor: pointer;
              font-size: 1rem;
              font-weight: 500;
            "
          >
            Reload Application
          </button>
          <details style="
            margin-top: 2rem;
            background: #374151;
            padding: 1rem;
            border-radius: 0.5rem;
            max-width: 800px;
            width: 100%;
          ">
            <summary style="cursor: pointer; font-weight: bold;">
              Error Details
            </summary>
            <pre style="
              margin-top: 1rem;
              font-size: 0.875rem;
              overflow: auto;
              white-space: pre-wrap;
              word-break: break-word;
            ">${error instanceof Error ? error.message : String(error)}
${error instanceof Error && error.stack ? '\n\n' + error.stack : ''}</pre>
          </details>
        </div>
      `;
    }
  }
};

// Start the application
initializeApp();
