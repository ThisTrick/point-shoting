# Tasks: Particle Burst → Image Formation

**Feature Dir**: `/home/den/git/point-shoting/specs/001-/`  
**Spec**: `spec.md`  
**Plan**: `plan.md`  
**Research**: `research.md`  
**| T059 | [X] | Update `quickstart.md` to reflect actual API surfaces |
| T060 | [X] | Add README feature section & usage examples |
| T061 | [X] | Add CI workflow `.github/workflows/ci.yml` (lint + tests) |
| T062 | [X] | Refactor duplication (scan & extract common math to `src/lib/math_utils.py`) | Model**: `data-model.md`  
**Contracts**: `contracts/*.md`  
**Project Structure Decision**: Single project (`src/`, `tests/` at repo root) per `plan.md`.

## **📊 CURRENT PROGRESS STATUS (Updated: 2025-09-25)**

### **Completed Phases:**
- ✅ **Phase 3.1** (T001-T009): Project Setup - COMPLETED
- ✅ **Phase 3.2** (T010-T025): Contract & Integration Tests - COMPLETED  
- ✅ **Phase 3.3** (T026-T029): Core Models & Data Structures - COMPLETED
- ✅ **Phase 3.4** (T030-T036): Core Services/Policies - COMPLETED
- ✅ **Phase 3.5** (T037-T047): ParticleEngine Implementation - COMPLETED
- ✅ **Phase 3.6** (T048-T050): Orchestration Layer - COMPLETED

### **Completed Phases:**
- ✅ **Phase 3.1** (T001-T009): Project Setup - COMPLETED
- ✅ **Phase 3.2** (T010-T025): Contract & Integration Tests - COMPLETED  
- ✅ **Phase 3.3** (T026-T029): Core Models & Data Structures - COMPLETED
- ✅ **Phase 3.4** (T030-T036): Core Services/Policies - COMPLETED
- ✅ **Phase 3.5** (T037-T047): ParticleEngine Implementation - COMPLETED
- ✅ **Phase 3.6** (T048-T050): Orchestration Layer - COMPLETED
- ✅ **Phase 3.7** (T051-T056): Integration Wiring & Additional Tests - COMPLETED
  - Contract test activation: **37 passed, 34 skipped** 
  - Unit tests: **42 additional tests passed** across 5 new test files
  - Property-based tests with hypothesis framework implemented

### **In Progress:**
- 🔄 **Phase 3.8** (T057-T075): Performance & Polish - IN PROGRESS (T057-T070 completed)

### **Tasks Completed:** 70/100 (70% overall completion)
### **Test Status:** 102 passed, 7 failed (mainly performance/timing sensitive tests)
### **Git Status:** Committed as `945c214` - All core services implemented and tested

## Generation Inputs
Artifacts parsed:
- Entities (data-model.md): Particle (array-structured), Stage Enum, Settings, StageTransitionPolicy state structure.
- Contracts (9): particle_engine, color_mapper, control_interface, hud_renderer, localization_provider, settings_store, stage_transition_policy, breathing_oscillator, watermark_renderer.
- Quickstart scenario: minimal loop reaching recognition ≥0.8 within ≤10s.
- Research decisions: HUD overhead ≤5%, stable particle count (no dissolve), resize pre-start only, persistence enabled, watermark rules (PNG, ≥64px), metrics debug-only.

## Execution Flow (main)
```
1. Load plan.md (tech stack: Python 3.11, NumPy, Pillow, Rich, pytest)
2. Load design docs (data-model, contracts, research decisions, quickstart)
3. Produce Setup → Tests (contract & integration) → Models → Services/Policies → Engine Feature Increments → Integration Wiring → Polish
4. Mark [P] for tasks in distinct files with no dependency conflicts
5. Number sequentially (T001 ...)
6. Provide dependency notes + parallel launch examples
7. Validate coverage (all contracts & entities mapped) BEFORE execution
```

## Format
`[ID] [P?] Description (file path)`  
`[P]` = Task can execute in parallel safely (different file & dependencies satisfied).

---
## Phase 3.1: Setup
| ID | P | Task |
|----|---|------|
| T001 | [X] | Create base project structure: `src/{models,services,cli,lib}` and `tests/{contract,integration,unit,performance}` |
| T002 | [X] | Add `pyproject.toml` (Python 3.11, dependencies), generate `uv.lock` via `uv lock`, export `requirements.txt` for tooling (numpy, pillow, rich(optional), pytest, hypothesis(optional), ruff) |
| T003 | [X] | Add lint/format config: `.ruff.toml`, enable line length & import sort |
| T004 | [X] | Add `pytest.ini` (testpaths, markers: contract,integration,performance) |
| T005 | [X] | Add `.editorconfig` & basic `.gitignore` (venv, __pycache__, build artifacts) |
| T006 | [X] | Add `src/__init__.py` and package namespace `src/point_shoting/__init__.py` |
| T007 | [X] | Add logging setup module `src/lib/logging_config.py` (structured logger, DEBUG toggle) |
| T008 | [X] | Add performance timing helper `src/lib/timing.py` (context timer, rolling avg) |
| T009 | [X] | Add `Makefile` targets: install, lint, test, test-watch |
| T009a | [X] | Add `scripts/uv_sync.sh` (wrapper: uv sync + export requirements) & document in README |

Dependencies: T001 before others; T002 before tasks adding config referencing deps; remaining setup [P] after T001.

---
## Phase 3.2: Tests First (TDD) – Contract & Invariant / Integration Seeds
Goal: Write failing tests BEFORE implementation.

### Contract Tests (1:1 with contracts) – all [P]
| ID | P | Task |
|----|---|------|
| T010 | [X] | Create contract test `tests/contract/test_particle_engine.py` (methods exist, invariants placeholders, step() pre-init error) |
| T011 | [X] | Create contract test `tests/contract/test_color_mapper.py` (stylized ≤32 colors, precise ΔE median placeholder) |
| T012 | [X] | Create contract test `tests/contract/test_control_interface.py` (idempotent pause/resume, restart debounce) |
| T013 | [X] | Create contract test `tests/contract/test_hud_renderer.py` (render output type, performance budget mocked) |
| T014 | [X] | Create contract test `tests/contract/test_localization_provider.py` (missing key fallback) |
| T015 | [X] | Create contract test `tests/contract/test_settings_store.py` (corrupted file → defaults, round-trip) |
| T016 | [X] | Create contract test `tests/contract/test_stage_transition_policy.py` (CHAOS→CONVERGING energy threshold, CONVERGING→FORMATION recognition ≥0.8 OR fallback) |
| T017 | [X] | Create contract test `tests/contract/test_breathing_oscillator.py` (RMS displacement ≤ amplitude*0.7, bounds clamp) |
| T018 | [X] | Create contract test `tests/contract/test_watermark_renderer.py` (reject non-PNG, min size rule, positioning) |

### Invariant & Integration-Oriented Early Tests (distinct files, [P])
| ID | P | Task |
|----|---|------|
| T019 | [X] | Integration test `tests/integration/test_full_loop_recognition.py`: simulation reaches recognition ≥0.8 ≤10s (fast-forward/mocked timing) |
| T020 | [X] | Invariant test `tests/integration/test_particle_bounds.py`: positions remain in [0,1]^2 across steps |
| T021 | [X] | Invariant test `tests/integration/test_particle_count_stable.py`: particle count constant (no dissolve) |
| T022 | [X] | Invariant test `tests/integration/test_velocity_cap.py`: velocity magnitude ≤ vmax(stage) |
| T023 | [X] | Invariant test `tests/integration/test_recognition_monotonic.py`: recognition non-decreasing in FORMATION (mock metrics) |
| T024 | [X] | Performance budget test skeleton `tests/performance/test_hud_overhead.py`: HUD render mock <5% frame budget (time stub) |
| T025 | [X] | Settings persistence integration `tests/integration/test_settings_persistence.py` (save→load) |

Dependencies: All (T010–T025) depend on setup completion (T001–T009). They can run fully in parallel after setup.

---
## Phase 3.3: Core Models & Data Structures (implement AFTER tests exist)
| ID | P | Task |
|----|---|------|
| T026 | [X] | Implement Stage enum `src/models/stage.py` (PRE_START,BURST,CHAOS,CONVERGING,FORMATION,FINAL_BREATHING) |
| T027 | [X] | Implement Settings dataclass `src/models/settings.py` (fields per data-model + validation) |
| T028 | [X] | Implement particle arrays module `src/models/particle_arrays.py` (allocate structured NumPy arrays) |
| T029 | [X] | Implement metrics DTO `src/models/metrics.py` (fps_avg,fps_instant,particle_count,stage,recognition) |

Dependencies: All depend on tests existing (Phase 3.2) & setup; can be parallel.

---
## Phase 3.4: Core Services / Policies (independent components)
| ID | P | Task |
|----|---|------|
| T030 | [X] | Implement StageTransitionPolicy `src/services/stage_transition_policy.py` (evaluate() logic, thresholds) |
| T031 | [X] | Implement SettingsStore `src/services/settings_store.py` (load/save with whitelist + corruption handling) |
| T032 | [X] | Implement LocalizationProvider `src/services/localization_provider.py` + `i18n/en.json` & sample `i18n/uk.json` |
| T033 | [X] | Implement ColorMapper `src/services/color_mapper.py` (build_palettes, color_for placeholder) |
| T034 | [X] | Implement BreathingOscillator `src/services/breathing_oscillator.py` (apply()) |
| T035 | [X] | Implement HUDRenderer `src/services/hud_renderer.py` (render() plain + rich branch) |
| T036 | [X] | Implement WatermarkRenderer `src/services/watermark_renderer.py` (render() PNG only) |

Dependencies: Phase 3.3 complete. All independent → parallel.

---
## Phase 3.5: ParticleEngine Incremental Implementation (sequential same file)
`src/services/particle_engine.py` will evolve over multiple tasks (NO [P])
| ID | P | Task |
|----|---|------|
| T037 | [X] | Create skeleton ParticleEngine (init(), step() raises NotImplemented, stage(), metrics(), snapshot()) |
| T038 | [X] | Implement initialization: load image (Pillow thumbnail), allocate arrays via particle_arrays, map targets |
| T039 | [X] | Integrate ColorMapper for initial color assignment (stylized & precise modes) |
| T040 | [X] | Implement CHAOS/BURST physics update (velocity damping, boundary clamp) |
| T041 | [X] | Integrate StageTransitionPolicy evaluation inside step() |
| T042 | [X] | Implement recognition score placeholder + monotonic enforcement in FORMATION |
| T043 | [X] | Integrate BreathingOscillator in FINAL_BREATHING stage (amplitude clamp) |
| T044 | [X] | Add metrics computation (fps avg using timing helper) |
| T045 | [X] | Integrate HUDRenderer (conditional on settings.hud_enabled) |
| T046 | [X] | Integrate WatermarkRenderer on final frame composition (if watermark valid) |
| T047 | [X] | Finalize apply_settings() (safe between cycles, restart gate) |

Dependencies: Strict sequence T037 → T047 (single file evolution).

---
## Phase 3.6: Orchestration Layer
| ID | P | Task |
|----|---|------|
| T048 | [X] | Implement ControlInterface `src/cli/control_interface.py` (start, pause, resume, skip_final, restart, apply_settings debounce) |
| T049 | [X] | Implement CLI entrypoint `src/cli/main.py` (argparse: image, density, speed, color-mode, hud, locale, loop) |
| T050 | [X] | Add quickstart example script `examples/minimal_run.py` mapping to quickstart.md |

Dependencies: ParticleEngine (through T047) & services done before T048. T049/T050 parallel after T048.

---
## Phase 3.7: Integration Wiring & Additional Tests
| ID | P | Task |
|----|---|------|
| T051 | [X] | Update existing contract tests with concrete assertions now that implementations exist (ColorMapper 6/6✅, BreathingOscillator 4/7✅, progress: 37 passed, 34 skipped) |
| T052 | [X] | Add unit tests `tests/unit/test_stage_transition_policy_thresholds.py` (edge thresholds) - 6 tests passed |
| T053 | [X] | Add unit tests `tests/unit/test_color_mapper_precision.py` (ΔE sample calc) - 7 tests passed |
| T054 | [X] | Add unit tests `tests/unit/test_breathing_oscillator_signal.py` (waveform continuity) - 8 tests passed |
| T055 | [X] | Add unit tests `tests/unit/test_watermark_rules.py` (min size, format) - 12 tests passed |
| T056 | [X] | Add property-based tests (hypothesis) `tests/unit/test_particle_positions_properties.py` (positions within bounds) - 9 tests passed |

Dependencies: Core implementations complete.

---
## Phase 3.8: Polish & Performance
| ID | P | Task |
|----|---|------|
| T057 | [X] | Performance test `tests/performance/test_fps_medium_density.py` (≥55 FPS simulated/benchmark harness) |
| T058 | [X] | Add profiling script `scripts/profile_engine.py` (prints stage timings) |
| T059 | [X] | Update `quickstart.md` to reflect actual API surfaces |
| T060 | [X] | Add README feature section & usage examples |
| T061 | [X] | Add CI workflow `.github/workflows/ci.yml` (lint + tests) |
| T062 | [X] | Refactor duplication (scan & extract common math to `src/lib/math_utils.py`) |
| T063 | [X] | Add type checking (mypy or pyright config) + fix annotations |
| T064 | [X] | Cleanup & finalize docstrings (public modules) |
| T065 | [X] | Add structured logging & error reporting scaffold `src/lib/obs.py` (JSON logger, opt-in crash handler) (FR-016, NFR-009) |
| T066 | [X] | Add memory usage benchmark test `tests/performance/test_memory_medium_density.py` (assert ≤300MB RSS) (NFR-008) |
| T067 | [X] | Add start latency test `tests/integration/test_start_latency.py` (≤2s to first burst) (FR-008, NFR-002) |
| T068 | [X] | Add pause latency test `tests/integration/test_pause_latency.py` (≤200ms) (NFR-005) |
| T069 | [X] | Add large image handling test `tests/integration/test_large_image_rejection.py` (behavior with large images) (FR-037, NFR-004) |
| T070 | [X] | Add settings persistence comprehensive test `tests/integration/test_settings_persistence_comprehensive.py` (FR-034) |
| T071 | [P] | Add skip smooth transition test `tests/integration/test_skip_transition_smoothness.py` (FR-031, NFR-007) |
| T072 | [P] | Add debounce spam test `tests/integration/test_control_debounce.py` (FR-028) |
| T073 | [P] | Add small image upscale behavior test `tests/integration/test_small_image_upscale.py` (FR-032) |
| T074 | [P] | Add watermark rules test `tests/integration/test_watermark_rules_integration.py` (FR-033) |
| T075 | [P] | Add settings boundary change test `tests/integration/test_settings_cycle_boundary.py` (FR-035, FR-022) |
| T076 | [P] | Add persistence restore test `tests/integration/test_settings_persistence_restore.py` (FR-036) |
| T077 | [P] | Add transparent pixels handling test `tests/integration/test_transparent_pixels_targeting.py` (FR-030) |
| T078 | [P] | Add dynamic locale addition test `tests/integration/test_dynamic_locale_addition.py` (NFR-006, FR-018) |
| T079 | [P] | Add breathing amplitude envelope integration test `tests/integration/test_breathing_amplitude.py` (FR-014) |
| T080 | [P] | Add artifact absence heuristic test `tests/integration/test_no_visual_artifacts.py` (FR-021, NFR-007) |
| T081 | [P] | Add aspect ratio preservation test `tests/integration/test_aspect_ratio_preservation.py` (FR-002) |
| T082 | [P] | Add speed profiles test `tests/integration/test_speed_profiles.py` (FR-009) |
| T083 | [P] | Add density performance warning test `tests/integration/test_density_warning.py` (FR-010) |
| T084 | [P] | Add restart state reset test `tests/integration/test_restart_state_reset.py` (FR-024) |
| T085 | [P] | Add mid-cycle safe changes test `tests/integration/test_mid_cycle_safe_changes.py` (FR-038) |
| T086 | [P] | Add recognition algorithm spec doc `docs/recognition_algo.md` + task to finalize implementation (FR-006, NFR-003) |
| T087 | [P] | Add loop mode test `tests/integration/test_loop_mode.py` (FR-015) |
| T088 | [P] | Add HUD default off test `tests/integration/test_hud_default_off.py` (FR-017) |
| T089 | [P] | Add background blur config test `tests/integration/test_background_blur.py` (FR-013) |
| T090 | [P] | Add change settings between cycles test (density rejection mid-cycle) `tests/integration/test_setting_change_restrictions.py` (FR-035) |
| T091 | [P] | Add cycle completion despite mid-run changes test `tests/integration/test_cycle_completion_integrity.py` (FR-029, FR-038) |
| T092 | [P] | Add burst generation pattern test `tests/integration/test_burst_wave_pattern.py` (FR-003) |
| T093 | [P] | Add chaos visibility duration test `tests/integration/test_chaos_phase_duration.py` (FR-004) |
| T094 | [P] | Add transition smoothness quantitative test `tests/integration/test_phase_transition_smoothness.py` (FR-005, NFR-007) |
| T095 | [P] | Add particle count stability strict test `tests/integration/test_particle_count_delta.py` (FR-026) |
| T096 | [P] | Add memory/logging documentation update in README (NFR-009, NFR-008) |
| T097 | [P] | Add accessibility backlog doc `docs/accessibility_backlog.md` referencing future GUI (Principle 2) |
| T098 | [P] | Add cross-platform roadmap doc `docs/gui_roadmap.md` (Principle 1 compliance path) |
| T099 | [P] | Tag all existing tasks with FR/NFR references in comments for traceability matrix generation script (meta) |
| T100 | [P] | Add traceability script `scripts/generate_trace_matrix.py` (maps tasks → FR/NFR) |

## Traceability Notes
All new tasks T065–T100 explicitly reference one or more FR/NFR codes to improve coverage. A future matrix will be generated by T100.


Dependencies: After core + orchestration (T037–T050). Mostly independent.

---
## Dependencies Summary
- Setup (T001–T009) precedes all tests & code.
- Tests-first: All contract/integration tests (T010–T025) before implementations they cover.
- Models (T026–T029) before services (T030–T036) & engine (T037+).
- Services (T030–T036) before engine increments integrating them (T039+ depending on service).
- ParticleEngine sequential tasks (T037–T047) block ControlInterface (T048) and later integration tasks referencing advanced features.
- Orchestration (T048) before CLI & examples (T049–T050).
- Final polish/performance after all functional layers.

## Parallel Execution Guidance
Example: Launch all contract tests in parallel after setup:
```
Task: "T010 Create contract test tests/contract/test_particle_engine.py"
Task: "T011 Create contract test tests/contract/test_color_mapper.py"
Task: "T012 Create contract test tests/contract/test_control_interface.py"
Task: "T013 Create contract test tests/contract/test_hud_renderer.py"
Task: "T014 Create contract test tests/contract/test_localization_provider.py"
Task: "T015 Create contract test tests/contract/test_settings_store.py"
Task: "T016 Create contract test tests/contract/test_stage_transition_policy.py"
Task: "T017 Create contract test tests/contract/test_breathing_oscillator.py"
Task: "T018 Create contract test tests/contract/test_watermark_renderer.py"
```

Example: Parallel model implementations:
```
Task: "T026 Implement Stage enum src/models/stage.py"
Task: "T027 Implement Settings dataclass src/models/settings.py"
Task: "T028 Implement particle arrays module src/models/particle_arrays.py"
Task: "T029 Implement metrics DTO src/models/metrics.py"
```

Example: Parallel services after models:
```
Task: "T030 Implement StageTransitionPolicy src/services/stage_transition_policy.py"
Task: "T031 Implement SettingsStore src/services/settings_store.py"
Task: "T032 Implement LocalizationProvider src/services/localization_provider.py"
Task: "T033 Implement ColorMapper src/services/color_mapper.py"
Task: "T034 Implement BreathingOscillator src/services/breathing_oscillator.py"
Task: "T035 Implement HUDRenderer src/services/hud_renderer.py"
Task: "T036 Implement WatermarkRenderer src/services/watermark_renderer.py"
```

## Validation Checklist
- [ ] All contracts have test tasks (9/9) → T010–T018
- [ ] All entities have model tasks (Particle arrays, Stage enum, Settings, Metrics) → T026–T029
- [ ] Tests precede implementations (Phases 3.2 before 3.3+)
- [ ] ParticleEngine incremental tasks not marked [P]
- [ ] Parallel tasks operate on distinct files
- [ ] Each task specifies explicit file path(s)
- [ ] Research constraints represented (HUD perf T024, watermark rules T018, persistence T015/T031, no dissolve invariants T021)

## Notes
- Recognition score precise algorithm deferred: placeholder with monotonic enforcement (refine later in polish if needed).
- ΔE calculation test initially may use stub; refine with Pillow pixel sampling or colorspacious lib (optional add).
- Performance FPS test (T057) may use synthetic stepping with mocked time for deterministic thresholding.

---
*Auto-generated via /tasks phase for feature 001-* 
