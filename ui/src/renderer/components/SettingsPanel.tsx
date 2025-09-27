/**
 * SettingsPanel Component for Point Shooting Animation System
 * 
 * Provides comprehensive settings interface including:
 * - UI appearance and behavior settings
 * - Animation configuration options
 * - Import/Export functionality
 * - Settings reset capabilities
 */

import React, { useState, useCallback, useMemo } from 'react';
import { SettingsPanelProps } from '../../types/components';
import { 
  UITheme, 
  AnimationSpeed, 
  ParticleDensity, 
  TransitionStyle, 
  ColorMappingMode 
} from '../../types/core';
import './SettingsPanel.css';

/**
 * Settings categories for organization
 */
enum SettingsCategory {
  UI = 'ui',
  ANIMATION = 'animation',
  ADVANCED = 'advanced'
}

/**
 * SettingsPanel Component
 * 
 * Modal-style settings panel with tabbed interface for different setting categories.
 */
export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  uiSettings,
  animationConfig,
  isVisible,
  onUISettingsChange,
  onAnimationConfigChange,
  onClose,
  onReset,
  onExport,
  onImport,
}) => {
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>(SettingsCategory.UI);
  const [importText, setImportText] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Handle category change
  const handleCategoryChange = useCallback((category: SettingsCategory) => {
    setActiveCategory(category);
  }, []);

  // Handle UI settings changes
  const handleUISettingChange = useCallback(<K extends keyof typeof uiSettings>(
    key: K,
    value: typeof uiSettings[K]
  ) => {
    onUISettingsChange({ [key]: value });
  }, [onUISettingsChange]);

  // Handle animation config changes
  const handleAnimationConfigChange = useCallback(<K extends keyof typeof animationConfig>(
    key: K,
    value: typeof animationConfig[K]
  ) => {
    onAnimationConfigChange({ [key]: value });
  }, [onAnimationConfigChange]);

  // Handle import
  const handleImport = useCallback(() => {
    if (importText.trim()) {
      try {
        onImport(importText);
        setImportText('');
        setShowImportDialog(false);
      } catch (error) {
        // Handle import error
        console.error('Import failed:', error);
      }
    }
  }, [importText, onImport]);

  // Get category tabs
  const categoryTabs = useMemo(() => [
    { id: SettingsCategory.UI, label: 'Interface', icon: '🎨' },
    { id: SettingsCategory.ANIMATION, label: 'Animation', icon: '⚡' },
    { id: SettingsCategory.ADVANCED, label: 'Advanced', icon: '⚙️' },
  ], []);

  // Render UI Settings
  const renderUISettings = () => (
    <div className="settings-section">
      <div className="setting-group">
        <label className="setting-label">Theme</label>
        <select
          className="setting-select"
          value={uiSettings.theme}
          onChange={(e) => handleUISettingChange('theme', e.target.value as UITheme)}
        >
          <option value={UITheme.LIGHT}>Light</option>
          <option value={UITheme.DARK}>Dark</option>
          <option value={UITheme.AUTO}>Auto</option>
        </select>
      </div>

      <div className="setting-group">
        <label className="setting-label">Language</label>
        <select
          className="setting-select"
          value={uiSettings.language}
          onChange={(e) => handleUISettingChange('language', e.target.value)}
        >
          <option value="en">English</option>
          <option value="uk">Українська</option>
        </select>
      </div>

      <div className="setting-group">
        <label className="setting-checkbox">
          <input
            type="checkbox"
            checked={uiSettings.showAdvancedControls}
            onChange={(e) => handleUISettingChange('showAdvancedControls', e.target.checked)}
          />
          <span className="checkmark"></span>
          Show Advanced Controls
        </label>
      </div>

      <div className="setting-group">
        <label className="setting-checkbox">
          <input
            type="checkbox"
            checked={uiSettings.enableKeyboardShortcuts}
            onChange={(e) => handleUISettingChange('enableKeyboardShortcuts', e.target.checked)}
          />
          <span className="checkmark"></span>
          Enable Keyboard Shortcuts
        </label>
      </div>

      <div className="setting-group">
        <label className="setting-checkbox">
          <input
            type="checkbox"
            checked={uiSettings.autoSaveSettings}
            onChange={(e) => handleUISettingChange('autoSaveSettings', e.target.checked)}
          />
          <span className="checkmark"></span>
          Auto-save Settings
        </label>
      </div>

      {/* Accessibility Settings */}
      {uiSettings.accessibility && (
        <div className="setting-subgroup">
          <h4 className="subgroup-title">Accessibility</h4>
          
          <div className="setting-group">
            <label className="setting-checkbox">
              <input
                type="checkbox"
                checked={uiSettings.accessibility.highContrast}
                onChange={(e) => handleUISettingChange('accessibility', {
                  highContrast: e.target.checked,
                  reducedMotion: uiSettings.accessibility?.reducedMotion || false,
                  largeText: uiSettings.accessibility?.largeText || false,
                  screenReaderOptimizations: uiSettings.accessibility?.screenReaderOptimizations || false,
                })}
              />
              <span className="checkmark"></span>
              High Contrast Mode
            </label>
          </div>

          <div className="setting-group">
            <label className="setting-checkbox">
              <input
                type="checkbox"
                checked={uiSettings.accessibility.reducedMotion}
                onChange={(e) => handleUISettingChange('accessibility', {
                  highContrast: uiSettings.accessibility?.highContrast || false,
                  reducedMotion: e.target.checked,
                  largeText: uiSettings.accessibility?.largeText || false,
                  screenReaderOptimizations: uiSettings.accessibility?.screenReaderOptimizations || false,
                })}
              />
              <span className="checkmark"></span>
              Reduce Motion
            </label>
          </div>

          <div className="setting-group">
            <label className="setting-checkbox">
              <input
                type="checkbox"
                checked={uiSettings.accessibility.largeText}
                onChange={(e) => handleUISettingChange('accessibility', {
                  highContrast: uiSettings.accessibility?.highContrast || false,
                  reducedMotion: uiSettings.accessibility?.reducedMotion || false,
                  largeText: e.target.checked,
                  screenReaderOptimizations: uiSettings.accessibility?.screenReaderOptimizations || false,
                })}
              />
              <span className="checkmark"></span>
              Large Text
            </label>
          </div>
        </div>
      )}
    </div>
  );

  // Render Animation Settings
  const renderAnimationSettings = () => (
    <div className="settings-section">
      <div className="setting-group">
        <label className="setting-label">Animation Speed</label>
        <select
          className="setting-select"
          value={animationConfig.speed}
          onChange={(e) => handleAnimationConfigChange('speed', e.target.value as AnimationSpeed)}
        >
          <option value={AnimationSpeed.SLOW}>Slow</option>
          <option value={AnimationSpeed.NORMAL}>Normal</option>
          <option value={AnimationSpeed.FAST}>Fast</option>
          <option value={AnimationSpeed.TURBO}>Turbo</option>
        </select>
      </div>

      <div className="setting-group">
        <label className="setting-label">Particle Density</label>
        <select
          className="setting-select"
          value={animationConfig.density}
          onChange={(e) => handleAnimationConfigChange('density', e.target.value as ParticleDensity)}
        >
          <option value={ParticleDensity.LOW}>Low</option>
          <option value={ParticleDensity.MEDIUM}>Medium</option>
          <option value={ParticleDensity.HIGH}>High</option>
          <option value={ParticleDensity.ULTRA}>Ultra</option>
        </select>
      </div>

      <div className="setting-group">
        <label className="setting-label">Transition Style</label>
        <select
          className="setting-select"
          value={animationConfig.transitionStyle}
          onChange={(e) => handleAnimationConfigChange('transitionStyle', e.target.value as TransitionStyle)}
        >
          <option value={TransitionStyle.SMOOTH}>Smooth</option>
          <option value={TransitionStyle.BURST}>Burst</option>
          <option value={TransitionStyle.WAVE}>Wave</option>
          <option value={TransitionStyle.SPIRAL}>Spiral</option>
        </select>
      </div>

      <div className="setting-group">
        <label className="setting-label">Color Mapping</label>
        <select
          className="setting-select"
          value={animationConfig.colorMapping}
          onChange={(e) => handleAnimationConfigChange('colorMapping', e.target.value as ColorMappingMode)}
        >
          <option value={ColorMappingMode.ORIGINAL}>Original</option>
          <option value={ColorMappingMode.ENHANCED}>Enhanced</option>
          <option value={ColorMappingMode.ARTISTIC}>Artistic</option>
          <option value={ColorMappingMode.MONOCHROME}>Monochrome</option>
        </select>
      </div>

      <div className="setting-group">
        <label className="setting-checkbox">
          <input
            type="checkbox"
            checked={animationConfig.enableEffects}
            onChange={(e) => handleAnimationConfigChange('enableEffects', e.target.checked)}
          />
          <span className="checkmark"></span>
          Enable Visual Effects
        </label>
      </div>

      <div className="setting-group">
        <label className="setting-checkbox">
          <input
            type="checkbox"
            checked={animationConfig.enableWatermark}
            onChange={(e) => handleAnimationConfigChange('enableWatermark', e.target.checked)}
          />
          <span className="checkmark"></span>
          Enable Watermark
        </label>
      </div>
    </div>
  );

  // Render Advanced Settings
  const renderAdvancedSettings = () => (
    <div className="settings-section">
      <div className="setting-group">
        <label className="setting-label">Import/Export</label>
        <div className="button-group">
          <button
            type="button"
            className="setting-button secondary"
            onClick={() => setShowImportDialog(true)}
          >
            Import Settings
          </button>
          <button
            type="button"
            className="setting-button secondary"
            onClick={() => onExport()}
          >
            Export Settings
          </button>
        </div>
      </div>

      <div className="setting-group">
        <label className="setting-label">Reset Settings</label>
        <div className="button-group">
          <button
            type="button"
            className="setting-button warning"
            onClick={() => onReset('ui')}
          >
            Reset UI
          </button>
          <button
            type="button"
            className="setting-button warning"
            onClick={() => onReset('animation')}
          >
            Reset Animation
          </button>
          <button
            type="button"
            className="setting-button danger"
            onClick={() => onReset('all')}
          >
            Reset All
          </button>
        </div>
      </div>

      {/* Custom Animation Settings */}
      {animationConfig.customSettings && (
        <div className="setting-subgroup">
          <h4 className="subgroup-title">Custom Settings</h4>
          
          {/* Particle Size */}
          {typeof animationConfig.customSettings.particleSize === 'number' && (
            <div className="setting-group">
              <label className="setting-label">
                Particle Size: {animationConfig.customSettings.particleSize}
              </label>
              <input
                type="range"
                className="setting-slider"
                min="0.5"
                max="5.0"
                step="0.1"
                value={animationConfig.customSettings.particleSize}
                onChange={(e) => handleAnimationConfigChange('customSettings', {
                  ...animationConfig.customSettings!,
                  particleSize: parseFloat(e.target.value)
                })}
              />
            </div>
          )}

          {/* Gravity Effect */}
          {typeof animationConfig.customSettings.gravityEffect === 'number' && (
            <div className="setting-group">
              <label className="setting-label">
                Gravity Effect: {animationConfig.customSettings.gravityEffect}
              </label>
              <input
                type="range"
                className="setting-slider"
                min="0"
                max="2"
                step="0.1"
                value={animationConfig.customSettings.gravityEffect}
                onChange={(e) => handleAnimationConfigChange('customSettings', {
                  ...animationConfig.customSettings!,
                  gravityEffect: parseFloat(e.target.value)
                })}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (!isVisible) {
    return null;
  }

  return (
    <div className="settings-panel-overlay" onClick={() => onClose()}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="settings-header">
          <h2 className="settings-title">Settings</h2>
          <button
            type="button"
            className="close-button"
            onClick={() => onClose()}
            title="Close Settings"
          >
            ✕
          </button>
        </div>

        {/* Category Tabs */}
        <div className="settings-tabs">
          {categoryTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`tab-button ${activeCategory === tab.id ? 'active' : ''}`}
              onClick={() => handleCategoryChange(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="settings-content">
          {activeCategory === SettingsCategory.UI && renderUISettings()}
          {activeCategory === SettingsCategory.ANIMATION && renderAnimationSettings()}
          {activeCategory === SettingsCategory.ADVANCED && renderAdvancedSettings()}
        </div>

        {/* Import Dialog */}
        {showImportDialog && (
          <div className="import-dialog-overlay" onClick={() => setShowImportDialog(false)}>
            <div className="import-dialog" onClick={(e) => e.stopPropagation()}>
              <h3 className="import-title">Import Settings</h3>
              <textarea
                className="import-textarea"
                placeholder="Paste settings JSON here..."
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
              />
              <div className="import-actions">
                <button
                  type="button"
                  className="setting-button secondary"
                  onClick={() => setShowImportDialog(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="setting-button primary"
                  onClick={handleImport}
                  disabled={!importText.trim()}
                >
                  Import
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPanel;
