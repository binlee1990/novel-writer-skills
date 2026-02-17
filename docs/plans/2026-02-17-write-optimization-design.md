# 设计文档：目录重组 + 增量缓存 + MCP 修复

> 日期：2026-02-17
> 版本：v4.0.0（破坏性升级）
> 状态：已批准

## 背景

三个核心痛点：

1. **目录结构混乱**：write 命令需要从 `.specify/memory/`、`.specify/templates/knowledge-base/`、`.specify/templates/skills/`、`spec/tracking/`、`spec/knowledge/`、`stories/*/content/` 等 6+ 个目录加载资源，路径深达 4-5 层
2. **加载耗时过长**：每次执行 write 命令都要花几十分钟才进入写作环节，消耗大量 token
3. **MCP 功能不可用**：`novelws init --with-mcp` 生成的项目缺少关键配置文件，MCP 无法工作

## 一、目录结构全面重组

### 设计决策

- 方向：全面重组，扁平化到 2-3 个顶层资源目录
- 兼容性：破坏性升级，旧项目通过 `novelws upgrade` 迁移

### 新目录结构

```
my-novel/
├── .claude/                        # Claude Code 集成（不变）
│   ├── commands/                   # 21个 Slash Commands
│   ├── skills/                     # 42个 Agent Skills
│   ├── CLAUDE.md                   # 项目规范
│   ├── mcp-servers.json            # 【新增】MCP 服务器配置（--with-mcp 时生成）
│   └── .cache/                     # 【新增】缓存目录
│       ├── resource-digest.json    # 资源文件 mtime + hash
│       └── write-context.json      # 上次 write 的上下文快照
│
├── resources/                      # 【合并】所有参考资源（原 .specify/ + spec/knowledge/）
│   ├── memory/                     # 创作记忆（原 .specify/memory/）
│   │   ├── constitution.md
│   │   ├── personal-voice.md
│   │   └── style-reference.md
│   ├── craft/                      # 写作技法（原 .specify/templates/knowledge-base/craft/）
│   ├── genres/                     # 类型知识（原 .../genres/）
│   ├── styles/                     # 风格参考（原 .../styles/）
│   ├── requirements/               # 写作规范（原 .../requirements/）
│   ├── emotional-beats/            # 情感节奏（原 .../emotional-beats/）
│   ├── character-archetypes/       # 角色原型（原 .../character-archetypes/）
│   ├── references/                 # 参考资料（原 .../references/）
│   ├── knowledge/                  # 项目知识（原 spec/knowledge/）
│   ├── presets/                    # 预设配置（原 spec/presets/）
│   ├── config/                     # 配置文件（原 .specify/templates/config/）
│   │   ├── keyword-mappings.json
│   │   └── config.json             # 项目配置（原 .specify/config.json）
│   └── scripts/                    # 脚本（原 .specify/scripts/）
│       ├── bash/
│       └── powershell/
│
├── tracking/                       # 【提升】追踪数据（原 spec/tracking/）
│   ├── character-state.json
│   ├── plot-tracker.json
│   ├── relationships.json
│   ├── timeline.json
│   ├── story-facts.json
│   ├── validation-rules.json
│   ├── tracking-log.md
│   ├── novel-tracking.db           # MCP SQLite 数据库
│   ├── summary/                    # 大型项目摘要
│   └── volumes/                    # 分卷分片
│
├── stories/                        # 故事内容（不变）
│   └── <story>/
│       ├── specification.md
│       ├── creative-plan.md
│       ├── tasks.md
│       └── content/
│
└── plugins/                        # 插件（不变）
```

### 路径变化对照表

| 旧路径 | 新路径 | 缩短 |
|--------|--------|------|
| `.specify/memory/constitution.md` | `resources/memory/constitution.md` | 少1层 |
| `.specify/templates/knowledge-base/craft/dialogue.md` | `resources/craft/dialogue.md` | 少3层 |
| `.specify/templates/knowledge-base/genres/romance.md` | `resources/genres/romance.md` | 少3层 |
| `.specify/templates/knowledge-base/requirements/anti-ai-v4.md` | `resources/requirements/anti-ai-v4.md` | 少3层 |
| `.specify/templates/config/keyword-mappings.json` | `resources/config/keyword-mappings.json` | 少2层 |
| `.specify/scripts/bash/check-writing-state.sh` | `resources/scripts/bash/check-writing-state.sh` | 少1层 |
| `.specify/config.json` | `resources/config/config.json` | 移入 config/ |
| `spec/tracking/character-state.json` | `tracking/character-state.json` | 少1层 |
| `spec/knowledge/world-setting.md` | `resources/knowledge/world-setting.md` | 少1层 |
| `spec/presets/golden-opening.md` | `resources/presets/golden-opening.md` | 少1层 |

### 消除的目录

- `.specify/` → 完全消除，内容分散到 `resources/`
- `spec/` → 完全消除，tracking 提升为顶层，knowledge 并入 resources/
- `.specify/templates/` → 消除这个中间层
- `.specify/templates/knowledge-base/` → 消除这个中间层

### templates/ 源目录重组

```
templates/                        # 重组后
├── commands/                     # 不变
├── skills/                       # 不变
├── dot-claude/                   # 不变（CLAUDE.md 内容更新）
├── resources/                    # 【新】合并原 knowledge-base/ + memory/ + config/
│   ├── memory/
│   ├── craft/
│   ├── genres/
│   ├── styles/
│   ├── requirements/
│   ├── emotional-beats/
│   ├── character-archetypes/
│   ├── references/
│   ├── config/
│   └── scripts/
├── tracking/                     # 原 tracking/（不变）
└── knowledge/                    # 原 knowledge/（不变）
```

init.ts 复制映射：

| 源（templates/） | 目标（生成项目） |
|-----------------|----------------|
| commands/ | .claude/commands/ |
| skills/ | .claude/skills/ |
| dot-claude/CLAUDE.md | .claude/CLAUDE.md |
| resources/ | resources/ |
| tracking/ | tracking/ |
| knowledge/ | resources/knowledge/ |

## 二、增量缓存加载机制

### 资源分级

| 级别 | 内容 | 加载策略 | 缓存方式 |
|------|------|---------|---------|
| L0 必读 | tasks.md、上一章最后500字、当前活跃角色 | 每次读取全文 | 不缓存（实时性要求高） |
| L1 摘要 | constitution.md、specification.md、creative-plan.md、plot-tracker.json、relationships.json | 首次读全文生成摘要，后续只在文件变化时重新生成 | 缓存摘要 |
| L2 按需 | craft/、genres/、styles/、requirements/、skills/ | 仅在关键词触发或配置指定时加载，加载后缓存 | 缓存全文 |

### 缓存文件

两个缓存文件，放在 `.claude/.cache/`：

#### resource-digest.json — 文件指纹索引

```json
{
  "version": 1,
  "updated_at": "2026-02-17T10:00:00Z",
  "files": {
    "resources/memory/constitution.md": {
      "mtime": 1739750400000,
      "size": 2048
    },
    "resources/craft/dialogue.md": {
      "mtime": 1739750400000,
      "size": 4096
    },
    "tracking/character-state.json": {
      "mtime": 1739836800000,
      "size": 15360
    }
  }
}
```

#### write-context.json — 上下文快照

```json
{
  "version": 1,
  "story": "my-story",
  "last_chapter": 14,
  "generated_at": "2026-02-17T10:00:00Z",
  "digest_version": 1,
  "context": {
    "l1_summaries": {
      "constitution": "核心价值观：真实感、角色驱动...(200字摘要)",
      "specification": "都市悬疑，主角张明，30章规模...(300字摘要)",
      "creative_plan": "第三卷：真相浮现，第14-20章...(200字摘要)",
      "active_plots": [
        {"id": "main-1", "name": "失踪案", "status": "active", "progress": "60%"},
        {"id": "sub-2", "name": "暗恋线", "status": "active", "progress": "30%"}
      ],
      "active_relationships": [
        {"from": "张明", "to": "李薇", "type": "搭档", "tension": "high"}
      ]
    },
    "l2_loaded": {
      "resources/craft/dialogue.md": "已缓存",
      "resources/craft/pacing.md": "已缓存",
      "resources/requirements/anti-ai-v5-balanced.md": "已缓存"
    }
  }
}
```

### write 命令新加载流程

```
1. 读取 .claude/.cache/resource-digest.json
   ├─ 不存在 → 首次加载（全量），生成 digest + context
   └─ 存在 → 进入增量检查
       │
2. 对比每个文件的 mtime
   ├─ 全部未变 → 直接复用 write-context.json，跳到步骤 5
   └─ 有变化 → 只重新读取变化的文件
       │
3. 更新 write-context.json 中变化的部分
   ├─ L1 文件变化 → 重新生成该文件的摘要
   └─ L2 文件变化 → 重新缓存全文
       │
4. 写回更新后的 digest + context
       │
5. 加载 L0 资源（每次必读，不缓存）
   ├─ tasks.md 中当前任务
   ├─ 上一章最后 500 字
   └─ tracking/character-state.json 中活跃角色
       │
6. 合并 L0 实时数据 + L1 缓存摘要 + L2 缓存资源
       │
7. 进入写作
```

### 预期效果

| 场景 | 当前耗时 | 优化后 |
|------|---------|--------|
| 首次 write（无缓存） | ~30分钟 | ~30分钟（无变化） |
| 连续 write（无文件变化） | ~30分钟 | 大幅缩短（只读 L0 + 复用缓存） |
| 修改了 specification 后 write | ~30分钟 | 缩短（只重新生成 specification 摘要） |
| 修改了 tracking 数据后 write | ~30分钟 | 缩短（只更新 tracking 相关摘要） |

### 缓存失效规则

- `resource-digest.json` 中的 mtime 与实际文件不一致 → 该文件重新加载
- `write-context.json` 的 `digest_version` 与 `resource-digest.json` 的 `version` 不一致 → 全量重建
- 用户手动删除 `.claude/.cache/` → 下次 write 全量重建
- `novelws upgrade` 执行后 → 自动清除缓存

## 三、MCP 修复

### 问题清单

| # | 问题 | 严重度 | 位置 |
|---|------|--------|------|
| 1 | `init --with-mcp` 不生成 `mcp-servers.json` | P0 | `src/commands/init.ts` |
| 2 | 不创建 SQLite 数据库 | P0 | `src/commands/init.ts` |
| 3 | 命令模板中 Fallback 检测条件错误 | P1 | `templates/commands/*.md` |
| 4 | 诊断系统检查路径错误 | P2 | `src/utils/diagnostics.ts` |

### 修复 1：init.ts 生成 mcp-servers.json

`novelws init my-novel --with-mcp` 时，在 `.claude/` 下生成：

```json
{
  "mcpServers": {
    "novelws": {
      "command": "npx",
      "args": ["novelws-mcp", "."],
      "env": {}
    }
  }
}
```

用 `npx novelws-mcp` 而非直接调用二进制，避免全局安装依赖。

### 修复 2：确保数据库可创建

MCP 服务器首次启动时自动创建数据库（`packages/novelws-mcp/src/db/connection.ts` 已有此逻辑），init 只需确保 `tracking/` 目录存在。

### 修复 3：命令模板 Fallback 检测逻辑

当前（错误）：
```
检查 mcp-servers.json 是否存在 → 判断 MCP 可用
```

修复为：
```
1. 读取 resources/config/config.json，检查 mcp === true
2. 检查 tracking/novel-tracking.db 是否存在
3. 两者都满足 → MCP 模式
4. 否则 → 检查 tracking/volumes/ 是否存在 → 分片模式
5. 否则 → 单文件模式
```

需要更新的命令模板：write.md、analyze.md、track.md、search.md、guide.md 等。

### 修复 4：诊断系统

`src/utils/diagnostics.ts` 中的 `checkMCPStatus()`：

- 检查路径从 `.claude/mcp.json` 改为 `.claude/mcp-servers.json`
- 数据库路径从 `novel-tracking.db`（项目根）改为 `tracking/novel-tracking.db`
- 增加提示信息：缺少配置时告诉用户运行 `novelws init --here --with-mcp`

### MCP 包适配

`packages/novelws-mcp/src/index.ts` 数据库路径从 `spec/tracking/novel-tracking.db` 改为 `tracking/novel-tracking.db`。

## 四、升级迁移

### novelws upgrade 迁移逻辑

```
1. 检测项目版本（通过 .specify/ 是否存在判断旧结构）
2. 创建新目录：resources/、tracking/、.claude/.cache/
3. 移动文件：
   .specify/memory/          → resources/memory/
   .specify/templates/knowledge-base/craft/    → resources/craft/
   .specify/templates/knowledge-base/genres/   → resources/genres/
   .specify/templates/knowledge-base/styles/   → resources/styles/
   .specify/templates/knowledge-base/requirements/ → resources/requirements/
   .specify/templates/knowledge-base/emotional-beats/ → resources/emotional-beats/
   .specify/templates/knowledge-base/character-archetypes/ → resources/character-archetypes/
   .specify/templates/knowledge-base/references/ → resources/references/
   .specify/templates/config/ → resources/config/
   .specify/scripts/         → resources/scripts/
   .specify/config.json      → resources/config/config.json
   spec/tracking/*           → tracking/
   spec/knowledge/           → resources/knowledge/
   spec/presets/             → resources/presets/
4. 更新 .claude/commands/*.md（替换旧路径为新路径）
5. 更新 .claude/skills/ 中引用旧路径的文件
6. 更新 .claude/CLAUDE.md
7. 清理空目录：.specify/、spec/
8. 清除缓存：.claude/.cache/
9. 输出迁移报告
```

## 五、完整变更影响

| 变更领域 | 涉及文件数 | 变更类型 |
|---------|-----------|---------|
| 目录结构（init.ts） | 1 | 重写目录创建和文件复制逻辑 |
| 路径常量（config.ts） | 1 | 更新 DIRS、getProjectPaths()、getTemplateSourcePaths() |
| 命令模板（commands/*.md） | ~21 | 批量替换路径引用 |
| 关键词映射（keyword-mappings.json） | 1 | 更新所有资源路径 |
| Bash 脚本（scripts/bash/*.sh） | ~22 | 批量替换路径引用 |
| PowerShell 脚本（scripts/powershell/*.ps1） | ~22 | 批量替换路径引用 |
| 生成项目 CLAUDE.md | 1 | 更新路径文档 |
| 诊断系统（diagnostics.ts） | 1 | 修复 MCP 检测 + 适配新路径 |
| 升级命令（upgrade.ts） | 1 | 新增迁移逻辑 |
| MCP 服务器（novelws-mcp） | ~3 | 适配新数据库路径 |
| 缓存机制（write.md + 脚本） | ~4 | 新增缓存加载流程 |
| 测试文件 | ~10 | 更新路径断言 |
| 项目 CLAUDE.md | 1 | 更新路径映射文档 |
| templates/ 源目录结构 | 重组 | 模板源目录对应调整 |

## 六、不在本次范围内

- Skills 内部结构不变（.claude/skills/ 保持现有分类）
- stories/ 目录结构不变
- plugins/ 目录不变
- 三层资源加载机制的逻辑不变（只改路径，不改机制）
- keyword-mappings.json 的结构不变（只改路径值）
