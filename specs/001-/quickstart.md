# Quickstart

## Environment
Python 3.11+ (CPU only). We recommend using UV for package management.

## Install
```bash
# Using UV (recommended)
uv sync

# Or using pip
pip install -r requirements.txt
```

## Minimal Example
```python
from point_shoting.services.particle_engine import ParticleEngine
from point_shoting.models.settings import Settings, DensityProfile, SpeedProfile, ColorMode
from point_shoting.models.stage import Stage
import time

# Create settings
settings = Settings(
    density_profile=DensityProfile.MEDIUM,
    speed_profile=SpeedProfile.NORMAL,
    color_mode=ColorMode.STYLIZED,
    hud_enabled=True,  # Shows performance metrics
    locale='en',
    loop_mode=False
)

# Initialize engine
engine = ParticleEngine()
engine.init(settings, 'path/to/your/image.png')
engine.start()

# Run simulation until recognition achieved
start_time = time.time()
target_recognition = 0.8
max_time = 10.0  # seconds

while time.time() - start_time < max_time:
    engine.step()
    metrics = engine.get_metrics()
    
    print(f"Stage: {metrics.stage.name}, Recognition: {metrics.recognition:.3f}, FPS: {metrics.fps_instant:.1f}")
    
    if metrics.recognition >= target_recognition:
        print(f"Recognition achieved in {time.time() - start_time:.2f} seconds!")
        break
    
    # Small delay to avoid overwhelming output
    time.sleep(0.016)  # ~60 FPS

print(f"Final stage: {engine.stage().name}")
```

## CLI Usage
```bash
# Run with default settings
uv run python -m point_shoting path/to/image.png

# Run with custom settings  
uv run python -m point_shoting path/to/image.png --density medium --speed normal --color-mode stylized --hud
```

## Performance Expectations
- Medium density (~9k particles) should maintain ≥55 FPS on a 4-core CPU
- Memory usage should stay under 300MB for up to 15k particles
- Recognition target (≥0.8) should be achieved within 10 seconds

## Profiling
Use the profiling script to analyze performance:
```bash
# Basic profiling
uv run python scripts/profile_engine.py --particles 8000 --steps 100

# Compare different densities
uv run python scripts/profile_engine.py --compare-densities

# Profile specific stage
uv run python scripts/profile_engine.py --stage chaos --particles 5000
```

## Testing
```bash
# Run all tests
uv run pytest

# Run only performance tests
uv run pytest tests/performance/

# Run contract tests
uv run pytest tests/contract/
```
