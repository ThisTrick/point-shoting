"""Settings persistence store with corruption handling"""

import json
import logging
from pathlib import Path
from typing import Optional, Dict, Any

from ..models.settings import Settings
from ..lib.logging_config import get_logger


class SettingsStore:
    """Handles settings persistence with corruption recovery"""
    
    DEFAULT_SETTINGS_FILE = ".point_shoting_settings.json"
    
    def __init__(self, logger: Optional[logging.Logger] = None):
        """
        Initialize settings store
        
        Args:
            logger: Optional logger instance
        """
        self.logger = logger or get_logger(__name__)
        
        # Whitelist of allowed setting keys for security
        self.allowed_keys = {
            "density_profile",
            "speed_profile", 
            "burst_intensity",
            "color_mode",
            "loop_mode",
            "breathing_amplitude",
            "watermark_path",
            "locale",
            "hud_enabled",
            "chaos_min_duration",
            "formation_fallback_time",
            "stable_frames_threshold",
            "recognition_computation_interval",
        }
    
    def load(self, file_path: Optional[Path] = None) -> Settings:
        """
        Load settings from file with corruption handling
        
        Args:
            file_path: Path to settings file. If None, uses default location
            
        Returns:
            Settings object (defaults if file missing or corrupted)
        """
        if file_path is None:
            file_path = Path.home() / self.DEFAULT_SETTINGS_FILE
            
        try:
            if not file_path.exists():
                self.logger.info(f"Settings file not found: {file_path}, using defaults")
                return Settings.default()
                
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            # Validate data is a dictionary
            if not isinstance(data, dict):
                self.logger.warning(f"Settings file contains invalid data type: {type(data)}, using defaults")
                return Settings.default()
                
            # Filter to allowed keys only
            filtered_data = {k: v for k, v in data.items() if k in self.allowed_keys}
            
            # Log filtered keys if any were removed
            removed_keys = set(data.keys()) - set(filtered_data.keys())
            if removed_keys:
                self.logger.warning(f"Filtered out unknown setting keys: {removed_keys}")
                
            # Create settings from filtered data
            settings = Settings.from_dict(filtered_data)
            self.logger.info(f"Loaded settings from {file_path}")
            return settings
            
        except json.JSONDecodeError as e:
            self.logger.error(f"Settings file corrupted (invalid JSON): {file_path} - {e}")
            return Settings.default()
            
        except (ValueError, TypeError) as e:
            self.logger.error(f"Settings file contains invalid values: {file_path} - {e}")
            return Settings.default()
            
        except Exception as e:
            self.logger.error(f"Unexpected error loading settings: {file_path} - {e}")
            return Settings.default()
    
    def save(self, settings: Settings, file_path: Optional[Path] = None) -> bool:
        """
        Save settings to file
        
        Args:
            settings: Settings object to save
            file_path: Path to save to. If None, uses default location
            
        Returns:
            True if save succeeded, False otherwise
        """
        if file_path is None:
            file_path = Path.home() / self.DEFAULT_SETTINGS_FILE
            
        try:
            # Ensure parent directory exists
            file_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Convert to dict and filter to allowed keys
            data = settings.to_dict()
            filtered_data = {k: v for k, v in data.items() if k in self.allowed_keys}
            
            # Write to temporary file first (atomic save)
            temp_path = file_path.with_suffix(file_path.suffix + '.tmp')
            
            with open(temp_path, 'w', encoding='utf-8') as f:
                json.dump(filtered_data, f, indent=2, ensure_ascii=False)
                
            # Atomic move to final location
            temp_path.replace(file_path)
            
            self.logger.info(f"Saved settings to {file_path}")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to save settings to {file_path}: {e}")
            
            # Clean up temporary file if it exists
            temp_path = file_path.with_suffix(file_path.suffix + '.tmp')
            if temp_path.exists():
                try:
                    temp_path.unlink()
                except Exception:
                    pass
                    
            return False
    
    def load_or_create_default(self, file_path: Optional[Path] = None) -> Settings:
        """
        Load settings or create default file if it doesn't exist
        
        Args:
            file_path: Path to settings file
            
        Returns:
            Settings object
        """
        settings = self.load(file_path)
        
        # If we loaded defaults (file didn't exist), save them
        if file_path is None:
            file_path = Path.home() / self.DEFAULT_SETTINGS_FILE
            
        if not file_path.exists():
            self.save(settings, file_path)
            
        return settings
    
    def backup_settings(self, file_path: Optional[Path] = None) -> Optional[Path]:
        """
        Create a backup of current settings file
        
        Args:
            file_path: Path to settings file to backup
            
        Returns:
            Path to backup file if successful, None otherwise
        """
        if file_path is None:
            file_path = Path.home() / self.DEFAULT_SETTINGS_FILE
            
        if not file_path.exists():
            return None
            
        try:
            import time
            timestamp = time.strftime("%Y%m%d_%H%M%S")
            backup_path = file_path.with_suffix(f'.backup_{timestamp}.json')
            
            # Copy file content
            with open(file_path, 'rb') as src, open(backup_path, 'wb') as dst:
                dst.write(src.read())
                
            self.logger.info(f"Created settings backup: {backup_path}")
            return backup_path
            
        except Exception as e:
            self.logger.error(f"Failed to create settings backup: {e}")
            return None
    
    def validate_file(self, file_path: Path) -> bool:
        """
        Validate that a settings file is readable and valid
        
        Args:
            file_path: Path to settings file
            
        Returns:
            True if file is valid, False otherwise
        """
        try:
            settings = self.load(file_path)
            return True
        except Exception:
            return False
    
    def get_default_path(self) -> Path:
        """Get the default settings file path"""
        return Path.home() / self.DEFAULT_SETTINGS_FILE
    
    def clear_settings(self, file_path: Optional[Path] = None) -> bool:
        """
        Remove settings file (reset to defaults)
        
        Args:
            file_path: Path to settings file to remove
            
        Returns:
            True if removal succeeded, False otherwise
        """
        if file_path is None:
            file_path = Path.home() / self.DEFAULT_SETTINGS_FILE
            
        try:
            if file_path.exists():
                file_path.unlink()
                self.logger.info(f"Cleared settings file: {file_path}")
            return True
        except Exception as e:
            self.logger.error(f"Failed to clear settings file: {e}")
            return False