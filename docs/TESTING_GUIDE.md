# Testing Guide

This document provides comprehensive instructions for running tests and checking code coverage in the mrRobotoV3 project.

## 🧪 Test Commands

### Basic Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with verbose output
npm run test:verbose

# Run tests silently (minimal output)
npm run test:silent
```

### Code Coverage Commands

```bash
# Run tests with code coverage
npm run test:coverage

# Run coverage and open HTML report in browser (macOS only)
npm run test:coverage:open

# Manual steps to view HTML coverage report:
# 1. Run: npm run test:coverage
# 2. Open: coverage/lcov-report/index.html in your browser
```

### Specific Test Commands

```bash
# Run a specific test file
npm test tests/services/messageService/sendMessage.test.js

# Run tests matching a pattern
npm test -- --testNamePattern="should send message"

# Run tests for a specific directory
npm test tests/services/

# Run tests with coverage for specific files
npm test -- --coverage --collectCoverageFrom="src/services/**/*.js"

# Run tests with custom timeout
npm test -- --testTimeout=10000

# Run tests and update snapshots
npm test -- --updateSnapshot
```

## 📊 Understanding Coverage Output

When you run `npm run test:coverage`, you'll see four key metrics:

- **Statements**: Percentage of code statements executed during tests
- **Branches**: Percentage of code branches (if/else, switch cases) tested
- **Functions**: Percentage of functions called during tests
- **Lines**: Percentage of lines executed during tests

### Coverage Example Output

```
--------------------|---------|----------|---------|---------|-------------------
File                | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
--------------------|---------|----------|---------|---------|-------------------
All files           |   85.23 |    78.95 |   90.12 |   85.67 |
 src/services       |   92.45 |    86.36 |   95.83 |   92.11 |
  messageService.js |   94.12 |    88.89 |   100   |   93.75 | 45,67,123
  parseCommands.js  |   88.24 |    75.00 |   100   |   89.47 | 12,34
 src/lib            |   76.92 |    66.67 |   81.82 |   78.26 |
  buildUrl.js       |   82.35 |    71.43 |   100   |   84.00 | 89,102,156
  logging.js        |   65.22 |    50.00 |   66.67 |   66.67 | 23,45,67,89
--------------------|---------|----------|---------|---------|-------------------
```

## 📁 Coverage Reports

After running coverage, you'll get multiple report formats:

### 1. Console Output
- **Text Summary**: Brief overview displayed in terminal
- **Detailed Table**: Shows coverage per file with uncovered line numbers

### 2. HTML Report
- **Location**: `coverage/lcov-report/index.html`
- **Features**: Interactive browsable report with highlighted uncovered code
- **Access**: 
  - Use `npm run test:coverage:open` (may need manual opening)
  - Or manually open `coverage/lcov-report/index.html` in your browser
  - Generated only after running `npm run test:coverage`

### 3. LCOV File
- **Location**: `coverage/lcov.info`
- **Purpose**: Machine-readable format for CI/CD integration
- **Use**: Can be uploaded to services like Codecov or Coveralls

## ⚙️ Configuration

### Coverage Thresholds

Current coverage thresholds are set to **70%** for:
- Branches
- Functions  
- Lines
- Statements

**Note**: Tests will fail if coverage drops below these thresholds.

### Files Included in Coverage

Coverage is collected from:
- `src/**/*.js` (all JavaScript files in src directory)

### Files Excluded from Coverage

The following files are excluded:
- `src/index.js` (main entry point)
- `src/config.js` (configuration file)
- `**/node_modules/**` (dependencies)
- `**/tests/**` (test files themselves)

## 🎯 Coverage Best Practices

### 1. Aim for High Coverage
- **Target**: 80-90% coverage for critical business logic
- **Minimum**: 70% overall coverage (enforced by thresholds)

### 2. Focus on Quality, Not Just Quantity
- Test edge cases and error conditions
- Ensure all code branches are tested
- Test both success and failure scenarios

### 3. Coverage Gaps
If coverage is low, look for:
- Untested error handling code
- Missing edge case tests
- Dead code that should be removed
- Complex conditional logic

### 4. Viewing Uncovered Code
1. Run `npm run test:coverage:open`
2. Navigate to specific files in the HTML report
3. Red highlighting shows uncovered lines
4. Yellow highlighting shows partially covered branches

## 📝 Test File Organization

```
tests/
├── README.md                    # This file
├── integration/                 # End-to-end integration tests
│   └── commandFlow.test.js
├── lib/                        # Library/utility tests
│   └── buildUrl/
│       ├── buildUrl.test.js
│       └── assignSearchParams.test.js
├── services/                   # Service layer tests
│   ├── commandService.test.js
│   ├── parseCommands.test.js
│   ├── cometchatAPI/
│   └── messageService/
└── tasks/                      # Task/worker tests
```

## 🚀 Common Testing Workflows

### 1. Development Workflow
```bash
# Start watch mode for continuous testing
npm run test:watch

# Make code changes
# Tests automatically re-run on save
```

### 2. Pre-commit Workflow
```bash
# Run all tests with coverage
npm run test:coverage

# Ensure all tests pass and coverage thresholds are met
# Commit changes if everything passes
```

### 3. CI/CD Workflow
```bash
# Install dependencies
npm install

# Run tests with coverage
npm run test:coverage

# Upload coverage to service (if configured)
# Deploy if tests pass
```

## 🔧 Troubleshooting

### Coverage HTML Report Not Opening

**Problem**: `npm run test:coverage:open` doesn't open the HTML report

**Solutions**:
1. **Manual approach** (works on all systems):
   ```bash
   npm run test:coverage
   # Then manually open: coverage/lcov-report/index.html
   ```

2. **Check if coverage was generated**:
   ```bash
   ls -la coverage/lcov-report/
   # Should show index.html and other files
   ```

3. **Platform-specific commands**:
   ```bash
   # macOS
   open coverage/lcov-report/index.html
   
   # Windows
   start coverage/lcov-report/index.html
   
   # Linux
   xdg-open coverage/lcov-report/index.html
   ```

4. **Using a local server** (if file:// doesn't work):
   ```bash
   npx http-server coverage/lcov-report -p 8080
   # Then open: http://localhost:8080
   ```

### Tests Hanging
- Check for improper async/await usage
- Look for unresolved promises
- Verify mock cleanup in `afterEach` blocks

### Coverage Not Updating
- Clear Jest cache: `npx jest --clearCache`
- Ensure files are being imported/required in tests
- Check file path patterns in `collectCoverageFrom`

### False Coverage Reports
- Verify mocks are not inflating coverage
- Check that actual code paths are being tested
- Review branch coverage to ensure all conditions are tested

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Jest Coverage Configuration](https://jestjs.io/docs/configuration#collectcoverage-boolean)
- [Testing Best Practices](https://jestjs.io/docs/tutorial-async)
