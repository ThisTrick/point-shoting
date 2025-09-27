/**
 * ImagePreview Component for Point Shooting Animation System
 * 
 * Displays loaded image with metadata and preview functionality including:
 * - Image display with zoom and pan
 * - File information and metadata
 * - Loading states and error handling
 * - Image manipulation controls
 */

import React, { useState, useCallback, useMemo } from 'react';
import { 
  ImageDimensions, 
  FileResults, 
  ErrorInfo, 
  ErrorSeverity, 
  ErrorCategory 
} from '../../types/core';
import './ImagePreview.css';

/**
 * ImagePreview Component Props
 */
export interface ImagePreviewProps {
  readonly imagePath?: string;
  readonly fileResults?: FileResults;
  readonly isLoading?: boolean;
  readonly showMetadata?: boolean;
  readonly showZoomControls?: boolean;
  readonly maxWidth?: number;
  readonly maxHeight?: number;
  readonly onImageError?: (error: ErrorInfo) => void;
  readonly onImageLoad?: (dimensions: ImageDimensions) => void;
}

/**
 * ImagePreview Component
 * 
 * Provides interactive image preview with metadata display and zoom functionality.
 */
export const ImagePreview: React.FC<ImagePreviewProps> = ({
  imagePath,
  fileResults,
  isLoading = false,
  showMetadata = true,
  showZoomControls = true,
  maxWidth = 800,
  maxHeight = 600,
  onImageError,
  onImageLoad,
}) => {
  const [imageError, setImageError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [naturalDimensions, setNaturalDimensions] = useState<ImageDimensions | null>(null);

  // Handle image load success
  const handleImageLoad = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    const dimensions: ImageDimensions = {
      width: img.naturalWidth,
      height: img.naturalHeight,
      aspectRatio: img.naturalWidth / img.naturalHeight,
    };
    
    setNaturalDimensions(dimensions);
    setImageError(null);
    onImageLoad?.(dimensions);
  }, [onImageLoad]);

  // Handle image load error
  const handleImageError = useCallback(() => {
    const error: ErrorInfo = {
      code: 'IMAGE_LOAD_ERROR',
      message: 'Failed to load image',
      timestamp: Date.now(),
      severity: ErrorSeverity.ERROR,
      category: ErrorCategory.FILE_OPERATION,
      recoverable: true,
      context: { imagePath },
    };
    
    setImageError('Failed to load image');
    onImageError?.(error);
  }, [imagePath, onImageError]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.2, 4));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev / 1.2, 0.1));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoom(1);
  }, []);

  // Calculate display dimensions
  const displayDimensions = useMemo(() => {
    if (!naturalDimensions) return null;

    let width = naturalDimensions.width;
    let height = naturalDimensions.height;

    // Scale to fit container while maintaining aspect ratio
    if (width > maxWidth || height > maxHeight) {
      const scaleX = maxWidth / width;
      const scaleY = maxHeight / height;
      const scale = Math.min(scaleX, scaleY);
      
      width *= scale;
      height *= scale;
    }

    return {
      width: width * zoom,
      height: height * zoom,
    };
  }, [naturalDimensions, maxWidth, maxHeight, zoom]);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file name from path
  const getFileName = (path: string): string => {
    return path.split('/').pop() || path;
  };

  return (
    <div className="image-preview">
      {/* Image Container */}
      <div className="image-container">
        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <span className="loading-text">Loading image...</span>
          </div>
        )}

        {imageError && (
          <div className="error-overlay">
            <div className="error-icon">⚠️</div>
            <span className="error-text">{imageError}</span>
          </div>
        )}

        {!isLoading && !imageError && imagePath && (
          <div className="image-wrapper">
            <img
              src={imagePath}
              alt="Preview"
              className="preview-image"
              style={displayDimensions ? {
                width: displayDimensions.width,
                height: displayDimensions.height,
              } : undefined}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          </div>
        )}

        {!imagePath && !isLoading && (
          <div className="empty-state">
            <div className="empty-icon">📁</div>
            <span className="empty-text">No image selected</span>
          </div>
        )}

        {/* Zoom Controls */}
        {showZoomControls && naturalDimensions && (
          <div className="zoom-controls">
            <button
              type="button"
              className="zoom-button"
              onClick={handleZoomOut}
              disabled={zoom <= 0.1}
              title="Zoom Out"
            >
              −
            </button>
            
            <span className="zoom-level">
              {Math.round(zoom * 100)}%
            </span>
            
            <button
              type="button"
              className="zoom-button"
              onClick={handleZoomIn}
              disabled={zoom >= 4}
              title="Zoom In"
            >
              +
            </button>
            
            <button
              type="button"
              className="zoom-button reset"
              onClick={handleZoomReset}
              title="Reset Zoom"
            >
              ⌂
            </button>
          </div>
        )}
      </div>

      {/* Metadata Panel */}
      {showMetadata && (fileResults || imagePath) && (
        <div className="metadata-panel">
          <h3 className="metadata-title">Image Information</h3>
          
          <div className="metadata-grid">
            {imagePath && (
              <div className="metadata-item">
                <span className="metadata-label">File:</span>
                <span className="metadata-value">{getFileName(imagePath)}</span>
              </div>
            )}

            {fileResults?.fileSize && (
              <div className="metadata-item">
                <span className="metadata-label">Size:</span>
                <span className="metadata-value">{formatFileSize(fileResults.fileSize)}</span>
              </div>
            )}

            {fileResults?.format && (
              <div className="metadata-item">
                <span className="metadata-label">Format:</span>
                <span className="metadata-value">{fileResults.format.toUpperCase()}</span>
              </div>
            )}

            {naturalDimensions && (
              <>
                <div className="metadata-item">
                  <span className="metadata-label">Dimensions:</span>
                  <span className="metadata-value">
                    {naturalDimensions.width} × {naturalDimensions.height}
                  </span>
                </div>
                
                <div className="metadata-item">
                  <span className="metadata-label">Aspect Ratio:</span>
                  <span className="metadata-value">
                    {naturalDimensions.aspectRatio.toFixed(2)}:1
                  </span>
                </div>
              </>
            )}

            {fileResults?.processedAt && (
              <div className="metadata-item">
                <span className="metadata-label">Loaded:</span>
                <span className="metadata-value">
                  {new Date(fileResults.processedAt).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImagePreview;
