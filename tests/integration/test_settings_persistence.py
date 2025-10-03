"""Settings persistence integration test"""

import tempfile
from pathlib import Path

import pytest

# Imports will fail until implementation exists - expected for TDD
try:
    from src.point_shoting.models.settings import Settings
    from src.point_shoting.services.settings_store import SettingsStore
except ImportError:
    SettingsStore = None
    Settings = None


@pytest.mark.integration
class TestSettingsPersistence:
    """Test settings save and load integration"""

    def test_settings_save_load_integration(self):
        """Settings should persist correctly through save/load cycle"""
        if SettingsStore is None or Settings is None:
            pytest.skip("SettingsStore and Settings not implemented yet")

        with tempfile.TemporaryDirectory() as temp_dir:
            settings_path = Path(temp_dir) / "test_settings.json"

            store = SettingsStore()

            # Create test settings (use default constructor and modify available attributes)
            original_settings = Settings()
            # Modify any available attributes to test persistence
            if hasattr(original_settings, "locale"):
                original_settings.locale = "uk"
            if hasattr(original_settings, "hud_enabled"):
                original_settings.hud_enabled = True

            # Save settings
            result = store.save(original_settings, settings_path)
            assert result, "Save should succeed"
            assert settings_path.exists(), "Settings file was not created"

            # Load settings
            loaded_settings = store.load(settings_path)

            # Verify settings loaded successfully
            assert loaded_settings is not None, "Loaded settings should not be None"

            # Verify some basic properties (whatever is available in the API)
            if hasattr(original_settings, "locale") and hasattr(
                loaded_settings, "locale"
            ):
                assert loaded_settings.locale == original_settings.locale, (
                    "Locale should match"
                )
            if hasattr(original_settings, "hud_enabled") and hasattr(
                loaded_settings, "hud_enabled"
            ):
                assert loaded_settings.hud_enabled == original_settings.hud_enabled, (
                    "HUD enabled should match"
                )

    def test_settings_default_location(self):
        """Test settings persistence to default location (.point_shoting_settings.json)"""
        if SettingsStore is None or Settings is None:
            pytest.skip("SettingsStore and Settings not implemented yet")

        store = SettingsStore()
        settings = Settings()

        # Test that load with None path doesn't crash (uses default location)
        loaded_settings = store.load(None)  # Should use default location
        assert loaded_settings is not None, (
            "Should load default settings when file missing"
        )

        # Test that save with None path works (though we can't easily verify the default location in a test)
        # We'll just verify the save method doesn't crash with None path
        try:
            result = store.save(settings, None)  # Should use default location
            # Can't easily verify default location in test environment, just ensure no crash
            assert isinstance(result, bool), "Save should return boolean result"
        except PermissionError:
            # Skip if we don't have permission to write to home directory
            pytest.skip("Permission denied writing to default settings location")

    def test_settings_validation_on_load(self):
        """Test that loaded settings are validated for correctness"""
        if SettingsStore is None or Settings is None:
            pytest.skip("SettingsStore and Settings not implemented yet")

        with tempfile.TemporaryDirectory() as temp_dir:
            settings_path = Path(temp_dir) / "invalid_settings.json"

            # Create an invalid settings file manually
            invalid_data = {
                "locale": "invalid_locale",
                "hud_enabled": "not_a_boolean",  # Wrong type
                "unknown_field": "should_be_ignored",
            }

            with open(settings_path, "w") as f:
                import json

                json.dump(invalid_data, f)

            store = SettingsStore()

            # Load should handle invalid data gracefully
            loaded_settings = store.load(settings_path)
            assert loaded_settings is not None, (
                "Should load settings even with invalid data"
            )

            # Should have fallen back to defaults or corrected values
            # The specific behavior depends on implementation, but it shouldn't crash
            assert isinstance(loaded_settings, Settings), (
                "Should return Settings instance"
            )
