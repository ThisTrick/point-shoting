/**
 * KeyboardSettings Component
 * 
 * Provides keyboard shortcut customization interface including:
 * - Shortcuts configuration for all app functions
 * - Key combination recording and validation
 * - Conflict detection and resolution
 * - Accessibility controls for keyboard navigation
 * - Modifier key preferences and international layout support
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import './KeyboardSettings.css';

// Temporary type definitions - will be replaced with proper imports
interface KeyboardShortcuts {
  play_pause: string;
  stop: string;
  reset: string;
  next_frame: string;
  prev_frame: string;
  speed_up: string;
  speed_down: string;
  open_file: string;
  save_config: string;
  load_config: string;
  toggle_settings: string;
  toggle_help: string;
  close_modal: string;
  undo: string;
  redo: string;
  copy: string;
  paste: string;
  select_all: string;
  zoom_in: string;
  zoom_out: string;
  zoom_fit: string;
  zoom_actual: string;
  toggle_fullscreen: string;
}

// Temporary hooks - will be replaced with proper implementations
const useLocalization = () => ({
  t: (key: string) => key,
  currentLocale: 'en'
});

interface KeyRecording {
  action: string;
  isRecording: boolean;
  recordedKeys: string[];
  conflicts: string[];
}

interface KeyboardSettingsProps {
  shortcuts: KeyboardShortcuts;
  onShortcutsChange: (shortcuts: Partial<KeyboardShortcuts>) => void;
  disabled?: boolean;
  className?: string;
  'data-testid'?: string;
}

interface ShortcutDefinition {
  action: keyof KeyboardShortcuts;
  label: string;
  description: string;
  category: 'animation' | 'interface' | 'editing' | 'view';
  defaultKeys: string;
  allowEmpty?: boolean;
}

const SHORTCUT_DEFINITIONS: ShortcutDefinition[] = [
  // Animation Controls
  { action: 'play_pause', label: 'Play/Pause Animation', description: 'Toggle animation playback', category: 'animation', defaultKeys: 'Space' },
  { action: 'stop', label: 'Stop Animation', description: 'Stop and reset animation', category: 'animation', defaultKeys: 'Escape' },
  { action: 'reset', label: 'Reset Animation', description: 'Reset to initial state', category: 'animation', defaultKeys: 'Ctrl+R' },
  { action: 'next_frame', label: 'Next Frame', description: 'Advance one frame forward', category: 'animation', defaultKeys: 'ArrowRight' },
  { action: 'prev_frame', label: 'Previous Frame', description: 'Go back one frame', category: 'animation', defaultKeys: 'ArrowLeft' },
  { action: 'speed_up', label: 'Increase Speed', description: 'Make animation faster', category: 'animation', defaultKeys: 'Ctrl+ArrowUp' },
  { action: 'speed_down', label: 'Decrease Speed', description: 'Make animation slower', category: 'animation', defaultKeys: 'Ctrl+ArrowDown' },

  // Interface Controls  
  { action: 'open_file', label: 'Open Image', description: 'Open image selection dialog', category: 'interface', defaultKeys: 'Ctrl+O' },
  { action: 'save_config', label: 'Save Settings', description: 'Save current configuration', category: 'interface', defaultKeys: 'Ctrl+S' },
  { action: 'load_config', label: 'Load Settings', description: 'Load saved configuration', category: 'interface', defaultKeys: 'Ctrl+L' },
  { action: 'toggle_settings', label: 'Toggle Settings', description: 'Show/hide settings panel', category: 'interface', defaultKeys: 'Ctrl+Comma' },
  { action: 'toggle_help', label: 'Toggle Help', description: 'Show/hide help information', category: 'interface', defaultKeys: 'F1' },
  { action: 'close_modal', label: 'Close Modal', description: 'Close current dialog or modal', category: 'interface', defaultKeys: 'Escape', allowEmpty: true },

  // Editing Controls
  { action: 'undo', label: 'Undo', description: 'Undo last change', category: 'editing', defaultKeys: 'Ctrl+Z' },
  { action: 'redo', label: 'Redo', description: 'Redo last undone change', category: 'editing', defaultKeys: 'Ctrl+Y' },
  { action: 'copy', label: 'Copy', description: 'Copy current selection', category: 'editing', defaultKeys: 'Ctrl+C' },
  { action: 'paste', label: 'Paste', description: 'Paste from clipboard', category: 'editing', defaultKeys: 'Ctrl+V' },
  { action: 'select_all', label: 'Select All', description: 'Select all particles', category: 'editing', defaultKeys: 'Ctrl+A' },

  // View Controls
  { action: 'zoom_in', label: 'Zoom In', description: 'Zoom into the image', category: 'view', defaultKeys: 'Ctrl+Plus' },
  { action: 'zoom_out', label: 'Zoom Out', description: 'Zoom out from the image', category: 'view', defaultKeys: 'Ctrl+Minus' },
  { action: 'zoom_fit', label: 'Fit to Window', description: 'Fit image to window size', category: 'view', defaultKeys: 'Ctrl+0' },
  { action: 'zoom_actual', label: 'Actual Size', description: 'Show image at 100% size', category: 'view', defaultKeys: 'Ctrl+1' },
  { action: 'toggle_fullscreen', label: 'Toggle Fullscreen', description: 'Enter/exit fullscreen mode', category: 'view', defaultKeys: 'F11' },
];

const MODIFIER_KEYS = ['Ctrl', 'Alt', 'Shift', 'Meta'];
const SPECIAL_KEYS = ['Space', 'Enter', 'Escape', 'Tab', 'Backspace', 'Delete'];
const ARROW_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
const FUNCTION_KEYS = Array.from({ length: 12 }, (_, i) => `F${i + 1}`);

export const KeyboardSettings: React.FC<KeyboardSettingsProps> = ({
  shortcuts,
  onShortcutsChange,
  disabled = false,
  className = '',
  'data-testid': testId = 'keyboard-settings'
}) => {
  const { t, currentLocale } = useLocalization();
  const [recording, setRecording] = useState<KeyRecording | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const recordingRef = useRef<HTMLButtonElement>(null);

  // Group shortcuts by category
  const groupedShortcuts = useMemo(() => {
    const filtered = SHORTCUT_DEFINITIONS.filter(def => {
      const matchesSearch = searchQuery === '' || 
        def.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        def.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || def.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    return filtered.reduce((groups, def) => {
      if (!groups[def.category]) {
        groups[def.category] = [];
      }
      const group = groups[def.category];
      if (group) {
        group.push(def);
      }
      return groups;
    }, {} as Record<string, ShortcutDefinition[]>);
  }, [searchQuery, selectedCategory]);

  // Detect key combination conflicts
  const findConflicts = useCallback((action: string, keys: string): string[] => {
    if (!keys) return [];
    
    return SHORTCUT_DEFINITIONS
      .filter(def => def.action !== action && shortcuts[def.action] === keys)
      .map(def => def.label);
  }, [shortcuts]);

  // Start recording a key combination
  const startRecording = useCallback((action: string) => {
    setRecording({
      action,
      isRecording: true,
      recordedKeys: [],
      conflicts: []
    });

    // Focus the recording button for key capture
    setTimeout(() => {
      recordingRef.current?.focus();
    }, 100);
  }, []);

  // Stop recording
  const stopRecording = useCallback(() => {
    setRecording(null);
  }, []);

  // Handle key recording
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!recording?.isRecording) return;

    event.preventDefault();
    event.stopPropagation();

    const key = event.key;
    const keys: string[] = [];

    // Add modifiers in consistent order
    if (event.ctrlKey || event.metaKey) keys.push('Ctrl');
    if (event.altKey) keys.push('Alt');
    if (event.shiftKey && !isShiftRequired(key)) keys.push('Shift');

    // Add the main key
    if (!MODIFIER_KEYS.includes(key)) {
      const normalizedKey = normalizeKey(key);
      if (normalizedKey) {
        keys.push(normalizedKey);
      }
    }

    // Update recording state
    if (keys.length > 0) {
      const keyString = keys.join('+');
      const conflicts = findConflicts(recording.action, keyString);
      
      setRecording(prev => prev ? {
        ...prev,
        recordedKeys: keys,
        conflicts
      } : null);
    }
  }, [recording, findConflicts]);

  // Normalize key names for consistency
  const normalizeKey = useCallback((key: string): string | null => {
    // Handle special cases
    if (key === ' ') return 'Space';
    if (key === '+') return 'Plus';
    if (key === '-') return 'Minus';
    if (key === '=') return 'Equal';
    
    // Handle arrow keys
    if (ARROW_KEYS.includes(key)) return key;
    
    // Handle function keys
    if (FUNCTION_KEYS.includes(key)) return key;
    
    // Handle other special keys
    if (SPECIAL_KEYS.includes(key)) return key;
    
    // Handle alphanumeric keys
    if (/^[a-zA-Z0-9]$/.test(key)) return key.toUpperCase();
    
    // Handle symbols and other printable characters
    if (key.length === 1 && key.charCodeAt(0) > 31) return key;
    
    return null;
  }, []);

  // Check if shift is required for the key
  const isShiftRequired = useCallback((key: string): boolean => {
    // Shift is required for uppercase letters and symbols that need it
    return /^[A-Z!@#$%^&*()_+{}|:"<>?]$/.test(key);
  }, []);

  // Apply recorded shortcut
  const applyShortcut = useCallback(() => {
    if (!recording || recording.recordedKeys.length === 0) return;

    const keyString = recording.recordedKeys.join('+');
    onShortcutsChange({ [recording.action]: keyString });
    stopRecording();
  }, [recording, onShortcutsChange, stopRecording]);

  // Clear a shortcut
  const clearShortcut = useCallback((action: string) => {
    onShortcutsChange({ [action]: '' });
  }, [onShortcutsChange]);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    const defaults: Partial<KeyboardShortcuts> = {};
    SHORTCUT_DEFINITIONS.forEach(def => {
      defaults[def.action] = def.defaultKeys;
    });
    onShortcutsChange(defaults);
  }, [onShortcutsChange]);

  // Reset single shortcut to default
  const resetShortcut = useCallback((action: string) => {
    const definition = SHORTCUT_DEFINITIONS.find(def => def.action === action);
    if (definition) {
      onShortcutsChange({ [action]: definition.defaultKeys });
    }
  }, [onShortcutsChange]);

  // Format key combination for display
  const formatKeys = useCallback((keys: string): string => {
    if (!keys) return t('keyboard.no_shortcut');
    
    return keys
      .split('+')
      .map(key => {
        // Localize common keys
        switch (key) {
          case 'Ctrl': return currentLocale === 'uk' ? 'Ctrl' : 'Ctrl';
          case 'Alt': return currentLocale === 'uk' ? 'Alt' : 'Alt';
          case 'Shift': return currentLocale === 'uk' ? 'Shift' : 'Shift';
          case 'Space': return currentLocale === 'uk' ? 'Пробіл' : 'Space';
          case 'Enter': return currentLocale === 'uk' ? 'Enter' : 'Enter';
          case 'Escape': return currentLocale === 'uk' ? 'Esc' : 'Esc';
          default: return key;
        }
      })
      .join(' + ');
  }, [t, currentLocale]);

  // Get category display name
  const getCategoryName = useCallback((category: string): string => {
    switch (category) {
      case 'animation': return t('keyboard.categories.animation');
      case 'interface': return t('keyboard.categories.interface');
      case 'editing': return t('keyboard.categories.editing');
      case 'view': return t('keyboard.categories.view');
      default: return category;
    }
  }, [t]);

  // Handle escape key to stop recording
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && recording?.isRecording) {
        stopRecording();
      }
    };

    if (recording?.isRecording) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
    
    return undefined;
  }, [recording?.isRecording, stopRecording]);

  return (
    <div 
      className={`keyboard-settings ${disabled ? 'disabled' : ''} ${className}`}
      data-testid={testId}
      role="tabpanel"
      aria-labelledby="keyboard-settings-title"
    >
      <div className="keyboard-header">
        <div className="search-filter-row">
          <div className="search-group">
            <label htmlFor="shortcut-search" className="search-label">
              {t('keyboard.search_shortcuts')}
            </label>
            <input
              id="shortcut-search"
              type="text"
              className="search-input"
              placeholder={t('keyboard.search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={disabled}
            />
          </div>

          <div className="category-filter">
            <label htmlFor="category-select" className="filter-label">
              {t('keyboard.filter_category')}
            </label>
            <select
              id="category-select"
              className="category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              disabled={disabled}
            >
              <option value="all">{t('keyboard.all_categories')}</option>
              <option value="animation">{t('keyboard.categories.animation')}</option>
              <option value="interface">{t('keyboard.categories.interface')}</option>
              <option value="editing">{t('keyboard.categories.editing')}</option>
              <option value="view">{t('keyboard.categories.view')}</option>
            </select>
          </div>
        </div>

        <div className="actions-row">
          <button
            type="button"
            className="reset-all-button"
            onClick={resetToDefaults}
            disabled={disabled}
            title={t('keyboard.reset_all_tooltip')}
          >
            {t('keyboard.reset_all')}
          </button>
        </div>
      </div>

      <div className="shortcuts-content">
        {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
          <div key={category} className="shortcut-category">
            <h3 className="category-title">
              {getCategoryName(category)}
            </h3>

            <div className="shortcut-list">
              {shortcuts.map(definition => {
                const currentKeys = (shortcuts as any)[definition.action] || '';
                const conflicts = findConflicts(definition.action as string, currentKeys);
                const isRecordingThis = recording?.action === definition.action;

                return (
                  <div 
                    key={definition.action}
                    className={`shortcut-item ${conflicts.length > 0 ? 'has-conflict' : ''} ${isRecordingThis ? 'recording' : ''}`}
                  >
                    <div className="shortcut-info">
                      <div className="shortcut-label">{definition.label}</div>
                      <div className="shortcut-description">{definition.description}</div>
                      
                      {conflicts.length > 0 && (
                        <div className="conflict-warning">
                          {t('keyboard.conflict_warning')}: {conflicts.join(', ')}
                        </div>
                      )}
                    </div>

                    <div className="shortcut-controls">
                      <div className="key-display">
                        {isRecordingThis ? (
                          <div className="recording-display">
                            {recording.recordedKeys.length > 0 ? (
                              <>
                                <span className="recorded-keys">
                                  {formatKeys(recording.recordedKeys.join('+'))}
                                </span>
                                {recording.conflicts.length > 0 && (
                                  <span className="recording-conflicts">
                                    {t('keyboard.conflicts')}: {recording.conflicts.join(', ')}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="recording-prompt">
                                {t('keyboard.press_keys')}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="current-keys">
                            {formatKeys(currentKeys)}
                          </span>
                        )}
                      </div>

                      <div className="shortcut-actions">
                        {isRecordingThis ? (
                          <>
                            <button
                              ref={recordingRef}
                              type="button"
                              className="apply-button"
                              onClick={applyShortcut}
                              onKeyDown={handleKeyDown}
                              disabled={recording.recordedKeys.length === 0 || recording.conflicts.length > 0}
                              title={t('keyboard.apply_shortcut')}
                            >
                              {t('keyboard.apply')}
                            </button>
                            <button
                              type="button"
                              className="cancel-button"
                              onClick={stopRecording}
                              title={t('keyboard.cancel_recording')}
                            >
                              {t('keyboard.cancel')}
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="record-button"
                              onClick={() => startRecording(definition.action)}
                              disabled={disabled}
                              title={t('keyboard.record_shortcut')}
                            >
                              {t('keyboard.record')}
                            </button>
                            
                            {currentKeys !== definition.defaultKeys && (
                              <button
                                type="button"
                                className="reset-button"
                                onClick={() => resetShortcut(definition.action)}
                                disabled={disabled}
                                title={t('keyboard.reset_to_default')}
                              >
                                {t('keyboard.reset')}
                              </button>
                            )}

                            {definition.allowEmpty && currentKeys && (
                              <button
                                type="button"
                                className="clear-button"
                                onClick={() => clearShortcut(definition.action)}
                                disabled={disabled}
                                title={t('keyboard.clear_shortcut')}
                              >
                                {t('keyboard.clear')}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {Object.keys(groupedShortcuts).length === 0 && (
          <div className="no-results">
            <p>{t('keyboard.no_shortcuts_found')}</p>
            {searchQuery && (
              <button
                type="button"
                className="clear-search-button"
                onClick={() => setSearchQuery('')}
              >
                {t('keyboard.clear_search')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default KeyboardSettings;
