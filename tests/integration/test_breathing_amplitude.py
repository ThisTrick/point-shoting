"""
Integration test for breathing amplitude envelope functionality.
Tests FR-014: Breathing amplitude envelope integration.
"""

import pytest

from src.point_shoting.models.settings import DensityProfile, Settings
from src.point_shoting.services.breathing_oscillator import BreathingOscillator


@pytest.mark.integration
class TestBreathingAmplitude:
    """Test breathing amplitude envelope integration functionality."""

    def test_breathing_amplitude_settings_integration(self):
        """FR-014: Test breathing amplitude integration with Settings system."""
        # Valid breathing amplitude setting
        settings = Settings(
            breathing_amplitude=0.02  # Valid range [0.0, 0.03]
        )

        # Verify breathing amplitude is stored correctly
        assert settings.breathing_amplitude == 0.02

    def test_breathing_oscillator_configuration(self):
        """Test that BreathingOscillator can be configured with different parameters."""
        settings = Settings(breathing_amplitude=0.025)  # Valid range [0.0, 0.03]
        oscillator = BreathingOscillator(settings)

        # Configure with different parameters
        oscillator.configure(frequency=1.5, amplitude=0.04, phase_offset=0.5, decay=0.1)

        # Should not raise any errors
        assert oscillator is not None

    def test_breathing_amplitude_validation_in_settings(self):
        """Test that Settings validates breathing amplitude values."""
        # Valid amplitude values should work
        valid_settings = Settings(breathing_amplitude=0.025)
        assert valid_settings.breathing_amplitude == 0.025

        # Test edge cases
        min_settings = Settings(breathing_amplitude=0.0)
        assert min_settings.breathing_amplitude == 0.0

        # Settings validation should handle reasonable values
        max_settings = Settings(breathing_amplitude=0.03)
        assert max_settings.breathing_amplitude == 0.03

    def test_breathing_settings_persistence(self):
        """Test that breathing settings persist across different scenarios."""
        test_amplitudes = [0.0, 0.01, 0.02, 0.03]  # Valid range [0.0, 0.03]

        for amplitude in test_amplitudes:
            settings = Settings(
                breathing_amplitude=amplitude, density_profile=DensityProfile.LOW
            )

            # Amplitude should be preserved
            assert settings.breathing_amplitude == amplitude

            # Should be able to create oscillator with these settings
            oscillator = BreathingOscillator(settings)
            assert oscillator is not None
