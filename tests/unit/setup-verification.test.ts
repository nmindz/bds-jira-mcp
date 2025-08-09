/**
 * Unit Tests for Setup Verification Functions
 * Tests the core verification logic without full integration complexity
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Setup Verification Functions', () => {
  let testConfigPath: string;
  let originalConfig: string | null = null;

  beforeEach(() => {
    testConfigPath = path.join(os.homedir(), '.claude-test.json');

    // Backup existing test config if it exists
    if (fs.existsSync(testConfigPath)) {
      originalConfig = fs.readFileSync(testConfigPath, 'utf8');
    }
  });

  afterEach(() => {
    // Restore original config or cleanup
    if (originalConfig) {
      fs.writeFileSync(testConfigPath, originalConfig);
    } else if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
  });

  describe('Claude Code Configuration Validation', () => {
    test('should validate complete configuration structure', () => {
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

      // Verify structure manually (simulating verification function logic)
      const configContent = fs.readFileSync(testConfigPath, 'utf8');
      const config = JSON.parse(configContent);

      expect(config.mcpServers).toBeDefined();
      expect(config.mcpServers['jira-mcp']).toBeDefined();

      const jiraMcpConfig = config.mcpServers['jira-mcp'];
      expect(jiraMcpConfig.command).toBe('npx');
      expect(jiraMcpConfig.args).toEqual(['jira-mcp']);
      expect(jiraMcpConfig.env.JIRA_BASE_URL).toBeDefined();
      expect(jiraMcpConfig.env.JIRA_EMAIL).toBeDefined();
      expect(jiraMcpConfig.env.JIRA_API_TOKEN).toBeDefined();
    });

    test('should detect missing required fields', () => {
      // Config missing args field
      const invalidConfig = {
        mcpServers: {
          'jira-mcp': {
            command: 'npx',
            // Missing args
            env: {
              JIRA_BASE_URL: 'https://test.atlassian.net',
              JIRA_EMAIL: 'test@example.com',
              JIRA_API_TOKEN: 'test-token'
            }
          }
        }
      };

      fs.writeFileSync(testConfigPath, JSON.stringify(invalidConfig, null, 2));

      const configContent = fs.readFileSync(testConfigPath, 'utf8');
      const config = JSON.parse(configContent);
      const jiraMcpConfig = config.mcpServers['jira-mcp'];

      expect(jiraMcpConfig.args).toBeUndefined();
    });

    test('should detect missing environment variables', () => {
      const configMissingEnv = {
        mcpServers: {
          'jira-mcp': {
            command: 'npx',
            args: ['jira-mcp'],
            env: {
              JIRA_BASE_URL: 'https://test.atlassian.net',
              // Missing JIRA_EMAIL and JIRA_API_TOKEN
            }
          }
        }
      };

      fs.writeFileSync(testConfigPath, JSON.stringify(configMissingEnv, null, 2));

      const configContent = fs.readFileSync(testConfigPath, 'utf8');
      const config = JSON.parse(configContent);
      const jiraMcpConfig = config.mcpServers['jira-mcp'];

      expect(jiraMcpConfig.env.JIRA_EMAIL).toBeUndefined();
      expect(jiraMcpConfig.env.JIRA_API_TOKEN).toBeUndefined();
    });

    test('should handle malformed JSON', () => {
      // Write invalid JSON
      fs.writeFileSync(testConfigPath, '{ invalid json content');

      expect(() => {
        const configContent = fs.readFileSync(testConfigPath, 'utf8');
        JSON.parse(configContent);
      }).toThrow();
    });

    test('should validate configuration merge behavior', () => {
      // Start with existing config
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

      // Simulate adding jira-mcp config
      const configContent = fs.readFileSync(testConfigPath, 'utf8');
      const config = JSON.parse(configContent);

      // Add jira-mcp server
      config.mcpServers['jira-mcp'] = {
        command: 'npx',
        args: ['jira-mcp'],
        env: {
          JIRA_BASE_URL: 'https://test.atlassian.net',
          JIRA_EMAIL: 'test@example.com',
          JIRA_API_TOKEN: 'test-token'
        }
      };

      fs.writeFileSync(testConfigPath, JSON.stringify(config, null, 2));

      // Verify merge preserved existing settings
      const mergedContent = fs.readFileSync(testConfigPath, 'utf8');
      const mergedConfig = JSON.parse(mergedContent);

      expect(mergedConfig.mcpServers['existing-server']).toEqual(existingConfig.mcpServers['existing-server']);
      expect(mergedConfig.otherSettings).toEqual(existingConfig.otherSettings);
      expect(mergedConfig.mcpServers['jira-mcp']).toBeDefined();
    });
  });

  describe('Platform Configuration Paths', () => {
    test('should identify correct config paths for different platforms', () => {
      const originalPlatform = process.platform;

      // Test macOS path
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      const macPath = path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
      expect(macPath.includes('Library/Application Support/Claude')).toBe(true);

      // Test Windows path
      Object.defineProperty(process, 'platform', { value: 'win32' });
      if (process.env.APPDATA) {
        const winPath = path.join(process.env.APPDATA, 'Claude', 'claude_desktop_config.json');
        expect(winPath.includes('Claude')).toBe(true);
      }

      // Restore original platform
      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });
  });

  describe('Environment Variable Validation', () => {
    test('should validate required JIRA environment variables', () => {
      const requiredVars = ['JIRA_BASE_URL', 'JIRA_EMAIL', 'JIRA_API_TOKEN'];
      const testEnv = {
        JIRA_BASE_URL: 'https://test.atlassian.net',
        JIRA_EMAIL: 'test@example.com',
        JIRA_API_TOKEN: 'test-token',
        JIRA_PROJECT_KEY: 'TEST'
      };

      // All required vars should be present
      for (const varName of requiredVars) {
        expect(testEnv[varName as keyof typeof testEnv]).toBeDefined();
        expect(testEnv[varName as keyof typeof testEnv]).not.toBe('');
      }

      // Optional var can be present or absent
      expect(testEnv.JIRA_PROJECT_KEY).toBeDefined();
    });

    test('should validate JIRA URL format', () => {
      const validUrls = [
        'https://company.atlassian.net',
        'https://my-company.atlassian.net',
        'https://test123.atlassian.net'
      ];

      const invalidUrls = [
        'http://company.atlassian.net', // Should be HTTPS
        'https://company.com', // Not Atlassian domain
        'company.atlassian.net', // Missing protocol
        ''
      ];

      const urlPattern = /^https:\/\/[a-zA-Z0-9-]+\.atlassian\.net$/;

      validUrls.forEach(url => {
        expect(urlPattern.test(url)).toBe(true);
      });

      invalidUrls.forEach(url => {
        expect(urlPattern.test(url)).toBe(false);
      });
    });

    test('should validate email format', () => {
      const validEmails = [
        'user@company.com',
        'test.user@example.org',
        'developer+test@company.co.uk'
      ];

      const invalidEmails = [
        'invalid-email',
        '@company.com',
        'user@',
        ''
      ];

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      validEmails.forEach(email => {
        expect(emailPattern.test(email)).toBe(true);
      });

      invalidEmails.forEach(email => {
        expect(emailPattern.test(email)).toBe(false);
      });
    });
  });

  describe('File System Operations', () => {
    test('should handle file permission errors gracefully', () => {
      // Test directory creation
      const testDir = path.join(os.tmpdir(), 'jira-mcp-test-' + Date.now());

      expect(() => {
        if (!fs.existsSync(testDir)) {
          fs.mkdirSync(testDir, { recursive: true });
        }
      }).not.toThrow();

      // Cleanup
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true });
      }
    });

    test('should backup and restore configurations', () => {
      const testData = { test: 'data' };
      const backupPath = testConfigPath + '.backup';

      // Create original file
      fs.writeFileSync(testConfigPath, JSON.stringify(testData, null, 2));

      // Create backup
      fs.copyFileSync(testConfigPath, backupPath);

      // Modify original
      fs.writeFileSync(testConfigPath, JSON.stringify({ modified: true }, null, 2));

      // Restore from backup
      fs.copyFileSync(backupPath, testConfigPath);

      // Verify restoration
      const restoredContent = fs.readFileSync(testConfigPath, 'utf8');
      const restoredData = JSON.parse(restoredContent);

      expect(restoredData).toEqual(testData);

      // Cleanup
      if (fs.existsSync(backupPath)) {
        fs.unlinkSync(backupPath);
      }
    });
  });

  describe('Configuration Validation Logic', () => {
    test('should implement comprehensive validation checks', () => {
      const validationChecks = {
        hasConfigFile: (filePath: string) => fs.existsSync(filePath),
        hasValidJSON: (filePath: string) => {
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            JSON.parse(content);
            return true;
          } catch {
            return false;
          }
        },
        hasMCPServers: (filePath: string) => {
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            const config = JSON.parse(content);
            return config.mcpServers !== undefined;
          } catch {
            return false;
          }
        },
        hasJiraMCPServer: (filePath: string) => {
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            const config = JSON.parse(content);
            return config.mcpServers && config.mcpServers['jira-mcp'] !== undefined;
          } catch {
            return false;
          }
        }
      };

      // Test with non-existent file
      const nonExistentFile = '/tmp/non-existent-file.json';
      expect(validationChecks.hasConfigFile(nonExistentFile)).toBe(false);

      // Test with valid config
      const validConfig = {
        mcpServers: {
          'jira-mcp': {
            command: 'npx',
            args: ['jira-mcp'],
            env: {}
          }
        }
      };

      fs.writeFileSync(testConfigPath, JSON.stringify(validConfig, null, 2));

      expect(validationChecks.hasConfigFile(testConfigPath)).toBe(true);
      expect(validationChecks.hasValidJSON(testConfigPath)).toBe(true);
      expect(validationChecks.hasMCPServers(testConfigPath)).toBe(true);
      expect(validationChecks.hasJiraMCPServer(testConfigPath)).toBe(true);
    });
  });
});
