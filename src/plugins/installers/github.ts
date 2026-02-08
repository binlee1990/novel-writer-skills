import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import { execSync } from 'child_process';
import { PluginIdentifier } from '../types.js';
import { logger } from '../../utils/logger.js';

export class GitHubInstaller {
  async getRepoInfo(repository: string): Promise<any> {
    const url = `https://api.github.com/repos/${repository}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'novel-writer-skills',
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(`Repository ${repository} not found on GitHub`);
    }

    return await response.json();
  }

  async downloadArchive(
    repository: string,
    ref: string,
    destPath: string
  ): Promise<void> {
    // 使用 GitHub tarball API（无需 token 即可下载公开仓库）
    const url = `https://api.github.com/repos/${repository}/tarball/${ref}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'novel-writer-skills',
      },
      redirect: 'follow',
    });

    if (!response.ok || !response.body) {
      throw new Error(`Failed to download from GitHub: ${repository}@${ref}`);
    }

    const fileStream = createWriteStream(destPath);
    // @ts-ignore - Node.js fetch body is a ReadableStream
    await pipeline(response.body, fileStream);
  }

  async extractTarball(tarballPath: string, extractPath: string): Promise<string> {
    await fs.ensureDir(extractPath);

    // GitHub tarball 有一层包装目录（repo-name-commit-sha/）
    try {
      execSync(`tar -xzf "${tarballPath}" -C "${extractPath}"`, {
        stdio: 'pipe',
      });
    } catch {
      try {
        execSync(
          `powershell -Command "tar -xzf '${tarballPath}' -C '${extractPath}'"`,
          { stdio: 'pipe' }
        );
      } catch {
        throw new Error('Failed to extract archive. Please ensure tar is available.');
      }
    }

    // 找到解压后的顶层目录
    const entries = await fs.readdir(extractPath, { withFileTypes: true });
    const topDir = entries.find(e => e.isDirectory());

    if (!topDir) {
      throw new Error('Invalid archive structure');
    }

    return path.join(extractPath, topDir.name);
  }

  private async findConfigYaml(dir: string): Promise<string | null> {
    const files = await fs.readdir(dir, { withFileTypes: true });

    for (const file of files) {
      const fullPath = path.join(dir, file.name);

      if (file.isFile() && file.name === 'config.yaml') {
        return fullPath;
      }

      if (file.isDirectory()) {
        const result = await this.findConfigYaml(fullPath);
        if (result) return result;
      }
    }

    return null;
  }

  async install(identifier: PluginIdentifier, destDir: string): Promise<string> {
    const { repository, version, name } = identifier;

    if (!repository) {
      throw new Error('GitHub repository is required');
    }

    logger.info(`Fetching ${repository} from GitHub...`);

    // 1. 创建临时目录
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nws-gh-'));
    const tarballPath = path.join(tmpDir, 'repo.tar.gz');

    try {
      // 2. 下载 tarball
      const ref = version || 'main';
      logger.info(`Downloading ${repository}@${ref}...`);
      await this.downloadArchive(repository, ref, tarballPath);

      // 3. 解压
      const extractPath = path.join(tmpDir, 'extracted');
      const repoDir = await this.extractTarball(tarballPath, extractPath);

      // 4. 查找 config.yaml
      const configPath = await this.findConfigYaml(repoDir);
      if (!configPath) {
        throw new Error(`Invalid plugin: config.yaml not found in ${repository}`);
      }

      const pluginRoot = path.dirname(configPath);

      // 5. 移动到目标
      const pluginDir = path.join(destDir, name);
      await fs.move(pluginRoot, pluginDir, { overwrite: true });

      return ref;
    } finally {
      await fs.remove(tmpDir).catch(() => {});
    }
  }
}
