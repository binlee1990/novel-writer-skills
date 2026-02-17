import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

// 根据平台选择脚本路径和执行命令
const isWindows = process.platform === 'win32';
const scriptPath = isWindows
  ? path.resolve(__dirname, '../../../templates/resources/scripts/powershell/migrate-tracking.ps1')
  : path.resolve(__dirname, '../../../templates/resources/scripts/bash/migrate-tracking.sh');

// 构建执行命令的辅助函数
function buildCommand(mode: string, json = true): string {
  if (isWindows) {
    return `powershell -File "${scriptPath}" -Mode ${mode}${json ? ' -Json' : ''}`;
  } else {
    return `bash "${scriptPath}" --mode ${mode}${json ? ' --json' : ''}`;
  }
}

describe('migrate-tracking script', () => {
  let tempDir: string;
  let trackingDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nws-migrate-'));
    trackingDir = path.join(tempDir, 'tracking');
    fs.ensureDirSync(trackingDir);
  });

  afterEach(() => {
    try { fs.removeSync(tempDir); } catch { /* ignore */ }
  });

  describe('check mode', () => {
    it('should detect single-file mode and report sizes', () => {
      fs.writeJsonSync(path.join(trackingDir, 'character-state.json'), { protagonist: { name: 'test' } });

      const output = execSync(
        buildCommand('check'),
        { cwd: tempDir, encoding: 'utf-8' }
      );

      const result = JSON.parse(output);
      expect(result.mode).toBe('single-file');
      expect(result.needsMigration).toBe(false);
      expect(result.files.length).toBe(1);
      expect(result.files[0].name).toBe('character-state.json');
    });

    it('should detect need for migration when files are large', () => {
      const largeData = { data: 'x'.repeat(60 * 1024) };
      fs.writeJsonSync(path.join(trackingDir, 'character-state.json'), largeData);

      const output = execSync(
        buildCommand('check'),
        { cwd: tempDir, encoding: 'utf-8' }
      );

      const result = JSON.parse(output);
      expect(result.needsMigration).toBe(true);
      expect(result.totalSize).toBeGreaterThan(50 * 1024);
    });

    it('should detect sharded mode when volumes dir exists', () => {
      fs.ensureDirSync(path.join(trackingDir, 'volumes', 'vol-01'));
      fs.ensureDirSync(path.join(trackingDir, 'volumes', 'vol-02'));

      const output = execSync(
        buildCommand('check'),
        { cwd: tempDir, encoding: 'utf-8' }
      );

      const result = JSON.parse(output);
      expect(result.mode).toBe('sharded');
      expect(result.volumes).toBe(2);
    });

    it('should handle no tracking files gracefully', () => {
      const output = execSync(
        buildCommand('check'),
        { cwd: tempDir, encoding: 'utf-8' }
      );

      const result = JSON.parse(output);
      expect(result.mode).toBe('single-file');
      expect(result.files.length).toBe(0);
      expect(result.totalSize).toBe(0);
      expect(result.needsMigration).toBe(false);
    });
  });

  describe('backup mode', () => {
    it('should create backup with timestamp directory', () => {
      fs.writeJsonSync(path.join(trackingDir, 'character-state.json'), { test: true });
      fs.writeJsonSync(path.join(trackingDir, 'plot-tracker.json'), { plots: [] });

      const output = execSync(
        buildCommand('backup'),
        { cwd: tempDir, encoding: 'utf-8' }
      );

      const result = JSON.parse(output);
      expect(fs.existsSync(result.backupPath)).toBe(true);
      expect(fs.existsSync(path.join(result.backupPath, 'character-state.json'))).toBe(true);
      expect(fs.existsSync(path.join(result.backupPath, 'plot-tracker.json'))).toBe(true);
    });

    it('should also backup story-facts.json if present', () => {
      fs.writeJsonSync(path.join(trackingDir, 'character-state.json'), { test: true });
      fs.writeJsonSync(path.join(trackingDir, 'story-facts.json'), { facts: [] });

      const output = execSync(
        buildCommand('backup'),
        { cwd: tempDir, encoding: 'utf-8' }
      );

      const result = JSON.parse(output);
      expect(fs.existsSync(path.join(result.backupPath, 'story-facts.json'))).toBe(true);
    });
  });

  describe('auto mode', () => {
    it('should create directory structure and backup', () => {
      fs.writeJsonSync(path.join(trackingDir, 'character-state.json'), { test: true });

      const output = execSync(
        buildCommand('auto'),
        { cwd: tempDir, encoding: 'utf-8' }
      );

      const result = JSON.parse(output);
      expect(result.status).toBe('ready');
      expect(result.backupPath).toBeTruthy();
      expect(fs.existsSync(path.join(trackingDir, 'summary'))).toBe(true);
      expect(fs.existsSync(path.join(trackingDir, 'volumes'))).toBe(true);
    });

    it('should report already-sharded when volumes exist', () => {
      fs.ensureDirSync(path.join(trackingDir, 'volumes', 'vol-01'));

      const output = execSync(
        buildCommand('auto'),
        { cwd: tempDir, encoding: 'utf-8' }
      );

      const result = JSON.parse(output);
      expect(result.status).toBe('already-sharded');
    });
  });
});

describe('track.md --migrate', () => {
  it('should include --migrate in argument-hint', () => {
    const trackMd = fs.readFileSync(
      path.resolve(__dirname, '../../../templates/commands/track.md'), 'utf-8'
    );
    expect(trackMd).toContain('--migrate');
  });

  it('should include --sync in argument-hint', () => {
    const trackMd = fs.readFileSync(
      path.resolve(__dirname, '../../../templates/commands/track.md'), 'utf-8'
    );
    expect(trackMd).toContain('--sync');
  });

  it('should document migration phases', () => {
    const trackMd = fs.readFileSync(
      path.resolve(__dirname, '../../../templates/commands/track.md'), 'utf-8'
    );
    expect(trackMd).toContain('阶段 1：检测与备份');
    expect(trackMd).toContain('阶段 2：确定卷边界');
    expect(trackMd).toContain('阶段 3：数据拆分');
    expect(trackMd).toContain('阶段 4：生成全局摘要');
    expect(trackMd).toContain('阶段 5：初始化 SQLite');
    expect(trackMd).toContain('阶段 6：验证与清理');
  });
});
