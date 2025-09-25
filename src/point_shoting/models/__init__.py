"""Models package - Core data structures for particle animation"""

from .stage import Stage
from .settings import Settings, DensityProfile, SpeedProfile, ColorMode
from .particle_arrays import ParticleArrays, allocate_particle_arrays, map_image_to_targets, initialize_burst_positions
from .metrics import Metrics

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