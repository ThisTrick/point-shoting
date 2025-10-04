# Research: Comprehensive Debugging and E2E Testing Framework

**Feature**: 003-e2e-ui | **Phase**: 0 | **Date**: October 4, 2025

## Overview

This feature enhances existing test infrastructure rather than implementing new application functionality. The research focuses on validating the current testing ecosystem and identifying gaps in E2E coverage and dependency validation.

## Research Questions Resolved

### 1. Coverage Percentage Targets (FR-029)

**Decision**: 80% minimum code coverage for both Python and TypeScript

**Rationale**:
- Current Python backend has strong unit/contract test coverage (~320 tests)
- UI components have comprehensive unit tests (11 files, ~50 tests)
- 80% is industry standard for well-tested applications
- Higher thresholds (90%+) have diminishing returns and can encourage meaningless tests
- Focus on critical paths and integration points rather than absolute coverage

**Alternatives Considered**:
- 90% coverage: Too strict, would require testing error branches that may never execute
- 70% coverage: Too lenient, misses important edge cases
- Different thresholds for different components: Added complexity without clear benefit

**Implementation**: 
- `pytest --cov-fail-under=80` for Python
- Jest `coverageThreshold: 80%` for TypeScript

### 2. CI/CD Execution Time Limits (FR-032)

**Decision**: 15 minutes maximum for complete CI pipeline

**Rationale**:
- Current quick pipeline: ~60 seconds (unit + integration)
- Current E2E tests: ~2-5 minutes (Playwright)
- Full pipeline with coverage: estimate 10-12 minutes
- 15-minute limit provides buffer for infrastructure variability
- Aligns with GitHub Actions free tier timeout policies (max 360 minutes/month)
- Maintains developer productivity (PR feedback <15min)

**Alternatives Considered**:
- 30 minutes: Too slow, reduces developer velocity
- 10 minutes: Too aggressive, might require skipping important tests
- Split pipelines: Adds complexity to CI configuration

**Implementation**:
- Monitor with `pytest --durations=10` for slowest tests
- Parallel execution where possible (pytest-xdist, Jest --maxWorkers)
- Fail fast with `-x` flag during debugging

### 3. Cross-Platform Validation (FR-036)

**Decision**: Linux primary, macOS/Windows E2E readiness

**Rationale**:
- Current development on Linux (as evidenced by project structure)
- Electron is cross-platform by design, but E2E tests require platform-specific setup
- Python backend is cross-platform (NumPy, Pillow work on all platforms)
- Playwright supports all three platforms
- Resource constraints: focus on Linux E2E now, prepare for multi-platform later

**Alternatives Considered**:
- All platforms from day 1: Resource-intensive, no immediate user demand
- Linux only permanently: Limits future user base unnecessarily
- Windows primary: Not the current development platform

**Implementation**:
- CI matrix: Linux primary
- Local development: Document macOS/Windows setup in README
- Playwright config: Platform-agnostic selectors
- Future: Add `os: [ubuntu-latest, macos-latest, windows-latest]` to GitHub Actions matrix

## Technology Stack Validation

### Testing Frameworks (Already Decided - Validation Only)

| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| pytest | 8.4.2 | Python test runner | ✅ Installed |
| pytest-xdist | Latest | Parallel test execution | ✅ Installed |
| hypothesis | Latest | Property-based testing | ✅ Installed |
| coverage | Latest | Python code coverage | ✅ Installed |
| Jest | 29.6.0 | UI unit/contract testing | ✅ Installed |
| Playwright | 1.40.0 | E2E browser automation | ✅ Installed |
| mypy | Latest | Static type checking | ✅ Installed |
| ruff | Latest | Linting and formatting | ✅ Installed |

**No new dependencies required** - all tools already in place.

### Dependency Auditing Tools

| Tool | Purpose | Decision |
|------|---------|----------|
| `pip-audit` | Python security vulnerabilities | ✅ Use (add to dev dependencies) |
| `npm audit` | Node.js security vulnerabilities | ✅ Use (built-in to npm) |
| `pip list` | Python package inventory | ✅ Use (built-in) |
| `npm list` | Node.js package inventory | ✅ Use (built-in) |

**Decision**: Use built-in and standard tools, add `pip-audit` for security scanning.

## E2E Testing Patterns

### Python Engine E2E Pattern

**Pattern**: Full pipeline tests with real image data

```python
# tests/e2e/test_engine_pipeline.py
@pytest.mark.e2e
def test_full_animation_pipeline():
    """Test complete particle animation from image load to final frame."""
    # Arrange: Load test image
    # Act: Run full pipeline (burst → chaos → converging → formation → breathing)
    # Assert: Validate each stage transition, final recognition score, frame outputs
```

**Rationale**:
- Validates all service integrations (ParticleEngine, ColorMapper, HUD, etc.)
- Tests stage transitions under realistic conditions
- Ensures no regressions in core animation logic

### UI E2E Pattern (Playwright)

**Pattern**: User workflow tests with IPC validation

```typescript
// ui/tests/e2e/workflows.spec.ts
test('complete user workflow: upload → configure → animate → export', async ({ page }) => {
  // Arrange: Start app
  // Act: Upload image, configure settings, start animation, wait for completion
  // Assert: Verify UI updates, IPC responses, final state
});
```

**Rationale**:
- Tests real user interactions
- Validates Electron IPC communication
- Ensures UI responsiveness during long operations

### Regression Testing Pattern

**Pattern**: Baseline comparison with historical results

```python
# tests/e2e/test_regression_suite.py
@pytest.mark.regression
def test_no_performance_regression():
    """Ensure performance metrics haven't degraded."""
    # Load baseline metrics from previous runs
    # Run current performance tests
    # Assert: current_fps >= baseline_fps * 0.95 (allow 5% variation)
```

**Rationale**:
- Catches performance regressions early
- Validates that bug fixes don't introduce new issues
- Provides historical trend data

## Flaky Test Detection Strategy

**Decision**: Use pytest-rerunfailures + custom reporting

**Approach**:
1. Run full test suite with `--reruns=3 --reruns-delay=1`
2. Track tests that pass on retry (= flaky)
3. Generate flaky test report showing failure frequencies
4. Quarantine flaky tests with `@pytest.mark.flaky` decorator

**Rationale**:
- Flaky tests reduce CI reliability
- Systematic detection better than ad-hoc observation
- Quarantine prevents blocking PRs while fixing root cause

**Implementation**:
```bash
pytest --reruns=3 --only-rerun AssertionError --only-rerun TimeoutError
```

## Coverage Reporting Strategy

**Decision**: HTML + terminal reports, with diff coverage

**Approach**:
1. Generate coverage during CI: `pytest --cov --cov-report=html --cov-report=term`
2. Archive HTML reports as CI artifacts
3. Display summary in PR comments (via GitHub Actions)
4. Track coverage trends over time

**Rationale**:
- HTML reports: detailed line-by-line analysis
- Terminal reports: quick feedback in CI logs
- Trend tracking: prevent coverage degradation

**Implementation**:
```makefile
test-coverage:
	uv run pytest --cov=src/point_shoting --cov-report=html --cov-report=term --cov-fail-under=80
```

## Dependency Validation Strategy

**Decision**: Automated dependency audits in CI

**Approach**:
1. Python: `pip-audit` for security vulnerabilities
2. Node.js: `npm audit` for security vulnerabilities
3. Version compatibility: UV lock file validation
4. License compliance: manual review (out of scope for this feature)

**Rationale**:
- Security vulnerabilities can be introduced by dependency updates
- Automated scanning catches issues before deployment
- Lock files ensure reproducible builds

**Implementation**:
```makefile
audit-dependencies:
	uv pip install pip-audit
	uv run pip-audit
	cd ui && npm audit --audit-level=moderate
```

## CI/CD Pipeline Architecture

**Decision**: Three pipeline variants

### 1. Quick Pipeline (Development)
- Target: <60 seconds
- Coverage: Unit + Integration tests only
- Skip: E2E, coverage reporting
- Use case: Fast PR feedback

### 2. CI Pipeline (Automated)
- Target: <15 minutes
- Coverage: Full test suite + coverage + E2E
- Use case: Pre-merge validation, main branch protection

### 3. Debug Pipeline (Investigation)
- Target: No time limit
- Coverage: Sequential execution with verbose output
- Use case: Debugging test failures

**Rationale**:
- Different workflows need different trade-offs (speed vs completeness)
- Quick pipeline maintains developer productivity
- CI pipeline ensures quality gates
- Debug pipeline aids troubleshooting

## Test Data Strategy

**Decision**: Synthetic test images + fixtures

**Approach**:
1. Curate test image collection (small, medium, large, edge cases)
2. Store in `tests/fixtures/images/`
3. Generate programmatically where possible (PIL/Pillow)
4. Document test data provenance

**Rationale**:
- Real images provide realistic validation
- Synthetic images enable edge case testing
- Version-controlled fixtures ensure reproducibility

**Test Image Requirements**:
- Small: 256x256px (fast tests)
- Medium: 1024x1024px (realistic tests)
- Large: 4096x4096px (boundary tests)
- Edge cases: transparent, grayscale, unusual aspect ratios

## Open Questions & Future Research

1. **Chaos Engineering**: Should we introduce controlled failures (network, disk, memory) in E2E tests?
   - Decision: Out of scope for MVP, consider for future hardening

2. **Visual Regression Testing**: Should we capture and compare particle animation frames?
   - Decision: Out of scope (too flaky, storage-intensive), focus on metrics instead

3. **Load Testing**: Should we test with multiple concurrent animations?
   - Decision: Out of scope (single-user desktop app), performance tests adequate

## References

- CI_DOCUMENTATION.md: Current test pyramid and execution order
- Makefile: Existing test targets and pipelines
- pytest documentation: https://docs.pytest.org/
- Playwright documentation: https://playwright.dev/
- Jest documentation: https://jestjs.io/

## Next Steps (Phase 1)

With research complete, proceed to:
1. Define test data model (test results, coverage metrics, flaky test reports)
2. Create contracts for new E2E test modules
3. Generate quickstart guide for running comprehensive test suite
4. Update agent context with testing patterns
