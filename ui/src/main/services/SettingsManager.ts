/**
 * SettingsManager Implementation
 * Централізоване керування користувацькими налаштуваннями з validation, persistence та synchronization
 */

import Store from 'electron-store';
import { promises as fs } from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import { 
  UISettings, 
  ValidationResult, 
  ValidationError, 
  ValidationWarning,
  PresetInfo,
  PresetConfig,
  BackgroundConfig 
} from '@shared/types';

export class SettingsManager extends EventEmitter {
  private store: Store<{ settings: UISettings; presets: Record<string, PresetConfig> }>;
  private currentSettings: UISettings;
  private readonly SETTINGS_VERSION = '1.0.0';

  constructor() {
    super();
    
    this.store = new Store({
      name: 'point-shoting-ui',
      defaults: {
        settings: this.getDefaultSettings(),
        presets: {}
      },
      schema: this.getStoreSchema()
    });

    this.currentSettings = this.loadFromStore();
  }

  // Core Settings Operations
  getCurrentSettings(): UISettings {
    return { ...this.currentSettings };
  }

  async updateSettings(updates: Partial<UISettings>): Promise<void> {
    const newSettings = { ...this.currentSettings, ...updates };
    const validation = this.validateSettings(newSettings);
    
    if (!validation.isValid) {
      const errors = validation.errors.filter(e => e.severity === 'error');
      if (errors.length > 0) {
        this.emit('validationError', errors[0]);
        throw new Error(`Settings validation failed: ${errors[0].message}`);
      }
    }

    this.currentSettings = newSettings;
    await this.saveToStore(newSettings);
    this.emit('settingsChanged', { ...this.currentSettings });
  }

  async resetToDefaults(): Promise<void> {
    const defaults = this.getDefaultSettings();
    await this.updateSettings(defaults);
  }

  validateSettings(settings: Partial<UISettings>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Theme validation
    if (settings.theme && !['light', 'dark', 'system'].includes(settings.theme)) {
      errors.push({
        field: 'theme',
        message: 'Theme must be one of: light, dark, system',
        severity: 'error'
      });
    }

    // Language validation  
    if (settings.language && !['uk', 'en'].includes(settings.language)) {
      errors.push({
        field: 'language',
        message: 'Language must be one of: uk, en',
        severity: 'error'
      });
    }

    // Window bounds validation
    if (settings.windowBounds) {
      const { width, height } = settings.windowBounds;
      if (width < 800 || height < 600) {
        warnings.push({
          field: 'windowBounds',
          message: 'Window size below recommended minimum (800x600)',
          severity: 'warning'
        });
      }
      if (width > 3840 || height > 2160) {
        warnings.push({
          field: 'windowBounds', 
          message: 'Window size exceeds common display limits',
          severity: 'warning'
        });
      }
    }

    // Animation settings validation
    if (settings.particleDensity && !['low', 'medium', 'high'].includes(settings.particleDensity)) {
      errors.push({
        field: 'particleDensity',
        message: 'Particle density must be one of: low, medium, high',
        severity: 'error'
      });
    }

    if (settings.animationSpeed && !['slow', 'normal', 'fast'].includes(settings.animationSpeed)) {
      errors.push({
        field: 'animationSpeed',
        message: 'Animation speed must be one of: slow, normal, fast',
        severity: 'error'
      });
    }

    if (settings.colorMode && !['stylish', 'precise'].includes(settings.colorMode)) {
      errors.push({
        field: 'colorMode',
        message: 'Color mode must be one of: stylish, precise',
        severity: 'error'
      });
    }

    // Background validation
    if (settings.backgroundType && !['solid', 'gradient', 'image'].includes(settings.backgroundType)) {
      errors.push({
        field: 'backgroundType',
        message: 'Background type must be one of: solid, gradient, image',
        severity: 'error'
      });
    }

    if (settings.backgroundConfig) {
      const bgValidation = this.validateBackgroundConfig(settings.backgroundConfig);
      errors.push(...bgValidation.errors);
      warnings.push(...bgValidation.warnings);
    }

    // Recent files validation
    if (settings.recentImages && settings.recentImages.length > 20) {
      warnings.push({
        field: 'recentImages',
        message: 'Too many recent images, performance may be affected',
        severity: 'warning'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Persistence
  loadFromStore(): UISettings {
    try {
      const stored = this.store.get('settings');
      const merged = this.mergeWithDefaults(stored);
      const validation = this.validateSettings(merged);
      
      if (!validation.isValid) {
        console.warn('Stored settings invalid, using defaults:', validation.errors);
        return this.getDefaultSettings();
      }
      
      return merged;
    } catch (error) {
      console.error('Failed to load settings from store:', error);
      return this.getDefaultSettings();
    }
  }

  async saveToStore(settings: UISettings): Promise<void> {
    try {
      this.store.set('settings', settings);
    } catch (error) {
      console.error('Failed to save settings to store:', error);
      throw new Error('Settings could not be saved');
    }
  }

  // Import/Export
  async exportToFile(filePath: string, settings: UISettings): Promise<void> {
    try {
      const exportData = {
        version: this.SETTINGS_VERSION,
        timestamp: new Date().toISOString(),
        settings,
        metadata: {
          exportedFrom: 'Point Shoting UI',
          platform: process.platform
        }
      };

      await fs.writeFile(filePath, JSON.stringify(exportData, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to export settings:', error);
      throw new Error('Settings export failed');
    }
  }

  async importFromFile(filePath: string): Promise<UISettings> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      if (!data.settings) {
        throw new Error('Invalid settings file format');
      }

      const validation = this.validateSettings(data.settings);
      if (!validation.isValid) {
        throw new Error(`Invalid settings: ${validation.errors[0]?.message}`);
      }

      return data.settings;
    } catch (error) {
      console.error('Failed to import settings:', error);
      throw new Error('Settings import failed');
    }
  }

  // Presets Management
  async savePreset(name: string, description?: string): Promise<void> {
    try {
      const presetId = `preset_${Date.now()}`;
      const presets = this.store.get('presets') || {};
      
      presets[presetId] = {
        id: presetId,
        name,
        description: description || '',
        settings: { ...this.currentSettings },
        createdAt: new Date().toISOString(),
        version: this.SETTINGS_VERSION
      };

      this.store.set('presets', presets);
    } catch (error) {
      console.error('Failed to save preset:', error);
      throw new Error('Preset could not be saved');
    }
  }

  async loadPreset(presetId: string): Promise<UISettings> {
    try {
      const presets = this.store.get('presets') || {};
      const preset = presets[presetId];
      
      if (!preset) {
        throw new Error('Preset not found');
      }

      const validation = this.validateSettings(preset.settings);
      if (!validation.isValid) {
        throw new Error('Preset contains invalid settings');
      }

      return preset.settings;
    } catch (error) {
      console.error('Failed to load preset:', error);
      throw error;
    }
  }

  async deletePreset(presetId: string): Promise<void> {
    try {
      const presets = this.store.get('presets') || {};
      delete presets[presetId];
      this.store.set('presets', presets);
    } catch (error) {
      console.error('Failed to delete preset:', error);
      throw new Error('Preset could not be deleted');
    }
  }

  async listPresets(): Promise<PresetInfo[]> {
    try {
      const presets = this.store.get('presets') || {};
      return Object.values(presets).map(preset => ({
        id: preset.id,
        name: preset.name,
        description: preset.description,
        createdAt: preset.createdAt,
        version: preset.version
      }));
    } catch (error) {
      console.error('Failed to list presets:', error);
      return [];
    }
  }

  // Change Notifications
  onSettingsChanged(callback: (settings: UISettings) => void): () => void {
    this.on('settingsChanged', callback);
    return () => this.removeListener('settingsChanged', callback);
  }

  onValidationError(callback: (error: ValidationError) => void): () => void {
    this.on('validationError', callback);
    return () => this.removeListener('validationError', callback);
  }

  // Private Helper Methods
  private getDefaultSettings(): UISettings {
    return {
      theme: 'system',
      language: 'en',
      windowBounds: { width: 1200, height: 800 },
      particleDensity: 'medium',
      animationSpeed: 'normal',
      colorMode: 'stylish',
      backgroundType: 'solid',
      backgroundConfig: {
        solid: { color: '#000000' }
      },
      debugHudEnabled: false,
      performanceWarnings: true,
      autoSave: true,
      recentImages: [],
      recentPresets: []
    };
  }

  private mergeWithDefaults(stored: Partial<UISettings>): UISettings {
    return { ...this.getDefaultSettings(), ...stored };
  }

  private validateBackgroundConfig(config: BackgroundConfig): { errors: ValidationError[], warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (config.solid?.color && !/^#[0-9a-fA-F]{6}$/.test(config.solid.color)) {
      errors.push({
        field: 'backgroundConfig.solid.color',
        message: 'Color must be a valid hex color (#RRGGBB)',
        severity: 'error'
      });
    }

    if (config.gradient) {
      if (config.gradient.startColor && !/^#[0-9a-fA-F]{6}$/.test(config.gradient.startColor)) {
        errors.push({
          field: 'backgroundConfig.gradient.startColor',
          message: 'Start color must be a valid hex color',
          severity: 'error'
        });
      }
      if (config.gradient.endColor && !/^#[0-9a-fA-F]{6}$/.test(config.gradient.endColor)) {
        errors.push({
          field: 'backgroundConfig.gradient.endColor', 
          message: 'End color must be a valid hex color',
          severity: 'error'
        });
      }
      if (config.gradient.direction && !['horizontal', 'vertical', 'radial'].includes(config.gradient.direction)) {
        errors.push({
          field: 'backgroundConfig.gradient.direction',
          message: 'Gradient direction must be horizontal, vertical, or radial',
          severity: 'error'
        });
      }
    }

    if (config.image) {
      if (config.image.blurRadius < 0 || config.image.blurRadius > 25) {
        errors.push({
          field: 'backgroundConfig.image.blurRadius',
          message: 'Blur radius must be between 0 and 25',
          severity: 'error'
        });
      }
      if (config.image.opacity < 0 || config.image.opacity > 1) {
        errors.push({
          field: 'backgroundConfig.image.opacity',
          message: 'Opacity must be between 0 and 1',
          severity: 'error'
        });
      }
    }

    return { errors, warnings };
  }

  private getStoreSchema() {
    return {
      settings: {
        type: 'object',
        properties: {
          theme: { type: 'string', enum: ['light', 'dark', 'system'] },
          language: { type: 'string', enum: ['uk', 'en'] },
          windowBounds: {
            type: 'object',
            properties: {
              width: { type: 'number', minimum: 400 },
              height: { type: 'number', minimum: 300 },
              x: { type: 'number' },
              y: { type: 'number' }
            },
            required: ['width', 'height']
          },
          particleDensity: { type: 'string', enum: ['low', 'medium', 'high'] },
          animationSpeed: { type: 'string', enum: ['slow', 'normal', 'fast'] },
          colorMode: { type: 'string', enum: ['stylish', 'precise'] },
          backgroundType: { type: 'string', enum: ['solid', 'gradient', 'image'] },
          debugHudEnabled: { type: 'boolean' },
          performanceWarnings: { type: 'boolean' },
          autoSave: { type: 'boolean' },
          recentImages: {
            type: 'array',
            items: { type: 'string' },
            maxItems: 50
          },
          recentPresets: {
            type: 'array', 
            items: { type: 'string' },
            maxItems: 20
          }
        },
        required: [
          'theme', 'language', 'windowBounds', 'particleDensity', 
          'animationSpeed', 'colorMode', 'backgroundType'
        ]
      }
    };
  }
}
