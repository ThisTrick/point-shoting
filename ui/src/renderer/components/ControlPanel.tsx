/**
 * Contrimport { EngineState, AnimationSpeed, ParticleDensity } from '../types/core';l Panel Component for Point Shooting Animation System
 * 
 * Provides main animation control interface with:
 * - Animation start/pause/stop controls
 * - Parameter adjustment sliders
 * - Engine status display
 * - Configuration management
 */

import React from 'react';
import { ControlPanelProps } from '../../types/components';
import { EngineState, AnimationSpeed, ParticleDensity } from '../../types/core';
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
          <button
            className="control-button play-button"
            onClick={() => onStart && onStart()}
            disabled={isDisabled || isRunning || isPaused}
            data-testid="play-button"
            aria-label="Start animation"
            role="button"
          >
            {compact ? '▶' : '▶ Play'}
          </button>
          
          <button
            className="control-button pause-button"
            onClick={() => onPause && onPause()}
            disabled={isDisabled || !isRunning}
            data-testid="pause-button"
            aria-label="Pause animation"
          >
            {compact ? '⏸' : '⏸ Pause'}
          </button>
          
          <button
            className="control-button resume-button"
            onClick={() => onResume && onResume()}
            disabled={isDisabled || !isPaused}
            data-testid="resume-button"
            aria-label="Resume animation"
          >
            {compact ? '⏯' : '▶ Resume'}
          </button>
          
          <button
            className="control-button stop-button"
            onClick={() => onStop && onStop()}
            disabled={isDisabled || (!isRunning && !isPaused)}
            data-testid="stop-button"
            aria-label="Stop animation"
          >
            {compact ? '⏹' : '⏹ Stop'}
          </button>
          
          <button
            className="control-button skip-button"
            onClick={() => onSkip && onSkip()}
            disabled={isDisabled}
            data-testid="skip-button"
            aria-label="Skip to final formation"
          >
            {compact ? '⏭' : '⏭ Skip'}
          </button>
        </div>
      </div>

      {/* Parameter Controls */}
      <div className="control-section">
        <h3>Animation Parameters</h3>
        <div className="parameters-section">
          <div className="parameter-group">
            <label htmlFor="speed-select" className="parameter-label">Speed:</label>
            <div className="parameter-controls-row">
              <select
                id="speed-select"
                className="parameter-select"
                value={_animationConfig.speed}
                onChange={(e) => _onConfigChange && _onConfigChange({ speed: e.target.value as AnimationSpeed })}
                disabled={isDisabled}
                data-testid="speed-select"
              >
                <option value={AnimationSpeed.SLOW}>Slow</option>
                <option value={AnimationSpeed.NORMAL}>Normal</option>
                <option value={AnimationSpeed.FAST}>Fast</option>
                <option value={AnimationSpeed.TURBO}>Turbo</option>
              </select>
              <span className="parameter-value">{_animationConfig.speed}</span>
            </div>
          </div>
          <div className="parameter-group">
            <label htmlFor="density-select" className="parameter-label">Density:</label>
            <div className="parameter-controls-row">
              <select
                id="density-select"
                className="parameter-select"
                value={_animationConfig.density}
                onChange={(e) => _onConfigChange && _onConfigChange({ density: e.target.value as ParticleDensity })}
                disabled={isDisabled}
                data-testid="density-select"
              >
                <option value={ParticleDensity.LOW}>Low</option>
                <option value={ParticleDensity.MEDIUM}>Medium</option>
                <option value={ParticleDensity.HIGH}>High</option>
                <option value={ParticleDensity.ULTRA}>Ultra</option>
              </select>
              <span className="parameter-value">{_animationConfig.density}</span>
            </div>
          </div>
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
          {engineStatus.fps !== undefined && (
            <div className="status-item">
              <span className="status-label">FPS:</span>
              <span className="status-value">{engineStatus.fps ? `${engineStatus.fps.toFixed(1)} FPS` : 'N/A'}</span>
            </div>
          )}
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
        <div className="progress-container" data-testid="progress-bar" role="progressbar" aria-label="Animation progress">
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

      {/* Configuration Display - only in non-compact mode */}
      {!compact && _animationConfig && (
        <div className="control-section">
          <h3>Configuration</h3>
          <div className="config-section" data-testid="config-display">
            <div className="config-item">
              <span className="config-label">transition</span>
              <span className="config-value">{_animationConfig.transitionStyle.toLowerCase()}</span>
            </div>
            <div className="config-item">
              <span className="config-label">color mode</span>
              <span className="config-value">{_animationConfig.colorMapping.toLowerCase()}</span>
            </div>
            <div className="config-item">
              <span className="config-label">effects</span>
              <span className="config-value">{_animationConfig.enableEffects ? 'On' : 'Off'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
