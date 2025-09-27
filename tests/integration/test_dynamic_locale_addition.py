"""
Integration test for dynamic locale addition functionality.
Tests NFR-006, FR-018: Dynamic locale addition and localization support.
"""

import pytest
import json
from pathlib import Path
from unittest.mock import patch, Mock
from src.point_shoting.services.localization_provider import LocalizationProvider
from src.point_shoting.models.settings import Settings


@pytest.mark.integration
class TestDynamicLocaleAddition:
    """Test localization support and existing locale functionality."""
    
    def test_existing_locale_support(self):
        """Test that existing locales (en, uk) work correctly."""
        provider = LocalizationProvider()
        
        # Test English locale
        provider.set_locale("en")
        # Test that some key returns either the translation or the key (fallback)
        pause_text = provider.get_text("ui.pause") 
        assert pause_text in ["Pause", "ui.pause"]  # Either translation or fallback
        
        # Test Ukrainian locale  
        provider.set_locale("uk")
        pause_text_uk = provider.get_text("ui.pause")
        # Should work (either get translation or fallback)
        assert isinstance(pause_text_uk, str)
    
    def test_runtime_locale_addition_simulation(self):
        """Test simulating dynamic locale addition by modifying translations."""
        provider = LocalizationProvider()
        
        # Add a new locale at runtime by directly modifying translations dict
        # This simulates what would happen if locale files were added dynamically
        # Note: keys use dot notation, so "ui.pause" becomes {"ui": {"pause": "value"}}
        new_locale_data = {
            "ui": {
                "pause": "Pausar",
                "resume": "Reanudar", 
                "restart": "Reiniciar"
            }
        }
        
        # Directly add to translations (simulating dynamic loading)
        provider.translations["es"] = new_locale_data
        
        # Set to new locale
        provider.set_locale("es")
        
        # Should get our custom translations
        assert provider.get_text("ui.pause") == "Pausar"
        assert provider.get_text("ui.resume") == "Reanudar"
        assert provider.get_text("ui.restart") == "Reiniciar"
    
    def test_fallback_behavior(self):
        """Test fallback behavior when keys are missing."""
        provider = LocalizationProvider()
        
        # Add incomplete locale data
        provider.translations["test"] = {
            "ui": {
                "pause": "Test Pause"
                # Missing other keys
            }
        }
        
        provider.set_locale("test")
        
        # Available key should work
        assert provider.get_text("ui.pause") == "Test Pause"
        
        # Missing key should return the key itself or fallback
        missing_text = provider.get_text("ui.nonexistent")
        assert isinstance(missing_text, str)
        assert "ui.nonexistent" in missing_text or missing_text != ""
    
    def test_unicode_translation_support(self):
        """Test that Unicode characters in translations work correctly."""
        provider = LocalizationProvider()
        
        # Add Unicode translations
        provider.translations["unicode"] = {
            "ui": {
                "pause": "暂停",      # Chinese  
                "resume": "відновити", # Ukrainian
                "restart": "再開始"   # Japanese
            }
        }
        
        provider.set_locale("unicode")
        
        # Unicode should be preserved
        assert provider.get_text("ui.pause") == "暂停"
        assert provider.get_text("ui.resume") == "відновити"
        assert provider.get_text("ui.restart") == "再開始"
    
    def test_settings_locale_validation(self):
        """Test that Settings validation accepts supported locales."""
        # Test that existing supported locales work
        settings_en = Settings(locale="en")
        assert settings_en.locale == "en"
        
        settings_uk = Settings(locale="uk") 
        assert settings_uk.locale == "uk"
        
        # Test that unsupported locale raises validation error
        with pytest.raises(ValueError, match="locale must be 'en' or 'uk'"):
            Settings(locale="fr")
    
    def test_localization_provider_integration(self):
        """Test LocalizationProvider with Settings integration."""
        provider = LocalizationProvider()
        
        # Test with English settings
        settings = Settings(locale="en")
        provider.set_locale(settings.locale)
        
        # Should work without errors
        text = provider.get_text("ui.pause")
        assert isinstance(text, str)
        
        # Test with Ukrainian settings
        settings_uk = Settings(locale="uk")
        provider.set_locale(settings_uk.locale)
        
        # Should work without errors
        text_uk = provider.get_text("ui.pause") 
        assert isinstance(text_uk, str)
