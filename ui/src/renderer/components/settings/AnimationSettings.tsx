/**
 * AnimationSettings Component for Point Shooting Animation System
 * 
 * Provides comprehensive animation configuration interface including:
 * - Speed and timing controls
 * - Particle density and behavior
 * - Visual effects and transitions
 * - Color mapping and appearance
 */

import React, { useCallback, useMemo } from 'react';
import { 
  AnimationConfig, 
  AnimationSpeed, 
  ParticleDensity, 
  TransitionStyle, 
  ColorMappingMode 
} from '../../../types/core';
import './AnimationSettings.css';

/**
 * AnimationSettings Component Props
 */
export interface AnimationSettingsProps {
  readonly config: AnimationConfig;
  readonly onChange: (config: Partial<AnimationConfig>) => void;
  readonly onReset?: () => void;
  readonly disabled?: boolean;
  readonly showAdvanced?: boolean;
}

/**
 * AnimationSettings Component
 * 
 * Provides organized settings panels for all animation configuration options.
 */
export const AnimationSettings: React.FC<AnimationSettingsProps> = ({
  config,
  onChange,
  onReset,
  disabled = false,
  showAdvanced = true,
}) => {
  // Handle individual setting changes
  const handleSettingChange = useCallback(<K extends keyof AnimationConfig>(
    key: K,
    value: AnimationConfig[K]
  ) => {
    onChange({ [key]: value });
  }, [onChange]);

  // Handle custom settings changes
  const handleCustomSettingChange = useCallback((
    key: string,
    value: any
  ) => {
    onChange({
      customSettings: {
        ...config.customSettings,
        [key]: value,
      },
    });
  }, [config.customSettings, onChange]);

  // Speed settings mapping for UI display
  const speedOptions = useMemo(() => [
    { value: AnimationSpeed.SLOW, label: 'Slow', description: 'Gentle, relaxed pace' },
    { value: AnimationSpeed.NORMAL, label: 'Normal', description: 'Standard animation speed' },
    { value: AnimationSpeed.FAST, label: 'Fast', description: 'Quick, energetic pace' },
    { value: AnimationSpeed.TURBO, label: 'Turbo', description: 'Maximum speed setting' },
  ], []);

  // Density options mapping
  const densityOptions = useMemo(() => [
    { value: ParticleDensity.LOW, label: 'Low', description: 'Fewer particles, better performance' },
    { value: ParticleDensity.MEDIUM, label: 'Medium', description: 'Balanced particle count' },
    { value: ParticleDensity.HIGH, label: 'High', description: 'More particles, detailed effect' },
    { value: ParticleDensity.ULTRA, label: 'Ultra', description: 'Maximum particles, may impact performance' },
  ], []);

  // Transition style options
  const transitionOptions = useMemo(() => [
    { value: TransitionStyle.SMOOTH, label: 'Smooth', description: 'Gradual, flowing transitions' },
    { value: TransitionStyle.BURST, label: 'Burst', description: 'Explosive, energetic transitions' },
    { value: TransitionStyle.WAVE, label: 'Wave', description: 'Wave-like motion patterns' },
    { value: TransitionStyle.SPIRAL, label: 'Spiral', description: 'Spiral motion effects' },
  ], []);

  // Color mapping options
  const colorOptions = useMemo(() => [
    { value: ColorMappingMode.ORIGINAL, label: 'Original', description: 'Keep original image colors' },
    { value: ColorMappingMode.ENHANCED, label: 'Enhanced', description: 'Boost color vibrancy' },
    { value: ColorMappingMode.ARTISTIC, label: 'Artistic', description: 'Artistic color interpretation' },
    { value: ColorMappingMode.MONOCHROME, label: 'Monochrome', description: 'Black and white effect' },
  ], []);

  return (
    <div className={`animation-settings ${disabled ? 'disabled' : ''}`}>
      <div className="settings-sections">
        {/* Core Animation Settings */}
        <section className="settings-section">
          <h3 className="section-title">Animation Behavior</h3>
          
          <div className="setting-row">
            <div className="setting-group">
              <label className="setting-label">Animation Speed</label>
              <select
                className="setting-select"
                value={config.speed}
                onChange={(e) => handleSettingChange('speed', e.target.value as AnimationSpeed)}
                disabled={disabled}
              >
                {speedOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="setting-description">
                {speedOptions.find(opt => opt.value === config.speed)?.description}
              </span>
            </div>

            <div className="setting-group">
              <label className="setting-label">Particle Density</label>
              <select
                className="setting-select"
                value={config.density}
                onChange={(e) => handleSettingChange('density', e.target.value as ParticleDensity)}
                disabled={disabled}
              >
                {densityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="setting-description">
                {densityOptions.find(opt => opt.value === config.density)?.description}
              </span>
            </div>
          </div>
        </section>

        {/* Visual Effects Settings */}
        <section className="settings-section">
          <h3 className="section-title">Visual Effects</h3>
          
          <div className="setting-row">
            <div className="setting-group">
              <label className="setting-label">Transition Style</label>
              <select
                className="setting-select"
                value={config.transitionStyle}
                onChange={(e) => handleSettingChange('transitionStyle', e.target.value as TransitionStyle)}
                disabled={disabled}
              >
                {transitionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="setting-description">
                {transitionOptions.find(opt => opt.value === config.transitionStyle)?.description}
              </span>
            </div>

            <div className="setting-group">
              <label className="setting-label">Color Mapping</label>
              <select
                className="setting-select"
                value={config.colorMapping}
                onChange={(e) => handleSettingChange('colorMapping', e.target.value as ColorMappingMode)}
                disabled={disabled}
              >
                {colorOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="setting-description">
                {colorOptions.find(opt => opt.value === config.colorMapping)?.description}
              </span>
            </div>
          </div>
        </section>

        {/* Effects Toggle Section */}
        <section className="settings-section">
          <h3 className="section-title">Effect Options</h3>
          
          <div className="toggle-group">
            <label className="setting-toggle">
              <input
                type="checkbox"
                checked={config.enableEffects}
                onChange={(e) => handleSettingChange('enableEffects', e.target.checked)}
                disabled={disabled}
              />
              <span className="toggle-switch"></span>
              <div className="toggle-content">
                <span className="toggle-label">Visual Effects</span>
                <span className="toggle-description">
                  Enable particle trails, glow effects, and other visual enhancements
                </span>
              </div>
            </label>

            <label className="setting-toggle">
              <input
                type="checkbox"
                checked={config.enableWatermark}
                onChange={(e) => handleSettingChange('enableWatermark', e.target.checked)}
                disabled={disabled}
              />
              <span className="toggle-switch"></span>
              <div className="toggle-content">
                <span className="toggle-label">Watermark</span>
                <span className="toggle-description">
                  Show application watermark on generated animations
                </span>
              </div>
            </label>
          </div>
        </section>

        {/* Advanced Settings */}
        {showAdvanced && config.customSettings && (
          <section className="settings-section advanced">
            <h3 className="section-title">Advanced Settings</h3>
            
            {/* Particle Size */}
            {typeof config.customSettings.particleSize === 'number' && (
              <div className="setting-group">
                <label className="setting-label">
                  Particle Size
                  <span className="setting-value">{config.customSettings.particleSize.toFixed(1)}</span>
                </label>
                <input
                  type="range"
                  className="setting-slider"
                  min="0.5"
                  max="5.0"
                  step="0.1"
                  value={config.customSettings.particleSize}
                  onChange={(e) => handleCustomSettingChange('particleSize', parseFloat(e.target.value))}
                  disabled={disabled}
                />
                <div className="slider-labels">
                  <span>Small</span>
                  <span>Large</span>
                </div>
              </div>
            )}

            {/* Gravity Effect */}
            {typeof config.customSettings.gravityEffect === 'number' && (
              <div className="setting-group">
                <label className="setting-label">
                  Gravity Effect
                  <span className="setting-value">{config.customSettings.gravityEffect.toFixed(1)}</span>
                </label>
                <input
                  type="range"
                  className="setting-slider"
                  min="0"
                  max="2"
                  step="0.1"
                  value={config.customSettings.gravityEffect}
                  onChange={(e) => handleCustomSettingChange('gravityEffect', parseFloat(e.target.value))}
                  disabled={disabled}
                />
                <div className="slider-labels">
                  <span>None</span>
                  <span>Strong</span>
                </div>
              </div>
            )}

            {/* Wind Effect */}
            {typeof config.customSettings.windEffect === 'number' && (
              <div className="setting-group">
                <label className="setting-label">
                  Wind Effect
                  <span className="setting-value">{config.customSettings.windEffect.toFixed(1)}</span>
                </label>
                <input
                  type="range"
                  className="setting-slider"
                  min="0"
                  max="2"
                  step="0.1"
                  value={config.customSettings.windEffect}
                  onChange={(e) => handleCustomSettingChange('windEffect', parseFloat(e.target.value))}
                  disabled={disabled}
                />
                <div className="slider-labels">
                  <span>Calm</span>
                  <span>Windy</span>
                </div>
              </div>
            )}

            {/* Trail Length */}
            {typeof config.customSettings.trailLength === 'number' && (
              <div className="setting-group">
                <label className="setting-label">
                  Trail Length
                  <span className="setting-value">{config.customSettings.trailLength}</span>
                </label>
                <input
                  type="range"
                  className="setting-slider"
                  min="0"
                  max="20"
                  step="1"
                  value={config.customSettings.trailLength}
                  onChange={(e) => handleCustomSettingChange('trailLength', parseInt(e.target.value))}
                  disabled={disabled}
                />
                <div className="slider-labels">
                  <span>No Trail</span>
                  <span>Long Trail</span>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Reset Section */}
        {onReset && (
          <section className="settings-section reset-section">
            <div className="reset-group">
              <div className="reset-info">
                <h4 className="reset-title">Reset Animation Settings</h4>
                <p className="reset-description">
                  Restore all animation settings to their default values. This cannot be undone.
                </p>
              </div>
              <button
                type="button"
                className="reset-button"
                onClick={onReset}
                disabled={disabled}
              >
                Reset to Defaults
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default AnimationSettings;
