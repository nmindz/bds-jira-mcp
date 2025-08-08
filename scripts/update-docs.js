#!/usr/bin/env node
/**
 * Documentation Update Script
 * Automatically updates documentation files to ensure consistency
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = dirname(__dirname);

// Get current package version
const packageJson = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'));
const currentVersion = packageJson.version;

console.log(`📋 Updating documentation for version ${currentVersion}...`);

// Update README.md version references
function updateReadme() {
  const readmePath = join(projectRoot, 'README.md');
  let readme = readFileSync(readmePath, 'utf8');

  // Update NPM version badge
  readme = readme.replace(
    /https:\/\/img\.shields\.io\/npm\/v\/jira-mcp/g,
    `https://img.shields.io/npm/v/jira-mcp`
  );

  // Update version references in text (if any)
  const versionPattern = /jira-mcp v[\d\.]+/g;
  if (readme.match(versionPattern)) {
    readme = readme.replace(versionPattern, `jira-mcp v${currentVersion}`);
    console.log('  ✅ Updated README.md version references');
  }

  writeFileSync(readmePath, readme);
}

// Update CLAUDE.md version references
function updateClaudeMd() {
  const claudePath = join(projectRoot, 'CLAUDE.md');
  let claude = readFileSync(claudePath, 'utf8');

  // Update version in project overview
  claude = claude.replace(
    /"version": "[\d\.]+"/g,
    `"version": "${currentVersion}"`
  );

  // Update current status references
  claude = claude.replace(
    /current v[\d\.]+/g,
    `current v${currentVersion}`
  );

  writeFileSync(claudePath, claude);
  console.log('  ✅ Updated CLAUDE.md version references');
}

// Validate tool count consistency
function validateToolCount() {
  const indexPath = join(projectRoot, 'src', 'index.ts');
  const index = readFileSync(indexPath, 'utf8');

  // Count registerTool calls
  const toolMatches = index.match(/server\.registerTool\(/g);
  const toolCount = toolMatches ? toolMatches.length : 0;

  // Check README.md tool count
  const readmePath = join(projectRoot, 'README.md');
  const readme = readFileSync(readmePath, 'utf8');

  // Look for tool count references
  const readmeToolRefs = readme.match(/(\d+) MCP tools?/g);
  const readmeCount = readmeToolRefs ? parseInt(readmeToolRefs[0].match(/\d+/)[0]) : 0;

  if (toolCount !== readmeCount) {
    console.warn(`  ⚠️  Tool count mismatch: src/index.ts has ${toolCount}, README.md references ${readmeCount}`);

    // Auto-update README.md tool count
    const updatedReadme = readme.replace(/\d+ MCP tools?/g, `${toolCount} MCP tools`);
    writeFileSync(readmePath, updatedReadme);
    console.log(`  ✅ Updated README.md tool count to ${toolCount}`);
  }

  // Check CLAUDE.md tool count
  const claudePath = join(projectRoot, 'CLAUDE.md');
  const claude = readFileSync(claudePath, 'utf8');
  const claudeToolRefs = claude.match(/(\d+) MCP tools?/g);
  const claudeCount = claudeToolRefs ? parseInt(claudeToolRefs[0].match(/\d+/)[0]) : 0;

  if (toolCount !== claudeCount) {
    const updatedClaude = claude.replace(/\d+ MCP tools?/g, `${toolCount} MCP tools`);
    writeFileSync(claudePath, updatedClaude);
    console.log(`  ✅ Updated CLAUDE.md tool count to ${toolCount}`);
  }

  console.log(`  ℹ️  Validated tool count: ${toolCount} MCP tools`);
}

// Update build timestamp in documentation
function updateBuildInfo() {
  const now = new Date();
  const timestamp = now.toISOString().split('T')[0]; // YYYY-MM-DD format

  const claudePath = join(projectRoot, 'CLAUDE.md');
  let claude = readFileSync(claudePath, 'utf8');

  // Add or update last updated timestamp
  const timestampPattern = /Last updated: \d{4}-\d{2}-\d{2}/;
  if (claude.match(timestampPattern)) {
    claude = claude.replace(timestampPattern, `Last updated: ${timestamp}`);
  } else {
    // Add timestamp to development context section
    claude = claude.replace(
      /## Development Context/,
      `## Development Context\n\nLast updated: ${timestamp}`
    );
  }

  writeFileSync(claudePath, claude);
  console.log(`  ✅ Updated build timestamp: ${timestamp}`);
}

// Main execution
try {
  updateReadme();
  updateClaudeMd();
  validateToolCount();
  updateBuildInfo();

  console.log(`\n🎉 Documentation update completed successfully for v${currentVersion}`);
  process.exit(0);
} catch (error) {
  console.error('\n❌ Documentation update failed:');
  console.error(error.message);
  process.exit(1);
}
