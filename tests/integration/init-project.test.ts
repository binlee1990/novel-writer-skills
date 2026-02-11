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
  });

  it('should create project with correct directory structure', () => {
    const projectName = 'test-novel';

    execSync(`node "${CLI_PATH}" init ${projectName} --no-git`, {
      cwd: testDir,
      stdio: 'pipe',
    });

    const projectPath = path.join(testDir, projectName);

    // 验证核心目录
    expect(fs.existsSync(path.join(projectPath, '.claude'))).toBe(true);
    expect(fs.existsSync(path.join(projectPath, '.specify'))).toBe(true);
    expect(fs.existsSync(path.join(projectPath, 'stories'))).toBe(true);
    expect(fs.existsSync(path.join(projectPath, 'spec'))).toBe(true);

    // 验证子目录
    expect(fs.existsSync(path.join(projectPath, '.claude', 'commands'))).toBe(true);
    expect(fs.existsSync(path.join(projectPath, '.claude', 'skills'))).toBe(true);
    expect(fs.existsSync(path.join(projectPath, 'spec', 'tracking'))).toBe(true);
  });

  it('should create valid config.json', () => {
    const projectName = 'my-novel';

    execSync(`node "${CLI_PATH}" init ${projectName} --no-git`, {
      cwd: testDir,
      stdio: 'pipe',
    });

    const configPath = path.join(testDir, projectName, '.specify', 'config.json');
    expect(fs.existsSync(configPath)).toBe(true);

    const config = fs.readJsonSync(configPath);
    expect(config.name).toBe(projectName);
    expect(config.type).toBeDefined();
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

    // 核心命令应该存在
    const requiredCommands = [
      'constitution.md',
      'specify.md',
      'write.md',
      'track.md',
    ];

    for (const cmd of requiredCommands) {
      expect(commands).toContain(cmd);
    }

    // 至少应该有多个命令
    expect(commands.length).toBeGreaterThanOrEqual(8);
  });

  it('should copy skills to .claude/skills/', () => {
    const projectName = 'skills-test';

    execSync(`node "${CLI_PATH}" init ${projectName} --no-git`, {
      cwd: testDir,
      stdio: 'pipe',
    });

    const skillsDir = path.join(testDir, projectName, '.claude', 'skills');
    expect(fs.existsSync(skillsDir)).toBe(true);

    // 至少应该有 genre-knowledge 目录
    const genreDir = path.join(skillsDir, 'genre-knowledge');
    expect(fs.existsSync(genreDir)).toBe(true);

    // 验证 quality-assurance skills
    const qaDir = path.join(skillsDir, 'quality-assurance');
    expect(fs.existsSync(qaDir)).toBe(true);
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
    expect(content).toContain('小说创作核心原则');
    expect(content).toContain('反 AI 写作核心');
    expect(content).toContain('会话级资源复用');
  });
});
