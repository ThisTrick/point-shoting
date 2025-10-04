/**
 * Core Type Definitions for Point Shooting UI
 * 
 * This module defines the fundamental data structures and interfaces
 * used throughout the Point Shooting Electron application.
 * 
 * These types ensure type safety and consistency across the UI layer
 * and provide clear contracts for communication with the Python engine.
 */

// ============================================================================
// APPLICATION STATE TYPES
// ============================================================================

/**
 * Represents the overall application state
 * Includes current mode, engine status, and UI configuration
 */
export interface ApplicationState {
  readonly mode: ApplicationMode;
  readonly engineStatus: EngineStatus;
  readonly isEngineReady: boolean;
  readonly currentImagePath?: string;
  readonly lastError?: ErrorInfo;
  readonly performanceMetrics?: PerformanceMetrics;
}

/**
 * Application operating modes
 */
export enum ApplicationMode {
  IDLE = 'idle',
  LOADING_IMAGE = 'loading_image',
  RUNNING_ANIMATION = 'running_animation',
  PAUSED = 'paused',
  SETTINGS = 'settings',
  ERROR = 'error'
}

/**
 * Engine status information from Python backend
 */
export interface EngineStatus {
  readonly status: EngineState;
  readonly fps?: number;
  readonly particleCount?: number;
  readonly memoryUsage?: number;
  readonly lastUpdate: number; // timestamp
  readonly version?: string;
  readonly stage?: string;
}

/**
 * Engine operational states
 */
export enum EngineState {
  STOPPED = 'stopped',
  STARTING = 'starting',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ERROR = 'error'
}

// ============================================================================
// ANIMATION CONFIGURATION TYPES
// ============================================================================

/**
 * Animation configuration parameters
 * Controls how particles behave and appear
 */
export interface AnimationConfig {
  readonly density: ParticleDensity;
  readonly speed: AnimationSpeed;
  readonly transitionStyle: TransitionStyle;
  readonly colorMapping: ColorMappingMode;
  readonly enableEffects: boolean;
  readonly enableWatermark: boolean;
  readonly particleCount?: number;
  readonly customSettings?: CustomAnimationSettings;
}

/**
 * Particle density levels
 */
export enum ParticleDensity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  ULTRA = 'ultra'
}

/**
 * Animation speed settings
 */
export enum AnimationSpeed {
  SLOW = 'slow',
  NORMAL = 'normal',
  FAST = 'fast',
  TURBO = 'turbo'
}

/**
 * Transition animation styles
 */
export enum TransitionStyle {
  SMOOTH = 'smooth',
  BURST = 'burst',
  WAVE = 'wave',
  SPIRAL = 'spiral'
}

/**
 * Color mapping modes
 */
export enum ColorMappingMode {
  ORIGINAL = 'original',
  ENHANCED = 'enhanced',
  ARTISTIC = 'artistic',
  MONOCHROME = 'monochrome',
  STYLISH = 'stylish',
  PRECISE = 'precise'
}

/**
 * Extended animation settings for advanced users
 */
export interface CustomAnimationSettings {
  readonly particleSize?: number;
  readonly gravityEffect?: number;
  readonly windEffect?: number;
  readonly trailLength?: number;
  readonly blendMode?: string;
  readonly customColors?: string[];
}

// ============================================================================
// UI SETTINGS TYPES
// ============================================================================

/**
 * User interface configuration settings
 * Controls appearance, behavior, and accessibility
 */
export interface UISettings {
  readonly theme: UITheme;
  readonly language: string;
  readonly showAdvancedControls: boolean;
  readonly enableKeyboardShortcuts: boolean;
  readonly autoSaveSettings: boolean;
  readonly windowSize?: WindowDimensions;
  readonly accessibility?: AccessibilitySettings;
}

/**
 * UI theme options
 */
export enum UITheme {
  LIGHT = 'light',
  DARK = 'dark',
  AUTO = 'auto'
}

/**
 * Window dimensions
 */
export interface WindowDimensions {
  readonly width: number;
  readonly height: number;
  readonly isMaximized: boolean;
  readonly isFullscreen: boolean;
}

/**
 * Accessibility configuration
 */
export interface AccessibilitySettings {
  readonly highContrast: boolean;
  readonly reducedMotion: boolean;
  readonly largeText: boolean;
  readonly screenReaderOptimizations: boolean;
}

// ============================================================================
// FILE MANAGEMENT TYPES
// ============================================================================

/**
 * File operation results and metadata
 */
export interface FileResults {
  readonly success: boolean;
  readonly filePath?: string;
  readonly fileName?: string;
  readonly fileSize?: number;
  readonly dimensions?: ImageDimensions;
  readonly format?: string;
  readonly error?: ErrorInfo;
  readonly processedAt: number; // timestamp
}

/**
 * Image dimensions and metadata
 */
export interface ImageDimensions {
  readonly width: number;
  readonly height: number;
  readonly aspectRatio: number;
  readonly dpi?: number;
}

/**
 * Supported file format information
 */
export interface SupportedFormat {
  readonly extension: string;
  readonly mimeType: string;
  readonly maxSize: number; // in bytes
  readonly description: string;
}

// ============================================================================
// ERROR HANDLING TYPES
// ============================================================================

/**
 * Comprehensive error information
 */
export interface ErrorInfo {
  readonly code: string;
  readonly message: string;
  readonly details?: string;
  readonly timestamp: number;
  readonly severity: ErrorSeverity;
  readonly category: ErrorCategory;
  readonly recoverable: boolean;
  readonly context?: Record<string, unknown>;
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * Error categories for classification
 */
export enum ErrorCategory {
  FILE_OPERATION = 'file_operation',
  ENGINE_COMMUNICATION = 'engine_communication',
  VALIDATION = 'validation',
  PERFORMANCE = 'performance',
  UI_STATE = 'ui_state',
  SYSTEM = 'system'
}

// ============================================================================
// PERFORMANCE MONITORING TYPES
// ============================================================================

/**
 * Performance metrics and monitoring data
 */
export interface PerformanceMetrics {
  readonly fps: number;
  readonly frameTime: number;
  readonly memoryUsage: MemoryUsage;
  readonly renderTime: number;
  readonly engineLatency: number;
  readonly timestamp: number;
}

/**
 * Memory usage statistics
 */
export interface MemoryUsage {
  readonly used: number;
  readonly total: number;
  readonly percentage: number;
  readonly gc?: GarbageCollectionStats;
}

/**
 * Garbage collection statistics
 */
export interface GarbageCollectionStats {
  readonly collections: number;
  readonly totalTime: number;
  readonly averageTime: number;
}

// ============================================================================
// IPC COMMUNICATION TYPES
// ============================================================================

/**
 * Inter-Process Communication message structure
 */
export interface IPCMessage<T = unknown> {
  readonly id: string;
  readonly type: string;
  readonly payload: T;
  readonly timestamp: number;
  readonly source: IPCSource;
}

/**
 * IPC message sources
 */
export enum IPCSource {
  MAIN = 'main',
  RENDERER = 'renderer',
  PYTHON_ENGINE = 'python_engine'
}

/**
 * IPC response wrapper
 */
export interface IPCResponse<T = unknown> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: ErrorInfo;
  readonly requestId: string;
  readonly timestamp: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Generic callback function type
 */
export type CallbackFunction<T = void> = (data: T) => void;

/**
 * Event handler function type
 */
export type EventHandler<T = Event> = (event: T) => void;

/**
 * Async operation function type
 */
export type AsyncOperation<T = unknown> = () => Promise<T>;

/**
 * Configuration validator function type
 */
export type ConfigValidator<T> = (config: T) => boolean;

/**
 * Deep readonly utility type
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * Optional properties utility type
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Required properties utility type
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
