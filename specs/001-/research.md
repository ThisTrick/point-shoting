# Phase 0 Research: Particle Burst → Image Formation

**Spec**: /home/den/git/point-shoting/specs/001-/spec.md  
**Date**: 2025-09-25  
**Scope**: Resolve pending unknowns prior to Phase 1 design.

## Pending Questions & Decisions
| Code | Topic | Decision | Rationale | Alternatives |
|------|-------|----------|-----------|--------------|
| R-001 | HUD FPS impact threshold | NEEDS DECISION | Defines acceptable performance cost for enabling HUD | Fixed % cap (5%, 8%, 10%) |
| R-002 | Dissolve (particle reduction) policy | NEEDS DECISION | Affects consistency FR-026 and optimization strategies | Allow limited fade-out; disallow; dynamic culling |
| R-003 | Runtime resize handling | NEEDS DECISION | Impacts engine architecture & coordinate normalization | Only pre-start; dynamic recompute grid; soft letterbox |
| R-004 | Persistence of last settings | NEEDS DECISION | Determines inclusion of SettingsStore contract scope | JSON file cache; no persistence |
| R-005 | Watermark minimal size & formats | NEEDS DECISION | Validation & scaling logic | PNG only; PNG+SVG |
| R-006 | Expose performance metrics to user | NEEDS DECISION | UI surface vs debug-only separation | HUD only; toggleable overlay |

## Research Approach
1. Prototype performance envelope using synthetic particle updates (NumPy vector ops) for 3k / 9k / 15k particles.
2. Evaluate HUD cost: simulate per-frame metrics formatting with/without Rich.
3. Determine memory footprint: position(float32*2) + velocity(float32*2) + color(uint8*4) ≈ 20 bytes/particle + overhead -> ~200KB@10k + arrays overhead (<5MB total with staging buffers).
4. Define dissolve impact: cost of shrink vs maintaining pool.
5. Resize strategy tradeoff: dynamic recompute vs fixed logical canvas scaling.

## Preliminary Findings
### Performance Envelope (Analytical Est.)
- Vector update O(N) with fused operations ~0.2–0.4 ms @10k on modern CPU core (SIMD via NumPy) → feasible.
- Stage transition evaluation minor (aggregations: mean, variance) <0.1 ms.
- HUD rendering (string formatting) ~0.1–0.3 ms / frame (Rich) — may add up to ~2–3% FPS impact.

### Dissolve Policy
Maintaining stable particle count preserves FR-026 clarity; optional stylistic dissolve complicates invariants → recommend DISALLOW in MVP (can emulate vanish by lowering alpha jitter in stylized mode later).

### Resize Handling
Full dynamic recompute introduces jitter & coordinate remapping costs; simpler: freeze target mapping per cycle; apply letterbox scaling if window changes mid-run → choose PRE-START ONLY for MVP.

### Persistence
Low complexity: JSON file `.point_shoting_settings.json` with last used density, speed, locale. Provides operator quality-of-life. Acceptable within constitution (no PII). Recommend ENABLE.

### Watermark
Accept PNG only (transparency, ubiquity). Enforce min displayed size: 64px shortest side after scaling to scene space. Reject smaller or upscale with smoothing? => Reject smaller (warn user).

### Metrics Exposure
Keep metrics HUD-only (explicit toggle). No persistent logging unless debug flag.

## Decisions Table (Updated)
| Code | Decision | Rationale | Deferred? |
|------|----------|-----------|-----------|
| R-001 | HUD FPS impact ≤5% середньої FPS | Keeps smoothness; measurable | No |
| R-002 | Dissolve disabled (count stable) | Simplifies invariants & tests | No |
| R-003 | Resize only between cycles (pre-start) | Avoids mid-frame jitter | No |
| R-004 | Enable settings persistence (JSON) | UX improvement; low risk | No |
| R-005 | Watermark: PNG only, min 64px side | Simplicity + transparency support | No |
| R-006 | Metrics only in Debug HUD | Avoid clutter for audience | No |

## Impact on Spec (To be Applied Phase 1)
- Clarify FR-026: dissolve not allowed; particle count constant (except controlled stage-specific scripted additions in future versions — not in MVP).
- Add NFR: HUD enabled must not drop average FPS more than 5% over 120s sample.
- Add functional requirement: persistence of last settings (excluding source image) optional toggle.
- Clarify watermark constraints (PNG only, min dimension 64px).
- Clarify window resize behavior: changes queued until next cycle restart.

## Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Python CPU bottleneck at high density | FPS dip | Vectorization + optional process pool experiment later |
| Rich HUD overhead higher than estimate | Reduced FPS | Provide plain-text fallback mode |
| Large source images near 4096² memory spike | Latency at load | Pre-scale sampling grid; streaming decode (Pillow thumbnail) |
| Persistence file corruption | Startup failure | Validate JSON schema; fallback to defaults |

## Next Steps (Phase 1 Input)
1. Define data-model schemas (Particle arrays, Stage enum, Settings dataclass).
2. Draft module contracts + stubs.
3. Write invariant tests first.

-- End Phase 0 Research
