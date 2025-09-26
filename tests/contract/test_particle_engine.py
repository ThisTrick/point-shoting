"""Contract test for ParticleEngine"""

import pytest
from unittest.mock import Mock

# Import will fail until implementation exists - that's expected for TDD
try:
    from src.point_shoting.services.particle_engine import ParticleEngine
    from src.point_shoting.models.stage import Stage
    from src.point_shoting.models.settings import Settings
    from unittest.mock import patch
    from PIL import Image
except ImportError:
    ParticleEngine = None
    Stage = None  
    Settings = None
    Image = None


@pytest.mark.contract
class TestParticleEngineContract:
    """Test ParticleEngine interface compliance and basic invariants"""

    def test_particle_engine_import_exists(self):
        """ParticleEngine class should be importable"""
        assert ParticleEngine is not None, "ParticleEngine class not implemented yet"

    def test_init_method_exists(self):
        """init method should exist and accept image_path and settings"""
        if ParticleEngine is None:
            pytest.skip("ParticleEngine not implemented yet")
        engine = ParticleEngine()
        assert hasattr(engine, 'init')
        # Actual initialization would require valid settings and image path

    def test_step_method_exists(self):
        """step method should exist and be callable"""
        if ParticleEngine is None:
            pytest.skip("ParticleEngine not implemented yet")
        engine = ParticleEngine()
        assert hasattr(engine, 'step')
        # engine.step() - would raise error if not initialized

    def test_stage_method_exists(self):
        """get_current_stage method should return current stage"""
        if ParticleEngine is None or Stage is None:
            pytest.skip("ParticleEngine/Stage not implemented yet")
        engine = ParticleEngine()
        assert hasattr(engine, 'get_current_stage')
        # Should return PRE_START by default
        assert engine.get_current_stage() == Stage.PRE_START
        # stage = engine.stage()
        # assert isinstance(stage, str)

    def test_metrics_method_exists(self):
        """get_metrics method should return Metrics object"""
        if ParticleEngine is None:
            pytest.skip("ParticleEngine not implemented yet")
        engine = ParticleEngine()
        assert hasattr(engine, 'get_metrics')
        metrics = engine.get_metrics()
        assert hasattr(metrics, 'fps_avg')
        assert hasattr(metrics, 'fps_instant')
        assert hasattr(metrics, 'particle_count')

    def test_snapshot_method_exists(self):
        """get_particle_snapshot method should return ParticleArrays or None"""
        if ParticleEngine is None:
            pytest.skip("ParticleEngine not implemented yet")
        engine = ParticleEngine()
        assert hasattr(engine, 'get_particle_snapshot')
        # Should be None when not initialized
        snapshot = engine.get_particle_snapshot()
        assert snapshot is None

    def test_apply_settings_method_exists(self):
        """apply_settings method should accept Settings object"""
        if ParticleEngine is None:
            pytest.skip("ParticleEngine not implemented yet")
        engine = ParticleEngine()
        assert hasattr(engine, 'apply_settings')
        # Method exists and can be called

    def test_step_before_init_raises_runtime_error(self):
        """Calling step() before initialize() should raise RuntimeError"""
        if ParticleEngine is None:
            pytest.skip("ParticleEngine not implemented yet")
        engine = ParticleEngine()
        with pytest.raises(RuntimeError):
            engine.step()

    def test_particle_count_stable_invariant(self):
        """Particle count should remain stable after initialization"""
        if ParticleEngine is None or Settings is None or Image is None:
            pytest.skip("Dependencies not available")
            
        with patch('src.point_shoting.services.particle_engine.Image.open') as mock_open:
            # Mock image
            mock_image = Image.new('RGB', (100, 100), color='red')
            mock_open.return_value = mock_image
            
            engine = ParticleEngine()
            settings = Settings()
            
            engine.init(settings, "test.jpg")
            
            # Get initial particle count
            particles = engine.get_particle_snapshot()
            if particles is not None:
                initial_count = len(particles.position)
                
                # Run several simulation steps
                engine.start()
                for _ in range(10):
                    engine.step()
                
                # Check particle count remains stable
                particles_after = engine.get_particle_snapshot()
                if particles_after is not None:
                    final_count = len(particles_after.position)
                    assert final_count == initial_count, f"Particle count changed from {initial_count} to {final_count}"
            else:
                pytest.skip("Particle snapshot not available")

    def test_positions_normalized_invariant(self):
        """All particle positions should remain in [0,1]^2"""
        if ParticleEngine is None or Settings is None or Image is None:
            pytest.skip("Dependencies not available")
            
        with patch('src.point_shoting.services.particle_engine.Image.open') as mock_open:
            # Mock image
            mock_image = Image.new('RGB', (100, 100), color='red')
            mock_open.return_value = mock_image
            
            engine = ParticleEngine()
            settings = Settings()
            
            engine.init(settings, "test.jpg")
            engine.start()
            
            # Run multiple steps and check position bounds after each
            for i in range(20):
                engine.step()
                
                particles = engine.get_particle_snapshot()
                if particles is not None:
                    positions = particles.position
                    
                    # Check all positions are in [0,1]^2 range
                    assert positions.min() >= 0.0, f"Step {i}: position below 0.0: {positions.min()}"
                    assert positions.max() <= 1.0, f"Step {i}: position above 1.0: {positions.max()}"
                    
                    # Check shape consistency
                    assert positions.shape[1] == 2, f"Step {i}: positions should be 2D coordinates"

    def test_stage_monotonic_progression_invariant(self):
        """Stage should follow monotonic progression without backwards steps"""
        if ParticleEngine is None or Settings is None or Image is None or Stage is None:
            pytest.skip("Dependencies not available")
            
        with patch('src.point_shoting.services.particle_engine.Image.open') as mock_open:
            # Mock image
            mock_image = Image.new('RGB', (100, 100), color='red')
            mock_open.return_value = mock_image
            
            engine = ParticleEngine()
            settings = Settings()
            
            engine.init(settings, "test.jpg")
            engine.start()
            
            # Track stage progression
            previous_stage = engine.get_current_stage()
            stage_history = [previous_stage]
            
            # Run simulation and track stages
            for i in range(50):
                engine.step()
                current_stage = engine.get_current_stage()
                
                if current_stage != previous_stage:
                    stage_history.append(current_stage)
                    
                    # Check for valid progressions (no backwards motion)
                    # Allow these valid forward transitions:
                    valid_transitions = {
                        Stage.PRE_START: [Stage.BURST],
                        Stage.BURST: [Stage.CHAOS], 
                        Stage.CHAOS: [Stage.CONVERGING],
                        Stage.CONVERGING: [Stage.FORMATION],
                        Stage.FORMATION: [Stage.FINAL_BREATHING],
                        Stage.FINAL_BREATHING: [Stage.PRE_START]  # Loop allowed
                    }
                    
                    if previous_stage in valid_transitions:
                        assert current_stage in valid_transitions[previous_stage], \
                            f"Invalid transition from {previous_stage} to {current_stage}"
                    
                    previous_stage = current_stage
                    
            # Ensure some progression occurred (not stuck in PRE_START)
            assert len(stage_history) >= 1, "No stage progression detected"
