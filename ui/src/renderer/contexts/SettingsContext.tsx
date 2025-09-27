/**
 * SettingsContext Provider
 * React context for managing application settings state and operations
 */

import { createContext, useContext, useEffect, useReducer, useCallback, ReactNode } from 'react';
import '../../types/electron'; // Import to extend Window interface

// Import types - using temporary inline definitions until types are properly organized
interface UISettings {
  readonly theme: UITheme;
  readonly language: string;
  readonly showAdvancedControls: boolean;
  readonly enableKeyboardShortcuts: boolean;
  readonly autoSaveSettings: boolean;
  readonly windowSize?: WindowDimensions;
  readonly accessibility?: AccessibilitySettings;
}

enum UITheme {
  LIGHT = 'light',
  DARK = 'dark',
  AUTO = 'auto'
}

interface WindowDimensions {
  readonly width: number;
  readonly height: number;
  readonly isMaximized: boolean;
  readonly isFullscreen: boolean;
}

interface AccessibilitySettings {
  readonly highContrast: boolean;
  readonly reducedMotion: boolean;
  readonly largeText: boolean;
  readonly screenReaderOptimizations: boolean;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

interface ValidationWarning {
  field: string;
  message: string;
  severity: 'warning';
}

interface PresetInfo {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  version: string;
}

// Settings state and actions
interface SettingsState {
  settings: UISettings | null;
  presets: PresetInfo[];
  isLoading: boolean;
  error: string | null;
  validationResult: ValidationResult | null;
  hasUnsavedChanges: boolean;
}

type SettingsAction =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; settings: UISettings }
  | { type: 'LOAD_ERROR'; error: string }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<UISettings> }
  | { type: 'VALIDATION_RESULT'; result: ValidationResult }
  | { type: 'PRESETS_LOADED'; presets: PresetInfo[] }
  | { type: 'PRESET_ADDED'; preset: PresetInfo }
  | { type: 'PRESET_REMOVED'; presetId: string }
  | { type: 'SAVE_SUCCESS' }
  | { type: 'SAVE_ERROR'; error: string }
  | { type: 'RESET_ERROR' }
  | { type: 'SET_UNSAVED_CHANGES'; hasChanges: boolean };

// Settings context interface
interface SettingsContextValue {
  // State
  state: SettingsState;
  
  // Settings operations
  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<UISettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
  validateSettings: (settings: Partial<UISettings>) => Promise<ValidationResult>;
  
  // Import/Export
  exportSettings: (filePath?: string) => Promise<void>;
  importSettings: (filePath?: string) => Promise<void>;
  
  // Presets
  loadPresets: () => Promise<void>;
  savePreset: (name: string, description?: string) => Promise<void>;
  loadPreset: (presetId: string) => Promise<void>;
  deletePreset: (presetId: string) => Promise<void>;
  
  // Theme operations
  applyTheme: (theme: UITheme) => Promise<void>;
  setLanguage: (language: string) => Promise<void>;
  
  // Utility
  clearError: () => void;
  markSaved: () => void;
}

// Default settings
const getDefaultSettings = (): UISettings => ({
  theme: UITheme.AUTO,
  language: 'en',
  showAdvancedControls: false,
  enableKeyboardShortcuts: true,
  autoSaveSettings: true,
  windowSize: {
    width: 1200,
    height: 800,
    isMaximized: false,
    isFullscreen: false
  },
  accessibility: {
    highContrast: false,
    reducedMotion: false,
    largeText: false,
    screenReaderOptimizations: false
  }
});

// Initial state
const initialState: SettingsState = {
  settings: null,
  presets: [],
  isLoading: false,
  error: null,
  validationResult: null,
  hasUnsavedChanges: false
};

// Settings reducer
function settingsReducer(state: SettingsState, action: SettingsAction): SettingsState {
  switch (action.type) {
    case 'LOAD_START':
      return {
        ...state,
        isLoading: true,
        error: null
      };
      
    case 'LOAD_SUCCESS':
      return {
        ...state,
        settings: action.settings,
        isLoading: false,
        error: null,
        hasUnsavedChanges: false
      };
      
    case 'LOAD_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.error
      };
      
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: state.settings ? { ...state.settings, ...action.settings } : null,
        hasUnsavedChanges: true,
        error: null
      };
      
    case 'VALIDATION_RESULT':
      return {
        ...state,
        validationResult: action.result
      };
      
    case 'PRESETS_LOADED':
      return {
        ...state,
        presets: action.presets
      };
      
    case 'PRESET_ADDED':
      return {
        ...state,
        presets: [...state.presets, action.preset]
      };
      
    case 'PRESET_REMOVED':
      return {
        ...state,
        presets: state.presets.filter(p => p.id !== action.presetId)
      };
      
    case 'SAVE_SUCCESS':
      return {
        ...state,
        hasUnsavedChanges: false,
        error: null
      };
      
    case 'SAVE_ERROR':
      return {
        ...state,
        error: action.error
      };
      
    case 'RESET_ERROR':
      return {
        ...state,
        error: null
      };
      
    case 'SET_UNSAVED_CHANGES':
      return {
        ...state,
        hasUnsavedChanges: action.hasChanges
      };
      
    default:
      return state;
  }
}

// Create context
const SettingsContext = createContext<SettingsContextValue | null>(null);

// Provider component
interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [state, dispatch] = useReducer(settingsReducer, initialState);

  // Load settings from main process
  const loadSettings = useCallback(async () => {
    dispatch({ type: 'LOAD_START' });
    try {
      const settings = await window.electronAPI?.settings.get();
      dispatch({ type: 'LOAD_SUCCESS', settings: settings || getDefaultSettings() });
    } catch (error) {
      dispatch({ type: 'LOAD_ERROR', error: error instanceof Error ? error.message : 'Failed to load settings' });
    }
  }, []);

  // Update settings
  const updateSettings = useCallback(async (updates: Partial<UISettings>) => {
    try {
      // Validate first
      const validationResult = await window.electronAPI?.settings.validate({ ...state.settings, ...updates });
      dispatch({ type: 'VALIDATION_RESULT', result: validationResult });
      
      if (validationResult?.isValid) {
        dispatch({ type: 'UPDATE_SETTINGS', settings: updates });
        
        // Auto-save if enabled
        if (state.settings?.autoSaveSettings) {
          await window.electronAPI?.settings.update({ ...state.settings, ...updates });
          dispatch({ type: 'SAVE_SUCCESS' });
        }
      }
    } catch (error) {
      dispatch({ type: 'SAVE_ERROR', error: error instanceof Error ? error.message : 'Failed to update settings' });
    }
  }, [state.settings]);

  // Reset to defaults
  const resetSettings = useCallback(async () => {
    dispatch({ type: 'LOAD_START' });
    try {
      await window.electronAPI?.settings.reset();
      const settings = await window.electronAPI?.settings.get();
      dispatch({ type: 'LOAD_SUCCESS', settings: settings || getDefaultSettings() });
    } catch (error) {
      dispatch({ type: 'LOAD_ERROR', error: error instanceof Error ? error.message : 'Failed to reset settings' });
    }
  }, []);

  // Save current settings
  const saveSettings = useCallback(async () => {
    if (!state.settings) return;
    
    try {
      await window.electronAPI?.settings.save(state.settings);
      dispatch({ type: 'SAVE_SUCCESS' });
    } catch (error) {
      dispatch({ type: 'SAVE_ERROR', error: error instanceof Error ? error.message : 'Failed to save settings' });
    }
  }, [state.settings]);

  // Validate settings
  const validateSettings = useCallback(async (settings: Partial<UISettings>): Promise<ValidationResult> => {
    try {
      const result = await window.electronAPI?.settings.validate(settings);
      dispatch({ type: 'VALIDATION_RESULT', result });
      return result;
    } catch (error) {
      const errorResult: ValidationResult = {
        isValid: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Validation failed',
          severity: 'error'
        }],
        warnings: []
      };
      dispatch({ type: 'VALIDATION_RESULT', result: errorResult });
      return errorResult;
    }
  }, []);

  // Export settings
  const exportSettings = useCallback(async (filePath?: string) => {
    if (!state.settings) return;
    
    try {
      if (!filePath) {
        filePath = await window.electronAPI?.files.selectConfig('export') || undefined;
        if (!filePath) return;
      }
      
      await window.electronAPI?.settings.export(filePath, state.settings);
    } catch (error) {
      dispatch({ type: 'SAVE_ERROR', error: error instanceof Error ? error.message : 'Failed to export settings' });
    }
  }, [state.settings]);

  // Import settings
  const importSettings = useCallback(async (filePath?: string) => {
    try {
      if (!filePath) {
        filePath = await window.electronAPI?.files.selectConfig('import') || undefined;
        if (!filePath) return;
      }
      
      const importedSettings = await window.electronAPI?.settings.import(filePath);
      dispatch({ type: 'LOAD_SUCCESS', settings: importedSettings });
    } catch (error) {
      dispatch({ type: 'LOAD_ERROR', error: error instanceof Error ? error.message : 'Failed to import settings' });
    }
  }, []);

  // Load presets
  const loadPresets = useCallback(async () => {
    try {
      const presets = await window.electronAPI?.settings.listPresets() || [];
      dispatch({ type: 'PRESETS_LOADED', presets });
    } catch (error) {
      console.error('Failed to load presets:', error);
    }
  }, []);

  // Save preset
  const savePreset = useCallback(async (name: string, description?: string) => {
    try {
      await window.electronAPI?.settings.savePreset(name, description);
      
      // Reload presets to get the new one
      await loadPresets();
    } catch (error) {
      dispatch({ type: 'SAVE_ERROR', error: error instanceof Error ? error.message : 'Failed to save preset' });
    }
  }, [loadPresets]);

  // Load preset
  const loadPreset = useCallback(async (presetId: string) => {
    try {
      const presetSettings = await window.electronAPI?.settings.loadPreset(presetId);
      dispatch({ type: 'LOAD_SUCCESS', settings: presetSettings });
    } catch (error) {
      dispatch({ type: 'LOAD_ERROR', error: error instanceof Error ? error.message : 'Failed to load preset' });
    }
  }, []);

  // Delete preset
  const deletePreset = useCallback(async (presetId: string) => {
    try {
      await window.electronAPI?.settings.deletePreset(presetId);
      dispatch({ type: 'PRESET_REMOVED', presetId });
    } catch (error) {
      dispatch({ type: 'SAVE_ERROR', error: error instanceof Error ? error.message : 'Failed to delete preset' });
    }
  }, []);

  // Apply theme
  const applyTheme = useCallback(async (theme: UITheme) => {
    try {
      const themeString = theme === UITheme.LIGHT ? 'light' : theme === UITheme.DARK ? 'dark' : 'system';
      await window.electronAPI?.settings.applyTheme(themeString);
      dispatch({ type: 'UPDATE_SETTINGS', settings: { theme } });
    } catch (error) {
      dispatch({ type: 'SAVE_ERROR', error: error instanceof Error ? error.message : 'Failed to apply theme' });
    }
  }, []);

  // Set language
  const setLanguage = useCallback(async (language: string) => {
    try {
      await window.electronAPI?.settings.setLanguage(language as 'uk' | 'en');
      dispatch({ type: 'UPDATE_SETTINGS', settings: { language } });
    } catch (error) {
      dispatch({ type: 'SAVE_ERROR', error: error instanceof Error ? error.message : 'Failed to set language' });
    }
  }, []);

  // Utility functions
  const clearError = useCallback(() => {
    dispatch({ type: 'RESET_ERROR' });
  }, []);

  const markSaved = useCallback(() => {
    dispatch({ type: 'SET_UNSAVED_CHANGES', hasChanges: false });
  }, []);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
    loadPresets();
  }, [loadSettings, loadPresets]);

  // Listen for settings changes from main process
  useEffect(() => {
    const unsubscribe = window.electronAPI?.settings.onChanged((updatedSettings: UISettings) => {
      dispatch({ type: 'LOAD_SUCCESS', settings: updatedSettings });
    });

    return unsubscribe;
  }, []);

  const contextValue: SettingsContextValue = {
    state,
    loadSettings,
    updateSettings,
    resetSettings,
    saveSettings,
    validateSettings,
    exportSettings,
    importSettings,
    loadPresets,
    savePreset,
    loadPreset,
    deletePreset,
    applyTheme,
    setLanguage,
    clearError,
    markSaved
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
}

// Custom hook to use settings context
export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

// Export types for use in components
export type { UISettings, SettingsState, ValidationResult, PresetInfo, UITheme };
