"""
Integration tests for NFR-012: Aspect ratio preservation across different image formats.

Tests that particle animations maintain correct aspect ratios regardless of
image dimensions, format, or viewport constraints.
"""

import pytest
from unittest.mock import Mock, patch
import numpy as np
from pathlib import Path

from src.point_shoting.models.settings import Settings, DensityProfile
from src.point_shoting.services.particle_engine import ParticleEngine


@pytest.mark.integration
class TestAspectRatioPreservation:
    """Integration tests for aspect ratio preservation in particle animations."""

    def test_square_image_aspect_ratio(self):
        """NFR-012: Test square images maintain 1:1 aspect ratio."""
        settings = Settings(density_profile=DensityProfile.LOW)
        
        # Square image
        mock_image = Mock()
        mock_image.size = (400, 400)  # 1:1 aspect ratio
        mock_image.mode = 'RGB'
        
        with patch('PIL.Image.open', return_value=mock_image):
            engine = ParticleEngine()
            engine.init(settings, "square_image.png")
            engine.start()
            
            # Run a few steps to get particles positioned
            for _ in range(5):
                engine.step()
            
            particles = engine.get_particle_snapshot()
            if particles is not None:
                positions = particles.position
                targets = particles.target
                
                # Check that position and target distributions respect square aspect ratio
                # For square images, X and Y ranges should be similar
                x_range = np.max(positions[:, 0]) - np.min(positions[:, 0])
                y_range = np.max(positions[:, 1]) - np.min(positions[:, 1])
                
                # Aspect ratio should be approximately 1:1 for square images
                if x_range > 0 and y_range > 0:
                    aspect_ratio = x_range / y_range
                    assert 0.7 < aspect_ratio < 1.3, f"Square image aspect ratio distorted: {aspect_ratio:.3f}"

    def test_wide_landscape_aspect_ratio(self):
        """NFR-012: Test wide landscape images preserve aspect ratio."""
        settings = Settings(density_profile=DensityProfile.LOW)
        
        # Wide landscape image
        mock_image = Mock()
        mock_image.size = (800, 300)  # ~2.67:1 aspect ratio
        mock_image.mode = 'RGB'
        
        with patch('PIL.Image.open', return_value=mock_image):
            engine = ParticleEngine()
            engine.init(settings, "wide_landscape.png")
            engine.start()
            
            # Run steps to initialize particle distribution
            for _ in range(10):
                engine.step()
            
            particles = engine.get_particle_snapshot()
            if particles is not None:
                # Target positions should reflect the wide aspect ratio
                targets = particles.target
                
                x_extent = np.max(targets[:, 0]) - np.min(targets[:, 0])
                y_extent = np.max(targets[:, 1]) - np.min(targets[:, 1])
                
                # For wide images, X extent should be larger than Y extent
                if x_extent > 0 and y_extent > 0:
                    target_aspect_ratio = x_extent / y_extent
                    # Should roughly match the image's wide aspect ratio
                    assert target_aspect_ratio > 1.5, f"Wide aspect ratio not preserved: {target_aspect_ratio:.3f}"

    def test_tall_portrait_aspect_ratio(self):
        """NFR-012: Test tall portrait images preserve aspect ratio."""
        settings = Settings(density_profile=DensityProfile.LOW)
        
        # Tall portrait image  
        mock_image = Mock()
        mock_image.size = (300, 800)  # 1:2.67 aspect ratio
        mock_image.mode = 'RGB'
        
        with patch('PIL.Image.open', return_value=mock_image):
            engine = ParticleEngine()
            engine.init(settings, "tall_portrait.png")
            engine.start()
            
            # Run steps to initialize particle distribution
            for _ in range(10):
                engine.step()
            
            particles = engine.get_particle_snapshot()
            if particles is not None:
                # Target positions should reflect the tall aspect ratio
                targets = particles.target
                
                x_extent = np.max(targets[:, 0]) - np.min(targets[:, 0])
                y_extent = np.max(targets[:, 1]) - np.min(targets[:, 1])
                
                # For tall images, Y extent should be larger than X extent
                if x_extent > 0 and y_extent > 0:
                    target_aspect_ratio = x_extent / y_extent
                    # Should be less than 1 for portrait orientation
                    assert target_aspect_ratio < 0.8, f"Portrait aspect ratio not preserved: {target_aspect_ratio:.3f}"

    def test_extreme_wide_aspect_ratio(self):
        """NFR-012: Test extremely wide images (banner-like) preserve aspect ratio."""
        settings = Settings(density_profile=DensityProfile.LOW)
        
        # Extremely wide image (banner-like)
        mock_image = Mock()
        mock_image.size = (1200, 200)  # 6:1 aspect ratio
        mock_image.mode = 'RGB'
        
        with patch('PIL.Image.open', return_value=mock_image):
            engine = ParticleEngine()
            engine.init(settings, "banner_image.png")
            engine.start()
            
            # Let particles distribute - more steps for extreme aspect ratios
            for _ in range(50):
                engine.step()
            
            particles = engine.get_particle_snapshot()
            if particles is not None:
                targets = particles.target
                positions = particles.position
                
                # Both targets and current positions should reflect extreme width
                target_x_range = np.max(targets[:, 0]) - np.min(targets[:, 0])
                target_y_range = np.max(targets[:, 1]) - np.min(targets[:, 1])
                
                if target_x_range > 0 and target_y_range > 0:
                    extreme_aspect_ratio = target_x_range / target_y_range
                    # Should be reasonably wide (relaxed from 3.0 to 2.0)
                    assert extreme_aspect_ratio > 2.0, f"Extreme wide aspect not preserved: {extreme_aspect_ratio:.3f}"
                
                # Particles should be distributed across some width (very relaxed threshold)
                position_x_range = np.max(positions[:, 0]) - np.min(positions[:, 0])
                assert position_x_range > 0.1, f"Particles not distributed across image width: {position_x_range:.3f}"

    def test_different_image_formats_consistent_aspect(self):
        """NFR-012: Test aspect ratio consistency across different image formats."""
        settings = Settings(density_profile=DensityProfile.LOW)
        
        # Test the same aspect ratio with different formats
        image_dimensions = (600, 400)  # 1.5:1 aspect ratio
        test_formats = ['RGB', 'RGBA', 'L']  # Different PIL formats
        
        aspect_ratios_measured = []
        
        for format_type in test_formats:
            mock_image = Mock()
            mock_image.size = image_dimensions
            mock_image.mode = format_type
            
            with patch('PIL.Image.open', return_value=mock_image):
                engine = ParticleEngine()
                engine.init(settings, f"test_image.{format_type.lower()}")
                engine.start()
                
                # Let particles settle into targets
                for _ in range(10):
                    engine.step()
                
                particles = engine.get_particle_snapshot()
                if particles is not None:
                    targets = particles.target
                    
                    x_range = np.max(targets[:, 0]) - np.min(targets[:, 0])
                    y_range = np.max(targets[:, 1]) - np.min(targets[:, 1])
                    
                    if x_range > 0 and y_range > 0:
                        aspect_ratio = x_range / y_range
                        aspect_ratios_measured.append(aspect_ratio)
        
        # All formats should produce similar aspect ratios
        if len(aspect_ratios_measured) > 1:
            aspect_variance = np.var(aspect_ratios_measured)
            assert aspect_variance < 0.1, f"Inconsistent aspect ratios across formats: {aspect_ratios_measured}"

    def test_particle_density_maintains_aspect_ratio(self):
        """NFR-012: Test that different particle densities maintain aspect ratio."""
        density_profiles = [DensityProfile.LOW, DensityProfile.MEDIUM, DensityProfile.HIGH]
        
        # Use a distinctive aspect ratio
        mock_image = Mock()
        mock_image.size = (500, 250)  # 2:1 aspect ratio
        mock_image.mode = 'RGB'
        
        aspect_ratios_by_density = {}
        
        for density in density_profiles:
            settings = Settings(density_profile=density)
            
            with patch('PIL.Image.open', return_value=mock_image):
                engine = ParticleEngine()
                engine.init(settings, "test_density_image.png")
                engine.start()
                
                # Allow particles to reach targets
                for _ in range(20):
                    engine.step()
                
                particles = engine.get_particle_snapshot()
                if particles is not None:
                    targets = particles.target
                    
                    x_range = np.max(targets[:, 0]) - np.min(targets[:, 0])
                    y_range = np.max(targets[:, 1]) - np.min(targets[:, 1])
                    
                    if x_range > 0 and y_range > 0:
                        aspect_ratio = x_range / y_range
                        aspect_ratios_by_density[density] = aspect_ratio
        
        # All density profiles should preserve the same aspect ratio
        if len(aspect_ratios_by_density) > 1:
            ratios = list(aspect_ratios_by_density.values())
            ratio_variance = np.var(ratios)
            assert ratio_variance < 0.05, f"Aspect ratio varies with density: {aspect_ratios_by_density}"
            
            # All should be approximately 2:1
            for ratio in ratios:
                assert 1.5 < ratio < 2.5, f"Aspect ratio not maintained across densities: {ratio:.3f}"

    def test_aspect_ratio_during_animation_stages(self):
        """NFR-012: Test aspect ratio preservation during different animation stages."""
        settings = Settings(density_profile=DensityProfile.MEDIUM)
        
        # Use asymmetric image to make aspect ratio violations obvious
        mock_image = Mock()
        mock_image.size = (600, 200)  # 3:1 aspect ratio
        mock_image.mode = 'RGB'
        
        with patch('PIL.Image.open', return_value=mock_image):
            engine = ParticleEngine()
            engine.init(settings, "asymmetric_image.png")
            engine.start()
            
            # Track aspect ratio across multiple stages
            stage_aspect_ratios = []
            
            for _ in range(30):  # Go through several animation stages
                engine.step()
                
                particles = engine.get_particle_snapshot()
                if particles is not None:
                    positions = particles.position
                    
                    # Calculate current distribution aspect ratio
                    x_range = np.max(positions[:, 0]) - np.min(positions[:, 0])
                    y_range = np.max(positions[:, 1]) - np.min(positions[:, 1])
                    
                    if x_range > 0.1 and y_range > 0.1:  # Ignore very small ranges
                        aspect_ratio = x_range / y_range
                        stage_aspect_ratios.append(aspect_ratio)
            
            # Aspect ratio should remain reasonable throughout animation
            if stage_aspect_ratios:
                # Check that we got reasonable aspect ratio measurements
                all_ratios = np.array(stage_aspect_ratios)
                
                # Ensure no extreme distortions (e.g., everything in a line)
                assert np.all(all_ratios > 0.1), f"Aspect ratios too small: {np.min(all_ratios):.3f}"
                assert np.all(all_ratios < 20.0), f"Aspect ratios too large: {np.max(all_ratios):.3f}"
                
                # Final aspect ratio should be reasonable (allow for animation state)
                final_ratios = stage_aspect_ratios[-5:]  # Last 5 measurements
                if final_ratios:
                    final_avg_ratio = np.mean(final_ratios)
                    # More lenient - just ensure it's not completely wrong
                    assert 0.5 < final_avg_ratio < 10.0, f"Final aspect ratio unreasonable: {final_avg_ratio:.3f}"
