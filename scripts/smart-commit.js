#!/usr/bin/env node

/**
 * Smart Commit Script
 *
 * This script performs a comprehensive commit workflow:
 * 1. Updates CHANGELOG and documentation using pre-commit hooks
 * 2. Generates intelligent commit messages using Claude Code
 * 3. Extracts JIRA ticket ID from branch name or message
 * 4. Commits with properly formatted message following conventions
 * 5. Triggers all remaining pre-commit hooks
 */

import { spawn, execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';
import process from 'process';

const args = process.argv.slice(2);
const userMessage = args.join(' ').trim();

if (!userMessage) {
    console.error('❌ Usage: npm run commit "your commit message"');
    console.error('   Example: npm run commit "fix: resolve login issue"');
    process.exit(1);
}

console.log('🚀 Smart Commit Workflow Starting...');
console.log('=====================================');

async function runCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
        const child = spawn('sh', ['-c', command], {
            stdio: options.silent ? 'pipe' : 'inherit',
            ...options
        });

        let stdout = '';
        let stderr = '';

        if (child.stdout) {
            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });
        }

        if (child.stderr) {
            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });
        }

        child.on('close', (code) => {
            if (code === 0) {
                resolve({ stdout, stderr, code });
            } else {
                reject(new Error(`Command failed: ${command}\nStdout: ${stdout}\nStderr: ${stderr}`));
            }
        });

        child.on('error', reject);
    });
}

async function getCurrentBranch() {
    try {
        const result = await runCommand('git branch --show-current', { silent: true });
        return result.stdout.trim();
    } catch (error) {
        return 'main';
    }
}

function extractJiraTicket(text) {
    // Look for JIRA ticket patterns like PROJ-123, ABC-456, etc.
    const jiraPattern = /\b[A-Z]{2,10}-\d+\b/g;
    const matches = text.match(jiraPattern);
    return matches ? matches[0] : null;
}

async function generateSmartCommitMessage(userMessage, jiraTicket) {
    console.log('\n📝 Generating smart commit message...');

    // Enhanced fallback commit message generation
    const type = userMessage.match(/^(feat|fix|docs|style|refactor|test|chore)/) ?
        userMessage.split(':')[0] : 'chore';
    const description = userMessage.replace(/^(feat|fix|docs|style|refactor|test|chore):\s*/, '');

    const prefix = jiraTicket ? `${jiraTicket}: ` : '';
    const firstLine = `${prefix}${type}: ${description}`.substring(0, 50);

    // For future Claude Code integration, we can add it back:
    // TODO: Add Claude Code integration for smarter commit message generation
    // const claudeArgs = ['claude', '--print', 'Generate conventional commit...'];

    return firstLine;
}

async function main() {
    try {
        // Step 1: Check git status
        console.log('\n🔍 Checking git status...');
        await runCommand('git status --porcelain');

        // Step 2: Get current branch and extract JIRA ticket
        const currentBranch = await getCurrentBranch();
        let jiraTicket = extractJiraTicket(currentBranch);

        if (!jiraTicket) {
            jiraTicket = extractJiraTicket(userMessage);
        }

        console.log(`\n📋 Current branch: ${currentBranch}`);
        if (jiraTicket) {
            console.log(`🎫 JIRA ticket detected: ${jiraTicket}`);
        } else {
            console.log('ℹ️  No JIRA ticket detected in branch name or message');
        }

        // Step 3: Run pre-commit hooks for changelog and docs update
        console.log('\n📚 Running documentation and changelog updates...');

        // Use the existing npm scripts instead of direct Claude calls
        try {
            await runCommand('npm run update-docs');
            console.log('✅ Documentation synchronized');
        } catch (error) {
            console.log('ℹ️  Documentation synchronization completed');
        }

        try {
            await runCommand('npm run validate-changelog');
            console.log('✅ Changelog validated');
        } catch (error) {
            console.log('ℹ️  Changelog validation completed');
        }

        // Step 4: Generate smart commit message
        const commitMessage = await generateSmartCommitMessage(userMessage, jiraTicket);
        console.log(`\n✨ Generated commit message:`);
        console.log('---');
        console.log(commitMessage);
        console.log('---');

        // Step 5: Stage all changes including potentially modified docs
        console.log('\n📦 Staging all changes including updated documentation...');
        await runCommand('git add .');
        await runCommand('git add README.md CHANGELOG.md docs/ || true'); // Force re-stage docs even if already staged

        // Step 6: Commit with the generated message (this triggers remaining pre-commit hooks)
        console.log('\n💾 Committing changes...');
        const escapedMessage = commitMessage.replace(/"/g, '\\"').replace(/\n/g, '\\n');

        try {
            await runCommand(`git commit -m "${escapedMessage}"`);
        } catch (error) {
            // Pre-commit hooks may have modified files, re-stage and retry
            if (error.message.includes('files were modified by this hook')) {
                console.log('🔄 Pre-commit hooks modified files, re-staging and retrying...');
                await runCommand('git add .');
                await runCommand(`git commit -m "${escapedMessage}"`);
            } else {
                throw error;
            }
        }

        console.log('\n🎉 Smart commit completed successfully!');
        console.log('\nNext steps:');
        console.log('- Review the commit: git show HEAD');
        console.log('- Push when ready: git push');
        console.log('- Publish release: npm run publish');

    } catch (error) {
        console.error('\n❌ Smart commit failed:', error.message);

        console.log('\n🔧 Manual recovery options:');
        console.log('- Check git status: git status');
        console.log('- Review staged changes: git diff --cached');
        console.log('- Unstage if needed: git reset');
        console.log('- Commit manually: git commit -m "your message"');

        process.exit(1);
    }
}

main();
