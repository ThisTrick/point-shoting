"""Contract test for HUDRenderer"""

import pytest

# Import will fail until implementation exists - that's expected for TDD
try:
    from point_shoting.services.hud_renderer import HUDRenderer
except ImportError:
    HUDRenderer = None


@pytest.mark.contract 
class TestHUDRendererContract:
    """Test HUDRenderer output format and performance budget"""

    def test_hud_renderer_import_exists(self):
        """HUDRenderer class should be importable"""
        assert HUDRenderer is not None, "HUDRenderer class not implemented yet"

    def test_render_method_exists(self):
        """render method should exist and return string"""
        renderer = HUDRenderer()
        assert hasattr(renderer, 'render')
        
        # Test basic render call
        metrics_dict = {'fps': 60.0, 'stage': 'CHAOS', 'particle_count': 1000}
        output = renderer.render(metrics_dict)
        assert isinstance(output, str)

    def test_render_output_type_string(self):
        """render method should return string output"""
        renderer = HUDRenderer()
        metrics = {'fps': 60.0, 'recognition': 0.5, 'stage': 'CHAOS'}
        output = renderer.render(metrics)
        assert isinstance(output, str)
        assert len(output) > 0

    def test_performance_budget_mocked(self):
        """HUD rendering should meet performance budget (≤5% FPS impact)"""
        # This will be mocked initially, then tested with real timing
        # Target: HUD render time ≤ 0.8ms @ 60 FPS for 5% budget
        renderer = HUDRenderer()
        renderer.configure(max_render_time_ms=0.83)  # 5% of 16.67ms frame
        
        metrics = {'fps': 60.0, 'recognition': 0.5, 'stage': 'CHAOS', 'particle_count': 1000}
        
        # Multiple renders to test performance consistency
        for _ in range(10):
            output = renderer.render(metrics)
            assert isinstance(output, str)
        
        # Check budget compliance
        compliance = renderer.get_budget_compliance()
        assert compliance >= 0.8, f"Budget compliance too low: {compliance:.2f}"

    def test_rich_vs_plain_branches(self):
        """Should support both rich-formatted and plain text output"""
        renderer = HUDRenderer()
        metrics = {'fps': 60.0, 'recognition': 0.5, 'stage': 'CHAOS', 'particle_count': 1000}
        
        # Test that it works regardless of Rich availability
        output = renderer.render(metrics)
        assert isinstance(output, str)
        assert len(output) > 0
        
        # Should contain basic metrics
        assert 'CHAOS' in output
        assert '60.0' in output or '60' in output

    def test_metrics_dict_handling(self):
        """Should handle standard metrics dictionary format"""
        # Test with fps_avg, fps_instant, particle_count, stage, recognition
        renderer = HUDRenderer()
        
        full_metrics = {
            'fps': 58.5,
            'frame_time_ms': 17.2,
            'particle_count': 9000,
            'stage': 'FORMATION',
            'stage_progress': 0.75,
            'recognition': 0.85
        }
        
        output = renderer.render(full_metrics)
        assert isinstance(output, str)
        assert len(output) > 0
        
        # Check that key metrics appear in output
        assert 'FORMATION' in output
        assert '9000' in output or '9,000' in output
        assert '85' in output or '0.85' in output  # Recognition score
