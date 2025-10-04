# Flaky Test Policy

## Overview

This document outlines the policy for identifying, handling, and managing flaky tests in the point-shoting project. Flaky tests are tests that exhibit non-deterministic behavior - they may pass or fail intermittently without any changes to the code under test.

## Definition of Flaky Tests

A test is considered flaky if it:

- Fails intermittently without code changes
- Passes consistently in isolation but fails in CI/CD pipelines
- Exhibits timing-dependent behavior
- Depends on external resources that may be unreliable
- Has race conditions or concurrency issues

## Detection Thresholds

### Automatic Detection

Tests are automatically flagged as potentially flaky when they meet any of these criteria:

1. **Failure Rate Threshold**: A test fails in ≥5% of recent runs (minimum 10 runs)
2. **Recent Failures**: A test fails in 3 or more of the last 10 consecutive runs
3. **CI/CD Specific Failures**: A test passes locally but fails in CI/CD environment
4. **Timing Variability**: Test execution time varies by >50% between runs

### Manual Reporting

Team members can manually flag tests as flaky by:

- Adding `@pytest.mark.flaky` decorator
- Creating issues with "flaky-test" label
- Commenting in code reviews

## Quarantine Process

### Step 1: Automatic Quarantine

When a test meets detection thresholds:

1. Test is automatically marked with `@pytest.mark.skip(reason="Quarantined: flaky test")`
2. CI/CD pipelines continue but quarantined tests are skipped
3. Notification sent to development team
4. Test added to flaky test registry

### Step 2: Investigation

Within 24 hours of quarantine:

1. **Root Cause Analysis**: Identify why the test is flaky
   - Race conditions
   - Timing dependencies
   - External dependencies
   - Environment differences
   - Test isolation issues

2. **Impact Assessment**: Evaluate impact of flakiness
   - How critical is the functionality being tested?
   - Does it affect release confidence?
   - Is it blocking other development?

### Step 3: Fix or Stabilize

Within 72 hours of quarantine:

1. **Fix the Flakiness**: Address root cause
2. **Stabilize the Test**: Make test deterministic
3. **Improve Test Design**: Better isolation, mocking, or setup

### Step 4: Re-enable Test

After fixes are implemented:

1. Remove quarantine markers
2. Run test in isolation multiple times
3. Gradually reintroduce to full test suite
4. Monitor for continued stability

## Quarantine Duration Limits

- **Maximum Quarantine Period**: 2 weeks
- **Extension Criteria**: Complex fixes requiring architectural changes
- **Forced Action**: If not fixed within limit, test must be either:
  - Permanently removed if functionality is obsolete
  - Converted to integration test with manual verification
  - Moved to separate reliability test suite

## Un-quarantine Criteria

A quarantined test can be un-quarantined when it meets ALL of the following:

### Stability Requirements

1. **Consecutive Successes**: Passes in 50 consecutive runs across different environments
2. **CI/CD Validation**: Passes in 10 consecutive CI/CD pipeline runs
3. **Cross-platform**: Passes on all supported platforms (Linux, macOS, Windows if applicable)

### Code Quality Requirements

1. **Root Cause Addressed**: Underlying flakiness cause has been identified and fixed
2. **Test Isolation**: Test is properly isolated and doesn't depend on external state
3. **Documentation**: Test includes comments explaining the fix and prevention measures

### Review Requirements

1. **Code Review**: Changes reviewed by at least 2 team members
2. **Testing Review**: Test stability verified by QA team
3. **Documentation Review**: Policy compliance confirmed

## Monitoring and Reporting

### Daily Reports

- List of quarantined tests with quarantine duration
- Tests approaching maximum quarantine period
- New flaky test detections

### Weekly Reviews

- Review all quarantined tests
- Assess progress on fixes
- Identify patterns in flaky test causes

### Monthly Metrics

- Flaky test incident rate
- Average quarantine duration
- Success rate of un-quarantine attempts

## Prevention Measures

### Test Design Guidelines

1. **Avoid Timing Dependencies**: Don't use `time.sleep()` or arbitrary delays
2. **Proper Isolation**: Each test should be independent
3. **Mock External Dependencies**: Use mocks/stubs for unreliable external services
4. **Deterministic Data**: Use fixed seeds for random data generation

### Infrastructure Improvements

1. **Parallel Execution**: Ensure tests can run in parallel without interference
2. **Resource Isolation**: Dedicated test databases, services, and resources
3. **Environment Consistency**: Minimize differences between local and CI/CD environments

### Code Quality Practices

1. **Static Analysis**: Use tools to detect potential race conditions
2. **Code Reviews**: Review tests for flakiness indicators
3. **Test Categories**: Separate unit, integration, and e2e tests appropriately

## Escalation Procedures

### Immediate Action Required

- Tests quarantined for >1 week without progress
- Critical functionality affected by flaky tests
- Multiple tests failing in the same area

### Escalation Path

1. **Team Lead**: Initial investigation and coordination
2. **Engineering Manager**: Resource allocation and priority setting
3. **Architecture Review**: For systemic issues requiring design changes

## Tools and Automation

### Detection Tools

- Custom pytest plugin for flaky test detection
- CI/CD integration for automatic quarantine
- Monitoring dashboards for flaky test metrics

### Reporting Tools

- Automated daily/weekly reports
- Slack notifications for quarantine events
- Jira integration for tracking fixes

## Exceptions

### Allowed Exceptions

- **Load/Performance Tests**: May be inherently variable
- **Integration Tests**: May depend on external services
- **Network-dependent Tests**: May be affected by connectivity

### Exception Process

1. Document exception reason
2. Add appropriate test markers
3. Regular review of exceptions
4. Convert to more stable alternatives when possible

## Success Metrics

### Target Metrics

- **Flaky Test Rate**: <2% of all tests
- **Average Quarantine Duration**: <5 days
- **Un-quarantine Success Rate**: >90%
- **Time to Detection**: <24 hours

### Continuous Improvement

- Regular review of metrics
- Process improvements based on data
- Training and awareness programs
- Tool and automation enhancements

## Related Documentation

- [CI_DOCUMENTATION.md](CI_DOCUMENTATION.md) - CI/CD pipeline details
- [IMPLEMENTATION_REPORT.md](IMPLEMENTATION_REPORT.md) - Implementation status
- Test maintenance procedures
- Code review guidelines

## Contact Information

For questions about this policy:

- **Development Team**: Primary contact for technical issues
- **QA Team**: Test stability and quality assurance
- **DevOps Team**: CI/CD and infrastructure concerns
