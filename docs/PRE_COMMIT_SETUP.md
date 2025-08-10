# Pre-commit Framework Setup Guide

This document explains the comprehensive pre-commit workflow implemented for the bds-jira-mcp project.

## Overview

The pre-commit framework ensures that every commit maintains high quality standards and keeps documentation synchronized automatically. This prevents common issues like:

- Outdated documentation
- Version inconsistencies across files
- Build failures in production
- Missing changelog entries

## Installation & Setup

### Initial Setup
```bash
# Install dependencies (already done if you've run npm install)
npm install

# Install pre-commit framework (if not already installed)
pip install pre-commit
# Or: brew install pre-commit (on macOS)

# Set up pre-commit hooks
pre-commit install
```

### Verify Installation
```bash
# Test pre-commit hooks
npx pre-commit run --all-files

# Or test individual scripts
npm run update-docs
npm run validate-changelog
npm test
```

## Pre-commit Hook Configuration

### Hook Categories

#### 1. Project-Specific Validations (`local` hooks)
- **TypeScript Build**: Ensures code compiles successfully
- **README Tool Count**: Verifies MCP tool count accuracy
- **Version Consistency**: Checks version alignment across files
- **CLAUDE.md Sync**: Validates documentation reflects current architecture

#### 2. Standard Quality Checks (`pre-commit-hooks`)
- **File Format**: Trailing whitespace, end-of-file fixes
- **Syntax Validation**: YAML, JSON format checking
- **Security**: Private key detection, large file prevention
- **Merge Conflicts**: Prevents committing conflict markers

#### 3. Documentation Formatting
- **Markdown Linting**: Consistent markdown formatting
- **YAML Formatting**: Prettier formatting for YAML files
- **JSON Formatting**: Package.json consistency

## Automation Scripts

### Documentation Update (`scripts/update-docs.js`)
Automatically maintains documentation consistency:

```bash
npm run update-docs
```

**Functions:**
- Updates version references in README.md and CLAUDE.md
- Validates and corrects MCP tool counts
- Updates build timestamps
- Ensures documentation reflects current state

### Changelog Validation (`scripts/validate-changelog.js`)
Ensures proper changelog maintenance:

```bash
npm run validate-changelog
```

**Checks:**
- Current version has changelog entry
- Keep a Changelog format compliance
- Semantic Versioning adherence
- Unreleased section presence

## Workflow Integration

### Automatic Execution
Pre-commit hooks run automatically on:
- `git commit` (all configured hooks)
- `npm run prepublishOnly` (before npm publish)
- `npm test` (comprehensive validation)

### Manual Execution
```bash
# Run all hooks manually
npx pre-commit run --all-files

# Run specific hook
npx pre-commit run typescript-build

# Skip hooks (emergency use only)
git commit --no-verify -m "Emergency commit"
```

## Development Workflow

### Standard Commit Process
```bash
# Make your changes
git add .

# Commit (hooks run automatically)
git commit -m "feat: add new MCP tool for ticket linking"

# If hooks fail, fix issues and retry
git add .
git commit -m "feat: add new MCP tool for ticket linking"
```

### Pre-publish Workflow
```bash
# Update version
npm version patch  # or minor/major

# Automatically runs:
# 1. Build project
# 2. Update documentation
# 3. Validate changelog
npm run prepublishOnly

# Publish if all checks pass
npm publish
```

### Version Update Checklist
When updating version (`package.json`):

1. **Update CHANGELOG.md** with new version entry:
   ```markdown
   ## [1.3.0] - 2024-XX-XX

   ### Added
   - Pre-commit framework integration

   ### Changed
   - Enhanced documentation automation
   ```

2. **Commit version changes**:
   ```bash
   git add package.json CHANGELOG.md
   git commit -m "chore: bump version to 1.3.0"
   ```

3. **Pre-commit hooks automatically**:
   - Validate changelog has entry for new version
   - Update documentation version references
   - Ensure tool count consistency
   - Build and test project

## Hook Configuration Details

### `.pre-commit-config.yaml` Structure
```yaml
repos:
  - repo: local          # Project-specific hooks
  - repo: https://...    # Standard community hooks
  - repo: https://...    # Formatting tools
```

### Custom Hook Examples

#### Tool Count Validation
```bash
# Counts MCP tools in src/index.ts and validates README.md
count=$(grep -o "registerTool" src/index.ts | wc -l)
grep -q "$count MCP tools" README.md || exit 1
```

#### Version Consistency Check
```bash
# Ensures CHANGELOG.md has entry for current package.json version
version=$(node -p "require('./package.json').version")
grep -q "[$version]" CHANGELOG.md || exit 1
```

## Troubleshooting

### Common Issues

#### Hook Installation Problems
```bash
# Reinstall pre-commit framework
pip uninstall pre-commit
pip install pre-commit

# Or on macOS with Homebrew
brew uninstall pre-commit
brew install pre-commit

# Reinstall hooks
pre-commit uninstall
pre-commit install
```

#### Documentation Update Failures
```bash
# Check script permissions
chmod +x scripts/update-docs.js
chmod +x scripts/validate-changelog.js

# Run scripts manually to debug
npm run update-docs
npm run validate-changelog
```

#### Build Failures in Hooks
```bash
# Check TypeScript compilation
npm run build

# Verify all imports and exports
npm run dev
```

#### Version Mismatch Errors
```bash
# Update changelog for current version
# Edit CHANGELOG.md and add entry for package.json version

# Re-run validation
npm run validate-changelog
```

### Hook Bypass (Use Sparingly)
```bash
# Skip all hooks (emergency only)
git commit --no-verify -m "Emergency fix"

# Skip specific hook
SKIP=typescript-build git commit -m "Skip build check"
```

## Benefits

### Quality Assurance
- **Consistent Documentation**: Automatic synchronization prevents outdated docs
- **Build Validation**: Catches compilation errors before commit
- **Version Management**: Ensures proper versioning and changelog maintenance

### Developer Experience
- **Automated Maintenance**: Reduces manual documentation tasks
- **Early Problem Detection**: Catches issues before they reach production
- **Consistent Standards**: Enforces project conventions automatically

### Continuous Integration
- **Pre-CI Validation**: Many issues caught locally before CI/CD
- **Faster Feedback**: Immediate validation during development
- **Reduced Pipeline Failures**: Higher success rate in automated builds

## Configuration Files

### Key Files
- `.pre-commit-config.yaml` - Hook configuration
- `scripts/update-docs.js` - Documentation automation
- `scripts/validate-changelog.js` - Changelog validation
- `package.json` - Script definitions and hook integration

### Environment Support
- Works with any Git environment
- Compatible with VS Code, Cursor, and command line
- Integrates with GitHub Actions and other CI/CD systems

## Future Enhancements

### Planned Features
- **Automated Testing**: Unit test execution in hooks
- **Code Coverage**: Minimum coverage thresholds
- **Security Scanning**: Dependency vulnerability checks
- **Performance Validation**: Bundle size monitoring

### Customization Options
- **Hook Configuration**: Enable/disable specific hooks
- **Validation Thresholds**: Adjust quality gate requirements
- **Custom Scripts**: Add project-specific validation logic
- **Integration Hooks**: Connect with external tools and services

---

For more information about pre-commit framework, visit: https://pre-commit.com/
