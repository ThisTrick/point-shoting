# GitHub Copilot Instructions

## Project Overview
This is a Python particle animation system that creates burst effects transitioning to recognizable image formation. The project uses a test-driven development approach with comprehensive testing strategies.

## Development Workflow & Tools

### Package Management
- **Use UV exclusively** for dependency management, not pip or conda
- Commands: `uv sync`, `uv add package-name`, `uv run command`
- Never suggest `pip install` - always use `uv add`

### Make Commands
- **Use Makefile targets** for common development tasks
- Quality checks: `make typecheck`, `make lint`, `make format`, `make check-all`
- Testing: `make test`, `make test-unit`, `make test-contract`, `make test-integration`
- Setup: `make install`, `make clean`, `make help`
- **Prefer make targets** over direct UV commands for consistency

### Testing Framework
- **Use runTests tool** for executing tests, not terminal commands
- Test structure: `tests/contract/`, `tests/integration/`, `tests/unit/`, `tests/performance/`
- VS Code Testing View is configured and preferred for development
- Property-based testing with hypothesis framework

### Code Style & Standards
- Python 3.11+ with **strict type hints** (mypy configured)
- Use dataclasses for data structures
- NumPy arrays for particle data (performance critical)
- Rich console for output formatting
- PIL/Pillow for image processing
- **Type checking**: Run `make typecheck` before commits
- **Code formatting**: Use `make format` for consistent style

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

#### When researching libraries:
- Use Context7 tools to get current documentation instead of assuming API details
- Always resolve library ID first, then get documentation
- Focus searches on specific topics (e.g., "array operations", "image processing", "test fixtures")

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

#### When fixing type checking errors:
- Use `make typecheck` to run mypy with proper configuration
- Add return type annotations (`-> None`, `-> int`, etc.) to all functions
- Use proper type hints for function parameters
- Import required types: `from typing import Dict, Any, Optional, List`
- Fix union type issues with proper None checks
- Use `# type: ignore` sparingly and only when necessary

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

### Documentation & Research Tools

#### Context7 Library Documentation
- **Use Context7 tools** for up-to-date library documentation and examples
- Available tools:
  - `mcp_context7_resolve-library-id`: Find library IDs for documentation lookup
  - `mcp_context7_get-library-docs`: Get comprehensive documentation for libraries
- **Usage pattern**:
  ```
  1. First resolve library ID: mcp_context7_resolve-library-id(libraryName="numpy")
  2. Then get docs: mcp_context7_get-library-docs(context7CompatibleLibraryID="/numpy/numpy")
  ```
- **When to use**: When you need current API documentation, usage examples, or best practices for external libraries
- **Examples**: NumPy array operations, PIL/Pillow image processing, pytest fixtures, hypothesis strategies

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
