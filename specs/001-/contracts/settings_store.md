# Contract: SettingsStore

## Responsibility
Persist and restore last-used non-image settings.

## Interface
```python
def load() -> dict: ...
def save(settings: dict) -> None: ...
```

## Rules
- File path: `~/.point_shoting_settings.json`
- Validation: ignore fields outside whitelist

## Tests
- Corrupted file → returns defaults
- Save then load round-trip equality
