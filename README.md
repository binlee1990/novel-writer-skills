# Novel Writer Skills - Claude Code 专用小说创作工具

[![npm version](https://badge.fury.io/js/novelws.svg)](https://www.npmjs.com/package/novelws)
[![Tests](https://github.com/binlee1990/novel-writer-skills/actions/workflows/test.yml/badge.svg)](https://github.com/binlee1990/novel-writer-skills/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> 专为 Claude Code 设计的 AI 智能小说创作助手
>
> 五命令流水线，从构思到成稿的极简创作体验

## 核心特性

- **五命令流水线** — specify → plan → write → expand → analyze，覆盖从构思到质检的完整创作流程
- **概要先行架构** — 先生成 200-500 字剧情概要，再扩写为 3000-5000 字正文，确保情节连贯
- **自动 Tracking** — 4 个 JSON 文件自动追踪角色状态、关系、情节线、时间线
- **精准上下文加载** — 每个命令只加载最小必要上下文，控制 token 消耗
- **质量检查** — 概要符合度、角色一致性、伏笔完整性、连贯性、AI味检测

## 快速开始

### 1. 安装

```bash
npm install -g novelws
```

### 2. 初始化项目

```bash
# 基本用法
novelws init my-novel

# 在当前目录初始化
novelws init --here

# 指定命令使用的 AI 模型
novelws init my-novel --model claude-sonnet-4-5-20250929
```

### 3. 在 Claude Code 中开始创作

在 Claude Code 中打开项目，使用斜杠命令：

```text
/specify    # 1. 定义故事设定、角色、世界观
/plan       # 2. 生成卷级大纲
/write      # 3. 逐章生成剧情概要
/expand     # 4. 将概要扩写为正文
/analyze    # 5. 质量检查
```

## 五命令流水线

| 命令 | 职责 | 输出 |
|------|------|------|
| `/specify` | 交互式定义故事核心要素 | `stories/<story>/specification.md` |
| `/plan` | 基于规格生成卷级大纲 | `stories/<story>/creative-plan.md` |
| `/write` | 逐章生成 200-500 字剧情概要 + tracking | `content/chapter-XXX-synopsis.md` |
| `/expand` | 将概要扩写为 3000-5000 字正文 | `content/chapter-XXX.md` |
| `/analyze` | 5 项质量检查，输出分析报告 | 终端输出 |

### /specify — 定义故事

交互式引导定义故事类型、一句话概要、核心设定、主角、配角、核心冲突、目标规模、写作风格。输出结构化的 `specification.md`。

### /plan — 生成大纲

将 specification.md 转化为卷级大纲，为每卷规划核心冲突、转折点、高潮事件、结尾钩子、角色变动、伏笔规划。

### /write — 生成概要

为每章生成 200-500 字纯剧情概要，包含核心事件、出场角色、情感走向、章末钩子。同步更新 4 个 tracking 文件。

支持批量模式：`/write 1 --batch 20` 一次生成 20 章概要。

### /expand — 扩写正文

将概要扩写为 3000-5000 字完整正文。精准加载当前章概要、前章末尾、出场角色状态、活跃伏笔、风格参考、反AI规范。总上下文控制在 2000-3000 字。

支持批量模式：`/expand 1 --batch 10`。

### /analyze — 质量检查

5 项检查：

| 检查项 | 说明 |
|--------|------|
| 概要符合度 | 正文是否忠实于概要 |
| 角色一致性 | 角色行为是否符合 tracking 记录 |
| 伏笔完整性 | 伏笔是否按计划埋设/回收 |
| 连贯性 | 与前后章的衔接是否自然 |
| AI味检测 | 高频词、句式重复、空洞描写 |

支持范围分析：`/analyze --range 1-20`。

## 资源文件

| 文件 | 用途 | 加载阶段 |
|------|------|---------|
| `resources/constitution.md` | 创作宪法，定义最高创作原则 | /specify |
| `resources/style-reference.md` | 风格参考，叙述视角/语言/节奏 | /expand |
| `resources/anti-ai.md` | 反AI写作规范 | /expand |

## Tracking 系统

4 个 JSON 文件自动维护创作数据：

| 文件 | 内容 |
|------|------|
| `tracking/character-state.json` | 角色状态（身份、位置、状态、最后出场） |
| `tracking/relationships.json` | 角色关系（类型、状态、最后更新） |
| `tracking/plot-tracker.json` | 情节线和伏笔（状态、关键章节） |
| `tracking/timeline.json` | 时间线事件 |

- `/write` 完成后自动更新 tracking 骨架
- `/expand` 完成后补充 tracking 细节

## 项目结构

```text
my-novel/
├── .claude/
│   ├── CLAUDE.md              # 共享核心规范
│   └── commands/              # 5 个 Slash Commands
│       ├── specify.md
│       ├── plan.md
│       ├── write.md
│       ├── expand.md
│       └── analyze.md
│
├── resources/                 # 3 个资源文件
│   ├── constitution.md
│   ├── style-reference.md
│   ├── anti-ai.md
│   └── config.json
│
├── tracking/                  # 4 个 tracking 文件
│   ├── character-state.json
│   ├── relationships.json
│   ├── plot-tracker.json
│   └── timeline.json
│
└── stories/
    └── <story>/
        ├── specification.md
        ├── creative-plan.md
        └── content/
            ├── chapter-001-synopsis.md
            ├── chapter-001.md
            └── ...
```

## CLI 命令

```bash
# 初始化项目
novelws init <project-name>
novelws init --here
novelws init my-novel --model claude-sonnet-4-5-20250929

# 检查环境
novelws check

# 升级项目（更新命令和资源文件）
novelws upgrade
```

## 贡献

欢迎提交 Issue 和 Pull Request！

项目地址：[https://github.com/binlee1990/novel-writer-skills](https://github.com/binlee1990/novel-writer-skills)

## 许可证

MIT License
