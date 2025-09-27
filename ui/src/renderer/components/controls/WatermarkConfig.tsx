/**
 * WatermarkConfig Component
 * 
 * Provides comprehensive watermark configuration interface including:
 * - Enable/disable watermark functionality
 * - Text watermark with customizable content, font, and styling
 * - Image watermark with upload and positioning
 * - Position controls (corners, center, custom coordinates)
 * - Opacity and size adjustments
 * - Real-time preview with live updates
 * - Preset configurations for common watermark styles
 * 
 * Integrates with electron's file system API for image uploads
 * and maintains watermark settings through application state.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { 
  WatermarkConfig as WatermarkConfigType,
  WatermarkPosition,
  WatermarkStyle,
  Size,
  Position
} from '../../types/settings';
import './WatermarkConfig.css';

interface WatermarkConfigProps {
  config: WatermarkConfigType;
  onChange: (config: WatermarkConfigType) => void;
  disabled?: boolean;
  className?: string;
}

interface WatermarkPreset {
  id: string;
  name: string;
  description: string;
  config: Partial<WatermarkConfigType>;
}

interface PositionPreset {
  id: WatermarkPosition;
  name: string;
  description: string;
  position: Position;
}

interface FontOption {
  value: string;
  label: string;
  category: 'system' | 'web' | 'custom';
}

const WATERMARK_PRESETS: WatermarkPreset[] = [
  {
    id: 'signature',
    name: 'Signature',
    description: 'Subtle signature in bottom-right corner',
    config: {
      enabled: true,
      type: 'text',
      text: 'Created with Point Shooting',
      position: 'bottomRight',
      style: {
        fontSize: 14,
        fontFamily: 'system-ui',
        color: '#ffffff',
        backgroundColor: 'transparent',
        opacity: 0.6,
        rotation: 0,
        shadow: true,
        shadowColor: '#000000',
        shadowBlur: 2,
        shadowOffset: { x: 1, y: 1 }
      },
      size: { width: 200, height: 30 },
      offset: { x: -20, y: -20 }
    }
  },
  {
    id: 'copyright',
    name: 'Copyright',
    description: 'Copyright notice with background',
    config: {
      enabled: true,
      type: 'text',
      text: '© 2024 Point Shooting',
      position: 'bottomCenter',
      style: {
        fontSize: 16,
        fontFamily: 'Arial',
        color: '#ffffff',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        opacity: 0.8,
        rotation: 0,
        shadow: false,
        shadowColor: '#000000',
        shadowBlur: 0,
        shadowOffset: { x: 0, y: 0 }
      },
      size: { width: 250, height: 40 },
      offset: { x: 0, y: -30 }
    }
  },
  {
    id: 'logo-corner',
    name: 'Logo Corner',
    description: 'Logo watermark in top-left corner',
    config: {
      enabled: true,
      type: 'image',
      text: '',
      imagePath: '',
      position: 'topLeft',
      style: {
        fontSize: 16,
        fontFamily: 'system-ui',
        color: '#ffffff',
        backgroundColor: 'transparent',
        opacity: 0.7,
        rotation: 0,
        shadow: false,
        shadowColor: '#000000',
        shadowBlur: 0,
        shadowOffset: { x: 0, y: 0 }
      },
      size: { width: 120, height: 60 },
      offset: { x: 20, y: 20 }
    }
  },
  {
    id: 'diagonal',
    name: 'Diagonal',
    description: 'Large diagonal watermark across center',
    config: {
      enabled: true,
      type: 'text',
      text: 'PREVIEW',
      position: 'center',
      style: {
        fontSize: 48,
        fontFamily: 'Impact',
        color: '#ffffff',
        backgroundColor: 'transparent',
        opacity: 0.3,
        rotation: -45,
        shadow: true,
        shadowColor: '#000000',
        shadowBlur: 3,
        shadowOffset: { x: 2, y: 2 }
      },
      size: { width: 400, height: 80 },
      offset: { x: 0, y: 0 }
    }
  }
];

const POSITION_PRESETS: PositionPreset[] = [
  { id: 'topLeft', name: 'Top Left', description: 'Upper left corner', position: { x: 0, y: 0 } },
  { id: 'topCenter', name: 'Top Center', description: 'Top center', position: { x: 0.5, y: 0 } },
  { id: 'topRight', name: 'Top Right', description: 'Upper right corner', position: { x: 1, y: 0 } },
  { id: 'centerLeft', name: 'Center Left', description: 'Left center', position: { x: 0, y: 0.5 } },
  { id: 'center', name: 'Center', description: 'Center position', position: { x: 0.5, y: 0.5 } },
  { id: 'centerRight', name: 'Center Right', description: 'Right center', position: { x: 1, y: 0.5 } },
  { id: 'bottomLeft', name: 'Bottom Left', description: 'Lower left corner', position: { x: 0, y: 1 } },
  { id: 'bottomCenter', name: 'Bottom Center', description: 'Bottom center', position: { x: 0.5, y: 1 } },
  { id: 'bottomRight', name: 'Bottom Right', description: 'Lower right corner', position: { x: 1, y: 1 } }
];

const FONT_OPTIONS: FontOption[] = [
  // System Fonts
  { value: 'system-ui', label: 'System Default', category: 'system' },
  { value: 'Arial', label: 'Arial', category: 'system' },
  { value: 'Helvetica', label: 'Helvetica', category: 'system' },
  { value: 'Times New Roman', label: 'Times New Roman', category: 'system' },
  { value: 'Georgia', label: 'Georgia', category: 'system' },
  { value: 'Verdana', label: 'Verdana', category: 'system' },
  { value: 'Tahoma', label: 'Tahoma', category: 'system' },
  { value: 'Trebuchet MS', label: 'Trebuchet MS', category: 'system' },
  { value: 'Impact', label: 'Impact', category: 'system' },
  { value: 'Comic Sans MS', label: 'Comic Sans MS', category: 'system' },
  { value: 'Courier New', label: 'Courier New', category: 'system' },
  
  // Web Fonts (commonly available)
  { value: 'Inter', label: 'Inter', category: 'web' },
  { value: 'Roboto', label: 'Roboto', category: 'web' },
  { value: 'Open Sans', label: 'Open Sans', category: 'web' },
  { value: 'Lato', label: 'Lato', category: 'web' },
  { value: 'Montserrat', label: 'Montserrat', category: 'web' },
  { value: 'Source Sans Pro', label: 'Source Sans Pro', category: 'web' }
];

export const WatermarkConfig: React.FC<WatermarkConfigProps> = ({
  config,
  onChange,
  disabled = false,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'position' | 'style' | 'presets'>('basic');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [previewText, setPreviewText] = useState('Sample Text');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update preview text based on current config
  useEffect(() => {
    if (config.text && config.text.trim()) {
      setPreviewText(config.text);
    }
  }, [config.text]);

  const handleEnabledChange = useCallback((enabled: boolean) => {
    onChange({ ...config, enabled });
  }, [config, onChange]);

  const handleTypeChange = useCallback((type: 'text' | 'image') => {
    onChange({ ...config, type });
  }, [config, onChange]);

  const handleTextChange = useCallback((text: string) => {
    onChange({ ...config, text });
  }, [config, onChange]);

  const handlePositionChange = useCallback((position: WatermarkPosition) => {
    const preset = POSITION_PRESETS.find(p => p.id === position);
    if (preset) {
      onChange({ 
        ...config, 
        position,
        customPosition: preset.position
      });
    }
  }, [config, onChange]);

  const handleCustomPositionChange = useCallback((customPosition: Position) => {
    onChange({ 
      ...config, 
      position: 'custom',
      customPosition 
    });
  }, [config, onChange]);

  const handleStyleChange = useCallback((style: Partial<WatermarkStyle>) => {
    onChange({ 
      ...config, 
      style: { ...config.style, ...style }
    });
  }, [config, onChange]);

  const handleSizeChange = useCallback((size: Partial<Size>) => {
    onChange({ 
      ...config, 
      size: { ...config.size, ...size }
    });
  }, [config, onChange]);

  const handleOffsetChange = useCallback((offset: Partial<Position>) => {
    onChange({ 
      ...config, 
      offset: { ...config.offset, ...offset }
    });
  }, [config, onChange]);

  const handleImageUpload = useCallback(async () => {
    if (!window.electron) {
      console.warn('Electron API not available');
      return;
    }

    try {
      const result = await window.electron.dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
          { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg'] }
        ]
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const imagePath = result.filePaths[0];
        onChange({ ...config, imagePath });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  }, [config, onChange]);

  const handlePresetApply = useCallback((preset: WatermarkPreset) => {
    const newConfig = { ...config, ...preset.config };
    onChange(newConfig);
  }, [config, onChange]);

  const renderPreview = () => {
    if (!config.enabled) {
      return (
        <div className="watermark-preview disabled">
          <div className="preview-content">
            <span className="preview-text">Watermark Disabled</span>
          </div>
        </div>
      );
    }

    const previewStyle: React.CSSProperties = {
      position: 'absolute',
      fontSize: `${config.style.fontSize}px`,
      fontFamily: config.style.fontFamily,
      color: config.style.color,
      backgroundColor: config.style.backgroundColor,
      opacity: config.style.opacity,
      transform: `rotate(${config.style.rotation}deg)`,
      width: `${config.size.width}px`,
      height: `${config.size.height}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '8px',
      borderRadius: '4px',
      textShadow: config.style.shadow 
        ? `${config.style.shadowOffset.x}px ${config.style.shadowOffset.y}px ${config.style.shadowBlur}px ${config.style.shadowColor}`
        : 'none',
      zIndex: 10
    };

    // Calculate position
    const position = config.position === 'custom' ? config.customPosition : 
      POSITION_PRESETS.find(p => p.id === config.position)?.position || { x: 0.5, y: 0.5 };

    const left = `${position.x * 100}%`;
    const top = `${position.y * 100}%`;
    const transformOrigin = `${position.x * 100}% ${position.y * 100}%`;

    previewStyle.left = left;
    previewStyle.top = top;
    previewStyle.transformOrigin = transformOrigin;
    previewStyle.transform = `translate(-${position.x * 100}%, -${position.y * 100}%) rotate(${config.style.rotation}deg)`;

    // Apply offset
    if (config.offset.x !== 0 || config.offset.y !== 0) {
      previewStyle.marginLeft = `${config.offset.x}px`;
      previewStyle.marginTop = `${config.offset.y}px`;
    }

    return (
      <div className="watermark-preview">
        <div className="preview-background">
          <div className="preview-content">
            <span className="preview-text">Preview Background</span>
          </div>
          <div style={previewStyle} className="watermark-element">
            {config.type === 'text' ? (
              <span className="watermark-text">{previewText}</span>
            ) : (
              <div className="watermark-image">
                {config.imagePath ? (
                  <img 
                    src={`file://${config.imagePath}`} 
                    alt="Watermark" 
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <span className="image-placeholder">📷</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderBasicTab = () => (
    <div className="basic-tab">
      <div className="enable-section">
        <label className="enable-checkbox">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => handleEnabledChange(e.target.checked)}
            disabled={disabled}
          />
          <span className="checkbox-label">Enable Watermark</span>
        </label>
      </div>

      {config.enabled && (
        <>
          <div className="type-section">
            <label className="input-label">Watermark Type</label>
            <div className="type-buttons">
              <button
                type="button"
                className={`type-button ${config.type === 'text' ? 'active' : ''}`}
                onClick={() => handleTypeChange('text')}
                disabled={disabled}
              >
                <span className="type-icon">📝</span>
                <span className="type-text">Text</span>
              </button>
              <button
                type="button"
                className={`type-button ${config.type === 'image' ? 'active' : ''}`}
                onClick={() => handleTypeChange('image')}
                disabled={disabled}
              >
                <span className="type-icon">🖼️</span>
                <span className="type-text">Image</span>
              </button>
            </div>
          </div>

          {config.type === 'text' && (
            <div className="text-section">
              <label htmlFor="watermark-text" className="input-label">
                Watermark Text
              </label>
              <textarea
                id="watermark-text"
                value={config.text}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="Enter watermark text..."
                className="text-input"
                rows={3}
                disabled={disabled}
              />
            </div>
          )}

          {config.type === 'image' && (
            <div className="image-section">
              <label className="input-label">Watermark Image</label>
              <div className="image-upload">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                  disabled={disabled}
                />
                <button
                  type="button"
                  className="upload-button"
                  onClick={handleImageUpload}
                  disabled={disabled}
                >
                  {config.imagePath ? 'Change Image' : 'Select Image'}
                </button>
                {config.imagePath && (
                  <div className="selected-file">
                    <span className="file-name">{config.imagePath.split(/[\\/]/).pop()}</span>
                    <button
                      type="button"
                      className="clear-button"
                      onClick={() => onChange({ ...config, imagePath: '' })}
                      disabled={disabled}
                      title="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderPositionTab = () => (
    <div className="position-tab">
      <div className="position-presets">
        <label className="input-label">Position Presets</label>
        <div className="position-grid">
          {POSITION_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`position-button ${config.position === preset.id ? 'active' : ''}`}
              onClick={() => handlePositionChange(preset.id)}
              disabled={disabled || !config.enabled}
              title={preset.description}
            >
              <span className="position-name">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="custom-position">
        <label className="input-label">Custom Position</label>
        <div className="position-controls">
          <div className="position-input-group">
            <label htmlFor="position-x" className="position-label">X (0-1)</label>
            <input
              id="position-x"
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={config.customPosition?.x || 0.5}
              onChange={(e) => handleCustomPositionChange({
                ...config.customPosition,
                x: parseFloat(e.target.value) || 0
              })}
              className="position-input"
              disabled={disabled || !config.enabled}
            />
          </div>
          <div className="position-input-group">
            <label htmlFor="position-y" className="position-label">Y (0-1)</label>
            <input
              id="position-y"
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={config.customPosition?.y || 0.5}
              onChange={(e) => handleCustomPositionChange({
                ...config.customPosition,
                y: parseFloat(e.target.value) || 0
              })}
              className="position-input"
              disabled={disabled || !config.enabled}
            />
          </div>
        </div>
      </div>

      <div className="offset-controls">
        <label className="input-label">Offset (pixels)</label>
        <div className="offset-inputs">
          <div className="offset-input-group">
            <label htmlFor="offset-x" className="offset-label">X</label>
            <input
              id="offset-x"
              type="number"
              step="1"
              value={config.offset?.x || 0}
              onChange={(e) => handleOffsetChange({
                ...config.offset,
                x: parseInt(e.target.value) || 0
              })}
              className="offset-input"
              disabled={disabled || !config.enabled}
            />
          </div>
          <div className="offset-input-group">
            <label htmlFor="offset-y" className="offset-label">Y</label>
            <input
              id="offset-y"
              type="number"
              step="1"
              value={config.offset?.y || 0}
              onChange={(e) => handleOffsetChange({
                ...config.offset,
                y: parseInt(e.target.value) || 0
              })}
              className="offset-input"
              disabled={disabled || !config.enabled}
            />
          </div>
        </div>
      </div>

      <div className="size-controls">
        <label className="input-label">Size (pixels)</label>
        <div className="size-inputs">
          <div className="size-input-group">
            <label htmlFor="size-width" className="size-label">Width</label>
            <input
              id="size-width"
              type="number"
              min="10"
              max="1000"
              step="1"
              value={config.size?.width || 200}
              onChange={(e) => handleSizeChange({
                ...config.size,
                width: parseInt(e.target.value) || 200
              })}
              className="size-input"
              disabled={disabled || !config.enabled}
            />
          </div>
          <div className="size-input-group">
            <label htmlFor="size-height" className="size-label">Height</label>
            <input
              id="size-height"
              type="number"
              min="10"
              max="1000"
              step="1"
              value={config.size?.height || 60}
              onChange={(e) => handleSizeChange({
                ...config.size,
                height: parseInt(e.target.value) || 60
              })}
              className="size-input"
              disabled={disabled || !config.enabled}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStyleTab = () => (
    <div className="style-tab">
      {config.type === 'text' && (
        <>
          <div className="font-controls">
            <div className="font-family-group">
              <label htmlFor="font-family" className="input-label">Font Family</label>
              <select
                id="font-family"
                value={config.style.fontFamily}
                onChange={(e) => handleStyleChange({ fontFamily: e.target.value })}
                className="font-family-select"
                disabled={disabled || !config.enabled}
              >
                <optgroup label="System Fonts">
                  {FONT_OPTIONS.filter(f => f.category === 'system').map(font => (
                    <option key={font.value} value={font.value}>{font.label}</option>
                  ))}
                </optgroup>
                <optgroup label="Web Fonts">
                  {FONT_OPTIONS.filter(f => f.category === 'web').map(font => (
                    <option key={font.value} value={font.value}>{font.label}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="font-size-group">
              <label htmlFor="font-size" className="input-label">
                Font Size: <span className="size-value">{config.style.fontSize}px</span>
              </label>
              <input
                id="font-size"
                type="range"
                min="8"
                max="72"
                step="1"
                value={config.style.fontSize}
                onChange={(e) => handleStyleChange({ fontSize: parseInt(e.target.value) })}
                className="font-size-slider"
                disabled={disabled || !config.enabled}
              />
            </div>
          </div>
        </>
      )}

      <div className="color-controls">
        <div className="text-color-group">
          <label htmlFor="text-color" className="input-label">
            {config.type === 'text' ? 'Text Color' : 'Tint Color'}
          </label>
          <div className="color-input-container">
            <input
              id="text-color"
              type="color"
              value={config.style.color}
              onChange={(e) => handleStyleChange({ color: e.target.value })}
              className="color-input"
              disabled={disabled || !config.enabled}
            />
            <input
              type="text"
              value={config.style.color}
              onChange={(e) => handleStyleChange({ color: e.target.value })}
              className="color-text-input"
              placeholder="#ffffff"
              disabled={disabled || !config.enabled}
            />
          </div>
        </div>

        <div className="bg-color-group">
          <label htmlFor="bg-color" className="input-label">Background Color</label>
          <div className="color-input-container">
            <input
              id="bg-color"
              type="color"
              value={config.style.backgroundColor === 'transparent' ? '#000000' : config.style.backgroundColor}
              onChange={(e) => handleStyleChange({ backgroundColor: e.target.value })}
              className="color-input"
              disabled={disabled || !config.enabled}
            />
            <input
              type="text"
              value={config.style.backgroundColor}
              onChange={(e) => handleStyleChange({ backgroundColor: e.target.value })}
              className="color-text-input"
              placeholder="transparent"
              disabled={disabled || !config.enabled}
            />
            <button
              type="button"
              className="transparent-button"
              onClick={() => handleStyleChange({ backgroundColor: 'transparent' })}
              disabled={disabled || !config.enabled}
              title="Make transparent"
            >
              🚫
            </button>
          </div>
        </div>
      </div>

      <div className="effect-controls">
        <div className="opacity-group">
          <label htmlFor="opacity" className="input-label">
            Opacity: <span className="opacity-value">{Math.round(config.style.opacity * 100)}%</span>
          </label>
          <input
            id="opacity"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={config.style.opacity}
            onChange={(e) => handleStyleChange({ opacity: parseFloat(e.target.value) })}
            className="opacity-slider"
            disabled={disabled || !config.enabled}
          />
        </div>

        <div className="rotation-group">
          <label htmlFor="rotation" className="input-label">
            Rotation: <span className="rotation-value">{config.style.rotation}°</span>
          </label>
          <input
            id="rotation"
            type="range"
            min="-180"
            max="180"
            step="1"
            value={config.style.rotation}
            onChange={(e) => handleStyleChange({ rotation: parseInt(e.target.value) })}
            className="rotation-slider"
            disabled={disabled || !config.enabled}
          />
        </div>

        <div className="shadow-controls">
          <label className="shadow-checkbox">
            <input
              type="checkbox"
              checked={config.style.shadow}
              onChange={(e) => handleStyleChange({ shadow: e.target.checked })}
              disabled={disabled || !config.enabled}
            />
            <span className="checkbox-label">Drop Shadow</span>
          </label>

          {config.style.shadow && (
            <div className="shadow-properties">
              <div className="shadow-color-group">
                <label htmlFor="shadow-color" className="input-label">Shadow Color</label>
                <div className="color-input-container">
                  <input
                    id="shadow-color"
                    type="color"
                    value={config.style.shadowColor}
                    onChange={(e) => handleStyleChange({ shadowColor: e.target.value })}
                    className="color-input"
                    disabled={disabled || !config.enabled}
                  />
                  <input
                    type="text"
                    value={config.style.shadowColor}
                    onChange={(e) => handleStyleChange({ shadowColor: e.target.value })}
                    className="color-text-input"
                    placeholder="#000000"
                    disabled={disabled || !config.enabled}
                  />
                </div>
              </div>

              <div className="shadow-blur-group">
                <label htmlFor="shadow-blur" className="input-label">
                  Blur: <span className="blur-value">{config.style.shadowBlur}px</span>
                </label>
                <input
                  id="shadow-blur"
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={config.style.shadowBlur}
                  onChange={(e) => handleStyleChange({ shadowBlur: parseInt(e.target.value) })}
                  className="shadow-blur-slider"
                  disabled={disabled || !config.enabled}
                />
              </div>

              <div className="shadow-offset-controls">
                <div className="shadow-offset-group">
                  <label htmlFor="shadow-x" className="input-label">X Offset</label>
                  <input
                    id="shadow-x"
                    type="number"
                    min="-10"
                    max="10"
                    step="1"
                    value={config.style.shadowOffset.x}
                    onChange={(e) => handleStyleChange({ 
                      shadowOffset: { 
                        ...config.style.shadowOffset, 
                        x: parseInt(e.target.value) || 0 
                      } 
                    })}
                    className="shadow-offset-input"
                    disabled={disabled || !config.enabled}
                  />
                </div>
                <div className="shadow-offset-group">
                  <label htmlFor="shadow-y" className="input-label">Y Offset</label>
                  <input
                    id="shadow-y"
                    type="number"
                    min="-10"
                    max="10"
                    step="1"
                    value={config.style.shadowOffset.y}
                    onChange={(e) => handleStyleChange({ 
                      shadowOffset: { 
                        ...config.style.shadowOffset, 
                        y: parseInt(e.target.value) || 0 
                      } 
                    })}
                    className="shadow-offset-input"
                    disabled={disabled || !config.enabled}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderPresetsTab = () => (
    <div className="presets-tab">
      <div className="presets-description">
        <p>Choose from predefined watermark configurations to quickly set up common watermark styles.</p>
      </div>

      <div className="preset-list">
        {WATERMARK_PRESETS.map((preset) => (
          <div key={preset.id} className="preset-item">
            <div className="preset-info">
              <h4 className="preset-name">{preset.name}</h4>
              <p className="preset-description">{preset.description}</p>
            </div>
            <button
              type="button"
              className="apply-preset-button"
              onClick={() => handlePresetApply(preset)}
              disabled={disabled}
            >
              Apply
            </button>
          </div>
        ))}
      </div>

      <div className="advanced-toggle">
        <label className="advanced-checkbox">
          <input
            type="checkbox"
            checked={showAdvanced}
            onChange={(e) => setShowAdvanced(e.target.checked)}
            disabled={disabled}
          />
          <span className="checkbox-label">Show Advanced Options</span>
        </label>
      </div>

      {showAdvanced && (
        <div className="advanced-options">
          <div className="export-import">
            <button
              type="button"
              className="export-button"
              onClick={() => {
                const dataStr = JSON.stringify(config, null, 2);
                const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                const exportFileDefaultName = 'watermark-config.json';
                const linkElement = document.createElement('a');
                linkElement.setAttribute('href', dataUri);
                linkElement.setAttribute('download', exportFileDefaultName);
                linkElement.click();
              }}
              disabled={disabled}
            >
              Export Config
            </button>
            <button
              type="button"
              className="import-button"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      try {
                        const importedConfig = JSON.parse(e.target?.result as string);
                        onChange(importedConfig);
                      } catch (error) {
                        console.error('Error importing config:', error);
                      }
                    };
                    reader.readAsText(file);
                  }
                };
                input.click();
              }}
              disabled={disabled}
            >
              Import Config
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className={`watermark-config ${disabled ? 'disabled' : ''} ${className}`}>
      <div className="watermark-header">
        <h3 className="config-title">Watermark Configuration</h3>
        <p className="config-description">
          Configure watermark appearance and positioning with real-time preview.
        </p>
      </div>

      {renderPreview()}

      <div className="watermark-tabs">
        <button
          type="button"
          className={`tab-button ${activeTab === 'basic' ? 'active' : ''}`}
          onClick={() => setActiveTab('basic')}
          disabled={disabled}
        >
          Basic
        </button>
        <button
          type="button"
          className={`tab-button ${activeTab === 'position' ? 'active' : ''}`}
          onClick={() => setActiveTab('position')}
          disabled={disabled}
        >
          Position
        </button>
        <button
          type="button"
          className={`tab-button ${activeTab === 'style' ? 'active' : ''}`}
          onClick={() => setActiveTab('style')}
          disabled={disabled}
        >
          Style
        </button>
        <button
          type="button"
          className={`tab-button ${activeTab === 'presets' ? 'active' : ''}`}
          onClick={() => setActiveTab('presets')}
          disabled={disabled}
        >
          Presets
        </button>
      </div>

      <div className="watermark-content">
        {activeTab === 'basic' && renderBasicTab()}
        {activeTab === 'position' && renderPositionTab()}
        {activeTab === 'style' && renderStyleTab()}
        {activeTab === 'presets' && renderPresetsTab()}
      </div>
    </div>
  );
};
