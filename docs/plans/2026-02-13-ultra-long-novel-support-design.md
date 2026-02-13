# 超长篇小说支撑优化设计（方案 B+）

> 日期：2026-02-13
> 状态：已批准
> 目标：让框架弹性支撑从几百章到 5000+ 章的超长篇小说创作

## 1. 问题分析

当前框架在 300+ 章时开始出现以下瓶颈：

- **上下文溢出**：recap/track/facts 等命令加载全量 tracking 数据，context window 不够用
- **数据膨胀**：tracking JSON 随章节线性增长，单文件可达几百 KB
- **批量操作不足**：命令一次只处理一章，缺少范围/批量操作
- **长线连贯性维护困难**：500 章后伏笔、角色状态、时间线难以追溯和维护

## 2. 整体架构：三层数据架构

```
┌─────────────────────────────────────────────┐
│  Layer 3: MCP Server (SQLite 数据中枢)       │
│  - 精确查询：按角色/章节/卷/关键词           │
│  - 聚合统计：角色出场次数、伏笔状态等         │
│  - 一致性校验：跨卷冲突检测                   │
│  - 全文检索：FTS5 引擎                       │
│  - 创作过程数据、分析历史等原生数据           │
├─────────────────────────────────────────────┤
│  Layer 2: 全局摘要 (spec/tracking/summary/)  │
│  - characters-summary.json  (活跃角色概览)    │
│  - plot-summary.json        (主线/伏笔状态)   │
│  - timeline-summary.json    (关键时间节点)     │
│  - volume-summaries.json    (各卷摘要)        │
│  人可读、git 可追踪、跨卷查询的入口           │
├─────────────────────────────────────────────┤
│  Layer 1: 分卷详情 (spec/tracking/volumes/)   │
│  - vol-XX/character-state.json               │
│  - vol-XX/timeline.json                      │
│  - vol-XX/relationships.json                 │
│  - vol-XX/plot-tracker.json                  │
│  每卷独立、体积可控、按需加载                 │
└─────────────────────────────────────────────┘
```

核心原则：
- JSON 分片是 source of truth，人可读、git 可追踪
- SQLite 承担两类职责：JSON 镜像索引（可重建）+ 原生数据（DB 是 source of truth）
- 命令优先走 MCP 查询，MCP 不可用时 fallback 到读 JSON
- 渐进式迁移：小项目继续用单文件，超过阈值时提示分片

## 3. MCP Server 设计（novelws-mcp）

独立 npm 包，作为插件安装，底层使用 SQLite（better-sqlite3）。

### 3.1 SQLite 数据分层

**第一类：JSON 镜像索引（可从 JSON 重建）**

```sql
characters    (id, name, volume, status, last_chapter, data_json)
events        (id, chapter, volume, timestamp_story, type, summary)
relationships (id, char_a, char_b, volume, type, status)
plot_threads  (id, type, status, planted_chapter, resolved_chapter)
facts         (id, category, key, value, first_chapter, last_verified)
```

**第二类：SQLite 原生数据（DB 是 source of truth）**

```sql
-- 创作过程数据
writing_sessions   (chapter, start_time, end_time, word_count, commands_used)
command_log        (timestamp, command, args, duration, chapter_context)

-- 章节级索引（由 /write 和 /track 自动写入）
chapter_entities   (chapter, volume, entity_type, entity_name, action)
scene_index        (chapter, scene_no, location, pov_character, mood, word_count)

-- 分析与修订历史
analysis_results   (chapter, analysis_type, score, issues_json, timestamp)
revision_history   (chapter, revision_round, layer, changes_summary, before_score, after_score)

-- 全文检索（SQLite FTS5）
chapter_fts        (chapter, volume, title, content)
```

**第三类：聚合缓存（可从第一类和第二类重算）**

角色总出场次数、各卷字数统计、伏笔解决率等。

### 3.2 MCP 工具集

**数据查询：**
- `query_characters` — 按卷/活跃状态/名字模糊搜索角色
- `query_timeline` — 按章节范围/时间范围/事件类型查询
- `query_relationships` — 按角色/关系类型/卷范围查询
- `query_plot` — 按状态（活跃/已解决）查询伏笔和情节线
- `query_facts` — 按类别/关键词搜索 story facts
- `query_chapter_entities` — 查询某章节出现的所有实体

**聚合统计：**
- `stats_volume` — 某卷的统计概览
- `stats_character` — 某角色的全局统计
- `stats_consistency` — 跨卷一致性检查报告

**全文检索：**
- `search_content` — FTS5 全文检索

**创作数据：**
- `log_writing_session` — 写入创作过程数据
- `query_analysis_history` — 查询分析历史和质量趋势
- `query_writing_stats` — 创作统计

**数据同步：**
- `sync_from_json` — 从 JSON 分片重建/更新 SQLite
- `sync_status` — 查看同步状态

### 3.3 数据流向

```
/write 完成 → 自动调用 MCP:
  1. log_writing_session (创作数据)
  2. sync_chapter_entities (章节实体索引)
  3. update_fts_index (全文索引)

/track 完成 → 自动调用 MCP:
  1. sync_from_json (同步 JSON → SQLite 镜像)

/analyze 完成 → 自动调用 MCP:
  1. log_analysis_result (分析历史)
```

## 4. JSON 分片存储结构

### 4.1 目录结构

```
spec/tracking/
├── story-facts.json          # 全局，体积可控
├── tracking-log.md           # 全局
├── summary/                  # Layer 2: 全局摘要
│   ├── characters-summary.json
│   ├── plot-summary.json
│   ├── timeline-summary.json
│   └── volume-summaries.json
├── volumes/                  # Layer 1: 分卷详情
│   ├── vol-01/
│   │   ├── character-state.json
│   │   ├── plot-tracker.json
│   │   ├── timeline.json
│   │   └── relationships.json
│   ├── vol-02/
│   │   └── ...
│   └── current → vol-03/    # 指向当前卷
└── novel-tracking.db         # SQLite 数据库
```

### 4.2 全局摘要文件

`characters-summary.json`：
```json
{
  "active": [
    { "name": "林逸", "role": "protagonist", "currentVolume": 3, "lastChapter": 287, "arcPhase": "成长期" }
  ],
  "archived": [
    { "name": "赵四", "role": "supporting", "exitVolume": 1, "exitChapter": 45, "reason": "死亡" }
  ],
  "totalCount": 67,
  "activeCount": 23
}
```

`volume-summaries.json`：
```json
{
  "volumes": [
    {
      "id": "vol-01",
      "title": "初入修真界",
      "chapters": "1-100",
      "wordCount": 250000,
      "keyEvents": ["获得天魂珠", "拜入青云宗", "击败赵四"],
      "unresolvedPlots": ["天魂珠来历", "父亲失踪之谜"],
      "newCharacters": 25,
      "exitedCharacters": 3
    }
  ]
}
```

### 4.3 迁移触发

- 阈值：任一 tracking JSON 超过 50KB 时，`/guide` 和 `/track` 自动提示
- 命令：`/track --migrate`（交互式）、`/track --migrate --auto`（自动按 100 章一卷）、`/track --migrate --volumes "1-100,101-250,251-400"`（自定义卷边界）
- 流程：备份 → 按卷拆分 → 生成摘要 → 初始化 SQLite → 验证完整性 → 删除原文件（保留备份）

## 5. 命令层改造

### 5.1 统一参数扩展

所有命令新增：
- `--volume vol-XX` — 限定操作范围到某卷
- `--range ch-XXX-YYY` — 限定章节范围
- 不带参数时默认操作当前卷

### 5.2 重点改造命令（6个）

**`/recap`**：
- 分层加载：`--brief` 只读 volume-summaries.json；默认读当前卷详情 + 前卷摘要；`--full vol-XX` 读指定卷详情
- MCP 优先：`query_characters --active` + `query_plot --status=open`

**`/track`**：
- `--sync` 改为增量同步（记录 last_sync_chapter）
- `--check` 支持 `--volume` 范围校验
- 写入时自动更新当前卷分片 + 全局摘要
- 新增 `--migrate` 迁移命令
- 完成后自动调用 MCP sync

**`/analyze`**：
- `--range` 实现明确化
- 新增 `--volume-report` 整卷分析
- 结果写入 SQLite analysis_results
- MCP 查询历史分数趋势对比

**`/facts`**：
- `/facts check` 支持 `--volume`/`--range`
- MCP 优先：`search_content` 全文检索验证一致性

**`/write`**：
- 上下文加载优化：MCP 查询当前卷活跃角色 + 最近 N 章实体 + 未解决伏笔
- 完成后自动触发 MCP 数据同步
- 新增 `--batch N` 批量写作（详见第 6 节）

**`/character`**：
- 新增 `archive` 子命令
- `list` 默认只显示活跃角色，`--all` 显示全部
- `show` 支持 `--volume`
- MCP 优先查询

### 5.3 轻度改造命令（5个）

- `/timeline` — 加 `--volume` 过滤，MCP 优先
- `/relations` — 加 `--volume` 和 `--focus <character>`
- `/revise` — 补充 MCP 查询分析历史
- `/checklist` — 加 `--volume` 范围限定
- `/guide` — 补充 MCP 统计数据用于推荐

### 5.4 无需改造命令（4个）

`/specify`、`/plan`、`/tasks`、`/constitution` — 操作规划层数据，不受章节规模影响。

### 5.5 三层 fallback 机制

每个命令的数据加载逻辑：
1. 尝试 MCP 查询（最优：精确、省 token）
2. 读取分片 JSON（次优：按卷加载，体积可控）
3. 读取单文件 JSON（兜底：完全兼容现有项目）

## 6. 批量写作设计（`/write --batch`）

### 6.1 调用方式

```
/write --batch 5              # 从当前进度连续写5章
/write --batch 5 --fast       # 批量快写模式
/write --batch ch-101-105     # 指定章节范围
/write --batch 5 --resume     # 从上次中断处继续
```

### 6.2 执行策略：流水线模式

**Phase 1：批量规划（一次性）**
- 读取 tasks.md + creative-plan.md
- 为 N 章生成简要大纲：每章核心事件、情绪走向
- 写入 batch-plan.json

**Phase 2：逐章执行（循环 N 次）**
- ① 加载上下文（MCP 查询 + 上一章尾段）
- ② 按 batch-plan 中该章大纲执行写作
- ③ 写入章节文件
- ④ 轻量 track 更新
- ⑤ MCP 同步（chapter_entities + FTS）
- ⑥ 更新 batch-progress.json

**Phase 3：批量收尾（一次性）**
- 批量章节间连贯性快检
- 更新全局摘要
- 更新 tasks.md
- 输出批量写作报告

### 6.3 上下文衔接

滚动窗口机制，每章上下文量恒定：
- 固定上下文：batch-plan + 当前卷角色/伏笔（MCP 查询）
- 滚动上下文：上一章最后 500-800 字 + 上一章 track 更新结果

### 6.4 中断恢复

`batch-progress.json`：
```json
{
  "batchId": "batch-20260213-001",
  "planned": ["ch-101", "ch-102", "ch-103", "ch-104", "ch-105"],
  "completed": ["ch-101", "ch-102"],
  "current": "ch-103",
  "status": "interrupted",
  "batchPlan": "spec/tracking/batch-plan.json"
}
```

### 6.5 质量控制

- 默认：每章写完后轻量检查（hook/连贯性），严重问题暂停
- `--strict`：每章跑完整 checklist，不通过则暂停
- `--fast`：跳过章间检查，最后统一检查

### 6.6 批量上限

单次 batch 建议不超过 10 章，超过建议分多次 batch。

## 7. 新增能力

### 7.1 `/volume-summary` 命令

```
/volume-summary                    # 生成当前卷摘要
/volume-summary vol-03             # 生成/更新指定卷摘要
/volume-summary --refresh-all      # 重新生成所有卷摘要
```

生成结构化摘要写入 volume-summaries.json：核心事件线、角色弧线变化、未解决伏笔、世界观变化、与前卷衔接点。

### 7.2 `/search` 命令

```
/search 天魂珠                     # 全文搜索
/search --character 林逸 --volume 3 # 角色出场搜索
/search --location 青云宗           # 场景搜索
/search --planted-before ch-100 --unresolved  # 未解决伏笔搜索
```

底层走 MCP search_content（FTS5）+ query_chapter_entities。MCP 不可用时 fallback 到 Glob + Grep。

### 7.3 `long-series-continuity` skill

自动激活条件：项目章节数 > 100。

职责：
- 写作时提醒当前章涉及角色的上次出场章节和状态
- 检测连贯性问题：称呼变化、设定矛盾、时间线跳跃
- 伏笔到期提醒：埋了 200 章未解决的伏笔

### 7.4 `/character archive` 子命令

```
/character archive 赵四 --reason "死亡" --chapter 45
/character archive --inactive 50    # 归档超过50章未出场的角色
```

## 8. 渐进式迁移与兼容性

### 8.1 项目生命周期三阶段

| 阶段 | 章节数 | 数据模式 | 特征 |
|------|--------|---------|------|
| 小型 | < 100 | 单文件，无 SQLite | 零额外开销 |
| 中型 | 100-300 | 提示迁移，可选 MCP | /guide 自动检测并提示 |
| 大型 | 300+ | 分片 + SQLite 标配 | 全部命令走 MCP 优先 |

### 8.2 `novelws init` 变化

```
novelws init my-novel                    # 默认：单文件模式
novelws init my-novel --with-mcp         # 启用 MCP + SQLite
novelws init my-novel --scale large      # 预设大型项目
```

### 8.3 `novelws upgrade` 变化

- 检测 tracking 文件大小
- 超过阈值：提示迁移
- 未超过：只更新命令模板
- MCP 作为可选项

### 8.4 MCP 插件管理

```
novelws plugin install mcp-tracking
novelws mcp start
novelws mcp status
novelws mcp rebuild
```
