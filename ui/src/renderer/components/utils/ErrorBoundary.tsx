/**
 * ErrorBoundary Component
 * 
 * React error boundary component for graceful error handling with:
 * - Automatic error catching and logging
 * - User-friendly error display with detailed information
 * - Error reporting functionality with telemetry integration
 * - Retry functionality for transient errors
 * - Fallback UI with recovery options
 * - Development vs production error display modes
 * - Component isolation to prevent cascade failures
 * 
 * Used throughout the application to ensure stability and provide
 * graceful degradation when components encounter unexpected errors.
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import type { ErrorReport, ErrorSeverity } from '../../types/errors';
import './ErrorBoundary.css';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo, report: ErrorReport) => void;
  enableRetry?: boolean;
  enableReporting?: boolean;
  level?: 'page' | 'component' | 'feature';
  identifier?: string;
  className?: string;
}

interface ErrorBoundaryComponentState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  errorId: string;
  startTime: number;
}

const MAX_RETRY_COUNT = 3;
const RETRY_DELAY = 1000; // 1 second

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryComponentState> {
  private retryTimer: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      errorId: '',
      startTime: Date.now()
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryComponentState> {
    return {
      hasError: true,
      error,
      errorId: ErrorBoundary.generateErrorId()
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError, enableReporting = true } = this.props;
    
    this.setState({ 
      errorInfo,
      startTime: Date.now()
    });

    const report = this.createErrorReport(error, errorInfo);
    
    // Log error to console
    console.group(`🚨 Error Boundary: ${this.props.identifier || 'Unknown'}`);
    console.error('Error:', error);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Error Report:', report);
    console.groupEnd();

    // Call custom error handler
    if (onError) {
      onError(error, errorInfo, report);
    }

    // Report error to monitoring service
    if (enableReporting) {
      this.reportError(report);
    }
  }

  override componentDidUpdate(_prevProps: ErrorBoundaryProps, prevState: ErrorBoundaryComponentState): void {
    // Auto-retry for transient errors after delay
    if (this.state.hasError && !prevState.hasError && this.props.enableRetry && this.state.retryCount < MAX_RETRY_COUNT) {
      this.retryTimer = setTimeout(() => {
        this.handleRetry();
      }, RETRY_DELAY * (this.state.retryCount + 1));
    }
  }

  override componentWillUnmount(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
  }

  private static generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createErrorReport(error: Error, errorInfo: ErrorInfo): ErrorReport {
    const { level = 'component', identifier } = this.props;
    
    const severity: ErrorSeverity = level === 'page' ? 'critical' : 
                                   level === 'feature' ? 'high' : 'medium';

    return {
      id: this.state.errorId,
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack || ''
      },
      component: {
        name: identifier || 'ErrorBoundary',
        level,
        componentStack: errorInfo.componentStack || ''
      },
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
        retryCount: this.state.retryCount,
        timeToError: Date.now() - this.state.startTime
      },
      severity,
      tags: [
        'error-boundary',
        `level:${level}`,
        `retry:${this.state.retryCount}`,
        identifier ? `component:${identifier}` : undefined
      ].filter(Boolean) as string[]
    };
  }

  private async reportError(report: ErrorReport): Promise<void> {
    try {
      // In a real application, this would send to error tracking service
      // like Sentry, Bugsnag, or custom logging endpoint
      
      if (process.env.NODE_ENV === 'development') {
        console.info('📊 Error Report (Dev Mode):', report);
        return;
      }

      // Example: Send to electron main process for logging
      if (window.electron?.logger) {
        await window.electron.logger.error('ErrorBoundary', report);
      }

      // Example: Send to remote error tracking service
      if (window.electron?.telemetry) {
        await window.electron.telemetry.reportError(report);
      }

    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }

  private handleRetry = (): void => {
    if (this.state.retryCount >= MAX_RETRY_COUNT) {
      console.warn('Max retry count reached, not retrying');
      return;
    }

    console.info(`🔄 Retrying component (attempt ${this.state.retryCount + 1}/${MAX_RETRY_COUNT})`);

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
      errorId: ErrorBoundary.generateErrorId(),
      startTime: Date.now()
    }));
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleGoBack = (): void => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };

  private handleReportIssue = (): void => {
    const report = this.createErrorReport(
      this.state.error!, 
      this.state.errorInfo!
    );

    // Create issue report template
    const issueTemplate = `
## Error Report

**Error ID:** ${report.id}
**Timestamp:** ${report.timestamp}
**Severity:** ${report.severity}

### Error Details
- **Type:** ${report.error.name}
- **Message:** ${report.error.message}
- **Component:** ${report.component.name} (${report.component.level})

### Environment
- **URL:** ${report.context.url}
- **User Agent:** ${report.context.userAgent}
- **Retry Count:** ${report.context.retryCount}

### Stack Trace
\`\`\`
${report.error.stack}
\`\`\`

### Component Stack
\`\`\`
${report.component.componentStack}
\`\`\`

Please describe what you were doing when this error occurred:
<!-- Your description here -->
    `.trim();

    // Copy to clipboard
    navigator.clipboard.writeText(issueTemplate).then(() => {
      alert('Error report copied to clipboard. Please paste it when creating an issue.');
    }).catch(() => {
      console.error('Failed to copy error report to clipboard');
    });
  };

  private renderErrorDetails(): ReactNode {
    const { error, errorInfo, errorId } = this.state;
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (!error || !errorInfo) return null;

    return (
      <details className="error-details">
        <summary className="error-summary">
          <span className="error-icon">🔍</span>
          <span className="error-summary-text">Show Error Details</span>
        </summary>
        
        <div className="error-content">
          <div className="error-section">
            <h4 className="section-title">Error Information</h4>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">ID:</span>
                <span className="info-value">{errorId}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Type:</span>
                <span className="info-value">{error.name}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Component:</span>
                <span className="info-value">{this.props.identifier || 'Unknown'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Retry Count:</span>
                <span className="info-value">{this.state.retryCount}</span>
              </div>
            </div>
          </div>

          <div className="error-section">
            <h4 className="section-title">Message</h4>
            <div className="error-message">{error.message}</div>
          </div>

          {isDevelopment && (
            <>
              <div className="error-section">
                <h4 className="section-title">Stack Trace</h4>
                <pre className="error-stack">{error.stack}</pre>
              </div>

              <div className="error-section">
                <h4 className="section-title">Component Stack</h4>
                <pre className="error-stack">{errorInfo.componentStack}</pre>
              </div>
            </>
          )}
        </div>
      </details>
    );
  }

  private renderErrorActions(): ReactNode {
    const { enableRetry = true, level = 'component' } = this.props;
    const { retryCount } = this.state;
    const canRetry = enableRetry && retryCount < MAX_RETRY_COUNT;

    return (
      <div className="error-actions">
        {canRetry && (
          <button
            type="button"
            className="error-action retry-button"
            onClick={this.handleRetry}
          >
            <span className="action-icon">🔄</span>
            <span className="action-text">
              Try Again {retryCount > 0 && `(${retryCount}/${MAX_RETRY_COUNT})`}
            </span>
          </button>
        )}

        {level === 'page' && (
          <button
            type="button"
            className="error-action reload-button"
            onClick={this.handleReload}
          >
            <span className="action-icon">🔃</span>
            <span className="action-text">Reload Page</span>
          </button>
        )}

        <button
          type="button"
          className="error-action back-button"
          onClick={this.handleGoBack}
        >
          <span className="action-icon">←</span>
          <span className="action-text">Go Back</span>
        </button>

        <button
          type="button"
          className="error-action report-button"
          onClick={this.handleReportIssue}
        >
          <span className="action-icon">🐛</span>
          <span className="action-text">Report Issue</span>
        </button>
      </div>
    );
  }

  private renderFallbackUI(): ReactNode {
    const { level = 'component', identifier } = this.props;
    const { error } = this.state;

    const errorTitle = level === 'page' ? 'Page Error' :
                      level === 'feature' ? 'Feature Error' :
                      'Component Error';

    return (
      <div className={`error-boundary-fallback ${level}-error`}>
        <div className="error-container">
          <div className="error-header">
            <div className="error-icon-large">
              {level === 'page' ? '🚫' : level === 'feature' ? '⚠️' : '🔧'}
            </div>
            <h2 className="error-title">{errorTitle}</h2>
            <p className="error-subtitle">
              {level === 'page' 
                ? 'This page encountered an unexpected error'
                : level === 'feature'
                ? 'A feature is temporarily unavailable'
                : 'A component failed to load properly'
              }
            </p>
          </div>

          <div className="error-body">
            <div className="error-description">
              <p>
                {error?.message || 'An unexpected error occurred'}
                {identifier && ` in ${identifier}`}.
              </p>
              <p>
                This error has been automatically reported. 
                {this.props.enableRetry && ' You can try again or '}
                You can go back to continue using the application.
              </p>
            </div>

            {this.renderErrorDetails()}
            {this.renderErrorActions()}
          </div>

          <div className="error-footer">
            <p className="error-help">
              If this problem persists, please report it using the "Report Issue" button above.
            </p>
          </div>
        </div>
      </div>
    );
  }

  override render(): ReactNode {
    const { children, fallback, className = '' } = this.props;
    const { hasError } = this.state;

    if (hasError) {
      return (
        <div className={`error-boundary ${className}`}>
          {fallback || this.renderFallbackUI()}
        </div>
      );
    }

    return children;
  }
}

// Higher-order component wrapper for functional components
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};
