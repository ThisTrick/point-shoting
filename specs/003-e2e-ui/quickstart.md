# Quickstart: Comprehensive Testing & Debugging

**Feature**: 003-e2e-ui | **Phase**: 1 | **Date**: October 4, 2025

## Overview

This guide provides step-by-step instructions for running the comprehensive test suite, debugging failures, and validating system quality before deployment.

## Prerequisites

- Python 3.11+ with UV installed
- Node.js 20+ with npm installed
- Git repository cloned
- All dependencies installed (`make install`)

## Quick Commands

### Run Everything (CI Pipeline)

```bash
# Complete validation pipeline (15 minutes)
make test-pipeline-ci
```

This runs:

1. Dependency installation
2. Code quality checks (lint, format, typecheck)
3. All tests with coverage (unit → contract → integration → performance → E2E)
4. UI build
5. UI E2E tests

### Fast Feedback (Development)

```bash
# Quick pipeline (60 seconds) - skip E2E
make test-pipeline-quick
```

Runs: quality checks + unit + integration tests only.

### Debug Pipeline (Investigation)

```bash
# Sequential execution with verbose output
make test-sequential
```

Runs tests in order, stops on first failure for easy debugging.

## Step-by-Step Testing

### 1. Validate Code Quality

```bash
# Run all quality checks
make check-all
```

Checks:

- **Lint**: Code style with ruff
- **Format**: Code formatting with ruff
- **Typecheck**: Static analysis with mypy

Fix issues:

```bash
make format      # Auto-fix formatting
make lint-fix    # Auto-fix some lint issues
make typecheck-fix  # Get suggestions for type issues
```

### 2. Run Unit Tests

```bash
# Python unit tests (fast, ~5 seconds)
make test-unit

# UI unit tests
cd ui && npm run test -- --testPathPattern=unit
```

Expected output:

```
✅ 6 test files passed (50 tests)
⏱️  Duration: 4.2s
```

### 3. Run Contract Tests

```bash
# Python contract tests (~10 seconds)
make test-contract

# UI contract tests
cd ui && npm run test -- --testPathPattern=contract
```

Validates:

- Service interfaces (ParticleEngine, ColorMapper, etc.)
- API contracts
- Data model invariants

### 4. Run Integration Tests

```bash
# Python integration tests (~45 seconds)
make test-integration

# UI integration tests
cd ui && npm run test -- --testPathPattern=integration
```

Tests:

- Component interactions
- IPC communication (UI ↔ Python)
- Full workflows within each layer

### 5. Run Performance Tests

```bash
# Performance benchmarks (~15 seconds)
make test-performance
```

Validates:

- Particle update performance (target: >1000 particles/frame at 60 FPS)
- Recognition algorithm speed
- Memory usage

### 6. Run E2E Tests

#### Python Engine E2E

```bash
# Full particle animation pipeline
make test-e2e-engine
```

Tests complete workflow:

1. Load image
2. Initialize particles
3. Run through all stages (BURST → CHAOS → CONVERGING → FORMATION → BREATHING)
4. Validate recognition score
5. Check final output

Expected output:

```
✅ test_full_animation_pipeline PASSED (42.3s)
✅ test_stage_transitions PASSED (38.1s)
✅ test_recognition_convergence PASSED (35.7s)
⏱️  Total: 2m 16s
```

#### UI E2E (Playwright)

```bash
# Electron UI workflows
make ui-test-e2e
```

Tests user workflows:

1. Upload image
2. Configure settings
3. Start animation
4. Monitor progress
5. Export result

Expected output:

```
✅ 26 tests passed
⏱️  Duration: 3m 42s
📷 Screenshots: test-results/
```

### 7. Measure Coverage

```bash
# Python coverage
make test-coverage

# UI coverage
cd ui && npm run test:coverage
```

Expected output:

```
Coverage Summary:
  Statements: 85.2% (1298/1523)
  Branches:   83.3% (285/342)
  Functions:  89.1% (142/159)
  
✅ Coverage threshold (80%) met
```

View detailed HTML report:

```bash
# Python
open htmlcov/index.html

# UI
open ui/coverage/lcov-report/index.html
```

### 8. Audit Dependencies

```bash
# Check for security vulnerabilities
make audit-dependencies
```

Expected output:

```
🔍 Auditing Python dependencies...
✅ No vulnerabilities found in 47 packages

🔍 Auditing npm dependencies...
✅ No vulnerabilities found in 203 packages
```

If vulnerabilities found:

```bash
# Python: Review and fix
uv run pip-audit --fix

# UI: Review and fix
cd ui && npm audit fix
```

### 9. Detect Flaky Tests

```bash
# Run tests 10x to find inconsistent results
make detect-flaky
```

This runs all tests 10 times and identifies tests that sometimes pass, sometimes fail.

Expected output:

```
Running test suite 10 times...
[Run 1/10] ✅ 320/320 passed
[Run 2/10] ✅ 320/320 passed
[Run 3/10] ⚠️ 319/320 passed (1 flaky)
...
[Run 10/10] ✅ 320/320 passed

🎯 Flaky Tests Found: 1
  - test_stage_transition_timing: 10% flake rate (1/10 failed)
    Suspected cause: Race condition in timing assertion
```

### 10. Run Regression Suite

```bash
# Compare against baseline
make test-regression
```

Validates:

- No previously passing tests now fail
- Performance hasn't degraded
- Coverage hasn't decreased

## Debugging Failures

### View Detailed Error Output

```bash
# Verbose output with full stack traces
make test-verbose
```

### Run Single Test File

```bash
# Python
uv run pytest tests/integration/test_specific_feature.py -v

# UI
cd ui && npm test -- tests/integration/SpecificComponent.test.tsx
```

### Run Single Test

```bash
# Python
uv run pytest tests/integration/test_file.py::test_specific_case -v

# UI
cd ui && npm test -- -t "specific test name"
```

### Debug With Breakpoints

```python
# Add to test
import pdb; pdb.set_trace()

# Run without pytest capture
uv run pytest tests/test_file.py -s
```

### View Playwright Traces (UI E2E)

```bash
# Open trace viewer
cd ui && npx playwright show-trace test-results/.../trace.zip
```

### Check Logs

```bash
# Python test logs
cat test-results/test-run.log

# UI test logs
cat ui/test-results/stdout.log
```

## Common Issues & Solutions

### Issue: Tests Timeout

**Symptom**: `TimeoutError: Test exceeded 60s limit`

**Solutions**:

```bash
# Increase timeout
uv run pytest tests/e2e/ --timeout=120

# Check for hanging processes
ps aux | grep python
ps aux | grep electron
```

### Issue: Import Errors

**Symptom**: `ModuleNotFoundError: No module named 'xxx'`

**Solutions**:

```bash
# Reinstall dependencies
make install

# Sync environment
make sync
```

### Issue: Coverage Below Threshold

**Symptom**: `Coverage 78.5% below 80% threshold`

**Solutions**:

1. Identify uncovered lines:

```bash
make test-coverage
open htmlcov/index.html
```

2. Add tests for uncovered code
3. Or adjust threshold if justified

### Issue: Flaky E2E Tests

**Symptom**: Test passes locally, fails in CI

**Solutions**:

```bash
# Run headless mode locally (matches CI)
cd ui && npm run test:e2e -- --headed=false

# Add explicit waits
await page.waitForSelector('[data-testid="element"]', { state: 'visible' })

# Increase timeout for slow operations
await expect(page.locator('...')).toBeVisible({ timeout: 10000 })
```

### Issue: Memory Errors in E2E

**Symptom**: `Out of memory` during E2E tests

**Solutions**:

```bash
# Run serially instead of parallel
cd ui && npm run test:e2e -- --workers=1

# Reduce test image sizes
# Use 1024x1024 instead of 4096x4096
```

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/test.yml`:

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Install UV
        run: curl -LsSf https://astral.sh/uv/install.sh | sh
      
      - name: Install Dependencies
        run: make install
      
      - name: Run CI Pipeline
        run: make test-pipeline-ci
      
      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage.xml,./ui/coverage/lcov.info
      
      - name: Upload Test Results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: |
            test-results/
            ui/test-results/
            ui/playwright-report/
```

### Pre-commit Hook

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash
# Run quick validation before commit

make check-all || exit 1
make test-pipeline-quick || exit 1

echo "✅ Pre-commit checks passed"
```

Make executable:

```bash
chmod +x .git/hooks/pre-commit
```

## Success Criteria

Your system is ready for deployment when:

- ✅ `make test-pipeline-ci` passes (all 320+ tests)
- ✅ Coverage ≥80% for both Python and TypeScript
- ✅ No critical dependency vulnerabilities
- ✅ No flaky tests (or all quarantined with issues)
- ✅ All E2E workflows complete successfully
- ✅ Performance metrics meet targets (>30 FPS, <100ms latency)

## Next Steps

After validation passes:

1. Review coverage report for gaps
2. Address any flaky tests
3. Update documentation with findings
4. Merge to main branch
5. Deploy with confidence! 🚀

## References

- Full CI Documentation: `/docs/CI_DOCUMENTATION.md`
- Makefile targets: `make help`
- Test organization: `/tests/README.md`
- Playwright guides: `/ui/tests/README.md`
