# Services Context - jira-mcp/src/services

## Directory Overview
This directory contains service layer implementations for external API integrations and core business logic.

## Service Architecture

### Lazy Initialization Pattern
All services follow a consistent lazy initialization pattern to avoid environment variable errors during help commands:

```typescript
class ServiceName {
  private initialized = false;

  private initialize(): void {
    if (this.initialized) return;

    // Validate environment variables here
    if (!process.env.REQUIRED_VAR) {
      throw new Error('REQUIRED_VAR environment variable is required');
    }

    this.initialized = true;
  }

  async publicMethod(): Promise<Result> {
    this.initialize(); // Call at start of every public async method
    // ... method implementation
  }
}
```

## JIRA Service (`jira.ts`)

### Core Responsibilities
- **JIRA API Integration**: REST API v2/v3 calls with proper authentication
- **Issue Management**: CRUD operations for tickets, comments, status updates
- **Project Hierarchy**: Epic-story-task relationships and bulk operations
- **Text Formatting**: Markdown to JIRA markup conversion

### Key Methods

#### Ticket Operations
```typescript
async getTicket(ticketId: string): Promise<JiraTicket>
async createTicket(ticketData: CreateTicketRequest): Promise<JiraTicket>
async updateTicketDescription(ticketId: string, description: string): Promise<void>
async postComment(ticketId: string, comment: string): Promise<void>
```

#### Status Management
```typescript
async getAvailableTransitions(ticketId: string): Promise<Transition[]>
async updateTicketStatus(ticketId: string, transitionId: string): Promise<void>
async analyzeStoryStatus(storyKey: string): Promise<StoryAnalysis>
async updateStoryStatuses(epicKey: string): Promise<void>
```

#### Issue Linking & Hierarchy
```typescript
async linkIssues(fromIssue: string, toIssue: string, linkType: string): Promise<void>
async setEpicLink(issueKey: string, epicKey: string): Promise<void>
async getIssueLinks(ticketId: string): Promise<IssueLinks[]>
async validateProjectStructure(epicKey: string): Promise<ValidationResult>
```

#### Bulk Operations
```typescript
async createProjectHierarchy(hierarchy: ProjectHierarchy): Promise<HierarchyResult>
```

### API Integration Details

#### Authentication
- **Method**: Basic auth with email + API token
- **Headers**: `Authorization: Basic base64(email:token)`
- **Content-Type**: `application/json`

#### API Versions
- **REST API v2**: Core ticket operations, comments, transitions
- **REST API v3**: Advanced linking, modern field handling
- **Endpoint Pattern**: `${baseUrl}/rest/api/{version}/{resource}`

#### Error Handling
```typescript
try {
  const response = await axios.request(config);
  return response.data;
} catch (error) {
  if (axios.isAxiosError(error)) {
    // Handle specific HTTP errors
    if (error.response?.status === 401) {
      throw new Error('JIRA authentication failed - check credentials');
    }
    if (error.response?.status === 404) {
      throw new Error(`Ticket ${ticketId} not found`);
    }
  }
  throw error;
}
```

### Text Formatting System

#### Markdown to JIRA Markup
The `formatJiraText()` helper converts markdown to JIRA's textile-like markup:

```typescript
// Markdown -> JIRA Markup Conversions
**bold** -> *bold*
*italic* -> _italic_
`code` -> {{code}}
```code block``` -> {code}code block{code}
# Header -> h1. Header
- List item -> * List item
[Link](url) -> [Link|url]
```

#### Placeholder Cleanup
Fixed issue where JIRA formatting placeholders appeared in final output:
```typescript
// Clean up any remaining placeholder artifacts
.replace(/___JIRA_\w+___/g, '')
.replace(/___END_\w+___/g, '')
```

### Project Hierarchy Management

#### Epic-Story-Task Relationships
```typescript
interface ProjectHierarchy {
  epic: {
    summary: string;
    description?: string;
  };
  stories: Array<{
    summary: string;
    description?: string;
    tasks: Array<{
      summary: string;
      description?: string;
    }>;
  }>;
}
```

#### Hierarchy Creation Process
1. **Create Epic**: Issue type "Epic" with epic name field
2. **Create Stories**: Issue type "Story", link to epic via parent field
3. **Create Tasks**: Issue type "Task", link to stories via parent field
4. **Validate**: Ensure all relationships are properly established

#### Status Automation Logic
- **Story Completion**: When all child tasks are "Done"
- **Epic Progress**: Based on percentage of completed stories
- **Status Transitions**: Uses available transitions API to respect workflow

### Environment Configuration

#### Required Variables
```bash
JIRA_BASE_URL=https://company.atlassian.net
JIRA_EMAIL=user@company.com
JIRA_API_TOKEN=your-api-token
```

#### Optional Variables
```bash
JIRA_PROJECT_KEY=PROJ  # Default project for operations
```

#### Validation Strategy
- Environment variables checked in `initialize()` method
- Clear error messages for missing/invalid configuration
- Graceful degradation where possible

### Common Integration Patterns

#### Issue Type Detection
```typescript
const issueTypes = await this.getIssueTypes(projectKey);
const epicType = issueTypes.find(type => type.name.toLowerCase() === 'epic');
```

#### Field Mapping
```typescript
// Epic creation requires special field handling
const epicFields = {
  summary: epicData.summary,
  description: epicData.description,
  issuetype: { id: epicType.id },
  project: { key: projectKey },
  [epicNameFieldId]: epicData.summary, // Epic Name field
};
```

#### Bulk Operation Error Handling
```typescript
const results = await Promise.allSettled(operations);
const failures = results.filter(r => r.status === 'rejected');
if (failures.length > 0) {
  // Report partial success with failure details
}
```

### Testing & Development

#### Local Testing
```bash
# Test JIRA connection
curl -u email:token https://company.atlassian.net/rest/api/2/myself

# Debug service initialization
DEBUG=true npm run dev-start
```

#### Common Issues
- **Authentication**: Invalid credentials or expired tokens
- **Permissions**: Insufficient project permissions for operations
- **Rate Limits**: JIRA Cloud API limits require retry logic
- **Field IDs**: Custom fields have instance-specific IDs

### Future Enhancements
- **Caching**: Implement response caching for read operations
- **Retry Logic**: Add exponential backoff for rate-limited requests
- **Webhooks**: Real-time updates via JIRA webhooks
- **Custom Fields**: Dynamic field mapping and validation
