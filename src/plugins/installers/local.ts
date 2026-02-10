/**
 * 本地安装器
 *
 * 从本地路径复制插件到项目的 plugins 目录。
 */

import fs from 'fs-extra';
import path from 'path';
import { PluginIdentifier, InstallResult } from '../types.js';
import { BaseInstaller } from './base.js';
import { PluginInstallError } from '../../core/errors.js';

export class LocalInstaller extends BaseInstaller {
  async install(identifier: PluginIdentifier, destDir: string): Promise<InstallResult> {
    const { name } = identifier;

    // 本地 tarball 安装
    if (name.endsWith('.tgz') || name.endsWith('.tar.gz')) {
      return this.installFromTarball(identifier, destDir);
    }

    throw new PluginInstallError(name, 'local', '不支持的本地安装格式');
  }

  /**
   * 从本地路径直接复制插件
   */
  async installFromPath(sourcePath: string, pluginName: string, destDir: string): Promise<InstallResult> {
    if (!await fs.pathExists(sourcePath)) {
      throw new PluginInstallError(pluginName, 'local', `源路径不存在: ${sourcePath}`);
    }

    const pluginDir = path.join(destDir, pluginName);
    await fs.copy(sourcePath, pluginDir, { overwrite: true });

    // 尝试读取版本号
    let version = '0.0.0';
    try {
      const yaml = (await import('js-yaml')).default;
      const configPath = path.join(pluginDir, 'config.yaml');
      if (await fs.pathExists(configPath)) {
        const content = await fs.readFile(configPath, 'utf-8');
        const config = yaml.load(content) as Record<string, unknown>;
        if (config && typeof config.version === 'string') {
          version = config.version;
        }
      }
    } catch {
      // 读取版本失败不阻塞安装
    }

    return { version, pluginPath: pluginDir };
  }

  private async installFromTarball(identifier: PluginIdentifier, destDir: string): Promise<InstallResult> {
    const { name } = identifier;
    const tarballPath = path.resolve(name);

    if (!await fs.pathExists(tarballPath)) {
      throw new PluginInstallError(name, 'local', `文件不存在: ${tarballPath}`);
    }

    const tmpDir = await this.createTempDir('nws-local-');

    try {
      const extractPath = path.join(tmpDir, 'extracted');
      await this.extractTarball(tarballPath, extractPath, 1);

      // 确定插件名
      const ext = name.endsWith('.tar.gz') ? '.tar.gz' : '.tgz';
      const pluginName = path.basename(name, ext);
      const pluginDir = path.join(destDir, pluginName);

      await fs.ensureDir(path.dirname(pluginDir));
      await fs.move(extractPath, pluginDir, { overwrite: true });

      return { version: '0.0.0', pluginPath: pluginDir };
    } finally {
      await this.cleanup(tmpDir);
    }
  }
}
