# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.2] - 2025-01-08

### Changed
- **BREAKING**: Package name changed from `jira-mcp` to `bds-jira-mcp`
- **BREAKING**: Binary executables renamed with `bds-` prefix:
  - `jira-mcp` → `bds-jira-mcp`
  - `jira-mcp-setup` → `bds-jira-mcp-setup`
  - `jira-mcp-reconfigure` → `bds-jira-mcp-reconfigure`
- Repository references updated to reflect new GitHub organization
- Package management scripts migrated from npm to pnpm
- Help text and CLI messages updated to reflect new package name

### Added
- Project logo (logo.svg)
- Comprehensive test suite restructuring with new unit tests for core modules
- Unit tests for index.ts and jira-service modules
- Enhanced test organization with dedicated setup configuration
- Improved test coverage and validation for smart commit workflow

### Fixed
- Newline escaping issues in smart commit messages  
- Enhanced smart commit pre-commit hook handling with better error management
- Improved package configuration validation and build process
- Updated documentation for better clarity and consistency

### Changed
- Refined smart commit workflow for better Claude Code integration
- Enhanced JIRA service stability and error handling

## [1.1.1] - 2025-01-08

### Fixed
- Improved smart commit pre-commit hook handling
- Enhanced package configuration and validation
- Test expectations alignment with npm package corrections

## [1.1.0] - 2025-01-08

### Added
- Smart commit workflow with automatic JIRA ticket ID extraction from branch names
- Claude Code integration for automated changelog and documentation updates
- Enhanced test coverage for smart commit functionality
- Cleanup scripts for development workflow automation

### Enhanced
- JIRA service with improved ticket ID extraction capabilities
- Development workflow with automated commit message generation
- Test infrastructure with better verification of workflow functionality

### Fixed
- Test expectations after npm package corrections
- Smart commit workflow edge cases and error handling

## [1.0.1] - 2025-01-08

### Added
- Initial release of comprehensive JIRA MCP server
- 13 MCP tools for complete JIRA workflow automation
- Interactive setup tool for Claude Code CLI and Desktop integration
- JIRA API integration with REST API v2/v3 support
- Epic-story-task hierarchy management with automated linking
- Issue linking and relationship management (blocks, relates to, depends on)
- Automated story status updates based on task completion
- Environment variable validation and secure configuration
- TypeScript implementation with ESM modules and lazy service initialization
- Comprehensive error handling with user-friendly messages

### Technical Features
- Model Context Protocol (MCP) server implementation
- StdioServerTransport for Claude integration
- Zod schemas for input validation
- Axios-based HTTP client for JIRA API
- Conditional dotenv loading for development
- Executable build output with shebang headers
- NPM package distribution with bin entries

### Documentation
- Comprehensive README.md with installation and usage instructions
- CLAUDE.md with development context and architecture decisions
- Environment variable configuration examples
- Setup and troubleshooting guides

---

## Release Notes

### Version 1.0.1 - Initial Release
This is the initial release of the JIRA MCP server, providing comprehensive JIRA workflow automation through 13 specialized MCP tools. The project focuses on issue management, epic-story-task hierarchies, and automated status updates.

## Development Milestones

### Completed Features ✅
- ✅ Core JIRA operations (tickets, comments, status updates)
- ✅ Issue linking and epic hierarchy management
- ✅ Automated story status updates based on task completion
- ✅ Claude Code CLI and Desktop integration
- ✅ Interactive setup and configuration tools
- ✅ Comprehensive documentation and licensing

### Future Roadmap 🎯
- 🎯 Webhook integration for real-time updates
- 🎯 Custom dashboards and reporting capabilities
- 🎯 Advanced field mapping and template systems
- 🎯 Multi-instance JIRA support
- 🎯 Enhanced search and filtering capabilities

## Contributors

- **Evandro Camargo** - Initial development and architecture
- **Claude AI** - Development assistance and code generation

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

Copyright 2025 Evandro Camargo

---

*For detailed technical information, see [CLAUDE.md](CLAUDE.md). For usage instructions, see [README.md](README.md).*
