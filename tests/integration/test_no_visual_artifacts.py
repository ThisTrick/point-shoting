"""
Integration tests for NFR-011: No visual artifacts during particle transitions.

Tests visual coherence, smooth transitions, and proper particle rendering
without flickering, jumping, or temporal artifacts.
"""

from unittest.mock import Mock, patch

import numpy as np
import pytest

from src.point_shoting.models.settings import DensityProfile, Settings, SpeedProfile
from src.point_shoting.models.stage import Stage
from src.point_shoting.services.particle_engine import ParticleEngine


@pytest.mark.integration
class TestVisualArtifactsPrevention:
    """Integration tests for visual artifacts prevention during animations."""

    def test_smooth_stage_transitions(self):
        """NFR-011: Test smooth transitions between animation stages."""
        settings = Settings(
            density_profile=DensityProfile.MEDIUM, speed_profile=SpeedProfile.NORMAL
        )

        # Mock image for testing
        mock_image = Mock()
        mock_image.size = (800, 600)
        mock_image.mode = "RGB"

        with patch("PIL.Image.open", return_value=mock_image):
            engine = ParticleEngine()
            engine.init(settings, "mock_image.png")
            engine.start()

            # Test stage progression doesn't cause discontinuities
            previous_stage = None
            for _ in range(10):  # Multiple update cycles
                engine.step()  # Advance simulation by one step
                current_stage = engine.get_current_stage()

                # Verify stage transitions are logical
                if previous_stage is not None:
                    assert (
                        current_stage.value >= previous_stage.value
                        or current_stage == Stage.PRE_START
                    )

                previous_stage = current_stage

    def test_no_particle_jumping(self):
        """NFR-011: Test particles don't jump discontinuously between frames."""
        settings = Settings(
            density_profile=DensityProfile.LOW,  # Fewer particles for easier tracking
            speed_profile=SpeedProfile.SLOW,
        )

        mock_image = Mock()
        mock_image.size = (400, 300)
        mock_image.mode = "RGB"

        with patch("PIL.Image.open", return_value=mock_image):
            engine = ParticleEngine()
            engine.init(settings, "mock_image.png")
            engine.start()

            # Get initial particle state
            initial_particles = engine.get_particle_snapshot()
            if initial_particles is None:
                pytest.skip("No particles available")
            initial_positions = initial_particles.position.copy()

            # Single step to check for smooth movement
            engine.step()

            # Get updated particle state
            updated_particles = engine.get_particle_snapshot()
            if updated_particles is None:
                pytest.skip("No particles available after step")
            updated_positions = updated_particles.position

            # Calculate position changes
            position_deltas = np.abs(updated_positions - initial_positions)
            max_delta = np.max(position_deltas)

            # With very small time step, particles shouldn't move too far
            # This prevents "jumping" artifacts
            assert max_delta < 0.1, (
                f"Particles moved too far in small time step: {max_delta}"
            )

    def test_consistent_particle_count(self):
        """NFR-011: Test particle count remains stable during transitions."""
        settings = Settings(density_profile=DensityProfile.MEDIUM)

        mock_image = Mock()
        mock_image.size = (600, 400)
        mock_image.mode = "RGB"

        with patch("PIL.Image.open", return_value=mock_image):
            engine = ParticleEngine()
            engine.init(settings, "mock_image.png")
            engine.start()

            # Track particle count across multiple steps
            particle_counts = []

            for _ in range(20):  # Multiple step cycles
                engine.step()
                particles = engine.get_particle_snapshot()
                if particles is not None:
                    particle_counts.append(len(particles.position))

            # Particle count should be consistent (no disappearing/appearing particles)
            unique_counts = set(particle_counts)
            assert len(unique_counts) == 1, f"Particle count varied: {unique_counts}"

    def test_velocity_smoothness(self):
        """NFR-011: Test particle velocities change smoothly without spikes."""
        settings = Settings(
            density_profile=DensityProfile.LOW, speed_profile=SpeedProfile.NORMAL
        )

        mock_image = Mock()
        mock_image.size = (400, 300)
        mock_image.mode = "RGB"

        with patch("PIL.Image.open", return_value=mock_image):
            engine = ParticleEngine()
            engine.init(settings, "mock_image.png")
            engine.start()

            # Record velocity magnitudes over time
            velocity_magnitudes = []

            for _ in range(15):
                engine.step()
                particles = engine.get_particle_snapshot()
                if particles is not None:
                    # Calculate velocity magnitudes
                    velocities = particles.velocity
                    magnitudes = np.sqrt(velocities[:, 0] ** 2 + velocities[:, 1] ** 2)
                    avg_magnitude = np.mean(magnitudes)
                    velocity_magnitudes.append(avg_magnitude)

            # Check for sudden velocity spikes (artifacts)
            if len(velocity_magnitudes) > 1:
                velocity_changes = np.diff(velocity_magnitudes)
                max_change = np.max(np.abs(velocity_changes))

                # Velocity shouldn't change too dramatically between frames
                assert max_change < 10.0, f"Large velocity spike detected: {max_change}"

    def test_boundary_collision_smoothness(self):
        """NFR-011: Test particles behave smoothly at viewport boundaries."""
        settings = Settings(density_profile=DensityProfile.LOW)

        mock_image = Mock()
        mock_image.size = (200, 200)
        mock_image.mode = "RGB"

        with patch("PIL.Image.open", return_value=mock_image):
            engine = ParticleEngine()
            engine.init(settings, "mock_image.png")
            engine.start()

            # Run for several cycles to ensure boundary encounters
            for _ in range(30):
                engine.step()
                particles = engine.get_particle_snapshot()
                if particles is None:
                    continue
                positions = particles.position

                # Verify particles stay within valid bounds [0, 1]
                assert np.all(positions >= 0.0), "Particles went below lower bound"
                assert np.all(positions <= 1.0), "Particles went above upper bound"

                # Check for invalid position values (NaN, inf) which indicate artifacts
                assert np.all(np.isfinite(positions)), (
                    "Invalid position values detected"
                )

                # Ensure we have reasonable particle distribution (not all zeros)
                unique_positions = np.unique(positions.flatten())
                assert len(unique_positions) > 2, "Particles not properly distributed"

    def test_color_transition_stability(self):
        """NFR-011: Test color values don't flicker or have artifacts."""
        settings = Settings(density_profile=DensityProfile.LOW)

        mock_image = Mock()
        mock_image.size = (300, 200)
        mock_image.mode = "RGB"

        with patch("PIL.Image.open", return_value=mock_image):
            engine = ParticleEngine()
            engine.init(settings, "mock_image.png")
            engine.start()

            # Track color stability
            color_samples = []

            for _ in range(10):
                engine.step()
                particles = engine.get_particle_snapshot()
                if particles is None:
                    continue
                colors = particles.color_rgba

                # Sample average color values
                if len(colors) > 0:
                    avg_color = np.mean(colors, axis=0)
                    color_samples.append(avg_color)

            # Color values should be reasonable (0-255 range)
            if color_samples:
                all_colors = np.array(color_samples)
                assert np.all(all_colors >= 0), "Negative color values detected"
                assert np.all(all_colors <= 255), "Color values exceed 255"

                # Colors shouldn't fluctuate wildly (flicker artifacts)
                if len(color_samples) > 1:
                    color_variance = np.var(all_colors, axis=0)
                    max_variance = np.max(color_variance)
                    assert max_variance < 1000, (
                        f"High color variance (flickering): {max_variance}"
                    )
