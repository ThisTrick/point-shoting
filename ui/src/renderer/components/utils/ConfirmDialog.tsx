/**
 * ConfirmDialog Component
 * 
 * Flexible confirmation dialog component with:
 * - Customizable messages and titles
 * - Multiple action button configurations
 * - Different dialog types (confirm, alert, prompt)
 * - Dangerous action warnings with visual emphasis
 * - Input validation for prompt dialogs
 * - Backdrop click and ESC key handling
 * - Accessibility support with focus management
 * - Animation system with enter/exit transitions
 * - Icon support for different dialog types
 * - Promise-based API for easy integration
 * 
 * Used for destructive actions, settings changes,
 * user confirmations, and input collection.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import './ConfirmDialog.css';

export type DialogType = 'confirm' | 'alert' | 'prompt' | 'danger';
export type DialogSize = 'small' | 'medium' | 'large';

export interface DialogAction {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  onClick?: () => void | Promise<void>;
  autoFocus?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

export interface ConfirmDialogProps {
  isOpen: boolean;
  type?: DialogType;
  size?: DialogSize;
  title?: string;
  message: string;
  description?: string;
  icon?: React.ReactNode | string;
  actions?: DialogAction[];
  
  // Prompt-specific props
  inputLabel?: string;
  inputValue?: string;
  inputPlaceholder?: string;
  inputType?: 'text' | 'email' | 'password' | 'number';
  inputValidator?: (value: string) => string | null; // Return error message or null
  
  // Behavior props
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  persistent?: boolean; // Prevents closing until action is taken
  
  // Callbacks
  onClose?: () => void;
  onConfirm?: (value?: string) => void | Promise<void>;
  onCancel?: () => void;
  
  // Styling
  className?: string;
  backdropClassName?: string;
}

interface UseConfirmDialogOptions extends Omit<ConfirmDialogProps, 'isOpen' | 'onClose'> {
  confirmLabel?: string;
  cancelLabel?: string;
}

const DEFAULT_ICONS = {
  confirm: '❓',
  alert: 'ℹ️',
  prompt: '✏️',
  danger: '⚠️'
} as const;

const DEFAULT_ACTIONS = {
  confirm: [
    { label: 'Cancel', variant: 'secondary' as const },
    { label: 'Confirm', variant: 'primary' as const, autoFocus: true }
  ],
  alert: [
    { label: 'OK', variant: 'primary' as const, autoFocus: true }
  ],
  prompt: [
    { label: 'Cancel', variant: 'secondary' as const },
    { label: 'OK', variant: 'primary' as const, autoFocus: true }
  ],
  danger: [
    { label: 'Cancel', variant: 'secondary' as const, autoFocus: true },
    { label: 'Delete', variant: 'danger' as const }
  ]
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  type = 'confirm',
  size = 'medium',
  title,
  message,
  description,
  icon,
  actions,
  inputLabel,
  inputValue = '',
  inputPlaceholder,
  inputType = 'text',
  inputValidator,
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
  persistent = false,
  onClose,
  onConfirm,
  onCancel,
  className = '',
  backdropClassName = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [inputVal, setInputVal] = useState(inputValue);
  const [inputError, setInputError] = useState<string | null>(null);
  const [actionStates, setActionStates] = useState<Record<string, boolean>>({});
  
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const handleClose = useCallback(() => {
    if (persistent) return;
    
    onClose?.();
  }, [onClose, persistent]);

  const handleBackdropClick = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget && closeOnBackdrop) {
      handleClose();
    }
  }, [closeOnBackdrop, handleClose]);

  const handleConfirm = useCallback(async () => {
    if (type === 'prompt') {
      if (inputValidator) {
        const error = inputValidator(inputVal);
        if (error) {
          setInputError(error);
          return;
        }
      }
      await onConfirm?.(inputVal);
    } else {
      await onConfirm?.();
    }
  }, [type, inputVal, inputValidator, onConfirm]);

  const handleCancel = useCallback(() => {
    onCancel?.();
    handleClose();
  }, [onCancel, handleClose]);

  const handleAction = useCallback(async (action: DialogAction | { label: string; variant?: string; autoFocus?: boolean }, index: number) => {
    if ('disabled' in action && action.disabled) return;

    const actionKey = `action_${index}`;
    setActionStates(prev => ({ ...prev, [actionKey]: true }));

    try {
      if ('onClick' in action && action.onClick) {
        await action.onClick();
      } else {
        // Default behavior based on action label
        const label = action.label.toLowerCase();
        if (label.includes('cancel') || label.includes('no')) {
          handleCancel();
        } else {
          await handleConfirm();
        }
      }
    } finally {
      setActionStates(prev => ({ ...prev, [actionKey]: false }));
    }
  }, [handleConfirm, handleCancel]);

  // Store previous focus for restoration
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }
  }, [isOpen]);

  // Handle visibility state
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsExiting(false);
    } else if (isVisible) {
      setIsExiting(true);
      setTimeout(() => {
        setIsVisible(false);
        setIsExiting(false);
        // Restore focus
        if (previousFocusRef.current) {
          previousFocusRef.current.focus();
        }
      }, 200);
    }
  }, [isOpen, isVisible]);

  // Focus management
  useEffect(() => {
    if (isVisible && !isExiting) {
      const focusableElements = dialogRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (type === 'prompt' && inputRef.current) {
        inputRef.current.focus();
      } else if (focusableElements?.length) {
        const autoFocusElement = Array.from(focusableElements).find(el => 
          (el as HTMLElement).dataset.autoFocus === 'true'
        );
        if (autoFocusElement) {
          (autoFocusElement as HTMLElement).focus();
        } else {
          (focusableElements[0] as HTMLElement).focus();
        }
      }
    }
  }, [isVisible, isExiting, type]);

  // Input validation
  useEffect(() => {
    if (type === 'prompt' && inputValidator) {
      const error = inputValidator(inputVal);
      setInputError(error);
    }
  }, [inputVal, inputValidator, type]);

  // Keyboard event handling
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isExiting) return;

      if (event.key === 'Escape' && closeOnEscape && !persistent) {
        event.preventDefault();
        handleClose();
      }

      if (event.key === 'Enter' && !event.shiftKey) {
        // Submit on Enter if not in textarea or if input is valid
        const target = event.target as HTMLElement;
        if (target.tagName !== 'TEXTAREA') {
          event.preventDefault();
          handleConfirm();
        }
      }

      // Tab trap
      if (event.key === 'Tab') {
        const focusableElements = dialogRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements?.length) {
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
          
          if (event.shiftKey && document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          } else if (!event.shiftKey && document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, isExiting, closeOnEscape, persistent, handleClose, handleConfirm]);

  if (!isVisible) {
    return null;
  }

  const dialogClasses = [
    'confirm-dialog',
    `dialog-${type}`,
    `dialog-${size}`,
    isExiting && 'dialog-exiting',
    className
  ].filter(Boolean).join(' ');

  const backdropClasses = [
    'dialog-backdrop',
    isExiting && 'backdrop-exiting',
    backdropClassName
  ].filter(Boolean).join(' ');

  const displayIcon = icon ?? DEFAULT_ICONS[type];
  const dialogActions = actions ?? DEFAULT_ACTIONS[type];

  return (
    <div 
      className={backdropClasses}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "dialog-title" : undefined}
      aria-describedby="dialog-message"
    >
      <div 
        ref={dialogRef}
        className={dialogClasses}
        onClick={(e) => e.stopPropagation()}
      >
        {showCloseButton && !persistent && (
          <button
            type="button"
            className="dialog-close"
            onClick={handleClose}
            aria-label="Close dialog"
          >
            <span className="close-icon">✕</span>
          </button>
        )}

        <div className="dialog-content">
          <div className="dialog-header">
            {displayIcon && (
              <div className="dialog-icon" aria-hidden="true">
                {typeof displayIcon === 'string' ? (
                  <span className="icon-text">{displayIcon}</span>
                ) : (
                  displayIcon
                )}
              </div>
            )}

            <div className="dialog-text">
              {title && (
                <h2 id="dialog-title" className="dialog-title">
                  {title}
                </h2>
              )}
              
              <p id="dialog-message" className="dialog-message">
                {message}
              </p>
              
              {description && (
                <p className="dialog-description">
                  {description}
                </p>
              )}
            </div>
          </div>

          {type === 'prompt' && (
            <div className="dialog-input-section">
              {inputLabel && (
                <label htmlFor="dialog-input" className="input-label">
                  {inputLabel}
                </label>
              )}
              
              <input
                ref={inputRef}
                id="dialog-input"
                type={inputType}
                value={inputVal}
                placeholder={inputPlaceholder}
                onChange={(e) => setInputVal(e.target.value)}
                className={`dialog-input ${inputError ? 'input-error' : ''}`}
                aria-describedby={inputError ? "input-error" : undefined}
              />
              
              {inputError && (
                <div id="input-error" className="input-error-message" role="alert">
                  {inputError}
                </div>
              )}
            </div>
          )}

          <div className="dialog-actions">
            {dialogActions.map((action, index) => {
              const isDisabled = ('disabled' in action && action.disabled) || 
                               actionStates[`action_${index}`] || 
                               (type === 'prompt' && !!inputError);
              
              return (
                <button
                  key={index}
                  type="button"
                  className={`dialog-action dialog-action-${action.variant || 'secondary'}`}
                  onClick={() => handleAction(action, index)}
                  disabled={isDisabled}
                  data-auto-focus={('autoFocus' in action && action.autoFocus) ? 'true' : 'false'}
                >
                  {actionStates[`action_${index}`] && (
                    <span className="action-spinner" aria-hidden="true">⏳</span>
                  )}
                  <span className="action-text">{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook for programmatic dialog usage
export const useConfirmDialog = () => {
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    props: ConfirmDialogProps;
    resolve?: (result: boolean | string | null) => void;
  }>({
    isOpen: false,
    props: { isOpen: false, message: '' }
  });

  const showDialog = useCallback((props: UseConfirmDialogOptions): Promise<boolean | string | null> => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        props: {
          ...props,
          isOpen: true,
          onClose: () => {
            setDialogState(prev => ({ ...prev, isOpen: false }));
            resolve(null);
          },
          onConfirm: async (value?: string) => {
            await props.onConfirm?.(value);
            setDialogState(prev => ({ ...prev, isOpen: false }));
            resolve(props.type === 'prompt' ? value || '' : true);
          },
          onCancel: () => {
            props.onCancel?.();
            setDialogState(prev => ({ ...prev, isOpen: false }));
            resolve(false);
          }
        },
        resolve
      });
    });
  }, []);

  const confirm = useCallback((message: string, options?: Partial<UseConfirmDialogOptions>) => {
    return showDialog({
      type: 'confirm',
      message,
      ...options
    });
  }, [showDialog]);

  const alert = useCallback((message: string, options?: Partial<UseConfirmDialogOptions>) => {
    return showDialog({
      type: 'alert',
      message,
      ...options
    });
  }, [showDialog]);

  const prompt = useCallback((message: string, defaultValue?: string, options?: Partial<UseConfirmDialogOptions>) => {
    return showDialog({
      type: 'prompt',
      message,
      inputValue: defaultValue,
      ...options
    });
  }, [showDialog]);

  const danger = useCallback((message: string, options?: Partial<UseConfirmDialogOptions>) => {
    return showDialog({
      type: 'danger',
      message,
      ...options
    });
  }, [showDialog]);

  const Dialog = useCallback(() => {
    if (!dialogState.isOpen) return null;
    return <ConfirmDialog {...dialogState.props} />;
  }, [dialogState]);

  return {
    Dialog,
    confirm,
    alert,
    prompt,
    danger,
    showDialog
  };
};
