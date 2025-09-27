/**
 * AnimationControls Component
 * 
 * Provides comprehensive animation control interface including:
 * - Play/Pause/Stop/Reset controls with keyboard shortcuts
 * - Timeline scrubbing with frame-accurate positioning
 * - Speed control with preset values and custom input
 * - Loop modes and playback direction controls
 * - Real-time performance metrics display
 * - Accessibility-focused design with screen reader support
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import './AnimationControls.css';

// Temporary type definitions - will be replaced with proper imports
interface AnimationState {
  isPlaying: boolean;
  isPaused: boolean;
  isStopped: boolean;
  currentFrame: number;
  totalFrames: number;
  currentTime: number; // in seconds
  duration: number; // in seconds
  speed: number; // multiplier (1.0 = normal speed)
  direction: 'forward' | 'reverse';
  loopMode: 'none' | 'loop' | 'bounce';
}

interface PerformanceMetrics {
  fps: number;
  frameTime: number; // in ms
  memoryUsage: number; // in MB
  particleCount: number;
}

interface AnimationControlsProps {
  animationState: AnimationState;
  performanceMetrics: PerformanceMetrics;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onReset: () => void;
  onSeek: (frame: number) => void;
  onSpeedChange: (speed: number) => void;
  onDirectionChange: (direction: 'forward' | 'reverse') => void;
  onLoopModeChange: (mode: 'none' | 'loop' | 'bounce') => void;
  disabled?: boolean;
  showPerformanceMetrics?: boolean;
  className?: string;
  'data-testid'?: string;
}

const SPEED_PRESETS = [
  { value: 0.25, label: '0.25x' },
  { value: 0.5, label: '0.5x' },
  { value: 0.75, label: '0.75x' },
  { value: 1.0, label: '1x' },
  { value: 1.25, label: '1.25x' },
  { value: 1.5, label: '1.5x' },
  { value: 2.0, label: '2x' },
  { value: 4.0, label: '4x' },
];

// Temporary hooks - will be replaced with proper implementations
const useLocalization = () => ({
  t: (key: string) => key,
  currentLocale: 'en'
});

export const AnimationControls: React.FC<AnimationControlsProps> = ({
  animationState,
  performanceMetrics,
  onPlay,
  onPause,
  onStop,
  onReset,
  onSeek,
  onSpeedChange,
  onDirectionChange,
  onLoopModeChange,
  disabled = false,
  showPerformanceMetrics = true,
  className = '',
  'data-testid': testId = 'animation-controls'
}) => {
  const { t } = useLocalization();
  const [isDraggingTimeline, setIsDraggingTimeline] = useState(false);
  const [showSpeedInput, setShowSpeedInput] = useState(false);
  const [customSpeed, setCustomSpeed] = useState(animationState.speed.toString());
  const timelineRef = useRef<HTMLDivElement>(null);
  const speedInputRef = useRef<HTMLInputElement>(null);

  // Update custom speed when animation speed changes externally
  useEffect(() => {
    if (!showSpeedInput) {
      setCustomSpeed(animationState.speed.toString());
    }
  }, [animationState.speed, showSpeedInput]);

  // Focus speed input when shown
  useEffect(() => {
    if (showSpeedInput && speedInputRef.current) {
      speedInputRef.current.focus();
      speedInputRef.current.select();
    }
  }, [showSpeedInput]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (disabled) return;

      // Only handle if not typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key) {
        case ' ':
        case 'k':
          event.preventDefault();
          if (animationState.isPlaying) {
            onPause();
          } else {
            onPlay();
          }
          break;
        case 'Escape':
          event.preventDefault();
          onStop();
          break;
        case 'r':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            onReset();
          }
          break;
        case 'ArrowLeft':
          if (event.shiftKey) {
            event.preventDefault();
            onSeek(Math.max(0, animationState.currentFrame - 10));
          } else {
            event.preventDefault();
            onSeek(Math.max(0, animationState.currentFrame - 1));
          }
          break;
        case 'ArrowRight':
          if (event.shiftKey) {
            event.preventDefault();
            onSeek(Math.min(animationState.totalFrames - 1, animationState.currentFrame + 10));
          } else {
            event.preventDefault();
            onSeek(Math.min(animationState.totalFrames - 1, animationState.currentFrame + 1));
          }
          break;
        case 'Home':
          event.preventDefault();
          onSeek(0);
          break;
        case 'End':
          event.preventDefault();
          onSeek(animationState.totalFrames - 1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [disabled, animationState, onPlay, onPause, onStop, onReset, onSeek]);

  // Handle timeline scrubbing
  const handleTimelineMouseDown = useCallback((event: React.MouseEvent) => {
    if (disabled || !timelineRef.current) return;

    setIsDraggingTimeline(true);
    
    const rect = timelineRef.current.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const frame = Math.floor(progress * animationState.totalFrames);
    
    onSeek(frame);
  }, [disabled, animationState.totalFrames, onSeek]);

  const handleTimelineMouseMove = useCallback((event: MouseEvent) => {
    if (!isDraggingTimeline || !timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const frame = Math.floor(progress * animationState.totalFrames);
    
    onSeek(frame);
  }, [isDraggingTimeline, animationState.totalFrames, onSeek]);

  const handleTimelineMouseUp = useCallback(() => {
    setIsDraggingTimeline(false);
  }, []);

  // Timeline mouse events
  useEffect(() => {
    if (isDraggingTimeline) {
      document.addEventListener('mousemove', handleTimelineMouseMove);
      document.addEventListener('mouseup', handleTimelineMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleTimelineMouseMove);
        document.removeEventListener('mouseup', handleTimelineMouseUp);
      };
    }
    
    return undefined;
  }, [isDraggingTimeline, handleTimelineMouseMove, handleTimelineMouseUp]);

  // Handle speed preset selection
  const handleSpeedPresetChange = useCallback((speed: number) => {
    onSpeedChange(speed);
    setShowSpeedInput(false);
  }, [onSpeedChange]);

  // Handle custom speed input
  const handleCustomSpeedSubmit = useCallback(() => {
    const speed = parseFloat(customSpeed);
    if (!isNaN(speed) && speed > 0 && speed <= 10) {
      onSpeedChange(speed);
    } else {
      setCustomSpeed(animationState.speed.toString());
    }
    setShowSpeedInput(false);
  }, [customSpeed, onSpeedChange, animationState.speed]);

  const handleCustomSpeedKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleCustomSpeedSubmit();
    } else if (event.key === 'Escape') {
      setCustomSpeed(animationState.speed.toString());
      setShowSpeedInput(false);
    }
  }, [handleCustomSpeedSubmit, animationState.speed]);

  // Format time for display
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }, []);

  // Get progress percentage
  const progressPercentage = animationState.totalFrames > 0 
    ? (animationState.currentFrame / animationState.totalFrames) * 100 
    : 0;

  return (
    <div 
      className={`animation-controls ${disabled ? 'disabled' : ''} ${className}`}
      data-testid={testId}
      role="toolbar"
      aria-label={t('animation_controls.toolbar_label')}
    >
      {/* Main Control Buttons */}
      <div className="main-controls" role="group" aria-label={t('animation_controls.playback_controls')}>
        <button
          type="button"
          className="control-button reset-button"
          onClick={onReset}
          disabled={disabled}
          title={`${t('animation_controls.reset')} (Ctrl+R)`}
          aria-label={t('animation_controls.reset')}
        >
          <span className="button-icon">⏮️</span>
        </button>

        <button
          type="button"
          className={`control-button play-pause-button ${animationState.isPlaying ? 'playing' : 'paused'}`}
          onClick={animationState.isPlaying ? onPause : onPlay}
          disabled={disabled}
          title={`${animationState.isPlaying ? t('animation_controls.pause') : t('animation_controls.play')} (Space)`}
          aria-label={animationState.isPlaying ? t('animation_controls.pause') : t('animation_controls.play')}
        >
          <span className="button-icon">
            {animationState.isPlaying ? '⏸️' : '▶️'}
          </span>
        </button>

        <button
          type="button"
          className="control-button stop-button"
          onClick={onStop}
          disabled={disabled}
          title={`${t('animation_controls.stop')} (Esc)`}
          aria-label={t('animation_controls.stop')}
        >
          <span className="button-icon">⏹️</span>
        </button>
      </div>

      {/* Timeline */}
      <div className="timeline-section">
        <div className="timeline-info">
          <span className="time-current">{formatTime(animationState.currentTime)}</span>
          <span className="frame-info">
            {animationState.currentFrame + 1} / {animationState.totalFrames}
          </span>
          <span className="time-total">{formatTime(animationState.duration)}</span>
        </div>

        <div 
          ref={timelineRef}
          className={`timeline ${isDraggingTimeline ? 'dragging' : ''}`}
          onMouseDown={handleTimelineMouseDown}
          role="slider"
          aria-label={t('animation_controls.timeline')}
          aria-valuemin={0}
          aria-valuemax={animationState.totalFrames - 1}
          aria-valuenow={animationState.currentFrame}
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') {
              e.preventDefault();
              onSeek(Math.max(0, animationState.currentFrame - 1));
            } else if (e.key === 'ArrowRight') {
              e.preventDefault();
              onSeek(Math.min(animationState.totalFrames - 1, animationState.currentFrame + 1));
            }
          }}
        >
          <div className="timeline-track">
            <div 
              className="timeline-progress"
              style={{ width: `${progressPercentage}%` }}
            />
            <div 
              className="timeline-thumb"
              style={{ left: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Secondary Controls */}
      <div className="secondary-controls">
        {/* Speed Control */}
        <div className="speed-control">
          <label className="control-label">{t('animation_controls.speed')}</label>
          <div className="speed-selector">
            {showSpeedInput ? (
              <input
                ref={speedInputRef}
                type="number"
                className="speed-input"
                value={customSpeed}
                onChange={(e) => setCustomSpeed(e.target.value)}
                onBlur={handleCustomSpeedSubmit}
                onKeyDown={handleCustomSpeedKeyDown}
                min="0.1"
                max="10"
                step="0.1"
                disabled={disabled}
              />
            ) : (
              <button
                type="button"
                className="speed-display"
                onClick={() => setShowSpeedInput(true)}
                disabled={disabled}
                title={t('animation_controls.click_to_edit_speed')}
              >
                {animationState.speed.toFixed(2)}x
              </button>
            )}
            
            <div className="speed-presets">
              {SPEED_PRESETS.map(preset => (
                <button
                  key={preset.value}
                  type="button"
                  className={`speed-preset ${animationState.speed === preset.value ? 'active' : ''}`}
                  onClick={() => handleSpeedPresetChange(preset.value)}
                  disabled={disabled}
                  title={`${t('animation_controls.speed')} ${preset.label}`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Direction Control */}
        <div className="direction-control">
          <label className="control-label">{t('animation_controls.direction')}</label>
          <div className="direction-buttons">
            <button
              type="button"
              className={`direction-button ${animationState.direction === 'forward' ? 'active' : ''}`}
              onClick={() => onDirectionChange('forward')}
              disabled={disabled}
              title={t('animation_controls.forward')}
              aria-label={t('animation_controls.forward')}
            >
              <span className="button-icon">⏩</span>
            </button>
            <button
              type="button"
              className={`direction-button ${animationState.direction === 'reverse' ? 'active' : ''}`}
              onClick={() => onDirectionChange('reverse')}
              disabled={disabled}
              title={t('animation_controls.reverse')}
              aria-label={t('animation_controls.reverse')}
            >
              <span className="button-icon">⏪</span>
            </button>
          </div>
        </div>

        {/* Loop Mode Control */}
        <div className="loop-control">
          <label className="control-label">{t('animation_controls.loop_mode')}</label>
          <select
            className="loop-select"
            value={animationState.loopMode}
            onChange={(e) => onLoopModeChange(e.target.value as 'none' | 'loop' | 'bounce')}
            disabled={disabled}
          >
            <option value="none">{t('animation_controls.no_loop')}</option>
            <option value="loop">{t('animation_controls.loop')}</option>
            <option value="bounce">{t('animation_controls.bounce')}</option>
          </select>
        </div>
      </div>

      {/* Performance Metrics */}
      {showPerformanceMetrics && (
        <div className="performance-metrics" role="region" aria-label={t('animation_controls.performance_metrics')}>
          <h4 className="metrics-title">{t('animation_controls.performance')}</h4>
          <div className="metrics-grid">
            <div className="metric-item">
              <span className="metric-label">{t('animation_controls.fps')}</span>
              <span className={`metric-value ${performanceMetrics.fps < 30 ? 'warning' : performanceMetrics.fps < 50 ? 'caution' : 'good'}`}>
                {performanceMetrics.fps.toFixed(1)}
              </span>
            </div>
            <div className="metric-item">
              <span className="metric-label">{t('animation_controls.frame_time')}</span>
              <span className={`metric-value ${performanceMetrics.frameTime > 33 ? 'warning' : performanceMetrics.frameTime > 20 ? 'caution' : 'good'}`}>
                {performanceMetrics.frameTime.toFixed(1)}ms
              </span>
            </div>
            <div className="metric-item">
              <span className="metric-label">{t('animation_controls.memory')}</span>
              <span className={`metric-value ${performanceMetrics.memoryUsage > 500 ? 'warning' : performanceMetrics.memoryUsage > 300 ? 'caution' : 'good'}`}>
                {performanceMetrics.memoryUsage.toFixed(1)}MB
              </span>
            </div>
            <div className="metric-item">
              <span className="metric-label">{t('animation_controls.particles')}</span>
              <span className="metric-value">
                {performanceMetrics.particleCount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnimationControls;
