# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2026-02-12

### Changed

- **Token 优化：三大核心命令精简 76.9%**
  - `write.md`: 1,617 → 438 行（72.8% 精简）
  - `analyze.md`: 2,071 → 329 行（84.1% 精简）
  - `plan.md`: 1,286 → 380 行（70.5% 精简）
  - 合计：4,974 → 1,147 行，典型会话 token 消耗从 ~110,000 降至 ~26,000

- **精简策略**
  - 重复的反 AI 规范、具象化检查清单、后置 Tracking 处理细节提取到独立文件
  - 三层资源加载中的 JavaScript 伪代码删除，保留执行指令
  - 会话级资源复用说明统一到 CLAUDE.md，各命令引用
  - 10 种专项分析从 analyze.md 提取为独立 Skill 文件（按需加载）
  - 4 种网文结构模板和卷级详细规划从 plan.md 提取到知识库/Skill 文件

### Added

- **`CLAUDE.md` 模板**（`templates/dot-claude/CLAUDE.md`）
  - 跨命令共享的核心写作规范（~55 行）
  - `novelws init` 自动生成到 `.claude/CLAUDE.md`
  - 利用 system prompt 缓存机制（90% 折扣），后续命令几乎零额外 token
  - 包含：反 AI 写作核心、段落格式规范、后置 Tracking 处理、会话级资源复用、前文内容加载策略、/compact 使用建议

- **具象化检查文件**（`templates/knowledge-base/requirements/concretization.md`）
  - 从 write.md 提取的完整具象化检查清单和示例
  - 时间/人物/数量/场景四维具象化对照表
  - 首次写作时按需加载

- **Auto-Tracking Skill**（`templates/skills/auto-tracking/SKILL.md`）
  - 从 write.md 提取的完整 Tracking 更新格式和流程
  - 4 个 JSON 文件（character-state, relationships, plot-tracker, timeline）的更新示例
  - tracking-log.md 日志格式模板
  - 错误处理策略

- **10 个分析 Skill 文件**（`templates/skills/analysis/*/SKILL.md`）
  - opening-analysis: 开篇分析（黄金开篇法则、钩子评估）
  - pacing-analysis: 节奏分析（冲突分布、爽点间隔、高潮放置）
  - character-analysis: 人物分析（角色弧追踪、一致性检查、关系网络）
  - foreshadow-analysis: 伏笔分析（埋设/回收追踪、密度评估）
  - logic-analysis: 逻辑分析（时间线、因果、能力一致性、世界观）
  - style-analysis: 风格分析（词汇、句式、叙事风格）
  - reader-analysis: 读者体验（爽点密度、钩子强度、信息投喂）
  - hook-analysis: 钩子分析（逐章钩子扫描、类型分布、回收率）
  - power-analysis: 力量体系（等级一致性、战力平衡、升级节奏）
  - voice-analysis: 对话一致性（语言指纹分析）

- **网文结构模板文件**（`templates/knowledge-base/craft/story-structures.md`）
  - 从 plan.md 提取的 4 种网文结构模板
  - 升级流/副本流/任务流/日常流的卷模板和爽点分布

- **卷级规划 Skill**（`templates/skills/planning/volume-detail/SKILL.md`）
  - 从 plan.md 提取的卷级详细规划流程（Step 1-6）
  - 多卷批量规划工作流
  - 灵感分配工作流

- **`src/core/config.ts`** — 新增 `dotClaude` 和 `claudeMd` 路径
- **`src/commands/init.ts`** — 新增 CLAUDE.md 复制逻辑

### Technical

- 162 个测试全部通过（从 161 增长到 162，新增 CLAUDE.md 生成测试）
- Agent Skills 从 24 个增长到 37 个（+10 分析 + 1 auto-tracking + 1 volume-detail + 1 planning 目录）

---

## [2.0.1] - 2026-02-12

### Fixed

- **清理遗留引用** — 全面排查并修复命令模板和脚本中引用不存在的文件/命令的问题
  - `outline.md` → `creative-plan.md`（7 个文件）：`/outline` 命令已合并到 `/plan`，但引用未同步更新
  - `/story` → `/specify`（6 个文件）：`/story` 命令已重命名为 `/specify`，脚本和模板中残留旧名称
  - `/plot-check` → `/checklist`（3 个文件）：`/plot-check` 已被统一的 `/checklist` 命令替代
  - `story.md` → `specification.md`（1 个文件）：`clarify.md` 的 `allowed-tools` 声明引用了旧文件名
- **文档同步更新** — `commands.md`、`getting-started.md` 中的废弃命令引用已修正

### Changed

- `src/commands/init.ts` 初始化提示：`/plot-check` 替换为 `/checklist`

---

## [2.0.0] - 2026-02-11

### Added

#### Phase 3: 高级创作引擎（13 个任务，全部完成）

- **多线叙事管理（Task 29）**
  - Multi-Thread Narrative Skill 扩展：视角切换规划、信息差追踪、叙事线交汇设计
  - `narrative-threads.json` 数据结构支持
  - `/track` 命令集成叙事线同步

- **角色声纹指纹系统（Task 30）**
  - 新增 Voice Consistency Checker Skill（对话一致性检查）
  - 语言指纹六维分析（词汇、句式、语气、口头禅、修辞、节奏）
  - `/analyze --focus=voice` 对话一致性专项分析

- **伏笔管理增强（Task 31）**
  - `/track` 伏笔健康度检测（伏笔热度、伏笔回收、伏笔链）
  - 紧急度量化评分和回收建议

- **风格一致性引擎增强（Task 32）**
  - Style Detector Skill 扩展：风格基线建立、风格偏移检测、跨章节风格一致性评分

- **智能"下一步"推荐系统（Task 33）**
  - `/guide` 智能推荐引擎（6 数据源、P0-P3 优先级）
  - `/write` 后置智能推荐（写完自动推荐下一步）

- **创作数据统计（Task 34）**
  - `/track --stats` 创作数据统计面板
  - 字数详情、角色出场频率、内容构成、伏笔状态、情节线进度

- **反馈循环增强（Task 35）**
  - `/analyze` 反馈建议模块（反馈分类、规格书/计划/任务反馈）
  - `/specify --feedback` 反馈接收模式
  - `/plan --feedback` 反馈接收模式
  - `/guide` 未处理反馈提醒

- **命令内容增强（Tasks 36-40）**
  - `/timeline` 时间线可视化、多线程时间对齐、时间冲突检测
  - `/relations` 关系图谱可视化、关系变化追踪、关系冲突检测
  - `/expert` 五大领域专家定义（角色塑造/情节设计/世界观构建/文笔提升/类型写作）+ 咨询流程
  - `/tasks` 任务优先级、任务依赖关系、从计划自动生成任务、任务完成度统计
  - `/checklist` 阶段性检查模板（写前/写后/卷末）、自定义检查项、自动修复建议

- **灵感扫描机制（Task 41）**
  - `/write` 灵感扫描（前置）+ 灵感状态更新 + 灵感快速捕捉
  - `/plan` 灵感分配建议
  - `ideas.json` 数据结构支持

### Changed

- **CLAUDE.md 新增开发规则**
  - Bash 最小化原则：禁止用 Bash 执行文件读写操作
  - 并行任务与共享文件的执行策略：subagent 并行改独立文件，主线程统一改共享文件

### Technical

- 161 个测试全部通过（从 150 增长到 161）
- 新增 11 个集成测试覆盖 Phase 3 全部功能

---

## [1.4.1] - 2026-02-11

### Fixed

- **命令模板路径修复** — 修复全部 17 个 Slash Command 模板中与生成项目实际目录结构不匹配的路径引用
  - `memory/` → `.specify/memory/`（constitution.md、style-reference.md 等）
  - `templates/knowledge-base/` → `.specify/templates/knowledge-base/`
  - `templates/skills/` → `.specify/templates/skills/`
  - `templates/config/` → `.specify/templates/config/`
  - `.claude/knowledge-base/` → `.specify/templates/knowledge-base/`
  - `scripts/bash/` → `.specify/scripts/bash/`
  - `stories/*/spec/tracking/` → `spec/tracking/`
  - 涉及文件：write.md、analyze.md、plan.md、track.md、specify.md、constitution.md、revise.md、checklist.md、character.md 等

- **`config.ts` knowledgeBase 路径修复** — `getProjectPaths()` 中 `knowledgeBase` 路径从 `.claude/knowledge-base` 修正为 `.specify/templates/knowledge-base`

### Changed

- **CLAUDE.md 新增开发规则**
  - 并发编辑规则：禁止多个 agent 同时编辑同一文件
  - 测试框架说明：明确使用 Jest（非 vitest），包含正确运行命令
  - 生成项目目录结构参考：完整目录树 + 关键路径映射表

---

## [1.4.0] - 2026-02-11

### Added

#### Phase 2 Batch 2: 批量操作与智能链接

- **批量操作支持**
  - `/plan --detail vol-XX-YY` 多卷规划
  - `/analyze --range ch-XX-YY` / `--range vol-XX` / `--range vol-XX-YY` 批量章节/卷分析
  - `/track --sync` 批量同步追踪数据

- **命令链式提示**
  - 全部 17 个命令模板新增"下一步建议"区块
  - 根据当前命令上下文智能推荐 2-3 个后续操作
  - 形成完整的创作工作流图

- **Reader Expectation Skill 增强**
  - 期待自动识别引擎（5 种类型：情节承诺、悬念、角色成长、关系、世界谜团）
  - 满足/颠覆节奏规划器（按类型推荐时间线）
  - 情绪预测曲线（逐章读者情绪预测）

- **keyword-mappings.json v1.2.0**
  - 新增 4 个关键词映射：tension-management、urban、game-lit、rebirth

---

## [1.3.0] - 2026-02-10

### Added

#### Phase 2 Batch 1: 网文深度优化

- **`/guide` 智能引导命令**
  - 自动检测创作阶段（规划期/写作期/修改期/完结期）
  - 根据项目状态推荐下一步操作
  - 新手友好的交互式引导

- **`/analyze --focus=power` 力量体系分析**
  - 等级一致性检查
  - 战力平衡分析
  - 升级节奏评估
  - 能力追踪与规则合规性

- **网文结构模板**
  - `/plan` 内置 4 种网文结构模板
  - 升级流（修仙/玄幻/都市异能）
  - 副本流（游戏文/无限流）
  - 任务流（冒险/佣兵/赏金猎人）
  - 日常流（经营/种田/慢节奏）

- **`/track --check` 节奏健康检测**
  - 节奏多样性评分
  - 满足间隔追踪
  - 钩子连续性检查
  - 情绪曲线分析

- **新增知识库**
  - `tension-management.md` - 紧张感管理（信息差、时间压力、两难抉择）
  - `urban.md` - 都市现代类型知识库
  - `game-lit.md` - 游戏/系统文类型知识库
  - `rebirth.md` - 重生/穿越类型知识库

- **Pacing Control Skill 增强**
  - 章内节奏检测（开场/发展/高潮/收尾）
  - 多章单调预警（连续章节节奏模式重复检测）
  - 满足间隔追踪（读者期待满足频率监控）

---

## [1.2.1] - 2026-02-10

### Added

#### Phase 1b: 角色管理与写作增强

- **`/character` 统一角色管理命令**
  - 7 个子命令：create / list / show / update / relate / voice / timeline
  - 替代分散的角色相关操作

- **`/plan --detail vol-XX` 单卷详细规划**
  - 按卷展开章节级别的详细计划
  - 支持卷内节奏设计

- **`/specify` 金手指子模式 + `--world` 世界观构建**
  - 金手指/系统设定专项定义
  - 世界观构建子模式（地理、势力、规则）

- **`power-system.md` 知识库**
  - 力量体系设计框架
  - 战斗标准化模板
  - 升级节奏指南

- **Hook Checker Skill**
  - 5 维钩子评分系统
  - 悬念强度、情感牵引、信息差、行动暗示、节奏适配

- **`/analyze --focus=hook` 钩子专项分析**
  - 章末钩子质量评估
  - 钩子类型分布统计

- **`/write` 断点续写机制**
  - 基于 `write-checkpoint.json` 的断点记录
  - 中断后自动恢复写作上下文

---

## [1.2.0] - 2026-02-10

### Added

#### Phase 1a: 网文核心功能

- **`/write --fast` 快写模式**
  - 简化输出，专注内容生成
  - 跳过详细分析步骤

- **Anti-AI 禁用词外置化**
  - 200+ 禁用词从模板中提取为独立配置
  - 基于腾讯朱雀标准实测

- **`/recap` 预测性提示**
  - 上下文重建时自动提示可能的后续操作
  - `--brief` 快速模式

- **`hook-design.md` 知识库**
  - 6 种钩子类型定义
  - 钩子链设计方法
  - 章末钩子模板

- **`xuanhuan.md` 知识库**
  - 玄幻修仙类型创作惯例
  - 力量体系、宗门、境界设定指南

- **`/analyze --focus=reader` 读者体验分析**
  - 爽点密度统计
  - 钩子强度评估
  - 信息投喂节奏分析

- **keyword-mappings.json 扩展**
  - 从 8 个映射扩展到 15 个
  - 新增 hook-design、xuanhuan、power-system 等映射

### Changed

- 核心架构重构（详见 1.2.0 原始条目）

#### 核心架构重构
- 新增 `src/core/` 核心层
  - `config.ts` - 统一配置管理，集中路径常量和默认值
  - `errors.ts` - 自定义错误类型层级（NovelWriterError 及子类）
  - `platform.ts` - 跨平台工具（tar 解压、临时目录）

#### 插件系统重构
- 新增抽象安装器架构
  - `installers/base.ts` - 安装器基类
  - `installers/npm.ts` - npm/scoped npm 包安装器
  - `installers/github.ts` - GitHub 仓库安装器
  - `installers/local.ts` - 本地 tarball 安装器
- 新增 `plugins/registry.ts` - 独立的插件注册表管理
- 新增 `plugins/identifier.ts` - 插件标识符解析器

#### CLI 命令模块化
- CLI 拆分为独立命令模块
  - `commands/init.ts` - 项目初始化命令
  - `commands/check.ts` - 环境检查命令
  - `commands/upgrade.ts` - 项目升级命令
  - `commands/plugin.ts` - 插件管理命令组

#### 工具层增强
- `logger.ts` - 新增日志级别过滤（debug/info/warn/error/silent）
- `version.ts` - 版本号缓存，移除 `import.meta.url` 依赖
- `project.ts` - 使用配置常量替代硬编码路径，抛出类型化错误

### Changed

- `cli.ts` 从 ~520 行精简为 ~58 行入口文件
- 插件系统从单文件重构为多模块架构
- 所有硬编码路径替换为 `core/config.ts` 常量
- `ensureProjectRoot()` 抛出 `ProjectNotFoundError` 替代通用 Error
- `postbuild` 脚本改为跨平台兼容
- `package.json` files 字段清理，移除不必要的源码和文档

### Technical

- 92 个测试全部通过（新增 6 个日志级别测试）
- ESM（生产）+ CJS（Jest）双模式兼容
- 消除所有 `import.meta.url` 在 CJS 环境下的兼容问题

---

## [1.1.1] - 2026-02-09

### Added

- 新增科幻和惊悚类型知识库及 Skills
- 新增 POV Validator、Continuity Tracker、Pacing Monitor Skills
- 扩展参考资料库（唐朝、现代职场、修仙世界）

---

## [1.0.0] - 2025-10-18

### Added

#### 核心功能
- 完整的七步方法论 Slash Commands
  - `/constitution` - 创建创作宪法
  - `/specify` - 定义故事规格
  - `/clarify` - 澄清关键决策
  - `/plan` - 制定创作计划
  - `/tasks` - 分解任务清单
  - `/write` - AI 辅助写作
  - `/analyze` - 质量验证分析

- 追踪与验证命令
  - `/track-init` - 初始化追踪系统
  - `/track` - 综合追踪更新
  - `/plot-check` - 情节一致性检查
  - `/timeline` - 时间线管理
  - `/relations` - 角色关系追踪
  - `/world-check` - 世界观验证

#### Agent Skills 系统
- Genre Knowledge Skills
  - Romance - 言情小说惯例和情感节奏
  - Mystery - 推理悬疑技巧和线索管理
  - Fantasy - 奇幻设定规范和世界构建

- Writing Techniques Skills
  - Dialogue Techniques - 对话自然度和角色声音
  - Scene Structure - 场景构建和节奏控制
  - Character Arc - 角色弧线和成长逻辑

- Quality Assurance Skills
  - Consistency Checker - 一致性自动监控
  - Workflow Guide - 七步方法论引导

#### CLI 工具
- 项目管理
  - `novelws init` - 初始化项目
  - `novelws check` - 检查环境
  - `novelws upgrade` - 升级项目

- 插件系统
  - `novelws plugin:list` - 列出已安装插件
  - `novelws plugin:add` - 安装插件
  - `novelws plugin:remove` - 移除插件

#### 文档
- 完整文档体系
  - README.md - 项目概览
  - Getting Started - 入门指南
  - Commands Guide - 命令详解
  - Skills Guide - Skills 指南
  - Plugin Development - 插件开发

### Features

- Claude Code 深度集成
- Agent Skills 自动激活机制
- 智能质量检查系统
- 可扩展插件架构
- 完整的项目模板

### Technical

- TypeScript 实现
- ES Module 支持
- Node.js >= 18.0.0
- 基于 Commander.js 的 CLI
- 完整的类型定义

---

## [Unreleased]

_暂无计划中的功能_

---

**注释**：
- 核心功能
- Agent Skills
- CLI 工具
- 文档
- 新特性
- 技术改进
- Bug 修复
- 安全更新
