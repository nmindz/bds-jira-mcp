#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json to get current version
const packageJsonPath = join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
const version = packageJson.version;

console.log('🚀 Starting release process...');
console.log(`📦 Current version: ${version}`);

try {
  // Check for uncommitted changes
  console.log('\n📋 Checking for uncommitted changes...');
  const status = execSync('git status --porcelain', { encoding: 'utf-8' });
  if (status.trim()) {
    console.error('❌ Error: You have uncommitted changes. Please commit or stash them first.');
    console.log('\nUncommitted changes:');
    console.log(status);
    process.exit(1);
  }
  console.log('✅ Working directory is clean');

  // Ensure we're on master branch
  console.log('\n🌿 Checking current branch...');
  const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
  if (currentBranch !== 'master') {
    console.error(`❌ Error: You must be on the master branch to release. Current branch: ${currentBranch}`);
    process.exit(1);
  }
  console.log('✅ On master branch');

  // Pull latest changes
  console.log('\n⬇️ Pulling latest changes from origin/master...');
  execSync('git pull origin master', { stdio: 'inherit' });
  console.log('✅ Up to date with origin/master');

  // Check if tag already exists
  console.log(`\n🏷️ Checking if tag v${version} already exists...`);
  try {
    execSync(`git rev-parse v${version}`, { stdio: 'pipe' });
    console.error(`❌ Error: Tag v${version} already exists. Please bump the version first.`);
    console.log('\nTo bump the version, use one of:');
    console.log('  pnpm run bump:patch  # for bug fixes');
    console.log('  pnpm run bump:minor  # for new features');
    console.log('  pnpm run bump:major  # for breaking changes');
    process.exit(1);
  } catch (e) {
    // Tag doesn't exist, which is good
    console.log('✅ Tag does not exist yet');
  }

  // Create annotated tag
  console.log(`\n🏷️ Creating tag v${version}...`);
  const tagMessage = `Release v${version} - ${packageJson.description}`;
  execSync(`git tag -a v${version} -m "${tagMessage}"`, { stdio: 'inherit' });
  console.log(`✅ Tag v${version} created`);

  // Push master branch
  console.log('\n📤 Pushing master branch to origin...');
  execSync('git push origin master', { stdio: 'inherit' });
  console.log('✅ Master branch pushed');

  // Push tag
  console.log(`\n📤 Pushing tag v${version} to origin...`);
  execSync(`git push origin v${version}`, { stdio: 'inherit' });
  console.log(`✅ Tag v${version} pushed`);

  console.log('\n🎉 Release process completed successfully!');
  console.log('\n📊 Next steps:');
  console.log('1. GitHub Actions will automatically:');
  console.log('   - Build and test the code');
  console.log('   - Publish to NPM (if version is new)');
  console.log('   - Create a GitHub release with assets');
  console.log('\n2. Monitor the pipeline at:');
  console.log(`   https://github.com/nmindz/bds-jira-mcp/actions`);
  
} catch (error) {
  console.error('\n❌ Release process failed:', error.message);
  process.exit(1);
}
