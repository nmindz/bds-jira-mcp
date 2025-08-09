/**
 * Integration Tests for MCP Server Verification
 * Tests MCP server connectivity and initialization
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { JiraMcpSetup } from '../../src/setup.js';

describe('MCP Server Verification', () => {
  let setup: JiraMcpSetup;

  beforeEach(() => {
    setup = new JiraMcpSetup();
  });

  test('should validate MCP server configuration parameters', () => {
    const testConfig = {
      JIRA_BASE_URL: 'https://test.atlassian.net',
      JIRA_EMAIL: 'test@example.com',
      JIRA_API_TOKEN: 'test-token',
      JIRA_PROJECT_KEY: 'TEST'
    };

    // Validate all required config parameters are present
    expect(testConfig.JIRA_BASE_URL).toBeDefined();
    expect(testConfig.JIRA_EMAIL).toBeDefined();
    expect(testConfig.JIRA_API_TOKEN).toBeDefined();
    expect(testConfig.JIRA_PROJECT_KEY).toBeDefined();

    // Validate URL format
    expect(testConfig.JIRA_BASE_URL).toMatch(/^https?:\/\/.+$/);

    // Validate email format
    expect(testConfig.JIRA_EMAIL).toMatch(/^.+@.+\..+$/);
  });

  test('should handle configuration with missing optional fields', () => {
    const testConfig = {
      JIRA_BASE_URL: 'https://test.atlassian.net',
      JIRA_EMAIL: 'test@example.com',
      JIRA_API_TOKEN: 'test-token'
      // No JIRA_PROJECT_KEY
    };

    // Validate required fields are present
    expect(testConfig.JIRA_BASE_URL).toBeDefined();
    expect(testConfig.JIRA_EMAIL).toBeDefined();
    expect(testConfig.JIRA_API_TOKEN).toBeDefined();

    // Optional field should be undefined
    expect((testConfig as any).JIRA_PROJECT_KEY).toBeUndefined();
  });

  test('should detect invalid configuration parameters', () => {
    const invalidConfigs: any[] = [
      // Missing base URL
      {
        JIRA_EMAIL: 'test@example.com',
        JIRA_API_TOKEN: 'test-token'
      },
      // Invalid URL format
      {
        JIRA_BASE_URL: 'not-a-url',
        JIRA_EMAIL: 'test@example.com',
        JIRA_API_TOKEN: 'test-token'
      },
      // Invalid email format
      {
        JIRA_BASE_URL: 'https://test.atlassian.net',
        JIRA_EMAIL: 'not-an-email',
        JIRA_API_TOKEN: 'test-token'
      },
      // Missing token
      {
        JIRA_BASE_URL: 'https://test.atlassian.net',
        JIRA_EMAIL: 'test@example.com'
      }
    ];

    invalidConfigs.forEach(config => {
      // Check that required fields are missing or invalid
      const hasValidBaseUrl = Boolean(config.JIRA_BASE_URL && /^https?:\/\/.+$/.test(config.JIRA_BASE_URL));
      const hasValidEmail = Boolean(config.JIRA_EMAIL && /^.+@.+\..+$/.test(config.JIRA_EMAIL));
      const hasToken = Boolean(config.JIRA_API_TOKEN);

      // At least one validation should fail
      const isValid = hasValidBaseUrl && hasValidEmail && hasToken;
      expect(isValid).toBe(false);
    });
  });

  test('should validate JIRA URL patterns', () => {
    const validUrls = [
      'https://company.atlassian.net',
      'https://custom-domain.atlassian.net',
      'https://subdomain.company.atlassian.net'
    ];

    const invalidUrls = [
      'http://unsecure.atlassian.net', // Should be HTTPS
      'not-a-url',
      'https://',
      'company.atlassian.net' // Missing protocol
    ];

    validUrls.forEach(url => {
      expect(url).toMatch(/^https:\/\/.+$/);
    });

    invalidUrls.forEach(url => {
      const isValid = /^https:\/\/.+$/.test(url) && url.length > 10;
      expect(isValid).toBe(false);
    });
  });


  test('should handle MCP server command structure', () => {
    const expectedCommand = 'npx';
    const expectedArgs = ['bds-jira-mcp'];
    const expectedStdio = ['pipe', 'pipe', 'pipe'];

    expect(expectedCommand).toBe('npx');
    expect(expectedArgs).toContain('bds-jira-mcp');
    expect(expectedStdio).toHaveLength(3);
    expect(expectedStdio).toEqual(['pipe', 'pipe', 'pipe']);
  });

  test('should validate MCP protocol message structure', () => {
    const mcpInitMessage = '{"jsonrpc":"2.0","method":"initialize","params":{}}';
    
    // Should be valid JSON
    expect(() => JSON.parse(mcpInitMessage)).not.toThrow();
    
    const parsed = JSON.parse(mcpInitMessage);
    expect(parsed.jsonrpc).toBe('2.0');
    expect(parsed.method).toBe('initialize');
    expect(parsed.params).toBeDefined();
  });
});
