/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { FileControls } from '../../../src/renderer/components/controls/FileControls';

// Mock the ImagePreview component
jest.mock('../../../src/renderer/components/ImagePreview', () => ({
  ImagePreview: ({ imagePath, alt, showMetadata, 'data-testid': testId }: any) => (
    <div data-testid={testId || 'image-preview'}>
      <img src={imagePath} alt={alt} />
      {showMetadata && <div data-testid="metadata">Metadata</div>}
    </div>
  )
}));

// Mock CSS import
jest.mock('../../../src/renderer/components/controls/FileControls.css', () => ({}));

describe('FileControls Component', () => {
  const user = userEvent.setup();

  const mockOnImageSelected = jest.fn();
  const mockOnError = jest.fn();

  const defaultProps = {
    onImageSelected: mockOnImageSelected,
    onError: mockOnError
  };

  const renderFileControls = (overrideProps = {}) => {
    return render(<FileControls {...defaultProps} {...overrideProps} />);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock URL.createObjectURL and revokeObjectURL
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      renderFileControls();
      expect(screen.getByText('Load Image')).toBeInTheDocument();
    });

    it('displays drop zone with instructions', () => {
      renderFileControls();
      expect(screen.getByText('Drag & drop an image here, or click to browse')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /browse files/i })).toBeInTheDocument();
    });

    it('shows loading state when processing', async () => {
      renderFileControls();

      // Mock file input
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByTestId('file-input');

      // Trigger file selection
      await user.upload(fileInput, file);

      // Check loading state
      expect(screen.getByText('Processing image...')).toBeInTheDocument();
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    });

    it('displays current image when provided', () => {
      const currentImage = {
        name: 'test.jpg',
        path: '/path/to/test.jpg',
        size: 1024000,
        type: 'image/jpeg',
        width: 1920,
        height: 1080,
        lastModified: new Date('2023-01-01')
      };

      renderFileControls({ currentImage });

      expect(screen.getByText('Current Image')).toBeInTheDocument();
      expect(screen.getByTestId('current-image-preview')).toBeInTheDocument();
      expect(screen.getByText('test.jpg')).toBeInTheDocument();
      expect(screen.getByText('1000.0 KB')).toBeInTheDocument();
      expect(screen.getByText('1920 × 1080')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /clear image/i })).toBeInTheDocument();
    });
  });

  describe('File Selection', () => {
    it('handles file selection via browse button', async () => {
      renderFileControls();

      const browseButton = screen.getByRole('button', { name: /browse files/i });
      await user.click(browseButton);

      // File input should be triggered (we can't test the actual file dialog)
      const fileInput = screen.getByTestId('file-input');
      expect(fileInput).toBeInTheDocument();
    });

    it('processes valid image file successfully', async () => {
      // Mock Image constructor
      const mockImage = {
        onload: null as any,
        onerror: null as any,
        src: '',
        naturalWidth: 1920,
        naturalHeight: 1080
      };

      global.Image = jest.fn(() => mockImage) as any;

      renderFileControls();

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByTestId('file-input');

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      // Trigger image load
      act(() => {
        mockImage.onload?.();
      });

      await waitFor(() => {
        expect(mockOnImageSelected).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'test.jpg',
            size: 4,
            type: 'image/jpeg',
            width: 1920,
            height: 1080
          })
        );
      });
    });

    it('rejects unsupported file types', async () => {
      renderFileControls();

      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const fileInput = screen.getByTestId('file-input');

      // Directly trigger the change event
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      expect(mockOnError).toHaveBeenCalledWith(
        'Unsupported file type: text/plain. Please select a valid image file.'
      );

      // Check that error display is shown
      expect(screen.getByTestId('error-display')).toBeInTheDocument();
      expect(screen.getByText(/unsupported file type/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('rejects files that are too large', async () => {
      renderFileControls();

      // Create a file larger than 50MB
      const largeFile = new File([new ArrayBuffer(60 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByTestId('file-input');

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [largeFile] } });
      });

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(
          expect.stringContaining('File too large')
        );
      });
    });

    it('handles image load errors', async () => {
      const mockImage = {
        onload: null as any,
        onerror: null as any,
        src: ''
      };

      global.Image = jest.fn(() => mockImage) as any;

      renderFileControls();

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByTestId('file-input');

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      // Trigger image error
      mockImage.onerror?.();

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Failed to load image');
      });
    });
  });

  describe('Drag and Drop', () => {
    it('handles drag over events', () => {
      renderFileControls();

      const dropZone = screen.getByTestId('drop-zone');
      const dragOverEvent = new Event('dragover', { bubbles: true });
      Object.defineProperty(dragOverEvent, 'preventDefault', { value: jest.fn() });
      Object.defineProperty(dragOverEvent, 'stopPropagation', { value: jest.fn() });

      dropZone.dispatchEvent(dragOverEvent);

      // Event should be prevented
      expect(dragOverEvent.preventDefault).toHaveBeenCalled();
      expect(dragOverEvent.stopPropagation).toHaveBeenCalled();
    });

    it('processes dropped files', async () => {
      const mockImage = {
        onload: null as any,
        onerror: null as any,
        src: '',
        naturalWidth: 800,
        naturalHeight: 600
      };

      global.Image = jest.fn(() => mockImage) as any;

      renderFileControls();

      const file = new File(['test'], 'dropped.jpg', { type: 'image/jpeg' });
      const dropZone = screen.getByTestId('drop-zone');

      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'preventDefault', { value: jest.fn() });
      Object.defineProperty(dropEvent, 'stopPropagation', { value: jest.fn() });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: { files: [file] }
      });

      await act(async () => {
        dropZone.dispatchEvent(dropEvent);
      });

      // Trigger image load
      act(() => {
        mockImage.onload?.();
      });

      await waitFor(() => {
        expect(mockOnImageSelected).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'dropped.jpg',
            width: 800,
            height: 600
          })
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error state and retry option', async () => {
      renderFileControls();

      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const fileInput = screen.getByTestId('file-input');

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      expect(screen.getByTestId('error-display')).toBeInTheDocument();
      expect(screen.getByText(/unsupported file type/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('clears error when retry button is clicked', async () => {
      renderFileControls();

      // Trigger an error first
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const fileInput = screen.getByTestId('file-input');

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      expect(screen.getByTestId('error-display')).toBeInTheDocument();

      // Click retry
      const retryButton = screen.getByRole('button', { name: /try again/i });
      await user.click(retryButton);

      // Error should be cleared
      expect(screen.queryByTestId('error-display')).not.toBeInTheDocument();
      expect(screen.getByText('Load Image')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and test IDs', () => {
      renderFileControls({ 'data-testid': 'custom-file-controls' });

      expect(screen.getByTestId('custom-file-controls')).toBeInTheDocument();
      expect(screen.getByTestId('drop-zone')).toBeInTheDocument();
      expect(screen.getByTestId('file-input')).toBeInTheDocument();
    });

    it('disables controls when disabled prop is true', () => {
      renderFileControls({ disabled: true });

      const browseButton = screen.getByRole('button', { name: /browse files/i });
      expect(browseButton).toBeDisabled();
    });
  });

  describe('Image Validation', () => {
    it('rejects images that are too wide', async () => {
      const mockImage = {
        onload: null as any,
        onerror: null as any,
        src: '',
        naturalWidth: 5000, // Too wide
        naturalHeight: 1000
      };

      global.Image = jest.fn(() => mockImage) as any;

      renderFileControls();

      const file = new File(['test'], 'wide.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByTestId('file-input');

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
      });
      mockImage.onload?.();

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Image too wide. Maximum width is 4096px.');
      });
    });

    it('rejects images that are too tall', async () => {
      const mockImage = {
        onload: null as any,
        onerror: null as any,
        src: '',
        naturalWidth: 1000,
        naturalHeight: 5000 // Too tall
      };

      global.Image = jest.fn(() => mockImage) as any;

      renderFileControls();

      const file = new File(['test'], 'tall.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByTestId('file-input');

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
      });
      mockImage.onload?.();

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Image too tall. Maximum height is 4096px.');
      });
    });
  });
});
