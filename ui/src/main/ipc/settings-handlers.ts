/**
 * Settings IPC Handlers
 * IPC communication handlers for settings management between main and renderer processes
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { SettingsManager } from '../services/SettingsManager';
import type {
  UISettings,
  ValidationError,
  PresetConfig
} from '../../shared/types';

// Simple validation result type
interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export class SettingsIpcHandlers {
  constructor(private settingsManager: SettingsManager) {
    this.registerHandlers();
  }

  private registerHandlers(): void {
    // Core Settings Operations
    ipcMain.handle('settings:get', this.handleGetSettings.bind(this));
    ipcMain.handle('settings:update', this.handleUpdateSettings.bind(this));
    ipcMain.handle('settings:reset', this.handleResetSettings.bind(this));
    ipcMain.handle('settings:validate', this.handleValidateSettings.bind(this));

    // Persistence Operations
    ipcMain.handle('settings:load', this.handleLoadSettings.bind(this));
    ipcMain.handle('settings:save', this.handleSaveSettings.bind(this));

    // Import/Export Operations
    ipcMain.handle('settings:export', this.handleExportSettings.bind(this));
    ipcMain.handle('settings:import', this.handleImportSettings.bind(this));

    // Presets Management  
    ipcMain.handle('settings:save-preset', this.handleSavePreset.bind(this));
    ipcMain.handle('settings:load-preset', this.handleLoadPreset.bind(this));
    ipcMain.handle('settings:delete-preset', this.handleDeletePreset.bind(this));
    ipcMain.handle('settings:list-presets', this.handleListPresets.bind(this));

    // Theme and UI specific operations
    ipcMain.handle('settings:apply-theme', this.handleApplyTheme.bind(this));
    ipcMain.handle('settings:get-theme', this.handleGetTheme.bind(this));
    ipcMain.handle('settings:set-language', this.handleSetLanguage.bind(this));
    ipcMain.handle('settings:get-language', this.handleGetLanguage.bind(this));
  }

  // Core Settings Operations
  private async handleGetSettings(_event: IpcMainInvokeEvent): Promise<UISettings> {
    try {
      return this.settingsManager.getCurrentSettings();
    } catch (error) {
      console.error('Settings get error:', error);
      throw new Error(`Failed to get settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleUpdateSettings(_event: IpcMainInvokeEvent, updates: Partial<UISettings>): Promise<void> {
    try {
      await this.settingsManager.updateSettings(updates);
    } catch (error) {
      console.error('Settings update error:', error);
      throw new Error(`Failed to update settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleResetSettings(_event: IpcMainInvokeEvent): Promise<void> {
    try {
      await this.settingsManager.resetToDefaults();
    } catch (error) {
      console.error('Settings reset error:', error);
      throw new Error(`Failed to reset settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleValidateSettings(_event: IpcMainInvokeEvent, settings: Partial<UISettings>): Promise<ValidationResult> {
    try {
      return this.settingsManager.validateSettings(settings);
    } catch (error) {
      console.error('Settings validation error:', error);
      throw new Error(`Failed to validate settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Persistence Operations
  private async handleLoadSettings(_event: IpcMainInvokeEvent): Promise<UISettings> {
    try {
      return this.settingsManager.loadFromStore();
    } catch (error) {
      console.error('Settings load error:', error);
      throw new Error(`Failed to load settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleSaveSettings(_event: IpcMainInvokeEvent, settings: UISettings): Promise<void> {
    try {
      await this.settingsManager.saveToStore(settings);
    } catch (error) {
      console.error('Settings save error:', error);
      throw new Error(`Failed to save settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Import/Export Operations
  private async handleExportSettings(_event: IpcMainInvokeEvent, filePath: string, settings?: UISettings): Promise<void> {
    try {
      const settingsToExport = settings || this.settingsManager.getCurrentSettings();
      await this.settingsManager.exportToFile(filePath, settingsToExport);
    } catch (error) {
      console.error('Settings export error:', error);
      throw new Error(`Failed to export settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleImportSettings(_event: IpcMainInvokeEvent, filePath: string): Promise<UISettings> {
    try {
      return await this.settingsManager.importFromFile(filePath);
    } catch (error) {
      console.error('Settings import error:', error);
      throw new Error(`Failed to import settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Presets Management
  private async handleSavePreset(_event: IpcMainInvokeEvent, name: string, description?: string): Promise<void> {
    try {
      await this.settingsManager.savePreset(name, description);
    } catch (error) {
      console.error('Preset save error:', error);
      throw new Error(`Failed to save preset: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleLoadPreset(_event: IpcMainInvokeEvent, presetId: string): Promise<UISettings> {
    try {
      return await this.settingsManager.loadPreset(presetId);
    } catch (error) {
      console.error('Preset load error:', error);
      throw new Error(`Failed to load preset: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleDeletePreset(_event: IpcMainInvokeEvent, presetId: string): Promise<void> {
    try {
      await this.settingsManager.deletePreset(presetId);
    } catch (error) {
      console.error('Preset delete error:', error);
      throw new Error(`Failed to delete preset: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleListPresets(_event: IpcMainInvokeEvent): Promise<PresetInfo[]> {
    try {
      return await this.settingsManager.listPresets();
    } catch (error) {
      console.error('Presets list error:', error);
      throw new Error(`Failed to list presets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Theme and UI Specific Operations
  private async handleApplyTheme(_event: IpcMainInvokeEvent, theme: 'light' | 'dark' | 'system'): Promise<void> {
    try {
      const currentSettings = this.settingsManager.getCurrentSettings();
      await this.settingsManager.updateSettings({
        ...currentSettings,
        theme
      });
    } catch (error) {
      console.error('Theme apply error:', error);
      throw new Error(`Failed to apply theme: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleGetTheme(_event: IpcMainInvokeEvent): Promise<'light' | 'dark' | 'system'> {
    try {
      const settings = this.settingsManager.getCurrentSettings();
      return settings.theme;
    } catch (error) {
      console.error('Get theme error:', error);
      throw new Error(`Failed to get theme: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleSetLanguage(_event: IpcMainInvokeEvent, language: 'uk' | 'en'): Promise<void> {
    try {
      const currentSettings = this.settingsManager.getCurrentSettings();
      await this.settingsManager.updateSettings({
        ...currentSettings,
        language
      });
    } catch (error) {
      console.error('Language set error:', error);
      throw new Error(`Failed to set language: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleGetLanguage(_event: IpcMainInvokeEvent): Promise<'uk' | 'en'> {
    try {
      const settings = this.settingsManager.getCurrentSettings();
      return settings.language;
    } catch (error) {
      console.error('Get language error:', error);
      throw new Error(`Failed to get language: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Cleanup method
  removeHandlers(): void {
    const handlerNames = [
      'settings:get',
      'settings:update', 
      'settings:reset',
      'settings:validate',
      'settings:load',
      'settings:save',
      'settings:export',
      'settings:import',
      'settings:save-preset',
      'settings:load-preset',
      'settings:delete-preset',
      'settings:list-presets',
      'settings:apply-theme',
      'settings:get-theme',
      'settings:set-language',
      'settings:get-language'
    ];

    handlerNames.forEach(name => {
      ipcMain.removeHandler(name);
    });
  }
}
