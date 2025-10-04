.PHONY: install format lint typecheck typecheck-fix check-all test test-unit test-contract test-integration test-performance test-coverage clean run-example profile build sync help ui-build ui-test ui-test-parallel ui-test-integration ui-test-e2e ui-lint ui-typecheck test-pipeline-quick test-pipeline-ci test-sequential

# Installation targets
install:
	uv sync

dev-install:
	uv sync --all-extras

# Code quality targets
lint:
	uv run ruff check .
	uv run ruff format --check .

format:
	uv run ruff format .

# Type checking
typecheck:
	uv run mypy src/point_shoting --show-error-codes --ignore-missing-imports

typecheck-strict:
	uv run mypy src/point_shoting --strict --show-error-codes

# All quality checks (lint only for pipeline speed)
check-all: lint
	@echo "All code quality checks passed!"

# Testing targets
test:
	uv run pytest --tb=short -n auto

test-contract:
	uv run pytest -m contract --tb=short -n auto

test-integration:
	uv run pytest -m integration --tb=short -n auto

test-unit:
	uv run pytest -m unit --tb=short -n auto

test-performance:
	uv run pytest -m performance --tb=short -n auto

# Coverage
test-coverage:
	uv run pytest --cov=src/point_shoting --cov-report=html --cov-report=term --tb=short -n auto

# Verbose test output for debugging
test-verbose:
	uv run pytest -v --tb=short -n auto

# Cleanup
clean:
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	rm -rf build/
	rm -rf dist/
	rm -rf htmlcov/
	rm -rf .pytest_cache/
	rm -rf .ruff_cache/

# Development
run-example:
	uv run python examples/minimal_run.py

profile:
	uv run python scripts/profile_engine.py

# Build
build:
	uv build

# Build all components (Python + UI)
build-all: build ui-build
	@echo "✅ All components built successfully"

# UI targets
ui-build:
	cd ui && npm run build:dev

ui-test:
	cd ui && npm run test -- --maxWorkers=50%

ui-test-parallel:
	cd ui && npm run test -- --testPathPattern="(unit|contract)" --maxWorkers=50%

ui-test-integration:
	cd ui && npm run test -- --testPathPattern=integration --maxWorkers=50%

ui-test-contract:
	cd ui && npm run test -- --testPathPattern=contract --maxWorkers=50%

ui-test-e2e:
	cd ui && npm run test:e2e

ui-lint:
	cd ui && npm run lint

ui-typecheck:
	cd ui && npm run typecheck

# Quick pipeline (skip E2E for faster feedback during development)
test-pipeline-quick: check-all test-unit test-integration
	@echo "✅ Quick pipeline completed! (E2E tests skipped)"

# CI pipeline (for automated testing) - includes coverage and all tests
test-pipeline-ci: install check-all test-coverage ui-test-parallel ui-build ui-test-e2e
	@echo "✅ CI pipeline completed successfully!"

# Sequential testing pipeline (build first, then tests from simple to complex)
# Useful for development to catch issues early and understand test level failures
test-sequential: build-all test-unit ui-test-parallel test-contract test-integration test-performance ui-test-e2e
	@echo "✅ Sequential testing pipeline completed!"
	@echo "   Build → Unit → UI Unit+Contract (parallel) → Contract → Integration → Performance → E2E"
	@echo "   Note: UI Integration tests require Electron environment (currently skipped)"

# Sync dependencies
sync:
	./scripts/uv_sync.sh

# Help
help:
	@echo "Available targets:"
	@echo "  Setup & Dependencies:"
	@echo "    install         - Install dependencies using UV"
	@echo "    sync           - Sync dependencies using UV sync script"
	@echo ""
	@echo "  Code Quality:"
	@echo "    format         - Format code with ruff"
	@echo "    lint           - Lint code with ruff"
	@echo "    typecheck      - Run mypy type checking"
	@echo "    typecheck-fix  - Run mypy with suggestions for quick fixes"
	@echo "    check-all      - Run all quality checks (format, lint, typecheck)"
	@echo ""
	@echo "  Testing:"
	@echo "    test           - Run all tests (parallel)"
	@echo "    test-unit      - Run unit tests only (parallel)"
	@echo "    test-contract  - Run contract tests only (parallel)"
	@echo "    test-integration - Run integration tests only (parallel)"
	@echo "    test-performance - Run performance tests only (parallel)"
	@echo "    test-coverage  - Run tests with coverage report (parallel)"
	@echo "    test-verbose   - Run all tests with verbose output for debugging"
	@echo "    test-pipeline-quick - Run quick pipeline (quality + unit + integration, skip E2E) - for development"
	@echo "    test-pipeline-ci - Run CI pipeline (install + quality + coverage + UI unit+contract + UI build + E2E)"
	@echo "    test-sequential - Run sequential testing pipeline (build → unit → UI → contract → integration → performance → E2E) - for development debugging"
	@echo ""
	@echo "  UI Development:"
	@echo "    ui-build       - Build UI application"
	@echo "    ui-test        - Run all UI tests (unit + contract + integration)"
	@echo "    ui-test-parallel - Run UI unit and contract tests in parallel"
	@echo "    ui-test-contract - Run UI contract tests"
	@echo "    ui-test-integration - Run UI integration tests"
	@echo "    ui-test-e2e    - Run UI E2E tests"
	@echo "    ui-lint        - Lint UI code"
	@echo "    ui-typecheck   - Type check UI code"
	@echo ""
	@echo "  Development:"
	@echo "    run-example    - Run minimal example"
	@echo "    profile        - Run performance profiling"
	@echo ""
	@echo "  Cleanup:"
	@echo "    clean          - Remove build artifacts and cache files"
	@echo ""
	@echo "  Build & Deploy:"
	@echo "    build          - Build the package"
