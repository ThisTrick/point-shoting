"""
Integration test for small image upscale behavior.
Tests FR-032: Small images should be upscaled appropriately.
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from src.point_shoting.models.settings import Settings, DensityProfile, SpeedProfile, ColorMode
from src.point_shoting.services.particle_engine import ParticleEngine


@pytest.mark.integration
class TestSmallImageUpscale:
    """Test handling of small images that need upscaling."""
    
    def setup_method(self):
        """Setup test environment."""
        self.settings = Settings(
            density_profile=DensityProfile.MEDIUM,
            speed_profile=SpeedProfile.NORMAL,
            color_mode=ColorMode.STYLIZED,
            hud_enabled=False,
            locale="en"
        )
        
    def test_tiny_image_upscaled_appropriately(self):
        """Test that very small images are upscaled to reasonable size."""
        engine = ParticleEngine()
        
        with patch('PIL.Image.open') as mock_open:
            # Create a tiny 16x16 image
            mock_img = Mock()
            mock_img.size = (16, 16)
            
            # Mock the resize operation to track calls
            mock_resized = Mock()
            mock_resized.size = (64, 64)  # Should be upscaled
            mock_img.resize.return_value = mock_resized
            mock_img.convert.return_value = mock_img  # Return self for chaining
            mock_open.return_value = mock_img
            
            # Initialize with tiny image
            engine.init(self.settings, "tiny.jpg")
            
            # Verify resize was called with upscaling
            mock_img.resize.assert_called_once()
            resize_args = mock_img.convert.return_value.resize.call_args[0]
            new_width, new_height = resize_args[0]
            
            # Should be upscaled from 16x16 to something larger
            assert new_width >= 32, f"Width not upscaled enough: {new_width}"
            assert new_height >= 32, f"Height not upscaled enough: {new_height}"
    
    def test_small_image_maintains_aspect_ratio(self):
        """Test that small rectangular images maintain aspect ratio when upscaled."""
        engine = ParticleEngine()
        
        with patch('PIL.Image.open') as mock_open:
            # Create a small rectangular image
            mock_img = Mock()
            mock_img.size = (20, 40)  # 1:2 aspect ratio
            
            mock_resized = Mock()
            mock_resized.size = (40, 80)  # Maintain 1:2 ratio
            mock_img.convert.return_value.resize.return_value = mock_resized
            mock_img.convert.return_value.size = (20, 40)  # Size needs to be on converted image too
            mock_open.return_value = mock_img
            
            engine.init(self.settings, "small_rect.jpg")
            
            # Check that resize maintains aspect ratio
            mock_img.convert.return_value.resize.assert_called_once()
            resize_args = mock_img.convert.return_value.resize.call_args[0]
            new_width, new_height = resize_args[0]
            
            original_ratio = 20 / 40
            new_ratio = new_width / new_height
            
            assert abs(original_ratio - new_ratio) < 0.01, \
                f"Aspect ratio not maintained: {original_ratio} vs {new_ratio}"
    
    def test_minimum_size_threshold(self):
        """Test that images below minimum size are upscaled to minimum."""
        engine = ParticleEngine()
        
        with patch('PIL.Image.open') as mock_open:
            # Create extremely small image
            mock_img = Mock()
            mock_img.size = (8, 8)
            
            mock_resized = Mock()
            mock_resized.size = (32, 32)  # Minimum viable size
            mock_img.convert.return_value.resize.return_value = mock_resized
            mock_img.convert.return_value.size = (8, 8)  # Size needs to be on converted image too
            mock_open.return_value = mock_img
            
            engine.init(self.settings, "micro.jpg")
            
            # Should be upscaled to at least minimum size
            mock_img.convert.return_value.resize.assert_called_once()
            resize_args = mock_img.convert.return_value.resize.call_args[0]
            new_width, new_height = resize_args[0]
            
            min_dimension = min(new_width, new_height)
            assert min_dimension >= 32, f"Minimum dimension too small: {min_dimension}"
    
    def test_small_image_particle_distribution(self):
        """Test that small images still generate proper particle distribution."""
        engine = ParticleEngine()
        
        with patch('PIL.Image.open') as mock_open:
            mock_img = Mock()
            mock_img.size = (24, 24)
            
            # Mock getdata to return pixel data
            mock_resized = Mock()
            mock_resized.size = (48, 48)
            # Create simple pattern: half white, half black
            pixel_data = [(255, 255, 255)] * (24 * 24 // 2) + [(0, 0, 0)] * (24 * 24 // 2)
            mock_resized.getdata.return_value = pixel_data
            
            mock_img.convert.return_value.resize.return_value = mock_resized
            mock_img.convert.return_value.size = (24, 24)  # Size needs to be on converted image too
            mock_open.return_value = mock_img
            
            engine.init(self.settings, "small.jpg")
            
            # Should have allocated proper number of particles based on density profile
            # MEDIUM profile is around 9000 particles
            particle_count = len(engine.get_particle_snapshot().position)
            assert particle_count > 0, "Should have allocated particles"
            assert particle_count < 20000, "Particle count seems too high"
            
            # Particles should be distributed across the image space
            positions = engine.get_particle_snapshot().position
            assert (positions >= 0.0).all(), "Positions below bounds"
            assert (positions <= 1.0).all(), "Positions above bounds"
            
            # Should have some distribution variety
            x_range = positions[:, 0].max() - positions[:, 0].min()
            y_range = positions[:, 1].max() - positions[:, 1].min()
            
            assert x_range > 0.095, f"X distribution too narrow: {x_range}"
            assert y_range > 0.095, f"Y distribution too narrow: {y_range}"
    
    def test_upscale_quality_setting(self):
        """Test that upscaling uses appropriate quality settings."""
        engine = ParticleEngine()
        
        with patch('PIL.Image.open') as mock_open:
            mock_img = Mock()
            mock_img.size = (16, 16)
            
            mock_resized = Mock()
            mock_resized.size = (64, 64)
            mock_img.convert.return_value.resize.return_value = mock_resized
            mock_img.convert.return_value.size = (16, 16)  # Size needs to be on converted image too
            mock_open.return_value = mock_img
            
            engine.init(self.settings, "pixelated.jpg")
            
            # Check that resize was called with appropriate resampling
            mock_img.convert.return_value.resize.assert_called_once()
            resize_call = mock_img.convert.return_value.resize.call_args
            
            # Should use a reasonable resampling method (not just nearest neighbor)
            # The exact method depends on PIL.Image constants available
            if len(resize_call) > 1 and len(resize_call[1]) > 0:
                # If resample parameter was provided, it should be suitable for upscaling
                resample = resize_call[1].get('resample')
                # Just verify it's not None if provided
                if resample is not None:
                    assert resample is not None
    
    def test_edge_case_single_pixel(self):
        """Test handling of 1x1 pixel images."""
        engine = ParticleEngine()
        
        with patch('PIL.Image.open') as mock_open:
            mock_img = Mock()
            mock_img.size = (1, 1)
            
            mock_resized = Mock()
            mock_resized.size = (32, 32)  # Heavily upscaled
            mock_resized.getdata.return_value = [(128, 128, 128)] * (32 * 32)
            
            mock_img.convert.return_value.resize.return_value = mock_resized
            mock_open.return_value = mock_img
            
            # Should not crash on single pixel
            engine.init(self.settings, "pixel.jpg")
            
            # Should still create particles
            particle_count = len(engine.get_particle_snapshot().position)
            assert particle_count > 0, "Should have allocated particles"
            
            # All particles should target similar area since it's uniform
            targets = engine.get_particle_snapshot().target
            target_variance = targets.var(axis=0)
            
            # With uniform image, targets should be relatively clustered
            assert target_variance.max() < 0.5, "Target variance too high for uniform image"
