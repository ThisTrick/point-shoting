# Data Model: Test Infrastructure Entities

**Feature**: 003-e2e-ui | **Phase**: 1 | **Date**: October 4, 2025

## Overview

This feature is test infrastructure enhancement - it does not add new application runtime entities. Instead, it defines data models for test results, coverage metrics, and diagnostic information used during testing and CI/CD processes.

## Test Execution Entities

### TestResult

Outcome of a single test execution.

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| test_id | str | Unique identifier (`file::class::method` format) | Required |
| status | enum | pass, fail, skip, xfail, error | Required |
| duration | float | Execution time in seconds | ≥0 |
| error_message | str? | Failure message if status=fail/error | Optional |
| stack_trace | str? | Full stack trace for debugging | Optional |
| stage | enum | unit, contract, integration, performance, e2e | Required |
| timestamp | datetime | When test was executed | Required |
| platform | str | OS/platform identifier | Default: Linux |
| retry_count | int | Number of retries before pass/fail | ≥0, default: 0 |

**Validation Rules**:

- `test_id` must follow pytest/Jest naming convention
- `duration` must be positive
- `error_message` and `stack_trace` required if `status` in [fail, error]
- `retry_count > 0` indicates flaky test

### TestSuite

Collection of test results from a single run.

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| suite_id | str | Unique run identifier (timestamp-based) | Required |
| total_count | int | Total number of tests | ≥0 |
| pass_count | int | Number of passed tests | ≥0 |
| fail_count | int | Number of failed tests | ≥0 |
| skip_count | int | Number of skipped tests | ≥0 |
| total_duration | float | Total execution time in seconds | ≥0 |
| results | List[TestResult] | Individual test results | Required |
| pipeline_type | enum | quick, ci, debug, custom | Required |
| git_commit | str? | Git commit SHA | Optional |
| git_branch | str? | Git branch name | Optional |

**Derived Values**:

- `pass_rate = pass_count / total_count * 100` (percentage)
- `avg_duration = total_duration / total_count` (seconds)

**Invariants**:

- `total_count = pass_count + fail_count + skip_count + error_count`
- All `results` must have same `suite_id`

## Coverage Entities

### CoverageReport

Code coverage metrics for a test run.

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| report_id | str | Unique identifier (links to suite_id) | Required |
| language | enum | python, typescript | Required |
| total_statements | int | Total lines/statements | ≥0 |
| covered_statements | int | Covered lines/statements | ≥0 |
| total_branches | int | Total conditional branches | ≥0 |
| covered_branches | int | Covered branches | ≥0 |
| coverage_percentage | float | Overall coverage | 0-100 |
| file_coverage | List[FileCoverage] | Per-file breakdown | Required |
| threshold | float | Configured minimum threshold | 0-100, default: 80 |
| meets_threshold | bool | coverage_percentage ≥ threshold | Computed |
| timestamp | datetime | When coverage was measured | Required |

**Derived Values**:

- `coverage_percentage = (covered_statements / total_statements) * 100`
- `branch_coverage = (covered_branches / total_branches) * 100`
- `meets_threshold = coverage_percentage >= threshold`

### FileCoverage

Coverage metrics for a single source file.

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| file_path | str | Relative path from project root | Required |
| statements | int | Total statements in file | ≥0 |
| covered | int | Covered statements | ≥0 |
| missing_lines | List[int] | Line numbers not covered | Optional |
| percentage | float | File-specific coverage | 0-100 |

**Validation Rules**:

- `covered ≤ statements`
- `percentage = (covered / statements) * 100` if statements > 0, else 100

## Dependency Entities

### DependencyInfo

Information about a single package dependency.

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| name | str | Package name | Required |
| version | str | Installed version | Semver format |
| ecosystem | enum | python, npm | Required |
| license | str? | License identifier (SPDX) | Optional |
| has_vulnerabilities | bool | Security vulnerabilities found | Default: false |
| vulnerabilities | List[Vulnerability] | Detailed vulnerability info | Optional |
| is_direct | bool | Direct vs transitive dependency | Default: true |
| required_by | List[str] | Parent dependencies (if transitive) | Optional |

### Vulnerability

Security vulnerability information.

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| cve_id | str? | CVE identifier if available | Optional |
| severity | enum | low, moderate, high, critical | Required |
| description | str | Vulnerability description | Required |
| patched_versions | List[str] | Versions that fix the issue | Optional |
| advisory_url | str? | Link to security advisory | Optional |

### DependencyGraph

Complete dependency audit result.

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| audit_id | str | Unique audit identifier | Required |
| timestamp | datetime | When audit was performed | Required |
| python_deps | List[DependencyInfo] | Python packages | Required |
| npm_deps | List[DependencyInfo] | Node.js packages | Required |
| total_vulnerabilities | int | Count of all vulnerabilities | ≥0 |
| critical_vulnerabilities | int | Count of critical issues | ≥0 |
| has_conflicts | bool | Version conflicts detected | Default: false |
| conflicts | List[str] | Conflicting dependency descriptions | Optional |

**Derived Values**:

- `total_vulnerabilities = sum(len(dep.vulnerabilities) for all deps)`
- `critical_vulnerabilities = count(vuln.severity='critical' for all vulns)`

## Diagnostic Entities

### FlakyTestReport

Report of tests that pass inconsistently.

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| test_id | str | Identifier of flaky test | Required |
| total_runs | int | Number of times test was run | ≥3 |
| pass_count | int | Times test passed | ≥0 |
| fail_count | int | Times test failed | ≥0 |
| flake_rate | float | Failure percentage | 0-100 |
| first_seen | datetime | When flakiness first detected | Required |
| last_seen | datetime | Most recent flaky execution | Required |
| error_messages | List[str] | Unique error messages | Optional |
| suspected_cause | str? | Hypothesis about root cause | Optional |

**Derived Values**:

- `flake_rate = (fail_count / total_runs) * 100`
- A test is "flaky" if `0 < flake_rate < 100` (sometimes passes, sometimes fails)

**Validation Rules**:

- `total_runs = pass_count + fail_count`
- `total_runs ≥ 3` (need multiple runs to detect flakiness)
- `0 < flake_rate < 100` (deterministic pass/fail not considered flaky)

### PerformanceMetric

Performance measurement for a specific operation.

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| metric_id | str | Unique identifier | Required |
| operation | str | What was measured (e.g., "particle_update") | Required |
| value | float | Measured value | ≥0 |
| unit | str | Measurement unit (e.g., "ms", "fps", "MB") | Required |
| baseline | float? | Expected/baseline value | Optional |
| threshold_min | float? | Minimum acceptable value | Optional |
| threshold_max | float? | Maximum acceptable value | Optional |
| within_bounds | bool | value within [min, max] | Computed |
| timestamp | datetime | When measured | Required |

**Derived Values**:

- `within_bounds = (threshold_min ≤ value ≤ threshold_max)` if thresholds set
- `deviation_pct = ((value - baseline) / baseline) * 100` if baseline available

### E2ETestScenario

End-to-end test workflow specification.

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| scenario_id | str | Unique identifier | Required |
| name | str | Human-readable scenario name | Required |
| description | str | What user workflow is being tested | Required |
| steps | List[TestStep] | Ordered test steps | Required, ≥1 |
| expected_duration | float | Expected execution time (seconds) | ≥0 |
| timeout | float | Maximum allowed time (seconds) | >expected_duration |
| requires_ui | bool | Needs Electron/browser | Default: false |
| test_data | Dict[str, Any] | Input data for scenario | Optional |

### TestStep

Individual step within an E2E scenario.

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| step_number | int | Order in scenario | ≥1 |
| action | str | What action to perform | Required |
| expected_result | str | What should happen | Required |
| assertions | List[str] | Validation checks | Required, ≥1 |
| screenshot | bool | Capture screenshot after step | Default: false |

## Relationships

```
TestSuite (1) ─── (N) TestResult
   │
   └─── (1) CoverageReport (1) ─── (N) FileCoverage

DependencyGraph (1) ─── (N) DependencyInfo (1) ─── (N) Vulnerability

FlakyTestReport (N) ─── (1) TestResult [historical]

E2ETestScenario (1) ─── (N) TestStep

PerformanceMetric (N) ─── (1) TestResult [linked by test_id]
```

## State Transitions

### Test Execution State Machine

```
PENDING → RUNNING → [PASS | FAIL | SKIP | ERROR]
                  ↓
            (if retry enabled)
                  ↓
            RUNNING → [PASS | FAIL]
                  ↓
            (record retry_count)
```

### Flaky Test Detection

```
Test runs multiple times
  ↓
Results inconsistent (some pass, some fail)?
  Yes → Add to FlakyTestReport, increment flake counters
  No  → Normal test (all pass or all fail)
```

## Validation Rules Summary

1. **TestResult**: `duration ≥ 0`, error info present if failed
2. **TestSuite**: `total_count = sum(pass, fail, skip, error)`
3. **CoverageReport**: `covered ≤ total`, `percentage ≥ threshold` to pass
4. **DependencyInfo**: Valid semver version format
5. **FlakyTestReport**: `total_runs ≥ 3`, `0 < flake_rate < 100`
6. **PerformanceMetric**: `value ≥ 0`, within thresholds if specified
7. **E2ETestScenario**: `timeout > expected_duration`, `steps ≥ 1`

## Invariants

1. All timestamps must be in UTC
2. Percentages must be in range [0, 100]
3. Counts (pass_count, fail_count, etc.) must be non-negative integers
4. Duration measurements must be non-negative floats
5. File paths must be relative to project root
6. Test IDs must be unique within a suite
7. Coverage percentages calculated consistently across Python and TypeScript
8. Flaky tests must have inconsistent results (not all pass or all fail)

## Usage Examples

### Recording a Test Result

```python
result = TestResult(
    test_id="tests/contract/test_particle_engine.py::TestParticleEngine::test_particle_creation",
    status="pass",
    duration=0.042,
    stage="contract",
    timestamp=datetime.utcnow(),
    platform="Linux",
    retry_count=0
)
```

### Coverage Report

```python
report = CoverageReport(
    report_id="coverage-2025-10-04-12345",
    language="python",
    total_statements=1523,
    covered_statements=1298,
    total_branches=342,
    covered_branches=285,
    coverage_percentage=85.2,
    threshold=80.0,
    meets_threshold=True,
    timestamp=datetime.utcnow()
)
```

### Flaky Test Detection

```python
flaky = FlakyTestReport(
    test_id="tests/integration/test_stage_transitions.py::test_chaos_to_converging",
    total_runs=10,
    pass_count=7,
    fail_count=3,
    flake_rate=30.0,
    first_seen=datetime(2025, 10, 1),
    last_seen=datetime.utcnow(),
    suspected_cause="Timing-dependent assertion on chaos_energy threshold"
)
```

## Export Formats

Test results and coverage reports should be exportable in multiple formats:

- **JSON**: Machine-readable for CI/CD integration
- **XML**: JUnit format for CI dashboards
- **HTML**: Human-readable reports
- **Markdown**: Summary for PR comments

## Next Steps (Phase 1 Continued)

1. Create contracts for test infrastructure components
2. Define quickstart guide for running comprehensive test suite
3. Update agent context with testing patterns
