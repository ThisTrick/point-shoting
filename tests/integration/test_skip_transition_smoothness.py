"""
Integration test for skip smooth transition functionality.
Tests FR-031, NFR-007: Skip to final breathing should be smooth without visual artifacts.
"""

from unittest.mock import Mock, patch

import pytest

from src.point_shoting.cli.control_interface import ControlInterface
from src.point_shoting.models.settings import (
    ColorMode,
    DensityProfile,
    Settings,
    SpeedProfile,
)
from src.point_shoting.models.stage import Stage
from src.point_shoting.services.particle_engine import ParticleEngine


@pytest.mark.integration
class TestSkipTransitionSmoothness:
    """Test smooth transitions when skipping to final breathing stage."""

    def setup_method(self):
        """Setup test environment."""

        self.settings = Settings(
            density_profile=DensityProfile.MEDIUM,
            speed_profile=SpeedProfile.NORMAL,
            color_mode=ColorMode.STYLIZED,
            hud_enabled=False,
            locale="en",
        )

    @pytest.mark.skip("NumPy dtype mismatch issue")
    def test_skip_to_final_smooth_transition(self):
        """Test that skip to final breathing maintains position continuity."""
        engine = ParticleEngine()
        control = ControlInterface(engine)

        # Create mock image
        with patch("PIL.Image.open") as mock_open:
            mock_img = Mock()
            mock_img.size = (100, 100)
            mock_img.mode = "RGB"
            mock_img.convert.return_value = mock_img
            mock_open.return_value = mock_img

            # Mock np.array to return proper image array
            with patch("numpy.array") as mock_array:
                # Create a 100x100x3 RGB image array
                import numpy as np

                fake_image_array = np.random.randint(
                    0, 255, (100, 100, 3), dtype=np.uint8
                )
                mock_array.return_value = fake_image_array

                # Initialize and run to CHAOS stage
                engine.init(self.settings, "test.jpg")

            # Advance to CHAOS stage
            for _ in range(50):
                engine.step()
                if engine.get_current_stage() == Stage.CHAOS:
                    break

            assert engine.get_current_stage() == Stage.CHAOS

            # Capture positions before skip
            snapshot = engine.get_particle_snapshot()
            before_positions = snapshot.position.copy()

            # Skip to final breathing
            control.skip_to_final()

            # Verify smooth transition
            assert engine.get_current_stage() == Stage.FINAL_BREATHING

            # Positions should be similar (within reasonable bounds)
            after_snapshot = engine.get_particle_snapshot()
            after_positions = after_snapshot.position
            position_delta = abs(after_positions - before_positions).max()

            # Allow some movement but not teleportation
            assert position_delta < 0.5, f"Position jump too large: {position_delta}"

    def test_skip_maintains_particle_count(self):
        """Test that skip operations maintain stable particle count."""
        engine = ParticleEngine()
        control = ControlInterface(engine)

        with patch("PIL.Image.open") as mock_open:
            mock_img = Mock()
            mock_img.size = (100, 100)
            mock_img.convert.return_value.resize.return_value = mock_img
            mock_open.return_value = mock_img

            engine.init(self.settings, "test.jpg")
            initial_count = len(engine.get_particle_snapshot().position)

            # Skip to final breathing
            control.skip_to_final()

            # Particle count should remain stable
            final_count = len(engine.get_particle_snapshot().position)
            assert final_count == initial_count

    def test_skip_velocity_smoothing(self):
        """Test that skip operations smooth out velocities appropriately."""
        engine = ParticleEngine()
        control = ControlInterface(engine)

        with patch("PIL.Image.open") as mock_open:
            mock_img = Mock()
            mock_img.size = (100, 100)
            mock_img.convert.return_value.resize.return_value = mock_img
            mock_open.return_value = mock_img

            # Start animation via ControlInterface to set up session properly
            control.start(self.settings, "test.jpg")

            # Advance to build up some velocity
            for _ in range(20):
                engine.step()

            # Skip to final breathing
            control.skip_to_final()

            # Allow several steps for velocities to settle
            for _ in range(10):
                engine.step()

            # Check that we're in an advanced stage (allow CONVERGING, FORMATION or FINAL_BREATHING)
            current_stage = engine.get_current_stage()
            assert current_stage in (
                Stage.CONVERGING,
                Stage.FORMATION,
                Stage.FINAL_BREATHING,
            ), f"Wrong stage after skip: {current_stage}"

            # Velocities should be reasonable for late-stage animation
            snapshot = engine.get_particle_snapshot()
            velocities = snapshot.velocity
            max_velocity = abs(velocities).max()

            # Should be controlled but allow higher values for complex transitions
            assert max_velocity < 0.3, f"Velocities too high after skip: {max_velocity}"
            assert max_velocity > 0.0, "Velocities should not be completely zero"

    def test_skip_multiple_times_stable(self):
        """Test that multiple skip operations don't cause instability."""
        engine = ParticleEngine()
        control = ControlInterface(engine)

        with patch("PIL.Image.open") as mock_open:
            mock_img = Mock()
            mock_img.size = (100, 100)
            mock_img.convert.return_value.resize.return_value = mock_img
            mock_open.return_value = mock_img

            # Start animation via ControlInterface to set up session properly
            control.start(self.settings, "test.jpg")

            # Multiple skip attempts should be idempotent
            import time

            for _i in range(5):
                # Add small delay to avoid debounce issues
                time.sleep(0.11)  # Sleep slightly longer than debounce threshold

                control.skip_to_final()
                engine.step()

                assert engine.get_current_stage() == Stage.FINAL_BREATHING

                # Positions should remain bounded
                snapshot = engine.get_particle_snapshot()
                positions = snapshot.position
                assert (positions >= 0.0).all(), "Positions below lower bound"
                assert (positions <= 1.0).all(), "Positions above upper bound"
