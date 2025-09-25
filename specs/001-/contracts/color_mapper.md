# Contract: ColorMapper

## Responsibility
Map source image pixels to particle colors for two modes: stylized, precise.

## Interface
```python
def build_palettes(image) -> None: ...  # precompute stylized palette (k<=32)
def color_for(coord: tuple[float,float], mode: str) -> tuple[int,int,int,int]: ...
```

## Rules
- precise: nearest source pixel color
- stylized: quantized k-means palette (<=32 colors)
- transparency zones: treat as background (skip target mapping unless stylized fill permitted)

## Tests
- Stylized unique color count ≤32
- Precise ΔE median ≤20 vs source sample
