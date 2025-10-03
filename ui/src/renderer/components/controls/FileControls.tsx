/**
 * FileControls Component
 *
 * Provides file selection and image loading controls for the Point Shooting application.
 * Handles File > Open Image menu actions, integrates with FileManager IPC, and manages
 * image preview and metadata display.
 */

import React, { useState, useCallback, useRef } from 'react';
import { ImagePreview } from '../ImagePreview';
import './FileControls.css';

interface FileInfo {
  name: string;
  path: string;
  size: number;
  type: string;
  width?: number;
  height?: number;
  lastModified: Date;
}

interface FileControlsProps {
  onImageSelected: (fileInfo: FileInfo) => void;
  onError: (error: string) => void;
  currentImage?: FileInfo;
  disabled?: boolean;
  className?: string;
  'data-testid'?: string;
}

export const FileControls: React.FC<FileControlsProps> = ({
  onImageSelected,
  onError,
  currentImage,
  disabled = false,
  className = '',
  'data-testid': testId = 'file-controls'
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Process selected file
  const processFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        const errorMessage = `Unsupported file type: ${file.type}. Please select a valid image file.`;
        setError(errorMessage);
        onError(errorMessage);
        return;
      }

      // Validate file size (50MB limit)
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        const errorMessage = `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum size is 50MB.`;
        setError(errorMessage);
        onError(errorMessage);
        return;
      }

      // Get image dimensions
      const dimensions = await getImageDimensions(file);

      // Validate image dimensions (4096px max)
      const maxDimension = 4096;
      if (dimensions.width > maxDimension) {
        const errorMessage = `Image too wide. Maximum width is ${maxDimension}px.`;
        setError(errorMessage);
        onError(errorMessage);
        return;
      }
      if (dimensions.height > maxDimension) {
        const errorMessage = `Image too tall. Maximum height is ${maxDimension}px.`;
        setError(errorMessage);
        onError(errorMessage);
        return;
      }

      const fileInfo: FileInfo = {
        name: file.name,
        path: '', // Will be set by FileManager IPC
        size: file.size,
        type: file.type,
        width: dimensions.width,
        height: dimensions.height,
        lastModified: new Date(file.lastModified)
      };

      onImageSelected(fileInfo);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process file';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [onImageSelected, onError]);

  // Handle file selection via file input
  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await processFile(file);
  }, [processFile]);

  // Handle drag and drop
  const handleDrop = useCallback(async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer.files;
    if (files.length === 0) return;

    const file = files[0];
    if (!file) return;
    await processFile(file);
  }, [processFile]);

  // Handle drag over
  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  // Get image dimensions
  const getImageDimensions = useCallback((file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  }, []);

  // Open file dialog
  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Clear current image
  const clearImage = useCallback(() => {
    setError(null);
    // Note: This would normally call onImageSelected with null or clear the current image
  }, []);

  return (
    <div className={`file-controls ${className}`} data-testid={testId}>
      {/* File Selection Area */}
      <div className="file-selection-area">
        <div
          className={`drop-zone ${isLoading ? 'loading' : ''} ${error ? 'error' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          data-testid="drop-zone"
        >
          <div className="drop-zone-content">
            {isLoading ? (
              <div className="loading-indicator" data-testid="loading-indicator">
                <div className="spinner"></div>
                <p>Processing image...</p>
              </div>
            ) : error ? (
              <div className="error-display" data-testid="error-display">
                <div className="error-icon">⚠️</div>
                <p className="error-message">{error}</p>
                <button
                  className="retry-button"
                  onClick={() => setError(null)}
                  data-testid="retry-button"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <>
                <div className="drop-icon">📁</div>
                <h3>Load Image</h3>
                <p>Drag & drop an image here, or click to browse</p>
                <button
                  className="browse-button"
                  onClick={openFileDialog}
                  disabled={disabled}
                  data-testid="browse-button"
                >
                  Browse Files
                </button>
              </>
            )}
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          data-testid="file-input"
        />
      </div>

      {/* Current Image Preview */}
      {currentImage && (
        <div className="current-image-section" data-testid="current-image-section">
          <h4>Current Image</h4>
          <ImagePreview
            imagePath={currentImage.path}
            showMetadata={true}
            maxWidth={200}
            maxHeight={200}
            data-testid="current-image-preview"
          />

          {/* Image Metadata */}
          <div className="image-metadata" data-testid="image-metadata">
            <div className="metadata-item">
              <span className="metadata-label">Name:</span>
              <span className="metadata-value">{currentImage.name}</span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">Size:</span>
              <span className="metadata-value">{(currentImage.size / 1024).toFixed(1)} KB</span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">Dimensions:</span>
              <span className="metadata-value">
                {currentImage.width} × {currentImage.height}
              </span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">Type:</span>
              <span className="metadata-value">{currentImage.type}</span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">Modified:</span>
              <span className="metadata-value">{currentImage.lastModified.toLocaleDateString()}</span>
            </div>
          </div>

          <button
            className="clear-button"
            onClick={clearImage}
            disabled={disabled}
            data-testid="clear-button"
          >
            Clear Image
          </button>
        </div>
      )}
    </div>
  );
};
