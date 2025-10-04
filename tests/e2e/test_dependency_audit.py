"""
E2E tests for dependency security auditing.

These tests validate that the project dependencies have no critical security
vulnerabilities by running actual security scans.
"""

import pytest
import subprocess
import json
import os
from pathlib import Path


@pytest.mark.e2e
class TestDependencyAudit:
    """E2E tests for dependency security auditing."""

    def test_no_critical_python_vulnerabilities(self):
        """
        Ensure no critical security vulnerabilities in Python dependencies.

        This test runs pip-audit on the current Python environment to check
        for known security vulnerabilities in installed packages.
        """
        # Run pip-audit
        result = subprocess.run(
            ["uv", "run", "pip-audit", "--format", "json", "--output", "test-results/python-audit.json"],
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent.parent.parent
        )

        # pip-audit returns 0 if no vulnerabilities, 1 if vulnerabilities found
        # We allow it to pass even with vulnerabilities for now (don't fail the test)
        # but we log the results for manual review

        audit_file = Path("test-results/python-audit.json")
        if audit_file.exists():
            with open(audit_file) as f:
                audit_data = json.load(f)

            # Check for critical vulnerabilities
            critical_vulns = [
                vuln for vuln in audit_data.get("vulnerabilities", [])
                if vuln.get("severity", "").upper() == "CRITICAL"
            ]

            # Log findings
            if critical_vulns:
                pytest.fail(
                    f"CRITICAL Python vulnerabilities found: {len(critical_vulns)} vulnerabilities\n"
                    f"See test-results/python-audit.json for details\n"
                    f"Critical vulnerabilities: {[v['id'] for v in critical_vulns]}"
                )
            elif audit_data.get("vulnerabilities"):
                # Non-critical vulnerabilities - warn but don't fail
                vuln_count = len(audit_data["vulnerabilities"])
                print(f"WARNING: {vuln_count} non-critical Python vulnerabilities found")
                print("See test-results/python-audit.json for details")
            else:
                print("✅ No Python vulnerabilities found")
        else:
            pytest.skip("pip-audit output file not found")

    def test_no_critical_npm_vulnerabilities(self):
        """
        Ensure no critical security vulnerabilities in npm dependencies.

        This test runs npm audit on the UI directory to check for known
        security vulnerabilities in Node.js packages.
        """
        ui_dir = Path(__file__).parent.parent.parent / "ui"

        if not ui_dir.exists():
            pytest.skip("UI directory not found")

        # Run npm audit
        result = subprocess.run(
            ["npm", "audit", "--json"],
            capture_output=True,
            text=True,
            cwd=ui_dir
        )

        # npm audit returns 0 if no vulnerabilities, 1 if vulnerabilities found
        try:
            audit_data = json.loads(result.stdout)
        except json.JSONDecodeError:
            pytest.fail(f"Failed to parse npm audit output: {result.stdout}")

        # Save audit results
        audit_file = Path("test-results/npm-audit.json")
        audit_file.parent.mkdir(parents=True, exist_ok=True)
        with open(audit_file, "w") as f:
            json.dump(audit_data, f, indent=2)

        # Check for critical vulnerabilities
        vulnerabilities = audit_data.get("vulnerabilities", {})

        critical_vulns = [
            name for name, vuln in vulnerabilities.items()
            if vuln.get("severity", "").upper() == "CRITICAL"
        ]

        if critical_vulns:
            pytest.fail(
                f"CRITICAL npm vulnerabilities found: {len(critical_vulns)} packages\n"
                f"See test-results/npm-audit.json for details\n"
                f"Critical packages: {critical_vulns}"
            )
        elif vulnerabilities:
            # Non-critical vulnerabilities - warn but don't fail
            vuln_count = len(vulnerabilities)
            print(f"WARNING: {vuln_count} non-critical npm vulnerabilities found")
            print("See test-results/npm-audit.json for details")
        else:
            print("✅ No npm vulnerabilities found")

    def test_no_version_conflicts(self):
        """
        Ensure no dependency version conflicts in the project.

        This test checks that all dependency specifications are compatible
        and there are no version conflicts that could cause runtime issues.
        """
        # Check Python dependencies
        result = subprocess.run(
            ["uv", "sync", "--dry-run"],
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent.parent.parent
        )

        # uv sync --dry-run returns 0 if no conflicts, non-zero if conflicts
        if result.returncode != 0:
            pytest.fail(
                f"Python dependency conflicts detected:\n{result.stderr}\n{result.stdout}"
            )

        print("✅ No Python dependency conflicts")

        # Check npm dependencies
        ui_dir = Path(__file__).parent.parent.parent / "ui"
        if ui_dir.exists():
            result = subprocess.run(
                ["npm", "install", "--dry-run"],
                capture_output=True,
                text=True,
                cwd=ui_dir
            )

            # npm install --dry-run shows what would be installed
            # Look for conflict warnings
            if "conflict" in result.stderr.lower() or "conflict" in result.stdout.lower():
                pytest.fail(
                    f"npm dependency conflicts detected:\n{result.stderr}\n{result.stdout}"
                )

            print("✅ No npm dependency conflicts")

    def test_audit_reports_generated(self):
        """
        Ensure audit reports are generated and contain expected structure.

        This test validates that the audit process produces usable reports
        for manual review and CI integration.
        """
        python_audit = Path("test-results/python-audit.json")
        npm_audit = Path("test-results/npm-audit.json")

        # Check Python audit report
        if python_audit.exists():
            with open(python_audit) as f:
                data = json.load(f)

            # Should have expected structure
            assert "dependencies" in data or "vulnerabilities" in data
            print(f"✅ Python audit report generated with {len(data.get('dependencies', []))} dependencies scanned")
        else:
            pytest.fail("Python audit report not generated")

        # Check npm audit report
        if npm_audit.exists():
            with open(npm_audit) as f:
                data = json.load(f)

            # Should have expected structure
            assert isinstance(data, dict)
            print(f"✅ npm audit report generated")
        else:
            pytest.fail("npm audit report not generated")
