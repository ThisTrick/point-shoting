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
