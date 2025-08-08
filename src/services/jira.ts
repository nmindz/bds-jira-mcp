import axios, { AxiosInstance } from "axios";

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

  constructor() {
    // Defer initialization until first use
  }

  private initialize(): void {
    if (this.initialized) return;

    const baseURL = process.env.JIRA_BASE_URL;
    const email = process.env.JIRA_EMAIL;
    const token = process.env.JIRA_API_TOKEN;

    if (!baseURL || !email || !token) {
      throw new Error(
        "Missing required JIRA environment variables: JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN"
      );
    }

    const authConfig = {
      auth: {
        username: email,
        password: token,
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    };

    // API v2 client for backward compatibility
    this.client = axios.create({
      baseURL: `${baseURL}/rest/api/2`,
      ...authConfig,
    });

    // API v3 client for linking functionality
    this.v3Client = axios.create({
      baseURL: `${baseURL}/rest/api/3`,
      ...authConfig,
    });

    this.initialized = true;
  }

  async getTicket(ticketId: string): Promise<JiraTicket> {
    this.initialize();
    try {
      const response = await this.client!.get(`/issue/${ticketId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error(`JIRA ticket ${ticketId} not found`);
        }
        if (error.response?.status === 401) {
          throw new Error("JIRA authentication failed. Check your credentials.");
        }
        throw new Error(`JIRA API error: ${error.response?.status} ${error.response?.statusText}`);
      }
      throw new Error(`Failed to fetch JIRA ticket: ${error}`);
    }
  }

  async addComment(ticketId: string, comment: string): Promise<void> {
    this.initialize();
    try {
      await this.client!.post(`/issue/${ticketId}/comment`, {
        body: JiraService.formatJiraText(comment),
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error(`JIRA ticket ${ticketId} not found`);
        }
        if (error.response?.status === 401) {
          throw new Error("JIRA authentication failed. Check your credentials.");
        }
        throw new Error(`JIRA API error: ${error.response?.status} ${error.response?.statusText}`);
      }
      throw new Error(`Failed to add comment to JIRA ticket: ${error}`);
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
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to update ticket status: ${error.response?.statusText}`);
      }
      throw new Error(`Failed to update ticket status: ${error}`);
    }
  }

  async getAvailableTransitions(ticketId: string): Promise<any[]> {
    this.initialize();
    try {
      const response = await this.client!.get(`/issue/${ticketId}/transitions`);
      return response.data.transitions;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to get available transitions: ${error.response?.statusText}`);
      }
      throw new Error(`Failed to get available transitions: ${error}`);
    }
  }

  async createTicket(request: CreateTicketRequest): Promise<JiraTicket> {
    this.initialize();
    try {
      // Use provided project key or default from environment
      const projectKey = request.projectKey || process.env.JIRA_PROJECT_KEY;
      if (!projectKey) {
        throw new Error("Project key is required. Either provide it in the request or set JIRA_PROJECT_KEY environment variable.");
      }

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

      if (request.epicLink) {
        issuePayload.fields.parent = { key: request.epicLink };
      }

      const response = await this.client!.post('/issue', issuePayload);

      // Fetch the created ticket to return complete data
      const createdTicket = await this.getTicket(response.data.key);
      return createdTicket;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          const errorMessages = error.response.data?.errors || error.response.data?.errorMessages || [];
          const errorDetails = Object.entries(errorMessages).map(([field, message]) => `${field}: ${message}`).join(', ');
          throw new Error(`Invalid ticket data: ${errorDetails || error.response.statusText}`);
        }
        if (error.response?.status === 401) {
          throw new Error("JIRA authentication failed. Check your credentials.");
        }
        if (error.response?.status === 403) {
          throw new Error("Insufficient permissions to create tickets in this project.");
        }
        throw new Error(`JIRA API error: ${error.response?.status} ${error.response?.statusText}`);
      }
      throw new Error(`Failed to create JIRA ticket: ${error}`);
    }
  }

  // Issue Linking Methods

  async getAvailableLinkTypes(): Promise<IssueLinkType[]> {
    this.initialize();
    try {
      const response = await this.v3Client!.get('/issueLinkType');
      return response.data.issueLinkTypes;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to fetch link types: ${error.response?.statusText}`);
      }
      throw new Error(`Failed to fetch link types: ${error}`);
    }
  }

  async linkIssues(request: LinkIssuesRequest): Promise<void> {
    this.initialize();
    try {
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

      await this.v3Client!.post('/issueLink', linkPayload);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error(`One or both issues not found: ${request.fromIssue}, ${request.toIssue}`);
        }
        if (error.response?.status === 400) {
          const errorMessage = error.response.data?.errorMessages?.[0] || error.response.statusText;
          throw new Error(`Invalid link request: ${errorMessage}`);
        }
        throw new Error(`JIRA API error: ${error.response?.status} ${error.response?.statusText}`);
      }
      throw new Error(`Failed to link issues: ${error}`);
    }
  }

  async getIssueLinks(ticketId: string): Promise<IssueLink[]> {
    this.initialize();
    try {
      const response = await this.v3Client!.get(`/issue/${ticketId}?fields=issuelinks`);
      return response.data.fields.issuelinks || [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error(`JIRA ticket ${ticketId} not found`);
        }
        throw new Error(`JIRA API error: ${error.response?.status} ${error.response?.statusText}`);
      }
      throw new Error(`Failed to get issue links: ${error}`);
    }
  }

  // Epic Management Methods (using parent field)

  async setEpicLink(issueKey: string, epicKey: string): Promise<void> {
    this.initialize();
    try {
      const updatePayload = {
        fields: {
          parent: { key: epicKey }
        }
      };

      await this.client!.put(`/issue/${issueKey}`, updatePayload);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error(`Issue ${issueKey} or Epic ${epicKey} not found`);
        }
        if (error.response?.status === 400) {
          const errorMessage = error.response.data?.errorMessages?.[0] || error.response.statusText;
          throw new Error(`Invalid parent link: ${errorMessage}`);
        }
        throw new Error(`JIRA API error: ${error.response?.status} ${error.response?.statusText}`);
      }
      throw new Error(`Failed to set epic link: ${error}`);
    }
  }

  async removeEpicLink(issueKey: string): Promise<void> {
    this.initialize();
    try {
      const updatePayload = {
        fields: {
          parent: null
        }
      };

      await this.client!.put(`/issue/${issueKey}`, updatePayload);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error(`Issue ${issueKey} not found`);
        }
        throw new Error(`JIRA API error: ${error.response?.status} ${error.response?.statusText}`);
      }
      throw new Error(`Failed to remove epic link: ${error}`);
    }
  }

  async getEpicIssues(epicKey: string): Promise<JiraTicket[]> {
    this.initialize();
    try {
      const jql = `parent = ${epicKey}`;
      const response = await this.client!.get('/search', {
        params: { jql, maxResults: 1000 }
      });
      return response.data.issues;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to get epic issues: ${error.response?.statusText}`);
      }
      throw new Error(`Failed to get epic issues: ${error}`);
    }
  }

  // Project Hierarchy Methods

  async createProjectHierarchy(hierarchy: ProjectHierarchy, projectKey?: string): Promise<{
    epic: JiraTicket;
    stories: Array<{ story: JiraTicket; tasks: JiraTicket[] }>;
  }> {
    this.initialize();
    try {
      const project = projectKey || process.env.JIRA_PROJECT_KEY;
      if (!project) {
        throw new Error("Project key is required");
      }

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

  // Helper method to discover epic link field ID
  async discoverEpicLinkField(): Promise<string> {
    this.initialize();
    try {
      const response = await this.client!.get('/field');
      const epicField = response.data.find((field: any) =>
        field.name === 'Epic Link' || field.name.toLowerCase().includes('epic')
      );

      if (epicField) {
        this.epicLinkField = epicField.id;
        return epicField.id;
      }

      // Fallback to common default
      return 'customfield_10014';
    } catch (error) {
      console.warn('Failed to discover epic link field, using default');
      return 'customfield_10014';
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
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error(`JIRA ticket ${ticketId} not found`);
        }
        throw new Error(`JIRA API error: ${error.response?.status} ${error.response?.statusText}`);
      }
      throw new Error(`Failed to update ticket description: ${error}`);
    }
  }

  // Helper method to format text for JIRA markup
  static formatJiraText(text: string): string {
    return text
      // Convert markdown headers to JIRA headers
      .replace(/^### (.*$)/gm, 'h3. $1')
      .replace(/^## (.*$)/gm, 'h2. $1')
      .replace(/^# (.*$)/gm, 'h1. $1')

      // Convert markdown bold to JIRA bold (** to *) BEFORE list conversion
      .replace(/\*\*(.*?)\*\*/g, '*$1*')

      // Convert markdown italic to JIRA italic (* to _) BEFORE list conversion
      .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '_$1_')

      // Convert markdown lists to JIRA lists AFTER italic/bold conversion
      .replace(/^- (.*$)/gm, '* $1')

      // Convert markdown code blocks to JIRA code blocks
      .replace(/```(\w+)?\n([\s\S]*?)\n```/g, '{code:$1}\n$2\n{code}')
      .replace(/`([^`]+)`/g, '{{$1}}')

      // Convert markdown links to JIRA links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '[$1|$2]')

      // Clean up any remaining markdown artifacts
      .replace(/^\s*\*\s*$/gm, '') // Remove empty bullet points
      .replace(/\n\n\n+/g, '\n\n'); // Remove excessive line breaks
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
