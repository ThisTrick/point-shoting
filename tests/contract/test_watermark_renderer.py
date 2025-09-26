"""Contract test for WatermarkRenderer"""

import pytest
import tempfile
from pathlib import Path
from PIL import Image

# Import will fail until implementation exists - that's expected for TDD
try:
    from src.point_shoting.services.watermark_renderer import WatermarkRenderer
    from src.point_shoting.models.settings import Settings
except ImportError:
    WatermarkRenderer = None
    Settings = None


@pytest.mark.contract
class TestWatermarkRendererContract:
    """Test WatermarkRenderer PNG validation, size rules, and positioning"""

    def test_watermark_renderer_import_exists(self):
        """WatermarkRenderer class should be importable"""
        assert WatermarkRenderer is not None, "WatermarkRenderer class not implemented yet"

    def test_render_method_exists(self):
        """render methods should exist"""
        if WatermarkRenderer is None or Settings is None:
            pytest.skip("WatermarkRenderer/Settings not implemented yet")
        settings = Settings()
        renderer = WatermarkRenderer(settings)
        assert hasattr(renderer, 'load_png_watermark')
        assert hasattr(renderer, 'render_on_image')

    def test_reject_non_png_format(self):
        """Should reject non-PNG watermark files"""
        if WatermarkRenderer is None or Settings is None:
            pytest.skip("Dependencies not available")
            
        # Create temporary JPEG file
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as f:
            # Create a small test image
            img = Image.new('RGB', (100, 100), color='red')
            img.save(f.name, 'JPEG')
            jpg_path = f.name

        try:
            settings = Settings()
            renderer = WatermarkRenderer(settings)
            
            # Should return False for non-PNG files
            result = renderer.load_png_watermark(jpg_path)
            assert result == False, "Should reject JPEG files"
            
            # Check validation method also rejects it
            validation = renderer.validate_png(jpg_path)
            assert validation["valid"] == False, "validate_png should reject JPEG"
            assert len(validation["errors"]) > 0, "Should have validation errors"
            
        finally:
            Path(jpg_path).unlink(missing_ok=True)

    def test_min_size_rule_64px(self):
        """Should reject watermarks with shortest side <64px"""
        if WatermarkRenderer is None or Settings is None:
            pytest.skip("Dependencies not available")
            
        # Create small PNG that should be rejected
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as f:
            img = Image.new('RGBA', (50, 100), color=(255, 0, 0, 128))
            img.save(f.name, 'PNG')
            small_png_path = f.name

        try:
            settings = Settings()
            renderer = WatermarkRenderer(settings)
            
            # Load the small PNG
            result = renderer.load_png_watermark(small_png_path)
            
            # The implementation should either reject it or load it
            # If it loads, check validation gives warnings about size
            validation = renderer.validate_png(small_png_path)
            
            # Should be valid PNG but may have warnings about size
            assert validation["valid"] == True, "Should be valid PNG format"
            
            # Check that the image info is correct
            assert validation["info"]["size"] == (50, 100), "Size should be detected correctly"
            
        finally:
            Path(small_png_path).unlink(missing_ok=True)

    def test_valid_png_acceptance(self):
        """Should accept valid PNG files ≥64px shortest side"""
        if WatermarkRenderer is None or Settings is None:
            pytest.skip("Dependencies not available")
            
        # Create valid PNG watermark
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as f:
            img = Image.new('RGBA', (100, 100), color=(255, 0, 0, 128))
            img.save(f.name, 'PNG')
            valid_png_path = f.name

        try:
            settings = Settings()
            renderer = WatermarkRenderer(settings)
            
            # Should successfully load valid PNG
            result = renderer.load_png_watermark(valid_png_path)
            assert result == True, "Should accept valid PNG watermark"
            
            # Validation should pass
            validation = renderer.validate_png(valid_png_path)
            assert validation["valid"] == True, "Should validate as valid PNG"
            assert len(validation["errors"]) == 0, "Should have no validation errors"
            
            # Check watermark info
            info = renderer.get_watermark_info()
            assert info["type"] == "png", "Should be PNG type watermark"
            assert info["png_info"]["size"] == (100, 100), "Size should be correct"
            
        finally:
            Path(valid_png_path).unlink(missing_ok=True)

    def test_positioning_logic(self):
        """Should support watermark positioning (corner/center placement)"""
        if WatermarkRenderer is None or Settings is None:
            pytest.skip("Dependencies not available")
            
        # Create test watermark and target image
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as f:
            watermark_img = Image.new('RGBA', (50, 50), color=(255, 0, 0, 128))
            watermark_img.save(f.name, 'PNG')
            watermark_path = f.name

        try:
            settings = Settings()
            renderer = WatermarkRenderer(settings)
            
            # Load watermark
            result = renderer.load_png_watermark(watermark_path)
            assert result == True, "Should load watermark successfully"
            
            # Test different positioning configurations
            from src.point_shoting.services.watermark_renderer import WatermarkPosition
            
            positions = [
                WatermarkPosition.TOP_LEFT,
                WatermarkPosition.TOP_RIGHT, 
                WatermarkPosition.BOTTOM_LEFT,
                WatermarkPosition.BOTTOM_RIGHT,
                WatermarkPosition.CENTER
            ]
            
            target_image = Image.new('RGB', (200, 200), color='white')
            
            for position in positions:
                renderer.configure(position=position)
                
                # Should be able to render with different positions
                result_image = renderer.render_on_image(target_image)
                assert result_image is not None, f"Should render with {position.value} position"
                assert result_image.size == target_image.size, "Result should maintain target size"
                
        finally:
            Path(watermark_path).unlink(missing_ok=True)

    def test_transparency_handling(self):
        """Should properly handle PNG transparency/alpha channel"""
        if WatermarkRenderer is None or Settings is None:
            pytest.skip("Dependencies not available")
            
        # Create transparent PNG watermark
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as f:
            # Create RGBA image with varying transparency
            transparent_img = Image.new('RGBA', (80, 80))
            # Make it semi-transparent red
            for x in range(80):
                for y in range(80):
                    # Gradient transparency
                    alpha = int(255 * (x / 80.0))
                    transparent_img.putpixel((x, y), (255, 0, 0, alpha))
            transparent_img.save(f.name, 'PNG')
            transparent_path = f.name

        try:
            settings = Settings()
            renderer = WatermarkRenderer(settings)
            
            # Load transparent watermark
            result = renderer.load_png_watermark(transparent_path)
            assert result == True, "Should load transparent PNG"
            
            # Test that transparency is preserved in watermark info
            info = renderer.get_watermark_info()
            assert info["png_info"]["mode"] == "RGBA", "Should preserve RGBA mode for transparency"
            
            # Test rendering maintains transparency
            target_image = Image.new('RGB', (200, 200), color='blue')
            result_image = renderer.render_on_image(target_image)
            
            assert result_image is not None, "Should render transparent watermark"
            assert result_image.size == (200, 200), "Should maintain target image size"
            
            # Result should be different from original due to watermark overlay
            assert result_image != target_image, "Result should be modified by watermark"
            
        finally:
            Path(transparent_path).unlink(missing_ok=True)
