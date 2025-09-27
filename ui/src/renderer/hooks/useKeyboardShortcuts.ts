/**
 * Keyboard Shortcuts Hook
 * 
 * A comprehensive React hook for managing keyboard shortcuts in the Point Shooting
 * Animation application.
 */

import { useEffect, useCallback } from 'react';
import type { KeyboardShortcut, KeyboardShortcutCategory } from '../types';

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  scope?: 'global' | 'local';
  target?: HTMLElement | null;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  category?: string;
}

// Platform detection
const isMac = typeof navigator !== 'undefined' && 
  /Mac|iPod|iPhone|iPad/.test(navigator.platform);

/**
 * Default keyboard shortcuts for the application
 */
export const defaultShortcuts: KeyboardShortcutCategory[] = [
  {
    id: 'file',
    name: 'File Operations',
    shortcuts: [
      {
        id: 'file.new',
        key: 'n',
        modifiers: ['meta'],
        description: 'New animation project',
        category: 'file',
        action: () => console.log('New project'),
      },
      {
        id: 'file.open',
        key: 'o',
        modifiers: ['meta'],
        description: 'Open image file',
        category: 'file',
        action: () => console.log('Open file'),
      },
      {
        id: 'file.save',
        key: 's',
        modifiers: ['meta'],
        description: 'Save current settings',
        category: 'file',
        action: () => console.log('Save settings'),
      },
    ],
  },
  {
    id: 'animation',
    name: 'Animation Control',
    shortcuts: [
      {
        id: 'animation.play',
        key: ' ', // Spacebar
        modifiers: [],
        description: 'Play/Pause animation',
        category: 'animation',
        action: () => console.log('Toggle playback'),
      },
      {
        id: 'animation.reset',
        key: 'r',
        modifiers: ['meta'],
        description: 'Reset animation',
        category: 'animation',
        action: () => console.log('Reset animation'),
      },
      {
        id: 'animation.speed-up',
        key: 'ArrowUp',
        modifiers: ['meta'],
        description: 'Increase animation speed',
        category: 'animation',
        action: () => console.log('Speed up'),
      },
      {
        id: 'animation.slow-down',
        key: 'ArrowDown',
        modifiers: ['meta'],
        description: 'Decrease animation speed',
        category: 'animation',
        action: () => console.log('Slow down'),
      },
    ],
  },
];

/**
 * Normalizes key combinations for cross-platform compatibility
 */
const normalizeKeyCombo = (key: string, modifiers: string[]): string => {
  const normalizedModifiers = modifiers
    .map(mod => {
      if (mod === 'meta') return isMac ? 'cmd' : 'ctrl';
      if (mod === 'cmd' && !isMac) return 'ctrl';
      if (mod === 'ctrl' && isMac) return 'cmd';
      return mod;
    })
    .sort()
    .join('+');
    
  return `${normalizedModifiers}+${key.toLowerCase()}`;
};

/**
 * Checks if an event matches a keyboard shortcut
 */
const matchesShortcut = (event: KeyboardEvent, shortcut: KeyboardShortcut): boolean => {
  const eventModifiers: string[] = [];
  
  if (event.ctrlKey || event.metaKey) {
    eventModifiers.push(isMac ? 'cmd' : 'ctrl');
  }
  if (event.altKey) eventModifiers.push('alt');
  if (event.shiftKey) eventModifiers.push('shift');
  
  const eventCombo = normalizeKeyCombo(event.key, eventModifiers);
  const shortcutCombo = normalizeKeyCombo(shortcut.key, shortcut.modifiers);
  
  return eventCombo === shortcutCombo;
};

export const useKeyboardShortcuts = (
  shortcuts: KeyboardShortcut[] = [],
  options: UseKeyboardShortcutsOptions = {}
) => {
  const {
    enabled = true,
    scope = 'global',
    target = null,
    preventDefault = true,
    stopPropagation = false,
  } = options;
  
  // Merge default shortcuts with custom ones
  const allShortcuts = [
    ...defaultShortcuts.flatMap(cat => cat.shortcuts),
    ...shortcuts
  ];
  
  // Create keyboard event handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;
    
    // Skip if user is typing in an input
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.contentEditable === 'true'
    )) {
      // Only allow global shortcuts with explicit global flag
      const matchingShortcut = allShortcuts.find(shortcut => 
        shortcut.global && matchesShortcut(event, shortcut)
      );
      if (!matchingShortcut) return;
    }
    
    // Find matching shortcut
    const matchingShortcut = allShortcuts.find(shortcut => 
      !shortcut.disabled && matchesShortcut(event, shortcut)
    );
    
    if (matchingShortcut) {
      if (preventDefault) {
        event.preventDefault();
      }
      if (stopPropagation) {
        event.stopPropagation();
      }
      
      try {
        matchingShortcut.action();
        
        // Log in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`Executed shortcut: ${matchingShortcut.description}`);
        }
      } catch (error) {
        console.error('Error executing keyboard shortcut:', error);
      }
    }
  }, [enabled, allShortcuts, preventDefault, stopPropagation]);
  
  // Register shortcuts
  useEffect(() => {
    if (!enabled) return;
    
    const targetElement = scope === 'global' ? document : (target || document);
    if (!targetElement) return;
    
    targetElement.addEventListener('keydown', handleKeyDown as EventListener);
    
    return () => {
      targetElement.removeEventListener('keydown', handleKeyDown as EventListener);
    };
  }, [enabled, scope, target, handleKeyDown]);
  
  const getShortcutDisplay = useCallback((shortcut: KeyboardShortcut): string => {
    const modifierSymbols = {
      ctrl: isMac ? '⌃' : 'Ctrl',
      cmd: '⌘',
      alt: isMac ? '⌥' : 'Alt',
      shift: isMac ? '⇧' : 'Shift',
    };
    
    const modifiers = shortcut.modifiers
      .map(mod => {
        if (mod === 'meta') return isMac ? modifierSymbols.cmd : modifierSymbols.ctrl;
        return modifierSymbols[mod as keyof typeof modifierSymbols] || mod;
      })
      .join(isMac ? '' : '+');
    
    const key = shortcut.key === ' ' ? 'Space' : shortcut.key.toUpperCase();
    
    return isMac ? `${modifiers}${key}` : `${modifiers}+${key}`;
  }, []);
  
  const getAllShortcuts = useCallback((): KeyboardShortcutCategory[] => {
    return defaultShortcuts.map(category => ({
      ...category,
      shortcuts: category.shortcuts.concat(
        shortcuts.filter(s => s.category === category.id)
      ),
    }));
  }, [shortcuts]);
  
  return {
    getShortcutDisplay,
    getAllShortcuts,
    allShortcuts,
    isEnabled: enabled,
  };
};
