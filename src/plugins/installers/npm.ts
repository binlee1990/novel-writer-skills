/**
 * NPM 安装器
 *
 * 从 npm registry 下载并安装插件。
 * 继承 BaseInstaller，复用公共 tar 解压逻辑。
 */

import fs from 'fs-extra';
import path from 'path';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import { PluginIdentifier, InstallResult, InstallerOptions } from '../types.js';
import { BaseInstaller } from './base.js';
import { NetworkError, PluginInstallError } from '../../core/errors.js';
import { logger } from '../../utils/logger.js';

export class NpmInstaller extends BaseInstaller {
  private registry: string;

  constructor(options?: InstallerOptions) {
    super();
    this.registry = options?.registryUrl || 'https://registry.npmjs.org';
  }

  async getPackageInfo(name: string): Promise<any> {
    const url = `${this.registry}/${encodeURIComponent(name).replace('%40', '@')}`;

    let response: Response;
    try {
      response = await fetch(url);
    } catch (error) {
      throw new NetworkError(url, undefined, error instanceof Error ? error.message : '网络连接失败');
    }

    if (!response.ok) {
      if (response.status === 404) {
        throw new PluginInstallError(name, 'npm', `包 ${name} 在 npm registry 中未找到`);
      }
      throw new NetworkError(url, response.status);
    }

    return await response.json();
  }

  async getTarballUrl(name: string, version?: string): Promise<{ url: string; version: string }> {
    const info = await this.getPackageInfo(name);
    const targetVersion = version || info['dist-tags']?.latest;

    if (!targetVersion) {
      throw new PluginInstallError(name, 'npm', '未找到可用版本');
    }

    const versionInfo = info.versions?.[targetVersion];
    if (!versionInfo) {
      throw new PluginInstallError(name, 'npm', `版本 ${targetVersion} 不存在`);
    }

    return {
      url: versionInfo.dist.tarball,
      version: targetVersion,
    };
  }

  async downloadTarball(url: string, destPath: string): Promise<void> {
    let response: Response;
    try {
      response = await fetch(url);
    } catch (error) {
      throw new NetworkError(url, undefined, error instanceof Error ? error.message : '下载失败');
    }

    if (!response.ok || !response.body) {
      throw new NetworkError(url, response.status, '下载 tarball 失败');
    }

    const fileStream = createWriteStream(destPath);
    // @ts-ignore - Node.js fetch body is a ReadableStream
    await pipeline(response.body, fileStream);
  }

  async install(identifier: PluginIdentifier, destDir: string): Promise<InstallResult> {
    const { name, version } = identifier;

    logger.info(`从 npm registry 获取 ${name}...`);

    // 1. 获取 tarball URL
    const tarball = await this.getTarballUrl(name, version);

    // 2. 创建临时目录
    const tmpDir = await this.createTempDir('nws-npm-');
    const tarballPath = path.join(tmpDir, 'package.tgz');

    try {
      // 3. 下载
      logger.info(`下载 ${name}@${tarball.version}...`);
      await this.downloadTarball(tarball.url, tarballPath);

      // 4. 解压（npm tarball 有一层 package/ 包装）
      const extractPath = path.join(tmpDir, 'extracted');
      await this.extractTarball(tarballPath, extractPath, 1);

      // 5. 验证 config.yaml
      const configPath = path.join(extractPath, 'config.yaml');
      if (!await fs.pathExists(configPath)) {
        throw new PluginInstallError(name, 'npm', `包 ${name} 中未找到 config.yaml`);
      }

      // 6. 移动到目标
      const pluginName = path.basename(name);
      const pluginDir = path.join(destDir, pluginName);
      await fs.ensureDir(path.dirname(pluginDir));
      await fs.move(extractPath, pluginDir, { overwrite: true });

      return { version: tarball.version, pluginPath: pluginDir };
    } finally {
      await this.cleanup(tmpDir);
    }
  }
}
