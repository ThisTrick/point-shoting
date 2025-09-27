/**
 * Enhanced Error Boundary Component
 * 
 * Advanced error boundary with comprehensive error handling, recovery mechanisms,
 * and user-friendly error reporting. Features:
 * - Graceful error recovery with retry mechanisms
 * - Detailed error logging and reporting
 * - Development vs production error display
 * - Integration with crash reporting services
 * - Accessibility compliant error messages
 * - Error categorization and smart recovery suggestions
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AppError, ErrorBoundaryState } from '../../types';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'page' | 'component' | 'critical';
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
  isolate?: boolean;
}

interface ErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo;
  resetError: () => void;
  retry: () => void;
  level: 'page' | 'component' | 'critical';
}

interface ErrorBoundaryComponentState extends ErrorBoundaryState {
  retryCount: number;
  lastErrorTime: number;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryComponentState> {
  private retryTimeout: NodeJS.Timeout | null = null;
  private maxRetries = 3;
  private retryDelay = 1000;
  
  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
      retryCount: 0,
      lastErrorTime: 0,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryComponentState> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const appError: AppError = {
      code: error.name || 'UNKNOWN_ERROR',
      message: error.message,
      details: {
        stack: error.stack,
        cause: (error as any).cause,
      },
      timestamp: Date.now(),
      stack: error.stack,
      recoverable: ErrorBoundary.isRecoverableError(error),
    };
    
    return {
      hasError: true,
      error: appError,
      errorId,
      lastErrorTime: Date.now(),
    };
  }

  /**
   * Determines if an error is recoverable based on its characteristics
   */
  static isRecoverableError(error: Error): boolean {
    const recoverablePatterns = [
      /ChunkLoadError/i,
      /Loading chunk \d+ failed/i,
      /Loading CSS chunk/i,
      /NetworkError/i,
      /Failed to fetch/i,
      /TypeError.*undefined/i, // Common React prop errors
    ];
    
    const nonRecoverablePatterns = [
      /ReferenceError/i,
      /SyntaxError/i,
      /Maximum call stack/i,
      /out of memory/i,
    ];
    
    // Check non-recoverable first
    if (nonRecoverablePatterns.some(pattern => pattern.test(error.message))) {
      return false;
    }
    
    // Check recoverable patterns
    return recoverablePatterns.some(pattern => pattern.test(error.message));
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, level = 'component' } = this.props;
    
    // Update state with error info
    this.setState({ errorInfo });
    
    // Log error details
    const errorData = {
      error,
      errorInfo,
      level,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      retryCount: this.state.retryCount,
    };
    
    console.error('🔥 ErrorBoundary caught error:', errorData);
    
    // Call custom error handler
    if (onError) {
      try {
        onError(error, errorInfo);
      } catch (handlerError) {
        console.error('Error in error handler:', handlerError);
      }
    }
    
    // Send to crash reporting service
    this.reportError(errorData);
    
    // Auto-retry for recoverable errors
    if (this.state.error?.recoverable && this.state.retryCount < this.maxRetries) {
      this.scheduleRetry();
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;
    
    if (hasError && !this.state.hasError) {
      // New error occurred
      return;
    }
    
    if (hasError) {
      // Check if we should reset based on prop changes
      if (resetOnPropsChange) {
        this.resetError();
        return;
      }
      
      // Check if reset keys changed
      if (resetKeys && prevProps.resetKeys) {
        const hasResetKeyChanged = resetKeys.some((key, idx) => key !== prevProps.resetKeys?.[idx]);
        if (hasResetKeyChanged) {
          this.resetError();
        }
      }
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  /**
   * Reports error to external services
   */
  private reportError = async (errorData: any) => {
    try {
      // Send to Electron main process if available
      if (window.electronAPI && (window.electronAPI as any).errorReporting) {
        await (window.electronAPI as any).errorReporting.logError(errorData);
      }
      
      // Send to external crash reporting service
      // This would integrate with services like Sentry, LogRocket, etc.
      if (process.env.NODE_ENV === 'production') {
        // Example: Sentry integration
        // Sentry.captureException(errorData.error, { extra: errorData });
      }
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  /**
   * Schedules an automatic retry for recoverable errors
   */
  private scheduleRetry = () => {
    const delay = this.retryDelay * Math.pow(2, this.state.retryCount); // Exponential backoff
    
    this.retryTimeout = setTimeout(() => {
      this.retry();
    }, delay);
  };

  /**
   * Resets the error boundary state
   */
  private resetError = () => {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
    
    this.setState({
      hasError: false,
      error: null,
      errorId: null,
      retryCount: 0,
      lastErrorTime: 0,
      errorInfo: null,
    });
  };

  /**
   * Retries the failed component with incremented counter
   */
  private retry = () => {
    const newRetryCount = this.state.retryCount + 1;
    
    console.log(`🔄 ErrorBoundary retry attempt ${newRetryCount}/${this.maxRetries}`);
    
    this.setState({
      hasError: false,
      error: null,
      errorId: null,
      retryCount: newRetryCount,
      errorInfo: null,
    });
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback: FallbackComponent, level = 'component', isolate = false } = this.props;

    if (hasError && error) {
      // Use custom fallback component if provided
      if (FallbackComponent) {
        return (
          <FallbackComponent
            error={new Error(error.message)}
            errorInfo={errorInfo!}
            resetError={this.resetError}
            retry={this.retry}
            level={level}
          />
        );
      }

      // Default error UI based on level
      return this.renderDefaultErrorUI(error, level, isolate);
    }

    return children;
  }

  private renderDefaultErrorUI(error: AppError, level: string, isolate: boolean) {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const canRetry = error.recoverable && this.state.retryCount < this.maxRetries;
    
    // Critical level errors need special handling
    if (level === 'critical') {
      return (
        <div className="error-boundary error-boundary--critical">
          <div className="error-content">
            <div className="error-icon">💥</div>
            <h1>Critical Application Error</h1>
            <p>
              The application encountered a critical error and cannot continue safely.
              Please restart the application.
            </p>
            
            <div className="error-actions">
              <button 
                onClick={() => window.location.reload()} 
                className="btn btn-primary"
                autoFocus
              >
                Restart Application
              </button>
              
              {isDevelopment && (
                <button 
                  onClick={this.resetError} 
                  className="btn btn-secondary"
                >
                  Try to Continue (Dev)
                </button>
              )}
            </div>
            
            {isDevelopment && this.renderErrorDetails(error)}
          </div>
        </div>
      );
    }

    // Component or page level errors
    const containerClass = isolate 
      ? 'error-boundary error-boundary--isolated' 
      : `error-boundary error-boundary--${level}`;

    return (
      <div className={containerClass} role="alert" aria-live="polite">
        <div className="error-content">
          <div className="error-icon">
            {level === 'page' ? '📄' : '🧩'}
          </div>
          
          <h2>
            {level === 'page' ? 'Page Error' : 'Component Error'}
          </h2>
          
          <p>
            {error.recoverable 
              ? 'A temporary error occurred. You can try refreshing this section.' 
              : 'An unexpected error occurred. Some functionality may not work correctly.'}
          </p>

          <div className="error-actions">
            {canRetry && (
              <button 
                onClick={this.retry} 
                className="btn btn-primary"
                disabled={this.retryTimeout !== null}
                autoFocus
              >
                {this.retryTimeout ? 'Retrying...' : 'Try Again'}
              </button>
            )}
            
            <button 
              onClick={this.resetError} 
              className="btn btn-secondary"
            >
              Dismiss
            </button>
            
            {level === 'page' && (
              <button 
                onClick={() => window.location.reload()} 
                className="btn btn-tertiary"
              >
                Refresh Page
              </button>
            )}
          </div>

          {isDevelopment && this.renderErrorDetails(error)}
        </div>
        
        <style>{this.getErrorStyles()}</style>
      </div>
    );
  }

  private renderErrorDetails(error: AppError) {
    const { errorInfo } = this.state;
    
    return (
      <details className="error-details" open>
        <summary>Error Details (Development)</summary>
        <div className="error-debug">
          <div className="error-section">
            <h4>Error Information</h4>
            <p><strong>Code:</strong> {error.code}</p>
            <p><strong>Message:</strong> {error.message}</p>
            <p><strong>Timestamp:</strong> {new Date(error.timestamp).toISOString()}</p>
            <p><strong>Recoverable:</strong> {error.recoverable ? 'Yes' : 'No'}</p>
            <p><strong>Retry Count:</strong> {this.state.retryCount}/{this.maxRetries}</p>
          </div>
          
          {error.stack && (
            <div className="error-section">
              <h4>Stack Trace</h4>
              <pre className="error-stack">{error.stack}</pre>
            </div>
          )}
          
          {errorInfo?.componentStack && (
            <div className="error-section">
              <h4>Component Stack</h4>
              <pre className="error-stack">{errorInfo.componentStack}</pre>
            </div>
          )}
          
          {error.details && (
            <div className="error-section">
              <h4>Additional Details</h4>
              <pre className="error-details-json">
                {JSON.stringify(error.details, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </details>
    );
  }

  private getErrorStyles() {
    return `
      .error-boundary {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        border: 2px solid var(--color-error);
        border-radius: var(--radius-lg);
        background: var(--bg-error-subtle);
        color: var(--text-primary);
        min-height: 200px;
      }
      
      .error-boundary--critical {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 9999;
        background: var(--bg-primary);
        min-height: 100vh;
      }
      
      .error-boundary--isolated {
        border-style: dashed;
        background: var(--bg-secondary);
        min-height: 100px;
      }
      
      .error-content {
        text-align: center;
        max-width: 600px;
        width: 100%;
      }
      
      .error-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
      }
      
      .error-content h1,
      .error-content h2 {
        color: var(--color-error);
        margin-bottom: 1rem;
      }
      
      .error-content p {
        margin-bottom: 2rem;
        color: var(--text-secondary);
        line-height: 1.6;
      }
      
      .error-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
        flex-wrap: wrap;
        margin-bottom: 2rem;
      }
      
      .error-details {
        text-align: left;
        margin-top: 2rem;
        background: var(--bg-tertiary);
        padding: 1rem;
        border-radius: var(--radius-md);
        border: 1px solid var(--border-secondary);
      }
      
      .error-debug {
        max-height: 400px;
        overflow-y: auto;
      }
      
      .error-section {
        margin-bottom: 1.5rem;
      }
      
      .error-section h4 {
        margin-bottom: 0.5rem;
        color: var(--text-primary);
        font-size: var(--font-size-sm);
        font-weight: 600;
      }
      
      .error-stack,
      .error-details-json {
        background: var(--bg-primary);
        padding: 1rem;
        border-radius: var(--radius-sm);
        font-size: var(--font-size-xs);
        font-family: var(--font-family-monospace);
        overflow-x: auto;
        white-space: pre-wrap;
        word-break: break-word;
        max-height: 200px;
        overflow-y: auto;
      }
      
      @media (max-width: 640px) {
        .error-boundary {
          padding: 1rem;
        }
        
        .error-actions {
          flex-direction: column;
          align-items: center;
        }
        
        .error-actions .btn {
          width: 100%;
          max-width: 200px;
        }
      }
    `;
  }
}
