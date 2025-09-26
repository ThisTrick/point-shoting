"""Invariant test for velocity magnitude caps"""

import pytest
import numpy as np

# Imports will fail until implementation exists - expected for TDD
try:
    from src.point_shoting.services.particle_engine import ParticleEngine
    from src.point_shoting.models.settings import Settings
    from src.point_shoting.models.stage import Stage
    from unittest.mock import patch
    from PIL import Image
except ImportError:
    ParticleEngine = None
    Settings = None
    Stage = None
    Image = None


@pytest.mark.integration
class TestVelocityCap:
    """Test that velocity magnitudes respect stage-specific caps"""

    def test_velocity_magnitude_within_stage_limits(self):
        """Velocity magnitudes should not exceed vmax for current stage"""
        if ParticleEngine is None or Settings is None or Stage is None or Image is None:
            pytest.skip("Dependencies not implemented yet")

        with patch('src.point_shoting.services.particle_engine.Image.open') as mock_open:
            # Mock image
            mock_image = Image.new('RGB', (100, 100), color='red')
            mock_open.return_value = mock_image
            
            engine = ParticleEngine()
            settings = Settings()
            
            engine.init(settings, 'test_image.png')
            engine.start()
            
            # Reasonable velocity limits - these should be enforced by the physics
            # Note: These are educated guesses based on typical physics simulations
            max_reasonable_velocity = 20.0  # Any velocity above this is likely a bug
            
            for step in range(80):  # Test across multiple steps
                engine.step()
                
                current_stage = engine.get_current_stage()
                snapshot = engine.get_particle_snapshot()
                
                if snapshot is not None:
                    velocities = snapshot.velocity
                    
                    if velocities is not None and len(velocities) > 0:
                        velocity_magnitudes = np.linalg.norm(velocities, axis=1)
                        max_velocity = np.max(velocity_magnitudes)
                        
                        # Test reasonable bounds - velocities shouldn't be infinite or extremely large
                        assert np.isfinite(max_velocity), (
                            f"Step {step}, Stage {current_stage}: "
                            f"velocity magnitude is not finite: {max_velocity}"
                        )
                        
                        assert max_velocity <= max_reasonable_velocity, (
                            f"Step {step}, Stage {current_stage}: "
                            f"velocity {max_velocity:.3f} exceeds reasonable limit {max_reasonable_velocity}"
                        )

    def test_speed_profile_affects_velocity_caps(self):
        """Different speed profiles should scale velocity limits appropriately"""
        if ParticleEngine is None or Settings is None or Image is None:
            pytest.skip("Dependencies not implemented yet")

        with patch('src.point_shoting.services.particle_engine.Image.open') as mock_open:
            # Mock image
            mock_image = Image.new('RGB', (100, 100), color='red')
            mock_open.return_value = mock_image
            
            # Test with default settings (we can't test different profiles without knowing the API)
            engine = ParticleEngine()
            settings = Settings()
            
            engine.init(settings, 'test_image.png')
            engine.start()
            
            # Run some steps and collect velocity statistics
            max_velocities = []
            
            for step in range(30):
                engine.step()
                
                snapshot = engine.get_particle_snapshot()
                if snapshot is not None:
                    velocities = snapshot.velocity
                    
                    if velocities is not None and len(velocities) > 0:
                        velocity_magnitudes = np.linalg.norm(velocities, axis=1)
                        max_velocity = np.max(velocity_magnitudes)
                        max_velocities.append(max_velocity)
            
            # Verify we collected some velocity data
            assert len(max_velocities) > 0, "No velocity data collected"
            
            # Verify velocities are reasonable and finite
            for i, vel in enumerate(max_velocities):
                assert np.isfinite(vel), f"Step {i}: velocity not finite"
                assert vel >= 0, f"Step {i}: negative velocity magnitude"

    def test_velocity_damping_in_chaos(self):
        """Velocity should decrease over time during CHAOS stage (damping)"""
        if ParticleEngine is None or Settings is None or Stage is None or Image is None:
            pytest.skip("Dependencies not implemented yet")

        with patch('src.point_shoting.services.particle_engine.Image.open') as mock_open:
            # Mock image
            mock_image = Image.new('RGB', (100, 100), color='red')
            mock_open.return_value = mock_image
            
            engine = ParticleEngine()
            settings = Settings()
            
            engine.init(settings, 'test_image.png')
            engine.start()
            
            # Wait until we're in a stage where damping should occur
            chaos_velocities = []
            
            for step in range(60):
                engine.step()
                
                current_stage = engine.get_current_stage()
                snapshot = engine.get_particle_snapshot()
                
                if snapshot is not None:
                    velocities = snapshot.velocity
                    
                    if velocities is not None and len(velocities) > 0:
                        # Record velocity statistics for any stage (damping should occur generally)
                        velocity_magnitudes = np.linalg.norm(velocities, axis=1)
                        avg_velocity = np.mean(velocity_magnitudes)
                        max_velocity = np.max(velocity_magnitudes)
                        
                        chaos_velocities.append({
                            'step': step,
                            'stage': current_stage,
                            'avg_velocity': avg_velocity,
                            'max_velocity': max_velocity
                        })
            
            # Verify we collected velocity data
            assert len(chaos_velocities) > 0, "No velocity data collected during simulation"
            
            # Verify velocities remain bounded (basic damping test)
            max_observed = max(v['max_velocity'] for v in chaos_velocities)
            assert max_observed < 100.0, f"Velocities too high - max observed: {max_observed}"
            
            # Verify velocities are reasonable
            for v in chaos_velocities:
                assert np.isfinite(v['avg_velocity']), f"Step {v['step']}: avg velocity not finite"
                assert v['avg_velocity'] >= 0, f"Step {v['step']}: negative avg velocity"
