/**
 * Validation Utilities
 * 
 * Comprehensive validation functions for data integrity and user input
 * validation throughout the Point Shooting UI application.
 */

import {
  UISettings,
  AnimationConfig,
  FileResults,
  ApplicationState,
  EngineStatus,
  ErrorInfo,
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

import {
  FILE_CONSTRAINTS,
  ANIMATION_LIMITS,
  UI_CONSTRAINTS,
  VALIDATION_PATTERNS,
  VALID_STATE_TRANSITIONS,
  VALID_ENGINE_TRANSITIONS
} from './constants';

// ============================================================================
// CORE VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates if a value is not null or undefined
 */
export function isNotNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Validates if a string is not empty or whitespace only
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validates if a number is within a specified range
 */
export function isNumberInRange(
  value: unknown,
  min: number,
  max: number
): value is number {
  return typeof value === 'number' && 
         !isNaN(value) && 
         value >= min && 
         value <= max;
}

/**
 * Validates if a value is one of the specified enum values
 */
export function isValidEnumValue<T extends Record<string, string | number>>(
  value: unknown,
  enumObject: T
): value is T[keyof T] {
  return Object.values(enumObject).includes(value as T[keyof T]);
}

/**
 * Validates if a value matches a regex pattern
 */
export function matchesPattern(value: unknown, pattern: RegExp): value is string {
  return typeof value === 'string' && pattern.test(value);
}

// ============================================================================
// FILE VALIDATION
// ============================================================================

/**
 * Validates file path format
 */
export function isValidFilePath(filePath: unknown): filePath is string {
  if (!isNonEmptyString(filePath)) {
    return false;
  }
  
  // Basic path validation - more sophisticated validation should be done server-side
  return filePath.length > 0 && filePath.length <= 260; // Windows MAX_PATH limit
}

/**
 * Validates if file format is supported
 */
export function isSupportedFileFormat(filePath: string): boolean {
  if (!isValidFilePath(filePath)) {
    return false;
  }
  
  const extension = filePath.toLowerCase().substring(filePath.lastIndexOf('.'));
  return FILE_CONSTRAINTS.SUPPORTED_FORMATS.includes(extension as typeof FILE_CONSTRAINTS.SUPPORTED_FORMATS[number]);
}

/**
 * Validates file size
 */
export function isValidFileSize(size: unknown): size is number {
  return isNumberInRange(size, 0, FILE_CONSTRAINTS.MAX_FILE_SIZE);
}

/**
 * Validates image dimensions
 */
export function areValidImageDimensions(
  width: unknown,
  height: unknown
): boolean {
  return isNumberInRange(width, FILE_CONSTRAINTS.MIN_WIDTH, FILE_CONSTRAINTS.MAX_WIDTH) &&
         isNumberInRange(height, FILE_CONSTRAINTS.MIN_HEIGHT, FILE_CONSTRAINTS.MAX_HEIGHT);
}

/**
 * Validates FileResults object
 */
export function isValidFileResults(fileResults: unknown): fileResults is FileResults {
  if (!fileResults || typeof fileResults !== 'object') {
    return false;
  }
  
  const results = fileResults as Partial<FileResults>;
  
  // Validate required fields
  if (typeof results.success !== 'boolean') {
    return false;
  }
  
  if (typeof results.processedAt !== 'number') {
    return false;
  }
  
  // If successful, validate required success fields
  if (results.success) {
    if (!isValidFilePath(results.filePath)) {
      return false;
    }
    
    if (results.fileSize !== undefined && !isValidFileSize(results.fileSize)) {
      return false;
    }
    
    if (results.dimensions) {
      const { width, height } = results.dimensions;
      if (!areValidImageDimensions(width, height)) {
        return false;
      }
    }
  }
  
  return true;
}

// ============================================================================
// SETTINGS VALIDATION
// ============================================================================

/**
 * Validates UISettings object
 */
export function isValidUISettings(settings: unknown): settings is UISettings {
  if (!settings || typeof settings !== 'object') {
    return false;
  }
  
  const uiSettings = settings as Partial<UISettings>;
  
  // Validate theme
  if (!isValidEnumValue(uiSettings.theme, UITheme)) {
    return false;
  }
  
  // Validate language
  if (!isNonEmptyString(uiSettings.language) || 
      !matchesPattern(uiSettings.language, VALIDATION_PATTERNS.LANGUAGE_CODE)) {
    return false;
  }
  
  // Validate boolean fields
  const booleanFields = [
    'showAdvancedControls',
    'enableKeyboardShortcuts',
    'autoSaveSettings'
  ] as const;
  
  for (const field of booleanFields) {
    if (typeof uiSettings[field] !== 'boolean') {
      return false;
    }
  }
  
  // Validate window size if present
  if (uiSettings.windowSize) {
    const { width, height } = uiSettings.windowSize;
    if (!isNumberInRange(width, UI_CONSTRAINTS.WINDOW.MIN_WIDTH, UI_CONSTRAINTS.WINDOW.MAX_WIDTH) ||
        !isNumberInRange(height, UI_CONSTRAINTS.WINDOW.MIN_HEIGHT, UI_CONSTRAINTS.WINDOW.MAX_HEIGHT)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Validates AnimationConfig object
 */
export function isValidAnimationConfig(config: unknown): config is AnimationConfig {
  if (!config || typeof config !== 'object') {
    return false;
  }
  
  const animConfig = config as Partial<AnimationConfig>;
  
  // Validate enum fields
  if (!isValidEnumValue(animConfig.density, ParticleDensity) ||
      !isValidEnumValue(animConfig.speed, AnimationSpeed) ||
      !isValidEnumValue(animConfig.transitionStyle, TransitionStyle) ||
      !isValidEnumValue(animConfig.colorMapping, ColorMappingMode)) {
    return false;
  }
  
  // Validate boolean fields
  if (typeof animConfig.enableEffects !== 'boolean' ||
      typeof animConfig.enableWatermark !== 'boolean') {
    return false;
  }
  
  // Validate custom settings if present
  if (animConfig.customSettings) {
    const custom = animConfig.customSettings;
    
    if (custom.particleSize !== undefined && 
        !isNumberInRange(custom.particleSize, 
                         ANIMATION_LIMITS.PARTICLE_SIZE.min, 
                         ANIMATION_LIMITS.PARTICLE_SIZE.max)) {
      return false;
    }
    
    if (custom.gravityEffect !== undefined && 
        !isNumberInRange(custom.gravityEffect, 
                         ANIMATION_LIMITS.GRAVITY_EFFECT.min, 
                         ANIMATION_LIMITS.GRAVITY_EFFECT.max)) {
      return false;
    }
    
    if (custom.windEffect !== undefined && 
        !isNumberInRange(custom.windEffect, 
                         ANIMATION_LIMITS.WIND_EFFECT.min, 
                         ANIMATION_LIMITS.WIND_EFFECT.max)) {
      return false;
    }
    
    if (custom.trailLength !== undefined && 
        !isNumberInRange(custom.trailLength, 
                         ANIMATION_LIMITS.TRAIL_LENGTH.min, 
                         ANIMATION_LIMITS.TRAIL_LENGTH.max)) {
      return false;
    }
    
    if (custom.customColors) {
      if (!Array.isArray(custom.customColors)) {
        return false;
      }
      
      for (const color of custom.customColors) {
        if (!matchesPattern(color, VALIDATION_PATTERNS.HEX_COLOR)) {
          return false;
        }
      }
    }
  }
  
  return true;
}

// ============================================================================
// STATE VALIDATION
// ============================================================================

/**
 * Validates ApplicationState object
 */
export function isValidApplicationState(state: unknown): state is ApplicationState {
  if (!state || typeof state !== 'object') {
    return false;
  }
  
  const appState = state as Partial<ApplicationState>;
  
  // Validate mode
  if (!isValidEnumValue(appState.mode, ApplicationMode)) {
    return false;
  }
  
  // Validate engine status
  if (!appState.engineStatus || !isValidEngineStatus(appState.engineStatus)) {
    return false;
  }
  
  // Validate boolean field
  if (typeof appState.isEngineReady !== 'boolean') {
    return false;
  }
  
  // Validate optional file path
  if (appState.currentImagePath !== undefined && 
      !isValidFilePath(appState.currentImagePath)) {
    return false;
  }
  
  // Validate optional error
  if (appState.lastError !== undefined && 
      !isValidErrorInfo(appState.lastError)) {
    return false;
  }
  
  return true;
}

/**
 * Validates EngineStatus object
 */
export function isValidEngineStatus(status: unknown): status is EngineStatus {
  if (!status || typeof status !== 'object') {
    return false;
  }
  
  const engineStatus = status as Partial<EngineStatus>;
  
  // Validate status enum
  if (!isValidEnumValue(engineStatus.status, EngineState)) {
    return false;
  }
  
  // Validate timestamp
  if (typeof engineStatus.lastUpdate !== 'number' || engineStatus.lastUpdate <= 0) {
    return false;
  }
  
  // Validate optional numeric fields
  if (engineStatus.fps !== undefined && !isNumberInRange(engineStatus.fps, 0, 1000)) {
    return false;
  }
  
  if (engineStatus.particleCount !== undefined && 
      !isNumberInRange(engineStatus.particleCount, 0, 100000)) {
    return false;
  }
  
  if (engineStatus.memoryUsage !== undefined && 
      !isNumberInRange(engineStatus.memoryUsage, 0, 10000)) {
    return false;
  }
  
  // Validate version string
  if (engineStatus.version !== undefined && 
      !matchesPattern(engineStatus.version, VALIDATION_PATTERNS.VERSION)) {
    return false;
  }
  
  return true;
}

/**
 * Validates ErrorInfo object
 */
export function isValidErrorInfo(error: unknown): error is ErrorInfo {
  if (!error || typeof error !== 'object') {
    return false;
  }
  
  const errorInfo = error as Partial<ErrorInfo>;
  
  // Validate required fields
  if (!isNonEmptyString(errorInfo.code) ||
      !isNonEmptyString(errorInfo.message) ||
      typeof errorInfo.timestamp !== 'number' ||
      typeof errorInfo.recoverable !== 'boolean') {
    return false;
  }
  
  // Validate enums
  if (!isValidEnumValue(errorInfo.severity, ErrorSeverity) ||
      !isValidEnumValue(errorInfo.category, ErrorCategory)) {
    return false;
  }
  
  return true;
}

// ============================================================================
// STATE TRANSITION VALIDATION
// ============================================================================

/**
 * Validates if a state transition is allowed
 */
export function isValidStateTransition(
  currentMode: ApplicationMode,
  newMode: ApplicationMode
): boolean {
  const allowedTransitions = VALID_STATE_TRANSITIONS[currentMode];
  return allowedTransitions.includes(newMode);
}

/**
 * Validates if an engine state transition is allowed
 */
export function isValidEngineStateTransition(
  currentState: EngineState,
  newState: EngineState
): boolean {
  const allowedTransitions = VALID_ENGINE_TRANSITIONS[currentState];
  return allowedTransitions.includes(newState);
}

// ============================================================================
// COMPOSITE VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates a complete settings object
 */
export function validateSettings(
  uiSettings: unknown,
  animationConfig: unknown
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!isValidUISettings(uiSettings)) {
    errors.push('Invalid UI settings');
  }
  
  if (!isValidAnimationConfig(animationConfig)) {
    errors.push('Invalid animation configuration');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates animation configuration compatibility with engine capabilities
 */
export function validateAnimationCompatibility(
  config: AnimationConfig,
  engineStatus: EngineStatus
): { compatible: boolean; warnings: string[] } {
  const warnings: string[] = [];
  
  // Check if engine is in a compatible state
  if (engineStatus.status !== EngineState.RUNNING && 
      engineStatus.status !== EngineState.STOPPED) {
    warnings.push('Engine is not in a compatible state for animation configuration');
  }
  
  // Check memory usage vs particle density
  if (engineStatus.memoryUsage && engineStatus.memoryUsage > ANIMATION_LIMITS.MAX_MEMORY_USAGE * 0.8) {
    if (config.density === ParticleDensity.HIGH || config.density === ParticleDensity.ULTRA) {
      warnings.push('High particle density may cause performance issues with current memory usage');
    }
  }
  
  // Check FPS vs animation speed
  if (engineStatus.fps && engineStatus.fps < ANIMATION_LIMITS.MIN_FPS) {
    if (config.speed === AnimationSpeed.FAST || config.speed === AnimationSpeed.TURBO) {
      warnings.push('High animation speed may not be achievable with current FPS');
    }
  }
  
  return {
    compatible: warnings.length === 0,
    warnings
  };
}

/**
 * Sanitizes and validates user input for settings
 */
export function sanitizeSettingsInput<T>(
  input: unknown,
  validator: (value: unknown) => value is T,
  defaultValue: T
): T {
  try {
    if (validator(input)) {
      return input;
    }
  } catch (error) {
    console.warn('Settings input validation failed:', error);
  }
  
  return defaultValue;
}
