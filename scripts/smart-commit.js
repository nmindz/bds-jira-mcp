#!/usr/bin/env node

/**
 * Smart Commit Script
 *
 * This script performs a comprehensive commit workflow:
 * 1. Updates CHANGELOG and documentation using Claude Code
 * 2. Generates intelligent commit messages with JIRA ticket prefixes
 * 3. Extracts JIRA ticket ID from branch name or message
 * 4. Commits with properly formatted message following conventions
 * 5. Triggers all remaining pre-commit hooks for validation
 */

import { spawn, execSync } from 'child_process';
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
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
    console.log('\n📝 Generating smart commit message with Claude Code...');

    // Create temporary file for commit message
    const tempFile = join(tmpdir(), `smart-commit-${Date.now()}.txt`);

    const claudePrompt = `Generate a conventional commit message based on: "${userMessage}".

Requirements:
- First line: Maximum 50 characters, format: "type: brief description"
- If JIRA ticket ${jiraTicket ? `"${jiraTicket}"` : 'is available'}, prefix first line with "${jiraTicket ? jiraTicket + ': ' : '[TICKET]: '}"
- Use conventional commit types: feat, fix, docs, style, refactor, test, chore
- Add detailed explanation in body if needed, wrapped at 72 characters
- Be concise but descriptive
- Focus on WHAT changed and WHY

IMPORTANT: Write ONLY the commit message (no explanations, no markdown code blocks) directly to the file: ${tempFile}

Current git status and recent changes are shown below for context.`;

    const maxRetries = 3;
    const timeoutMs = 150000; // 2m30s

    try {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔄 Attempt ${attempt}/${maxRetries} to generate commit message with Claude Code...`);

                await Promise.race([
                    runCommand(`claude --print '${claudePrompt.replace(/'/g, "'\\''")}' --add-dir=/Users/evandrocamargo/Projects/me/jira-mcp --permission-mode=acceptEdits --allowedTools='Write,ReadFile,Bash(git status:*),Bash(git branch:*),Bash(git log:*)'`, { silent: false }),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Claude Code timeout')), timeoutMs)
                    )
                ]);

                // Read the commit message from the temporary file
                if (existsSync(tempFile)) {
                    const commitMessage = readFileSync(tempFile, 'utf8').trim();
                    if (commitMessage) {
                        return commitMessage;
                    }
                }

                console.warn(`⚠️  Attempt ${attempt} failed: No commit message generated in temp file`);
            } catch (error) {
                if (attempt === maxRetries) {
                    console.warn('⚠️  Claude Code unavailable after 3 attempts, using fallback commit message generation');
                    break;
                }
                console.warn(`⚠️  Attempt ${attempt} failed: ${error.message}. Retrying...`);
            }
        }

        // Fallback commit message generation
        const type = userMessage.match(/^(feat|fix|docs|style|refactor|test|chore)/) ?
            userMessage.split(':')[0] : 'chore';
        const description = userMessage.replace(/^(feat|fix|docs|style|refactor|test|chore):\s*/, '');

        const prefix = jiraTicket ? `${jiraTicket}: ` : '';
        const firstLine = `${prefix}${type}: ${description}`.substring(0, 50);

        return firstLine;
    } finally {
        // Clean up temporary file
        if (existsSync(tempFile)) {
            unlinkSync(tempFile);
        }
    }
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

        // Step 3: Run Claude Code hooks for changelog and docs update
        console.log('\n📚 Running Claude Code documentation and changelog updates...');

        // Use Claude Code scripts for intelligent updates
        try {
            await runCommand('npm run claude:update-changelog');
            console.log('✅ Changelog updated by Claude Code');
        } catch (error) {
            console.log('ℹ️  Changelog was already up-to-date');
        }

        try {
            await runCommand('npm run claude:update-docs');
            console.log('✅ Documentation updated by Claude Code');
        } catch (error) {
            console.log('ℹ️  Documentation was already up-to-date');
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

        // Create temporary commit message file to handle multiline messages properly
        const commitMsgFile = join(tmpdir(), `commit-msg-${Date.now()}.txt`);
        writeFileSync(commitMsgFile, commitMessage);

        try {
            await runCommand(`git commit -F "${commitMsgFile}"`);
        } catch (error) {
            // Check if pre-commit hooks modified files by checking git status
            const statusResult = await runCommand('git status --porcelain', { silent: true });
            const hasUnstagedChanges = statusResult.stdout.trim().includes('M ');

            if (hasUnstagedChanges) {
                console.log('🔄 Pre-commit hooks modified files, re-staging and retrying...');
                await runCommand('git add .');
                await runCommand(`git commit -F "${commitMsgFile}"`);
            } else {
                throw error;
            }
        } finally {
            // Clean up commit message file
            if (existsSync(commitMsgFile)) {
                unlinkSync(commitMsgFile);
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
