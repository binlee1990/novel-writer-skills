/**
 * 项目诊断系统
 *
 * 命令失败时自动诊断并给出修复步骤。
 * 5 项检查：项目结构、JSON 格式、项目模式、依赖状态、修复建议。
 */

import fs from 'fs-extra';
import path from 'path';
import { DIRS, getProjectPaths } from '../core/config.js';

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

/** 项目模式 */
export type ProjectMode = 'single-file' | 'sharded' | 'mcp' | 'unknown';

export class ProjectDiagnostics {
  /**
   * 对错误进行诊断，返回诊断报告
   */
  async diagnoseError(error: Error, context: CommandContext): Promise<DiagnosticReport> {
    const checks = await Promise.all([
      this.checkProjectStructure(context.projectRoot),
      this.checkTrackingFiles(context.projectRoot),
      this.checkProjectMode(context.projectRoot),
      this.checkMCPStatus(context.projectRoot),
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
      { path: paths.specify, label: '.specify' },
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
   * 检查 2: tracking 文件是否存在
   */
  async checkTrackingFiles(projectRoot: string): Promise<CheckResult> {
    const trackingDir = getProjectPaths(projectRoot).tracking;

    if (!await fs.pathExists(trackingDir)) {
      return {
        name: 'Tracking 文件',
        passed: false,
        message: 'spec/tracking 目录不存在',
        fix: '/track --sync',
      };
    }

    const expectedFiles = [
      'character-state.json',
      'plot-tracker.json',
      'timeline.json',
      'relationships.json',
    ];

    const missing: string[] = [];
    for (const file of expectedFiles) {
      if (!await fs.pathExists(path.join(trackingDir, file))) {
        missing.push(file);
      }
    }

    if (missing.length === 0) {
      return { name: 'Tracking 文件', passed: true, message: 'tracking 文件存在' };
    }

    return {
      name: 'Tracking 文件',
      passed: false,
      message: `缺少 tracking 文件: ${missing.join(', ')}`,
      fix: '/track --sync',
    };
  }

  /**
   * 检查 3: 项目模式是否匹配
   */
  async checkProjectMode(projectRoot: string): Promise<CheckResult> {
    const mode = await this.detectProjectMode(projectRoot);

    if (mode === 'unknown') {
      return {
        name: '项目模式',
        passed: false,
        message: '无法检测项目模式',
        fix: '/track --sync',
      };
    }

    return {
      name: '项目模式',
      passed: true,
      message: `当前模式: ${mode}`,
    };
  }

  /**
   * 检查 4: MCP 服务器状态
   */
  async checkMCPStatus(projectRoot: string): Promise<CheckResult> {
    const dbPath = path.join(projectRoot, 'novel-tracking.db');
    const mcpConfigPath = path.join(projectRoot, '.claude', 'mcp.json');

    const hasDb = await fs.pathExists(dbPath);
    const hasMcpConfig = await fs.pathExists(mcpConfigPath);

    if (!hasMcpConfig) {
      return {
        name: 'MCP 状态',
        passed: true,
        message: '未配置 MCP（使用 JSON 模式）',
      };
    }

    if (hasMcpConfig && !hasDb) {
      return {
        name: 'MCP 状态',
        passed: false,
        message: 'MCP 已配置但数据库不存在',
        fix: '/track --migrate --target mcp',
      };
    }

    return { name: 'MCP 状态', passed: true, message: 'MCP 服务正常' };
  }

  /**
   * 检查 5: JSON 文件完整性
   */
  async checkFileIntegrity(projectRoot: string): Promise<CheckResult> {
    const trackingDir = getProjectPaths(projectRoot).tracking;

    if (!await fs.pathExists(trackingDir)) {
      return { name: '文件完整性', passed: true, message: '无 tracking 文件需要验证' };
    }

    const jsonFiles = [
      'character-state.json',
      'plot-tracker.json',
      'timeline.json',
      'relationships.json',
    ];

    const corrupted: string[] = [];
    for (const file of jsonFiles) {
      const filePath = path.join(trackingDir, file);
      if (await fs.pathExists(filePath)) {
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          JSON.parse(content);
        } catch {
          corrupted.push(file);
        }
      }
    }

    if (corrupted.length === 0) {
      return { name: '文件完整性', passed: true, message: 'JSON 文件格式正确' };
    }

    return {
      name: '文件完整性',
      passed: false,
      message: `JSON 格式损坏: ${corrupted.join(', ')}`,
      fix: '/track --fix',
    };
  }

  /**
   * 检测项目模式
   */
  async detectProjectMode(projectRoot: string): Promise<ProjectMode> {
    const paths = getProjectPaths(projectRoot);
    const dbPath = path.join(projectRoot, 'novel-tracking.db');

    if (await fs.pathExists(dbPath)) {
      return 'mcp';
    }

    if (await fs.pathExists(paths.trackingVolumes)) {
      const entries = await fs.readdir(paths.trackingVolumes).catch(() => []);
      if (entries.length > 0) {
        return 'sharded';
      }
    }

    if (await fs.pathExists(paths.tracking)) {
      return 'single-file';
    }

    return 'unknown';
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
