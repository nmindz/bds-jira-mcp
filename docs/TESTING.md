# Testing Strategy for JIRA MCP

This document outlines the comprehensive testing strategy implemented for the bds-jira-mcp project (formerly jira-mcp) using Jest as the primary testing framework.

## Overview

The testing strategy includes:
- **Unit Tests**: Individual component and function testing
- **Integration Tests**: Service integration and API interaction testing  
- **End-to-End Tests**: Complete workflow testing with real JIRA instances
- **Pre-commit Integration**: Automated test execution on code changes

## Testing Framework

### Jest Configuration
- **Framework**: Jest 30.x with TypeScript support via ts-jest
- **Environment**: Node.js test environment
- **Coverage**: Minimum 75% line coverage, 70% function coverage
- **Timeout**: 30 seconds for complex async operations

### Key Features
- Automatic mocking capabilities
- Comprehensive assertion library
- Coverage reporting
- Watch mode for development
- CI/CD integration support

## Test Structure

### Directory Organization
```
tests/
├── setup.ts              # Global test setup and configuration
├── unit/                  # Unit tests for individual components
│   └── simple.test.ts     # Basic functionality and environment tests
├── e2e/                   # End-to-end workflow tests
│   └── workflow.test.ts   # Complete JIRA workflow testing
├── fixtures/              # Test data and mock responses
│   └── jira-responses.ts  # JIRA API response fixtures
└── mocks/                 # Test utilities and mocks
    └── axios-mock.ts      # HTTP request mocking utilities
```

## Test Types

### 1. Unit Tests (`tests/unit/`)

**Purpose**: Test individual functions and components in isolation

**Current Coverage**:
- Environment variable validation
- Configuration file verification
- Build artifact validation
- String processing and regex operations
- Async/await operations
- Object and array manipulations
- JSON serialization/deserialization

**Example Test**:
```typescript
test('Environment variables are loaded in tests', () => {
  expect(process.env.NODE_ENV).toBe('test');
  expect(process.env.JIRA_BASE_URL).toBeDefined();
  expect(process.env.JIRA_EMAIL).toBeDefined();
  expect(process.env.JIRA_API_TOKEN).toBeDefined();
});
```

### 2. Integration Tests (Planned)

**Purpose**: Test service layer integration with mocked HTTP requests

**Planned Coverage**:
- JIRA Service method testing with mocked Axios
- MCP tool handler integration
- Error handling and edge cases
- Input validation with Zod schemas

### 3. End-to-End Tests (`tests/e2e/`)

**Purpose**: Test complete workflows with real JIRA instances

**Current Coverage**:
- JIRA connection validation
- Complete ticket lifecycle (create → update → comment → transition)
- Issue linking workflows  
- Project hierarchy creation and validation
- Error handling with real API responses

**Requirements**:
- Real JIRA credentials in environment variables
- Test project available in JIRA instance
- Network connectivity to JIRA Cloud

**Example E2E Test**:
```typescript
test('should create, update, and manage ticket lifecycle', async () => {
  // Step 1: Create a test ticket
  const createResponse = await axios.post(`${baseURL}/rest/api/2/issue`, {
    fields: {
      project: { key: testProjectKey },
      summary: 'E2E Test Ticket - Automated Test',
      description: 'This ticket was created by automated E2E tests',
      issuetype: { name: 'Task' }
    }
  });

  expect(createResponse.status).toBe(201);
  // ... continued workflow testing
});
```

## Test Utilities

### Mock Data (`tests/fixtures/jira-responses.ts`)
Comprehensive mock data including:
- Sample JIRA tickets (Task, Story, Epic)
- Transition responses
- Comment responses
- Issue link responses
- Project hierarchy responses
- Error response patterns

### HTTP Mocking (`tests/mocks/axios-mock.ts`)
Utilities for mocking Axios requests:
```typescript
const mockHelper = new AxiosMockHelper();
mockHelper.mockGet('/rest/api/2/issue/TEST-123', mockTicketData);
mockHelper.mockError('/rest/api/2/issue/INVALID-999', 404);
```

## Running Tests

### Available Commands
```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run E2E tests only (requires JIRA credentials)
npm run test:e2e

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# CI/CD test run
npm run test:ci

# Complete test suite with build validation
npm run test:all
```

### Development Workflow
```bash
# Start watch mode during development
npm run test:watch

# Run specific test file
npm test -- tests/unit/simple.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="Environment"

# Generate and view coverage
npm run test:coverage
open coverage/lcov-report/index.html
```

## Pre-commit Integration

### Automatic Test Execution
Tests are automatically executed via pre-commit hooks:
- Unit tests run on TypeScript file changes
- Build validation ensures code compiles
- Documentation validation ensures consistency

### Hook Configuration
```yaml
# .pre-commit-config.yaml
- id: unit-tests
  name: Run unit tests
  entry: npm run test:unit
  language: system
  always_run: true
  pass_filenames: false
```

## Environment Configuration

### Test Environment Variables
```bash
# Required for all tests
NODE_ENV=test
JIRA_BASE_URL=https://test-company.atlassian.net
JIRA_EMAIL=test@example.com
JIRA_API_TOKEN=test-token-123
JIRA_PROJECT_KEY=TEST
```

### E2E Test Requirements
```bash
# Real JIRA credentials for E2E tests
JIRA_BASE_URL=https://your-company.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_API_TOKEN=your-actual-api-token
JIRA_PROJECT_KEY=YOUR_PROJECT
```

## Coverage Requirements

### Minimum Thresholds
- **Statements**: 75%
- **Branches**: 60%
- **Functions**: 70%
- **Lines**: 75%

### Coverage Reports
```bash
# Generate detailed coverage report
npm run test:coverage

# View coverage in browser
open coverage/lcov-report/index.html

# Check coverage summary
npm run test:ci
```

## Continuous Integration

### GitHub Actions Integration
```yaml
# .github/workflows/test.yml
- name: Run Tests
  run: |
    npm ci
    npm run build
    npm run test:ci

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
```

### Pre-commit Hook Integration
- Tests run automatically on `git commit`
- Prevents commits with failing tests
- Ensures code quality before version control

## Error Handling Testing

### HTTP Error Scenarios
- 401 Unauthorized (invalid credentials)
- 403 Forbidden (insufficient permissions)
- 404 Not Found (invalid ticket IDs)
- 400 Bad Request (malformed requests)
- 429 Rate Limited (API throttling)
- 500 Server Error (JIRA service issues)

### Network Error Scenarios
- Connection timeouts
- DNS resolution failures
- Network connectivity issues
- SSL certificate problems

## Performance Testing

### Response Time Validation
```typescript
test('API responses complete within acceptable time', async () => {
  const startTime = Date.now();
  await jiraService.getTicket('TEST-123');
  const responseTime = Date.now() - startTime;

  expect(responseTime).toBeLessThan(5000); // 5 second timeout
});
```

### Memory Usage Monitoring
- Monitor for memory leaks in long-running tests
- Validate service cleanup after test completion
- Check for resource disposal in async operations

## Best Practices

### Test Writing Guidelines
1. **Descriptive Names**: Use clear, descriptive test names
2. **Single Responsibility**: Each test should verify one specific behavior
3. **Arrange-Act-Assert**: Follow AAA pattern for test structure
4. **Mock External Dependencies**: Use mocks for HTTP requests and external services
5. **Clean Up Resources**: Properly clean up test data and connections

### Mock Data Management
1. **Realistic Data**: Use realistic JIRA response data
2. **Edge Cases**: Include edge cases and error conditions
3. **Consistency**: Maintain consistent mock data across tests
4. **Version Control**: Keep mock data in version control

### E2E Test Guidelines
1. **Environment Isolation**: Use dedicated test environments
2. **Data Cleanup**: Clean up test data after execution
3. **Conditional Execution**: Skip E2E tests when credentials unavailable
4. **Timeout Handling**: Set appropriate timeouts for network operations

## Troubleshooting

### Common Issues

#### Jest Configuration Problems
```bash
# Clear Jest cache
npm test -- --clearCache

# Debug Jest configuration
npm test -- --showConfig
```

#### TypeScript Compilation Issues
```bash
# Check TypeScript compilation
npm run build

# Validate test TypeScript
npx tsc --noEmit tests/**/*.ts
```

#### E2E Test Failures
```bash
# Test JIRA connectivity
curl -u email:token https://company.atlassian.net/rest/api/2/myself

# Validate environment variables
echo $JIRA_BASE_URL
echo $JIRA_EMAIL
```

#### Pre-commit Hook Issues
```bash
# Reinstall pre-commit hooks
pre-commit uninstall
pre-commit install

# Test hooks manually
pre-commit run --all-files
```

## Future Enhancements

### Planned Testing Improvements
1. **Property-Based Testing**: Add property-based tests with fast-check
2. **Visual Regression Testing**: Add screenshot testing for setup tools
3. **Load Testing**: Add performance and load testing scenarios
4. **Contract Testing**: Add API contract testing with Pact
5. **Mutation Testing**: Add mutation testing with Stryker

### Integration Enhancements
1. **GitHub Actions**: Complete CI/CD pipeline with test reporting
2. **Code Coverage**: Enhanced coverage reporting and tracking
3. **Test Automation**: Automated test data management
4. **Performance Monitoring**: Continuous performance regression testing

---

This testing strategy ensures high code quality, reliability, and maintainability for the bds-jira-mcp project while providing comprehensive coverage of all major functionality and edge cases.
