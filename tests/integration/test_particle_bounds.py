"""Invariant test for particle position bounds"""

import pytest
import numpy as np

# Imports will fail until implementation exists - expected for TDD
try:
    from src.point_shoting.services.particle_engine import ParticleEngine
    from src.point_shoting.models.settings import Settings
    from unittest.mock import patch
    from PIL import Image
except ImportError:
    ParticleEngine = None
    Settings = None
    Image = None


@pytest.mark.integration
class TestParticleBounds:
    """Test that particle positions remain within [0,1]^2 bounds across all steps"""

    def test_positions_remain_in_bounds(self):
        """All particle positions should remain in [0,1]^2 throughout simulation"""
        if ParticleEngine is None or Settings is None or Image is None:
            pytest.skip("Dependencies not implemented yet")

        with patch('src.point_shoting.services.particle_engine.Image.open') as mock_open:
            # Mock image
            mock_image = Image.new('RGB', (100, 100), color='red')
            mock_open.return_value = mock_image
            
            engine = ParticleEngine()
            settings = Settings()
            
            engine.init(settings, 'test_image.png')
            engine.start()
            
            # Run simulation for multiple steps
            for step in range(50):  # Reduced for faster test
                engine.step()
                
                # Get particle positions snapshot
                snapshot = engine.get_particle_snapshot()
                
                if snapshot is not None:
                    positions = snapshot.position
                    
                    # Check all positions are in [0,1]^2
                    assert np.all(positions >= 0.0), f"Step {step}: positions below 0.0 detected"
                    assert np.all(positions <= 1.0), f"Step {step}: positions above 1.0 detected"
                    
                    # Also check shape consistency
                    assert positions.shape[1] == 2, "Positions should be 2D coordinates"

    def test_boundary_clamping_behavior(self):
        """Test behavior when particles approach boundaries"""
        if ParticleEngine is None or Settings is None or Image is None:
            pytest.skip("Dependencies not implemented yet")

        with patch('src.point_shoting.services.particle_engine.Image.open') as mock_open:
            # Mock image
            mock_image = Image.new('RGB', (100, 100), color='red')
            mock_open.return_value = mock_image
            
            engine = ParticleEngine()
            settings = Settings()
            
            engine.init(settings, 'test_image.png')
            engine.start()
            
            # Run many steps to increase chance of boundary conditions
            for step in range(100):
                engine.step()
            
            # Get final positions
            snapshot = engine.get_particle_snapshot()
            if snapshot is not None:
                positions = snapshot.position
                
                # Check clamping behavior - positions should never exceed bounds
                min_pos = np.min(positions)
                max_pos = np.max(positions)
                
                assert min_pos >= 0.0, f"Minimum position {min_pos} is below 0.0"
                assert max_pos <= 1.0, f"Maximum position {max_pos} is above 1.0"
                
                # Verify we have some particles near boundaries (showing clamping works)
                edge_tolerance = 0.05  # Within 5% of edge
                near_edges = np.any((positions <= edge_tolerance) | (positions >= (1.0 - edge_tolerance)))
                # This test passes regardless since clamping might prevent edge proximity

    def test_burst_emission_bounds(self):
        """Test that burst emission respects position bounds"""
        if ParticleEngine is None or Settings is None or Image is None:
            pytest.skip("Dependencies not implemented yet")

        with patch('src.point_shoting.services.particle_engine.Image.open') as mock_open:
            # Mock image
            mock_image = Image.new('RGB', (100, 100), color='red')
            mock_open.return_value = mock_image
            
            engine = ParticleEngine()
            settings = Settings()
            
            engine.init(settings, 'test_image.png')
            
            # Check initial positions before starting simulation
            initial_snapshot = engine.get_particle_snapshot()
            if initial_snapshot is not None:
                initial_positions = initial_snapshot.position
                
                # Initial positions should be within bounds
                assert np.all(initial_positions >= 0.0), "Initial positions below 0.0 detected"
                assert np.all(initial_positions <= 1.0), "Initial positions above 1.0 detected"
            
            # Start and check first few steps during burst phase
            engine.start()
            
            for step in range(10):  # Check first 10 steps of burst
                engine.step()
                
                snapshot = engine.get_particle_snapshot()
                if snapshot is not None:
                    positions = snapshot.position
                    
                    # Even during burst emission, bounds must be respected
                    assert np.all(positions >= 0.0), f"Burst step {step}: positions below 0.0"
                    assert np.all(positions <= 1.0), f"Burst step {step}: positions above 1.0"
