"""
Contract tests for CoverageReporter interface.

These tests validate that the CoverageReporter service adheres to its
contract specification without requiring full implementation.
"""

import pytest
from typing import List
from dataclasses import dataclass


# Contract data structures (from data-model.md)
@dataclass
class FileCoverage:
    file_path: str
    statements: int
    covered: int
    missing_lines: List[int]
    percentage: float


@dataclass
class CoverageReport:
    report_id: str
    language: str  # 'python' or 'typescript'
    total_statements: int
    covered_statements: int
    total_branches: int
    covered_branches: int
    coverage_percentage: float
    file_coverage: List[FileCoverage]
    threshold: float = 80.0
    meets_threshold: bool = False

    def __post_init__(self):
        self.meets_threshold = self.coverage_percentage >= self.threshold


@dataclass
class CoverageDiff:
    percentage_change: float
    new_uncovered_lines: List[str]
    newly_covered_lines: List[str]
    regression: bool


class CoverageReporter:
    """
    Stub implementation for contract testing.
    In real implementation, this would measure actual code coverage.
    """

    def measure_python_coverage(self, test_suite: str = "all") -> CoverageReport:
        """Stub: Would measure Python code coverage."""
        return CoverageReport(
            report_id="python-cov-001",
            language="python",
            total_statements=2000,
            covered_statements=1600,
            total_branches=400,
            covered_branches=300,
            coverage_percentage=80.0,
            file_coverage=[],
            threshold=80.0
        )

    def measure_typescript_coverage(self) -> CoverageReport:
        """Stub: Would measure TypeScript code coverage."""
        return CoverageReport(
            report_id="typescript-cov-001",
            language="typescript",
            total_statements=1500,
            covered_statements=1200,
            total_branches=300,
            covered_branches=240,
            coverage_percentage=80.0,
            file_coverage=[],
            threshold=80.0
        )

    def generate_coverage_badge(self, report: CoverageReport) -> str:
        """Stub: Would generate SVG coverage badge."""
        return f"/docs/badges/coverage-{report.language}.svg"

    def compare_coverage(self, baseline: CoverageReport, current: CoverageReport) -> CoverageDiff:
        """Stub: Would compare coverage reports."""
        change = current.coverage_percentage - baseline.coverage_percentage
        return CoverageDiff(
            percentage_change=change,
            new_uncovered_lines=[],
            newly_covered_lines=[],
            regression=change < 0
        )


@pytest.mark.contract
class TestCoverageReporterContract:
    """Contract tests for CoverageReporter interface."""

    def test_measure_python_coverage_interface(self):
        """Test that measure_python_coverage returns correct CoverageReport."""
        reporter = CoverageReporter()

        # Test default test_suite
        report = reporter.measure_python_coverage()
        assert isinstance(report, CoverageReport)
        assert report.language == "python"

        # Test specific test_suite
        report_unit = reporter.measure_python_coverage("unit")
        assert isinstance(report_unit, CoverageReport)

    def test_measure_typescript_coverage_interface(self):
        """Test that measure_typescript_coverage returns correct CoverageReport."""
        reporter = CoverageReporter()
        report = reporter.measure_typescript_coverage()

        assert isinstance(report, CoverageReport)
        assert report.language == "typescript"

    def test_generate_coverage_badge_interface(self):
        """Test that generate_coverage_badge returns badge path."""
        reporter = CoverageReporter()
        report = CoverageReport(
            report_id="test-001",
            language="python",
            total_statements=100,
            covered_statements=80,
            total_branches=20,
            covered_branches=15,
            coverage_percentage=80.0,
            file_coverage=[]
        )

        badge_path = reporter.generate_coverage_badge(report)

        assert isinstance(badge_path, str)
        assert "coverage" in badge_path
        assert badge_path.endswith(".svg")

    def test_compare_coverage_interface(self):
        """Test that compare_coverage returns correct CoverageDiff."""
        reporter = CoverageReporter()

        baseline = CoverageReport(
            report_id="baseline",
            language="python",
            total_statements=1000,
            covered_statements=750,
            total_branches=200,
            covered_branches=150,
            coverage_percentage=75.0,
            file_coverage=[]
        )

        current = CoverageReport(
            report_id="current",
            language="python",
            total_statements=1000,
            covered_statements=800,
            total_branches=200,
            covered_branches=160,
            coverage_percentage=80.0,
            file_coverage=[]
        )

        diff = reporter.compare_coverage(baseline, current)

        assert isinstance(diff, CoverageDiff)
        assert isinstance(diff.percentage_change, float)
        assert isinstance(diff.new_uncovered_lines, list)
        assert isinstance(diff.newly_covered_lines, list)
        assert isinstance(diff.regression, bool)

    def test_coverage_report_structure(self):
        """Test CoverageReport dataclass structure and invariants."""
        report = CoverageReport(
            report_id="test-report-001",
            language="python",
            total_statements=1000,
            covered_statements=800,
            total_branches=200,
            covered_branches=160,
            coverage_percentage=80.0,
            file_coverage=[],
            threshold=80.0
        )

        assert report.report_id == "test-report-001"
        assert report.language == "python"
        assert report.total_statements == 1000
        assert report.covered_statements == 800
        assert report.total_branches == 200
        assert report.covered_branches == 160
        assert report.coverage_percentage == 80.0
        assert report.file_coverage == []
        assert report.threshold == 80.0
        assert report.meets_threshold is True  # 80.0 >= 80.0

        # Test threshold not met
        failing_report = CoverageReport(
            report_id="failing-report",
            language="python",
            total_statements=1000,
            covered_statements=700,
            total_branches=200,
            covered_branches=140,
            coverage_percentage=70.0,
            file_coverage=[],
            threshold=80.0
        )
        assert failing_report.meets_threshold is False  # 70.0 < 80.0

    def test_file_coverage_structure(self):
        """Test FileCoverage dataclass structure."""
        file_cov = FileCoverage(
            file_path="src/point_shoting/engine.py",
            statements=100,
            covered=85,
            missing_lines=[15, 23, 67],
            percentage=85.0
        )

        assert file_cov.file_path == "src/point_shoting/engine.py"
        assert file_cov.statements == 100
        assert file_cov.covered == 85
        assert file_cov.missing_lines == [15, 23, 67]
        assert file_cov.percentage == 85.0

    def test_coverage_diff_structure(self):
        """Test CoverageDiff dataclass structure."""
        diff = CoverageDiff(
            percentage_change=5.2,
            new_uncovered_lines=["src/new_file.py:10"],
            newly_covered_lines=["src/engine.py:45"],
            regression=False
        )

        assert diff.percentage_change == 5.2
        assert diff.new_uncovered_lines == ["src/new_file.py:10"]
        assert diff.newly_covered_lines == ["src/engine.py:45"]
        assert diff.regression is False

        # Test regression case
        regression_diff = CoverageDiff(
            percentage_change=-2.1,
            new_uncovered_lines=[],
            newly_covered_lines=[],
            regression=True
        )
        assert regression_diff.regression is True

    def test_coverage_calculations(self):
        """Test coverage percentage calculations."""
        # Test perfect coverage
        perfect = CoverageReport(
            report_id="perfect",
            language="python",
            total_statements=100,
            covered_statements=100,
            total_branches=20,
            covered_branches=20,
            coverage_percentage=100.0,
            file_coverage=[]
        )
        assert perfect.coverage_percentage == 100.0
        assert perfect.meets_threshold is True

        # Test zero coverage
        zero = CoverageReport(
            report_id="zero",
            language="python",
            total_statements=100,
            covered_statements=0,
            total_branches=20,
            covered_branches=0,
            coverage_percentage=0.0,
            file_coverage=[]
        )
        assert zero.coverage_percentage == 0.0
        assert zero.meets_threshold is False
