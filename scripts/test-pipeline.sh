#!/bin/bash
# Test Pipeline Script
# Runs comprehensive testing pipeline for Point Shooting project

set -e  # Exit on any error

echo "🚀 Starting Point Shooting Test Pipeline"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "Makefile" ] || [ ! -d "ui" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Step 1: Code Quality Checks
print_status "Step 1: Running code quality checks..."
if make check-all; then
    print_success "Code quality checks passed"
else
    print_error "Code quality checks failed"
    exit 1
fi

# Step 2: Unit Tests
print_status "Step 2: Running unit tests..."
if make test-unit; then
    print_success "Unit tests passed"
else
    print_error "Unit tests failed"
    exit 1
fi

# Step 3: Integration Tests
print_status "Step 3: Running integration tests..."
if make test-integration; then
    print_success "Integration tests passed"
else
    print_error "Integration tests failed"
    exit 1
fi

# Step 4: UI Build
print_status "Step 4: Building UI application..."
if make ui-build; then
    print_success "UI build completed"
else
    print_error "UI build failed"
    exit 1
fi

# Step 5: E2E Tests
print_status "Step 5: Running E2E tests..."
if make ui-test-e2e; then
    print_success "E2E tests passed"
else
    print_error "E2E tests failed"
    exit 1
fi

# Success
echo ""
print_success "🎉 All tests passed! Pipeline completed successfully."
echo ""
print_status "Summary:"
echo "  ✅ Code quality checks"
echo "  ✅ Unit tests"
echo "  ✅ Integration tests"
echo "  ✅ UI build"
echo "  ✅ E2E tests"
echo ""
print_status "You can now confidently commit your changes!"
