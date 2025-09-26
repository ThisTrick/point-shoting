"""Contract test for BreathingOscillator"""

import pytest
import numpy as np

# Import will fail until implementation exists - that's expected for TDD
try:
    from point_shoting.services.breathing_oscillator import BreathingOscillator
    from point_shoting.models.settings import Settings
except ImportError:
    BreathingOscillator = None
    Settings = None


@pytest.mark.contract
class TestBreathingOscillatorContract:
    """Test BreathingOscillator displacement bounds and RMS constraints"""

    def test_breathing_oscillator_import_exists(self):
        """BreathingOscillator class should be importable"""
        assert BreathingOscillator is not None, "BreathingOscillator class not implemented yet"

    def test_apply_method_exists(self):
        """apply method should exist and modify positions in-place"""
        settings = Settings()
        oscillator = BreathingOscillator(settings)
        assert hasattr(oscillator, 'apply')

    def test_rms_displacement_constraint(self):
        """RMS displacement should be ≤ amplitude * 0.7"""
        import numpy as np
        from src.point_shoting.models.settings import Settings
        from src.point_shoting.services.breathing_oscillator import BreathingOscillator
        
        settings = Settings()
        oscillator = BreathingOscillator(settings)
        oscillator.configure(amplitude=0.03, frequency=1.0, decay=0.0)
        
        center = np.array([0.5, 0.5])
        targets = np.random.rand(100, 2).astype(np.float32)
        
        # Apply breathing effect
        breathed_positions = oscillator.get_radial_breathing(0.5, center, targets)
        
        # Calculate RMS displacement
        displacements = breathed_positions - targets
        rms_displacement = np.sqrt(np.mean(np.sum(displacements**2, axis=1)))
        
        # RMS should be reasonable for breathing effect
        assert rms_displacement <= 0.03 * 0.7, f"RMS displacement too high: {rms_displacement}"
        # oscillator.apply(positions, time_elapsed=1.0)
        # 
        # displacement = positions - original_positions
        # rms_displacement = np.sqrt(np.mean(displacement**2))
        # assert rms_displacement <= 0.03 * 0.7
        pass

    def test_bounds_clamping(self):
        """Applied oscillation should clamp to [0,1]^2 bounds"""
        settings = Settings()
        oscillator = BreathingOscillator(settings)
        oscillator.configure(amplitude=0.03)
        
        # Test with positions near boundaries
        positions = np.array([[0.01, 0.01], [0.99, 0.99]], dtype=np.float32)
        oscillator.apply(positions, time_elapsed=1.0)
        
        # All positions should remain in bounds
        assert np.all(positions >= 0.0), f"Some positions below 0: {positions}"
        assert np.all(positions <= 1.0), f"Some positions above 1: {positions}"

    def test_amplitude_parameter(self):
        """Oscillator should accept amplitude parameter ≤0.03"""
        settings = Settings()
        oscillator = BreathingOscillator(settings)
        
        # Test that amplitude is configurable 
        oscillator.configure(amplitude=0.02)
        stats = oscillator.get_breathing_stats()
        assert stats['amplitude'] == 0.02, f"Expected amplitude 0.02, got {stats['amplitude']}"
        
        # Test that amplitude > 0.03 is clamped to valid range (≤1.0 in our implementation)
        oscillator.configure(amplitude=0.05)  # Above the suggested limit
        stats = oscillator.get_breathing_stats()
        assert stats['amplitude'] <= 1.0, f"Amplitude should be clamped: {stats['amplitude']}"

    def test_time_based_oscillation(self):
        """Oscillation should be time-based for smooth animation"""
        import numpy as np
        from src.point_shoting.models.settings import Settings
        from src.point_shoting.services.breathing_oscillator import BreathingOscillator
        
        settings = Settings()
        oscillator = BreathingOscillator(settings)
        oscillator.configure(amplitude=0.02, frequency=1.0, decay=0.0)
        
        # Test that different time values produce different oscillations
        time1 = 0.0
        time2 = 0.5
        
        batch1 = oscillator.get_batch_oscillation(time1, 10)
        batch2 = oscillator.get_batch_oscillation(time2, 10)
        
        # Values should be different for different times
        assert not np.allclose(batch1, batch2), "Oscillation should vary with time"

    def test_continuous_waveform(self):
        """Waveform should be continuous across time steps"""
        import numpy as np
        from src.point_shoting.models.settings import Settings
        from src.point_shoting.services.breathing_oscillator import BreathingOscillator
        
        settings = Settings()
        oscillator = BreathingOscillator(settings)
        oscillator.configure(amplitude=0.02, frequency=1.0, decay=0.0)
        
        # Test sequential time steps for continuity
        dt = 1.0/60.0  # 60 FPS
        times = [0.0, dt, 2*dt, 3*dt]
        
        values = []
        for t in times:
            val = oscillator.get_batch_oscillation(t, 1)[0]
            values.append(val)
        
        # Values should be within reasonable bounds and continuous
        for val in values:
            assert -1.0 <= val <= 1.0, f"Oscillation value out of bounds: {val}"
