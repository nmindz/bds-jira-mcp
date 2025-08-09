/**
 * Jest Test Setup
 * Global test configuration and environment setup
 */

import { jest } from '@jest/globals';
import dotenv from 'dotenv';
import http from 'http';
import https from 'https';

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
  
  // Force close any open HTTP agent connections
  // Using imported modules instead of require for consistency
  
  if (http.globalAgent) {
    http.globalAgent.destroy();
  }
  if (https.globalAgent) {
    https.globalAgent.destroy();
  }
  
  // Force close Axios default timeout and connections
  try {
    const axios = require('axios');
    if (axios.defaults.adapter) {
      // Reset axios defaults
      axios.defaults.timeout = 0;
      axios.defaults.adapter = null;
    }
  } catch (e) {
    // Ignore cleanup errors
  }
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
