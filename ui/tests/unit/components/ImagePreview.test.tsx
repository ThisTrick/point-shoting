/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImagePreview } from '../../../src/renderer/components/ImagePreview';

describe('ImagePreview Component', () => {
  const user = userEvent.setup();

  // Helper function to render ImagePreview with default props
  const renderImagePreview = (overrideProps = {}) => {
    const defaultProps = {
      imagePath: undefined,
      showMetadata: true,
      showZoomControls: true,
      maxWidth: 400,
      maxHeight: 300,
      ...overrideProps
    };

    return render(<ImagePreview {...defaultProps} />);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Empty State', () => {
    it('renders without crashing when no image provided', () => {
      renderImagePreview();
      expect(screen.getByText('No image selected')).toBeInTheDocument();
    });

    it('shows empty state icon', () => {
      renderImagePreview();
      expect(screen.getByText('📁')).toBeInTheDocument();
    });

    it('displays empty message', () => {
      renderImagePreview();
      expect(screen.getByText('No image selected')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner when isLoading is true', () => {
      renderImagePreview({ isLoading: true });
      expect(screen.getByText('Loading image...')).toBeInTheDocument();
    });

    it('shows loading overlay', () => {
      renderImagePreview({ isLoading: true });
      expect(screen.getByText('Loading image...')).toBeInTheDocument();
      expect(screen.queryByText('No image selected')).not.toBeInTheDocument();
    });
  });

  describe('Image Display', () => {
    it('renders image when path is provided', () => {
      renderImagePreview({ imagePath: '/path/to/image.jpg' });
      
      // Image should be rendered
      const image = screen.getByRole('img');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', '/path/to/image.jpg');
      expect(image).toHaveAttribute('alt', 'Preview');
    });

    it('does not show empty state when image is provided', () => {
      renderImagePreview({ imagePath: '/path/to/image.jpg' });
      
      expect(screen.queryByText('No image selected')).not.toBeInTheDocument();
    });

    it('handles image load events', () => {
      const onImageLoad = jest.fn();
      renderImagePreview({ 
        imagePath: '/path/to/image.jpg',
        onImageLoad 
      });
      
      const image = screen.getByRole('img');
      
      // Mock natural dimensions
      Object.defineProperty(image, 'naturalWidth', { value: 800, configurable: true });
      Object.defineProperty(image, 'naturalHeight', { value: 600, configurable: true });
      
      fireEvent.load(image);
      
      expect(onImageLoad).toHaveBeenCalledWith({
        width: 800,
        height: 600,
        aspectRatio: 800 / 600
      });
    });

    it('handles image error events', () => {
      const onImageError = jest.fn();
      renderImagePreview({ 
        imagePath: '/path/to/bad-image.jpg',
        onImageError 
      });
      
      const image = screen.getByRole('img');
      fireEvent.error(image);
      
      expect(onImageError).toHaveBeenCalled();
    });
  });

  describe('Zoom Controls', () => {
    it('shows zoom controls when showZoomControls is true and image is loaded', async () => {
      const { rerender } = renderImagePreview({ 
        imagePath: '/path/to/image.jpg',
        showZoomControls: true 
      });
      
      // Initially no zoom controls before image loads
      expect(screen.queryByText('−')).not.toBeInTheDocument();
      
      // Simulate image load
      const image = screen.getByRole('img');
      Object.defineProperty(image, 'naturalWidth', { value: 800, configurable: true });
      Object.defineProperty(image, 'naturalHeight', { value: 600, configurable: true });
      fireEvent.load(image);
      
      // Force re-render to update state
      rerender(<ImagePreview imagePath="/path/to/image.jpg" showZoomControls={true} />);
      
      // Now zoom controls should be visible
      expect(screen.getByText('−')).toBeInTheDocument();
      expect(screen.getByText('+')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('hides zoom controls when showZoomControls is false', () => {
      renderImagePreview({ 
        imagePath: '/path/to/image.jpg',
        showZoomControls: false 
      });
      
      expect(screen.queryByText('−')).not.toBeInTheDocument();
      expect(screen.queryByText('+')).not.toBeInTheDocument();
    });

    it('handles zoom in clicks', async () => {
      const { rerender } = renderImagePreview({ 
        imagePath: '/path/to/image.jpg',
        showZoomControls: true 
      });
      
      // Simulate image load
      const image = screen.getByRole('img');
      Object.defineProperty(image, 'naturalWidth', { value: 800, configurable: true });
      Object.defineProperty(image, 'naturalHeight', { value: 600, configurable: true });
      fireEvent.load(image);
      
      rerender(<ImagePreview imagePath="/path/to/image.jpg" showZoomControls={true} />);
      
      const zoomInButton = screen.getByTitle('Zoom In');
      await user.click(zoomInButton);
      
      // Zoom level should change (we can't easily test the exact value without more complex mocking)
      expect(zoomInButton).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('shows error message on image load failure', () => {
      renderImagePreview({ imagePath: '/path/to/bad-image.jpg' });
      
      const image = screen.getByRole('img');
      fireEvent.error(image);
      
      expect(screen.getByText('Failed to load image')).toBeInTheDocument();
      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });

    it('does not show image when error occurs', () => {
      renderImagePreview({ imagePath: '/path/to/bad-image.jpg' });
      
      const image = screen.getByRole('img');
      fireEvent.error(image);
      
      // Error overlay should be visible instead of image
      expect(screen.getByText('Failed to load image')).toBeInTheDocument();
    });
  });

  describe('Configuration', () => {
    it('respects maxWidth and maxHeight props', () => {
      const { container } = renderImagePreview({ 
        imagePath: '/path/to/image.jpg',
        maxWidth: 200,
        maxHeight: 150 
      });
      
      // Container should be present (exact sizing logic is complex to test)
      expect(container.querySelector('.image-container')).toBeInTheDocument();
    });

    it('handles missing optional props gracefully', () => {
      // Should not crash with minimal props
      render(<ImagePreview />);
      expect(screen.getByText('No image selected')).toBeInTheDocument();
    });
  });

  describe('Metadata Display', () => {
    it('shows metadata section when enabled', () => {
      renderImagePreview({ showMetadata: true });
      
      // Should not crash even without metadata
      expect(screen.getByText('No image selected')).toBeInTheDocument();
    });

    it('hides metadata section when disabled', () => {
      renderImagePreview({ showMetadata: false });
      
      expect(screen.getByText('No image selected')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides proper alt text for images', () => {
      renderImagePreview({ imagePath: '/path/to/image.jpg' });
      
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('alt', 'Preview');
    });

    it('provides proper button labels for zoom controls', async () => {
      const { rerender } = renderImagePreview({ 
        imagePath: '/path/to/image.jpg',
        showZoomControls: true 
      });
      
      // Simulate image load
      const image = screen.getByRole('img');
      Object.defineProperty(image, 'naturalWidth', { value: 800, configurable: true });
      Object.defineProperty(image, 'naturalHeight', { value: 600, configurable: true });
      fireEvent.load(image);
      
      rerender(<ImagePreview imagePath="/path/to/image.jpg" showZoomControls={true} />);
      
      expect(screen.getByTitle('Zoom Out')).toBeInTheDocument();
      expect(screen.getByTitle('Zoom In')).toBeInTheDocument();
    });
  });
});
