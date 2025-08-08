# MCP Development Rules

## MCP Tool Implementation
When creating new MCP tools:

1. **Always use lazy service initialization**:
   ```typescript
   const result = await getJiraService().method();
   // NOT: const result = await jiraService.method();
   ```

2. **Follow consistent error handling pattern**:
   ```typescript
   try {
     const result = await service.operation();
     return {
       content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
     };
   } catch (error) {
     return {
       content: [{ type: "text", text: `Error: ${error.message}` }],
       isError: true,
     };
   }
   ```

3. **Use Zod schemas for input validation**:
   ```typescript
   inputSchema: {
     ticketId: z.string().describe("JIRA ticket ID (e.g., PROJ-123)"),
     optional: z.string().optional().describe("Optional parameter"),
   }
   ```

4. **Service initialization pattern**:
   ```typescript
   // In service class
   private initialize(): void {
     if (this.initialized) return;
     // Check environment variables here, not in constructor
   }

   // Call initialize() at start of every public async method
   async someMethod() {
     this.initialize();
     // ... rest of method
   }
   ```

## Environment & Configuration
- Use `DEBUG=true` or `ENVIRONMENT=development` to enable .env loading
- Production should never load .env files
- Environment variables are validated on first service use, not module load
- Configuration files use npx commands, not filesystem paths

## Documentation & Licensing
- Project uses Apache 2.0 license
- Maintain comprehensive README.md with usage examples
- Keep CLAUDE.md updated with development context and architectural decisions
- Update tool counts and version numbers consistently across all documentation
