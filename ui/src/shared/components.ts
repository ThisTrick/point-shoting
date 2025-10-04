/**
 * React Component Prop Types for Point Shooting UI
 * 
 * This module defines TypeScript interfaces for all React component props,
 * ensuring type safety and clear component contracts throughout the UI.
 */

import { ReactNode } from 'react';
import {
  ApplicationState,
  UISettings,
  AnimationConfig,
  FileResults,
  EngineState,
  ErrorInfo,
  PerformanceMetrics,
  EventHandler,
  CallbackFunction
} from './core';

// Alias for backward compatibility
type EngineStatus = EngineState;

// ============================================================================
// MAIN APPLICATION COMPONENT PROPS
// ============================================================================

/**
 * Main Application Component Props
 */
export interface AppProps {
  readonly initialState?: Partial<ApplicationState>;
  readonly onError?: EventHandler<ErrorInfo>;
  readonly onStateChange?: EventHandler<ApplicationState>;
}

/**
 * Main Window Component Props
 */
export interface MainWindowProps {
  readonly state: ApplicationState;
  readonly onFileSelect: CallbackFunction<string>;
  readonly onAnimationStart: CallbackFunction<AnimationConfig>;
  readonly onAnimationStop: CallbackFunction<void>;
  readonly onSettingsOpen: CallbackFunction<void>;
  readonly onError: EventHandler<ErrorInfo>;
}

// ============================================================================
// CONTROL PANEL COMPONENT PROPS
// ============================================================================

/**
 * Control Panel Component Props
 */
export interface ControlPanelProps {
  readonly engineStatus: EngineStatus;
  readonly animationConfig: AnimationConfig;
  readonly disabled?: boolean;
  readonly compact?: boolean;
  readonly onConfigChange: CallbackFunction<Partial<AnimationConfig>>;
  readonly onStart: CallbackFunction<void>;
  readonly onPause: CallbackFunction<void>;
  readonly onResume: CallbackFunction<void>;
  readonly onStop: CallbackFunction<void>;
}

/**
 * Animation Controls Component Props
 */
export interface AnimationControlsProps {
  readonly isRunning: boolean;
  readonly isPaused: boolean;
  readonly canStart: boolean;
  readonly disabled?: boolean;
  readonly showLabels?: boolean;
  readonly size?: 'small' | 'medium' | 'large';
  readonly onStart: CallbackFunction<void>;
  readonly onPause: CallbackFunction<void>;
  readonly onResume: CallbackFunction<void>;
  readonly onStop: CallbackFunction<void>;
}

/**
 * Parameter Slider Component Props
 */
export interface ParameterSliderProps {
  readonly label: string;
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly step?: number;
  readonly disabled?: boolean;
  readonly showValue?: boolean;
  readonly unit?: string;
  readonly description?: string;
  readonly onChange: CallbackFunction<number>;
  readonly onCommit?: CallbackFunction<number>;
}

/**
 * Parameter Select Component Props
 */
export interface ParameterSelectProps<T = string> {
  readonly label: string;
  readonly value: T;
  readonly options: readonly SelectOption<T>[];
  readonly disabled?: boolean;
  readonly placeholder?: string;
  readonly description?: string;
  readonly onChange: CallbackFunction<T>;
}

/**
 * Select Option Interface
 */
export interface SelectOption<T = string> {
  readonly value: T;
  readonly label: string;
  readonly description?: string;
  readonly disabled?: boolean;
}

// ============================================================================
// FILE MANAGEMENT COMPONENT PROPS
// ============================================================================

/**
 * File Selector Component Props
 */
export interface FileSelectorProps {
  readonly currentFile?: string;
  readonly recentFiles?: string[];
  readonly supportedFormats: string[];
  readonly maxFileSize: number;
  readonly disabled?: boolean;
  readonly showRecentFiles?: boolean;
  readonly onFileSelect: CallbackFunction<string>;
  readonly onFileValidate?: CallbackFunction<FileResults>;
  readonly onError: EventHandler<ErrorInfo>;
}

/**
 * File Drop Zone Component Props
 */
export interface FileDropZoneProps {
  readonly acceptedFormats: string[];
  readonly maxFileSize: number;
  readonly disabled?: boolean;
  readonly showPreview?: boolean;
  readonly className?: string;
  readonly children?: ReactNode;
  readonly onFileDrop: CallbackFunction<File>;
  readonly onFileHover?: CallbackFunction<boolean>;
  readonly onError: EventHandler<ErrorInfo>;
}

/**
 * File Info Display Component Props
 */
export interface FileInfoDisplayProps {
  readonly fileResults: FileResults;
  readonly showThumbnail?: boolean;
  readonly showMetadata?: boolean;
  readonly compact?: boolean;
  readonly onClear?: CallbackFunction<void>;
}

/**
 * Recent Files List Component Props
 */
export interface RecentFilesListProps {
  readonly files: string[];
  readonly maxItems?: number;
  readonly showThumbnails?: boolean;
  readonly onFileSelect: CallbackFunction<string>;
  readonly onFileClear?: CallbackFunction<string>;
  readonly onClearAll?: CallbackFunction<void>;
}

// ============================================================================
// SETTINGS COMPONENT PROPS
// ============================================================================

/**
 * Settings Panel Component Props - Moved to types/components.ts
 */
// export interface SettingsPanelProps {
//   readonly uiSettings: UISettings;
//   readonly animationConfig: AnimationConfig;
//   readonly isVisible: boolean;
//   readonly onUISettingsChange: (settings: Partial<UISettings>) => void;
//   readonly onAnimationConfigChange: (config: Partial<AnimationConfig>) => void;
//   readonly onClose: () => void;
//   readonly onReset: (scope?: 'ui' | 'animation' | 'all') => void;
//   readonly onExport: () => void;
//   readonly onImport: (data: string) => void;
// }

/**
 * UI Settings Section Component Props
 */
export interface UISettingsSectionProps {
  readonly settings: UISettings;
  readonly onChange: CallbackFunction<Partial<UISettings>>;
  readonly onReset: CallbackFunction<void>;
}

/**
 * Animation Settings Section Component Props
 */
export interface AnimationSettingsSectionProps {
  readonly config: AnimationConfig;
  readonly onChange: CallbackFunction<Partial<AnimationConfig>>;
  readonly onReset: CallbackFunction<void>;
}

/**
 * Theme Selector Component Props
 */
export interface ThemeSelectorProps {
  readonly currentTheme: string;
  readonly availableThemes: string[];
  readonly onChange: CallbackFunction<string>;
}

/**
 * Language Selector Component Props
 */
export interface LanguageSelectorProps {
  readonly currentLanguage: string;
  readonly availableLanguages: string[];
  readonly onChange: CallbackFunction<string>;
}

// ============================================================================
// STATUS AND MONITORING COMPONENT PROPS
// ============================================================================

/**
 * Status Bar Component Props
 */
export interface StatusBarProps {
  readonly engineStatus: EngineStatus;
  readonly performanceMetrics?: PerformanceMetrics;
  readonly lastError?: ErrorInfo;
  readonly showPerformance?: boolean;
  readonly compact?: boolean;
}

/**
 * Engine Status Indicator Component Props
 */
export interface EngineStatusIndicatorProps {
  readonly status: EngineStatus;
  readonly showDetails?: boolean;
  readonly size?: 'small' | 'medium' | 'large';
  readonly onClick?: CallbackFunction<void>;
}

/**
 * Performance Monitor Component Props
 */
export interface PerformanceMonitorProps {
  readonly metrics: PerformanceMetrics;
  readonly showGraph?: boolean;
  readonly updateInterval?: number;
  readonly maxDataPoints?: number;
  readonly onToggle?: CallbackFunction<boolean>;
}

/**
 * Error Display Component Props
 */
export interface ErrorDisplayProps {
  readonly error: ErrorInfo;
  readonly showDetails?: boolean;
  readonly showStackTrace?: boolean;
  readonly dismissible?: boolean;
  readonly onDismiss?: CallbackFunction<void>;
  readonly onRetry?: CallbackFunction<void>;
  readonly onReport?: CallbackFunction<ErrorInfo>;
}

// ============================================================================
// UTILITY COMPONENT PROPS
// ============================================================================

/**
 * Modal Component Props
 */
export interface ModalProps {
  readonly isOpen: boolean;
  readonly title?: string;
  readonly size?: 'small' | 'medium' | 'large' | 'fullscreen';
  readonly closable?: boolean;
  readonly backdrop?: boolean;
  readonly children: ReactNode;
  readonly onClose: CallbackFunction<void>;
}

/**
 * Button Component Props
 */
export interface ButtonProps {
  readonly variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  readonly size?: 'small' | 'medium' | 'large';
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly fullWidth?: boolean;
  readonly icon?: ReactNode;
  readonly className?: string;
  readonly children: ReactNode;
  readonly onClick: CallbackFunction<void>;
}

/**
 * Icon Button Component Props
 */
export interface IconButtonProps {
  readonly icon: ReactNode;
  readonly size?: 'small' | 'medium' | 'large';
  readonly disabled?: boolean;
  readonly tooltip?: string;
  readonly className?: string;
  readonly onClick: CallbackFunction<void>;
}

/**
 * Tooltip Component Props
 */
export interface TooltipProps {
  readonly content: string | ReactNode;
  readonly placement?: 'top' | 'bottom' | 'left' | 'right';
  readonly delay?: number;
  readonly disabled?: boolean;
  readonly children: ReactNode;
}

/**
 * Loading Spinner Component Props
 */
export interface LoadingSpinnerProps {
  readonly size?: 'small' | 'medium' | 'large';
  readonly color?: string;
  readonly className?: string;
  readonly label?: string;
}

/**
 * Progress Bar Component Props
 */
export interface ProgressBarProps {
  readonly value: number;
  readonly max?: number;
  readonly showValue?: boolean;
  readonly label?: string;
  readonly color?: string;
  readonly className?: string;
}

// ============================================================================
// LAYOUT COMPONENT PROPS
// ============================================================================

/**
 * Layout Container Component Props
 */
export interface LayoutContainerProps {
  readonly direction?: 'row' | 'column';
  readonly gap?: number;
  readonly padding?: number;
  readonly className?: string;
  readonly children: ReactNode;
}

/**
 * Sidebar Component Props
 */
export interface SidebarProps {
  readonly isCollapsed?: boolean;
  readonly width?: number;
  readonly collapsedWidth?: number;
  readonly resizable?: boolean;
  readonly onToggle?: CallbackFunction<boolean>;
  readonly onResize?: CallbackFunction<number>;
  readonly children: ReactNode;
}

/**
 * Header Component Props
 */
export interface HeaderProps {
  readonly title?: string;
  readonly subtitle?: string;
  readonly actions?: ReactNode;
  readonly showBorder?: boolean;
  readonly className?: string;
}

/**
 * Footer Component Props
 */
export interface FooterProps {
  readonly showBorder?: boolean;
  readonly className?: string;
  readonly children: ReactNode;
}

// ============================================================================
// FORM COMPONENT PROPS
// ============================================================================

/**
 * Form Field Component Props
 */
export interface FormFieldProps {
  readonly label?: string;
  readonly error?: string;
  readonly help?: string;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly className?: string;
  readonly children: ReactNode;
}

/**
 * Input Component Props
 */
export interface InputProps {
  readonly type?: 'text' | 'number' | 'email' | 'password' | 'search';
  readonly value: string | number;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  readonly error?: boolean;
  readonly className?: string;
  readonly onChange: CallbackFunction<string | number>;
  readonly onBlur?: CallbackFunction<void>;
  readonly onFocus?: CallbackFunction<void>;
}

/**
 * Checkbox Component Props
 */
export interface CheckboxProps {
  readonly checked: boolean;
  readonly disabled?: boolean;
  readonly indeterminate?: boolean;
  readonly label?: string;
  readonly className?: string;
  readonly onChange: CallbackFunction<boolean>;
}

/**
 * Radio Group Component Props
 */
export interface RadioGroupProps<T = string> {
  readonly value: T;
  readonly options: readonly RadioOption<T>[];
  readonly name: string;
  readonly disabled?: boolean;
  readonly className?: string;
  readonly onChange: CallbackFunction<T>;
}

/**
 * Radio Option Interface
 */
export interface RadioOption<T = string> {
  readonly value: T;
  readonly label: string;
  readonly disabled?: boolean;
}
