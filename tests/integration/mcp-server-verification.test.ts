/**
 * Integration Tests for MCP Server Verification
 * Tests MCP server connectivity and initialization
 */

import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { JiraMcpSetup } from '../../src/setup.js';

describe('MCP Server Verification', () => {
  let setup: JiraMcpSetup;

  beforeEach(() => {
    setup = new JiraMcpSetup();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should verify MCP server starts successfully', async () => {
    const testConfig = {
      JIRA_BASE_URL: 'https://test.atlassian.net',
      JIRA_EMAIL: 'test@example.com',
      JIRA_API_TOKEN: 'test-token',
      JIRA_PROJECT_KEY: 'TEST'
    };

    // Mock child_process.spawn to simulate successful MCP server start
    const mockSpawn = jest.fn();
    const mockProcess = {
      stdout: {
        on: jest.fn((event, callback: (data: Buffer) => void) => {
          if (event === 'data') {
            // Simulate MCP protocol output
            setTimeout(() => callback(Buffer.from('{"jsonrpc":"2.0","method":"initialize"}')), 100);
          }
        })
      },
      stderr: {
        on: jest.fn()
      },
      on: jest.fn((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 200);
        }
      }),
      kill: jest.fn()
    };

    mockSpawn.mockReturnValue(mockProcess);

    // Mock dynamic import of child_process
    jest.doMock('child_process', () => ({
      spawn: mockSpawn
    }), { virtual: true });

    const verifyMcpServerConnection = (setup as any).verifyMcpServerConnection.bind(setup);
    const result = await verifyMcpServerConnection(testConfig);

    expect(result).toBe(true);
    expect(mockSpawn).toHaveBeenCalledWith('npx', ['jira-mcp'], expect.objectContaining({
      env: expect.objectContaining({
        JIRA_BASE_URL: testConfig.JIRA_BASE_URL,
        JIRA_EMAIL: testConfig.JIRA_EMAIL,
        JIRA_API_TOKEN: testConfig.JIRA_API_TOKEN,
        JIRA_PROJECT_KEY: testConfig.JIRA_PROJECT_KEY
      }),
      stdio: ['pipe', 'pipe', 'pipe']
    }));
  }, 10000);

  test('should handle MCP server startup failure', async () => {
    const testConfig = {
      JIRA_BASE_URL: 'https://test.atlassian.net',
      JIRA_EMAIL: 'test@example.com',
      JIRA_API_TOKEN: 'test-token'
    };

    // Mock child_process.spawn to simulate server startup failure
    const mockSpawn = jest.fn();
    const mockProcess = {
      stdout: {
        on: jest.fn()
      },
      stderr: {
        on: jest.fn((event, callback: (data: Buffer) => void) => {
          if (event === 'data') {
            setTimeout(() => callback(Buffer.from('Error: JIRA connection failed')), 100);
          }
        })
      },
      on: jest.fn((event, callback: (code: number) => void) => {
        if (event === 'close') {
          setTimeout(() => callback(1), 200); // Exit code 1 indicates failure
        }
      }),
      kill: jest.fn()
    };

    mockSpawn.mockReturnValue(mockProcess);

    jest.doMock('child_process', () => ({
      spawn: mockSpawn
    }), { virtual: true });

    const verifyMcpServerConnection = (setup as any).verifyMcpServerConnection.bind(setup);
    const result = await verifyMcpServerConnection(testConfig);

    expect(result).toBe(false);
  }, 10000);

  test('should handle MCP server timeout as success', async () => {
    const testConfig = {
      JIRA_BASE_URL: 'https://test.atlassian.net',
      JIRA_EMAIL: 'test@example.com',
      JIRA_API_TOKEN: 'test-token'
    };

    // Mock child_process.spawn to simulate timeout
    const mockSpawn = jest.fn();
    const mockProcess = {
      stdout: {
        on: jest.fn() // No data emitted, will timeout
      },
      stderr: {
        on: jest.fn()
      },
      on: jest.fn(), // No close event, will timeout
      kill: jest.fn()
    };

    mockSpawn.mockReturnValue(mockProcess);

    jest.doMock('child_process', () => ({
      spawn: mockSpawn
    }), { virtual: true });

    const verifyMcpServerConnection = (setup as any).verifyMcpServerConnection.bind(setup);
    const result = await verifyMcpServerConnection(testConfig);

    // Timeout should be treated as success for MCP servers
    expect(result).toBe(true);
    expect(mockProcess.kill).toHaveBeenCalled();
  }, 10000);

  test('should detect MCP protocol initialization', async () => {
    const testConfig = {
      JIRA_BASE_URL: 'https://test.atlassian.net',
      JIRA_EMAIL: 'test@example.com',
      JIRA_API_TOKEN: 'test-token'
    };

    const protocolOutputs = [
      '{"jsonrpc":"2.0","method":"initialize"}',
      '{"capabilities":{"tools":[]}}',
      '{"tools":[{"name":"get_jira_ticket"}]}'
    ];

    for (const output of protocolOutputs) {
      const mockSpawn = jest.fn();
      const mockProcess = {
        stdout: {
          on: jest.fn((event, callback: (data: Buffer) => void) => {
            if (event === 'data') {
              setTimeout(() => callback(Buffer.from(output)), 100);
            }
          })
        },
        stderr: {
          on: jest.fn()
        },
        on: jest.fn(),
        kill: jest.fn()
      };

      mockSpawn.mockReturnValue(mockProcess);

      jest.doMock('child_process', () => ({
        spawn: mockSpawn
      }), { virtual: true });

      const verifyMcpServerConnection = (setup as any).verifyMcpServerConnection.bind(setup);
      const result = await verifyMcpServerConnection(testConfig);

      expect(result).toBe(true);
      expect(mockProcess.kill).toHaveBeenCalled();
    }
  }, 15000);

  test('should handle spawn errors gracefully', async () => {
    const testConfig = {
      JIRA_BASE_URL: 'https://test.atlassian.net',
      JIRA_EMAIL: 'test@example.com',
      JIRA_API_TOKEN: 'test-token'
    };

    // Mock child_process.spawn to simulate spawn error
    const mockSpawn = jest.fn();
    const mockProcess = {
      stdout: {
        on: jest.fn()
      },
      stderr: {
        on: jest.fn()
      },
      on: jest.fn((event, callback: (error: Error) => void) => {
        if (event === 'error') {
          setTimeout(() => callback(new Error('ENOENT: command not found')), 100);
        }
      }),
      kill: jest.fn()
    };

    mockSpawn.mockReturnValue(mockProcess);

    jest.doMock('child_process', () => ({
      spawn: mockSpawn
    }), { virtual: true });

    const verifyMcpServerConnection = (setup as any).verifyMcpServerConnection.bind(setup);
    const result = await verifyMcpServerConnection(testConfig);

    expect(result).toBe(false);
  }, 10000);

  test('should pass environment variables to MCP server process', async () => {
    const testConfig = {
      JIRA_BASE_URL: 'https://custom.atlassian.net',
      JIRA_EMAIL: 'custom@example.com',
      JIRA_API_TOKEN: 'custom-token',
      JIRA_PROJECT_KEY: 'CUSTOM'
    };

    const mockSpawn = jest.fn();
    const mockProcess = {
      stdout: {
        on: jest.fn((event, callback: (data: Buffer) => void) => {
          if (event === 'data') {
            setTimeout(() => callback(Buffer.from('{"jsonrpc":"2.0"}')), 100);
          }
        })
      },
      stderr: {
        on: jest.fn()
      },
      on: jest.fn(),
      kill: jest.fn()
    };

    mockSpawn.mockReturnValue(mockProcess);

    jest.doMock('child_process', () => ({
      spawn: mockSpawn
    }), { virtual: true });

    const verifyMcpServerConnection = (setup as any).verifyMcpServerConnection.bind(setup);
    await verifyMcpServerConnection(testConfig);

    expect(mockSpawn).toHaveBeenCalledWith('npx', ['jira-mcp'], {
      env: expect.objectContaining({
        JIRA_BASE_URL: 'https://custom.atlassian.net',
        JIRA_EMAIL: 'custom@example.com',
        JIRA_API_TOKEN: 'custom-token',
        JIRA_PROJECT_KEY: 'CUSTOM'
      }),
      stdio: ['pipe', 'pipe', 'pipe']
    });
  }, 10000);

  test('should handle missing optional project key', async () => {
    const testConfig = {
      JIRA_BASE_URL: 'https://test.atlassian.net',
      JIRA_EMAIL: 'test@example.com',
      JIRA_API_TOKEN: 'test-token'
      // No JIRA_PROJECT_KEY
    };

    const mockSpawn = jest.fn();
    const mockProcess = {
      stdout: {
        on: jest.fn((event, callback: (data: Buffer) => void) => {
          if (event === 'data') {
            setTimeout(() => callback(Buffer.from('{"jsonrpc":"2.0"}')), 100);
          }
        })
      },
      stderr: {
        on: jest.fn()
      },
      on: jest.fn(),
      kill: jest.fn()
    };

    mockSpawn.mockReturnValue(mockProcess);

    jest.doMock('child_process', () => ({
      spawn: mockSpawn
    }), { virtual: true });

    const verifyMcpServerConnection = (setup as any).verifyMcpServerConnection.bind(setup);
    const result = await verifyMcpServerConnection(testConfig);

    expect(result).toBe(true);
    expect(mockSpawn).toHaveBeenCalledWith('npx', ['jira-mcp'], {
      env: expect.objectContaining({
        JIRA_PROJECT_KEY: ''
      }),
      stdio: ['pipe', 'pipe', 'pipe']
    });
  }, 10000);
});
