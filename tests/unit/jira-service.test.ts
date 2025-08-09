/**
 * JIRA Service Unit Tests
 * Tests for the JiraService class functionality
 */

import { describe, expect, test, jest, beforeEach } from '@jest/globals';

// Mock axios
jest.mock('axios', () => ({
  default: {
    create: jest.fn(() => ({
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn()
    }))
  }
}));

describe('JIRA Service', () => {
  let JiraService: any;
  
  beforeEach(async () => {
    // Set up mock environment variables
    process.env.JIRA_BASE_URL = 'https://test.atlassian.net';
    process.env.JIRA_EMAIL = 'test@example.com';
    process.env.JIRA_API_TOKEN = 'test-token';
    process.env.JIRA_PROJECT_KEY = 'TEST';
    
    // Import the service
    const serviceModule = await import('../../src/services/jira.js');
    JiraService = serviceModule.JiraService;
  });

  test('should initialize JiraService class', () => {
    const service = new JiraService();
    expect(service).toBeDefined();
    expect(service.constructor.name).toBe('JiraService');
  });


  test('should have expected public methods', () => {
    const service = new JiraService();
    
    // Check that expected methods exist
    expect(typeof service.getTicket).toBe('function');
    expect(typeof service.createTicket).toBe('function');
    expect(typeof service.addComment).toBe('function');
    expect(typeof service.linkIssues).toBe('function');
    expect(typeof service.setEpicLink).toBe('function');
    expect(typeof service.getIssueLinks).toBe('function');
    expect(typeof service.createProjectHierarchy).toBe('function');
    expect(typeof service.validateProjectStructure).toBe('function');
    expect(typeof service.updateTicketDescription).toBe('function');
    expect(typeof service.updateTicketStatus).toBe('function');
    expect(typeof service.getAvailableTransitions).toBe('function');
    expect(typeof service.updateAllStoryStatuses).toBe('function');
    expect(typeof service.analyzeStoryStatus).toBe('function');
  });



  test('should handle project key configuration', () => {
    process.env.JIRA_PROJECT_KEY = 'MYPROJECT';
    
    const service = new JiraService();
    expect(service).toBeDefined();
    
    // Clean up
    delete process.env.JIRA_PROJECT_KEY;
    
    const serviceWithoutProject = new JiraService();
    expect(serviceWithoutProject).toBeDefined();
  });
});
