/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ControlPanel } from '../../../src/renderer/components/ControlPanel';
import { 
  EngineStatus, 
  EngineState, 
  AnimationConfig, 
  ParticleDensity, 
  AnimationSpeed,
  TransitionStyle,
  ColorMappingMode
} from '../../../src/types/core';

// Mock data for tests
const mockEngineStatus: EngineStatus = {
  status: EngineState.STOPPED,
  fps: 60,
  particleCount: 0,
  memoryUsage: 100,
  lastUpdate: Date.now(),
  version: '1.0.0'
};

const mockAnimationConfig: AnimationConfig = {
  density: ParticleDensity.MEDIUM,
  speed: AnimationSpeed.NORMAL,
  transitionStyle: TransitionStyle.SMOOTH,
  colorMapping: ColorMappingMode.STYLISH,
  enableEffects: true,
  enableWatermark: false
};

const mockHandlers = {
  onConfigChange: jest.fn(),
  onStart: jest.fn(),
  onPause: jest.fn(),
  onResume: jest.fn(),
  onStop: jest.fn(),
};

describe('ControlPanel Component', () => {
  const user = userEvent.setup();

  // Helper function to render ControlPanel with default props
  const renderControlPanel = (overrideProps = {}) => {
    const defaultProps = {
      engineStatus: mockEngineStatus,
      animationConfig: mockAnimationConfig,
      ...mockHandlers,
      ...overrideProps
    };

    return render(<ControlPanel {...defaultProps} />);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      renderControlPanel();
      expect(screen.getByText('Stopped')).toBeInTheDocument();
    });

    it('displays engine status information', () => {
      renderControlPanel();
      expect(screen.getByText(/stopped/i)).toBeInTheDocument();
      expect(screen.getByText(/60.0 FPS/)).toBeInTheDocument();
    });

    it('shows animation control buttons', () => {
      renderControlPanel();
      
      expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument();
    });

    it('displays parameter controls', () => {
      renderControlPanel();
      
      expect(screen.getByText(/speed/i)).toBeInTheDocument();
      expect(screen.getByText(/density/i)).toBeInTheDocument();
      
      // Check that selects are present and have correct current values in labels
      expect(screen.getByText('normal')).toBeInTheDocument(); // Speed value in label
      expect(screen.getByText('medium')).toBeInTheDocument(); // Density value in label
    });

    it('shows configuration display in non-compact mode', () => {
      renderControlPanel();
      
      expect(screen.getByText(/transition/i)).toBeInTheDocument();
      expect(screen.getByText(/color mode/i)).toBeInTheDocument();
      expect(screen.getByText(/effects/i)).toBeInTheDocument();
      expect(screen.getByText('smooth')).toBeInTheDocument();
      expect(screen.getByText('stylish')).toBeInTheDocument();
      expect(screen.getByText('On')).toBeInTheDocument();
    });
  });

  describe('Animation Controls', () => {
    it('calls onStart when start button is clicked', async () => {
      renderControlPanel();
      
      const startButton = screen.getByRole('button', { name: /start/i });
      await user.click(startButton);
      
      expect(mockHandlers.onStart).toHaveBeenCalledTimes(1);
    });

    it('calls onPause when pause button is clicked and engine is running', async () => {
      const runningStatus = { ...mockEngineStatus, status: EngineState.RUNNING };
      renderControlPanel({ engineStatus: runningStatus });
      
      const pauseButton = screen.getByRole('button', { name: /pause/i });
      await user.click(pauseButton);
      
      expect(mockHandlers.onPause).toHaveBeenCalledTimes(1);
    });

    it('calls onResume when pause button is clicked and engine is paused', async () => {
      const pausedStatus = { ...mockEngineStatus, status: EngineState.PAUSED };
      renderControlPanel({ engineStatus: pausedStatus });
      
      const resumeButton = screen.getByRole('button', { name: /resume/i });
      await user.click(resumeButton);
      
      expect(mockHandlers.onResume).toHaveBeenCalledTimes(1);
    });

    it('calls onStop when stop button is clicked and engine is running', async () => {
      const runningStatus = { ...mockEngineStatus, status: EngineState.RUNNING };
      renderControlPanel({ engineStatus: runningStatus });
      
      const stopButton = screen.getByRole('button', { name: /stop/i });
      await user.click(stopButton);
      
      expect(mockHandlers.onStop).toHaveBeenCalledTimes(1);
    });

    it('disables start button when engine is not stopped', () => {
      const runningStatus = { ...mockEngineStatus, status: EngineState.RUNNING };
      renderControlPanel({ engineStatus: runningStatus });
      
      const startButton = screen.getByRole('button', { name: /start/i });
      expect(startButton).toBeDisabled();
    });

    it('disables pause and stop buttons when engine is stopped', () => {
      renderControlPanel();
      
      const pauseButton = screen.getByRole('button', { name: /pause/i });
      const stopButton = screen.getByRole('button', { name: /stop/i });
      
      expect(pauseButton).toBeDisabled();
      expect(stopButton).toBeDisabled();
    });
  });

  describe('Parameter Controls', () => {
    it('calls onConfigChange when speed is changed', async () => {
      renderControlPanel();
      
      const selects = screen.getAllByRole('combobox');
      expect(selects).toHaveLength(2);
      const speedSelect = selects[0] as HTMLSelectElement; // First select is speed based on component order
      
      await user.selectOptions(speedSelect, 'fast');
      
      expect(mockHandlers.onConfigChange).toHaveBeenCalledWith({ speed: 'fast' });
    });

    it('calls onConfigChange when density is changed', async () => {
      renderControlPanel();
      
      const selects = screen.getAllByRole('combobox');
      expect(selects).toHaveLength(2);
      const densitySelect = selects[1] as HTMLSelectElement; // Second select is density based on component order
      
      await user.selectOptions(densitySelect, 'high');
      
      expect(mockHandlers.onConfigChange).toHaveBeenCalledWith({ density: 'high' });
    });

    it('disables controls when disabled prop is true', () => {
      renderControlPanel({ disabled: true });
      
      const selects = screen.getAllByRole('combobox');
      const speedSelect = selects[0]; // First select is speed
      const densitySelect = selects[1]; // Second select is density
      
      expect(speedSelect).toBeDisabled();
      expect(densitySelect).toBeDisabled();
    });

    it('shows all speed options', () => {
      renderControlPanel();
      
      expect(screen.getByText('Slow')).toBeInTheDocument();
      expect(screen.getByText('Normal')).toBeInTheDocument();
      expect(screen.getByText('Fast')).toBeInTheDocument();
      expect(screen.getByText('Turbo')).toBeInTheDocument();
    });

    it('shows all density options', () => {
      renderControlPanel();
      
      expect(screen.getByText('Low')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
      expect(screen.getByText('High')).toBeInTheDocument();
      expect(screen.getByText('Ultra')).toBeInTheDocument();
    });
  });

  describe('Status Display', () => {
    it('shows running status correctly', () => {
      const runningStatus = { ...mockEngineStatus, status: EngineState.RUNNING };
      renderControlPanel({ engineStatus: runningStatus });
      
      expect(screen.getByText('Running')).toBeInTheDocument();
    });

    it('shows paused status correctly', () => {
      const pausedStatus = { ...mockEngineStatus, status: EngineState.PAUSED };
      renderControlPanel({ engineStatus: pausedStatus });
      
      expect(screen.getByText('Paused')).toBeInTheDocument();
    });

    it('shows error status correctly', () => {
      const errorStatus = { ...mockEngineStatus, status: EngineState.ERROR };
      renderControlPanel({ engineStatus: errorStatus });
      
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('shows fps when available', () => {
      renderControlPanel();
      expect(screen.getByText('60.0 FPS')).toBeInTheDocument();
    });

    it('does not show fps when not available', () => {
      const statusWithoutFps = { ...mockEngineStatus, fps: undefined };
      renderControlPanel({ engineStatus: statusWithoutFps });
      
      expect(screen.queryByText(/FPS/)).not.toBeInTheDocument();
    });
  });

  describe('Compact Mode', () => {
    it('hides button text in compact mode', () => {
      renderControlPanel({ compact: true });
      
      expect(screen.queryByText('Start')).not.toBeInTheDocument();
      expect(screen.queryByText('Pause')).not.toBeInTheDocument();
      expect(screen.queryByText('Stop')).not.toBeInTheDocument();
    });

    it('hides config section in compact mode', () => {
      renderControlPanel({ compact: true });
      
      expect(screen.queryByText(/transition/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/color mode/i)).not.toBeInTheDocument();
    });

    it('shows button icons in compact mode', () => {
      renderControlPanel({ compact: true });
      
      expect(screen.getByText('▶')).toBeInTheDocument();
      expect(screen.getByText('⏸')).toBeInTheDocument();
      expect(screen.getByText('⏹')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('disables all controls when engine has error', () => {
      const errorStatus = { ...mockEngineStatus, status: EngineState.ERROR };
      renderControlPanel({ engineStatus: errorStatus });
      
      const startButton = screen.getByRole('button', { name: /start/i });
      const pauseButton = screen.getByRole('button', { name: /pause/i });
      const stopButton = screen.getByRole('button', { name: /stop/i });
      
      const selects = screen.getAllByRole('combobox');
      const speedSelect = selects[0] as HTMLSelectElement;
      const densitySelect = selects[1] as HTMLSelectElement;
      
      expect(startButton).toBeDisabled();
      expect(pauseButton).toBeDisabled();
      expect(stopButton).toBeDisabled();
      expect(speedSelect).toBeDisabled();
      expect(densitySelect).toBeDisabled();
    });
  });

  describe('Configuration Display', () => {
    it('shows effects as Off when disabled', () => {
      const configWithoutEffects = { ...mockAnimationConfig, enableEffects: false };
      renderControlPanel({ animationConfig: configWithoutEffects });
      
      expect(screen.getByText('Off')).toBeInTheDocument();
    });

    it('shows different transition styles', () => {
      const configWithBurst = { ...mockAnimationConfig, transitionStyle: TransitionStyle.BURST };
      renderControlPanel({ animationConfig: configWithBurst });
      
      expect(screen.getByText('burst')).toBeInTheDocument();
    });

    it('shows different color mapping modes', () => {
      const configWithPrecise = { ...mockAnimationConfig, colorMapping: ColorMappingMode.PRECISE };
      renderControlPanel({ animationConfig: configWithPrecise });
      
      expect(screen.getByText('precise')).toBeInTheDocument();
    });
  });
});
