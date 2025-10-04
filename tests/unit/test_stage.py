"""Unit tests for Stage model"""

import pytest

from point_shoting.models.stage import Stage


class TestStage:
    """Test Stage enum and methods"""

    def test_stage_enum_values(self):
        """Test all stage enum values exist"""
        assert Stage.PRE_START
        assert Stage.BURST
        assert Stage.CHAOS
        assert Stage.CONVERGING
        assert Stage.FORMATION
        assert Stage.FINAL_BREATHING

    def test_str_representation(self):
        """Test string representation"""
        assert str(Stage.BURST) == "BURST"
        assert str(Stage.FINAL_BREATHING) == "FINAL_BREATHING"

    def test_display_name(self):
        """Test human-readable display names"""
        assert Stage.BURST.display_name == "Burst"
        assert Stage.FINAL_BREATHING.display_name == "Final Breathing"
        assert Stage.CONVERGING.display_name == "Converging"

    def test_is_active(self):
        """Test is_active method"""
        assert not Stage.PRE_START.is_active()
        assert Stage.BURST.is_active()
        assert Stage.CHAOS.is_active()
        assert Stage.CONVERGING.is_active()
        assert Stage.FORMATION.is_active()
        assert Stage.FINAL_BREATHING.is_active()

    def test_allows_settings_change(self):
        """Test allows_settings_change method"""
        assert Stage.PRE_START.allows_settings_change()
        assert not Stage.BURST.allows_settings_change()
        assert not Stage.CHAOS.allows_settings_change()
        assert not Stage.CONVERGING.allows_settings_change()
        assert not Stage.FORMATION.allows_settings_change()
        assert not Stage.FINAL_BREATHING.allows_settings_change()

    def test_from_string(self):
        """Test from_string method"""
        assert Stage.from_string("BURST") == Stage.BURST
        assert Stage.from_string("final_breathing") == Stage.FINAL_BREATHING
        assert Stage.from_string("chaos") == Stage.CHAOS

    def test_from_string_invalid(self):
        """Test from_string with invalid input"""
        with pytest.raises(ValueError, match="Unknown stage"):
            Stage.from_string("INVALID_STAGE")

    def test_next_stage(self):
        """Test next_stage method"""
        assert Stage.PRE_START.next_stage() == Stage.BURST
        assert Stage.BURST.next_stage() == Stage.CHAOS
        assert Stage.CHAOS.next_stage() == Stage.CONVERGING
        assert Stage.CONVERGING.next_stage() == Stage.FORMATION
        assert Stage.FORMATION.next_stage() == Stage.FINAL_BREATHING
        assert Stage.FINAL_BREATHING.next_stage() == Stage.PRE_START

    def test_get_max_velocity(self):
        """Test get_max_velocity method"""
        # Test default speed profile
        assert Stage.BURST.get_max_velocity() == 2.0
        assert Stage.CHAOS.get_max_velocity() == 1.5
        assert Stage.CONVERGING.get_max_velocity() == 1.0
        assert Stage.FORMATION.get_max_velocity() == 0.5
        assert Stage.FINAL_BREATHING.get_max_velocity() == 0.1
        assert Stage.PRE_START.get_max_velocity() == 0.0

    def test_get_max_velocity_speed_profiles(self):
        """Test get_max_velocity with different speed profiles"""
        # Test slow profile
        assert Stage.BURST.get_max_velocity("slow") == 2.0 * 0.7
        assert Stage.CHAOS.get_max_velocity("slow") == 1.5 * 0.7

        # Test fast profile
        assert Stage.BURST.get_max_velocity("fast") == 2.0 * 1.4
        assert Stage.CHAOS.get_max_velocity("fast") == 1.5 * 1.4

        # Test normal profile (default)
        assert Stage.BURST.get_max_velocity("normal") == 2.0 * 1.0

    def test_get_max_velocity_invalid_profile(self):
        """Test get_max_velocity with invalid speed profile"""
        # Should use default multiplier of 1.0 for invalid profiles
        assert Stage.BURST.get_max_velocity("invalid") == 2.0
