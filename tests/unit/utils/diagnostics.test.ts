import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import {
  ProjectDiagnostics,
  type CommandContext,
  type DiagnosticReport,
} from '../../../src/utils/diagnostics.js';

describe('utils/diagnostics.ts', () => {
  let diagnostics: ProjectDiagnostics;
  let tmpDir: string;

  beforeEach(async () => {
    diagnostics = new ProjectDiagnostics();
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'diag-test-'));
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  /** 创建最小项目结构 */
  async function createMinimalProject() {
    await fs.ensureDir(path.join(tmpDir, 'resources'));
    await fs.writeJson(path.join(tmpDir, 'resources', 'config.json'), { name: 'test', version: '1.0.0' });
    await fs.ensureDir(path.join(tmpDir, '.claude', 'commands'));
    await fs.ensureDir(path.join(tmpDir, 'stories'));
  }

  /** 创建 tracking 文件 */
  async function createTrackingFiles(valid = true) {
    const trackingDir = path.join(tmpDir, 'tracking');
    await fs.ensureDir(trackingDir);
    const files = ['character-state.json', 'plot-tracker.json', 'timeline.json', 'relationships.json'];
    for (const file of files) {
      if (valid) {
        await fs.writeJson(path.join(trackingDir, file), {});
      } else {
        await fs.writeFile(path.join(trackingDir, file), '{invalid json', 'utf-8');
      }
    }
  }

  describe('checkProjectStructure', () => {
    it('should pass when project structure is complete', async () => {
      await createMinimalProject();
      const result = await diagnostics.checkProjectStructure(tmpDir);
      expect(result.passed).toBe(true);
      expect(result.name).toBe('项目结构');
    });

    it('should fail when directories are missing', async () => {
      const result = await diagnostics.checkProjectStructure(tmpDir);
      expect(result.passed).toBe(false);
      expect(result.message).toContain('resources');
      expect(result.fix).toBe('novelws init');
    });
  });

  describe('checkTrackingFiles', () => {
    it('should pass when all tracking files exist', async () => {
      await createTrackingFiles();
      const result = await diagnostics.checkTrackingFiles(tmpDir);
      expect(result.passed).toBe(true);
    });

    it('should fail when tracking dir is missing', async () => {
      const result = await diagnostics.checkTrackingFiles(tmpDir);
      expect(result.passed).toBe(false);
      expect(result.fix).toBe('novelws init');
    });

    it('should report missing tracking files', async () => {
      const trackingDir = path.join(tmpDir, 'tracking');
      await fs.ensureDir(trackingDir);
      await fs.writeJson(path.join(trackingDir, 'character-state.json'), {});
      const result = await diagnostics.checkTrackingFiles(tmpDir);
      expect(result.passed).toBe(false);
      expect(result.message).toContain('plot-tracker.json');
    });
  });

  describe('checkFileIntegrity', () => {
    it('should pass when all JSON files are valid', async () => {
      await createTrackingFiles(true);
      const result = await diagnostics.checkFileIntegrity(tmpDir);
      expect(result.passed).toBe(true);
    });

    it('should fail when JSON files are corrupted', async () => {
      await createTrackingFiles(false);
      const result = await diagnostics.checkFileIntegrity(tmpDir);
      expect(result.passed).toBe(false);
      expect(result.message).toContain('JSON 格式损坏');
    });

    it('should pass when no tracking dir exists', async () => {
      const result = await diagnostics.checkFileIntegrity(tmpDir);
      expect(result.passed).toBe(true);
    });
  });

  describe('diagnoseError', () => {
    it('should run all 3 checks and return report', async () => {
      await createMinimalProject();
      await createTrackingFiles();

      const context: CommandContext = {
        command: '/write',
        projectRoot: tmpDir,
      };

      const report = await diagnostics.diagnoseError(new Error('测试错误'), context);
      expect(report.error).toBe('测试错误');
      expect(report.checks).toHaveLength(3);
      expect(report.summary).toBeDefined();
    });

    it('should collect fixes from failed checks', async () => {
      const context: CommandContext = {
        command: '/write',
        projectRoot: tmpDir,
      };

      const report = await diagnostics.diagnoseError(new Error('命令失败'), context);
      expect(report.fixes.length).toBeGreaterThan(0);
    });
  });

  describe('formatReport', () => {
    it('should format report with fixes', () => {
      const report: DiagnosticReport = {
        error: '测试错误',
        checks: [
          { name: '项目结构', passed: true, message: '正常' },
          { name: 'Tracking 文件', passed: false, message: '缺少文件', fix: 'novelws init' },
        ],
        fixes: ['novelws init'],
        summary: '1/2 项检查通过',
      };

      const output = diagnostics.formatReport(report);
      expect(output).toContain('❌ 错误: 测试错误');
      expect(output).toContain('🔍 诊断结果');
      expect(output).toContain('✅ 项目结构');
      expect(output).toContain('❌ Tracking 文件');
      expect(output).toContain('💡 修复步骤');
      expect(output).toContain('novelws init');
    });

    it('should format report without fixes when all pass', () => {
      const report: DiagnosticReport = {
        error: '未知错误',
        checks: [
          { name: '项目结构', passed: true, message: '正常' },
        ],
        fixes: [],
        summary: '所有检查通过',
      };

      const output = diagnostics.formatReport(report);
      expect(output).not.toContain('💡 修复步骤');
    });
  });
});
