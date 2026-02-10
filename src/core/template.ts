/**
 * 模板引擎
 *
 * 封装模板复制逻辑，供 init 和 upgrade 命令使用。
 */

import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';

export interface CopyOptions {
  /** 是否覆盖已存在的文件，默认 false */
  overwrite?: boolean;
  /** 过滤函数，返回 false 跳过该文件 */
  filter?: (src: string) => boolean;
}

export interface CopyResult {
  /** 已复制的文件数 */
  copied: number;
  /** 已跳过的文件数（已存在且未覆盖） */
  skipped: number;
}

/**
 * 复制模板目录
 * 递归复制 source 下所有文件到 dest
 */
export async function copyTemplates(
  source: string,
  dest: string,
  options?: CopyOptions
): Promise<CopyResult> {
  const result: CopyResult = { copied: 0, skipped: 0 };

  if (!await fs.pathExists(source)) {
    return result;
  }

  const overwrite = options?.overwrite ?? false;

  await fs.ensureDir(dest);

  const entries = await fs.readdir(source, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(source, entry.name);
    const destPath = path.join(dest, entry.name);

    if (options?.filter && !options.filter(srcPath)) {
      result.skipped++;
      continue;
    }

    if (entry.isDirectory()) {
      const subResult = await copyTemplates(srcPath, destPath, options);
      result.copied += subResult.copied;
      result.skipped += subResult.skipped;
    } else {
      if (!overwrite && await fs.pathExists(destPath)) {
        result.skipped++;
      } else {
        await fs.ensureDir(path.dirname(destPath));
        await fs.copy(srcPath, destPath, { overwrite: true });
        result.copied++;
      }
    }
  }

  return result;
}

/**
 * 复制单个模板文件
 * 返回 true 表示已复制，false 表示已跳过
 */
export async function copyTemplateFile(
  source: string,
  dest: string,
  options?: CopyOptions
): Promise<boolean> {
  if (!await fs.pathExists(source)) {
    return false;
  }

  if (options?.filter && !options.filter(source)) {
    return false;
  }

  const overwrite = options?.overwrite ?? false;

  if (!overwrite && await fs.pathExists(dest)) {
    return false;
  }

  await fs.ensureDir(path.dirname(dest));
  await fs.copy(source, dest, { overwrite: true });
  return true;
}

/**
 * 获取目录下所有文件的内容哈希清单
 * 用于 upgrade 时比较文件是否有变化
 *
 * 返回 Map<相对路径, md5哈希>
 */
export async function getTemplateManifest(dir: string): Promise<Map<string, string>> {
  const manifest = new Map<string, string>();

  if (!await fs.pathExists(dir)) {
    return manifest;
  }

  await walkDir(dir, dir, manifest);
  return manifest;
}

async function walkDir(
  baseDir: string,
  currentDir: string,
  manifest: Map<string, string>
): Promise<void> {
  const entries = await fs.readdir(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);

    if (entry.isDirectory()) {
      await walkDir(baseDir, fullPath, manifest);
    } else {
      const relativePath = path.relative(baseDir, fullPath);
      const content = await fs.readFile(fullPath);
      const hash = crypto.createHash('md5').update(content).digest('hex');
      manifest.set(relativePath, hash);
    }
  }
}
