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

  it('should detect large tracking files and output migration hint', () => {
    // 创建一个超过 50KB 的 character-state.json
    const trackingPath = path.join(projectPath, 'tracking', 'character-state.json');
    const largeData = { characters: 'x'.repeat(60 * 1024) };
    fs.writeJsonSync(trackingPath, largeData);

    const output = execSync(`node "${CLI_PATH}" upgrade -y`, {
      cwd: projectPath,
      stdio: 'pipe',
      encoding: 'utf-8',
    });

    expect(output).toContain('tracking');
  });

  it('should not show migration hint for small tracking files', () => {
    const output = execSync(`node "${CLI_PATH}" upgrade -y`, {
      cwd: projectPath,
      stdio: 'pipe',
      encoding: 'utf-8',
    });

    expect(output).not.toContain('迁移');
  });
});
