/**
 * SettingsDialog Component for Point Shooting Animation System
 * 
 * Provides a dedicated dialog for comprehensive settings management including:
 * - Tabbed interface for different setting categories
 * - Modal presentation with backdrop
 * - Keyboard shortcuts and accessibility
 * - Settings validation and error handling
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  UISettings, 
  AnimationConfig, 
  ErrorInfo, 
  ErrorSeverity, 
  ErrorCategory 
} from '../../../types/core';
import './SettingsDialog.css';

/**
 * Settings dialog tab configuration
 */
interface SettingsTab {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly component: React.ComponentType<any>;
}

/**
 * SettingsDialog Component Props
 */
export interface SettingsDialogProps {
  readonly isOpen: boolean;
  readonly uiSettings: UISettings;
  readonly animationConfig: AnimationConfig;
  readonly activeTab?: string;
  readonly onClose: () => void;
  readonly onUISettingsChange: (settings: Partial<UISettings>) => void;
  readonly onAnimationConfigChange: (config: Partial<AnimationConfig>) => void;
  readonly onTabChange?: (tabId: string) => void;
  readonly onError?: (error: ErrorInfo) => void;
  readonly onSave?: () => void;
  readonly onReset?: (category: 'ui' | 'animation' | 'all') => void;
}

/**
 * SettingsDialog Component
 * 
 * Full-featured settings dialog with proper focus management and keyboard navigation.
 */
export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  isOpen,
  uiSettings,
  animationConfig,
  activeTab = 'general',
  onClose,
  onUISettingsChange,
  onAnimationConfigChange,
  onTabChange,
  onError,
  onSave,
  onReset,
}) => {
  const [currentTab, setCurrentTab] = useState(activeTab);
  const [hasChanges, setHasChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<Element | null>(null);

  // Store the previously focused element when dialog opens
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      // Focus the dialog container
      setTimeout(() => {
        dialogRef.current?.focus();
      }, 100);
    } else {
      // Restore focus when dialog closes
      if (previousFocusRef.current && 'focus' in previousFocusRef.current) {
        (previousFocusRef.current as HTMLElement).focus();
      }
    }
  }, [isOpen]);

  // Handle tab change
  const handleTabChange = useCallback((tabId: string) => {
    setCurrentTab(tabId);
    onTabChange?.(tabId);
  }, [onTabChange]);

  // Handle ESC key to close dialog
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      if (hasChanges) {
        // Show confirmation dialog or just close with warning
        if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
          onClose();
        }
      } else {
        onClose();
      }
    }
  }, [hasChanges, onClose]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Track changes
  const handleUISettingsChange = useCallback((settings: Partial<UISettings>) => {
    onUISettingsChange(settings);
    setHasChanges(true);
  }, [onUISettingsChange]);

  const handleAnimationConfigChange = useCallback((config: Partial<AnimationConfig>) => {
    onAnimationConfigChange(config);
    setHasChanges(true);
  }, [onAnimationConfigChange]);

  // Handle save
  const handleSave = useCallback(() => {
    try {
      onSave?.();
      setHasChanges(false);
    } catch (error) {
      const errorInfo: ErrorInfo = {
        code: 'SETTINGS_SAVE_ERROR',
        message: 'Failed to save settings',
        severity: ErrorSeverity.ERROR,
        category: ErrorCategory.UI_STATE,
        recoverable: true,
        timestamp: Date.now(),
        context: { error },
      };
      onError?.(errorInfo);
    }
  }, [onSave, onError]);

  // Handle reset
  const handleReset = useCallback((category: 'ui' | 'animation' | 'all') => {
    const confirmMessage = category === 'all' 
      ? 'Are you sure you want to reset all settings to defaults?'
      : `Are you sure you want to reset ${category} settings to defaults?`;
      
    if (window.confirm(confirmMessage)) {
      onReset?.(category);
      setHasChanges(false);
      setValidationErrors({});
    }
  }, [onReset]);

  // Available tabs configuration
  const tabs: SettingsTab[] = [
    {
      id: 'general',
      label: 'General',
      icon: '⚙️',
      component: () => <GeneralSettingsPanel 
        uiSettings={uiSettings}
        onChange={handleUISettingsChange}
        validationErrors={validationErrors}
      />
    },
    {
      id: 'animation',
      label: 'Animation',
      icon: '⚡',
      component: () => <AnimationSettingsPanel 
        animationConfig={animationConfig}
        onChange={handleAnimationConfigChange}
        validationErrors={validationErrors}
      />
    },
    {
      id: 'appearance',
      label: 'Appearance',
      icon: '🎨',
      component: () => <AppearanceSettingsPanel 
        uiSettings={uiSettings}
        onChange={handleUISettingsChange}
        validationErrors={validationErrors}
      />
    },
    {
      id: 'keyboard',
      label: 'Keyboard',
      icon: '⌨️',
      component: () => <KeyboardSettingsPanel 
        uiSettings={uiSettings}
        onChange={handleUISettingsChange}
        validationErrors={validationErrors}
      />
    },
    {
      id: 'advanced',
      label: 'Advanced',
      icon: '🔧',
      component: () => <AdvancedSettingsPanel 
        uiSettings={uiSettings}
        animationConfig={animationConfig}
        onUIChange={handleUISettingsChange}
        onAnimationChange={handleAnimationConfigChange}
        onReset={handleReset}
        validationErrors={validationErrors}
      />
    },
  ];

  const currentTabComponent = tabs.find(tab => tab.id === currentTab)?.component;

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="settings-dialog-overlay"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-dialog-title"
    >
      <div
        ref={dialogRef}
        className="settings-dialog"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        role="document"
      >
        {/* Header */}
        <header className="settings-dialog-header">
          <h1 id="settings-dialog-title" className="settings-dialog-title">
            Settings
          </h1>
          
          {hasChanges && (
            <div className="changes-indicator" title="You have unsaved changes">
              <span className="changes-dot"></span>
              <span className="changes-text">Unsaved Changes</span>
            </div>
          )}

          <button
            type="button"
            className="dialog-close-button"
            onClick={onClose}
            aria-label="Close Settings Dialog"
            title="Close (ESC)"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </header>

        <div className="settings-dialog-body">
          {/* Tab Navigation */}
          <nav className="settings-tabs" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                className={`settings-tab ${currentTab === tab.id ? 'active' : ''}`}
                aria-selected={currentTab === tab.id}
                aria-controls={`settings-panel-${tab.id}`}
                onClick={() => handleTabChange(tab.id)}
              >
                <span className="tab-icon" aria-hidden="true">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* Tab Content */}
          <main 
            className="settings-content"
            id={`settings-panel-${currentTab}`}
            role="tabpanel"
            aria-labelledby={`tab-${currentTab}`}
          >
            {currentTabComponent && React.createElement(currentTabComponent)}
          </main>
        </div>

        {/* Footer */}
        <footer className="settings-dialog-footer">
          <div className="settings-actions">
            <button
              type="button"
              className="settings-button secondary"
              onClick={() => handleReset('all')}
            >
              Reset All
            </button>
            
            <div className="primary-actions">
              <button
                type="button"
                className="settings-button secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              
              <button
                type="button"
                className="settings-button primary"
                onClick={handleSave}
                disabled={!hasChanges}
              >
                Save Changes
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

// Placeholder components for the different settings panels
// These would be implemented in separate files

const GeneralSettingsPanel: React.FC<any> = ({ uiSettings: _uiSettings, onChange: _onChange, validationErrors: _validationErrors }) => (
  <div>General Settings Panel - To be implemented</div>
);

const AnimationSettingsPanel: React.FC<any> = ({ animationConfig: _animationConfig, onChange: _onChange, validationErrors: _validationErrors }) => (
  <div>Animation Settings Panel - To be implemented</div>
);

const AppearanceSettingsPanel: React.FC<any> = ({ uiSettings: _uiSettings, onChange: _onChange, validationErrors: _validationErrors }) => (
  <div>Appearance Settings Panel - To be implemented</div>
);

const KeyboardSettingsPanel: React.FC<any> = ({ uiSettings: _uiSettings, onChange: _onChange, validationErrors: _validationErrors }) => (
  <div>Keyboard Settings Panel - To be implemented</div>
);

const AdvancedSettingsPanel: React.FC<any> = ({ 
  uiSettings: _uiSettings, 
  animationConfig: _animationConfig, 
  onUIChange: _onUIChange, 
  onAnimationChange: _onAnimationChange, 
  onReset: _onReset, 
  validationErrors: _validationErrors 
}) => (
  <div>Advanced Settings Panel - To be implemented</div>
);

export default SettingsDialog;
