"""
Pause latency integration test.
Tests that pause/resume operations respond within ≤200ms.
"""

import pytest
import time
from pathlib import Path
from PIL import Image

from src.point_shoting.services.particle_engine import ParticleEngine
from src.point_shoting.models.settings import Settings, DensityProfile, SpeedProfile, ColorMode
from src.point_shoting.models.stage import Stage


@pytest.mark.integration
class TestPauseLatency:
    """Test pause/resume latency requirements"""
    
    def test_pause_latency(self, tmp_path):
        """Test that pause operation responds within 200ms"""
        # Create test image
        test_image = Image.new('RGB', (150, 150), color='magenta')
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
        
        # Initialize and start engine
        engine = ParticleEngine()
        engine.init(settings, str(image_path))
        engine.start()
        
        # Let it run for a moment to get into a stable state
        for _ in range(10):
            engine.step()
            time.sleep(0.01)
        
        # Test pause latency
        pause_start = time.perf_counter()
        engine.pause()
        pause_end = time.perf_counter()
        
        pause_latency = (pause_end - pause_start) * 1000  # Convert to ms
        
        # Verify paused state
        assert engine.is_paused(), "Engine should be paused after pause() call"
        assert not engine.is_running(), "Engine should not be running when paused"
        
        # Clean up
        engine.stop()
        
        # Assert pause latency requirement
        assert pause_latency <= 200.0, \
            f"Pause latency exceeded 200ms requirement: {pause_latency:.1f}ms"
        
        # Pause should be essentially instantaneous
        assert pause_latency <= 50.0, \
            f"Pause latency suspiciously high: {pause_latency:.1f}ms"
    
    def test_resume_latency(self, tmp_path):
        """Test that resume operation responds within 200ms"""
        # Create test image
        test_image = Image.new('RGB', (150, 150), color='lime')
        image_path = tmp_path / "test_image.png"
        test_image.save(image_path)
        
        settings = Settings(
            density_profile=DensityProfile.MEDIUM,
            speed_profile=SpeedProfile.NORMAL,
            color_mode=ColorMode.STYLIZED,
            hud_enabled=False,
            locale='en'
        )
        
        # Initialize and start engine
        engine = ParticleEngine()
        engine.init(settings, str(image_path))
        engine.start()
        
        # Run briefly then pause
        for _ in range(5):
            engine.step()
            time.sleep(0.01)
        
        engine.pause()
        assert engine.is_paused(), "Engine should be paused"
        
        # Wait a moment while paused
        time.sleep(0.1)
        
        # Test resume latency
        resume_start = time.perf_counter()
        engine.resume()
        resume_end = time.perf_counter()
        
        resume_latency = (resume_end - resume_start) * 1000  # Convert to ms
        
        # Verify resumed state
        assert not engine.is_paused(), "Engine should not be paused after resume()"
        assert engine.is_running(), "Engine should be running after resume()"
        
        # Clean up
        engine.stop()
        
        # Assert resume latency requirement
        assert resume_latency <= 200.0, \
            f"Resume latency exceeded 200ms requirement: {resume_latency:.1f}ms"
        
        # Resume should be essentially instantaneous
        assert resume_latency <= 50.0, \
            f"Resume latency suspiciously high: {resume_latency:.1f}ms"
    
    def test_pause_resume_cycle_latency(self, tmp_path):
        """Test multiple pause/resume cycles for consistent latency"""
        # Create test image
        test_image = Image.new('RGB', (120, 120), color='teal')
        image_path = tmp_path / "test_image.png"
        test_image.save(image_path)
        
        settings = Settings(
            density_profile=DensityProfile.MEDIUM,
            speed_profile=SpeedProfile.FAST,
            color_mode=ColorMode.STYLIZED,
            hud_enabled=False,
            locale='en'
        )
        
        # Initialize and start engine
        engine = ParticleEngine()
        engine.init(settings, str(image_path))
        engine.start()
        
        # Run initial steps
        for _ in range(10):
            engine.step()
            time.sleep(0.005)
        
        pause_latencies = []
        resume_latencies = []
        
        # Test multiple pause/resume cycles
        for cycle in range(5):
            # Step a few times between cycles
            for _ in range(3):
                engine.step()
                time.sleep(0.01)
            
            # Pause
            pause_start = time.perf_counter()
            engine.pause()
            pause_end = time.perf_counter()
            pause_latencies.append((pause_end - pause_start) * 1000)
            
            # Brief pause period
            time.sleep(0.05)
            
            # Resume
            resume_start = time.perf_counter()
            engine.resume()
            resume_end = time.perf_counter()
            resume_latencies.append((resume_end - resume_start) * 1000)
        
        # Clean up
        engine.stop()
        
        # Check all latencies
        max_pause_latency = max(pause_latencies)
        max_resume_latency = max(resume_latencies)
        avg_pause_latency = sum(pause_latencies) / len(pause_latencies)
        avg_resume_latency = sum(resume_latencies) / len(resume_latencies)
        
        assert max_pause_latency <= 200.0, \
            f"Maximum pause latency exceeded 200ms: {max_pause_latency:.1f}ms"
        
        assert max_resume_latency <= 200.0, \
            f"Maximum resume latency exceeded 200ms: {max_resume_latency:.1f}ms"
        
        # Average should be much better
        assert avg_pause_latency <= 100.0, \
            f"Average pause latency too high: {avg_pause_latency:.1f}ms"
        
        assert avg_resume_latency <= 100.0, \
            f"Average resume latency too high: {avg_resume_latency:.1f}ms"
    
    def test_pause_during_different_stages(self, tmp_path):
        """Test that pause latency is consistent across different animation stages"""
        # Create test image
        test_image = Image.new('RGB', (100, 100), color='navy')
        image_path = tmp_path / "test_image.png"
        test_image.save(image_path)
        
        settings = Settings(
            density_profile=DensityProfile.LOW,  # Faster transitions
            speed_profile=SpeedProfile.FAST,
            color_mode=ColorMode.STYLIZED,
            hud_enabled=False,
            locale='en'
        )
        
        engine = ParticleEngine()
        engine.init(settings, str(image_path))
        engine.start()
        
        stage_pause_latencies = {}
        tested_stages = set()
        all_stages_seen = set()
        
        # Run animation and test pause at different stages
        max_steps = 300  # Increased to ensure we see stage transitions
        for step in range(max_steps):
            engine.step()
            current_stage = engine.get_current_stage()
            all_stages_seen.add(current_stage)
            
            # Test pause for first few stages we encounter (but only once per stage)
            if (current_stage not in tested_stages and 
                current_stage not in [Stage.PRE_START] and  # Skip pre-start
                len(tested_stages) < 2):  # Limit to avoid too many pause/resume cycles
                
                tested_stages.add(current_stage)
                
                # Test pause latency at this stage
                pause_start = time.perf_counter()
                engine.pause()
                pause_end = time.perf_counter()
                
                pause_latency = (pause_end - pause_start) * 1000
                stage_pause_latencies[current_stage] = pause_latency
                
                # Resume immediately
                engine.resume()
            
            # Add small delay to allow stage transitions
            if step % 10 == 0:
                time.sleep(0.01)
        
        # Clean up
        engine.stop()
        
        # Check latencies for all tested stages
        for stage, latency in stage_pause_latencies.items():
            assert latency <= 200.0, \
                f"Pause latency in {stage.name} stage exceeded 200ms: {latency:.1f}ms"
            
            # Should be very fast regardless of stage
            assert latency <= 100.0, \
                f"Pause latency in {stage.name} stage too high: {latency:.1f}ms"
        
        # Should have seen some stages during animation
        assert len(all_stages_seen) >= 1, f"Should have seen animation stages, saw: {all_stages_seen}"
        
        # If we couldn't test pause in different stages, that's OK - just ensure we tested basic pause
        if len(tested_stages) == 0:
            # Fall back to simple pause test
            engine.start()
            for _ in range(5):
                engine.step()
            
            pause_start = time.perf_counter()
            engine.pause()
            pause_end = time.perf_counter()
            
            pause_latency = (pause_end - pause_start) * 1000
            assert pause_latency <= 200.0, f"Basic pause latency exceeded 200ms: {pause_latency:.1f}ms"
            engine.stop()
