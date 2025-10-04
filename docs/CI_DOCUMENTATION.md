# Point Shooting CI/CD Documentation

## Overview

Point Shooting is a Python particle animation system with a TypeScript/Electron UI. This document describes the complete CI/CD pipeline, test strategy, and execution order.

## Test Levels & Execution Strategy

### Testing Pyramid

The project follows a comprehensive testing strategy with 8 levels of testing:

```
┌─────────────────────────────────────┐
│         E2E Tests (UI)              │ ← Most Complex
│         1 test file, ~26 tests      │
├─────────────────────────────────────┤
│         E2E Tests (Python)          │
│         4 test files, ~15 tests     │
├─────────────────────────────────────┤
│         Performance Tests           │
│         3 test files, ~10 tests     │
├─────────────────────────────────────┤
│         UI Integration Tests        │
│         2 test files, ~15 tests     │
├─────────────────────────────────────┤
│         Integration Tests           │
│         24 test files, ~120 tests   │
├─────────────────────────────────────┤
│         UI Contract Tests           │
│         4 test files, ~20 tests     │
├─────────────────────────────────────┤
│         Contract Tests              │
│         9 test files, ~40 tests     │
├─────────────────────────────────────┤
│         UI Unit Tests               │
│         11 test files, ~50 tests    │
├─────────────────────────────────────┤
│         Unit Tests                  │ ← Simplest
│         6 test files, ~50 tests     │
└─────────────────────────────────────┘
```

### Test Execution Order

Tests are executed sequentially from simplest to most complex:

1. **Unit Tests** (Fastest, ~3-5 seconds)
   - Test individual functions and classes in isolation
   - Mock external dependencies
   - Focus on algorithms and business logic

2. **UI Unit Tests** (Fast, ~5-10 seconds)
   - Test individual React components in isolation
   - Mock external dependencies and services
   - Focus on component logic and rendering

   **Parallel Execution**: UI unit and contract tests can be run together using:

   ```bash
   make ui-test-parallel
   ```

   - Combines unit + contract tests for faster CI execution
   - Uses `--maxWorkers=50%` for optimal CPU utilization
   - ~8-15 seconds total execution time

3. **Contract Tests** (Fast, ~5-10 seconds)
   - Test interface compliance and invariants
   - Verify service contracts and data structures
   - Ensure API compatibility

4. **UI Contract Tests** (Fast, ~5-10 seconds)
   - Test UI service interface compliance
   - Verify UI component contracts and data structures
   - Ensure UI API compatibility

5. **Integration Tests** (Medium, ~30-45 seconds)
   - Test component interactions
   - End-to-end workflows within Python backend
   - Database/file system operations

6. **UI Integration Tests** (Medium, ~10-15 seconds)
   - Test UI component interactions
   - IPC communication between UI and Python backend
   - Cross-component workflows

7. **Performance Tests** (Medium, ~10-15 seconds)
   - Benchmark critical paths
   - Memory usage validation
   - FPS and latency measurements

8. **Python E2E Tests** (Medium, ~2-3 minutes)
   - Full backend workflow testing
   - Dependency audit validation
   - Engine pipeline verification
   - Regression testing against baselines

9. **UI E2E Tests** (Slowest, ~2-5 minutes)
   - Full UI workflow testing
   - Electron app integration
   - User interaction scenarios

## CI Pipeline Stages

### 1. Code Quality Checks

```bash
make check-all
```

- **Ruff linting**: Code style and error detection
- **Ruff formatting**: Code formatting validation
- **MyPy type checking**: Static type analysis

### 2. Build Stage

```bash
make build-all
```

- **Python build**: Dependency installation and validation
- **UI build**: TypeScript compilation and Vite bundling

### 3. Sequential Test Execution

```bash
make test-sequential
```

#### Level 1: Unit Tests

```bash
make test-unit
```

**Files tested:**

- `test_breathing_oscillator_signal.py` - Oscillation algorithms
- `test_color_mapper_precision.py` - Color mapping logic
- `test_particle_position_invariants.py` - Position calculations
- `test_particle_simple_invariants.py` - Basic particle operations
- `test_stage_transition_policy_thresholds.py` - State transition rules
- `test_watermark_validation_rules.py` - Watermark validation

#### Level 2: UI Unit Tests

```bash
make ui-test
```

**Files tested:**

- `ProgressIndicator.test.tsx` - Progress component testing
- `ControlPanel.test.tsx` - Control panel component testing
- `App.test.tsx` - Main app component testing
- `ImagePreview.test.tsx` - Image preview component testing
- `MainLayout.test.tsx` - Layout component testing
- `validation.test.ts` - Validation utilities testing
- `constants.test.ts` - Constants testing
- `helpers.test.ts` - Helper functions testing
- `useKeyboardShortcuts.test.ts` - Keyboard shortcuts hook testing
- `useSettings.test.ts` - Settings hook testing

#### Level 3: Contract Tests

```bash
make test-contract
```

**Files tested:**

- `test_breathing_oscillator.py` - Oscillator service contracts
- `test_color_mapper.py` - Color mapping service contracts
- `test_control_interface.py` - Control interface contracts
- `test_hud_renderer.py` - HUD rendering contracts
- `test_localization_provider.py` - Localization service contracts
- `test_particle_engine.py` - Particle engine contracts
- `test_settings_store.py` - Settings persistence contracts
- `test_stage_transition_policy.py` - Stage transition contracts
- `test_watermark_renderer.py` - Watermark rendering contracts

4. **UI Contract Tests** (Fast, ~5-10 seconds)
   - Test UI service interface compliance
   - Verify UI component contracts and data structures
   - Ensure UI API compatibility

   **Note:** UI contract tests currently fail as expected since the UI services are not yet fully implemented. This is normal for contract-first development.

   **Parallel Execution**: Combined with UI unit tests in `ui-test-parallel` target for CI optimization.

#### Level 5: Integration Tests

```bash
make test-integration
```

**Files tested:**

- `test_aspect_ratio_preservation.py` - Image aspect ratio handling
- `test_breathing_amplitude.py` - Breathing effect integration
- `test_control_debounce.py` - Control input debouncing
- `test_density_warning_system.py` - Performance warnings
- `test_dynamic_locale_addition.py` - Runtime localization
- `test_engine_error_handling.py` - Error handling integration
- `test_full_loop_recognition.py` - Complete animation cycles
- `test_large_image_rejection.py` - Large image handling
- `test_no_visual_artifacts.py` - Visual quality assurance
- `test_particle_bounds.py` - Boundary condition handling
- `test_particle_count_stable.py` - Particle count stability
- `test_pause_latency.py` - Pause/resume performance
- `test_recognition_monotonic.py` - Recognition progress validation
- `test_settings_cycle_boundary.py` - Settings lifecycle testing
- `test_settings_persistence*.py` - Settings save/load operations
- `test_skip_transition_smoothness.py` - Transition skipping
- `test_small_image_upscale.py` - Image upscaling logic
- `test_speed_profile_transitions.py` - Speed profile changes
- `test_start_latency.py` - Application startup performance
- `test_transparent_pixels_targeting.py` - Transparency handling
- `test_velocity_cap.py` - Velocity limit enforcement
- `test_watermark_rules_integration.py` - Watermark integration

#### Level 6: UI Integration Tests

```bash
make ui-test-integration
```

**Status:** ⚠️ Requires Electron environment setup
**Files tested:**
- `test_ipc_communication.spec.ts` - IPC communication testing (needs Electron)
- `test_python_engine_bridge.spec.ts` - Python engine bridge testing (needs Electron)

**Note:** These tests require Electron environment and are currently failing in Jest/jsdom setup. They need to be run in Playwright with Electron or configured Electron test environment. Currently skipped in CI pipeline.

#### Level 7: Performance Tests
```bash
make test-performance
```

**Files tested:**
- `test_fps_medium_density.py` - Frame rate validation
- `test_hud_overhead.py` - HUD performance impact
- `test_memory_medium_density.py` - Memory usage monitoring

#### Level 8: E2E Tests
```bash
make ui-test-e2e
```

**Files tested:**
- `user-workflows.spec.ts` - Complete user interaction flows

## CI Pipeline Commands

### Quick Development Pipeline
```bash
make test-pipeline-quick
```
- Code quality checks
- Unit tests only
- Integration tests only
- ~45 seconds total

### Full Development Pipeline
```bash
make test-sequential
```
- Build all components first
- Execute tests from simplest to most complex
- Comprehensive validation
- ~5-7 minutes total

### CI Production Pipeline
```bash
make test-pipeline-ci
```
- Dependency installation
- Code quality checks
- Coverage-enabled Python tests (all levels)
- Parallel UI unit + contract tests
- UI build
- E2E tests
- ~4-6 minutes total (optimized for speed)

### Sequential Testing Pipeline

```bash
make test-sequential
```

- Build all components first
- Execute tests from simplest to most complex
- Comprehensive validation for development debugging

```
- Build all components first
- Execute tests from simplest to most complex
- Comprehensive validation

## Test Configuration

### Python Tests (pytest)
- **Parallel execution**: `pytest-xdist` with auto worker detection
- **Quiet mode**: Minimal output for successful tests
- **Verbose mode**: `make test-verbose` for detailed output
- **Markers**: `unit`, `contract`, `integration`, `performance`
- **Coverage**: `pytest-cov` for coverage reporting

### UI Tests (Jest + Playwright)
- **Unit tests**: Jest with 50% max workers
- **Contract tests**: Jest with 50% max workers
- **Parallel execution**: `ui-test-parallel` combines unit + contract tests
- **E2E tests**: Playwright with Electron
- **Parallel execution**: 2 workers for E2E tests

## Performance Targets

### Test Execution Times
- **Unit tests**: < 5 seconds
- **UI Unit + Contract (parallel)**: < 15 seconds (combined execution)
- **Contract tests**: < 10 seconds
- **Integration tests**: < 45 seconds
- **Performance tests**: < 15 seconds
- **E2E tests**: < 5 minutes

### CI Pipeline Performance
- **Quick pipeline**: ~45 seconds (quality + unit + integration)
- **CI pipeline**: ~4-6 minutes (optimized with parallel UI tests)
- **Sequential pipeline**: ~5-7 minutes (comprehensive validation)

### Resource Usage
- **Memory**: < 300MB RSS during testing
- **CPU**: Parallel execution optimized for available cores
- **Disk**: Minimal I/O for test artifacts

## Failure Handling

### Test Failure Categories
1. **Code Quality**: Fix linting/formatting issues
2. **Type Errors**: Fix MyPy type annotations
3. **Unit Failures**: Fix algorithm/logic bugs
4. **Contract Failures**: Fix interface compliance
5. **Integration Failures**: Fix component interactions
6. **Performance Failures**: Optimize slow code paths
7. **E2E Failures**: Fix UI interaction issues

### Debugging Tools
- `make test-coverage`: Coverage reports for all Python tests
- `make test-verbose`: Run all tests with verbose output for debugging
- `make ui-test-parallel`: Run UI unit + contract tests together
- `make typecheck`: Type checking only
- Individual test execution: `make test-unit`, `make test-contract`, `make test-integration`, `make ui-test-parallel`, etc.
- Verbose output: `make test-verbose` for detailed test output

## CI/CD Integration

### GitHub Actions (Recommended)
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Run CI Pipeline
        run: make test-pipeline-ci
```

### Local Development

```bash
# Quick feedback loop
make test-pipeline-quick

# Full validation with build
make test-sequential

# Debug specific test levels
make test-unit          # Python unit tests only
make test-contract      # Python contract tests only
make test-integration   # Python integration tests only
make ui-test-parallel   # UI unit + contract tests (parallel)
make ui-test-e2e        # UI E2E tests only

# Code quality checks
make check-all          # Lint, format, typecheck
make typecheck          # Type checking only
make format             # Code formatting only
```

## Maintenance

### Adding New Tests

1. Choose appropriate test level (unit/contract/integration/performance/e2e)
2. Add test file to correct directory
3. Use proper pytest markers
4. Update this documentation
5. Run full pipeline to validate

### Performance Monitoring

- Track test execution times
- Monitor resource usage
- Update performance targets as needed
- Optimize slow tests

### Test Coverage

- Target: > 90% code coverage
- Focus on critical business logic
- Exclude generated code and trivial getters/setters
