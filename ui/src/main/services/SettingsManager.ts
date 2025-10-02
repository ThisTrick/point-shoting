/**
 * SettingsManager Implementation
 * Централізоване керування користувацькими налаштуваннями з validation, persistence та synchronization
 */

import Store, { Schema } from 'electron-store';
import { promises as fs } from 'fs';
import { EventEmitter } from 'events';
import { 
  UISettings, 
  ValidationResult, 
  ValidationError, 
  ValidationWarning,
  PresetInfo,
  PresetConfig,
  ParticleDensity,
  AnimationSpeed,
  ColorMappingMode
} from '@shared/types';

export class SettingsManager extends EventEmitter {
  private store: Store<{ settings: UISettings; presets: Record<string, PresetConfig> }>;
  private currentSettings: UISettings;
  private readonly SETTINGS_VERSION = '1.0.0';

  constructor() {
    super();
    
    this.store = new Store<{ settings: UISettings; presets: Record<string, PresetConfig> }>({
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
      const errors = validation.errors;
      if (errors.length > 0) {
        this.emit('validationError', errors[0]);
        throw new Error(`Settings validation failed: ${errors[0]?.message || 'Unknown error'}`);
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
        message: 'Theme must be one of: light, dark, system'
      });
    }

    // Language validation  
    if (settings.language && !['uk', 'en'].includes(settings.language)) {
      errors.push({
        field: 'language',
        message: 'Language must be one of: uk, en'
      });
    }

    // Window bounds validation
    if (settings.windowBounds) {
      const { width, height } = settings.windowBounds;
      if (width < 800 || height < 600) {
        warnings.push({
          field: 'windowBounds',
          message: 'Window size below recommended minimum (800x600)'
        });
      }
      if (width > 3840 || height > 2160) {
        warnings.push({
          field: 'windowBounds', 
          message: 'Window size exceeds common display limits'
        });
      }
    }

    // Animation settings validation
    if (settings.animation?.density && !['low', 'medium', 'high'].includes(settings.animation.density)) {
      errors.push({
        field: 'animation.density',
        message: 'Particle density must be one of: low, medium, high'
      });
    }

    if (settings.animation?.speed && !['slow', 'normal', 'fast'].includes(settings.animation.speed)) {
      errors.push({
        field: 'animation.speed',
        message: 'Animation speed must be one of: slow, normal, fast'
      });
    }

    if (settings.animation?.colorMode && !['stylish', 'precise'].includes(settings.animation.colorMode)) {
      errors.push({
        field: 'animation.colorMode',
        message: 'Color mode must be one of: stylish, precise'
      });
    }

    // Interface validation - no specific validation needed for boolean flags
    // All interface properties are boolean flags with no constraints

    // Watermark validation
    if (settings.watermark) {
      if (settings.watermark.opacity < 0 || settings.watermark.opacity > 1) {
        warnings.push({
          field: 'watermark.opacity',
          message: 'Watermark opacity must be between 0 and 1'
        });
      }
      if (settings.watermark.scale < 0.1 || settings.watermark.scale > 5.0) {
        warnings.push({
          field: 'watermark.scale',
          message: 'Watermark scale must be between 0.1 and 5.0'
        });
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
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
        version: preset.version,
        isBuiltIn: false
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
      showAdvancedControls: false,
      enableKeyboardShortcuts: true,
      autoSaveSettings: true,
      windowBounds: { width: 1200, height: 800 },
      animation: {
        density: ParticleDensity.MEDIUM,
        speed: AnimationSpeed.NORMAL,
        colorMode: ColorMappingMode.ORIGINAL,
        watermark: false,
        hud: true,
        background: '#000000',
        blur: 0,
        breathing: true
      },
      performance: {
        targetFPS: 60,
        particleLimit: 10000,
        enableGPU: true,
        lowPowerMode: false
      },
      interface: {
        showFPS: true,
        showParticleCount: true,
        enableAnimations: true,
        compactMode: false
      },
      watermark: {
        enabled: false,
        position: 'bottom-right',
        opacity: 0.7,
        scale: 1.0
      }
    };
  }

  private mergeWithDefaults(stored: Partial<UISettings>): UISettings {
    return { ...this.getDefaultSettings(), ...stored };
  }

  private getStoreSchema(): Schema<{ settings: UISettings; presets: Record<string, PresetConfig> }> {
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
          animation: {
            type: 'object',
            properties: {
              density: { type: 'string', enum: ['low', 'medium', 'high'] },
              speed: { type: 'string', enum: ['slow', 'normal', 'fast'] },
              colorMode: { type: 'string', enum: ['stylish', 'precise'] }
            },
            required: ['density', 'speed', 'colorMode']
          },
          interface: {
            type: 'object',
            properties: {
              backgroundType: { type: 'string', enum: ['solid', 'gradient', 'image'] },
              backgroundConfig: {
                type: 'object',
                properties: {
                  solid: {
                    type: 'object',
                    properties: { color: { type: 'string' } }
                  },
                  gradient: {
                    type: 'object',
                    properties: {
                      colors: { type: 'array', items: { type: 'string' } },
                      stops: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            position: { type: 'number', minimum: 0, maximum: 1 },
                            color: { type: 'string' }
                          }
                        }
                      }
                    }
                  },
                  image: {
                    type: 'object',
                    properties: { path: { type: 'string' } }
                  }
                }
              }
            },
            required: ['backgroundType']
          },
          performance: {
            type: 'object',
            properties: {
              debugHudEnabled: { type: 'boolean' },
              performanceWarnings: { type: 'boolean' },
              autoSave: { type: 'boolean' }
            },
            required: ['debugHudEnabled', 'performanceWarnings', 'autoSave']
          },
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
          'theme', 'language', 'windowBounds', 'animation', 
          'interface', 'performance', 'recentImages', 'recentPresets'
        ]
      },
      presets: {
        type: 'object',
        patternProperties: {
          '.*': {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              settings: { type: 'object' },
              createdAt: { type: 'string' },
              version: { type: 'string' }
            },
            required: ['id', 'name', 'settings', 'createdAt', 'version']
          }
        }
      }
    };
  }
}
