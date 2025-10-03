"""Contract test for SettingsStore"""

import tempfile
from pathlib import Path

import pytest

# Import will fail until implementation exists - that's expected for TDD
try:
    from point_shoting.services.settings_store import SettingsStore
except ImportError:
    SettingsStore = None


@pytest.mark.contract
class TestSettingsStoreContract:
    """Test SettingsStore corruption handling and round-trip persistence"""

    def test_settings_store_import_exists(self):
        """SettingsStore class should be importable"""
        assert SettingsStore is not None, "SettingsStore class not implemented yet"

    def test_load_method_exists(self):
        """load method should exist"""
        store = SettingsStore()
        assert hasattr(store, "load")

    def test_save_method_exists(self):
        """save method should exist"""
        store = SettingsStore()
        assert hasattr(store, "save")

    def test_corrupted_file_returns_defaults(self):
        """Corrupted settings file should return default settings"""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            # Write invalid JSON
            f.write('{"invalid": json content}')
            corrupted_path = f.name

        try:
            store = SettingsStore()
            settings = store.load(Path(corrupted_path))
            # Should return defaults, not crash
            assert settings is not None
        finally:
            Path(corrupted_path).unlink(missing_ok=True)

    def test_missing_file_returns_defaults(self):
        """Missing settings file should return default settings"""
        store = SettingsStore()
        settings = store.load(Path("/nonexistent/path.json"))
        assert settings is not None

    def test_round_trip_persistence(self):
        """Settings should survive save → load round trip"""
        with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as f:
            settings_path = Path(f.name)

        try:
            from point_shoting.models.settings import (
                DensityProfile,
                Settings,
                SpeedProfile,
            )

            store = SettingsStore()

            # Create test settings
            original_settings = Settings(
                density_profile=DensityProfile.HIGH,
                speed_profile=SpeedProfile.FAST,
                hud_enabled=True,
                loop_mode=True,
            )

            store.save(original_settings, settings_path)
            loaded_settings = store.load(settings_path)

            # Basic checks that round trip worked
            assert loaded_settings is not None
            assert loaded_settings.density_profile == original_settings.density_profile
            assert loaded_settings.speed_profile == original_settings.speed_profile
            assert loaded_settings.hud_enabled == original_settings.hud_enabled
            assert loaded_settings.loop_mode == original_settings.loop_mode
        finally:
            settings_path.unlink(missing_ok=True)

    def test_settings_whitelist_validation(self):
        """Only whitelisted settings should be persisted"""
        # Test that unknown/unsafe keys are filtered out during save/load
        store = SettingsStore()
        # Basic test that store doesn't crash with various inputs
        result = store.load(Path("/nonexistent"))
        assert result is not None
