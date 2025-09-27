/**
 * LoadingSpinner Component
 * 
 * Versatile loading spinner component with multiple animation styles and configurations:
 * - Multiple spinner types (spin, pulse, dots, bars, rings, wave)
 * - Size variants (small, medium, large, extra-large)
 * - Color themes and customization options
 * - Overlay modes for blocking interactions
 * - Accessibility support with screen reader announcements
 * - Performance optimized animations with reduced motion support
 * - Message display with progress indicators
 * 
 * Used throughout the application for loading states, async operations,
 * and providing visual feedback during long-running processes.
 */

import React, { useEffect, useState } from 'react';
import './LoadingSpinner.css';

export type SpinnerType = 'spin' | 'pulse' | 'dots' | 'bars' | 'rings' | 'wave' | 'bounce';
export type SpinnerSize = 'small' | 'medium' | 'large' | 'extra-large';
export type SpinnerColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'custom';

interface LoadingSpinnerProps {
  /** Type of spinner animation */
  type?: SpinnerType;
  /** Size of the spinner */
  size?: SpinnerSize;
  /** Color theme */
  color?: SpinnerColor;
  /** Custom color (used when color="custom") */
  customColor?: string;
  /** Loading message to display */
  message?: string;
  /** Whether to show overlay that blocks interaction */
  overlay?: boolean;
  /** Whether to center the spinner in its container */
  centered?: boolean;
  /** Whether to show progress indicator */
  showProgress?: boolean;
  /** Progress value (0-100) */
  progress?: number;
  /** Minimum display time in milliseconds */
  minDisplayTime?: number;
  /** Whether the spinner is visible */
  visible?: boolean;
  /** Custom class name */
  className?: string;
  /** Accessibility label */
  ariaLabel?: string;
  /** Callback when minimum display time is reached */
  onMinTimeReached?: () => void;
}

export const SPINNER_MESSAGES = {
  loading: 'Loading...',
  processing: 'Processing...',
  saving: 'Saving...',
  uploading: 'Uploading...',
  downloading: 'Downloading...',
  analyzing: 'Analyzing...',
  generating: 'Generating...',
  rendering: 'Rendering...'
} as const;

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  type = 'spin',
  size = 'medium',
  color = 'primary',
  customColor,
  message,
  overlay = false,
  centered = false,
  showProgress = false,
  progress = 0,
  minDisplayTime = 0,
  visible = true,
  className = '',
  ariaLabel,
  onMinTimeReached
}) => {
  const [isVisible, setIsVisible] = useState(visible);
  const [_minTimeComplete, setMinTimeComplete] = useState(minDisplayTime === 0);

  useEffect(() => {
    setIsVisible(visible);
  }, [visible]);

  useEffect(() => {
    if (minDisplayTime > 0 && visible) {
      setMinTimeComplete(false);
      const timer = setTimeout(() => {
        setMinTimeComplete(true);
        onMinTimeReached?.();
      }, minDisplayTime);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [minDisplayTime, visible, onMinTimeReached]);

  // Don't render anything if not visible
  if (!isVisible) {
    return null;
  }

  const spinnerClasses = [
    'loading-spinner',
    `spinner-${type}`,
    `spinner-${size}`,
    `spinner-${color}`,
    centered && 'spinner-centered',
    overlay && 'spinner-overlay',
    className
  ].filter(Boolean).join(' ');

  const spinnerStyle = color === 'custom' && customColor 
    ? { '--custom-spinner-color': customColor } as React.CSSProperties
    : {};

  const renderSpinnerElement = () => {
    switch (type) {
      case 'spin':
        return (
          <div className="spinner-element spin-spinner">
            <div className="spin-circle"></div>
          </div>
        );

      case 'pulse':
        return (
          <div className="spinner-element pulse-spinner">
            <div className="pulse-circle"></div>
          </div>
        );

      case 'dots':
        return (
          <div className="spinner-element dots-spinner">
            <div className="dot dot-1"></div>
            <div className="dot dot-2"></div>
            <div className="dot dot-3"></div>
          </div>
        );

      case 'bars':
        return (
          <div className="spinner-element bars-spinner">
            <div className="bar bar-1"></div>
            <div className="bar bar-2"></div>
            <div className="bar bar-3"></div>
            <div className="bar bar-4"></div>
            <div className="bar bar-5"></div>
          </div>
        );

      case 'rings':
        return (
          <div className="spinner-element rings-spinner">
            <div className="ring ring-1"></div>
            <div className="ring ring-2"></div>
            <div className="ring ring-3"></div>
          </div>
        );

      case 'wave':
        return (
          <div className="spinner-element wave-spinner">
            <div className="wave-bar wave-1"></div>
            <div className="wave-bar wave-2"></div>
            <div className="wave-bar wave-3"></div>
            <div className="wave-bar wave-4"></div>
            <div className="wave-bar wave-5"></div>
          </div>
        );

      case 'bounce':
        return (
          <div className="spinner-element bounce-spinner">
            <div className="bounce-ball bounce-1"></div>
            <div className="bounce-ball bounce-2"></div>
            <div className="bounce-ball bounce-3"></div>
          </div>
        );

      default:
        return (
          <div className="spinner-element spin-spinner">
            <div className="spin-circle"></div>
          </div>
        );
    }
  };

  const renderProgress = () => {
    if (!showProgress) return null;

    const progressPercentage = Math.max(0, Math.min(100, progress));

    return (
      <div className="spinner-progress">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="progress-text">
          {progressPercentage}%
        </div>
      </div>
    );
  };

  const renderContent = () => (
    <div className="spinner-content" style={spinnerStyle}>
      {renderSpinnerElement()}
      
      {message && (
        <div className="spinner-message">
          {message}
        </div>
      )}
      
      {renderProgress()}
    </div>
  );

  if (overlay) {
    return (
      <div 
        className={spinnerClasses}
        role="dialog"
        aria-modal="true"
        aria-labelledby="spinner-message"
        aria-describedby={showProgress ? "spinner-progress" : undefined}
      >
        <div className="spinner-overlay-backdrop" />
        <div className="spinner-overlay-content">
          {renderContent()}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={spinnerClasses}
      role="status"
      aria-label={ariaLabel || message || 'Loading'}
      aria-live="polite"
    >
      {renderContent()}
    </div>
  );
};

// Preset spinner configurations
export const SpinnerPresets = {
  pageLoading: {
    type: 'spin' as SpinnerType,
    size: 'large' as SpinnerSize,
    color: 'primary' as SpinnerColor,
    overlay: true,
    centered: true,
    message: 'Loading page...',
    minDisplayTime: 500
  },

  dataFetching: {
    type: 'dots' as SpinnerType,
    size: 'medium' as SpinnerSize,
    color: 'secondary' as SpinnerColor,
    message: 'Fetching data...'
  },

  fileUpload: {
    type: 'bars' as SpinnerType,
    size: 'medium' as SpinnerSize,
    color: 'info' as SpinnerColor,
    showProgress: true,
    message: 'Uploading file...'
  },

  processing: {
    type: 'rings' as SpinnerType,
    size: 'large' as SpinnerSize,
    color: 'warning' as SpinnerColor,
    overlay: true,
    centered: true,
    message: 'Processing...',
    minDisplayTime: 1000
  },

  saving: {
    type: 'pulse' as SpinnerType,
    size: 'small' as SpinnerSize,
    color: 'success' as SpinnerColor,
    message: 'Saving...'
  },

  inline: {
    type: 'spin' as SpinnerType,
    size: 'small' as SpinnerSize,
    color: 'primary' as SpinnerColor
  },

  button: {
    type: 'spin' as SpinnerType,
    size: 'small' as SpinnerSize,
    color: 'custom' as SpinnerColor,
    customColor: 'currentColor'
  }
} as const;

// Higher-order component for adding loading state
export const withLoadingSpinner = <P extends object>(
  Component: React.ComponentType<P>,
  spinnerProps?: Partial<LoadingSpinnerProps>
) => {
  const WrappedComponent = (props: P & { loading?: boolean }) => {
    const { loading, ...componentProps } = props;
    
    if (loading) {
      return <LoadingSpinner {...SpinnerPresets.pageLoading} {...spinnerProps} />;
    }
    
    return <Component {...componentProps as P} />;
  };

  WrappedComponent.displayName = `withLoadingSpinner(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Hook for managing loading state with minimum display time
export const useLoadingSpinner = (minDisplayTime: number = 500) => {
  const [isLoading, setIsLoading] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);

  const startLoading = () => {
    setIsLoading(true);
    setShouldShow(true);
  };

  const stopLoading = () => {
    setIsLoading(false);
  };

  const handleMinTimeReached = () => {
    if (!isLoading) {
      setShouldShow(false);
    }
  };

  return {
    isLoading,
    shouldShow,
    startLoading,
    stopLoading,
    spinnerProps: {
      visible: shouldShow,
      minDisplayTime,
      onMinTimeReached: handleMinTimeReached
    }
  };
};
