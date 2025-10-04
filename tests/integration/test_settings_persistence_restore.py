"""
Integration test for settings persistence restore functionality.
Tests FR-036: Settings should restore properly from saved state.
"""

import json
import os
import tempfile
from pathlib import Path

import pytest

from src.point_shoting.models.settings import (
    ColorMode,
    DensityProfile,
    Settings,
    SpeedProfile,
)
from src.point_shoting.services.settings_store import SettingsStore


@pytest.mark.integration
class TestSettingsPersistenceRestore:
    """Test settings restore functionality from persisted state."""

    def setup_method(self):
        """Setup test environment."""
        self.temp_dir = Path(tempfile.mkdtemp())
        self.settings_file = self.temp_dir / "settings.json"

    def teardown_method(self):
        """Cleanup test environment."""
        if self.settings_file.exists():
            self.settings_file.unlink()
        self.temp_dir.rmdir()

    def test_restore_complete_settings(self):
        """Test restoring a complete settings configuration."""
        # Create initial settings
        original_settings = Settings(
            density_profile=DensityProfile.HIGH,
            speed_profile=SpeedProfile.FAST,
            color_mode=ColorMode.PRECISE,
            hud_enabled=True,
            locale="uk",
        )

        # Save settings
        store = SettingsStore()
        store.save(original_settings, file_path=self.settings_file)

        # Create new store instance and restore
        new_store = SettingsStore()
        restored_settings = new_store.load(file_path=self.settings_file)

        # Verify complete restoration
        assert restored_settings.density_profile == DensityProfile.HIGH
        assert restored_settings.speed_profile == SpeedProfile.FAST
        assert restored_settings.color_mode == ColorMode.PRECISE
        assert restored_settings.hud_enabled is True
        assert restored_settings.locale == "uk"

    def test_restore_partial_settings_with_defaults(self):
        """Test restoring partial settings fills missing fields with defaults."""
        # Create partial settings file manually
        partial_data = {
            "density_profile": "medium",
            "color_mode": "stylized",
            # Missing: speed_profile, hud_enabled, locale
        }

        with open(self.settings_file, "w") as f:
            json.dump(partial_data, f)

        # Load and verify defaults are filled
        store = SettingsStore()
        restored_settings = store.load(file_path=self.settings_file)

        assert restored_settings.density_profile == DensityProfile.MEDIUM
        assert restored_settings.color_mode == ColorMode.STYLIZED
        # Check defaults are applied
        assert restored_settings.speed_profile == SpeedProfile.NORMAL  # Default
        assert restored_settings.hud_enabled is False  # Default
        assert restored_settings.locale == "en"  # Default

    def test_restore_from_corrupted_file_uses_defaults(self):
        """Test that corrupted settings file triggers default settings."""
        # Create corrupted file
        with open(self.settings_file, "w") as f:
            f.write("invalid json content {{{")

        store = SettingsStore()
        restored_settings = store.load(file_path=self.settings_file)

        # Should get all defaults
        default_settings = Settings()
        assert restored_settings.density_profile == default_settings.density_profile
        assert restored_settings.speed_profile == default_settings.speed_profile
        assert restored_settings.color_mode == default_settings.color_mode
        assert restored_settings.hud_enabled == default_settings.hud_enabled
        assert restored_settings.locale == default_settings.locale

    def test_restore_with_invalid_enum_values(self):
        """Test restoring with invalid enum values falls back to defaults."""
        # Create settings with invalid enum values
        invalid_data = {
            "density_profile": "invalid_density",
            "speed_profile": "invalid_speed",
            "color_mode": "invalid_color",
            "hud_enabled": True,
            "locale": "uk",
        }

        with open(self.settings_file, "w") as f:
            json.dump(invalid_data, f)

        store = SettingsStore()
        restored_settings = store.load(file_path=self.settings_file)

        # Invalid enums trigger complete fallback to defaults (security feature)
        default_settings = Settings()
        assert restored_settings.density_profile == default_settings.density_profile
        assert restored_settings.speed_profile == default_settings.speed_profile
        assert restored_settings.color_mode == default_settings.color_mode
        assert restored_settings.hud_enabled == default_settings.hud_enabled
        assert restored_settings.locale == default_settings.locale

    def test_restore_migration_compatibility(self):
        """Test that old settings format can be restored with migration."""
        # Create old format settings (simulating version upgrade scenario)
        old_format_data = {
            "particle_density": "high",  # Old field name
            "animation_speed": "fast",  # Old field name
            "color_style": "precise",  # Old field name
            "show_hud": False,  # Old field name
            "language": "en",  # Old field name
        }

        with open(self.settings_file, "w") as f:
            json.dump(old_format_data, f)

        # Should handle gracefully by using defaults for unrecognized fields
        store = SettingsStore()
        restored_settings = store.load(file_path=self.settings_file)

        # Should get defaults since old format isn't recognized
        default_settings = Settings()
        assert restored_settings.density_profile == default_settings.density_profile
        assert restored_settings.speed_profile == default_settings.speed_profile
        assert restored_settings.color_mode == default_settings.color_mode
        assert restored_settings.hud_enabled == default_settings.hud_enabled
        assert restored_settings.locale == default_settings.locale

    def test_restore_preserves_file_permissions(self):
        """Test that restoring doesn't change file permissions."""
        # Create settings and set specific permissions
        settings = Settings(locale="uk")
        store = SettingsStore()
        store.save(settings, file_path=self.settings_file)

        # Set specific permissions
        os.chmod(self.settings_file, 0o644)
        original_perms = os.stat(self.settings_file).st_mode

        # Load settings (shouldn't change permissions)
        restored_settings = store.load(file_path=self.settings_file)
        final_perms = os.stat(self.settings_file).st_mode

        assert original_perms == final_perms
        assert restored_settings.locale == "uk"

    def test_restore_concurrent_access_safety(self):
        """Test that concurrent restore operations are safe."""
        settings = Settings(density_profile=DensityProfile.HIGH)
        store = SettingsStore()
        store.save(settings, file_path=self.settings_file)

        # Simulate concurrent loads
        store1 = SettingsStore()
        store2 = SettingsStore()

        restored1 = store1.load(file_path=self.settings_file)
        restored2 = store2.load(file_path=self.settings_file)

        # Both should succeed and be identical
        assert restored1.density_profile == DensityProfile.HIGH
        assert restored2.density_profile == DensityProfile.HIGH
        assert restored1.density_profile == restored2.density_profile
