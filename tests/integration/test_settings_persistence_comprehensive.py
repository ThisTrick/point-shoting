"""
Settings persistence comprehensive test.
Tests that settings are properly saved, loaded, and maintained across sessions.
"""

import json

import pytest

from src.point_shoting.models.settings import (
    ColorMode,
    DensityProfile,
    Settings,
    SpeedProfile,
)
from src.point_shoting.services.settings_store import SettingsStore


@pytest.mark.integration
class TestSettingsPersistence:
    """Test comprehensive settings persistence behavior"""

    def test_settings_save_and_load_cycle(self, tmp_path):
        """Test complete save/load cycle preserves all settings"""
        settings_file = tmp_path / "settings.json"

        # Create settings store
        store = SettingsStore()

        # Create custom settings
        original_settings = Settings(
            density_profile=DensityProfile.HIGH,
            speed_profile=SpeedProfile.FAST,
            burst_intensity=5,
            color_mode=ColorMode.PRECISE,
            loop_mode=True,
            breathing_amplitude=0.025,
            watermark_path="/path/to/watermark.png",
            locale="uk",
            hud_enabled=True,
            chaos_min_duration=3.5,
            formation_fallback_time=12.0,
            stable_frames_threshold=90,
        )

        # Save settings
        store.save(original_settings, settings_file)

        # Verify file was created and has content
        assert settings_file.exists(), "Settings file should be created"
        assert settings_file.stat().st_size > 0, "Settings file should not be empty"

        # Load settings back
        loaded_settings = store.load(settings_file)

        # Verify all fields match
        assert loaded_settings.density_profile == original_settings.density_profile
        assert loaded_settings.speed_profile == original_settings.speed_profile
        assert loaded_settings.burst_intensity == original_settings.burst_intensity
        assert loaded_settings.color_mode == original_settings.color_mode
        assert loaded_settings.loop_mode == original_settings.loop_mode
        assert (
            loaded_settings.breathing_amplitude == original_settings.breathing_amplitude
        )
        assert loaded_settings.watermark_path == original_settings.watermark_path
        assert loaded_settings.locale == original_settings.locale
        assert loaded_settings.hud_enabled == original_settings.hud_enabled
        assert (
            loaded_settings.chaos_min_duration == original_settings.chaos_min_duration
        )
        assert (
            loaded_settings.formation_fallback_time
            == original_settings.formation_fallback_time
        )
        assert (
            loaded_settings.stable_frames_threshold
            == original_settings.stable_frames_threshold
        )

    def test_settings_file_format_valid_json(self, tmp_path):
        """Test that saved settings file contains valid JSON"""
        settings_file = tmp_path / "test_settings.json"

        store = SettingsStore()

        # Save settings
        settings = Settings(
            density_profile=DensityProfile.MEDIUM,
            speed_profile=SpeedProfile.NORMAL,
            color_mode=ColorMode.STYLIZED,
            locale="en",
        )
        store.save(settings, settings_file)

        # Verify file contains valid JSON
        with open(settings_file) as f:
            try:
                data = json.load(f)
            except json.JSONDecodeError as e:
                pytest.fail(f"Settings file does not contain valid JSON: {e}")

        # Should have expected structure
        assert isinstance(data, dict), "Settings JSON should be a dictionary"
        assert len(data) > 0, "Settings JSON should not be empty"

        # Should contain expected keys
        expected_keys = ["density_profile", "speed_profile", "color_mode", "locale"]
        for key in expected_keys:
            assert key in data, f"Settings JSON should contain '{key}'"

    def test_settings_persistence_across_store_instances(self, tmp_path):
        """Test that settings persist across different SettingsStore instances"""
        settings_file = tmp_path / "persistent_settings.json"

        # First store instance - save settings
        store1 = SettingsStore()

        original_settings = Settings(
            density_profile=DensityProfile.LOW,
            speed_profile=SpeedProfile.SLOW,
            burst_intensity=1,
            color_mode=ColorMode.STYLIZED,
            breathing_amplitude=0.01,
            locale="uk",
            hud_enabled=False,
        )

        store1.save(original_settings, settings_file)

        # Second store instance - load settings
        store2 = SettingsStore()

        loaded_settings = store2.load(settings_file)

        # Should be identical
        assert loaded_settings.density_profile == original_settings.density_profile
        assert loaded_settings.speed_profile == original_settings.speed_profile
        assert loaded_settings.burst_intensity == original_settings.burst_intensity
        assert loaded_settings.color_mode == original_settings.color_mode
        assert (
            loaded_settings.breathing_amplitude == original_settings.breathing_amplitude
        )
        assert loaded_settings.locale == original_settings.locale
        assert loaded_settings.hud_enabled == original_settings.hud_enabled

    def test_default_settings_when_file_missing(self, tmp_path):
        """Test that default settings are returned when no file exists"""
        nonexistent_file = tmp_path / "does_not_exist.json"

        store = SettingsStore()

        # Should return default settings without error
        settings = store.load(nonexistent_file)

        # Should be default values
        assert settings.density_profile == DensityProfile.MEDIUM
        assert settings.speed_profile == SpeedProfile.NORMAL
        assert settings.color_mode == ColorMode.STYLIZED
        assert settings.locale == "en"
        assert not settings.hud_enabled
        assert not settings.loop_mode

    def test_corrupted_settings_file_handling(self, tmp_path):
        """Test handling of corrupted settings files"""
        settings_file = tmp_path / "corrupted_settings.json"

        # Create corrupted JSON file
        with open(settings_file, "w") as f:
            f.write('{"density_profile": "medium", "incomplete": ')  # Invalid JSON

        store = SettingsStore()

        # Should handle corruption gracefully and return defaults
        settings = store.load(settings_file)

        # Should be default settings (not crash)
        assert settings.density_profile == DensityProfile.MEDIUM
        assert settings.speed_profile == SpeedProfile.NORMAL
        assert settings.locale == "en"

    def test_partial_settings_file_completion(self, tmp_path):
        """Test that missing fields in settings file are filled with defaults"""
        settings_file = tmp_path / "partial_settings.json"

        # Create file with only some settings
        partial_data = {
            "density_profile": "high",
            "locale": "uk",
            # Missing other fields
        }

        with open(settings_file, "w") as f:
            json.dump(partial_data, f)

        store = SettingsStore()

        settings = store.load(settings_file)

        # Specified fields should be loaded
        assert settings.density_profile == DensityProfile.HIGH
        assert settings.locale == "uk"

        # Missing fields should have defaults
        assert settings.speed_profile == SpeedProfile.NORMAL  # Default
        assert settings.color_mode == ColorMode.STYLIZED  # Default
        assert not settings.hud_enabled  # Default

    def test_settings_enumeration_persistence(self, tmp_path):
        """Test that enum values are properly serialized and deserialized"""
        settings_file = tmp_path / "enum_test_settings.json"

        store = SettingsStore()

        # Test all enum combinations
        for density in DensityProfile:
            for speed in SpeedProfile:
                for color in ColorMode:
                    settings = Settings(
                        density_profile=density,
                        speed_profile=speed,
                        color_mode=color,
                        locale="en",
                    )

                    # Save and load
                    store.save(settings, settings_file)
                    loaded = store.load(settings_file)

                    # Should match exactly
                    assert loaded.density_profile == density, (
                        f"Density profile mismatch: {loaded.density_profile} != {density}"
                    )
                    assert loaded.speed_profile == speed, (
                        f"Speed profile mismatch: {loaded.speed_profile} != {speed}"
                    )
                    assert loaded.color_mode == color, (
                        f"Color mode mismatch: {loaded.color_mode} != {color}"
                    )

    def test_settings_update_preserves_unchanged_fields(self, tmp_path):
        """Test that updating some settings preserves other fields"""
        settings_file = tmp_path / "update_test_settings.json"

        store = SettingsStore()

        # Save initial settings
        initial_settings = Settings(
            density_profile=DensityProfile.MEDIUM,
            speed_profile=SpeedProfile.NORMAL,
            burst_intensity=3,
            color_mode=ColorMode.STYLIZED,
            breathing_amplitude=0.02,
            watermark_path="/initial/path.png",
            locale="en",
            hud_enabled=True,
        )

        store.save(initial_settings, settings_file)

        # Update only some fields
        updated_settings = Settings(
            density_profile=DensityProfile.HIGH,  # Changed
            speed_profile=SpeedProfile.FAST,  # Changed
            burst_intensity=initial_settings.burst_intensity,  # Same
            color_mode=initial_settings.color_mode,  # Same
            breathing_amplitude=initial_settings.breathing_amplitude,  # Same
            watermark_path=initial_settings.watermark_path,  # Same
            locale=initial_settings.locale,  # Same
            hud_enabled=initial_settings.hud_enabled,  # Same
        )

        store.save(updated_settings, settings_file)

        # Load and verify
        loaded_settings = store.load(settings_file)

        # Changed fields
        assert loaded_settings.density_profile == DensityProfile.HIGH
        assert loaded_settings.speed_profile == SpeedProfile.FAST

        # Unchanged fields should be preserved
        assert loaded_settings.burst_intensity == initial_settings.burst_intensity
        assert loaded_settings.color_mode == initial_settings.color_mode
        assert (
            loaded_settings.breathing_amplitude == initial_settings.breathing_amplitude
        )
        assert loaded_settings.watermark_path == initial_settings.watermark_path
        assert loaded_settings.locale == initial_settings.locale
        assert loaded_settings.hud_enabled == initial_settings.hud_enabled
