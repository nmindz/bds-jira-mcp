<div align="center">
  <img src="logo.svg" alt="JIRA MCP Logo" width="200" height="200" />
  
  # JIRA MCP Server
  
  A comprehensive Model Context Protocol (MCP) server that provides powerful JIRA integration and project management capabilities for Claude Code CLI and Claude Desktop.
  
  [![NPM Version](https://img.shields.io/npm/v/bds-jira-mcp)](https://www.npmjs.com/package/bds-jira-mcp)
  [![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
  [![Jest](https://img.shields.io/badge/Jest-30.0-red.svg)](https://jestjs.io/)
  [![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](#)
  [![Coverage](https://img.shields.io/badge/coverage-80%25-green.svg)](#)
  [![MCP Tools](https://img.shields.io/badge/MCP%20Tools-13-blue.svg)](#-available-tools)
  [![Pre-commit](https://img.shields.io/badge/pre--commit-enabled-brightgreen?logo=pre-commit&logoColor=white)](https://pre-commit.com/)
  
</div>

## 🚀 Features

### Core JIRA Operations
- **Ticket Management**: Fetch, create, and update JIRA tickets
- **Comment System**: Add formatted comments to any JIRA ticket
- **Status Transitions**: Change ticket status with available transitions
- **Field Updates**: Update ticket descriptions with proper JIRA markup

### Advanced Project Management  
- **Issue Linking**: Create relationships between tickets (blocks, relates to, depends on)
- **Epic Hierarchy**: Manage epic-story-task relationships automatically
- **Project Structure**: Bulk create and validate complete project hierarchies
- **Status Automation**: Intelligent story status updates based on task completion

### Claude Integration & Development Workflow
- **Seamless Setup**: Automatic Claude Code CLI and Claude Desktop configuration
- **Environment Management**: Secure environment variable injection
- **Interactive Tools**: 13 MCP tools available in Claude conversations
- **Smart Commit Workflow**: Automatic JIRA ticket ID extraction from branch names
- **Claude Code Integration**: Automated changelog and documentation updates

## 📦 Installation

### Installation Methods

#### 1. From NPM (Recommended)
```bash
# Install globally
npm install -g bds-jira-mcp
# or
pnpm add -g bds-jira-mcp

# Run interactive setup
npx bds-jira-mcp-setup
```

#### 2. From GitHub Releases
Download the latest release from [GitHub Releases](https://github.com/nmindz/bds-jira-mcp/releases):

**Option A: Install Package Tarball**
```bash
# Download the .tgz file from releases
npm install -g ./bds-jira-mcp-1.1.2.tgz
```

**Option B: Use Pre-built Archive**
```bash
# Download and extract the build archive
tar -xzf bds-jira-mcp-build-v1.1.2.tar.gz
cd build/
node index.js
```

#### 3. From Source
```bash
# Clone the repository
git clone https://github.com/nmindz/bds-jira-mcp.git
cd bds-jira-mcp

# Install dependencies
pnpm install

# Build the project
pnpm run build

# Run setup
node build/setup.js
```

### Requirements
- Node.js 18+ (for ESM module support)
- JIRA Cloud instance with API access
- Claude Code CLI or Claude Desktop

## ⚙️ Configuration

### JIRA Setup
1. **JIRA API Token**: Generate from your JIRA profile settings
2. **Base URL**: Your JIRA Cloud URL (e.g., `https://company.atlassian.net`)
3. **Email**: Your JIRA account email

### Environment Variables
```bash
JIRA_BASE_URL=https://your-company.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_API_TOKEN=your-api-token
JIRA_PROJECT_KEY=PROJ  # Optional default project
```

### Claude Integration
The setup command automatically configures:
- **Claude Code CLI**: `~/.claude.json`
- **Claude Desktop**: Platform-specific MCP configuration

## 🛠️ Available Tools

### Core JIRA Tools
| Tool | Description |
|------|-------------|
| `get_jira_ticket` | Fetch and display ticket details |
| `create_jira_ticket` | Create new tickets with full field support |
| `post_jira_comment` | Add comments to JIRA tickets |
| `update_ticket_description` | Update ticket descriptions with proper formatting |
| `update_ticket_status` | Change ticket status using transitions |
| `get_available_transitions` | Get available status transitions |

### Advanced Management Tools
| Tool | Description |
|------|-------------|
| `link_jira_issues` | Create relationships between issues |
| `set_epic_link` | Attribute stories and tasks to parent epics |
| `get_issue_links` | Retrieve existing issue relationships |
| `create_project_hierarchy` | Bulk create epic-story-task hierarchies |
| `validate_project_structure` | Verify hierarchical relationships |
| `update_story_statuses` | Auto-update story statuses based on task completion |
| `analyze_story_status` | Analyze story completion based on related tasks |

## 💻 Usage Examples

### Basic Ticket Operations
```typescript
// Fetch a ticket
await mcp.call("get_jira_ticket", { ticketId: "PROJ-123" });

// Create a new ticket
await mcp.call("create_jira_ticket", {
  summary: "Fix login bug",
  description: "Users cannot login with SSO",
  issueType: "Bug",
  priority: "High"
});

// Add a comment
await mcp.call("post_jira_comment", {
  ticketId: "PROJ-123",
  comment: "Bug has been reproduced and fix is in progress."
});
```

### Project Hierarchy Management
```typescript
// Create complete project structure
await mcp.call("create_project_hierarchy", {
  hierarchy: {
    epic: {
      summary: "User Authentication System",
      description: "Complete overhaul of authentication"
    },
    stories: [
      {
        summary: "SSO Integration",
        description: "Implement Single Sign-On",
        tasks: [
          { summary: "OAuth2 Provider Setup" },
          { summary: "User Migration Scripts" }
        ]
      }
    ]
  }
});

// Validate project structure
await mcp.call("validate_project_structure", { epicKey: "PROJ-100" });
```

### Automated Status Management
```typescript
// Analyze story based on task completion
await mcp.call("analyze_story_status", { storyKey: "PROJ-101" });

// Update all story statuses in an epic
await mcp.call("update_story_statuses", { epicKey: "PROJ-100" });
```

### Smart Commit Workflow
```bash
# Create branch with JIRA ticket ID
git checkout -b feature/PROJ-123-add-user-authentication

# Use smart commit script (extracts PROJ-123 automatically)
npm run commit
# Prompts for commit message and creates structured commit with JIRA reference

# Or manual commit with JIRA integration
git commit -m "feat: add OAuth2 integration

Implements SSO authentication for enterprise users.
Addresses requirements in PROJ-123."
```

## 🏗️ Development

### Local Development
```bash
# Clone and install
git clone <repository-url>
cd bds-jira-mcp
npm install

# Development with .env loading
DEBUG=true npm run dev-start
# or
ENVIRONMENT=development npm run dev-start

# Build and test
npm run build
npm test
```

### Scripts
- `npm run build` - Compile TypeScript with executables
- `npm run debug` - Run with debug mode and .env loading  
- `npm run dev-start` - Development mode with environment loading
- `npm run commit` - Smart commit with automatic JIRA ticket ID extraction
- `pnpm run redeploy` - Build and publish to local registry
- `npm run claude:update-changelog` - Automated changelog review and update with Claude
- `npm run claude:update-docs` - Automated documentation review and update with Claude

### Environment-Based Configuration
The server uses conditional environment loading:
- **Production**: Uses environment variables directly
- **Development**: Loads `.env` file when `DEBUG=true` or `ENVIRONMENT=development`

## 🔧 MCP Server Details

### Transport
- **STDIO Transport**: Compatible with Claude Code CLI and Claude Desktop
- **Tool Registration**: Uses official MCP SDK patterns
- **Error Handling**: Comprehensive error handling with user-friendly messages

### Architecture
- **TypeScript + ESM**: Modern ES module architecture
- **Lazy Initialization**: Services initialize only when needed
- **Dual JIRA API**: REST API v2 for compatibility, v3 for advanced features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript strict mode
- Use ESM modules (import/export)
- Implement lazy service initialization
- Add comprehensive error handling
- Update tests and documentation

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues
- **Environment Variables**: Ensure all required JIRA variables are set
- **Claude Integration**: Restart Claude after setup for changes to take effect
- **API Permissions**: Verify JIRA API token has necessary permissions

### Troubleshooting
```bash
# Test JIRA connection
curl -u email@company.com:api-token https://company.atlassian.net/rest/api/2/myself

# Debug mode
DEBUG=true npx bds-jira-mcp --help

# Verify Claude configuration
cat ~/.claude.json  # Claude Code CLI
# Check Claude Desktop settings for MCP servers
```

### Getting Help
- Check the [troubleshooting guide](.cursor/rules/troubleshooting.md)
- Review [development documentation](CLAUDE.md)
- Open an issue for bugs or feature requests

## 🚀 Releases & CI/CD

### Automated Release Process

This project uses GitHub Actions for automated releases. When a new version is pushed to the `master` branch:

1. **Automatic NPM Publishing**: The package is automatically published to NPM
2. **GitHub Release Creation**: A release is created with downloadable assets
3. **Release Assets**: Each release includes:
   - **Package Tarball** (`.tgz`): Ready-to-install NPM package
   - **Build Archive** (`.tar.gz`): Pre-compiled TypeScript build
   - **Source Code**: Automatic GitHub source archives

### Release Workflow

```bash
# 1. Bump version
pnpm run bump:patch  # or bump:minor, bump:major

# 2. Commit and push
git add package.json
git commit -m "chore: bump version to 1.1.3"
git push origin master

# 3. Create and push tag
git tag -a v1.1.3 -m "Release v1.1.3"
git push origin v1.1.3
```

The CI/CD pipeline will automatically:
- ✅ Build and test the code
- ✅ Publish to NPM (if version is new)
- ✅ Create GitHub release with assets
- ✅ Generate release notes from changelog

### Available Release Assets

Each GitHub release provides multiple installation options:

| Asset | Description | Use Case |
|-------|-------------|----------|
| `bds-jira-mcp-{version}.tgz` | NPM package tarball | Local/offline installation |
| `bds-jira-mcp-build-v{version}.tar.gz` | Pre-built TypeScript | Direct execution without npm |
| Source code (zip/tar.gz) | Complete source | Development/customization |

## 🚀 Roadmap

### Completed ✅
- Core JIRA operations and ticket management
- Issue linking and epic hierarchy management  
- Automated story status management
- Claude Code CLI and Desktop integration
- Interactive setup and configuration

### Planned (Maybe) 🎯
- Advanced field mapping and templates
- Multi-instance JIRA support
- Enhanced search and filtering

---

**Built with ❤️ by @nmindz**
(yes I used AI tools)
