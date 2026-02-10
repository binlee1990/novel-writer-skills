# Templates 体系全面升级设计文档

> 日期：2026-02-10
> 目标：为创作者提供最智能最全面的 AI 小说创作助手
> 定位：以网文为主，兼顾严肃文学

---

## 一、当前体系概况

### 1.1 现有资产

| 类别 | 数量 | 总行数 |
|------|------|--------|
| Command Templates | 15 | ~12,000 |
| Knowledge Base (Craft) | 5 | ~5,671 |
| Knowledge Base (Genres) | 7 | ~4,000+ |
| Knowledge Base (Character Archetypes) | 17 | ~5,000+ |
| Knowledge Base (Emotional Beats) | 27 | ~8,000+ |
| Knowledge Base (Styles) | 6 | ~3,247 |
| Knowledge Base (Requirements) | 9 | ~2,000+ |
| Knowledge Base (References) | 20+ | ~4,000+ |
| Agent Skills | 24 | ~6,000+ |
| 自动化脚本 | 15+ | ~2,000+ |
| 配置文件 (keyword-mappings.json) | 1 | 107 |

### 1.2 现有七步方法论

```
/constitution → /specify → /clarify → /plan → /tasks → /write → /analyze
```

辅助命令：`/track-init`, `/track`, `/timeline`, `/relations`, `/checklist`, `/revise`, `/recap`, `/expert`

---

## 二、结构性缺口（2 个新命令 + 3 项现有命令增强）

> **审查修订 [2026-02-10]**：原设计提出 5 个新命令，经审查后收敛为 2 个新命令 + 3 项现有命令增强，避免命令膨胀和职责重叠。

### 2.1 `/specify --world` — 世界观构建子模式（原 `/worldbuild`）

**变更理由**：`/plan` 已有 `2.4 世界观构建` 章节，`/specify` Level 4 也有世界观内容。独立命令会导致三处维护世界观数据，同步成本高。改为 `/specify` 的子模式，入口统一。

**问题**：当前世界观只是 `/specify` 的一个章节和 `/plan` 的一小节，对网文来说远远不够。修仙体系、异能等级、势力分布是读者留存的核心。

**设计要点**：
- 作为 `/specify` 的专项子模式，用法：`/specify --world` 或 `/specify --world 修仙体系`
- 力量体系设计（等级划分、战力标准、升级条件、能力限制）
- 势力架构（组织层级、势力关系、资源分布）
- 地理设定（地图逻辑、区域特色、移动规则）
- 经济系统（货币、资源、交易规则）
- 规则与禁忌（世界运行法则、不可违反的规则）
- 生成 `world-setting.json` 供后续命令引用
- 世界观数据自动回写到 `specification.md` 的世界观章节

**输出文件**：
- `stories/[name]/spec/world-setting.json` — 结构化世界观数据（与 tracking 目录同级）
- `specification.md` 的世界观章节同步更新

**与现有体系的关系**：
- `/specify --world` 生成的数据 → `/plan` 的 `2.4 世界观构建` 自动引用
- `/write` 的查询协议第 4 层自动加载 `world-setting.json`
- `/analyze --focus=power` 基于 `world-setting.json` 做一致性检测

### 2.2 `/character` — 角色卡管理命令（新增）

**问题**：角色信息分散在 `specification.md`（定义）、`character-state.json`（状态）、`relationships.json`（关系）三处，没有统一管理入口。

**设计要点**：
- 统一角色卡：人设、外貌、性格、能力、秘密、语言指纹、弧线规划
- 操作模式：`create`（创建）、`show`（查看）、`update`（更新）、`list`（列表）、`compare`（对比）
- 语言指纹定义：常用词汇、句式偏好、口头禅、语气特征、文化水平
- 角色关系快速查询：`/character 张三 --relations`
- 角色出场统计：`/character --stats`

**输出文件**（与现有 tracking 系统对齐）：
- `stories/[name]/spec/tracking/character-profiles.json` — 角色档案（新增，与 character-state.json 同目录）
- `/character show 张三` 聚合展示：`character-profiles.json` + `character-state.json` + `relationships.json`

**与现有 tracking 系统的关系**：
- `character-profiles.json`（新增）：静态信息（人设、外貌、性格、能力、语言指纹）
- `character-state.json`（已有）：动态状态（当前位置、情绪、关键状态变化）
- `relationships.json`（已有）：关系网络（角色间关系、强度、变化历史）
- 三个文件各司其职，`/character` 命令作为统一查询和管理入口

### 2.3 `/plan` 卷级规划增强（原 `/outline`）

**变更理由**：`/plan` 已包含章节架构设计（分卷安排、情绪曲线、线索分布），新增独立 `/outline` 命令会导致边界模糊。改为增强 `/plan` 的分层规划能力。

**问题**：当前 `/plan` 直接从规格跳到章节级别，缺少「总大纲 → 卷大纲 → 章节大纲」三级结构。

**设计要点**：
- `/plan` 默认行为改为「总大纲 + 卷大纲」（宏观规划）
- `/plan --detail vol-01` 生成特定卷的章节级规划
- `/plan --detail vol-01-03` 批量生成多卷章节规划
- 三级大纲体系：
  - Level 1：总大纲（全书主线、卷划分、核心转折点）— `/plan` 默认输出
  - Level 2：卷大纲（每卷的目标、冲突、高潮、角色弧线）— `/plan` 默认输出
  - Level 3：章节大纲（具体章节的场景、节奏、任务）— `/plan --detail vol-XX`
- 每卷包含：卷名、字数目标、核心冲突、爽点规划、伏笔计划、角色发展目标
- 卷间衔接设计：上一卷的遗留问题、本卷的新引入、钩子传递
- 支持「滚动规划」：详细规划当前卷和下一卷，后续卷只做粗略规划

**输出文件**：
- `stories/[name]/creative-plan.md` — 总大纲 + 卷大纲（增强现有文件）
- `stories/[name]/volumes/vol-XX-plan.md` — 卷级章节详细规划（新增）

### 2.4 灵感扫描机制（原 `/note` 命令，降级简化）

**变更理由**：CLI 环境下用户可以用任何文本编辑器快速记录灵感，独立命令的 ROI 低。核心价值不在「记录」而在「关联提示」。改为目录扫描机制，不新增命令。

**设计要点**：
- 用户在 `stories/[name]/notes/` 目录下自由创建 markdown 文件（用任何编辑器）
- `/write` 执行时自动扫描 `notes/` 目录，匹配当前章节相关的灵感并提示
- `/plan` 执行时自动扫描 `notes/` 目录，提示未使用的情节灵感
- 匹配规则：基于文件名关键词 + 文件内容关键词 + 当前章节涉及的角色/场景
- 灵感使用后，在文件头部标记 `status: used`（手动或由 `/write` 自动标记）

**约定格式**（推荐但不强制）：
```markdown
---
tags: [角色, 张三]
status: pending
---
张三其实是卧底，在第三卷揭示。
```

**无需新增命令**，仅需：
- `/write` 前置检查增加 `notes/` 目录扫描步骤
- `/plan` 前置加载增加 `notes/` 目录扫描步骤

### 2.5 `/guide` — 智能引导命令（新增，保持不变）

**问题**：新用户面对 17+ 个命令完全不知道从哪开始。

**设计要点**：
- 根据用户状态自动推荐下一步：
  - 「我有个想法」→ `/specify`
  - 「我有大纲了」→ `/specify` (Level 3+) → `/clarify`
  - 「我写了几章想继续」→ `/recap` → `/write`
  - 「我想检查质量」→ `/analyze`
- 项目健康度检查：哪些文件缺失、哪些数据过期、哪些步骤被跳过
- 命令序列推荐：基于当前项目状态推荐最优命令序列
- 首次使用引导：交互式问答，帮助创作者完成第一个项目的初始化

---

## 三、现有命令优化（15+ 项）

### 3.1 `/write` 命令优化

> **审查修订 [2026-02-10]**：反 AI 规范外置策略细化——仅外置数据部分（禁用词表、替换策略表），保留执行逻辑（段落结构规范、自然化写作原则）。原因：段落结构规范和自然化原则是写作执行时的核心约束，不应与执行流程分离。

| 优化项 | 描述 | 优先级 |
|--------|------|--------|
| 反 AI 规范数据外置 | 将 `write.md` 中的**禁用词黑名单**（~774-781行）和**替换策略表**（~775-781行）移至 `requirements/anti-ai-v4.md`（已存在，需去重合并）；**段落结构规范**（~699-731行）和**自然化写作原则**（~739-766行）保留在 `write.md` 中 | P0 |
| 断点续写机制 | 写作过程中保存中间状态，session 断开后可恢复 | P0 |
| 具象化前置 | 将事后检查改为写作约束，从源头避免抽象表达 | P1 |
| 字数节奏控制 | 增加段落字数分配指导（开场/发展/高潮/收尾比例） | P1 |
| 快写模式 | `/write --fast` 跳过大部分前置检查，直接开写（仅加载：上一章内容 + 角色状态 + 当前任务） | P0 |
| 续写衔接分析 | 不只是 recap 信息汇总，而是分析上一章的情绪走向、未完成动作、读者期待 | P1 |
| 灵感扫描 | 写作前自动扫描 `notes/` 目录，匹配当前章节相关灵感并提示（见 2.4 节） | P2 |

### 3.2 `/plan` 命令优化

> **审查修订 [2026-02-10]**：原 `/outline` 独立命令的卷级规划能力合并到 `/plan`，新增「与卷大纲集成」项。

| 优化项 | 描述 | 优先级 |
|--------|------|--------|
| 卷级规划能力 | `/plan` 默认输出改为「总大纲 + 卷大纲」；`/plan --detail vol-XX` 生成特定卷的章节级规划（原 `/outline` 功能，见 2.3 节） | P0 |
| 爽点节奏规划 | 增加「爽点/打脸/升级/获得」的节奏规划，确保每 N 章有爽点 | P0 |
| 钩子设计 | 每章结尾钩子的类型和强度规划 | P0 |
| 网文结构模板 | 增加「升级流」「副本流」「任务流」「日常流」等网文常用结构 | P1 |
| 灵感扫描 | 规划时自动扫描 `notes/` 目录，提示未使用的情节灵感（见 2.4 节） | P2 |

### 3.3 `/analyze` 命令优化

> **审查修订 [2026-02-10]**：新增专项分析应优先复用现有 Skills（reader-expectation、pacing-control、consistency-checker），而非从零构建。

| 优化项 | 描述 | 复用的现有 Skill | 优先级 |
|--------|------|-----------------|--------|
| 读者体验分析 | 新增 `--focus=reader`：爽点密度、钩子强度、信息投喂节奏、期待管理 | 增强 `reader-expectation` Skill（已有 17,952 bytes） | P0 |
| 钩子强度分析 | 新增 `--focus=hook`：章末钩子有效性、钩子类型分布、连续无钩子预警 | 新增 `hook-checker` Skill（全新） | P0 |
| 力量体系分析 | 新增 `--focus=power`：金手指/能力体系一致性、战力崩坏检测 | 增强 `consistency-checker` Skill（已有 8,863 bytes） | P1 |
| 网文评分指标 | 增加爽点密度、更新节奏适配度、章末钩子强度等网文核心指标 | — | P1 |
| 智能推荐分析类型 | 根据创作阶段自动推荐最需要的分析类型 | — | P2 |

### 3.4 `/specify` 命令优化

| 优化项 | 描述 | 优先级 |
|--------|------|--------|
| 金手指/系统定义 | 九章规格增加「金手指/系统」专项章节 | P0 |
| 读者画像深化 | 增加阅读习惯、爽点偏好、容忍度等维度 | P1 |
| 商业定位 | 字数规划、更新频率、付费节点设计 | P2 |

### 3.5 `/recap` 命令优化

| 优化项 | 描述 | 优先级 |
|--------|------|--------|
| 预测性提示 | 增加「下一章注意事项」：即将到期伏笔、需出场角色、情绪曲线要求 | P0 |
| 衔接分析 | 分析上一章结尾的情绪走向、未完成动作、读者期待 | P1 |
| 定制化选项 | 支持只看特定维度：`--only=characters`、`--only=foreshadow` | P2 |

### 3.6 `/track` 命令优化

| 优化项 | 描述 | 优先级 |
|--------|------|--------|
| 节奏健康度检测 | `--check` 增加「最近 N 章节奏是否单一」「爽点间隔是否过长」 | P1 |
| 批量更新 | 支持根据多章内容批量补全 tracking 数据 | P1 |
| 趋势分析 | 字数趋势、节奏趋势、角色出场频率趋势 | P2 |

### 3.7 其他命令优化

| 命令 | 优化项 | 优先级 |
|------|--------|--------|
| `/timeline` | 补充详细操作流程、时间线冲突检测算法、并行事件管理 | P1 |
| `/relations` | 补充完整关系类型体系、关系强度量化标准、关系冲突检测 | P1 |
| `/expert` | 补充专家定义文件模板、交互示例、自定义专家指导 | P2 |
| `/tasks` | 增加优先级划分标准、任务依赖可视化、进度同步 | P2 |
| `/checklist` | 增加检查推荐流程、快速检查模式、检查历史追踪 | P2 |

---

## 四、Knowledge Base 扩展（7+ 个新文件）

### 4.1 新增 Craft 知识库

| 文件 | 内容 | 优先级 |
|------|------|--------|
| `hook-design.md` | 钩子设计：悬念钩子、反转钩子、信息钩子、情感钩子、时间压力钩子、钩子链设计 | P0 |
| `power-system.md` | 力量体系设计：等级划分、战力平衡、升级节奏、能力限制、越级战斗合理性 | P0 |
| `tension-management.md` | 张力管理：信息不对称、时间压力、两难选择、期待与意外平衡 | P1 |

### 4.2 新增 Genre 知识库

| 文件 | 内容 | 优先级 |
|------|------|--------|
| `xuanhuan.md` | 玄幻小说：力量体系设计、境界划分、宗门体系、天材地宝、大能设定 | P0 |
| `urban.md` | 都市小说：都市异能、重生、系统流、商战、职场、现实逻辑约束 | P1 |
| `game-lit.md` | 游戏/系统文：LitRPG、数值化叙事、副本设计、技能树、装备系统 | P1 |
| `rebirth.md` | 重生/穿越框架：先知优势管理、蝴蝶效应、前世记忆控制、身份适应 | P1 |

### 4.3 Keyword Mappings 补全

当前只有 8 个映射条目，需要扩展到覆盖所有知识库文件：

```
需要新增映射：
- genres: xuanhuan, urban, game-lit, rebirth, sci-fi, thriller, wuxia, historical, revenge
- craft: hook-design, power-system, tension-management
- requirements: anti-ai-v4, fast-paced, no-poison, serious-literature, strong-emotion, romance-sweet, romance-angst
- character-archetypes: hero, mentor, shadow, ally, shapeshifter, trickster...
- emotional-beats: betrayal, reunion, revelation, redemption...
- references: china-1920s, tang-dynasty, modern-workplace, cultivation-world
- styles: ancient, literary, minimal, natural-voice, web-novel
```

预计从 8 条扩展到 50+ 条。

---

## 五、Skills 扩展（1 个新 Skill + 3 项现有 Skill 增强）

> **审查修订 [2026-02-10]**：原设计提出 4 个新 Skill，经审查发现其中 3 个与现有 Skill 功能重叠。调整为 1 个全新 Skill + 3 项现有 Skill 增强，避免功能碎片化。

### 现有 Skills 交叉分析

| 原设计新 Skill | 现有重叠 Skill | 重叠程度 | 决策 |
|---------------|---------------|---------|------|
| `hook-checker` | 无 | 无重叠 | ✅ 新增 |
| `reader-engagement` | `reader-expectation`（17,952 bytes，含 experts/expectation-analyst.md） | 高度重叠：期待管理、读者视角分析 | ❌ 改为增强现有 |
| `chapter-rhythm` | `pacing-control`（10,091 bytes） | 部分重叠：节奏分析、段落节奏 | ❌ 改为增强现有 |
| `power-balance` | `consistency-checker`（8,863 bytes） | 部分重叠：一致性检测框架 | ❌ 改为增强现有 |

### 5.1 `hook-checker` — 钩子检测 Skill（全新）

| 维度 | 描述 |
|------|------|
| **功能** | 检测章末钩子有效性、钩子强度评分、连续无钩子预警、钩子类型分布分析 |
| **触发条件** | 每章写完后自动触发（`/write` 后置处理） |
| **输入** | 当前章节内容（最后 500 字重点分析）、前后章节上下文 |
| **输出** | 钩子强度评分（1-5）、钩子类型标签、改进建议 |
| **优先级** | P0 |

### 5.2 `reader-expectation` Skill 增强（原 `reader-engagement`）

| 维度 | 描述 |
|------|------|
| **现有能力** | 期待管理、承诺-兑现追踪、读者期待分析 |
| **新增能力** | 段落吸引力评估、信息密度分析、情感投入度评分、爽点密度统计 |
| **触发条件** | `/analyze --focus=reader` 时调用 |
| **优先级** | P1 |

### 5.3 `pacing-control` Skill 增强（原 `chapter-rhythm`）

| 维度 | 描述 |
|------|------|
| **现有能力** | 节奏控制、张弛有度分析、节奏模式识别 |
| **新增能力** | 单章内部节奏分布检测（开头拖沓、高潮过短、收尾仓促）、连续多章节奏单一预警、爽点间隔检测 |
| **触发条件** | `/analyze --focus=pacing` 时调用，或每章写完后可选触发 |
| **优先级** | P1 |

### 5.4 `consistency-checker` Skill 增强（原 `power-balance`）

| 维度 | 描述 |
|------|------|
| **现有能力** | 一致性检测框架、矛盾识别、连续性验证 |
| **新增能力** | 力量体系一致性子模块（战力描写 vs `world-setting.json` 定义、越级战斗合理性、能力使用频率）、战力崩坏预警 |
| **触发条件** | `/analyze --focus=power` 时调用 |
| **依赖** | `world-setting.json`（由 `/specify --world` 生成） |
| **优先级** | P1 |

---

## 六、创作体验优化（6 项）

### 6.1 新手引导系统

- `/guide` 命令（见 2.5 节）
- 命令间自动衔接提示
- 首次使用交互式引导

### 6.2 快写模式

- `/write --fast`：跳过大部分前置检查
- 只加载最小必要上下文（上一章内容 + 角色状态 + 当前任务）
- 写完后仍然执行完整的后置处理（tracking 更新）

### 6.3 批量操作

- `/plan --detail vol-01-03`：批量生成多卷章节级规划
- `/analyze --range=ch5-ch10`：批量分析多章
- `/track --sync=ch5-ch10`：批量补全 tracking 数据

### 6.4 反馈循环增强

- **回溯更新机制**：修改 specification 后自动标记 plan/tasks 中受影响的部分
- **计划偏离检测**：写作过程中自动检测是否偏离原计划，提示「修正」或「更新计划」
- **智能下一步推荐**：基于当前项目状态推荐最优操作

### 6.5 创作数据统计

- `/track --stats` 增强（不新增独立 `/stats` 命令，复用现有 `/track`）
- 日/周/月产出趋势
- 平均章节字数、最高产时段
- 完成度预测（按当前速度，预计何时完成）

### 6.6 命令减负

- `/write` 的前置准备和后置处理自动化，减少用户感知的复杂度
- `/analyze` 增加智能推荐，减少用户选择负担
- 所有命令增加 `--help` 快速参考（不是完整文档，而是 5 行以内的用法提示）

---

## 七、高级能力扩展（6 项）

> **审查修订 [2026-02-10]**：高级能力应优先增强现有 Skills 而非新建，与第五章修订保持一致。灵感管理从独立命令改为目录扫描机制。

### 7.1 多线叙事管理

- 增强现有 `multi-thread-narrative` Skill（已有 17,392 bytes + experts/thread-analyst.md）
- 视角切换规划：哪些章节用哪个视角，切换频率控制
- 信息差追踪：读者/主角/反派各自知道什么，三者信息差是悬念核心
- 叙事线交汇设计：多条线何时交汇、信息爆炸控制
- 新增 tracking 维度：`narrative-threads.json`

### 7.2 角色语言指纹系统

- 每个角色的语言指纹定义（常用词汇、句式偏好、口头禅、语气特征）
- 写作时自动检测对话是否符合角色语言指纹
- 与 `/character` 命令集成（语言指纹存储在 `character-profiles.json` 中）
- 新增 Skill：`voice-consistency-checker`

### 7.3 伏笔管理增强

- 伏笔热度追踪：期待程度随时间变化曲线
- 伏笔链设计：A 回收触发 B 揭示的连锁反应
- 伏笔回收时机建议：基于进度和热度自动建议
- 增强 `plot-tracker.json` 的伏笔数据结构

### 7.4 风格一致性引擎增强

- 增强现有 `style-detector` Skill（已有 3,856 bytes）
- 风格漂移检测：对比早期章节和近期章节的风格指标
- 风格参数化：句子平均长度、对话占比、描写密度、动作节奏
- 风格趋势报告：随章节推进的风格变化曲线

### 7.5 智能「下一步」推荐系统

- 写完一章后：基于节奏分析推荐下一章的重点
- 打开项目时：基于项目状态推荐最优操作序列
- 分析完成后：基于问题优先级推荐修复顺序
- 集成到 `/guide` 命令和所有命令的后置提示中

### 7.6 灵感扫描机制（原灵感管理系统）

- 基于 `notes/` 目录扫描的轻量级灵感关联（见 2.4 节）
- `/write` 和 `/plan` 执行时自动匹配相关灵感并提示
- 灵感使用追踪（文件头部 `status` 标记）
- 不新增独立命令，用户用任何编辑器创建笔记即可

---

## 八、实施分期建议

> **审查修订 [2026-02-10]**：Phase 1 拆分为 1a（最小可用增量）和 1b（结构性补缺），加快首批交付。`/note` 从 Phase 2 降级到 Phase 3。各项归属根据前面章节的修订同步调整。

### Phase 1a：最小可用增量（最高优先级）

**目标**：用最小改动量获得最大体验提升，快速交付

1. `/write --fast` 快写模式
2. `/write` 反 AI 规范数据外置（禁用词表 + 替换策略表移至 `anti-ai-v4.md`，去重合并）
3. `/recap` 增加预测性提示（下一章注意事项）
4. 新增 `hook-design.md` 知识库
5. 新增 `xuanhuan.md` 知识库
6. `/analyze` 新增 `--focus=reader`（增强现有 `reader-expectation` Skill）
7. Keyword Mappings 补全现有 genres（sci-fi, thriller, wuxia, historical, revenge → 8 条扩展到 ~20 条）

**交付物**：3 个文件修改（write.md, recap.md, analyze.md）+ 2 个新知识库 + 1 个配置更新

### Phase 1b：结构性补缺

**目标**：补上最影响创作体验的结构性缺口

8. `/character` 命令（新增，统一角色管理入口，输出到 `spec/tracking/character-profiles.json`）
9. `/plan` 增加卷级规划能力（默认输出总大纲+卷大纲，`--detail vol-XX` 生成章节级规划）
10. `/plan` 增加爽点节奏规划和钩子设计
11. `/specify` 增加金手指/系统定义章节 + `--world` 世界观子模式
12. 新增 `power-system.md` 知识库
13. 新增 `hook-checker` Skill（全新）
14. `/analyze` 新增 `--focus=hook`
15. `/write` 断点续写机制

**交付物**：1 个新命令 + 4 个文件修改 + 1 个新知识库 + 1 个新 Skill

### Phase 2：体验提升

**目标**：让工具用起来更顺畅

1. 新增 `/guide` 命令（智能引导）
2. `/analyze` 新增 `--focus=power`（增强现有 `consistency-checker` Skill）
3. `/plan` 增加网文结构模板（升级流、副本流等）
4. `/track` 增加节奏健康度检测
5. 批量操作支持（`/plan --detail vol-01-03`、`/analyze --range=ch5-ch10`、`/track --sync=ch5-ch10`）
6. 命令间自动衔接提示
7. 新增 `tension-management.md` 知识库
8. 新增 `urban.md`、`game-lit.md`、`rebirth.md` 知识库
9. 增强 `pacing-control` Skill（新增单章节奏分布检测、爽点间隔检测）
10. 增强 `reader-expectation` Skill（新增段落吸引力评估、爽点密度统计）
11. Keyword Mappings 全面补全（~20 条扩展到 50+ 条，覆盖 requirements、character-archetypes、emotional-beats、references、styles）

**交付物**：1 个新命令 + 多项增强 + 3 个新知识库 + 2 个 Skill 增强 + 配置更新

### Phase 3：高级能力

**目标**：建立差异化竞争力

1. 多线叙事管理系统（增强现有 `multi-thread-narrative` Skill，新增 `narrative-threads.json` tracking 维度）
2. 角色语言指纹系统（与 `/character` 命令集成，新增 `voice-consistency-checker` Skill）
3. 伏笔管理增强（热度追踪、伏笔链、回收建议，增强 `plot-tracker.json` 数据结构）
4. 风格一致性引擎增强（漂移检测、参数化，增强 `style-detector` Skill）
5. 智能「下一步」推荐系统（集成到 `/guide` 和所有命令的后置提示）
6. 创作数据统计（`/track --stats` 增强：日/周/月产出趋势、完成度预测）
7. 反馈循环增强（回溯更新、计划偏离检测）
8. `/timeline`、`/relations`、`/expert` 内容补全
9. `/tasks`、`/checklist` 功能增强
10. 灵感扫描机制完善（`notes/` 目录扫描 + 关联提示，见 2.4 节）

---

## 九、设计原则

1. **网文优先**：所有设计决策优先考虑网文创作场景，兼顾文学创作
2. **渐进式复杂度**：新手可以用最简单的方式开始，高级功能按需解锁
3. **自动化优先**：能自动做的不要让用户手动做（tracking 更新、资源加载、衔接提示）
4. **最小干扰**：辅助功能不应打断创作流（灵感提示、下一步推荐都是非阻塞的）
5. **数据驱动**：所有建议基于实际创作数据，不是泛泛的通用建议
6. **向后兼容**：所有新功能不破坏现有项目结构，老项目可以渐进式采用新功能
7. **增强优先于新建**：优先增强现有 Skills/命令，避免功能碎片化和维护成本膨胀
8. **命令收敛**：控制命令总数，通过子模式（`--world`）和参数（`--detail`、`--fast`）扩展能力，而非新增命令

---

## 十、审查修订记录

### 修订 1：2026-02-10 深度审查

**审查范围**：全文档，基于实际代码审查验证设计可行性

**核心变更摘要**：

| # | 变更项 | 原设计 | 修订后 | 理由 |
|---|--------|--------|--------|------|
| 1 | `/worldbuild` | 独立新命令 | `/specify --world` 子模式 | `/plan` 和 `/specify` 已有世界观内容，独立命令导致三处维护 |
| 2 | `/outline` | 独立新命令 | `/plan` 卷级规划增强 | 与 `/plan` 章节架构设计高度重叠，边界模糊 |
| 3 | `/note` | Phase 2 独立新命令 | Phase 3 目录扫描机制 | CLI 环境下独立命令 ROI 低，核心价值在关联提示而非记录 |
| 4 | `/character` 输出目录 | `stories/[name]/characters/` | `spec/tracking/character-profiles.json` | 与现有 tracking 系统（character-state.json, relationships.json）对齐 |
| 5 | `/write` 反 AI 外置 | 整体外置 | 仅外置数据部分（禁用词表、替换策略表） | 段落结构规范和自然化原则是写作执行核心约束，不应分离 |
| 6 | `reader-engagement` Skill | 全新 Skill | 增强现有 `reader-expectation` | 已有 17,952 bytes，功能高度重叠 |
| 7 | `chapter-rhythm` Skill | 全新 Skill | 增强现有 `pacing-control` | 已有 10,091 bytes，节奏分析部分重叠 |
| 8 | `power-balance` Skill | 全新 Skill | 增强现有 `consistency-checker` | 已有 8,863 bytes，一致性检测框架可复用 |
| 9 | Phase 1 | 14 项一期交付 | 拆分为 Phase 1a（7项）+ Phase 1b（8项） | 加快首批交付，降低单次交付风险 |
| 10 | `/stats` 命令 | 可能新增独立命令 | `/track --stats` 增强 | 复用现有 `/track` 命令，避免命令膨胀 |

**新增设计原则**：
- 第 7 条：增强优先于新建
- 第 8 条：命令收敛

**数量变化**：
- 新命令：5 个 → 2 个（`/character`、`/guide`）
- 新 Skill：4 个 → 1 个（`hook-checker`）+ 3 项现有 Skill 增强
- 现有命令增强：从子模式和参数扩展获得等效能力
