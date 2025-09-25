"""Breathing oscillation service for particle animation effects"""

import math
import numpy as np
from typing import Dict, Any, Optional
from dataclasses import dataclass
from ..models.settings import Settings


@dataclass
class BreathingParams:
    """Parameters for breathing oscillation"""
    frequency: float = 2.0      # Oscillations per second
    amplitude: float = 0.1      # Maximum amplitude (0-1)
    phase_offset: float = 0.0   # Phase offset in radians
    decay: float = 0.0          # Decay factor per second
    

class BreathingOscillator:
    """Generates breathing effects with RMS amplitude constraints"""
    
    def __init__(self, settings: Settings) -> None:
        """Initialize breathing oscillator"""
        self._params = BreathingParams()
        self._time_offset = 0.0
        self._rms_window = []  # Rolling window for RMS calculation
        self._rms_window_size = 60  # 1 second at 60 FPS
        
    def configure(
        self, 
        frequency: float = 2.0,
        amplitude: float = 0.1,
        phase_offset: float = 0.0,
        decay: float = 0.0
    ) -> None:
        """
        Configure breathing parameters
        
        Args:
            frequency: Oscillations per second (Hz)
            amplitude: Maximum amplitude (0-1) 
            phase_offset: Phase offset in radians
            decay: Decay factor per second (0 = no decay)
        """
        self._params = BreathingParams(
            frequency=max(0.1, frequency),  # Minimum frequency
            amplitude=np.clip(amplitude, 0.0, 1.0),  # Clamp to valid range
            phase_offset=phase_offset,
            decay=max(0.0, decay)  # No negative decay
        )
    
    def apply(self, positions: np.ndarray, time_elapsed: float, center: Optional[np.ndarray] = None) -> None:
        """
        Apply breathing effect to positions in-place (required by contract tests)
        
        Args:
            positions: Particle positions to modify, shape (N, 2)
            time_elapsed: Current time in seconds
            center: Center point for breathing effect, defaults to [0.5, 0.5]
        """
        if center is None:
            center = np.array([0.5, 0.5])
        
        # Use the existing radial breathing method but modify in-place
        modified_positions = self.get_radial_breathing(time_elapsed, center, positions)
        
        # Clamp to [0,1]^2 bounds as required by tests
        modified_positions = np.clip(modified_positions, 0.0, 1.0)
        
        # Copy back to original array (in-place modification)
        positions[:] = modified_positions
        
    def get_oscillation(self, time_sec: float) -> float:
        """
        Get oscillation value at given time
        
        Args:
            time_sec: Time in seconds since start
            
        Returns:
            Oscillation value (-amplitude to +amplitude)
        """
        effective_time = time_sec + self._time_offset
        
        # Apply decay
        if self._params.decay > 0:
            decay_factor = math.exp(-self._params.decay * effective_time)
        else:
            decay_factor = 1.0
        
        # Calculate base oscillation
        phase = 2 * math.pi * self._params.frequency * effective_time + self._params.phase_offset
        base_oscillation = math.sin(phase)
        
        # Apply amplitude and decay
        oscillation = self._params.amplitude * decay_factor * base_oscillation
        
        # Update RMS tracking
        self._update_rms_window(oscillation)
        
        return oscillation
    
    def get_batch_oscillation(self, time_sec: float, count: int) -> np.ndarray:
        """
        Get oscillation values for batch of particles
        
        Args:
            time_sec: Base time in seconds
            count: Number of oscillation values to generate
            
        Returns:
            Array of oscillation values, shape (count,)
        """
        # Generate slight time variations for each particle to avoid perfect sync
        time_variations = np.random.uniform(-0.1, 0.1, count)
        times = time_sec + time_variations
        
        effective_times = times + self._time_offset
        
        # Apply decay
        if self._params.decay > 0:
            decay_factors = np.exp(-self._params.decay * effective_times)
        else:
            decay_factors = np.ones_like(effective_times)
        
        # Calculate base oscillations
        phases = 2 * np.pi * self._params.frequency * effective_times + self._params.phase_offset
        base_oscillations = np.sin(phases)
        
        # Apply amplitude and decay
        oscillations = self._params.amplitude * decay_factors * base_oscillations
        
        # Update RMS with average (simplified for batch)
        if len(oscillations) > 0:
            avg_oscillation = np.mean(oscillations)
            self._update_rms_window(avg_oscillation)
        
        return oscillations
    
    def get_radial_breathing(
        self, 
        time_sec: float, 
        center: np.ndarray, 
        positions: np.ndarray
    ) -> np.ndarray:
        """
        Apply radial breathing effect to positions
        
        Args:
            time_sec: Current time in seconds
            center: Center point [x, y] for breathing
            positions: Particle positions, shape (N, 2)
            
        Returns:
            Modified positions with breathing effect, shape (N, 2)
        """
        N = len(positions)
        
        # Get oscillation values for each particle
        oscillations = self.get_batch_oscillation(time_sec, N)
        
        # Calculate vectors from center to each position
        centered_positions = positions - center
        
        # Apply radial scaling based on oscillation
        scales = 1.0 + oscillations.reshape(-1, 1)  # Shape: (N, 1)
        breathed_positions = center + centered_positions * scales
        
        return breathed_positions
    
    def get_size_breathing(self, time_sec: float, base_size: float) -> float:
        """
        Apply breathing effect to particle size
        
        Args:
            time_sec: Current time in seconds
            base_size: Base particle size
            
        Returns:
            Modified size with breathing effect
        """
        oscillation = self.get_oscillation(time_sec)
        scale = 1.0 + oscillation
        return base_size * scale
    
    def get_alpha_breathing(self, time_sec: float, base_alpha: float = 1.0) -> float:
        """
        Apply breathing effect to alpha transparency
        
        Args:
            time_sec: Current time in seconds  
            base_alpha: Base alpha value (0-1)
            
        Returns:
            Modified alpha with breathing effect (0-1)
        """
        oscillation = self.get_oscillation(time_sec)
        # Map oscillation to alpha modulation (breathing in transparency)
        alpha_modulation = 0.5 + 0.5 * oscillation  # Maps [-amp, +amp] to [0.5-amp/2, 0.5+amp/2]
        result = base_alpha * alpha_modulation
        return np.clip(result, 0.0, 1.0)
    
    def _update_rms_window(self, value: float) -> None:
        """Update rolling window for RMS calculation"""
        self._rms_window.append(value)
        if len(self._rms_window) > self._rms_window_size:
            self._rms_window.pop(0)
    
    def get_rms_amplitude(self) -> float:
        """
        Get current RMS amplitude over recent window
        
        Returns:
            RMS amplitude value
        """
        if not self._rms_window:
            return 0.0
        
        # Calculate RMS
        squared_values = [x * x for x in self._rms_window]
        mean_squared = sum(squared_values) / len(squared_values)
        return math.sqrt(mean_squared)
    
    def check_rms_constraint(self, max_rms: float = 0.1) -> bool:
        """
        Check if current RMS is within constraints
        
        Args:
            max_rms: Maximum allowed RMS amplitude
            
        Returns:
            True if RMS is within constraint
        """
        current_rms = self.get_rms_amplitude()
        return current_rms <= max_rms
    
    def auto_adjust_amplitude(self, target_rms: float = 0.05, adjustment_rate: float = 0.1) -> None:
        """
        Automatically adjust amplitude to maintain target RMS
        
        Args:
            target_rms: Target RMS amplitude
            adjustment_rate: Rate of adjustment (0-1)
        """
        current_rms = self.get_rms_amplitude()
        
        if current_rms > 0:
            # Calculate adjustment factor
            rms_ratio = target_rms / current_rms
            
            # Apply gradual adjustment
            adjustment = (rms_ratio - 1.0) * adjustment_rate
            new_amplitude = self._params.amplitude * (1.0 + adjustment)
            
            # Clamp to valid range
            new_amplitude = np.clip(new_amplitude, 0.0, 1.0)
            
            # Update parameters
            self._params.amplitude = new_amplitude
    
    def reset(self, time_offset: float = 0.0) -> None:
        """
        Reset oscillator state
        
        Args:
            time_offset: New time offset in seconds
        """
        self._time_offset = time_offset
        self._rms_window.clear()
    
    def get_phase_sync_offset(self, reference_time: float) -> float:
        """
        Get phase offset to synchronize with reference time
        
        Args:
            reference_time: Reference time for synchronization
            
        Returns:
            Phase offset in radians
        """
        # Calculate what phase we would be at for reference time
        reference_phase = 2 * math.pi * self._params.frequency * reference_time
        
        # Calculate offset to align with sine wave peak (π/2)
        target_phase = math.pi / 2
        sync_offset = target_phase - reference_phase
        
        # Normalize to [0, 2π)
        sync_offset = sync_offset % (2 * math.pi)
        
        return sync_offset
    
    def get_breathing_stats(self) -> Dict[str, Any]:
        """Get statistics about current breathing parameters and state"""
        return {
            "frequency": self._params.frequency,
            "amplitude": self._params.amplitude,
            "phase_offset": self._params.phase_offset,
            "decay": self._params.decay,
            "time_offset": self._time_offset,
            "rms_amplitude": self.get_rms_amplitude(),
            "rms_window_size": len(self._rms_window),
            "rms_constraint_ok": self.check_rms_constraint(),
        }
    
    def create_harmonic_layer(self, base_frequency: float, harmonic: int = 2) -> 'BreathingOscillator':
        """
        Create a harmonic oscillator layer
        
        Args:
            base_frequency: Base frequency for harmonic calculation
            harmonic: Harmonic number (2 = octave, 3 = fifth, etc.)
            
        Returns:
            New BreathingOscillator configured as harmonic
        """
        harmonic_osc = BreathingOscillator()
        harmonic_osc.configure(
            frequency=base_frequency * harmonic,
            amplitude=self._params.amplitude / harmonic,  # Reduce amplitude for higher harmonics
            phase_offset=self._params.phase_offset,
            decay=self._params.decay
        )
        return harmonic_osc
