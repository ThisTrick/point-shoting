/**
 * ParameterSliders Component
 * 
 * Provides comprehensive parameter control interface including:
 * - Multi-type sliders (continuous, discrete, logarithmic) 
 * - Real-time value display with custom formatting
 * - Parameter grouping and collapsible sections
 * - Preset values and quick reset functionality  
 * - Visual feedback for parameter changes and limits
 * - Accessibility-focused design with keyboard navigation
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import './ParameterSliders.css';

// Temporary type definitions - will be replaced with proper imports
interface SliderParameter {
  id: string;
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  unit?: string;
  type: 'linear' | 'logarithmic' | 'discrete';
  presets?: Array<{ value: number; label: string }>;
  group: string;
  advanced?: boolean;
  formatter?: (value: number) => string;
}

interface ParameterGroup {
  id: string;
  label: string;
  description: string;
  icon: string;
  collapsed?: boolean;
  advanced?: boolean;
}

interface ParameterSlidersProps {
  parameters: SliderParameter[];
  groups: ParameterGroup[];
  onParameterChange: (parameterId: string, value: number) => void;
  onResetParameter: (parameterId: string) => void;
  onResetAll: () => void;
  disabled?: boolean;
  showAdvanced?: boolean;
  className?: string;
  'data-testid'?: string;
}

// Temporary hooks - will be replaced with proper implementations
const useLocalization = () => ({
  t: (key: string) => key,
  currentLocale: 'en'
});

export const ParameterSliders: React.FC<ParameterSlidersProps> = ({
  parameters,
  groups,
  onParameterChange,
  onResetParameter,
  onResetAll,
  disabled = false,
  showAdvanced = false,
  className = '',
  'data-testid': testId = 'parameter-sliders'
}) => {
  const { t } = useLocalization();
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [dragState, setDragState] = useState<{
    parameterId: string | null;
    startValue: number;
    startX: number;
  }>({ parameterId: null, startValue: 0, startX: 0 });
  const slidersRef = useRef<Map<string, HTMLDivElement>>(new Map());

  // Group parameters by group
  const groupedParameters = useMemo(() => {
    const filtered = parameters.filter(param => showAdvanced || !param.advanced);
    
    return groups.reduce((acc, group) => {
      const groupParams = filtered.filter(param => param.group === group.id);
      if (groupParams.length > 0) {
        acc[group.id] = groupParams;
      }
      return acc;
    }, {} as Record<string, SliderParameter[]>);
  }, [parameters, groups, showAdvanced]);

  // Toggle group collapse
  const toggleGroup = useCallback((groupId: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  }, []);

  // Convert value to slider position (0-1)
  const valueToPosition = useCallback((param: SliderParameter, value: number): number => {
    if (param.type === 'logarithmic') {
      const logMin = Math.log(Math.max(param.min, 0.001));
      const logMax = Math.log(param.max);
      const logValue = Math.log(Math.max(value, 0.001));
      return (logValue - logMin) / (logMax - logMin);
    } else {
      return (value - param.min) / (param.max - param.min);
    }
  }, []);

  // Convert slider position (0-1) to value
  const positionToValue = useCallback((param: SliderParameter, position: number): number => {
    let value: number;
    
    if (param.type === 'logarithmic') {
      const logMin = Math.log(Math.max(param.min, 0.001));
      const logMax = Math.log(param.max);
      const logValue = logMin + position * (logMax - logMin);
      value = Math.exp(logValue);
    } else {
      value = param.min + position * (param.max - param.min);
    }

    // Apply step rounding
    if (param.step > 0) {
      value = Math.round(value / param.step) * param.step;
    }

    // Clamp to bounds
    return Math.max(param.min, Math.min(param.max, value));
  }, []);

  // Handle slider mouse down
  const handleSliderMouseDown = useCallback((event: React.MouseEvent, param: SliderParameter) => {
    if (disabled) return;

    event.preventDefault();
    const sliderElement = slidersRef.current.get(param.id);
    if (!sliderElement) return;

    const rect = sliderElement.getBoundingClientRect();
    const position = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const newValue = positionToValue(param, position);

    onParameterChange(param.id, newValue);
    
    setDragState({
      parameterId: param.id,
      startValue: newValue,
      startX: event.clientX
    });
  }, [disabled, positionToValue, onParameterChange]);

  // Handle mouse move during drag
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!dragState.parameterId) return;

    const param = parameters.find(p => p.id === dragState.parameterId);
    const sliderElement = slidersRef.current.get(dragState.parameterId);
    if (!param || !sliderElement) return;

    const rect = sliderElement.getBoundingClientRect();
    const position = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const newValue = positionToValue(param, position);

    onParameterChange(param.id, newValue);
  }, [dragState.parameterId, parameters, positionToValue, onParameterChange]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setDragState({ parameterId: null, startValue: 0, startX: 0 });
  }, []);

  // Mouse event listeners
  useEffect(() => {
    if (dragState.parameterId) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
    
    return undefined;
  }, [dragState.parameterId, handleMouseMove, handleMouseUp]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent, param: SliderParameter) => {
    if (disabled) return;

    let delta = 0;
    const stepSize = param.step || (param.max - param.min) / 100;

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        delta = -stepSize;
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        delta = stepSize;
        break;
      case 'PageDown':
        delta = -stepSize * 10;
        break;
      case 'PageUp':
        delta = stepSize * 10;
        break;
      case 'Home':
        onParameterChange(param.id, param.min);
        return;
      case 'End':
        onParameterChange(param.id, param.max);
        return;
      case 'Enter':
      case ' ':
        onResetParameter(param.id);
        return;
      default:
        return;
    }

    event.preventDefault();
    const newValue = Math.max(param.min, Math.min(param.max, param.value + delta));
    onParameterChange(param.id, newValue);
  }, [disabled, onParameterChange, onResetParameter]);

  // Format parameter value
  const formatValue = useCallback((param: SliderParameter): string => {
    if (param.formatter) {
      return param.formatter(param.value);
    }

    let formattedValue: string;
    
    if (param.step >= 1) {
      formattedValue = param.value.toFixed(0);
    } else if (param.step >= 0.1) {
      formattedValue = param.value.toFixed(1);
    } else {
      formattedValue = param.value.toFixed(2);
    }

    return param.unit ? `${formattedValue} ${param.unit}` : formattedValue;
  }, []);

  // Check if parameter has changed from default
  const isParameterModified = useCallback((param: SliderParameter): boolean => {
    return Math.abs(param.value - param.defaultValue) > (param.step || 0.001);
  }, []);

  // Set parameter to preset value
  const setPresetValue = useCallback((param: SliderParameter, value: number) => {
    onParameterChange(param.id, value);
  }, [onParameterChange]);

  // Get group info
  const getGroupInfo = useCallback((groupId: string) => {
    return groups.find(g => g.id === groupId);
  }, [groups]);

  return (
    <div 
      className={`parameter-sliders ${disabled ? 'disabled' : ''} ${className}`}
      data-testid={testId}
      role="region"
      aria-label={t('parameter_sliders.controls_label')}
    >
      <div className="sliders-header">
        <h3 className="sliders-title">{t('parameter_sliders.title')}</h3>
        
        <div className="header-actions">
          <button
            type="button"
            className="reset-all-button"
            onClick={onResetAll}
            disabled={disabled}
            title={t('parameter_sliders.reset_all_tooltip')}
          >
            {t('parameter_sliders.reset_all')}
          </button>
        </div>
      </div>

      <div className="sliders-content">
        {Object.entries(groupedParameters).map(([groupId, groupParams]) => {
          const groupInfo = getGroupInfo(groupId);
          const isCollapsed = collapsedGroups.has(groupId);
          
          if (!groupInfo) return null;

          return (
            <div key={groupId} className={`parameter-group ${isCollapsed ? 'collapsed' : 'expanded'}`}>
              <button
                type="button"
                className="group-header"
                onClick={() => toggleGroup(groupId)}
                disabled={disabled}
                aria-expanded={!isCollapsed}
                aria-controls={`group-content-${groupId}`}
              >
                <div className="group-info">
                  <span className="group-icon">{groupInfo.icon}</span>
                  <div className="group-text">
                    <span className="group-label">{groupInfo.label}</span>
                    <span className="group-description">{groupInfo.description}</span>
                  </div>
                </div>
                <span className={`collapse-icon ${isCollapsed ? 'collapsed' : 'expanded'}`}>
                  ▼
                </span>
              </button>

              <div 
                id={`group-content-${groupId}`}
                className="group-content"
                style={{ display: isCollapsed ? 'none' : 'block' }}
              >
                {groupParams.map(param => (
                  <div 
                    key={param.id}
                    className={`parameter-item ${isParameterModified(param) ? 'modified' : ''} ${dragState.parameterId === param.id ? 'dragging' : ''}`}
                  >
                    <div className="parameter-header">
                      <div className="parameter-info">
                        <label className="parameter-label" htmlFor={`slider-${param.id}`}>
                          {param.label}
                        </label>
                        <span className="parameter-description">{param.description}</span>
                      </div>
                      
                      <div className="parameter-controls">
                        <span className="parameter-value">{formatValue(param)}</span>
                        
                        {isParameterModified(param) && (
                          <button
                            type="button"
                            className="reset-parameter-button"
                            onClick={() => onResetParameter(param.id)}
                            disabled={disabled}
                            title={t('parameter_sliders.reset_parameter')}
                            aria-label={`${t('parameter_sliders.reset')} ${param.label}`}
                          >
                            ↺
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="slider-container">
                      <div 
                        ref={(el) => {
                          if (el) {
                            slidersRef.current.set(param.id, el);
                          } else {
                            slidersRef.current.delete(param.id);
                          }
                        }}
                        className="slider-track"
                        onMouseDown={(e) => handleSliderMouseDown(e, param)}
                        role="slider"
                        tabIndex={disabled ? -1 : 0}
                        aria-label={param.label}
                        aria-valuemin={param.min}
                        aria-valuemax={param.max}
                        aria-valuenow={param.value}
                        aria-valuetext={formatValue(param)}
                        onKeyDown={(e) => handleKeyDown(e, param)}
                      >
                        <div className="slider-background" />
                        <div 
                          className="slider-fill"
                          style={{ width: `${valueToPosition(param, param.value) * 100}%` }}
                        />
                        <div 
                          className="slider-thumb"
                          style={{ left: `${valueToPosition(param, param.value) * 100}%` }}
                        />
                        
                        {/* Default value indicator */}
                        <div 
                          className="default-indicator"
                          style={{ left: `${valueToPosition(param, param.defaultValue) * 100}%` }}
                          title={`${t('parameter_sliders.default')}: ${param.formatter ? param.formatter(param.defaultValue) : param.defaultValue}${param.unit || ''}`}
                        />
                      </div>

                      <div className="slider-labels">
                        <span className="min-label">
                          {param.formatter ? param.formatter(param.min) : param.min}{param.unit || ''}
                        </span>
                        <span className="max-label">
                          {param.formatter ? param.formatter(param.max) : param.max}{param.unit || ''}
                        </span>
                      </div>
                    </div>

                    {param.presets && param.presets.length > 0 && (
                      <div className="preset-values">
                        <span className="presets-label">{t('parameter_sliders.presets')}:</span>
                        <div className="preset-buttons">
                          {param.presets.map(preset => (
                            <button
                              key={preset.value}
                              type="button"
                              className={`preset-button ${Math.abs(param.value - preset.value) < (param.step || 0.001) ? 'active' : ''}`}
                              onClick={() => setPresetValue(param, preset.value)}
                              disabled={disabled}
                              title={`${preset.label}: ${param.formatter ? param.formatter(preset.value) : preset.value}${param.unit || ''}`}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {Object.keys(groupedParameters).length === 0 && (
          <div className="no-parameters">
            <p>{t('parameter_sliders.no_parameters')}</p>
            {!showAdvanced && (
              <p className="advanced-hint">
                {t('parameter_sliders.enable_advanced')}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParameterSliders;
