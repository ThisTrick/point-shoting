"""Contract test for ControlInterface"""

import pytest
import time
from unittest.mock import patch
try:
    from PIL import Image
except ImportError:
    Image = None

# Import will fail until implementation exists - that's expected for TDD
try:
    from src.point_shoting.cli.control_interface import ControlInterface
    from src.point_shoting.services.particle_engine import ParticleEngine
    from src.point_shoting.models.settings import Settings
except ImportError:
    ControlInterface = None
    ParticleEngine = None
    Settings = None


@pytest.mark.contract
class TestControlInterfaceContract:
    """Test ControlInterface for idempotent operations and debounce behavior"""

    def test_control_interface_import_exists(self):
        """ControlInterface class should be importable"""
        assert ControlInterface is not None, "ControlInterface class not implemented yet"

    def test_start_method_exists(self):
        """start method should exist"""
        if ControlInterface is None or ParticleEngine is None:
            pytest.skip("ControlInterface/ParticleEngine not implemented yet")
        engine = ParticleEngine()
        controller = ControlInterface(engine)
        assert hasattr(controller, 'start')

    def test_pause_method_exists(self):
        """pause method should exist"""
        if ControlInterface is None or ParticleEngine is None:
            pytest.skip("ControlInterface/ParticleEngine not implemented yet")
        engine = ParticleEngine()
        controller = ControlInterface(engine)
        assert hasattr(controller, 'pause')

    def test_resume_method_exists(self):
        """resume method should exist"""
        if ControlInterface is None or ParticleEngine is None:
            pytest.skip("ControlInterface/ParticleEngine not implemented yet")
        engine = ParticleEngine()
        controller = ControlInterface(engine)
        assert hasattr(controller, 'resume')

    def test_restart_method_exists(self):
        """restart method should exist"""
        if ControlInterface is None or ParticleEngine is None:
            pytest.skip("ControlInterface/ParticleEngine not implemented yet")
        engine = ParticleEngine()
        controller = ControlInterface(engine)
        assert hasattr(controller, 'restart')

    def test_skip_final_method_exists(self):
        """skip_to_final method should exist"""
        if ControlInterface is None or ParticleEngine is None:
            pytest.skip("ControlInterface/ParticleEngine not implemented yet")
        engine = ParticleEngine()
        controller = ControlInterface(engine)
        assert hasattr(controller, 'skip_to_final')

    def test_apply_settings_method_exists(self):
        """apply_settings method should exist with debounce"""
        if ControlInterface is None or ParticleEngine is None:
            pytest.skip("ControlInterface/ParticleEngine not implemented yet")
        engine = ParticleEngine()
        controller = ControlInterface(engine)
        assert hasattr(controller, 'apply_settings')

    def test_pause_resume_idempotent(self):
        """Test that pause/resume operations are idempotent"""
        if ControlInterface is None or ParticleEngine is None or Settings is None or Image is None:
            pytest.skip("Dependencies not available")
            
        # Mock the entire engine and time to avoid complexity
        from unittest.mock import MagicMock
        
        with patch('time.time') as mock_time:
            # Mock time - start at 1.0 to ensure debounce passes on first call
            # (1.0 - 0.0) * 1000 = 1000ms which is > 100ms debounce threshold
            times = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0, 12.0, 13.0, 14.0, 15.0]
            mock_time.side_effect = times
            
            engine = MagicMock()
            controller = ControlInterface(engine)
            settings = Settings()
            
            # Mock engine state to simulate successful initialization
            engine.init.return_value = None
            engine.start.return_value = None
            
            # Test pause/resume flow
            result = controller.start(settings, "test.jpg")
            assert result == True, "Start should succeed with mocked engine"
            
            # Pause should work from running state 
            assert controller.pause() == True, "First pause should succeed"
            # Second pause should return False (already paused)
            assert controller.pause() == False, "Second pause should return False (already paused)"
            
            # Resume should work from paused state
            assert controller.resume() == True, "First resume should succeed" 
            # Second resume should return False (already running)
            assert controller.resume() == False, "Second resume should return False (already running)"

    def test_restart_debounce_behavior(self):
        """Restart should have debounce to prevent accidental double-restart"""
        import time
        from unittest.mock import patch, Mock
        from src.point_shoting.services.particle_engine import ParticleEngine
        from src.point_shoting.cli.control_interface import ControlInterface
        from src.point_shoting.models.settings import Settings
        
        engine = ParticleEngine()
        controller = ControlInterface(engine)
        settings = Settings()
        
        with patch('PIL.Image.open') as mock_open:
            mock_img = Mock()
            mock_img.size = (100, 100)
            mock_img.convert.return_value = mock_img
            mock_open.return_value = mock_img
            
            # Start first session
            assert controller.start(settings, "test.jpg") == True
            
            # First restart should work
            assert controller.restart() == True
            
            # Immediate second restart should be debounced (return False)
            assert controller.restart() == False
            
            # After debounce period, restart should work again
            time.sleep(0.6)  # Wait longer than 500ms debounce
            assert controller.restart() == True

    def test_apply_settings_debounce_behavior(self):
        """apply_settings should debounce rapid calls"""
        import time
        from unittest.mock import patch, Mock
        from src.point_shoting.services.particle_engine import ParticleEngine
        from src.point_shoting.cli.control_interface import ControlInterface
        from src.point_shoting.models.settings import Settings, DensityProfile
        
        engine = ParticleEngine()
        controller = ControlInterface(engine)
        
        with patch('PIL.Image.open') as mock_open:
            mock_img = Mock()
            mock_img.size = (100, 100)
            mock_img.convert.return_value = mock_img
            mock_open.return_value = mock_img
            
            # Start session
            settings1 = Settings(density_profile=DensityProfile.LOW)
            assert controller.start(settings1, "test.jpg") == True
            
            # Apply new settings
            settings2 = Settings(density_profile=DensityProfile.MEDIUM)
            assert controller.apply_settings(settings2) == True
            
            # Immediate second apply should be debounced (return False)
            settings3 = Settings(density_profile=DensityProfile.HIGH)
            assert controller.apply_settings(settings3) == False
            
            # After debounce period, apply should work again
            time.sleep(0.15)  # Wait longer than 100ms debounce
            assert controller.apply_settings(settings3) == True
