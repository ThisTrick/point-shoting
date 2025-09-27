/**
 * File Operation IPC Handlers
 * IPC communication handlers for file operations between main and renderer processes
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { FileManager } from '../services/FileManager';
import { UISettings } from '../../types';

// Temporary type definitions until properly defined in types module
interface ImageFileResult {
  path: string;
  filename: string;
  metadata: ImageMetadata;
  validationResult: ImageValidationResult;
}

interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  fileSize: number;
  hasTransparency: boolean;
  dominantColors: string[];
  aspectRatio: number;
  colorSpace?: string;
}

interface ImageValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  metadata?: ImageMetadata;
}

interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

interface WatermarkFileResult {
  path: string;
  filename: string;
  validationResult: WatermarkValidationResult;
}

interface WatermarkValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  metadata?: {
    width: number;
    height: number;
    hasTransparency: boolean;
  };
}

interface RecentFileInfo {
  path: string;
  filename: string;
  lastUsed: number;
  fileSize: number;
  isAccessible: boolean;
  thumbnailPath?: string;
}

interface FileStats {
  size: number;
  created: number;
  modified: number;
  accessed: number;
  isDirectory: boolean;
  permissions: FilePermissions;
}

interface FilePermissions {
  read: boolean;
  write: boolean;
  execute: boolean;
}

interface PresetConfig {
  settings: UISettings;
  metadata?: {
    name: string;
    description?: string;
    version: string;
  };
}

interface ConfigValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export class FileIpcHandlers {
  constructor(private fileManager: FileManager) {
    this.registerHandlers();
  }

  private registerHandlers(): void {
    // Image Operations
    ipcMain.handle('files:select-image', this.handleSelectImage.bind(this));
    ipcMain.handle('files:validate-image', this.handleValidateImage.bind(this));
    ipcMain.handle('files:generate-preview', this.handleGeneratePreview.bind(this));
    ipcMain.handle('files:get-image-metadata', this.handleGetImageMetadata.bind(this));

    // Configuration Operations
    ipcMain.handle('files:select-config', this.handleSelectConfig.bind(this));
    ipcMain.handle('files:save-config', this.handleSaveConfig.bind(this));
    ipcMain.handle('files:load-config', this.handleLoadConfig.bind(this));
    ipcMain.handle('files:validate-config', this.handleValidateConfig.bind(this));

    // Watermark Operations
    ipcMain.handle('files:select-watermark', this.handleSelectWatermark.bind(this));
    ipcMain.handle('files:validate-watermark', this.handleValidateWatermark.bind(this));

    // Recent Files Management
    ipcMain.handle('files:get-recent-images', this.handleGetRecentImages.bind(this));
    ipcMain.handle('files:add-recent-image', this.handleAddRecentImage.bind(this));
    ipcMain.handle('files:remove-recent-image', this.handleRemoveRecentImage.bind(this));
    ipcMain.handle('files:clear-recent-images', this.handleClearRecentImages.bind(this));

    // File System Utilities
    ipcMain.handle('files:get-file-stats', this.handleGetFileStats.bind(this));
    ipcMain.handle('files:file-exists', this.handleFileExists.bind(this));
    ipcMain.handle('files:watch-file', this.handleWatchFile.bind(this));
    ipcMain.handle('files:unwatch-file', this.handleUnwatchFile.bind(this));
  }

  // Image Operations
  private async handleSelectImage(_event: IpcMainInvokeEvent): Promise<ImageFileResult | null> {
    try {
      return await this.fileManager.selectImageFile();
    } catch (error) {
      console.error('Image selection error:', error);
      throw new Error(`Failed to select image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleValidateImage(_event: IpcMainInvokeEvent, filePath: string): Promise<ImageValidationResult> {
    try {
      return await this.fileManager.validateImageFile(filePath);
    } catch (error) {
      console.error('Image validation error:', error);
      throw new Error(`Failed to validate image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleGeneratePreview(_event: IpcMainInvokeEvent, filePath: string, maxSize: number = 200): Promise<string> {
    try {
      return await this.fileManager.generateImagePreview(filePath, maxSize);
    } catch (error) {
      console.error('Preview generation error:', error);
      throw new Error(`Failed to generate preview: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleGetImageMetadata(_event: IpcMainInvokeEvent, filePath: string): Promise<ImageMetadata> {
    try {
      return await this.fileManager.getImageMetadata(filePath);
    } catch (error) {
      console.error('Image metadata error:', error);
      throw new Error(`Failed to get image metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Configuration Operations
  private async handleSelectConfig(_event: IpcMainInvokeEvent, mode: 'import' | 'export'): Promise<string | null> {
    try {
      return await this.fileManager.selectConfigFile(mode);
    } catch (error) {
      console.error('Config selection error:', error);
      throw new Error(`Failed to select config file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleSaveConfig(_event: IpcMainInvokeEvent, filePath: string, config: PresetConfig): Promise<void> {
    try {
      await this.fileManager.saveConfigFile(filePath, config);
    } catch (error) {
      console.error('Config save error:', error);
      throw new Error(`Failed to save config file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleLoadConfig(_event: IpcMainInvokeEvent, filePath: string): Promise<PresetConfig> {
    try {
      return await this.fileManager.loadConfigFile(filePath);
    } catch (error) {
      console.error('Config load error:', error);
      throw new Error(`Failed to load config file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleValidateConfig(_event: IpcMainInvokeEvent, filePath: string): Promise<ConfigValidationResult> {
    try {
      return await this.fileManager.validateConfigFile(filePath);
    } catch (error) {
      console.error('Config validation error:', error);
      throw new Error(`Failed to validate config file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Watermark Operations
  private async handleSelectWatermark(_event: IpcMainInvokeEvent): Promise<WatermarkFileResult | null> {
    try {
      return await this.fileManager.selectWatermarkFile();
    } catch (error) {
      console.error('Watermark selection error:', error);
      throw new Error(`Failed to select watermark: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleValidateWatermark(_event: IpcMainInvokeEvent, filePath: string): Promise<WatermarkValidationResult> {
    try {
      return await this.fileManager.validateWatermarkFile(filePath);
    } catch (error) {
      console.error('Watermark validation error:', error);
      throw new Error(`Failed to validate watermark: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Recent Files Management
  private async handleGetRecentImages(_event: IpcMainInvokeEvent): Promise<RecentFileInfo[]> {
    try {
      return await this.fileManager.getRecentImages();
    } catch (error) {
      console.error('Get recent images error:', error);
      throw new Error(`Failed to get recent images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleAddRecentImage(_event: IpcMainInvokeEvent, filePath: string): Promise<void> {
    try {
      await this.fileManager.addToRecentImages(filePath);
    } catch (error) {
      console.error('Add recent image error:', error);
      throw new Error(`Failed to add recent image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleRemoveRecentImage(_event: IpcMainInvokeEvent, filePath: string): Promise<void> {
    try {
      await this.fileManager.removeFromRecentImages(filePath);
    } catch (error) {
      console.error('Remove recent image error:', error);
      throw new Error(`Failed to remove recent image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleClearRecentImages(_event: IpcMainInvokeEvent): Promise<void> {
    try {
      await this.fileManager.clearRecentImages();
    } catch (error) {
      console.error('Clear recent images error:', error);
      throw new Error(`Failed to clear recent images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // File System Utilities
  private async handleGetFileStats(_event: IpcMainInvokeEvent, filePath: string): Promise<FileStats> {
    try {
      return await this.fileManager.getFileStats(filePath);
    } catch (error) {
      console.error('Get file stats error:', error);
      throw new Error(`Failed to get file stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleFileExists(_event: IpcMainInvokeEvent, filePath: string): Promise<boolean> {
    try {
      return await this.fileManager.fileExists(filePath);
    } catch (error) {
      console.error('File exists check error:', error);
      throw new Error(`Failed to check file existence: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleWatchFile(_event: IpcMainInvokeEvent, filePath: string): Promise<string> {
    try {
      const watcher = this.fileManager.watchFile(filePath, (event) => {
        // Send file change event to renderer process
        _event.sender.send('file-changed', event);
      });
      return watcher.id;
    } catch (error) {
      console.error('Watch file error:', error);
      throw new Error(`Failed to watch file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleUnwatchFile(_event: IpcMainInvokeEvent, watcherId: string): Promise<void> {
    try {
      // Find and remove file watcher by ID
      // Implementation would require FileManager to track watchers by ID
      console.log(`Unwatching file with ID: ${watcherId}`);
      // TODO: Implement proper watcher cleanup by ID
    } catch (error) {
      console.error('Unwatch file error:', error);
      throw new Error(`Failed to unwatch file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Cleanup method
  removeHandlers(): void {
    const handlerNames = [
      'files:select-image',
      'files:validate-image',
      'files:generate-preview',
      'files:get-image-metadata',
      'files:select-config',
      'files:save-config',
      'files:load-config',
      'files:validate-config',
      'files:select-watermark',
      'files:validate-watermark',
      'files:get-recent-images',
      'files:add-recent-image',
      'files:remove-recent-image',
      'files:clear-recent-images',
      'files:get-file-stats',
      'files:file-exists',
      'files:watch-file',
      'files:unwatch-file'
    ];

    handlerNames.forEach(name => {
      ipcMain.removeHandler(name);
    });
  }
}
