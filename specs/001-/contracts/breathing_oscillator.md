# Contract: BreathingOscillator

## Responsibility
Apply subtle micro-movement to particle positions in final stage.

## Interface
```python
def apply(positions, t: float, amplitude: float) -> None: ...
```

## Constraints
- Max displacement component-wise ≤ amplitude (≤0.03 scene width)
- Smooth (sin / layered noise) — no discontinuities

## Tests
- Displacement RMS ≤ amplitude*0.7
- No position leaves [0,1]^2 after clamp
