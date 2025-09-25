# Point Shoting

Particle burst animation transitioning to recognizable image formation.

## Overview

This project creates animated visualizations where particles burst from central points, go through chaotic motion, and converge into recognizable image formations. Built with Python 3.11+ for CPU-only processing with performance targets of 60 FPS.

## Features

- **Particle Animation**: Burst → Chaos → Converging → Formation → Breathing phases
- **Multiple Density Profiles**: Low (~3k), Medium (~9k), High (~15k) particles  
- **Color Modes**: Stylized (limited palette) and Precise (image-accurate) coloring
- **Performance Optimized**: Vectorized NumPy operations for smooth 60 FPS
- **Configurable Settings**: Speed profiles, loop mode, HUD display, localization
- **CLI Interface**: Command-line interface for easy automation and scripting

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

```bash
make test                    # Run all tests
make test-contract          # Run contract tests
make test-integration       # Run integration tests
make test-unit              # Run unit tests
make test-performance       # Run performance tests
make test-coverage          # Run with coverage report
```

### Project Structure

```
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
└── performance/       # Performance and benchmark tests
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
