/**
 * Jest Test Setup
 * Global test configuration and environment setup
 */

import { jest } from '@jest/globals';
import dotenv from 'dotenv';

// Global test environment setup
beforeAll(() => {
  // Set test environment
  process.env.NODE_ENV = 'test';

  // Load .env file if it exists (for real JIRA credentials)
  dotenv.config();

  // Only set fallback values if real credentials aren't available
  if (!process.env.JIRA_BASE_URL) {
    process.env.JIRA_BASE_URL = 'https://test-company.atlassian.net';
    process.env.JIRA_EMAIL = 'test@example.com';
    process.env.JIRA_API_TOKEN = 'test-token-123';
    process.env.JIRA_PROJECT_KEY = 'TEST';
  }
});

// Global test cleanup
afterAll(() => {
  // Clean up any global resources
  jest.restoreAllMocks();
});

// Global test configuration
jest.setTimeout(30000);

// Mock console methods in tests to reduce noise
global.console = {
  ...console,
  // Uncomment to silence console.log during tests
  // log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
