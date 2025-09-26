# Recognition Algorithm Specification

**Feature**: Particle Burst → Image Formation  
**Document Version**: 1.0  
**Date**: 2025-09-26  
**Requirements**: FR-006, NFR-003  

## Overview

The recognition algorithm determines how closely the current particle configuration matches the target image. This score drives stage transitions from CONVERGING to FORMATION and provides user feedback on animation progress.

## Algorithm Definition

### Core Recognition Score

The recognition algorithm computes a normalized score `R ∈ [0, 1]` where:
- `R = 0`: No recognizable pattern (complete chaos)
- `R = 1`: Perfect image formation achieved

### Calculation Method

```python
def calculate_recognition_score(particles: ParticleArrays, target_image: np.ndarray) -> float:
    """
    Calculate recognition score based on particle-to-target proximity.
    
    Args:
        particles: Current particle positions and targets
        target_image: Reference image array (H, W, 3)
    
    Returns:
        Recognition score in [0, 1] range
    """
    positions = particles.position  # Current positions [N, 2]
    targets = particles.target      # Target positions [N, 2]
    
    # Calculate distance from each particle to its target
    distances = np.linalg.norm(positions - targets, axis=1)  # [N]
    
    # Convert distances to proximity scores
    # Max expected distance is diagonal of unit square = sqrt(2)
    max_distance = np.sqrt(2.0)
    proximity_scores = 1.0 - np.clip(distances / max_distance, 0.0, 1.0)
    
    # Aggregate proximity scores
    # Use different aggregation methods based on stage
    recognition = np.mean(proximity_scores)
    
    # Apply non-linear mapping for better user perception
    # Emphasize the final formation phase
    recognition = recognition ** 0.7  # Power law for better visual progression
    
    return float(np.clip(recognition, 0.0, 1.0))
```

### Stage-Specific Behavior

#### CHAOS → CONVERGING Transition
- Recognition threshold: `R ≥ 0.1`
- Indicates particles beginning to organize toward targets
- Used in conjunction with energy threshold (see `StageTransitionPolicy`)

#### CONVERGING → FORMATION Transition  
- Recognition threshold: `R ≥ 0.8`
- Primary condition for entering formation stage
- Fallback timer: `formation_fallback_time` (default 10s) if threshold not met

#### FORMATION Stage
- **Monotonic Constraint**: Recognition score must be non-decreasing
- If score decreases, apply smoothing to maintain user perception of progress
- Target threshold: `R ≥ 0.95` for completion

### Performance Requirements

#### Computation Frequency
- **Default**: Computed every 5 frames (`recognition_computation_interval = 5`)
- **Rationale**: Recognition computation can be expensive for high particle counts
- **Cache Strategy**: Intermediate results cached between computations

#### Performance Budget
- **Target**: Recognition computation ≤ 2ms per frame (at 60 FPS)
- **High Density**: ≤ 3ms for 15k particles
- **Fallback**: Reduce computation frequency if budget exceeded

### Algorithm Variants

#### Basic Proximity (Current Implementation)
- Simple Euclidean distance to targets
- Fast computation, suitable for real-time use
- May not capture visual image fidelity accurately

#### Visual Similarity (Future Enhancement)
- Compare rendered particle image to target image
- Use structural similarity (SSIM) or feature matching
- Higher computational cost, more accurate recognition

#### Adaptive Thresholds (Future Enhancement)
- Dynamic recognition thresholds based on image complexity
- Simple images: higher thresholds required
- Complex images: lower thresholds acceptable

### Configuration Parameters

```python
@dataclass
class RecognitionConfig:
    """Recognition algorithm configuration"""
    
    # Computation settings
    computation_interval: int = 5  # frames between calculations
    max_computation_time_ms: float = 2.0  # performance budget
    
    # Threshold settings
    chaos_to_converging_threshold: float = 0.1
    converging_to_formation_threshold: float = 0.8
    formation_completion_threshold: float = 0.95
    
    # Algorithm tuning
    distance_power: float = 0.7  # non-linear mapping exponent
    smoothing_factor: float = 0.1  # for monotonic enforcement
    adaptive_thresholds: bool = False  # future feature flag
```

### Error Handling

#### Invalid Input Handling
- Empty particle arrays: Return `R = 0.0`
- Missing target data: Return `R = 0.0`
- Numerical overflow: Clamp to `[0, 1]` range

#### Performance Degradation
- If computation exceeds budget: Increase `computation_interval`
- If memory pressure: Reduce particle sampling for recognition
- Graceful degradation: Fall back to timer-based stage transitions

### Testing Strategy

#### Unit Tests
- Boundary conditions: empty arrays, single particle
- Known configurations: particles at targets should yield `R ≈ 1.0`
- Distance calculation accuracy: verify against manual calculations

#### Property-Based Tests
- Recognition score monotonicity during FORMATION stage
- Score bounds: always `R ∈ [0, 1]`
- Consistency: same configuration should yield same score

#### Performance Tests
- Computation time under various particle counts
- Memory allocation patterns
- Degradation behavior under load

### Implementation Notes

#### Current Limitations
- Recognition based purely on position, ignores color accuracy
- Fixed thresholds may not suit all image types
- No consideration of particle distribution or clustering

#### Future Improvements
- **Color-aware Recognition**: Factor in particle color vs target color
- **Structural Analysis**: Detect formation of recognizable shapes/edges
- **Machine Learning**: Trained model for image similarity assessment
- **User Feedback**: Allow threshold adjustment based on user satisfaction

### Integration Points

#### StageTransitionPolicy Integration
```python
# Recognition score feeds into stage transition decisions
if current_stage == Stage.CONVERGING:
    recognition = engine.get_recognition_score()
    if recognition >= settings.converging_to_formation_threshold:
        transition_to(Stage.FORMATION)
```

#### Metrics Integration
```python
# Recognition score exposed in engine metrics
def get_metrics(self) -> Metrics:
    return Metrics(
        recognition=self.get_recognition_score(),
        # ... other metrics
    )
```

#### HUD Integration
```python
# Recognition displayed to user (if HUD enabled)
def render_hud(self, metrics: Metrics) -> str:
    recognition_percent = int(metrics.recognition * 100)
    return f"Recognition: {recognition_percent}%"
```

### References

- **FR-006**: Recognition Score Calculation
- **NFR-003**: Recognition Performance Requirements
- **Stage Transition Policy**: `src/point_shoting/services/stage_transition_policy.py`
- **Math Utils**: `src/point_shoting/lib/math_utils.py`

---

*This specification will be updated as the recognition algorithm evolves through user testing and performance optimization.*
