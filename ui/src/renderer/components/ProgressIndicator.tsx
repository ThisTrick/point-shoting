/**
 * ProgressIndicator Component for Point Shooting Animation System
 * 
 * Displays progress information for various operations including:
 * - Animation progress
 * - File loading progress  
 * - Engine operations progress
 * - Customizable progress visualization
 */

import React, { useMemo } from 'react';
import './ProgressIndicator.css';

/**
 * Progress types supported by the component
 */
export enum ProgressType {
  LINEAR = 'linear',
  CIRCULAR = 'circular',
  STEPPED = 'stepped',
  INDETERMINATE = 'indeterminate'
}

/**
 * Progress status for styling and behavior
 */
export enum ProgressStatus {
  IDLE = 'idle',
  ACTIVE = 'active', 
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning'
}

/**
 * ProgressIndicator Component Props
 */
export interface ProgressIndicatorProps {
  readonly value?: number; // 0-100 percentage
  readonly max?: number; // maximum value for calculations
  readonly type?: ProgressType;
  readonly status?: ProgressStatus;
  readonly size?: 'small' | 'medium' | 'large';
  readonly showLabel?: boolean;
  readonly showPercentage?: boolean;
  readonly label?: string;
  readonly description?: string;
  readonly animated?: boolean;
  readonly striped?: boolean;
  readonly thickness?: number;
  readonly color?: string;
  readonly backgroundColor?: string;
  readonly className?: string;
}

/**
 * ProgressIndicator Component
 * 
 * Flexible progress indicator supporting multiple visualization types and states.
 */
export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  value = 0,
  max = 100,
  type = ProgressType.LINEAR,
  status = ProgressStatus.ACTIVE,
  size = 'medium',
  showLabel = true,
  showPercentage = true,
  label,
  description,
  animated = true,
  striped = false,
  thickness,
  color,
  backgroundColor,
  className = '',
}) => {
  // Calculate percentage
  const percentage = useMemo(() => {
    if (type === ProgressType.INDETERMINATE) return 0;
    return Math.max(0, Math.min(100, (value / max) * 100));
  }, [value, max, type]);

  // Get size-based dimensions
  const dimensions = useMemo(() => {
    switch (size) {
      case 'small':
        return {
          height: type === ProgressType.CIRCULAR ? 24 : 4,
          fontSize: '0.75rem',
          circleSize: 24,
          strokeWidth: thickness || 2,
        };
      case 'large':
        return {
          height: type === ProgressType.CIRCULAR ? 64 : 12,
          fontSize: '1rem',
          circleSize: 64,
          strokeWidth: thickness || 6,
        };
      default: // medium
        return {
          height: type === ProgressType.CIRCULAR ? 40 : 8,
          fontSize: '0.875rem',
          circleSize: 40,
          strokeWidth: thickness || 4,
        };
    }
  }, [size, type, thickness]);

  // Get status class
  const getStatusClass = (): string => {
    return `progress-${status}`;
  };

  // Render circular progress
  const renderCircularProgress = () => {
    const { circleSize, strokeWidth } = dimensions;
    const radius = (circleSize - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = type === ProgressType.INDETERMINATE 
      ? 0 
      : circumference - (percentage / 100) * circumference;

    return (
      <div className="circular-progress-container">
        <svg
          className="circular-progress"
          width={circleSize}
          height={circleSize}
        >
          {/* Background circle */}
          <circle
            className="circular-background"
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={radius}
            strokeWidth={strokeWidth}
            style={{
              stroke: backgroundColor || 'var(--bg-tertiary)',
            }}
          />
          
          {/* Progress circle */}
          <circle
            className={`circular-foreground ${animated ? 'animated' : ''} ${
              type === ProgressType.INDETERMINATE ? 'indeterminate' : ''
            }`}
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              stroke: color || 'var(--accent-color)',
            }}
          />
        </svg>

        {/* Center text */}
        {(showPercentage || label) && (
          <div className="circular-text">
            {showPercentage && type !== ProgressType.INDETERMINATE && (
              <span className="percentage">{Math.round(percentage)}%</span>
            )}
            {label && (
              <span className="label" style={{ fontSize: dimensions.fontSize }}>
                {label}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render stepped progress
  const renderSteppedProgress = () => {
    const steps = Math.ceil(max / 10); // Create 10 steps by default
    const activeSteps = Math.floor((percentage / 100) * steps);

    return (
      <div className="stepped-progress">
        {Array.from({ length: steps }).map((_, index) => (
          <div
            key={index}
            className={`step ${index < activeSteps ? 'active' : ''} ${
              index === activeSteps - 1 ? 'current' : ''
            }`}
            style={{
              backgroundColor: index < activeSteps 
                ? (color || 'var(--accent-color)') 
                : (backgroundColor || 'var(--bg-tertiary)'),
            }}
          />
        ))}
      </div>
    );
  };

  // Render linear progress
  const renderLinearProgress = () => {
    return (
      <div 
        className="linear-progress-track"
        style={{
          height: dimensions.height,
          backgroundColor: backgroundColor || 'var(--bg-tertiary)',
        }}
      >
        <div
          className={`linear-progress-fill ${animated ? 'animated' : ''} ${
            striped ? 'striped' : ''
          } ${type === ProgressType.INDETERMINATE ? 'indeterminate' : ''}`}
          style={{
            width: type === ProgressType.INDETERMINATE ? '100%' : `${percentage}%`,
            backgroundColor: color || 'var(--accent-color)',
          }}
        />
      </div>
    );
  };

  // Render progress content
  const renderProgressContent = () => {
    switch (type) {
      case ProgressType.CIRCULAR:
        return renderCircularProgress();
      case ProgressType.STEPPED:
        return renderSteppedProgress();
      default:
        return renderLinearProgress();
    }
  };

  return (
    <div className={`progress-indicator ${getStatusClass()} ${className}`}>
      {/* Header */}
      {(showLabel && label) && (
        <div className="progress-header">
          <span 
            className="progress-label"
            style={{ fontSize: dimensions.fontSize }}
          >
            {label}
          </span>
          {showPercentage && type !== ProgressType.INDETERMINATE && (
            <span 
              className="progress-percentage"
              style={{ fontSize: dimensions.fontSize }}
            >
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}

      {/* Progress Content */}
      <div className="progress-content">
        {renderProgressContent()}
      </div>

      {/* Description */}
      {description && (
        <div 
          className="progress-description"
          style={{ fontSize: `calc(${dimensions.fontSize} * 0.85)` }}
        >
          {description}
        </div>
      )}
    </div>
  );
};

export default ProgressIndicator;
