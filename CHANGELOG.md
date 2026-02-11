# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

### Planned (Phase 3)

- 多线程叙事管理
- 角色声纹指纹系统
- 伏笔管理增强
- 风格一致性引擎增强
- 智能"下一步"推荐系统
- 创作数据统计
- 反馈循环增强
- 命令内容补全（timeline, relations, expert, tasks, checklist）
- 灵感扫描机制

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
