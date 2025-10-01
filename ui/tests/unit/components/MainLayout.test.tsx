/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { MainLayout } from '../../../src/renderer/components/MainLayout';

// Mock all the hooks that MainLayout uses
jest.mock('../../../src/renderer/hooks/useSettings', () => ({
  useSettings: () => ({
    currentTheme: 'light',
    language: 'en',
    enableAnimations: true,
    performanceMode: false
  })
}));

jest.mock('../../../src/renderer/hooks/useAnimationState', () => ({
  useAnimationState: () => ({
    state: {
      isAnimationRunning: false,
      isPaused: false,
      currentStage: 'BURST',
      progress: 0.5,
      isEngineRunning: true
    },
    animationProgress: {
      stage: 'BURST',
      progress: 0.5,
      elapsedTime: 1000,
      stageProgress: { current: 0.5, total: 0.5 }
    },
    engineStatus: {
      isRunning: true,
      isHealthy: true
    },
    play: jest.fn(),
    pause: jest.fn(),
    stop: jest.fn(),
    restart: jest.fn()
  })
}));

jest.mock('../../../src/renderer/contexts/NotificationContext', () => ({
  useNotifications: () => ({
    state: {
      isNotificationsPanelOpen: false,
      notifications: [],
      unreadCount: 0
    },
    addNotification: jest.fn(),
    markAsRead: jest.fn(),
    clearAll: jest.fn()
  })
}));

jest.mock('../../../src/renderer/hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: () => ({
    shortcuts: [],
    registerShortcut: jest.fn(),
    unregisterShortcut: jest.fn(),
    showShortcutsHelp: jest.fn(),
    hideShortcutsHelp: jest.fn(),
    toggleShortcutsHelp: jest.fn(),
    isHelpOverlayOpen: false,
    getAllShortcuts: jest.fn(() => []),
    getShortcutDisplay: jest.fn((shortcut) => `${shortcut.key}`),
    allShortcuts: [],
    isEnabled: true,
  })
}));

jest.mock('../../../src/renderer/components/utils/ShortcutsHelpOverlay', () => ({
  ShortcutsHelpOverlay: () => null
}));

describe('MainLayout Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<MainLayout />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders main layout container', () => {
      const { container } = render(<MainLayout />);
      expect(container.querySelector('.main-layout')).toBeInTheDocument();
    });

    it('renders children when provided', () => {
      render(
        <MainLayout>
          <div data-testid="test-child">Test Content</div>
        </MainLayout>
      );
      
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
  });

  describe('Layout Structure', () => {
    it('contains header section', () => {
      const { container } = render(<MainLayout />);
      expect(container.querySelector('header') || container.querySelector('.header')).toBeInTheDocument();
    });

    it('contains main content area', () => {
      const { container } = render(<MainLayout />);
      expect(container.querySelector('main') || container.querySelector('.main-content')).toBeInTheDocument();
    });

    it('contains sidebar or navigation', () => {
      const { container } = render(<MainLayout />);
      expect(
        container.querySelector('.sidebar') || 
        container.querySelector('nav') || 
        container.querySelector('.navigation')
      ).toBeInTheDocument();
    });

    it('contains footer section', () => {
      const { container } = render(<MainLayout />);
      expect(container.querySelector('footer') || container.querySelector('.footer')).toBeInTheDocument();
    });
  });

  describe('Theme Support', () => {
    it('applies light theme class', () => {
      const { container } = render(<MainLayout />);
      
      expect(container.firstChild).toHaveClass('theme-light');
    });
  });

  describe('CSS Classes', () => {
    it('applies main layout class', () => {
      const { container } = render(<MainLayout />);
      expect(container.firstChild).toHaveClass('main-layout');
    });

    it('handles empty children gracefully', () => {
      const { container } = render(<MainLayout />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Content Areas', () => {
    it('provides content wrapper for children', () => {
      render(
        <MainLayout>
          <div data-testid="child-content">Child Content</div>
        </MainLayout>
      );
      
      expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });

    it('maintains layout structure with content', () => {
      const { container } = render(
        <MainLayout>
          <div>Application Content</div>
        </MainLayout>
      );
      
      // Should still have layout structure
      expect(container.querySelector('.main-layout')).toBeInTheDocument();
      expect(screen.getByText('Application Content')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides semantic structure with landmarks', () => {
      const { container } = render(<MainLayout />);
      
      // Should have semantic elements or proper roles
      const hasSemanticStructure = 
        container.querySelector('header') ||
        container.querySelector('main') ||
        container.querySelector('nav') ||
        container.querySelector('footer') ||
        container.querySelector('[role="banner"]') ||
        container.querySelector('[role="main"]') ||
        container.querySelector('[role="navigation"]') ||
        container.querySelector('[role="contentinfo"]');
      
      expect(hasSemanticStructure).toBeInTheDocument();
    });

    it('provides accessible navigation structure', () => {
      const { container } = render(<MainLayout />);
      
      // Should have some form of navigation
      const hasNavigation = 
        container.querySelector('nav') ||
        container.querySelector('[role="navigation"]') ||
        container.querySelector('.navigation') ||
        container.querySelector('.sidebar');
      
      expect(hasNavigation).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('renders on mobile viewport', () => {
      // Set mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true });
      Object.defineProperty(window, 'innerHeight', { value: 667, configurable: true });
      
      const { container } = render(<MainLayout />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders on desktop viewport', () => {
      // Set desktop viewport
      Object.defineProperty(window, 'innerWidth', { value: 1920, configurable: true });
      Object.defineProperty(window, 'innerHeight', { value: 1080, configurable: true });
      
      const { container } = render(<MainLayout />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles undefined children', () => {
      expect(() => render(<MainLayout>{undefined}</MainLayout>)).not.toThrow();
    });

    it('handles null children', () => {
      expect(() => render(<MainLayout>{null}</MainLayout>)).not.toThrow();
    });

    it('handles multiple children', () => {
      expect(() => render(
        <MainLayout>
          <div>First child</div>
          <div>Second child</div>
        </MainLayout>
      )).not.toThrow();
    });
  });

  describe('Layout States', () => {
    it('maintains consistent layout structure', () => {
      const { container } = render(<MainLayout />);
      
      // Basic layout should be consistent
      expect(container.querySelector('.main-layout')).toBeInTheDocument();
    });

    it('handles content overflow properly', () => {
      const longContent = 'A'.repeat(10000);
      
      expect(() => render(
        <MainLayout>
          <div>{longContent}</div>
        </MainLayout>
      )).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('renders efficiently with minimal children', () => {
      const { container } = render(<MainLayout />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('handles re-renders gracefully', () => {
      const { rerender, container } = render(<MainLayout />);
      
      expect(container.firstChild).toBeInTheDocument();
      
      rerender(<MainLayout><div>New content</div></MainLayout>);
      
      expect(container.firstChild).toBeInTheDocument();
      expect(screen.getByText('New content')).toBeInTheDocument();
    });
  });
});
