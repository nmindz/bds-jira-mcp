/**
 * Simple Unit Tests
 * Basic tests to validate Jest setup and environment
 */

import { describe, expect, test } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Basic Test Suite', () => {
  test('Jest is working correctly', () => {
    expect(1 + 1).toBe(2);
  });

  test('Environment variables are loaded in tests', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });

  test('Can import Node.js modules', () => {
    expect(typeof fs.existsSync).toBe('function');
    expect(typeof path.join).toBe('function');
  });

  test('Package.json contains expected configuration', () => {
    const packageJsonPath = path.join(__dirname, '../../package.json');
    const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonContent);

    expect(packageJson.name).toBe('bds-jira-mcp');
    expect(packageJson.version).toBeDefined();
    expect(packageJson.main).toBe('build/index.js');
    expect(packageJson.bin).toBeDefined();
    expect(packageJson.bin['bds-jira-mcp']).toBe('build/index.js');
    
    // Verify test scripts are configured
    expect(packageJson.scripts.test).toBeDefined();
    expect(packageJson.devDependencies.jest).toBeDefined();
  });

  test('Build artifacts exist', () => {
    const buildPath = path.join(__dirname, '../../build/index.js');
    const servicesPath = path.join(__dirname, '../../build/services/jira.js');

    expect(fs.existsSync(buildPath)).toBe(true);
    expect(fs.existsSync(servicesPath)).toBe(true);
  });

  test('TypeScript configuration is valid', () => {
    const tsconfigPath = path.join(__dirname, '../../tsconfig.json');
    expect(fs.existsSync(tsconfigPath)).toBe(true);

    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    expect(tsconfig.compilerOptions).toBeDefined();
    expect(tsconfig.compilerOptions.target).toBeDefined();
    expect(tsconfig.compilerOptions.module).toBeDefined();
  });

  test('Required files are present', () => {
    const requiredFiles = [
      'package.json',
      'tsconfig.json',
      'jest.config.js',
      '.pre-commit-config.yaml',
      'CHANGELOG.md',
      'README.md',
      'CLAUDE.md',
      'LICENSE'
    ];

    requiredFiles.forEach(file => {
      const filePath = path.join(__dirname, '../../', file);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });
});

describe('String Processing', () => {
  test('Basic string operations work', () => {
    const testString = '**Bold** and *italic* text';

    // Basic string operations that might be used in JIRA formatting
    expect(testString.replace(/\*\*(.*?)\*\*/g, '*$1*')).toBe('*Bold* and *italic* text');
    expect(testString.includes('Bold')).toBe(true);
    expect(testString.length).toBeGreaterThan(0);
  });

  test('Regex patterns work correctly', () => {
    const jiraFormatting = {
      bold: /\*\*(.*?)\*\*/g,
      italic: /\*(.*?)\*/g,
      code: /`(.*?)`/g
    };

    expect('**test**'.replace(jiraFormatting.bold, '*$1*')).toBe('*test*');
    expect('`code`'.replace(jiraFormatting.code, '{{$1}}')).toBe('{{code}}');
  });
});

describe('Async Operations', () => {
  test('Promises work correctly', async () => {
    const result = await Promise.resolve('test');
    expect(result).toBe('test');
  });

  test('setTimeout works in tests', (done) => {
    setTimeout(() => {
      expect(true).toBe(true);
      done();
    }, 10);
  });

  test('Async/await error handling works', async () => {
    try {
      await Promise.reject(new Error('Test error'));
    } catch (error) {
      expect((error as Error).message).toBe('Test error');
    }
  });
});

describe('Object Operations', () => {
  test('Object manipulation works', () => {
    const testObj = {
      summary: 'Test ticket',
      description: 'Test description',
      status: { name: 'To Do' }
    };

    expect(testObj.summary).toBe('Test ticket');
    expect(testObj.status.name).toBe('To Do');
    expect(Object.keys(testObj)).toContain('summary');
  });

  test('Array operations work', () => {
    const testArray = ['item1', 'item2', 'item3'];

    expect(testArray.length).toBe(3);
    expect(testArray.includes('item2')).toBe(true);
    expect(testArray.find(item => item === 'item1')).toBe('item1');
  });

  test('JSON operations work', () => {
    const testObj = { key: 'TEST-123', summary: 'Test' };
    const jsonString = JSON.stringify(testObj);
    const parsedObj = JSON.parse(jsonString);

    expect(parsedObj.key).toBe('TEST-123');
    expect(parsedObj.summary).toBe('Test');
  });
});
