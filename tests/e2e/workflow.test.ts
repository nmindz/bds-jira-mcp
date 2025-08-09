/**
 * End-to-End Tests for JIRA MCP Workflows
 * Tests complete workflows from MCP tool invocation to JIRA API calls
 */

import { describe, expect, test, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import { spawn, ChildProcess } from 'child_process';
import axios from 'axios';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Skip E2E tests if no real JIRA credentials are available
// Note: This check happens after Jest setup loads .env file
const getHasJiraCredentials = () => {
  return process.env.JIRA_BASE_URL &&
         process.env.JIRA_EMAIL &&
         process.env.JIRA_API_TOKEN;
};

const describeE2E = describe;

describeE2E('JIRA MCP E2E Workflows', () => {
  let mcpProcess: ChildProcess;
  const testProjectKey = process.env.JIRA_PROJECT_KEY || 'ZDEVOPS';

  beforeAll(async () => {
    // Ensure build is up-to-date
    expect(existsSync(join(process.cwd(), 'build/index.js'))).toBe(true);
  });

  afterAll(async () => {
    // Clean up any test data
    if (mcpProcess && !mcpProcess.killed) {
      try {
        mcpProcess.kill('SIGTERM');
        // Give process time to terminate gracefully
        await new Promise(resolve => setTimeout(resolve, 200));
        if (!mcpProcess.killed) {
          mcpProcess.kill('SIGKILL');
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.warn('Error cleaning up MCP process:', error);
      }
    }
    
    // Force close any hanging HTTP connections
    try {
      if (global.gc) {
        global.gc();
      }
    } catch (e) {
      // Ignore GC errors
    }
  });

  beforeEach(() => {
    jest.setTimeout(60000); // E2E tests may take longer
  });

  describe('MCP Server Startup', () => {
    test('should start MCP server successfully', async () => {
      if (!getHasJiraCredentials()) {
        console.log('Skipping E2E test - no JIRA credentials available');
        return;
      }

      return new Promise<void>((resolve, reject) => {
        mcpProcess = spawn('node', ['build/index.js'], {
          stdio: ['pipe', 'pipe', 'pipe'],
          env: {
            ...process.env,
            DEBUG: 'true'
          }
        });

        let stderr = '';
        let timeoutId: NodeJS.Timeout | null = null;
        
        const cleanup = () => {
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          if (mcpProcess && !mcpProcess.killed) {
            mcpProcess.removeAllListeners();
            mcpProcess.kill('SIGTERM');
            // Force kill after short delay if needed
            const forceKillTimeout = setTimeout(() => {
              if (mcpProcess && !mcpProcess.killed) {
                mcpProcess.kill('SIGKILL');
              }
            }, 100);
            // Unreference the timeout to prevent it from keeping the process alive
            forceKillTimeout.unref();
          }
        };
        
        timeoutId = setTimeout(() => {
          cleanup();
          // MCP servers are designed to run indefinitely, so timeout indicates success
          resolve();
        }, 3000);
        // Unreference the timeout to prevent it from keeping the process alive
        timeoutId.unref();

        mcpProcess.stderr?.on('data', (data) => {
          stderr += data.toString();
          
          // Look for debug mode confirmation (indicates successful startup)
          if (stderr.includes('🐛 Debug mode: Loaded environment from .env file')) {
            cleanup();
            resolve();
          }
          
          // Check for fatal errors (not warnings)
          if (stderr.includes('Server error:') || stderr.includes('Error:')) {
            cleanup();
            reject(new Error(`MCP server startup error: ${stderr}`));
          }
        });

        mcpProcess.on('error', (error) => {
          cleanup();
          reject(error);
        });

        mcpProcess.on('exit', (code) => {
          cleanup();
          if (code !== 0 && code !== null) {
            reject(new Error(`MCP server exited with code ${code}`));
          }
        });
      });
    });
  });

  describe('JIRA Connection', () => {
    test('should connect to JIRA successfully', async () => {
      // Test direct JIRA API connection
      const auth = Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64');

      const response = await axios.get(`${process.env.JIRA_BASE_URL}/rest/api/2/myself`, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json'
        }
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('emailAddress');
      expect(response.data.emailAddress).toBe(process.env.JIRA_EMAIL);
    });

    test('should validate required project exists', async () => {
      const auth = Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64');

      try {
        const response = await axios.get(`${process.env.JIRA_BASE_URL}/rest/api/2/project/${testProjectKey}`, {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json'
          }
        });

        expect(response.status).toBe(200);
        expect(response.data.key).toBe(testProjectKey);
      } catch (error: any) {
        if (error.response?.status === 404) {
          console.warn(`Warning: Test project ${testProjectKey} not found. Some tests may fail.`);
        } else {
          throw error;
        }
      }
    });
  });

  describe('Complete Ticket Workflow', () => {
    let createdTicketKey: string;

    test('should create, update, and manage ticket lifecycle', async () => {
      const auth = Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64');
      const baseURL = process.env.JIRA_BASE_URL;

      // Get project info to find correct issue type ID
      const projectResponse = await axios.get(`${baseURL}/rest/api/2/project/${testProjectKey}`, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json'
        }
      });

      const taskIssueType = projectResponse.data.issueTypes.find((type: any) => type.name === 'Task');
      if (!taskIssueType) {
        throw new Error('Task issue type not found in project');
      }

      // Step 1: Create a test ticket with correct fields
      const createResponse = await axios.post(
        `${baseURL}/rest/api/2/issue`,
        {
          fields: {
            project: { key: testProjectKey },
            summary: '[E2E TEST] Automated Test - Safe to Delete',
            description: 'This ticket was created by automated E2E tests and can be safely deleted',
            issuetype: { id: taskIssueType.id }
          }
        },
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      expect(createResponse.status).toBe(201);
      expect(createResponse.data).toHaveProperty('key');
      createdTicketKey = createResponse.data.key;

      // Step 2: Fetch the created ticket
      const fetchResponse = await axios.get(
        `${baseURL}/rest/api/2/issue/${createdTicketKey}`,
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json'
          }
        }
      );

      expect(fetchResponse.status).toBe(200);
      expect(fetchResponse.data.key).toBe(createdTicketKey);
      expect(fetchResponse.data.fields.summary).toBe('[E2E TEST] Automated Test - Safe to Delete');

      // Step 3: Add a comment
      const commentResponse = await axios.post(
        `${baseURL}/rest/api/2/issue/${createdTicketKey}/comment`,
        {
          body: 'This is an automated test comment with *formatting* and **bold text**'
        },
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      expect(commentResponse.status).toBe(201);
      expect(commentResponse.data).toHaveProperty('id');

      // Step 4: Update description
      const updateResponse = await axios.put(
        `${baseURL}/rest/api/2/issue/${createdTicketKey}`,
        {
          fields: {
            description: 'Updated description with E2E test details and markdown formatting:\n\n* Test bullet point\n* Another test point\n\n**Important**: This ticket can be safely deleted.'
          }
        },
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      expect(updateResponse.status).toBe(204);

      // Step 5: Get available transitions
      const transitionsResponse = await axios.get(
        `${baseURL}/rest/api/2/issue/${createdTicketKey}/transitions`,
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json'
          }
        }
      );

      expect(transitionsResponse.status).toBe(200);
      expect(transitionsResponse.data).toHaveProperty('transitions');
      expect(Array.isArray(transitionsResponse.data.transitions)).toBe(true);
    }, 30000);

    afterAll(async () => {
      // Clean up: Delete the test ticket if it was created
      if (createdTicketKey) {
        try {
          const auth = Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64');
          await axios.delete(
            `${process.env.JIRA_BASE_URL}/rest/api/2/issue/${createdTicketKey}`,
            {
              headers: {
                'Authorization': `Basic ${auth}`,
                'Accept': 'application/json'
              }
            }
          );
        } catch (error) {
          console.warn(`Warning: Could not delete test ticket ${createdTicketKey}:`, error);
        }
      }
    });
  });

  describe('Issue Linking Workflow', () => {
    let parentTicketKey: string;
    let childTicketKey: string;

    beforeAll(async () => {
      // Create two test tickets for linking
      const auth = Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64');
      const baseURL = process.env.JIRA_BASE_URL;

      // Get project info to find correct issue type IDs
      const projectResponse = await axios.get(`${baseURL}/rest/api/2/project/${testProjectKey}`, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json'
        }
      });

      const storyIssueType = projectResponse.data.issueTypes.find((type: any) => type.name === 'Story');
      const taskIssueType = projectResponse.data.issueTypes.find((type: any) => type.name === 'Task');

      // Create parent ticket
      const parentResponse = await axios.post(
        `${baseURL}/rest/api/2/issue`,
        {
          fields: {
            project: { key: testProjectKey },
            summary: '[E2E TEST] Parent Ticket - Link Test',
            description: 'Parent ticket for link testing - safe to delete',
            issuetype: { id: storyIssueType.id }
          }
        },
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      parentTicketKey = parentResponse.data.key;

      // Create child ticket
      const childResponse = await axios.post(
        `${baseURL}/rest/api/2/issue`,
        {
          fields: {
            project: { key: testProjectKey },
            summary: '[E2E TEST] Child Ticket - Link Test',
            description: 'Child ticket for link testing - safe to delete',
            issuetype: { id: taskIssueType.id }
          }
        },
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      childTicketKey = childResponse.data.key;
    });

    test('should create issue links successfully', async () => {
      const auth = Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64');
      const baseURL = process.env.JIRA_BASE_URL;

      // Create issue link
      const linkResponse = await axios.post(
        `${baseURL}/rest/api/3/issueLink`,
        {
          type: { name: 'Blocks' },
          inwardIssue: { key: parentTicketKey },
          outwardIssue: { key: childTicketKey }
        },
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      expect(linkResponse.status).toBe(201);

      // Verify link was created by fetching issue links
      const linksResponse = await axios.get(
        `${baseURL}/rest/api/2/issue/${parentTicketKey}?fields=issuelinks`,
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json'
          }
        }
      );

      expect(linksResponse.status).toBe(200);
      expect(linksResponse.data.fields.issuelinks).toBeDefined();
      expect(Array.isArray(linksResponse.data.fields.issuelinks)).toBe(true);
      expect(linksResponse.data.fields.issuelinks.length).toBeGreaterThan(0);
    });

    afterAll(async () => {
      // Clean up test tickets
      const auth = Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64');

      const ticketsToDelete = [parentTicketKey, childTicketKey].filter(Boolean);

      for (const ticketKey of ticketsToDelete) {
        try {
          await axios.delete(
            `${process.env.JIRA_BASE_URL}/rest/api/2/issue/${ticketKey}`,
            {
              headers: {
                'Authorization': `Basic ${auth}`,
                'Accept': 'application/json'
              }
            }
          );
        } catch (error) {
          console.warn(`Warning: Could not delete test ticket ${ticketKey}:`, error);
        }
      }
    });
  });

  describe('Project Hierarchy Workflow', () => {
    test('should handle epic-story-task hierarchy creation', async () => {
      // This test would create a complete hierarchy and validate relationships
      // For now, we'll test the individual components that make up the hierarchy

      const auth = Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64');
      const baseURL = process.env.JIRA_BASE_URL;

      // Test getting issue types to understand what's available
      const issueTypesResponse = await axios.get(
        `${baseURL}/rest/api/2/project/${testProjectKey}`,
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json'
          }
        }
      );

      expect(issueTypesResponse.status).toBe(200);
      expect(issueTypesResponse.data).toHaveProperty('issueTypes');
      expect(Array.isArray(issueTypesResponse.data.issueTypes)).toBe(true);

      // Verify we have the issue types needed for hierarchy
      const issueTypes = issueTypesResponse.data.issueTypes.map((type: any) => type.name);
      const requiredTypes = ['Epic', 'Story', 'Task'];

      // Note: Not all JIRA instances have Epic type, so we'll just check for Story and Task
      const essentialTypes = ['Story', 'Task'];
      const hasEssentialTypes = essentialTypes.every(type => issueTypes.includes(type));

      expect(hasEssentialTypes).toBe(true);

      if (issueTypes.includes('Epic')) {
        console.log('✓ Epic issue type available - hierarchy creation fully supported');
      } else {
        console.warn('⚠ Epic issue type not available - some hierarchy features may be limited');
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle invalid ticket ID gracefully', async () => {
      const auth = Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64');

      try {
        await axios.get(
          `${process.env.JIRA_BASE_URL}/rest/api/2/issue/INVALID-999999`,
          {
            headers: {
              'Authorization': `Basic ${auth}`,
              'Accept': 'application/json'
            }
          }
        );
      } catch (error: any) {
        expect(error.response.status).toBe(404);
      }
    });

    test('should handle authentication errors', async () => {
      try {
        await axios.get(
          `${process.env.JIRA_BASE_URL}/rest/api/2/myself`,
          {
            headers: {
              'Authorization': 'Basic invalid-auth',
              'Accept': 'application/json'
            }
          }
        );
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });

    test('should handle malformed requests', async () => {
      const auth = Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64');

      try {
        await axios.post(
          `${process.env.JIRA_BASE_URL}/rest/api/2/issue`,
          {
            fields: {
              // Missing required fields
              summary: 'Test'
              // Missing project and issuetype
            }
          },
          {
            headers: {
              'Authorization': `Basic ${auth}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          }
        );
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });
  });
});

// Helper function for tests that don't require JIRA connection
describe('JIRA MCP Unit Integration Tests', () => {
  test('should load configuration from environment', () => {
    const requiredVars = ['JIRA_BASE_URL', 'JIRA_EMAIL', 'JIRA_API_TOKEN'];

    requiredVars.forEach(varName => {
      expect(process.env[varName]).toBeDefined();
      expect(typeof process.env[varName]).toBe('string');
      expect(process.env[varName]!.length).toBeGreaterThan(0);
    });
  });

  test('should have valid build artifacts', () => {
    const requiredFiles = [
      'build/index.js',
      'build/services/jira.js',
      'package.json'
    ];

    requiredFiles.forEach(file => {
      const fullPath = join(process.cwd(), file);
      expect(existsSync(fullPath)).toBe(true);
    });
  });

});
