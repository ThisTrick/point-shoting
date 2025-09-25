"""Unit tests for WatermarkRenderer validation rules"""

import pytest
import tempfile
import os
from pathlib import Path
from unittest.mock import patch, MagicMock
from src.point_shoting.services.watermark_renderer import (
    WatermarkRenderer, 
    WatermarkPosition, 
    WatermarkConfig
)

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False


@pytest.mark.skipif(not PIL_AVAILABLE, reason="PIL/Pillow not available")
class TestWatermarkValidationRules:
    """Test watermark validation rules with PIL available"""
    
    def test_png_format_validation_success(self):
        """Test successful PNG format validation"""
        renderer = WatermarkRenderer()
        
        # Create a temporary PNG file
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
            # Create a simple RGBA image
            test_image = Image.new('RGBA', (100, 50), (255, 0, 0, 128))
            test_image.save(tmp.name, 'PNG')
            tmp_path = tmp.name
        
        try:
            # Test validation
            validation_result = renderer.validate_png(tmp_path)
            
            assert validation_result["valid"] is True, "PNG validation should succeed"
            assert len(validation_result["errors"]) == 0, "Should have no errors"
            assert validation_result["info"]["format"] == "PNG", "Should detect PNG format"
            assert validation_result["info"]["size"] == (100, 50), "Should detect correct size"
            assert validation_result["info"]["mode"] == "RGBA", "Should detect RGBA mode"
            
        finally:
            os.unlink(tmp_path)
    
    def test_png_format_validation_non_png_file(self):
        """Test PNG validation fails for non-PNG files"""
        renderer = WatermarkRenderer()
        
        # Create a temporary JPEG file
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp:
            test_image = Image.new('RGB', (50, 50), (0, 255, 0))
            test_image.save(tmp.name, 'JPEG')
            tmp_path = tmp.name
        
        try:
            validation_result = renderer.validate_png(tmp_path)
            
            assert validation_result["valid"] is False, "JPEG validation should fail"
            assert any("Format is JPEG" in error for error in validation_result["errors"]), \
                "Should detect JPEG format error"
            assert any(".jpg" in warning for warning in validation_result["warnings"]), \
                "Should warn about extension"
            
        finally:
            os.unlink(tmp_path)
    
    def test_png_format_validation_missing_file(self):
        """Test PNG validation fails for missing files"""
        renderer = WatermarkRenderer()
        
        non_existent_path = "/tmp/non_existent_file.png"
        validation_result = renderer.validate_png(non_existent_path)
        
        assert validation_result["valid"] is False, "Missing file validation should fail"
        assert any("File not found" in error for error in validation_result["errors"]), \
            "Should detect missing file error"
    
    def test_png_size_constraints_zero_dimensions(self):
        """Test PNG validation fails for zero-dimension images"""
        renderer = WatermarkRenderer()
        
        # Create a temporary PNG with zero dimensions (if possible)
        # We'll simulate this by mocking PIL behavior
        with patch('PIL.Image.open') as mock_open:
            mock_image = MagicMock()
            mock_image.format = 'PNG'
            mock_image.size = (0, 50)  # Zero width
            mock_open.return_value.__enter__.return_value = mock_image
            
            # Mock file existence
            with patch('pathlib.Path.exists', return_value=True):
                with patch('pathlib.Path.stat') as mock_stat:
                    mock_stat.return_value.st_size = 1000
                    
                    validation_result = renderer.validate_png("test.png")
                    
                    assert validation_result["valid"] is False, "Zero dimension validation should fail"
                    assert any("zero dimensions" in error for error in validation_result["errors"]), \
                        "Should detect zero dimensions error"
    
    def test_png_file_size_warning(self):
        """Test PNG validation warns about large file sizes"""
        renderer = WatermarkRenderer()
        
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
            # Create a test PNG
            test_image = Image.new('RGBA', (100, 100), (0, 0, 255, 255))
            test_image.save(tmp.name, 'PNG')
            tmp_path = tmp.name
        
        try:
            # Mock large file size
            with patch('pathlib.Path.stat') as mock_stat:
                mock_stat.return_value.st_size = 15 * 1024 * 1024  # 15MB
                
                validation_result = renderer.validate_png(tmp_path)
                
                assert validation_result["valid"] is True, "Large file should still be valid"
                assert any("Large file size" in warning for warning in validation_result["warnings"]), \
                    "Should warn about large file size"
                
        finally:
            os.unlink(tmp_path)
    
    def test_png_transparency_mode_warnings(self):
        """Test PNG validation warns about modes without transparency"""
        renderer = WatermarkRenderer()
        
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
            # Create RGB PNG (no transparency)
            test_image = Image.new('RGB', (50, 50), (255, 255, 0))
            test_image.save(tmp.name, 'PNG')
            tmp_path = tmp.name
        
        try:
            validation_result = renderer.validate_png(tmp_path)
            
            assert validation_result["valid"] is True, "RGB PNG should be valid"
            assert validation_result["info"]["mode"] == "RGB", "Should detect RGB mode"
            assert any("may not support transparency" in warning for warning in validation_result["warnings"]), \
                "Should warn about transparency support"
                
        finally:
            os.unlink(tmp_path)
    
    def test_load_png_watermark_success(self):
        """Test successful PNG watermark loading"""
        renderer = WatermarkRenderer()
        
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
            test_image = Image.new('RGBA', (80, 40), (255, 0, 255, 200))
            test_image.save(tmp.name, 'PNG')
            tmp_path = tmp.name
        
        try:
            success = renderer.load_png_watermark(tmp_path)
            
            assert success is True, "PNG loading should succeed"
            assert renderer.has_watermark() is True, "Should have watermark after loading"
            
            info = renderer.get_watermark_info()
            assert info["type"] == "png", "Should be PNG type"
            assert info["png_info"]["size"] == (80, 40), "Should preserve size"
            assert info["png_info"]["mode"] == "RGBA", "Should be RGBA mode"
            
        finally:
            os.unlink(tmp_path)
    
    def test_load_png_watermark_invalid_extension(self):
        """Test PNG loading fails for invalid extensions"""
        renderer = WatermarkRenderer()
        
        with tempfile.NamedTemporaryFile(suffix='.txt', delete=False) as tmp:
            tmp.write(b"not an image")
            tmp_path = tmp.name
        
        try:
            success = renderer.load_png_watermark(tmp_path)
            
            assert success is False, "Should fail for non-PNG extension"
            assert renderer.has_watermark() is False, "Should not have watermark"
            assert len(renderer._validation_errors) > 0, "Should have validation errors"
            assert any("not a PNG" in error for error in renderer._validation_errors), \
                "Should have extension error"
                
        finally:
            os.unlink(tmp_path)
    
    def test_text_watermark_validation_empty_text(self):
        """Test text watermark validation fails for empty text"""
        renderer = WatermarkRenderer()
        
        # Test empty string
        success = renderer.set_text_watermark("")
        assert success is False, "Should fail for empty text"
        
        # Test whitespace only
        success = renderer.set_text_watermark("   ")
        assert success is False, "Should fail for whitespace-only text"
        
        # Test valid text
        success = renderer.set_text_watermark("Valid Text")
        assert success is True, "Should succeed for valid text"
        assert renderer.has_watermark() is True, "Should have watermark"
    
    def test_watermark_config_parameter_clamping(self):
        """Test watermark configuration parameter clamping"""
        renderer = WatermarkRenderer()
        
        # Test opacity clamping
        renderer.configure(opacity=-0.5)  # Below 0
        assert renderer._config.opacity == 0.0, "Opacity should be clamped to 0"
        
        renderer.configure(opacity=1.5)  # Above 1
        assert renderer._config.opacity == 1.0, "Opacity should be clamped to 1"
        
        renderer.configure(opacity=0.5)  # Valid
        assert renderer._config.opacity == 0.5, "Opacity should remain valid value"
        
        # Test scale clamping
        renderer.configure(scale=0.05)  # Below minimum
        assert renderer._config.scale == 0.1, "Scale should be clamped to minimum"
        
        renderer.configure(scale=10.0)  # Above maximum
        assert renderer._config.scale == 5.0, "Scale should be clamped to maximum"
        
        # Test custom position clamping
        renderer.configure(custom_x=-0.2, custom_y=1.2)
        assert renderer._config.custom_x == 0.0, "Custom X should be clamped to 0"
        assert renderer._config.custom_y == 1.0, "Custom Y should be clamped to 1"
        
        # Test margin clamping
        renderer.configure(margin_px=-5)
        assert renderer._config.margin_px == 0, "Margin should be clamped to 0"
    
    def test_watermark_position_calculation(self):
        """Test watermark position calculations"""
        renderer = WatermarkRenderer()
        target_size = (400, 300)
        watermark_size = (80, 60)
        margin = 20
        
        renderer.configure(margin_px=margin)
        
        # Test all position types
        test_cases = [
            (WatermarkPosition.TOP_LEFT, (margin, margin)),
            (WatermarkPosition.TOP_RIGHT, (400 - 80 - margin, margin)),
            (WatermarkPosition.BOTTOM_LEFT, (margin, 300 - 60 - margin)),
            (WatermarkPosition.BOTTOM_RIGHT, (400 - 80 - margin, 300 - 60 - margin)),
            (WatermarkPosition.CENTER, (160, 120)),  # (400-80)/2, (300-60)/2
        ]
        
        for position, expected_pos in test_cases:
            renderer.configure(position=position, margin_px=margin)
            calculated_pos = renderer.preview_position(target_size, watermark_size)
            assert calculated_pos == expected_pos, \
                f"Position {position} calculated as {calculated_pos}, expected {expected_pos}"
        
        # Test custom position
        renderer.configure(
            position=WatermarkPosition.CUSTOM,
            custom_x=0.25,  # 25% from left
            custom_y=0.75   # 75% from top
        )
        expected_custom = (
            int(0.25 * (400 - 80)),  # 25% of available space
            int(0.75 * (300 - 60))   # 75% of available space
        )
        calculated_custom = renderer.preview_position(target_size, watermark_size)
        assert calculated_custom == expected_custom, \
            f"Custom position calculated as {calculated_custom}, expected {expected_custom}"
    
    def test_watermark_clear_functionality(self):
        """Test watermark clearing functionality"""
        renderer = WatermarkRenderer()
        
        # Set text watermark
        renderer.set_text_watermark("Test Text")
        assert renderer.has_watermark() is True, "Should have text watermark"
        
        # Clear watermark
        renderer.clear_watermark()
        assert renderer.has_watermark() is False, "Should not have watermark after clear"
        
        info = renderer.get_watermark_info()
        assert info["type"] is None, "Watermark type should be None after clear"
        assert len(info["validation_errors"]) == 0, "Should have no validation errors after clear"


@pytest.mark.skipif(PIL_AVAILABLE, reason="Testing behavior without PIL")
class TestWatermarkValidationWithoutPIL:
    """Test watermark validation behavior when PIL is not available"""
    
    def test_png_validation_without_pil(self):
        """Test PNG validation fails gracefully without PIL"""
        renderer = WatermarkRenderer()
        
        validation_result = renderer.validate_png("test.png")
        
        assert validation_result["valid"] is False, "Should fail without PIL"
        assert any("PIL/Pillow not available" in error for error in validation_result["errors"]), \
            "Should indicate PIL unavailable"
    
    def test_png_loading_without_pil(self):
        """Test PNG loading fails gracefully without PIL"""
        renderer = WatermarkRenderer()
        
        success = renderer.load_png_watermark("test.png")
        
        assert success is False, "Should fail without PIL"
        assert any("PIL/Pillow not available" in error for error in renderer._validation_errors), \
            "Should indicate PIL unavailable"


if __name__ == "__main__":
    pytest.main([__file__])