# Development Workflow Rules

## Build & Test Process
```bash
# Standard development workflow
npm run build           # Compile TypeScript
npm run debug          # Run with .env loading
npm run dev-start      # Alternative development mode
pnpm run redeploy      # Build + publish to localhost

# Testing commands
npx jira-mcp --help    # Test help without env vars
npx jira-mcp setup     # Test setup process
DEBUG=true npx jira-mcp # Test with debug mode
```

## Version Management
- Always bump version in package.json before republishing
- Use semantic versioning (patch for fixes, minor for features)
- Test locally before publishing to real NPM registry

## ESM Module Considerations
```typescript
// Correct ESM patterns
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// NOT: const __dirname = __dirname; // This breaks in ESM
```

## Configuration Management
### Claude Code CLI Integration
- Use `~/.claude.json` (NOT `~/.config/claude/claude_config.json`)
- Command should be `npx`, args should be `["jira-mcp"]`
- Include environment variables in MCP server configuration

### Claude Desktop Integration  
- Path: `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
- Same npx pattern as Claude Code CLI
- Handle existing configuration merging properly

## Publishing & Deployment
```javascript
// package.json scripts pattern
"scripts": {
  "build": "tsc && chmod +x build/*.js",
  "debug": "DEBUG=true node build/index.js",
  "redeploy": "npm run build && npm publish --registry http://localhost:4873/"
}
```

## Testing Integration
- Verify MCP tools are accessible after setup
- Test both Claude Code and Claude Desktop integrations
- Validate environment variable injection works
- Check that setup creates proper configuration files
