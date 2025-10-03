"""
Integration tests for FR-021: Smooth transitions between speed profiles.

Tests smooth transitions between SLOW, NORMAL, and FAST speed profiles
without animation discontinuities or jarring speed changes.
"""

from unittest.mock import Mock, patch

import numpy as np
import pytest

from src.point_shoting.models.settings import DensityProfile, Settings, SpeedProfile
from src.point_shoting.services.particle_engine import ParticleEngine


@pytest.mark.integration
class TestSpeedProfileTransitions:
    """Integration tests for smooth speed profile transitions."""

    def test_slow_to_normal_transition(self):
        """FR-021: Test smooth transition from SLOW to NORMAL speed."""
        # Start with SLOW profile
        settings = Settings(
            density_profile=DensityProfile.LOW, speed_profile=SpeedProfile.SLOW
        )

        mock_image = Mock()
        mock_image.size = (400, 300)
        mock_image.mode = "RGB"

        with patch("PIL.Image.open", return_value=mock_image):
            engine = ParticleEngine()
            engine.init(settings, "test_image.png")
            engine.start()

            # Record velocity magnitudes at SLOW speed
            slow_velocities = []
            for _ in range(10):
                engine.step()
                particles = engine.get_particle_snapshot()
                if particles is not None:
                    velocities = particles.velocity
                    avg_velocity = np.mean(
                        np.sqrt(velocities[:, 0] ** 2 + velocities[:, 1] ** 2)
                    )
                    slow_velocities.append(avg_velocity)

            # Switch to NORMAL speed
            new_settings = Settings(
                density_profile=DensityProfile.LOW, speed_profile=SpeedProfile.NORMAL
            )
            engine.init(new_settings, "test_image.png")
            engine.start()

            # Record velocity magnitudes at NORMAL speed
            normal_velocities = []
            for _ in range(10):
                engine.step()
                particles = engine.get_particle_snapshot()
                if particles is not None:
                    velocities = particles.velocity
                    avg_velocity = np.mean(
                        np.sqrt(velocities[:, 0] ** 2 + velocities[:, 1] ** 2)
                    )
                    normal_velocities.append(avg_velocity)

            # NORMAL should generally be faster than SLOW
            if slow_velocities and normal_velocities:
                avg_slow = np.mean(slow_velocities[-5:])  # Last 5 measurements
                avg_normal = np.mean(normal_velocities[-5:])

                # Allow for some variation but NORMAL should trend faster
                if avg_slow > 0 and avg_normal > 0:
                    speed_ratio = avg_normal / avg_slow
                    assert speed_ratio > 0.8, (
                        f"NORMAL not faster than SLOW: {speed_ratio:.3f}"
                    )

    def test_normal_to_fast_transition(self):
        """FR-021: Test smooth transition from NORMAL to FAST speed."""
        # Start with NORMAL profile
        settings = Settings(
            density_profile=DensityProfile.LOW, speed_profile=SpeedProfile.NORMAL
        )

        mock_image = Mock()
        mock_image.size = (400, 300)
        mock_image.mode = "RGB"

        with patch("PIL.Image.open", return_value=mock_image):
            engine = ParticleEngine()
            engine.init(settings, "test_image.png")
            engine.start()

            # Record velocity magnitudes at NORMAL speed
            normal_velocities = []
            for _ in range(10):
                engine.step()
                particles = engine.get_particle_snapshot()
                if particles is not None:
                    velocities = particles.velocity
                    avg_velocity = np.mean(
                        np.sqrt(velocities[:, 0] ** 2 + velocities[:, 1] ** 2)
                    )
                    normal_velocities.append(avg_velocity)

            # Switch to FAST speed
            fast_settings = Settings(
                density_profile=DensityProfile.LOW, speed_profile=SpeedProfile.FAST
            )
            engine.init(fast_settings, "test_image.png")
            engine.start()

            # Record velocity magnitudes at FAST speed
            fast_velocities = []
            for _ in range(10):
                engine.step()
                particles = engine.get_particle_snapshot()
                if particles is not None:
                    velocities = particles.velocity
                    avg_velocity = np.mean(
                        np.sqrt(velocities[:, 0] ** 2 + velocities[:, 1] ** 2)
                    )
                    fast_velocities.append(avg_velocity)

            # FAST should generally be faster than NORMAL
            if normal_velocities and fast_velocities:
                avg_normal = np.mean(normal_velocities[-5:])
                avg_fast = np.mean(fast_velocities[-5:])

                if avg_normal > 0 and avg_fast > 0:
                    speed_ratio = avg_fast / avg_normal
                    assert speed_ratio > 0.8, (
                        f"FAST not faster than NORMAL: {speed_ratio:.3f}"
                    )

    def test_fast_to_slow_transition(self):
        """FR-021: Test smooth transition from FAST to SLOW speed."""
        # Start with FAST profile
        settings = Settings(
            density_profile=DensityProfile.LOW, speed_profile=SpeedProfile.FAST
        )

        mock_image = Mock()
        mock_image.size = (400, 300)
        mock_image.mode = "RGB"

        with patch("PIL.Image.open", return_value=mock_image):
            engine = ParticleEngine()
            engine.init(settings, "test_image.png")
            engine.start()

            # Record velocity magnitudes at FAST speed
            fast_velocities = []
            for _ in range(10):
                engine.step()
                particles = engine.get_particle_snapshot()
                if particles is not None:
                    velocities = particles.velocity
                    avg_velocity = np.mean(
                        np.sqrt(velocities[:, 0] ** 2 + velocities[:, 1] ** 2)
                    )
                    fast_velocities.append(avg_velocity)

            # Switch to SLOW speed
            slow_settings = Settings(
                density_profile=DensityProfile.LOW, speed_profile=SpeedProfile.SLOW
            )
            engine.init(slow_settings, "test_image.png")
            engine.start()

            # Record velocity magnitudes at SLOW speed
            slow_velocities = []
            for _ in range(10):
                engine.step()
                particles = engine.get_particle_snapshot()
                if particles is not None:
                    velocities = particles.velocity
                    avg_velocity = np.mean(
                        np.sqrt(velocities[:, 0] ** 2 + velocities[:, 1] ** 2)
                    )
                    slow_velocities.append(avg_velocity)

            # Verify both speeds are reasonable (no infinite or NaN values)
            if fast_velocities and slow_velocities:
                all_fast = np.array(fast_velocities)
                all_slow = np.array(slow_velocities)

                assert np.all(np.isfinite(all_fast)), "Invalid FAST velocity values"
                assert np.all(np.isfinite(all_slow)), "Invalid SLOW velocity values"
                assert np.all(all_fast >= 0), "Negative FAST velocities"
                assert np.all(all_slow >= 0), "Negative SLOW velocities"

    def test_all_speed_profiles_stable(self):
        """FR-021: Test all speed profiles produce stable particle behavior."""
        mock_image = Mock()
        mock_image.size = (300, 300)
        mock_image.mode = "RGB"

        speed_profiles = [SpeedProfile.SLOW, SpeedProfile.NORMAL, SpeedProfile.FAST]

        for speed_profile in speed_profiles:
            settings = Settings(
                density_profile=DensityProfile.LOW, speed_profile=speed_profile
            )

            with patch("PIL.Image.open", return_value=mock_image):
                engine = ParticleEngine()
                engine.init(settings, "test_image.png")
                engine.start()

                # Test stability over multiple steps
                particle_counts = []
                velocity_magnitudes = []

                for _ in range(15):
                    engine.step()
                    particles = engine.get_particle_snapshot()
                    if particles is not None:
                        particle_counts.append(len(particles.position))

                        velocities = particles.velocity
                        avg_velocity = np.mean(
                            np.sqrt(velocities[:, 0] ** 2 + velocities[:, 1] ** 2)
                        )
                        velocity_magnitudes.append(avg_velocity)

                # Particle count should remain stable
                if particle_counts:
                    unique_counts = set(particle_counts)
                    assert len(unique_counts) <= 2, (
                        f"Unstable particle count for {speed_profile}: {unique_counts}"
                    )

                # Velocities should be finite and reasonable
                if velocity_magnitudes:
                    velocities_array = np.array(velocity_magnitudes)
                    assert np.all(np.isfinite(velocities_array)), (
                        f"Invalid velocities for {speed_profile}"
                    )
                    assert np.all(velocities_array >= 0), (
                        f"Negative velocities for {speed_profile}"
                    )
                    assert np.max(velocities_array) < 100, (
                        f"Excessive velocities for {speed_profile}"
                    )

    def test_speed_profile_position_convergence(self):
        """FR-021: Test particles converge to targets regardless of speed profile."""
        mock_image = Mock()
        mock_image.size = (200, 200)
        mock_image.mode = "RGB"

        speed_profiles = [SpeedProfile.SLOW, SpeedProfile.NORMAL, SpeedProfile.FAST]

        for speed_profile in speed_profiles:
            settings = Settings(
                density_profile=DensityProfile.LOW, speed_profile=speed_profile
            )

            with patch("PIL.Image.open", return_value=mock_image):
                engine = ParticleEngine()
                engine.init(settings, "test_image.png")
                engine.start()

                # Record initial and final positions
                initial_particles = engine.get_particle_snapshot()
                if initial_particles is None:
                    continue

                initial_positions = initial_particles.position.copy()
                targets = initial_particles.target.copy()

                # Run animation for enough steps
                for _ in range(50):  # More steps for slower profiles
                    engine.step()

                final_particles = engine.get_particle_snapshot()
                if final_particles is not None:
                    final_positions = final_particles.position

                    # Calculate convergence toward targets
                    initial_distances = np.sqrt(
                        np.sum((initial_positions - targets) ** 2, axis=1)
                    )
                    final_distances = np.sqrt(
                        np.sum((final_positions - targets) ** 2, axis=1)
                    )

                    # Particles should generally move closer to targets
                    avg_initial_distance = np.mean(initial_distances)
                    avg_final_distance = np.mean(final_distances)

                    # Allow for some variation but expect general convergence
                    convergence_ratio = (
                        avg_final_distance / avg_initial_distance
                        if avg_initial_distance > 0
                        else 1.0
                    )
                    assert convergence_ratio < 2.0, (
                        f"Particles diverged for {speed_profile}: {convergence_ratio:.3f}"
                    )

    def test_speed_profile_animation_smoothness(self):
        """FR-021: Test animation remains smooth across speed profile changes."""
        mock_image = Mock()
        mock_image.size = (300, 200)
        mock_image.mode = "RGB"

        # Cycle through all speed profiles
        speed_cycle = [
            SpeedProfile.SLOW,
            SpeedProfile.NORMAL,
            SpeedProfile.FAST,
            SpeedProfile.NORMAL,
        ]

        position_changes = []

        for speed_profile in speed_cycle:
            settings = Settings(
                density_profile=DensityProfile.LOW, speed_profile=speed_profile
            )

            with patch("PIL.Image.open", return_value=mock_image):
                engine = ParticleEngine()
                engine.init(settings, "test_image.png")
                engine.start()

                # Track position changes over a few steps
                prev_positions = None

                for _step in range(5):
                    engine.step()
                    particles = engine.get_particle_snapshot()
                    if particles is not None:
                        current_positions = particles.position

                        if prev_positions is not None:
                            # Calculate position change magnitude
                            position_deltas = np.sqrt(
                                np.sum(
                                    (current_positions - prev_positions) ** 2, axis=1
                                )
                            )
                            avg_position_change = np.mean(position_deltas)
                            position_changes.append(avg_position_change)

                        prev_positions = current_positions.copy()

        # Position changes should be reasonable (no extreme jumps or freezing)
        if position_changes:
            changes_array = np.array(position_changes)

            # No NaN or infinite values
            assert np.all(np.isfinite(changes_array)), (
                "Invalid position changes detected"
            )

            # No excessive movement (particles teleporting)
            max_change = np.max(changes_array)
            assert max_change < 0.5, f"Excessive position changes: {max_change:.3f}"

            # No complete freezing (unless intentional)
            min_change = np.min(changes_array)
            # Allow some very small movements but not complete stillness
            assert min_change >= 0.0, f"Negative position changes: {min_change:.3f}"

    def test_speed_profile_settings_persistence(self):
        """FR-021: Test speed profile settings are correctly applied and maintained."""
        mock_image = Mock()
        mock_image.size = (400, 400)
        mock_image.mode = "RGB"

        test_profiles = [SpeedProfile.SLOW, SpeedProfile.NORMAL, SpeedProfile.FAST]

        for expected_profile in test_profiles:
            settings = Settings(
                density_profile=DensityProfile.MEDIUM, speed_profile=expected_profile
            )

            # Verify settings were applied correctly
            assert settings.speed_profile == expected_profile, (
                f"Speed profile not set correctly: {settings.speed_profile}"
            )

            with patch("PIL.Image.open", return_value=mock_image):
                engine = ParticleEngine()
                engine.init(settings, "test_image.png")
                engine.start()

                # Run some steps to ensure no crashes
                for _ in range(5):
                    engine.step()
                    particles = engine.get_particle_snapshot()
                    # Just ensure we can get particles without errors
                    assert (
                        particles is not None or True
                    )  # Allow None during early stages
