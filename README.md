# Point Shoting

Particle burst animation transitioning to recognizable image formation.

## Overview

This project creates animated visualizations where particles burst from central points, go through chaotic motion, and converge into recognizable image formations. Built with Python 3.11+ for CPU-only processing with performance targets of 60 FPS.

## Features

- **Particle Animation**: Burst → Chaos → Converging → Formation → Breathing phases
- **Multiple Density Profiles**: Low (~3k), Medium (~9k), High (~15k) particles  
- **Color Modes**: Stylized (limited palette) and Precise (image-accurate) coloring
- **🚀 High Performance**: **60 FPS** with vectorized NumPy operations (6.7x faster than v1.0)
- **Memory Efficient**: Optimized particle arrays with proper dtype handling
- **Configurable Settings**: Speed profiles, loop mode, HUD display, localization
- **CLI Interface**: Command-line interface for easy automation and scripting
- **Comprehensive Testing**: 230+ tests including performance benchmarks

## Quick Start

### Prerequisites

- Python 3.11+
- [uv](https://docs.astral.sh/uv/) package manager (recommended)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd point-shoting

# Install dependencies
make install
# or manually: uv sync

# Activate virtual environment
source .venv/bin/activate  # Linux/macOS
# .venv\Scripts\activate     # Windows
```

### Basic Usage

```bash
# Run with default settings
uv run python -m point_shoting path/to/image.png

# Specify settings
uv run python -m point_shoting image.png --density medium --speed normal --color-mode stylized

# Enable HUD and loop mode
uv run python -m point_shoting image.png --hud --loop
```

### Programmatic API

```python
from point_shoting.services.particle_engine import ParticleEngine
from point_shoting.models.settings import Settings, DensityProfile, ColorMode

# Create engine with custom settings
settings = Settings(
    density_profile=DensityProfile.MEDIUM,
    color_mode=ColorMode.STYLIZED,
    hud_enabled=True,
    loop_mode=False
)

engine = ParticleEngine()
engine.init(settings, 'path/to/image.png')
engine.start()

# Run simulation
while True:
    engine.step()
    metrics = engine.get_metrics()
    
    if metrics.recognition >= 0.8:  # Recognition achieved
        break
```

### Profiling and Performance Analysis

```bash
# Basic performance profiling
uv run python scripts/profile_engine.py --particles 8000 --steps 100

# Compare across different particle densities
uv run python scripts/profile_engine.py --compare-densities

# Profile specific animation stage
uv run python scripts/profile_engine.py --stage chaos --particles 5000
```

## Performance

The system has been optimized for high-performance particle simulation:

| Metric | Target | Achieved | Notes |
|--------|--------|----------|-------|
| **FPS** | ≥55 FPS | **~60 FPS** | 6.7x improvement over v1.0 |
| **HUD Overhead** | <5% | **<5%** | Efficient debug rendering |
| **Memory Usage** | ≤300MB | **<300MB** | Optimized array allocations |
| **Startup Time** | ≤2s | **<2s** | Fast image processing and initialization |

### Performance Features

- **Vectorized Physics**: All particle operations use NumPy vectorized calculations
- **Optimized Updates**: Color updates every 5 frames instead of every frame  
- **Efficient Memory**: Float32 arrays with proper dtype preservation
- **Reduced Overhead**: Streamlined recognition and chaos calculations
- **Smart Caching**: Minimal recomputation of expensive operations

## Development

### Setup Development Environment

```bash
make dev-install  # Install with dev dependencies
```

### Code Quality

```bash
make lint         # Check code style
make format       # Format code
make lint-fix     # Fix linting issues
```

### Testing

Point Shoting uses a comprehensive testing strategy with 8 levels of testing, from unit tests to end-to-end validation. All tests are orchestrated through Makefile targets for consistent execution.

#### Test Types

| Test Level | Description | Location | Purpose |
|------------|-------------|----------|---------|
| **Unit Tests** | Isolated component testing | `tests/unit/` | Verify individual functions/classes work correctly |
| **Contract Tests** | Interface compliance validation | `tests/contract/` | Ensure APIs and interfaces behave as specified |
| **Integration Tests** | Component interaction testing | `tests/integration/` | Validate service interactions and data flow |
| **UI Unit Tests** | Frontend component testing | `ui/tests/unit/` | Test React components in isolation |
| **UI Contract Tests** | UI interface validation | `ui/tests/contract/` | Verify UI component contracts |
| **Performance Tests** | Benchmark and profiling | `tests/performance/` | Ensure performance targets are met |
| **UI Integration Tests** | Full UI workflow testing | `ui/tests/integration/` | Test complete UI interactions |
| **E2E Tests** | End-to-end validation | `tests/e2e/` + `ui/tests/e2e/` | Full system validation with real data |

#### Test Execution

```bash
# Quick development testing (skip E2E for speed)
make test-pipeline-quick     # Quality + Unit + Integration (fast feedback)

# Individual test types
make test-unit              # Unit tests only
make test-contract          # Contract tests only
make test-integration       # Integration tests only
make test-performance       # Performance benchmarks
make test-e2e-engine        # Python E2E tests (dependency audit, pipeline, regression)
make test-e2e-ui           # UI E2E tests
make test-e2e-all          # All E2E tests

# Quality and coverage
make check-all             # Lint + format + typecheck
make test-coverage         # Run with coverage report (80% minimum)
make audit-dependencies    # Security audit with pip-audit

# Regression and stability
make test-regression       # Compare against performance baselines
make detect-flaky          # Detect flaky tests across multiple runs

# Complete pipeline (for CI/CD)
make test-pipeline-complete # Full pipeline: install → quality → coverage → E2E → audit → regression → flaky

# Reports and dashboards
make test-reports          # Generate comprehensive test reports and HTML dashboards
```

#### Test Markers

Tests use pytest markers for flexible execution:

```bash
# Run specific marker groups
pytest -m "unit"           # Unit tests only
pytest -m "contract"       # Contract tests only
pytest -m "integration"    # Integration tests only
pytest -m "performance"    # Performance tests only
pytest -m "e2e"           # E2E tests only

# Exclude slow tests
pytest -m "not slow"      # Skip slow-running tests

# Run with specific conditions
pytest -m "flaky"         # Tests that may be flaky
pytest -m "timeout"       # Tests with timeout markers
```

#### CI/CD Integration

GitHub Actions provides comprehensive CI/CD with the following pipeline:

- **Triggers**: Push to main/develop/001-*, PRs, daily flaky detection
- **Jobs**:
  - `lint`: Code quality (ruff lint/format)
  - `audit`: Dependency security audit
  - `test`: Multi-Python version testing (3.11, 3.12)
  - `test-coverage`: Coverage reporting with 80% threshold
  - `e2e-python`: Python E2E test suite
  - `e2e-ui`: UI E2E tests with Playwright
  - `performance-benchmark`: Performance regression detection
  - `regression-tests`: Baseline comparison testing
  - `flaky-detection`: Automated flaky test detection
  - `complete-pipeline`: Full validation pipeline
  - `test-reports`: Report generation and artifact upload

- **Artifacts**: Test results, coverage reports, performance data, E2E screenshots, HTML dashboards
- **Coverage**: Codecov integration with branch protection rules
- **Regression Alerts**: Automatic alerts for performance or functionality regressions

#### Test Reports and Dashboards

Comprehensive test reporting is available through:

```bash
make test-reports  # Generate HTML dashboard and JSON reports
```

Reports include:

- **Test Summary**: Pass/fail counts, coverage percentages, flaky test counts
- **Coverage Details**: Line-by-line coverage with HTML visualization
- **Performance Metrics**: FPS, memory usage, frame times with trend analysis
- **Flaky Test Analysis**: Detection results with failure patterns
- **Recommendations**: Actionable insights for test improvements

Reports are automatically generated in CI and uploaded as artifacts.

#### Performance Baselines

Performance tests maintain baselines for regression detection:

- **FPS Targets**: ≥55 FPS average (target 60 FPS)
- **Memory Limits**: <300MB at 10k particles
- **Startup Time**: ≤2 seconds to first burst
- **Control Latency**: ≤200ms for pause/resume

Baselines are stored in `test-results/baselines/` and automatically updated on main branch.

#### Writing Tests

Follow these patterns when adding new tests:

1. **TDD Approach**: Write contract tests first, then implementation
2. **Test Markers**: Use appropriate pytest markers (`@pytest.mark.unit`, etc.)
3. **Descriptive Names**: `test_<action>_<condition>_<expected_result>`
4. **Arrange-Act-Assert**: Clear test structure
5. **Parametrized Tests**: Use `@pytest.mark.parametrize` for multiple scenarios
6. **Mock External Dependencies**: Use `pytest-mock` for external services
7. **Performance Assertions**: Include timing assertions in performance tests

Example test structure:

```python
@pytest.mark.unit
class TestParticleEngine:
    def test_initialization_with_valid_settings(self):
        # Arrange
        settings = Settings(density_profile=DensityProfile.MEDIUM)

        # Act
        engine = ParticleEngine()
        success = engine.init(settings, "test.png")

        # Assert
        assert success is True
        assert engine.particles is not None
```

#### Debugging Test Failures

- **Verbose Output**: `pytest -v -s` for detailed test execution
- **Debug Mode**: `pytest --pdb` to drop into debugger on failures
- **Coverage Gaps**: `pytest --cov-report=html` then open `htmlcov/index.html`
- **Performance Issues**: Check `test-results/performance/` for detailed metrics
- **E2E Failures**: Check CI artifacts for screenshots and Playwright traces

### Project Structure

```text
src/
├── point_shoting/
│   ├── models/          # Data models (Stage, Settings, Particle arrays)
│   ├── services/        # Core services (Engine, Renderers, Policies)
│   ├── cli/            # Command-line interface
│   └── lib/            # Utilities (logging, timing)
tests/
├── contract/           # Interface compliance tests
├── integration/        # Component interaction tests
├── unit/              # Isolated component tests
├── e2e/               # End-to-end tests
└── performance/       # Performance and benchmark tests
ui/
├── src/               # React/TypeScript source
├── tests/             # Jest + Playwright tests
└── public/            # Static assets
```

## Performance Targets

- **Frame Rate**: ≥55 FPS average (target 60 FPS)
- **Startup Time**: ≤2 seconds to first burst
- **Memory Usage**: <300MB @ 10k particles
- **Control Latency**: ≤200ms for pause/resume

## Architecture

- **CPU-Only**: No GPU dependencies for maximum compatibility
- **Vectorized**: NumPy array operations for performance
- **Modular**: Clean separation of concerns with testable interfaces
- **Observable**: Structured JSON logging and debug HUD

## Contributing

1. Follow the established code style (Ruff formatting)
2. Write tests for new features (contract → implementation TDD approach)
3. Ensure performance benchmarks pass
4. Update documentation as needed

## License

MIT License - see LICENSE file for details.
