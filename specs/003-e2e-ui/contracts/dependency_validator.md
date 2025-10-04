# Contract: DependencyValidator

**Feature**: 003-e2e-ui | **Component**: Dependency Validation  
**Type**: Test Infrastructure Service | **Phase**: 1

## Purpose

Validates all Python and Node.js package dependencies for version compatibility, security vulnerabilities, and licensing compliance.

## Contract Interface

### Methods

#### `validate_python_dependencies() -> DependencyValidationResult`

Validates all Python dependencies in the current environment.

**Preconditions**:

- Python environment is activated (UV)
- `pyproject.toml` and `uv.lock` exist
- Internet connectivity (for vulnerability database)

**Postconditions**:

- Returns complete dependency graph with vulnerabilities
- No modification to installed packages
- Audit results logged to file

**Returns**:

```python
@dataclass
class DependencyValidationResult:
    dependencies: List[DependencyInfo]
    total_count: int
    vulnerable_count: int
    critical_vulnerabilities: List[Vulnerability]
    has_conflicts: bool
    conflicts: List[str]
    audit_passed: bool  # True if no critical vulnerabilities
```

**Errors**:

- `EnvironmentError`: Python environment not found/not activated
- `FileNotFoundError`: Lock file missing
- `NetworkError`: Cannot reach vulnerability database

**Performance**:

- Execution time: <10 seconds for ~50 dependencies
- Network calls: minimal (cached vulnerability database)

---

#### `validate_npm_dependencies() -> DependencyValidationResult`

Validates all Node.js dependencies in the UI project.

**Preconditions**:

- `package.json` and `package-lock.json` exist in `ui/` directory
- Node.js and npm installed
- Internet connectivity

**Postconditions**:

- Returns dependency graph with npm audit results
- No modification to node_modules
- Audit results logged

**Returns**: Same as `validate_python_dependencies()`

**Errors**:

- `FileNotFoundError`: package.json missing
- `NetworkError`: npm registry unreachable
- `ParseError`: Malformed package-lock.json

**Performance**: <15 seconds for ~200 dependencies

---

#### `check_version_conflicts() -> List[str]`

Detects version conflicts across dependency tree.

**Preconditions**:

- Dependencies already scanned

**Postconditions**:

- Returns list of conflict descriptions
- Example: `["Package 'foo' required by A (>=1.0) conflicts with B (<=0.9)"]`

**Returns**: `List[str]` - Empty list if no conflicts

**Invariants**:

- Transitive dependencies checked recursively
- Both Python and npm dependencies analyzed

---

#### `generate_audit_report(format: str = 'json') -> str`

Generates formatted audit report.

**Preconditions**:

- Dependency validation completed

**Postconditions**:

- Report written to `test-results/dependency-audit-{timestamp}.{format}`
- Returns file path

**Parameters**:

- `format`: 'json' | 'html' | 'markdown'

**Returns**: Absolute path to generated report

**Errors**:

- `ValueError`: Invalid format specified
- `IOError`: Cannot write to test-results directory

## Behavioral Contracts

### Security Level Classification

```python
def classify_severity(vulnerability: Vulnerability) -> str:
    """
    CRITICAL: Remote code execution, privilege escalation
    HIGH: SQL injection, XSS, auth bypass
    MODERATE: DoS, information disclosure
    LOW: Minor issues, unlikely to be exploited
    """
```

**Contract**: Severity must match CVSS score ranges:

- CRITICAL: CVSS ≥9.0
- HIGH: CVSS 7.0-8.9
- MODERATE: CVSS 4.0-6.9
- LOW: CVSS <4.0

### Vulnerability Thresholds

**Contract**: Audit fails if:

- Any CRITICAL vulnerabilities found
- More than 5 HIGH vulnerabilities
- More than 20 MODERATE vulnerabilities

**Contract**: Audit warns if:

- 1-5 HIGH vulnerabilities
- 10-20 MODERATE vulnerabilities

**Contract**: Audit passes if:

- No CRITICAL or HIGH vulnerabilities
- <10 MODERATE vulnerabilities
- Any number of LOW vulnerabilities

## Data Contracts

### Input

- `pyproject.toml`: Python dependency specification
- `uv.lock`: Python lock file (UV format)
- `package.json`: Node.js dependency specification
- `package-lock.json`: npm lock file

### Output

- `DependencyGraph` object (see data-model.md)
- Audit report file (JSON/HTML/Markdown)
- CI exit code (0=pass, 1=fail, 2=warnings)

## Invariants

1. **Completeness**: All direct and transitive dependencies must be checked
2. **Freshness**: Vulnerability database must be <7 days old
3. **Accuracy**: No false positives (all reported vulnerabilities are real)
4. **Reproducibility**: Same dependencies → same audit result
5. **Performance**: Total audit time <30 seconds for both ecosystems

## Error Handling

### Network Failures

If vulnerability database unreachable:

- Use cached database (if <7 days old)
- WARN: "Using cached vulnerability data"
- If no cache: FAIL with clear error

### Parsing Errors

If lock file malformed:

- Report specific line/field causing error
- FAIL: Cannot validate without valid lock file
- Suggest: `uv lock` or `npm install` to regenerate

### Missing Dependencies

If dependency in lock file not installed:

- WARN: List missing packages
- Suggest: `uv sync` or `npm install`
- Continue validation with installed packages only

## Example Usage

```python
# tests/e2e/test_dependency_audit.py

@pytest.mark.e2e
def test_no_critical_vulnerabilities():
    """Ensure no critical security vulnerabilities in dependencies."""
    validator = DependencyValidator()
    
    # Validate Python dependencies
    python_result = validator.validate_python_dependencies()
    assert python_result.audit_passed, \
        f"Critical vulnerabilities found: {python_result.critical_vulnerabilities}"
    
    # Validate npm dependencies
    npm_result = validator.validate_npm_dependencies()
    assert npm_result.audit_passed, \
        f"Critical vulnerabilities found: {npm_result.critical_vulnerabilities}"
    
    # Generate audit report
    report_path = validator.generate_audit_report(format='html')
    assert Path(report_path).exists()


@pytest.mark.e2e
def test_no_version_conflicts():
    """Ensure no dependency version conflicts."""
    validator = DependencyValidator()
    
    conflicts = validator.check_version_conflicts()
    assert len(conflicts) == 0, \
        f"Version conflicts detected: {conflicts}"
```

## CI Integration

### Makefile Target

```makefile
audit-dependencies:
	@echo "🔍 Auditing Python dependencies..."
	uv pip install pip-audit
	uv run pip-audit --format json --output test-results/python-audit.json
	@echo "🔍 Auditing npm dependencies..."
	cd ui && npm audit --json > ../test-results/npm-audit.json
	@echo "✅ Dependency audit complete"
```

### GitHub Actions

```yaml
- name: Audit Dependencies
  run: make audit-dependencies
  
- name: Upload Audit Reports
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: dependency-audit
    path: test-results/*-audit.json
```

## References

- Python: `pip-audit` documentation
- Node.js: `npm audit` documentation
- NIST NVD: National Vulnerability Database
- CVSS: Common Vulnerability Scoring System
