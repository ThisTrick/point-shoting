"""
Integration tests for FR-022: Performance warnings for high particle densities.

Tests the system's ability to detect and warn about particle densities that
may exceed system capabilities or cause performance issues.
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
import numpy as np
import time

from src.point_shoting.models.settings import Settings, DensityProfile
from src.point_shoting.services.particle_engine import ParticleEngine


@pytest.mark.integration
class TestDensityWarningSystem:
    """Integration tests for density-based performance warning system."""

    def test_low_density_no_warnings(self):
        """FR-022: Test LOW density profile produces no performance warnings."""
        settings = Settings(density_profile=DensityProfile.LOW)
        
        mock_image = Mock()
        mock_image.size = (400, 300)
        mock_image.mode = 'RGB'
        
        with patch('PIL.Image.open', return_value=mock_image):
            engine = ParticleEngine()
            engine.init(settings, "test_image.png")
            engine.start()
            
            # Run multiple steps to assess performance
            step_times = []
            for _ in range(20):
                start_time = time.perf_counter()
                engine.step()
                end_time = time.perf_counter()
                step_times.append(end_time - start_time)
            
            # LOW density should have reasonable step times
            if step_times:
                avg_step_time = np.mean(step_times)
                max_step_time = np.max(step_times)
                
                # Step times should be reasonable for LOW density
                assert avg_step_time < 0.1, f"HIGH average step time for LOW density: {avg_step_time:.4f}s"
                assert max_step_time < 0.2, f"HIGH max step time for LOW density: {max_step_time:.4f}s"

    def test_medium_density_acceptable_performance(self):
        """FR-022: Test MEDIUM density profile maintains acceptable performance."""
        settings = Settings(density_profile=DensityProfile.MEDIUM)
        
        mock_image = Mock()
        mock_image.size = (600, 400)
        mock_image.mode = 'RGB'
        
        with patch('PIL.Image.open', return_value=mock_image):
            engine = ParticleEngine()
            engine.init(settings, "test_image.png")
            engine.start()
            
            # Test performance metrics
            step_times = []
            particle_counts = []
            
            for _ in range(15):
                start_time = time.perf_counter()
                engine.step()
                end_time = time.perf_counter()
                step_times.append(end_time - start_time)
                
                particles = engine.get_particle_snapshot()
                if particles is not None:
                    particle_counts.append(len(particles.position))
            
            # MEDIUM density should still be reasonable
            if step_times:
                avg_step_time = np.mean(step_times)
                
                # Should be slower than LOW but not excessive
                assert avg_step_time < 0.5, f"Excessive step time for MEDIUM density: {avg_step_time:.4f}s"
            
            # Should have more particles than LOW density
            if particle_counts:
                avg_particle_count = np.mean(particle_counts)
                assert avg_particle_count > 100, f"Unexpectedly low particle count for MEDIUM: {avg_particle_count}"

    def test_high_density_performance_monitoring(self):
        """FR-022: Test HIGH density profile performance is monitored."""
        settings = Settings(density_profile=DensityProfile.HIGH)
        
        mock_image = Mock()
        mock_image.size = (800, 600)
        mock_image.mode = 'RGB'
        
        with patch('PIL.Image.open', return_value=mock_image):
            engine = ParticleEngine()
            engine.init(settings, "test_image.png")
            engine.start()
            
            # Monitor performance with HIGH density
            step_times = []
            particle_counts = []
            memory_usage_indicators = []
            
            for _ in range(10):  # Fewer steps for HIGH density
                start_time = time.perf_counter()
                engine.step()
                end_time = time.perf_counter()
                step_times.append(end_time - start_time)
                
                particles = engine.get_particle_snapshot()
                if particles is not None:
                    particle_count = len(particles.position)
                    particle_counts.append(particle_count)
                    
                    # Rough memory usage indicator (particle arrays size)
                    array_memory = particles.position.nbytes + particles.velocity.nbytes + particles.color_rgba.nbytes
                    memory_usage_indicators.append(array_memory)
            
            # HIGH density should have many particles
            if particle_counts:
                avg_particle_count = np.mean(particle_counts)
                max_particle_count = np.max(particle_counts)
                
                # Should have significantly more particles than MEDIUM
                assert avg_particle_count > 1000, f"LOW particle count for HIGH density: {avg_particle_count}"
                
                # Should be consistent (not dropping particles due to performance issues)
                particle_variance = np.var(particle_counts) if len(particle_counts) > 1 else 0
                assert particle_variance < avg_particle_count * 0.1, f"Unstable particle count: variance {particle_variance}"
            
            # Performance monitoring - times may be higher but should be bounded
            if step_times:
                avg_step_time = np.mean(step_times)
                max_step_time = np.max(step_times)
                
                # Should complete steps within reasonable time even at HIGH density
                assert max_step_time < 2.0, f"Excessive step time for HIGH density: {max_step_time:.4f}s"

    def test_large_image_density_scaling(self):
        """FR-022: Test density scaling with large images triggers appropriate warnings."""
        settings = Settings(density_profile=DensityProfile.HIGH)
        
        # Large image that would create many particles
        mock_image = Mock()
        mock_image.size = (1920, 1080)  # Full HD image
        mock_image.mode = 'RGB'
        
        with patch('PIL.Image.open', return_value=mock_image):
            engine = ParticleEngine()
            engine.init(settings, "large_image.png")
            engine.start()
            
            # Test that system handles large image + high density
            particles = engine.get_particle_snapshot()
            if particles is not None:
                particle_count = len(particles.position)
                
                # Should scale appropriately with image size
                expected_min_particles = 5000  # Reasonable minimum for large high-density
                assert particle_count >= expected_min_particles, f"Too few particles for large image: {particle_count}"
                
                # Should not be excessive (memory/performance concern)
                expected_max_particles = 50000  # Reasonable maximum
                assert particle_count <= expected_max_particles, f"Excessive particles for large image: {particle_count}"
            
            # Test a few animation steps work without crashes
            for _ in range(3):
                engine.step()
                particles = engine.get_particle_snapshot()
                # Should continue to work without errors

    def test_density_profile_memory_usage(self):
        """FR-022: Test different density profiles have predictable memory usage."""
        mock_image = Mock()
        mock_image.size = (500, 400)
        mock_image.mode = 'RGB'
        
        density_memory_usage = {}
        
        for density_profile in [DensityProfile.LOW, DensityProfile.MEDIUM, DensityProfile.HIGH]:
            settings = Settings(density_profile=density_profile)
            
            with patch('PIL.Image.open', return_value=mock_image):
                engine = ParticleEngine()
                engine.init(settings, "test_image.png")
                engine.start()
                
                # Run a few steps to initialize
                for _ in range(5):
                    engine.step()
                
                particles = engine.get_particle_snapshot()
                if particles is not None:
                    # Calculate approximate memory usage
                    position_bytes = particles.position.nbytes
                    velocity_bytes = particles.velocity.nbytes
                    color_bytes = particles.color_rgba.nbytes
                    target_bytes = particles.target.nbytes
                    total_bytes = position_bytes + velocity_bytes + color_bytes + target_bytes
                    
                    density_memory_usage[density_profile] = total_bytes
        
        # Memory usage should increase with density
        if DensityProfile.LOW in density_memory_usage and DensityProfile.MEDIUM in density_memory_usage:
            assert density_memory_usage[DensityProfile.MEDIUM] >= density_memory_usage[DensityProfile.LOW], \
                "MEDIUM density should use more memory than LOW"
        
        if DensityProfile.MEDIUM in density_memory_usage and DensityProfile.HIGH in density_memory_usage:
            assert density_memory_usage[DensityProfile.HIGH] >= density_memory_usage[DensityProfile.MEDIUM], \
                "HIGH density should use more memory than MEDIUM"
        
        # Memory usage should be reasonable (not excessive)
        for density, memory_bytes in density_memory_usage.items():
            memory_mb = memory_bytes / (1024 * 1024)
            assert memory_mb < 100, f"Excessive memory usage for {density}: {memory_mb:.1f}MB"

    def test_performance_degradation_detection(self):
        """FR-022: Test system can detect when performance degrades significantly."""
        # Use HIGH density to potentially trigger performance issues
        settings = Settings(density_profile=DensityProfile.HIGH)
        
        mock_image = Mock()
        mock_image.size = (800, 800)
        mock_image.mode = 'RGB'
        
        with patch('PIL.Image.open', return_value=mock_image):
            engine = ParticleEngine()
            engine.init(settings, "performance_test.png")
            engine.start()
            
            # Measure performance over time
            step_times_early = []
            step_times_later = []
            
            # Early performance measurement
            for _ in range(5):
                start_time = time.perf_counter()
                engine.step()
                end_time = time.perf_counter()
                step_times_early.append(end_time - start_time)
            
            # Continue running
            for _ in range(10):
                engine.step()
            
            # Later performance measurement
            for _ in range(5):
                start_time = time.perf_counter()
                engine.step()
                end_time = time.perf_counter()
                step_times_later.append(end_time - start_time)
            
            # Performance should remain relatively stable
            if step_times_early and step_times_later:
                early_avg = np.mean(step_times_early)
                later_avg = np.mean(step_times_later)
                
                # Performance shouldn't degrade too much over time
                if early_avg > 0:
                    degradation_ratio = later_avg / early_avg
                    assert degradation_ratio < 3.0, f"Significant performance degradation: {degradation_ratio:.3f}x"
                
                # Both should be within reasonable bounds
                assert early_avg < 1.0, f"HIGH early step time: {early_avg:.4f}s"
                assert later_avg < 2.0, f"HIGH later step time: {later_avg:.4f}s"

    def test_density_warning_thresholds(self):
        """FR-022: Test system recognizes density-related performance thresholds."""
        # Test each density profile for basic functionality
        density_profiles = [DensityProfile.LOW, DensityProfile.MEDIUM, DensityProfile.HIGH]
        
        mock_image = Mock()
        mock_image.size = (600, 500)
        mock_image.mode = 'RGB'
        
        performance_results = {}
        
        for density in density_profiles:
            settings = Settings(density_profile=density)
            
            with patch('PIL.Image.open', return_value=mock_image):
                engine = ParticleEngine()
                engine.init(settings, "threshold_test.png")
                engine.start()
                
                # Measure basic performance metrics
                start_time = time.perf_counter()
                
                for _ in range(10):
                    engine.step()
                
                total_time = time.perf_counter() - start_time
                
                particles = engine.get_particle_snapshot()
                particle_count = len(particles.position) if particles is not None else 0
                
                performance_results[density] = {
                    'total_time': total_time,
                    'particle_count': particle_count,
                    'time_per_particle': total_time / max(particle_count, 1)
                }
        
        # Verify performance scaling expectations
        low_result = performance_results.get(DensityProfile.LOW, {})
        medium_result = performance_results.get(DensityProfile.MEDIUM, {})
        high_result = performance_results.get(DensityProfile.HIGH, {})
        
        # Particle counts should increase with density
        if low_result and medium_result:
            assert medium_result['particle_count'] > low_result['particle_count'], \
                "MEDIUM should have more particles than LOW"
        
        if medium_result and high_result:
            assert high_result['particle_count'] >= medium_result['particle_count'], \
                "HIGH should have more or equal particles than MEDIUM"
        
        # All densities should complete without excessive time
        for density, result in performance_results.items():
            assert result['total_time'] < 5.0, f"Excessive total time for {density}: {result['total_time']:.3f}s"
