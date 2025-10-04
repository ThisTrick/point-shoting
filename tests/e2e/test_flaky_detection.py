"""
E2E tests for detecting flaky tests through multi-run analysis.

Flaky tests are tests that pass and fail intermittently without code changes.
This module implements detection mechanisms to identify such tests.
"""

import json
import subprocess
import sys
import time
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Any, Tuple

import pytest


@pytest.mark.e2e
@pytest.mark.flaky_detection
class TestFlakyDetection:
    """Tests for detecting flaky tests through repeated execution."""

    def setup_method(self):
        """Setup test environment."""
        self.results_dir = Path("test-results/flaky-detection")
        self.results_dir.mkdir(parents=True, exist_ok=True)

    def test_detect_flaky_unit_tests(self):
        """
        Run unit tests multiple times to detect flaky behavior.

        Executes each unit test 5 times and identifies tests that have
        inconsistent results (both pass and fail in different runs).
        """
        flaky_tests = self._run_multiple_test_runs(
            test_paths=["tests/unit/"],
            num_runs=5,
            test_type="unit"
        )

        # Save results for analysis
        self._save_flaky_results(flaky_tests, "unit-tests-flaky-results.json")

        # Assert no flaky tests found (or log them for investigation)
        if flaky_tests:
            flaky_list = [f"{test['name']}: {test['pass_count']}/{test['total_runs']} passes"
                         for test in flaky_tests]
            pytest.fail(
                f"Flaky unit tests detected:\n" + "\n".join(flaky_list) +
                f"\n\nTotal flaky tests: {len(flaky_tests)}"
            )
        else:
            print("No flaky unit tests detected")

    def test_detect_flaky_integration_tests(self):
        """
        Run integration tests multiple times to detect flaky behavior.

        Executes each integration test 3 times (fewer runs due to longer execution).
        """
        flaky_tests = self._run_multiple_test_runs(
            test_paths=["tests/integration/"],
            num_runs=3,
            test_type="integration"
        )

        # Save results for analysis
        self._save_flaky_results(flaky_tests, "integration-tests-flaky-results.json")

        # Assert no flaky tests found
        if flaky_tests:
            flaky_list = [f"{test['name']}: {test['pass_count']}/{test['total_runs']} passes"
                         for test in flaky_tests]
            pytest.fail(
                f"Flaky integration tests detected:\n" + "\n".join(flaky_list) +
                f"\n\nTotal flaky tests: {len(flaky_tests)}"
            )
        else:
            print("No flaky integration tests detected")

    def test_detect_flaky_contract_tests(self):
        """
        Run contract tests multiple times to detect flaky behavior.

        Contract tests should be deterministic, so any flakiness indicates issues.
        """
        flaky_tests = self._run_multiple_test_runs(
            test_paths=["tests/contract/"],
            num_runs=5,
            test_type="contract"
        )

        # Save results for analysis
        self._save_flaky_results(flaky_tests, "contract-tests-flaky-results.json")

        # Contract tests should NEVER be flaky
        assert not flaky_tests, (
            f"Contract tests must be deterministic. Found {len(flaky_tests)} flaky contract tests: "
            f"{[test['name'] for test in flaky_tests]}"
        )

    def test_flaky_detection_methodology(self):
        """
        Test that the flaky detection methodology itself works correctly.

        This is a meta-test to ensure our detection logic is sound.
        """
        # Create mock test results with known flaky patterns
        mock_results = [
            # Consistent passing test
            {"test": "test_consistent_pass", "result": True},
            {"test": "test_consistent_pass", "result": True},
            {"test": "test_consistent_pass", "result": True},
            {"test": "test_consistent_pass", "result": True},
            {"test": "test_consistent_pass", "result": True},
            # Consistent failing test
            {"test": "test_consistent_fail", "result": False},
            {"test": "test_consistent_fail", "result": False},
            {"test": "test_consistent_fail", "result": False},
            {"test": "test_consistent_fail", "result": False},
            {"test": "test_consistent_fail", "result": False},
            # Flaky test (mix of pass/fail)
            {"test": "test_flaky", "result": True},
            {"test": "test_flaky", "result": False},
            {"test": "test_flaky", "result": True},
            {"test": "test_flaky", "result": False},
            {"test": "test_flaky", "result": True},
            # Another flaky test
            {"test": "test_very_flaky", "result": True},
            {"test": "test_very_flaky", "result": True},
            {"test": "test_very_flaky", "result": False},
            {"test": "test_very_flaky", "result": False},
            {"test": "test_very_flaky", "result": False},
        ]

        flaky_tests = self._analyze_flaky_results(mock_results)

        # Should detect exactly 2 flaky tests
        assert len(flaky_tests) == 2
        flaky_names = {test['name'] for test in flaky_tests}
        assert flaky_names == {"test_flaky", "test_very_flaky"}

        # Verify flaky test details
        for test in flaky_tests:
            assert test['total_runs'] == 5
            assert 1 <= test['pass_count'] <= 4  # Not all pass, not all fail
            assert test['fail_count'] > 0
            assert test['pass_count'] > 0

    def _run_multiple_test_runs(self, test_paths: List[str], num_runs: int, test_type: str) -> List[Dict[str, Any]]:
        """
        Run tests multiple times and collect results for flaky analysis.

        Args:
            test_paths: List of test directory paths to run
            num_runs: Number of times to run each test
            test_type: Type of tests (unit, integration, contract)

        Returns:
            List of tests that showed flaky behavior
        """
        all_results = []

        for run_num in range(num_runs):
            print(f"Running {test_type} tests - Run {run_num + 1}/{num_runs}")

            # Run tests and collect individual test results
            run_results = self._run_single_test_run(test_paths, run_num)
            all_results.extend(run_results)

            # Small delay between runs to avoid timing issues
            time.sleep(0.5)

        # Analyze results for flaky tests
        return self._analyze_flaky_results(all_results)

    def _run_single_test_run(self, test_paths: List[str], run_num: int) -> List[Dict[str, Any]]:
        """
        Run a single test execution and parse individual test results.

        Returns list of dicts with test name and pass/fail status.
        """
        # Run pytest with JSON output for detailed results
        cmd = [
            sys.executable, "-m", "pytest",
            "--tb=no",  # No tracebacks for cleaner output
            "--json-report",  # Generate JSON report
            "--json-report-file", f"/tmp/test-results-run-{run_num}.json"
        ] + test_paths

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent.parent.parent
        )

        # Load JSON results
        json_file = Path(f"/tmp/test-results-run-{run_num}.json")
        if json_file.exists():
            try:
                with open(json_file) as f:
                    data = json.load(f)

                test_results = []
                for test in data.get("tests", []):
                    test_results.append({
                        "test": f"{test['nodeid']}",
                        "result": test["outcome"] == "passed",
                        "run": run_num
                    })

                # Clean up
                json_file.unlink(missing_ok=True)
                return test_results

            except (json.JSONDecodeError, IOError):
                print(f"Warning: Could not parse JSON results for run {run_num}")

        # Fallback: parse from stdout if JSON fails
        return self._parse_results_from_output(result.stdout, run_num)

    def _parse_results_from_output(self, output: str, run_num: int) -> List[Dict[str, Any]]:
        """
        Fallback parser for test results from pytest stdout.

        This is less reliable than JSON parsing but provides a backup.
        """
        # This is a simplified parser - in practice, you'd want more robust parsing
        lines = output.split('\n')
        results = []

        for line in lines:
            if line.startswith('tests/') and ('PASSED' in line or 'FAILED' in line):
                # Parse lines like: tests/unit/test_example.py::TestClass::test_method PASSED
                parts = line.split()
                if len(parts) >= 2:
                    test_name = parts[0]
                    outcome = parts[1]
                    results.append({
                        "test": test_name,
                        "result": outcome == "PASSED",
                        "run": run_num
                    })

        return results

    def _analyze_flaky_results(self, all_results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Analyze test results across multiple runs to identify flaky tests.

        A test is considered flaky if it both passes and fails in different runs.
        """
        # Group results by test name
        test_runs = defaultdict(list)

        for result in all_results:
            test_name = result["test"]
            test_runs[test_name].append(result["result"])

        # Find flaky tests
        flaky_tests = []

        for test_name, results in test_runs.items():
            if len(results) < 2:
                continue  # Need at least 2 runs to detect flakiness

            pass_count = sum(results)
            fail_count = len(results) - pass_count

            # Test is flaky if it has both passes and fails
            if pass_count > 0 and fail_count > 0:
                flaky_tests.append({
                    "name": test_name,
                    "total_runs": len(results),
                    "pass_count": pass_count,
                    "fail_count": fail_count,
                    "pass_rate": pass_count / len(results),
                    "results": results
                })

        # Sort by flakiness (lower pass rate = more flaky)
        flaky_tests.sort(key=lambda x: x["pass_rate"])

        return flaky_tests

    def _save_flaky_results(self, flaky_tests: List[Dict[str, Any]], filename: str):
        """Save flaky test results to file for later analysis."""
        results_file = self.results_dir / filename

        data = {
            "timestamp": time.time(),
            "total_flaky_tests": len(flaky_tests),
            "flaky_tests": flaky_tests
        }

        try:
            with open(results_file, 'w') as f:
                json.dump(data, f, indent=2)
            print(f"Saved flaky test results to {results_file}")
        except IOError as e:
            print(f"Warning: Could not save flaky results: {e}")
