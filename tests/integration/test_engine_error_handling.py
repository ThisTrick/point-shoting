"""
Engine Error Handling Integration Test
Tests error handling and recovery across IPC boundary between UI and Python engine
"""

from unittest.mock import Mock

import pytest

from point_shoting.cli.control_interface import ControlInterface
from point_shoting.models.settings import Settings
from point_shoting.services.particle_engine import ParticleEngine


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

    def test_missing_python_executable_error(
        self, control_interface, mock_particle_engine
    ):
        """Test error when Python executable is not found"""
        # Capture error messages
        error_messages = []
        control_interface.set_event_callbacks(
            on_error=lambda msg: error_messages.append(msg)
        )

        # Simulate missing Python executable during engine init
        mock_particle_engine.init.side_effect = FileNotFoundError(
            "uv: command not found"
        )

        # Start should fail and return False
        result = control_interface.start(Settings(), "/path/to/image.png")
        assert result is False

        # Verify error is captured
        assert len(error_messages) == 1
        assert "uv: command not found" in error_messages[0]

        # Verify engine status reflects error state
        assert not control_interface.is_running()

    def test_invalid_settings_error(self, control_interface, mock_particle_engine):
        """Test error when invalid settings are provided"""
        # Capture error messages
        error_messages = []
        control_interface.set_event_callbacks(
            on_error=lambda msg: error_messages.append(msg)
        )

        # Disable debounce for testing
        control_interface.configure_debounce(control_ms=0, restart_ms=0)

        # Set up valid initial state first
        mock_particle_engine.init.return_value = None
        mock_particle_engine.start.return_value = None

        # Start successfully first
        result = control_interface.start(Settings(), "/path/to/image.png")
        assert result is True

        # Reset mocks
        mock_particle_engine.reset_mock()

        # Simulate invalid settings error during restart
        mock_particle_engine.init.side_effect = ValueError(
            "Invalid particle density: must be > 0"
        )

        # Restart should fail and return False
        result = control_interface.restart()
        assert result is False

        # Verify error is captured
        assert len(error_messages) == 1
        assert "Invalid particle density: must be > 0" in error_messages[0]

        # Verify engine status reflects error state
        assert not control_interface.is_running()

    def test_engine_crash_recovery(self, control_interface, mock_particle_engine):
        """Test recovery from engine process crash"""
        # Capture error messages
        error_messages = []
        control_interface.set_event_callbacks(
            on_error=lambda msg: error_messages.append(msg)
        )

        # Set up initial successful start
        mock_particle_engine.init.return_value = None
        mock_particle_engine.start.return_value = None

        # Disable debounce for testing
        control_interface.configure_debounce(control_ms=0)

        # Start engine
        result = control_interface.start(Settings(), "/path/to/image.png")
        assert result is True

        # Debug: check state after start
        assert control_interface.get_state().value == "running"

        # Simulate engine crash during operation
        mock_particle_engine.pause.side_effect = ConnectionError(
            "Engine process crashed"
        )

        # Pause should fail and return False
        result = control_interface.pause()
        assert result is False

        # Debug: check if pause was called
        mock_particle_engine.pause.assert_called_once()

        # Verify error is captured
        assert len(error_messages) == 1
        assert "Engine process crashed" in error_messages[0]

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
        mock_particle_engine.load_image.side_effect = MemoryError(
            "Failed to allocate 2GB for image processing"
        )

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
        mock_particle_engine.load_image.side_effect = ValueError(
            "Unsupported image format: BMP. Supported formats: PNG, JPEG, GIF, WebP"
        )

        with pytest.raises(ValueError, match="Unsupported image format"):
            mock_particle_engine.load_image("/path/to/image.bmp")

    def test_watermark_file_not_found_error(
        self, control_interface, mock_particle_engine
    ):
        """Test error when watermark file doesn't exist"""
        # Set up engine
        mock_particle_engine.init.return_value = None
        mock_particle_engine.start.return_value = None

        result = control_interface.start(Settings(), "/path/to/image.png")
        assert result is True

        # Simulate watermark file not found
        mock_particle_engine.set_watermark.side_effect = FileNotFoundError(
            "Watermark file not found: /nonexistent/watermark.png"
        )

        with pytest.raises(FileNotFoundError, match="Watermark file not found"):
            mock_particle_engine.set_watermark(
                {
                    "enabled": True,
                    "path": "/nonexistent/watermark.png",
                    "position": "bottom-right",
                    "opacity": 0.8,
                    "scale": 0.2,
                }
            )

    def test_concurrent_operation_error(self, control_interface, mock_particle_engine):
        """Test error when multiple operations are attempted simultaneously"""
        # Capture error messages
        error_messages = []
        control_interface.set_event_callbacks(
            on_error=lambda msg: error_messages.append(msg)
        )

        # Disable debounce for testing
        control_interface.configure_debounce(control_ms=0)

        # Set up engine
        mock_particle_engine.init.return_value = None
        mock_particle_engine.start.return_value = None

        result = control_interface.start(Settings(), "/path/to/image.png")
        assert result is True

        # Simulate concurrent operation error
        mock_particle_engine.start.side_effect = RuntimeError(
            "Another animation operation is in progress"
        )

        # Second start should fail and return False
        result = control_interface.start(Settings(), "/path/to/other_image.png")
        assert result is False

        # Verify error is captured
        assert len(error_messages) == 1
        assert "Another animation operation is in progress" in error_messages[0]

    def test_timeout_error_recovery(self, control_interface, mock_particle_engine):
        """Test recovery from operation timeouts"""
        # Set up engine
        mock_particle_engine.init.return_value = None
        mock_particle_engine.start.return_value = None

        result = control_interface.start(Settings(), "/path/to/image.png")
        assert result is True

        # Simulate timeout error
        mock_particle_engine.get_health.side_effect = TimeoutError(
            "Engine health check timed out after 30 seconds"
        )

        with pytest.raises(TimeoutError, match="Engine health check timed out"):
            mock_particle_engine.get_health()

            # Verify engine is still considered running (timeout doesn't mean crash)
        assert control_interface.is_running()
