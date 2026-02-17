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
    expect(fs.existsSync(path.join(projectPath, 'tracking'))).toBe(true);

    // 验证子目录
    expect(fs.existsSync(path.join(projectPath, '.claude', 'commands'))).toBe(true);
    expect(fs.existsSync(path.join(projectPath, '.claude', 'skills'))).toBe(true);
    expect(fs.existsSync(path.join(projectPath, 'tracking'))).toBe(true);
  });

  it('should create valid config.json', () => {
    const projectName = 'my-novel';

    execSync(`node "${CLI_PATH}" init ${projectName} --no-git`, {
      cwd: testDir,
      stdio: 'pipe',
    });

    const configPath = path.join(testDir, projectName, 'resources', 'config', 'config.json');
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

  it('should create summary directory with --scale large', () => {
    const projectName = 'large-novel';

    execSync(`node "${CLI_PATH}" init ${projectName} --no-git --scale large`, {
      cwd: testDir,
      stdio: 'pipe',
    });

    const projectPath = path.join(testDir, projectName);

    // 验证 summary 目录和文件
    const summaryDir = path.join(projectPath, 'tracking', 'summary');
    expect(fs.existsSync(summaryDir)).toBe(true);
    expect(fs.existsSync(path.join(summaryDir, 'characters-summary.json'))).toBe(true);
    expect(fs.existsSync(path.join(summaryDir, 'plot-summary.json'))).toBe(true);
    expect(fs.existsSync(path.join(summaryDir, 'timeline-summary.json'))).toBe(true);
    expect(fs.existsSync(path.join(summaryDir, 'volume-summaries.json'))).toBe(true);

    // 验证 volumes 目录
    const volumesDir = path.join(projectPath, 'tracking', 'volumes');
    expect(fs.existsSync(volumesDir)).toBe(true);
    expect(fs.existsSync(path.join(volumesDir, 'vol-01'))).toBe(true);
  });

  it('should NOT create summary/volumes directories without --scale large', () => {
    const projectName = 'normal-novel';

    execSync(`node "${CLI_PATH}" init ${projectName} --no-git`, {
      cwd: testDir,
      stdio: 'pipe',
    });

    const projectPath = path.join(testDir, projectName);
    const summaryDir = path.join(projectPath, 'tracking', 'summary');
    const volumesDir = path.join(projectPath, 'tracking', 'volumes');

    expect(fs.existsSync(summaryDir)).toBe(false);
    expect(fs.existsSync(volumesDir)).toBe(false);
  });

  it('should store scale in config.json when --scale large', () => {
    const projectName = 'scale-config-test';

    execSync(`node "${CLI_PATH}" init ${projectName} --no-git --scale large`, {
      cwd: testDir,
      stdio: 'pipe',
    });

    const configPath = path.join(testDir, projectName, 'resources', 'config', 'config.json');
    const config = fs.readJsonSync(configPath);
    expect(config.scale).toBe('large');
  });

  it('should store withMcp flag in config.json when --with-mcp', () => {
    const projectName = 'mcp-test';

    execSync(`node "${CLI_PATH}" init ${projectName} --no-git --with-mcp`, {
      cwd: testDir,
      stdio: 'pipe',
    });

    const configPath = path.join(testDir, projectName, 'resources', 'config', 'config.json');
    const config = fs.readJsonSync(configPath);
    expect(config.mcp).toBe(true);
  });

  it('should imply --scale large when --with-mcp', () => {
    const projectName = 'mcp-large-test';

    execSync(`node "${CLI_PATH}" init ${projectName} --no-git --with-mcp`, {
      cwd: testDir,
      stdio: 'pipe',
    });

    const projectPath = path.join(testDir, projectName);
    const summaryDir = path.join(projectPath, 'tracking', 'summary');
    expect(fs.existsSync(summaryDir)).toBe(true);
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

  it('should copy volume-summary and search commands', () => {
    const projectName = 'new-commands-test';

    execSync(`node "${CLI_PATH}" init ${projectName} --no-git`, {
      cwd: testDir,
      stdio: 'pipe',
    });

    const commandsDir = path.join(testDir, projectName, '.claude', 'commands');
    expect(fs.existsSync(path.join(commandsDir, 'volume-summary.md'))).toBe(true);
    expect(fs.existsSync(path.join(commandsDir, 'search.md'))).toBe(true);
  });

  it('should copy long-series-continuity skill', () => {
    const projectName = 'long-series-skill-test';

    execSync(`node "${CLI_PATH}" init ${projectName} --no-git`, {
      cwd: testDir,
      stdio: 'pipe',
    });

    const qaSkillsDir = path.join(
      testDir,
      projectName,
      '.claude',
      'skills',
      'quality-assurance'
    );
    const skillPath = path.join(qaSkillsDir, 'long-series-continuity', 'SKILL.md');
    expect(fs.existsSync(skillPath)).toBe(true);

    // 验证 skill 内容包含关键标记
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content).toContain('long-series-continuity');
    expect(content).toContain('超长篇连贯性守护');
  });
});
