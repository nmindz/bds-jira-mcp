# Claude MCP Development Context

## Project Overview
This is a Model Context Protocol (MCP) server project called `jira-mcp` that provides comprehensive JIRA integration and project management capabilities. **Status**: Production-ready and fully functional as of v1.0.1.

## Original Intent
The user requested bootstrapping an MCP project in NodeJS according to the official MCP documentation at https://modelcontextprotocol.io/quickstart/server#node. The project evolved to focus on comprehensive JIRA integration and project management capabilities:

1. **Core JIRA Operations**: Ticket management, commenting, and status updates
2. **Issue Hierarchy Management**: Complete epic-story-task relationship handling
3. **Project Structure Automation**: Bulk creation and validation of project hierarchies  
4. **Status Automation**: Intelligent story status updates based on task completion
5. **Issue Linking**: Comprehensive relationship management (blocks, relates to, depends on)
6. **Advanced JIRA Features**: Custom field support, transitions, and bulk operations

## Development Context

Last updated: 2025-08-08

### Quality Assurance & Automation
- **Pre-commit Framework**: Comprehensive workflow automation using pre-commit hooks
- **Documentation Sync**: Automatic version and tool count updates across all documentation
- **Changelog Management**: Keep a Changelog format with automated validation
- **Build Verification**: TypeScript compilation validation before commits
- **Version Consistency**: Cross-file version reference validation

### Architecture Decisions
- **Language**: TypeScript with Node.js ESM modules
- **MCP SDK**: Official @modelcontextprotocol/sdk version 1.12.0
- **JIRA Integration**: REST API v2 for general operations, v3 for linking functionality
- **Schema Validation**: Zod for input parameter validation
- **Environment Management**: Conditional dotenv loading for development (DEBUG=true or ENVIRONMENT=development)
- **Service Pattern**: Lazy initialization to prevent premature environment variable validation

### Key Components

1. **Main Server** (`src/index.ts`):
   - MCP server initialization with StdioServerTransport
   - Lazy service instantiation pattern to avoid module-level initialization
   - Tool registration using the correct `registerTool()` API pattern
   - Comprehensive error handling for all operations
   - Conditional dotenv loading for development debugging

2. **JIRA Service** (`src/services/jira.ts`):
   - **Dual API Integration**: REST API v2 for compatibility, v3 for advanced features
   - **Lazy Initialization**: Environment validation deferred until first use
   - **Complete Feature Set**: Ticket management, commenting, status transitions, issue linking
   - **Hierarchy Management**: Epic-story-task relationships using parent field
   - **Status Automation**: Automatic story status updates based on task completion
   - **Advanced Features**: Project hierarchy creation, structure validation, bulk operations
   - **JIRA Markup Support**: Proper text formatting with `formatJiraText()` helper

3. **Interactive Setup Tool** (`src/setup.ts`):
   - **ESM-Compatible**: Proper `__dirname` handling for ESM modules using `fileURLToPath`
   - **Multi-Platform Support**: Claude Code CLI and Claude Desktop configuration
   - **Environment Variable Approach**: No .env files in production, uses MCP server environment injection
   - **Configuration Validation**: Real-time JIRA connection testing during setup
   - **Path Correction**: Uses correct `~/.claude.json` path for Claude Code CLI
   - **Command Structure**: NPX-based commands instead of filesystem path references

### Tools Provided (13 MCP Tools)
**Core JIRA Tools:**
1. `get_jira_ticket` - Fetch and display ticket details
2. `post_jira_comment` - Add comments to JIRA tickets
3. `create_jira_ticket` - Create new tickets with full field support

**Advanced JIRA Management:**
4. `link_jira_issues` - Create relationships between issues (blocks, relates to, depends on)
5. `set_epic_link` - Attribute stories and tasks to parent epics
6. `get_issue_links` - Retrieve existing issue relationships
7. `create_project_hierarchy` - Bulk create epic-story-task hierarchies
8. `validate_project_structure` - Verify hierarchical relationships

**Status Management:**
9. `update_ticket_status` - Change ticket status using transitions
10. `get_available_transitions` - Get available status transitions
11. `update_story_statuses` - Auto-update story statuses based on task completion
12. `analyze_story_status` - Analyze story completion based on related tasks
13. `update_ticket_description` - Update ticket descriptions with proper formatting

### Development Challenges Encountered & Solutions

#### **Critical Architecture Issues Solved:**
1. **Service Initialization Problem**:
   - **Issue**: Services initialized at module level caused "Missing environment variables" errors on help commands
   - **Solution**: Implemented lazy service initialization with getter functions and deferred environment validation

2. **ESM Module Compatibility**:
   - **Issue**: `__dirname` not available in ESM modules caused setup failures
   - **Solution**: Used `fileURLToPath(import.meta.url)` pattern for proper ESM compatibility

3. **Configuration Path Issues**:
   - **Issue**: Wrong Claude Code CLI config path and filesystem-based commands
   - **Solution**: Corrected to `~/.claude.json` and NPX-based command structure

#### **JIRA Integration Challenges:**
4. **Epic Linking Complexity**:
   - **Issue**: Epic link custom fields varied between JIRA instances
   - **Solution**: Discovered and implemented parent field relationships for universal compatibility

5. **JIRA Markup Formatting**:
   - **Issue**: Markdown formatting caused visualization problems in JIRA
   - **Solution**: Created `formatJiraText()` helper for proper JIRA markup conversion

6. **Story Status Automation**:
   - **Issue**: Manual story status management was inefficient
   - **Solution**: Implemented intelligent status analysis and automatic updates based on task completion

#### **Development Workflow Issues:**
7. **Environment Management**:
   - **Issue**: Production systems shouldn't load .env files
   - **Solution**: Conditional dotenv loading only for DEBUG=true or ENVIRONMENT=development

8. **MCP Tool Availability**:
   - **Issue**: New tools weren't available after implementation
   - **Solution**: Required environment reload and proper service initialization

### Configuration Requirements
- **Environment Variables**: JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN, JIRA_PROJECT_KEY (optional)
- **Runtime**: Node.js 18+ for ESM support
- **Git**: Available in system PATH for workflow automation
- **Claude Integration**: Automatic via setup tool

### Setup Command & Integration
- **Interactive Setup**: `npx jira-mcp setup` with real-time JIRA validation
- **Development Mode**: `DEBUG=true` or `ENVIRONMENT=development` for .env loading
- **Claude Code CLI**: Automatic `~/.claude.json` configuration with environment variables
- **Claude Desktop**: Automatic configuration with proper MCP server registration
- **Package Management**: Published to NPM registry with executable permissions

### Deployment & Production Status
- **Build System**: TypeScript compilation to `build/` with executable permissions
- **NPM Publication**: Available as `jira-mcp` package with proper bin entries
- **MCP Compatibility**: Full STDIO transport support for Claude Code CLI and Claude Desktop
- **Environment Variables**: Production uses MCP server environment injection, no .env files
- **Development Support**: Conditional dotenv loading with debug messaging
- **Version Management**: Currently v1.0.1 with semantic versioning

## File Structure (Updated)
```
jira-mcp/
├── src/
│   ├── index.ts          # Main MCP server with lazy service initialization
│   ├── setup.ts          # Interactive setup with ESM compatibility
│   ├── reconfigure.ts    # Reconfiguration utility
│   └── services/
│       └── jira.ts       # Comprehensive JIRA API integration (v2 + v3)
├── build/                # TypeScript build output with executables
│   ├── index.js          # Built MCP server (chmod +x)
│   ├── setup.js          # Built setup command (chmod +x)
│   └── services/         # Built service modules
├── .cursor/
│   └── rules/            # Cursor Agentic tool guidance
├── .cursorrules          # Main Cursor configuration
├── .pre-commit-config.yaml # Pre-commit hook configuration
├── scripts/
│   ├── update-docs.js    # Documentation automation script
│   └── validate-changelog.js # Changelog validation script
├── docs/
│   └── PRE_COMMIT_SETUP.md # Pre-commit workflow guide
├── package.json          # NPM package with bin entries and scripts
├── tsconfig.json         # TypeScript ESM configuration
├── .env.example          # Environment template
├── .env                  # Development environment (conditional loading)
├── README.md             # User documentation
├── CHANGELOG.md          # Keep a Changelog format changelog
└── CLAUDE.md             # This development context file
```

## Current Status & Achievements

### **Production Readiness Achieved**:
✅ **All Core Requirements Fulfilled**
✅ **13 MCP Tools Implemented and Working**  
✅ **Published NPM Package (v1.0.1)**
✅ **Claude Code and Claude Desktop Integration**
✅ **Interactive Setup Tool with JIRA Validation**
✅ **Complete JIRA Workflow Automation**
✅ **Advanced Project Management Features**

### **Technical Excellence**:
✅ **Proper ESM Module Architecture**
✅ **Lazy Initialization Pattern**
✅ **Conditional Development Environment**
✅ **Comprehensive Error Handling**
✅ **Production-Grade Configuration Management**
✅ **Automated Testing and Publishing Workflow**

## Development Workflow Commands
```bash
# Standard Development
npm run build              # Compile TypeScript with executables
npm run debug             # Run with .env loading (DEBUG=true)
npm run dev-start         # Alternative development mode
pnpm run redeploy         # Build + publish to localhost registry

# Testing & Verification
npx jira-mcp --help       # Test help without environment variables
npx jira-mcp setup        # Test interactive setup process
DEBUG=true npx jira-mcp   # Test with debug mode and .env loading

# Package Management
npm install --registry http://localhost:4873/ jira-mcp  # Install from local registry
```

## Future Enhancement Opportunities (Achieved vs Planned)
✅ **JIRA status transitions** - Implemented with automated story status management
✅ **Multi-project support** - Available through JIRA_PROJECT_KEY configuration
✅ **Issue linking and relationships** - Comprehensive linking system implemented
✅ **Epic hierarchy management** - Full epic-story-task relationship support
⚠️ **Webhook integrations** - Not yet implemented
⚠️ **Custom dashboards and reporting** - Not yet implemented
⚠️ **Advanced field mapping** - Basic field support implemented

## Pre-commit Framework Integration

### Workflow Automation
The project implements comprehensive pre-commit hooks to ensure quality and consistency:

#### **Automated Validations**:
- **TypeScript Build**: Compilation verification before commits
- **Documentation Sync**: Tool count and version consistency across files  
- **Changelog Validation**: Ensures proper Keep a Changelog format compliance
- **File Quality**: Trailing whitespace, end-of-file fixes, YAML/JSON validation
- **Security**: Private key detection, large file prevention

#### **Documentation Automation**:
- **scripts/update-docs.js**: Automatically updates version references and tool counts
- **scripts/validate-changelog.js**: Validates changelog entries for current version
- **Version Consistency**: Cross-file version reference validation

#### **Workflow Integration**:
```bash
# Automatic execution on commit
git commit -m "feat: add new feature"  # Runs all hooks

# Manual execution
npm run update-docs                    # Update documentation  
npm run validate-changelog             # Validate changelog
npm run prepublishOnly                 # Full pre-publish validation
```

### Quality Gates
- **Pre-commit**: All hooks must pass before commit acceptance
- **Pre-publish**: Documentation and changelog validation before NPM publish
- **Continuous Integration**: Hooks prevent common CI/CD failures

## Key Learning Outcomes
1. **ESM Module Patterns**: Proper handling of `__dirname`, imports, and module initialization
2. **MCP Development**: Tool registration, lazy initialization, and environment management
3. **JIRA API Mastery**: Dual API usage, hierarchy management, and status automation
4. **Production Deployment**: NPM packaging, environment injection, and Claude integration
5. **Error Handling**: Graceful failure management and user-friendly error messaging
6. **Quality Automation**: Pre-commit framework integration for comprehensive workflow automation
7. **Documentation Consistency**: Automated synchronization across multiple documentation files

The project successfully evolved from a simple workflow tool to a comprehensive JIRA-MCP integration platform focused on issue management, project hierarchy automation, and status management - serving as a production-ready solution for development teams using JIRA.
