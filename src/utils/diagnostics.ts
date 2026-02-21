/**
 * 项目诊断系统
 *
 * 命令失败时自动诊断并给出修复步骤。
 * 3 项检查：项目结构、tracking 文件、JSON 完整性。
 */

import fs from 'fs-extra';
import path from 'path';
import { getProjectPaths } from '../core/config.js';

/** 单项检查结果 */
export interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
  fix?: string;
}

/** 诊断报告 */
export interface DiagnosticReport {
  error: string;
  checks: CheckResult[];
  fixes: string[];
  summary: string;
}

/** 命令上下文 */
export interface CommandContext {
  command: string;
  projectRoot: string;
  args?: string[];
}

export class ProjectDiagnostics {
  /**
   * 对错误进行诊断，返回诊断报告
   */
  async diagnoseError(error: Error, context: CommandContext): Promise<DiagnosticReport> {
    const checks = await Promise.all([
      this.checkProjectStructure(context.projectRoot),
      this.checkTrackingFiles(context.projectRoot),
      this.checkFileIntegrity(context.projectRoot),
    ]);

    const fixes = checks
      .filter(c => !c.passed && c.fix)
      .map(c => c.fix!);

    return {
      error: error.message,
      checks,
      fixes,
      summary: this.generateSummary(checks),
    };
  }

  /**
   * 检查 1: 项目结构是否完整
   */
  async checkProjectStructure(projectRoot: string): Promise<CheckResult> {
    const paths = getProjectPaths(projectRoot);
    const requiredDirs = [
      { path: paths.resources, label: 'resources' },
      { path: paths.claude, label: '.claude' },
      { path: paths.commands, label: '.claude/commands' },
    ];

    const missing: string[] = [];
    for (const dir of requiredDirs) {
      if (!await fs.pathExists(dir.path)) {
        missing.push(dir.label);
      }
    }

    if (missing.length === 0) {
      return { name: '项目结构', passed: true, message: '项目结构正常' };
    }

    return {
      name: '项目结构',
      passed: false,
      message: `缺少目录: ${missing.join(', ')}`,
      fix: 'novelws init',
    };
  }

  /**
   * 检查 2: tracking 文件是否存在（卷级分片架构下按需创建）
   */
  async checkTrackingFiles(projectRoot: string): Promise<CheckResult> {
    const storiesDir = path.join(projectRoot, 'stories');

    if (!await fs.pathExists(storiesDir)) {
      return { name: 'Tracking 文件', passed: true, message: 'tracking 文件在 /write 首次执行时按需创建' };
    }

    // 扫描 stories/*/volumes/*/tracking/ 是否有损坏的 JSON
    const stories = await fs.readdir(storiesDir).catch(() => [] as string[]);
    for (const story of stories) {
      const volumesDir = path.join(storiesDir, story, 'volumes');
      if (!await fs.pathExists(volumesDir)) continue;

      const volumes = await fs.readdir(volumesDir).catch(() => [] as string[]);
      for (const vol of volumes) {
        const trackingDir = path.join(volumesDir, vol, 'tracking');
        if (!await fs.pathExists(trackingDir)) continue;

        const jsonFiles = await fs.readdir(trackingDir).catch(() => [] as string[]);
        for (const file of jsonFiles.filter(f => f.endsWith('.json'))) {
          try {
            const content = await fs.readFile(path.join(trackingDir, file), 'utf-8');
            JSON.parse(content);
          } catch {
            return {
              name: 'Tracking 文件',
              passed: false,
              message: `JSON 格式损坏: ${story}/volumes/${vol}/tracking/${file}`,
              fix: '手动修复损坏的 JSON 文件',
            };
          }
        }
      }
    }

    return { name: 'Tracking 文件', passed: true, message: 'tracking 文件正常' };
  }

  /**
   * 检查 3: JSON 文件完整性（已合并到检查 2 的卷级扫描中）
   */
  async checkFileIntegrity(projectRoot: string): Promise<CheckResult> {
    const configPath = path.join(projectRoot, 'resources', 'config.json');

    if (await fs.pathExists(configPath)) {
      try {
        const content = await fs.readFile(configPath, 'utf-8');
        JSON.parse(content);
      } catch {
        return {
          name: '文件完整性',
          passed: false,
          message: 'config.json 格式损坏',
          fix: '手动修复 resources/config.json',
        };
      }
    }

    return { name: '文件完整性', passed: true, message: '配置文件格式正确' };
  }

  /**
   * 格式化诊断报告为用户友好的字符串
   */
  formatReport(report: DiagnosticReport): string {
    const lines: string[] = [
      `❌ 错误: ${report.error}`,
      '',
      '🔍 诊断结果:',
    ];

    for (const check of report.checks) {
      const icon = check.passed ? '✅' : '❌';
      lines.push(`  ${icon} ${check.name}: ${check.message}`);
    }

    if (report.fixes.length > 0) {
      lines.push('');
      lines.push('💡 修复步骤:');
      report.fixes.forEach((fix, i) => {
        lines.push(`  ${i + 1}. 运行: ${fix}`);
      });
    }

    return lines.join('\n');
  }

  private generateSummary(checks: CheckResult[]): string {
    const passed = checks.filter(c => c.passed).length;
    const total = checks.length;

    if (passed === total) {
      return '所有检查通过，问题可能来自其他原因';
    }

    const failed = checks.filter(c => !c.passed).map(c => c.name);
    return `${passed}/${total} 项检查通过，问题: ${failed.join(', ')}`;
  }
}
