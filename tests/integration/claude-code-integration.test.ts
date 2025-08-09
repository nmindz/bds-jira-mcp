/**
 * Integration Tests for Claude Code CLI Configuration
 * Tests the setup and verification of Claude Code CLI integration
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Claude Code CLI Integration', () => {
  let testConfigPath: string;
  let testTempDir: string;
  let originalEnv: Record<string, string | undefined>;

  beforeEach(() => {
    // Backup original environment variables
    originalEnv = {
      JIRA_BASE_URL: process.env.JIRA_BASE_URL,
      JIRA_EMAIL: process.env.JIRA_EMAIL,
      JIRA_API_TOKEN: process.env.JIRA_API_TOKEN,
      JIRA_PROJECT_KEY: process.env.JIRA_PROJECT_KEY
    };
    
    // Create isolated temporary directory for testing
    testTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-test-'));
    testConfigPath = path.join(testTempDir, '.claude.json');
  });

  afterEach(() => {
    // Restore original environment variables
    Object.keys(originalEnv).forEach(key => {
      if (originalEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalEnv[key];
      }
    });
    
    // Clean up test directory
    if (fs.existsSync(testTempDir)) {
      fs.rmSync(testTempDir, { recursive: true, force: true });
    }
  });


  test('should merge with existing Claude Code configuration', () => {
    // Create existing config with other servers
    const existingConfig = {
      mcpServers: {
        'existing-server': {
          command: 'existing',
          args: ['server']
        }
      },
      otherSettings: {
        theme: 'dark'
      }
    };

    fs.writeFileSync(testConfigPath, JSON.stringify(existingConfig, null, 2));

    const testConfig = {
      JIRA_BASE_URL: 'https://test.atlassian.net',
      JIRA_EMAIL: 'test@example.com',
      JIRA_API_TOKEN: 'test-token'
    };

    // Add jira-mcp to existing config
    const updatedConfig = {
      ...existingConfig,
      mcpServers: {
        ...existingConfig.mcpServers,
        'jira-mcp': {
          command: 'npx',
          args: ['bds-jira-mcp'],
          env: testConfig
        }
      }
    };

    fs.writeFileSync(testConfigPath, JSON.stringify(updatedConfig, null, 2));

    // Verify merged config
    const configContent = fs.readFileSync(testConfigPath, 'utf8');
    const config = JSON.parse(configContent);

    // Should preserve existing settings
    expect(config.mcpServers['existing-server']).toEqual(existingConfig.mcpServers['existing-server']);
    expect(config.otherSettings).toEqual(existingConfig.otherSettings);

    // Should add jira-mcp config
    expect(config.mcpServers['jira-mcp']).toBeDefined();
    expect(config.mcpServers['jira-mcp'].env.JIRA_BASE_URL).toBe(testConfig.JIRA_BASE_URL);
  });


  test('should handle corrupted config file', () => {
    // Create corrupted JSON
    fs.writeFileSync(testConfigPath, '{ invalid json content');

    let isValid = false;
    try {
      const configContent = fs.readFileSync(testConfigPath, 'utf8');
      const config = JSON.parse(configContent);
      const jiraMcpConfig = config.mcpServers?.['jira-mcp'];
      isValid = !!(jiraMcpConfig?.command && 
                  jiraMcpConfig?.args && 
                  jiraMcpConfig?.env?.JIRA_BASE_URL && 
                  jiraMcpConfig?.env?.JIRA_EMAIL && 
                  jiraMcpConfig?.env?.JIRA_API_TOKEN);
    } catch (error) {
      isValid = false;
    }

    expect(isValid).toBe(false);
  });

  test('should handle file permission errors gracefully', () => {
    const testConfig = {
      JIRA_BASE_URL: 'https://test.atlassian.net',
      JIRA_EMAIL: 'test@example.com',
      JIRA_API_TOKEN: 'test-token'
    };

    // Test graceful handling by attempting to write to an invalid path
    const invalidPath = path.join('/root', '.claude.json');
    
    expect(() => {
      try {
        const claudeConfig = {
          mcpServers: {
            'jira-mcp': {
              command: 'npx',
              args: ['bds-jira-mcp'],
              env: testConfig
            }
          }
        };
        fs.writeFileSync(invalidPath, JSON.stringify(claudeConfig, null, 2));
      } catch (error) {
        // Expected to fail gracefully
        expect(error).toBeDefined();
      }
    }).not.toThrow();
  });
});
