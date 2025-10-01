/**
 * ShortcutsHelpOverlay Component
 * 
 * Modal dialog displaying all available keyboard shortcuts organized by category.
 * Provides quick reference for users to learn and discover keyboard shortcuts.
 */

import React from 'react';
import type { KeyboardShortcutCategory } from '../../types';
import './ShortcutsHelpOverlay.css';

export interface ShortcutsHelpOverlayProps {
  /** Whether the overlay is visible */
  isOpen: boolean;
  
  /** Callback to close the overlay */
  onClose: () => void;
  
  /** Categorized list of keyboard shortcuts */
  shortcuts: KeyboardShortcutCategory[];
  
  /** Function to get the display string for a shortcut */
  getShortcutDisplay: (shortcut: { key: string; modifiers: string[]; [key: string]: any }) => string;
  
  /** Optional custom title */
  title?: string;
  
  /** Optional custom className */
  className?: string;
}

/**
 * Renders a modal overlay showing all keyboard shortcuts
 */
export const ShortcutsHelpOverlay: React.FC<ShortcutsHelpOverlayProps> = ({
  isOpen,
  onClose,
  shortcuts,
  getShortcutDisplay,
  title = 'Keyboard Shortcuts',
  className = '',
}) => {
  // Handle escape key to close
  React.useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);
  
  // Prevent body scroll when open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  if (!isOpen) {
    return null;
  }
  
  return (
    <div 
      className={`shortcuts-help-overlay ${className}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-help-title"
    >
      <div 
        className="shortcuts-help-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shortcuts-help-header">
          <h2 id="shortcuts-help-title">{title}</h2>
          <button
            className="shortcuts-help-close"
            onClick={onClose}
            aria-label="Close shortcuts help"
          >
            ×
          </button>
        </div>
        
        {/* Shortcuts by category */}
        <div className="shortcuts-help-body">
          {shortcuts.length === 0 ? (
            <div className="shortcuts-help-empty">
              <p>No keyboard shortcuts available.</p>
            </div>
          ) : (
            shortcuts.map((category) => (
              <div key={category.id} className="shortcuts-category">
                <h3 className="shortcuts-category-title">{category.name}</h3>
                <div className="shortcuts-list">
                  {category.shortcuts
                    .filter(shortcut => !shortcut.disabled)
                    .map((shortcut) => (
                      <div key={shortcut.id} className="shortcut-item">
                        <div className="shortcut-description">
                          {shortcut.description}
                        </div>
                        <div className="shortcut-keys">
                          {getShortcutDisplay(shortcut)}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Footer */}
        <div className="shortcuts-help-footer">
          <p className="shortcuts-help-tip">
            Press <kbd>Esc</kbd> or click outside to close
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShortcutsHelpOverlay;
