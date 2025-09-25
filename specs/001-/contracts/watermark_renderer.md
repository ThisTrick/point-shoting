# Contract: WatermarkRenderer

## Responsibility
Composite watermark PNG onto final frame.

## Interface
```python
def render(frame, watermark_path: str, position: str, opacity: float) -> None: ...
```

## Rules
- position ∈ {top_left, top_right, bottom_left, bottom_right, center}
- Ignore if image shorter side <64px
- Opacity 0..1 applied uniformly

## Tests
- Reject unsupported format (non-PNG)
- Positioning within scene bounds
