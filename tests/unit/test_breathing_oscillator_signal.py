"""Unit tests for BreathingOscillator signal generation"""

import pytest
import math
import numpy as np
from src.point_shoting.services.breathing_oscillator import BreathingOscillator


class TestBreathingOscillatorSignal:
    """Test breathing oscillator signal generation properties"""
    
    def test_oscillation_amplitude_bounds(self):
        """Test that oscillation stays within amplitude bounds"""
        oscillator = BreathingOscillator()
        oscillator.configure(amplitude=0.2, frequency=1.0)
        
        # Test multiple time points over one period
        times = np.linspace(0, 1.0, 100)  # One full period at 1 Hz
        values = [oscillator.get_oscillation(t) for t in times]
        
        # Values should be within [-amplitude, +amplitude]
        assert all(-0.2 <= v <= 0.2 for v in values), "Oscillation exceeded amplitude bounds"
        
        # Should reach approximately the bounds (within 1% tolerance)
        max_val = max(values)
        min_val = min(values)
        assert max_val >= 0.19, f"Maximum value {max_val} too low"
        assert min_val <= -0.19, f"Minimum value {min_val} too high"
    
    def test_oscillation_frequency_accuracy(self):
        """Test that oscillation frequency matches configuration"""
        oscillator = BreathingOscillator()
        frequency = 2.0
        oscillator.configure(amplitude=0.1, frequency=frequency)
        
        # Sample over multiple periods with high resolution
        duration = 3.0  # 3 seconds = 6 periods at 2 Hz (more samples for accuracy)
        sample_rate = 200  # Higher sampling rate for better precision
        times = np.linspace(0, duration, int(duration * sample_rate))
        values = [oscillator.get_oscillation(t) for t in times]
        
        # Count zero crossings to estimate frequency
        zero_crossings = 0
        for i in range(1, len(values)):
            if values[i-1] * values[i] < 0:  # Sign change
                zero_crossings += 1
        
        # Each period has 2 zero crossings, so periods = zero_crossings / 2
        measured_frequency = (zero_crossings / 2) / duration
        
        # Allow 10% tolerance for numerical precision and sampling effects
        tolerance = 0.2  # More realistic tolerance
        assert abs(measured_frequency - frequency) < tolerance, \
            f"Measured frequency {measured_frequency} doesn't match configured {frequency} (tolerance: {tolerance})"
    
    def test_waveform_continuity(self):
        """Test that oscillation waveform is continuous"""
        oscillator = BreathingOscillator()
        oscillator.configure(amplitude=0.15, frequency=1.5)
        
        # Test continuity at closely spaced time points
        base_time = 0.5
        delta = 1e-5  # Small but not too small time step
        
        value_before = oscillator.get_oscillation(base_time - delta)
        value_after = oscillator.get_oscillation(base_time + delta)
        value_at = oscillator.get_oscillation(base_time)
        
        # Values should be very close (continuous function)
        continuity_threshold = 1e-3  # More realistic threshold for floating point
        assert abs(value_after - value_before) < continuity_threshold, \
            f"Oscillation shows discontinuity: {abs(value_after - value_before)} > {continuity_threshold}"
        
        # Check that derivative is bounded (smooth function)
        # For sine wave: |d/dt sin(2πft)| = |2πf cos(2πft)| ≤ 2πf * amplitude
        max_derivative = 2 * math.pi * 1.5 * 0.15  # 2πf * amplitude
        observed_derivative = abs(value_after - value_before) / (2 * delta)
        
        assert observed_derivative <= max_derivative * 1.1, \
            f"Derivative {observed_derivative} exceeds theoretical maximum {max_derivative}"
    
    def test_phase_offset_behavior(self):
        """Test that phase offset shifts the waveform correctly"""
        oscillator1 = BreathingOscillator()
        oscillator2 = BreathingOscillator()
        
        # Configure with π/2 phase difference (quarter period)
        frequency = 2.0
        oscillator1.configure(amplitude=0.1, frequency=frequency, phase_offset=0.0)
        oscillator2.configure(amplitude=0.1, frequency=frequency, phase_offset=math.pi/2)
        
        # At t=0, sin(0) = 0 and sin(π/2) = 1
        val1_t0 = oscillator1.get_oscillation(0.0)
        val2_t0 = oscillator2.get_oscillation(0.0)
        
        assert abs(val1_t0) < 0.01, f"Expected ~0 at t=0 for no phase offset, got {val1_t0}"
        assert abs(val2_t0 - 0.1) < 0.01, f"Expected ~0.1 at t=0 for π/2 phase offset, got {val2_t0}"
        
        # At quarter period, they should be swapped
        quarter_period = 0.25 / frequency  # T/4 = 1/(4*f)
        val1_quarter = oscillator1.get_oscillation(quarter_period)
        val2_quarter = oscillator2.get_oscillation(quarter_period)
        
        assert abs(val1_quarter - 0.1) < 0.01, f"Expected ~0.1 at T/4 for no phase offset"
        assert abs(val2_quarter) < 0.01, f"Expected ~0 at T/4 for π/2 phase offset"
    
    def test_decay_behavior(self):
        """Test exponential decay functionality"""
        oscillator = BreathingOscillator()
        decay_rate = 1.0  # Decay constant
        oscillator.configure(amplitude=0.2, frequency=1.0, decay=decay_rate)
        
        # Test amplitude decay over time
        t1 = 0.0
        t2 = 1.0  # After 1 time constant
        
        # At t=0, should be close to full amplitude (at peak)
        val_t1 = oscillator.get_oscillation(t1)
        # At t=1, should be reduced by factor of e^(-1) ≈ 0.368
        val_t2 = oscillator.get_oscillation(t2)
        
        # Check that decay is happening (allowing for sine wave position)
        # We'll compare peak values by using phase that gives maximum
        peak_phase_time = 0.25  # Quarter period for sine peak
        val_early_peak = abs(oscillator.get_oscillation(peak_phase_time))
        val_late_peak = abs(oscillator.get_oscillation(1.0 + peak_phase_time))
        
        decay_factor = val_late_peak / val_early_peak if val_early_peak > 0 else 0
        expected_decay = math.exp(-decay_rate * 1.0)
        
        # Allow 10% tolerance for numerical precision
        assert abs(decay_factor - expected_decay) < 0.1, \
            f"Decay factor {decay_factor} doesn't match expected {expected_decay}"
    
    def test_batch_oscillation_consistency(self):
        """Test that batch oscillation is consistent with single oscillation"""
        oscillator = BreathingOscillator()
        oscillator.configure(amplitude=0.1, frequency=2.0)
        
        time_point = 0.7
        count = 50
        
        # Get single oscillation (reference)
        single_osc = oscillator.get_oscillation(time_point)
        
        # Get batch oscillation (should have small variations but similar mean)
        batch_osc = oscillator.get_batch_oscillation(time_point, count)
        
        assert len(batch_osc) == count, "Batch size mismatch"
        
        # Mean should be close to single oscillation (within random variation)
        batch_mean = np.mean(batch_osc)
        # Allow broader tolerance due to random time variations
        assert abs(batch_mean - single_osc) < 0.05, \
            f"Batch mean {batch_mean} differs too much from single {single_osc}"
        
        # All values should be within amplitude bounds
        assert all(-0.1 <= v <= 0.1 for v in batch_osc), \
            "Batch oscillation values exceeded amplitude bounds"
    
    def test_rms_calculation_accuracy(self):
        """Test RMS amplitude calculation"""
        oscillator = BreathingOscillator()
        amplitude = 0.1
        oscillator.configure(amplitude=amplitude, frequency=1.0)
        
        # Generate enough samples to fill RMS window
        for i in range(70):  # More than window size (60)
            oscillator.get_oscillation(i * 0.01)  # Small time steps
        
        rms = oscillator.get_rms_amplitude()
        
        # For sine wave, RMS = amplitude / sqrt(2) ≈ 0.707 * amplitude
        expected_rms = amplitude / math.sqrt(2)
        
        # Allow 15% tolerance due to sampling and windowing effects
        tolerance = 0.15 * expected_rms
        assert abs(rms - expected_rms) < tolerance, \
            f"RMS {rms} doesn't match expected {expected_rms} (tolerance: {tolerance})"
    
    def test_auto_amplitude_adjustment(self):
        """Test automatic amplitude adjustment for RMS control"""
        oscillator = BreathingOscillator()
        initial_amplitude = 0.2
        oscillator.configure(amplitude=initial_amplitude, frequency=1.0)
        
        # Fill RMS window with current amplitude
        for i in range(70):
            oscillator.get_oscillation(i * 0.01)
        
        initial_rms = oscillator.get_rms_amplitude()
        
        # Try to adjust to lower target RMS
        target_rms = initial_rms * 0.5  # Half the current RMS
        oscillator.auto_adjust_amplitude(target_rms=target_rms, adjustment_rate=0.5)
        
        # Amplitude should have been reduced
        stats = oscillator.get_breathing_stats()
        new_amplitude = stats["amplitude"]
        
        assert new_amplitude < initial_amplitude, \
            f"Amplitude should have decreased from {initial_amplitude} to {new_amplitude}"
        
        # New amplitude should be reasonable (within bounds)
        assert 0.0 <= new_amplitude <= 1.0, "Amplitude out of valid range"


if __name__ == "__main__":
    pytest.main([__file__])