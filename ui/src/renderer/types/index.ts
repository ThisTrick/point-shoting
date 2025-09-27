/**
 * Application Types
 * 
 * Central type definitions for the Point Shooting Animation UI.
 * This file contains all core TypeScript interfaces, types, and enums
 * used throughout the application.
 */

// ===== CORE APPLICATION TYPES =====

export interface ApplicationState {
  isLoading: boolean;
  currentView: string;
  hasUnsavedChanges: boolean;
  performanceMetrics: PerformanceMetrics;
}

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  particleCount: number;
}

// ===== SETTINGS TYPES =====

export interface UISettings {
  // Appearance
  theme: 'light' | 'dark' | 'system' | 'high-contrast';
  colorScheme: 'default' | 'colorblind-friendly' | 'monochrome';
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  compactMode: boolean;
  
  // Localization
  locale: string;
  dateFormat: 'international' | 'us' | 'european';
  numberFormat: 'default' | 'scientific' | 'compact';
  
  // Performance
  enableAnimations: boolean;
  reducedMotion: boolean;
  performanceMode: 'performance' | 'balanced' | 'quality';
  maxParticles: number;
  
  // Accessibility
  highContrast: boolean;
  screenReaderMode: boolean;
  keyboardNavigation: boolean;
  focusIndicators: boolean;
  
  // Interaction
  tooltipsEnabled: boolean;
  confirmDestructiveActions: boolean;
  autoSave: boolean;
  autoSaveInterval: number;
  
  // Window & Layout
  windowSize: { width: number; height: number };
  windowPosition: { x: number; y: number };
  panelSizes: Record<string, number>;
  collapsedPanels: string[];
  
  // Advanced
  debugMode: boolean;
  developerMode: boolean;
  experimentalFeatures: boolean;
  telemetryEnabled: boolean;
}

export type PartialUISettings = Partial<UISettings>;

// ===== COMPONENT PROP TYPES =====

export interface BaseComponentProps {
  className?: string;
  id?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'data-testid'?: string;
}

export interface InteractiveComponentProps extends BaseComponentProps {
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

// ===== ANIMATION TYPES =====

export interface AnimationSettings {
  speed: number;
  intensity: number;
  particleCount: number;
  colorPalette: string[];
  patternType: 'burst' | 'spiral' | 'wave' | 'random';
  targetImage?: string;
  transitionDuration: number;
}

export interface AnimationState {
  isPlaying: boolean;
  isPaused: boolean;
  currentFrame: number;
  totalFrames: number;
  progress: number;
  stage: 'idle' | 'burst' | 'transition' | 'formation' | 'complete';
}

// ===== PARTICLE TYPES =====

export interface Particle {
  id: string;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  targetX?: number;
  targetY?: number;
  color: string;
  size: number;
  opacity: number;
  age: number;
  maxAge: number;
}

export interface ParticleSystem {
  particles: Particle[];
  bounds: { width: number; height: number };
  gravity: { x: number; y: number };
  friction: number;
  maxVelocity: number;
}

// ===== UI COMPONENT TYPES =====

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  children: React.ReactNode;
}

export interface ButtonProps extends InteractiveComponentProps {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
}

export interface InputProps extends BaseComponentProps {
  type?: 'text' | 'number' | 'email' | 'password' | 'search' | 'url';
  value?: string | number;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helper?: string;
  label?: string;
  onChange?: (value: string | number) => void;
  onEnter?: () => void;
}

export interface SliderProps extends BaseComponentProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  label?: string;
  unit?: string;
  formatValue?: (value: number) => string;
  disabled?: boolean;
  onChange: (value: number) => void;
  onChangeComplete?: (value: number) => void;
}

export interface ToggleProps extends BaseComponentProps {
  checked: boolean;
  label?: string;
  description?: string;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

export interface SelectProps extends BaseComponentProps {
  options: SelectOption[];
  value?: string | number;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  label?: string;
  searchable?: boolean;
  multiSelect?: boolean;
  onChange: (value: string | number | (string | number)[]) => void;
}

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  group?: string;
}

// ===== NOTIFICATION TYPES =====

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  title?: string;
  duration?: number;
  persistent?: boolean;
  actions?: NotificationAction[];
  timestamp: number;
}

export interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary';
}

// ===== CONTEXT TYPES =====

export interface SettingsContextValue {
  settings: UISettings;
  updateSettings: (updates: PartialUISettings) => Promise<void>;
  resetSettings: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export interface AnimationContextValue {
  animationSettings: AnimationSettings;
  animationState: AnimationState;
  particleSystem: ParticleSystem;
  updateAnimationSettings: (updates: Partial<AnimationSettings>) => void;
  startAnimation: () => void;
  pauseAnimation: () => void;
  stopAnimation: () => void;
  resetAnimation: () => void;
  loadTargetImage: (imageData: string | File) => Promise<void>;
}

export interface NotificationContextValue {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

// ===== KEYBOARD SHORTCUT TYPES =====

export interface KeyboardShortcut {
  id: string;
  key: string;
  modifiers: ('ctrl' | 'alt' | 'shift' | 'meta')[];
  description: string;
  category: string;
  action: () => void;
  disabled?: boolean;
  global?: boolean;
}

export interface KeyboardShortcutCategory {
  id: string;
  name: string;
  shortcuts: KeyboardShortcut[];
}

// ===== LAYOUT TYPES =====

export interface LayoutConfig {
  sidebar: {
    width: number;
    collapsed: boolean;
    position: 'left' | 'right';
  };
  toolbar: {
    height: number;
    visible: boolean;
    position: 'top' | 'bottom';
  };
  panels: Array<{
    id: string;
    title: string;
    component: React.ComponentType;
    size: number;
    minSize: number;
    maxSize: number;
    resizable: boolean;
    closable: boolean;
    visible: boolean;
  }>;
}

// ===== ERROR TYPES =====

export interface AppError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: number;
  stack?: string;
  recoverable: boolean;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: AppError | null;
  errorId: string | null;
}

// ===== FILE TYPES =====

export interface ImageFile {
  name: string;
  size: number;
  type: string;
  data: string | ArrayBuffer;
  width: number;
  height: number;
  aspectRatio: number;
}

// ===== API TYPES =====

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

// ===== THEME TYPES =====

export interface ThemeConfig {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  fonts: {
    primary: string;
    monospace: string;
    sizes: Record<string, string>;
  };
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
  shadows: Record<string, string>;
  transitions: Record<string, string>;
}

// ===== UTILITY TYPES =====

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type EventHandler<T = any> = (event: T) => void;

export type AsyncEventHandler<T = any> = (event: T) => Promise<void>;

// ===== EXPORT ALL TYPES =====

// Re-export commonly used React types
export type { ReactNode, ReactElement, ComponentType, FC } from 'react';
