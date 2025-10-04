/**
 * PresetManager Component
 * 
 * Provides comprehensive preset management interface including:
 * - Preset creation from current settings
 * - Import/export functionality with validation
 * - Preset organization with categories and tags
 * - Preview and comparison tools
 * - Batch operations and search capabilities
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import './PresetManager.css';

// Temporary type definitions - will be replaced with proper imports
interface Preset {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  createdAt: Date;
  modifiedAt: Date;
  isDefault: boolean;
  settings: Record<string, any>;
  metadata: {
    version: string;
    author?: string;
    thumbnail?: string;
  };
}

interface PresetManagerProps {
  presets: Preset[];
  currentSettings: Record<string, any>;
  onPresetsChange: (presets: Preset[]) => void;
  onLoadPreset: (preset: Preset) => void;
  disabled?: boolean;
  className?: string;
  'data-testid'?: string;
}

interface PresetFormData {
  name: string;
  description: string;
  category: string;
  tags: string[];
  includeAnimation: boolean;
  includeAppearance: boolean;
  includeKeyboard: boolean;
  includeAdvanced: boolean;
}

const PRESET_CATEGORIES = [
  { id: 'animation', label: 'Animation Presets', icon: '🎬' },
  { id: 'appearance', label: 'Appearance Themes', icon: '🎨' },
  { id: 'performance', label: 'Performance Profiles', icon: '⚡' },
  { id: 'accessibility', label: 'Accessibility Settings', icon: '♿' },
  { id: 'custom', label: 'Custom Presets', icon: '⚙️' },
];

const DEFAULT_FORM_DATA: PresetFormData = {
  name: '',
  description: '',
  category: 'custom',
  tags: [],
  includeAnimation: true,
  includeAppearance: true,
  includeKeyboard: false,
  includeAdvanced: false,
};

// Temporary hooks - will be replaced with proper implementations
const useLocalization = () => ({
  t: (key: string) => key,
  currentLocale: 'en'
});

export const PresetManager: React.FC<PresetManagerProps> = ({
  presets,
  currentSettings,
  onPresetsChange,
  onLoadPreset,
  disabled = false,
  className = '',
  'data-testid': testId = 'preset-manager'
}) => {
  const { t } = useLocalization();
  const [selectedPresets, setSelectedPresets] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'modified'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [formData, setFormData] = useState<PresetFormData>(DEFAULT_FORM_DATA);
  const [previewPreset, setPreviewPreset] = useState<Preset | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter and sort presets
  const filteredPresets = useMemo(() => {
    let filtered = presets.filter(preset => {
      const matchesSearch = searchQuery === '' ||
        preset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        preset.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        preset.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || preset.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });

    // Sort presets
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'created':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'modified':
          comparison = a.modifiedAt.getTime() - b.modifiedAt.getTime();
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [presets, searchQuery, selectedCategory, sortBy, sortOrder]);

  // Group presets by category
  const groupedPresets = useMemo(() => {
    return filteredPresets.reduce((groups, preset) => {
      if (!groups[preset.category]) {
        groups[preset.category] = [];
      }
      const group = groups[preset.category];
      if (group) {
        group.push(preset);
      }
      return groups;
    }, {} as Record<string, Preset[]>);
  }, [filteredPresets]);

  // Create new preset from current settings
  const createPreset = useCallback(() => {
    const newPreset: Preset = {
      id: `preset_${Date.now()}`,
      name: formData.name,
      description: formData.description,
      category: formData.category,
      tags: formData.tags,
      createdAt: new Date(),
      modifiedAt: new Date(),
      isDefault: false,
      settings: filterSettings(currentSettings, formData),
      metadata: {
        version: '1.0.0',
        author: 'User',
      },
    };

    const updatedPresets = [...presets, newPreset];
    onPresetsChange(updatedPresets);
    setShowCreateForm(false);
    setFormData(DEFAULT_FORM_DATA);
  }, [presets, currentSettings, formData, onPresetsChange]);

  // Filter settings based on form selections
  const filterSettings = useCallback((settings: Record<string, any>, form: PresetFormData): Record<string, any> => {
    const filtered: Record<string, any> = {};
    
    if (form.includeAnimation) {
      // Include animation-related settings
      Object.keys(settings).forEach(key => {
        if (key.includes('animation') || key.includes('speed') || key.includes('particle')) {
          filtered[key] = settings[key];
        }
      });
    }
    
    if (form.includeAppearance) {
      // Include appearance-related settings
      Object.keys(settings).forEach(key => {
        if (key.includes('theme') || key.includes('color') || key.includes('appearance')) {
          filtered[key] = settings[key];
        }
      });
    }
    
    if (form.includeKeyboard) {
      // Include keyboard shortcuts
      Object.keys(settings).forEach(key => {
        if (key.includes('keyboard') || key.includes('shortcut')) {
          filtered[key] = settings[key];
        }
      });
    }
    
    if (form.includeAdvanced) {
      // Include advanced settings
      Object.keys(settings).forEach(key => {
        if (key.includes('advanced') || key.includes('debug') || key.includes('performance')) {
          filtered[key] = settings[key];
        }
      });
    }
    
    return filtered;
  }, []);

  // Delete selected presets
  const deletePresets = useCallback(() => {
    const updatedPresets = presets.filter(preset => 
      !selectedPresets.includes(preset.id) || preset.isDefault
    );
    onPresetsChange(updatedPresets);
    setSelectedPresets([]);
  }, [presets, selectedPresets, onPresetsChange]);

  // Duplicate preset
  const duplicatePreset = useCallback((preset: Preset) => {
    const duplicated: Preset = {
      ...preset,
      id: `preset_${Date.now()}`,
      name: `${preset.name} (Copy)`,
      createdAt: new Date(),
      modifiedAt: new Date(),
      isDefault: false,
    };

    const updatedPresets = [...presets, duplicated];
    onPresetsChange(updatedPresets);
  }, [presets, onPresetsChange]);

  // Export presets
  const exportPresets = useCallback((presetIds?: string[]) => {
    const presetsToExport = presetIds 
      ? presets.filter(p => presetIds.includes(p.id))
      : selectedPresets.length > 0 
        ? presets.filter(p => selectedPresets.includes(p.id))
        : presets;

    const exportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      presets: presetsToExport,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `presets_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [presets, selectedPresets]);

  // Import presets
  const importPresets = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Handle file import
  const handleFileImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);
        
        if (importData.presets && Array.isArray(importData.presets)) {
          const importedPresets = importData.presets.map((preset: any) => ({
            ...preset,
            id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date(preset.createdAt),
            modifiedAt: new Date(preset.modifiedAt),
            isDefault: false, // Imported presets are never default
          }));

          const updatedPresets = [...presets, ...importedPresets];
          onPresetsChange(updatedPresets);
        }
      } catch (error) {
        console.error('Failed to import presets:', error);
        // Handle error - show notification
      }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // Clear the input
  }, [presets, onPresetsChange]);

  // Get category info
  const getCategoryInfo = useCallback((categoryId: string) => {
    return PRESET_CATEGORIES.find(cat => cat.id === categoryId) || 
           { id: categoryId, label: categoryId, icon: '📁' };
  }, []);

  // Handle form changes
  const updateFormData = useCallback((updates: Partial<PresetFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  // Toggle preset selection
  const togglePresetSelection = useCallback((presetId: string) => {
    setSelectedPresets(prev => 
      prev.includes(presetId)
        ? prev.filter(id => id !== presetId)
        : [...prev, presetId]
    );
  }, []);

  // Select all visible presets
  const selectAllVisible = useCallback(() => {
    const visibleIds = filteredPresets.map(p => p.id);
    setSelectedPresets(visibleIds);
  }, [filteredPresets]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedPresets([]);
  }, []);

  // Format date for display
  const formatDate = useCallback((date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }, []);

  return (
    <div 
      className={`preset-manager ${disabled ? 'disabled' : ''} ${className}`}
      data-testid={testId}
      role="tabpanel"
      aria-labelledby="preset-manager-title"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileImport}
      />

      <div className="preset-manager-header">
        <div className="header-controls">
          <div className="search-sort-row">
            <div className="search-group">
              <input
                type="text"
                className="preset-search"
                placeholder={t('presets.search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={disabled}
              />
            </div>

            <div className="filter-group">
              <select
                className="category-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                disabled={disabled}
              >
                <option value="all">{t('presets.all_categories')}</option>
                {PRESET_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sort-group">
              <select
                className="sort-select"
                value={`${sortBy}_${sortOrder}`}
                onChange={(e) => {
                  const [sort, order] = e.target.value.split('_');
                  setSortBy(sort as 'name' | 'created' | 'modified');
                  setSortOrder(order as 'asc' | 'desc');
                }}
                disabled={disabled}
              >
                <option value="name_asc">{t('presets.sort.name_asc')}</option>
                <option value="name_desc">{t('presets.sort.name_desc')}</option>
                <option value="created_desc">{t('presets.sort.created_desc')}</option>
                <option value="created_asc">{t('presets.sort.created_asc')}</option>
                <option value="modified_desc">{t('presets.sort.modified_desc')}</option>
                <option value="modified_asc">{t('presets.sort.modified_asc')}</option>
              </select>
            </div>
          </div>

          <div className="action-buttons">
            <button
              type="button"
              className="create-preset-button"
              onClick={() => setShowCreateForm(true)}
              disabled={disabled}
              title={t('presets.create_from_current')}
            >
              {t('presets.create_preset')}
            </button>

            <button
              type="button"
              className="import-button"
              onClick={importPresets}
              disabled={disabled}
              title={t('presets.import_tooltip')}
            >
              {t('presets.import')}
            </button>

            <button
              type="button"
              className="export-button"
              onClick={() => exportPresets()}
              disabled={disabled || selectedPresets.length === 0}
              title={t('presets.export_selected')}
            >
              {t('presets.export')} ({selectedPresets.length})
            </button>

            <button
              type="button"
              className="delete-button"
              onClick={deletePresets}
              disabled={disabled || selectedPresets.length === 0}
              title={t('presets.delete_selected')}
            >
              {t('presets.delete')} ({selectedPresets.length})
            </button>
          </div>
        </div>

        {selectedPresets.length > 0 && (
          <div className="selection-info">
            <span className="selection-count">
              {selectedPresets.length} {t('presets.selected')}
            </span>
            <button
              type="button"
              className="select-all-button"
              onClick={selectAllVisible}
            >
              {t('presets.select_all_visible')}
            </button>
            <button
              type="button"
              className="clear-selection-button"
              onClick={clearSelection}
            >
              {t('presets.clear_selection')}
            </button>
          </div>
        )}
      </div>

      <div className="presets-content">
        {Object.entries(groupedPresets).map(([categoryId, categoryPresets]) => {
          const categoryInfo = getCategoryInfo(categoryId);
          
          return (
            <div key={categoryId} className="preset-category">
              <h3 className="category-header">
                <span className="category-icon">{categoryInfo.icon}</span>
                <span className="category-name">{categoryInfo.label}</span>
                <span className="category-count">({categoryPresets.length})</span>
              </h3>

              <div className="preset-grid">
                {categoryPresets.map(preset => (
                  <div
                    key={preset.id}
                    className={`preset-card ${selectedPresets.includes(preset.id) ? 'selected' : ''} ${preset.isDefault ? 'default' : ''}`}
                  >
                    <div className="preset-card-header">
                      <label className="preset-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedPresets.includes(preset.id)}
                          onChange={() => togglePresetSelection(preset.id)}
                          disabled={disabled || preset.isDefault}
                        />
                        <span className="checkmark"></span>
                      </label>

                      <div className="preset-info">
                        <h4 className="preset-name">
                          {preset.name}
                          {preset.isDefault && <span className="default-badge">{t('presets.default')}</span>}
                        </h4>
                        <p className="preset-description">{preset.description}</p>
                      </div>
                    </div>

                    <div className="preset-metadata">
                      <div className="preset-tags">
                        {preset.tags.map(tag => (
                          <span key={tag} className="preset-tag">{tag}</span>
                        ))}
                      </div>
                      
                      <div className="preset-dates">
                        <div className="date-info">
                          <span className="date-label">{t('presets.created')}:</span>
                          <span className="date-value">{formatDate(preset.createdAt)}</span>
                        </div>
                        {preset.modifiedAt > preset.createdAt && (
                          <div className="date-info">
                            <span className="date-label">{t('presets.modified')}:</span>
                            <span className="date-value">{formatDate(preset.modifiedAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="preset-actions">
                      <button
                        type="button"
                        className="load-button"
                        onClick={() => onLoadPreset(preset)}
                        disabled={disabled}
                        title={t('presets.load_preset')}
                      >
                        {t('presets.load')}
                      </button>

                      <button
                        type="button"
                        className="preview-button"
                        onClick={() => setPreviewPreset(preset)}
                        disabled={disabled}
                        title={t('presets.preview_settings')}
                      >
                        {t('presets.preview')}
                      </button>

                      <button
                        type="button"
                        className="duplicate-button"
                        onClick={() => duplicatePreset(preset)}
                        disabled={disabled}
                        title={t('presets.duplicate_preset')}
                      >
                        {t('presets.duplicate')}
                      </button>

                      <button
                        type="button"
                        className="export-single-button"
                        onClick={() => exportPresets([preset.id])}
                        disabled={disabled}
                        title={t('presets.export_single')}
                      >
                        {t('presets.export')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {filteredPresets.length === 0 && (
          <div className="no-presets">
            <p>{t('presets.no_presets_found')}</p>
            {searchQuery && (
              <button
                type="button"
                className="clear-search-button"
                onClick={() => setSearchQuery('')}
              >
                {t('presets.clear_search')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create Preset Form Modal */}
      {showCreateForm && (
        <div className="modal-overlay">
          <div className="create-preset-modal">
            <div className="modal-header">
              <h3>{t('presets.create_new_preset')}</h3>
              <button
                type="button"
                className="close-button"
                onClick={() => setShowCreateForm(false)}
                aria-label={t('common.close')}
              >
                ×
              </button>
            </div>

            <form className="preset-form" onSubmit={(e) => { e.preventDefault(); createPreset(); }}>
              <div className="form-group">
                <label htmlFor="preset-name">{t('presets.form.name')}</label>
                <input
                  id="preset-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateFormData({ name: e.target.value })}
                  placeholder={t('presets.form.name_placeholder')}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="preset-description">{t('presets.form.description')}</label>
                <textarea
                  id="preset-description"
                  value={formData.description}
                  onChange={(e) => updateFormData({ description: e.target.value })}
                  placeholder={t('presets.form.description_placeholder')}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label htmlFor="preset-category">{t('presets.form.category')}</label>
                <select
                  id="preset-category"
                  value={formData.category}
                  onChange={(e) => updateFormData({ category: e.target.value })}
                >
                  {PRESET_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>{t('presets.form.include_settings')}</label>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.includeAnimation}
                      onChange={(e) => updateFormData({ includeAnimation: e.target.checked })}
                    />
                    {t('presets.form.include_animation')}
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.includeAppearance}
                      onChange={(e) => updateFormData({ includeAppearance: e.target.checked })}
                    />
                    {t('presets.form.include_appearance')}
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.includeKeyboard}
                      onChange={(e) => updateFormData({ includeKeyboard: e.target.checked })}
                    />
                    {t('presets.form.include_keyboard')}
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.includeAdvanced}
                      onChange={(e) => updateFormData({ includeAdvanced: e.target.checked })}
                    />
                    {t('presets.form.include_advanced')}
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowCreateForm(false)}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="create-button"
                  disabled={!formData.name.trim()}
                >
                  {t('presets.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preset Preview Modal */}
      {previewPreset && (
        <div className="modal-overlay">
          <div className="preset-preview-modal">
            <div className="modal-header">
              <h3>{t('presets.preview_title')}: {previewPreset.name}</h3>
              <button
                type="button"
                className="close-button"
                onClick={() => setPreviewPreset(null)}
                aria-label={t('common.close')}
              >
                ×
              </button>
            </div>

            <div className="preview-content">
              <div className="preset-summary">
                <p><strong>{t('presets.description')}:</strong> {previewPreset.description}</p>
                <p><strong>{t('presets.category')}:</strong> {getCategoryInfo(previewPreset.category).label}</p>
                <p><strong>{t('presets.created')}:</strong> {formatDate(previewPreset.createdAt)}</p>
                {previewPreset.metadata.author && (
                  <p><strong>{t('presets.author')}:</strong> {previewPreset.metadata.author}</p>
                )}
              </div>

              <div className="settings-preview">
                <h4>{t('presets.settings_included')}</h4>
                <pre className="settings-json">
                  {JSON.stringify(previewPreset.settings, null, 2)}
                </pre>
              </div>
            </div>

            <div className="preview-actions">
              <button
                type="button"
                className="load-preset-button"
                onClick={() => {
                  onLoadPreset(previewPreset);
                  setPreviewPreset(null);
                }}
              >
                {t('presets.load_preset')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PresetManager;
