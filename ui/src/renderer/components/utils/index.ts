/**
 * Utility Components Index
 * 
 * Centralized exports for all utility components.
 * These components provide essential UI functionality
 * across the application including error handling,
 * user feedback, and system information display.
 */

export { ErrorBoundary } from './ErrorBoundary';
export type { ErrorBoundaryProps } from './ErrorBoundary';

export { LoadingSpinner } from './LoadingSpinner';
export type { LoadingSpinnerProps, SpinnerType, SpinnerSize, SpinnerColor } from './LoadingSpinner';

export { 
  ToastNotification,
  ToastContainer,
  useToast
} from './ToastNotification';
export type { 
  ToastNotificationProps,
  ToastContainerProps,
  ToastData,
  ToastAction,
  ToastPosition,
  ToastType,
  ToastAnimation
} from './ToastNotification';

export { 
  ConfirmDialog,
  useConfirmDialog
} from './ConfirmDialog';
export type { 
  ConfirmDialogProps,
  DialogType,
  DialogSize,
  DialogAction
} from './ConfirmDialog';

export { 
  HelpTooltip,
  TooltipTitle,
  TooltipDescription,
  TooltipActions,
  useTooltip
} from './HelpTooltip';
export type { 
  TooltipProps,
  TooltipTrigger,
  TooltipPosition,
  TooltipTheme,
  TooltipAnimation
} from './HelpTooltip';

export { 
  VersionInfo,
  useSystemInfo
} from './VersionInfo';
export type { 
  VersionInfoProps,
  VersionData,
  SystemMetrics,
  UpdateInfo
} from './VersionInfo';
