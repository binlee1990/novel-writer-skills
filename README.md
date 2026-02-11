# Novel Writer Skills - Claude Code 专用小说创作工具

[![npm version](https://badge.fury.io/js/novelws.svg)](https://www.npmjs.com/package/novelws)
[![Tests](https://github.com/binlee1990/novel-writer-skills/actions/workflows/test.yml/badge.svg)](https://github.com/binlee1990/novel-writer-skills/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> 专为 Claude Code 设计的 AI 智能小说创作助手
>
> 深度集成 Slash Commands 和 Agent Skills，提供网文和文学创作的最佳体验

## 核心特性

- **17 个 Slash Commands** - 七步方法论 + 角色管理 + 智能引导 + 追踪验证
- **24 个 Agent Skills** - AI 自动激活的知识库、写作技巧和质量检查
- **8 大类型知识库** - 言情、悬疑、玄幻、都市、游戏文、重生、武侠、历史等
- **网文深度优化** - 爽点管理、钩子设计、节奏控制、反 AI 检测
- **智能资源加载** - 三层架构（推断 + 配置 + 关键词触发），按需加载
- **批量操作** - 多章节分析、多卷规划、批量同步追踪数据
- **命令链式提示** - 每个命令执行后自动推荐下一步操作
- **高级创作引擎** - 多线叙事管理、声纹指纹、伏笔健康度、风格一致性、智能推荐、反馈循环
- **创作数据统计** - 字数详情、角色出场频率、内容构成、伏笔状态、情节线进度
- **灵感管理** - 灵感扫描、灵感分配、灵感快速捕捉
- **插件系统** - 可扩展功能，如真实人声、翻译等

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

# 预装插件
novelws init my-novel --plugins authentic-voice
```

### 3. 在 Claude Code 中开始创作

在 Claude Code 中打开项目，使用斜杠命令：

```text
/constitution    # 1. 创建创作宪法
/specify         # 2. 定义故事规格
/clarify         # 3. 澄清关键决策
/plan            # 4. 制定创作计划
/tasks           # 5. 分解任务清单
/write           # 6. AI 辅助写作
/analyze         # 7. 质量验证分析
```

## Slash Commands 完整列表

### 七步方法论（核心流程）

| 命令 | 功能 | 说明 |
|------|------|------|
| `/constitution` | 创建创作宪法 | 定义最高创作原则 |
| `/specify` | 定义故事规格 | 支持 `--world` 世界观构建、`--feedback` 反馈接收 |
| `/clarify` | 澄清关键决策 | 5 个核心问题 |
| `/plan` | 制定创作计划 | 支持 `--detail vol-XX`、`--detail vol-XX-YY` 多卷规划、`--feedback` 反馈接收、网文结构模板 |
| `/tasks` | 分解任务清单 | 生成可执行的写作任务 |
| `/write` | 执行章节写作 | 支持 `--fast` 快写模式、断点续写、灵感扫描、智能推荐、自动 Tracking 更新 |
| `/analyze` | 质量验证分析 | 10 种专项分析、`--range` 批量分析、反馈建议 |

### 角色与引导

| 命令 | 功能 | 说明 |
|------|------|------|
| `/character` | 统一角色管理 | create / list / show / update / relate / voice / timeline |
| `/guide` | 智能引导 | 自动检测创作阶段，智能推荐引擎，未处理反馈提醒 |

### 追踪与验证

| 命令 | 功能 | 说明 |
|------|------|------|
| `/track-init` | 初始化追踪系统 | 创建 4 个 tracking JSON 文件 |
| `/track` | 综合追踪更新 | 支持 `--check` 节奏健康检测、`--sync` 批量同步、`--stats` 创作数据统计 |
| `/recap` | 上下文重建 | 支持 `--brief` 快速模式、预测性提示 |
| `/timeline` | 时间线管理 | 时间线可视化、多线程时间对齐、时间冲突检测 |
| `/relations` | 角色关系追踪 | 关系图谱可视化、关系变化追踪、关系冲突检测 |

### 修改与辅助

| 命令 | 功能 | 说明 |
|------|------|------|
| `/revise` | 系统性修改 | 四层修改（结构/节奏/一致性/润色） |
| `/checklist` | 质量检查清单 | 阶段性检查模板（写前/写后/卷末）、自动修复建议 |
| `/expert` | 专家咨询 | 五大领域专家（角色/情节/世界观/文笔/类型）+ 咨询流程 |

### `/analyze` 专项分析模式

| 模式 | 说明 |
|------|------|
| `--focus=opening` | 开篇专项（前 3 章） |
| `--focus=pacing` | 节奏专项（爽点/冲突分布） |
| `--focus=character` | 人物专项（人物弧光） |
| `--focus=foreshadow` | 伏笔专项（埋设与回收） |
| `--focus=logic` | 逻辑专项（逻辑漏洞） |
| `--focus=style` | 风格专项（文笔一致性） |
| `--focus=reader` | 读者体验（爽点密度、钩子强度、信息投喂） |
| `--focus=hook` | 钩子专项（章末钩子评分） |
| `--focus=power` | 力量体系（等级一致性、战力平衡） |
| `--focus=voice` | 对话一致性（角色声纹指纹分析） |
| `--range ch-XX-YY` | 批量章节范围分析 |
| `--range vol-XX` | 单卷分析 |
| `--range vol-XX-YY` | 多卷对比分析 |

## Agent Skills

### 类型知识库（Genre Knowledge）

当你提到特定类型时，相应的知识库会自动激活：

| 知识库 | 覆盖内容 |
|--------|---------|
| **Romance** | 言情小说惯例和情感节奏 |
| **Mystery** | 推理悬疑技巧和线索管理 |
| **Xuanhuan** | 玄幻修仙（力量体系、宗门、境界） |
| **Urban** | 都市现代（职场、城市、现实题材） |
| **Game-lit** | 游戏/系统文（面板、副本、系统设定） |
| **Rebirth** | 重生/穿越（前世记忆、蝴蝶效应、时间线） |
| **Wuxia** | 武侠（江湖、武功、侠义） |
| **Historical** | 历史（朝代、宫廷、考据） |
| **Sci-fi** | 科幻（太空、未来、星际） |
| **Thriller** | 惊悚（恐怖、悬念、紧张） |

### 写作技巧（Writing Techniques）

| Skill | 功能 |
|-------|------|
| **Dialogue Techniques** | 对话自然度和角色声音 |
| **Scene Structure** | 场景构建和节奏控制 |
| **Character Arc** | 角色弧线和成长逻辑 |
| **Pacing Control** | 章内节奏检测、多章单调预警、满足间隔追踪 |
| **Reader Expectation** | 期待自动识别、满足/颠覆节奏规划、情绪预测曲线 |
| **Multi-Thread Narrative** | 多线叙事管理（视角切换、信息差追踪、叙事线交汇设计） |

### 写作工艺知识库（Craft Knowledge）

| 知识库 | 覆盖内容 |
|--------|---------|
| **Hook Design** | 6 种钩子类型、钩子链设计、章末钩子模板 |
| **Power System** | 力量体系设计框架、战斗标准化、升级节奏 |
| **Tension Management** | 紧张感管理（信息差、时间压力、两难抉择） |
| **Anti-AI v4** | 200+ 禁用词、7 层去 AI 规范、替换策略 |

### 智能检查（Quality Assurance）

| Skill | 功能 |
|-------|------|
| **Consistency Checker** | 一致性自动监控（角色、世界观、时间线） |
| **Hook Checker** | 5 维钩子评分（悬念强度、情感牵引、信息差、行动暗示、节奏适配） |
| **Voice Consistency Checker** | 对话一致性检查（语言指纹六维分析） |
| **Style Detector** | 风格基线建立、风格偏移检测、跨章节一致性评分 |
| **Workflow Guide** | 七步方法论引导 |

## 智能资源加载

### 三层加载架构

系统采用三层智能资源加载机制，自动为你的创作提供所需知识：

**Layer 1: 智能推断**（自动加载）
- 根据 `specification.md` 中的 `genre`、`tone`、`target-audience` 等字段
- 自动加载对应的类型知识库和写作技巧
- 无需配置，开箱即用

**Layer 2: 配置覆盖**（可选）
- 在 `specification.md` 中添加 `resource-loading` 配置
- 精确控制每个命令加载哪些资源
- 适合有明确需求的场景

**Layer 3: 关键词触发**（运行时）
- AI 扫描你的输入、任务描述，识别关键词
- 实时提示："检测到'对话'关键词，是否加载对话技巧？[Y/N/S]"
- 你决定是否加载，灵活可控
- 关键词映射表支持自定义扩展（`keyword-mappings.json`）

### 配置示例

在 `stories/your-story/specification.md` 中添加：

```yaml
resource-loading:
  # 全局配置（所有命令）
  auto-load:
    knowledge-base:
      craft: [dialogue, scene-structure, show-not-tell, hook-design]
      genres: [xuanhuan]
    skills:
      writing-techniques: [dialogue-techniques, pacing-control]

  # 命令级配置（覆盖全局）
  write:
    knowledge-base:
      craft: [pacing, character-arc, tension-management]

  # 关键词触发配置
  keyword-triggers:
    enabled: true
    custom-mappings:
      "情感节奏": "knowledge-base/craft/pacing.md"
```

### 关键词触发示例

当你在 `/write` 或 `/plan` 时提到关键词，系统会提示：

```text
你: /write chapter-3 --focus 对话和情感节奏

AI: 🔍 检测到关键词触发：
    - "对话" → templates/knowledge-base/craft/dialogue.md
    - "节奏" → templates/knowledge-base/craft/pacing.md

    是否加载这些资源？
    [Y] 全部加载  [N] 跳过  [S] 选择性加载
```

### 完整文档

详细配置指南、四种场景示例（言情/悬疑/网文/严肃文学）、性能优化等：

[资源加载完整指南](docs/guides/resource-loading-guide.md)

## 网文创作特色功能

### 爽点与钩子管理

- **爽点密度统计** - 自动识别打脸、升级、逆袭等爽点类型，计算密度和间隔
- **钩子评分系统** - 5 维评分（悬念强度、情感牵引、信息差、行动暗示、节奏适配）
- **满足间隔追踪** - 监控读者期待的满足频率，防止拖沓

### 节奏控制

- **章内节奏检测** - 分析单章内的节奏变化（开场/发展/高潮/收尾）
- **多章单调预警** - 检测连续章节的节奏模式是否重复
- **节奏健康报告** - `/track --check` 生成节奏多样性、情绪曲线等指标

### 反 AI 检测

- **200+ 禁用词黑名单** - 基于腾讯朱雀标准实测
- **7 层去 AI 规范** - 禁用词、禁止句式、形容词限制、成语禁用、对话去 AI 化、段落结构、标点规范
- **自然化写作原则** - 历史白描法、口语化处理、短句节奏、克制描写

### 网文结构模板

`/plan` 内置 4 种网文结构模板：

| 模板 | 适用类型 |
|------|---------|
| 升级流 | 修仙、玄幻、都市异能 |
| 副本流 | 游戏文、无限流 |
| 任务流 | 冒险、佣兵、赏金猎人 |
| 日常流 | 经营、种田、慢节奏 |

## 命令链式提示

每个命令执行完成后，自动推荐下一步操作：

```text
✅ /write chapter-05 完成

💡 下一步建议：
1️⃣ /write chapter-06 — 继续写作下一章
2️⃣ /analyze — 每5章执行一次质量分析（已写5章）
3️⃣ /recap --brief — 快速回顾上下文（如需刷新记忆）
```

所有 17 个命令均支持链式提示，形成完整的创作工作流图。

## 插件系统

### 安装插件

```bash
# 列出可用插件
novelws plugin:list

# 安装插件
novelws plugin:add authentic-voice

# 移除插件
novelws plugin:remove authentic-voice
```

### 官方插件

- **authentic-voice** - 真实人声写作插件，提升原创度和生活质感
- 更多插件开发中...

## 项目结构

```text
my-novel/
├── .claude/
│   ├── commands/       # Slash Commands (17 个)
│   └── skills/         # Agent Skills (24 个)
│
├── .specify/           # Spec Kit 配置
│   ├── memory/
│   │   └── constitution.md
│   ├── scripts/        # 命令行脚本工具
│   │   ├── bash/
│   │   └── powershell/
│   └── templates/
│       ├── commands/
│       ├── knowledge-base/
│       │   ├── craft/          # 写作工艺 (hook-design, power-system, tension-management...)
│       │   ├── genres/         # 类型知识 (xuanhuan, urban, game-lit, rebirth...)
│       │   ├── requirements/   # 写作规范 (anti-ai-v4...)
│       │   └── styles/         # 写作风格
│       ├── skills/
│       │   ├── writing-techniques/   # 写作技巧 Skills
│       │   ├── quality-assurance/    # 质量检查 Skills
│       │   └── genre-knowledge/      # 类型知识 Skills
│       └── config/
│           └── keyword-mappings.json  # 关键词触发映射表
│
├── stories/
│   └── 001-my-story/
│       ├── specification.md
│       ├── creative-plan.md
│       ├── tasks.md
│       └── content/
│           ├── chapter-01.md
│           └── ...
│
├── spec/
│   ├── tracking/       # 追踪数据
│   │   ├── plot-tracker.json
│   │   ├── timeline.json
│   │   ├── character-state.json
│   │   ├── relationships.json
│   │   ├── write-checkpoint.json    # 断点续写
│   │   └── tracking-log.md          # 更新日志
│   │
│   └── knowledge/      # 知识库
│       ├── characters/
│       ├── worldbuilding/
│       └── references/
│
└── README.md
```

## 与 novel-writer 的关系

| 特性 | novel-writer | novel-writer-skills |
|------|-------------|-------------------|
| **支持平台** | 13个AI工具（Claude、Cursor、Gemini等） | Claude Code 专用 |
| **核心方法论** | 七步方法论 | 七步方法论 |
| **Slash Commands** | 7 个跨平台命令 | 17 个 Claude 优化命令 |
| **Agent Skills** | 不支持 | 24 个深度集成 |
| **智能检查** | 手动执行 | 自动监控 |
| **类型知识库** | 需手动查阅 | 10 种类型自动激活 |
| **网文优化** | 基础支持 | 深度优化（爽点/钩子/节奏/反AI） |
| **批量操作** | 不支持 | 多章分析/多卷规划/批量同步 |
| **适用场景** | 需要跨平台支持 | 追求最佳体验（Claude Code） |

**选择建议**：

- 如果你使用多个AI工具 → 选择 **novel-writer**
- 如果你专注 Claude Code → 选择 **novel-writer-skills**

## CLI 命令

### 项目管理

```bash
# 初始化项目
novelws init <project-name>

# 检查环境
novelws check

# 升级项目
novelws upgrade
```

### 插件管理

```bash
# 列出已安装插件
novelws plugin:list

# 安装插件
novelws plugin:add <plugin-name>

# 移除插件
novelws plugin:remove <plugin-name>
```

## 命令行脚本（可选）

除了 Claude Code 中的 Slash Commands，项目还包含命令行脚本工具：

### 脚本位置

初始化项目后，脚本位于：`.specify/scripts/`

```text
.specify/scripts/
├── bash/          # macOS/Linux 脚本
└── powershell/    # Windows 脚本
```

### 使用场景

- **命令行替代** - 在终端中直接执行七步方法论
- **自动化工作流** - 集成到 CI/CD 或批处理脚本
- **批量操作** - 处理多个故事或批量检查
- **独立使用** - 不依赖 Claude Code 的场景

### 快速示例

**macOS/Linux:**

```bash
# 创建宪法
bash .specify/scripts/bash/constitution.sh

# 定义规格
bash .specify/scripts/bash/specify-story.sh

# 追踪进度
bash .specify/scripts/bash/track-progress.sh
```

**Windows:**

```powershell
# 创建宪法
.\.specify\scripts\powershell\constitution.ps1

# 定义规格
.\.specify\scripts\powershell\specify-story.ps1

# 追踪进度
.\.specify\scripts\powershell\track-progress.ps1
```

### 何时使用脚本 vs Slash Commands

| 场景 | 推荐方式 |
|-----|---------|
| 日常创作、需要 AI 协助 | Slash Commands (优先) |
| 批量处理、自动化 | 命令行脚本 |
| CI/CD 集成 | 命令行脚本 |
| 快速检查验证 | 命令行脚本 |

[脚本详细文档](templates/scripts/README.md)

## 文档

- [入门指南](docs/guides/getting-started.md) - 详细安装和使用教程
- [命令详解](docs/guides/commands.md) - 所有命令的完整说明
- [Skills 指南](docs/guides/skills-guide.md) - Agent Skills 工作原理
- [资源加载指南](docs/guides/resource-loading-guide.md) - 三层资源加载配置
- [脚本工具集](templates/scripts/README.md) - 命令行脚本使用指南
- [插件开发](docs/plugin-development.md) - 如何开发自己的插件

## 贡献

欢迎提交 Issue 和 Pull Request！

项目地址：[https://github.com/binlee1990/novel-writer-skills](https://github.com/binlee1990/novel-writer-skills)

## 许可证

MIT License

## 致谢

本项目基于 [novel-writer](https://github.com/wordflowlab/novel-writer) 的方法论，专为 Claude Code 深度优化。

---

**Novel Writer Skills** - 让 Claude Code 成为你的最佳创作伙伴！
