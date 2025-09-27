/**
 * Error Types and Interfaces
 * 
 * Comprehensive type definitions for error handling system including:
 * - Error boundary state management
 * - Error reporting and telemetry
 * - Error severity levels and categorization
 * - Component error context and metadata
 */

import type { ErrorInfo } from 'react';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export interface ErrorContext {
  url: string;
  userAgent: string;
  timestamp: number;
  retryCount: number;
  timeToError: number;
  sessionId?: string;
  userId?: string;
  buildVersion?: string;
  environment?: string;
}

export interface ComponentInfo {
  name: string;
  level: 'page' | 'component' | 'feature';
  componentStack: string;
  props?: Record<string, any>;
  state?: Record<string, any>;
}

export interface ErrorDetails {
  name: string;
  message: string;
  stack: string;
  cause?: string;
  code?: string | number;
}

export interface ErrorReport {
  id: string;
  timestamp: string;
  error: ErrorDetails;
  component: ComponentInfo;
  context: ErrorContext;
  severity: ErrorSeverity;
  tags: string[];
  fingerprint?: string;
  extra?: Record<string, any>;
}

export interface ErrorMetrics {
  errorRate: number;
  errorCount: number;
  affectedUsers: number;
  meanTimeToRecovery: number;
  retrySuccess: number;
}

export interface ErrorHandlerOptions {
  enableRetry?: boolean;
  enableReporting?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  reportingEndpoint?: string;
  enableTelemetry?: boolean;
}

export interface ElectronErrorAPI {
  logger?: {
    error: (component: string, report: ErrorReport) => Promise<void>;
    warn: (component: string, message: string) => Promise<void>;
    info: (component: string, message: string) => Promise<void>;
  };
  telemetry?: {
    reportError: (report: ErrorReport) => Promise<void>;
    reportMetrics: (metrics: ErrorMetrics) => Promise<void>;
    setUser: (userId: string, context?: Record<string, any>) => Promise<void>;
  };
}

// Augment window interface for Electron APIs
declare global {
  interface Window {
    electron?: ElectronErrorAPI & {
      dialog?: {
        showOpenDialog: (options: any) => Promise<any>;
        showSaveDialog: (options: any) => Promise<any>;
        showMessageBox: (options: any) => Promise<any>;
      };
    };
  }
}
