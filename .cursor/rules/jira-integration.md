# JIRA Integration Rules

## API Usage Patterns

### JIRA Service Implementation
```typescript
// Always use lazy initialization
class JiraService {
  private initialize(): void {
    if (this.initialized) return;
    // Validate environment variables here
    const baseURL = process.env.JIRA_BASE_URL;
    const email = process.env.JIRA_EMAIL;
    const token = process.env.JIRA_API_TOKEN;

    if (!baseURL || !email || !token) {
      throw new Error("Missing required JIRA environment variables");
    }
  }

  async anyPublicMethod() {
    this.initialize(); // Always call first
    // ... method implementation
  }
}
```

### JIRA API Best Practices
- Use REST API v2 for general operations (backward compatibility)
- Use REST API v3 for issue linking operations
- Always handle authentication errors with friendly messages
- Use proper JIRA markup formatting with `formatJiraText()` helper

### Issue Hierarchy Management
- Use `parent` field for epic-story-task relationships
- Create issue links for task relationships and traceability
- Implement bulk operations for efficient project setup
- Validate hierarchy with `validateProjectStructure` tool

### Error Handling
```typescript
if (axios.isAxiosError(error)) {
  if (error.response?.status === 401) {
    throw new Error("JIRA authentication failed. Check your credentials.");
  }
  if (error.response?.status === 404) {
    throw new Error(`JIRA ticket ${ticketId} not found`);
  }
  throw new Error(`JIRA API error: ${error.response?.status}`);
}
```

## Status Management
- Automatically update epic/story statuses based on task completion
- Use proper transition IDs: "21" for In Progress, "31" for Done
- Validate transitions before applying status changes
