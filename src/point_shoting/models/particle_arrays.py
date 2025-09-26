"""Particle arrays module for efficient NumPy-based particle storage"""

import numpy as np
from typing import Tuple, Optional, Dict, Any
from dataclasses import dataclass


@dataclass
class ParticleArrays:
    """Container for all particle data stored as NumPy arrays"""
    
    # Core particle state
    position: np.ndarray      # shape: (N, 2) - XY positions in [0,1]^2
    velocity: np.ndarray      # shape: (N, 2) - XY velocities  
    target: np.ndarray        # shape: (N, 2) - target XY positions for formation
    color_rgba: np.ndarray    # shape: (N, 4) - RGBA colors (uint8)
    
    # Metadata
    active: np.ndarray        # shape: (N,) - active particle flags (bool)
    stage_mask: np.ndarray    # shape: (N,) - encoded stage flags (uint8)
    
    # Computed/cached values
    _particle_count: int
    
    def __post_init__(self) -> None:
        """Validate array shapes and consistency"""
        self.validate()
    
    def validate(self) -> None:
        """Validate array shapes and data types"""
        N = self._particle_count
        
        # Check shapes
        assert self.position.shape == (N, 2), f"position shape mismatch: {self.position.shape} != ({N}, 2)"
        assert self.velocity.shape == (N, 2), f"velocity shape mismatch: {self.velocity.shape} != ({N}, 2)"
        assert self.target.shape == (N, 2), f"target shape mismatch: {self.target.shape} != ({N}, 2)"
        assert self.color_rgba.shape == (N, 4), f"color_rgba shape mismatch: {self.color_rgba.shape} != ({N}, 4)"
        assert self.active.shape == (N,), f"active shape mismatch: {self.active.shape} != ({N},)"
        assert self.stage_mask.shape == (N,), f"stage_mask shape mismatch: {self.stage_mask.shape} != ({N},)"
        
        # Check data types
        assert self.position.dtype == np.float32, f"position dtype: {self.position.dtype} != float32"
        assert self.velocity.dtype == np.float32, f"velocity dtype: {self.velocity.dtype} != float32"
        assert self.target.dtype == np.float32, f"target dtype: {self.target.dtype} != float32"
        assert self.color_rgba.dtype == np.uint8, f"color_rgba dtype: {self.color_rgba.dtype} != uint8"
        assert self.active.dtype == bool, f"active dtype: {self.active.dtype} != bool"
        assert self.stage_mask.dtype == np.uint8, f"stage_mask dtype: {self.stage_mask.dtype} != uint8" 
        
        # Check bounds
        assert np.all(self.position >= 0.0) and np.all(self.position <= 1.0), "positions out of [0,1] bounds"
        assert np.all(self.target >= 0.0) and np.all(self.target <= 1.0), "targets out of [0,1] bounds"
    
    @property
    def particle_count(self) -> int:
        """Get number of particles"""
        return self._particle_count
    
    def get_active_count(self) -> int:
        """Get number of active particles"""
        return int(np.sum(self.active))
    
    def get_velocity_magnitudes(self) -> np.ndarray:
        """Get velocity magnitudes for all particles"""
        return np.linalg.norm(self.velocity, axis=1)
    
    def clamp_positions(self) -> None:
        """Clamp all positions to [0,1]^2 bounds"""
        np.clip(self.position, 0.0, 1.0, out=self.position)
    
    def clamp_velocities(self, max_velocity: float) -> None:
        """Clamp velocity magnitudes to maximum value"""
        magnitudes = self.get_velocity_magnitudes()
        over_limit = magnitudes > max_velocity
        
        if np.any(over_limit):
            # Normalize and scale down velocities that exceed limit
            scale_factors = np.where(over_limit, max_velocity / magnitudes, 1.0)
            self.velocity *= scale_factors[:, np.newaxis]
    
    def apply_damping(self, damping_factor: float) -> None:
        """Apply velocity damping to all particles"""
        self.velocity *= damping_factor
    
    def snapshot(self, limit: Optional[int] = None) -> Dict[str, Any]:
        """Create a snapshot of particle state for debugging/testing"""
        n_particles = limit if limit is not None else self.particle_count
        n_particles = min(n_particles, self.particle_count)
        
        return {
            "particle_count": self.particle_count,
            "active_count": self.get_active_count(),
            "positions": self.position[:n_particles].copy(),
            "velocities": self.velocity[:n_particles].copy(),
            "targets": self.target[:n_particles].copy(),
            "colors": self.color_rgba[:n_particles].copy(),
            "active": self.active[:n_particles].copy(),
            "velocity_stats": {
                "mean_magnitude": float(np.mean(self.get_velocity_magnitudes())),
                "max_magnitude": float(np.max(self.get_velocity_magnitudes())),
                "min_magnitude": float(np.min(self.get_velocity_magnitudes())),
            }
        }


def allocate_particle_arrays(particle_count: int) -> ParticleArrays:
    """
    Allocate and initialize particle arrays for given count
    
    Args:
        particle_count: Number of particles to allocate
        
    Returns:
        Initialized ParticleArrays with default values
    """
    if particle_count <= 0:
        raise ValueError(f"particle_count must be > 0, got {particle_count}")
    
    # Allocate arrays
    position = np.zeros((particle_count, 2), dtype=np.float32)
    velocity = np.zeros((particle_count, 2), dtype=np.float32) 
    target = np.zeros((particle_count, 2), dtype=np.float32)
    color_rgba = np.full((particle_count, 4), 255, dtype=np.uint8)  # Default to opaque white
    active = np.ones(particle_count, dtype=bool)  # All particles active by default
    stage_mask = np.zeros(particle_count, dtype=np.uint8)
    
    # Initialize positions to center (will be overridden during burst)
    position[:] = 0.5
    
    return ParticleArrays(
        position=position,
        velocity=velocity,
        target=target,
        color_rgba=color_rgba,
        active=active,
        stage_mask=stage_mask,
        _particle_count=particle_count
    )


def map_image_to_targets(
    arrays: ParticleArrays, 
    image_array: np.ndarray,
    preserve_aspect: bool = True
) -> None:
    """
    Map particle target positions to image pixel locations
    
    Args:
        arrays: Particle arrays to modify
        image_array: Image as numpy array (H, W, 3/4)
        preserve_aspect: Whether to preserve image aspect ratio
    """
    if image_array.size == 0 or len(image_array.shape) < 2:
        raise ValueError(f"Invalid image array: shape={image_array.shape}, size={image_array.size}")
    height, width = image_array.shape[:2]
    N = arrays.particle_count
    
    if preserve_aspect:
        # Calculate letterbox scaling to fit in [0,1]^2 while preserving aspect
        aspect_ratio = width / height
        if aspect_ratio > 1.0:
            # Wide image: scale by height
            scale_x = 1.0
            scale_y = 1.0 / aspect_ratio
            offset_x = 0.0
            offset_y = (1.0 - scale_y) / 2.0
        else:
            # Tall image: scale by width  
            scale_x = aspect_ratio
            scale_y = 1.0
            offset_x = (1.0 - scale_x) / 2.0
            offset_y = 0.0
    else:
        # Stretch to fill [0,1]^2
        scale_x = scale_y = 1.0
        offset_x = offset_y = 0.0
    
    # Generate random pixel coordinates
    pixel_x = np.random.randint(0, width, N)
    pixel_y = np.random.randint(0, height, N)
    
    # Convert to normalized coordinates
    norm_x = pixel_x / width
    norm_y = pixel_y / height
    
    # Apply scaling and offset
    arrays.target[:, 0] = norm_x * scale_x + offset_x
    arrays.target[:, 1] = norm_y * scale_y + offset_y
    
    # Ensure targets are within bounds
    arrays.target[:, 0] = np.clip(arrays.target[:, 0], 0.0, 1.0)
    arrays.target[:, 1] = np.clip(arrays.target[:, 1], 0.0, 1.0)


def initialize_burst_positions(
    arrays: ParticleArrays,
    burst_points: Optional[np.ndarray] = None,
    burst_radius: float = 0.05
) -> None:
    """
    Initialize particle positions for burst emission
    
    Args:
        arrays: Particle arrays to modify
        burst_points: Central points for bursts, shape (n_points, 2). If None, uses single center
        burst_radius: Maximum distance from burst centers
    """
    N = arrays.particle_count
    
    if burst_points is None:
        # Single burst from center
        burst_points = np.array([[0.5, 0.5]], dtype=np.float32)
    
    n_bursts = len(burst_points)
    
    # Assign particles to burst points
    burst_assignments = np.random.randint(0, n_bursts, N)
    
    # Generate random positions around burst centers
    angles = np.random.uniform(0, 2 * np.pi, N)
    distances = np.random.uniform(0, burst_radius, N)
    
    # Convert to Cartesian coordinates
    offset_x = distances * np.cos(angles)
    offset_y = distances * np.sin(angles)
    
    # Set positions - use vectorized operations to avoid scalar conversion issues
    for i in range(N):
        burst_idx = burst_assignments[i]
        arrays.position[i, 0] = burst_points[burst_idx, 0] + offset_x[i]
        arrays.position[i, 1] = burst_points[burst_idx, 1] + offset_y[i]
    
    # Clamp to bounds
    arrays.clamp_positions()
