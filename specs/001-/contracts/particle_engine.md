# Contract: ParticleEngine

## Responsibility
Core simulation loop: updates particle positions, velocities, colors; tracks stages; exposes metrics.

## Interface (Python)
```python
def init(image_path: str, settings: Settings) -> None: ...
def step(dt: float) -> None: ...  # advances simulation one frame quantum
def stage() -> str: ...  # current stage enum name
def metrics() -> dict: ...  # { 'fps': float?, 'recognition': float, 'chaos_energy': float }
def snapshot(limit: int | None = None) -> dict: ...  # partial state for tests
def apply_settings(settings: Settings) -> None: ...  # safe between cycles
```

## Invariants
- particle_count stable after init
- positions remain normalized [0,1]
- stage monotonic progression (no backward steps)

## Errors
- ValueError if image exceeds size constraints
- RuntimeError if called step() before init()

## Test Seeds
1. Initialization with small image → expected particle_count (density profile).
2. After N steps in CHAOS average speed decreases (damping).
3. recognition reaches ≥0.8 within 10s (simulated fast-forward).
