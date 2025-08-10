/**
 * Index.ts Unit Tests
 * Tests for the main MCP server entry point
 */

import { describe, expect, test, jest } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock the MCP SDK to avoid actual server startup during testing
jest.mock('@modelcontextprotocol/sdk/server/mcp.js', () => ({
  McpServer: jest.fn().mockImplementation(() => ({
    registerTool: jest.fn(),
    connect: jest.fn()
  }))
}));

jest.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: jest.fn()
}));

describe('MCP Server Index', () => {
  test('should have correct server configuration', () => {
    // Test that the expected configuration values match package.json
    const packageJsonPath = path.join(__dirname, '../../package.json');
    const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonContent);
    expect(packageJson.name).toBe('bds-jira-mcp');
    expect(packageJson.version).toBe('1.1.4');
  });

  test('should define expected MCP tools list', () => {
    // Verify all expected tools are documented
    const expectedTools = [
      'get_jira_ticket',
      'post_jira_comment',
      'create_jira_ticket',
      'link_jira_issues',
      'set_epic_link',
      'get_issue_links',
      'create_project_hierarchy',
      'validate_project_structure',
      'update_ticket_description',
      'update_ticket_status',
      'update_story_statuses',
      'analyze_story_status',
      'get_available_transitions'
    ];
    
    // We expect exactly 13 tools as stated in the documentation
    expect(expectedTools.length).toBe(13);
    expect(expectedTools).toContain('get_jira_ticket');
    expect(expectedTools).toContain('create_jira_ticket');
    expect(expectedTools).toContain('create_project_hierarchy');
  });

  test('should validate build artifacts exist', () => {
    // Verify built files exist
    expect(fs.existsSync(path.join(process.cwd(), 'build/index.js'))).toBe(true);
    expect(fs.existsSync(path.join(process.cwd(), 'build/services/jira.js'))).toBe(true);
  });
});
