/**
 * Service Interface Definitions for Point Shooting UI
 * 
 * This module defines the contracts for all major services in the application.
 * These interfaces ensure consistency and enable dependency injection and testing.
 */

import {
  ApplicationState,
  UISettings,
  AnimationConfig,
  FileResults,
  ErrorInfo,
  IPCMessage,
  IPCResponse,
  PerformanceMetrics
} from './core';

import { EngineStatus } from './engine';

// ============================================================================
// MAIN WINDOW CONTROLLER SERVICE
// ============================================================================

/**
 * Main Window Controller Service Interface
 * Manages window lifecycle, state, and user interactions
 */
export interface IMainWindowController {
  // Window Management
  initializeWindow(): Promise<void>;
  closeWindow(): Promise<void>;
  minimizeWindow(): Promise<void>;
  maximizeWindow(): Promise<void>;
  restoreWindow(): Promise<void>;
  setFullscreen(fullscreen: boolean): Promise<void>;
  
  // State Management
  getApplicationState(): Promise<ApplicationState>;
  updateApplicationState(newState: Partial<ApplicationState>): Promise<void>;
  resetToDefaultState(): Promise<void>;
  
  // Animation Control
  startAnimation(config?: AnimationConfig): Promise<void>;
  pauseAnimation(): Promise<void>;
  resumeAnimation(): Promise<void>;
  stopAnimation(): Promise<void>;
  
  // File Operations
  loadImageFile(filePath: string): Promise<FileResults>;
  clearCurrentImage(): Promise<void>;
  
  // Error Handling
  handleError(error: ErrorInfo): Promise<void>;
  clearErrors(): Promise<void>;
  
  // Event Listeners
  onStateChanged(callback: (state: ApplicationState) => void): () => void;
  onError(callback: (error: ErrorInfo) => void): () => void;
}

// ============================================================================
// SETTINGS MANAGER SERVICE
// ============================================================================

/**
 * Settings Manager Service Interface
 * Handles persistence and validation of user preferences
 */
export interface ISettingsManager {
  // UI Settings
  getUISettings(): Promise<UISettings>;
  updateUISettings(settings: Partial<UISettings>): Promise<void>;
  resetUISettings(): Promise<void>;
  
  // Animation Settings
  getAnimationConfig(): Promise<AnimationConfig>;
  updateAnimationConfig(config: Partial<AnimationConfig>): Promise<void>;
  resetAnimationConfig(): Promise<void>;
  
  // Settings Validation
  validateUISettings(settings: UISettings): Promise<boolean>;
  validateAnimationConfig(config: AnimationConfig): Promise<boolean>;
  
  // Settings Export/Import
  exportSettings(): Promise<string>;
  importSettings(data: string): Promise<void>;
  
  // Persistence
  saveSettings(): Promise<void>;
  loadSettings(): Promise<void>;
  
  // Event Listeners
  onSettingsChanged(callback: (type: 'ui' | 'animation', settings: unknown) => void): () => void;
}

// ============================================================================
// FILE MANAGER SERVICE
// ============================================================================

/**
 * File Manager Service Interface
 * Handles file operations, validation, and metadata
 */
export interface IFileManager {
  // File Operations
  selectImageFile(): Promise<FileResults>;
  validateImageFile(filePath: string): Promise<FileResults>;
  getFileMetadata(filePath: string): Promise<FileResults>;
  
  // File History
  getRecentFiles(): Promise<string[]>;
  addToRecentFiles(filePath: string): Promise<void>;
  clearRecentFiles(): Promise<void>;
  
  // File Validation
  getSupportedFormats(): Promise<string[]>;
  isFormatSupported(filePath: string): Promise<boolean>;
  checkFileSize(filePath: string): Promise<boolean>;
  
  // File Processing
  preprocessImage(filePath: string): Promise<FileResults>;
  generateThumbnail(filePath: string): Promise<string>;
  
  // Error Handling
  handleFileError(error: Error, filePath?: string): Promise<ErrorInfo>;
  
  // Event Listeners
  onFileSelected(callback: (results: FileResults) => void): () => void;
  onFileError(callback: (error: ErrorInfo) => void): () => void;
}

// ============================================================================
// PYTHON ENGINE BRIDGE SERVICE
// ============================================================================

/**
 * Python Engine Bridge Service Interface
 * Manages communication with Python animation engine
 */
export interface IPythonEngineBridge {
  // Engine Lifecycle
  startEngine(): Promise<void>;
  stopEngine(): Promise<void>;
  restartEngine(): Promise<void>;
  isEngineRunning(): Promise<boolean>;
  
  // Engine Status
  getEngineStatus(): Promise<EngineStatus>;
  getEngineVersion(): Promise<string>;
  checkEngineHealth(): Promise<boolean>;
  
  // Animation Control
  loadImage(filePath: string): Promise<void>;
  startAnimation(config: AnimationConfig): Promise<void>;
  pauseAnimation(): Promise<void>;
  resumeAnimation(): Promise<void>;
  stopAnimation(): Promise<void>;
  updateAnimationConfig(config: Partial<AnimationConfig>): Promise<void>;
  
  // Performance Monitoring
  getPerformanceMetrics(): Promise<PerformanceMetrics>;
  enablePerformanceMonitoring(enabled: boolean): Promise<void>;
  
  // Communication
  sendMessage<T = unknown>(message: IPCMessage<T>): Promise<IPCResponse>;
  broadcastMessage<T = unknown>(message: IPCMessage<T>): Promise<void>;
  
  // Error Handling
  handleEngineError(error: Error): Promise<ErrorInfo>;
  getLastError(): Promise<ErrorInfo | null>;
  clearErrors(): Promise<void>;
  
  // Event Listeners
  onEngineStatusChanged(callback: (status: EngineStatus) => void): () => void;
  onPerformanceUpdate(callback: (metrics: PerformanceMetrics) => void): () => void;
  onEngineError(callback: (error: ErrorInfo) => void): () => void;
  onMessage<T = unknown>(callback: (message: IPCMessage<T>) => void): () => void;
}

// ============================================================================
// SERVICE FACTORY INTERFACE
// ============================================================================

/**
 * Service Factory Interface
 * Provides centralized service creation and dependency injection
 */
export interface IServiceFactory {
  // Service Creation
  createMainWindowController(): IMainWindowController;
  createSettingsManager(): ISettingsManager;
  createFileManager(): IFileManager;
  createPythonEngineBridge(): IPythonEngineBridge;
  
  // Service Registration
  registerService<T>(name: string, service: T): void;
  getService<T>(name: string): T;
  
  // Lifecycle Management
  initializeServices(): Promise<void>;
  shutdownServices(): Promise<void>;
}

// ============================================================================
// SERVICE CONFIGURATION INTERFACE
// ============================================================================

/**
 * Service Configuration Interface
 * Defines configuration options for services
 */
export interface IServiceConfiguration {
  // Main Window Controller Config
  readonly windowController: {
    readonly defaultWidth: number;
    readonly defaultHeight: number;
    readonly minWidth: number;
    readonly minHeight: number;
    readonly center: boolean;
    readonly resizable: boolean;
  };
  
  // Settings Manager Config
  readonly settingsManager: {
    readonly settingsPath: string;
    readonly autoSave: boolean;
    readonly backupSettings: boolean;
    readonly validationEnabled: boolean;
  };
  
  // File Manager Config
  readonly fileManager: {
    readonly maxFileSize: number;
    readonly supportedFormats: string[];
    readonly thumbnailSize: number;
    readonly recentFilesLimit: number;
  };
  
  // Python Engine Bridge Config
  readonly engineBridge: {
    readonly enginePath: string;
    readonly timeoutMs: number;
    readonly maxRetries: number;
    readonly healthCheckInterval: number;
    readonly performanceMonitoringInterval: number;
  };
}

// ============================================================================
// SERVICE EVENT TYPES
// ============================================================================

/**
 * Service Event Types
 * Defines events emitted by services
 */
export interface ServiceEvents {
  // Main Window Controller Events
  'window:initialized': void;
  'window:closed': void;
  'window:minimized': void;
  'window:maximized': void;
  'window:restored': void;
  'window:fullscreen': { fullscreen: boolean };
  'state:changed': ApplicationState;
  'animation:started': AnimationConfig;
  'animation:paused': void;
  'animation:resumed': void;
  'animation:stopped': void;
  'file:loaded': FileResults;
  'error:occurred': ErrorInfo;
  
  // Settings Manager Events
  'settings:ui:changed': UISettings;
  'settings:animation:changed': AnimationConfig;
  'settings:saved': void;
  'settings:loaded': void;
  'settings:reset': string; // setting type
  'settings:exported': string; // export path
  'settings:imported': string; // import path
  
  // File Manager Events
  'file:selected': FileResults;
  'file:validated': FileResults;
  'file:processed': FileResults;
  'file:thumbnail:generated': { filePath: string; thumbnailPath: string };
  'file:recent:added': string;
  'file:recent:cleared': void;
  'file:error': ErrorInfo;
  
  // Python Engine Bridge Events
  'engine:started': void;
  'engine:stopped': void;
  'engine:restarted': void;
  'engine:status:changed': EngineStatus;
  'engine:performance:updated': PerformanceMetrics;
  'engine:error': ErrorInfo;
  'engine:message:received': IPCMessage;
  'engine:message:sent': IPCMessage;
}

// ============================================================================
// SERVICE HEALTH CHECK INTERFACE
// ============================================================================

/**
 * Service Health Check Interface
 * Provides health monitoring capabilities
 */
export interface IServiceHealthCheck {
  // Health Status
  isHealthy(): Promise<boolean>;
  getHealthDetails(): Promise<ServiceHealthDetails>;
  
  // Health Monitoring
  startHealthMonitoring(intervalMs?: number): Promise<void>;
  stopHealthMonitoring(): Promise<void>;
  
  // Event Listeners
  onHealthChanged(callback: (healthy: boolean, details: ServiceHealthDetails) => void): () => void;
}

/**
 * Service Health Details
 */
export interface ServiceHealthDetails {
  readonly serviceName: string;
  readonly healthy: boolean;
  readonly lastCheck: number;
  readonly uptime: number;
  readonly errors: ErrorInfo[];
  readonly performance: {
    readonly averageResponseTime: number;
    readonly successRate: number;
    readonly totalRequests: number;
  };
  readonly dependencies: {
    readonly name: string;
    readonly healthy: boolean;
    readonly lastCheck: number;
  }[];
}
