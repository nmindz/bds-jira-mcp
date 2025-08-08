# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.3.0] - 2025-08-08

### Added
- Initial release of comprehensive JIRA MCP server
- 15 MCP tools for complete JIRA workflow automation
- Interactive setup tool for Claude Code CLI and Desktop integration
- JIRA API integration with REST API v2/v3 support
- Epic-story-task hierarchy management with automated linking
- Issue linking and relationship management (blocks, relates to, depends on)
- Automated story status updates based on task completion
- Environment variable validation and secure configuration
- Pre-commit framework integration for comprehensive workflow automation
- TypeScript implementation with ESM modules and lazy service initialization
- Comprehensive error handling with user-friendly messages
- Nested CLAUDE.md files for improved codebase context and navigation
- Version consistency validation across documentation files
- Automated documentation synchronization checks
- Complete project documentation with README.md, CLAUDE.md
- Apache 2.0 LICENSE file with proper copyright notice
- Enhanced Cursor IDE integration with detailed development rules
- Comprehensive Jest testing framework with unit and e2e tests
- Test coverage reporting and CI integration
- Enhanced testing documentation in docs/TESTING.md
- Coverage reports with HTML output and lcov format
- Test fixtures for JIRA API response mocking
- E2e workflow tests for complete user scenarios

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
- Pre-commit setup documentation

---

## Release Notes

### Version 1.3.0 - Initial Release
This is the initial release of the JIRA MCP server, providing comprehensive JIRA workflow automation through 13 specialized MCP tools. The project focuses on issue management, epic-story-task hierarchies, and automated status updates with professional-grade quality assurance.

## Development Milestones

### Completed Features ✅
- ✅ Core JIRA operations (tickets, comments, status updates)
- ✅ Issue linking and epic hierarchy management
- ✅ Automated story status updates based on task completion
- ✅ Claude Code CLI and Desktop integration
- ✅ Interactive setup and configuration tools
- ✅ Comprehensive documentation and licensing
- ✅ Pre-commit workflow automation
- ✅ Automated testing and CI/CD integration

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
