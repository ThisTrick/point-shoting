# Contract: CoverageReporter

**Feature**: 003-e2e-ui | **Component**: Code Coverage Reporting  
**Type**: Test Infrastructure Service | **Phase**: 1

## Purpose

Measures and reports code coverage for both Python and TypeScript codebases, ensuring test adequacy and identifying untested code paths.

## Contract Interface

### Methods

#### `measure_python_coverage(test_suite: str = "all") -> CoverageReport`

Measures Python code coverage during test execution.

**Preconditions**:

- coverage.py installed
- Source code in `src/point_shoting/`
- Tests executed with `--cov` flag

**Postconditions**:

- Coverage data collected for all executed code
- HTML and terminal reports generated
- Coverage percentage calculated

**Parameters**:

- `test_suite`: Which tests to measure ("all", "unit", "integration", "e2e")

**Returns**: `CoverageReport` object (see data-model.md)

**Performance**: <2 seconds overhead per test run

---

#### `measure_typescript_coverage() -> CoverageReport`

Measures TypeScript code coverage for UI components.

**Preconditions**:

- Jest configured with coverage
- UI source in `ui/src/`

**Postconditions**:

- Coverage data collected
- HTML report in `ui/coverage/`
- Threshold validation performed

**Returns**: `CoverageReport` object

**Performance**: <5 seconds for ~50 test files

---

#### `generate_coverage_badge(report: CoverageReport) -> str`

Generates coverage badge for README.

**Preconditions**:

- Coverage report available

**Postconditions**:

- SVG badge generated with percentage
- Color-coded (red <60%, yellow 60-80%, green >80%)

**Returns**: Path to generated SVG file

---

#### `compare_coverage(baseline: CoverageReport, current: CoverageReport) -> CoverageDiff`

Compares current coverage against baseline.

**Returns**:

```python
@dataclass
class CoverageDiff:
    percentage_change: float  # e.g., +2.3 or -1.5
    new_uncovered_lines: List[str]
    newly_covered_lines: List[str]
    regression: bool  # True if coverage decreased
```

## Behavioral Contracts

### Coverage Thresholds

**Contract**: Coverage must meet minimum thresholds:

- Overall: ≥80%
- Statements: ≥80%
- Branches: ≥75%
- Functions: ≥85%

**Enforcement**: Tests fail if thresholds not met

### Coverage Exclusions

**Contract**: Exclude from coverage:

- Test files themselves
- `__main__.py` blocks
- Type stubs (`.pyi` files)
- Generated code
- Debug-only code paths

## Example Usage

```python
@pytest.mark.coverage
def test_coverage_meets_threshold():
    """Ensure code coverage meets 80% threshold."""
    reporter = CoverageReporter()
    
    # Measure coverage for all tests
    report = reporter.measure_python_coverage(test_suite="all")
    
    assert report.coverage_percentage >= 80.0, \
        f"Coverage {report.coverage_percentage}% below 80% threshold"
    
    assert report.meets_threshold
```

## CI Integration

```makefile
test-coverage:
    uv run pytest --cov=src/point_shoting --cov-report=html --cov-report=term --cov-fail-under=80
    cd ui && npm run test:coverage
```

## References

- coverage.py: <https://coverage.readthedocs.io/>
- Jest coverage: <https://jestjs.io/docs/configuration#collectcoverage-boolean>
