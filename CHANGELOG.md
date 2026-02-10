# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-02-10

### Added

#### 核心架构重构
- 🛠️ 新增 `src/core/` 核心层
  - `config.ts` - 统一配置管理，集中路径常量和默认值
  - `errors.ts` - 自定义错误类型层级（NovelWriterError 及子类）
  - `platform.ts` - 跨平台工具（tar 解压、临时目录）

#### 插件系统重构
- 🔌 新增抽象安装器架构
  - `installers/base.ts` - 安装器基类
  - `installers/npm.ts` - npm/scoped npm 包安装器
  - `installers/github.ts` - GitHub 仓库安装器
  - `installers/local.ts` - 本地 tarball 安装器
- 🔌 新增 `plugins/registry.ts` - 独立的插件注册表管理
- 🔌 新增 `plugins/identifier.ts` - 插件标识符解析器

#### CLI 命令模块化
- 📦 CLI 拆分为独立命令模块
  - `commands/init.ts` - 项目初始化命令
  - `commands/check.ts` - 环境检查命令
  - `commands/upgrade.ts` - 项目升级命令
  - `commands/plugin.ts` - 插件管理命令组

#### 工具层增强
- 🛠️ `logger.ts` - 新增日志级别过滤（debug/info/warn/error/silent）
- 🛠️ `version.ts` - 版本号缓存，移除 `import.meta.url` 依赖
- 🛠️ `project.ts` - 使用配置常量替代硬编码路径，抛出类型化错误

### Changed

- `cli.ts` 从 ~520 行精简为 ~58 行入口文件
- 插件系统从单文件重构为多模块架构
- 所有硬编码路径替换为 `core/config.ts` 常量
- `ensureProjectRoot()` 抛出 `ProjectNotFoundError` 替代通用 Error
- `postbuild` 脚本改为跨平台兼容
- `package.json` files 字段清理，移除不必要的源码和文档

### Technical

- 🛠️ 92 个测试全部通过（新增 6 个日志级别测试）
- 🛠️ ESM（生产）+ CJS（Jest）双模式兼容
- 🛠️ 消除所有 `import.meta.url` 在 CJS 环境下的兼容问题

---

## [1.1.1] - 2026-02-09

### Added

- 🤖 新增科幻和惊悚类型知识库及 Skills
- 🤖 新增 POV Validator、Continuity Tracker、Pacing Monitor Skills
- 📚 扩展参考资料库（唐朝、现代职场、修仙世界）

---

## [1.0.0] - 2025-10-18

### Added

#### 核心功能
- 🎯 完整的七步方法论 Slash Commands
  - `/constitution` - 创建创作宪法
  - `/specify` - 定义故事规格
  - `/clarify` - 澄清关键决策
  - `/plan` - 制定创作计划
  - `/tasks` - 分解任务清单
  - `/write` - AI 辅助写作
  - `/analyze` - 质量验证分析

- 📊 追踪与验证命令
  - `/track-init` - 初始化追踪系统
  - `/track` - 综合追踪更新
  - `/plot-check` - 情节一致性检查
  - `/timeline` - 时间线管理
  - `/relations` - 角色关系追踪
  - `/world-check` - 世界观验证

#### Agent Skills 系统
- 🤖 Genre Knowledge Skills
  - Romance - 言情小说惯例和情感节奏
  - Mystery - 推理悬疑技巧和线索管理
  - Fantasy - 奇幻设定规范和世界构建

- ✍️ Writing Techniques Skills
  - Dialogue Techniques - 对话自然度和角色声音
  - Scene Structure - 场景构建和节奏控制
  - Character Arc - 角色弧线和成长逻辑

- 🔍 Quality Assurance Skills
  - Consistency Checker - 一致性自动监控
  - Workflow Guide - 七步方法论引导

#### CLI 工具
- 📦 项目管理
  - `novelws init` - 初始化项目
  - `novelws check` - 检查环境
  - `novelws upgrade` - 升级项目

- 🔌 插件系统
  - `novelws plugin:list` - 列出已安装插件
  - `novelws plugin:add` - 安装插件
  - `novelws plugin:remove` - 移除插件

#### 文档
- 📚 完整文档体系
  - README.md - 项目概览
  - Getting Started - 入门指南
  - Commands Guide - 命令详解
  - Skills Guide - Skills 指南
  - Plugin Development - 插件开发

### Features

- ✨ Claude Code 深度集成
- ✨ Agent Skills 自动激活机制
- ✨ 智能质量检查系统
- ✨ 可扩展插件架构
- ✨ 完整的项目模板

### Technical

- 🛠️ TypeScript 实现
- 🛠️ ES Module 支持
- 🛠️ Node.js >= 18.0.0
- 🛠️ 基于 Commander.js 的 CLI
- 🛠️ 完整的类型定义

---

## [Unreleased]

### Planned

- 📝 更多类型 Skills（科幻、惊悚、历史等）
- 📝 更多写作技巧 Skills
- 📝 高级质量检查功能
- 📝 更多官方插件
- 📝 示例项目和教程

---

**注释**：
- 🎯 核心功能
- 🤖 Agent Skills
- 📦 CLI 工具
- 📚 文档
- ✨ 新特性
- 🛠️ 技术改进
- 🐛 Bug 修复
- 🔒 安全更新

