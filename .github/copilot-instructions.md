# GitHub Copilot Instructions

## Development Workflow & Tools

### Testing Framework
- **Use runTests tool** for executing tests, not terminal commands
- **Use Makefile targets** for comprehensive test execution and CI pipelines
- VS Code Testing View is configured and preferred for development
- Property-based testing with hypothesis framework

#### Test Execution Strategies:
- **Quick development**: Use quick pipeline commands for fast feedback
- **CI pipeline**: Use comprehensive pipeline commands for full validation
- **Debug pipeline**: Use sequential execution for debugging
- **Parallel execution**: Use parallel execution for better performance
- **Coverage**: Use coverage reporting for comprehensive validation

### Common Patterns

#### When researching libraries:
- Use Context7 tools to get current documentation instead of assuming API details
- Always resolve library ID first, then get documentation
- Focus searches on specific topics (e.g., "array operations", "image processing", "test fixtures")

#### When creating tests:
- Use `runTests(files=["/absolute/path/to/test.py"])` for individual test execution
- Use Makefile targets for comprehensive testing
- Include proper pytest markers: `@pytest.mark.unit`, `@pytest.mark.contract`
- Follow arrange-act-assert pattern
- Use descriptive test names that explain the scenario

#### When running tests:
- **Development feedback**: Use quick pipeline commands (fast, skips E2E)
- **CI validation**: Use comprehensive pipeline commands (includes all tests)
- **Debug issues**: Use sequential execution (step-by-step, shows failures early)
- **Individual test types**: Use specific test commands for targeted testing

#### When implementing services:
- Follow contract specifications
- Implement contract test first, then service
- Use dependency injection pattern
- Handle edge cases and validation

#### When fixing type checking errors:
- Use type checking tools to run static analysis
- Add return type annotations to all functions
- Use proper type hints for function parameters
- Import required types from typing module
- Fix union type issues with proper None checks
- Use type ignore sparingly and only when necessary

### Git Workflow
- Use GitKraken MCP tools for git operations when available
- Commit frequently with descriptive messages
- Update task tracking documents to track progress

### Documentation & Research Tools

#### Context7 Library Documentation
- **Use Context7 tools** for up-to-date library documentation and examples
- Available tools:
  - `mcp_context7_resolve-library-id`: Find library IDs for documentation lookup
  - `mcp_context7_get-library-docs`: Get comprehensive documentation for libraries
- **Usage pattern**:
  ```
  1. First resolve library ID: mcp_context7_resolve-library-id(libraryName="library-name")
  2. Then get docs: mcp_context7_get-library-docs(context7CompatibleLibraryID="/org/library")
  ```
- **When to use**: When you need current API documentation, usage examples, or best practices for external libraries

### Mandatory Documentation & Tools

#### Makefile Usage (MANDATORY)
- **ALWAYS use Makefile targets** for all development, build, test, and deployment operations
- **NEVER run raw commands** like `pytest`, `ruff`, `mypy`, `npm` directly - always use corresponding Makefile targets
- **Key mandatory targets** (from `make help`):

  **Setup & Dependencies:**
  - `make install` - Install dependencies using UV
  - `make dev-install` - Install dependencies with all extras using UV (not in help)
  - `make sync` - Sync dependencies using UV sync script

  **Code Quality:**
  - `make check-all` - Run all quality checks (format, lint, typecheck)
  - `make lint` - Lint code with ruff
  - `make format` - Format code with ruff
  - `make typecheck` - Run mypy type checking
  - `make typecheck-fix` - Run mypy with suggestions for quick fixes
  - `make typecheck-strict` - Run strict mypy type checking (not in help)

  **Testing Pipelines:**
  - `make test-pipeline-quick` - Run quick pipeline (quality + unit + integration, skip E2E) - for development
  - `make test-sequential` - Run sequential testing pipeline (build → unit → UI → contract → integration → performance → E2E) - for development debugging
  - `make test-pipeline-ci` - Run CI pipeline (install + quality + coverage + UI unit+contract + UI build + E2E)

  **Individual Test Types:**
  - `make test` - Run all tests (parallel)
  - `make test-unit` - Run unit tests only (parallel)
  - `make test-contract` - Run contract tests only (parallel)
  - `make test-integration` - Run integration tests only (parallel)
  - `make test-performance` - Run performance tests only (parallel)
  - `make test-coverage` - Run tests with coverage report (parallel)

  **UI Development:**
  - `make ui-build` - Build UI application
  - `make ui-test` - Run all UI tests (unit + contract + integration)
  - `make ui-test-parallel` - Run UI unit and contract tests in parallel
  - `make ui-test-contract` - Run UI contract tests
  - `make ui-test-integration` - Run UI integration tests
  - `make ui-test-e2e` - Run UI E2E tests
  - `make ui-lint` - Lint UI code
  - `make ui-typecheck` - Type check UI code

  **Build & Development:**
  - `make build` - Build the package
  - `make build-all` - Build both Python and UI components (not in help)
  - `make run-example` - Run minimal example
  - `make profile` - Run performance profiling
  - `make clean` - Remove build artifacts and cache files
  - `make help` - Show all available targets

- **Before any code changes**: Run `make check-all` to ensure code quality
- **Before committing**: Run `make test-pipeline-quick` for validation
- **For CI/CD setup**: Use `make test-pipeline-ci` as the reference pipeline

#### CI/CD Documentation (MANDATORY)
- **ALWAYS consult `CI_DOCUMENTATION.md`** before making changes to testing or CI/CD processes
- **Understanding test levels**: Refer to CI_DOCUMENTATION.md for the complete testing pyramid and execution order
- **Pipeline configuration**: Use CI_DOCUMENTATION.md as the authoritative source for pipeline setup
- **Performance targets**: Check CI_DOCUMENTATION.md for expected test execution times and resource usage
- **Test categories**: Understand the 8 levels of testing (Unit → UI Unit → Contract → UI Contract → Integration → UI Integration → Performance → E2E)
- **Failure debugging**: Use CI_DOCUMENTATION.md guidance for troubleshooting test failures by category

### Error Handling Patterns
- Use descriptive error messages with context
- Validate inputs at service boundaries
- Graceful degradation for optional features
- Proper exception types for different error categories

### Documentation Standards
- Docstrings for all public methods
- Type hints for all function signatures
- Inline comments for complex algorithms
- README updates for user-facing changes

When suggesting code changes or new features, always consider the existing architecture patterns and testing strategy.
