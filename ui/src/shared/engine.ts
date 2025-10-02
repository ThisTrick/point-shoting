/**
 * Engine Communication Types
 * 
 * Types for communication between Electron UI and Python animation engine.
 * These types define the contract for IPC messaging, engine status, and
 * animation control.
 */

// ============================================================================
// ENGINE LIFECYCLE TYPES
// ============================================================================

/**
 * Result of engine startup operation
 */
export interface EngineStartResult {
  success: boolean;
  processId?: number;
  version?: string;
  error?: string;
  startupTime: number;
}

/**
 * Engine health and status information
 */
export interface EngineHealthStatus {
  isResponding: boolean;
  lastHeartbeat: number;
  memoryUsage?: number;
  cpuUsage?: number;
  uptime?: number;
}

/**
 * Engine operational states aligned with Python engine stages
 */
export type AnimationStage = 
  | 'PRE_START'
  | 'BURST'
  | 'CHAOS'
  | 'CONVERGING'
  | 'FORMATION'
  | 'FINAL_BREATHING';

/**
 * Extended engine status with animation information
 */
export interface EngineStatus {
  stage: AnimationStage;
  isRunning: boolean;
  isPaused: boolean;
  progress: number; // 0-1
  elapsedTime: number; // seconds
  fps?: number;
  particleCount?: number;
}

/**
 * Engine performance metrics
 */
export interface EngineMetrics {
  fps: number;
  frameTime: number;
  particleCount: number;
  memoryUsage: number;
  cpuUsage?: number;
  timestamp: number;
}

/**
 * Engine error information
 */
export interface EngineError {
  code: string;
  message: string;
  details?: string;
  timestamp: number;
  fatal: boolean;
}

// ============================================================================
// ENGINE SETTINGS TYPES
// ============================================================================

/**
 * Engine configuration settings (maps to Python engine parameters)
 */
export interface EngineSettings {
  density: 'low' | 'medium' | 'high';
  speed: 'slow' | 'normal' | 'fast';
  colorMode: 'stylish' | 'precise';
  debugHudEnabled: boolean;
  performanceWarnings: boolean;
}

/**
 * Watermark configuration
 */
export interface WatermarkConfig {
  enabled: boolean;
  path?: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity: number; // 0-1
  scale: number; // 0-1
}

// ============================================================================
// IMAGE LOADING TYPES
// ============================================================================

/**
 * Result of image loading operation
 */
export interface ImageLoadResult {
  success: boolean;
  width?: number;
  height?: number;
  format?: string;
  hasTransparency?: boolean;
  processingTime?: number;
  error?: string;
}

/**
 * Image metadata and information
 */
export interface ImageInfo {
  path: string;
  filename: string;
  format: 'PNG' | 'JPG';
  dimensions: { width: number; height: number };
  fileSize: number;
  aspectRatio: number;
  isValid: boolean;
  hasTransparentPixels: boolean;
  dominantColors?: string[];
  exceedsMaxSize: boolean;
  warnings?: string[];
}

// ============================================================================
// IPC MESSAGE PROTOCOL TYPES
// ============================================================================

/**
 * Messages from UI to Python Engine
 */
export type OutgoingMessage = 
  | { type: 'start_animation'; payload: StartAnimationPayload; id?: string; _id?: string }
  | { type: 'pause_animation'; payload: Record<string, never>; id?: string; _id?: string }
  | { type: 'resume_animation'; payload: Record<string, never>; id?: string; _id?: string }
  | { type: 'restart_animation'; payload: Record<string, never>; id?: string; _id?: string }
  | { type: 'stop_animation'; payload: Record<string, never>; id?: string; _id?: string }
  | { type: 'skip_to_final'; payload: Record<string, never>; id?: string; _id?: string }
  | { type: 'update_settings'; payload: EngineSettings; id?: string; _id?: string }
  | { type: 'load_image'; payload: { path: string; imagePath?: string }; id?: string; _id?: string }
  | { type: 'set_watermark'; payload: { watermark: WatermarkConfig | null }; id?: string; _id?: string }
  | { type: 'shutdown'; payload: Record<string, never>; id?: string; _id?: string }
  | { type: 'heartbeat'; payload: Record<string, never>; id?: string; _id?: string };

/**
 * Messages from Python Engine to UI
 */
export type IncomingMessage =
  | { type: 'status_update'; payload: StatusPayload; id?: string; _id?: string }
  | { type: 'stage_changed'; payload: { stage: AnimationStage; timestamp: number }; id?: string; _id?: string }
  | { type: 'stage_change'; payload: { stage: AnimationStage; timestamp: number }; id?: string; _id?: string }  // Alias
  | { type: 'error_occurred'; payload: { error: string; details?: any }; id?: string; _id?: string }
  | { type: 'error'; payload: { error: string; details?: any }; id?: string; _id?: string }  // Alias
  | { type: 'image_loaded'; payload: ImageValidation; id?: string; _id?: string }
  | { type: 'animation_complete'; payload: { finalRecognition: number }; id?: string; _id?: string }
  | { type: 'fps_update'; payload: { fps: number; particles: number }; id?: string; _id?: string }
  | { type: 'metrics_update'; payload: EngineMetrics; id?: string; _id?: string }
  | { type: 'heartbeat'; payload: Record<string, never>; id?: string; _id?: string }
  | { type: 'ready'; payload: any; id?: string; _id?: string };

/**
 * Payload for starting animation
 */
export interface StartAnimationPayload {
  imagePath: string;
  settings: EngineSettings;
  watermark?: WatermarkConfig;
}

/**
 * Animation start configuration (alias for clarity in different contexts)
 */
export type EngineAnimationConfig = StartAnimationPayload;

/**
 * Status update payload from engine
 */
export interface StatusPayload {
  stage: AnimationStage;
  fps: number;
  particles: number;
  progress: number;
  elapsedTime: number;
  isRunning?: boolean;  // Add for EngineStatus compatibility
  isPaused?: boolean;  // Add for EngineStatus compatibility
}

/**
 * Image validation result from engine
 */
export interface ImageValidation {
  isValid: boolean;
  width: number;
  height: number;
  format: string;
  hasTransparency: boolean;
  error?: string;
}

// ============================================================================
// ANIMATION STATE TYPES
// ============================================================================

/**
 * Current animation state (UI-side representation)
 */
export interface AnimationState {
  stage: AnimationStage;
  isRunning: boolean;
  isPaused: boolean;
  currentFPS: number;
  particleCount: number;
  recognitionProgress: number; // 0-1
  elapsedTime: number;
  sourceImage?: ImageInfo;
  watermark?: WatermarkConfig;
  error?: string;
  lastErrorTimestamp?: number;
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

/**
 * Notification message for user feedback
 */
export interface NotificationMessage {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: number;
  autoClose: boolean;
  closeAfter?: number;
  persistent: boolean;
  actions?: NotificationAction[];
}

/**
 * Notification action button
 */
export interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}

// ============================================================================
// WINDOW EVENT TYPES
// ============================================================================

/**
 * Window-related events
 */
export type WindowEvent =
  | { type: 'window_ready' }
  | { type: 'window_close' }
  | { type: 'window_minimize' }
  | { type: 'window_maximize' }
  | { type: 'window_restore' }
  | { type: 'window_focus' }
  | { type: 'window_blur' };
