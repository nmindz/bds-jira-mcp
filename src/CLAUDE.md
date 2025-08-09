# Source Code Context - bds-jira-mcp/src

## Directory Overview
This directory contains the core TypeScript source code for the JIRA MCP server implementation.

## Key Files

### `index.ts` - Main MCP Server
- **Purpose**: Entry point for the MCP server with tool registrations
- **Architecture**: Uses StdioServerTransport for Claude integration
- **Pattern**: Registers 13 MCP tools using `server.registerTool()` pattern
- **Services**: Lazy-loaded JIRA service via `getJiraService()` helper

### `setup.ts` - Interactive Configuration
- **Purpose**: Command-line setup tool for Claude integration
- **Features**: Environment validation, Claude Code CLI and Desktop configuration
- **Usage**: `npx bds-jira-mcp-setup` or `npm run setup`
- **Output**: Creates/updates `.claude.json` and platform-specific MCP configs

### `reconfigure.ts` - Environment Reconfiguration
- **Purpose**: Updates environment variables without full setup
- **Usage**: `npx bds-jira-mcp-reconfigure` for quick config updates
- **Scope**: Modifies existing environment files and Claude configurations

## MCP Tool Implementation Pattern

All tools follow this consistent structure:
```typescript
server.registerTool(
  "tool_name",
  {
    title: "Human Readable Title",
    description: "Clear description with examples",
    inputSchema: {
      param: z.string().describe("Parameter with examples"),
    },
  },
  async ({ param }) => {
    try {
      const result = await getJiraService().method(param);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);
```

## Service Integration

### Lazy Service Loading
- Services are NOT instantiated at module level
- Use `getJiraService()` helper for on-demand initialization  
- This prevents environment variable errors during help commands

### Error Handling Strategy
- All service calls wrapped in try/catch blocks
- User-friendly error messages with actionable guidance
- Consistent error response format across all tools

## Environment Configuration

### Conditional .env Loading
- Production: Uses environment variables directly
- Development: Loads `.env` when `DEBUG=true` or `ENVIRONMENT=development`
- Never loads .env in production deployments

### Required Variables
```typescript
JIRA_BASE_URL    // JIRA Cloud instance URL
JIRA_EMAIL       // Account email for authentication  
JIRA_API_TOKEN   // API token from JIRA profile
JIRA_PROJECT_KEY // Optional default project (recommended)
```

## Build Process

### TypeScript Configuration
- **Target**: ESM modules with Node.js 18+
- **Output**: `build/` directory with executable permissions
- **Scripts**: Shebang added to compiled files for CLI usage

### Entry Points
- `build/index.js` - Main MCP server (executable)
- `build/setup.js` - Setup tool (executable)  
- `build/reconfigure.js` - Reconfiguration tool (executable)

## Development Guidelines

### Code Style
- TypeScript strict mode enabled
- ESM imports/exports only (no CommonJS)
- Async/await preferred over promises
- Zod schemas for all input validation

### Service Implementation
- All async methods must call `this.initialize()` first
- Environment validation happens in initialize(), not constructor
- Handle JIRA API rate limits and authentication errors gracefully

### Testing Locally
```bash
# Development mode with .env loading
DEBUG=true npm run dev-start

# Build and test
npm run build
npx bds-jira-mcp --help
```

## Common Pitfalls

### ESM Module Issues
- Don't use `__dirname` (use `fileURLToPath(import.meta.url)`)
- Don't mix CommonJS require() with ESM imports
- Ensure all imports have proper file extensions in build

### Service Initialization
- Don't instantiate services at module level
- Always use lazy initialization pattern
- Environment variables should be validated, not assumed

### JIRA API Specifics
- Use REST API v2 for compatibility, v3 for linking features
- Handle authentication failures with clear guidance
- Implement proper error handling for API rate limits
