/** @type {import('jest').Config} */
export default {
  // Test environment
  testEnvironment: 'node',

  // TypeScript support
  preset: 'ts-jest',

  // Module resolution
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  // Transform configuration
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        module: 'CommonJS',
        target: 'ES2020'
      }
    }]
  },

  // Test file patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/tests/**/*.spec.ts'
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/setup.ts',
    '!src/reconfigure.ts'
  ],

  // Coverage thresholds (disabled for initial implementation)
  // coverageThreshold: {
  //   global: {
  //     branches: 30,
  //     functions: 40,
  //     lines: 50,
  //     statements: 50
  //   }
  // },

  // Test setup
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  // Timeout configuration
  testTimeout: 30000,

  // Clear mocks between tests
  clearMocks: true,

  // Verbose output
  verbose: true
};
