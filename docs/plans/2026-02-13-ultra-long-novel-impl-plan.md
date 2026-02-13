# 超长篇小说支撑优化 - 实现计划总览

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 让框架弹性支撑从几百章到 5000+ 章的超长篇小说创作，通过 JSON 分片 + 全局摘要 + MCP/SQLite 数据中枢三层架构实现。

**Architecture:** JSON 分片是 source of truth（人可读、git 可追踪），SQLite 作为数据中枢承担镜像索引 + 原生数据 + 全文检索，MCP server 提供精确查询接口。命令层统一支持 --volume/--range 参数，三层 fallback（MCP → 分片 JSON → 单文件 JSON）。

**Tech Stack:** TypeScript, better-sqlite3, MCP SDK (@modelcontextprotocol/sdk), Jest, PowerShell scripts

**Design Doc:** `docs/plans/2026-02-13-ultra-long-novel-support-design.md`

---

## 阶段划分

本项目分为 6 个阶段，每个阶段独立可交付、可测试。阶段间有依赖关系但每个阶段内部的任务可以并行。

### Phase 1: JSON 分片基础设施

**目标：** 建立分卷存储结构、全局摘要文件、迁移机制

**依赖：** 无（基础设施层，其他所有阶段依赖此阶段）

**涉及文件：**
- 新建: `templates/tracking/summary/characters-summary.json`
- 新建: `templates/tracking/summary/plot-summary.json`
- 新建: `templates/tracking/summary/timeline-summary.json`
- 新建: `templates/tracking/summary/volume-summaries.json`
- 修改: `src/core/config.ts` — 新增 summary/volumes 路径常量
- 修改: `src/commands/init.ts` — 支持 `--scale large` 和 `--with-mcp` 选项
- 修改: `src/commands/upgrade.ts` — 检测阈值并提示迁移
- 新建: `tests/unit/tracking/sharding.test.ts`

**任务清单：**
1. 创建 4 个全局摘要 JSON 模板文件
2. 在 `config.ts` 中新增 `summary`、`volumes` 路径到 `getProjectPaths()` 和 `getTemplateSourcePaths()`
3. 修改 `init.ts` 支持 `--scale large` 选项（创建 summary/ 和 volumes/vol-01/ 目录）
4. 修改 `init.ts` 支持 `--with-mcp` 选项（预留，Phase 2 实现 MCP 时填充）
5. 修改 `upgrade.ts` 添加 tracking 文件大小检测和迁移提示
6. 编写单元测试验证分片目录结构创建
7. 提交

---

### Phase 2: MCP Server 核心（novelws-mcp）

**目标：** 创建独立的 MCP server npm 包，实现 SQLite schema 和核心查询工具

**依赖：** Phase 1（需要分片目录结构）

**涉及文件：**
- 新建: `packages/novelws-mcp/` — 独立 npm 包目录
- 新建: `packages/novelws-mcp/package.json`
- 新建: `packages/novelws-mcp/tsconfig.json`
- 新建: `packages/novelws-mcp/src/index.ts` — MCP server 入口
- 新建: `packages/novelws-mcp/src/db/schema.ts` — SQLite schema 定义和初始化
- 新建: `packages/novelws-mcp/src/db/connection.ts` — 数据库连接管理
- 新建: `packages/novelws-mcp/src/tools/query-characters.ts`
- 新建: `packages/novelws-mcp/src/tools/query-timeline.ts`
- 新建: `packages/novelws-mcp/src/tools/query-relationships.ts`
- 新建: `packages/novelws-mcp/src/tools/query-plot.ts`
- 新建: `packages/novelws-mcp/src/tools/query-facts.ts`
- 新建: `packages/novelws-mcp/src/tools/query-chapter-entities.ts`
- 新建: `packages/novelws-mcp/src/tools/stats-volume.ts`
- 新建: `packages/novelws-mcp/src/tools/stats-character.ts`
- 新建: `packages/novelws-mcp/src/tools/stats-consistency.ts`
- 新建: `packages/novelws-mcp/src/tools/search-content.ts` — FTS5 全文检索
- 新建: `packages/novelws-mcp/src/tools/sync-from-json.ts`
- 新建: `packages/novelws-mcp/src/tools/sync-status.ts`
- 新建: `packages/novelws-mcp/src/tools/log-writing-session.ts`
- 新建: `packages/novelws-mcp/src/tools/query-analysis-history.ts`
- 新建: `packages/novelws-mcp/src/tools/query-writing-stats.ts`
- 新建: `packages/novelws-mcp/tests/`

**任务清单：**
1. 初始化 `packages/novelws-mcp/` 包结构（package.json, tsconfig.json）
2. 实现 SQLite schema（3 类表：镜像索引、原生数据、FTS5）
3. 实现数据库连接管理（创建、打开、关闭、重建）
4. 实现 MCP server 入口（注册所有工具）
5. 实现数据查询工具（6 个：characters, timeline, relationships, plot, facts, chapter_entities）
6. 实现聚合统计工具（3 个：volume, character, consistency）
7. 实现全文检索工具（search_content，基于 FTS5）
8. 实现数据同步工具（sync_from_json, sync_status）
9. 实现创作数据工具（log_writing_session, query_analysis_history, query_writing_stats）
10. 编写测试
11. 提交

---

### Phase 3: 迁移系统（/track --migrate）

**目标：** 实现从单文件到分片结构的迁移命令，包括数据拆分、摘要生成、SQLite 初始化

**依赖：** Phase 1 + Phase 2

**涉及文件：**
- 修改: `templates/commands/track.md` — 新增 `--migrate` 参数文档
- 新建: `templates/scripts/powershell/migrate-tracking.ps1` — 迁移辅助脚本
- 新建: `tests/unit/tracking/migration.test.ts`

**任务清单：**
1. 在 track.md 中添加 `--migrate` 模式的完整 prompt 指令
2. 创建 migrate-tracking.ps1 脚本（备份、拆分、验证）
3. 实现迁移流程：检测 → 备份 → 按卷拆分 → 生成摘要 → 初始化 SQLite → 验证
4. 支持三种迁移模式：交互式、--auto（100 章一卷）、--volumes 自定义边界
5. 编写测试
6. 提交

---

### Phase 4: 命令层改造（重点命令）

**目标：** 改造 6 个重点命令，支持 --volume/--range 参数和三层 fallback

**依赖：** Phase 1（分片结构）、Phase 2（MCP 工具可选）

**涉及文件：**
- 修改: `templates/commands/recap.md` — 分层加载、MCP 优先
- 修改: `templates/commands/track.md` — 增量同步、范围校验
- 修改: `templates/commands/analyze.md` — 范围明确化、卷报告
- 修改: `templates/commands/facts.md` — 范围校验、FTS 验证
- 修改: `templates/commands/write.md` — 上下文优化、批量写作、MCP 同步
- 修改: `templates/commands/character.md` — archive 子命令、活跃过滤
- 新建/修改: 对应的 PowerShell 脚本

**任务清单：**
1. 改造 `/recap` — 分层加载策略 + MCP fallback
2. 改造 `/track` — 增量同步 + --check --volume + MCP sync
3. 改造 `/analyze` — --range 明确化 + --volume-report + MCP 历史
4. 改造 `/facts` — /facts check --volume/--range + MCP FTS
5. 改造 `/write` — 上下文优化 + --batch N 批量写作 + MCP 同步
6. 改造 `/character` — archive 子命令 + 活跃过滤 + --volume
7. 编写测试验证命令模板的参数解析和 fallback 逻辑
8. 提交

---

### Phase 5: 命令层改造（轻度命令）+ 新增命令

**目标：** 改造 5 个轻度命令，新增 /volume-summary 和 /search 命令

**依赖：** Phase 1、Phase 4（模式一致性）

**涉及文件：**
- 修改: `templates/commands/timeline.md` — --volume 过滤
- 修改: `templates/commands/relations.md` — --volume + --focus
- 修改: `templates/commands/revise.md` — MCP 分析历史
- 修改: `templates/commands/checklist.md` — --volume 范围
- 修改: `templates/commands/guide.md` — MCP 统计 + 迁移提示
- 新建: `templates/commands/volume-summary.md`
- 新建: `templates/commands/search.md`

**任务清单：**
1. 改造 `/timeline` — --volume 过滤 + MCP 优先
2. 改造 `/relations` — --volume + --focus <character>
3. 改造 `/revise` — MCP 查询分析历史
4. 改造 `/checklist` — --volume 范围限定
5. 改造 `/guide` — MCP 统计数据 + 迁移阈值检测提示
6. 新建 `/volume-summary` 命令
7. 新建 `/search` 命令
8. 编写测试
9. 提交

---

### Phase 6: 新增 Skill + 集成测试 + 文档

**目标：** 新增 long-series-continuity skill，端到端集成测试，更新项目文档

**依赖：** Phase 1-5 全部完成

**涉及文件：**
- 新建: `templates/skills/quality-assurance/long-series-continuity/SKILL.md`
- 修改: `templates/dot-claude/CLAUDE.md` — 更新生成项目的规则文档
- 新建: `tests/integration/ultra-long-novel.test.ts`
- 修改: `src/commands/init.ts` — 复制新增的 summary 模板和 skill

**任务清单：**
1. 创建 `long-series-continuity` skill（自动激活条件：章节数 > 100）
2. 更新生成项目的 CLAUDE.md 模板，添加分片结构说明
3. 更新 init.ts 确保新增模板文件被正确复制
4. 编写集成测试（init --scale large → 验证目录结构 → 模拟迁移流程）
5. 提交

---

## 阶段依赖图

```
Phase 1 (JSON 分片基础设施)
  ├── Phase 2 (MCP Server)
  │     └── Phase 3 (迁移系统) ← 依赖 Phase 1 + 2
  ├── Phase 4 (重点命令改造) ← 依赖 Phase 1, Phase 2 可选
  │     └── Phase 5 (轻度命令 + 新命令) ← 依赖 Phase 1 + 4
  └── Phase 6 (Skill + 集成测试) ← 依赖 Phase 1-5
```

**可并行的阶段：**
- Phase 2 和 Phase 4 可以并行（Phase 4 的 MCP 部分先写 fallback，Phase 2 完成后补充 MCP 优先路径）
- Phase 3 需要等 Phase 1 + 2 都完成

## 执行说明

- 每个 Phase 有独立的详细实现计划文档，按需展开
- 所有脚本使用 **PowerShell**（不使用 Bash）
- 测试框架使用 **Jest**（不使用 vitest）
- 遵循 TDD：先写失败测试 → 实现 → 通过 → 提交
- 每个 Phase 完成后做 code review 再进入下一阶段
