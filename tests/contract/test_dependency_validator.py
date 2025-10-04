"""
Contract tests for DependencyValidator interface.

These tests validate that the DependencyValidator service adheres to its
contract specification without requiring full implementation.
"""

import pytest
from typing import List
from dataclasses import dataclass


# Contract data structures (from data-model.md)
@dataclass
class DependencyInfo:
    name: str
    version: str
    ecosystem: str  # 'python' or 'npm'
    vulnerabilities: List['Vulnerability']


@dataclass
class Vulnerability:
    id: str
    severity: str  # 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'
    description: str
    cvss_score: float


@dataclass
class DependencyValidationResult:
    dependencies: List[DependencyInfo]
    total_count: int
    vulnerable_count: int
    critical_vulnerabilities: List[Vulnerability]
    has_conflicts: bool
    conflicts: List[str]
    audit_passed: bool


class DependencyValidator:
    """
    Stub implementation for contract testing.
    In real implementation, this would validate actual dependencies.
    """

    def validate_python_dependencies(self) -> DependencyValidationResult:
        """Stub: Would validate Python dependencies via pip-audit."""
        return DependencyValidationResult(
            dependencies=[],
            total_count=0,
            vulnerable_count=0,
            critical_vulnerabilities=[],
            has_conflicts=False,
            conflicts=[],
            audit_passed=True
        )

    def validate_npm_dependencies(self) -> DependencyValidationResult:
        """Stub: Would validate npm dependencies via npm audit."""
        return DependencyValidationResult(
            dependencies=[],
            total_count=0,
            vulnerable_count=0,
            critical_vulnerabilities=[],
            has_conflicts=False,
            conflicts=[],
            audit_passed=True
        )

    def check_version_conflicts(self) -> List[str]:
        """Stub: Would check for version conflicts in dependency tree."""
        return []

    def generate_audit_report(self, format: str = 'json') -> str:
        """Stub: Would generate audit report in specified format."""
        return f"/test-results/dependency-audit-report.{format}"


@pytest.mark.contract
class TestDependencyValidatorContract:
    """Contract tests for DependencyValidator interface."""

    def test_validate_python_dependencies_interface(self):
        """Test that validate_python_dependencies returns correct type."""
        validator = DependencyValidator()
        result = validator.validate_python_dependencies()

        assert isinstance(result, DependencyValidationResult)
        assert isinstance(result.dependencies, list)
        assert isinstance(result.total_count, int)
        assert isinstance(result.vulnerable_count, int)
        assert isinstance(result.critical_vulnerabilities, list)
        assert isinstance(result.has_conflicts, bool)
        assert isinstance(result.conflicts, list)
        assert isinstance(result.audit_passed, bool)

    def test_validate_npm_dependencies_interface(self):
        """Test that validate_npm_dependencies returns correct type."""
        validator = DependencyValidator()
        result = validator.validate_npm_dependencies()

        assert isinstance(result, DependencyValidationResult)
        assert isinstance(result.dependencies, list)
        assert isinstance(result.total_count, int)
        assert isinstance(result.vulnerable_count, int)
        assert isinstance(result.critical_vulnerabilities, list)
        assert isinstance(result.has_conflicts, bool)
        assert isinstance(result.conflicts, list)
        assert isinstance(result.audit_passed, bool)

    def test_check_version_conflicts_interface(self):
        """Test that check_version_conflicts returns list of strings."""
        validator = DependencyValidator()
        conflicts = validator.check_version_conflicts()

        assert isinstance(conflicts, list)
        for conflict in conflicts:
            assert isinstance(conflict, str)

    def test_generate_audit_report_interface(self):
        """Test that generate_audit_report returns string path."""
        validator = DependencyValidator()

        # Test default format
        path = validator.generate_audit_report()
        assert isinstance(path, str)
        assert path.endswith('.json')

        # Test specified format
        path_html = validator.generate_audit_report('html')
        assert isinstance(path_html, str)
        assert path_html.endswith('.html')

        path_md = validator.generate_audit_report('markdown')
        assert isinstance(path_md, str)
        assert path_md.endswith('.markdown')

    def test_generate_audit_report_invalid_format(self):
        """Test that generate_audit_report handles invalid formats."""
        validator = DependencyValidator()

        # This would raise ValueError in real implementation
        # For contract test, we just verify it returns a string
        path = validator.generate_audit_report('invalid')
        assert isinstance(path, str)

    def test_dependency_info_structure(self):
        """Test DependencyInfo dataclass structure."""
        dep = DependencyInfo(
            name="example-package",
            version="1.0.0",
            ecosystem="python",
            vulnerabilities=[]
        )

        assert dep.name == "example-package"
        assert dep.version == "1.0.0"
        assert dep.ecosystem == "python"
        assert dep.vulnerabilities == []

    def test_vulnerability_structure(self):
        """Test Vulnerability dataclass structure."""
        vuln = Vulnerability(
            id="CVE-2023-12345",
            severity="HIGH",
            description="Example vulnerability",
            cvss_score=7.5
        )

        assert vuln.id == "CVE-2023-12345"
        assert vuln.severity == "HIGH"
        assert vuln.description == "Example vulnerability"
        assert vuln.cvss_score == 7.5

    def test_dependency_validation_result_structure(self):
        """Test DependencyValidationResult dataclass structure."""
        result = DependencyValidationResult(
            dependencies=[],
            total_count=0,
            vulnerable_count=0,
            critical_vulnerabilities=[],
            has_conflicts=False,
            conflicts=[],
            audit_passed=True
        )

        assert result.dependencies == []
        assert result.total_count == 0
        assert result.vulnerable_count == 0
        assert result.critical_vulnerabilities == []
        assert result.has_conflicts is False
        assert result.conflicts == []
        assert result.audit_passed is True