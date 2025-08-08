# Development Rules Context - jira-mcp/.cursor

## Directory Overview
This directory contains development guidelines, rules, and documentation specific to Cursor IDE integration and development workflows.

## Rule Files Structure

### `rules/` Subdirectory
Contains modular development rule files for different aspects of the project:

#### `mcp-development.md`
- **Purpose**: MCP-specific development patterns and best practices
- **Scope**: MCP tool implementation, service initialization, error handling
- **Key Patterns**: Lazy loading, Zod validation, consistent error responses

#### `troubleshooting.md` (Future)
- **Purpose**: Common issues and their solutions during development
- **Scope**: Environment setup, JIRA API issues, Claude integration problems

### `.cursorrules` (Root Level)
- **Purpose**: Main Cursor IDE configuration file
- **Content**: Project overview, code style guidelines, architectural patterns
- **Integration**: References detailed rule files for specific topics

## Development Workflow Integration

### Cursor IDE Features
- **Context Awareness**: Rules provide context for AI-assisted development
- **Code Completion**: Guidelines inform intelligent code suggestions
- **Error Prevention**: Common pitfalls documented to prevent issues

### Rule Categories

#### Code Style & Architecture
```typescript
// Enforced patterns from .cursorrules
- TypeScript strict mode
- ESM modules only (import/export)
- Async/await over promises
- Zod for input validation
- Conventional commit messages
```

#### MCP-Specific Guidelines
```typescript
// From mcp-development.md
- Lazy service initialization: getJiraService()
- Consistent error handling with try/catch
- Zod schemas for all MCP tool inputs
- Service initialization in every public method
```

#### Environment & Configuration
```bash
# Development environment patterns
DEBUG=true          # Enable .env loading
ENVIRONMENT=development  # Alternative env loading trigger
npm run debug       # Development with enhanced logging
```

### Integration with Project Structure

#### Service Development Rules
- **Location**: `src/services/`  
- **Pattern**: Lazy initialization with `initialize()` method
- **Validation**: Environment variables checked at service init
- **Error Handling**: User-friendly messages with actionable guidance

#### MCP Tool Development Rules
- **Location**: `src/index.ts` tool registrations
- **Pattern**: Consistent `server.registerTool()` structure  
- **Input Validation**: Zod schemas with descriptive error messages
- **Response Format**: Standardized success/error response structure

#### Build Process Rules
- **TypeScript Config**: ESM target with strict mode
- **Executable Permissions**: Applied automatically in build script
- **Shebang Headers**: Preserved in compiled output for CLI usage

## Documentation Standards

### File Documentation Requirements
- **CLAUDE.md**: Context files in every directory
- **README.md**: User-facing documentation with usage examples
- **Code Comments**: Minimal, focused on business logic only
- **Type Definitions**: Comprehensive TypeScript interfaces

### Version Control Guidelines
- **Commit Format**: Conventional commits for changelog generation
- **Branch Naming**: `feature/`, `fix/`, `docs/` prefixes
- **PR Requirements**: Tests pass, documentation updated, types valid

### Licensing Standards
- **License**: Apache 2.0 as specified in package.json
- **Copyright**: Evandro Camargo 2024
- **File Headers**: Not required but can include license reference

## Testing & Quality Assurance

### Development Testing Patterns
```bash
# Local development testing
npm run build                    # Compile TypeScript
DEBUG=true npm run dev-start    # Test with .env loading
npx jira-mcp --help            # Verify CLI functionality
npx jira-mcp setup             # Test interactive setup
```

### Code Quality Checks
- **TypeScript**: Strict mode compilation with type checking
- **ESM Compatibility**: Node.js 18+ ESM module support
- **Runtime Validation**: Zod schemas for input validation
- **Error Handling**: Comprehensive try/catch with user guidance

### Integration Testing
```bash
# Claude Code CLI integration
npx jira-mcp setup
# Test in Claude conversation

# Local NPM registry testing  
npm run redeploy
npm install --registry http://localhost:4873/ jira-mcp
```

## Common Development Scenarios

### Adding New MCP Tools
1. **Define Tool**: Add to `src/index.ts` with proper Zod schema
2. **Implement Logic**: Add method to appropriate service class
3. **Test Integration**: Use `DEBUG=true` mode for development
4. **Update Documentation**: Add tool to README.md and CLAUDE.md

### Modifying JIRA Integration
1. **Service Method**: Add/modify methods in `src/services/jira.ts`
2. **Error Handling**: Include proper JIRA API error handling
3. **Text Formatting**: Use `formatJiraText()` for comment/description updates
4. **Test Connectivity**: Verify with real JIRA instance

### Environment Configuration Changes
1. **Variable Addition**: Update service initialization validation
2. **Documentation**: Update README.md configuration section  
3. **Setup Tool**: Modify `src/setup.ts` to handle new variables
4. **Rule Files**: Update environment guidelines in rule files

## IDE-Specific Features

### Cursor Integration Benefits
- **Context-Aware Suggestions**: Rules inform AI-powered completions
- **Pattern Recognition**: Consistent patterns detected and suggested
- **Error Prevention**: Common pitfalls flagged before runtime
- **Documentation Generation**: Structure supports automated docs

### Development Experience
- **Fast Iteration**: Hot reload with `npm run dev`
- **Type Safety**: Full TypeScript support with strict mode
- **Environment Flexibility**: Easy switching between dev/prod configs
- **Claude Testing**: Direct integration testing with Claude conversations

## Best Practices Enforcement

### Automated Checks (Future)
- **Pre-commit Hooks**: TypeScript compilation, linting
- **CI/CD Integration**: Automated testing with multiple Node.js versions
- **Dependency Scanning**: Security and license compliance checks

### Manual Review Guidelines
- **Code Reviews**: Focus on service patterns, error handling, documentation
- **Architecture Decisions**: Document significant changes in CLAUDE.md
- **Breaking Changes**: Version bump and migration guide requirements

## Rule Evolution

### Adding New Rules
1. **Identify Pattern**: Recurring development challenges or patterns
2. **Document Solution**: Create or update relevant rule file
3. **Test Application**: Verify rules improve development experience
4. **Integration**: Reference in main `.cursorrules` if widely applicable

### Rule Maintenance
- **Regular Review**: Update rules as project evolves
- **Feedback Integration**: Incorporate lessons learned from development
- **Cross-Reference**: Ensure consistency between rule files
- **Documentation Sync**: Keep rules aligned with actual codebase patterns
