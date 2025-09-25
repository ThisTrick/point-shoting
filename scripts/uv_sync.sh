#!/bin/bash
# UV sync wrapper script
# Synchronizes dependencies and exports requirements.txt for tooling compatibility

set -e

echo "Syncing dependencies with uv..."
uv sync

echo "Exporting requirements.txt..."
uv export --format requirements-txt --output-file requirements.txt

echo "Dependencies synchronized successfully!"
echo "Run 'source .venv/bin/activate' (Linux/macOS) or '.venv\\Scripts\\activate' (Windows) to activate the environment"
