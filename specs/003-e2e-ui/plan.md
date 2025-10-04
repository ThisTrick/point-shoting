
# Implementation Plan: Comprehensive Debugging and E2E Testing Framework

**Branch**: `003-e2e-ui` | **Date**: October 4, 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/home/den/git/point-shoting/specs/003-e2e-ui/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary

This feature establishes comprehensive debugging and end-to-end testing infrastructure for both the Python particle engine and Electron UI. Building on the existing test framework (pytest, Jest, Playwright), it validates all dependencies, ensures regression-free operation of features from phases 001-core and 002-ui, and provides robust E2E test coverage across the complete application stack. The primary goal is deployment confidence through systematic validation of all system components and their integrations.

## Technical Context

**Language/Version**: Python 3.11+ (backend), TypeScript 5.0+ (UI), Node.js 20+ (Electron)
**Primary Dependencies**: 
- Python: pytest, pytest-xdist, hypothesis, coverage, mypy, ruff, numpy, pillow
- UI: Electron 27, React 18, Jest 29, Playwright 1.40, TypeScript 5
- Build: UV (Python), npm (Node.js), Vite (UI bundler)

**Storage**: File system (test artifacts, coverage reports, screenshots), Electron Store (UI settings)
**Testing**: 
- Python: pytest with markers (unit, contract, integration, performance)
- UI: Jest (unit/contract), Playwright (E2E)
- Existing: 8 test levels (Unit → UI Unit → Contract → UI Contract → Integration → UI Integration → Performance → E2E)

**Target Platform**: Linux (primary), macOS (future), Windows (future)  
**Project Type**: Desktop application (Electron UI + Python backend with IPC communication)

**Performance Goals**: 
- Quick pipeline: <60 seconds (unit + integration, skip E2E)
- CI pipeline: <5 minutes (full coverage including E2E)
- Individual test suites: Unit <5s, Contract <10s, Integration <45s, Performance <15s, E2E <3m
- Coverage target: 80% minimum (resolved from FR-029)

**Constraints**: 
- Test execution time limit: 15 minutes maximum for CI/CD (resolved from FR-032)
- Platform support: Linux primary, with cross-platform readiness (resolved from FR-036)
- Parallel execution where possible (pytest-xdist, Jest --maxWorkers)
- No new test frameworks (use existing pytest, Jest, Playwright)

**Scale/Scope**: 
- ~320 existing tests across all levels
- 24 integration test files, 9 contract test files, 11 UI unit test files
- 26 E2E test scenarios (Playwright)
- Test matrix: Python backend (9 services) × UI components (20+ React components) × E2E workflows (6 major user flows)

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Status | Notes |
|-----------|-------------|--------|-------|
| 1. Cross-Platform | Test on Windows, macOS, Linux | ⚠️ PARTIAL | Primary: Linux. Future: macOS/Windows E2E |
| 2. Accessibility & i18n | Test i18n (uk/en), keyboard nav | ✅ PASS | E2E tests include locale switching, UI contract tests verify |
| 3. Privacy & Security | No sensitive data in tests, local execution | ✅ PASS | All test data synthetic, no external dependencies |
| 4. Test-First Quality | Automated tests, CI gates | ✅ PASS | Core feature IS testing infrastructure enhancement |
| 5. Observability & Errors | Detailed test failure reports, diagnostics | ✅ PASS | pytest --tb=short, coverage reports, Playwright traces |
| 6. Minimal Footprint | Test execution efficiency, parallel where possible | ✅ PASS | pytest-xdist, Jest --maxWorkers, <15min CI target |

**Constitutional Alignment**: ✅ PASS with Linux-first approach (cross-platform readiness maintained)

## Project Structure

### Documentation (this feature)

```plaintext
specs/003-e2e-ui/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
│   ├── dependency_validator.md
│   ├── e2e_test_runner.md
│   ├── coverage_reporter.md
│   └── flaky_test_detector.md
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)

```plaintext
# Existing structure - NO new implementation code for this feature
# This feature enhances EXISTING test infrastructure

tests/
├── contract/           # 9 existing test files
├── integration/        # 24 existing test files  
├── unit/              # 6 existing test files
├── performance/       # 3 existing test files
└── e2e/               # NEW: Comprehensive E2E test suite
    ├── test_engine_pipeline.py     # NEW: Full particle engine E2E
    ├── test_dependency_audit.py    # NEW: Dependency validation
    └── test_regression_suite.py    # NEW: Regression test orchestrator

ui/tests/
├── unit/              # 11 existing test files (React components)
├── contract/          # 4 existing test files (UI services)
├── integration/       # 2 existing test files (IPC)
└── e2e/               # Existing Playwright tests
    └── app.spec.ts    # 26 scenarios - ENHANCE with new coverage

Makefile               # ENHANCE: Add new test targets
├── test-e2e-engine    # NEW: Python E2E tests
├── test-dependency-audit  # NEW: Dependency validation
├── test-regression    # NEW: Comprehensive regression
└── test-pipeline-complete  # NEW: Full validation pipeline
```

**Structure Decision**: Existing Electron + Python architecture (Option 2 equivalent: UI frontend + Python backend). No new source code - this feature is test infrastructure enhancement only.

## Phase 0: Outline & Research

**Status**: ✅ COMPLETE

### Research Complete

All technical unknowns from specification have been resolved:

1. **FR-029 (Coverage Targets)**: Resolved to 80% minimum for both Python and TypeScript
2. **FR-032 (CI Time Limit)**: Resolved to 15 minutes maximum
3. **FR-036 (Platform Support)**: Resolved to Linux primary, macOS/Windows E2E readiness

### Research Artifacts Generated

- `research.md`: Complete analysis of:
  - Coverage percentage targets with rationale
  - CI/CD execution time limits
  - Cross-platform validation strategy
  - Testing frameworks validation (all existing tools, no new dependencies)
  - Dependency auditing tools (pip-audit, npm audit)
  - E2E testing patterns for both engine and UI
  - Flaky test detection strategy
  - Coverage reporting strategy
  - CI/CD pipeline architecture (quick/ci/debug variants)
  - Test data strategy

**Output**: `/home/den/git/point-shoting/specs/003-e2e-ui/research.md`

---

## Phase 1: Design & Contracts

**Status**: ✅ COMPLETE

### Data Model Generated

- `data-model.md`: Complete test infrastructure entities:
  - TestResult, TestSuite (test execution tracking)
  - CoverageReport, FileCoverage (code coverage metrics)
  - DependencyInfo, Vulnerability, DependencyGraph (dependency auditing)
  - FlakyTestReport (flaky test detection)
  - PerformanceMetric (performance tracking)
  - E2ETestScenario, TestStep (E2E test specifications)
  
**Output**: `/home/den/git/point-shoting/specs/003-e2e-ui/data-model.md`

### Contracts Generated

Four key service contracts created:

1. **dependency_validator.md**: Validates Python and npm dependencies, security scanning
2. **e2e_test_runner.md**: Orchestrates E2E tests for engine and UI, regression testing
3. **coverage_reporter.md**: Measures and reports code coverage for both languages
4. **flaky_test_detector.md**: Identifies inconsistent tests, quarantine strategy

**Output**: `/home/den/git/point-shoting/specs/003-e2e-ui/contracts/`

### Quickstart Guide Generated

- `quickstart.md`: Comprehensive testing guide with:
  - Quick commands for common workflows
  - Step-by-step testing instructions (quality → unit → contract → integration → performance → E2E)
  - Debugging procedures
  - Common issues and solutions
  - CI/CD integration examples
  - Success criteria

**Output**: `/home/den/git/point-shoting/specs/003-e2e-ui/quickstart.md`

### Agent Context Update

Not required - this feature enhances existing test infrastructure using current tech stack (pytest, Jest, Playwright). No new technologies or patterns introduced that aren't already documented in Copilot instructions.

---

## Phase 2: Task Planning Approach

**Status**: ✅ DESCRIBED (ready for /tasks command)

### Task Generation Strategy

The `/tasks` command will generate tasks based on Phase 1 design artifacts:

#### Test Implementation Tasks

1. **Dependency Validation** [P]:
   - Create `tests/e2e/test_dependency_audit.py`
   - Implement Python dependency validation with pip-audit
   - Implement npm dependency audit integration
   - Create Makefile target `audit-dependencies`

2. **Engine E2E Tests** [P]:
   - Create `tests/e2e/test_engine_pipeline.py`
   - Test: Full animation pipeline (burst → breathing)
   - Test: Stage transition validation
   - Test: Recognition score convergence
   - Test: Performance under realistic workloads

3. **Regression Test Suite**:
   - Create `tests/e2e/test_regression_suite.py`
   - Load baseline metrics from previous runs
   - Run all test levels (unit → E2E)
   - Compare results and detect regressions
   - Generate regression report

4. **Coverage Enhancement** [P]:
   - Update `pytest.ini` with coverage configuration
   - Update `ui/jest.config.js` with coverage thresholds
   - Create coverage comparison script
   - Add coverage badges to README

5. **Flaky Test Detection**:
   - Create `tests/e2e/test_flaky_detection.py`
   - Implement multi-run test execution
   - Create flaky test report generator
   - Add quarantine marker support

6. **UI E2E Enhancement**:
   - Review existing `ui/tests/e2e/app.spec.ts` (26 scenarios)
   - Add missing workflow coverage
   - Enhance error diagnostics (screenshots, traces)
   - Document E2E test patterns

7. **Makefile Targets** [P]:
   - Add `test-e2e-engine`: Python E2E tests
   - Add `test-e2e-ui`: Playwright UI tests
   - Add `test-regression`: Full regression suite
   - Add `test-pipeline-complete`: Full validation (all tests + audit + coverage)
   - Add `detect-flaky`: Flaky test detection

8. **CI Pipeline Configuration**:
   - Update existing GitHub Actions workflow (if exists)
   - Add dependency audit step
   - Add coverage upload (Codecov or similar)
   - Add artifact upload (test results, traces)
   - Configure timeout: 20 minutes (with buffer)

9. **Documentation**:
   - Update CI_DOCUMENTATION.md with new E2E tests
   - Update README.md with quickstart reference
   - Create TESTING.md guide (link to quickstart.md)
   - Document flaky test policy

#### Task Ordering

**TDD Order**: Not applicable (this is test infrastructure enhancement, not new features)

**Execution Order**:

1. **Parallel Setup** [P]:
   - Dependency validation (task 1)
   - Coverage configuration (task 4)
   - Makefile targets (task 7)

2. **Sequential E2E**:
   - Engine E2E (task 2) - validates backend first
   - UI E2E enhancement (task 6) - depends on working backend
   - Regression suite (task 3) - depends on all test types

3. **Parallel Diagnostics** [P]:
   - Flaky detection (task 5)
   - CI pipeline (task 8)

4. **Final**: Documentation (task 9)

### Estimated Task Count

- **Test Implementation**: 6 tasks
- **Infrastructure**: 2 tasks (Makefile, CI)
- **Documentation**: 1 task
- **Total**: ~9 major tasks (some can run in parallel [P])

### Success Criteria for Tasks

Each task complete when:

- ✅ Code implemented (where applicable)
- ✅ Tests pass (self-testing for test infrastructure)
- ✅ Documentation updated
- ✅ Makefile target works
- ✅ CI integration validated

**IMPORTANT**: This phase will be executed by the `/tasks` command, NOT by `/plan`.

---

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

**No complexity violations** - this feature enhances existing test infrastructure using established tools and patterns. No new architectural complexity introduced.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |

---

## Progress Tracking

*This checklist is updated during execution flow*

**Phase Status**:

- [x] Phase 0: Research complete (/plan command) ✅
- [x] Phase 1: Design complete (/plan command) ✅
- [x] Phase 2: Task planning complete (/plan command - approach described) ✅
- [ ] Phase 3: Tasks generated (/tasks command) - NEXT STEP
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [x] Initial Constitution Check: PASS ✅
- [x] Post-Design Constitution Check: PASS ✅
- [x] All NEEDS CLARIFICATION resolved ✅
- [x] Complexity deviations documented: N/A ✅

**Artifacts Generated**:

- [x] `/specs/003-e2e-ui/plan.md` (this file)
- [x] `/specs/003-e2e-ui/research.md`
- [x] `/specs/003-e2e-ui/data-model.md`
- [x] `/specs/003-e2e-ui/quickstart.md`
- [x] `/specs/003-e2e-ui/contracts/dependency_validator.md`
- [x] `/specs/003-e2e-ui/contracts/e2e_test_runner.md`
- [x] `/specs/003-e2e-ui/contracts/coverage_reporter.md`
- [x] `/specs/003-e2e-ui/contracts/flaky_test_detector.md`
- [ ] `/specs/003-e2e-ui/tasks.md` (awaiting /tasks command)

---

## Next Steps

The `/plan` command execution is **COMPLETE**. 

To proceed with implementation:

1. **Run `/tasks` command** to generate `tasks.md` with numbered, ordered implementation tasks
2. **Execute tasks** following the order and dependencies specified
3. **Validate** using the quickstart guide procedures
4. **Deploy** with confidence knowing all systems are validated

**Ready for**: `/tasks` command

---

*Based on Constitution v1.0.0 - See `.specify/memory/constitution.md`*
