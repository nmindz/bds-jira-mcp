/** @type {import('jest').Config} */
export default {
  // Test environment
  testEnvironment: 'node',

  // TypeScript support - use default preset with ESM support
  preset: 'ts-jest/presets/default-esm',

  // Module resolution
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  // Transform configuration for ESM
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', {
      useESM: true
    }]
  },

  // ESM support
  extensionsToTreatAsEsm: ['.ts'],

  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))'
  ],

  // Test file patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/tests/**/*.spec.ts'
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts'
  ],


  // Test setup
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  // Timeout configuration
  testTimeout: 30000,

  // Clear mocks between tests
  clearMocks: true,
  
  // Force exit after tests complete
  forceExit: true,
  
  // Resource management
  detectOpenHandles: false,
  
  // Max workers to prevent resource conflicts
  maxWorkers: 1,

  // Verbose output
  verbose: true
};
