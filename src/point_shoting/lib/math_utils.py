from __future__ import annotations

import numpy as np


def calculate_magnitudes(vectors: np.ndarray) -> np.ndarray:
    """
    Calculate Euclidean magnitudes for a batch of 2D vectors.

    Contract:
    - Input shape: (N, 2) float array
    - Output shape: (N,) float array
    - No NaNs in output if input has no NaNs
    """
    if vectors.ndim != 2 or vectors.shape[1] != 2:
        raise ValueError(f"Expected shape (N, 2), got {vectors.shape}")
    # Use float32 consistently if input is float32 to match project dtype
    dtype = np.float32 if vectors.dtype == np.float32 else np.float64
    # Sum of squares along axis 1, then sqrt
    return np.sqrt(np.sum(vectors.astype(dtype) ** 2, axis=1, dtype=dtype), dtype=dtype)


def calculate_distances(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    """
    Pairwise Euclidean distances between corresponding 2D points in arrays a and b.

    - a.shape == b.shape == (N, 2)
    - Returns (N,) float array
    """
    if a.shape != b.shape or a.ndim != 2 or a.shape[1] != 2:
        raise ValueError(
            f"Expected a and b with shape (N, 2), got {a.shape} and {b.shape}"
        )
    diff = a - b
    return calculate_magnitudes(diff)


def clamp_positions_inplace(
    positions: np.ndarray, lo: float = 0.0, hi: float = 1.0
) -> None:
    """Clamp normalized positions to [lo, hi] range in-place.

    Default matches project convention of [0, 1]. Extra parameters are accepted for
    compatibility with engine calls that specify bounds explicitly.
    """
    np.clip(positions, lo, hi, out=positions)


def calculate_chaos_energy(velocities: np.ndarray) -> float:
    """Compute a scalar "chaos energy" from particle velocities.

    We use mean squared speed (per-particle kinetic proxy without mass factor):
        E = mean(||v||^2)

    Returns a non-negative float. If the array is empty, returns 0.0.
    """
    if velocities.size == 0:
        return 0.0
    # Ensure float computation
    v = velocities.astype(np.float32, copy=False)
    speeds_sq = np.sum(v * v, axis=1)
    return float(np.mean(speeds_sq))


def calculate_recognition_score(positions: np.ndarray, targets: np.ndarray) -> float:
    """Calculate recognition score in [0, 1] from positions vs targets.

    Based on spec: invert normalized distance to targets and aggregate with a perceptual
    power curve to emphasize late-stage progress.
    """
    if (
        positions.shape != targets.shape
        or positions.ndim != 2
        or positions.shape[1] != 2
    ):
        raise ValueError(
            f"Expected positions and targets with shape (N, 2), got {positions.shape} and {targets.shape}"
        )

    if positions.size == 0:
        return 0.0

    # Distances in unit square; max possible is diagonal sqrt(2)
    distances = calculate_distances(
        positions.astype(np.float32, copy=False), targets.astype(np.float32, copy=False)
    )
    max_distance = np.sqrt(2.0).astype(np.float32)
    proximity = 1.0 - np.clip(distances / max_distance, 0.0, 1.0)
    recognition = float(np.mean(proximity))
    # Perceptual mapping
    recognition = recognition**0.7
    # Clamp numerical noise
    return float(np.clip(recognition, 0.0, 1.0))
