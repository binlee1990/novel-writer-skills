import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

const CLI_PATH = path.resolve(__dirname, '../../dist/cli.js');

describe('novelws init', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nws-init-'));
  });

  afterEach(async () => {
    try {
      await fs.remove(testDir);
    } catch {
      // ignore cleanup errors on Windows
    }
  }, 30_000);

  it('should create project with correct directory structure', () => {
    const projectName = 'test-novel';

    execSync(`node "${CLI_PATH}" init ${projectName} --no-git`, {
      cwd: testDir,
      stdio: 'pipe',
    });

    const projectPath = path.join(testDir, projectName);

    // 验证核心目录
    expect(fs.existsSync(path.join(projectPath, '.claude'))).toBe(true);
    expect(fs.existsSync(path.join(projectPath, 'resources'))).toBe(true);
    expect(fs.existsSync(path.join(projectPath, 'stories'))).toBe(true);

    // 验证子目录
    expect(fs.existsSync(path.join(projectPath, '.claude', 'commands'))).toBe(true);
  });

  it('should create valid config.json', () => {
    const projectName = 'my-novel';

    execSync(`node "${CLI_PATH}" init ${projectName} --no-git`, {
      cwd: testDir,
      stdio: 'pipe',
    });

    const configPath = path.join(testDir, projectName, 'resources', 'config.json');
    expect(fs.existsSync(configPath)).toBe(true);

    const config = fs.readJsonSync(configPath);
    expect(config.name).toBe(projectName);
    expect(config.version).toBeDefined();
  });

  it('should copy commands to .claude/commands/', () => {
    const projectName = 'cmd-test';

    execSync(`node "${CLI_PATH}" init ${projectName} --no-git`, {
      cwd: testDir,
      stdio: 'pipe',
    });

    const commandsDir = path.join(testDir, projectName, '.claude', 'commands');
    const commands = fs.readdirSync(commandsDir);

    // v5 核心命令
    const requiredCommands = [
      'specify.md',
      'plan.md',
      'write.md',
      'expand.md',
      'analyze.md',
    ];

    for (const cmd of requiredCommands) {
      expect(commands).toContain(cmd);
    }
  });

  it('should fail gracefully when project already exists', () => {
    const projectName = 'existing-project';
    const projectPath = path.join(testDir, projectName);
    fs.mkdirSync(projectPath);

    expect(() => {
      execSync(`node "${CLI_PATH}" init ${projectName} --no-git`, {
        cwd: testDir,
        stdio: 'pipe',
      });
    }).toThrow();
  });

  it('should generate CLAUDE.md in .claude/', () => {
    const projectName = 'claude-md-test';

    execSync(`node "${CLI_PATH}" init ${projectName} --no-git`, {
      cwd: testDir,
      stdio: 'pipe',
    });

    const claudeMdPath = path.join(testDir, projectName, '.claude', 'CLAUDE.md');
    expect(fs.existsSync(claudeMdPath)).toBe(true);

    const content = fs.readFileSync(claudeMdPath, 'utf-8');
    expect(content.length).toBeGreaterThan(0);
  });

  it('should create resource files', () => {
    const projectName = 'resources-test';

    execSync(`node "${CLI_PATH}" init ${projectName} --no-git`, {
      cwd: testDir,
      stdio: 'pipe',
    });

    const resourcesDir = path.join(testDir, projectName, 'resources');
    const requiredFiles = [
      'constitution.md',
      'style-reference.md',
      'anti-ai.md',
    ];

    for (const file of requiredFiles) {
      expect(fs.existsSync(path.join(resourcesDir, file))).toBe(true);
    }
  });
});
