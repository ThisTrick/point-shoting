/**
 * useKeyboardShortcuts Hook
 * Custom hook for managing keyboard shortcuts and hotkeys
 */

import { useEffect, useCallback, useRef } from 'react';
import { useAnimationState } from './useAnimationState';
import { useSettings } from './useSettings';
import { useNotifications } from '../contexts/NotificationContext';

// Keyboard shortcut types
interface KeyboardShortcut {
  key: string;
  modifiers?: ('ctrl' | 'alt' | 'shift' | 'meta')[];
  description: string;
  category: 'animation' | 'interface' | 'file' | 'settings' | 'system';
  handler: (event: KeyboardEvent) => void | Promise<void>;
  enabled?: boolean;
  global?: boolean; // Available when window is not focused
}

interface ShortcutHookOptions {
  enableGlobalShortcuts?: boolean;
  enableTooltips?: boolean;
  preventDefault?: boolean;
  showNotifications?: boolean;
}

// Default keyboard shortcuts
const DEFAULT_SHORTCUTS: Omit<KeyboardShortcut, 'handler'>[] = [
  // Animation controls
  { key: 'Space', description: 'Play/Pause animation', category: 'animation' },
  { key: 'Enter', modifiers: ['ctrl'], description: 'Start animation', category: 'animation' },
  { key: 'Escape', description: 'Stop animation', category: 'animation' },
  { key: 'ArrowRight', description: 'Skip to final stage', category: 'animation' },
  { key: 'r', modifiers: ['ctrl'], description: 'Restart animation', category: 'animation' },
  
  // File operations
  { key: 'o', modifiers: ['ctrl'], description: 'Open image', category: 'file' },
  { key: 'w', modifiers: ['ctrl'], description: 'Select watermark', category: 'file' },
  { key: 's', modifiers: ['ctrl'], description: 'Save settings', category: 'file' },
  { key: 's', modifiers: ['ctrl', 'shift'], description: 'Export settings', category: 'file' },
  { key: 'o', modifiers: ['ctrl', 'shift'], description: 'Import settings', category: 'file' },
  
  // Interface controls
  { key: 'h', modifiers: ['ctrl'], description: 'Toggle HUD', category: 'interface' },
  { key: 'F11', description: 'Toggle fullscreen', category: 'interface' },
  { key: 'F12', description: 'Toggle developer tools', category: 'interface' },
  { key: 'Tab', modifiers: ['ctrl'], description: 'Toggle notifications panel', category: 'interface' },
  
  // Settings
  { key: '1', modifiers: ['ctrl'], description: 'Low quality preset', category: 'settings' },
  { key: '2', modifiers: ['ctrl'], description: 'Medium quality preset', category: 'settings' },
  { key: '3', modifiers: ['ctrl'], description: 'High quality preset', category: 'settings' },
  { key: '4', modifiers: ['ctrl'], description: 'Ultra quality preset', category: 'settings' },
  { key: 'ArrowUp', modifiers: ['ctrl'], description: 'Increase density', category: 'settings' },
  { key: 'ArrowDown', modifiers: ['ctrl'], description: 'Decrease density', category: 'settings' },
  { key: 'ArrowRight', modifiers: ['ctrl'], description: 'Increase speed', category: 'settings' },
  { key: 'ArrowLeft', modifiers: ['ctrl'], description: 'Decrease speed', category: 'settings' },
  
  // System
  { key: 'F1', description: 'Show help/shortcuts', category: 'system' },
  { key: 'q', modifiers: ['ctrl'], description: 'Quit application', category: 'system' },
  { key: 'r', modifiers: ['ctrl', 'shift'], description: 'Reload application', category: 'system' }
];

export function useKeyboardShortcuts(options: ShortcutHookOptions = {}) {
  const {
    enableTooltips = true,
    preventDefault = true,
    showNotifications = false
  } = options;

  const animation = useAnimationState();
  const settings = useSettings();
  const notifications = useNotifications();
  
  const shortcutsRef = useRef<Map<string, KeyboardShortcut>>(new Map());
  const enabledRef = useRef(true);

  // Helper function to create shortcut key
  const createShortcutKey = (key: string, modifiers: string[] = []): string => {
    return [...modifiers.sort(), key.toLowerCase()].join('+');
  };

  // Helper function to parse keyboard event to shortcut key
  const eventToShortcutKey = (event: KeyboardEvent): string => {
    const modifiers = [];
    if (event.ctrlKey || event.metaKey) modifiers.push('ctrl');
    if (event.altKey) modifiers.push('alt');
    if (event.shiftKey) modifiers.push('shift');
    
    let key = event.key;
    // Normalize special keys
    if (key === ' ') key = 'Space';
    
    return createShortcutKey(key, modifiers);
  };

  // Register default shortcuts with handlers
  const registerDefaultShortcuts = useCallback(() => {
    const shortcuts: KeyboardShortcut[] = DEFAULT_SHORTCUTS.map(shortcut => ({
      ...shortcut,
      enabled: true,
      global: false,
      handler: async () => {
        switch (shortcut.key + (shortcut.modifiers?.join('+') || '')) {
          // Animation controls
          case 'Space':
            if (animation.canResume) {
              await animation.play();
            } else if (animation.canPause) {
              await animation.pause();
            }
            break;
          case 'Enter+ctrl':
            if (animation.canStart) {
              // Need image to start - could show notification to select image
              if (showNotifications && !animation.loadedImage) {
                notifications.showWarning('Please select an image first');
              }
            }
            break;
          case 'Escape':
            if (animation.canStop) {
              await animation.stop();
            }
            break;
          case 'ArrowRight':
            if (animation.canSkip) {
              await animation.skipToEnd();
            }
            break;
          case 'r+ctrl':
            await animation.restart();
            break;
          
          // Interface controls
          case 'h+ctrl':
            settings.toggleHUD(!settings.interfaceSettings.showHUD);
            break;
          case 'F11':
            await window.electronAPI?.window.toggleFullscreen();
            break;
          case 'F12':
            await window.electronAPI?.ui.toggleDevTools();
            break;
          case 'Tab+ctrl':
            notifications.toggleNotificationsPanel();
            break;
          
          // Settings shortcuts
          case '1+ctrl':
            settings.setQuality('low');
            break;
          case '2+ctrl':
            settings.setQuality('medium');
            break;
          case '3+ctrl':
            settings.setQuality('high');
            break;
          case '4+ctrl':
            settings.setQuality('ultra');
            break;
          case 'ArrowUp+ctrl':
            settings.setDensity(Math.min(settings.animationSettings.density + 0.1, 1));
            break;
          case 'ArrowDown+ctrl':
            settings.setDensity(Math.max(settings.animationSettings.density - 0.1, 0.1));
            break;
          case 'ArrowRight+ctrl':
            settings.setSpeed(Math.min(settings.animationSettings.speed + 0.1, 2));
            break;
          case 'ArrowLeft+ctrl':
            settings.setSpeed(Math.max(settings.animationSettings.speed - 0.1, 0.1));
            break;
          
          // System shortcuts
          case 'F1':
            if (showNotifications) {
              notifications.showInfo('Press Ctrl+? to view all keyboard shortcuts', 'Help');
            }
            break;
          case 'q+ctrl':
            await window.electronAPI?.window.close();
            break;
          case 'r+ctrl+shift':
            await window.electronAPI?.ui.reload();
            break;
          
          default:
            console.log('Unhandled shortcut:', shortcut.key, shortcut.modifiers);
        }
      }
    }));

    // Clear existing shortcuts and register new ones
    shortcutsRef.current.clear();
    shortcuts.forEach(shortcut => {
      const key = createShortcutKey(shortcut.key, shortcut.modifiers);
      shortcutsRef.current.set(key, shortcut);
    });
  }, [animation, settings, notifications, showNotifications]);

  // Handle keyboard events
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabledRef.current) return;

    const shortcutKey = eventToShortcutKey(event);
    const shortcut = shortcutsRef.current.get(shortcutKey);

    if (shortcut && shortcut.enabled) {
      if (preventDefault) {
        event.preventDefault();
      }
      
      try {
        shortcut.handler(event);
        
        if (showNotifications && enableTooltips) {
          notifications.showSuccess(shortcut.description, 'Shortcut Executed');
        }
      } catch (error) {
        console.error('Shortcut handler failed:', error);
        if (showNotifications) {
          notifications.showError('Shortcut execution failed');
        }
      }
    }
  }, [preventDefault, showNotifications, enableTooltips, notifications]);

  // Register a custom shortcut
  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    const key = createShortcutKey(shortcut.key, shortcut.modifiers);
    shortcutsRef.current.set(key, shortcut);
  }, []);

  // Unregister a shortcut
  const unregisterShortcut = useCallback((key: string, modifiers?: string[]) => {
    const shortcutKey = createShortcutKey(key, modifiers);
    shortcutsRef.current.delete(shortcutKey);
  }, []);

  // Enable/disable shortcuts
  const setEnabled = useCallback((enabled: boolean) => {
    enabledRef.current = enabled;
  }, []);

  // Enable/disable specific shortcut
  const setShortcutEnabled = useCallback((key: string, modifiers: string[] = [], enabled: boolean) => {
    const shortcutKey = createShortcutKey(key, modifiers);
    const shortcut = shortcutsRef.current.get(shortcutKey);
    if (shortcut) {
      shortcut.enabled = enabled;
    }
  }, []);

  // Get all registered shortcuts
  const getShortcuts = useCallback((): KeyboardShortcut[] => {
    return Array.from(shortcutsRef.current.values());
  }, []);

  // Get shortcuts by category
  const getShortcutsByCategory = useCallback((category: KeyboardShortcut['category']): KeyboardShortcut[] => {
    return Array.from(shortcutsRef.current.values()).filter(s => s.category === category);
  }, []);

  // Show shortcuts help
  const showShortcutsHelp = useCallback(() => {
    const shortcuts = getShortcuts();
    const categories = ['animation', 'interface', 'file', 'settings', 'system'] as const;
    
    let helpText = 'Keyboard Shortcuts:\n\n';
    
    categories.forEach(category => {
      const categoryShortcuts = shortcuts.filter(s => s.category === category && s.enabled);
      if (categoryShortcuts.length > 0) {
        helpText += `${category.toUpperCase()}:\n`;
        categoryShortcuts.forEach(shortcut => {
          const keys = shortcut.modifiers ? [...shortcut.modifiers, shortcut.key].join('+') : shortcut.key;
          helpText += `  ${keys}: ${shortcut.description}\n`;
        });
        helpText += '\n';
      }
    });

    notifications.showInfo(helpText, 'Keyboard Shortcuts');
  }, [getShortcuts, notifications]);

  // Setup event listeners
  useEffect(() => {
    registerDefaultShortcuts();
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [registerDefaultShortcuts, handleKeyDown]);

  // Register global shortcut for showing help
  useEffect(() => {
    const helpShortcut: KeyboardShortcut = {
      key: '?',
      modifiers: ['ctrl'],
      description: 'Show keyboard shortcuts',
      category: 'system',
      enabled: true,
      handler: showShortcutsHelp
    };
    
    registerShortcut(helpShortcut);
  }, [registerShortcut, showShortcutsHelp]);

  return {
    // Shortcut management
    registerShortcut,
    unregisterShortcut,
    getShortcuts,
    getShortcutsByCategory,
    
    // Enable/disable
    setEnabled,
    setShortcutEnabled,
    enabled: enabledRef.current,
    
    // Utilities
    showShortcutsHelp,
    createShortcutKey,
    
    // Current shortcuts
    shortcuts: getShortcuts()
  };
}
