"""Unit tests for HUDRenderer service"""

from unittest.mock import patch

from point_shoting.models.metrics import Metrics
from point_shoting.models.stage import Stage
from point_shoting.services.hud_renderer import (
    HUDLevel,
    HUDMetrics,
    HUDRenderer,
    PerformanceBudget,
)


class TestHUDRenderer:
    """Comprehensive unit tests for HUDRenderer"""

    def setup_method(self):
        """Setup test fixtures"""
        self.renderer = HUDRenderer()
        self.sample_metrics = Metrics(
            fps_avg=60.0,
            fps_instant=58.5,
            frame_time_ms=16.7,
            particle_count=9000,
            stage=Stage.FORMATION,
            recognition=0.85,
        )

    def test_initialization(self):
        """Test HUD renderer initialization"""
        assert self.renderer._level == HUDLevel.STANDARD
        assert self.renderer._enabled is True
        assert self.renderer._budget.max_render_time_ms == 5.0
        assert self.renderer._budget.max_memory_mb == 10.0
        assert self.renderer._budget.max_updates_per_sec == 30

    def test_configure(self):
        """Test configuration method"""
        self.renderer.configure(
            level=HUDLevel.MINIMAL,
            max_render_time_ms=2.0,
            max_memory_mb=5.0,
            max_updates_per_sec=10,
        )

        assert self.renderer._level == HUDLevel.MINIMAL
        assert self.renderer._budget.max_render_time_ms == 2.0
        assert self.renderer._budget.max_memory_mb == 5.0
        assert self.renderer._budget.max_updates_per_sec == 10

    def test_render_dict_interface(self):
        """Test render method with dictionary interface"""
        metrics_dict = {
            "fps": 60.0,
            "stage": "FORMATION",
            "particle_count": 9000,
            "recognition": 0.85,
            "frame_time_ms": 16.7,
        }

        output = self.renderer.render(metrics_dict)
        assert isinstance(output, str)
        assert len(output) > 0
        assert "FORMATION" in output

    def test_render_with_stage_parameter(self):
        """Test render method with explicit stage parameter"""
        metrics_dict = {"fps": 60.0, "particle_count": 1000, "recognition": 0.5}

        output = self.renderer.render(metrics_dict, stage="CHAOS")
        assert isinstance(output, str)
        assert "CHAOS" in output

    def test_render_minimal_level(self):
        """Test minimal HUD level rendering"""
        self.renderer.configure(level=HUDLevel.MINIMAL)
        output = self.renderer.render({"fps": 60.0, "stage": "CHAOS"})

        assert isinstance(output, str)
        assert "CHAOS" in output
        assert "60.0" in output

    def test_render_detailed_level(self):
        """Test detailed HUD level rendering"""
        self.renderer.configure(level=HUDLevel.DETAILED)
        metrics_dict = {
            "fps": 60.0,
            "stage": "FORMATION",
            "particle_count": 9000,
            "recognition": 0.85,
        }

        output = self.renderer.render(metrics_dict)
        assert isinstance(output, str)
        assert "FORMATION" in output

    @patch("point_shoting.services.hud_renderer.RICH_AVAILABLE", False)
    def test_render_plain_text_fallback(self):
        """Test plain text rendering when Rich is not available"""
        metrics_dict = {
            "fps": 60.0,
            "stage": "CHAOS",
            "particle_count": 1000,
            "recognition": 0.5,
        }

        output = self.renderer.render(metrics_dict)
        assert isinstance(output, str)
        assert "Point Shooting HUD" in output
        assert "CHAOS" in output
        assert "60.0" in output

    def test_render_hud_method(self):
        """Test render_hud method with Metrics object"""
        result = self.renderer.render_hud(self.sample_metrics)
        assert isinstance(result, bool)

    def test_render_hud_disabled(self):
        """Test render_hud when disabled"""
        self.renderer.set_enabled(False)
        result = self.renderer.render_hud(self.sample_metrics)
        assert result is True  # Should return True when disabled

    def test_update_rate_limiting(self):
        """Test update rate limiting"""
        # Set very low update rate
        self.renderer.configure(max_updates_per_sec=1)  # 1 update per second

        # First call should work
        result1 = self.renderer.render_hud(self.sample_metrics)
        assert isinstance(result1, bool)

        # Second call immediately after should be rate limited
        result2 = self.renderer.render_hud(self.sample_metrics)
        assert result2 is True  # Rate limited, returns True

    def test_budget_violation_handling(self):
        """Test budget violation detection and auto-adjustment"""
        # Configure very tight budget
        self.renderer.configure(max_render_time_ms=0.001)  # 1 microsecond budget

        # This should cause budget violations
        for _ in range(10):
            self.renderer.render_hud(self.sample_metrics)

        # Check that violations were recorded
        stats = self.renderer.get_performance_stats()
        assert stats["metrics"]["budget_violations"] > 0

    def test_auto_adjust_level(self):
        """Test automatic level adjustment on budget violations"""
        # Start with detailed level
        self.renderer.configure(level=HUDLevel.DETAILED, max_render_time_ms=0.001)

        # Simulate multiple budget violations
        self.renderer._metrics.budget_violations = 6  # Trigger auto-adjustment
        self.renderer._auto_adjust_level()

        # Should have adjusted to standard level
        assert self.renderer._level == HUDLevel.STANDARD
        assert self.renderer._metrics.budget_violations == 0  # Reset after adjustment

    def test_performance_stats(self):
        """Test performance statistics collection"""
        # Do some renders to generate stats
        for _ in range(5):
            self.renderer.render_hud(self.sample_metrics)

        stats = self.renderer.get_performance_stats()

        assert "enabled" in stats
        assert "level" in stats
        assert "budget" in stats
        assert "metrics" in stats
        assert stats["enabled"] is True
        assert stats["level"] == "standard"
        assert stats["metrics"]["update_count"] >= 1

    def test_set_enabled(self):
        """Test enable/disable functionality"""
        assert self.renderer.is_enabled() is True

        self.renderer.set_enabled(False)
        assert self.renderer.is_enabled() is False

        self.renderer.set_enabled(True)
        assert self.renderer.is_enabled() is True

    def test_reset_metrics(self):
        """Test metrics reset functionality"""
        # Generate some metrics
        self.renderer.render_hud(self.sample_metrics)
        assert self.renderer._metrics.update_count > 0

        # Reset metrics
        self.renderer.reset_metrics()
        assert self.renderer._metrics.update_count == 0
        assert len(self.renderer._render_history) == 0

    def test_force_level(self):
        """Test forced level setting"""
        self.renderer.force_level(HUDLevel.MINIMAL)
        assert self.renderer._level == HUDLevel.MINIMAL
        assert self.renderer._metrics.budget_violations == 0

    def test_render_progress_bar(self):
        """Test progress bar rendering"""
        result = self.renderer.render_progress_bar(0.75, "Test Progress")
        assert isinstance(result, bool)

    def test_clear_method(self):
        """Test clear method"""
        # Should not raise exceptions
        self.renderer.clear()

    def test_get_budget_compliance_no_updates(self):
        """Test budget compliance with no updates"""
        compliance = self.renderer.get_budget_compliance()
        assert compliance == 1.0

    def test_get_budget_compliance_with_updates(self):
        """Test budget compliance calculation"""
        # Do some successful renders
        for _ in range(5):
            self.renderer.render_hud(self.sample_metrics)

        compliance = self.renderer.get_budget_compliance()
        assert 0.0 <= compliance <= 1.0

    def test_render_error_handling(self):
        """Test error handling in render method"""
        # Test with invalid stage
        invalid_metrics = {"fps": 60.0, "stage": "INVALID_STAGE"}
        output = self.renderer.render(invalid_metrics)
        assert isinstance(output, str)
        assert "HUD Render Error" in output

    def test_metrics_conversion(self):
        """Test metrics dictionary to Metrics object conversion"""
        metrics_dict = {
            "fps": 60.0,
            "fps_avg": 58.0,  # Should prefer fps_avg
            "frame_time_ms": 16.7,
            "particle_count": 1000,
            "stage": "CHAOS",
            "recognition": 0.8,
        }

        output = self.renderer.render(metrics_dict)
        assert isinstance(output, str)
        assert "CHAOS" in output

    def test_additional_info_rendering(self):
        """Test rendering with additional info"""
        additional_info = {"debug": True, "version": "1.0.0"}

        result = self.renderer.render_hud(self.sample_metrics, additional_info)
        assert isinstance(result, bool)

    def test_fallback_render_text(self):
        """Test fallback text rendering"""
        with patch("point_shoting.services.hud_renderer.RICH_AVAILABLE", False):
            result = self.renderer._perform_render(self.sample_metrics, None)
            assert isinstance(result, bool)

    def test_fallback_render_error(self):
        """Test fallback error rendering"""
        result = self.renderer._fallback_render("Test error")
        assert result is False

    def test_hud_level_enum_values(self):
        """Test HUD level enum values"""
        assert HUDLevel.MINIMAL.value == "minimal"
        assert HUDLevel.STANDARD.value == "standard"
        assert HUDLevel.DETAILED.value == "detailed"

    def test_performance_budget_defaults(self):
        """Test performance budget default values"""
        budget = PerformanceBudget()
        assert budget.max_render_time_ms == 5.0
        assert budget.max_memory_mb == 10.0
        assert budget.max_updates_per_sec == 30

    def test_hud_metrics_defaults(self):
        """Test HUD metrics default values"""
        metrics = HUDMetrics()
        assert metrics.render_times_ms == []
        assert metrics.memory_usage_mb == 0.0
        assert metrics.update_count == 0
        assert metrics.last_update_time == 0.0
        assert metrics.budget_violations == 0
