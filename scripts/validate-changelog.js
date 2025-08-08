#!/usr/bin/env node
/**
 * Changelog Validation Script
 * Ensures CHANGELOG.md has entries for current version
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = dirname(__dirname);

// Get current package version
const packageJson = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'));
const currentVersion = packageJson.version;

console.log(`📋 Validating CHANGELOG.md for version ${currentVersion}...`);

try {
  const changelogPath = join(projectRoot, 'CHANGELOG.md');
  const changelog = readFileSync(changelogPath, 'utf8');

  // Check if current version exists in changelog
  const versionPattern = new RegExp(`\\[${currentVersion.replace(/\./g, '\\.')}\\]`, 'g');
  const hasCurrentVersion = versionPattern.test(changelog);

  if (!hasCurrentVersion) {
    console.error(`\n❌ CHANGELOG.md is missing entry for version ${currentVersion}`);
    console.error('Please add a changelog entry for the current version before committing.');
    console.error('\nExpected format:');
    console.error(`## [${currentVersion}] - ${new Date().toISOString().split('T')[0]}`);
    console.error('\n### Added\n- New feature descriptions');
    console.error('\n### Changed\n- Modified feature descriptions');
    console.error('\n### Fixed\n- Bug fix descriptions');
    process.exit(1);
  }

  // Check for unreleased section
  const hasUnreleased = /## \[Unreleased\]/.test(changelog);
  if (!hasUnreleased) {
    console.warn('  ⚠️  CHANGELOG.md is missing [Unreleased] section');
  }

  // Validate Keep a Changelog format
  const keepAChangelogPattern = /The format is based on \[Keep a Changelog\]/;
  if (!keepAChangelogPattern.test(changelog)) {
    console.warn('  ⚠️  CHANGELOG.md may not follow Keep a Changelog format');
  }

  // Check for semantic versioning reference
  const semVerPattern = /adheres to \[Semantic Versioning\]/;
  if (!semVerPattern.test(changelog)) {
    console.warn('  ⚠️  CHANGELOG.md missing Semantic Versioning reference');
  }

  console.log(`  ✅ CHANGELOG.md has entry for version ${currentVersion}`);
  console.log('  ✅ CHANGELOG.md validation passed');

  process.exit(0);

} catch (error) {
  console.error('\n❌ CHANGELOG.md validation failed:');
  console.error(error.message);
  process.exit(1);
}
