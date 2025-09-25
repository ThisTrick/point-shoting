"""Contract test for LocalizationProvider"""

import pytest

# Import implementation - should work now
try:
    from point_shoting.services.localization_provider import LocalizationProvider
except ImportError as e:
    print(f"Import failed: {e}")
    LocalizationProvider = None


@pytest.mark.contract
class TestLocalizationProviderContract:
    """Test LocalizationProvider missing key fallback behavior"""

    def test_localization_provider_import_exists(self):
        """LocalizationProvider class should be importable"""
        assert LocalizationProvider is not None, "LocalizationProvider class not implemented yet"

    def test_get_text_method_exists(self):
        """get_text method should exist"""
        provider = LocalizationProvider()
        assert hasattr(provider, 'get_text')

    def test_set_locale_method_exists(self):
        """set_locale method should exist"""
        provider = LocalizationProvider()
        assert hasattr(provider, 'set_locale')

    def test_missing_key_fallback_behavior(self):
        """Missing translation keys should fallback gracefully"""
        provider = LocalizationProvider()
        provider.set_locale('en')
        # Test missing key returns key itself or fallback
        result = provider.get_text('missing.key')
        assert result is not None
        assert isinstance(result, str)
        # Should return the key itself as fallback
        assert 'missing.key' in result or 'missing' in result

    def test_supported_locales(self):
        """Should support 'en' and 'uk' locales initially"""
        provider = LocalizationProvider()
        provider.set_locale('en')  # Should not raise
        provider.set_locale('uk')  # Should not raise

    def test_locale_file_loading(self):
        """Should load locale files from i18n directory"""
        # Test that en.json and uk.json files are loaded correctly
        provider = LocalizationProvider()
        provider.set_locale('en')
        # Should work even if file doesn't exist yet
        result = provider.get_text('test.key')
        assert isinstance(result, str)
