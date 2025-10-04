/**
 * ToastNotification Component
 * 
 * Comprehensive toast notification system with:
 * - Multiple notification types (success, error, warning, info)
 * - Auto-dismiss functionality with customizable timing
 * - Action buttons for user interaction
 * - Stacking and positioning capabilities
 * - Progress indicators for timed notifications
 * - Rich content support with icons and formatting
 * - Accessibility support with ARIA attributes
 * - Animation system for smooth enter/exit transitions
 * - Queue management for multiple notifications
 * 
 * Used throughout the application for user feedback,
 * status updates, and interactive notifications.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import './ToastNotification.css';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'topRight' | 'topLeft' | 'topCenter' | 'bottomRight' | 'bottomLeft' | 'bottomCenter';
export type ToastAnimation = 'slide' | 'fade' | 'bounce' | 'scale';

export interface ToastData {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  actions?: ToastAction[];
  onClose?: () => void;
}

export interface ToastAction {
  label: string;
  onClick: () => void;
  style?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

export interface ToastNotificationProps {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number; // milliseconds, 0 = no auto-dismiss
  showProgress?: boolean;
  actions?: ToastAction[];
  icon?: React.ReactNode | string;
  position?: ToastPosition;
  animation?: ToastAnimation;
  persistent?: boolean; // prevents auto-dismiss
  onClose?: (id: string) => void;
  onAction?: (id: string, actionLabel: string) => void;
  className?: string;
  maxWidth?: number;
}

export interface ToastContainerProps {
  position?: ToastPosition;
  maxToasts?: number;
  animation?: ToastAnimation;
  className?: string;
}

const DEFAULT_DURATION = 5000; // 5 seconds
const DEFAULT_MAX_TOASTS = 5;

// Toast icons mapping
const TOAST_ICONS = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️'
} as const;

// Single Toast Component
export const ToastNotification: React.FC<ToastNotificationProps & { 
  onRemove: (id: string) => void;
  isVisible: boolean;
  zIndex: number;
}> = ({
  id,
  type,
  title,
  message,
  duration = DEFAULT_DURATION,
  showProgress = true,
  actions = [],
  icon,
  position = 'topRight',
  animation = 'slide',
  persistent = false,
  onClose,
  onAction,
  onRemove,
  isVisible,
  zIndex,
  className = '',
  maxWidth = 400
}) => {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const pausedTimeRef = useRef<number>(0);

  const shouldAutoDismiss = duration > 0 && !persistent;

  const handleClose = useCallback(() => {
    if (isExiting) return;
    
    setIsExiting(true);
    onClose?.(id);
    
    // Wait for exit animation before removing from DOM
    setTimeout(() => {
      onRemove(id);
    }, 300); // Match CSS animation duration
  }, [id, onClose, onRemove, isExiting]);

  const handleAction = useCallback((action: ToastAction) => {
    if (action.disabled) return;
    
    action.onClick();
    onAction?.(id, action.label);
    
    // Close toast after action unless it's persistent
    if (!persistent) {
      handleClose();
    }
  }, [id, onAction, persistent, handleClose]);

  const startTimer = useCallback(() => {
    if (!shouldAutoDismiss || isPaused) return;

    const remainingTime = duration - pausedTimeRef.current;
    
    timerRef.current = setTimeout(() => {
      handleClose();
    }, remainingTime);

    // Update progress bar
    if (showProgress) {
      const startTime = Date.now();
      progressIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime + pausedTimeRef.current;
        const newProgress = Math.max(0, ((duration - elapsed) / duration) * 100);
        setProgress(newProgress);
        
        if (newProgress <= 0) {
          clearInterval(progressIntervalRef.current!);
        }
      }, 50);
    }
  }, [shouldAutoDismiss, isPaused, duration, showProgress, handleClose]);

  const pauseTimer = useCallback(() => {
    if (!shouldAutoDismiss) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    pausedTimeRef.current += Date.now() - startTimeRef.current;
    setIsPaused(true);
  }, [shouldAutoDismiss]);

  const resumeTimer = useCallback(() => {
    if (!shouldAutoDismiss) return;

    startTimeRef.current = Date.now();
    setIsPaused(false);
    startTimer();
  }, [shouldAutoDismiss, startTimer]);

  // Initialize timer on mount
  useEffect(() => {
    if (shouldAutoDismiss && isVisible) {
      startTimer();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [shouldAutoDismiss, isVisible, startTimer]);

  // Keyboard event handling
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  if (!isVisible && !isExiting) {
    return null;
  }

  const toastClasses = [
    'toast-notification',
    `toast-${type}`,
    `toast-${animation}`,
    `toast-position-${position}`,
    isExiting && 'toast-exiting',
    isPaused && 'toast-paused',
    className
  ].filter(Boolean).join(' ');

  const displayIcon = icon || TOAST_ICONS[type];

  return (
    <div
      className={toastClasses}
      style={{ 
        maxWidth: `${maxWidth}px`,
        zIndex 
      }}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      onMouseEnter={pauseTimer}
      onMouseLeave={resumeTimer}
      onFocus={pauseTimer}
      onBlur={resumeTimer}
    >
      {showProgress && shouldAutoDismiss && (
        <div 
          className="toast-progress" 
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      )}

      <div className="toast-content">
        <div className="toast-header">
          {displayIcon && (
            <div className="toast-icon" aria-hidden="true">
              {typeof displayIcon === 'string' ? (
                <span className="toast-icon-text">{displayIcon}</span>
              ) : (
                displayIcon
              )}
            </div>
          )}
          
          <div className="toast-text">
            {title && (
              <h4 className="toast-title">{title}</h4>
            )}
            <p className="toast-message">{message}</p>
          </div>
          
          <button
            type="button"
            className="toast-close"
            onClick={handleClose}
            aria-label="Close notification"
            title="Close notification"
          >
            <span className="close-icon">✕</span>
          </button>
        </div>

        {actions.length > 0 && (
          <div className="toast-actions">
            {actions.map((action, index) => (
              <button
                key={index}
                type="button"
                className={`toast-action ${action.style || 'secondary'}`}
                onClick={() => handleAction(action)}
                disabled={action.disabled}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Toast Container Component
export const ToastContainer: React.FC<ToastContainerProps & {
  toasts: Array<ToastNotificationProps & { isVisible: boolean; timestamp: number }>;
  onRemoveToast: (id: string) => void;
}> = ({
  position = 'topRight',
  maxToasts = DEFAULT_MAX_TOASTS,
  animation = 'slide',
  className = '',
  toasts,
  onRemoveToast
}) => {
  const containerClasses = [
    'toast-container',
    `container-${position}`,
    className
  ].filter(Boolean).join(' ');

  // Limit the number of visible toasts
  const visibleToasts = toasts
    .sort((a, b) => b.timestamp - a.timestamp) // Latest first
    .slice(0, maxToasts);

  return (
    <div className={containerClasses}>
      {visibleToasts.map((toast, index) => (
        <ToastNotification
          key={toast.id}
          {...toast}
          position={position}
          animation={animation}
          onRemove={onRemoveToast}
          zIndex={1000 + visibleToasts.length - index}
        />
      ))}
    </div>
  );
};

// Toast Manager Hook
export const useToast = () => {
  const [toasts, setToasts] = useState<Array<ToastNotificationProps & { 
    isVisible: boolean; 
    timestamp: number;
  }>>([]);

  const addToast = useCallback((toast: Omit<ToastNotificationProps, 'id'> & { id?: string }) => {
    const id = toast.id || `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newToast = {
      ...toast,
      id,
      isVisible: true,
      timestamp: Date.now()
    };

    setToasts(prevToasts => [newToast, ...prevToasts]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prevToasts => 
      prevToasts.filter(toast => toast.id !== id)
    );
  }, []);

  const updateToast = useCallback((id: string, updates: Partial<ToastNotificationProps>) => {
    setToasts(prevToasts =>
      prevToasts.map(toast =>
        toast.id === id ? { ...toast, ...updates } : toast
      )
    );
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const showSuccess = useCallback((message: string, options?: Partial<ToastNotificationProps>) => {
    return addToast({ ...options, type: 'success', message });
  }, [addToast]);

  const showError = useCallback((message: string, options?: Partial<ToastNotificationProps>) => {
    return addToast({ ...options, type: 'error', message, duration: 0 }); // Errors don't auto-dismiss
  }, [addToast]);

  const showWarning = useCallback((message: string, options?: Partial<ToastNotificationProps>) => {
    return addToast({ ...options, type: 'warning', message });
  }, [addToast]);

  const showInfo = useCallback((message: string, options?: Partial<ToastNotificationProps>) => {
    return addToast({ ...options, type: 'info', message });
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    updateToast,
    clearToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};

// Preset toast configurations
export const ToastPresets = {
  success: {
    type: 'success' as ToastType,
    duration: 4000,
    showProgress: true
  },
  
  error: {
    type: 'error' as ToastType,
    duration: 0, // No auto-dismiss for errors
    persistent: true,
    showProgress: false
  },
  
  warning: {
    type: 'warning' as ToastType,
    duration: 6000,
    showProgress: true
  },
  
  info: {
    type: 'info' as ToastType,
    duration: 5000,
    showProgress: true
  },
  
  actionRequired: {
    type: 'warning' as ToastType,
    duration: 0,
    persistent: true,
    showProgress: false
  }
} as const;
