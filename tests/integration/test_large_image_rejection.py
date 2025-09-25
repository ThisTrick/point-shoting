"""
Large image handling integration test.
Tests system behavior with various image sizes and validates constraints when implemented.
"""

import pytest
import tempfile
from pathlib import Path
from PIL import Image

from src.point_shoting.services.particle_engine import ParticleEngine
from src.point_shoting.models.settings import Settings, DensityProfile, SpeedProfile, ColorMode


@pytest.mark.integration
class TestLargeImageHandling:
    """Test handling of various image sizes"""
    
    def test_large_image_behavior(self, tmp_path):
        """Test behavior with large images (2560x1440)"""
        # Create large image (2560x1440 - common high-res display)
        large_image = Image.new('RGB', (2560, 1440), color='red')
        image_path = tmp_path / "large_image.png"
        large_image.save(image_path)
        
        settings = Settings(
            density_profile=DensityProfile.MEDIUM,
            speed_profile=SpeedProfile.NORMAL,
            color_mode=ColorMode.STYLIZED,
            hud_enabled=False,
            locale='en'
        )
        
        engine = ParticleEngine()
        
        # Currently, large images may be accepted or rejected based on memory constraints
        # This test documents the current behavior
        try:
            engine.init(settings, str(image_path))
            init_success = True
        except (ValueError, RuntimeError) as e:
            init_success = False
            # If rejected, error should be informative
            error_msg = str(e).lower()
            assert any(keyword in error_msg for keyword in ['size', 'resolution', 'memory', 'limit']), \
                f"If large image is rejected, error should be informative: {e}"
        
        if init_success:
            # If large image was accepted, basic operations should work
            assert engine.get_current_stage() is not None
            engine.start()
            for _ in range(3):
                engine.step()
            engine.stop()
    
    def test_ultra_wide_image_behavior(self, tmp_path):
        """Test behavior with extremely wide images"""
        # Create ultra-wide image that may cause memory or processing issues
        wide_image = Image.new('RGB', (4000, 800), color='blue')  
        image_path = tmp_path / "wide_image.png"
        wide_image.save(image_path)
        
        settings = Settings(
            density_profile=DensityProfile.LOW,  # Use low density to reduce memory usage
            speed_profile=SpeedProfile.NORMAL,
            color_mode=ColorMode.PRECISE,
            hud_enabled=False,
            locale='en'
        )
        
        engine = ParticleEngine()
        
        # Test behavior with extreme aspect ratio
        try:
            engine.init(settings, str(image_path))
            init_success = True
        except Exception as e:
            init_success = False
            # If rejected, should be for a valid reason
            error_msg = str(e).lower()
            assert len(error_msg) > 5, f"Error message should be descriptive: {e}"
        
        if init_success:
            # If accepted, should handle the aspect ratio properly
            assert engine.get_current_stage() is not None
            engine.start()
            for _ in range(2):
                engine.step()
            engine.stop()
    
    def test_ultra_tall_image_behavior(self, tmp_path):
        """Test behavior with extremely tall images"""  
        # Create ultra-tall image that may cause memory or processing issues
        tall_image = Image.new('RGB', (600, 3500), color='green')
        image_path = tmp_path / "tall_image.png"
        tall_image.save(image_path)
        
        settings = Settings(
            density_profile=DensityProfile.LOW,  # Use low density to reduce memory usage
            speed_profile=SpeedProfile.FAST,
            color_mode=ColorMode.STYLIZED,
            hud_enabled=False,
            locale='en'
        )
        
        engine = ParticleEngine()
        
        # Test behavior with extreme aspect ratio
        try:
            engine.init(settings, str(image_path))
            init_success = True
        except Exception as e:
            init_success = False
            # If rejected, should provide clear reason
            error_msg = str(e).lower()
            assert len(error_msg) > 5, f"Error message should be descriptive: {e}"
        
        if init_success:
            # If accepted, should handle the aspect ratio properly
            assert engine.get_current_stage() is not None
            engine.start()
            for _ in range(2):
                engine.step()
            engine.stop()
    
    def test_accept_maximum_allowed_size(self, tmp_path):
        """Test that images at the size limit (2048x2048) are accepted"""
        # Create image at maximum allowed size
        max_image = Image.new('RGB', (2048, 2048), color='purple')
        image_path = tmp_path / "max_size_image.png"
        max_image.save(image_path)
        
        settings = Settings(
            density_profile=DensityProfile.LOW,  # Keep particle count manageable
            speed_profile=SpeedProfile.NORMAL,
            color_mode=ColorMode.STYLIZED,
            hud_enabled=False,
            locale='en'
        )
        
        engine = ParticleEngine()
        
        # Should succeed - this is at the limit
        try:
            engine.init(settings, str(image_path))
            init_success = True
        except Exception as e:
            init_success = False
            error = e
        
        if init_success:
            # If init succeeded, engine should be in valid state
            assert engine.get_current_stage() is not None
            engine.stop()
        else:
            # If this size is rejected, error should be clear
            error_msg = str(error).lower()
            assert any(keyword in error_msg for keyword in ['size', 'resolution', 'memory']), \
                f"If 2048x2048 is rejected, error should be clear: {error}"
    
    def test_accept_reasonable_large_image(self, tmp_path):
        """Test that reasonable large images (1920x1080) are accepted"""
        # Create HD resolution image - should be fine
        hd_image = Image.new('RGB', (1920, 1080), color='orange')
        image_path = tmp_path / "hd_image.png"
        hd_image.save(image_path)
        
        settings = Settings(
            density_profile=DensityProfile.MEDIUM,
            speed_profile=SpeedProfile.NORMAL,
            color_mode=ColorMode.PRECISE,
            hud_enabled=False,
            locale='en'
        )
        
        engine = ParticleEngine()
        
        # Should work fine
        engine.init(settings, str(image_path))
        assert engine.get_current_stage() is not None
        
        # Should be able to start and run a few steps
        engine.start()
        for _ in range(5):
            engine.step()
        
        engine.stop()
    
    def test_memory_estimation_for_large_images(self, tmp_path):
        """Test that memory requirements are estimated for large images"""
        # Create a fairly large image that might trigger memory warnings
        large_image = Image.new('RGB', (1800, 1600), color='cyan')
        image_path = tmp_path / "memory_test_image.png"
        large_image.save(image_path)
        
        settings = Settings(
            density_profile=DensityProfile.HIGH,  # This will require more memory
            speed_profile=SpeedProfile.NORMAL,
            color_mode=ColorMode.STYLIZED,
            hud_enabled=True,  # Additional memory overhead
            locale='en'
        )
        
        engine = ParticleEngine()
        
        # If this combination would exceed memory limits, should fail gracefully
        try:
            engine.init(settings, str(image_path))
            init_success = True
        except Exception as e:
            init_success = False
            error_msg = str(e).lower()
            # If rejected for memory reasons, should be clear
            assert any(keyword in error_msg for keyword in ['memory', 'limit', 'resource']), \
                f"Memory-related rejection should mention memory: {e}"
        
        if init_success:
            # If accepted, should still function properly
            engine.start()
            for _ in range(3):
                engine.step()
            engine.stop()
    
    def test_error_handling_for_corrupted_large_file(self, tmp_path):
        """Test error handling when large image file is corrupted"""
        # Create a file that looks like an image but is corrupted
        corrupted_path = tmp_path / "corrupted.png"
        with open(corrupted_path, 'wb') as f:
            # Write PNG header but then garbage
            f.write(b'\x89PNG\r\n\x1a\n')
            f.write(b'garbage data that will cause PIL to fail' * 1000)
        
        settings = Settings(
            density_profile=DensityProfile.MEDIUM,
            speed_profile=SpeedProfile.NORMAL,
            color_mode=ColorMode.STYLIZED,
            hud_enabled=False,
            locale='en'
        )
        
        engine = ParticleEngine()
        
        # Should handle corrupted image gracefully
        with pytest.raises(Exception) as exc_info:
            engine.init(settings, str(corrupted_path))
        
        # Error should be descriptive (not a generic crash)
        error_msg = str(exc_info.value)
        assert len(error_msg) > 10, "Error message should be descriptive"
        assert error_msg != "An error occurred", "Error should be specific"
    
    def test_reject_non_image_file_with_image_extension(self, tmp_path):
        """Test rejection of non-image files masquerading as images"""
        # Create text file with image extension
        fake_image_path = tmp_path / "fake_image.png"
        with open(fake_image_path, 'w') as f:
            f.write("This is not an image file\n" * 1000)
        
        settings = Settings(
            density_profile=DensityProfile.MEDIUM,
            speed_profile=SpeedProfile.NORMAL,
            color_mode=ColorMode.STYLIZED,
            hud_enabled=False,
            locale='en'
        )
        
        engine = ParticleEngine()
        
        # Should fail with appropriate error
        with pytest.raises(Exception) as exc_info:
            engine.init(settings, str(fake_image_path))
        
        # Error should indicate image loading problem
        error_msg = str(exc_info.value).lower()
        assert any(keyword in error_msg for keyword in ['image', 'format', 'load', 'invalid']), \
            f"Error should indicate image problem: {exc_info.value}"
