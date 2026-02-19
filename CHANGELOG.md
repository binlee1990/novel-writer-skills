# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [5.0.0] - 2026-02-20

### Breaking Changes

- **架构全面重设计** — 从七步方法论（21 命令、55+ Skills、100+ 资源文件）重构为五命令流水线
- **概要先行架构** — 新增 `/write`（概要生成）+ `/expand`（正文扩写）两阶段写作流程
- **零 Skills 架构** — 移除全部 Agent Skills，所有逻辑内嵌于 5 个命令模板
- **移除插件系统** — 删除 `plugins/`、`packages/novelws-mcp/`、插件命令及相关源码
- **移除脚本系统** — 删除 `scripts/` 目录及所有 bash/powershell 脚本
- **资源文件精简** — 从 100+ 文件（craft/genres/styles/requirements/...）精简为 3 个核心文件
- **Tracking 精简** — 从 6+ 文件精简为 4 个核心 JSON 文件
- **旧项目不兼容** — v4 项目需重新 `novelws init`，无自动迁移路径

### Added

- **`/expand` 命令** — 将 200-500 字概要扩写为 3000-5000 字正文
  - 精准最小上下文加载（当前概要 + 前章末尾 + 出场角色 + 活跃伏笔 + 风格 + 反AI）
  - 总上下文控制在 2000-3000 字
  - 支持 `--batch N` 批量扩写

### Changed

- **`/specify`** — 重写为交互式故事定义（类型、概要、设定、角色、冲突、规模、风格）
- **`/plan`** — 重写为卷级大纲生成器（冲突、转折、高潮、钩子、角色变动、伏笔规划）
- **`/write`** — 重写为概要生成器（200-500 字剧情概要 + tracking 骨架更新）
  - 极简上下文：specification 摘要 + 当前卷大纲 + 前序标题列表 + 前一章概要
  - 支持 `--batch N` 批量生成（最大 20 章）
- **`/analyze`** — 重写为 5 项质量检查（概要符合度、角色一致性、伏笔完整性、连贯性、AI味检测）
- **CLAUDE.md** — 重写为五命令流水线规范
- **资源文件** — 精简为 3 个：`constitution.md`（创作宪法）、`style-reference.md`（风格参考）、`anti-ai.md`（反AI规范）
- **Tracking** — 精简为 4 个：`character-state.json`、`relationships.json`、`plot-tracker.json`、`timeline.json`
- **`config.ts`** — 移除 SPECIFY/SPEC/KNOWLEDGE_BASE/PLUGINS/MEMORY 等废弃常量
- **`init.ts`** — 移除 --plugins/--scale/--with-mcp 选项，简化为五命令结构
- **`upgrade.ts`** — 移除 skills/scripts/legacy 路径处理
- **`diagnostics.ts`** — 简化为 3 项检查（项目结构、tracking 文件、JSON 完整性）
- **`errors.ts`** — 移除 PluginNotFoundError 等 4 个插件相关错误类
- **`package.json`** — 移除 `files` 中的 `plugins` 条目，更新描述

### Removed

- **21 个命令模板** — constitution、clarify、tasks、track-init、track、recap、timeline、relations、revise、checklist、expert、facts、guide、help-me、character、search、volume-summary 等
- **55+ Agent Skills** — 全部 skills/ 目录（genre knowledge、writing techniques、quality assurance、analysis 等）
- **插件系统** — `src/plugins/`（manager、identifier、registry、validator、installers）、`src/commands/plugin.ts`、`plugins/` 目录
- **MCP 包** — `packages/novelws-mcp/` 整个目录
- **脚本系统** — `scripts/` 目录、`templates/resources/scripts/`
- **知识库** — `templates/knowledge/`、`templates/resources/craft/`、`genres/`、`styles/`、`requirements/` 等
- **资源子目录** — memory/、config/、emotional-beats/、character-archetypes/、references/、presets/
- **Tracking 文件** — story-facts.json、validation-rules.json、tracking-log.md、summary/ 目录
- **源码** — `src/utils/logger.ts`（未使用）
- **旧配置** — `.specify/` 目录

### Technical

- **测试** — 8 suites，67 个测试全部通过
- **构建** — TypeScript 编译零错误
- **项目结构** — templates/（commands + dot-claude + resources + tracking）、src/（cli + 3 commands + 4 core + 2 utils）

---

## [4.0.0] - 2026-02-17

### Breaking Changes

- **目录结构全面重组** — 从 6+ 层嵌套扁平化为 2-3 层顶级目录
  - `.specify/` → `resources/`（资源文件）
  - `spec/tracking/` → `tracking/`（追踪数据，提升至顶级）
  - `.specify/templates/knowledge-base/` → `resources/` 下对应子目录
  - `.specify/scripts/` → `resources/scripts/`
  - `.specify/templates/config/` → `resources/config/`
  - 旧项目需执行 `novelws upgrade` 迁移

### Added

- **扁平化项目结构** — 生成项目从 4-5 层嵌套简化为清晰的 3 目录布局
- **增量缓存加载机制** — `/write` 命令新增 L0/L1/L2 资源分层加载
- **MCP 配置修复** — `novelws init --with-mcp` 正确生成 `.claude/mcp-servers.json`
- **v3→v4 自动迁移** — `novelws upgrade` 自动检测旧 `.specify/` 结构并迁移

### Changed

- **config.ts** — 新增 `RESOURCES`、`CACHE` 目录常量
- **init.ts** — 重写初始化逻辑
- **diagnostics.ts** — 更新项目结构检测为 v4 路径
- **upgrade.ts** — 新增 v3→v4 迁移逻辑
- **54 个模板文件路径更新**

### Technical

- 21 suites，314 个测试全部通过

---

## [3.1.0] - 2026-02-15

### Added

- **writing-balance Skill** — 6 维度写作平衡评分系统
- **writing-techniques Skill** — 8 模块写作技巧教学
- **anti-ai-v5-balanced 规则** — 平衡版去 AI 规范
- **`/help-me` 命令** — 自然语言命令发现（50+ 场景映射）
- **`/guide` 命令增强** — 上下文感知推荐引擎
- **统一错误处理框架** — 4 个新错误类 + 诊断系统
- **5 个新 genre 知识库** — horror、youth、military、sports、workplace
- **AI 模型智能选择** — 8 个命令模板添加推荐模型字段

### Technical

- 312 个测试全部通过

---

## [3.0.0] - 2026-02-14

### Added

- **超长篇小说支持** — 三层数据架构（MCP → 分片 JSON → 单文件），100x-600x 性能提升
- **novelws-mcp 包** — 独立 MCP 服务器，SQLite + FTS5 全文搜索
- **`/track --migrate` 命令** — 单命令迁移数据到分片/MCP 模式
- **分片 JSON 系统** — 按卷分片，按需加载
- **12 个核心命令三层 Fallback 改造**
- **`/volume-summary` 命令** — 卷级摘要生成
- **`/search` 命令** — FTS5 全文搜索
- **long-series-continuity Skill** — 超长篇连贯性守护

### Technical

- 275 个测试全部通过

---

## [2.2.0] - 2026-02-13

### Changed

- **`/guide` 命令完全重写** — 三层优先级智能推荐引擎（P0/P1/P2）

---

## [2.1.1] - 2026-02-12

### Fixed

- **脚本目录路径修复**、PowerShell/Bash 脚本错误修复
- **模型配置不再硬编码**，新增 `--model` 参数

## [2.1.0] - 2026-02-12

### Changed

- **Token 优化** — 三大核心命令精简 76.9%（write 72.8%、analyze 84.1%、plan 70.5%）

### Added

- **CLAUDE.md 模板**、具象化检查文件、Auto-Tracking Skill、10 个分析 Skill、网文结构模板、卷级规划 Skill

---

## [2.0.1] - 2026-02-12

### Fixed

- **清理遗留引用** — 修复命令模板和脚本中引用不存在的文件/命令

---

## [2.0.0] - 2026-02-11

### Added

- **Phase 3: 高级创作引擎** — 多线叙事、声纹指纹、伏笔管理、风格一致性、智能推荐、创作统计、反馈循环、灵感管理

---

## [1.4.1] - 2026-02-11

### Fixed

- **命令模板路径修复** — 修复全部 17 个模板中的路径引用

---

## [1.4.0] - 2026-02-11

### Added

- **批量操作支持**、命令链式提示、Reader Expectation Skill 增强

---

## [1.3.0] - 2026-02-10

### Added

- **`/guide` 智能引导命令**、力量体系分析、网文结构模板、节奏健康检测、新增知识库

---

## [1.2.1] - 2026-02-10

### Added

- **`/character` 统一角色管理**、单卷详细规划、金手指子模式、Hook Checker Skill、断点续写

---

## [1.2.0] - 2026-02-10

### Added

- **快写模式**、Anti-AI 禁用词外置化、预测性提示、知识库扩展、核心架构重构、插件系统重构

---

## [1.1.1] - 2026-02-09

### Added

- 新增科幻和惊悚类型知识库及 Skills

---

## [1.0.0] - 2025-10-18

### Added

- 完整的七步方法论 Slash Commands（7 个核心命令 + 6 个追踪命令）
- Agent Skills 系统（Genre Knowledge + Writing Techniques + Quality Assurance）
- CLI 工具（init、check、upgrade、plugin）
- 完整文档体系
