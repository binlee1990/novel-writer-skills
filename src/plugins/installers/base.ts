/**
 * 安装器抽象基类
 *
 * 提取 npm/github/local 安装器的公共逻辑：
 * 临时目录管理、tar 解压。
 */

import { PluginIdentifier, InstallResult } from '../types.js';
import { extractTarball, createTempDir, cleanupTempDir } from '../../core/platform.js';

export abstract class BaseInstaller {
  /**
   * 解压 tarball 到指定目录
   */
  protected async extractTarball(
    tarballPath: string,
    extractPath: string,
    stripComponents?: number
  ): Promise<void> {
    await extractTarball(tarballPath, extractPath, {
      stripComponents: stripComponents ?? 0,
    });
  }

  /**
   * 创建临时工作目录
   */
  protected async createTempDir(prefix?: string): Promise<string> {
    return createTempDir(prefix);
  }

  /**
   * 清理临时目录
   */
  protected async cleanup(tempDir: string): Promise<void> {
    await cleanupTempDir(tempDir);
  }

  /**
   * 安装插件到目标目录
   * 子类必须实现此方法
   */
  abstract install(identifier: PluginIdentifier, destDir: string): Promise<InstallResult>;
}
