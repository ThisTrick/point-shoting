# Contract: HUDRenderer

## Responsibility
Produce textual (or minimal styled) overlay of metrics.

## Interface
```python
def render(metrics: dict, stage: str) -> str: ...
```

## Constraints
- Rendering time target <5% frame budget
- Should degrade to plain text if rich formatting slow

## Tests
- Large metrics dict still renders under threshold (mock timing)
