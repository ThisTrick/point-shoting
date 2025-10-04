"""
Performance optimizations for particle physics using vectorized NumPy operations.
This module contains optimized versions of physics update methods that replace
inefficient Python loops with vectorized NumPy operations.
"""

import numpy as np


def vectorized_burst_physics(
    particles, dt: float, stage_progress: float, physics_params
) -> None:
    """
    Optimized burst physics using vectorized operations.

    Args:
        particles: ParticleArrays object
        dt: Time step
        stage_progress: Progress through burst stage (0.0-1.0)
        physics_params: PhysicsParams object
    """
    center = np.array([0.5, 0.5], dtype=particles.position.dtype)

    # Calculate directions from center (vectorized)
    directions = particles.position - center  # Shape: (N, 2)
    distances = np.linalg.norm(directions, axis=1, keepdims=True)  # Shape: (N, 1)

    # Avoid division by zero
    valid_mask = distances.flatten() > 1e-8

    # Normalize directions
    normalized_directions = np.zeros_like(directions)
    if np.any(valid_mask):
        valid_distances = distances[valid_mask]
        normalized_directions[valid_mask] = directions[valid_mask] / valid_distances

    # Apply burst force (vectorized)
    burst_strength = 5.0 * (1.0 - stage_progress)
    forces = normalized_directions * burst_strength * dt

    # Update velocities (vectorized)
    particles.velocity += forces

    # Apply damping (vectorized)
    particles.velocity *= physics_params.damping

    # Update positions (vectorized)
    particles.position += particles.velocity * dt

    # Clamp positions (vectorized) - preserve dtype
    particles.position[:] = np.clip(particles.position, 0.0, 1.0)


def vectorized_chaos_physics(particles, dt: float, physics_params) -> None:
    """
    Optimized chaos physics using vectorized operations.

    Args:
        particles: ParticleArrays object
        dt: Time step
        physics_params: PhysicsParams object
    """
    # Add random forces (vectorized)
    random_forces = (
        np.random.uniform(-1, 1, particles.velocity.shape)
        * physics_params.noise_strength
    )
    particles.velocity += random_forces * dt

    # Calculate target attraction (vectorized)
    target_dirs = particles.target - particles.position  # Shape: (N, 2)
    target_distances = np.linalg.norm(
        target_dirs, axis=1, keepdims=True
    )  # Shape: (N, 1)

    # Avoid division by zero
    valid_mask = target_distances.flatten() > 1e-8

    # Normalize target directions
    normalized_target_dirs = np.zeros_like(target_dirs)
    if np.any(valid_mask):
        valid_distances = target_distances[valid_mask]
        normalized_target_dirs[valid_mask] = target_dirs[valid_mask] / valid_distances

    # Apply weak attraction (vectorized)
    attraction_strength = 0.5
    attraction_forces = normalized_target_dirs * attraction_strength * dt
    particles.velocity += attraction_forces

    # Apply damping (vectorized)
    particles.velocity *= physics_params.damping

    # Update positions (vectorized)
    particles.position += particles.velocity * dt

    # Clamp positions (vectorized) - preserve dtype
    particles.position[:] = np.clip(particles.position, 0.0, 1.0)


def vectorized_converging_physics(particles, dt: float, physics_params) -> None:
    """
    Optimized converging physics using vectorized operations.

    Args:
        particles: ParticleArrays object
        dt: Time step
        physics_params: PhysicsParams object
    """
    # Calculate target directions and distances (vectorized)
    target_dirs = particles.target - particles.position  # Shape: (N, 2)
    target_distances = np.linalg.norm(
        target_dirs, axis=1, keepdims=True
    )  # Shape: (N, 1)

    # Only attract particles that are not very close (vectorized mask)
    attraction_mask = target_distances.flatten() > 0.01

    # Normalize directions for particles that need attraction
    normalized_dirs = np.zeros_like(target_dirs)
    valid_indices = attraction_mask & (target_distances.flatten() > 1e-8)
    if np.any(valid_indices):
        # Fix broadcasting issue - target_distances needs proper indexing
        valid_distances = target_distances[valid_indices]
        normalized_dirs[valid_indices] = target_dirs[valid_indices] / valid_distances

    # Apply attraction force (vectorized)
    attraction_strength = physics_params.attraction_strength * 2.0
    attraction_forces = normalized_dirs * attraction_strength * dt
    particles.velocity += attraction_forces

    # Apply damping (vectorized)
    particles.velocity *= physics_params.damping

    # Update positions (vectorized)
    particles.position += particles.velocity * dt

    # Clamp positions (vectorized) - preserve dtype
    particles.position[:] = np.clip(particles.position, 0.0, 1.0)


def vectorized_formation_physics(particles, dt: float, physics_params) -> None:
    """
    Optimized formation physics using vectorized operations.

    Args:
        particles: ParticleArrays object
        dt: Time step
        physics_params: PhysicsParams object
    """
    # Calculate target directions and distances (vectorized)
    target_dirs = particles.target - particles.position
    target_distances = np.linalg.norm(target_dirs, axis=1, keepdims=True)

    # Strong attraction to targets (vectorized)
    valid_mask = target_distances.flatten() > 1e-8
    normalized_dirs = np.zeros_like(target_dirs)
    if np.any(valid_mask):
        valid_distances = target_distances[valid_mask]
        normalized_dirs[valid_mask] = target_dirs[valid_mask] / valid_distances

    # Very strong attraction in formation stage
    attraction_strength = physics_params.attraction_strength * 5.0
    attraction_forces = normalized_dirs * attraction_strength * dt
    particles.velocity += attraction_forces

    # Higher damping for stability
    particles.velocity *= physics_params.damping * 0.9

    # Update positions (vectorized)
    particles.position += particles.velocity * dt

    # Clamp positions (vectorized) - preserve dtype
    particles.position[:] = np.clip(particles.position, 0.0, 1.0)


def vectorized_breathing_physics(
    particles, dt: float, physics_params, breathing_oscillator, stage_elapsed: float
) -> None:
    """
    Optimized breathing physics using vectorized operations.

    Args:
        particles: ParticleArrays object
        dt: Time step
        physics_params: PhysicsParams object
        breathing_oscillator: BreathingOscillator instance
        stage_elapsed: Time elapsed in breathing stage
    """
    # Get breathing offsets for all particles (vectorized)
    breathing_offsets = breathing_oscillator.get_batch_oscillation(
        stage_elapsed, len(particles.position)
    )

    # Apply breathing effect (vectorized)
    center = np.array([0.5, 0.5], dtype=particles.position.dtype)
    offset_vectors = particles.position - center

    # Apply breathing oscillation (vectorized)
    breathing_scale = 1.0 + (breathing_offsets.reshape(-1, 1) * 0.02)
    particles.position[:] = center + offset_vectors * breathing_scale

    # Ensure positions stay in bounds - preserve dtype
    particles.position[:] = np.clip(particles.position, 0.0, 1.0)


def optimized_recognition_score(positions: np.ndarray, targets: np.ndarray) -> float:
    """
    Optimized recognition score calculation using vectorized operations.

    Args:
        positions: Current particle positions (N, 2)
        targets: Target positions (N, 2)

    Returns:
        Recognition score between 0.0 and 1.0
    """
    if len(positions) == 0:
        return 0.0

    # Calculate distances (vectorized)
    distances = np.linalg.norm(targets - positions, axis=1)

    # Calculate average distance and convert to recognition score
    avg_distance = np.mean(distances)

    # Map distance to recognition (closer = higher recognition)
    # Assuming max distance is sqrt(2) (diagonal of unit square)
    max_distance = np.sqrt(2.0)
    recognition = max(0.0, 1.0 - (avg_distance / max_distance))

    return recognition


def optimized_chaos_energy(velocities: np.ndarray) -> float:
    """
    Optimized chaos energy calculation using vectorized operations.

    Args:
        velocities: Particle velocities (N, 2)

    Returns:
        Chaos energy value
    """
    if len(velocities) == 0:
        return 0.0

    # Calculate velocity magnitudes (vectorized)
    velocity_magnitudes = np.linalg.norm(velocities, axis=1)

    # Return variance of velocity magnitudes
    return float(np.var(velocity_magnitudes))


def batch_color_update(
    particles, color_mapper, target_image_data: np.ndarray | None = None
) -> None:
    """
    Optimized batch color update using vectorized operations.

    Args:
        particles: ParticleArrays object
        color_mapper: ColorMapper instance
        target_image_data: Optional target image data for color sampling
    """
    if target_image_data is not None:
        # Sample colors from target image based on target positions (vectorized)
        # This would need to be implemented in ColorMapper as a batch operation
        pass

    # For now, keep existing color update logic but ensure it's called less frequently
    # Color updates can be done every few frames instead of every frame
    pass


# Performance monitoring utilities


def measure_physics_performance(physics_func, *args, **kwargs):
    """
    Measure performance of a physics function.

    Args:
        physics_func: Physics function to measure
        *args, **kwargs: Arguments to pass to the function

    Returns:
        Tuple of (result, execution_time_ms)
    """
    import time

    start_time = time.perf_counter()
    result = physics_func(*args, **kwargs)
    end_time = time.perf_counter()
    execution_time_ms = (end_time - start_time) * 1000
    return result, execution_time_ms


def create_performance_optimized_engine():
    """
    Factory function to create a ParticleEngine with performance optimizations enabled.
    This could be used to create engines with optimized physics methods.
    """
    # This would return a ParticleEngine with the vectorized methods patched in
    pass
