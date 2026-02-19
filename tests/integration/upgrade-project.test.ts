import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

const CLI_PATH = path.resolve(__dirname, '../../dist/cli.js');

describe('novelws upgrade', () => {
  let testDir: string;
  let projectPath: string;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nws-upgrade-'));
    // 先创建一个项目
    execSync(`node "${CLI_PATH}" init test-novel --no-git`, {
      cwd: testDir,
      stdio: 'pipe',
    });
    projectPath = path.join(testDir, 'test-novel');
  });

  afterEach(async () => {
    try {
      await fs.remove(testDir);
    } catch {
      // ignore cleanup errors on Windows
    }
  });

  it('should upgrade project successfully', () => {
    const output = execSync(`node "${CLI_PATH}" upgrade -y`, {
      cwd: projectPath,
      stdio: 'pipe',
      encoding: 'utf-8',
    });

    expect(output).toContain('升级内容');
  });

  it('should update version in config', () => {
    execSync(`node "${CLI_PATH}" upgrade -y`, {
      cwd: projectPath,
      stdio: 'pipe',
    });

    const config = fs.readJsonSync(path.join(projectPath, 'resources', 'config.json'));
    expect(config.version).toBeDefined();
  });
});
