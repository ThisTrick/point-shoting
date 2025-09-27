/**
 * Application Constants
 * 
 * Central configuration and constant values for the Point Shooting UI application.
 * These values control behavior, limits, and default settings throughout the app.
 */

import {
  UISettings,
  AnimationConfig,
  ParticleDensity,
  AnimationSpeed,
  TransitionStyle,
  ColorMappingMode,
  UITheme,
  ApplicationMode,
  EngineState,
  ErrorSeverity,
  ErrorCategory
} from '../types';

// ============================================================================
// APPLICATION METADATA
// ============================================================================

export const APP_INFO = {
  NAME: 'Point Shooting',
  VERSION: '1.0.0',
  DESCRIPTION: 'Particle animation system with image recognition',
  AUTHOR: 'Point Shooting Team',
  HOMEPAGE: 'https://github.com/user/point-shoting',
  SUPPORT_EMAIL: 'support@pointshooting.app'
} as const;

// ============================================================================
// FILE HANDLING CONSTANTS
// ============================================================================

export const FILE_CONSTRAINTS = {
  // Maximum file size (100MB)
  MAX_FILE_SIZE: 100 * 1024 * 1024,
  
  // Supported image formats
  SUPPORTED_FORMATS: [
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'
  ],
  
  // MIME types
  SUPPORTED_MIME_TYPES: [
    'image/jpeg', 'image/png', 'image/gif', 'image/bmp', 
    'image/tiff', 'image/webp'
  ],
  
  // Image dimension limits
  MIN_WIDTH: 100,
  MIN_HEIGHT: 100,
  MAX_WIDTH: 8192,
  MAX_HEIGHT: 8192,
  
  // Recent files limit
  RECENT_FILES_LIMIT: 10
} as const;

// ============================================================================
// ANIMATION CONSTANTS
// ============================================================================

export const ANIMATION_LIMITS = {
  // Particle count ranges
  PARTICLE_COUNT: {
    [ParticleDensity.LOW]: { min: 100, max: 500, default: 300 },
    [ParticleDensity.MEDIUM]: { min: 500, max: 2000, default: 1000 },
    [ParticleDensity.HIGH]: { min: 2000, max: 5000, default: 3000 },
    [ParticleDensity.ULTRA]: { min: 5000, max: 10000, default: 7500 }
  },
  
  // Animation speed multipliers
  SPEED_MULTIPLIERS: {
    [AnimationSpeed.SLOW]: 0.5,
    [AnimationSpeed.NORMAL]: 1.0,
    [AnimationSpeed.FAST]: 1.5,
    [AnimationSpeed.TURBO]: 2.0
  },
  
  // Performance targets
  TARGET_FPS: 60,
  MIN_FPS: 30,
  
  // Memory limits (in MB)
  MAX_MEMORY_USAGE: 300,
  WARNING_MEMORY_THRESHOLD: 250,
  
  // Custom animation parameter ranges
  PARTICLE_SIZE: { min: 0.1, max: 5.0, default: 1.0 },
  GRAVITY_EFFECT: { min: 0.0, max: 2.0, default: 0.5 },
  WIND_EFFECT: { min: 0.0, max: 2.0, default: 0.0 },
  TRAIL_LENGTH: { min: 0, max: 100, default: 10 },
  
  // Animation duration limits (in seconds)
  MIN_DURATION: 5,
  MAX_DURATION: 300,
  DEFAULT_DURATION: 30
} as const;

// ============================================================================
// UI CONSTANTS
// ============================================================================

export const UI_CONSTRAINTS = {
  // Window dimensions
  WINDOW: {
    MIN_WIDTH: 800,
    MIN_HEIGHT: 600,
    DEFAULT_WIDTH: 1200,
    DEFAULT_HEIGHT: 800,
    MAX_WIDTH: 3840,
    MAX_HEIGHT: 2160
  },
  
  // Panel dimensions
  SIDEBAR: {
    DEFAULT_WIDTH: 300,
    MIN_WIDTH: 200,
    MAX_WIDTH: 500,
    COLLAPSED_WIDTH: 60
  },
  
  // Animation timings (in milliseconds)
  ANIMATIONS: {
    FAST: 150,
    NORMAL: 250,
    SLOW: 350,
    PAGE_TRANSITION: 300
  },
  
  // Z-index layers
  Z_INDEX: {
    MODAL_BACKDROP: 1000,
    MODAL: 1001,
    TOOLTIP: 1002,
    NOTIFICATION: 1003,
    LOADING_OVERLAY: 1004
  },
  
  // Responsive breakpoints
  BREAKPOINTS: {
    MOBILE: 768,
    TABLET: 1024,
    DESKTOP: 1200,
    LARGE_DESKTOP: 1440
  }
} as const;

// ============================================================================
// ENGINE CONSTANTS
// ============================================================================

export const ENGINE_CONFIG = {
  // Connection settings
  CONNECTION: {
    TIMEOUT_MS: 5000,
    MAX_RETRIES: 3,
    RETRY_DELAY_MS: 1000,
    HEARTBEAT_INTERVAL_MS: 1000
  },
  
  // Health check settings
  HEALTH_CHECK: {
    INTERVAL_MS: 5000,
    TIMEOUT_MS: 2000,
    FAILURE_THRESHOLD: 3
  },
  
  // Performance monitoring
  PERFORMANCE: {
    MONITORING_INTERVAL_MS: 1000,
    METRICS_HISTORY_SIZE: 60, // 1 minute at 1Hz
    FPS_SMOOTHING_FACTOR: 0.1
  },
  
  // Message handling
  IPC: {
    MESSAGE_TIMEOUT_MS: 10000,
    MAX_QUEUE_SIZE: 100,
    BATCH_SIZE: 10
  }
} as const;

// ============================================================================
// DEFAULT SETTINGS
// ============================================================================

export const DEFAULT_UI_SETTINGS: UISettings = {
  theme: UITheme.AUTO,
  language: 'en',
  showAdvancedControls: false,
  enableKeyboardShortcuts: true,
  autoSaveSettings: true,
  windowSize: {
    width: UI_CONSTRAINTS.WINDOW.DEFAULT_WIDTH,
    height: UI_CONSTRAINTS.WINDOW.DEFAULT_HEIGHT,
    isMaximized: false,
    isFullscreen: false
  },
  accessibility: {
    highContrast: false,
    reducedMotion: false,
    largeText: false,
    screenReaderOptimizations: false
  }
} as const;

export const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
  density: ParticleDensity.MEDIUM,
  speed: AnimationSpeed.NORMAL,
  transitionStyle: TransitionStyle.SMOOTH,
  colorMapping: ColorMappingMode.ORIGINAL,
  enableEffects: true,
  enableWatermark: false,
  customSettings: {
    particleSize: ANIMATION_LIMITS.PARTICLE_SIZE.default,
    gravityEffect: ANIMATION_LIMITS.GRAVITY_EFFECT.default,
    windEffect: ANIMATION_LIMITS.WIND_EFFECT.default,
    trailLength: ANIMATION_LIMITS.TRAIL_LENGTH.default,
    blendMode: 'normal',
    customColors: []
  }
} as const;

// ============================================================================
// ERROR CONFIGURATION
// ============================================================================

export const ERROR_CONFIG = {
  // Display durations (in milliseconds)
  DISPLAY_DURATION: {
    [ErrorSeverity.INFO]: 3000,
    [ErrorSeverity.WARNING]: 5000,
    [ErrorSeverity.ERROR]: 8000,
    [ErrorSeverity.CRITICAL]: 0 // Manual dismissal required
  },
  
  // Auto-retry settings
  AUTO_RETRY: {
    [ErrorCategory.FILE_OPERATION]: { enabled: false, attempts: 0 },
    [ErrorCategory.ENGINE_COMMUNICATION]: { enabled: true, attempts: 3 },
    [ErrorCategory.VALIDATION]: { enabled: false, attempts: 0 },
    [ErrorCategory.PERFORMANCE]: { enabled: false, attempts: 0 },
    [ErrorCategory.UI_STATE]: { enabled: true, attempts: 1 },
    [ErrorCategory.SYSTEM]: { enabled: false, attempts: 0 }
  },
  
  // Error reporting settings
  REPORTING: {
    ENABLED: false, // Disabled by default for privacy
    ENDPOINT: '',
    INCLUDE_STACK_TRACE: true,
    INCLUDE_USER_AGENT: true,
    INCLUDE_SYSTEM_INFO: false
  }
} as const;

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================

export const KEYBOARD_SHORTCUTS = {
  // File operations
  OPEN_FILE: 'Ctrl+O',
  CLEAR_FILE: 'Ctrl+W',
  
  // Animation controls
  START_ANIMATION: 'Space',
  PAUSE_ANIMATION: 'Space',
  STOP_ANIMATION: 'Escape',
  
  // Application controls
  TOGGLE_SETTINGS: 'Ctrl+,',
  TOGGLE_FULLSCREEN: 'F11',
  QUIT_APPLICATION: 'Ctrl+Q',
  
  // View controls
  TOGGLE_SIDEBAR: 'Ctrl+B',
  TOGGLE_STATUS_BAR: 'Ctrl+Shift+S',
  
  // Development shortcuts (only in dev mode)
  RELOAD_APP: 'Ctrl+R',
  TOGGLE_DEV_TOOLS: 'F12'
} as const;

// ============================================================================
// VALIDATION PATTERNS
// ============================================================================

export const VALIDATION_PATTERNS = {
  // File path validation
  FILE_PATH: /^[a-zA-Z]:[\\\/](?:[^<>:"|?*\r\n]+[\\\/])*[^<>:"|?*\r\n]*$/,
  
  // Color validation (hex colors)
  HEX_COLOR: /^#(?:[0-9a-fA-F]{3}){1,2}$/,
  
  // Version string validation
  VERSION: /^\d+\.\d+\.\d+(?:-[a-zA-Z0-9]+)?$/,
  
  // Language code validation (ISO 639-1)
  LANGUAGE_CODE: /^[a-z]{2}(?:-[A-Z]{2})?$/,
  
  // Settings key validation
  SETTINGS_KEY: /^[a-zA-Z][a-zA-Z0-9._]*$/
} as const;

// ============================================================================
// APPLICATION STATE TRANSITIONS
// ============================================================================

export const VALID_STATE_TRANSITIONS: Record<ApplicationMode, ApplicationMode[]> = {
  [ApplicationMode.IDLE]: [
    ApplicationMode.LOADING_IMAGE,
    ApplicationMode.SETTINGS,
    ApplicationMode.ERROR
  ],
  [ApplicationMode.LOADING_IMAGE]: [
    ApplicationMode.IDLE,
    ApplicationMode.RUNNING_ANIMATION,
    ApplicationMode.ERROR
  ],
  [ApplicationMode.RUNNING_ANIMATION]: [
    ApplicationMode.PAUSED,
    ApplicationMode.IDLE,
    ApplicationMode.ERROR
  ],
  [ApplicationMode.PAUSED]: [
    ApplicationMode.RUNNING_ANIMATION,
    ApplicationMode.IDLE,
    ApplicationMode.ERROR
  ],
  [ApplicationMode.SETTINGS]: [
    ApplicationMode.IDLE,
    ApplicationMode.ERROR
  ],
  [ApplicationMode.ERROR]: [
    ApplicationMode.IDLE,
    ApplicationMode.SETTINGS
  ]
};

// ============================================================================
// ENGINE STATE TRANSITIONS
// ============================================================================

export const VALID_ENGINE_TRANSITIONS: Record<EngineState, EngineState[]> = {
  [EngineState.STOPPED]: [
    EngineState.STARTING,
    EngineState.ERROR
  ],
  [EngineState.STARTING]: [
    EngineState.RUNNING,
    EngineState.ERROR,
    EngineState.STOPPED
  ],
  [EngineState.RUNNING]: [
    EngineState.PAUSED,
    EngineState.STOPPED,
    EngineState.ERROR
  ],
  [EngineState.PAUSED]: [
    EngineState.RUNNING,
    EngineState.STOPPED,
    EngineState.ERROR
  ],
  [EngineState.ERROR]: [
    EngineState.STOPPED,
    EngineState.STARTING
  ]
};
