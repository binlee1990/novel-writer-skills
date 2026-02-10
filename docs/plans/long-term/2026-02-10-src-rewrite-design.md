# src/ 大幅重写设计方案

## Context

当前 `src/` 共 10 个文件约 1500 行代码，存在以下问题：

- **已知 Bug**：`removePlugin()` 不清理命令文件、`installPlugin()` 不更新注册表、tar 解压跨平台不兼容
- **代码质量**：cli.ts 523 行混合命令注册与业务逻辑、npm/github 安装器重复 tar 逻辑、`yaml.load() as X` 不安全类型转换、散落的硬编码路径
- **功能缺失**：无私有 registry 支持、无 GitHub token 支持、无版本范围解析、无依赖解析、无本地安装器
- **发布阻塞**：package.json 中 repository URL 错误、files 数组含不存在文件、postbuild 不跨平台

本次重写目标：修复所有已知问题，重构为分层架构，增强功能，准备 npm 发布。

---

## Task 1：核心层（core/）

**新增 4 个文件，建立基础设施层。**

### 1.1 core/errors.ts

自定义错误类型层级：

```typescript
class NovelWriterError extends Error {
  code: string;       // 如 'PROJECT_NOT_FOUND'
  exitCode: number;   // 进程退出码
}

class ProjectNotFoundError extends NovelWriterError    // 不在项目目录中
class ProjectExistsError extends NovelWriterError      // 项目已存在
class PluginNotFoundError extends NovelWriterError     // 插件不存在
class PluginValidationError extends NovelWriterError   // 校验失败，含 errors/warnings 数组
class PluginInstallError extends NovelWriterError      // 安装失败，含 source 信息
class NetworkError extends NovelWriterError            // 网络失败，含 url、statusCode
class PlatformError extends NovelWriterError           // 平台不兼容
class ConfigError extends NovelWriterError             // 配置文件损坏或缺失
```

### 1.2 core/config.ts

统一配置管理，消除硬编码：

```typescript
// 目录名常量
const DIRS = {
  CLAUDE: '.claude',
  SPECIFY: '.specify',
  STORIES: 'stories',
  SPEC: 'spec',
  // ...
}

// 文件名常量
const FILES = {
  CONFIG: 'config.json',
  PLUGIN_REGISTRY: 'plugins.json',
  PLUGIN_CONFIG: 'config.yaml',
  // ...
}

// 模板路径解析
function getPackageRoot(): string     // 安全解析包安装路径
function getTemplatesDir(): string    // 模板目录
function getPluginsDir(): string      // 内置插件目录
```

### 1.3 core/platform.ts

跨平台工具：

```typescript
// tar 解压（统一 Windows PowerShell / Unix tar）
async function extractTarball(
  tarballPath: string,
  extractPath: string,
  options?: { stripComponents?: number }
): Promise<void>

// 设置可执行权限（Unix 有效，Windows 跳过）
function setExecutable(filePath: string): void

// 安全路径处理（空格转义等）
function safePath(p: string): string

// 创建临时目录
function createTempDir(prefix?: string): Promise<string>

// 清理临时目录
function cleanupTempDir(dir: string): Promise<void>
```

### 1.4 core/template.ts

模板引擎，封装当前 cli.ts init 中 200+ 行的复制逻辑：

```typescript
interface CopyOptions {
  overwrite?: boolean;
  filter?: (src: string) => boolean;
}

// 复制模板目录
async function copyTemplates(
  source: string,
  dest: string,
  options?: CopyOptions
): Promise<{ copied: number; skipped: number }>

// 复制单个模板文件
async function copyTemplateFile(
  source: string,
  dest: string,
  options?: CopyOptions
): Promise<boolean>

// 获取模板清单（用于 upgrade 比较）
async function getTemplateManifest(dir: string): Promise<Map<string, string>>
```

**涉及文件**：
- 新建 `src/core/errors.ts`
- 新建 `src/core/config.ts`
- 新建 `src/core/platform.ts`
- 新建 `src/core/template.ts`

---

## Task 2：插件系统重构

**重构 6 个文件，新增 2 个文件。**

### 2.1 installers/base.ts（新增）

提取公共安装逻辑为抽象基类：

```typescript
abstract class BaseInstaller {
  protected async extractTarball(tarballPath, extractPath, stripComponents?)
    // 调用 core/platform.ts
  protected async createTempDir()
  protected async cleanup(tempDir)
  abstract install(identifier: PluginIdentifier, destDir: string): Promise<string>
}
```

### 2.2 installers/npm.ts（重构）

继承 BaseInstaller，只保留 npm 特有逻辑：
- `getPackageInfo()` — 支持自定义 registry URL
- `getTarballUrl()` — 支持版本范围解析
- `downloadTarball()` — 增加错误处理
- `install()` — 调用基类的 extractTarball

### 2.3 installers/github.ts（重构）

继承 BaseInstaller，增强：
- 支持 `GITHUB_TOKEN` 环境变量（私有仓库 + 提高 API 限额）
- 改进 ref 默认值检测（main vs master）
- 改进 config.yaml 搜索逻辑（限制搜索深度）

### 2.4 installers/local.ts（新增）

从 manager.ts 中提取本地安装逻辑：

```typescript
class LocalInstaller extends BaseInstaller {
  async install(identifier, destDir): Promise<string>
    // 从本地路径复制插件
}
```

### 2.5 registry.ts（新增，从 manager.ts 拆出）

独立的注册表管理：

```typescript
class PluginRegistry {
  constructor(registryPath: string)
  async load(): Promise<void>
  async save(): Promise<void>
  add(metadata: PluginMetadata): void
  remove(name: string): boolean
  find(name: string): PluginMetadata | undefined
  has(name: string): boolean
  list(): PluginMetadata[]
}
```

### 2.6 manager.ts（精简）

拆出注册表后精简为协调层：
- 安装流程：选择安装器 → 安装 → 验证 → 注册 → 注入
- **修复 Bug**：`removePlugin()` 增加命令文件清理
- **修复 Bug**：`installPlugin()` 统一更新注册表
- 注入逻辑保留但增加错误处理

### 2.7 validator.ts（增强）

- 增加 config.yaml schema 校验（验证 type、commands、skills 结构）
- 对 `yaml.load()` 结果做运行时类型检查
- 验证命令/技能 ID 是否为合法文件名
- 返回更详细的错误信息

### 2.8 identifier.ts（增强）

- 支持版本范围（`^1.0.0`、`~1.2.0`、`>=1.0.0`）
- 改进 GitHub URL 正则，严格匹配 `github.com` 域名
- 更具体的错误信息（"无法识别的插件格式: xxx，支持的格式: npm包名、GitHub仓库、本地路径"）

### 2.9 types.ts（扩展）

- 新增 `InstallerOptions` 接口（registry URL、GitHub token 等）
- 新增 `InstallResult` 接口（安装结果详情）
- 完善 `PluginConfig` 接口（从 manager.ts 内部类型提升为公共类型）

**涉及文件**：
- 新建 `src/plugins/installers/base.ts`
- 新建 `src/plugins/installers/local.ts`
- 新建 `src/plugins/registry.ts`
- 重构 `src/plugins/manager.ts`
- 重构 `src/plugins/installers/npm.ts`
- 重构 `src/plugins/installers/github.ts`
- 增强 `src/plugins/validator.ts`
- 增强 `src/plugins/identifier.ts`
- 扩展 `src/plugins/types.ts`

---

## Task 3：CLI 拆分与命令重构

**拆分 cli.ts 为 5 个文件。**

### 3.1 cli.ts（精简至 ~50 行）

```typescript
#!/usr/bin/env node
import { Command } from '@commander-js/extra-typings';
import { getVersionInfo } from './version.js';
import { registerInitCommand } from './commands/init.js';
import { registerCheckCommand } from './commands/check.js';
import { registerUpgradeCommand } from './commands/upgrade.js';
import { registerPluginCommands } from './commands/plugin.js';
import { handleError } from './core/errors.js';

const program = new Command()
  .name('nws')
  .version(getVersionInfo())
  .description('Claude Code 专用的 AI 小说创作工具');

registerInitCommand(program);
registerCheckCommand(program);
registerUpgradeCommand(program);
registerPluginCommands(program);

program.exitOverride();
try { await program.parseAsync(); }
catch (e) { handleError(e); }
```

### 3.2 commands/init.ts（~150 行）

- 项目初始化流程编排
- 调用 `core/template.ts` 复制模板
- 调用 `core/config.ts` 获取路径
- 使用 `core/errors.ts` 的 `ProjectExistsError`

### 3.3 commands/check.ts（~40 行）

- 环境检查（Node.js 版本、Git 安装）
- 项目状态检查

### 3.4 commands/upgrade.ts（~120 行）

- 选择性更新模板（commands/skills/knowledge-base/all）
- 版本比较，跳过无变化文件
- 更新 config.json 中的版本号

### 3.5 commands/plugin.ts（~80 行）

- `plugin:list` — 列出已安装插件
- `plugin:add` — 安装插件（调用 manager）
- `plugin:remove` — 移除插件（调用 manager）

**涉及文件**：
- 重写 `src/cli.ts`
- 新建 `src/commands/init.ts`
- 新建 `src/commands/check.ts`
- 新建 `src/commands/upgrade.ts`
- 新建 `src/commands/plugin.ts`

---

## Task 4：工具层增强

### 4.1 utils/logger.ts

- 增加日志级别过滤（`LOG_LEVEL` 环境变量）
- 终端不支持 emoji 时降级为文本标记
- 保持 API 兼容

### 4.2 utils/project.ts

- 增加结果缓存（同一进程内不重复扫描）
- `getProjectInfo()` 增加 config.json 结构校验
- 使用 `core/errors.ts` 的 `ProjectNotFoundError`

### 4.3 version.ts

- 增加版本缓存
- 错误时记录日志而非静默

**涉及文件**：
- 重构 `src/utils/logger.ts`
- 重构 `src/utils/project.ts`
- 重构 `src/version.ts`

---

## Task 5：npm 发布准备

### 5.1 package.json 修正

```json
{
  "version": "2.0.0",
  "bin": {
    "nws": "dist/cli.js"
  },
  "repository": {
    "url": "git+https://github.com/binlee1990/novel-writer-skills.git"
  },
  "homepage": "https://github.com/binlee1990/novel-writer-skills#readme",
  "bugs": {
    "url": "https://github.com/binlee1990/novel-writer-skills/issues"
  },
  "files": [
    "dist",
    "templates",
    "plugins",
    "src",
    "README.md",
    "LICENSE",
    "CHANGELOG.md"
  ],
  "scripts": {
    "postbuild": "node -e \"if(process.platform!=='win32'){require('fs').chmodSync('dist/cli.js',0o755)}\""
  }
}
```

**修正项**：
- `bin`: `novelwrite` → `nws`
- `repository/homepage/bugs`: `wordflowlab` → `binlee1990`
- `files`: 移除不存在的 `QUICKSTART.md`、`VERIFICATION_SUMMARY.md`
- `postbuild`: 跨平台 chmod 方案
- `version`: `1.1.1` → `2.0.0`

### 5.2 CHANGELOG.md 更新

新增 `[2.0.0]` 条目：
- **Breaking**: CLI 命令名从 `novelwrite` 改为 `nws`
- **Added**: 核心层（统一配置、错误处理、跨平台、模板引擎）
- **Added**: 插件注册表独立管理、安装器基类、本地安装器
- **Added**: GitHub token 支持、版本范围解析
- **Fixed**: removePlugin 不清理命令文件
- **Fixed**: installPlugin 不更新注册表
- **Fixed**: tar 解压跨平台兼容
- **Refactored**: CLI 命令拆分为独立模块
- **Refactored**: 插件系统分层重构

### 5.3 README.md 更新

- 安装命令保持 `npm install -g novel-writer-skills`
- CLI 命令示例从 `novelwrite` 改为 `nws`

---

## Task 6：测试适配与新增

### 6.1 现有测试适配

- 更新所有 import 路径适配新模块结构
- `novelwrite` 相关断言改为 `nws`
- 确保 86 个现有测试全部通过

### 6.2 新增测试

| 模块 | 测试文件 | 覆盖内容 |
|------|---------|---------|
| core/errors | tests/unit/core/errors.test.ts | 错误类型创建、错误码、exitCode |
| core/platform | tests/unit/core/platform.test.ts | tar 解压、chmod、临时目录 |
| core/template | tests/unit/core/template.test.ts | 模板复制、过滤、清单 |
| core/config | tests/unit/core/config.test.ts | 路径解析、常量正确性 |
| plugins/registry | tests/unit/plugins/registry.test.ts | 增删查改、持久化 |
| installers/base | tests/unit/plugins/installers/base.test.ts | 公共逻辑 |

---

## 最终文件结构

```
src/
├── cli.ts                          # ~50 行，命令注册 + 全局错误处理
├── version.ts                      # ~30 行，版本管理（含缓存）
├── core/
│   ├── errors.ts                   # ~80 行，错误类型层级
│   ├── config.ts                   # ~60 行，统一配置
│   ├── platform.ts                 # ~80 行，跨平台工具
│   └── template.ts                 # ~100 行，模板引擎
├── commands/
│   ├── init.ts                     # ~150 行，项目初始化
│   ├── check.ts                    # ~40 行，环境检查
│   ├── upgrade.ts                  # ~120 行，项目升级
│   └── plugin.ts                   # ~80 行，插件管理命令
├── plugins/
│   ├── types.ts                    # ~60 行，类型定义
│   ├── identifier.ts               # ~90 行，标识符解析
│   ├── validator.ts                # ~100 行，插件校验
│   ├── registry.ts                 # ~80 行，注册表管理
│   ├── manager.ts                  # ~250 行，插件管理协调
│   └── installers/
│       ├── base.ts                 # ~60 行，安装器基类
│       ├── npm.ts                  # ~100 行，NPM 安装器
│       ├── github.ts               # ~120 行，GitHub 安装器
│       └── local.ts                # ~50 行，本地安装器
└── utils/
    ├── logger.ts                   # ~40 行，日志工具
    └── project.ts                  # ~90 行，项目检测
```

**总计**：21 个文件，约 1800 行（从 10 个文件 1500 行 → 21 个文件 1800 行，单文件平均 86 行）

---

## 执行顺序

1. **Task 1**：核心层 → 基础设施先行
2. **Task 2**：插件系统 → 依赖核心层
3. **Task 3**：CLI 拆分 → 依赖命令实现
4. **Task 4**：工具层 → 可与 Task 2/3 并行
5. **Task 5**：npm 发布准备 → 所有代码完成后
6. **Task 6**：测试 → 每个 Task 完成后同步适配

---

## 验证方式

1. `npm run build` — TypeScript 编译无错误
2. `npm test` — 所有测试通过（旧 86 个 + 新增）
3. `npm pack --dry-run` — 检查包内容无多余/缺失文件
4. `npm pack` → `npm install -g ./novel-writer-skills-2.0.0.tgz` → `nws --version` — 本地安装验证
5. `nws init test-project` → 检查项目结构完整性
6. `nws check` → 环境检查正常
7. `nws plugin:list` → 插件列表正常
