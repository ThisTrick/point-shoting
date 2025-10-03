# Traceability Matrix

**Generated**: 2025-09-26 00:51:49
**Total Tasks**: 103
**Tasks with FR/NFR**: 32

## Coverage Summary

- **Functional Requirements**: 29/38 (76.3%)
- **Non-Functional Requirements**: 8/9 (88.9%)

## Functional Requirements Coverage

| Requirement | Tasks | Status |
|-------------|-------|--------|
| FR-001 | - | ❌ Not Covered |
| FR-002 | T081 | ✅ Covered |
| FR-003 | T092 | ✅ Covered |
| FR-004 | T093 | ✅ Covered |
| FR-005 | T094 | ✅ Covered |
| FR-006 | T086 | ✅ Covered |
| FR-007 | - | ❌ Not Covered |
| FR-008 | T067 | ✅ Covered |
| FR-009 | T082 | ✅ Covered |
| FR-010 | T083 | ✅ Covered |
| FR-011 | - | ❌ Not Covered |
| FR-012 | - | ❌ Not Covered |
| FR-013 | T089 | ✅ Covered |
| FR-014 | T079 | ✅ Covered |
| FR-015 | T087 | ✅ Covered |
| FR-016 | T065 | ✅ Covered |
| FR-017 | T088 | ✅ Covered |
| FR-018 | T078 | ✅ Covered |
| FR-019 | - | ❌ Not Covered |
| FR-020 | - | ❌ Not Covered |
| FR-021 | T080 | ✅ Covered |
| FR-022 | T075 | ✅ Covered |
| FR-023 | - | ❌ Not Covered |
| FR-024 | T084 | ✅ Covered |
| FR-025 | - | ❌ Not Covered |
| FR-026 | T095 | ✅ Covered |
| FR-027 | - | ❌ Not Covered |
| FR-028 | T072 | ✅ Covered |
| FR-029 | T091 | ✅ Covered |
| FR-030 | T077 | ✅ Covered |
| FR-031 | T071 | ✅ Covered |
| FR-032 | T073 | ✅ Covered |
| FR-033 | T074 | ✅ Covered |
| FR-034 | T070 | ✅ Covered |
| FR-035 | T075, T090 | ✅ Covered |
| FR-036 | T076 | ✅ Covered |
| FR-037 | T069 | ✅ Covered |
| FR-038 | T085, T091 | ✅ Covered |

## Non-Functional Requirements Coverage

| Requirement | Tasks | Status |
|-------------|-------|--------|
| NFR-001 | - | ❌ Not Covered |
| NFR-002 | T067 | ✅ Covered |
| NFR-003 | T086 | ✅ Covered |
| NFR-004 | T069 | ✅ Covered |
| NFR-005 | T068 | ✅ Covered |
| NFR-006 | T078 | ✅ Covered |
| NFR-007 | T071, T080, T094 | ✅ Covered |
| NFR-008 | T066, T096 | ✅ Covered |
| NFR-009 | T065, T096 | ✅ Covered |

## Tasks Without FR/NFR References

- **T001**: Create base project structure: `src/{models,services,cli,lib}` and `tests/{contract,integration,unit,performance}`
- **T002**: Add `pyproject.toml` (Python 3.11, dependencies), generate `uv.lock` via `uv lock`, export `requirements.txt` for tooling (numpy, pillow, rich(optional), pytest, hypothesis(optional), ruff)
- **T003**: Add lint/format config: `.ruff.toml`, enable line length & import sort
- **T004**: Add `pytest.ini`
- **T005**: Add `.editorconfig` & basic `.gitignore`
- **T006**: Add `src/__init__.py` and package namespace `src/point_shoting/__init__.py`
- **T007**: Add logging setup module `src/lib/logging_config.py`
- **T008**: Add performance timing helper `src/lib/timing.py`
- **T009**: Add `Makefile` targets: install, lint, test, test-watch
- **T010**: Create contract test `tests/contract/test_particle_engine.py` (methods exist, invariants placeholders, step() pre-init error)
- **T011**: Create contract test `tests/contract/test_color_mapper.py`
- **T012**: Create contract test `tests/contract/test_control_interface.py`
- **T013**: Create contract test `tests/contract/test_hud_renderer.py`
- **T014**: Create contract test `tests/contract/test_localization_provider.py`
- **T015**: Create contract test `tests/contract/test_settings_store.py`
- **T016**: Create contract test `tests/contract/test_stage_transition_policy.py`
- **T017**: Create contract test `tests/contract/test_breathing_oscillator.py`
- **T018**: Create contract test `tests/contract/test_watermark_renderer.py`
- **T019**: Integration test `tests/integration/test_full_loop_recognition.py`: simulation reaches recognition ≥0.8 ≤10s
- **T020**: Invariant test `tests/integration/test_particle_bounds.py`: positions remain in [0,1]^2 across steps
- **T021**: Invariant test `tests/integration/test_particle_count_stable.py`: particle count constant
- **T022**: Invariant test `tests/integration/test_velocity_cap.py`: velocity magnitude ≤ vmax
- **T023**: Invariant test `tests/integration/test_recognition_monotonic.py`: recognition non-decreasing in FORMATION
- **T024**: Performance budget test skeleton `tests/performance/test_hud_overhead.py`: HUD render mock <5% frame budget
- **T025**: Settings persistence integration `tests/integration/test_settings_persistence.py`
- **T026**: Implement Stage enum `src/models/stage.py`
- **T027**: Implement Settings dataclass `src/models/settings.py`
- **T028**: Implement particle arrays module `src/models/particle_arrays.py`
- **T029**: Implement metrics DTO `src/models/metrics.py`
- **T030**: Implement StageTransitionPolicy `src/services/stage_transition_policy.py` (evaluate() logic, thresholds)
- **T031**: Implement SettingsStore `src/services/settings_store.py`
- **T032**: Implement LocalizationProvider `src/services/localization_provider.py` + `i18n/en.json` & sample `i18n/uk.json`
- **T033**: Implement ColorMapper `src/services/color_mapper.py`
- **T034**: Implement BreathingOscillator `src/services/breathing_oscillator.py` (apply())
- **T035**: Implement HUDRenderer `src/services/hud_renderer.py` (render() plain + rich branch)
- **T036**: Implement WatermarkRenderer `src/services/watermark_renderer.py` (render() PNG only)
- **T037**: Create skeleton ParticleEngine (init(), step() raises NotImplemented, stage(), metrics(), snapshot())
- **T038**: Implement initialization: load image (Pillow thumbnail), allocate arrays via particle_arrays, map targets
- **T039**: Integrate ColorMapper for initial color assignment
- **T040**: Implement CHAOS/BURST physics update
- **T041**: Integrate StageTransitionPolicy evaluation inside step()
- **T042**: Implement recognition score placeholder + monotonic enforcement in FORMATION
- **T043**: Integrate BreathingOscillator in FINAL_BREATHING stage
- **T044**: Add metrics computation
- **T045**: Integrate HUDRenderer
- **T046**: Integrate WatermarkRenderer on final frame composition
- **T047**: Finalize apply_settings()
- **T048**: Implement ControlInterface `src/cli/control_interface.py`
- **T049**: Implement CLI entrypoint `src/cli/main.py`
- **T050**: Add quickstart example script `examples/minimal_run.py` mapping to quickstart.md
- **T051**: Update existing contract tests with concrete assertions now that implementations exist
- **T052**: Add unit tests `tests/unit/test_stage_transition_policy_thresholds.py` (edge thresholds) - 6 tests passed
- **T053**: Add unit tests `tests/unit/test_color_mapper_precision.py` (ΔE sample calc) - 7 tests passed
- **T054**: Add unit tests `tests/unit/test_breathing_oscillator_signal.py` (waveform continuity) - 8 tests passed
- **T055**: Add unit tests `tests/unit/test_watermark_rules.py` (min size, format) - 12 tests passed
- **T056**: Add property-based tests (hypothesis) `tests/unit/test_particle_positions_properties.py` (positions within bounds) - 9 tests passed
- **T057**: Performance test `tests/performance/test_fps_medium_density.py`
- **T058**: Add profiling script `scripts/profile_engine.py`
- **T059**: Update `quickstart.md` to reflect actual API surfaces
- **T060**: Add README feature section & usage examples
- **T060**: Add README feature section & usage examples
- **T061**: Add CI workflow `.github/workflows/ci.yml`
- **T061**: Add CI workflow `.github/workflows/ci.yml`
- **T062**: Refactor duplication
- **T062**: Refactor duplication
- **T063**: Add type checking (mypy or pyright config) + fix annotations
- **T064**: Cleanup & finalize docstrings
- **T097**: Add accessibility backlog doc `docs/accessibility_backlog.md` referencing future GUI
- **T098**: Add cross-platform roadmap doc `docs/gui_roadmap.md`
- **T099**: Tag all existing tasks with FR/NFR references in comments for traceability matrix generation script
- **T100**: Add traceability script `scripts/generate_trace_matrix.py`

## Uncovered Requirements

- FR-001
- FR-007
- FR-011
- FR-012
- FR-019
- FR-020
- FR-023
- FR-025
- FR-027
- NFR-001
