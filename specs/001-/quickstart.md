# Quickstart

## Environment
Python 3.11+ (CPU only). Recommended: create virtualenv.

## Install
```
pip install -r requirements.txt
```
(Requirements file to be generated in implementation phase: numpy, pillow, rich (optional), pytest.)

## Minimal Example (conceptual)
```python
from engine import ParticleEngine
from time import perf_counter

engine = ParticleEngine.from_image('input.png', density='medium')
start = perf_counter()
while True:
    frame = engine.step()
    if engine.stage == 'RECOGNIZED' and perf_counter() - start > 10:
        break
```

## Performance Expectations
- Medium density (~9k particles) should maintain ≥55 FPS on a 4-core CPU.

## Next Steps
See `plan.md` Phase 2 for upcoming implementation tasks.
