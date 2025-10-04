/**
 * @jest-environment jsdom
 */

import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts, defaultShortcuts } from '../../../src/renderer/hooks/useKeyboardShortcuts';
import type { KeyboardShortcut } from '../../../src/renderer/types';

describe('useKeyboardShortcuts Hook - Basic Tests', () => {
  const mockAction = jest.fn();
  
  const testShortcuts: KeyboardShortcut[] = [
    {
      id: 'test.space',
      key: ' ',
      modifiers: [],
      description: 'Test spacebar',
      category: 'test',
      action: mockAction,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockAction.mockClear();
  });

  describe('Hook Structure', () => {
    it('returns expected API methods', () => {
      const { result } = renderHook(() => useKeyboardShortcuts(testShortcuts));
      
      expect(typeof result.current.getShortcutDisplay).toBe('function');
      expect(typeof result.current.getAllShortcuts).toBe('function');
      expect(Array.isArray(result.current.allShortcuts)).toBe(true);
      expect(typeof result.current.isEnabled).toBe('boolean');
    });

    it('sets up event listeners correctly', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      
      renderHook(() => useKeyboardShortcuts(testShortcuts));
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      
      addEventListenerSpy.mockRestore();
    });

    it('cleans up on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
      
      const { unmount } = renderHook(() => useKeyboardShortcuts(testShortcuts));
      
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Shortcut Management', () => {
    it('includes default shortcuts', () => {
      const { result } = renderHook(() => useKeyboardShortcuts([]));
      
      const categories = result.current.getAllShortcuts();
      
      expect(categories.length).toBeGreaterThan(0);
      expect(categories.some(cat => cat.id === 'file')).toBe(true);
      expect(categories.some(cat => cat.id === 'animation')).toBe(true);
    });

    it('merges custom shortcuts with defaults', () => {
      const { result } = renderHook(() => useKeyboardShortcuts(testShortcuts));
      
      const allShortcuts = result.current.allShortcuts;
      
      // Should have both default and custom shortcuts
      expect(allShortcuts.length).toBeGreaterThan(testShortcuts.length);
      
      // Should include our test shortcut
      const hasTestShortcut = allShortcuts.some(s => s.id === 'test.space');
      expect(hasTestShortcut).toBe(true);
    });

    it('displays shortcuts correctly', () => {
      const { result } = renderHook(() => useKeyboardShortcuts(testShortcuts));
      
      const testShortcut = testShortcuts.find(s => s.key === ' ');
      if (testShortcut) {
        const display = result.current.getShortcutDisplay(testShortcut);
        // Should format the space key
        expect(display).toContain('Space');
      }
    });
  });

  describe('Configuration Options', () => {
    it('respects enabled option', () => {
      const { result } = renderHook(() => 
        useKeyboardShortcuts(testShortcuts, { enabled: true })
      );
      
      expect(result.current.isEnabled).toBe(true);
    });

    it('handles disabled state', () => {
      const { result } = renderHook(() => 
        useKeyboardShortcuts(testShortcuts, { enabled: false })
      );
      
      expect(result.current.isEnabled).toBe(false);
    });

    it('handles scope configuration', () => {
      expect(() => {
        renderHook(() => 
          useKeyboardShortcuts(testShortcuts, { scope: 'local' })
        );
      }).not.toThrow();
    });

    it('handles target element configuration', () => {
      const targetElement = document.createElement('div');
      document.body.appendChild(targetElement);
      
      expect(() => {
        renderHook(() => 
          useKeyboardShortcuts(testShortcuts, { 
            scope: 'local',
            target: targetElement 
          })
        );
      }).not.toThrow();
      
      document.body.removeChild(targetElement);
    });
  });

  describe('Default Shortcuts Structure', () => {
    it('has file operations category', () => {
      const fileCategory = defaultShortcuts.find(cat => cat.id === 'file');
      
      expect(fileCategory).toBeDefined();
      expect(fileCategory?.name).toBe('File Operations');
      expect(Array.isArray(fileCategory?.shortcuts)).toBe(true);
    });

    it('has animation control category', () => {
      const animationCategory = defaultShortcuts.find(cat => cat.id === 'animation');
      
      expect(animationCategory).toBeDefined();
      expect(animationCategory?.name).toBe('Animation Control');
      expect(Array.isArray(animationCategory?.shortcuts)).toBe(true);
    });

    it('has properly structured shortcuts', () => {
      defaultShortcuts.forEach(category => {
        expect(category.id).toBeDefined();
        expect(category.name).toBeDefined();
        expect(Array.isArray(category.shortcuts)).toBe(true);
        
        category.shortcuts.forEach(shortcut => {
          expect(shortcut.id).toBeDefined();
          expect(shortcut.key).toBeDefined();
          expect(Array.isArray(shortcut.modifiers)).toBe(true);
          expect(shortcut.description).toBeDefined();
          expect(shortcut.category).toBeDefined();
          expect(typeof shortcut.action).toBe('function');
        });
      });
    });
  });

  describe('Display Formatting', () => {
    it('formats simple keys correctly', () => {
      const { result } = renderHook(() => useKeyboardShortcuts(testShortcuts));
      
      const shortcut: KeyboardShortcut = {
        id: 'test',
        key: 'a',
        modifiers: [],
        description: 'Test',
        category: 'test',
        action: () => {},
      };
      
      const display = result.current.getShortcutDisplay(shortcut);
      expect(display).toContain('A');
    });

    it('formats modified keys correctly', () => {
      const { result } = renderHook(() => useKeyboardShortcuts(testShortcuts));
      
      const shortcut: KeyboardShortcut = {
        id: 'test',
        key: 's',
        modifiers: ['meta'],
        description: 'Test',
        category: 'test',
        action: () => {},
      };
      
      const display = result.current.getShortcutDisplay(shortcut);
      // Should contain either Cmd symbol or Ctrl text
      expect(display.length).toBeGreaterThan(1);
    });

    it('formats space key correctly', () => {
      const { result } = renderHook(() => useKeyboardShortcuts(testShortcuts));
      
      const spaceShortcut = testShortcuts.find(s => s.key === ' ');
      if (spaceShortcut) {
        const display = result.current.getShortcutDisplay(spaceShortcut);
        expect(display).toContain('Space');
      }
    });
  });

  describe('Error Handling', () => {
    it('handles empty shortcut list', () => {
      expect(() => {
        renderHook(() => useKeyboardShortcuts([]));
      }).not.toThrow();
    });

    it('handles invalid shortcut configurations', () => {
      const invalidShortcut = {
        id: 'invalid',
        key: '',
        modifiers: [],
        description: '',
        category: '',
        action: null,
      } as any;
      
      expect(() => {
        renderHook(() => useKeyboardShortcuts([invalidShortcut]));
      }).not.toThrow();
    });

    it('handles missing options', () => {
      expect(() => {
        renderHook(() => useKeyboardShortcuts(testShortcuts, undefined));
      }).not.toThrow();
    });
  });

  describe('Type Safety', () => {
    it('returns correct types', () => {
      const { result } = renderHook(() => useKeyboardShortcuts(testShortcuts));
      
      expect(typeof result.current.getShortcutDisplay).toBe('function');
      expect(typeof result.current.getAllShortcuts).toBe('function');
      expect(Array.isArray(result.current.allShortcuts)).toBe(true);
      expect(typeof result.current.isEnabled).toBe('boolean');
    });

    it('handles array operations safely', () => {
      const { result } = renderHook(() => useKeyboardShortcuts(testShortcuts));
      
      const allShortcuts = result.current.allShortcuts;
      const categories = result.current.getAllShortcuts();
      
      expect(Array.isArray(allShortcuts)).toBe(true);
      expect(Array.isArray(categories)).toBe(true);
      
      // Should be safe to iterate
      expect(() => {
        allShortcuts.forEach(s => s.id);
        categories.forEach(c => c.name);
      }).not.toThrow();
    });
  });

  describe('Browser Compatibility', () => {
    it('handles missing performance API gracefully', () => {
      const originalPerformance = global.performance;
      delete (global as any).performance;
      
      expect(() => {
        renderHook(() => useKeyboardShortcuts(testShortcuts));
      }).not.toThrow();
      
      global.performance = originalPerformance;
    });
  });
});