"""Stage enumeration for particle animation phases"""

from enum import Enum, auto


class Stage(Enum):
    """Stages of particle animation lifecycle"""
    
    PRE_START = auto()
    """Initial state before animation begins"""
    
    BURST = auto()
    """Particles are being emitted from central points"""
    
    CHAOS = auto()
    """Particles move chaotically with high velocity"""
    
    CONVERGING = auto()
    """Particles begin moving toward target positions"""
    
    FORMATION = auto()
    """Particles are forming the recognizable image"""
    
    FINAL_BREATHING = auto()
    """Final phase with gentle breathing oscillation"""

    def __str__(self) -> str:
        """String representation of stage"""
        return self.name

    @property
    def display_name(self) -> str:
        """Human-readable display name"""
        return self.name.replace('_', ' ').title()

    def is_active(self) -> bool:
        """Check if stage represents active animation (not PRE_START)"""
        return self != Stage.PRE_START

    def allows_settings_change(self) -> bool:
        """Check if settings can be changed during this stage"""
        # Settings can only be changed before start or during pre-start
        return self == Stage.PRE_START

    @classmethod
    def from_string(cls, stage_str: str) -> "Stage":
        """Convert string to Stage enum"""
        try:
            return cls[stage_str.upper()]
        except KeyError:
            raise ValueError(f"Unknown stage: {stage_str}")

    def next_stage(self) -> "Stage":
        """Get the next stage in sequence (for validation)"""
        stage_sequence = [
            Stage.PRE_START,
            Stage.BURST,
            Stage.CHAOS,
            Stage.CONVERGING,
            Stage.FORMATION,
            Stage.FINAL_BREATHING,
        ]
        
        try:
            current_index = stage_sequence.index(self)
            if current_index < len(stage_sequence) - 1:
                return stage_sequence[current_index + 1]
            else:
                # FINAL_BREATHING can loop back to PRE_START in loop mode
                return Stage.PRE_START
        except ValueError:
            raise ValueError(f"Invalid stage: {self}")

    def get_max_velocity(self, speed_profile: str = "normal") -> float:
        """Get maximum velocity for this stage based on speed profile"""
        # Base velocity limits per stage
        base_limits = {
            Stage.PRE_START: 0.0,
            Stage.BURST: 2.0,
            Stage.CHAOS: 1.5,
            Stage.CONVERGING: 1.0,
            Stage.FORMATION: 0.5,
            Stage.FINAL_BREATHING: 0.1,
        }
        
        # Speed profile multipliers
        speed_multipliers = {
            "slow": 0.7,
            "normal": 1.0,
            "fast": 1.4,
        }
        
        base_limit = base_limits.get(self, 1.0)
        multiplier = speed_multipliers.get(speed_profile, 1.0)
        
        return base_limit * multiplier