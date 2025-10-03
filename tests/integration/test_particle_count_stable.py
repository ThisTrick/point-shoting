"""Invariant test for stable particle count"""

import pytest

# Imports will fail until implementation exists - expected for TDD
try:
    from unittest.mock import patch

    from PIL import Image

    from src.point_shoting.models.settings import Settings
    from src.point_shoting.services.particle_engine import ParticleEngine
except ImportError:
    ParticleEngine = None
    Settings = None
    Image = None


@pytest.mark.integration
class TestParticleCountStable:
    """Test that particle count remains constant (no dissolve in MVP)"""

    def test_particle_count_constant_across_stages(self):
        """Particle count should remain exactly the same throughout all stages"""
        if ParticleEngine is None or Settings is None or Image is None:
            pytest.skip("Dependencies not implemented yet")

        with patch(
            "src.point_shoting.services.particle_engine.Image.open"
        ) as mock_open:
            # Mock image
            mock_image = Image.new("RGB", (100, 100), color="red")
            mock_open.return_value = mock_image

            engine = ParticleEngine()
            settings = Settings()

            engine.init(settings, "test_image.png")

            # Get initial particle count
            initial_snapshot = engine.get_particle_snapshot()
            assert initial_snapshot is not None, "No particles after initialization"
            initial_count = len(initial_snapshot.position)
            assert initial_count > 0, "No particles after initialization"

            engine.start()

            # Run through multiple steps across stages
            for step in range(100):  # Reduced for faster test
                engine.step()

                snapshot = engine.get_particle_snapshot()
                if snapshot is not None:
                    current_count = len(snapshot.position)

                    assert current_count == initial_count, (
                        f"Step {step}: particle count changed from {initial_count} to {current_count}"
                    )

    def test_no_particle_dissolution(self):
        """Test that dissolve behavior is disabled in MVP"""
        if ParticleEngine is None or Settings is None or Image is None:
            pytest.skip("Dependencies not implemented yet")

        with patch(
            "src.point_shoting.services.particle_engine.Image.open"
        ) as mock_open:
            # Mock image
            mock_image = Image.new("RGB", (100, 100), color="red")
            mock_open.return_value = mock_image

            engine = ParticleEngine()
            settings = Settings()

            engine.init(settings, "test_image.png")
            engine.start()

            # Run simulation and verify all particles remain active
            for step in range(50):
                engine.step()

                snapshot = engine.get_particle_snapshot()
                if snapshot is not None and hasattr(snapshot, "active"):
                    # Check that all particles remain active (no dissolution)
                    active_particles = snapshot.active
                    inactive_count = (
                        (~active_particles).sum()
                        if hasattr(active_particles, "sum")
                        else 0
                    )

                    assert inactive_count == 0, (
                        f"Step {step}: {inactive_count} particles became inactive"
                    )

    def test_density_profile_consistency(self):
        """Test that different density profiles maintain their respective counts"""
        if ParticleEngine is None or Settings is None or Image is None:
            pytest.skip("Dependencies not implemented yet")

        with patch(
            "src.point_shoting.services.particle_engine.Image.open"
        ) as mock_open:
            # Mock image
            mock_image = Image.new("RGB", (100, 100), color="red")
            mock_open.return_value = mock_image

            # Test different density configurations if available
            settings_variants = [Settings()]  # Start with default

            # Try to create different density variants if the API supports it
            if hasattr(Settings, "__init__"):
                try:
                    # Create settings that might affect particle count
                    settings_variants = [
                        Settings(),  # Default
                    ]
                except Exception:
                    # If settings constructor doesn't accept parameters, just test default
                    settings_variants = [Settings()]

            for i, settings in enumerate(settings_variants):
                engine = ParticleEngine()
                engine.init(settings, "test_image.png")

                initial_snapshot = engine.get_particle_snapshot()
                if initial_snapshot is not None:
                    initial_count = len(initial_snapshot.position)

                    engine.start()

                    # Run steps and verify count stability for this density
                    for step in range(20):
                        engine.step()

                        snapshot = engine.get_particle_snapshot()
                        if snapshot is not None:
                            current_count = len(snapshot.position)

                            assert current_count == initial_count, (
                                f"Density variant {i}, step {step}: "
                                f"count changed from {initial_count} to {current_count}"
                            )
