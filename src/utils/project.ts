import fs from 'fs-extra';
import path from 'path';
import { DIRS, FILES } from '../core/config.js';
import { ProjectNotFoundError } from '../core/errors.js';

export interface ProjectInfo {
  name: string;
  version: string;
  hasClaudeDir: boolean;
  hasResourcesDir: boolean;
  hasStoriesDir: boolean;
}

/**
 * 检测当前目录是否是 novel-writer-skills 项目
 */
export async function isProjectRoot(dir: string): Promise<boolean> {
  const configPath = path.join(dir, DIRS.RESOURCES, FILES.CONFIG);
  return await fs.pathExists(configPath);
}

/**
 * 向上查找项目根目录
 */
export async function findProjectRoot(startDir: string = process.cwd()): Promise<string | null> {
  let currentDir = startDir;

  while (true) {
    if (await isProjectRoot(currentDir)) {
      return currentDir;
    }

    const parentDir = path.dirname(currentDir);

    // 已到达文件系统根目录
    if (parentDir === currentDir) {
      return null;
    }

    currentDir = parentDir;
  }
}

/**
 * 确保在项目根目录，否则抛出错误
 */
export async function ensureProjectRoot(): Promise<string> {
  const projectRoot = await findProjectRoot();

  if (!projectRoot) {
    throw new ProjectNotFoundError();
  }

  return projectRoot;
}

/**
 * 向命令文件的 frontmatter 中注入 model 字段
 */
export async function injectModelToCommands(commandsDir: string, model: string): Promise<void> {
  const files = await fs.readdir(commandsDir);
  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    const filePath = path.join(commandsDir, file);
    let content = await fs.readFile(filePath, 'utf-8');
    const firstIdx = content.indexOf('---');
    if (firstIdx === -1) continue;
    const secondIdx = content.indexOf('---', firstIdx + 3);
    if (secondIdx === -1) continue;
    content = content.slice(0, secondIdx) + `model: ${model}\n` + content.slice(secondIdx);
    await fs.writeFile(filePath, content, 'utf-8');
  }
}

export async function getProjectInfo(projectPath: string): Promise<ProjectInfo | null> {
  try {
    const configPath = path.join(projectPath, DIRS.RESOURCES, FILES.CONFIG);

    if (!await fs.pathExists(configPath)) {
      return null;
    }

    const config = await fs.readJson(configPath);

    return {
      name: config.name || path.basename(projectPath),
      version: config.version || 'unknown',
      hasClaudeDir: await fs.pathExists(path.join(projectPath, DIRS.CLAUDE)),
      hasResourcesDir: await fs.pathExists(path.join(projectPath, DIRS.RESOURCES)),
      hasStoriesDir: await fs.pathExists(path.join(projectPath, DIRS.STORIES)),
    };
  } catch {
    return null;
  }
}
