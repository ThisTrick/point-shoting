/**
 * BackgroundSelector Component
 * 
 * Provides comprehensive background selection interface including:
 * - Multiple background types (solid colors, gradients, images, patterns)
 * - Color picker with palette and custom color input
 * - Gradient editor with multiple stops and direction control
 * - Image upload with positioning and scaling options
 * - Pattern selection with customizable properties
 * - Real-time preview with animation effects
 */

import React, { useState, useCallback, useRef, useMemo } from 'react';
import './BackgroundSelector.css';

// Temporary type definitions - will be replaced with proper imports
interface BackgroundConfig {
  type: 'solid' | 'gradient' | 'image' | 'pattern' | 'transparent';
  solid?: {
    color: string;
  };
  gradient?: {
    type: 'linear' | 'radial';
    direction: number; // degrees for linear, not used for radial
    stops: Array<{ color: string; position: number }>;
  };
  image?: {
    src: string;
    size: 'cover' | 'contain' | 'stretch' | 'tile';
    position: { x: number; y: number }; // percentage
    opacity: number;
  };
  pattern?: {
    type: 'dots' | 'grid' | 'diagonal' | 'hexagon' | 'wave';
    color: string;
    backgroundColor: string;
    size: number;
    opacity: number;
  };
}

interface BackgroundSelectorProps {
  background: BackgroundConfig;
  onBackgroundChange: (background: BackgroundConfig) => void;
  disabled?: boolean;
  showPreview?: boolean;
  className?: string;
  'data-testid'?: string;
}

const COLOR_PALETTES = {
  basic: [
    '#000000', '#ffffff', '#808080', '#c0c0c0',
    '#800000', '#ff0000', '#808000', '#ffff00',
    '#008000', '#00ff00', '#008080', '#00ffff',
    '#000080', '#0000ff', '#800080', '#ff00ff'
  ],
  material: [
    '#f44336', '#e91e63', '#9c27b0', '#673ab7',
    '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
    '#009688', '#4caf50', '#8bc34a', '#cddc39',
    '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'
  ],
  pastels: [
    '#ffcdd2', '#f8bbd9', '#e1bee7', '#d1c4e9',
    '#c5cae9', '#bbdefb', '#b3e5fc', '#b2dfdb',
    '#c8e6c9', '#dcedc8', '#f0f4c3', '#fff9c4',
    '#ffecb3', '#ffe0b2', '#ffccbc', '#d7ccc8'
  ]
};

const GRADIENT_PRESETS = [
  { name: 'Sunset', stops: [{ color: '#ff7e5f', position: 0 }, { color: '#feb47b', position: 100 }] },
  { name: 'Ocean', stops: [{ color: '#667eea', position: 0 }, { color: '#764ba2', position: 100 }] },
  { name: 'Forest', stops: [{ color: '#11998e', position: 0 }, { color: '#38ef7d', position: 100 }] },
  { name: 'Purple', stops: [{ color: '#667eea', position: 0 }, { color: '#764ba2', position: 100 }] },
  { name: 'Rainbow', stops: [
    { color: '#ff0000', position: 0 },
    { color: '#ffff00', position: 33 },
    { color: '#00ff00', position: 66 },
    { color: '#0000ff', position: 100 }
  ]},
];

const PATTERN_TYPES = [
  { id: 'dots', name: 'Dots', icon: '⚫' },
  { id: 'grid', name: 'Grid', icon: '⚏' },
  { id: 'diagonal', name: 'Diagonal', icon: '⧄' },
  { id: 'hexagon', name: 'Hexagon', icon: '⬢' },
  { id: 'wave', name: 'Wave', icon: '〜' },
];

// Temporary hooks - will be replaced with proper implementations
const useLocalization = () => ({
  t: (key: string) => key,
  currentLocale: 'en'
});

export const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({
  background,
  onBackgroundChange,
  disabled = false,
  showPreview = true,
  className = '',
  'data-testid': testId = 'background-selector'
}) => {
  const { t } = useLocalization();
  const [activeTab, setActiveTab] = useState<BackgroundConfig['type']>(background.type);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedPalette, setSelectedPalette] = useState<keyof typeof COLOR_PALETTES>('basic');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate CSS background string for preview
  const getBackgroundCSS = useCallback((config: BackgroundConfig): string => {
    switch (config.type) {
      case 'transparent':
        return 'transparent';
      
      case 'solid':
        return config.solid?.color || '#ffffff';
      
      case 'gradient':
        if (!config.gradient) return '#ffffff';
        
        const { type, direction, stops } = config.gradient;
        const sortedStops = [...stops].sort((a, b) => a.position - b.position);
        const stopsCSS = sortedStops.map(stop => `${stop.color} ${stop.position}%`).join(', ');
        
        if (type === 'linear') {
          return `linear-gradient(${direction}deg, ${stopsCSS})`;
        } else {
          return `radial-gradient(circle, ${stopsCSS})`;
        }
      
      case 'image':
        if (!config.image) return '#ffffff';
        
        const { src, size, position, opacity } = config.image;
        let backgroundSize: string;
        
        switch (size) {
          case 'cover': backgroundSize = 'cover'; break;
          case 'contain': backgroundSize = 'contain'; break;
          case 'stretch': backgroundSize = '100% 100%'; break;
          case 'tile': backgroundSize = 'auto'; break;
          default: backgroundSize = 'cover';
        }
        
        return `url(${src})`;
      
      case 'pattern':
        if (!config.pattern) return '#ffffff';
        
        // For now, return the background color - patterns would need SVG generation
        return config.pattern.backgroundColor;
      
      default:
        return '#ffffff';
    }
  }, []);

  // Update background configuration
  const updateBackground = useCallback((updates: Partial<BackgroundConfig>) => {
    onBackgroundChange({ ...background, ...updates });
  }, [background, onBackgroundChange]);

  // Handle tab change
  const handleTabChange = useCallback((type: BackgroundConfig['type']) => {
    setActiveTab(type);
    
    // Initialize with default values for the selected type
    const defaultConfigs: Record<BackgroundConfig['type'], BackgroundConfig> = {
      transparent: { type: 'transparent' },
      solid: { type: 'solid', solid: { color: '#ffffff' } },
      gradient: {
        type: 'gradient',
        gradient: {
          type: 'linear',
          direction: 45,
          stops: [
            { color: '#667eea', position: 0 },
            { color: '#764ba2', position: 100 }
          ]
        }
      },
      image: {
        type: 'image',
        image: {
          src: '',
          size: 'cover',
          position: { x: 50, y: 50 },
          opacity: 1
        }
      },
      pattern: {
        type: 'pattern',
        pattern: {
          type: 'dots',
          color: '#000000',
          backgroundColor: '#ffffff',
          size: 10,
          opacity: 0.1
        }
      }
    };

    updateBackground(defaultConfigs[type]);
  }, [updateBackground]);

  // Handle solid color change
  const handleSolidColorChange = useCallback((color: string) => {
    updateBackground({
      type: 'solid',
      solid: { color }
    });
  }, [updateBackground]);

  // Handle gradient changes
  const handleGradientChange = useCallback((updates: Partial<NonNullable<BackgroundConfig['gradient']>>) => {
    const currentGradient = background.gradient || {
      type: 'linear' as const,
      direction: 45,
      stops: [{ color: '#667eea', position: 0 }, { color: '#764ba2', position: 100 }]
    };

    updateBackground({
      type: 'gradient',
      gradient: { ...currentGradient, ...updates }
    });
  }, [background.gradient, updateBackground]);

  // Add gradient stop
  const addGradientStop = useCallback(() => {
    if (!background.gradient) return;
    
    const stops = [...background.gradient.stops];
    const position = stops.length > 0 ? Math.max(...stops.map(s => s.position)) + 10 : 50;
    stops.push({ color: '#ffffff', position: Math.min(100, position) });
    
    handleGradientChange({ stops });
  }, [background.gradient, handleGradientChange]);

  // Remove gradient stop
  const removeGradientStop = useCallback((index: number) => {
    if (!background.gradient || background.gradient.stops.length <= 2) return;
    
    const stops = [...background.gradient.stops];
    stops.splice(index, 1);
    
    handleGradientChange({ stops });
  }, [background.gradient, handleGradientChange]);

  // Update gradient stop
  const updateGradientStop = useCallback((index: number, updates: Partial<{ color: string; position: number }>) => {
    if (!background.gradient) return;
    
    const stops = [...background.gradient.stops];
    stops[index] = { ...stops[index], ...updates };
    
    handleGradientChange({ stops });
  }, [background.gradient, handleGradientChange]);

  // Handle image upload
  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      updateBackground({
        type: 'image',
        image: {
          src,
          size: 'cover',
          position: { x: 50, y: 50 },
          opacity: 1
        }
      });
    };
    reader.readAsDataURL(file);
  }, [updateBackground]);

  // Handle image configuration changes
  const handleImageChange = useCallback((updates: Partial<NonNullable<BackgroundConfig['image']>>) => {
    const currentImage = background.image || {
      src: '',
      size: 'cover' as const,
      position: { x: 50, y: 50 },
      opacity: 1
    };

    updateBackground({
      type: 'image',
      image: { ...currentImage, ...updates }
    });
  }, [background.image, updateBackground]);

  // Handle pattern changes
  const handlePatternChange = useCallback((updates: Partial<NonNullable<BackgroundConfig['pattern']>>) => {
    const currentPattern = background.pattern || {
      type: 'dots' as const,
      color: '#000000',
      backgroundColor: '#ffffff',
      size: 10,
      opacity: 0.1
    };

    updateBackground({
      type: 'pattern',
      pattern: { ...currentPattern, ...updates }
    });
  }, [background.pattern, updateBackground]);

  // Apply gradient preset
  const applyGradientPreset = useCallback((preset: typeof GRADIENT_PRESETS[0]) => {
    handleGradientChange({
      stops: preset.stops.map(stop => ({ ...stop }))
    });
  }, [handleGradientChange]);

  // Get preview style
  const previewStyle = useMemo(() => {
    const backgroundCSS = getBackgroundCSS(background);
    
    const style: React.CSSProperties = {
      background: backgroundCSS,
    };

    if (background.type === 'image' && background.image) {
      const { size, position, opacity } = background.image;
      
      switch (size) {
        case 'cover':
          style.backgroundSize = 'cover';
          break;
        case 'contain':
          style.backgroundSize = 'contain';
          break;
        case 'stretch':
          style.backgroundSize = '100% 100%';
          break;
        case 'tile':
          style.backgroundSize = 'auto';
          style.backgroundRepeat = 'repeat';
          break;
      }
      
      style.backgroundPosition = `${position.x}% ${position.y}%`;
      style.opacity = opacity;
    }

    return style;
  }, [background, getBackgroundCSS]);

  return (
    <div 
      className={`background-selector ${disabled ? 'disabled' : ''} ${className}`}
      data-testid={testId}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageUpload}
        disabled={disabled}
      />

      {showPreview && (
        <div className="background-preview">
          <div 
            className="preview-area"
            style={previewStyle}
          >
            <div className="preview-content">
              <span className="preview-text">{t('background_selector.preview')}</span>
            </div>
          </div>
        </div>
      )}

      <div className="background-tabs">
        <button
          type="button"
          className={`tab-button ${activeTab === 'transparent' ? 'active' : ''}`}
          onClick={() => handleTabChange('transparent')}
          disabled={disabled}
        >
          {t('background_selector.transparent')}
        </button>
        <button
          type="button"
          className={`tab-button ${activeTab === 'solid' ? 'active' : ''}`}
          onClick={() => handleTabChange('solid')}
          disabled={disabled}
        >
          {t('background_selector.solid_color')}
        </button>
        <button
          type="button"
          className={`tab-button ${activeTab === 'gradient' ? 'active' : ''}`}
          onClick={() => handleTabChange('gradient')}
          disabled={disabled}
        >
          {t('background_selector.gradient')}
        </button>
        <button
          type="button"
          className={`tab-button ${activeTab === 'image' ? 'active' : ''}`}
          onClick={() => handleTabChange('image')}
          disabled={disabled}
        >
          {t('background_selector.image')}
        </button>
        <button
          type="button"
          className={`tab-button ${activeTab === 'pattern' ? 'active' : ''}`}
          onClick={() => handleTabChange('pattern')}
          disabled={disabled}
        >
          {t('background_selector.pattern')}
        </button>
      </div>

      <div className="background-content">
        {activeTab === 'transparent' && (
          <div className="transparent-panel">
            <p className="panel-description">
              {t('background_selector.transparent_description')}
            </p>
          </div>
        )}

        {activeTab === 'solid' && (
          <div className="solid-panel">
            <div className="color-input-group">
              <label htmlFor="solid-color" className="input-label">
                {t('background_selector.color')}
              </label>
              <div className="color-input-container">
                <input
                  id="solid-color"
                  type="color"
                  value={background.solid?.color || '#ffffff'}
                  onChange={(e) => handleSolidColorChange(e.target.value)}
                  disabled={disabled}
                  className="color-input"
                />
                <input
                  type="text"
                  value={background.solid?.color || '#ffffff'}
                  onChange={(e) => handleSolidColorChange(e.target.value)}
                  disabled={disabled}
                  className="color-text-input"
                  placeholder="#ffffff"
                />
              </div>
            </div>

            <div className="color-palettes">
              <div className="palette-tabs">
                {Object.keys(COLOR_PALETTES).map(paletteKey => (
                  <button
                    key={paletteKey}
                    type="button"
                    className={`palette-tab ${selectedPalette === paletteKey ? 'active' : ''}`}
                    onClick={() => setSelectedPalette(paletteKey as keyof typeof COLOR_PALETTES)}
                    disabled={disabled}
                  >
                    {t(`background_selector.palette_${paletteKey}`)}
                  </button>
                ))}
              </div>

              <div className="color-palette">
                {COLOR_PALETTES[selectedPalette].map(color => (
                  <button
                    key={color}
                    type="button"
                    className={`color-swatch ${background.solid?.color === color ? 'active' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleSolidColorChange(color)}
                    disabled={disabled}
                    title={color}
                    aria-label={`Color ${color}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'gradient' && background.gradient && (
          <div className="gradient-panel">
            <div className="gradient-controls">
              <div className="gradient-type-control">
                <label className="input-label">{t('background_selector.gradient_type')}</label>
                <select
                  value={background.gradient.type}
                  onChange={(e) => handleGradientChange({ type: e.target.value as 'linear' | 'radial' })}
                  disabled={disabled}
                  className="gradient-type-select"
                >
                  <option value="linear">{t('background_selector.linear')}</option>
                  <option value="radial">{t('background_selector.radial')}</option>
                </select>
              </div>

              {background.gradient.type === 'linear' && (
                <div className="gradient-direction-control">
                  <label className="input-label">{t('background_selector.direction')}</label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={background.gradient.direction}
                    onChange={(e) => handleGradientChange({ direction: Number(e.target.value) })}
                    disabled={disabled}
                    className="direction-slider"
                  />
                  <span className="direction-value">{background.gradient.direction}°</span>
                </div>
              )}
            </div>

            <div className="gradient-stops">
              <div className="stops-header">
                <span className="stops-label">{t('background_selector.color_stops')}</span>
                <button
                  type="button"
                  className="add-stop-button"
                  onClick={addGradientStop}
                  disabled={disabled}
                  title={t('background_selector.add_stop')}
                >
                  + {t('background_selector.add')}
                </button>
              </div>

              <div className="stops-list">
                {background.gradient.stops.map((stop, index) => (
                  <div key={index} className="gradient-stop">
                    <input
                      type="color"
                      value={stop.color}
                      onChange={(e) => updateGradientStop(index, { color: e.target.value })}
                      disabled={disabled}
                      className="stop-color"
                    />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={stop.position}
                      onChange={(e) => updateGradientStop(index, { position: Number(e.target.value) })}
                      disabled={disabled}
                      className="stop-position"
                    />
                    <span className="position-value">{stop.position}%</span>
                    {background.gradient.stops.length > 2 && (
                      <button
                        type="button"
                        className="remove-stop-button"
                        onClick={() => removeGradientStop(index)}
                        disabled={disabled}
                        title={t('background_selector.remove_stop')}
                        aria-label={`Remove stop ${index + 1}`}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="gradient-presets">
              <span className="presets-label">{t('background_selector.presets')}:</span>
              <div className="preset-buttons">
                {GRADIENT_PRESETS.map(preset => (
                  <button
                    key={preset.name}
                    type="button"
                    className="gradient-preset-button"
                    onClick={() => applyGradientPreset(preset)}
                    disabled={disabled}
                    title={preset.name}
                  >
                    <div 
                      className="preset-preview"
                      style={{
                        background: `linear-gradient(45deg, ${preset.stops.map(s => `${s.color} ${s.position}%`).join(', ')})`
                      }}
                    />
                    <span className="preset-name">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'image' && (
          <div className="image-panel">
            <div className="image-upload">
              <button
                type="button"
                className="upload-button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
              >
                {t('background_selector.upload_image')}
              </button>
            </div>

            {background.image?.src && (
              <div className="image-controls">
                <div className="image-size-control">
                  <label className="input-label">{t('background_selector.image_size')}</label>
                  <select
                    value={background.image.size}
                    onChange={(e) => handleImageChange({ size: e.target.value as any })}
                    disabled={disabled}
                    className="size-select"
                  >
                    <option value="cover">{t('background_selector.cover')}</option>
                    <option value="contain">{t('background_selector.contain')}</option>
                    <option value="stretch">{t('background_selector.stretch')}</option>
                    <option value="tile">{t('background_selector.tile')}</option>
                  </select>
                </div>

                <div className="image-position-control">
                  <label className="input-label">{t('background_selector.position')}</label>
                  <div className="position-inputs">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={background.image.position.x}
                      onChange={(e) => handleImageChange({ 
                        position: { ...background.image.position, x: Number(e.target.value) }
                      })}
                      disabled={disabled}
                      className="position-slider"
                    />
                    <span className="position-label">X: {background.image.position.x}%</span>
                  </div>
                  <div className="position-inputs">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={background.image.position.y}
                      onChange={(e) => handleImageChange({ 
                        position: { ...background.image.position, y: Number(e.target.value) }
                      })}
                      disabled={disabled}
                      className="position-slider"
                    />
                    <span className="position-label">Y: {background.image.position.y}%</span>
                  </div>
                </div>

                <div className="image-opacity-control">
                  <label className="input-label">{t('background_selector.opacity')}</label>
                  <div className="opacity-input">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={background.image.opacity}
                      onChange={(e) => handleImageChange({ opacity: Number(e.target.value) })}
                      disabled={disabled}
                      className="opacity-slider"
                    />
                    <span className="opacity-value">{Math.round(background.image.opacity * 100)}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'pattern' && background.pattern && (
          <div className="pattern-panel">
            <div className="pattern-type-selection">
              <label className="input-label">{t('background_selector.pattern_type')}</label>
              <div className="pattern-types">
                {PATTERN_TYPES.map(patternType => (
                  <button
                    key={patternType.id}
                    type="button"
                    className={`pattern-type-button ${background.pattern.type === patternType.id ? 'active' : ''}`}
                    onClick={() => handlePatternChange({ type: patternType.id as any })}
                    disabled={disabled}
                    title={patternType.name}
                  >
                    <span className="pattern-icon">{patternType.icon}</span>
                    <span className="pattern-name">{patternType.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pattern-controls">
              <div className="pattern-colors">
                <div className="color-control">
                  <label className="input-label">{t('background_selector.pattern_color')}</label>
                  <input
                    type="color"
                    value={background.pattern.color}
                    onChange={(e) => handlePatternChange({ color: e.target.value })}
                    disabled={disabled}
                    className="pattern-color-input"
                  />
                </div>
                <div className="color-control">
                  <label className="input-label">{t('background_selector.background_color')}</label>
                  <input
                    type="color"
                    value={background.pattern.backgroundColor}
                    onChange={(e) => handlePatternChange({ backgroundColor: e.target.value })}
                    disabled={disabled}
                    className="pattern-bg-color-input"
                  />
                </div>
              </div>

              <div className="pattern-size-control">
                <label className="input-label">{t('background_selector.pattern_size')}</label>
                <div className="size-input">
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={background.pattern.size}
                    onChange={(e) => handlePatternChange({ size: Number(e.target.value) })}
                    disabled={disabled}
                    className="size-slider"
                  />
                  <span className="size-value">{background.pattern.size}px</span>
                </div>
              </div>

              <div className="pattern-opacity-control">
                <label className="input-label">{t('background_selector.pattern_opacity')}</label>
                <div className="opacity-input">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={background.pattern.opacity}
                    onChange={(e) => handlePatternChange({ opacity: Number(e.target.value) })}
                    disabled={disabled}
                    className="opacity-slider"
                  />
                  <span className="opacity-value">{Math.round(background.pattern.opacity * 100)}%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BackgroundSelector;
