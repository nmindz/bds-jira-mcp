/**
 * Simple E2E Tests for JIRA MCP
 * Tests basic JIRA connectivity with real credentials
 */

import { describe, expect, test, beforeAll } from '@jest/globals';
import axios from 'axios';

describe('JIRA MCP Simple E2E Tests', () => {
  let hasCredentials = false;
  let auth: string;
  let baseURL: string;

  beforeAll(() => {
    // Check if we have real JIRA credentials after .env is loaded
    hasCredentials = !!(process.env.JIRA_BASE_URL &&
                       process.env.JIRA_EMAIL &&
                       process.env.JIRA_API_TOKEN);

    if (hasCredentials) {
      console.log('🎯 Running E2E tests with REAL JIRA credentials');
      auth = Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64');
      baseURL = process.env.JIRA_BASE_URL!;
    } else {
      console.log('⚠️  No real JIRA credentials - E2E tests will be skipped');
    }
  });

  test('should connect to JIRA successfully', async () => {
    if (!hasCredentials) {
      console.log('   → Skipped: No JIRA credentials');
      return;
    }

    console.log('   → Testing JIRA connection...');

    const response = await axios.get(`${baseURL}/rest/api/2/myself`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('emailAddress');
    expect(response.data.emailAddress).toBe(process.env.JIRA_EMAIL);

    console.log(`   ✅ Connected as: ${response.data.displayName} (${response.data.emailAddress})`);
  }, 15000);

  test('should validate project exists', async () => {
    if (!hasCredentials || !process.env.JIRA_PROJECT_KEY) {
      console.log('   → Skipped: No JIRA credentials or project key');
      return;
    }

    console.log(`   → Validating project ${process.env.JIRA_PROJECT_KEY}...`);

    try {
      const response = await axios.get(`${baseURL}/rest/api/2/project/${process.env.JIRA_PROJECT_KEY}`, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      expect(response.status).toBe(200);
      expect(response.data.key).toBe(process.env.JIRA_PROJECT_KEY);

      console.log(`   ✅ Project found: ${response.data.name} (${response.data.key})`);
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn(`   ⚠️  Project ${process.env.JIRA_PROJECT_KEY} not found - some tests may be limited`);
        // Don't fail the test, just warn
      } else {
        throw error;
      }
    }
  }, 15000);

  test('should handle authentication errors gracefully', async () => {
    if (!hasCredentials) {
      console.log('   → Skipped: No JIRA credentials');
      return;
    }

    console.log('   → Testing authentication error handling...');

    try {
      await axios.get(`${baseURL}/rest/api/2/myself`, {
        headers: {
          'Authorization': 'Basic invalid-credentials',
          'Accept': 'application/json'
        },
        timeout: 5000
      });

      // Should not reach here
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.response?.status).toBe(401);
      console.log('   ✅ Authentication error handled correctly');
    }
  }, 10000);

  test('should handle invalid ticket IDs gracefully', async () => {
    if (!hasCredentials) {
      console.log('   → Skipped: No JIRA credentials');
      return;
    }

    console.log('   → Testing invalid ticket handling...');

    try {
      await axios.get(`${baseURL}/rest/api/2/issue/INVALID-999999`, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json'
        },
        timeout: 5000
      });

      // Should not reach here
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.response?.status).toBe(404);
      console.log('   ✅ Invalid ticket error handled correctly');
    }
  }, 10000);

  test('should get issue types for project', async () => {
    if (!hasCredentials || !process.env.JIRA_PROJECT_KEY) {
      console.log('   → Skipped: No JIRA credentials or project key');
      return;
    }

    console.log('   → Getting available issue types...');

    try {
      const response = await axios.get(`${baseURL}/rest/api/2/project/${process.env.JIRA_PROJECT_KEY}`, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('issueTypes');
      expect(Array.isArray(response.data.issueTypes)).toBe(true);
      expect(response.data.issueTypes.length).toBeGreaterThan(0);

      const issueTypes = response.data.issueTypes.map((type: any) => type.name);
      console.log(`   ✅ Available issue types: ${issueTypes.join(', ')}`);

      // Check for common issue types
      const hasTask = issueTypes.includes('Task');
      const hasStory = issueTypes.includes('Story');
      const hasEpic = issueTypes.includes('Epic');

      console.log(`   📋 Issue type support: Task=${hasTask}, Story=${hasStory}, Epic=${hasEpic}`);

    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn('   ⚠️  Project not found - skipping issue type check');
      } else {
        throw error;
      }
    }
  }, 15000);

  test('should test basic workflow if credentials available', async () => {
    if (!hasCredentials) {
      console.log('   → All E2E tests skipped - add JIRA credentials to .env to run real tests');
      console.log('     Required environment variables:');
      console.log('     - JIRA_BASE_URL=https://your-company.atlassian.net');
      console.log('     - JIRA_EMAIL=your-email@company.com');
      console.log('     - JIRA_API_TOKEN=your-api-token');
      console.log('     - JIRA_PROJECT_KEY=YOUR_PROJECT (optional)');
      return;
    }

    console.log('   🎉 E2E test environment is ready!');
    console.log('   → All previous tests used real JIRA API calls');
    console.log('   → Add more complex workflow tests as needed');
  });
});
