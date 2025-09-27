/**
 * Control Panel Component for Point Shooting Animation System
 * 
 * Provides main animation control interface with:
 * - Animation start/pause/stop controls
 * - Parameter adjustment sliders
 * - Engine status display
 * - Configuration management
 */

import React, { useMemo, useCallback } from 'react';
import { ControlPanelProps } from '../../types/components';
import { EngineStatus, EngineState, ParticleDensity, AnimationSpeed } from '../../types/core';
import './ControlPanel.css';

/**
 * Control Panel Component
 * 
 * Main control interface for animation system with real-time status display
 * and parameter controls.
 */
export const ControlPanel: React.FC<ControlPanelProps> = ({
  engineStatus,
  animationConfig,
  disabled = false,
  compact = false,
  onConfigChange,
  onStart,
  onPause,
  onResume,
  onStop,
}) => {
  // Determine if controls should be disabled
  const isDisabled = useMemo(() => 
    disabled || engineStatus.status === EngineState.ERROR,
    [disabled, engineStatus]
  );

  // Determine current animation state
  const isRunning = useMemo(() => 
    engineStatus.status === EngineState.RUNNING,
    [engineStatus]
  );

  const isPaused = useMemo(() => 
    engineStatus.status === EngineState.PAUSED,
    [engineStatus]
  );

  const canStart = useMemo(() => 
    engineStatus.status === EngineState.STOPPED,
    [engineStatus]
  );

  // Handle parameter changes
  const handleSpeedChange = useCallback((speed: AnimationSpeed) => {
    onConfigChange({ speed });
  }, [onConfigChange]);

  const handleDensityChange = useCallback((density: ParticleDensity) => {
    onConfigChange({ density });
  }, [onConfigChange]);

  // Handle animation controls
  const handleStartClick = useCallback(() => {
    if (canStart) {
      onStart();
    }
  }, [canStart, onStart]);

  const handlePauseClick = useCallback(() => {
    if (isRunning) {
      onPause();
    } else if (isPaused) {
      onResume();
    }
  }, [isRunning, isPaused, onPause, onResume]);

  const handleStopClick = useCallback(() => {
    if (isRunning || isPaused) {
      onStop();
    }
  }, [isRunning, isPaused, onStop]);

  // Get status indicator class
  const getStatusClass = (state: EngineState): string => {
    switch (state) {
      case EngineState.RUNNING:
        return 'status-running';
      case EngineState.PAUSED:
        return 'status-paused';
      case EngineState.STOPPED:
        return 'status-stopped';
      case EngineState.STARTING:
        return 'status-starting';
      case EngineState.ERROR:
        return 'status-error';
      default:
        return 'status-unknown';
    }
  };

  // Get status text
  const getStatusText = (state: EngineState): string => {
    switch (state) {
      case EngineState.STOPPED:
        return 'Stopped';
      case EngineState.STARTING:
        return 'Starting...';
      case EngineState.RUNNING:
        return 'Running';
      case EngineState.PAUSED:
        return 'Paused';
      case EngineState.ERROR:
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className={`control-panel ${compact ? 'compact' : ''} ${isDisabled ? 'disabled' : ''}`}>
      {/* Status Display */}
      <div className="status-section">
        <div className={`status-indicator ${getStatusClass(engineStatus.status)}`}>
          <span className="status-dot"></span>
          <span className="status-text">{getStatusText(engineStatus.status)}</span>
          {engineStatus.fps && (
            <span className="status-fps">{engineStatus.fps.toFixed(1)} FPS</span>
          )}
        </div>
      </div>

      {/* Animation Controls */}
      <div className="controls-section">
        <div className="control-group animation-controls">
          <button
            type="button"
            className="control-button start"
            disabled={isDisabled || !canStart}
            onClick={handleStartClick}
            title="Start Animation"
          >
            <span className="button-icon">▶</span>
            {!compact && <span className="button-text">Start</span>}
          </button>

          <button
            type="button"
            className="control-button pause"
            disabled={isDisabled || (!isRunning && !isPaused)}
            onClick={handlePauseClick}
            title={isPaused ? "Resume Animation" : "Pause Animation"}
          >
            <span className="button-icon">{isPaused ? '▶' : '⏸'}</span>
            {!compact && <span className="button-text">{isPaused ? 'Resume' : 'Pause'}</span>}
          </button>

          <button
            type="button"
            className="control-button stop"
            disabled={isDisabled || (!isRunning && !isPaused)}
            onClick={handleStopClick}
            title="Stop Animation"
          >
            <span className="button-icon">⏹</span>
            {!compact && <span className="button-text">Stop</span>}
          </button>
        </div>
      </div>

      {/* Parameter Controls */}
      <div className="parameters-section">
        <div className="parameter-group">
          <label className="parameter-label">
            Speed
            <span className="parameter-value">{animationConfig.speed}</span>
          </label>
          <select
            className="parameter-select"
            value={animationConfig.speed}
            disabled={isDisabled}
            onChange={(e) => handleSpeedChange(e.target.value as AnimationSpeed)}
          >
            <option value={AnimationSpeed.SLOW}>Slow</option>
            <option value={AnimationSpeed.NORMAL}>Normal</option>
            <option value={AnimationSpeed.FAST}>Fast</option>
            <option value={AnimationSpeed.TURBO}>Turbo</option>
          </select>
        </div>

        <div className="parameter-group">
          <label className="parameter-label">
            Density
            <span className="parameter-value">{animationConfig.density}</span>
          </label>
          <select
            className="parameter-select"
            value={animationConfig.density}
            disabled={isDisabled}
            onChange={(e) => handleDensityChange(e.target.value as ParticleDensity)}
          >
            <option value={ParticleDensity.LOW}>Low</option>
            <option value={ParticleDensity.MEDIUM}>Medium</option>
            <option value={ParticleDensity.HIGH}>High</option>
            <option value={ParticleDensity.ULTRA}>Ultra</option>
          </select>
        </div>
      </div>

      {/* Additional Config Display */}
      {!compact && (
        <div className="config-section">
          <div className="config-item">
            <span className="config-label">Transition:</span>
            <span className="config-value">{animationConfig.transitionStyle}</span>
          </div>
          <div className="config-item">
            <span className="config-label">Color Mode:</span>
            <span className="config-value">{animationConfig.colorMapping}</span>
          </div>
          <div className="config-item">
            <span className="config-label">Effects:</span>
            <span className="config-value">{animationConfig.enableEffects ? 'On' : 'Off'}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ControlPanel;
