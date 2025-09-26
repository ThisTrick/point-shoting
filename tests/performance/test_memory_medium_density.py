"""
Memory usage performance test for medium density particle configurations.
Tests that memory usage stays within ≤300MB RSS limit.
"""

import pytest
import psutil
import os
import time
from pathlib import Path
from PIL import Image

from src.point_shoting.services.particle_engine import ParticleEngine
from src.point_shoting.models.settings import Settings, DensityProfile, SpeedProfile, ColorMode


@pytest.mark.performance
class TestMemoryUsage:
    """Test memory usage performance requirements"""
    
    def _get_current_memory_mb(self) -> float:
        """Get current process memory usage in MB"""
        process = psutil.Process(os.getpid())
        memory_info = process.memory_info()
        return memory_info.rss / (1024 * 1024)  # Convert bytes to MB
    
    def test_memory_medium_density(self, tmp_path):
        """Test that medium density configuration stays within 300MB RSS limit"""
        # Create test image
        test_image = Image.new('RGB', (256, 256), color='blue')
        image_path = tmp_path / "test_image.png"
        test_image.save(image_path)
        
        # Record baseline memory
        baseline_memory = self._get_current_memory_mb()
        
        # Medium density settings (≈9k particles)
        settings = Settings(
            density_profile=DensityProfile.MEDIUM,
            speed_profile=SpeedProfile.NORMAL,
            color_mode=ColorMode.STYLIZED,
            hud_enabled=False,
            locale='en',
            loop_mode=False
        )
        
        # Initialize engine
        engine = ParticleEngine()
        engine.init(settings, str(image_path))
        engine.start()
        
        # Run simulation for a while to stabilize memory usage
        for _ in range(50):
            engine.step()
            time.sleep(0.01)  # Small delay
        
        # Measure memory after stabilization
        peak_memory = self._get_current_memory_mb()
        memory_increase = peak_memory - baseline_memory
        
        # Clean up
        engine.stop()
        del engine
        
        # Assert memory constraint
        assert memory_increase <= 300.0, \
            f"Memory usage exceeded 300MB limit: {memory_increase:.1f}MB"
        
        # Additional check for reasonable memory usage (adjusted for efficient implementation)
        # Note: In full test runs, baseline memory may be higher, making increase appear smaller
        assert memory_increase >= 0.0, \
            f"Memory usage negative: {memory_increase:.1f}MB (indicates measurement error)"
        
        print(f"Memory usage: {memory_increase:.1f}MB for 9000 particles")
    
    def test_memory_high_density(self, tmp_path):
        """Test that high density configuration stays within reasonable limits"""
        # Create test image
        test_image = Image.new('RGB', (128, 128), color='green')
        image_path = tmp_path / "test_image.png"
        test_image.save(image_path)
        
        # Record baseline memory
        baseline_memory = self._get_current_memory_mb()
        
        # High density settings (≈15k particles)
        settings = Settings(
            density_profile=DensityProfile.HIGH,
            speed_profile=SpeedProfile.NORMAL,
            color_mode=ColorMode.PRECISE,
            hud_enabled=False,
            locale='en',
            loop_mode=False
        )
        
        # Initialize engine
        engine = ParticleEngine()
        engine.init(settings, str(image_path))
        engine.start()
        
        # Run simulation briefly
        for _ in range(30):
            engine.step()
            time.sleep(0.01)
        
        # Measure memory
        peak_memory = self._get_current_memory_mb()
        memory_increase = peak_memory - baseline_memory
        
        print(f"High density - Baseline: {baseline_memory:.1f}MB, Peak: {peak_memory:.1f}MB, Increase: {memory_increase:.1f}MB")
        
        # Clean up
        engine.stop()
        del engine
        
        # High density should use more memory but stay reasonable
        # Allow higher limit for high density (500MB)
        assert memory_increase <= 500.0, \
            f"High density memory usage excessive: {memory_increase:.1f}MB"
        
        assert memory_increase >= 0.0, \
            f"High density memory usage negative: {memory_increase:.1f}MB"
    
    def test_memory_stability_over_time(self, tmp_path):
        """Test that memory usage remains stable during extended simulation"""
        # Create test image
        test_image = Image.new('RGB', (100, 100), color='red')
        image_path = tmp_path / "test_image.png"
        test_image.save(image_path)
        
        # Medium density settings
        settings = Settings(
            density_profile=DensityProfile.MEDIUM,
            speed_profile=SpeedProfile.FAST,
            color_mode=ColorMode.STYLIZED,
            hud_enabled=False,
            locale='en',
            loop_mode=True  # Enable looping for extended test
        )
        
        # Initialize engine
        engine = ParticleEngine()
        engine.init(settings, str(image_path))
        engine.start()
        
        # Record memory at multiple points
        memory_samples = []
        
        # Sample memory usage over extended period
        for i in range(100):
            engine.step()
            if i % 10 == 0:  # Sample every 10 steps
                memory_samples.append(self._get_current_memory_mb())
            time.sleep(0.005)  # Small delay
        
        # Clean up
        engine.stop()
        del engine
        
        # Check for memory leaks (significant growth over time)
        if len(memory_samples) >= 3:
            initial_memory = memory_samples[0]
            final_memory = memory_samples[-1]
            memory_growth = final_memory - initial_memory
            
            # Allow some growth but not excessive (≤50MB over time)
            assert memory_growth <= 50.0, \
                f"Potential memory leak detected: {memory_growth:.1f}MB growth"
            
            # Check variance - memory should be relatively stable
            import statistics
            if len(memory_samples) > 1:
                memory_variance = statistics.variance(memory_samples)
                assert memory_variance <= 100.0, \
                    f"Memory usage too unstable: variance={memory_variance:.1f}"
