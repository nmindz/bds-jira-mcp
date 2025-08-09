#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { JiraService } from "./services/jira.js";

// Load dotenv only for local development/debugging
if (process.env.DEBUG === 'true' || process.env.ENVIRONMENT === 'development') {
  try {
    const dotenv = await import('dotenv');
    dotenv.config();
    console.log('🐛 Debug mode: Loaded environment from .env file');
  } catch (error) {
    console.warn('⚠️  Could not load dotenv for debugging');
  }
}

const server = new McpServer(
  {
    name: "jira-mcp",
    version: "1.1.2",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Services will be initialized lazily
let jiraService: JiraService | null = null;

function getJiraService(): JiraService {
  if (!jiraService) {
    jiraService = new JiraService();
  }
  return jiraService;
}

// Register get_jira_ticket tool
server.registerTool(
  "get_jira_ticket",
  {
    title: "Get JIRA Ticket",
    description: "Fetch JIRA ticket details by ID",
    inputSchema: {
      ticketId: z.string().describe("JIRA ticket ID (e.g., PROJ-123)"),
    },
  },
  async ({ ticketId }) => {
    try {
      const ticket = await getJiraService().getTicket(ticketId);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              key: ticket.key,
              summary: ticket.fields.summary,
              description: ticket.fields.description,
              status: ticket.fields.status.name,
              assignee: ticket.fields.assignee?.displayName || "Unassigned",
              issueType: ticket.fields.issuetype.name,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);


// Register post_jira_comment tool
server.registerTool(
  "post_jira_comment",
  {
    title: "Post JIRA Comment",
    description: "Post a comment to a JIRA ticket",
    inputSchema: {
      ticketId: z.string().describe("JIRA ticket ID (e.g., PROJ-123)"),
      comment: z.string().describe("Comment text to post"),
    },
  },
  async ({ ticketId, comment }) => {
    try {
      await getJiraService().addComment(ticketId, comment);

      return {
        content: [
          {
            type: "text",
            text: `Comment posted to ${ticketId}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Register create_jira_ticket tool
server.registerTool(
  "create_jira_ticket",
  {
    title: "Create JIRA Ticket",
    description: "Create a new JIRA ticket in the specified project",
    inputSchema: {
      summary: z.string().describe("Ticket summary/title"),
      description: z.string().optional().describe("Ticket description (optional)"),
      issueType: z.string().default("Task").describe("Issue type (e.g., 'Task', 'Story', 'Bug', 'Epic')"),
      projectKey: z.string().optional().describe("Project key (uses JIRA_PROJECT_KEY env var if not provided)"),
      assignee: z.string().optional().describe("Assignee username (optional)"),
      priority: z.string().optional().describe("Priority (e.g., 'High', 'Medium', 'Low')"),
    },
  },
  async ({ summary, description, issueType = "Task", projectKey, assignee, priority }) => {
    try {
      const ticket = await getJiraService().createTicket({
        summary,
        description,
        issueType,
        projectKey,
        assignee,
        priority,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              key: ticket.key,
              summary: ticket.fields.summary,
              description: ticket.fields.description,
              status: ticket.fields.status.name,
              assignee: ticket.fields.assignee?.displayName || "Unassigned",
              issueType: ticket.fields.issuetype.name,
              url: `${process.env.JIRA_BASE_URL}/browse/${ticket.key}`,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Register link_jira_issues tool
server.registerTool(
  "link_jira_issues",
  {
    title: "Link JIRA Issues",
    description: "Create links between JIRA issues with specified relationship types",
    inputSchema: {
      fromIssue: z.string().describe("Source issue key (e.g., PROJ-123)"),
      toIssue: z.string().describe("Target issue key (e.g., PROJ-124)"),
      linkType: z.string().describe("Link type (e.g., 'blocks', 'relates to', 'depends on', 'duplicates')"),
      comment: z.string().optional().describe("Optional comment for the link"),
    },
  },
  async ({ fromIssue, toIssue, linkType, comment }) => {
    try {
      await getJiraService().linkIssues({ fromIssue, toIssue, linkType, comment });

      return {
        content: [
          {
            type: "text",
            text: `Successfully linked ${fromIssue} to ${toIssue} with relationship "${linkType}"`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Register set_epic_link tool
server.registerTool(
  "set_epic_link",
  {
    title: "Set Epic Link",
    description: "Attribute stories and tasks to parent epics",
    inputSchema: {
      issueKey: z.string().describe("Issue key to link to epic (e.g., PROJ-124)"),
      epicKey: z.string().describe("Epic key (e.g., PROJ-123)"),
    },
  },
  async ({ issueKey, epicKey }) => {
    try {
      await getJiraService().setEpicLink(issueKey, epicKey);

      return {
        content: [
          {
            type: "text",
            text: `Successfully linked ${issueKey} to epic ${epicKey}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Register get_issue_links tool
server.registerTool(
  "get_issue_links",
  {
    title: "Get Issue Links",
    description: "Retrieve existing links for an issue",
    inputSchema: {
      ticketId: z.string().describe("JIRA ticket ID (e.g., PROJ-123)"),
    },
  },
  async ({ ticketId }) => {
    try {
      const links = await getJiraService().getIssueLinks(ticketId);

      const linksSummary = links.map(link => ({
        id: link.id,
        type: link.type.name,
        direction: link.inwardIssue ? 'inward' : 'outward',
        relatedIssue: link.inwardIssue?.key || link.outwardIssue?.key,
        relatedSummary: link.inwardIssue?.fields.summary || link.outwardIssue?.fields.summary,
        relationship: link.inwardIssue ? link.type.inward : link.type.outward,
      }));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              ticket: ticketId,
              links: linksSummary,
              totalLinks: links.length
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Register create_project_hierarchy tool
server.registerTool(
  "create_project_hierarchy",
  {
    title: "Create Project Hierarchy",
    description: "Bulk create epic-story-task hierarchies",
    inputSchema: {
      projectKey: z.string().optional().describe("Project key (uses JIRA_PROJECT_KEY env var if not provided)"),
      hierarchy: z.object({
        epic: z.object({
          summary: z.string().describe("Epic summary"),
          description: z.string().optional().describe("Epic description"),
        }),
        stories: z.array(z.object({
          summary: z.string().describe("Story summary"),
          description: z.string().optional().describe("Story description"),
          tasks: z.array(z.object({
            summary: z.string().describe("Task summary"),
            description: z.string().optional().describe("Task description"),
          })).optional().describe("Tasks for this story"),
        })).describe("Stories in the epic"),
      }).describe("Project hierarchy definition"),
    },
  },
  async ({ projectKey, hierarchy }) => {
    try {
      const result = await getJiraService().createProjectHierarchy(hierarchy, projectKey);

      const summary = {
        epic: {
          key: result.epic.key,
          summary: result.epic.fields.summary,
          url: `${process.env.JIRA_BASE_URL}/browse/${result.epic.key}`,
        },
        stories: result.stories.map(({ story, tasks }) => ({
          key: story.key,
          summary: story.fields.summary,
          url: `${process.env.JIRA_BASE_URL}/browse/${story.key}`,
          tasks: tasks.map(task => ({
            key: task.key,
            summary: task.fields.summary,
            url: `${process.env.JIRA_BASE_URL}/browse/${task.key}`,
          })),
        })),
        totalCreated: 1 + result.stories.length + result.stories.reduce((sum, s) => sum + s.tasks.length, 0),
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(summary, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Register validate_project_structure tool
server.registerTool(
  "validate_project_structure",
  {
    title: "Validate Project Structure",
    description: "Verify hierarchical relationships are correct",
    inputSchema: {
      epicKey: z.string().describe("Epic key to validate (e.g., PROJ-123)"),
    },
  },
  async ({ epicKey }) => {
    try {
      const validation = await getJiraService().validateProjectStructure(epicKey);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              epic: epicKey,
              isValid: validation.isValid,
              status: validation.isValid ? 'Valid project structure' : 'Issues found in project structure',
              issues: validation.issues,
              warnings: validation.warnings,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Register update_ticket_description tool
server.registerTool(
  "update_ticket_description",
  {
    title: "Update Ticket Description",
    description: "Update a JIRA ticket description with proper formatting",
    inputSchema: {
      ticketId: z.string().describe("JIRA ticket ID (e.g., PROJ-123)"),
      description: z.string().describe("New description text (supports markdown that will be converted to JIRA markup)"),
    },
  },
  async ({ ticketId, description }) => {
    try {
      await getJiraService().updateTicketDescription(ticketId, description);

      return {
        content: [
          {
            type: "text",
            text: `Successfully updated description for ${ticketId}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Register update_ticket_status tool
server.registerTool(
  "update_ticket_status",
  {
    title: "Update Ticket Status",
    description: "Update JIRA ticket status using transitions",
    inputSchema: {
      ticketId: z.string().describe("JIRA ticket ID (e.g., PROJ-123)"),
      transitionId: z.string().describe("Transition ID (e.g., '21' for In Progress, '31' for Done)"),
    },
  },
  async ({ ticketId, transitionId }) => {
    try {
      await getJiraService().updateTicketStatus(ticketId, transitionId);

      return {
        content: [
          {
            type: "text",
            text: `Successfully updated status for ${ticketId}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Register update_story_statuses tool
server.registerTool(
  "update_story_statuses",
  {
    title: "Update Story Statuses",
    description: "Update story statuses based on related task completion",
    inputSchema: {
      epicKey: z.string().describe("Epic key to update all stories within (e.g., PROJ-123)"),
    },
  },
  async ({ epicKey }) => {
    try {
      const result = await getJiraService().updateAllStoryStatuses(epicKey);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              summary: `Updated ${result.storiesUpdated} of ${result.storiesChecked} stories`,
              storiesChecked: result.storiesChecked,
              storiesUpdated: result.storiesUpdated,
              updates: result.updates
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Register analyze_story_status tool
server.registerTool(
  "analyze_story_status",
  {
    title: "Analyze Story Status",
    description: "Analyze a story's status based on related task completion",
    inputSchema: {
      storyKey: z.string().describe("Story key to analyze (e.g., PROJ-123)"),
    },
  },
  async ({ storyKey }) => {
    try {
      const analysis = await getJiraService().analyzeStoryStatus(storyKey);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              storyKey: analysis.story.key,
              storySummary: analysis.story.fields.summary,
              currentStatus: analysis.currentStatus,
              shouldBeInProgress: analysis.shouldBeInProgress,
              shouldBeDone: analysis.shouldBeDone,
              tasksSummary: analysis.tasksSummary,
              relatedTasks: analysis.relatedTasks.map(task => ({
                key: task.key,
                summary: task.fields.summary,
                status: task.fields.status.name
              }))
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Register get_available_transitions tool
server.registerTool(
  "get_available_transitions",
  {
    title: "Get Available Transitions",
    description: "Get available transitions for a JIRA ticket",
    inputSchema: {
      ticketId: z.string().describe("JIRA ticket ID (e.g., PROJ-123)"),
    },
  },
  async ({ ticketId }) => {
    try {
      const transitions = await getJiraService().getAvailableTransitions(ticketId);

      const transitionsSummary = transitions.map(transition => ({
        id: transition.id,
        name: transition.name,
        to: {
          name: transition.to?.name || 'Unknown',
          id: transition.to?.id || 'Unknown'
        }
      }));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              ticketId,
              availableTransitions: transitionsSummary,
              totalTransitions: transitions.length
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);


async function main() {
  // Check for command line arguments
  const args = process.argv.slice(2);

  if (args.length > 0) {
    const command = args[0];

    if (command === 'setup') {
      // Import and run setup
      const { JiraMcpSetup } = await import('./setup.js');
      const setup = new JiraMcpSetup();
      await setup.run();
      return;
    } else if (command === '--help' || command === '-h') {
      console.log(`
JIRA MCP Server

Usage:
  jira-mcp           Start the MCP server (STDIO mode)
  jira-mcp setup     Run interactive setup and configuration
  jira-mcp --help    Show this help message

Tools available:
  - get_jira_ticket
  - create_jira_ticket
  - post_jira_comment
  - link_jira_issues
  - set_epic_link
  - get_issue_links
  - create_project_hierarchy
  - validate_project_structure
  - update_ticket_description
  - update_ticket_status
  - get_available_transitions
  - update_story_statuses
  - analyze_story_status
      `);
      return;
    } else {
      console.error(`Unknown command: ${command}`);
      console.error('Use "jira-mcp --help" for usage information');
      process.exit(1);
    }
  }

  // Default: start MCP server
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
