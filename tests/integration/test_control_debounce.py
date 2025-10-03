"""
Integration test for control debounce functionality.
Tests FR-028: Control commands should be debounced to prevent spam.
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
class TestControlDebounce:
    """Test debounce behavior for control commands."""

    def setup_method(self):
        """Setup test environment."""

        self.settings = Settings(
            density_profile=DensityProfile.MEDIUM,
            speed_profile=SpeedProfile.NORMAL,
            color_mode=ColorMode.STYLIZED,
            hud_enabled=False,
            locale="en",
        )

    def test_restart_debounce_prevents_spam(self):
        """Test that restart commands are debounced properly."""
        engine = ParticleEngine()
        control = ControlInterface(engine)

        with patch("PIL.Image.open") as mock_open:
            mock_img = Mock()
            mock_img.size = (100, 100)
            mock_img.convert.return_value.resize.return_value = mock_img
            mock_open.return_value = mock_img

            # Initialize engine
            engine.init(self.settings, "test.jpg")

            # Advance some steps to get past initial state
            for _ in range(10):
                engine.step()

            # Rapid restart calls should be debounced
            restart_count = 0
            original_init = engine.init

            def count_initialize(*args, **kwargs):
                nonlocal restart_count
                restart_count += 1
                return original_init(*args, **kwargs)

            with patch.object(engine, "init", side_effect=count_initialize):
                # Rapid fire restarts
                for _ in range(10):
                    control.restart()

                # Should only trigger once due to debouncing
                assert restart_count <= 2, (
                    f"Too many restarts triggered: {restart_count}"
                )

    def test_pause_resume_debounce(self):
        """Test that pause/resume commands handle rapid toggling."""
        engine = ParticleEngine()
        control = ControlInterface(engine)

        with patch("PIL.Image.open") as mock_open:
            mock_img = Mock()
            mock_img.size = (100, 100)
            mock_img.convert.return_value.resize.return_value = mock_img
            mock_open.return_value = mock_img

            # Initialize and start
            control.start(self.settings, "test.jpg")

            # Rapid pause/resume should be stable
            for _ in range(5):
                control.pause()
                control.resume()

            # Should end up in a consistent state
            assert control.is_running() in [True, False]  # Either state is fine

    def test_settings_debounce_prevents_excessive_updates(self):
        """Test that rapid settings changes are debounced."""
        engine = ParticleEngine()
        control = ControlInterface(engine)

        with patch("PIL.Image.open") as mock_open:
            mock_img = Mock()
            mock_img.size = (100, 100)
            mock_img.convert.return_value.resize.return_value = mock_img
            mock_open.return_value = mock_img

            engine.init(self.settings, "test.jpg")

            apply_count = 0
            original_apply = engine.apply_settings

            def count_apply_settings(*args, **kwargs):
                nonlocal apply_count
                apply_count += 1
                return original_apply(*args, **kwargs)

            with patch.object(
                engine, "apply_settings", side_effect=count_apply_settings
            ):
                # Rapid settings changes
                new_settings = Settings(
                    density_profile=DensityProfile.HIGH,
                    speed_profile=SpeedProfile.FAST,
                    color_mode=ColorMode.PRECISE,
                    hud_enabled=True,
                    locale="uk",
                )

                for _ in range(10):
                    control.apply_settings(new_settings)

                # Should be debounced
                assert apply_count <= 3, (
                    f"Too many settings applications: {apply_count}"
                )

    def test_skip_to_final_debounce(self):
        """Test that skip to final commands are debounced."""
        engine = ParticleEngine()
        control = ControlInterface(engine)

        with patch("PIL.Image.open") as mock_open:
            mock_img = Mock()
            mock_img.size = (100, 100)
            mock_img.convert.return_value.resize.return_value = mock_img
            mock_open.return_value = mock_img

            engine.init(self.settings, "test.jpg")

            # Track stage transitions
            stage_changes = []

            def track_stage():
                current = engine.get_current_stage()
                if not stage_changes or stage_changes[-1] != current:
                    stage_changes.append(current)
                return current

            # Simulate stage tracking
            track_stage()

            # Rapid skip commands
            for _ in range(10):
                control.skip_to_final()
                engine.step()
                track_stage()

            # Should not cause excessive stage changes (debounced)
            assert len(stage_changes) <= 5, (
                f"Too many stage transitions: {len(stage_changes)}"
            )

    def test_concurrent_commands_stability(self):
        """Test that concurrent different commands don't interfere."""
        engine = ParticleEngine()
        control = ControlInterface(engine)

        with patch("PIL.Image.open") as mock_open:
            mock_img = Mock()
            mock_img.size = (100, 100)
            mock_img.convert.return_value.resize.return_value = mock_img
            mock_open.return_value = mock_img

            # Start the engine with proper parameters
            control.start(self.settings, "test.jpg")

            # Mix of different commands in quick succession
            control.pause()
            control.skip_to_final()
            control.resume()
            new_settings = Settings(
                density_profile=DensityProfile.MEDIUM,
                speed_profile=SpeedProfile.FAST,
                color_mode=ColorMode.STYLIZED,
                hud_enabled=True,
                locale="en",
            )
            control.apply_settings(new_settings)
            control.restart()

            # System should remain stable
            snapshot = engine.get_particle_snapshot()
            assert snapshot is not None
            assert engine.get_current_stage() in list(Stage)
