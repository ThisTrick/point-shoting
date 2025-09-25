# GitHub Copilot Instructions

## Project Overview
This is a Python particle animation system that creates burst effects transitioning to recognizable image formation. The project uses a test-driven development approach with comprehensive testing strategies.

## Development Workflow & Tools

### Package Management
- **Use UV exclusively** for dependency management, not pip or conda
- Commands: `uv sync`, `uv add package-name`, `uv run command`
- Never suggest `pip install` - always use `uv add`

### Testing Framework
- **Use runTests tool** for executing tests, not terminal commands
- Test structure: `tests/contract/`, `tests/integration/`, `tests/unit/`, `tests/performance/`
- VS Code Testing View is configured and preferred for development
- Property-based testing with hypothesis framework

### Code Style & Standards
- Python 3.11+ with type hints
- Use dataclasses for data structures
- NumPy arrays for particle data (performance critical)
- Rich console for output formatting
- PIL/Pillow for image processing

### Architecture Patterns
- **Contract-first development**: All services have contract tests
- **Phase-based implementation**: Follow the task phases in `specs/001-/tasks.md`
- **Array-based particle storage**: Use `ParticleArrays` dataclass with NumPy
- **Service layer pattern**: Separate services in `src/point_shoting/services/`

### Testing Strategy
1. **Contract tests**: Verify interface compliance and invariants
2. **Unit tests**: Test individual components with edge cases
3. **Integration tests**: Test component interactions
4. **Property-based tests**: Use hypothesis for invariant testing
5. **Performance tests**: Mock timing for deterministic benchmarks

### File Organization
```
src/point_shoting/
├── models/          # Data structures (Stage, Settings, ParticleArrays, Metrics)
├── services/        # Business logic services
├── cli/            # Command-line interface
└── lib/            # Utilities (logging, timing)

tests/
├── contract/       # Interface compliance tests
├── integration/    # Cross-component tests
├── unit/          # Component-specific tests
└── performance/   # Performance benchmarks
```

### Common Patterns

#### When creating tests:
- Use `runTests(files=["/absolute/path/to/test.py"])` to execute
- Include proper pytest markers: `@pytest.mark.unit`, `@pytest.mark.contract`
- Follow arrange-act-assert pattern
- Use descriptive test names that explain the scenario

#### When working with particles:
- Always use `ParticleArrays` dataclass for particle storage
- Positions and targets in normalized [0,1]² coordinate space
- Use `allocate_particle_arrays(count)` for initialization
- Apply bounds checking with `clamp_positions()`

#### When implementing services:
- Follow contract specifications in `specs/001-/contracts/`
- Implement contract test first, then service
- Use dependency injection pattern
- Handle edge cases and validation

### Git Workflow
- Work on branch `001-` for this feature
- Use GitKraken MCP tools for git operations when available
- Commit frequently with descriptive messages
- Update `specs/001-/tasks.md` to track progress

### Performance Considerations
- Particle operations use NumPy for vectorization
- HUD rendering has 5% frame budget constraint
- Memory usage target: ≤300MB RSS
- Target performance: ≥55 FPS for medium density

### Key Dependencies
- **numpy**: Particle array operations
- **pillow**: Image processing and loading
- **rich**: Console output formatting
- **pytest**: Testing framework
- **hypothesis**: Property-based testing

### Error Handling Patterns
- Use descriptive error messages with context
- Validate inputs at service boundaries
- Graceful degradation for optional features (HUD, watermarks)
- Proper exception types for different error categories

### Documentation Standards
- Docstrings for all public methods
- Type hints for all function signatures
- Inline comments for complex algorithms
- README updates for user-facing changes

## Current Project Status
- **Phase 3.7 COMPLETED**: Integration Wiring & Additional Tests (56/100 tasks done)
- **Next Phase**: 3.8 Performance & Polish
- All core services implemented and tested
- 37 contract tests passing, 42 unit tests added
- Property-based testing framework established

When suggesting code changes or new features, always consider the existing architecture patterns and testing strategy.