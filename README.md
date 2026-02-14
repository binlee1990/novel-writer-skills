# Novel Writer Skills - Claude Code 专用小说创作工具

[![npm version](https://badge.fury.io/js/novelws.svg)](https://www.npmjs.com/package/novelws)
[![Tests](https://github.com/binlee1990/novel-writer-skills/actions/workflows/test.yml/badge.svg)](https://github.com/binlee1990/novel-writer-skills/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> 专为 Claude Code 设计的 AI 智能小说创作助手
>
> 深度集成 Slash Commands 和 Agent Skills，提供网文和文学创作的最佳体验

## 核心特性

- **18 个 Slash Commands** - 七步方法论 + 角色管理 + 智能引导 + 命令发现 + 追踪验证
- **39 个 Agent Skills** - AI 自动激活的知识库、写作技巧、质量检查和专项分析
- **AI 去味智能化（NEW v3.1）** - 从"禁止列表"转向"智能平衡"
  - **writing-balance Skill**：6 维度评分系统（句长分布、词汇丰富度、描写层次、成语使用、句式变化、自然度）
  - **writing-techniques Skill**：8 模块写作技巧教学
  - **anti-ai-v5-balanced**：平衡版去 AI 规则，替代旧版禁止列表
- **用户体验提升（NEW v3.1）**
  - **`/help-me` 命令**：自然语言命令发现（50+ 场景映射）
  - **`/guide` 增强**：上下文感知推荐引擎
  - **统一错误框架**：4 种错误类型 + 修复建议
  - **诊断系统**：5 项自动检查 + 修复命令生成
- **AI 模型智能选择（NEW v3.1）** - 每个命令标注推荐模型（opus/sonnet/haiku）
- **超长篇小说支持（v3.0）** - 支持 300+ 章节超长篇创作
  - **三层数据架构**：MCP 服务器 + 分片 JSON + 单文件模式
  - **性能提升 100x-600x**：查询速度从秒级降至毫秒级
  - **智能分层**：根据项目规模自动选择最佳模式
  - **全文搜索**：FTS5 索引，500x 搜索加速
  - **卷级操作**：`/volume-summary`、`--volume vol-XX` 参数
  - **连贯性守护**：long-series-continuity Skill 自动监控
- **16 大类型知识库** - 言情、悬疑、玄幻、都市、游戏文、重生、武侠、历史、科幻、惊悚、恐怖、青春、军事、竞技、职场等
- **网文深度优化** - 爽点管理、钩子设计、节奏控制、智能 AI 去味
- **Token 优化** - 三大核心命令精简 77%，track 命令精简 35%，典型会话 token 消耗降低 76%
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

# 超长篇项目（100-300 章）- 启用分片模式
novelws init my-novel --scale large

# 超长篇项目（300+ 章）- 启用 MCP 服务器（最佳性能）
novelws init my-novel --with-mcp

# 指定命令使用的 AI 模型
novelws init my-novel --model claude-sonnet-4-5-20250929

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
| `/guide` | 智能引导 | 三层优先级推荐引擎（P0/P1/P2），上下文感知推荐，自动推荐唯一最佳下一步 + 备选操作 |
| `/help-me` | 命令发现（NEW v3.1）| 自然语言描述需求，智能匹配最佳命令（50+ 场景映射） |

### 追踪与验证

| 命令 | 功能 | 说明 |
|------|------|------|
| `/track-init` | 初始化追踪系统 | 创建 4 个 tracking JSON 文件 |
| `/track` | 综合追踪更新 | 支持 `--check` 节奏健康检测、`--sync` 批量同步、`--stats` 创作数据统计、`--migrate` 迁移到分片/MCP 模式 |
| `/recap` | 上下文重建 | 支持 `--brief` 快速模式、预测性提示 |
| `/timeline` | 时间线管理 | 时间线可视化、多线程时间对齐、时间冲突检测 |
| `/relations` | 角色关系追踪 | 关系图谱可视化、关系变化追踪、关系冲突检测 |
| `/volume-summary` | 卷级摘要（NEW v3.0）| 生成指定卷的摘要统计（角色出场、情节进度、伏笔状态） |
| `/search` | 全文搜索（NEW v3.0）| FTS5 全文搜索（需 MCP），500x 速度提升 |

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
| **Thriller** | 惊悚（悬念、紧张、心理博弈） |
| **Horror** | 恐怖（氛围营造、恐惧递进、心理恐怖）（NEW v3.1） |
| **Youth** | 青春（校园、成长、青涩情感）（NEW v3.1） |
| **Military** | 军事（战争、军旅、战术谋略）（NEW v3.1） |
| **Sports** | 竞技（体育、比赛、热血成长）（NEW v3.1） |
| **Workplace** | 职场（商战、职场博弈、行业深耕）（NEW v3.1） |

### 写作技巧（Writing Techniques）

| Skill | 功能 |
|-------|------|
| **Dialogue Techniques** | 对话自然度和角色声音 |
| **Scene Structure** | 场景构建和节奏控制 |
| **Character Arc** | 角色弧线和成长逻辑 |
| **Pacing Control** | 章内节奏检测、多章单调预警、满足间隔追踪 |
| **Reader Expectation** | 期待自动识别、满足/颠覆节奏规划、情绪预测曲线 |
| **Multi-Thread Narrative** | 多线叙事管理（视角切换、信息差追踪、叙事线交汇设计） |
| **Writing Balance（NEW v3.1）** | 6 维度写作平衡评分（句长分布、词汇丰富度、描写层次、成语使用、句式变化、自然度） |
| **Writing Techniques（NEW v3.1）** | 8 模块写作技巧教学（标点艺术、句式变化、描写手法、对话真实化、节奏控制、留白艺术、词汇丰富化、AI模式规避） |

### 写作工艺知识库（Craft Knowledge）

| 知识库 | 覆盖内容 |
|--------|---------|
| **Hook Design** | 6 种钩子类型、钩子链设计、章末钩子模板 |
| **Power System** | 力量体系设计框架、战斗标准化、升级节奏 |
| **Tension Management** | 紧张感管理（信息差、时间压力、两难抉择） |
| **Story Structures** | 4 种网文结构模板（升级流/副本流/任务流/日常流） |
| **Anti-AI v5 Balanced（v3.1）** | 智能平衡版去 AI 规则，6 维度评分替代简单禁止列表 |
| **Concretization** | 具象化写作检查清单、四维对照表、示例对比 |

### 智能检查（Quality Assurance）

| Skill | 功能 |
|-------|------|
| **Consistency Checker** | 一致性自动监控（角色、世界观、时间线） |
| **Hook Checker** | 5 维钩子评分（悬念强度、情感牵引、信息差、行动暗示、节奏适配） |
| **Voice Consistency Checker** | 对话一致性检查（语言指纹六维分析） |
| **Style Detector** | 风格基线建立、风格偏移检测、跨章节一致性评分 |
| **Workflow Guide** | 七步方法论引导 |
| **Long-Series Continuity（NEW v3.0）** | 超长篇连贯性守护（自动激活于 100+ 章项目）<br>四大监控：角色出场间隔、伏笔到期、设定一致性、称呼变化 |

### 专项分析（Analysis Skills）

按 `--focus` 参数按需加载，不占用基础 token：

| Skill | 触发参数 | 功能 |
|-------|---------|------|
| **Opening Analysis** | `--focus=opening` | 黄金开篇法则、钩子评估、前三章节奏 |
| **Pacing Analysis** | `--focus=pacing` | 冲突分布、爽点间隔、高潮放置 |
| **Character Analysis** | `--focus=character` | 角色弧追踪、一致性检查、关系网络 |
| **Foreshadow Analysis** | `--focus=foreshadow` | 伏笔埋设/回收追踪、密度评估 |
| **Logic Analysis** | `--focus=logic` | 时间线、因果、能力一致性、世界观 |
| **Style Analysis** | `--focus=style` | 词汇、句式、叙事风格 |
| **Reader Analysis** | `--focus=reader` | 爽点密度、钩子强度、信息投喂 |
| **Hook Analysis** | `--focus=hook` | 逐章钩子扫描、类型分布、回收率 |
| **Power Analysis** | `--focus=power` | 等级一致性、战力平衡、升级节奏 |
| **Voice Analysis** | `--focus=voice` | 对话一致性（语言指纹分析） |

### 自动化 Skills

| Skill | 功能 |
|-------|------|
| **Auto-Tracking** | 写作完成后自动更新 4 个 tracking 文件，记录日志 |
| **Volume Detail Planning** | 卷级详细规划流程（6 步）、多卷批量规划 |

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

### 智能 AI 去味（v3.1 升级）

- **6 维度写作平衡评分** - 句长分布、词汇丰富度、描写层次、成语使用、句式变化、自然度
- **智能平衡替代禁止列表** - 从"一刀切禁用"转向"评分引导"，保留创作自由度
- **8 模块写作技巧教学** - 标点艺术、句式变化、描写手法、对话真实化等
- **自然化写作原则** - 历史白描法、口语化处理、短句节奏、克制描写

### 网文结构模板

`/plan` 内置 4 种网文结构模板：

| 模板 | 适用类型 |
|------|---------|
| 升级流 | 修仙、玄幻、都市异能 |
| 副本流 | 游戏文、无限流 |
| 任务流 | 冒险、佣兵、赏金猎人 |
| 日常流 | 经营、种田、慢节奏 |

## Token 优化

v2.1.0 对三大核心命令进行了深度 token 优化，v3.1.0 进一步优化 track 命令：

| 命令 | 精简前 | 精简后 | 精简率 |
|------|--------|--------|--------|
| `/write` | 1,617 行 | 438 行 | 72.8% |
| `/analyze` | 2,071 行 | 329 行 | 84.1% |
| `/plan` | 1,286 行 | 380 行 | 70.5% |
| `/track`（v3.1） | 1,080 行 | 704 行 | 35% |

**典型会话**（`/write` ×5 + `/plan` ×1 + `/analyze` ×1）：~110,000 tokens → ~26,000 tokens（**节省 76%**）

### 优化策略

- **分层缓存**：共享规范放入 `CLAUDE.md`（system prompt 自动缓存，90% 折扣）
- **按需加载**：10 种专项分析、网文结构模板等提取为独立文件，仅在使用时读取
- **会话级复用**：已加载的资源在同一对话中复用，不重复读取
- **前文智能裁剪**：上一章 >1500 字时只保留最后 1000 字，配合 tracking 数据补充上下文

## AI 模型智能选择（NEW in v3.1）

v3.1.0 为每个命令标注了推荐模型，根据任务复杂度自动匹配最佳性价比：

| 级别 | 模型 | 适用命令 |
|------|------|---------|
| **深度分析** | opus | `/analyze --type=framework`、`/plan`、`/revise` |
| **平衡任务** | sonnet | `/write`、`/track --check`、`/character` |
| **速度优先** | haiku | `/track --sync`、`/search`、`/help-me` |

## 命令链式提示

每个命令执行完成后，自动推荐下一步操作：

```text
✅ /write chapter-05 完成

💡 下一步建议：
1️⃣ /write chapter-06 — 继续写作下一章
2️⃣ /analyze — 每5章执行一次质量分析（已写5章）
3️⃣ /recap --brief — 快速回顾上下文（如需刷新记忆）
```

所有 18 个命令均支持链式提示，形成完整的创作工作流图。

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
│   ├── CLAUDE.md          # 共享核心规范（自动缓存）
│   ├── commands/          # Slash Commands (18 个)
│   └── skills/            # Agent Skills (39 个)
│
├── .specify/              # Spec Kit 配置
│   ├── memory/
│   │   └── constitution.md
│   ├── scripts/           # 命令行脚本工具
│   │   ├── bash/
│   │   └── powershell/
│   └── templates/
│       ├── commands/
│       ├── knowledge-base/
│       │   ├── craft/          # 写作工艺 (hook-design, power-system, story-structures...)
│       │   ├── genres/         # 类型知识 (xuanhuan, urban, game-lit, rebirth...)
│       │   ├── requirements/   # 写作规范 (anti-ai-v4, concretization...)
│       │   └── styles/         # 写作风格
│       ├── skills/
│       │   ├── analysis/             # 10 种专项分析 Skills
│       │   ├── auto-tracking/        # 自动 Tracking 更新
│       │   ├── planning/             # 规划 Skills (volume-detail)
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
| **Slash Commands** | 7 个跨平台命令 | 18 个 Claude 优化命令 |
| **Agent Skills** | 不支持 | 39 个深度集成 |
| **智能检查** | 手动执行 | 自动监控 |
| **类型知识库** | 需手动查阅 | 15 种类型自动激活 |
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

# 升级项目（命令 + Skills + 脚本）
novelws upgrade

# 仅升级命令，并指定模型
novelws upgrade --commands --model claude-sonnet-4-5-20250929

# 仅升级脚本
novelws upgrade --scripts
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

## 超长篇小说支持（NEW in v3.0）

**v3.0.0 引入了全面的超长篇小说（300+ 章）支持能力**，通过三层数据架构实现 100x-600x 性能提升。

### 三层数据架构

系统根据项目规模自动选择最佳数据存储和加载方式：

| 层级 | 模式 | 适用规模 | 性能 | 说明 |
|-----|------|---------|------|------|
| **Layer 1** | 单文件 JSON | < 100 章 | 基准 | 默认模式，向下兼容 |
| **Layer 2** | 分片 JSON | 100-300 章 | **40倍提升** | 按卷分片，按需加载 |
| **Layer 3** | MCP 服务器 | > 300 章 | **100-600倍提升** | SQLite + FTS5，毫秒级查询 |

### 性能对比

| 操作 | 单文件模式 | 分片模式 | MCP 模式 |
|-----|---------|---------|---------|
| 加载 character-state | ~800 ms | ~20 ms (**40倍**) | ~3 ms (**266倍**) |
| 查询单个角色 | ~1000 ms | ~50 ms (**20倍**) | ~2 ms (**500倍**) |
| 搜索历史内容 | ~1200 ms | ~60 ms (**20倍**) | ~2 ms (**600倍**) |

### 如何启用

#### 新项目

```bash
# 100-300 章项目 - 启用分片模式
novelws init my-novel --scale large

# 300+ 章项目 - 启用 MCP 模式（最佳性能）
novelws init my-novel --with-mcp
```

#### 现有项目迁移

```bash
# 在 Claude Code 中执行
/track --migrate           # 自动检测并推荐迁移方案
/track --migrate --target sharded    # 迁移到分片 JSON
/track --migrate --target mcp        # 迁移到 MCP 模式
```

### 核心功能

#### 1. 分片 JSON 系统

```
spec/tracking/
├── summary/          # 全局摘要（跨卷查询入口）
│   ├── characters-summary.json
│   ├── plot-summary.json
│   ├── timeline-summary.json
│   └── volume-summaries.json
└── volumes/          # 分卷详情
    ├── vol-01/
    │   ├── character-state.json
    │   ├── plot-tracker.json
    │   ├── timeline.json
    │   └── relationships.json
    └── vol-02/
        └── ...
```

#### 2. MCP 查询工具

- **query_chapter_entities** - 查询指定章节的角色、地点、事件
- **query_plot** - 查询情节线、伏笔、钩子
- **query_facts** - 查询世界观知识库
- **search_content** - FTS5 全文搜索（500x 速度提升）

#### 3. 卷级操作

```bash
/volume-summary --volume vol-03   # 生成第 3 卷摘要
/analyze --range vol-05-07        # 分析第 5-7 卷
/track --volume vol-02            # 更新第 2 卷追踪数据
```

#### 4. 连贯性守护

**long-series-continuity Skill** 在 100+ 章项目中自动激活，监控：

- **角色出场间隔**：50 章未出场 → 警告，100 章 → 严重警告
- **伏笔到期**：200 章未回收 → 提醒，500 章 → 紧急提醒
- **设定一致性**：跨卷验证力量体系、世界观规则
- **称呼变化**：监控角色称呼/关系的合理性过渡

### 最佳实践

1. **< 100 章**：使用默认单文件模式，无需迁移
2. **100-300 章**：执行 `/track --migrate`，启用分片模式
3. **> 300 章**：安装 MCP 服务器（`--with-mcp`），获得最佳性能
4. **维护建议**：
   - 每写完一卷后执行 `/volume-summary`
   - 每 50 章执行 `/track --check` 深度检查
   - 使用 `/search` 快速定位历史内容
   - 关注 long-series-continuity skill 的提醒



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
