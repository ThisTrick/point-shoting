/**
 * ImageLoader Component
 * 
 * Provides comprehensive image loading interface including:
 * - Drag & drop file loading with visual feedback
 * - File browser integration with format validation
 * - Image preview with metadata display
 * - Error handling for unsupported formats and sizes
 * - Progress indicators for large file processing
 * - Recent files history and quick access
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import './ImageLoader.css';

// Temporary type definitions - will be replaced with proper imports
interface ImageInfo {
  file: File;
  src: string;
  width: number;
  height: number;
  size: number;
  type: string;
  lastModified: Date;
}

interface RecentImage {
  id: string;
  name: string;
  src: string;
  size: number;
  width: number;
  height: number;
  loadedAt: Date;
}

interface ImageLoaderProps {
  onImageLoad: (imageInfo: ImageInfo) => void;
  onError: (error: string) => void;
  acceptedFormats?: string[];
  maxFileSize?: number; // in bytes
  maxDimensions?: { width: number; height: number };
  disabled?: boolean;
  className?: string;
  'data-testid'?: string;
}

interface LoadingState {
  isLoading: boolean;
  progress: number;
  stage: 'reading' | 'processing' | 'validating' | 'complete';
}

const DEFAULT_ACCEPTED_FORMATS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
const DEFAULT_MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const DEFAULT_MAX_DIMENSIONS = { width: 4096, height: 4096 };

// Temporary hooks - will be replaced with proper implementations
const useLocalization = () => ({
  t: (key: string) => key,
  currentLocale: 'en'
});

export const ImageLoader: React.FC<ImageLoaderProps> = ({
  onImageLoad,
  onError,
  acceptedFormats = DEFAULT_ACCEPTED_FORMATS,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  maxDimensions = DEFAULT_MAX_DIMENSIONS,
  disabled = false,
  className = '',
  'data-testid': testId = 'image-loader'
}) => {
  const { t } = useLocalization();
  const [isDragOver, setIsDragOver] = useState(false);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    progress: 0,
    stage: 'reading'
  });
  const [recentImages, setRecentImages] = useState<RecentImage[]>([]);
  const [showRecentImages, setShowRecentImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Load recent images from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('recent-images');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setRecentImages(parsed.map((img: any) => ({
          ...img,
          loadedAt: new Date(img.loadedAt)
        })));
      } catch (error) {
        console.warn('Failed to load recent images:', error);
      }
    }
  }, []);

  // Save recent images to localStorage
  const saveRecentImages = useCallback((images: RecentImage[]) => {
    try {
      localStorage.setItem('recent-images', JSON.stringify(images));
      setRecentImages(images);
    } catch (error) {
      console.warn('Failed to save recent images:', error);
    }
  }, []);

  // Add image to recent list
  const addToRecentImages = useCallback((imageInfo: ImageInfo) => {
    const recentImage: RecentImage = {
      id: `${imageInfo.file.name}_${Date.now()}`,
      name: imageInfo.file.name,
      src: imageInfo.src,
      size: imageInfo.size,
      width: imageInfo.width,
      height: imageInfo.height,
      loadedAt: new Date()
    };

    setRecentImages(prev => {
      const filtered = prev.filter(img => img.name !== imageInfo.file.name);
      const updated = [recentImage, ...filtered].slice(0, 10); // Keep only 10 recent
      saveRecentImages(updated);
      return updated;
    });
  }, [saveRecentImages]);

  // Validate file format
  const validateFormat = useCallback((file: File): boolean => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    return acceptedFormats.includes(extension);
  }, [acceptedFormats]);

  // Validate file size
  const validateSize = useCallback((file: File): boolean => {
    return file.size <= maxFileSize;
  }, [maxFileSize]);

  // Get image dimensions
  const getImageDimensions = useCallback((src: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        reject(new Error('Failed to load image for dimension check'));
      };
      img.src = src;
    });
  }, []);

  // Validate image dimensions
  const validateDimensions = useCallback((width: number, height: number): boolean => {
    return width <= maxDimensions.width && height <= maxDimensions.height;
  }, [maxDimensions]);

  // Process file and create ImageInfo
  const processFile = useCallback(async (file: File): Promise<ImageInfo> => {
    setLoadingState({ isLoading: true, progress: 10, stage: 'reading' });

    // Validate format
    if (!validateFormat(file)) {
      throw new Error(`Unsupported file format. Accepted formats: ${acceptedFormats.join(', ')}`);
    }

    setLoadingState(prev => ({ ...prev, progress: 20 }));

    // Validate size
    if (!validateSize(file)) {
      const maxSizeMB = (maxFileSize / (1024 * 1024)).toFixed(1);
      throw new Error(`File size too large. Maximum allowed: ${maxSizeMB}MB`);
    }

    setLoadingState(prev => ({ ...prev, progress: 30, stage: 'processing' }));

    // Create object URL for the file
    const src = URL.createObjectURL(file);

    setLoadingState(prev => ({ ...prev, progress: 50 }));

    try {
      // Get image dimensions
      const dimensions = await getImageDimensions(src);
      
      setLoadingState(prev => ({ ...prev, progress: 70, stage: 'validating' }));

      // Validate dimensions
      if (!validateDimensions(dimensions.width, dimensions.height)) {
        URL.revokeObjectURL(src);
        throw new Error(
          `Image dimensions too large. Maximum: ${maxDimensions.width}x${maxDimensions.height}px, ` +
          `got: ${dimensions.width}x${dimensions.height}px`
        );
      }

      setLoadingState(prev => ({ ...prev, progress: 90 }));

      const imageInfo: ImageInfo = {
        file,
        src,
        width: dimensions.width,
        height: dimensions.height,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified)
      };

      setLoadingState(prev => ({ ...prev, progress: 100, stage: 'complete' }));

      // Brief delay to show completion
      setTimeout(() => {
        setLoadingState({ isLoading: false, progress: 0, stage: 'reading' });
      }, 300);

      return imageInfo;
    } catch (error) {
      URL.revokeObjectURL(src);
      throw error;
    }
  }, [validateFormat, validateSize, getImageDimensions, validateDimensions, acceptedFormats, maxFileSize, maxDimensions]);

  // Handle file selection
  const handleFileSelect = useCallback(async (files: FileList | File[]) => {
    if (disabled || files.length === 0) return;

    const file = files[0];
    if (!file) return;
    
    try {
      const imageInfo = await processFile(file);
      addToRecentImages(imageInfo);
      onImageLoad(imageInfo);
    } catch (error) {
      setLoadingState({ isLoading: false, progress: 0, stage: 'reading' });
      onError(error instanceof Error ? error.message : 'Failed to load image');
    }
  }, [disabled, processFile, addToRecentImages, onImageLoad, onError]);

  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only clear drag state if leaving the drop zone entirely
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    if (!disabled && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [disabled, handleFileSelect]);

  // Handle file input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files);
    }
  }, [handleFileSelect]);

  // Trigger file browser
  const openFileBrowser = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }, [disabled]);

  // Load recent image
  const loadRecentImage = useCallback((recentImage: RecentImage) => {
    // Create a synthetic ImageInfo from the recent image data
    const imageInfo: ImageInfo = {
      file: new File([], recentImage.name, { type: 'image/png' }), // Synthetic file
      src: recentImage.src,
      width: recentImage.width,
      height: recentImage.height,
      size: recentImage.size,
      type: 'image/png',
      lastModified: recentImage.loadedAt
    };
    
    onImageLoad(imageInfo);
  }, [onImageLoad]);

  // Clear recent images
  const clearRecentImages = useCallback(() => {
    localStorage.removeItem('recent-images');
    setRecentImages([]);
  }, []);

  // Format file size for display
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  }, []);

  // Get loading stage message
  const getLoadingMessage = useCallback((stage: string): string => {
    switch (stage) {
      case 'reading': return t('image_loader.reading_file');
      case 'processing': return t('image_loader.processing_image');
      case 'validating': return t('image_loader.validating_image');
      case 'complete': return t('image_loader.loading_complete');
      default: return t('image_loader.loading');
    }
  }, [t]);

  return (
    <div 
      className={`image-loader ${disabled ? 'disabled' : ''} ${className}`}
      data-testid={testId}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={handleInputChange}
        style={{ display: 'none' }}
        disabled={disabled}
      />

      <div className="image-loader-content">
        <div
          ref={dropZoneRef}
          className={`drop-zone ${isDragOver ? 'drag-over' : ''} ${loadingState.isLoading ? 'loading' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openFileBrowser}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
              e.preventDefault();
              openFileBrowser();
            }
          }}
          aria-label={t('image_loader.drop_zone_aria_label')}
        >
          {loadingState.isLoading ? (
            <div className="loading-content">
              <div className="loading-spinner"></div>
              <div className="loading-progress">
                <div 
                  className="progress-bar"
                  style={{ width: `${loadingState.progress}%` }}
                />
              </div>
              <div className="loading-text">
                <div className="loading-stage">{getLoadingMessage(loadingState.stage)}</div>
                <div className="loading-percentage">{loadingState.progress}%</div>
              </div>
            </div>
          ) : (
            <div className="drop-zone-content">
              <div className="drop-zone-icon">
                {isDragOver ? '📁' : '🖼️'}
              </div>
              <div className="drop-zone-text">
                <h3 className="drop-zone-title">
                  {isDragOver ? t('image_loader.drop_to_load') : t('image_loader.drag_or_click')}
                </h3>
                <p className="drop-zone-subtitle">
                  {t('image_loader.supported_formats')}: {acceptedFormats.join(', ')}
                </p>
                <p className="drop-zone-limits">
                  {t('image_loader.max_size')}: {formatFileSize(maxFileSize)} | 
                  {t('image_loader.max_dimensions')}: {maxDimensions.width}x{maxDimensions.height}px
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="loader-actions">
          <button
            type="button"
            className="browse-button"
            onClick={openFileBrowser}
            disabled={disabled || loadingState.isLoading}
            title={t('image_loader.browse_files')}
          >
            {t('image_loader.browse_files')}
          </button>

          <button
            type="button"
            className="recent-button"
            onClick={() => setShowRecentImages(!showRecentImages)}
            disabled={disabled || recentImages.length === 0}
            title={t('image_loader.show_recent')}
          >
            {t('image_loader.recent_images')} ({recentImages.length})
          </button>
        </div>

        {showRecentImages && recentImages.length > 0 && (
          <div className="recent-images-panel">
            <div className="recent-images-header">
              <h4 className="recent-images-title">{t('image_loader.recent_images')}</h4>
              <button
                type="button"
                className="clear-recent-button"
                onClick={clearRecentImages}
                title={t('image_loader.clear_recent')}
              >
                {t('image_loader.clear_all')}
              </button>
            </div>

            <div className="recent-images-grid">
              {recentImages.map(recentImage => (
                <div
                  key={recentImage.id}
                  className="recent-image-item"
                  onClick={() => loadRecentImage(recentImage)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      loadRecentImage(recentImage);
                    }
                  }}
                  title={`${recentImage.name} - ${recentImage.width}x${recentImage.height} - ${formatFileSize(recentImage.size)}`}
                >
                  <div className="recent-image-thumbnail">
                    <img 
                      src={recentImage.src} 
                      alt={recentImage.name}
                      loading="lazy"
                    />
                  </div>
                  <div className="recent-image-info">
                    <div className="recent-image-name">{recentImage.name}</div>
                    <div className="recent-image-details">
                      {recentImage.width}x{recentImage.height} | {formatFileSize(recentImage.size)}
                    </div>
                    <div className="recent-image-date">
                      {new Intl.DateTimeFormat('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }).format(recentImage.loadedAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageLoader;
