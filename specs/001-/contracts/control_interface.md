# Contract: ControlInterface

## Responsibility
User-facing orchestration layer wrapping ParticleEngine and policies.

## Interface
```python
def start(image_path: str) -> None: ...
def pause() -> None: ...
def resume() -> None: ...
def skip_final() -> None: ...
def restart() -> None: ...
def apply_settings(patch: dict) -> None: ...
```

## Guarantees
- idempotent pause/resume
- skip_final triggers smooth transition ≤1s

## Tests
- Rapid restart spam → debounced (no more than 1 per 500ms)
- skip_final during first second triggers transitional animation flag
