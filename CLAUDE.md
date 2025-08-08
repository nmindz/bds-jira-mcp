# Claude MCP Development Context

## Project Overview
This is a Model Context Protocol (MCP) server project called `jira-mcp` that provides comprehensive JIRA integration and project management capabilities. **Status**: Production-ready and fully functional as of v1.1.0.

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

### Development Guidelines
- No longer update the current package version in either changelog or package.json without explicit directions to do so

### Architecture Decisions
- **Language**: TypeScript with Node.js ESM modules
- **MCP SDK**: Official @modelcontextprotocol/sdk version 1.12.0
- **JIRA Integration**: REST API v2 for general operations, v3 for linking functionality
- **Schema Validation**: Zod for input parameter validation
- **Environment Management**: Conditional dotenv loading for development (DEBUG=true or ENVIRONMENT=development)
- **Service Pattern**: Lazy initialization to prevent premature environment variable validation

[... rest of the existing content remains unchanged ...]
