/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { ProgressIndicator, ProgressType, ProgressStatus } from '../../../src/renderer/components/ProgressIndicator';

describe('ProgressIndicator Component', () => {
  // Helper function to render ProgressIndicator with default props
  const renderProgressIndicator = (overrideProps = {}) => {
    const defaultProps = {
      value: 0,
      max: 100,
      type: ProgressType.LINEAR,
      status: ProgressStatus.ACTIVE,
      ...overrideProps
    };

    return render(<ProgressIndicator {...defaultProps} />);
  };

  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = renderProgressIndicator();
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders linear progress by default', () => {
      const { container } = renderProgressIndicator();
      expect(container.querySelector('.linear-progress-track')).toBeInTheDocument();
    });

    it('renders circular progress when type is circular', () => {
      const { container } = renderProgressIndicator({ type: ProgressType.CIRCULAR });
      expect(container.querySelector('.circular-progress-container')).toBeInTheDocument();
      expect(container.querySelector('svg.circular-progress')).toBeInTheDocument();
    });

    it('renders stepped progress when type is stepped', () => {
      const { container } = renderProgressIndicator({ type: ProgressType.STEPPED });
      expect(container.querySelector('.stepped-progress')).toBeInTheDocument();
    });
  });

  describe('Progress Value', () => {
    it('displays correct progress percentage', () => {
      const { container } = renderProgressIndicator({ value: 60 });
      const progressFill = container.querySelector('.linear-progress-fill');
      
      expect(progressFill).toHaveStyle('width: 60%');
    });

    it('clamps progress to 0-100 range', () => {
      const { container: container1 } = renderProgressIndicator({ value: -10 });
      const progressFill1 = container1.querySelector('.linear-progress-fill');
      expect(progressFill1).toHaveStyle('width: 0%');

      const { container: container2 } = renderProgressIndicator({ value: 150 });
      const progressFill2 = container2.querySelector('.linear-progress-fill');
      expect(progressFill2).toHaveStyle('width: 100%');
    });

    it('calculates percentage correctly with custom max', () => {
      const { container } = renderProgressIndicator({ value: 25, max: 50 });
      const progressFill = container.querySelector('.linear-progress-fill');
      
      expect(progressFill).toHaveStyle('width: 50%'); // 25/50 = 50%
    });
  });

  describe('Status States', () => {
    it('applies active status class', () => {
      const { container } = renderProgressIndicator({ status: ProgressStatus.ACTIVE });
      expect(container.firstChild).toHaveClass('progress-active');
    });

    it('applies success status class', () => {
      const { container } = renderProgressIndicator({ status: ProgressStatus.SUCCESS });
      expect(container.firstChild).toHaveClass('progress-success');
    });

    it('applies error status class', () => {
      const { container } = renderProgressIndicator({ status: ProgressStatus.ERROR });
      expect(container.firstChild).toHaveClass('progress-error');
    });

    it('applies warning status class', () => {
      const { container } = renderProgressIndicator({ status: ProgressStatus.WARNING });
      expect(container.firstChild).toHaveClass('progress-warning');
    });

    it('applies idle status class', () => {
      const { container } = renderProgressIndicator({ status: ProgressStatus.IDLE });
      expect(container.firstChild).toHaveClass('progress-idle');
    });
  });

  describe('Labels and Text', () => {
    it('shows percentage when showPercentage is true and label is provided', () => {
      renderProgressIndicator({ 
        value: 75, 
        showPercentage: true,
        label: 'Progress',
        showLabel: true
      });
      
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('shows custom label when provided', () => {
      renderProgressIndicator({ 
        label: 'Loading files...',
        showLabel: true 
      });
      
      expect(screen.getByText('Loading files...')).toBeInTheDocument();
    });

    it('hides label when showLabel is false', () => {
      renderProgressIndicator({ 
        label: 'Loading files...',
        showLabel: false 
      });
      
      expect(screen.queryByText('Loading files...')).not.toBeInTheDocument();
    });

    it('shows description when provided', () => {
      renderProgressIndicator({ 
        description: 'Processing image data...' 
      });
      
      expect(screen.getByText('Processing image data...')).toBeInTheDocument();
    });
  });

  describe('Indeterminate Progress', () => {
    it('renders indeterminate progress correctly', () => {
      const { container } = renderProgressIndicator({ 
        type: ProgressType.INDETERMINATE 
      });
      
      const progressFill = container.querySelector('.linear-progress-fill');
      expect(progressFill).toHaveClass('indeterminate');
      expect(progressFill).toHaveStyle('width: 100%');
    });
  });

  describe('Animation', () => {
    it('applies animated class when animated is true', () => {
      const { container } = renderProgressIndicator({ animated: true });
      const progressFill = container.querySelector('.linear-progress-fill');
      
      expect(progressFill).toHaveClass('animated');
    });

    it('does not apply animated class when animated is false', () => {
      const { container } = renderProgressIndicator({ animated: false });
      const progressFill = container.querySelector('.linear-progress-fill');
      
      expect(progressFill).not.toHaveClass('animated');
    });

    it('applies striped class when striped is true', () => {
      const { container } = renderProgressIndicator({ striped: true });
      const progressFill = container.querySelector('.linear-progress-fill');
      
      expect(progressFill).toHaveClass('striped');
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      const { container } = renderProgressIndicator({ 
        className: 'custom-progress' 
      });
      
      expect(container.firstChild).toHaveClass('custom-progress');
    });

    it('applies custom colors', () => {
      const { container } = renderProgressIndicator({ 
        color: '#ff0000',
        backgroundColor: '#cccccc'
      });
      
      const track = container.querySelector('.linear-progress-track');
      const fill = container.querySelector('.linear-progress-fill');
      
      expect(track).toHaveStyle('background-color: #cccccc');
      expect(fill).toHaveStyle('background-color: #ff0000');
    });

    it('thickness prop affects circular progress stroke width', () => {
      // thickness is used for strokeWidth in circular progress, not linear height
      const { container } = renderProgressIndicator({ 
        type: ProgressType.CIRCULAR,
        thickness: 6
      });
      
      const circles = container.querySelectorAll('circle');
      circles.forEach(circle => {
        expect(circle).toHaveAttribute('stroke-width', '6');
      });
    });
  });

  describe('Size Variants', () => {
    it('uses correct height for small linear progress', () => {
      const { container } = renderProgressIndicator({ size: 'small' });
      const track = container.querySelector('.linear-progress-track');
      expect(track).toHaveStyle('height: 4px');
    });

    it('uses correct height for medium linear progress', () => {
      const { container } = renderProgressIndicator({ size: 'medium' });
      const track = container.querySelector('.linear-progress-track');
      expect(track).toHaveStyle('height: 8px');
    });

    it('uses correct height for large linear progress', () => {
      const { container } = renderProgressIndicator({ size: 'large' });
      const track = container.querySelector('.linear-progress-track');
      expect(track).toHaveStyle('height: 12px');
    });
  });

  describe('Circular Progress Specific', () => {
    it('renders SVG circles for circular progress', () => {
      const { container } = renderProgressIndicator({ 
        type: ProgressType.CIRCULAR 
      });
      
      const circles = container.querySelectorAll('circle');
      expect(circles).toHaveLength(2); // background + foreground
    });

    it('applies correct stroke width for circular progress', () => {
      const { container } = renderProgressIndicator({ 
        type: ProgressType.CIRCULAR,
        thickness: 8
      });
      
      const circles = container.querySelectorAll('circle');
      circles.forEach(circle => {
        expect(circle).toHaveAttribute('stroke-width', '8');
      });
    });
  });

  describe('Stepped Progress Specific', () => {
    it('renders stepped progress container', () => {
      const { container } = renderProgressIndicator({ 
        type: ProgressType.STEPPED,
        max: 50,
        value: 25
      });
      
      expect(container.querySelector('.stepped-progress')).toBeInTheDocument();
    });

    it('creates correct number of steps', () => {
      const { container } = renderProgressIndicator({ 
        type: ProgressType.STEPPED,
        max: 50,
        value: 25
      });
      
      // Steps are calculated as Math.ceil(max / 10), so max=50 gives us 5 steps
      const steps = container.querySelectorAll('.step');
      expect(steps).toHaveLength(5);
    });

    it('marks active steps correctly', () => {
      const { container } = renderProgressIndicator({ 
        type: ProgressType.STEPPED,
        max: 100,
        value: 40
      });
      
      // At 40% progress with 10 steps, we should have 4 active steps
      const activeSteps = container.querySelectorAll('.step.active');
      expect(activeSteps).toHaveLength(4);
    });
  });

  describe('Basic Structure', () => {
    it('contains progress-content wrapper', () => {
      const { container } = renderProgressIndicator();
      expect(container.querySelector('.progress-content')).toBeInTheDocument();
    });

    it('shows progress-header when label is provided', () => {
      const { container } = renderProgressIndicator({ 
        label: 'Test Progress',
        showLabel: true 
      });
      
      expect(container.querySelector('.progress-header')).toBeInTheDocument();
    });

    it('hides progress-header when no label is provided', () => {
      const { container } = renderProgressIndicator({ showLabel: false });
      expect(container.querySelector('.progress-header')).not.toBeInTheDocument();
    });

    it('shows description container when description is provided', () => {
      const { container } = renderProgressIndicator({ 
        description: 'Test description' 
      });
      
      expect(container.querySelector('.progress-description')).toBeInTheDocument();
    });
  });

  describe('Progress Values', () => {
    it('handles zero progress correctly', () => {
      const { container } = renderProgressIndicator({ value: 0 });
      const progressFill = container.querySelector('.linear-progress-fill');
      
      expect(progressFill).toHaveStyle('width: 0%');
    });

    it('handles full progress correctly', () => {
      const { container } = renderProgressIndicator({ value: 100 });
      const progressFill = container.querySelector('.linear-progress-fill');
      
      expect(progressFill).toHaveStyle('width: 100%');
    });

    it('handles partial progress correctly', () => {
      const { container } = renderProgressIndicator({ value: 33 });
      const progressFill = container.querySelector('.linear-progress-fill');
      
      expect(progressFill).toHaveStyle('width: 33%');
    });
  });
});
