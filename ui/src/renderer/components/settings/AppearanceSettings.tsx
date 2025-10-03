/**
 * AppearanceSettings Component for Point Shooting Animation System
 * 
 * Provides appearance and UI customization interface including:
 * - Theme selection (light/dark/auto)
 * - Color scheme customization
 * - UI layout preferences
 * - Accessibility options
 */

import React, { useCallback, useMemo, useEffect } from 'react';
import { UISettings, UITheme } from '../../../types/core';
import './AppearanceSettings.css';

/**
 * AppearanceSettings Component Props
 */
export interface AppearanceSettingsProps {
  readonly settings: UISettings;
  readonly onChange: (settings: Partial<UISettings>) => void;
  readonly onReset?: () => void;
  readonly disabled?: boolean;
}

/**
 * Color theme options for UI customization
 */
interface ColorTheme {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly preview: {
    readonly primary: string;
    readonly secondary: string;
    readonly accent: string;
  };
}

/**
 * AppearanceSettings Component
 * 
 * Comprehensive appearance customization panel with theme selection and accessibility options.
 */
export const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({
  settings,
  onChange,
  onReset,
  disabled = false,
}) => {
  // Handle setting changes
  const handleSettingChange = useCallback(<K extends keyof UISettings>(
    key: K,
    value: UISettings[K]
  ) => {
    onChange({ [key]: value });
  }, [onChange]);

  // Apply theme changes to DOM
  useEffect(() => {
    // Apply theme to document element
    document.documentElement.setAttribute('data-theme', settings.theme);
    
    // Persist theme to localStorage
    localStorage.setItem('app-theme', settings.theme);
  }, [settings.theme]);

  // Apply language changes to DOM
  useEffect(() => {
    // Apply language to document element
    document.documentElement.lang = settings.language;
    
    // Persist language to localStorage
    localStorage.setItem('app-locale', settings.language);
  }, [settings.language]);

  // Handle accessibility setting changes
  const handleAccessibilityChange = useCallback((
    key: keyof NonNullable<UISettings['accessibility']>,
    value: boolean
  ) => {
    const currentAccessibility = settings.accessibility || {
      highContrast: false,
      reducedMotion: false,
      largeText: false,
      screenReaderOptimizations: false,
    };

    onChange({
      accessibility: {
        ...currentAccessibility,
        [key]: value,
      },
    });
  }, [settings.accessibility, onChange]);

  // Handle window size preference changes
  const handleWindowSizeChange = useCallback((
    key: keyof NonNullable<UISettings['windowSize']>,
    value: number | boolean
  ) => {
    const currentWindowSize = settings.windowSize || {
      width: 1200,
      height: 800,
      isMaximized: false,
      isFullscreen: false,
    };

    onChange({
      windowSize: {
        ...currentWindowSize,
        [key]: value,
      },
    });
  }, [settings.windowSize, onChange]);

  // Available themes
  const themes = useMemo<ColorTheme[]>(() => [
    {
      id: 'default-light',
      name: 'Light',
      description: 'Clean and bright interface',
      preview: {
        primary: '#ffffff',
        secondary: '#f8fafc',
        accent: '#3b82f6',
      },
    },
    {
      id: 'default-dark',
      name: 'Dark',
      description: 'Easy on the eyes in low light',
      preview: {
        primary: '#1f2937',
        secondary: '#111827',
        accent: '#60a5fa',
      },
    },
    {
      id: 'high-contrast',
      name: 'High Contrast',
      description: 'Maximum contrast for accessibility',
      preview: {
        primary: '#000000',
        secondary: '#ffffff',
        accent: '#ffff00',
      },
    },
  ], []);

  // Get current theme info
  const getCurrentThemeInfo = () => {
    if (settings.accessibility?.highContrast) {
      return themes.find(t => t.id === 'high-contrast');
    }
    
    switch (settings.theme) {
      case UITheme.LIGHT:
        return themes.find(t => t.id === 'default-light');
      case UITheme.DARK:
        return themes.find(t => t.id === 'default-dark');
      case UITheme.AUTO:
        return themes.find(t => t.id === 'default-light'); // Default fallback for auto
      default:
        return themes[0];
    }
  };

  return (
    <div className={`appearance-settings ${disabled ? 'disabled' : ''}`}>
      <div className="settings-sections">
        {/* Theme Selection */}
        <section className="settings-section">
          <h3 className="section-title">Color Theme</h3>
          
          <div className="theme-selection">
            <div className="theme-options">
              <label className="theme-option">
                <input
                  type="radio"
                  name="theme"
                  value={UITheme.LIGHT}
                  checked={settings.theme === UITheme.LIGHT}
                  onChange={(e) => handleSettingChange('theme', e.target.value as UITheme)}
                  disabled={disabled}
                />
                <div className="theme-preview">
                  <div className="preview-colors">
                    <div 
                      className="color-swatch primary" 
                      style={{ backgroundColor: themes.find(t => t.id === 'default-light')?.preview.primary || '#ffffff' }}
                    ></div>
                    <div 
                      className="color-swatch secondary" 
                      style={{ backgroundColor: themes.find(t => t.id === 'default-light')?.preview.secondary || '#f8fafc' }}
                    ></div>
                    <div 
                      className="color-swatch accent" 
                      style={{ backgroundColor: themes.find(t => t.id === 'default-light')?.preview.accent || '#3b82f6' }}
                    ></div>
                  </div>
                  <div className="theme-info">
                    <span className="theme-name">Light Theme</span>
                    <span className="theme-description">Clean and bright interface</span>
                  </div>
                </div>
              </label>

              <label className="theme-option">
                <input
                  type="radio"
                  name="theme"
                  value={UITheme.DARK}
                  checked={settings.theme === UITheme.DARK}
                  onChange={(e) => handleSettingChange('theme', e.target.value as UITheme)}
                  disabled={disabled}
                />
                <div className="theme-preview">
                  <div className="preview-colors">
                    <div 
                      className="color-swatch primary" 
                      style={{ backgroundColor: themes.find(t => t.id === 'default-dark')?.preview.primary || '#1f2937' }}
                    ></div>
                    <div 
                      className="color-swatch secondary" 
                      style={{ backgroundColor: themes.find(t => t.id === 'default-dark')?.preview.secondary || '#111827' }}
                    ></div>
                    <div 
                      className="color-swatch accent" 
                      style={{ backgroundColor: themes.find(t => t.id === 'default-dark')?.preview.accent || '#60a5fa' }}
                    ></div>
                  </div>
                  <div className="theme-info">
                    <span className="theme-name">Dark Theme</span>
                    <span className="theme-description">Easy on the eyes in low light</span>
                  </div>
                </div>
              </label>

              <label className="theme-option">
                <input
                  type="radio"
                  name="theme"
                  value={UITheme.AUTO}
                  checked={settings.theme === UITheme.AUTO}
                  onChange={(e) => handleSettingChange('theme', e.target.value as UITheme)}
                  disabled={disabled}
                />
                <div className="theme-preview auto">
                  <div className="preview-colors">
                    <div className="auto-indicator">🌓</div>
                  </div>
                  <div className="theme-info">
                    <span className="theme-name">Auto Theme</span>
                    <span className="theme-description">Follows system preference</span>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </section>

        {/* Window Preferences */}
        <section className="settings-section">
          <h3 className="section-title">Window Settings</h3>
          
          <div className="window-settings">
            <div className="setting-row">
              <div className="setting-group">
                <label className="setting-label">
                  Default Width
                  <span className="setting-value">{settings.windowSize?.width || 1200}px</span>
                </label>
                <input
                  type="range"
                  className="setting-slider"
                  min="800"
                  max="1920"
                  step="50"
                  value={settings.windowSize?.width || 1200}
                  onChange={(e) => handleWindowSizeChange('width', parseInt(e.target.value))}
                  disabled={disabled}
                />
                <div className="slider-labels">
                  <span>800px</span>
                  <span>1920px</span>
                </div>
              </div>

              <div className="setting-group">
                <label className="setting-label">
                  Default Height
                  <span className="setting-value">{settings.windowSize?.height || 800}px</span>
                </label>
                <input
                  type="range"
                  className="setting-slider"
                  min="600"
                  max="1080"
                  step="50"
                  value={settings.windowSize?.height || 800}
                  onChange={(e) => handleWindowSizeChange('height', parseInt(e.target.value))}
                  disabled={disabled}
                />
                <div className="slider-labels">
                  <span>600px</span>
                  <span>1080px</span>
                </div>
              </div>
            </div>

            <div className="toggle-group">
              <label className="setting-toggle">
                <input
                  type="checkbox"
                  checked={settings.windowSize?.isMaximized || false}
                  onChange={(e) => handleWindowSizeChange('isMaximized', e.target.checked)}
                  disabled={disabled}
                />
                <span className="toggle-switch"></span>
                <div className="toggle-content">
                  <span className="toggle-label">Start Maximized</span>
                  <span className="toggle-description">
                    Open application in maximized window by default
                  </span>
                </div>
              </label>
            </div>
          </div>
        </section>

        {/* Accessibility Settings */}
        <section className="settings-section accessibility">
          <h3 className="section-title">Accessibility</h3>
          
          <div className="accessibility-settings">
            <div className="toggle-group">
              <label className="setting-toggle">
                <input
                  type="checkbox"
                  checked={settings.accessibility?.highContrast || false}
                  onChange={(e) => handleAccessibilityChange('highContrast', e.target.checked)}
                  disabled={disabled}
                />
                <span className="toggle-switch"></span>
                <div className="toggle-content">
                  <span className="toggle-label">High Contrast Mode</span>
                  <span className="toggle-description">
                    Use high contrast colors for better visibility
                  </span>
                </div>
              </label>

              <label className="setting-toggle">
                <input
                  type="checkbox"
                  checked={settings.accessibility?.reducedMotion || false}
                  onChange={(e) => handleAccessibilityChange('reducedMotion', e.target.checked)}
                  disabled={disabled}
                />
                <span className="toggle-switch"></span>
                <div className="toggle-content">
                  <span className="toggle-label">Reduce Motion</span>
                  <span className="toggle-description">
                    Minimize animations and transitions for accessibility
                  </span>
                </div>
              </label>

              <label className="setting-toggle">
                <input
                  type="checkbox"
                  checked={settings.accessibility?.largeText || false}
                  onChange={(e) => handleAccessibilityChange('largeText', e.target.checked)}
                  disabled={disabled}
                />
                <span className="toggle-switch"></span>
                <div className="toggle-content">
                  <span className="toggle-label">Large Text</span>
                  <span className="toggle-description">
                    Use larger font sizes throughout the interface
                  </span>
                </div>
              </label>

              <label className="setting-toggle">
                <input
                  type="checkbox"
                  checked={settings.accessibility?.screenReaderOptimizations || false}
                  onChange={(e) => handleAccessibilityChange('screenReaderOptimizations', e.target.checked)}
                  disabled={disabled}
                />
                <span className="toggle-switch"></span>
                <div className="toggle-content">
                  <span className="toggle-label">Screen Reader Support</span>
                  <span className="toggle-description">
                    Optimize interface for screen readers and assistive technology
                  </span>
                </div>
              </label>
            </div>
          </div>
        </section>

        {/* Advanced Appearance Settings */}
        <section className="settings-section">
          <h3 className="section-title">Advanced Settings</h3>
          
          <div className="advanced-settings">
            <div className="toggle-group">
              <label className="setting-toggle">
                <input
                  type="checkbox"
                  checked={settings.showAdvancedControls}
                  onChange={(e) => handleSettingChange('showAdvancedControls', e.target.checked)}
                  disabled={disabled}
                />
                <span className="toggle-switch"></span>
                <div className="toggle-content">
                  <span className="toggle-label">Show Advanced Controls</span>
                  <span className="toggle-description">
                    Display additional configuration options and developer tools
                  </span>
                </div>
              </label>
            </div>

            {/* Current Theme Info */}
            <div className="current-theme-info">
              <h4 className="info-title">Current Theme</h4>
              <div className="theme-summary">
                <div className="theme-preview-mini">
                  {getCurrentThemeInfo() && (
                    <div className="preview-colors-mini">
                      <div 
                        className="color-dot" 
                        style={{ backgroundColor: getCurrentThemeInfo()!.preview.primary }}
                      ></div>
                      <div 
                        className="color-dot" 
                        style={{ backgroundColor: getCurrentThemeInfo()!.preview.secondary }}
                      ></div>
                      <div 
                        className="color-dot" 
                        style={{ backgroundColor: getCurrentThemeInfo()!.preview.accent }}
                      ></div>
                    </div>
                  )}
                </div>
                <div className="theme-details">
                  <span className="current-theme-name">
                    {getCurrentThemeInfo()?.name || 'Custom'}
                  </span>
                  <span className="current-theme-description">
                    {getCurrentThemeInfo()?.description || 'Custom theme configuration'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Language Settings */}
        <section className="settings-section">
          <h3 className="section-title">Language</h3>
          
          <div className="language-selection">
            <div className="setting-group">
              <label className="setting-label">Interface Language</label>
              <div className="language-options">
                <label className="language-option">
                  <input
                    type="radio"
                    name="language"
                    value="en"
                    checked={settings.language === 'en'}
                    onChange={(e) => handleSettingChange('language', e.target.value)}
                    disabled={disabled}
                  />
                  <span className="language-name">English</span>
                  <span className="language-native">English</span>
                </label>
                
                <label className="language-option">
                  <input
                    type="radio"
                    name="language"
                    value="uk"
                    checked={settings.language === 'uk'}
                    onChange={(e) => handleSettingChange('language', e.target.value)}
                    disabled={disabled}
                  />
                  <span className="language-name">Ukrainian</span>
                  <span className="language-native">Українська</span>
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Reset Section */}
        {onReset && (
          <section className="settings-section reset-section">
            <div className="reset-group">
              <div className="reset-info">
                <h4 className="reset-title">Reset Appearance Settings</h4>
                <p className="reset-description">
                  Restore all appearance and accessibility settings to their default values.
                </p>
              </div>
              <button
                type="button"
                className="reset-button"
                onClick={onReset}
                disabled={disabled}
              >
                Reset Appearance
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default AppearanceSettings;
