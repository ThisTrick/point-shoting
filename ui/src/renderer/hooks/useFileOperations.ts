/**
 * useFileOperations Hook
 * Custom hook for managing file operations with validation and metadata
 */

import { useCallback, useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import '../../types/electron';

// File operation types
interface FileMetadata {
  path: string;
  filename: string;
  size: number;
  format: string;
  lastModified: number;
  aspectRatio?: number;
  dimensions?: { width: number; height: number };
  hasTransparency?: boolean;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: FileMetadata;
}

interface FileOperationHookOptions {
  showNotifications?: boolean;
  autoValidate?: boolean;
  generatePreviews?: boolean;
  maxPreviewSize?: number;
}

interface FileOperationState {
  isSelectingFile: boolean;
  isValidating: boolean;
  isGeneratingPreview: boolean;
  currentFile: FileMetadata | null;
  previewUrl: string | null;
  recentFiles: FileMetadata[];
}

export function useFileOperations(options: FileOperationHookOptions = {}) {
  const {
    showNotifications = true,
    autoValidate = true,
    generatePreviews = true,
    maxPreviewSize = 300
  } = options;

  const { showSuccess, showError, showWarning, showFileOperation } = useNotifications();

  const [state, setState] = useState<FileOperationState>({
    isSelectingFile: false,
    isValidating: false,
    isGeneratingPreview: false,
    currentFile: null,
    previewUrl: null,
    recentFiles: []
  });

  // Image operations
  const selectImage = useCallback(async (): Promise<FileMetadata | null> => {
    setState(prev => ({ ...prev, isSelectingFile: true }));
    
    try {
      const result = await window.electronAPI?.files.selectImage();
      
      if (result) {
        const metadata: FileMetadata = {
          path: result.filePath,
          filename: result.filename,
          size: result.size,
          format: result.format,
          lastModified: result.lastModified || Date.now(),
          aspectRatio: result.aspectRatio,
          dimensions: result.dimensions,
          hasTransparency: result.hasTransparency
        };

        // Validate if enabled
        if (autoValidate) {
          const validation = await validateImage(result.filePath);
          if (!validation.isValid && showNotifications) {
            showError(`Image validation failed: ${validation.errors.join(', ')}`);
            return null;
          }
          if (validation.warnings.length > 0 && showNotifications) {
            showWarning(`Image warnings: ${validation.warnings.join(', ')}`);
          }
        }

        // Generate preview if enabled
        let previewUrl: string | null = null;
        if (generatePreviews) {
          setState(prev => ({ ...prev, isGeneratingPreview: true }));
          try {
            previewUrl = await window.electronAPI?.files.generatePreview(result.filePath, maxPreviewSize) || null;
          } catch (error) {
            console.warn('Failed to generate preview:', error);
          }
          setState(prev => ({ ...prev, isGeneratingPreview: false }));
        }

        setState(prev => ({
          ...prev,
          currentFile: metadata,
          previewUrl,
          isSelectingFile: false
        }));

        // Add to recent files
        await addToRecent(metadata);

        if (showNotifications) {
          showFileOperation(`Image loaded: ${metadata.filename}`, 'success');
        }

        return metadata;
      }

      setState(prev => ({ ...prev, isSelectingFile: false }));
      return null;
    } catch (error) {
      setState(prev => ({ ...prev, isSelectingFile: false }));
      const message = error instanceof Error ? error.message : 'Failed to select image';
      if (showNotifications) {
        showFileOperation(message, 'error');
      }
      throw error;
    }
  }, [autoValidate, generatePreviews, maxPreviewSize, showNotifications, showError, showWarning, showFileOperation]);

  const validateImage = useCallback(async (filePath: string): Promise<ValidationResult> => {
    setState(prev => ({ ...prev, isValidating: true }));
    
    try {
      const result = await window.electronAPI?.files.validateImage(filePath);
      
      setState(prev => ({ ...prev, isValidating: false }));
      
      return {
        isValid: result?.isValid || false,
        errors: result?.errors || [],
        warnings: result?.warnings || [],
        metadata: result?.metadata ? {
          path: filePath,
          filename: filePath.split('/').pop() || '',
          size: result.metadata.size || 0,
          format: result.metadata.format || '',
          lastModified: result.metadata.lastModified || Date.now(),
          aspectRatio: result.metadata.aspectRatio,
          dimensions: result.metadata.dimensions,
          hasTransparency: result.metadata.hasTransparency
        } : undefined
      };
    } catch (error) {
      setState(prev => ({ ...prev, isValidating: false }));
      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Validation failed'],
        warnings: []
      };
    }
  }, []);

  const generatePreview = useCallback(async (filePath: string): Promise<string | null> => {
    setState(prev => ({ ...prev, isGeneratingPreview: true }));
    
    try {
      const previewUrl = await window.electronAPI?.files.generatePreview(filePath, maxPreviewSize);
      
      setState(prev => ({ 
        ...prev, 
        previewUrl: previewUrl || null,
        isGeneratingPreview: false 
      }));
      
      return previewUrl || null;
    } catch (error) {
      setState(prev => ({ ...prev, isGeneratingPreview: false }));
      console.error('Failed to generate preview:', error);
      return null;
    }
  }, [maxPreviewSize]);

  // Watermark operations
  const selectWatermark = useCallback(async (): Promise<FileMetadata | null> => {
    setState(prev => ({ ...prev, isSelectingFile: true }));
    
    try {
      const result = await window.electronAPI?.files.selectWatermark();
      
      if (result) {
        const metadata: FileMetadata = {
          path: result.filePath,
          filename: result.filename,
          size: result.size,
          format: result.format,
          lastModified: result.lastModified || Date.now(),
          dimensions: result.dimensions,
          hasTransparency: result.hasTransparency
        };

        setState(prev => ({ ...prev, isSelectingFile: false }));

        if (showNotifications) {
          showFileOperation(`Watermark selected: ${metadata.filename}`, 'success');
        }

        return metadata;
      }

      setState(prev => ({ ...prev, isSelectingFile: false }));
      return null;
    } catch (error) {
      setState(prev => ({ ...prev, isSelectingFile: false }));
      const message = error instanceof Error ? error.message : 'Failed to select watermark';
      if (showNotifications) {
        showFileOperation(message, 'error');
      }
      throw error;
    }
  }, [showNotifications, showFileOperation]);

  const validateWatermark = useCallback(async (filePath: string): Promise<ValidationResult> => {
    setState(prev => ({ ...prev, isValidating: true }));
    
    try {
      const result = await window.electronAPI?.files.validateWatermark(filePath);
      
      setState(prev => ({ ...prev, isValidating: false }));
      
      return {
        isValid: result?.isValid || false,
        errors: result?.errors || [],
        warnings: result?.warnings || []
      };
    } catch (error) {
      setState(prev => ({ ...prev, isValidating: false }));
      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Watermark validation failed'],
        warnings: []
      };
    }
  }, []);

  // Configuration operations
  const selectConfigFile = useCallback(async (mode: 'import' | 'export'): Promise<string | null> => {
    setState(prev => ({ ...prev, isSelectingFile: true }));
    
    try {
      const filePath = await window.electronAPI?.files.selectConfig(mode);
      
      setState(prev => ({ ...prev, isSelectingFile: false }));
      
      if (filePath && showNotifications) {
        const action = mode === 'import' ? 'selected for import' : 'selected for export';
        showFileOperation(`Configuration file ${action}`, 'success');
      }
      
      return filePath || null;
    } catch (error) {
      setState(prev => ({ ...prev, isSelectingFile: false }));
      const message = error instanceof Error ? error.message : 'Failed to select configuration file';
      if (showNotifications) {
        showFileOperation(message, 'error');
      }
      throw error;
    }
  }, [showNotifications, showFileOperation]);

  const saveConfig = useCallback(async (filePath: string, config: any): Promise<void> => {
    try {
      await window.electronAPI?.files.saveConfig(filePath, config);
      
      if (showNotifications) {
        showFileOperation(`Configuration saved: ${filePath.split('/').pop()}`, 'success');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save configuration';
      if (showNotifications) {
        showFileOperation(message, 'error');
      }
      throw error;
    }
  }, [showNotifications, showFileOperation]);

  const loadConfig = useCallback(async (filePath: string): Promise<any> => {
    try {
      const config = await window.electronAPI?.files.loadConfig(filePath);
      
      if (showNotifications) {
        showFileOperation(`Configuration loaded: ${filePath.split('/').pop()}`, 'success');
      }
      
      return config;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load configuration';
      if (showNotifications) {
        showFileOperation(message, 'error');
      }
      throw error;
    }
  }, [showNotifications, showFileOperation]);

  const validateConfig = useCallback(async (filePath: string): Promise<ValidationResult> => {
    setState(prev => ({ ...prev, isValidating: true }));
    
    try {
      const result = await window.electronAPI?.files.validateConfig(filePath);
      
      setState(prev => ({ ...prev, isValidating: false }));
      
      return {
        isValid: result?.isValid || false,
        errors: result?.errors || [],
        warnings: result?.warnings || []
      };
    } catch (error) {
      setState(prev => ({ ...prev, isValidating: false }));
      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Configuration validation failed'],
        warnings: []
      };
    }
  }, []);

  // Recent files management
  const loadRecentFiles = useCallback(async () => {
    try {
      const recentFiles = await window.electronAPI?.files.getRecentImages();
      const metadata: FileMetadata[] = (recentFiles || []).map((file: any) => ({
        path: file.filePath,
        filename: file.filename,
        size: file.size,
        format: file.format,
        lastModified: file.lastModified,
        aspectRatio: file.aspectRatio,
        dimensions: file.dimensions,
        hasTransparency: file.hasTransparency
      }));
      
      setState(prev => ({ ...prev, recentFiles: metadata }));
      return metadata;
    } catch (error) {
      console.error('Failed to load recent files:', error);
      return [];
    }
  }, []);

  const addToRecent = useCallback(async (file: FileMetadata) => {
    try {
      await window.electronAPI?.files.addRecentImage(file.path);
      setState(prev => ({
        ...prev,
        recentFiles: [file, ...prev.recentFiles.filter(f => f.path !== file.path)].slice(0, 10)
      }));
    } catch (error) {
      console.error('Failed to add to recent files:', error);
    }
  }, []);

  const removeFromRecent = useCallback(async (filePath: string) => {
    try {
      await window.electronAPI?.files.removeRecentImage(filePath);
      setState(prev => ({
        ...prev,
        recentFiles: prev.recentFiles.filter(f => f.path !== filePath)
      }));
      
      if (showNotifications) {
        showSuccess('File removed from recent list');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove from recent files';
      if (showNotifications) {
        showError(message);
      }
    }
  }, [showNotifications, showSuccess, showError]);

  const clearRecentFiles = useCallback(async () => {
    try {
      await window.electronAPI?.files.clearRecentImages();
      setState(prev => ({ ...prev, recentFiles: [] }));
      
      if (showNotifications) {
        showSuccess('Recent files cleared');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to clear recent files';
      if (showNotifications) {
        showError(message);
      }
    }
  }, [showNotifications, showSuccess, showError]);

  // File utilities
  const getFileStats = useCallback(async (filePath: string) => {
    try {
      return await window.electronAPI?.files.getFileStats(filePath);
    } catch (error) {
      console.error('Failed to get file stats:', error);
      return null;
    }
  }, []);

  const fileExists = useCallback(async (filePath: string): Promise<boolean> => {
    try {
      return await window.electronAPI?.files.fileExists(filePath) || false;
    } catch (error) {
      return false;
    }
  }, []);

  const watchFile = useCallback(async (filePath: string): Promise<string | null> => {
    try {
      return await window.electronAPI?.files.watchFile(filePath) || null;
    } catch (error) {
      console.error('Failed to watch file:', error);
      return null;
    }
  }, []);

  const unwatchFile = useCallback(async (watcherId: string): Promise<void> => {
    try {
      await window.electronAPI?.files.unwatchFile(watcherId);
    } catch (error) {
      console.error('Failed to unwatch file:', error);
    }
  }, []);

  // Metadata helpers
  const getImageMetadata = useCallback(async (filePath: string): Promise<FileMetadata | null> => {
    try {
      const metadata = await window.electronAPI?.files.getImageMetadata(filePath);
      if (metadata) {
        return {
          path: filePath,
          filename: filePath.split('/').pop() || '',
          size: metadata.size,
          format: metadata.format,
          lastModified: metadata.lastModified,
          aspectRatio: metadata.aspectRatio,
          dimensions: metadata.dimensions,
          hasTransparency: metadata.hasTransparency
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get image metadata:', error);
      return null;
    }
  }, []);

  return {
    // State
    state,
    
    // Loading states
    isSelectingFile: state.isSelectingFile,
    isValidating: state.isValidating,
    isGeneratingPreview: state.isGeneratingPreview,
    
    // Current file info
    currentFile: state.currentFile,
    previewUrl: state.previewUrl,
    recentFiles: state.recentFiles,
    
    // Image operations
    selectImage,
    validateImage,
    generatePreview,
    
    // Watermark operations
    selectWatermark,
    validateWatermark,
    
    // Configuration operations
    selectConfigFile,
    saveConfig,
    loadConfig,
    validateConfig,
    
    // Recent files
    loadRecentFiles,
    addToRecent,
    removeFromRecent,
    clearRecentFiles,
    
    // File utilities
    getFileStats,
    fileExists,
    watchFile,
    unwatchFile,
    getImageMetadata
  };
}

// Export types
export type { FileMetadata, ValidationResult, FileOperationState };
