#!/usr/bin/env python3
"""
Test execution reports and dashboards generator.

This script generates comprehensive test reports with trends, flaky test detection,
and CI integration dashboards.
"""

import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Any


class TestReportGenerator:
    """Generates comprehensive test execution reports and dashboards."""

    def __init__(self, base_dir: Path):
        self.base_dir = base_dir
        self.reports_dir = base_dir / "test-results" / "reports"
        self.reports_dir.mkdir(parents=True, exist_ok=True)

    def generate_comprehensive_report(self) -> dict[str, Any]:
        """Generate a comprehensive test report with all metrics."""
        report = {
            "timestamp": datetime.now().isoformat(),
            "summary": {},
            "test_results": {},
            "coverage": {},
            "performance": {},
            "flaky_tests": {},
            "trends": {},
            "recommendations": [],
        }

        # Collect all test results
        report["test_results"] = self._collect_test_results()
        report["coverage"] = self._collect_coverage_data()
        report["performance"] = self._collect_performance_data()
        report["flaky_tests"] = self._collect_flaky_test_data()
        report["trends"] = self._analyze_trends()

        # Generate summary
        report["summary"] = self._generate_summary(report)
        report["recommendations"] = self._generate_recommendations(report)

        return report

    def _collect_test_results(self) -> dict[str, Any]:
        """Collect test results from various test types."""
        results = {}

        # Run pytest with JSON output to get detailed results
        test_types = {
            "unit": ["tests/unit/"],
            "integration": ["tests/integration/"],
            "contract": ["tests/contract/"],
            "e2e": ["tests/e2e/"],
        }

        for test_type, paths in test_types.items():
            try:
                # Run tests with JSON report
                cmd = [
                    sys.executable,
                    "-m",
                    "pytest",
                    "--json-report",
                    "--json-report-file",
                    f"/tmp/{test_type}-results.json",
                ] + paths
                result = subprocess.run(
                    cmd, capture_output=True, text=True, cwd=self.base_dir
                )

                json_file = Path(f"/tmp/{test_type}-results.json")
                if json_file.exists():
                    with open(json_file) as f:
                        results[test_type] = json.load(f)
                    json_file.unlink()  # Clean up
                else:
                    results[test_type] = {
                        "exitcode": result.returncode,
                        "stdout": result.stdout,
                        "stderr": result.stderr,
                    }
            except Exception as e:
                results[test_type] = {"error": str(e)}

        return results

    def _collect_coverage_data(self) -> dict[str, Any]:
        """Collect coverage data."""
        try:
            # Run coverage
            cmd = [
                sys.executable,
                "-m",
                "pytest",
                "--cov=src/point_shoting",
                "--cov-report=json",
                "tests/",
            ]
            subprocess.run(cmd, capture_output=True, text=True, cwd=self.base_dir)

            coverage_file = self.base_dir / "coverage.json"
            if coverage_file.exists():
                with open(coverage_file) as f:
                    data = json.load(f)
                coverage_file.unlink()  # Clean up
                return data.get("totals", {})
            else:
                return {"error": "Coverage file not generated"}
        except Exception as e:
            return {"error": str(e)}

    def _collect_performance_data(self) -> dict[str, Any]:
        """Collect performance benchmark data."""
        performance_data = {}

        # Read performance test results
        perf_dir = self.base_dir / "test-results" / "performance"
        if perf_dir.exists():
            for file in perf_dir.glob("*.json"):
                try:
                    with open(file) as f:
                        performance_data[file.stem] = json.load(f)
                except Exception as e:
                    performance_data[file.stem] = {"error": str(e)}

        return performance_data

    def _collect_flaky_test_data(self) -> dict[str, Any]:
        """Collect flaky test detection results."""
        flaky_data = {}

        flaky_dir = self.base_dir / "test-results" / "flaky-detection"
        if flaky_dir.exists():
            for file in flaky_dir.glob("*.json"):
                try:
                    with open(file) as f:
                        flaky_data[file.stem] = json.load(f)
                except Exception as e:
                    flaky_data[file.stem] = {"error": str(e)}

        return flaky_data

    def _analyze_trends(self) -> dict[str, Any]:
        """Analyze trends from historical data."""
        trends = {
            "coverage_trend": [],
            "performance_trend": [],
            "test_pass_rate_trend": [],
        }

        # This would analyze historical data from CI artifacts
        # For now, return placeholder
        return trends

    def _generate_summary(self, report: dict[str, Any]) -> dict[str, Any]:
        """Generate a summary of all test results."""
        summary = {
            "total_tests": 0,
            "passed_tests": 0,
            "failed_tests": 0,
            "skipped_tests": 0,
            "coverage_percentage": 0,
            "performance_score": 0,
            "flaky_tests_count": 0,
            "overall_status": "unknown",
        }

        # Aggregate test results
        for _test_type, results in report["test_results"].items():
            if "tests" in results:
                for test in results["tests"]:
                    summary["total_tests"] += 1
                    if test.get("outcome") == "passed":
                        summary["passed_tests"] += 1
                    elif test.get("outcome") == "failed":
                        summary["failed_tests"] += 1
                    elif test.get("outcome") == "skipped":
                        summary["skipped_tests"] += 1

        # Coverage
        if "percent_covered" in report["coverage"]:
            summary["coverage_percentage"] = report["coverage"]["percent_covered"]

        # Flaky tests
        for _flaky_type, flaky_results in report["flaky_tests"].items():
            if "total_flaky_tests" in flaky_results:
                summary["flaky_tests_count"] += flaky_results["total_flaky_tests"]

        # Overall status
        if summary["failed_tests"] > 0:
            summary["overall_status"] = "failed"
        elif summary["flaky_tests_count"] > 0:
            summary["overall_status"] = "warning"
        else:
            summary["overall_status"] = "passed"

        return summary

    def _generate_recommendations(self, report: dict[str, Any]) -> list[str]:
        """Generate recommendations based on test results."""
        recommendations = []

        summary = report["summary"]

        if summary["failed_tests"] > 0:
            recommendations.append(f"Fix {summary['failed_tests']} failing tests")

        if summary["coverage_percentage"] < 80:
            recommendations.append(
                f"Improve code coverage (currently {summary['coverage_percentage']}%)"
            )

        if summary["flaky_tests_count"] > 0:
            recommendations.append(
                f"Investigate {summary['flaky_tests_count']} flaky tests"
            )

        if not recommendations:
            recommendations.append(
                "All tests passing - consider adding more test coverage"
            )

        return recommendations

    def generate_html_dashboard(self, report: dict[str, Any]) -> str:
        """Generate an HTML dashboard from the report."""
        html = f"""
<!DOCTYPE html>
<html>
<head>
    <title>Test Execution Dashboard</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; }}
        .summary {{ background: #f0f0f0; padding: 20px; border-radius: 5px; margin-bottom: 20px; }}
        .metric {{ display: inline-block; margin: 10px; text-align: center; }}
        .metric-value {{ font-size: 2em; font-weight: bold; }}
        .status-passed {{ color: green; }}
        .status-failed {{ color: red; }}
        .status-warning {{ color: orange; }}
        .section {{ margin-bottom: 30px; }}
        .recommendations {{ background: #fff3cd; padding: 15px; border-left: 5px solid #ffc107; }}
    </style>
</head>
<body>
    <h1>Test Execution Dashboard</h1>
    <p>Generated on: {report["timestamp"]}</p>

    <div class="summary">
        <h2>Test Summary</h2>
        <div class="metric">
            <div class="metric-value {self._get_status_class(report["summary"]["overall_status"])}">{report["summary"]["overall_status"].upper()}</div>
            <div>Overall Status</div>
        </div>
        <div class="metric">
            <div class="metric-value">{report["summary"]["total_tests"]}</div>
            <div>Total Tests</div>
        </div>
        <div class="metric">
            <div class="metric-value" style="color: green;">{report["summary"]["passed_tests"]}</div>
            <div>Passed</div>
        </div>
        <div class="metric">
            <div class="metric-value" style="color: red;">{report["summary"]["failed_tests"]}</div>
            <div>Failed</div>
        </div>
        <div class="metric">
            <div class="metric-value" style="color: orange;">{report["summary"]["skipped_tests"]}</div>
            <div>Skipped</div>
        </div>
        <div class="metric">
            <div class="metric-value">{report["summary"]["coverage_percentage"]:.1f}%</div>
            <div>Coverage</div>
        </div>
        <div class="metric">
            <div class="metric-value" style="color: orange;">{report["summary"]["flaky_tests_count"]}</div>
            <div>Flaky Tests</div>
        </div>
    </div>

    <div class="recommendations">
        <h3>Recommendations</h3>
        <ul>
"""
        for rec in report["recommendations"]:
            html += f"            <li>{rec}</li>\n"

        html += (
            """
        </ul>
    </div>

    <div class="section">
        <h2>Detailed Test Results</h2>
        <pre>"""
            + json.dumps(report["test_results"], indent=2)
            + """</pre>
    </div>

    <div class="section">
        <h2>Coverage Details</h2>
        <pre>"""
            + json.dumps(report["coverage"], indent=2)
            + """</pre>
    </div>

    <div class="section">
        <h2>Performance Metrics</h2>
        <pre>"""
            + json.dumps(report["performance"], indent=2)
            + """</pre>
    </div>

    <div class="section">
        <h2>Flaky Test Analysis</h2>
        <pre>"""
            + json.dumps(report["flaky_tests"], indent=2)
            + """</pre>
    </div>
</body>
</html>
"""
        )
        return html

    def _get_status_class(self, status: str) -> str:
        """Get CSS class for status."""
        return f"status-{status}"

    def save_report(
        self, report: dict[str, Any], filename: str = "comprehensive-report.json"
    ):
        """Save the report to a file."""
        report_file = self.reports_dir / filename
        with open(report_file, "w") as f:
            json.dump(report, f, indent=2)
        print(f"Report saved to {report_file}")

    def save_html_dashboard(self, html: str, filename: str = "dashboard.html"):
        """Save the HTML dashboard to a file."""
        html_file = self.reports_dir / filename
        with open(html_file, "w") as f:
            f.write(html)
        print(f"HTML dashboard saved to {html_file}")


def main():
    """Main entry point."""
    base_dir = Path(__file__).parent.parent

    generator = TestReportGenerator(base_dir)

    print("Generating comprehensive test report...")
    report = generator.generate_comprehensive_report()

    print("Saving report files...")
    generator.save_report(report)
    html = generator.generate_html_dashboard(report)
    generator.save_html_dashboard(html)

    print("Test reporting complete!")
    print(f"Reports saved to: {generator.reports_dir}")


if __name__ == "__main__":
    main()
