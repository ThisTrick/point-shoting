# Contract: StageTransitionPolicy

## Responsibility
Determine when to move between animation stages based on metrics & time.

## Interface
```python
def evaluate(state: dict, t: float) -> str: ...  # returns next stage name or current
```

## Inputs (state)
- current_stage
- chaos_energy
- recognition_score
- time_in_stage

## Tests
- CHAOS -> CONVERGING when chaos_energy < threshold
- CONVERGING -> FORMATION when recognition_score ≥0.8 OR t fallback
