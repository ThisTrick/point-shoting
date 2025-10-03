"""Models package - Core data structures for particle animation"""

from .metrics import Metrics
from .particle_arrays import (
    ParticleArrays,
    allocate_particle_arrays,
    initialize_burst_positions,
    map_image_to_targets,
)
from .settings import ColorMode, DensityProfile, Settings, SpeedProfile
from .stage import Stage

__all__ = [
    "Stage",
    "Settings",
    "DensityProfile",
    "SpeedProfile",
    "ColorMode",
    "ParticleArrays",
    "allocate_particle_arrays",
    "map_image_to_targets",
    "initialize_burst_positions",
    "Metrics",
]
