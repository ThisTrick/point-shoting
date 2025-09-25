"""
Start latency integration test.
Tests that the system can start animation within ≤2s from init to first burst.
"""

import pytest
import time
from pathlib import Path
from PIL import Image

from src.point_shoting.services.particle_engine import ParticleEngine
from src.point_shoting.models.settings import Settings, DensityProfile, SpeedProfile, ColorMode
from src.point_shoting.models.stage import Stage


@pytest.mark.integration
class TestStartLatency:
    """Test animation start latency requirements"""
    
    def test_start_latency_medium_density(self, tmp_path):
        """Test that medium density starts within 2 seconds"""
        # Create test image
        test_image = Image.new('RGB', (200, 200), color='purple')
        image_path = tmp_path / "test_image.png"
        test_image.save(image_path)
        
        # Medium density settings
        settings = Settings(
            density_profile=DensityProfile.MEDIUM,
            speed_profile=SpeedProfile.NORMAL,
            color_mode=ColorMode.STYLIZED,
            hud_enabled=False,
            locale='en'
        )
        
        # Time the initialization and start process
        init_start = time.perf_counter()
        
        engine = ParticleEngine()
        engine.init(settings, str(image_path))
        
        init_end = time.perf_counter()
        init_duration = init_end - init_start
        
        # Start the engine
        start_time = time.perf_counter()
        engine.start()
        
        # Wait until we reach BURST stage (first meaningful stage)
        burst_reached = False
        timeout = 3.0  # Give a bit more time than requirement for safety
        
        while time.perf_counter() - start_time < timeout:
            engine.step()
            current_stage = engine.get_current_stage()
            
            if current_stage == Stage.BURST:
                burst_reached = True
                break
            
            time.sleep(0.01)  # Small step delay
        
        burst_time = time.perf_counter()
        total_start_latency = burst_time - init_start
        
        # Clean up
        engine.stop()
        
        # Assertions
        assert burst_reached, \
            f"Failed to reach BURST stage within {timeout}s timeout"
        
        assert total_start_latency <= 2.0, \
            f"Start latency exceeded 2s requirement: {total_start_latency:.3f}s"
        
        # Also check that init alone is reasonably fast
        assert init_duration <= 1.5, \
            f"Initialization too slow: {init_duration:.3f}s"
    
    def test_start_latency_high_density(self, tmp_path):
        """Test that high density starts within reasonable time"""
        # Create test image
        test_image = Image.new('RGB', (300, 300), color='orange')
        image_path = tmp_path / "test_image.png"
        test_image.save(image_path)
        
        # High density settings (more particles = potentially slower)
        settings = Settings(
            density_profile=DensityProfile.HIGH,
            speed_profile=SpeedProfile.NORMAL,
            color_mode=ColorMode.PRECISE,  # More complex color mode
            hud_enabled=False,
            locale='en'
        )
        
        # Time the process
        start_time = time.perf_counter()
        
        engine = ParticleEngine()
        engine.init(settings, str(image_path))
        engine.start()
        
        # Wait for BURST stage
        burst_reached = False
        timeout = 4.0  # Allow more time for high density
        
        while time.perf_counter() - start_time < timeout:
            engine.step()
            current_stage = engine.get_current_stage()
            
            if current_stage == Stage.BURST:
                burst_reached = True
                break
            
            time.sleep(0.01)
        
        burst_time = time.perf_counter()
        total_latency = burst_time - start_time
        
        # Clean up
        engine.stop()
        
        # High density gets more lenient requirement (3s)
        assert burst_reached, \
            f"Failed to reach BURST stage within {timeout}s timeout"
        
        assert total_latency <= 3.0, \
            f"High density start latency excessive: {total_latency:.3f}s"
    
    def test_start_latency_with_large_image(self, tmp_path):
        """Test start latency with larger image (but within limits)"""
        # Create larger test image (but not too large)
        test_image = Image.new('RGB', (800, 600), color='cyan')
        image_path = tmp_path / "large_test_image.png"
        test_image.save(image_path)
        
        settings = Settings(
            density_profile=DensityProfile.MEDIUM,
            speed_profile=SpeedProfile.NORMAL,
            color_mode=ColorMode.STYLIZED,
            hud_enabled=False,
            locale='en'
        )
        
        # Time the process
        start_time = time.perf_counter()
        
        engine = ParticleEngine()
        engine.init(settings, str(image_path))
        engine.start()
        
        # Wait for BURST stage
        burst_reached = False
        timeout = 3.0
        
        while time.perf_counter() - start_time < timeout:
            engine.step()
            current_stage = engine.get_current_stage()
            
            if current_stage == Stage.BURST:
                burst_reached = True
                break
            
            time.sleep(0.01)
        
        burst_time = time.perf_counter()
        total_latency = burst_time - start_time
        
        # Clean up
        engine.stop()
        
        assert burst_reached, \
            f"Failed to reach BURST stage with large image within {timeout}s"
        
        # Larger images may take slightly longer but should stay reasonable
        assert total_latency <= 2.5, \
            f"Large image start latency excessive: {total_latency:.3f}s"
    
    def test_start_latency_with_hud_enabled(self, tmp_path):
        """Test that HUD doesn't significantly impact start latency"""
        # Create test image
        test_image = Image.new('RGB', (150, 150), color='yellow')
        image_path = tmp_path / "test_image.png"
        test_image.save(image_path)
        
        settings = Settings(
            density_profile=DensityProfile.MEDIUM,
            speed_profile=SpeedProfile.NORMAL,
            color_mode=ColorMode.STYLIZED,
            hud_enabled=True,  # Enable HUD
            locale='en'
        )
        
        # Time the process
        start_time = time.perf_counter()
        
        engine = ParticleEngine()
        engine.init(settings, str(image_path))
        engine.start()
        
        # Wait for BURST stage
        burst_reached = False
        timeout = 2.5
        
        while time.perf_counter() - start_time < timeout:
            engine.step()
            current_stage = engine.get_current_stage()
            
            if current_stage == Stage.BURST:
                burst_reached = True
                break
            
            time.sleep(0.01)
        
        burst_time = time.perf_counter()
        total_latency = burst_time - start_time
        
        # Clean up
        engine.stop()
        
        assert burst_reached, \
            f"Failed to reach BURST stage with HUD within {timeout}s"
        
        # HUD should not significantly impact start time
        assert total_latency <= 2.2, \
            f"HUD significantly impacted start latency: {total_latency:.3f}s"
