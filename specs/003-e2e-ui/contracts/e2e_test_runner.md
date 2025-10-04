# Contract: E2ETestRunner

**Feature**: 003-e2e-ui | **Component**: End-to-End Test Execution  
**Type**: Test Infrastructure Service | **Phase**: 1

## Purpose

Orchestrates end-to-end tests for both the Python particle engine and Electron UI, ensuring complete user workflows function correctly with full system integration.

## Contract Interface

### Methods

#### `run_engine_e2e_tests() -> TestSuite`

Executes Python engine end-to-end tests (full particle animation pipeline).

**Preconditions**:

- Python environment activated
- Test fixtures available in `tests/fixtures/images/`
- All engine services (ParticleEngine, ColorMapper, etc.) importable

**Postconditions**:

- All engine E2E tests executed
- Test results recorded with timing and status
- Test artifacts (generated images, logs) saved to `test-results/e2e/`

**Returns**:

```python
@dataclass
class TestSuite:
    suite_id: str
    total_count: int
    pass_count: int
    fail_count: int
    skip_count: int
    total_duration: float
    results: List[TestResult]
    pipeline_type: str = "e2e"
```

**Performance**:

- Execution time: <3 minutes for ~10 engine E2E scenarios
- Each scenario: complete animation pipeline (burst → breathing)

**Errors**:

- `FixtureNotFoundError`: Required test image missing
- `ImportError`: Engine service not available
- `TimeoutError`: Test exceeded maximum duration

---

#### `run_ui_e2e_tests(headless: bool = True) -> TestSuite`

Executes Playwright E2E tests for Electron UI.

**Preconditions**:

- Electron app built (`ui/dist/` exists)
- Playwright installed
- Python backend available for IPC communication

**Postconditions**:

- All UI E2E tests executed
- Screenshots and traces captured for failures
- Test results recorded

**Parameters**:

- `headless`: Run browser in headless mode (True for CI, False for debugging)

**Returns**: `TestSuite` object with UI E2E results

**Performance**:

- Execution time: <5 minutes for ~26 Playwright scenarios
- Parallel execution: up to 4 workers

**Errors**:

- `ElectronNotFoundError`: App not built
- `PlaywrightError`: Browser automation failure
- `IPCError`: Communication with Python backend failed

---

#### `run_regression_suite() -> RegressionTestResult`

Executes all regression tests to ensure no functionality broke.

**Preconditions**:

- Baseline metrics available (from previous runs)
- All test types available (unit, contract, integration, performance, E2E)

**Postconditions**:

- All test levels executed in order (unit → E2E)
- Results compared against baseline
- Regression report generated

**Returns**:

```python
@dataclass
class RegressionTestResult:
    baseline_suite_id: str
    current_suite_id: str
    total_regressions: int
    performance_regressions: List[PerformanceRegression]
    new_failures: List[TestResult]
    fixed_tests: List[str]
    summary: str
```

**Performance**: <15 minutes (full test pyramid)

---

#### `run_parallel_suite(test_paths: List[str], workers: int = 4) -> TestSuite`

Executes tests in parallel for faster feedback.

**Preconditions**:

- Tests are independent (no shared state)
- Sufficient CPU cores available

**Postconditions**:

- Tests executed concurrently
- Results aggregated correctly
- No race conditions in test execution

**Parameters**:

- `test_paths`: List of test file paths to run
- `workers`: Number of parallel workers (default: 4)

**Returns**: `TestSuite` with aggregated results

**Performance**:

- Speedup: ~3-4x for CPU-bound tests
- Overhead: <5% for worker coordination

---

#### `capture_test_artifacts(result: TestResult) -> Dict[str, str]`

Captures diagnostic artifacts for failed tests.

**Preconditions**:

- Test has completed execution

**Postconditions**:

- Screenshots captured (if UI test)
- Logs extracted and saved
- Trace files generated (Playwright)
- Artifacts stored in `test-results/artifacts/{test_id}/`

**Returns**: `Dict[artifact_type: str, file_path: str]`

Example: `{"screenshot": "/path/to/screenshot.png", "trace": "/path/to/trace.zip"}`

## Behavioral Contracts

### Test Execution Order

**Contract**: E2E tests must run in specific order to detect failures early:

1. Engine E2E (validates Python backend)
2. UI E2E (validates Electron + IPC)
3. Full workflow E2E (validates complete integration)

**Rationale**: If engine E2E fails, UI E2E will also fail (cascading). Run engine first to identify root cause faster.

### Test Isolation

**Contract**: Each E2E test must be completely isolated:

- No shared state between tests
- Clean environment for each test (fresh Electron instance)
- Independent test data (no file system pollution)

**Enforcement**:

- Pytest fixtures with `scope="function"`
- Playwright `test.beforeEach()` hooks
- Cleanup in `test.afterEach()`

### Timeout Enforcement

**Contract**: All E2E tests must have timeouts:

- Individual test: 60 seconds max
- Full suite: 15 minutes max
- Cleanup operations: 10 seconds max

**Enforcement**:

```python
@pytest.mark.timeout(60)
def test_full_animation_workflow():
    ...
```

### Retry Strategy

**Contract**: E2E tests can retry on specific failures:

- Network errors: retry up to 3 times
- Timing issues: retry up to 2 times
- Assertion failures: NO retry (indicates real bug)

**Implementation**:

```python
@pytest.mark.flaky(reruns=2, reruns_delay=1,
                   only_rerun=["NetworkError", "TimeoutError"])
def test_ipc_communication():
    ...
```

## Data Contracts

### Input

- **Test Scenarios**: E2ETestScenario objects (see data-model.md)
- **Test Data**: Images in `tests/fixtures/images/`
- **Configuration**: Environment variables, test config files
- **Baseline Metrics**: Previous test results for regression comparison

### Output

- **Test Results**: TestSuite with all TestResult objects
- **Artifacts**: Screenshots, logs, traces in `test-results/`
- **Reports**: HTML/JSON test reports
- **Metrics**: Execution time, pass rate, flaky test detection

## Invariants

1. **Determinism**: Same input → same output (for non-flaky tests)
2. **Isolation**: Tests don't affect each other
3. **Cleanup**: All resources released after test completion
4. **Timeout**: No test runs indefinitely
5. **Traceability**: Every failure has diagnostic artifacts

## Error Handling

### Test Failures

When test fails:

1. Capture screenshot (if UI test)
2. Save Playwright trace
3. Extract relevant logs
4. Record full stack trace
5. Continue with remaining tests (don't fail fast unless critical)

### Infrastructure Failures

If Electron fails to start:

- Retry once after 2-second delay
- If still fails: Mark all UI E2E as `SKIP` with reason
- Continue with engine E2E tests

If Python backend unavailable:

- Mark all backend-dependent tests as `SKIP`
- Run UI-only tests (mocked backend)

### Resource Exhaustion

If system resources low (memory, disk):

- Reduce parallel workers
- WARN: "Running tests serially due to resource constraints"
- Increase test timeouts by 50%

## Example Usage

```python
# tests/e2e/test_engine_pipeline.py

@pytest.mark.e2e
@pytest.mark.timeout(60)
def test_full_particle_animation_pipeline():
    """
    Test complete particle animation from image load to final breathing stage.
    
    Validates:
    - Image loading and processing
    - Particle initialization
    - Stage transitions (BURST → CHAOS → CONVERGING → FORMATION → BREATHING)
    - Recognition score convergence
    - Final frame output
    """
    # Arrange
    runner = E2ETestRunner()
    test_image = Path("tests/fixtures/images/medium-logo.png")
    
    # Act
    result = runner.run_full_animation(
        image_path=test_image,
        density="medium",
        speed="normal"
    )
    
    # Assert
    assert result.completed_successfully
    assert result.final_stage == Stage.FINAL_BREATHING
    assert result.recognition_score >= 0.8
    assert result.frame_count > 100
    assert result.avg_fps >= 30
```

```typescript
// ui/tests/e2e/workflows.spec.ts

test('complete user workflow: upload → configure → animate → export', async ({ page }) => {
  // Arrange
  const runner = new E2ETestRunner();
  await runner.launchApp(page);
  
  // Act: Upload image
  await page.click('[data-testid="upload-button"]');
  await page.setInputFiles('input[type="file"]', 'tests/fixtures/images/test-logo.png');
  
  // Act: Configure settings
  await page.selectOption('[data-testid="density-select"]', 'medium');
  await page.selectOption('[data-testid="speed-select"]', 'normal');
  
  // Act: Start animation
  await page.click('[data-testid="start-button"]');
  
  // Assert: Animation progresses
  await expect(page.locator('[data-testid="stage-indicator"]')).toHaveText('BURST');
  await expect(page.locator('[data-testid="stage-indicator"]')).toHaveText('FORMATION', { timeout: 30000 });
  
  // Act: Wait for completion
  await page.waitForSelector('[data-testid="animation-complete"]', { timeout: 60000 });
  
  // Assert: Final state
  const fps = await page.locator('[data-testid="fps-display"]').textContent();
  expect(parseInt(fps)).toBeGreaterThan(30);
});
```

## CI Integration

### Makefile Targets

```makefile
test-e2e-engine:
	uv run pytest tests/e2e/ -m "e2e and not ui" --tb=short

test-e2e-ui:
	cd ui && npm run test:e2e

test-e2e-all:
	make test-e2e-engine
	make test-e2e-ui
```

### GitHub Actions

```yaml
- name: Run Engine E2E Tests
  run: make test-e2e-engine
  timeout-minutes: 5

- name: Run UI E2E Tests
  run: make test-e2e-ui
  timeout-minutes: 10

- name: Upload E2E Artifacts
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: e2e-artifacts
    path: |
      test-results/e2e/
      ui/test-results/
      ui/playwright-report/
```

## Performance Targets

| Test Type | Target Time | Max Time | Parallel |
|-----------|-------------|----------|----------|
| Engine E2E | 2 minutes | 3 minutes | No (sequential stages) |
| UI E2E | 3 minutes | 5 minutes | Yes (4 workers) |
| Full Regression | 10 minutes | 15 minutes | Mixed |

## References

- Pytest documentation: https://docs.pytest.org/
- Playwright documentation: https://playwright.dev/
- Electron testing: https://www.electronjs.org/docs/latest/tutorial/automated-testing
