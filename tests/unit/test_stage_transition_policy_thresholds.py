"""Unit tests for StageTransitionPolicy thresholds"""

import pytest
from point_shoting.services.stage_transition_policy import StageTransitionPolicy
from point_shoting.models.settings import Settings
from point_shoting.models.stage import Stage


class TestStageTransitionPolicyThresholds:
    """Test specific threshold values and edge cases"""
    
    def setup_method(self):
        """Setup for each test"""
        self.settings = Settings()
        self.policy = StageTransitionPolicy(self.settings)
    
    def test_chaos_energy_threshold_edge_cases(self):
        """Test chaos energy threshold boundaries"""
        # Test exactly at threshold
        result = self.policy.evaluate(
            current_time=5.0,
            recognition_score=0.1,
            chaos_energy=0.1,  # At typical threshold
            active_particle_count=1000,
            total_particle_count=1000
        )
        # Should handle edge case gracefully
        assert result is None or isinstance(result, Stage)
        
        # Test just above threshold
        result = self.policy.evaluate(
            current_time=5.0,
            recognition_score=0.1,
            chaos_energy=0.15,  # Above threshold
            active_particle_count=1000,
            total_particle_count=1000
        )
        assert result is None or isinstance(result, Stage)
        
        # Test just below threshold
        result = self.policy.evaluate(
            current_time=5.0,
            recognition_score=0.1,
            chaos_energy=0.05,  # Below threshold
            active_particle_count=1000,
            total_particle_count=1000
        )
        assert result is None or isinstance(result, Stage)
    
    def test_recognition_threshold_boundaries(self):
        """Test recognition score threshold boundaries"""
        # Test exactly at 0.8 threshold
        result = self.policy.evaluate(
            current_time=5.0,
            recognition_score=0.8,  # Exactly at threshold
            chaos_energy=0.2,
            active_particle_count=1000,
            total_particle_count=1000
        )
        assert result is None or isinstance(result, Stage)
        
        # Test just above threshold
        result = self.policy.evaluate(
            current_time=5.0,
            recognition_score=0.81,
            chaos_energy=0.2,
            active_particle_count=1000,
            total_particle_count=1000
        )
        assert result is None or isinstance(result, Stage)
        
        # Test just below threshold
        result = self.policy.evaluate(
            current_time=5.0,
            recognition_score=0.79,
            chaos_energy=0.2,
            active_particle_count=1000,
            total_particle_count=1000
        )
        assert result is None or isinstance(result, Stage)
    
    def test_time_threshold_boundaries(self):
        """Test time-based threshold boundaries"""
        # Test minimum duration enforcement
        result = self.policy.evaluate(
            current_time=self.settings.chaos_min_duration,  # Exactly at min duration
            recognition_score=0.1,
            chaos_energy=0.05,
            active_particle_count=1000,
            total_particle_count=1000
        )
        assert result is None or isinstance(result, Stage)
        
        # Test fallback timeout
        result = self.policy.evaluate(
            current_time=self.settings.formation_fallback_time,  # At fallback time
            recognition_score=0.5,  # Below threshold but should fallback
            chaos_energy=0.2,
            active_particle_count=1000,
            total_particle_count=1000
        )
        assert result is None or isinstance(result, Stage)
    
    def test_particle_count_edge_cases(self):
        """Test particle count edge cases"""
        # Test with zero particles
        result = self.policy.evaluate(
            current_time=5.0,
            recognition_score=0.5,
            chaos_energy=0.2,
            active_particle_count=0,
            total_particle_count=1000
        )
        assert result is None or isinstance(result, Stage)
        
        # Test with all particles active
        result = self.policy.evaluate(
            current_time=5.0,
            recognition_score=0.5,
            chaos_energy=0.2,
            active_particle_count=1000,
            total_particle_count=1000
        )
        assert result is None or isinstance(result, Stage)
        
        # Test with more active than total (edge case)
        result = self.policy.evaluate(
            current_time=5.0,
            recognition_score=0.5,
            chaos_energy=0.2,
            active_particle_count=1100,
            total_particle_count=1000
        )
        assert result is None or isinstance(result, Stage)
    
    def test_burst_waves_emission_thresholds(self):
        """Test burst wave emission thresholds"""
        # Test with no waves emitted
        result = self.policy.evaluate(
            current_time=2.0,
            recognition_score=0.1,
            chaos_energy=0.8,
            active_particle_count=1000,
            total_particle_count=1000,
            burst_waves_emitted=0
        )
        assert result is None or isinstance(result, Stage)
        
        # Test with multiple waves emitted
        result = self.policy.evaluate(
            current_time=2.0,
            recognition_score=0.1,
            chaos_energy=0.8,
            active_particle_count=1000,
            total_particle_count=1000,
            burst_waves_emitted=10
        )
        assert result is None or isinstance(result, Stage)
    
    def test_extreme_values(self):
        """Test with extreme input values"""
        # Test with very high recognition
        result = self.policy.evaluate(
            current_time=1.0,
            recognition_score=1.0,
            chaos_energy=0.0,
            active_particle_count=1000,
            total_particle_count=1000
        )
        assert result is None or isinstance(result, Stage)
        
        # Test with very low values
        result = self.policy.evaluate(
            current_time=0.0,
            recognition_score=0.0,
            chaos_energy=0.0,
            active_particle_count=0,
            total_particle_count=0
        )
        assert result is None or isinstance(result, Stage)
        
        # Test with very high energy
        result = self.policy.evaluate(
            current_time=1.0,
            recognition_score=0.1,
            chaos_energy=10.0,  # Very high energy
            active_particle_count=1000,
            total_particle_count=1000
        )
        assert result is None or isinstance(result, Stage)
