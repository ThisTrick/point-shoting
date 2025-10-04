/**
 * @jest-environment jsdom
 */

import { render } from '@testing-library/react';
import App from '../../../src/renderer/App';

// Mock electron API on window object
Object.defineProperty(window, 'electronAPI', {
  value: {
    settings: {
      get: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue(undefined),
      reset: jest.fn().mockResolvedValue(undefined),
      validate: jest.fn().mockResolvedValue({ isValid: true }),
      load: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockResolvedValue(undefined),
      export: jest.fn().mockResolvedValue(undefined),
      import: jest.fn().mockResolvedValue(null),
      savePreset: jest.fn().mockResolvedValue(undefined),
      loadPreset: jest.fn().mockResolvedValue(null),
      deletePreset: jest.fn().mockResolvedValue(undefined),
      listPresets: jest.fn().mockResolvedValue([]),
      applyTheme: jest.fn().mockResolvedValue(undefined),
      getTheme: jest.fn().mockResolvedValue('system'),
      setLanguage: jest.fn().mockResolvedValue(undefined),
      getLanguage: jest.fn().mockResolvedValue('en'),
      onChanged: jest.fn()
    }
  },
  writable: true
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => {
      render(<App />);
    }).not.toThrow();
  });

  it('renders main application container', () => {
    const { container } = render(<App />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
