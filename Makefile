.PHONY: install format lint typecheck typecheck-fix check-all test test-unit test-contract test-integration test-performance test-coverage clean run-example profile docs build sync help

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

lint-fix:
	uv run ruff check --fix .
	uv run ruff format .

# Type checking
typecheck:
	uv run mypy src/point_shoting --show-error-codes

typecheck-strict:
	uv run mypy src/point_shoting --strict --show-error-codes

# All quality checks
check-all: lint typecheck
	@echo "All code quality checks passed!"

# Testing targets
test:
	uv run pytest

test-watch:
	uv run pytest --tb=short -q -x --disable-warnings -f

test-contract:
	uv run pytest tests/contract/ -m contract

test-integration:
	uv run pytest tests/integration/ -m integration

test-unit:
	uv run pytest tests/unit/ -m unit

test-performance:
	uv run pytest tests/performance/ -m performance

# Coverage
test-coverage:
	uv run pytest --cov=src/point_shoting --cov-report=html --cov-report=term

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

# Documentation
docs:
	@echo "Documentation targets not yet implemented"

# Build
build:
	uv build

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
	@echo "    test           - Run all tests"
	@echo "    test-unit      - Run unit tests only"
	@echo "    test-contract  - Run contract tests only"
	@echo "    test-integration - Run integration tests only"
	@echo "    test-performance - Run performance tests only"
	@echo "    test-coverage  - Run tests with coverage report"
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
