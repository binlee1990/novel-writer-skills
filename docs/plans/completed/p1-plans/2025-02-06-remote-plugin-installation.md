# 插件远程安装实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标：** 实现插件管理器的远程安装功能，支持从 npm registry 和 GitHub 安装插件

**架构：** 扩展现有 PluginManager，添加远程下载、解压、验证、安装流程

**技术栈：** Node.js fetch API, tar 解压, npm registry API, GitHub API

---

## 背景与动机

### 当前状态

**src/plugins/manager.ts:222** 明确注释：
```typescript
// TODO: 远程安装功能尚未实现
// 当前仅支持本地插件复制
```

**现有功能：**
- ✅ 本地插件扫描和加载
- ✅ 插件配置解析（config.yaml）
- ✅ 命令和 Skills 注入
- ❌ 远程插件安装
- ❌ 插件版本管理
- ❌ 插件依赖解析

### 问题

1. **生态发展受限**
   - 用户只能使用项目内置插件
   - 第三方插件无法方便分发
   - 无法形成插件市场

2. **安装体验差**
   - 需要手动下载插件
   - 需要手动复制到 plugins/ 目录
   - 版本更新困难

3. **无法利用 npm 生态**
   - npm 有成熟的包管理机制
   - npm 有版本控制
   - npm 有依赖解析

### 价值主张

1. **一键安装** - `novelwrite plugin:add @novelwrite/translate` 即可
2. **版本管理** - 支持安装特定版本 `@novelwrite/translate@1.2.0`
3. **自动更新** - `plugin:update` 更新所有插件
4. **依赖解析** - 自动安装插件依赖的其他插件
5. **生态化** - 为插件市场打基础

---

## Task 1: 研究现有插件系统和远程安装方案

**Files:**
- Read: `src/plugins/manager.ts` (全文)
- Read: `plugins/authentic-voice/config.yaml`
- Search: npm/GitHub 插件安装最佳实践

**Step 1: 分析现有插件结构**

```bash
# 查看现有插件结构
tree plugins/authentic-voice/
```

**理解：**
- config.yaml 必须字段
- commands/ 和 skills/ 目录结构
- README.md 等文档

**Step 2: 设计远程插件来源**

| 来源 | 格式 | 示例 | 优先级 |
|------|------|------|--------|
| npm registry | `@scope/name` | `@novelwrite/translate` | P0 |
| npm registry | `name` | `novelwrite-plugin-export` | P0 |
| GitHub | `user/repo` | `username/my-plugin` | P1 |
| GitHub | `url` | `https://github.com/user/repo` | P1 |
| Local tarball | `path.tgz` | `./my-plugin.tgz` | P2 |

**Step 3: 研究 npm CLI 的安装机制**

参考 npm/yarn 的实现：
1. 解析包名和版本
2. 查询 registry 获取 tarball URL
3. 下载 tarball
4. 解压到 node_modules
5. 运行 postinstall 脚本

**Step 4: 设计插件安装流程**

```
用户执行：novelwrite plugin:add @novelwrite/translate

1. 解析插件标识符
   - 确定来源类型（npm/GitHub/local）
   - 提取包名、版本、scope

2. 下载插件
   - npm: 查询 registry → 下载 tarball
   - GitHub: 使用 API 或 git clone

3. 验证插件
   - 检查 config.yaml 存在
   - 验证必需字段
   - 检查与已安装插件的冲突

4. 解压/安装
   - 解压到临时目录
   - 验证完整性
   - 移动到 plugins/ 目录

5. 注入
   - 复制 commands 到 .claude/commands
   - 复制 skills 到 .claude/skills
   - 更新插件注册表

6. 记录
   - 写入 .specify/plugins.json（新增文件）
   - 记录插件来源、版本、安装时间
```

---

## Task 2: 设计插件注册表和元数据

**Files:**
- Create: `.specify/plugins.json` (格式设计)
- Modify: `src/plugins/manager.ts` (添加类型定义)

**Step 1: 设计 plugins.json 格式**

```json
{
  "version": "1.0.0",
  "plugins": [
    {
      "name": "authentic-voice",
      "version": "1.0.0",
      "source": "builtin",
      "installedAt": "2025-01-15T10:00:00Z",
      "path": "plugins/authentic-voice"
    },
    {
      "name": "@novelwrite/translate",
      "version": "1.2.0",
      "source": "npm",
      "registry": "https://registry.npmjs.org",
      "installedAt": "2025-02-06T15:30:00Z",
      "path": "plugins/@novelwrite/translate",
      "commands": [
        "translate",
        "translate-batch"
      ],
      "skills": [
        "translation-quality"
      ]
    },
    {
      "name": "custom-plugin",
      "version": "0.1.0",
      "source": "github",
      "repository": "username/custom-plugin",
      "installedAt": "2025-02-06T16:00:00Z",
      "path": "plugins/custom-plugin"
    }
  ]
}
```

**Step 2: 定义 TypeScript 类型**

```typescript
// src/plugins/types.ts (新建)

export type PluginSource = 'builtin' | 'npm' | 'github' | 'local';

export interface PluginMetadata {
  name: string;
  version: string;
  source: PluginSource;
  installedAt: string;
  path: string;

  // npm specific
  registry?: string;

  // GitHub specific
  repository?: string;
  commit?: string;

  // Commands and skills injected
  commands?: string[];
  skills?: string[];

  // Dependencies
  dependencies?: string[];
}

export interface PluginRegistry {
  version: string;
  plugins: PluginMetadata[];
}

export interface PluginIdentifier {
  type: PluginSource;
  name: string;
  version?: string;
  scope?: string;
  repository?: string;
}
```

---

## Task 3: 实现插件标识符解析

**Files:**
- Create: `src/plugins/identifier.ts`

**Step 1: 编写解析器**

```typescript
// src/plugins/identifier.ts

export function parsePluginIdentifier(input: string): PluginIdentifier {
  // npm scoped package: @scope/name@version
  const scopedNpmMatch = input.match(/^(@[\w-]+\/[\w-]+)(?:@([\w.-]+))?$/);
  if (scopedNpmMatch) {
    return {
      type: 'npm',
      name: scopedNpmMatch[1],
      version: scopedNpmMatch[2],
      scope: scopedNpmMatch[1].split('/')[0],
    };
  }

  // npm package: name@version
  const npmMatch = input.match(/^([\w-]+)(?:@([\w.-]+))?$/);
  if (npmMatch && !input.includes('/')) {
    return {
      type: 'npm',
      name: npmMatch[1],
      version: npmMatch[2],
    };
  }

  // GitHub: user/repo or user/repo@branch/tag
  const githubMatch = input.match(/^([\w-]+)\/([\w-]+)(?:@([\w.-]+))?$/);
  if (githubMatch) {
    return {
      type: 'github',
      repository: `${githubMatch[1]}/${githubMatch[2]}`,
      name: githubMatch[2],
      version: githubMatch[3] || 'main',
    };
  }

  // GitHub URL
  const githubUrlMatch = input.match(/github\.com\/([\w-]+)\/([\w-]+)/);
  if (githubUrlMatch) {
    return {
      type: 'github',
      repository: `${githubUrlMatch[1]}/${githubUrlMatch[2]}`,
      name: githubUrlMatch[2],
    };
  }

  // Local file
  if (input.endsWith('.tgz') || input.endsWith('.tar.gz')) {
    return {
      type: 'local',
      name: path.basename(input, path.extname(input)),
    };
  }

  throw new Error(`Invalid plugin identifier: ${input}`);
}
```

**Step 2: 编写测试**

```typescript
// tests/unit/plugins/identifier.test.ts

describe('parsePluginIdentifier', () => {
  it('should parse scoped npm package', () => {
    const result = parsePluginIdentifier('@novelwrite/translate@1.2.0');
    expect(result.type).toBe('npm');
    expect(result.name).toBe('@novelwrite/translate');
    expect(result.version).toBe('1.2.0');
  });

  it('should parse GitHub repository', () => {
    const result = parsePluginIdentifier('user/repo@v1.0');
    expect(result.type).toBe('github');
    expect(result.repository).toBe('user/repo');
    expect(result.version).toBe('v1.0');
  });

  // 更多测试...
});
```

---

## Task 4: 实现 npm registry 安装器

**Files:**
- Create: `src/plugins/installers/npm.ts`

**Step 1: 实现 npm registry 查询**

```typescript
// src/plugins/installers/npm.ts

import fetch from 'node-fetch';
import fs from 'fs-extra';
import tar from 'tar';
import path from 'path';

export class NpmInstaller {
  private registry: string;

  constructor(registry = 'https://registry.npmjs.org') {
    this.registry = registry;
  }

  async getPackageInfo(name: string): Promise<any> {
    const url = `${this.registry}/${name}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Package ${name} not found in registry`);
    }

    return await response.json();
  }

  async getTarballUrl(name: string, version?: string): Promise<string> {
    const info = await this.getPackageInfo(name);

    const targetVersion = version || info['dist-tags'].latest;
    const versionInfo = info.versions[targetVersion];

    if (!versionInfo) {
      throw new Error(`Version ${targetVersion} not found for ${name}`);
    }

    return versionInfo.dist.tarball;
  }

  async downloadTarball(url: string, destPath: string): Promise<void> {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to download: ${url}`);
    }

    const buffer = await response.buffer();
    await fs.writeFile(destPath, buffer);
  }

  async extractTarball(tarballPath: string, extractPath: string): Promise<void> {
    await fs.ensureDir(extractPath);

    await tar.extract({
      file: tarballPath,
      cwd: extractPath,
      strip: 1, // 去掉顶层 package/ 目录
    });
  }

  async install(
    identifier: PluginIdentifier,
    destDir: string
  ): Promise<void> {
    const { name, version } = identifier;

    // 1. 获取 tarball URL
    const tarballUrl = await this.getTarballUrl(name, version);

    // 2. 下载到临时目录
    const tmpDir = path.join(os.tmpdir(), `plugin-${Date.now()}`);
    const tarballPath = path.join(tmpDir, 'package.tgz');

    await fs.ensureDir(tmpDir);
    await this.downloadTarball(tarballUrl, tarballPath);

    // 3. 解压
    const extractPath = path.join(tmpDir, 'extracted');
    await this.extractTarball(tarballPath, extractPath);

    // 4. 验证插件结构
    const configPath = path.join(extractPath, 'config.yaml');
    if (!await fs.pathExists(configPath)) {
      throw new Error('Invalid plugin: config.yaml not found');
    }

    // 5. 移动到目标目录
    const pluginDir = path.join(destDir, name);
    await fs.ensureDir(path.dirname(pluginDir));
    await fs.move(extractPath, pluginDir, { overwrite: true });

    // 6. 清理
    await fs.remove(tmpDir);
  }
}
```

---

## Task 5: 实现 GitHub 安装器

**Files:**
- Create: `src/plugins/installers/github.ts`

**Step 1: 实现 GitHub 安装**

```typescript
// src/plugins/installers/github.ts

export class GitHubInstaller {
  async getRepoInfo(repository: string): Promise<any> {
    const url = `https://api.github.com/repos/${repository}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'novel-writer-skills',
      },
    });

    if (!response.ok) {
      throw new Error(`Repository ${repository} not found`);
    }

    return await response.json();
  }

  async downloadZipball(
    repository: string,
    ref: string,
    destPath: string
  ): Promise<void> {
    const url = `https://github.com/${repository}/archive/${ref}.zip`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to download from ${url}`);
    }

    const buffer = await response.buffer();
    await fs.writeFile(destPath, buffer);
  }

  async extractZip(zipPath: string, extractPath: string): Promise<void> {
    // 使用 unzipper 或 adm-zip
    const AdmZip = require('adm-zip');
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(extractPath, true);
  }

  async install(
    identifier: PluginIdentifier,
    destDir: string
  ): Promise<void> {
    const { repository, version } = identifier;

    // 1. 下载 zipball
    const tmpDir = path.join(os.tmpdir(), `plugin-${Date.now()}`);
    const zipPath = path.join(tmpDir, 'repo.zip');

    await fs.ensureDir(tmpDir);
    await this.downloadZipball(repository, version || 'main', zipPath);

    // 2. 解压
    const extractPath = path.join(tmpDir, 'extracted');
    await this.extractZip(zipPath, extractPath);

    // 3. 查找 config.yaml（可能在子目录）
    const configPath = await this.findConfigYaml(extractPath);
    if (!configPath) {
      throw new Error('Invalid plugin: config.yaml not found');
    }

    const pluginRoot = path.dirname(configPath);

    // 4. 移动到目标目录
    const pluginDir = path.join(destDir, identifier.name);
    await fs.move(pluginRoot, pluginDir, { overwrite: true });

    // 5. 清理
    await fs.remove(tmpDir);
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
}
```

---

## Task 6: 扩展 PluginManager

**Files:**
- Modify: `src/plugins/manager.ts`

**Step 1: 添加远程安装方法**

```typescript
// src/plugins/manager.ts

import { NpmInstaller } from './installers/npm';
import { GitHubInstaller } from './installers/github';
import { parsePluginIdentifier } from './identifier';

export class PluginManager {
  private npmInstaller: NpmInstaller;
  private githubInstaller: GitHubInstaller;
  private pluginRegistry: PluginRegistry;

  constructor(projectPath: string) {
    // 现有代码...
    this.npmInstaller = new NpmInstaller();
    this.githubInstaller = new GitHubInstaller();
    this.pluginRegistry = this.loadPluginRegistry();
  }

  private loadPluginRegistry(): PluginRegistry {
    const registryPath = path.join(
      this.projectPath,
      '.specify/plugins.json'
    );

    if (fs.existsSync(registryPath)) {
      return fs.readJsonSync(registryPath);
    }

    return { version: '1.0.0', plugins: [] };
  }

  private savePluginRegistry(): void {
    const registryPath = path.join(
      this.projectPath,
      '.specify/plugins.json'
    );

    fs.writeJsonSync(registryPath, this.pluginRegistry, { spaces: 2 });
  }

  async installRemotePlugin(input: string): Promise<void> {
    // 1. 解析标识符
    const identifier = parsePluginIdentifier(input);

    // 2. 检查是否已安装
    if (this.isPluginInstalled(identifier.name)) {
      throw new Error(`Plugin ${identifier.name} is already installed`);
    }

    // 3. 根据类型选择安装器
    const pluginsDir = path.join(this.projectPath, 'plugins');

    switch (identifier.type) {
      case 'npm':
        await this.npmInstaller.install(identifier, pluginsDir);
        break;
      case 'github':
        await this.githubInstaller.install(identifier, pluginsDir);
        break;
      case 'local':
        // 本地安装逻辑
        break;
      default:
        throw new Error(`Unsupported plugin source: ${identifier.type}`);
    }

    // 4. 加载插件配置
    const pluginPath = path.join(pluginsDir, identifier.name);
    const config = await this.loadPluginConfig(pluginPath);

    // 5. 注入命令和 Skills
    await this.injectCommands(pluginPath);
    await this.injectSkills(pluginPath);

    // 6. 更新注册表
    this.pluginRegistry.plugins.push({
      name: identifier.name,
      version: identifier.version || 'latest',
      source: identifier.type,
      installedAt: new Date().toISOString(),
      path: `plugins/${identifier.name}`,
      registry: identifier.type === 'npm' ? 'https://registry.npmjs.org' : undefined,
      repository: identifier.repository,
      commands: config.commands || [],
      skills: config.skills || [],
    });

    this.savePluginRegistry();

    console.log(`✓ Plugin ${identifier.name} installed successfully`);
  }

  private isPluginInstalled(name: string): boolean {
    return this.pluginRegistry.plugins.some(p => p.name === name);
  }

  async updatePlugin(name: string): Promise<void> {
    const plugin = this.pluginRegistry.plugins.find(p => p.name === name);

    if (!plugin) {
      throw new Error(`Plugin ${name} is not installed`);
    }

    // 1. 移除旧版本
    await this.removePlugin(name);

    // 2. 重新安装最新版本
    const identifier = plugin.source === 'npm'
      ? plugin.name
      : plugin.repository;

    await this.installRemotePlugin(identifier);
  }

  async listRemotePlugins(): Promise<void> {
    // 查询 npm registry 中所有 @novelwrite/ scope 的包
    // 或读取一个中心化的插件列表

    console.log('Available plugins:');
    console.log('- @novelwrite/translate');
    console.log('- @novelwrite/export');
    // ...
  }
}
```

**Step 2: 更新 CLI 命令**

在 `src/cli.ts` 中修改 `plugin:add` 命令：

```typescript
// src/cli.ts

program
  .command('plugin:add <plugin>')
  .description('Install a plugin from npm or GitHub')
  .action(async (plugin: string) => {
    try {
      ensureProjectRoot();
      const projectInfo = getProjectInfo(process.cwd());

      const manager = new PluginManager(projectInfo.path);
      await manager.installRemotePlugin(plugin);

      success(`Plugin ${plugin} installed successfully!`);
    } catch (error) {
      error('Failed to install plugin:', error.message);
      process.exit(1);
    }
  });

program
  .command('plugin:update [name]')
  .description('Update plugin(s) to latest version')
  .action(async (name?: string) => {
    // 实现更新逻辑
  });

program
  .command('plugin:search [query]')
  .description('Search for available plugins')
  .action(async (query?: string) => {
    // 实现搜索逻辑
  });
```

---

## Task 7: 添加插件验证

**Files:**
- Create: `src/plugins/validator.ts`

**内容：**

```typescript
// src/plugins/validator.ts

export class PluginValidator {
  static async validate(pluginPath: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
    };

    // 1. 检查 config.yaml 存在
    const configPath = path.join(pluginPath, 'config.yaml');
    if (!await fs.pathExists(configPath)) {
      result.valid = false;
      result.errors.push('config.yaml not found');
      return result;
    }

    // 2. 解析并验证 config.yaml
    const config = yaml.load(await fs.readFile(configPath, 'utf-8'));

    if (!config.name) {
      result.errors.push('config.yaml missing required field: name');
      result.valid = false;
    }

    if (!config.version) {
      result.warnings.push('config.yaml missing version field');
    }

    // 3. 检查声明的文件是否存在
    if (config.commands) {
      for (const cmd of config.commands) {
        const cmdPath = path.join(pluginPath, 'commands', `${cmd}.md`);
        if (!await fs.pathExists(cmdPath)) {
          result.warnings.push(`Declared command ${cmd}.md not found`);
        }
      }
    }

    if (config.skills) {
      for (const skill of config.skills) {
        const skillPath = path.join(pluginPath, 'skills', skill, 'SKILL.md');
        if (!await fs.pathExists(skillPath)) {
          result.warnings.push(`Declared skill ${skill}/SKILL.md not found`);
        }
      }
    }

    // 4. 检查恶意内容（基础检查）
    // - 检查是否包含可疑脚本
    // - 检查文件大小是否异常

    return result;
  }
}
```

---

## Task 8: 添加依赖管理

**Files:**
- Modify: `src/plugins/manager.ts`

**内容：**

```typescript
async installWithDependencies(input: string): Promise<void> {
  const identifier = parsePluginIdentifier(input);

  // 安装主插件
  await this.installRemotePlugin(input);

  // 读取配置
  const pluginPath = path.join(this.projectPath, 'plugins', identifier.name);
  const config = await this.loadPluginConfig(pluginPath);

  // 安装依赖插件
  if (config.dependencies) {
    for (const dep of config.dependencies) {
      if (!this.isPluginInstalled(dep)) {
        console.log(`Installing dependency: ${dep}`);
        await this.installWithDependencies(dep);
      }
    }
  }
}
```

---

## Task 9: 测试

**Files:**
- Create: `tests/integration/remote-plugin-install.test.ts`

**测试用例：**

```typescript
describe('Remote Plugin Installation', () => {
  it('should install npm plugin', async () => {
    // Mock npm registry response
    // 执行安装
    // 验证文件结构
    // 验证 plugins.json
  });

  it('should install GitHub plugin', async () => {
    // 类似测试
  });

  it('should handle version specification', async () => {
    // 测试版本安装
  });

  it('should detect and prevent duplicate installation', async () => {
    // 测试重复安装检测
  });

  it('should install dependencies', async () => {
    // 测试依赖安装
  });
});
```

---

## Task 10: 文档和验证

**Files:**
- Modify: `docs/plugin-development.md`
- Create: `docs/plugin-publishing.md`
- Modify: `README.md`

**Step 1: 更新插件开发文档**

添加"发布插件"章节：
- 如何发布到 npm
- 如何设置 GitHub releases
- 版本管理最佳实践

**Step 2: 创建发布指南**

```markdown
# 插件发布指南

## 发布到 npm

1. 准备 package.json
2. npm publish
3. 测试安装

## 发布到 GitHub

1. 创建 release
2. 打 tag
3. 测试安装
```

**Step 3: 更新 README**

```markdown
## 安装插件

### 从 npm 安装
```bash
novelwrite plugin:add @novelwrite/translate
```

### 从 GitHub 安装
```bash
novelwrite plugin:add username/plugin-repo
```

### 指定版本
```bash
novelwrite plugin:add @novelwrite/translate@1.2.0
```
```

**验证标准：**

- [ ] 支持 npm 安装
- [ ] 支持 GitHub 安装
- [ ] 版本管理功能
- [ ] 依赖解析功能
- [ ] 插件验证功能
- [ ] plugins.json 正确维护
- [ ] 测试覆盖 ≥ 80%
- [ ] 文档完善

**提交：**

```bash
git add src/plugins/
git add docs/
git commit -m "feat(plugins): 实现插件远程安装功能

- 支持从 npm registry 安装插件
- 支持从 GitHub 安装插件
- 插件标识符解析（@scope/name, user/repo）
- 版本管理和依赖解析
- 插件验证和安全检查
- plugins.json 注册表维护

新增命令：
- plugin:add <plugin> - 安装插件
- plugin:update [name] - 更新插件
- plugin:search [query] - 搜索插件

Closes: P1 优先级任务 #3"
```

---

## 预估工作量

| Task | 内容 | 预估时间 |
|------|------|---------|
| 1 | 研究和设计 | 2h |
| 2 | 元数据设计 | 1h |
| 3 | 标识符解析 | 1-2h |
| 4 | npm 安装器 | 3-4h |
| 5 | GitHub 安装器 | 2-3h |
| 6 | PluginManager 扩展 | 2-3h |
| 7 | 插件验证 | 1-2h |
| 8 | 依赖管理 | 1-2h |
| 9 | 测试 | 3-4h |
| 10 | 文档 | 1-2h |

**总计：** 17-25 小时

---

## 成功标准

**功能指标：**
- 一键安装 npm 插件
- 一键安装 GitHub 插件
- 自动依赖解析
- 版本管理

**质量指标：**
- 测试覆盖率 ≥ 80%
- 安装成功率 ≥ 95%
- 错误提示清晰

**生态指标：**
- 为插件市场打下基础
- 第三方可轻松发布插件
