// jest.config.js
module.exports = {
  testEnvironment: 'node',
  
  // Disable transform to avoid Babel issues
  transform: {},
  
  // Coverage configuration
  collectCoverage: false, // Set to true to always collect coverage, or use --coverage flag
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js', // Exclude main entry point
    '!src/config.js', // Exclude config file
    '!**/node_modules/**',
    '!**/tests/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',        // Console output
    'text-summary', // Brief console summary
    'html',        // HTML report in coverage/ directory
    'lcov'         // For CI/CD integration
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  
  // Setup files
  setupFilesAfterEnv: [],
  
  // Verbose output
  verbose: true
};
