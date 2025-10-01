/**
 * File Management Types
 * 
 * Types for file operations, validation, and metadata handling.
 * Used by FileManager service for image and configuration file management.
 */

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * Represents a validation error with structured information
 */
export interface ValidationError {
  field: string;
  message: string;
  code?: string;  // Made optional for backward compatibility
  severity?: 'error' | 'warning';
}

// ============================================================================
// IMAGE FILE TYPES
// ============================================================================

/**
 * Result of image file operation
 */
export interface ImageFileResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  error?: string;
}

/**
 * Image validation result with detailed checks
 */
export interface ImageValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  metadata?: ImageMetadata;
}

/**
 * Detailed image metadata
 */
export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  colorSpace: string;
  hasAlpha: boolean;
  dpi?: number;
  bitDepth?: number;
  dominantColors?: string[];
}

// ============================================================================
// WATERMARK FILE TYPES
// ============================================================================

/**
 * Result of watermark file operation
 */
export interface WatermarkFileResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  dimensions?: { width: number; height: number };
  error?: string;
}

/**
 * Watermark validation result
 */
export interface WatermarkValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  minSizeMet: boolean; // ≥64px requirement
  isPNG: boolean;
}

// ============================================================================
// RECENT FILES TYPES
// ============================================================================

/**
 * Recent file information
 */
export interface RecentFileInfo {
  path: string;
  name: string;
  timestamp: number;
  type: 'image' | 'preset' | 'watermark';
  thumbnail?: string; // base64 or path
}

// ============================================================================
// FILE STATS TYPES
// ============================================================================

/**
 * File statistics
 */
export interface FileStats {
  size: number;
  created: number;
  modified: number;
  accessed: number;
  isFile: boolean;
  isDirectory: boolean;
  permissions: FilePermissions;
}

/**
 * File permissions
 */
export interface FilePermissions {
  readable: boolean;
  writable: boolean;
  executable: boolean;
}

// ============================================================================
// PRESET/CONFIG TYPES
// ============================================================================

/**
 * Preset configuration file structure
 */
export interface PresetConfig {
  name: string;
  description?: string;
  createdAt: string;
  settings: PresetSettings;
  version: string;
  engineVersion?: string;
}

/**
 * Settings stored in preset
 */
export interface PresetSettings {
  density?: string;
  speed?: string;
  colorMode?: string;
  backgroundType?: string;
  backgroundConfig?: any;
  debugHudEnabled?: boolean;
}

/**
 * Preset validation result
 */
export interface ConfigValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  versionCompatible: boolean;
}

// ============================================================================
// FILE WATCHING TYPES
// ============================================================================

/**
 * File change event
 */
export interface FileChangeEvent {
  type: 'add' | 'change' | 'delete';
  path: string;
  timestamp: number;
}

/**
 * File watcher interface
 */
export interface FileWatcher {
  watch(path: string, callback: (event: FileChangeEvent) => void): void;
  unwatch(path: string): void;
  close(): void;
}

// ============================================================================
// FILE DIALOG TYPES
// ============================================================================

/**
 * File dialog options for image selection
 */
export interface ImageDialogOptions {
  title: string;
  defaultPath?: string;
  filters: FileFilter[];
  properties?: ('openFile' | 'multiSelections' | 'showHiddenFiles')[];
}

/**
 * File filter for dialog
 */
export interface FileFilter {
  name: string;
  extensions: string[];
}

/**
 * File dialog result
 */
export interface FileDialogResult {
  canceled: boolean;
  filePaths: string[];
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

/**
 * Export for use in other modules
 */
export type SupportedImageFormat = 'PNG' | 'JPG' | 'JPEG';
export type SupportedWatermarkFormat = 'PNG';
export type SupportedPresetFormat = 'JSON';

/**
 * Maximum file sizes (in bytes)
 */
export const MAX_IMAGE_SIZE = 4096; // 4096px in any dimension
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const MIN_WATERMARK_SIZE = 64; // 64px minimum
