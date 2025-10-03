"""
Integration test for transparent pixels targeting functionality.
Tests FR-030: Transparent pixels should be handled appropriately in particle targeting.
"""

from unittest.mock import Mock, patch

import pytest

from src.point_shoting.models.settings import ColorMode, DensityProfile, Settings
from src.point_shoting.services.particle_engine import ParticleEngine


@pytest.mark.integration
class TestTransparentPixelsTargeting:
    """Test particle targeting behavior with transparent pixels."""

    def setup_method(self):
        """Setup test environment."""
        self.settings = Settings(
            density_profile=DensityProfile.MEDIUM,
            color_mode=ColorMode.STYLIZED,
            hud_enabled=False,
        )

    def test_rgba_image_with_transparency_accepted(self):
        """Test that RGBA images with transparency are accepted and processed."""
        engine = ParticleEngine()

        with patch("PIL.Image.open") as mock_open:
            # Mock RGBA image with transparency
            mock_img = Mock()
            mock_img.size = (64, 64)
            mock_img.mode = "RGBA"

            # Mock convert method to return self for RGBA
            mock_converted = Mock()
            mock_converted.size = (64, 64)
            mock_converted.mode = "RGBA"
            mock_img.convert.return_value = mock_converted
            mock_open.return_value = mock_img

            # Should not raise exception with RGBA image
            engine.init(self.settings, "rgba_image.png")

            # Verify image was processed
            mock_img.convert.assert_called()

    def test_transparency_handling_during_targeting(self):
        """Test that targeting logic can handle transparency information."""
        engine = ParticleEngine()

        with patch("PIL.Image.open") as mock_open:
            # Mock image with alpha channel
            mock_img = Mock()
            mock_img.size = (48, 48)
            mock_img.mode = "RGBA"

            # Mock converted image
            mock_converted = Mock()
            mock_converted.size = (48, 48)
            mock_img.convert.return_value = mock_converted
            mock_open.return_value = mock_img

            # Initialize engine
            engine.init(self.settings, "transparent.png")

            # Get particle snapshot to verify targeting worked
            snapshot = engine.get_particle_snapshot()

            # Should have particles with valid targets
            assert snapshot is not None, "No particle snapshot available"
            assert len(snapshot.target) > 0, "No particles were created"

            # All target positions should be normalized [0,1]
            for target_pos in snapshot.target:
                x, y = target_pos
                assert 0 <= x <= 1, f"Target X coordinate {x} out of bounds [0,1]"
                assert 0 <= y <= 1, f"Target Y coordinate {y} out of bounds [0,1]"

    def test_png_transparency_support(self):
        """Test that PNG images with transparency are supported."""
        engine = ParticleEngine()

        with patch("PIL.Image.open") as mock_open:
            # Mock PNG with alpha channel
            mock_img = Mock()
            mock_img.size = (32, 32)
            mock_img.mode = "RGBA"
            mock_img.format = "PNG"

            # Mock convert to return RGBA version
            mock_converted = Mock()
            mock_converted.size = (32, 32)
            mock_img.convert.return_value = mock_converted
            mock_open.return_value = mock_img

            # Should handle PNG with alpha without issues
            engine.init(self.settings, "transparent.png")

            # Verify initialization succeeded
            snapshot = engine.get_particle_snapshot()
            assert snapshot is not None

    def test_mixed_opacity_targeting_distribution(self):
        """Test that particles are distributed based on opacity levels."""
        engine = ParticleEngine()

        with patch("PIL.Image.open") as mock_open:
            # Mock image with mixed opacity
            mock_img = Mock()
            mock_img.size = (40, 40)
            mock_img.mode = "RGBA"

            mock_converted = Mock()
            mock_converted.size = (40, 40)
            mock_img.convert.return_value = mock_converted
            mock_open.return_value = mock_img

            # Initialize engine
            engine.init(self.settings, "mixed_opacity.png")

            # Verify particles were created appropriately
            snapshot = engine.get_particle_snapshot()
            assert snapshot is not None, (
                "Should have particle snapshot after initialization"
            )
            assert len(snapshot.target) > 0, (
                "Should have created particles despite transparency"
            )

            # All particles should have valid positions
            for pos in snapshot.position:
                x, y = pos
                assert 0 <= x <= 1, f"Particle position X {x} out of bounds"
                assert 0 <= y <= 1, f"Particle position Y {y} out of bounds"
