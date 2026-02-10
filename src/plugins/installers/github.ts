/**
 * GitHub 安装器
 *
 * 从 GitHub 仓库下载并安装插件。
 * 继承 BaseInstaller，复用公共 tar 解压逻辑。
 * 支持 GITHUB_TOKEN 环境变量用于私有仓库。
 */

import fs from 'fs-extra';
import path from 'path';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import { PluginIdentifier, InstallResult, InstallerOptions } from '../types.js';
import { BaseInstaller } from './base.js';
import { NetworkError, PluginInstallError } from '../../core/errors.js';
import { logger } from '../../utils/logger.js';

/** config.yaml 搜索最大深度 */
const MAX_SEARCH_DEPTH = 3;

export class GitHubInstaller extends BaseInstaller {
  private token?: string;

  constructor(options?: InstallerOptions) {
    super();
    this.token = options?.githubToken || process.env.GITHUB_TOKEN;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'User-Agent': 'novel-writer-skills',
      'Accept': 'application/vnd.github.v3+json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async getRepoInfo(repository: string): Promise<any> {
    const url = `https://api.github.com/repos/${repository}`;

    let response: Response;
    try {
      response = await fetch(url, { headers: this.getHeaders() });
    } catch (error) {
      throw new NetworkError(url, undefined, error instanceof Error ? error.message : '网络连接失败');
    }

    if (!response.ok) {
      if (response.status === 404) {
        throw new PluginInstallError(repository, 'github', `仓库 ${repository} 在 GitHub 上未找到`);
      }
      throw new NetworkError(url, response.status);
    }

    return await response.json();
  }

  async downloadArchive(
    repository: string,
    ref: string,
    destPath: string
  ): Promise<void> {
    const url = `https://api.github.com/repos/${repository}/tarball/${ref}`;

    let response: Response;
    try {
      response = await fetch(url, {
        headers: { ...this.getHeaders(), 'Accept': '*/*' },
        redirect: 'follow',
      });
    } catch (error) {
      throw new NetworkError(url, undefined, error instanceof Error ? error.message : '下载失败');
    }

    if (!response.ok || !response.body) {
      throw new NetworkError(url, response.status, `从 GitHub 下载失败: ${repository}@${ref}`);
    }

    const fileStream = createWriteStream(destPath);
    // @ts-ignore - Node.js fetch body is a ReadableStream
    await pipeline(response.body, fileStream);
  }

  /**
   * 在目录中查找 config.yaml，限制搜索深度
   */
  private async findConfigYaml(dir: string, depth: number = 0): Promise<string | null> {
    if (depth > MAX_SEARCH_DEPTH) {
      return null;
    }

    const files = await fs.readdir(dir, { withFileTypes: true });

    // 先检查当前目录
    for (const file of files) {
      if (file.isFile() && file.name === 'config.yaml') {
        return path.join(dir, file.name);
      }
    }

    // 再递归子目录
    for (const file of files) {
      if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
        const result = await this.findConfigYaml(path.join(dir, file.name), depth + 1);
        if (result) return result;
      }
    }

    return null;
  }

  async install(identifier: PluginIdentifier, destDir: string): Promise<InstallResult> {
    const { repository, version, name } = identifier;

    if (!repository) {
      throw new PluginInstallError(name, 'github', '缺少 GitHub 仓库地址');
    }

    logger.info(`从 GitHub 获取 ${repository}...`);

    // 1. 创建临时目录
    const tmpDir = await this.createTempDir('nws-gh-');
    const tarballPath = path.join(tmpDir, 'repo.tar.gz');

    try {
      // 2. 下载 tarball
      const ref = version || 'main';
      logger.info(`下载 ${repository}@${ref}...`);
      await this.downloadArchive(repository, ref, tarballPath);

      // 3. 解压（GitHub tarball 有一层 repo-name-sha/ 包装）
      const extractPath = path.join(tmpDir, 'extracted');
      await this.extractTarball(tarballPath, extractPath, 0);

      // 找到解压后的顶层目录
      const entries = await fs.readdir(extractPath, { withFileTypes: true });
      const topDir = entries.find(e => e.isDirectory());

      if (!topDir) {
        throw new PluginInstallError(name, 'github', '无效的归档结构');
      }

      const repoDir = path.join(extractPath, topDir.name);

      // 4. 查找 config.yaml
      const configPath = await this.findConfigYaml(repoDir);
      if (!configPath) {
        throw new PluginInstallError(name, 'github', `仓库 ${repository} 中未找到 config.yaml`);
      }

      const pluginRoot = path.dirname(configPath);

      // 5. 移动到目标
      const pluginDir = path.join(destDir, name);
      await fs.move(pluginRoot, pluginDir, { overwrite: true });

      return { version: ref, pluginPath: pluginDir };
    } finally {
      await this.cleanup(tmpDir);
    }
  }
}
