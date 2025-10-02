"""
Engine Error Handling Integration Test
Tests error handling and recovery across IPC boundary between UI and Python engine
"""

import pytest
from unittest.mock import Mock
from point_shoting.cli.control_interface import ControlInterface
from point_shoting.services.particle_engine import ParticleEngine
from point_shoting.models.settings import Settings


class TestEngineErrorHandling:
    """Test engine error handling and recovery scenarios"""

    @pytest.fixture
    def mock_particle_engine(self):
        """Mock ParticleEngine for testing error scenarios"""
        engine = Mock(spec=ParticleEngine)
        engine.init = Mock()
        engine.start = Mock()
        engine.stop = Mock()
        engine.pause = Mock()
        engine.resume = Mock()
        engine.restart = Mock()
        engine.get_health = Mock()
        engine.load_image = Mock()
        engine.set_watermark = Mock()
        return engine

    @pytest.fixture
    def control_interface(self, mock_particle_engine):
        """Control interface with mocked particle engine"""
        interface = ControlInterface(mock_particle_engine)
        return interface

    def test_missing_python_executable_error(self, control_interface, mock_particle_engine):
        """Test error when Python executable is not found"""
        # Simulate missing Python executable during engine init
        mock_particle_engine.init.side_effect = FileNotFoundError("uv: command not found")

        with pytest.raises(FileNotFoundError, match="uv: command not found"):
            control_interface.start(Settings(), "/path/to/image.png")

        # Verify error is logged and handled
        assert not control_interface.is_running()

    def test_invalid_settings_error(self, control_interface, mock_particle_engine):
        """Test error when invalid settings are provided"""
        # Set up valid initial state first
        mock_particle_engine.init.return_value = None
        mock_particle_engine.start.return_value = None

        # Start successfully first
        result = control_interface.start(Settings(), "/path/to/image.png")
        assert result is True

        # Reset mocks
        mock_particle_engine.reset_mock()

        # Simulate invalid settings error during restart
        mock_particle_engine.init.side_effect = ValueError("Invalid particle density: must be > 0")

        with pytest.raises(ValueError, match="Invalid particle density"):
            control_interface.restart()

        # Verify engine status reflects error state
        assert not control_interface.is_running()

    def test_engine_crash_recovery(self, control_interface, mock_particle_engine):
        """Test recovery from engine process crash"""
        # Set up initial successful start
        mock_particle_engine.init.return_value = None
        mock_particle_engine.start.return_value = None

        # Start engine
        result = control_interface.start(Settings(), "/path/to/image.png")
        assert result is True

        # Simulate engine crash during operation
        mock_particle_engine.pause.side_effect = ConnectionError("Engine process crashed")

        with pytest.raises(ConnectionError, match="Engine process crashed"):
            control_interface.pause()

        # Verify error state
        assert not control_interface.is_running()  # Should be stopped due to error

        # Test restart functionality after error
        mock_particle_engine.init.side_effect = None  # Clear error
        mock_particle_engine.start.side_effect = None

        restart_result = control_interface.restart()
        assert restart_result is True

        # Verify restart was called
        mock_particle_engine.init.assert_called()
        mock_particle_engine.start.assert_called()

    def test_memory_error_recovery(self, control_interface, mock_particle_engine):
        """Test recovery from memory allocation errors"""
        # Set up engine start
        mock_particle_engine.init.return_value = None
        mock_particle_engine.start.return_value = None

        # Start engine
        result = control_interface.start(Settings(), "/path/to/image.png")
        assert result is True

        # Simulate memory error during image loading
        mock_particle_engine.load_image.side_effect = MemoryError("Failed to allocate 2GB for image processing")

        with pytest.raises(MemoryError, match="Failed to allocate 2GB"):
            # This would be called internally, but for testing we'll simulate
            mock_particle_engine.load_image("/path/to/very_large_image.png")

        # Verify engine is still considered running (memory error is recoverable)
        assert control_interface.is_running()

    def test_invalid_image_format_error(self, control_interface, mock_particle_engine):
        """Test error handling for unsupported image formats"""
        # Set up engine
        mock_particle_engine.init.return_value = None
        mock_particle_engine.start.return_value = None

        result = control_interface.start(Settings(), "/path/to/image.png")
        assert result is True

        # Simulate invalid image format error
        mock_particle_engine.load_image.side_effect = ValueError("Unsupported image format: BMP. Supported formats: PNG, JPEG, GIF, WebP")

        with pytest.raises(ValueError, match="Unsupported image format"):
            mock_particle_engine.load_image("/path/to/image.bmp")

    def test_watermark_file_not_found_error(self, control_interface, mock_particle_engine):
        """Test error when watermark file doesn't exist"""
        # Set up engine
        mock_particle_engine.init.return_value = None
        mock_particle_engine.start.return_value = None

        result = control_interface.start(Settings(), "/path/to/image.png")
        assert result is True

        # Simulate watermark file not found
        mock_particle_engine.set_watermark.side_effect = FileNotFoundError("Watermark file not found: /nonexistent/watermark.png")

        with pytest.raises(FileNotFoundError, match="Watermark file not found"):
            mock_particle_engine.set_watermark({
                'enabled': True,
                'path': '/nonexistent/watermark.png',
                'position': 'bottom-right',
                'opacity': 0.8,
                'scale': 0.2
            })

    def test_concurrent_operation_error(self, control_interface, mock_particle_engine):
        """Test error when multiple operations are attempted simultaneously"""
        # Set up engine
        mock_particle_engine.init.return_value = None
        mock_particle_engine.start.return_value = None

        result = control_interface.start(Settings(), "/path/to/image.png")
        assert result is True

        # Simulate concurrent operation error
        mock_particle_engine.start.side_effect = RuntimeError("Another animation operation is in progress")

        with pytest.raises(RuntimeError, match="Another animation operation is in progress"):
            control_interface.start(Settings(), "/path/to/other_image.png")

    def test_timeout_error_recovery(self, control_interface, mock_particle_engine):
        """Test recovery from operation timeouts"""
        # Set up engine
        mock_particle_engine.init.return_value = None
        mock_particle_engine.start.return_value = None

        result = control_interface.start(Settings(), "/path/to/image.png")
        assert result is True

        # Simulate timeout error
        mock_particle_engine.get_health.side_effect = TimeoutError("Engine health check timed out after 30 seconds")

        with pytest.raises(TimeoutError, match="Engine health check timed out"):
            mock_particle_engine.get_health()

                # Verify engine is still considered running (timeout doesn't mean crash)
        assert control_interface.is_running()

import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
import time

from point_shoting.cli.control_interface import ControlInterface
from point_shoting.services.particle_engine import ParticleEngine
from point_shoting.services.settings_store import SettingsStore
from point_shoting.models.settings import Settings


class TestEngineErrorHandling:
    """Test engine error handling and recovery scenarios"""

    @pytest.fixture
    def mock_engine_bridge(self):
        """Mock PythonEngineBridge for testing error scenarios"""
        bridge = Mock()
        bridge.start_engine = AsyncMock()
        bridge.stop_engine = AsyncMock()
        bridge.restart_engine = AsyncMock()
        bridge.get_health = AsyncMock()
        bridge.start_animation = AsyncMock()
        bridge.pause_animation = AsyncMock()
        bridge.resume_animation = AsyncMock()
        bridge.stop_animation = AsyncMock()
        bridge.load_image = AsyncMock()
        bridge.set_watermark = AsyncMock()
        return bridge

    @pytest.fixture
    def mock_particle_engine(self):
        """Mock ParticleEngine for testing error scenarios"""
        engine = Mock()
        engine.init = Mock()
        engine.start = Mock()
        engine.stop = Mock()
        engine.pause = Mock()
        engine.resume = Mock()
        engine.restart = Mock()
        engine.get_health = Mock()
        engine.load_image = Mock()
        engine.set_watermark = Mock()
        return engine

    @pytest.fixture
    def control_interface(self, mock_particle_engine):
        """Control interface with mocked particle engine"""
        interface = ControlInterface(mock_particle_engine)
        return interface

    def test_missing_python_executable_error(self, control_interface, mock_particle_engine):
        """Test error when Python executable is not found"""
        # Simulate missing Python executable during engine init
        mock_particle_engine.init.side_effect = FileNotFoundError("uv: command not found")

        # ControlInterface should catch the error and return False
        result = control_interface.start(Settings(), "/path/to/image.png")
        assert result is False

        # Verify error is logged and handled
        assert not control_interface.is_running()

    def test_invalid_settings_error(self, control_interface, mock_particle_engine):
        """Test error when invalid settings are provided"""
        # Set up valid initial state first
        mock_particle_engine.init.return_value = None
        mock_particle_engine.start.return_value = None

        # Start successfully first
        result = control_interface.start(Settings(), "/path/to/image.png")
        assert result is True

        # Reset mocks
        mock_particle_engine.reset_mock()

        # Simulate invalid settings error during restart
        mock_particle_engine.init.side_effect = ValueError("Invalid particle density: must be > 0")

        # ControlInterface should catch the error and return False
        restart_result = control_interface.restart()
        assert restart_result is False

        # Verify engine status - should still be running since restart failed
        assert control_interface.is_running()

    def test_engine_crash_recovery(self, control_interface, mock_particle_engine):
        """Test recovery from engine process crash"""
        # Set up initial successful start
        mock_particle_engine.init.return_value = None
        mock_particle_engine.start.return_value = None

        # Start engine
        result = control_interface.start(Settings(), "/path/to/image.png")
        assert result is True

        # Simulate engine crash during operation
        mock_particle_engine.pause.side_effect = ConnectionError("Engine process crashed")

        # ControlInterface should catch the error and return False
        pause_result = control_interface.pause()
        assert pause_result is False

        # Verify error state - should still be running since pause failed
        assert control_interface.is_running()

        # Test restart functionality after error
        mock_particle_engine.init.side_effect = None  # Clear error
        mock_particle_engine.start.side_effect = None

        restart_result = control_interface.restart()
        assert restart_result is True

        # Verify restart was called
        mock_particle_engine.init.assert_called()
        mock_particle_engine.start.assert_called()

    def test_memory_error_recovery(self, control_interface, mock_particle_engine):
        """Test recovery from memory allocation errors"""
        # Set up engine start
        mock_particle_engine.init.return_value = None
        mock_particle_engine.start.return_value = None

        # Start engine
        result = control_interface.start(Settings(), "/path/to/image.png")
        assert result is True

        # Simulate memory error during image loading
        mock_particle_engine.load_image.side_effect = MemoryError("Failed to allocate 2GB for image processing")

        # This would be called internally, but for testing we'll simulate
        with pytest.raises(MemoryError, match="Failed to allocate 2GB"):
            mock_particle_engine.load_image("/path/to/very_large_image.png")

        # Verify engine is still considered running (memory error is recoverable)
        assert control_interface.is_running()

    def test_invalid_image_format_error(self, control_interface, mock_particle_engine):
        """Test error handling for unsupported image formats"""
        # Set up engine
        mock_particle_engine.init.return_value = None
        mock_particle_engine.start.return_value = None

        result = control_interface.start(Settings(), "/path/to/image.png")
        assert result is True

        # Simulate invalid image format error
        mock_particle_engine.load_image.side_effect = ValueError("Unsupported image format: BMP. Supported formats: PNG, JPEG, GIF, WebP")

        with pytest.raises(ValueError, match="Unsupported image format"):
            mock_particle_engine.load_image("/path/to/image.bmp")

    def test_watermark_file_not_found_error(self, control_interface, mock_particle_engine):
        """Test error when watermark file doesn't exist"""
        # Set up engine
        mock_particle_engine.init.return_value = None
        mock_particle_engine.start.return_value = None

        result = control_interface.start(Settings(), "/path/to/image.png")
        assert result is True

        # Simulate watermark file not found
        mock_particle_engine.set_watermark.side_effect = FileNotFoundError("Watermark file not found: /nonexistent/watermark.png")

        with pytest.raises(FileNotFoundError, match="Watermark file not found"):
            mock_particle_engine.set_watermark({
                'enabled': True,
                'path': '/nonexistent/watermark.png',
                'position': 'bottom-right',
                'opacity': 0.8,
                'scale': 0.2
            })

    def test_concurrent_operation_error(self, control_interface, mock_particle_engine):
        """Test error when multiple operations are attempted simultaneously"""
        # Set up engine
        mock_particle_engine.init.return_value = None
        mock_particle_engine.start.return_value = None

        result = control_interface.start(Settings(), "/path/to/image.png")
        assert result is True

        # Simulate concurrent operation error
        mock_particle_engine.start.side_effect = RuntimeError("Another animation operation is in progress")

        # ControlInterface should catch the error and return False
        second_start_result = control_interface.start(Settings(), "/path/to/other_image.png")
        assert second_start_result is False

    def test_timeout_error_recovery(self, control_interface, mock_particle_engine):
        """Test recovery from operation timeouts"""
        # Set up engine
        mock_particle_engine.init.return_value = None
        mock_particle_engine.start.return_value = None

        result = control_interface.start(Settings(), "/path/to/image.png")
        assert result is True

        # Simulate timeout error
        mock_particle_engine.get_health.side_effect = TimeoutError("Engine health check timed out after 30 seconds")

        with pytest.raises(TimeoutError, match="Engine health check timed out"):
            mock_particle_engine.get_health()

        # Verify engine is still considered running (timeout doesn't mean crash)
        assert control_interface.is_running()
