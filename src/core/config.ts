/**
 * 统一配置管理
 *
 * 集中管理所有路径常量、目录名、默认值，
 * 消除散落在各处的硬编码字符串。
 */

import path from 'path';
import fs from 'fs';

/**
 * 查找包根目录（包含 package.json 的最近祖先目录）
 * 兼容 ESM 和 CJS，不依赖 import.meta.url 或 __dirname
 */
function findPackageRoot(startDir: string): string {
  let dir = startDir;
  while (true) {
    if (fs.existsSync(path.join(dir, 'package.json'))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      // 到达文件系统根目录仍未找到，回退
      return startDir;
    }
    dir = parent;
  }
}

// 使用当前工作目录或 __dirname（CJS 环境）作为起点
const _packageRoot = findPackageRoot(
  typeof __dirname !== 'undefined' ? __dirname : process.cwd()
);

/** 目录名常量 */
export const DIRS = {
  CLAUDE: '.claude',
  SPECIFY: '.specify',
  STORIES: 'stories',
  SPEC: 'spec',
  COMMANDS: 'commands',
  SKILLS: 'skills',
  KNOWLEDGE_BASE: 'knowledge-base',
  PLUGINS: 'plugins',
  MEMORY: 'memory',
  TEMPLATES: 'templates',
  TRACKING: 'tracking',
  KNOWLEDGE: 'knowledge',
} as const;

/** 文件名常量 */
export const FILES = {
  CONFIG: 'config.json',
  PLUGIN_REGISTRY: 'plugins.json',
  PLUGIN_CONFIG: 'config.yaml',
  GITIGNORE: '.gitignore',
} as const;

/** 默认 .gitignore 内容 */
export const DEFAULT_GITIGNORE = `# 临时文件
*.tmp
*.swp
.DS_Store

# 编辑器配置
.vscode/
.idea/

# AI 缓存
.ai-cache/

# 节点模块
node_modules/
`;

/**
 * 获取 novel-writer-skills 包的根目录
 * 从 dist/core/config.js 或 src/core/config.ts 向上解析
 */
export function getPackageRoot(): string {
  return _packageRoot;
}

/** 获取模板目录路径 */
export function getTemplatesDir(): string {
  return path.join(getPackageRoot(), DIRS.TEMPLATES);
}

/** 获取内置插件目录路径 */
export function getBuiltinPluginsDir(): string {
  return path.join(getPackageRoot(), DIRS.PLUGINS);
}

/**
 * 获取项目内各目录的路径
 */
export function getProjectPaths(projectRoot: string) {
  return {
    root: projectRoot,
    specify: path.join(projectRoot, DIRS.SPECIFY),
    specifyConfig: path.join(projectRoot, DIRS.SPECIFY, FILES.CONFIG),
    specifyMemory: path.join(projectRoot, DIRS.SPECIFY, DIRS.MEMORY),
    specifyTemplates: path.join(projectRoot, DIRS.SPECIFY, DIRS.TEMPLATES),
    pluginRegistry: path.join(projectRoot, DIRS.SPECIFY, FILES.PLUGIN_REGISTRY),
    claude: path.join(projectRoot, DIRS.CLAUDE),
    commands: path.join(projectRoot, DIRS.CLAUDE, DIRS.COMMANDS),
    skills: path.join(projectRoot, DIRS.CLAUDE, DIRS.SKILLS),
    knowledgeBase: path.join(projectRoot, DIRS.CLAUDE, DIRS.KNOWLEDGE_BASE),
    stories: path.join(projectRoot, DIRS.STORIES),
    spec: path.join(projectRoot, DIRS.SPEC),
    tracking: path.join(projectRoot, DIRS.SPEC, DIRS.TRACKING),
    knowledge: path.join(projectRoot, DIRS.SPEC, DIRS.KNOWLEDGE),
    plugins: path.join(projectRoot, DIRS.PLUGINS),
  };
}

/**
 * 获取模板源路径映射（用于 init 和 upgrade）
 */
export function getTemplateSourcePaths() {
  const templatesDir = getTemplatesDir();
  return {
    commands: path.join(templatesDir, DIRS.COMMANDS),
    skills: path.join(templatesDir, DIRS.SKILLS),
    knowledgeBase: path.join(templatesDir, DIRS.KNOWLEDGE_BASE),
    memory: path.join(templatesDir, DIRS.MEMORY),
    tracking: path.join(templatesDir, DIRS.TRACKING),
    knowledge: path.join(templatesDir, DIRS.KNOWLEDGE),
    all: templatesDir,
  };
}
