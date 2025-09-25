# Data Model & State Transitions

**Feature**: Particle Burst → Image Formation  
**Spec**: /home/den/git/point-shoting/specs/001-/spec.md  
**Phase**: 1  
**Date**: 2025-09-25

## Overview
CPU-only Python representation with vectorized arrays for performance. Particles stored in contiguous NumPy arrays to reduce Python loop overhead.

## Entities
### Particle (implicit via arrays)
| Field | Type | Shape | Description | Constraints |
|-------|------|-------|-------------|-------------|
| position | float32 | (N,2) | Current XY in normalized scene space [0,1] | 0≤x,y≤1 |
| velocity | float32 | (N,2) | Current velocity per axis | clamped magnitude ≤ max_speed(stage) |
| target | float32 | (N,2) | Final target XY for formation | fixed after mapping phase |
| color_rgba | uint8 | (N,4) | Display color (stylized or precise) | alpha=255 baseline |
| stage_mask | uint8 | (N,) | Encoded stage flags (bitset) | mutually exclusive main stage bits |
| active | bool8 | (N,) | (Optional) Active particle flag | always True (dissolve disabled) |

### Stage Enum
`PRE_START, BURST, CHAOS, CONVERGING, FORMATION, FINAL_BREATHING`

### StageTransitionPolicy
| Field | Type | Description |
|-------|------|-------------|
| current_stage | Stage | Active stage |
| stage_start_time | float | Timestamp stage entered |
| recognition_score | float | Real-time similarity metric (0..1) |
| chaos_energy | float | Aggregate velocity variance |

### Settings
| Field | Type | Description |
|-------|------|-------------|
| density_profile | enum(low,medium,high) | Determines N particles |
| speed_profile | enum(slow,normal,fast) | Base velocity scaling |
| burst_intensity | int | Number of emission waves |
| color_mode | enum(stylized,precise) | Palette choice logic |
| loop_mode | bool | Enable cycle loop |
| breathing_amplitude | float | ≤0.03 (relative width) |
| watermark_path | str? | PNG path if provided |
| locale | str | 'uk' or 'en' |
| hud_enabled | bool | Debug HUD toggle |

### HUD Metrics
| Field | Type | Description |
|-------|------|-------------|
| fps_avg | float | Rolling average FPS |
| fps_instant | float | Last frame FPS |
| particle_count | int | N (constant) |
| stage | Stage | Current stage |
| recognition | float | Similarity 0..1 |

## Relationships
- Settings determines particle count N and influences velocity caps.
- ParticleEngine owns arrays; StageTransitionPolicy reads aggregates; BreathingOscillator mutates positions small delta.

## Derived / Computed Values
| Name | Formula | Purpose |
|------|---------|---------|
| recognition_score | combine(SSIM>=0.75, ΔE coverage) → mapped to [0..1] | Stage convergence gating |
| chaos_energy | mean(||velocity||) or variance | Transition from CHAOS to CONVERGING |
| dt_adaptive | base_dt * clamp(target_fps / measured_fps, 0.5,1.5) | Soften frame spikes |

## State Transition Diagram (Textual)
```
PRE_START -> BURST (on start command)
BURST -> CHAOS (after all waves emitted OR t>=burst_min_duration)
CHAOS -> CONVERGING (chaos_energy < threshold OR t>=chaos_min)
CONVERGING -> FORMATION (recognition_score >= 0.8 OR t>=formation_fallback_time)
FORMATION -> FINAL_BREATHING (stabilization_window elapsed)
FINAL_BREATHING -> PRE_START (if loop_mode true after pause_duration) OR remain
```

## Transition Conditions Table
| From | To | Primary Condition | Fallback Timeout |
|------|----|------------------|------------------|
| PRE_START | BURST | start pressed | — |
| BURST | CHAOS | emitted_waves == configured | t>=2s |
| CHAOS | CONVERGING | chaos_energy < E_thr | t>= (configured_chaos_dur) |
| CONVERGING | FORMATION | recognition_score ≥0.8 | t>= (10s hard cap) |
| FORMATION | FINAL_BREATHING | stable_frames ≥ S_thr | t>=2s |
| FINAL_BREATHING | PRE_START | loop_mode & loop_pause elapsed | — |

## Validation Rules
- recognition_score computed no more than every K frames (e.g., every 5th) to amortize cost.
- breathing displacement per component ≤0.03 scene width (enforced clamp after oscillator apply).
- particle_count constant across all stages (no dissolve in MVP).
- watermark not rendered if shorter side <64px.

## Invariants
| Invariant | Rationale |
|-----------|-----------|
| All positions in [0,1]^2 | Prevent off-canvas artifacts |
| particle_count == N_initial | Simplifies performance predictability |
| velocity magnitude ≤ vmax(stage) | Avoids tunneling & chaotic overshoot |
| recognition_score non-decreasing after entering FORMATION | Ensures convergence not regression |
| breathing offset RMS ≤ amplitude * 0.7 | Smooth aesthetic (no sharp jitter) |

## Open Items (For Future Extension)
- Potential GPU/WebGL backend swap (not in scope now).
- Optional dissolve effect flagged by style profile.
- Dynamic runtime resize with re-projection.

-- End Data Model
