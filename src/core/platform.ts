/**
 * 跨平台工具
 *
 * 统一 tar 解压逻辑（Windows PowerShell / Unix tar），
 * 提供可执行权限设置、临时目录管理等工具。
 */

import { execSync } from 'child_process';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { PlatformError } from './errors.js';

/**
 * 解压 tarball 文件
 * Windows 使用 PowerShell 的 tar 命令，Unix 使用系统 tar
 */
export async function extractTarball(
  tarballPath: string,
  extractPath: string,
  options?: { stripComponents?: number }
): Promise<void> {
  await fs.ensureDir(extractPath);

  const strip = options?.stripComponents ?? 0;
  const isWindows = process.platform === 'win32';

  try {
    if (isWindows) {
      // Windows: 使用 tar 命令（Windows 10+ 内置）
      const stripArg = strip > 0 ? `--strip-components=${strip}` : '';
      const cmd = `tar -xzf "${tarballPath}" -C "${extractPath}" ${stripArg}`.trim();
      execSync(cmd, { stdio: 'ignore' });
    } else {
      // Unix: 使用系统 tar
      const stripArg = strip > 0 ? `--strip-components=${strip}` : '';
      const cmd = `tar -xzf "${tarballPath}" -C "${extractPath}" ${stripArg}`.trim();
      execSync(cmd, { stdio: 'ignore' });
    }
  } catch (error) {
    throw new PlatformError(
      `解压 tarball 失败: ${tarballPath} → ${extractPath}` +
      (error instanceof Error ? `: ${error.message}` : '')
    );
  }
}

/**
 * 设置文件可执行权限
 * Unix 上设置 0o755，Windows 上跳过（无需此操作）
 */
export function setExecutable(filePath: string): void {
  if (process.platform === 'win32') {
    return;
  }

  try {
    fs.chmodSync(filePath, 0o755);
  } catch (error) {
    throw new PlatformError(
      `设置可执行权限失败: ${filePath}` +
      (error instanceof Error ? `: ${error.message}` : '')
    );
  }
}

/**
 * 创建临时目录
 */
export async function createTempDir(prefix: string = 'nws-'): Promise<string> {
  const tmpBase = os.tmpdir();
  const tmpDir = path.join(tmpBase, `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  await fs.ensureDir(tmpDir);
  return tmpDir;
}

/**
 * 清理临时目录
 */
export async function cleanupTempDir(dir: string): Promise<void> {
  try {
    await fs.remove(dir);
  } catch {
    // 清理失败不阻塞主流程
  }
}
