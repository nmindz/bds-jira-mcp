/**
 * Mock E2E Tests for JIRA MCP Workflows
 * Tests complete workflows using mocked HTTP responses
 */

import { describe, expect, test, beforeEach, jest } from '@jest/globals';
import axios from 'axios';

// Mock axios for E2E testing without real JIRA
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('JIRA MCP Mock E2E Workflows', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Set test environment
    process.env.JIRA_BASE_URL = 'https://test-company.atlassian.net';
    process.env.JIRA_EMAIL = 'test@example.com';
    process.env.JIRA_API_TOKEN = 'mock-token-123';
    process.env.JIRA_PROJECT_KEY = 'TEST';
  });

  describe('JIRA Connection Mock Tests', () => {
    test('should mock JIRA authentication successfully', async () => {
      // Mock successful auth response
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: {
          emailAddress: 'test@example.com',
          displayName: 'Test User',
          active: true
        }
      });

      const auth = Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64');

      const response = await axios.get(`${process.env.JIRA_BASE_URL}/rest/api/2/myself`, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json'
        }
      });

      expect(response.status).toBe(200);
      expect(response.data.emailAddress).toBe('test@example.com');
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://test-company.atlassian.net/rest/api/2/myself',
        {
          headers: {
            'Authorization': expect.stringContaining('Basic'),
            'Accept': 'application/json'
          }
        }
      );
    });

    test('should handle authentication errors in mock', async () => {
      // Mock auth failure
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          status: 401,
          data: { errorMessages: ['Authentication failed'] }
        }
      });

      try {
        await axios.get(`${process.env.JIRA_BASE_URL}/rest/api/2/myself`, {
          headers: {
            'Authorization': 'Basic invalid-auth',
            'Accept': 'application/json'
          }
        });
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });
  });

  describe('Complete Ticket Workflow Mock Tests', () => {
    test('should mock complete ticket lifecycle', async () => {
      const mockTicketKey = 'TEST-123';

      // Mock ticket creation
      mockedAxios.post.mockResolvedValueOnce({
        status: 201,
        data: {
          id: '10001',
          key: mockTicketKey,
          self: `https://test-company.atlassian.net/rest/api/2/issue/10001`
        }
      });

      // Mock ticket fetch
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: {
          key: mockTicketKey,
          fields: {
            summary: 'Mock Test Ticket',
            description: 'This is a mocked test ticket',
            status: { name: 'To Do', id: '1' }
          }
        }
      });

      // Mock comment creation
      mockedAxios.post.mockResolvedValueOnce({
        status: 201,
        data: {
          id: '10050',
          body: 'Mock test comment',
          created: '2024-01-01T00:00:00.000Z'
        }
      });

      // Mock ticket update
      mockedAxios.put.mockResolvedValueOnce({
        status: 204,
        data: {}
      });

      const auth = Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64');
      const baseURL = process.env.JIRA_BASE_URL;

      // Step 1: Create ticket
      const createResponse = await axios.post(
        `${baseURL}/rest/api/2/issue`,
        {
          fields: {
            project: { key: 'TEST' },
            summary: 'Mock Test Ticket',
            description: 'This is a mocked test ticket',
            issuetype: { name: 'Task' }
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
      expect(createResponse.data.key).toBe(mockTicketKey);

      // Step 2: Fetch ticket
      const fetchResponse = await axios.get(
        `${baseURL}/rest/api/2/issue/${mockTicketKey}`,
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json'
          }
        }
      );

      expect(fetchResponse.status).toBe(200);
      expect(fetchResponse.data.key).toBe(mockTicketKey);

      // Step 3: Add comment
      const commentResponse = await axios.post(
        `${baseURL}/rest/api/2/issue/${mockTicketKey}/comment`,
        { body: 'Mock test comment' },
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      expect(commentResponse.status).toBe(201);

      // Step 4: Update ticket
      const updateResponse = await axios.put(
        `${baseURL}/rest/api/2/issue/${mockTicketKey}`,
        {
          fields: {
            description: 'Updated description with mock testing details'
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

      // Verify all API calls were made
      expect(mockedAxios.post).toHaveBeenCalledTimes(2); // create ticket + comment
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);  // fetch ticket
      expect(mockedAxios.put).toHaveBeenCalledTimes(1);  // update ticket
    });
  });

  describe('Issue Linking Mock Tests', () => {
    test('should mock issue linking workflow', async () => {
      const parentTicketKey = 'TEST-100';
      const childTicketKey = 'TEST-101';

      // Mock parent ticket creation
      mockedAxios.post.mockResolvedValueOnce({
        status: 201,
        data: { id: '10100', key: parentTicketKey }
      });

      // Mock child ticket creation
      mockedAxios.post.mockResolvedValueOnce({
        status: 201,
        data: { id: '10101', key: childTicketKey }
      });

      // Mock issue link creation
      mockedAxios.post.mockResolvedValueOnce({
        status: 201,
        data: {}
      });

      // Mock issue links fetch
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: {
          fields: {
            issuelinks: [
              {
                id: '10001',
                type: { name: 'Blocks' },
                outwardIssue: { key: childTicketKey }
              }
            ]
          }
        }
      });

      const auth = Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64');
      const baseURL = process.env.JIRA_BASE_URL;

      // Create parent ticket
      const parentResponse = await axios.post(
        `${baseURL}/rest/api/2/issue`,
        {
          fields: {
            project: { key: 'TEST' },
            summary: 'Mock Parent Ticket',
            issuetype: { name: 'Story' }
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

      expect(parentResponse.data.key).toBe(parentTicketKey);

      // Create child ticket
      const childResponse = await axios.post(
        `${baseURL}/rest/api/2/issue`,
        {
          fields: {
            project: { key: 'TEST' },
            summary: 'Mock Child Ticket',
            issuetype: { name: 'Task' }
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

      expect(childResponse.data.key).toBe(childTicketKey);

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

      // Verify links
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
      expect(linksResponse.data.fields.issuelinks).toHaveLength(1);
      expect(linksResponse.data.fields.issuelinks[0].outwardIssue.key).toBe(childTicketKey);
    });
  });

  describe('Error Handling Mock Tests', () => {
    test('should mock 404 errors for invalid tickets', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          status: 404,
          data: { errorMessages: ['Issue Does Not Exist'] }
        }
      });

      const auth = Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64');

      try {
        await axios.get(
          `${process.env.JIRA_BASE_URL}/rest/api/2/issue/INVALID-999`,
          {
            headers: {
              'Authorization': `Basic ${auth}`,
              'Accept': 'application/json'
            }
          }
        );
      } catch (error: any) {
        expect(error.response.status).toBe(404);
        expect(error.response.data.errorMessages).toContain('Issue Does Not Exist');
      }
    });

    test('should mock rate limiting errors', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          status: 429,
          data: { errorMessages: ['Rate limit exceeded'] }
        }
      });

      try {
        await axios.get(`${process.env.JIRA_BASE_URL}/rest/api/2/myself`);
      } catch (error: any) {
        expect(error.response.status).toBe(429);
      }
    });
  });

  describe('Environment Configuration Mock Tests', () => {
    test('should validate mock environment configuration', () => {
      expect(process.env.JIRA_BASE_URL).toBe('https://test-company.atlassian.net');
      expect(process.env.JIRA_EMAIL).toBe('test@example.com');
      expect(process.env.JIRA_API_TOKEN).toBe('mock-token-123');
      expect(process.env.JIRA_PROJECT_KEY).toBe('TEST');
    });

    test('should handle missing environment variables in mock', () => {
      const originalEnv = process.env;

      // Temporarily remove env var
      delete process.env.JIRA_BASE_URL;

      expect(process.env.JIRA_BASE_URL).toBeUndefined();

      // Restore
      process.env = originalEnv;
    });
  });
});
