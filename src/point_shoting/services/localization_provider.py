"""Localization provider with missing key fallback"""

import json
import logging
from pathlib import Path
from typing import Any

from ..lib.logging_config import get_logger


class LocalizationProvider:
    """Provides localized text with fallback handling"""

    def __init__(self, logger: logging.Logger | None = None):
        """
        Initialize localization provider

        Args:
            logger: Optional logger instance
        """
        self.logger = logger or get_logger(__name__)
        self.current_locale = "en"
        self.translations: dict[str, dict[str, Any]] = {}
        self.fallback_locale = "en"

        # Load available locales
        self._load_locales()

    def _load_locales(self) -> None:
        """Load all available locale files"""
        # Get i18n directory relative to project root
        i18n_dir = Path(__file__).parent.parent.parent / "i18n"

        if not i18n_dir.exists():
            self.logger.warning(f"i18n directory not found: {i18n_dir}")
            return

        # Load all .json files in i18n directory
        for locale_file in i18n_dir.glob("*.json"):
            locale_code = locale_file.stem

            try:
                with open(locale_file, encoding="utf-8") as f:
                    translations = json.load(f)

                self.translations[locale_code] = translations
                self.logger.info(f"Loaded locale: {locale_code}")

            except Exception as e:
                self.logger.error(f"Failed to load locale {locale_code}: {e}")

    def set_locale(self, locale: str) -> bool:
        """
        Set current locale

        Args:
            locale: Locale code (e.g., 'en', 'uk')

        Returns:
            True if locale was set successfully, False if not available
        """
        if locale in self.translations:
            self.current_locale = locale
            self.logger.info(f"Set locale to: {locale}")
            return True
        else:
            self.logger.warning(
                f"Locale not available: {locale}, keeping {self.current_locale}"
            )
            return False

    def get_text(self, key: str, **kwargs) -> str:
        """
        Get localized text with fallback handling

        Args:
            key: Translation key (dot-separated path, e.g., 'app.name')
            **kwargs: Format arguments for string interpolation

        Returns:
            Localized text, fallback text, or key itself if not found
        """
        # Try current locale first
        text = self._get_text_from_locale(self.current_locale, key)

        # Fallback to default locale if not found
        if text is None and self.current_locale != self.fallback_locale:
            text = self._get_text_from_locale(self.fallback_locale, key)

        # Final fallback: return the key itself
        if text is None:
            self.logger.warning(f"Translation not found for key: {key}")
            text = key

        # Apply string formatting if arguments provided
        if kwargs:
            try:
                text = text.format(**kwargs)
            except (KeyError, ValueError) as e:
                self.logger.warning(f"String formatting failed for key '{key}': {e}")

        return text

    def _get_text_from_locale(self, locale: str, key: str) -> str | None:
        """
        Get text from specific locale

        Args:
            locale: Locale code
            key: Translation key (dot-separated)

        Returns:
            Translation text or None if not found
        """
        if locale not in self.translations:
            return None

        # Navigate through nested dictionary using dot-separated key
        current = self.translations[locale]

        for part in key.split("."):
            if isinstance(current, dict) and part in current:
                current = current[part]
            else:
                return None

        # Return only if it's a string (leaf node)
        return current if isinstance(current, str) else None

    def get_available_locales(self) -> list[str]:
        """Get list of available locale codes"""
        return list(self.translations.keys())

    def get_current_locale(self) -> str:
        """Get current locale code"""
        return self.current_locale

    def has_key(self, key: str, locale: str | None = None) -> bool:
        """
        Check if translation key exists

        Args:
            key: Translation key to check
            locale: Optional specific locale to check (defaults to current)

        Returns:
            True if key exists, False otherwise
        """
        check_locale = locale or self.current_locale
        return self._get_text_from_locale(check_locale, key) is not None

    def get_locale_info(self, locale: str | None = None) -> dict[str, str]:
        """
        Get locale information

        Args:
            locale: Locale code (defaults to current locale)

        Returns:
            Dictionary with locale information
        """
        check_locale = locale or self.current_locale

        if check_locale not in self.translations:
            return {"code": check_locale, "name": check_locale, "available": False}

        # Try to get locale name from translations
        locale_name = (
            self._get_text_from_locale(check_locale, "app.name") or check_locale
        )

        return {
            "code": check_locale,
            "name": locale_name,
            "available": True,
            "keys_count": self._count_translation_keys(check_locale),
        }

    def _count_translation_keys(self, locale: str) -> int:
        """Count total number of translation keys in a locale"""
        if locale not in self.translations:
            return 0

        def count_keys(obj: Any) -> int:
            if isinstance(obj, dict):
                return sum(count_keys(v) for v in obj.values())
            elif isinstance(obj, str):
                return 1
            else:
                return 0

        return count_keys(self.translations[locale])

    def get_stage_text(self, stage_name: str) -> str:
        """Get localized stage name"""
        key = f"stages.{stage_name.lower()}"
        return self.get_text(key)

    def get_control_text(self, control_name: str) -> str:
        """Get localized control text"""
        key = f"controls.{control_name.lower()}"
        return self.get_text(key)

    def get_setting_text(self, setting_name: str) -> str:
        """Get localized setting name"""
        key = f"settings.{setting_name.lower()}"
        return self.get_text(key)

    def get_error_text(self, error_key: str, **kwargs) -> str:
        """Get localized error message"""
        key = f"errors.{error_key}"
        return self.get_text(key, **kwargs)

    def get_message_text(self, message_key: str, **kwargs) -> str:
        """Get localized message text"""
        key = f"messages.{message_key}"
        return self.get_text(key, **kwargs)

    def reload_locales(self) -> None:
        """Reload all locale files"""
        self.translations.clear()
        self._load_locales()
        self.logger.info("Reloaded all locales")
