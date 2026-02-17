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

/**
 * 获取当前模块所在目录
 * CJS: 使用 __dirname（Jest 环境）
 * ESM: 使用 process.argv[1]（入口脚本路径，如 dist/cli.js）
 * 最终回退: process.cwd()
 */
function getCurrentDir(): string {
  // CJS 环境（Jest）
  if (typeof __dirname !== 'undefined') {
    return __dirname;
  }
  // ESM 环境：从入口脚本路径推断
  if (process.argv[1]) {
    return path.dirname(path.resolve(process.argv[1]));
  }
  return process.cwd();
}

// 从当前模块位置向上查找包根目录
const _packageRoot = findPackageRoot(getCurrentDir());

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
  SCRIPTS: 'scripts',
  SUMMARY: 'summary',
  VOLUMES: 'volumes',
  RESOURCES: 'resources',
  CACHE: '.cache',
} as const;

/** 文件名常量 */
export const FILES = {
  CONFIG: 'config.json',
  PLUGIN_REGISTRY: 'plugins.json',
  PLUGIN_CONFIG: 'config.yaml',
  GITIGNORE: '.gitignore',
  MCP_SERVERS: 'mcp-servers.json',
  RESOURCE_DIGEST: 'resource-digest.json',
  WRITE_CONTEXT: 'write-context.json',
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
    // .claude/ 区域
    claude: path.join(projectRoot, DIRS.CLAUDE),
    claudeMd: path.join(projectRoot, DIRS.CLAUDE, 'CLAUDE.md'),
    commands: path.join(projectRoot, DIRS.CLAUDE, DIRS.COMMANDS),
    skills: path.join(projectRoot, DIRS.CLAUDE, DIRS.SKILLS),
    mcpServers: path.join(projectRoot, DIRS.CLAUDE, FILES.MCP_SERVERS),
    cache: path.join(projectRoot, DIRS.CLAUDE, DIRS.CACHE),
    resourceDigest: path.join(projectRoot, DIRS.CLAUDE, DIRS.CACHE, FILES.RESOURCE_DIGEST),
    writeContext: path.join(projectRoot, DIRS.CLAUDE, DIRS.CACHE, FILES.WRITE_CONTEXT),

    // resources/ 区域
    resources: path.join(projectRoot, DIRS.RESOURCES),
    resourcesConfig: path.join(projectRoot, DIRS.RESOURCES, 'config', FILES.CONFIG),
    resourcesMemory: path.join(projectRoot, DIRS.RESOURCES, DIRS.MEMORY),
    resourcesScripts: path.join(projectRoot, DIRS.RESOURCES, DIRS.SCRIPTS),
    resourcesKnowledge: path.join(projectRoot, DIRS.RESOURCES, DIRS.KNOWLEDGE),
    pluginRegistry: path.join(projectRoot, DIRS.RESOURCES, 'config', FILES.PLUGIN_REGISTRY),

    // tracking/ 区域（顶层）
    tracking: path.join(projectRoot, DIRS.TRACKING),
    trackingSummary: path.join(projectRoot, DIRS.TRACKING, DIRS.SUMMARY),
    trackingVolumes: path.join(projectRoot, DIRS.TRACKING, DIRS.VOLUMES),
    trackingDb: path.join(projectRoot, DIRS.TRACKING, 'novel-tracking.db'),

    // 不变
    stories: path.join(projectRoot, DIRS.STORIES),
    plugins: path.join(projectRoot, DIRS.PLUGINS),

    // 旧路径（保留用于 upgrade 迁移检测）
    _legacy_specify: path.join(projectRoot, '.specify'),
    _legacy_spec: path.join(projectRoot, 'spec'),
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
    dotClaude: path.join(templatesDir, 'dot-claude'),
    resources: path.join(templatesDir, DIRS.RESOURCES),
    tracking: path.join(templatesDir, DIRS.TRACKING),
    knowledge: path.join(templatesDir, DIRS.KNOWLEDGE),
    trackingSummary: path.join(templatesDir, DIRS.TRACKING, DIRS.SUMMARY),
    all: templatesDir,
  };
}
