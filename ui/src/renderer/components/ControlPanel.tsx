/**
 * Control Panel Component for Point Shooting Animation System
 * 
 * Provides main animation control interface with:
 * - Animation start/pause/stop controls
 * - Parameter adjustment sliders
 * - Engine status display
 * - Configuration management
 */

import React from 'react';
import { ControlPanelProps } from '../../types/components';
import { EngineState } from '../../types/core';
import './ControlPanel.css';

/**
 * Control Panel Component
 * 
 * Main control interface for animation system with real-time status display
 * and parameter controls.
 */
export const ControlPanel: React.FC<ControlPanelProps> = ({
  engineStatus,
  animationConfig: _animationConfig,
  disabled = false,
  compact = false,
  onConfigChange: _onConfigChange,
  onStart,
  onPause,
  onResume,
  onStop,
  onSkip,
}) => {
  // Determine if controls should be disabled
  const isDisabled = disabled || engineStatus.status === EngineState.ERROR;

  // Determine current animation state
  const isRunning = engineStatus.status === EngineState.RUNNING;
  const isPaused = engineStatus.status === EngineState.PAUSED;

  return (
    <div className={`control-panel ${compact ? 'compact' : ''}`} data-testid="control-panel">
      {/* Animation Controls */}
      <div className="control-section">
        <h3>Animation Controls</h3>
        <div className="control-buttons">
          {!isRunning && !isPaused && (
            <button
              className="control-button play-button"
              onClick={() => onStart && onStart()}
              disabled={isDisabled}
              data-testid="play-button"
              aria-label="Start animation"
            >
              ▶ Play
            </button>
          )}
          
          {isRunning && (
            <button
              className="control-button pause-button"
              onClick={() => onPause && onPause()}
              disabled={isDisabled}
              data-testid="pause-button"
              aria-label="Pause animation"
            >
              ⏸ Pause
            </button>
          )}
          
          {isPaused && (
            <button
              className="control-button resume-button"
              onClick={() => onResume && onResume()}
              disabled={isDisabled}
              data-testid="resume-button"
              aria-label="Resume animation"
            >
              ▶ Resume
            </button>
          )}
          
          {(isRunning || isPaused) && (
            <button
              className="control-button stop-button"
              onClick={() => onStop && onStop()}
              disabled={isDisabled}
              data-testid="stop-button"
              aria-label="Stop animation"
            >
              ⏹ Stop
            </button>
          )}
          
          <button
            className="control-button skip-button"
            onClick={() => onSkip && onSkip()}
            disabled={isDisabled}
            data-testid="skip-button"
            aria-label="Skip to final formation"
          >
            ⏭ Skip
          </button>
        </div>
      </div>

      {/* Status Display */}
      <div className="control-section">
        <h3>Status</h3>
        <div className="status-display" data-testid="animation-status">
          <div className="status-item">
            <span className="status-label">Engine:</span>
            <span className={`status-value ${engineStatus.status.toLowerCase()}`}>
              {engineStatus.status.charAt(0).toUpperCase() + engineStatus.status.slice(1)}
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">FPS:</span>
            <span className="status-value">{engineStatus.fps || 0}</span>
          </div>
          <div className="status-item">
            <span className="status-label">Particles:</span>
            <span className="status-value">{engineStatus.particleCount || 0}</span>
          </div>
          <div className="status-item">
            <span className="status-label">Memory:</span>
            <span className="status-value">{Math.round((engineStatus.memoryUsage || 0) / 1024 / 1024)}MB</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="control-section">
        <h3>Progress</h3>
        <div className="progress-container" data-testid="progress-bar">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '0%' }}></div>
          </div>
          <span className="progress-text">0%</span>
        </div>
      </div>

      {/* Current Stage */}
      <div className="control-section">
        <h3>Current Stage</h3>
        <div className="stage-display" data-testid="current-stage">
          <span className="stage-name">{engineStatus.stage || 'Ready'}</span>
        </div>
      </div>
    </div>
  );
};
