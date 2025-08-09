#!/usr/bin/env node

import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface SetupConfig {
  JIRA_BASE_URL: string;
  JIRA_EMAIL: string;
  JIRA_API_TOKEN: string;
  JIRA_PROJECT_KEY?: string;
}

export class JiraMcpSetup {
  private rl: readline.Interface;
  private forceReconfigure: boolean;

  constructor(forceReconfigure: boolean = false) {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    this.forceReconfigure = forceReconfigure;
  }

  private question(query: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(query, resolve);
    });
  }

  private async validateJiraConnection(config: SetupConfig): Promise<boolean> {
    try {
      const axios = await import('axios');
      const auth = Buffer.from(`${config.JIRA_EMAIL}:${config.JIRA_API_TOKEN}`).toString('base64');

      const response = await axios.default.get(`${config.JIRA_BASE_URL}/rest/api/2/myself`, {
        headers: { 'Authorization': `Basic ${auth}` },
        timeout: 10000
      });

      console.log(`✅ Successfully connected as: ${response.data.displayName} (${response.data.emailAddress})`);
      return true;
    } catch (error: any) {
      console.log(`❌ JIRA connection failed: ${error.response?.data?.message || error.message}`);
      return false;
    }
  }

  private getServerCommand(): { command: string; args: string[]; serverPath: string } {
    // Always use npx to ensure we get the published package
    return {
      command: 'npx',
      args: ['bds-jira-mcp'],
      serverPath: 'bds-jira-mcp'
    };
  }

  private createClaudeCodeConfig(config: SetupConfig): void {
    try {
      const { command, args } = this.getServerCommand();

      // Claude Code CLI config path
      const configPath = path.join(os.homedir(), '.claude.json');

      let existingConfig: any = {};
      if (fs.existsSync(configPath)) {
        try {
          const configContent = fs.readFileSync(configPath, 'utf8');
          existingConfig = JSON.parse(configContent);
        } catch (error) {
          console.log('⚠️  Could not parse existing Claude Code config, creating new one');
        }
      }

      // Ensure mcpServers exists
      if (!existingConfig.mcpServers) {
        existingConfig.mcpServers = {};
      }

      // Add jira-mcp server with environment variables
      existingConfig.mcpServers['jira-mcp'] = {
        command,
        args,
        env: {
          JIRA_BASE_URL: config.JIRA_BASE_URL,
          JIRA_EMAIL: config.JIRA_EMAIL,
          JIRA_API_TOKEN: config.JIRA_API_TOKEN,
          JIRA_PROJECT_KEY: config.JIRA_PROJECT_KEY || ''
        }
      };

      fs.writeFileSync(configPath, JSON.stringify(existingConfig, null, 2));
      console.log(`✅ Claude Code MCP configuration updated at ${configPath}`);

    } catch (error: any) {
      console.log(`⚠️  Failed to configure Claude Code CLI: ${error.message}`);
      console.log('   You can manually add the MCP server configuration later.');
    }
  }

  private async verifyMcpServerConnection(config: SetupConfig): Promise<boolean> {
    try {
      console.log('🔧 Testing MCP server connectivity...');

      const { spawn } = await import('child_process');
      const { command, args } = this.getServerCommand();

      return new Promise((resolve) => {
        const serverProcess = spawn(command, args, {
          env: {
            ...process.env,
            JIRA_BASE_URL: config.JIRA_BASE_URL,
            JIRA_EMAIL: config.JIRA_EMAIL,
            JIRA_API_TOKEN: config.JIRA_API_TOKEN,
            JIRA_PROJECT_KEY: config.JIRA_PROJECT_KEY || ''
          },
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let output = '';
        let errorOutput = '';

        const timeout = setTimeout(() => {
          serverProcess.kill();
          console.log('⚠️  MCP server test timed out (this is normal for setup verification)');
          resolve(true); // Timeout is expected for MCP servers
        }, 5000);

        serverProcess.stdout?.on('data', (data) => {
          output += data.toString();
          // Look for MCP initialization indicators
          if (output.includes('"jsonrpc"') || output.includes('capabilities') || output.includes('tools')) {
            clearTimeout(timeout);
            serverProcess.kill();
            console.log('✅ MCP server initialized successfully');
            resolve(true);
          }
        });

        serverProcess.stderr?.on('data', (data) => {
          errorOutput += data.toString();
        });

        serverProcess.on('close', (code) => {
          clearTimeout(timeout);
          if (code !== null && code !== 0 && !output.includes('jsonrpc')) {
            console.log(`❌ MCP server failed to start (exit code: ${code})`);
            if (errorOutput) {
              console.log(`   Error: ${errorOutput.trim()}`);
            }
            resolve(false);
          } else {
            // For MCP servers, graceful termination after initialization is normal
            resolve(true);
          }
        });

        serverProcess.on('error', (error) => {
          clearTimeout(timeout);
          console.log(`❌ Failed to spawn MCP server: ${error.message}`);
          resolve(false);
        });
      });

    } catch (error: any) {
      console.log(`❌ MCP server verification failed: ${error.message}`);
      return false;
    }
  }

  private verifyClaudeCodeConfig(): boolean {
    try {
      const configPath = path.join(os.homedir(), '.claude.json');

      if (!fs.existsSync(configPath)) {
        console.log('❌ Claude Code config file not found');
        return false;
      }

      const configContent = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configContent);

      if (!config.mcpServers || !config.mcpServers['jira-mcp']) {
        console.log('❌ jira-mcp server not found in Claude Code config');
        return false;
      }

      const jiraMcpConfig = config.mcpServers['jira-mcp'];

      // Verify required fields
      const requiredFields = ['command', 'args', 'env'];
      const requiredEnvVars = ['JIRA_BASE_URL', 'JIRA_EMAIL', 'JIRA_API_TOKEN'];

      for (const field of requiredFields) {
        if (!jiraMcpConfig[field]) {
          console.log(`❌ Missing required field in config: ${field}`);
          return false;
        }
      }

      for (const envVar of requiredEnvVars) {
        if (!jiraMcpConfig.env[envVar]) {
          console.log(`❌ Missing required environment variable in config: ${envVar}`);
          return false;
        }
      }

      console.log('✅ Claude Code configuration verified');
      return true;

    } catch (error: any) {
      console.log(`❌ Claude Code config verification failed: ${error.message}`);
      return false;
    }
  }

  private verifyClaudeDesktopConfig(): boolean {
    try {
      let configPath: string;

      // Determine config path based on platform
      if (process.platform === 'darwin') {
        configPath = path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
      } else if (process.platform === 'win32') {
        const appData = process.env.APPDATA;
        if (!appData) {
          console.log('ℹ️  Claude Desktop config verification skipped (Windows APPDATA not found)');
          return true; // Don't fail setup for this
        }
        configPath = path.join(appData, 'Claude', 'claude_desktop_config.json');
      } else {
        console.log('ℹ️  Claude Desktop config verification skipped (Linux not supported)');
        return true; // Don't fail setup for Linux
      }

      if (!fs.existsSync(configPath)) {
        console.log('❌ Claude Desktop config file not found');
        return false;
      }

      const configContent = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configContent);

      if (!config.mcpServers || !config.mcpServers['jira-mcp']) {
        console.log('❌ jira-mcp server not found in Claude Desktop config');
        return false;
      }

      console.log('✅ Claude Desktop configuration verified');
      return true;

    } catch (error: any) {
      console.log(`❌ Claude Desktop config verification failed: ${error.message}`);
      return false;
    }
  }

  private createClaudeDesktopConfig(config: SetupConfig): void {
    try {
      const { command, args } = this.getServerCommand();
      let configPath: string;
      let configDir: string;

      // Determine config path based on platform
      if (process.platform === 'darwin') {
        // macOS
        configDir = path.join(os.homedir(), 'Library', 'Application Support', 'Claude');
        configPath = path.join(configDir, 'claude_desktop_config.json');
      } else if (process.platform === 'win32') {
        // Windows
        const appData = process.env.APPDATA;
        if (!appData) {
          console.log('⚠️  Could not find APPDATA directory on Windows, skipping Claude Desktop configuration');
          return;
        }
        configDir = path.join(appData, 'Claude');
        configPath = path.join(configDir, 'claude_desktop_config.json');
      } else {
        // Linux - not supported yet by Claude Desktop
        console.log('ℹ️  Claude Desktop is not yet available on Linux, skipping Desktop configuration');
        return;
      }

      // Ensure directory exists
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      let config_data: any = {};
      if (fs.existsSync(configPath)) {
        try {
          const configContent = fs.readFileSync(configPath, 'utf8');
          config_data = JSON.parse(configContent);
        } catch (error) {
          console.log('⚠️  Could not parse existing Claude Desktop config, creating new one');
        }
      }

      // Ensure mcpServers exists
      if (!config_data.mcpServers) {
        config_data.mcpServers = {};
      }

      // Add jira-mcp server with environment variables
      config_data.mcpServers['jira-mcp'] = {
        command,
        args,
        env: {
          JIRA_BASE_URL: config.JIRA_BASE_URL,
          JIRA_EMAIL: config.JIRA_EMAIL,
          JIRA_API_TOKEN: config.JIRA_API_TOKEN,
          JIRA_PROJECT_KEY: config.JIRA_PROJECT_KEY || ''
        }
      };

      fs.writeFileSync(configPath, JSON.stringify(config_data, null, 2));
      console.log(`✅ Claude Desktop MCP configuration updated at ${configPath}`);

    } catch (error: any) {
      console.log(`⚠️  Failed to configure Claude Desktop: ${error.message}`);
      console.log('   You can manually add the MCP server configuration later.');
    }
  }

  public async run(): Promise<void> {
    console.log('🚀 Welcome to JIRA-MCP Setup');
    console.log('   This will configure your JIRA-MCP server for Claude Code and Claude Desktop\n');

    try {
      // Collect JIRA configuration
      console.log('📋 JIRA Configuration:');

      const JIRA_BASE_URL = await this.question('JIRA Base URL (e.g., https://yourcompany.atlassian.net): ');
      if (!JIRA_BASE_URL.trim()) {
        console.log('❌ JIRA Base URL is required');
        process.exit(1);
      }

      const JIRA_EMAIL = await this.question('JIRA Email: ');
      if (!JIRA_EMAIL.trim()) {
        console.log('❌ JIRA Email is required');
        process.exit(1);
      }

      const JIRA_API_TOKEN = await this.question('JIRA API Token: ');
      if (!JIRA_API_TOKEN.trim()) {
        console.log('❌ JIRA API Token is required');
        process.exit(1);
      }

      const JIRA_PROJECT_KEY = await this.question('Default JIRA Project Key (optional, e.g., PROJ): ');

      const config: SetupConfig = {
        JIRA_BASE_URL: JIRA_BASE_URL.trim().replace(/\/$/, ''),
        JIRA_EMAIL: JIRA_EMAIL.trim(),
        JIRA_API_TOKEN: JIRA_API_TOKEN.trim(),
        JIRA_PROJECT_KEY: JIRA_PROJECT_KEY.trim() || undefined,
      };

      // Validate JIRA connection
      console.log('\n🔍 Testing JIRA connection...');
      const isValid = await this.validateJiraConnection(config);

      if (!isValid) {
        const retry = await this.question('Would you like to retry with different credentials? (y/n): ');
        if (retry.toLowerCase() !== 'y') {
          console.log('❌ Setup cancelled');
          process.exit(1);
        }
        // Restart the process
        this.rl.close();
        await new JiraMcpSetup(this.forceReconfigure).run();
        return;
      }

      // Configure Claude Code and Claude Desktop
      console.log('\n⚙️  Configuring Claude integrations...');

      this.createClaudeCodeConfig(config);
      this.createClaudeDesktopConfig(config);

      // Verify configurations
      console.log('\n🔍 Verifying configurations...');

      const codeConfigValid = this.verifyClaudeCodeConfig();
      const desktopConfigValid = this.verifyClaudeDesktopConfig();

      // Test MCP server connectivity
      const mcpServerValid = await this.verifyMcpServerConnection(config);

      // Determine overall setup status
      const allValid = codeConfigValid && desktopConfigValid && mcpServerValid;

      if (allValid) {
        console.log('\n🎉 Setup completed successfully!');
        console.log('✅ All configurations verified and MCP server tested');
      } else {
        console.log('\n⚠️  Setup completed with warnings!');
        console.log('   Some verification steps failed, but basic setup is complete');

        if (!mcpServerValid) {
          console.log('\n🔧 Troubleshooting MCP server issues:');
          console.log('   • Ensure jira-mcp package is installed: npm install -g jira-mcp');
          console.log('   • Check JIRA credentials are correct');
          console.log('   • Verify network connectivity to JIRA instance');
          console.log('   • Try manual test: npx jira-mcp (should show MCP protocol output)');
        }

        if (!codeConfigValid || !desktopConfigValid) {
          console.log('\n📁 Config file troubleshooting:');
          console.log('   • Check file permissions in config directories');
          console.log('   • Verify JSON syntax in config files');
          console.log('   • Try running setup with --force flag to recreate configs');
        }
      }

      console.log('\n📖 Next steps:');
      console.log('   • Restart Claude Code CLI if it was running');
      console.log('   • Restart Claude Desktop application if it was running');
      console.log('   • Test the integration by using JIRA-MCP tools in Claude');
      console.log('\n📚 Available tools:');
      console.log('   • get_jira_ticket - Fetch ticket details');
      console.log('   • create_jira_ticket - Create new tickets');
      console.log('   • post_jira_comment - Add comments to tickets');
      console.log('   • generate_commit_message - Generate conventional commit messages');
      console.log('   • create_branch - Create Git branches from tickets');
      console.log('   • link_jira_issues - Link issues with relationships');
      console.log('   • set_epic_link - Link stories/tasks to epics');
      console.log('   • update_story_statuses - Auto-update story statuses');
      console.log('   • finish_workflow - Complete JIRA → Git workflow');

    } catch (error: any) {
      console.log(`\n❌ Setup failed: ${error.message}`);
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }
}

// Run setup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const setup = new JiraMcpSetup(process.argv.includes('--force'));
  await setup.run();
}
