# Troubleshooting Rules

## Common Issues & Solutions

### "Missing required JIRA environment variables" Error
**Problem**: Service tries to initialize before environment variables are available
**Solution**: Ensure lazy initialization pattern is used:
```typescript
// Wrong: Service instantiated at module level
const jiraService = new JiraService(); // This runs immediately

// Right: Lazy service instantiation  
let jiraService: JiraService | null = null;
function getJiraService() {
  if (!jiraService) jiraService = new JiraService();
  return jiraService;
}
```

### "__dirname is not defined" Error
**Problem**: Using CommonJS patterns in ESM modules
**Solution**: Use proper ESM pattern:
```typescript
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
```

### MCP Tools Not Available After Setup
**Causes & Solutions**:
- Configuration file path wrong → Check `~/.claude.json` vs `~/.config/claude/`
- Command structure incorrect → Should be `npx jira-mcp`, not filesystem paths  
- Environment variables not injected → Verify env section in MCP config
- Claude needs restart → Restart Claude Code CLI or Claude Desktop

### Setup Command Fails
**Common Issues**:
- JIRA credentials invalid → Test with curl or browser first
- Network connectivity → Check JIRA URL accessibility
- Configuration directory permissions → Ensure write access to config paths

### Package Not Found After Publishing
**Troubleshooting**:
- Check registry URL: `--registry http://localhost:4873/`
- Verify version was bumped before republishing
- Clear npm cache: `npm cache clean --force`
- Check package.json bin entries are correct

### Build Failures
**Common Causes**:
- TypeScript errors → Fix type issues, ensure strict mode compliance
- Missing dependencies → Run `npm install`
- ESM import issues → Use `.js` extensions in imports, not `.ts`
- Executable permissions → `chmod +x build/*.js` should be in build script

## Debug Mode Usage
```bash
# Enable debug mode to load .env
DEBUG=true npx jira-mcp
ENVIRONMENT=development npx jira-mcp

# Check what environment variables are loaded
DEBUG=true npx jira-mcp --help  # Should show debug message
```
