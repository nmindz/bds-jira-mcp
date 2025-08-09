/**
 * Integration Tests for Claude Code CLI Configuration
 * Tests the setup and verification of Claude Code CLI integration
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { JiraMcpSetup } from '../../src/setup.js';

describe('Claude Code CLI Integration', () => {
  let testConfigPath: string;
  let backupConfigPath: string;
  let originalConfig: string | null = null;

  beforeEach(() => {
    // Setup test config paths
    testConfigPath = path.join(os.homedir(), '.claude.json');
    backupConfigPath = `${testConfigPath}.backup.${Date.now()}`;

    // Backup existing config if it exists
    if (fs.existsSync(testConfigPath)) {
      originalConfig = fs.readFileSync(testConfigPath, 'utf8');
      fs.copyFileSync(testConfigPath, backupConfigPath);
    }
  });

  afterEach(() => {
    // Restore original config
    if (originalConfig) {
      fs.writeFileSync(testConfigPath, originalConfig);
    } else if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }

    // Clean up backup
    if (fs.existsSync(backupConfigPath)) {
      fs.unlinkSync(backupConfigPath);
    }
  });

  test('should create valid Claude Code configuration', () => {
    const setup = new JiraMcpSetup();
    const testConfig = {
      JIRA_BASE_URL: 'https://test.atlassian.net',
      JIRA_EMAIL: 'test@example.com',
      JIRA_API_TOKEN: 'test-token',
      JIRA_PROJECT_KEY: 'TEST'
    };

    // Use reflection to access private method for testing
    const createClaudeCodeConfig = (setup as any).createClaudeCodeConfig.bind(setup);
    createClaudeCodeConfig(testConfig);

    // Verify config file was created
    expect(fs.existsSync(testConfigPath)).toBe(true);

    // Verify config content
    const configContent = fs.readFileSync(testConfigPath, 'utf8');
    const config = JSON.parse(configContent);

    expect(config.mcpServers).toBeDefined();
    expect(config.mcpServers['jira-mcp']).toBeDefined();

    const jiraMcpConfig = config.mcpServers['jira-mcp'];
    expect(jiraMcpConfig.command).toBe('npx');
    expect(jiraMcpConfig.args).toEqual(['jira-mcp']);
    expect(jiraMcpConfig.env.JIRA_BASE_URL).toBe(testConfig.JIRA_BASE_URL);
    expect(jiraMcpConfig.env.JIRA_EMAIL).toBe(testConfig.JIRA_EMAIL);
    expect(jiraMcpConfig.env.JIRA_API_TOKEN).toBe(testConfig.JIRA_API_TOKEN);
    expect(jiraMcpConfig.env.JIRA_PROJECT_KEY).toBe(testConfig.JIRA_PROJECT_KEY);
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

    const setup = new JiraMcpSetup();
    const testConfig = {
      JIRA_BASE_URL: 'https://test.atlassian.net',
      JIRA_EMAIL: 'test@example.com',
      JIRA_API_TOKEN: 'test-token'
    };

    // Add jira-mcp to existing config
    const createClaudeCodeConfig = (setup as any).createClaudeCodeConfig.bind(setup);
    createClaudeCodeConfig(testConfig);

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

  test('should verify valid Claude Code configuration', () => {
    // Create valid config
    const validConfig = {
      mcpServers: {
        'jira-mcp': {
          command: 'npx',
          args: ['jira-mcp'],
          env: {
            JIRA_BASE_URL: 'https://test.atlassian.net',
            JIRA_EMAIL: 'test@example.com',
            JIRA_API_TOKEN: 'test-token',
            JIRA_PROJECT_KEY: 'TEST'
          }
        }
      }
    };

    fs.writeFileSync(testConfigPath, JSON.stringify(validConfig, null, 2));

    const setup = new JiraMcpSetup();
    const verifyClaudeCodeConfig = (setup as any).verifyClaudeCodeConfig.bind(setup);

    const isValid = verifyClaudeCodeConfig();
    expect(isValid).toBe(true);
  });

  test('should detect invalid Claude Code configuration', () => {
    // Create config missing required fields
    const invalidConfig = {
      mcpServers: {
        'jira-mcp': {
          command: 'npx',
          // Missing args and env
        }
      }
    };

    fs.writeFileSync(testConfigPath, JSON.stringify(invalidConfig, null, 2));

    const setup = new JiraMcpSetup();
    const verifyClaudeCodeConfig = (setup as any).verifyClaudeCodeConfig.bind(setup);

    const isValid = verifyClaudeCodeConfig();
    expect(isValid).toBe(false);
  });

  test('should detect missing Claude Code configuration', () => {
    // Ensure no config file exists
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }

    const setup = new JiraMcpSetup();
    const verifyClaudeCodeConfig = (setup as any).verifyClaudeCodeConfig.bind(setup);

    const isValid = verifyClaudeCodeConfig();
    expect(isValid).toBe(false);
  });

  test('should handle missing jira-mcp server in config', () => {
    // Create config without jira-mcp server
    const configWithoutJiraMcp = {
      mcpServers: {
        'other-server': {
          command: 'other',
          args: ['server']
        }
      }
    };

    fs.writeFileSync(testConfigPath, JSON.stringify(configWithoutJiraMcp, null, 2));

    const setup = new JiraMcpSetup();
    const verifyClaudeCodeConfig = (setup as any).verifyClaudeCodeConfig.bind(setup);

    const isValid = verifyClaudeCodeConfig();
    expect(isValid).toBe(false);
  });

  test('should handle corrupted config file', () => {
    // Create corrupted JSON
    fs.writeFileSync(testConfigPath, '{ invalid json content');

    const setup = new JiraMcpSetup();
    const verifyClaudeCodeConfig = (setup as any).verifyClaudeCodeConfig.bind(setup);

    const isValid = verifyClaudeCodeConfig();
    expect(isValid).toBe(false);
  });

  test('should validate all required environment variables', () => {
    const requiredEnvVars = ['JIRA_BASE_URL', 'JIRA_EMAIL', 'JIRA_API_TOKEN'];

    for (const missingVar of requiredEnvVars) {
      // Create config missing one required env var
      const env: any = {
        JIRA_BASE_URL: 'https://test.atlassian.net',
        JIRA_EMAIL: 'test@example.com',
        JIRA_API_TOKEN: 'test-token',
        JIRA_PROJECT_KEY: 'TEST'
      };

      delete env[missingVar];

      const configMissingVar = {
        mcpServers: {
          'jira-mcp': {
            command: 'npx',
            args: ['jira-mcp'],
            env
          }
        }
      };

      fs.writeFileSync(testConfigPath, JSON.stringify(configMissingVar, null, 2));

      const setup = new JiraMcpSetup();
      const verifyClaudeCodeConfig = (setup as any).verifyClaudeCodeConfig.bind(setup);

      const isValid = verifyClaudeCodeConfig();
      expect(isValid).toBe(false);
    }
  });

  test('should handle file permission errors gracefully', () => {
    const setup = new JiraMcpSetup();

    // Mock fs operations to simulate permission errors
    const originalWriteFileSync = fs.writeFileSync;
    const originalExistsSync = fs.existsSync;

    (fs as any).writeFileSync = () => {
      throw new Error('EACCES: permission denied');
    };

    (fs as any).existsSync = () => false;

    const testConfig = {
      JIRA_BASE_URL: 'https://test.atlassian.net',
      JIRA_EMAIL: 'test@example.com',
      JIRA_API_TOKEN: 'test-token'
    };

    // Should not throw, should handle error gracefully
    expect(() => {
      const createClaudeCodeConfig = (setup as any).createClaudeCodeConfig.bind(setup);
      createClaudeCodeConfig(testConfig);
    }).not.toThrow();

    // Restore original functions
    (fs as any).writeFileSync = originalWriteFileSync;
    (fs as any).existsSync = originalExistsSync;
  });
});
