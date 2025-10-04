#!/usr/bin/env python3
"""
Coverage Badge Generator

Generates SVG coverage badges for CI/CD pipelines and documentation.
Reads coverage data from coverage.json and creates a badge showing the coverage percentage.
"""

import json
import sys
from pathlib import Path
from typing import Optional


def load_coverage_percentage(coverage_file: Path) -> float:
    """Load coverage percentage from coverage JSON file."""
    try:
        with open(coverage_file, 'r') as f:
            data = json.load(f)

        # Handle pytest-cov format with totals section
        if 'totals' in data:
            return data['totals']['percent_covered']
        elif 'percent_covered' in data:
            return data['percent_covered']
        else:
            raise ValueError(f"Cannot find coverage percentage in {coverage_file}")

    except FileNotFoundError:
        print(f"Error: Coverage file not found: {coverage_file}", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in coverage file {coverage_file}: {e}", file=sys.stderr)
        sys.exit(1)
    except KeyError as e:
        print(f"Error: Missing required key in coverage file {coverage_file}: {e}", file=sys.stderr)
        sys.exit(1)


def get_coverage_color(percentage: float) -> str:
    """Get color for coverage badge based on percentage."""
    if percentage >= 90:
        return "#4c1"  # Bright green
    elif percentage >= 80:
        return "#97ca00"  # Green
    elif percentage >= 70:
        return "#dfb317"  # Yellow
    elif percentage >= 60:
        return "#fe7d37"  # Orange
    else:
        return "#e05d44"  # Red


def generate_coverage_badge(coverage_percentage: float, output_file: Optional[Path] = None) -> str:
    """
    Generate SVG coverage badge.

    Args:
        coverage_percentage: Coverage percentage (0-100)
        output_file: Optional file path to save badge to

    Returns:
        SVG content as string
    """
    color = get_coverage_color(coverage_percentage)
    percentage_text = f"{coverage_percentage:.1f}"

    # Calculate widths based on text length
    label_width = 58  # "coverage" width
    value_width = max(30, len(percentage_text) * 8)  # Dynamic width based on percentage text
    total_width = label_width + value_width

    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{total_width}" height="20" role="img" aria-labelledby="coverage-title">
  <title id="coverage-title">Coverage: {percentage_text}%</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="{total_width}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="{label_width}" height="20" fill="#555"/>
    <rect x="{label_width}" width="{value_width}" height="20" fill="{color}"/>
    <rect width="{total_width}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="110">
    <text aria-hidden="true" x="{label_width // 2 + 1}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="{label_width - 2}">coverage</text>
    <text aria-hidden="true" x="{label_width // 2 + 1}" y="140" transform="scale(.1)" textLength="{label_width - 2}">coverage</text>
    <text aria-hidden="true" x="{label_width + value_width // 2}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="{value_width - 2}">{percentage_text}%</text>
    <text aria-hidden="true" x="{label_width + value_width // 2}" y="140" transform="scale(.1)" textLength="{value_width - 2}">{percentage_text}%</text>
  </g>
</svg>'''

    if output_file:
        output_file.parent.mkdir(parents=True, exist_ok=True)
        with open(output_file, 'w') as f:
            f.write(svg)
        print(f"Coverage badge saved to: {output_file}")

    return svg


def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(description="Generate coverage badge from coverage data")
    parser.add_argument(
        "--coverage-file",
        type=Path,
        default=Path("coverage.json"),
        help="Path to coverage JSON file (default: coverage.json)"
    )
    parser.add_argument(
        "--output",
        "-o",
        type=Path,
        help="Output file path for SVG badge (default: print to stdout)"
    )
    parser.add_argument(
        "--percentage",
        type=float,
        help="Override coverage percentage instead of reading from file"
    )

    args = parser.parse_args()

    # Get coverage percentage
    if args.percentage is not None:
        coverage_percentage = args.percentage
    else:
        coverage_percentage = load_coverage_percentage(args.coverage_file)

    # Validate percentage
    if not (0 <= coverage_percentage <= 100):
        print(f"Error: Invalid coverage percentage: {coverage_percentage}. Must be between 0 and 100.", file=sys.stderr)
        sys.exit(1)

    # Generate badge
    svg_content = generate_coverage_badge(coverage_percentage, args.output)

    # Print to stdout if no output file specified
    if not args.output:
        print(svg_content)


if __name__ == "__main__":
    main()
