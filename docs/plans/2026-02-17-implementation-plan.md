# v4.0.0 实现计划

> 基于已批准的设计文档：`2026-02-17-write-optimization-design.md`
> 分 8 个阶段，每阶段可独立编译测试，每阶段结束提交一次

---

## 阶段 0：templates/ 源目录重组（纯文件移动，零代码改动）

### 目标
将 `templates/` 源目录从旧结构重组为新结构，为后续代码改动做准备。

### 操作

1. 创建 `templates/resources/` 目录
2. 移动文件：
   ```
   templates/memory/          → templates/resources/memory/
   templates/knowledge-base/craft/    → templates/resources/craft/
   templates/knowledge-base/genres/   → templates/resources/genres/
   templates/knowledge-base/styles/   → templates/resources/styles/
   templates/knowledge-base/requirements/ → templates/resources/requirements/
   templates/knowledge-base/emotional-beats/ → templates/resources/emotional-beats/
   templates/knowledge-base/character-archetypes/ → templates/resources/character-archetypes/
   templates/knowledge-base/references/ → templates/resources/references/
   templates/config/          → templates/resources/config/
   templates/scripts/         → templates/resources/scripts/
   ```
3. 保留不动：`templates/commands/`、`templates/skills/`、`templates/dot-claude/`、`templates/tracking/`、`templates/knowledge/`
4. 删除空的旧目录：`templates/memory/`、`templates/knowledge-base/`、`templates/config/`、`templates/scripts/`
5. 移动 `templates/specification-example.md` → `templates/resources/config/specification-example.md`

### 验证
- `ls templates/` 应只剩：commands/ skills/ dot-claude/ resources/ tracking/ knowledge/
- `ls templates/resources/` 应包含：memory/ craft/ genres/ styles/ requirements/ emotional-beats/ character-archetypes/ references/ config/ scripts/

### 提交
```
refactor(templates): reorganize source directory to flat resources/ structure
```

---

## 阶段 1：config.ts 路径常量更新

### 目标
更新 `src/core/config.ts` 中的路径映射，使其反映新目录结构。

### 文件：`src/core/config.ts`

#### 1.1 DIRS 常量新增
```typescript
// 新增
RESOURCES: 'resources',
CACHE: '.cache',
```

#### 1.2 FILES 常量新增
```typescript
// 新增
MCP_SERVERS: 'mcp-servers.json',
RESOURCE_DIGEST: 'resource-digest.json',
WRITE_CONTEXT: 'write-context.json',
```

#### 1.3 getProjectPaths() 重写

移除旧路径，添加新路径：

```typescript
export function getProjectPaths(projectRoot: string) {
  return {
    root: projectRoot,
    // .claude/ 区域（不变）
    claude: path.join(projectRoot, DIRS.CLAUDE),
    claudeMd: path.join(projectRoot, DIRS.CLAUDE, 'CLAUDE.md'),
    commands: path.join(projectRoot, DIRS.CLAUDE, DIRS.COMMANDS),
    skills: path.join(projectRoot, DIRS.CLAUDE, DIRS.SKILLS),
    mcpServers: path.join(projectRoot, DIRS.CLAUDE, FILES.MCP_SERVERS),
    cache: path.join(projectRoot, DIRS.CLAUDE, DIRS.CACHE),
    resourceDigest: path.join(projectRoot, DIRS.CLAUDE, DIRS.CACHE, FILES.RESOURCE_DIGEST),
    writeContext: path.join(projectRoot, DIRS.CLAUDE, DIRS.CACHE, FILES.WRITE_CONTEXT),

    // resources/ 区域（新）
    resources: path.join(projectRoot, DIRS.RESOURCES),
    resourcesConfig: path.join(projectRoot, DIRS.RESOURCES, 'config', FILES.CONFIG),
    resourcesMemory: path.join(projectRoot, DIRS.RESOURCES, DIRS.MEMORY),
    resourcesScripts: path.join(projectRoot, DIRS.RESOURCES, DIRS.SCRIPTS),
    resourcesKnowledge: path.join(projectRoot, DIRS.RESOURCES, DIRS.KNOWLEDGE),
    pluginRegistry: path.join(projectRoot, DIRS.RESOURCES, 'config', FILES.PLUGIN_REGISTRY),

    // tracking/ 区域（新，顶层）
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
```

#### 1.4 getTemplateSourcePaths() 重写

```typescript
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
```

### 文件：`tests/unit/core/config.test.ts`

更新所有断言以匹配新路径：
- `paths.specify` → 删除（改为 `paths.resources`）
- `paths.specifyConfig` → `paths.resourcesConfig`（`resources/config/config.json`）
- `paths.spec` → 删除
- `paths.tracking` → `path.join(projectRoot, 'tracking')`（顶层）
- `paths.knowledge` → `paths.resourcesKnowledge`（`resources/knowledge/`）
- `paths.knowledgeBase` → 删除
- `paths.trackingSummary` → `path.join(projectRoot, 'tracking', 'summary')`
- `paths.trackingVolumes` → `path.join(projectRoot, 'tracking', 'volumes')`
- 新增断言：`paths.mcpServers`、`paths.cache`、`paths.trackingDb`
- `getTemplateSourcePaths()` 断言更新：移除 `knowledgeBase`/`memory`/`scripts`，新增 `resources`

### 提交
```
refactor(config): update path constants for v4 directory structure
```

---

## 阶段 2：init.ts 重写

### 目标
重写 `novelws init` 命令，生成新目录结构 + MCP 配置文件。

### 文件：`src/commands/init.ts`

#### 2.1 目录创建列表替换

旧：
```typescript
const baseDirs = [
  paths.specify, paths.specifyMemory, paths.specifyTemplates,
  paths.claude, paths.commands, paths.skills,
  paths.stories, paths.spec, paths.tracking,
  paths.knowledge, paths.specifyScripts,
];
```

新：
```typescript
const baseDirs = [
  paths.claude, paths.commands, paths.skills,
  paths.resources,
  paths.tracking,
  paths.stories,
];
```

#### 2.2 配置文件路径

旧：`paths.specifyConfig`（`.specify/config.json`）
新：`paths.resourcesConfig`（`resources/config/config.json`）

需要先 `ensureDir` config 目录：
```typescript
await fs.ensureDir(path.dirname(paths.resourcesConfig));
```

#### 2.3 模板复制逻辑简化

旧逻辑（多步复制 memory、knowledge-base、scripts 等）替换为：

```typescript
// 复制 resources/ 模板（一次性）
if (await fs.pathExists(templates.resources)) {
  await fs.copy(templates.resources, paths.resources);
}

// 复制 tracking/ 模板（排除 summary，除非 --scale large）
if (await fs.pathExists(templates.tracking)) {
  const summaryDir = path.normalize(templates.trackingSummary);
  if (options.scale === 'large') {
    await fs.copy(templates.tracking, paths.tracking);
  } else {
    await fs.copy(templates.tracking, paths.tracking, {
      filter: (src: string) => !path.normalize(src).startsWith(summaryDir),
    });
  }
}

// 复制 knowledge/ → resources/knowledge/
if (await fs.pathExists(templates.knowledge)) {
  await fs.copy(templates.knowledge, paths.resourcesKnowledge);
}
```

#### 2.4 删除旧的 specifyTemplates 复制

移除这段代码：
```typescript
// 复制模板文件到 .specify/templates（排除 scripts...）
if (await fs.pathExists(templates.all)) { ... }
```

#### 2.5 MCP 配置生成（新增）

在 `--with-mcp` 分支中添加：
```typescript
if (options.withMcp) {
  const mcpConfig = {
    mcpServers: {
      novelws: {
        command: 'npx',
        args: ['novelws-mcp', '.'],
        env: {},
      },
    },
  };
  await fs.writeJson(paths.mcpServers, mcpConfig, { spaces: 2 });
  spinner.text = '已生成 MCP 服务器配置...';
}
```

#### 2.6 大型项目分片目录

路径从 `paths.trackingVolumes`（旧 `spec/tracking/volumes`）自动指向新的 `tracking/volumes`，无需额外改动。

#### 2.7 脚本路径更新

write.md frontmatter 中的脚本路径：
```yaml
scripts:
  sh: resources/scripts/bash/check-writing-state.sh
  ps: resources/scripts/powershell/check-writing-state.ps1
```

#### 2.8 插件注册表路径

`PluginManager` 构造函数传入的路径需要适配新的 `pluginRegistry` 路径。检查 `src/plugins/manager.ts` 是否使用 `getProjectPaths`。

### 文件：`tests/integration/init-project.test.ts`

更新断言：
- `.specify` → `resources`
- `spec` → 不再检查
- `spec/tracking` → `tracking`
- `.specify/config.json` → `resources/config/config.json`
- `spec/tracking/summary` → `tracking/summary`
- `spec/tracking/volumes` → `tracking/volumes`
- 新增测试：`--with-mcp` 应生成 `.claude/mcp-servers.json`

### 提交
```
feat(init): rewrite init command for v4 directory structure + MCP config
```

---

## 阶段 3：diagnostics.ts + upgrade.ts 适配新路径

### 目标
修复诊断系统的 MCP 检测逻辑，重写 upgrade 命令支持 v3→v4 迁移。

### 文件：`src/utils/diagnostics.ts`

#### 3.1 checkProjectStructure() 更新

旧的必检目录：
```typescript
{ path: paths.specify, label: '.specify' },
{ path: paths.claude, label: '.claude' },
{ path: paths.commands, label: '.claude/commands' },
```

新的必检目录：
```typescript
{ path: paths.resources, label: 'resources' },
{ path: paths.claude, label: '.claude' },
{ path: paths.commands, label: '.claude/commands' },
```

#### 3.2 checkTrackingFiles() 更新

`trackingDir` 已通过 `getProjectPaths` 自动指向 `tracking/`（顶层），无需手动改路径。但错误消息从 `spec/tracking 目录不存在` 改为 `tracking 目录不存在`。

#### 3.3 checkMCPStatus() 修复（设计文档修复 #4）

旧：
```typescript
const dbPath = path.join(projectRoot, 'novel-tracking.db');
const mcpConfigPath = path.join(projectRoot, '.claude', 'mcp.json');
```

新：
```typescript
const dbPath = paths.trackingDb;  // tracking/novel-tracking.db
const mcpConfigPath = paths.mcpServers;  // .claude/mcp-servers.json
```

#### 3.4 detectProjectMode() 修复

旧：
```typescript
const dbPath = path.join(projectRoot, 'novel-tracking.db');
```

新：
```typescript
const dbPath = paths.trackingDb;  // tracking/novel-tracking.db
```

### 文件：`src/commands/upgrade.ts`

#### 3.5 项目检测逻辑

旧：检查 `paths.specifyConfig`（`.specify/config.json`）
新：先检查新路径 `paths.resourcesConfig`，如不存在再检查旧路径 `paths._legacy_specify` 判断是否需要迁移。

#### 3.6 新增迁移逻辑（v3→v4）

在 upgrade action 中添加迁移分支：

```typescript
// 检测是否为旧结构
const isLegacy = await fs.pathExists(paths._legacy_specify);

if (isLegacy) {
  spinner.text = '检测到 v3 项目结构，执行迁移...';

  // 1. 创建新目录
  await fs.ensureDir(paths.resources);
  await fs.ensureDir(paths.tracking);
  await fs.ensureDir(paths.cache);

  // 2. 移动文件（按设计文档映射表）
  const migrations = [
    { from: path.join(paths._legacy_specify, 'memory'), to: paths.resourcesMemory },
    { from: path.join(paths._legacy_specify, 'templates', 'knowledge-base', 'craft'), to: path.join(paths.resources, 'craft') },
    { from: path.join(paths._legacy_specify, 'templates', 'knowledge-base', 'genres'), to: path.join(paths.resources, 'genres') },
    { from: path.join(paths._legacy_specify, 'templates', 'knowledge-base', 'styles'), to: path.join(paths.resources, 'styles') },
    { from: path.join(paths._legacy_specify, 'templates', 'knowledge-base', 'requirements'), to: path.join(paths.resources, 'requirements') },
    { from: path.join(paths._legacy_specify, 'templates', 'knowledge-base', 'emotional-beats'), to: path.join(paths.resources, 'emotional-beats') },
    { from: path.join(paths._legacy_specify, 'templates', 'knowledge-base', 'character-archetypes'), to: path.join(paths.resources, 'character-archetypes') },
    { from: path.join(paths._legacy_specify, 'templates', 'knowledge-base', 'references'), to: path.join(paths.resources, 'references') },
    { from: path.join(paths._legacy_specify, 'templates', 'config'), to: path.join(paths.resources, 'config') },
    { from: path.join(paths._legacy_specify, 'scripts'), to: paths.resourcesScripts },
    { from: path.join(paths._legacy_spec, 'tracking'), to: paths.tracking },
    { from: path.join(paths._legacy_spec, 'knowledge'), to: paths.resourcesKnowledge },
    { from: path.join(paths._legacy_spec, 'presets'), to: path.join(paths.resources, 'presets') },
  ];

  for (const { from, to } of migrations) {
    if (await fs.pathExists(from)) {
      await fs.move(from, to, { overwrite: true });
    }
  }

  // 3. 迁移 config.json
  const oldConfig = path.join(paths._legacy_specify, 'config.json');
  if (await fs.pathExists(oldConfig)) {
    await fs.ensureDir(path.dirname(paths.resourcesConfig));
    await fs.move(oldConfig, paths.resourcesConfig, { overwrite: true });
  }

  // 4. 清理空旧目录
  for (const dir of [paths._legacy_specify, paths._legacy_spec]) {
    if (await fs.pathExists(dir)) {
      await fs.remove(dir);
    }
  }

  // 5. 清除缓存
  if (await fs.pathExists(paths.cache)) {
    await fs.remove(paths.cache);
    await fs.ensureDir(paths.cache);
  }
}
```

#### 3.7 tracking 文件大小检测路径

旧：`path.join(paths.tracking, file)` — 已自动指向新路径，无需改。

#### 3.8 configPath 读写

旧：`paths.specifyConfig`
新：`paths.resourcesConfig`

### 文件：`tests/unit/utils/diagnostics.test.ts`

更新 `createMinimalProject()`：
```typescript
async function createMinimalProject() {
  await fs.ensureDir(path.join(tmpDir, 'resources', 'config'));
  await fs.writeJson(path.join(tmpDir, 'resources', 'config', 'config.json'), { name: 'test', version: '1.0.0' });
  await fs.ensureDir(path.join(tmpDir, '.claude', 'commands'));
  await fs.ensureDir(path.join(tmpDir, 'stories'));
}
```

更新 `createTrackingFiles()`：
```typescript
const trackingDir = path.join(tmpDir, 'tracking');  // 顶层
```

更新 MCP 测试：
- `mcp.json` → `mcp-servers.json`
- `novel-tracking.db` 在项目根 → `tracking/novel-tracking.db`
- sharded 模式：`spec/tracking/volumes` → `tracking/volumes`

### 文件：`tests/integration/upgrade-project.test.ts`

更新 tracking 路径：
```typescript
const trackingPath = path.join(projectPath, 'tracking', 'character-state.json');
```

新增迁移测试：
- 创建旧结构项目 → 运行 upgrade → 验证新结构存在 + 旧结构已删除

### 提交
```
fix(diagnostics): fix MCP detection paths + add v3→v4 migration to upgrade
```

---

## 阶段 4：命令模板路径批量替换（21 个文件）

### 目标
将所有 `.claude/commands/*.md` 模板中的旧路径替换为新路径。

### 替换规则（全局 sed 式替换）

| 旧路径模式 | 新路径 |
|-----------|--------|
| `.specify/memory/` | `resources/memory/` |
| `.specify/templates/knowledge-base/craft/` | `resources/craft/` |
| `.specify/templates/knowledge-base/genres/` | `resources/genres/` |
| `.specify/templates/knowledge-base/styles/` | `resources/styles/` |
| `.specify/templates/knowledge-base/requirements/` | `resources/requirements/` |
| `.specify/templates/knowledge-base/emotional-beats/` | `resources/emotional-beats/` |
| `.specify/templates/knowledge-base/character-archetypes/` | `resources/character-archetypes/` |
| `.specify/templates/knowledge-base/references/` | `resources/references/` |
| `.specify/templates/knowledge-base/` | `resources/` |
| `.specify/templates/config/` | `resources/config/` |
| `.specify/templates/skills/` | `@templates/skills/` |
| `.specify/scripts/bash/` | `resources/scripts/bash/` |
| `.specify/scripts/powershell/` | `resources/scripts/powershell/` |
| `.specify/scripts/` | `resources/scripts/` |
| `.specify/config.json` | `resources/config/config.json` |
| `spec/tracking/volumes/` | `tracking/volumes/` |
| `spec/tracking/summary/` | `tracking/summary/` |
| `spec/tracking/` | `tracking/` |
| `spec/knowledge/` | `resources/knowledge/` |
| `spec/presets/` | `resources/presets/` |
| `templates/knowledge-base/craft/` | `resources/craft/` |
| `templates/knowledge-base/genres/` | `resources/genres/` |
| `templates/knowledge-base/requirements/` | `resources/requirements/` |
| `templates/skills/` | `@templates/skills/` |
| `templates/config/keyword-mappings.json` | `resources/config/keyword-mappings.json` |
| `memory/constitution.md` (无前缀) | `resources/memory/constitution.md` |
| `memory/personal-voice.md` (无前缀) | `resources/memory/personal-voice.md` |
| `memory/style-reference.md` (无前缀) | `resources/memory/style-reference.md` |

### 注意事项

- `@templates/skills/` 引用保持不变（这些是 `.claude/skills/` 的引用，不是文件系统路径）
- `stories/*/` 路径不变
- `notes/ideas.json` 路径不变
- frontmatter 中的 `scripts:` 路径也需要更新

### 受影响文件（21 个）

write.md, analyze.md, track.md, track-init.md, guide.md, plan.md, checklist.md, recap.md, character.md, relations.md, timeline.md, revise.md, search.md, volume-summary.md, facts.md, tasks.md, specify.md, constitution.md, clarify.md, expert.md, help-me.md

### MCP Fallback 检测逻辑更新（设计文档修复 #3）

在 write.md、track.md、analyze.md、search.md、guide.md 中，将 MCP 检测逻辑从：
```
检查 mcp-servers.json 是否存在
```
改为：
```
1. 读取 resources/config/config.json，检查 mcp === true
2. 检查 tracking/novel-tracking.db 是否存在
3. 两者都满足 → MCP 模式
4. 否则 → 检查 tracking/volumes/ → 分片模式
5. 否则 → 单文件模式
```

### 提交
```
refactor(commands): update all 21 command templates to v4 paths
```

---

## 阶段 5：脚本文件路径替换（~27 个文件）

### 目标
更新所有 bash/powershell 脚本中的路径引用。

### 替换规则

与阶段 4 相同的路径映射，但针对 shell 变量格式：

Bash 脚本中常见模式：
```bash
TRACKING_DIR="spec/tracking"        → TRACKING_DIR="tracking"
KNOWLEDGE_DIR="spec/knowledge"      → KNOWLEDGE_DIR="resources/knowledge"
CONFIG_FILE=".specify/config.json"  → CONFIG_FILE="resources/config/config.json"
SCRIPTS_DIR=".specify/scripts"      → SCRIPTS_DIR="resources/scripts"
```

PowerShell 脚本中常见模式：
```powershell
$TrackingDir = "spec/tracking"      → $TrackingDir = "tracking"
$ConfigFile = ".specify/config.json" → $ConfigFile = "resources/config/config.json"
```

### 受影响文件

Bash（~15 个）：check-writing-state.sh, check-consistency.sh, check-plot.sh, check-timeline.sh, check-world.sh, check-facts.sh, init-tracking.sh, track-progress.sh, manage-relations.sh, analyze-story.sh, constitution.sh, plan-story.sh, specify-story.sh, tasks-story.sh, text-audit.sh, migrate-tracking.sh, common.sh

PowerShell（~8 个）：check-writing-state.ps1, check-consistency.ps1, check-plot.ps1, check-timeline.ps1, init-tracking.ps1, manage-relations.ps1, track-progress.ps1, text-audit.ps1, common.ps1

scripts/README.md

### 提交
```
refactor(scripts): update all script paths to v4 directory structure
```

---

## 阶段 6：keyword-mappings.json + CLAUDE.md + 其他模板更新

### 目标
更新关键词映射文件中的资源路径、CLAUDE.md 中的路径文档、以及其他零散引用。

### 文件：`templates/resources/config/keyword-mappings.json`

所有 `resources` 数组中的路径替换：

```
"templates/knowledge-base/craft/dialogue.md"  → "resources/craft/dialogue.md"
"templates/knowledge-base/craft/..."          → "resources/craft/..."
"templates/knowledge-base/genres/..."         → "resources/genres/..."
"templates/skills/writing-techniques/..."     → 不变（这是 .claude/skills/ 引用）
"templates/skills/quality-assurance/..."      → 不变
"templates/skills/genre-knowledge/..."        → 不变
```

### 文件：`templates/dot-claude/CLAUDE.md`

更新所有路径引用：
- `.specify/templates/knowledge-base/requirements/anti-ai-v4.md` → `resources/requirements/anti-ai-v4.md`
- `spec/tracking/` → `tracking/`
- `spec/tracking/volumes/` → `tracking/volumes/`
- `spec/tracking/summary/` → `tracking/summary/`
- `.specify/config.json` → `resources/config/config.json`
- `spec/tracking-backup-YYYYMMDD/` → `tracking-backup-YYYYMMDD/`
- `spec/tracking/novel-tracking.db` → `tracking/novel-tracking.db`

### 文件：`packages/novelws-mcp/src/tools/sync-from-json.ts`

```typescript
// 旧
const trackingDir = path.join(projectRoot, 'spec', 'tracking');
// 新
const trackingDir = path.join(projectRoot, 'tracking');
```

### 文件：`packages/novelws-mcp/src/index.ts`

更新数据库默认路径引用（如有硬编码 `spec/tracking/novel-tracking.db`）。

### 文件：`src/plugins/registry.ts`

检查是否有硬编码的 `.specify/` 路径，如有则更新。

### 文件：`packages/novelws-mcp/tests/`

更新测试中的路径断言。

### 提交
```
refactor: update keyword-mappings, CLAUDE.md, and MCP paths for v4
```

---

## 阶段 7：增量缓存加载机制（write.md 模板更新）

### 目标
在 write.md 命令模板中实现三级缓存加载流程。

### 文件：`templates/commands/write.md`

#### 7.1 新增缓存加载段落

在「查询协议」之前插入缓存检查流程：

```markdown
## 增量缓存加载

### 缓存检查
1. 读取 `.claude/.cache/resource-digest.json`
   - 不存在 → 首次加载模式（全量读取所有资源）
   - 存在 → 进入增量检查

2. 对比文件指纹（mtime + size）
   - 全部未变 → 复用 `.claude/.cache/write-context.json` 中的摘要
   - 有变化 → 只重新读取变化的文件

3. 加载策略：
   - **L0（每次必读）**：tasks.md、上一章最后500字、tracking/character-state.json 活跃角色
   - **L1（缓存摘要）**：constitution.md、specification.md、creative-plan.md、plot-tracker.json、relationships.json
   - **L2（按需加载）**：craft/、genres/、styles/、requirements/ — 仅在关键词触发时加载

### 缓存更新
写作完成后，更新 resource-digest.json 和 write-context.json。
```

#### 7.2 更新查询协议中的路径

所有路径引用已在阶段 4 完成，此处只需确保缓存流程与查询协议衔接正确。

#### 7.3 首次加载 fallback

如果 `.claude/.cache/` 不存在，自动创建并执行全量加载（与当前行为一致）。

### 文件：`templates/dot-claude/CLAUDE.md`

在「会话级资源复用」章节后新增「增量缓存」说明：

```markdown
## 增量缓存机制

write 命令使用文件指纹缓存避免重复加载：
- 缓存位置：`.claude/.cache/`
- `resource-digest.json`：记录每个资源文件的 mtime + size
- `write-context.json`：L1 摘要 + L2 已加载资源的快照
- 文件未变化时直接复用缓存，大幅减少加载时间
- 手动删除 `.claude/.cache/` 可强制全量重建
```

### 提交
```
feat(write): add incremental cache loading mechanism to write command
```

---

## 阶段 8：剩余测试修复 + 全量验证

### 目标
修复所有因路径变更而失败的测试，确保全量通过。

### 受影响测试文件

1. `tests/integration/init-project.test.ts` — 阶段 2 已处理
2. `tests/integration/upgrade-project.test.ts` — 阶段 3 已处理
3. `tests/unit/core/config.test.ts` — 阶段 1 已处理
4. `tests/unit/utils/diagnostics.test.ts` — 阶段 3 已处理
5. `tests/integration/template-validation.test.ts` — 检查模板文件是否存在，路径可能需要更新
6. `tests/integration/ultra-long-novel.test.ts` — 检查分片结构路径
7. `tests/integration/plugin-install.test.ts` — 检查插件注册表路径
8. `tests/unit/plugins/manager.test.ts` — 检查 pluginRegistry 路径
9. `tests/unit/plugins/registry.test.ts` — 可能引用旧路径
10. `tests/unit/tracking/migration.test.ts` — tracking 路径
11. `packages/novelws-mcp/tests/` — MCP 测试路径

### 验证步骤

```bash
# 1. 编译
npm run build

# 2. 单元测试
npm test -- --testPathPattern="tests/unit"

# 3. 集成测试
npm test -- --testPathPattern="tests/integration"

# 4. MCP 包测试
cd packages/novelws-mcp && npm test

# 5. 端到端验证
node dist/cli.js init test-e2e --no-git
# 验证 test-e2e/ 目录结构正确

node dist/cli.js init test-mcp --no-git --with-mcp
# 验证 .claude/mcp-servers.json 存在
# 验证 tracking/ 目录存在
```

### 提交
```
test: fix all tests for v4 directory structure
```

---

## 执行顺序总结

| 阶段 | 内容 | 涉及文件数 | 依赖 |
|------|------|-----------|------|
| 0 | templates/ 源目录重组 | ~50（纯移动） | 无 |
| 1 | config.ts 路径常量 | 2 | 阶段 0 |
| 2 | init.ts 重写 | 2 | 阶段 1 |
| 3 | diagnostics.ts + upgrade.ts | 4 | 阶段 1 |
| 4 | 命令模板路径替换 | 21 | 阶段 0 |
| 5 | 脚本路径替换 | ~27 | 阶段 0 |
| 6 | keyword-mappings + CLAUDE.md + MCP | ~6 | 阶段 0 |
| 7 | 增量缓存机制 | 2 | 阶段 4 |
| 8 | 测试修复 + 全量验证 | ~11 | 全部 |

阶段 2/3/4/5/6 可并行执行（都只依赖阶段 0+1）。
阶段 7 依赖阶段 4（write.md 路径已更新）。
阶段 8 最后执行。
