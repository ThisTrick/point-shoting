.PHONY: install lint test test-watch clean dev-install

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