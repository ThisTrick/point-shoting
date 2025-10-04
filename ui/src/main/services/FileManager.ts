/**
 * FileManager Implementation
 * Централізоване керування файловими операціями для зображень, конфігурацій та ресурсів
 */

import { dialog } from 'electron';
import { promises as fs, constants } from 'fs';
import * as fsSync from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import Store from 'electron-store';
import sharp from 'sharp';
import { 
  ImageFileResult, 
  ImageValidationResult, 
  ImageMetadata,
  WatermarkFileResult,
  WatermarkValidationResult,
  RecentFileInfo,
  FileStats,
  FilePermissions,
  PresetConfig,
  ConfigValidationResult,
  ValidationError,
  FileChangeEvent,
  FileWatcher
} from '@shared/types';

export class FileManager extends EventEmitter {
  private recentFilesStore: Store<{ recentImages: RecentFileInfo[] }>;
  private fileWatchers: Map<string, FileWatcher> = new Map();
  private readonly MAX_RECENT_FILES = 20;
  private readonly SUPPORTED_IMAGE_FORMATS = ['.png', '.jpg', '.jpeg'];
  private readonly MAX_IMAGE_SIZE = 4096; // pixels
  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  constructor() {
    super();
    
    this.recentFilesStore = new Store<{ recentImages: RecentFileInfo[] }>({
      name: 'recent-files',
      defaults: {
        recentImages: [] as RecentFileInfo[]
      }
    });
  }

  // Image Operations
  async selectImageFile(): Promise<ImageFileResult | null> {
    try {
      const result = await dialog.showOpenDialog({
        title: 'Select Image File',
        filters: [
          {
            name: 'Images',
            extensions: ['png', 'jpg', 'jpeg']
          },
          {
            name: 'PNG Images',
            extensions: ['png'] 
          },
          {
            name: 'JPEG Images',
            extensions: ['jpg', 'jpeg']
          }
        ],
        properties: ['openFile']
      });

      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }

      const filePath = result.filePaths[0];
      if (!filePath) {
        return null;
      }
      
      const filename = path.basename(filePath);
      const stats = await fs.stat(filePath);
      
      const validationResult = await this.validateImageFile(filePath);

      if (validationResult.isValid) {
        await this.addToRecentImages(filePath);
      }

      return {
        success: true,
        path: filePath,
        filePath: filePath,  // Backward compatibility
        filename,
        fileName: filename,  // Backward compatibility
        fileSize: stats.size
      };

    } catch (error) {
      console.error('Failed to select image file:', error);
      throw new Error('Image file selection failed');
    }
  }

  async validateImageFile(filePath: string): Promise<ImageValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    let metadata: ImageMetadata | undefined;

    // Check file extension first (can be done without file access)
    const ext = path.extname(filePath).toLowerCase();
    if (!this.SUPPORTED_IMAGE_FORMATS.includes(ext)) {
      errors.push({
        field: 'format',
        message: `Unsupported format. Supported: ${this.SUPPORTED_IMAGE_FORMATS.join(', ')}`,
        severity: 'error'
      });
      return { isValid: false, errors, warnings };
    }

    try {
      // Check file exists
      await fs.access(filePath, constants.F_OK);

      // Get file stats
      const stats = await fs.stat(filePath);
      if (stats.size > this.MAX_FILE_SIZE) {
        errors.push({
          field: 'fileSize',
          message: `File too large (${(stats.size / 1024 / 1024).toFixed(1)}MB). Maximum: ${this.MAX_FILE_SIZE / 1024 / 1024}MB`,
          severity: 'error'
        });
      }

      // Get image metadata using sharp
      try {
        const sharpImage = sharp(filePath);
        const sharpMetadata = await sharpImage.metadata();
        
        if (!sharpMetadata.width || !sharpMetadata.height) {
          errors.push({
            field: 'dimensions',
            message: 'Could not determine image dimensions',
            severity: 'error'
          });
          return { isValid: false, errors, warnings };
        }

        // Check dimensions
        if (sharpMetadata.width > this.MAX_IMAGE_SIZE || sharpMetadata.height > this.MAX_IMAGE_SIZE) {
          errors.push({
            field: 'dimensions',
            message: `Image too large (${sharpMetadata.width}x${sharpMetadata.height}). Maximum: ${this.MAX_IMAGE_SIZE}x${this.MAX_IMAGE_SIZE}`,
            severity: 'error'
          });
        }

        // Check for very small images
        if (sharpMetadata.width < 100 || sharpMetadata.height < 100) {
          warnings.push({
            field: 'dimensions',
            message: 'Image is very small. Animation quality may be affected.',
            severity: 'warning'
          });
        }

        // Extract dominant colors (simplified) - not implemented yet
        // const rawBuffer = await sharpImage
        //   .resize(100, 100, { fit: 'inside' })
        //   .raw()
        //   .toBuffer({ resolveWithObject: true });
        
        // Simple dominant color extraction (placeholder)
        const dominantColors = ['#FF0000', '#00FF00', '#0000FF']; // TODO: Implement proper color extraction

        metadata = {
          width: sharpMetadata.width,
          height: sharpMetadata.height,
          format: (sharpMetadata.format || ext.slice(1)).toUpperCase(),
          colorSpace: sharpMetadata.space || 'srgb',
          hasAlpha: sharpMetadata.hasAlpha || false,
          dominantColors
        };

      } catch (sharpError) {
        errors.push({
          field: 'format',
          message: 'Invalid or corrupted image file',
          severity: 'error'
        });
      }

    } catch (error) {
      errors.push({
        field: 'file',
        message: 'File not accessible or does not exist',
        severity: 'error'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metadata
    };
  }

  async generateImagePreview(filePath: string, maxSize: number = 200): Promise<string> {
    try {
      const buffer = await sharp(filePath)
        .resize(maxSize, maxSize, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .png()
        .toBuffer();

      return `data:image/png;base64,${buffer.toString('base64')}`;
    } catch (error) {
      console.error('Failed to generate preview:', error);
      throw new Error('Preview generation failed');
    }
  }

  async getImageMetadata(filePath: string): Promise<ImageMetadata> {
    try {
      const validation = await this.validateImageFile(filePath);
      if (!validation.isValid || !validation.metadata) {
        throw new Error('Invalid image file or metadata extraction failed');
      }
      return validation.metadata;
    } catch (error) {
      console.error('Failed to get image metadata:', error);
      throw error;
    }
  }

  // Configuration Operations  
  async selectConfigFile(mode: 'import' | 'export'): Promise<string | null> {
    try {
      if (mode === 'import') {
        const result = await dialog.showOpenDialog({
          title: 'Import Configuration',
          filters: [
            {
              name: 'Configuration Files',
              extensions: ['json']
            }
          ],
          properties: ['openFile']
        });

        return result.canceled ? null : (result.filePaths[0] || null);
      } else {
        const result = await dialog.showSaveDialog({
          title: 'Export Configuration',
          defaultPath: `preset_${new Date().toISOString().split('T')[0]}.json`,
          filters: [
            {
              name: 'Configuration Files',
              extensions: ['json']
            }
          ]
        });

        return result.canceled ? null : result.filePath || null;
      }
    } catch (error) {
      console.error('Failed to select config file:', error);
      throw new Error('Configuration file selection failed');
    }
  }

  async saveConfigFile(filePath: string, config: PresetConfig): Promise<void> {
    try {
      const configData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        config,
        metadata: {
          createdBy: 'Point Shoting UI',
          platform: process.platform
        }
      };

      await fs.writeFile(filePath, JSON.stringify(configData, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save config file:', error);
      throw new Error('Configuration file save failed');
    }
  }

  async loadConfigFile(filePath: string): Promise<PresetConfig> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      if (!data.config) {
        throw new Error('Invalid configuration file format');
      }

      return data.config;
    } catch (error) {
      console.error('Failed to load config file:', error);
      throw new Error('Configuration file load failed');
    }
  }

  async validateConfigFile(filePath: string): Promise<ConfigValidationResult> {
    const errors: ValidationError[] = [];

    try {
      await fs.access(filePath, constants.F_OK);

      if (path.extname(filePath).toLowerCase() !== '.json') {
        errors.push({
          field: 'format',
          message: 'Configuration file must be in JSON format',
          severity: 'error'
        });
        return { isValid: false, errors, warnings: [], versionCompatible: true };
      }

      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      if (!data.config) {
        errors.push({
          field: 'structure',
          message: 'Configuration file missing required "config" property',
          severity: 'error'
        });
      }

      // TODO: Add more detailed validation based on PresetConfig schema

    } catch (error) {
      if (error instanceof SyntaxError) {
        errors.push({
          field: 'format',
          message: 'Invalid JSON format',
          severity: 'error'
        });
      } else {
        errors.push({
          field: 'file',
          message: 'File not accessible or does not exist',
          severity: 'error'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
      versionCompatible: true
    };
  }

  // Watermark Operations
  async selectWatermarkFile(): Promise<WatermarkFileResult | null> {
    try {
      const result = await dialog.showOpenDialog({
        title: 'Select Watermark Image',
        filters: [
          {
            name: 'Images',
            extensions: ['png']
          }
        ],
        properties: ['openFile']
      });

      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }

      const filePath = result.filePaths[0];
      if (!filePath) {
        return null;
      }
      
      const filename = path.basename(filePath);
      const validationResult = await this.validateWatermarkFile(filePath);

      return {
        success: validationResult.isValid,
        path: filePath,
        filePath: filePath,  // Backward compatibility
        filename,
        fileName: filename  // Backward compatibility
      };

    } catch (error) {
      console.error('Failed to select watermark file:', error);
      throw new Error('Watermark file selection failed');
    }
  }

  async validateWatermarkFile(filePath: string): Promise<WatermarkValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    try {
      await fs.access(filePath, constants.F_OK);

      if (path.extname(filePath).toLowerCase() !== '.png') {
        errors.push({
          field: 'format',
          message: 'Watermark must be a PNG file with transparency support',
          severity: 'error'
        });
        return { isValid: false, errors, warnings, minSizeMet: false, isPNG: false };
      }

      const sharpImage = sharp(filePath);
      const metadata = await sharpImage.metadata();

      if (!metadata.hasAlpha) {
        warnings.push({
          field: 'transparency',
          message: 'Watermark does not have transparency. Consider using a PNG with alpha channel.',
          severity: 'warning'
        });
      }

      if ((metadata.width || 0) > 512 || (metadata.height || 0) > 512) {
        warnings.push({
          field: 'size',
          message: 'Large watermark may impact performance. Consider resizing to 512x512 or smaller.',
          severity: 'warning'
        });
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        minSizeMet: (metadata.width || 0) >= 64 && (metadata.height || 0) >= 64,
        isPNG: true,
        metadata: metadata.width && metadata.height ? {
          width: metadata.width,
          height: metadata.height,
          hasTransparency: metadata.hasAlpha || false
        } : undefined
      };

    } catch (error) {
      errors.push({
        field: 'file',
        message: 'File not accessible or invalid image format',
        severity: 'error'
      });
      return { isValid: false, errors, warnings, minSizeMet: false, isPNG: false };
    }
  }

  // Recent Files Management
  async getRecentImages(): Promise<RecentFileInfo[]> {
    try {
      const recentImages = this.recentFilesStore.get('recentImages') || [];
      
      // Verify accessibility of recent files
      const verifiedFiles = await Promise.all(
        recentImages.map(async (file) => {
          try {
            await fs.access(file.path, constants.F_OK);
            return { ...file, isAccessible: true };
          } catch {
            return { ...file, isAccessible: false };
          }
        })
      );

      // Sort by last used, remove inaccessible files older than 30 days
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const filtered = verifiedFiles.filter(file => 
        file.isAccessible || (file.lastUsed ?? 0) > thirtyDaysAgo
      );

      return filtered.sort((a, b) => (b.lastUsed ?? 0) - (a.lastUsed ?? 0));
    } catch (error) {
      console.error('Failed to get recent images:', error);
      return [];
    }
  }

  async addToRecentImages(filePath: string): Promise<void> {
    try {
      const recentImages = await this.getRecentImages();
      // const stats = await fs.stat(filePath); // Not used currently
      const filename = path.basename(filePath);

      // Remove existing entry if present
      const filtered = recentImages.filter(file => file.path !== filePath);

      // Add new entry at the beginning
      const newEntry: RecentFileInfo = {
        path: filePath,
        name: filename,
        filename,
        timestamp: Date.now(),
        lastUsed: Date.now(),
        type: 'image' as const,
        isAccessible: true
      };

      const updated = [newEntry, ...filtered].slice(0, this.MAX_RECENT_FILES);
      this.recentFilesStore.set('recentImages', updated);
      
      this.emit('recentFilesUpdated', updated);
    } catch (error) {
      console.error('Failed to add to recent images:', error);
    }
  }

  async removeFromRecentImages(filePath: string): Promise<void> {
    try {
      const recentImages = await this.getRecentImages();
      const filtered = recentImages.filter(file => file.path !== filePath);
      
      this.recentFilesStore.set('recentImages', filtered);
      this.emit('recentFilesUpdated', filtered);
    } catch (error) {
      console.error('Failed to remove from recent images:', error);
    }
  }

  async clearRecentImages(): Promise<void> {
    try {
      this.recentFilesStore.set('recentImages', []);
      this.emit('recentFilesUpdated', []);
    } catch (error) {
      console.error('Failed to clear recent images:', error);
    }
  }

  // File System Utilities
  watchFile(filePath: string, callback: (event: FileChangeEvent) => void): FileWatcher {
    fsSync.watchFile(filePath, { interval: 1000 }, (curr: any, prev: any) => {
      const event: FileChangeEvent = {
        path: filePath,
        type: curr.mtime > prev.mtime ? 'modified' : 'delete',
        timestamp: Date.now()
      };
      callback(event);
    });

    const watcherId = `${filePath}_${Date.now()}`;
    const fileWatcher: FileWatcher = {
      id: watcherId,
      path: filePath,
      watch: () => {},
      unwatch: () => {},
      close: () => fsSync.unwatchFile(filePath)
    };

    this.fileWatchers.set(watcherId, fileWatcher);
    return fileWatcher;
  }

  unwatchFile(watcher: FileWatcher): void {
    try {
      if (watcher.path) {
        fsSync.unwatchFile(watcher.path);
      }
      if (watcher.id) {
        this.fileWatchers.delete(watcher.id);
      }
    } catch (error) {
      console.error('Failed to unwatch file:', error);
    }
  }

  async getFileStats(filePath: string): Promise<FileStats> {
    try {
      const stats = await fs.stat(filePath);
      
      // Check permissions
      let permissions: FilePermissions = {
        read: false,
        readable: false,
        write: false,
        writable: false,
        execute: false,
        executable: false
      };

      try {
        await fs.access(filePath, constants.R_OK);
        permissions.read = true;
        permissions.readable = true;
      } catch {
        // Read permission not available
      }

      try {
        await fs.access(filePath, constants.W_OK);
        permissions.write = true;
        permissions.writable = true;
      } catch {
        // Write permission not available
      }

      try {
        await fs.access(filePath, constants.X_OK);
        permissions.execute = true;
        permissions.executable = true;
      } catch {
        // Execute permission not available
      }

      return {
        size: stats.size,
        created: stats.birthtime.getTime(),
        modified: stats.mtime.getTime(),
        accessed: stats.atime.getTime(),
        isDirectory: stats.isDirectory(),
        permissions
      };
    } catch (error) {
      console.error('Failed to get file stats:', error);
      throw new Error('File statistics unavailable');
    }
  }

  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath, constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  // Cleanup method
  destroy(): void {
    // Clean up all file watchers
    for (const [, watcher] of this.fileWatchers) {
      this.unwatchFile(watcher);
    }
    this.fileWatchers.clear();
    this.removeAllListeners();
  }
}
