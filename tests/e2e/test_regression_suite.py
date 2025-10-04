"""
E2E regression tests to detect performance and functionality regressions.

These tests compare current test results against historical baselines
to ensure no degradation in performance or functionality.
"""

import json
import time
import pytest
from pathlib import Path
from typing import Dict, Any, Optional

import subprocess
import sys


@pytest.mark.e2e
@pytest.mark.regression
class TestRegressionSuite:
    """Regression tests to detect performance and functionality degradation."""

    def setup_method(self):
        """Setup test environment."""
        self.baselines_dir = Path("test-results/baselines")
        self.baselines_dir.mkdir(parents=True, exist_ok=True)

    def test_no_performance_regression(self):
        """
        Test that current performance metrics don't regress from baseline.

        Runs a quick performance test and compares against stored baseline.
        """
        # Run a quick performance measurement
        current_metrics = self._measure_current_performance()

        # Load baseline metrics
        baseline_metrics = self._load_baseline_metrics("performance-baseline.json")

        if baseline_metrics:
            # Compare against baseline
            self._compare_performance_metrics(current_metrics, baseline_metrics)
        else:
            # No baseline exists, save current as baseline
            print("No performance baseline found, saving current metrics as baseline")
            self._save_baseline_metrics("performance-baseline.json", current_metrics)

    def test_no_test_regressions(self):
        """
        Test that test pass/fail counts haven't regressed.

        Runs all tests and compares pass rates against baseline.
        """
        # Run all tests and collect results
        current_results = self._run_test_suite()

        # Load baseline test results
        baseline_results = self._load_baseline_metrics("test-results-baseline.json")

        if baseline_results:
            # Compare test results
            self._compare_test_results(current_results, baseline_results)
        else:
            # No baseline exists, save current as baseline
            print("No test results baseline found, saving current results as baseline")
            self._save_baseline_metrics("test-results-baseline.json", current_results)

    def test_no_coverage_regression(self):
        """
        Test that code coverage hasn't decreased from baseline.
        """
        # Run coverage measurement
        current_coverage = self._measure_current_coverage()

        # Load baseline coverage
        baseline_coverage = self._load_baseline_metrics("coverage-baseline.json")

        if baseline_coverage:
            # Compare coverage
            self._compare_coverage_metrics(current_coverage, baseline_coverage)
        else:
            # No baseline exists, save current as baseline
            print("No coverage baseline found, saving current coverage as baseline")
            self._save_baseline_metrics("coverage-baseline.json", current_coverage)

    def _measure_current_performance(self) -> Dict[str, Any]:
        """Measure current performance metrics."""
        # Import here to avoid import errors if engine not available
        try:
            from src.point_shoting.cli.control_interface import ControlInterface
            from src.point_shoting.models.settings import Settings, DensityProfile, SpeedProfile, ColorMode
            from src.point_shoting.services.particle_engine import ParticleEngine
        except ImportError:
            return {"error": "Engine not available"}

        test_image = Path("examples/test_image.png")
        if not test_image.exists():
            return {"error": "Test image not found"}

        settings = Settings(
            density_profile=DensityProfile.MEDIUM,
            speed_profile=SpeedProfile.NORMAL,
            color_mode=ColorMode.STYLIZED,
            hud_enabled=False,
        )

        engine = ParticleEngine()
        control = ControlInterface(engine)

        success = control.start(settings, str(test_image))
        if not success:
            return {"error": "Failed to start animation"}

        # Measure performance over 100 frames
        frame_times = []
        start_time = time.time()

        try:
            for i in range(100):
                frame_start = time.perf_counter()
                engine.step()
                frame_end = time.perf_counter()
                frame_times.append(frame_end - frame_start)

            total_time = time.time() - start_time
            avg_frame_time = sum(frame_times) / len(frame_times)
            avg_fps = 1.0 / avg_frame_time

            return {
                "avg_fps": avg_fps,
                "avg_frame_time": avg_frame_time,
                "total_time": total_time,
                "frame_count": len(frame_times),
                "timestamp": time.time()
            }
        finally:
            control.stop()

    def _run_test_suite(self) -> Dict[str, Any]:
        """Run test suite and collect results."""
        # Run unit and integration tests
        result = subprocess.run(
            [sys.executable, "-m", "pytest", "tests/unit/", "tests/integration/", "--tb=no", "--disable-warnings"],
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent.parent.parent
        )

        # Parse output to extract counts
        output = result.stdout + result.stderr

        # Simple parsing - look for summary line
        lines = output.split('\n')
        summary_line = None
        for line in lines:
            if 'passed' in line and ('failed' in line or 'skipped' in line):
                summary_line = line
                break

        # Also check for lines that just have passed/skipped
        if not summary_line:
            for line in lines:
                if 'passed' in line or 'failed' in line or 'skipped' in line:
                    summary_line = line
                    break

        if summary_line:
            # Parse something like "10 passed, 2 failed, 1 skipped"
            parts = summary_line.replace(',', '').split()
            passed = 0
            failed = 0
            skipped = 0

            for i, part in enumerate(parts):
                if part.isdigit():
                    count = int(part)
                    if i + 1 < len(parts):
                        next_word = parts[i + 1].lower()
                        if 'passed' in next_word:
                            passed = count
                        elif 'failed' in next_word:
                            failed = count
                        elif 'skipped' in next_word or 'skipped' in next_word:
                            skipped = count

            return {
                "passed": passed,
                "failed": failed,
                "skipped": skipped,
                "total": passed + failed + skipped,
                "pass_rate": passed / (passed + failed + skipped) if (passed + failed + skipped) > 0 else 0,
                "timestamp": time.time()
            }
        else:
            return {"error": "Could not parse test results", "output": output}

    def _measure_current_coverage(self) -> Dict[str, Any]:
        """Measure current code coverage."""
        result = subprocess.run(
            [sys.executable, "-m", "pytest", "--cov=src/point_shoting", "--cov-report=json", "tests/unit/", "tests/integration/"],
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent.parent.parent
        )

        coverage_file = Path("coverage.json")
        if coverage_file.exists():
            try:
                with open(coverage_file) as f:
                    coverage_data = json.load(f)

                totals = coverage_data.get("totals", {})
                return {
                    "covered_lines": totals.get("covered_lines", 0),
                    "num_statements": totals.get("num_statements", 0),
                    "percent_covered": totals.get("percent_covered", 0),
                    "missing_lines": totals.get("missing_lines", 0),
                    "excluded_lines": totals.get("excluded_lines", 0),
                    "timestamp": time.time()
                }
            finally:
                # Clean up coverage file
                coverage_file.unlink(missing_ok=True)
        else:
            return {"error": "Coverage file not generated"}

    def _load_baseline_metrics(self, filename: str) -> Optional[Dict[str, Any]]:
        """Load baseline metrics from file."""
        baseline_file = self.baselines_dir / filename
        if baseline_file.exists():
            try:
                with open(baseline_file) as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError):
                print(f"Warning: Could not load baseline file {filename}")
                return None
        return None

    def _save_baseline_metrics(self, filename: str, metrics: Dict[str, Any]):
        """Save metrics as baseline for future comparisons."""
        baseline_file = self.baselines_dir / filename
        try:
            with open(baseline_file, 'w') as f:
                json.dump(metrics, f, indent=2)
            print(f"Saved baseline metrics to {baseline_file}")
        except IOError as e:
            print(f"Warning: Could not save baseline file {filename}: {e}")

    def _compare_performance_metrics(self, current: Dict[str, Any], baseline: Dict[str, Any]):
        """Compare current performance against baseline."""
        if "error" in current:
            pytest.skip(f"Current performance measurement failed: {current['error']}")

        if "error" in baseline:
            pytest.skip(f"Baseline performance measurement invalid: {baseline['error']}")

        # Compare FPS (allow 10% degradation to account for measurement variance)
        current_fps = current.get("avg_fps", 0)
        baseline_fps = baseline.get("avg_fps", 0)

        if baseline_fps > 0:
            degradation = (baseline_fps - current_fps) / baseline_fps
            assert degradation <= 0.10, (
                f"Performance regression: FPS dropped by {degradation:.1%} "
                f"(baseline: {baseline_fps:.1f}, current: {current_fps:.1f})"
            )

        # Compare frame time (allow 10% increase to account for measurement variance)
        current_frame_time = current.get("avg_frame_time", 0)
        baseline_frame_time = baseline.get("avg_frame_time", 0)

        if baseline_frame_time > 0:
            increase = (current_frame_time - baseline_frame_time) / baseline_frame_time
            assert increase <= 0.10, (
                f"Performance regression: Frame time increased by {increase:.1%} "
                f"(baseline: {baseline_frame_time:.4f}s, current: {current_frame_time:.4f}s)"
            )

        print(f"Performance check passed - FPS: {current_fps:.1f}, Frame time: {current_frame_time:.4f}s")

    def _compare_test_results(self, current: Dict[str, Any], baseline: Dict[str, Any]):
        """Compare current test results against baseline."""
        if "error" in current:
            pytest.skip(f"Current test run failed: {current['error']}")

        if "error" in baseline:
            pytest.skip(f"Baseline test results invalid: {baseline['error']}")

        # Check that we don't have more failures than baseline
        current_failed = current.get("failed", 0)
        baseline_failed = baseline.get("failed", 0)

        assert current_failed <= baseline_failed, (
            f"Test regression: Failures increased from {baseline_failed} to {current_failed}"
        )

        # Check pass rate hasn't decreased significantly
        current_pass_rate = current.get("pass_rate", 0)
        baseline_pass_rate = baseline.get("pass_rate", 0)

        if baseline_pass_rate > 0:
            decrease = baseline_pass_rate - current_pass_rate
            assert decrease <= 0.02, (  # Allow 2% decrease
                f"Test regression: Pass rate decreased by {decrease:.1%} "
                f"(baseline: {baseline_pass_rate:.1%}, current: {current_pass_rate:.1%})"
            )

        print(f"Test results check passed - Passed: {current.get('passed', 0)}, Failed: {current_failed}")

    def _compare_coverage_metrics(self, current: Dict[str, Any], baseline: Dict[str, Any]):
        """Compare current coverage against baseline."""
        if "error" in current:
            pytest.skip(f"Current coverage measurement failed: {current['error']}")

        if "error" in baseline:
            pytest.skip(f"Baseline coverage measurement invalid: {baseline['error']}")

        # Check that coverage hasn't decreased
        current_coverage = current.get("percent_covered", 0)
        baseline_coverage = baseline.get("percent_covered", 0)

        assert current_coverage >= baseline_coverage, (
            f"Coverage regression: Coverage decreased from {baseline_coverage:.1f}% to {current_coverage:.1f}%"
        )

        print(f"Coverage check passed - Current coverage: {current_coverage:.1f}%")
