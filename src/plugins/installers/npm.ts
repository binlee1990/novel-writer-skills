import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import { execSync } from 'child_process';
import { PluginIdentifier } from '../types.js';
import { logger } from '../../utils/logger.js';

export class NpmInstaller {
  private registry: string;

  constructor(registry = 'https://registry.npmjs.org') {
    this.registry = registry;
  }

  async getPackageInfo(name: string): Promise<any> {
    const url = `${this.registry}/${encodeURIComponent(name).replace('%40', '@')}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Package ${name} not found in npm registry`);
    }

    return await response.json();
  }

  async getTarballUrl(name: string, version?: string): Promise<{ url: string; version: string }> {
    const info = await this.getPackageInfo(name);
    const targetVersion = version || info['dist-tags']?.latest;

    if (!targetVersion) {
      throw new Error(`No version found for ${name}`);
    }

    const versionInfo = info.versions?.[targetVersion];
    if (!versionInfo) {
      throw new Error(`Version ${targetVersion} not found for ${name}`);
    }

    return {
      url: versionInfo.dist.tarball,
      version: targetVersion,
    };
  }

  async downloadTarball(url: string, destPath: string): Promise<void> {
    const response = await fetch(url);

    if (!response.ok || !response.body) {
      throw new Error(`Failed to download: ${url}`);
    }

    const fileStream = createWriteStream(destPath);
    // @ts-ignore - Node.js fetch body is a ReadableStream
    await pipeline(response.body, fileStream);
  }

  async extractTarball(tarballPath: string, extractPath: string): Promise<void> {
    await fs.ensureDir(extractPath);

    // 使用系统 tar 命令解压（跨平台兼容）
    try {
      execSync(`tar -xzf "${tarballPath}" -C "${extractPath}" --strip-components=1`, {
        stdio: 'pipe',
      });
    } catch {
      // Windows 可能没有 tar，尝试 PowerShell
      try {
        execSync(
          `powershell -Command "tar -xzf '${tarballPath}' -C '${extractPath}' --strip-components=1"`,
          { stdio: 'pipe' }
        );
      } catch {
        throw new Error('Failed to extract tarball. Please ensure tar is available on your system.');
      }
    }
  }

  async install(identifier: PluginIdentifier, destDir: string): Promise<string> {
    const { name, version } = identifier;

    logger.info(`Fetching ${name} from npm registry...`);

    // 1. 获取 tarball URL
    const tarball = await this.getTarballUrl(name, version);

    // 2. 创建临时目录
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nws-npm-'));
    const tarballPath = path.join(tmpDir, 'package.tgz');

    try {
      // 3. 下载
      logger.info(`Downloading ${name}@${tarball.version}...`);
      await this.downloadTarball(tarball.url, tarballPath);

      // 4. 解压
      const extractPath = path.join(tmpDir, 'extracted');
      await this.extractTarball(tarballPath, extractPath);

      // 5. 验证 config.yaml
      const configPath = path.join(extractPath, 'config.yaml');
      if (!await fs.pathExists(configPath)) {
        throw new Error(`Invalid plugin: config.yaml not found in ${name}`);
      }

      // 6. 移动到目标
      const pluginName = path.basename(name);
      const pluginDir = path.join(destDir, pluginName);
      await fs.ensureDir(path.dirname(pluginDir));
      await fs.move(extractPath, pluginDir, { overwrite: true });

      return tarball.version;
    } finally {
      // 清理临时目录
      await fs.remove(tmpDir).catch(() => {});
    }
  }
}
