# Testing Quickstart Guide

This guide provides quick access to common testing workflows and troubleshooting for the Point Shoting project.

## 🚀 Quick Start Testing

### Prerequisites
```bash
# Install dependencies
make install

# Activate environment
source .venv/bin/activate
```

### Run Tests by Speed (Recommended)

```bash
# ⚡ Fast feedback (2-3 minutes) - for development
make test-pipeline-quick

# 🧪 Full validation (10-15 minutes) - before commits
make test-pipeline-ci

# 🎯 Complete pipeline (20+ minutes) - for releases
make test-pipeline-complete
```

## 📊 Test Types Overview

| Command | Purpose | Duration | When to Use |
|---------|---------|----------|-------------|
| `make test-unit` | Test individual functions | ~30s | Code changes |
| `make test-contract` | Test interfaces/APIs | ~1m | Interface changes |
| `make test-integration` | Test component interactions | ~2m | Service changes |
| `make test-e2e-engine` | Test full workflows | ~5m | Major changes |
| `make test-performance` | Benchmark performance | ~3m | Performance work |
| `make test-coverage` | Check code coverage | ~2m | Coverage analysis |

## 🔧 Common Development Workflows

### 1. Making Code Changes
```bash
# 1. Run fast tests for immediate feedback
make test-pipeline-quick

# 2. Fix any issues, then run full validation
make test-pipeline-ci

# 3. Generate reports to verify everything works
make test-reports
```

### 2. Debugging Test Failures
```bash
# Run with verbose output
uv run pytest tests/unit/ -v

# Run single failing test
uv run pytest tests/unit/test_specific.py::TestClass::test_method -v -s

# Drop into debugger on failure
uv run pytest tests/unit/test_specific.py --pdb

# Run with coverage to see what's tested
make test-coverage
# Then open htmlcov/index.html
```

### 3. Performance Testing
```bash
# Run performance benchmarks
make test-performance

# Check results
cat test-results/performance/*.json

# Run regression tests (compares against baselines)
make test-regression
```

### 4. Security & Dependency Checks
```bash
# Check for security vulnerabilities
make audit-dependencies

# Check for flaky tests
make detect-flaky
```

## 🎯 Test Markers & Filtering

```bash
# Run specific test types
pytest -m "unit"              # Unit tests only
pytest -m "contract"          # Contract tests only
pytest -m "integration"       # Integration tests only
pytest -m "performance"       # Performance tests only
pytest -m "e2e"              # E2E tests only

# Exclude slow tests
pytest -m "not slow"         # Skip slow tests

# Run tests for specific functionality
pytest -m "flaky"            # Potentially flaky tests
pytest -m "timeout"          # Tests with timeouts
```

## 📈 Coverage Analysis

```bash
# Generate coverage report
make test-coverage

# View detailed HTML report
open htmlcov/index.html

# Check coverage by file
uv run pytest --cov=src/point_shoting --cov-report=term-missing
```

## 🐛 Troubleshooting Common Issues

### Test Failures

**Issue**: Tests fail with import errors
```bash
# Solution: Install dependencies
make install
source .venv/bin/activate
```

**Issue**: Performance tests fail
```bash
# Check system resources
top  # or htop

# Run on quieter system
# Performance tests need consistent CPU availability
```

**Issue**: E2E tests fail
```bash
# Check test artifacts in CI
# Look for screenshots and error logs
# Verify test data files exist
ls examples/
```

### Coverage Issues

**Issue**: Coverage below 80%
```bash
# Find untested code
make test-coverage

# Add tests for missing lines
# Focus on critical paths first
```

### CI/CD Issues

**Issue**: CI fails but local tests pass
```bash
# Check Python version compatibility
python --version  # Should be 3.11+

# Run same pipeline as CI
make test-pipeline-ci
```

**Issue**: Dependency audit fails
```bash
# Update dependencies
uv sync

# Check for known vulnerabilities
make audit-dependencies
```

## 📋 Test Development Guidelines

### Writing New Tests

1. **Choose correct test type**:
   - `unit/` - Single function/class testing
   - `contract/` - Interface compliance
   - `integration/` - Component interactions
   - `e2e/` - Full workflow validation

2. **Use proper markers**:
   ```python
   @pytest.mark.unit
   def test_function_name():
       pass
   ```

3. **Follow naming convention**:
   ```python
   def test_<action>_<condition>_<expected_result>():
       pass
   ```

4. **Structure tests clearly**:
   ```python
   def test_feature_with_condition():
       # Arrange
       setup_data()

       # Act
       result = perform_action()

       # Assert
       assert result == expected
   ```

### Adding Performance Tests

```python
@pytest.mark.performance
def test_operation_meets_performance_target():
    import time

    start = time.perf_counter()
    # Perform operation
    result = expensive_operation()
    end = time.perf_counter()

    duration = end - start
    assert duration < 1.0  # Must complete in < 1 second
```

## 📊 Reports & Dashboards

```bash
# Generate comprehensive test reports
make test-reports

# View HTML dashboard
open test-results/reports/dashboard.html

# Check JSON reports
cat test-results/reports/comprehensive-report.json
```

Reports include:
- ✅ Test pass/fail summary
- 📈 Coverage percentages
- ⚡ Performance metrics
- 🔍 Flaky test analysis
- 💡 Actionable recommendations

## 🔄 CI/CD Pipeline

The project uses GitHub Actions with these jobs:

- **lint**: Code quality checks
- **audit**: Security vulnerability scanning
- **test**: Multi-version Python testing
- **test-coverage**: Coverage analysis
- **e2e-python**: Python E2E validation
- **e2e-ui**: UI E2E testing
- **performance-benchmark**: Performance regression detection
- **regression-tests**: Baseline comparison
- **test-reports**: Report generation

### Pipeline Triggers

- **Push to main/develop**: Full pipeline
- **Pull requests**: Full pipeline
- **Daily**: Flaky test detection
- **Manual**: Any job on demand

## 🎯 Key Metrics to Monitor

- **Test Pass Rate**: Should be > 99%
- **Code Coverage**: Should be > 80%
- **Performance**: FPS > 55, Memory < 300MB
- **Security**: No high/critical vulnerabilities
- **Flaky Tests**: Should be 0

## 📞 Getting Help

1. **Check this guide first** - Most common issues are covered
2. **Run with verbose output** - `pytest -v -s` for detailed info
3. **Check CI artifacts** - Screenshots, logs, and reports
4. **Review test structure** - Ensure tests follow project patterns
5. **Check dependencies** - `make install` and verify environment

## 🚀 Advanced Usage

### Custom Test Runs

```bash
# Run tests in parallel (faster)
uv run pytest tests/ -n auto

# Run with different output formats
uv run pytest tests/ --json-report --json-report-file=results.json

# Run tests matching pattern
uv run pytest -k "test_particle" -v
```

### Performance Profiling

```bash
# Profile specific test
uv run pytest tests/performance/ --profile

# Run profiling script
python scripts/profile_engine.py
```

### Debugging E2E Tests

```bash
# Run E2E with browser visible
cd ui && npm run test:e2e -- --headed

# Run specific E2E test
cd ui && npx playwright test user-workflows.spec.ts --headed
```

Remember: **Start simple, run fast tests first, then expand to full validation as needed.**</content>
<parameter name="filePath">/home/den/git/point-shoting/QUICKSTART.md
