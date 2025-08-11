import axios, { AxiosInstance } from "axios";
import { handleJiraApiError } from "../utils/errorHandler.js";

export interface JiraTicket {
  key: string;
  fields: {
    summary: string;
    description: string;
    status: {
      name: string;
    };
    assignee?: {
      displayName: string;
    };
    issuetype: {
      name: string;
    };
  };
}

export interface CreateTicketRequest {
  summary: string;
  description?: string;
  issueType: string;
  projectKey?: string;
  assignee?: string;
  priority?: string;
  epicLink?: string;
}

export interface IssueLinkType {
  id: string;
  name: string;
  inward: string;
  outward: string;
}

export interface IssueLink {
  id: string;
  type: IssueLinkType;
  inwardIssue?: {
    key: string;
    fields: {
      summary: string;
      status: { name: string };
      issuetype: { name: string };
    };
  };
  outwardIssue?: {
    key: string;
    fields: {
      summary: string;
      status: { name: string };
      issuetype: { name: string };
    };
  };
}

export interface LinkIssuesRequest {
  fromIssue: string;
  toIssue: string;
  linkType: string;
  comment?: string;
}

export interface ProjectHierarchy {
  epic: {
    summary: string;
    description?: string;
  };
  stories: Array<{
    summary: string;
    description?: string;
    tasks?: Array<{
      summary: string;
      description?: string;
    }>;
  }>;
}

export class JiraService {
  private client: AxiosInstance | null = null;
  private v3Client: AxiosInstance | null = null;
  private epicLinkField: string = 'customfield_10014'; // Default epic link field ID
  private initialized: boolean = false;
  private isLegacyMode: boolean = false;
  private fieldMappings: Record<string, string> = {};
  private serverCapabilities: {
    hasEpics: boolean;
    hasIssueLinks: boolean;
    version: string;
  } | null = null;

  constructor() {
    // Defer initialization until first use
  }

  private initialize(): void {
    if (this.initialized) return;

    const baseURL = process.env.JIRA_BASE_URL;
    const email = process.env.JIRA_EMAIL;
    const username = process.env.JIRA_USERNAME;
    const token = process.env.JIRA_API_TOKEN;

    if (!baseURL || !token) {
      throw new Error(
        "Missing required JIRA environment variables: JIRA_BASE_URL, JIRA_API_TOKEN"
      );
    }

    // Detect legacy mode from environment variable
    this.isLegacyMode = process.env.JIRA_LEGACY_API === 'true';

    let authConfig: any;
    
    if (this.isLegacyMode) {
      // JIRA Server: Use Bearer token authentication
      authConfig = {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      };
    } else {
      // JIRA Cloud: Use Basic authentication with email + token
      if (!email) {
        throw new Error(
          "JIRA Cloud requires JIRA_EMAIL environment variable"
        );
      }
      authConfig = {
        auth: {
          username: email,
          password: token,
        },
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      };
    }

    if (this.isLegacyMode) {
      // JIRA Server: API v2 only
      this.client = axios.create({
        baseURL: `${baseURL}/rest/api/2`,
        ...authConfig,
      });
      // No v3Client for legacy mode
      this.v3Client = null;
    } else {
      // JIRA Cloud: Current implementation (v2 + v3)
      this.client = axios.create({
        baseURL: `${baseURL}/rest/api/2`,
        ...authConfig,
      });
      this.v3Client = axios.create({
        baseURL: `${baseURL}/rest/api/3`,
        ...authConfig,
      });
    }

    this.initialized = true;

    // Initialize field mappings for legacy mode (async operation deferred)
    if (this.isLegacyMode) {
      this.initializeLegacyFieldMappings().catch(error => {
        console.warn('Could not initialize legacy field mappings:', error);
      });
    }
  }

  private async initializeLegacyFieldMappings(): Promise<void> {
    try {
      // Get all fields to map custom field IDs
      const fieldsResponse = await this.client!.get('/field');
      const fields = fieldsResponse.data;
      
      // Map common custom fields
      this.fieldMappings = {
        epicLink: this.findFieldByName(fields, ['Epic Link', 'Parent Link']) || 'customfield_10014',
        storyPoints: this.findFieldByName(fields, ['Story Points', 'Story Point Estimate']) || 'customfield_10016',
        sprint: this.findFieldByName(fields, ['Sprint']) || 'customfield_10020',
      };
      
      // Detect server capabilities
      await this.detectServerCapabilities();
    } catch (error: any) {
      // Handle permission errors gracefully - common with limited PAT permissions
      if (error.response?.status === 403) {
        console.warn('Limited JIRA permissions: Using default field mappings for JIRA Server');
      } else {
        console.warn('Could not initialize legacy field mappings:', error.message || error);
      }
      
      // Use default mappings (work for most JIRA Server instances)
      this.fieldMappings = {
        epicLink: 'customfield_10014',
        storyPoints: 'customfield_10016',
        sprint: 'customfield_10020',
      };

      // Set basic server capabilities when field discovery fails
      this.serverCapabilities = {
        version: 'unknown',
        hasEpics: true, // Assume epic support for JIRA Server
        hasIssueLinks: true, // Most JIRA Server instances support links
      };
    }
  }

  private findFieldByName(fields: any[], possibleNames: string[]): string | null {
    for (const name of possibleNames) {
      const field = fields.find(f => 
        f.name?.toLowerCase() === name.toLowerCase() ||
        f.schema?.custom?.includes(name.toLowerCase())
      );
      if (field) return field.id;
    }
    return null;
  }

  private async detectServerCapabilities(): Promise<void> {
    try {
      const serverInfo = await this.client!.get('/serverInfo');
      this.serverCapabilities = {
        version: serverInfo.data.version,
        hasEpics: this.fieldMappings.epicLink !== null,
        hasIssueLinks: await this.testIssueLinkSupport(),
      };
    } catch (error) {
      console.warn('Could not detect server capabilities:', error);
      this.serverCapabilities = {
        version: 'unknown',
        hasEpics: true,
        hasIssueLinks: true,
      };
    }
  }

  private async testIssueLinkSupport(): Promise<boolean> {
    try {
      await this.client!.get('/issueLinkType');
      return true;
    } catch (error) {
      return false;
    }
  }

  private validateProjectKey(providedKey?: string): string {
    const projectKey = providedKey || process.env.JIRA_PROJECT_KEY;
    if (!projectKey) {
      throw new Error("Project key is required. Either provide it in the request or set JIRA_PROJECT_KEY environment variable.");
    }
    return projectKey;
  }

  async getTicket(ticketId: string): Promise<JiraTicket> {
    this.initialize();
    try {
      const response = await this.client!.get(`/issue/${ticketId}`);
      return response.data;
    } catch (error) {
      handleJiraApiError(error, { 
        operation: "fetch JIRA ticket", 
        ticketId,
        isLegacyMode: this.isLegacyMode
      });
    }
  }

  async addComment(ticketId: string, comment: string): Promise<void> {
    this.initialize();
    try {
      await this.client!.post(`/issue/${ticketId}/comment`, {
        body: JiraService.formatJiraText(comment),
      });
    } catch (error) {
      handleJiraApiError(error, { 
        operation: "add comment to JIRA ticket", 
        ticketId,
        isLegacyMode: this.isLegacyMode
      });
    }
  }

  async updateTicketStatus(ticketId: string, transitionId: string): Promise<void> {
    this.initialize();
    try {
      await this.client!.post(`/issue/${ticketId}/transitions`, {
        transition: {
          id: transitionId,
        },
      });
    } catch (error) {
      handleJiraApiError(error, { operation: "update ticket status" });
    }
  }

  async getAvailableTransitions(ticketId: string): Promise<any[]> {
    this.initialize();
    try {
      const response = await this.client!.get(`/issue/${ticketId}/transitions`);
      return response.data.transitions;
    } catch (error) {
      handleJiraApiError(error, { operation: "get available transitions" });
    }
  }

  async createTicket(request: CreateTicketRequest): Promise<JiraTicket> {
    this.initialize();
    try {
      // Use provided project key or default from environment
      const projectKey = this.validateProjectKey(request.projectKey);

      // Build the issue creation payload
      const issuePayload: any = {
        fields: {
          project: { key: projectKey },
          summary: request.summary,
          issuetype: { name: request.issueType },
        }
      };

      // Add optional fields
      if (request.description) {
        issuePayload.fields.description = JiraService.formatJiraText(request.description);
      }

      if (request.assignee) {
        issuePayload.fields.assignee = { name: request.assignee };
      }

      if (request.priority) {
        issuePayload.fields.priority = { name: request.priority };
      }

      // Handle epic link differently based on mode
      if (request.epicLink) {
        if (this.isLegacyMode) {
          // JIRA Server: Use custom field
          issuePayload.fields[this.fieldMappings.epicLink] = request.epicLink;
        } else {
          // JIRA Cloud: Use parent field
          issuePayload.fields.parent = { key: request.epicLink };
        }
      }

      const response = await this.client!.post('/issue', issuePayload);

      // Fetch the created ticket to return complete data
      const createdTicket = await this.getTicket(response.data.key);
      return createdTicket;
    } catch (error) {
      handleJiraApiError(error, {
        operation: "create JIRA ticket",
        isLegacyMode: this.isLegacyMode,
        customMessages: {
          403: "Insufficient permissions to create tickets in this project."
        }
      });
    }
  }

  // Issue Linking Methods

  async getAvailableLinkTypes(): Promise<IssueLinkType[]> {
    this.initialize();
    try {
      if (this.isLegacyMode) {
        // JIRA Server: Use v2 API
        const response = await this.client!.get('/issueLinkType');
        return response.data.issueLinkTypes;
      } else {
        // JIRA Cloud: Use v3 API
        const response = await this.v3Client!.get('/issueLinkType');
        return response.data.issueLinkTypes;
      }
    } catch (error) {
      handleJiraApiError(error, { 
        operation: "fetch link types",
        isLegacyMode: this.isLegacyMode
      });
    }
  }

  async linkIssues(request: LinkIssuesRequest): Promise<void> {
    this.initialize();
    try {
      // Check capability in legacy mode
      if (this.isLegacyMode && !this.serverCapabilities?.hasIssueLinks) {
        throw new Error("Issue linking not supported in this JIRA Server version");
      }
      
      const linkPayload: any = {
        type: { name: request.linkType },
        inwardIssue: { key: request.fromIssue },
        outwardIssue: { key: request.toIssue }
      };

      if (request.comment) {
        linkPayload.comment = {
          body: JiraService.formatJiraText(request.comment)
        };
      }

      if (this.isLegacyMode) {
        // JIRA Server: Use v2 API
        await this.client!.post('/issueLink', linkPayload);
      } else {
        // JIRA Cloud: Use v3 API
        await this.v3Client!.post('/issueLink', linkPayload);
      }
    } catch (error) {
      handleJiraApiError(error, {
        operation: "link issues",
        issueKeys: [request.fromIssue, request.toIssue],
        isLegacyMode: this.isLegacyMode,
        customMessages: {
          400: "Invalid link request"
        }
      });
    }
  }

  async getIssueLinks(ticketId: string): Promise<IssueLink[]> {
    this.initialize();
    try {
      let response;
      
      if (this.isLegacyMode) {
        // JIRA Server: Use v2 API
        response = await this.client!.get(`/issue/${ticketId}?fields=issuelinks`);
      } else {
        // JIRA Cloud: Use v3 API
        response = await this.v3Client!.get(`/issue/${ticketId}?fields=issuelinks`);
      }
      
      return response.data.fields.issuelinks || [];
    } catch (error) {
      handleJiraApiError(error, { 
        operation: "get issue links", 
        ticketId,
        isLegacyMode: this.isLegacyMode
      });
    }
  }

  // Epic Management Methods (using parent field)

  async setEpicLink(issueKey: string, epicKey: string): Promise<void> {
    this.initialize();
    try {
      let updatePayload: any;
      
      if (this.isLegacyMode) {
        // JIRA Server: Use custom field
        updatePayload = {
          fields: {
            [this.fieldMappings.epicLink]: epicKey
          }
        };
      } else {
        // JIRA Cloud: Use parent field
        updatePayload = {
          fields: {
            parent: { key: epicKey }
          }
        };
      }

      await this.client!.put(`/issue/${issueKey}`, updatePayload);
    } catch (error) {
      handleJiraApiError(error, {
        operation: "set epic link",
        issueKeys: [issueKey, epicKey],
        customMessages: {
          400: this.isLegacyMode ? "Invalid epic link custom field" : "Invalid parent link"
        }
      });
    }
  }


  async getEpicIssues(epicKey: string): Promise<JiraTicket[]> {
    this.initialize();
    try {
      let jql: string;
      
      if (this.isLegacyMode) {
        // JIRA Server: Query by custom field
        jql = `"${this.fieldMappings.epicLink}" = ${epicKey}`;
      } else {
        // JIRA Cloud: Query by parent
        jql = `parent = ${epicKey}`;
      }
      
      const response = await this.client!.get('/search', {
        params: { jql, maxResults: 1000 }
      });
      return response.data.issues;
    } catch (error) {
      handleJiraApiError(error, { operation: "get epic issues" });
    }
  }

  // Project Hierarchy Methods

  async createProjectHierarchy(hierarchy: ProjectHierarchy, projectKey?: string): Promise<{
    epic: JiraTicket;
    stories: Array<{ story: JiraTicket; tasks: JiraTicket[] }>;
  }> {
    this.initialize();
    try {
      const project = this.validateProjectKey(projectKey);

      // Create the epic first
      const epic = await this.createTicket({
        summary: hierarchy.epic.summary,
        description: hierarchy.epic.description,
        issueType: 'Epic',
        projectKey: project
      });

      const results = [];

      // Create stories and their tasks
      for (const storyData of hierarchy.stories) {
        const story = await this.createTicket({
          summary: storyData.summary,
          description: storyData.description,
          issueType: 'Story',
          projectKey: project
        });

        // Set parent after creation
        await this.setEpicLink(story.key, epic.key);

        const tasks = [];
        if (storyData.tasks) {
          for (const taskData of storyData.tasks) {
            const task = await this.createTicket({
              summary: taskData.summary,
              description: taskData.description,
              issueType: 'Task',
              projectKey: project
            });

            // Set story as parent of task
            await this.setEpicLink(task.key, story.key);

            tasks.push(task);
          }
        }

        results.push({ story, tasks });
      }

      return { epic, stories: results };
    } catch (error) {
      throw new Error(`Failed to create project hierarchy: ${error}`);
    }
  }

  async validateProjectStructure(epicKey: string): Promise<{
    isValid: boolean;
    issues: string[];
    warnings: string[];
  }> {
    this.initialize();
    try {
      const issues: string[] = [];
      const warnings: string[] = [];

      // Add legacy mode warning
      if (this.isLegacyMode) {
        warnings.push("Running in legacy JIRA Server mode - some features may be limited");
      }

      // Check if epic exists
      const epic = await this.getTicket(epicKey);
      if (epic.fields.issuetype.name !== 'Epic') {
        issues.push(`${epicKey} is not an Epic (type: ${epic.fields.issuetype.name})`);
      }

      // Get all issues linked to this epic
      const epicIssues = await this.getEpicIssues(epicKey);

      if (epicIssues.length === 0) {
        warnings.push(`Epic ${epicKey} has no linked stories or tasks`);
      }

      // Validate each issue in the epic
      for (const issue of epicIssues) {
        // Skip link validation in legacy mode if not supported
        if (this.isLegacyMode && !this.serverCapabilities?.hasIssueLinks) {
          continue;
        }
        
        const links = await this.getIssueLinks(issue.key);

        if (issue.fields.issuetype.name === 'Story') {
          // Stories should have tasks
          const taskLinks = links.filter(link =>
            (link.inwardIssue?.fields.issuetype.name === 'Task' ||
             link.outwardIssue?.fields.issuetype.name === 'Task')
          );

          if (taskLinks.length === 0) {
            warnings.push(`Story ${issue.key} has no linked tasks`);
          }
        }
      }

      return {
        isValid: issues.length === 0,
        issues,
        warnings
      };
    } catch (error) {
      throw new Error(`Failed to validate project structure: ${error}`);
    }
  }


  // Update ticket description
  async updateTicketDescription(ticketId: string, description: string): Promise<void> {
    this.initialize();
    try {
      const updatePayload = {
        fields: {
          description: JiraService.formatJiraText(description)
        }
      };

      await this.client!.put(`/issue/${ticketId}`, updatePayload);
    } catch (error) {
      handleJiraApiError(error, { operation: "update ticket description", ticketId });
    }
  }

  // Helper method to format text for JIRA markup
  static formatJiraText(text: string): string {
    // Completely rewritten from scratch - simple and reliable approach
    let result = text;

    // Headers: # Header → h1. Header
    result = result.replace(/^# (.+)$/gm, 'h1. $1');
    result = result.replace(/^## (.+)$/gm, 'h2. $1');
    result = result.replace(/^### (.+)$/gm, 'h3. $1');

    // Bold: **text** → *text*
    result = result.replace(/\*\*(.+?)\*\*/g, '*$1*');

    // Italic: _text_ → _text_ (underscore syntax, already JIRA format)
    // Note: Single asterisk italic (*text*) intentionally not supported to avoid conflicts

    // Code blocks: ```code``` → {code}code{code}
    result = result.replace(/```[\w]*\n?([\s\S]*?)\n?```/g, '{code}$1{code}');

    // Inline code: `code` → {{code}}
    result = result.replace(/`([^`]+)`/g, '{{$1}}');

    // Links: [text](url) → [text|url]
    result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '[$1|$2]');

    // Lists: - item → * item (simple, no complex regex)
    result = result.replace(/^- (.+)$/gm, '* $1');

    return result;
  }

  // Story Status Management Methods

  async getRelatedTasks(storyKey: string): Promise<JiraTicket[]> {
    this.initialize();
    try {
      // Get issues linked to this story via issue links
      const links = await this.getIssueLinks(storyKey);
      const relatedTaskKeys = links
        .filter(link => {
          const relatedIssue = link.inwardIssue || link.outwardIssue;
          return relatedIssue && relatedIssue.fields?.issuetype?.name === 'Task';
        })
        .map(link => {
          const relatedIssue = link.inwardIssue || link.outwardIssue;
          return relatedIssue?.key;
        })
        .filter(key => key !== undefined);

      // Fetch full ticket details for each related task
      const relatedTasks: JiraTicket[] = [];
      for (const taskKey of relatedTaskKeys) {
        if (taskKey) {
          try {
            const task = await this.getTicket(taskKey);
            relatedTasks.push(task);
          } catch (error) {
            console.warn(`Could not fetch task ${taskKey}:`, error);
          }
        }
      }

      return relatedTasks;
    } catch (error) {
      throw new Error(`Failed to get related tasks for ${storyKey}: ${error}`);
    }
  }

  async analyzeStoryStatus(storyKey: string): Promise<{
    story: JiraTicket;
    relatedTasks: JiraTicket[];
    shouldBeInProgress: boolean;
    shouldBeDone: boolean;
    currentStatus: string;
    tasksSummary: {
      total: number;
      done: number;
      inProgress: number;
      toDo: number;
    };
  }> {
    this.initialize();
    try {
      const story = await this.getTicket(storyKey);
      const relatedTasks = await this.getRelatedTasks(storyKey);

      const tasksSummary = {
        total: relatedTasks.length,
        done: relatedTasks.filter(task => task.fields.status.name === 'Done').length,
        inProgress: relatedTasks.filter(task => task.fields.status.name === 'In Progress').length,
        toDo: relatedTasks.filter(task => task.fields.status.name === 'To Do').length,
      };

      const currentStatus = story.fields.status.name;
      const shouldBeDone = tasksSummary.total > 0 && tasksSummary.done === tasksSummary.total;
      const shouldBeInProgress = !shouldBeDone && (tasksSummary.inProgress > 0 || tasksSummary.done > 0);

      return {
        story,
        relatedTasks,
        shouldBeInProgress,
        shouldBeDone,
        currentStatus,
        tasksSummary
      };
    } catch (error) {
      throw new Error(`Failed to analyze story status for ${storyKey}: ${error}`);
    }
  }

  async updateStoryStatusBasedOnTasks(storyKey: string): Promise<{
    updated: boolean;
    oldStatus: string;
    newStatus: string;
    reason: string;
  }> {
    this.initialize();
    try {
      const analysis = await this.analyzeStoryStatus(storyKey);
      const { story, shouldBeInProgress, shouldBeDone, currentStatus, tasksSummary } = analysis;

      let targetStatus = currentStatus;
      let transitionId: string | null = null;
      let reason = '';

      // Determine target status
      if (shouldBeDone && currentStatus !== 'Done') {
        targetStatus = 'Done';
        transitionId = '31';
        reason = `All ${tasksSummary.total} related tasks are completed`;
      } else if (shouldBeInProgress && currentStatus === 'To Do') {
        targetStatus = 'In Progress';
        transitionId = '21';
        reason = `${tasksSummary.inProgress + tasksSummary.done} of ${tasksSummary.total} tasks are started/completed`;
      }

      // Update status if needed
      if (transitionId && targetStatus !== currentStatus) {
        await this.updateTicketStatus(storyKey, transitionId);

        // Add comment explaining the status change
        const comment = `Story Status Updated Automatically

*Previous Status:* ${currentStatus}
*New Status:* ${targetStatus}
*Reason:* ${reason}

*Task Summary:*
* Total Tasks: ${tasksSummary.total}
* Done: ${tasksSummary.done}
* In Progress: ${tasksSummary.inProgress}
* To Do: ${tasksSummary.toDo}

Status updated automatically based on related task completion.`;

        await this.addComment(storyKey, comment);

        return {
          updated: true,
          oldStatus: currentStatus,
          newStatus: targetStatus,
          reason
        };
      }

      return {
        updated: false,
        oldStatus: currentStatus,
        newStatus: currentStatus,
        reason: 'No status change needed'
      };
    } catch (error) {
      throw new Error(`Failed to update story status for ${storyKey}: ${error}`);
    }
  }

  async updateAllStoryStatuses(epicKey: string): Promise<{
    storiesChecked: number;
    storiesUpdated: number;
    updates: Array<{
      storyKey: string;
      oldStatus: string;
      newStatus: string;
      reason: string;
    }>;
  }> {
    this.initialize();
    try {
      // Get all stories in the epic
      const epicIssues = await this.getEpicIssues(epicKey);
      const stories = epicIssues.filter(issue => issue.fields.issuetype.name === 'Story');

      const updates = [];
      let storiesUpdated = 0;

      for (const story of stories) {
        try {
          const result = await this.updateStoryStatusBasedOnTasks(story.key);
          if (result.updated) {
            updates.push({
              storyKey: story.key,
              oldStatus: result.oldStatus,
              newStatus: result.newStatus,
              reason: result.reason
            });
            storiesUpdated++;
          }
        } catch (error) {
          console.warn(`Failed to update story ${story.key}:`, error);
        }
      }

      return {
        storiesChecked: stories.length,
        storiesUpdated,
        updates
      };
    } catch (error) {
      throw new Error(`Failed to update all story statuses: ${error}`);
    }
  }
}
