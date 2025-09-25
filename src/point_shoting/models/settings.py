"""Settings data model for particle animation configuration"""

from dataclasses import dataclass, field
from typing import Optional, Dict, Any
from enum import Enum


class DensityProfile(Enum):
    """Particle density presets"""
    LOW = "low"        # ~3k particles
    MEDIUM = "medium"  # ~9k particles  
    HIGH = "high"      # ~15k particles


class SpeedProfile(Enum):
    """Animation speed presets"""
    SLOW = "slow"      # 0.7x speed
    NORMAL = "normal"  # 1.0x speed
    FAST = "fast"      # 1.4x speed


class ColorMode(Enum):
    """Color mapping modes"""
    STYLIZED = "stylized"  # Limited palette (≤32 colors)
    PRECISE = "precise"    # Image-accurate colors


@dataclass
class Settings:
    """Configuration settings for particle animation"""
    
    # Core animation settings
    density_profile: DensityProfile = DensityProfile.MEDIUM
    speed_profile: SpeedProfile = SpeedProfile.NORMAL
    burst_intensity: int = 3
    color_mode: ColorMode = ColorMode.STYLIZED
    loop_mode: bool = False
    
    # Breathing animation settings
    breathing_amplitude: float = 0.02  # ≤0.03 (relative scene width)
    
    # Optional features
    watermark_path: Optional[str] = None
    locale: str = "en"
    hud_enabled: bool = False
    
    # Advanced settings (usually not exposed to user)
    chaos_min_duration: float = 2.0  # minimum seconds in chaos stage
    formation_fallback_time: float = 10.0  # max seconds before forced formation
    stable_frames_threshold: int = 60  # frames to consider formation stable
    recognition_computation_interval: int = 5  # compute recognition every N frames
    
    def __post_init__(self):
        """Validate settings after initialization"""
        self.validate()
    
    def validate(self) -> None:
        """Validate all settings values"""
        # Validate enums
        if isinstance(self.density_profile, str):
            self.density_profile = DensityProfile(self.density_profile)
        if isinstance(self.speed_profile, str):
            self.speed_profile = SpeedProfile(self.speed_profile)
        if isinstance(self.color_mode, str):
            self.color_mode = ColorMode(self.color_mode)
        
        # Validate numeric constraints
        if not (0.0 <= self.breathing_amplitude <= 0.03):
            raise ValueError(f"breathing_amplitude must be in [0.0, 0.03], got {self.breathing_amplitude}")
        
        if self.burst_intensity < 1:
            raise ValueError(f"burst_intensity must be ≥1, got {self.burst_intensity}")
        
        if self.chaos_min_duration < 0:
            raise ValueError(f"chaos_min_duration must be ≥0, got {self.chaos_min_duration}")
        
        if self.formation_fallback_time <= 0:
            raise ValueError(f"formation_fallback_time must be >0, got {self.formation_fallback_time}")
        
        if self.stable_frames_threshold < 1:
            raise ValueError(f"stable_frames_threshold must be ≥1, got {self.stable_frames_threshold}")
        
        if self.recognition_computation_interval < 1:
            raise ValueError(f"recognition_computation_interval must be ≥1, got {self.recognition_computation_interval}")
        
        # Validate locale
        if self.locale not in {"en", "uk"}:
            raise ValueError(f"locale must be 'en' or 'uk', got '{self.locale}'")
    
    def get_particle_count(self) -> int:
        """Get particle count based on density profile"""
        counts = {
            DensityProfile.LOW: 3000,
            DensityProfile.MEDIUM: 9000,
            DensityProfile.HIGH: 15000,
        }
        return counts[self.density_profile]
    
    def get_speed_multiplier(self) -> float:
        """Get speed multiplier based on speed profile"""
        multipliers = {
            SpeedProfile.SLOW: 0.7,
            SpeedProfile.NORMAL: 1.0,
            SpeedProfile.FAST: 1.4,
        }
        return multipliers[self.speed_profile]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert settings to dictionary for serialization"""
        return {
            "density_profile": self.density_profile.value,
            "speed_profile": self.speed_profile.value,
            "burst_intensity": self.burst_intensity,
            "color_mode": self.color_mode.value,
            "loop_mode": self.loop_mode,
            "breathing_amplitude": self.breathing_amplitude,
            "watermark_path": self.watermark_path,
            "locale": self.locale,
            "hud_enabled": self.hud_enabled,
            "chaos_min_duration": self.chaos_min_duration,
            "formation_fallback_time": self.formation_fallback_time,
            "stable_frames_threshold": self.stable_frames_threshold,
            "recognition_computation_interval": self.recognition_computation_interval,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Settings":
        """Create Settings from dictionary"""
        # Filter out unknown keys and create instance
        known_fields = {f.name for f in cls.__dataclass_fields__.values()}
        filtered_data = {k: v for k, v in data.items() if k in known_fields}
        return cls(**filtered_data)
    
    @classmethod
    def default(cls) -> "Settings":
        """Create default settings"""
        return cls()
    
    def copy(self, **changes) -> "Settings":
        """Create a copy with optional changes"""
        current_dict = self.to_dict()
        current_dict.update(changes)
        return self.from_dict(current_dict)
    
    def is_safe_to_change_during_animation(self, other: "Settings") -> bool:
        """Check if changing from current settings to other is safe during animation"""
        # Only certain settings can be changed mid-animation
        safe_changes = {
            "hud_enabled",
            "locale", 
            "watermark_path",
            "breathing_amplitude",
        }
        
        current = self.to_dict()
        other_dict = other.to_dict()
        
        for key, value in other_dict.items():
            if current.get(key) != value and key not in safe_changes:
                return False
        
        return True