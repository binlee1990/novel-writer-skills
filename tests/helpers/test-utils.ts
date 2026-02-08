import fs from 'fs-extra';
import path from 'path';
import os from 'os';

/**
 * 创建临时测试目录
 */
export function createTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'nws-test-'));
}

/**
 * 创建模拟 novel-writer-skills 项目
 */
export async function createMockProject(baseDir: string, name: string = 'test-novel'): Promise<string> {
  const projectPath = path.join(baseDir, name);

  // 创建基本目录结构
  await fs.ensureDir(path.join(projectPath, '.specify'));
  await fs.ensureDir(path.join(projectPath, '.claude', 'commands'));
  await fs.ensureDir(path.join(projectPath, '.claude', 'skills'));
  await fs.ensureDir(path.join(projectPath, 'stories'));
  await fs.ensureDir(path.join(projectPath, 'spec', 'tracking'));
  await fs.ensureDir(path.join(projectPath, 'plugins'));

  // 创建配置文件
  await fs.writeJson(path.join(projectPath, '.specify', 'config.json'), {
    name: name,
    version: '1.0.0',
    type: 'novel-project',
  });

  return projectPath;
}

/**
 * 创建模拟插件目录
 */
export async function createMockPlugin(
  pluginsDir: string,
  pluginName: string,
  config: Record<string, unknown>
): Promise<string> {
  const pluginPath = path.join(pluginsDir, pluginName);
  await fs.ensureDir(pluginPath);

  // 写入 YAML 配置（简单格式）
  const yamlContent = Object.entries(config)
    .map(([key, value]) => {
      if (typeof value === 'string') return `${key}: ${value}`;
      if (typeof value === 'number') return `${key}: ${value}`;
      return `${key}: ${JSON.stringify(value)}`;
    })
    .join('\n');

  await fs.writeFile(path.join(pluginPath, 'config.yaml'), yamlContent);

  return pluginPath;
}

/**
 * 清理测试目录
 */
export async function cleanup(dirPath: string): Promise<void> {
  try {
    await fs.remove(dirPath);
  } catch {
    // 忽略清理错误
  }
}
