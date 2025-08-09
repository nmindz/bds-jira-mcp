# JIRA MCP Setup Troubleshooting Guide

This comprehensive guide helps diagnose and resolve common issues during JIRA MCP setup and Claude Code integration.

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Setup Verification Steps](#setup-verification-steps)
3. [Common Issues](#common-issues)
4. [Platform-Specific Issues](#platform-specific-issues)
5. [Advanced Troubleshooting](#advanced-troubleshooting)
6. [Getting Help](#getting-help)

## Quick Diagnostics

### Health Check Commands
```bash
# 1. Test MCP server directly
npx jira-mcp

# 2. Verify package installation  
npm list -g jira-mcp

# 3. Check Claude Code config
cat ~/.claude.json | jq '.mcpServers["jira-mcp"]'

# 4. Test JIRA connection
curl -u "your-email:your-api-token" \
  "https://your-company.atlassian.net/rest/api/2/myself"
```

### Expected Outputs
- **MCP Server**: Should output JSON-RPC messages like `{"jsonrpc":"2.0","method":"initialize"}`
- **Package List**: Should show `jira-mcp@x.x.x`
- **Config Check**: Should show complete server configuration
- **JIRA Test**: Should return your user information

## Setup Verification Steps

### 1. Environment Prerequisites
```bash
# Check Node.js version (requires 18+)
node --version

# Check npm access
npm --version

# Check network connectivity
ping your-company.atlassian.net
```

### 2. JIRA Credentials Validation
```bash
# Test API token format (should be 24 characters)
echo "$JIRA_API_TOKEN" | wc -c

# Verify base URL format
echo "$JIRA_BASE_URL" | grep -E '^https://.*\.atlassian\.net$'

# Test authentication
curl -s -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
  "$JIRA_BASE_URL/rest/api/2/myself" | jq '.displayName'
```

### 3. MCP Integration Verification
```bash
# Run setup with verification
npx jira-mcp-setup

# Check setup logs for verification results
# ✅ = Success, ❌ = Failed, ⚠️ = Warning

# Manual config verification
npx jira-mcp-setup --force --verify-only
```

## Common Issues

### Setup Fails During JIRA Connection Test

**Symptoms:**
- `❌ JIRA connection failed: 401 Unauthorized`
- `❌ JIRA connection failed: 403 Forbidden`
- `❌ JIRA connection failed: Network Error`

**Solutions:**

#### 401 Unauthorized
```bash
# 1. Verify API token is correct
echo "Your API token: $JIRA_API_TOKEN"

# 2. Regenerate API token
# Go to: https://id.atlassian.com/manage-profile/security/api-tokens

# 3. Check email matches Atlassian account
curl -s -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
  "$JIRA_BASE_URL/rest/api/2/myself" | jq '.emailAddress'
```

#### 403 Forbidden
```bash
# Check JIRA permissions
curl -s -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
  "$JIRA_BASE_URL/rest/api/2/permissions" | jq '.permissions'

# Verify project access
curl -s -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
  "$JIRA_BASE_URL/rest/api/2/project/$JIRA_PROJECT_KEY"
```

#### Network Errors
```bash
# 1. Check DNS resolution
nslookup your-company.atlassian.net

# 2. Test HTTPS connectivity
curl -I "https://your-company.atlassian.net"

# 3. Check corporate proxy/firewall
export HTTPS_PROXY=http://your-proxy:8080
npx jira-mcp-setup
```

### MCP Server Verification Fails

**Symptoms:**
- `❌ MCP server failed to start (exit code: 1)`
- `❌ Failed to spawn MCP server: ENOENT`
- `⚠️ MCP server test timed out`

**Solutions:**

#### Package Not Found (ENOENT)
```bash
# 1. Install globally
npm install -g jira-mcp

# 2. Or use local installation
npm install jira-mcp
npx jira-mcp

# 3. Check npm registry
npm config get registry
npm ping
```

#### Server Start Failure
```bash
# 1. Test with debug output
DEBUG=true npx jira-mcp

# 2. Check environment variables
env | grep JIRA_

# 3. Test with minimal config
JIRA_BASE_URL="https://test.atlassian.net" \
JIRA_EMAIL="test@example.com" \
JIRA_API_TOKEN="test-token" \
npx jira-mcp
```

#### Timeout Issues
```bash
# Timeout is often normal for MCP servers
# They start, initialize, then wait for input

# Verify by checking for MCP output:
timeout 5 npx jira-mcp | head -1
# Should show: {"jsonrpc":"2.0",...}
```

### Claude Code Configuration Issues

**Symptoms:**
- `❌ Claude Code config file not found`
- `❌ jira-mcp server not found in Claude Code config`
- `❌ Missing required field in config`

**Solutions:**

#### Missing Config File
```bash
# 1. Check config directory
ls -la ~/.claude.json

# 2. Create empty config if needed
echo '{"mcpServers":{}}' > ~/.claude.json

# 3. Run setup again
npx jira-mcp-setup --force
```

#### Config Syntax Errors
```bash
# 1. Validate JSON syntax
cat ~/.claude.json | jq empty

# 2. Fix common issues
# Remove trailing commas, fix quotes, check brackets

# 3. Use setup to recreate
mv ~/.claude.json ~/.claude.json.backup
npx jira-mcp-setup
```

#### Missing Fields
```bash
# Check required structure
cat ~/.claude.json | jq '.mcpServers["jira-mcp"]'

# Should contain:
# {
#   "command": "npx",
#   "args": ["jira-mcp"],
#   "env": {
#     "JIRA_BASE_URL": "...",
#     "JIRA_EMAIL": "...",
#     "JIRA_API_TOKEN": "..."
#   }
# }
```

### Claude Desktop Configuration Issues

**Symptoms:**
- `❌ Claude Desktop config file not found`
- Configuration appears correct but Claude Desktop doesn't see the server

**Solutions:**

#### macOS Issues
```bash
# 1. Check config location
ls -la ~/Library/Application\ Support/Claude/claude_desktop_config.json

# 2. Verify directory permissions
ls -la ~/Library/Application\ Support/Claude/

# 3. Restart Claude Desktop
killall Claude
open -a Claude
```

#### Windows Issues
```cmd
# 1. Check config location
dir "%APPDATA%\Claude\claude_desktop_config.json"

# 2. Verify APPDATA variable
echo %APPDATA%

# 3. Run as administrator if needed
# Right-click command prompt -> "Run as administrator"
```

## Platform-Specific Issues

### macOS

#### Permission Denied Errors
```bash
# Fix config directory permissions
chmod 755 ~/Library/Application\ Support/Claude/
chmod 644 ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Fix npm permissions
sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}
```

#### Quarantine Issues
```bash
# If npx jira-mcp is blocked by Gatekeeper
xattr -d com.apple.quarantine ~/.npm/_npx/*/node_modules/.bin/jira-mcp
```

### Windows

#### PowerShell Execution Policy
```powershell
# Check current policy
Get-ExecutionPolicy

# Set policy for current user
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### Path Issues
```cmd
# Check npm global path
npm config get prefix

# Add to PATH if needed
setx PATH "%PATH%;%APPDATA%\npm"
```

### Linux

#### Claude Desktop Not Available
```bash
# Claude Desktop is not yet available on Linux
echo "ℹ️ Claude Desktop setup skipped (Linux not supported)"

# Focus on Claude Code CLI only
npx jira-mcp-setup --cli-only
```

## Advanced Troubleshooting

### Debug Mode Setup
```bash
# Enable debug logging
DEBUG=true npx jira-mcp-setup

# Check debug output for:
# - Environment variable loading
# - JIRA API calls
# - File system operations
# - Process spawning
```

### Manual Configuration
If automated setup fails, create configurations manually:

#### Claude Code Config (~/.claude.json)
```json
{
  "mcpServers": {
    "jira-mcp": {
      "command": "npx",
      "args": ["jira-mcp"],
      "env": {
        "JIRA_BASE_URL": "https://your-company.atlassian.net",
        "JIRA_EMAIL": "your-email@company.com",
        "JIRA_API_TOKEN": "your-api-token",
        "JIRA_PROJECT_KEY": "YOUR_PROJECT"
      }
    }
  }
}
```

#### Claude Desktop Config
**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "jira-mcp": {
      "command": "npx",
      "args": ["jira-mcp"],
      "env": {
        "JIRA_BASE_URL": "https://your-company.atlassian.net",
        "JIRA_EMAIL": "your-email@company.com",
        "JIRA_API_TOKEN": "your-api-token",
        "JIRA_PROJECT_KEY": "YOUR_PROJECT"
      }
    }
  }
}
```

### Network Troubleshooting

#### Corporate Proxy
```bash
# Configure npm proxy
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080

# Configure git proxy (for package downloads)
git config --global http.proxy http://proxy.company.com:8080

# Test with proxy
HTTPS_PROXY=http://proxy.company.com:8080 npx jira-mcp-setup
```

#### SSL Certificate Issues
```bash
# Temporarily disable SSL verification (not recommended for production)
npm config set strict-ssl false

# Or configure custom CA
npm config set ca "$(cat /path/to/ca-cert.pem)"
```

### Performance Issues

#### Slow Setup/Installation
```bash
# Use faster npm registry
npm config set registry https://registry.npmmirror.com

# Clear npm cache
npm cache clean --force

# Use yarn as alternative
yarn global add jira-mcp
```

## Error Code Reference

| Code | Description | Common Cause | Solution |
|------|-------------|---------------|----------|
| ENOENT | Command not found | Package not installed | `npm install -g jira-mcp` |
| EACCES | Permission denied | File permissions | Fix permissions or use sudo |
| 401 | Unauthorized | Invalid API token | Regenerate JIRA API token |
| 403 | Forbidden | Insufficient JIRA permissions | Contact JIRA administrator |
| 404 | Not found | Invalid JIRA URL/project | Verify JIRA_BASE_URL and project |
| ETIMEDOUT | Connection timeout | Network/firewall issues | Check network connectivity |
| CERT_INVALID | SSL certificate error | Corporate firewall/proxy | Configure proxy/certificates |

## Verification Checklist

After troubleshooting, verify your setup works:

- [ ] `npx jira-mcp` outputs MCP protocol messages
- [ ] `~/.claude.json` contains valid jira-mcp configuration
- [ ] Claude Desktop config exists (if using Desktop)
- [ ] JIRA connection test passes: `curl -u email:token jira-url/rest/api/2/myself`
- [ ] Claude Code CLI can use JIRA MCP tools
- [ ] Claude Desktop can use JIRA MCP tools (if configured)

## Getting Help

### Before Seeking Support

1. **Run Diagnostics:**
   ```bash
   npx jira-mcp-setup --diagnose 2>&1 | tee setup-diagnostics.log
   ```

2. **Gather System Information:**
   ```bash
   echo "OS: $(uname -a)"
   echo "Node: $(node --version)"
   echo "npm: $(npm --version)"
   echo "Package: $(npm list -g jira-mcp)"
   ```

3. **Check Recent Logs:**
   ```bash
   # Setup logs
   cat ~/.npm/_logs/*-debug.log | tail -50

   # Claude Code logs (if available)
   cat ~/.claude/logs/latest.log | tail -50
   ```

### Support Channels

1. **GitHub Issues:** [https://github.com/nmindz/jira-mcp/issues](https://github.com/nmindz/jira-mcp/issues)
2. **Documentation:** [README.md](../README.md) and [CLAUDE.md](../CLAUDE.md)
3. **Community:** Claude AI Discord/Forums

### Issue Report Template

```
## Environment
- OS: [macOS/Windows/Linux version]
- Node.js: [version]
- npm: [version]
- jira-mcp: [version]

## Issue Description
[Describe the problem]

## Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Diagnostics Output
```
npx jira-mcp-setup --diagnose
[Paste output here]
```

## Error Logs
[Paste relevant error logs]

## Additional Context
[Any other relevant information]
```

---

This troubleshooting guide covers the most common setup issues and their solutions. For complex enterprise environments or custom configurations, additional troubleshooting may be required.
