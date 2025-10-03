/**
 * useSettings Hook
 * Custom hook for managing UI settings with validation and presets
 */

import { useContext, useCallback } from 'react';
import { SettingsContext } from '../contexts/SettingsContext';
import type { UISettings, ValidationResult } from '@shared/types';
import { ParticleDensity, AnimationSpeed, ColorMappingMode } from '@shared/types';

interface SettingsHookOptions {
  autoSave?: boolean;
  validateOnChange?: boolean;
  debounceDelay?: number;
}

export function useSettings(options: SettingsHookOptions = {}) {
  const context = useContext(SettingsContext);
  
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }

  const {
    state,
    updateSettings,
    resetSettings,
    exportSettings,
    importSettings,
    validateSettings,
    savePreset,
    loadPreset,
    deletePreset,
    applyTheme,
    setLanguage,
    clearError
  } = context;

  const {
    validateOnChange = true,
  } = options;

  // Validation helpers
  const validateSetting = useCallback(async (key: keyof UISettings, value: any): Promise<ValidationResult> => {
    const testSettings = { ...state.settings, [key]: value };
    const result = await validateSettings(testSettings);
    
    return result; // Return full ValidationResult, not transformed
  }, [state.settings, validateSettings]);

  // Individual setting updaters with validation
  const updateSetting = useCallback(async (key: keyof UISettings, value: any, validate = validateOnChange) => {
    if (validate) {
      const validation = await validateSetting(key, value);
      if (!validation.isValid) {
        const errorMessages = validation.errors.map(e => e.message).join(', ');
        throw new Error(`Invalid ${key}: ${errorMessages}`);
      }
    }

    const updates = { [key]: value };
    return updateSettings(updates); // updateSettings doesn't take autoSave param
  }, [validateSetting, updateSettings, validateOnChange]);

  // Batch setting updates
  const updateMultipleSettings = useCallback(async (updates: Partial<UISettings>, validate = validateOnChange) => {
    if (validate) {
      const testSettings = { ...state.settings, ...updates };
      const result = await validateSettings(testSettings);
      if (!result.isValid) {
        const errorMessages = result.errors.map(e => e.message).join(', ');
        throw new Error(`Invalid settings: ${errorMessages}`);
      }
    }

    return updateSettings(updates); // updateSettings doesn't take autoSave param
  }, [state.settings, validateSettings, updateSettings, validateOnChange]);

  // Animation settings helpers
  const updateAnimationSettings = useCallback((updates: Partial<UISettings['animation']>) => {
    return updateSetting('animation', { ...state.settings?.animation, ...updates });
  }, [state.settings?.animation, updateSetting]);

  const updatePerformanceSettings = useCallback((updates: Partial<UISettings['performance']>) => {
    return updateSetting('performance', { ...state.settings?.performance, ...updates });
  }, [state.settings?.performance, updateSetting]);

  const updateInterfaceSettings = useCallback((updates: Partial<UISettings['interface']>) => {
    return updateSetting('interface', { ...state.settings?.interface, ...updates });
  }, [state.settings?.interface, updateSetting]);

  const updateWatermarkSettings = useCallback((updates: Partial<UISettings['watermark']>) => {
    return updateSetting('watermark', { ...state.settings?.watermark, ...updates });
  }, [state.settings?.watermark, updateSetting]);

  // Quick setters for common operations
  const setDensity = useCallback((density: ParticleDensity) => {
    return updateAnimationSettings({ density });
  }, [updateAnimationSettings]);

  const setSpeed = useCallback((speed: AnimationSpeed) => {
    return updateAnimationSettings({ speed });
  }, [updateAnimationSettings]);

  const setColorMode = useCallback((colorMode: ColorMappingMode) => {
    return updateAnimationSettings({ colorMode });
  }, [updateAnimationSettings]);

  const toggleWatermark = useCallback((enabled: boolean) => {
    return updateWatermarkSettings({ enabled });
  }, [updateWatermarkSettings]);

  const toggleHUD = useCallback((enabled: boolean) => {
    return updateAnimationSettings({ hud: enabled });
  }, [updateAnimationSettings]);

  const toggleBreathing = useCallback((enabled: boolean) => {
    return updateAnimationSettings({ breathing: enabled });
  }, [updateAnimationSettings]);

  // Preset management helpers
  const createPreset = useCallback(async (name: string, description?: string, settings?: Partial<UISettings>) => {
    const presetSettings = settings || state.settings;
    if (!presetSettings) return;
    
    // First save the settings, then create preset
    await updateMultipleSettings(presetSettings);
    return savePreset(name, description);
  }, [state.settings, updateMultipleSettings, savePreset]);

  const applyPreset = useCallback(async (presetId: string) => {
    await loadPreset(presetId);
    // The preset loading will update the settings through the context
  }, [loadPreset]);

  // Theme and localization helpers
  const switchTheme = useCallback((theme: 'light' | 'dark' | 'system') => {
    return applyTheme(theme);
  }, [applyTheme]);

  const switchLanguage = useCallback((language: 'uk' | 'en') => {
    return setLanguage(language);
  }, [setLanguage]);

  // Import/Export helpers with validation
  const exportToFile = useCallback(async (filePath?: string, settingsToExport?: Partial<UISettings>) => {
    const settings = settingsToExport || state.settings;
    
    if (!settings) return;
    
    // Validate before export
    const validation = await validateSettings(settings);
    if (!validation.isValid) {
      throw new Error(`Cannot export invalid settings: ${Object.values(validation.errors || {}).flat().join(', ')}`);
    }
    
    return exportSettings(filePath);
  }, [state.settings, validateSettings, exportSettings]);

  const importFromFile = useCallback(async (filePath?: string) => {
    await importSettings(filePath);
    // Settings will be updated through the context
  }, [importSettings]);

  // Reset helpers
  const resetToDefaults = useCallback(() => {
    return resetSettings();
  }, [resetSettings]);

  // State getters with computed values
  const isModified = state.settings !== state.originalSettings;
  const hasUnsavedChanges = state.hasUnsavedChanges;
  const validationStatus = state.validationResult;

  // Current settings with easy access
  const {
    animation: animationSettings,
    performance: performanceSettings,
    interface: interfaceSettings,
    watermark: watermarkSettings
  } = state.settings || {};

  // Loading states
  const isLoading = state.isLoading || state.isSaving || state.isExporting || state.isImporting;
  const isSaving = state.isSaving;
  const isValidating = state.isValidating;

  return {
    // Current state
    settings: state.settings,
    animationSettings,
    performanceSettings,
    interfaceSettings,
    watermarkSettings,
    
    // Metadata
    presets: state.presets,
    currentTheme: state.currentTheme,
    currentLanguage: state.currentLanguage,
    
    // Status
    isModified,
    hasUnsavedChanges,
    validationStatus,
    isLoading,
    isSaving,
    isValidating,
    error: state.error,
    
    // Core operations
    updateSetting,
    updateMultipleSettings,
    resetToDefaults,
    validateSetting,
    validateSettings,
    clearError,
    
    // Section updates
    updateAnimationSettings,
    updatePerformanceSettings,
    updateInterfaceSettings,
    updateWatermarkSettings,
    
    // Quick setters
    setDensity,
    setSpeed,
    setColorMode,
    toggleWatermark,
    toggleHUD,
    toggleBreathing,
    
    // Presets
    createPreset,
    applyPreset,
    deletePreset,
    
    // Theme & Language
    switchTheme,
    switchLanguage,
    
    // Import/Export
    exportToFile,
    importFromFile
  };
}
