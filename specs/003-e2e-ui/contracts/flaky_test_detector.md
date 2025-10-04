# Contract: FlakyTestDetector

**Feature**: 003-e2e-ui | **Component**: Flaky Test Detection  
**Type**: Test Infrastructure Service | **Phase**: 1

## Purpose

Identifies tests that pass/fail inconsistently, helping maintain CI reliability by detecting timing issues, race conditions, and non-deterministic behavior.

## Contract Interface

### Methods

#### `detect_flaky_tests(runs: int = 10) -> List[FlakyTestReport]`

Runs test suite multiple times to detect flaky tests.

**Preconditions**:

- Test suite exists and is runnable
- Sufficient time for multiple runs (<30 minutes for 10 runs)

**Postconditions**:

- All tests run `runs` times
- Inconsistent results identified
- Flaky test report generated

**Parameters**:

- `runs`: Number of times to run each test (default: 10, min: 3)

**Returns**: `List[FlakyTestReport]` - One report per flaky test found

**Performance**: ~10x normal test execution time

---

#### `analyze_test_history(test_id: str, days: int = 30) -> FlakyTestReport`

Analyzes historical test results to identify flakiness patterns.

**Preconditions**:

- Test execution history available (from CI)
- At least 10 historical runs

**Postconditions**:

- Flakiness metrics calculated
- Patterns identified (e.g., "fails on Mondays", "fails after deployment")

**Parameters**:

- `test_id`: Test identifier to analyze
- `days`: How far back to look (default: 30)

**Returns**: `FlakyTestReport` with historical analysis

---

#### `quarantine_flaky_test(test_id: str, reason: str) -> None`

Marks a test as flaky and excludes from normal runs.

**Preconditions**:

- Test confirmed as flaky (flake_rate > 5%)

**Postconditions**:

- Test marked with `@pytest.mark.flaky` or `test.skip()`
- CI doesn't fail on this test
- Issue created for investigation

**Parameters**:

- `test_id`: Test to quarantine
- `reason`: Why test is flaky (for documentation)

---

#### `suggest_fixes(flaky_test: FlakyTestReport) -> List[str]`

Analyzes flaky test and suggests potential fixes.

**Returns**: List of suggested fixes, e.g.:

- "Add explicit wait for element to be visible"
- "Increase timeout from 5s to 10s"
- "Mock time-dependent behavior"
- "Add retry logic for network operations"

## Behavioral Contracts

### Flakiness Threshold

**Contract**: A test is considered "flaky" if:

- `0 < flake_rate < 100` (sometimes passes, sometimes fails)
- `flake_rate ≥ 5%` (fails at least once in 20 runs)

**Not flaky**:

- Always passes (flake_rate = 0%)
- Always fails (flake_rate = 100%) - this is a broken test, not flaky

### Detection Strategy

**Contract**: Run tests in randomized order to detect:

- Order-dependent failures
- Shared state pollution
- Race conditions

**Implementation**:

```python
pytest --random-order --count=10 tests/
```

### Quarantine Policy

**Contract**: Quarantine test if:

- Flake rate >20% (frequently flaky)
- OR fails >3 times in last 10 runs
- AND no fix applied within 7 days

**Un-quarantine when**:

- 20 consecutive passes after fix

## Example Usage

```python
# tests/e2e/test_flaky_detection.py

@pytest.mark.slow
def test_detect_flaky_tests_in_integration_suite():
    """Run integration tests 10x to detect flaky tests."""
    detector = FlakyTestDetector()
    
    # Run all integration tests 10 times
    flaky_tests = detector.detect_flaky_tests(
        test_suite="integration",
        runs=10
    )
    
    # Report findings
    if flaky_tests:
        print(f"⚠️ Found {len(flaky_tests)} flaky tests:")
        for flaky in flaky_tests:
            print(f"  - {flaky.test_id}: {flaky.flake_rate:.1f}% flake rate")
            print(f"    Passed {flaky.pass_count}/{flaky.total_runs} times")
    
    # Fail if high flake rate
    critical_flaky = [f for f in flaky_tests if f.flake_rate > 30]
    assert len(critical_flaky) == 0, \
        f"Critical flaky tests found: {[f.test_id for f in critical_flaky]}"
```

## CI Integration

```makefile
detect-flaky:
    uv run pytest tests/ --count=10 --random-order -v | tee flaky-test-log.txt
    python scripts/analyze_flaky_results.py flaky-test-log.txt
```

## References

- pytest-flaky: <https://github.com/box/flaky>
- pytest-rerunfailures: <https://github.com/pytest-dev/pytest-rerunfailures>
- pytest-random-order: <https://github.com/jbasko/pytest-random-order>
