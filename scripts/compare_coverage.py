#!/usr/bin/env python3
"""
Coverage Comparison Script

Compares current coverage against baseline and reports differences.
Exits with code 1 if coverage decreased by more than 2%.
"""

import json
import sys
from pathlib import Path


def load_coverage_data(file_path: Path) -> dict:
    """Load coverage data from JSON file."""
    try:
        with open(file_path) as f:
            data = json.load(f)

        # Handle different coverage JSON formats
        if "totals" in data:
            # Current coverage format (pytest-cov output)
            return {
                "percent_covered": data["totals"]["percent_covered"],
                "covered_lines": data["totals"]["covered_lines"],
                "num_statements": data["totals"]["num_statements"],
            }
        elif "percent_covered" in data:
            # Baseline format
            return data
        else:
            raise ValueError(f"Unknown coverage data format in {file_path}")

    except FileNotFoundError:
        print(f"Error: Coverage file not found: {file_path}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in coverage file {file_path}: {e}")
        sys.exit(1)
    except KeyError as e:
        print(f"Error: Missing required key in coverage file {file_path}: {e}")
        sys.exit(1)


def calculate_coverage_diff(current: dict, baseline: dict) -> dict:
    """Calculate coverage differences between current and baseline."""
    current_pct = current.get("percent_covered", 0.0)
    baseline_pct = baseline.get("percent_covered", 0.0)

    percentage_change = current_pct - baseline_pct

    # Calculate absolute changes
    current_lines = current.get("covered_lines", 0)
    baseline_lines = baseline.get("covered_lines", 0)
    lines_change = current_lines - baseline_lines

    current_statements = current.get("num_statements", 0)
    baseline_statements = baseline.get("num_statements", 0)
    statements_change = current_statements - baseline_statements

    return {
        "current_coverage": current_pct,
        "baseline_coverage": baseline_pct,
        "percentage_change": percentage_change,
        "lines_change": lines_change,
        "statements_change": statements_change,
        "current_lines": current_lines,
        "baseline_lines": baseline_lines,
        "current_statements": current_statements,
        "baseline_statements": baseline_statements,
    }


def print_coverage_report(diff_data: dict) -> None:
    """Print formatted coverage comparison report."""
    print("=== Coverage Comparison Report ===")
    print(".1f")
    print(".1f")
    print(".1f")

    if diff_data["percentage_change"] >= 0:
        print(".1f")
    else:
        print(".1f")

    print(
        f"Lines covered: {diff_data['current_lines']} (was {diff_data['baseline_lines']})"
    )
    print(
        f"Total statements: {diff_data['current_statements']} (was {diff_data['baseline_statements']})"
    )

    # Determine status
    if diff_data["percentage_change"] < -2.0:
        print("\n❌ COVERAGE REGRESSION: Coverage decreased by more than 2%")
        print("   This indicates a significant loss of test coverage.")
    elif diff_data["percentage_change"] < 0:
        print("\n⚠️  COVERAGE DECREASE: Coverage decreased slightly")
        print("   Consider adding tests to maintain coverage levels.")
    else:
        print("\n✅ COVERAGE IMPROVED or MAINTAINED")


def main() -> int:
    """Main function."""
    # File paths
    baseline_file = Path("test-results/baselines/coverage-baseline.json")
    current_file = Path("coverage.json")

    # Load coverage data
    print(f"Loading baseline coverage from: {baseline_file}")
    baseline_data = load_coverage_data(baseline_file)

    print(f"Loading current coverage from: {current_file}")
    current_data = load_coverage_data(current_file)

    # Calculate differences
    diff_data = calculate_coverage_diff(current_data, baseline_data)

    # Print report
    print()
    print_coverage_report(diff_data)

    # Exit with appropriate code
    if diff_data["percentage_change"] < -2.0:
        print("\nExiting with code 1 due to significant coverage regression.")
        return 1
    else:
        print("\nCoverage check passed.")
        return 0


if __name__ == "__main__":
    sys.exit(main())
