---
description: 基于任务清单执行章节写作，自动加载上下文和验证规则
argument-hint: [章节编号或任务ID] [--fast]
allowed-tools: Read(//**), Write(//stories/**/content/**), Bash(ls:*), Bash(find:*), Bash(wc:*), Bash(grep:*), Bash(*)
scripts:
  sh: .specify/scripts/bash/check-writing-state.sh
  ps: .specify/scripts/powershell/check-writing-state.ps1
---

基于七步方法论流程执行章节写作。
---

## 写作前准备（推荐）

如果距离上次写作已超过 1 天，或已写超过 30 章：
- 执行 `/recap` 重建上下文
- 快速扫描简报中的关键信息和警告

**快速模式**：使用 `/recap --brief` 获取快速参考卡片。

---

## 前置检查

1. **运行脚本** `{SCRIPT}` 检查创作状态
2. **解析资源加载报告**

运行脚本并获取 JSON 格式的资源加载报告：

```bash
# Bash 环境
bash {SCRIPT} --json

# PowerShell 环境
powershell -File {SCRIPT} -Json
```

**报告格式**（JSON）：
```json
{
  "status": "ready",
  "resources": {
    "knowledge-base": ["craft/dialogue.md", "craft/pacing.md"],
    "skills": ["writing-techniques/dialogue-techniques"],
    "disabled": []
  },
  "warnings": []
}
```

**处理逻辑**：
1. `status` 不是 "ready" → 终止执行
2. `warnings` 非空 → 显示警告但继续
3. 按顺序加载 `resources.knowledge-base` 和 `resources.skills`
4. 跳过 `resources.disabled` 中的资源

### 查询协议（必读顺序 + 三层资源加载）

⚠️ **严格按以下顺序查询文档**：

1. **先查（最高优先级）**：
   - `memory/constitution.md`（创作宪法）
   - `memory/personal-voice.md`（个人风格指南 - 如有）
   - `memory/style-reference.md`（风格参考 - 如有）

2. **再查（规格和计划）**：
   - `stories/*/specification.md`（故事规格）
   - `stories/*/creative-plan.md`（创作计划）
   - `stories/*/tasks.md`（当前任务）

2.1. **风格学习前置检查**：
   - 如果 `memory/personal-voice.md` 不存在且已写 ≥ 3 章，提示用户执行 `/style-learning`

2.5. **自动加载写作风格和规范（基于配置）**：
   - 读取 `specification.md` 的 YAML frontmatter
   - 如配置了 `writing-style`，加载 `.specify/templates/knowledge-base/styles/[name].md`
   - 如配置了 `writing-requirements`，加载对应规范文档

2.6. **第三层智能资源加载（三层机制）**

**优先级顺序**: Layer 2 配置覆盖 > Layer 1 默认推断 > Layer 3 关键词触发

#### Layer 1: 默认智能推断

如果 specification.md 未配置 `resource-loading`，自动加载：

**Knowledge-base (craft)**:
- `templates/knowledge-base/craft/dialogue.md`
- `templates/knowledge-base/craft/scene-structure.md`
- `templates/knowledge-base/craft/character-arc.md`
- `templates/knowledge-base/craft/pacing.md`
- `templates/knowledge-base/craft/show-not-tell.md`

**Skills (writing-techniques)**:
- `templates/skills/writing-techniques/dialogue-techniques/SKILL.md`
- `templates/skills/writing-techniques/scene-structure/SKILL.md`
- `templates/skills/writing-techniques/character-arc/SKILL.md`
- `templates/skills/writing-techniques/pacing-control/SKILL.md`

#### Layer 2: 配置覆盖

如果 specification.md 配置了 `resource-loading`，使用配置覆盖默认推断：

```yaml
---
resource-loading:
  auto-load: true
  knowledge-base:
    craft:
      - dialogue
      - pacing
      - "!character-arc"  # ! 前缀排除
  skills:
    writing-techniques:
      - dialogue-techniques
  keyword-triggers:
    enabled: true
    custom-mappings:
      "情感节奏": "knowledge-base/craft/pacing.md"
---
```

#### Layer 3: 运行时关键词触发（动态加载）

**触发时机**: 命令参数、任务描述、用户输入中的关键词

**检查配置**: 读取 `specification.md` 的 `resource-loading.keyword-triggers`

**执行流程**:
1. 收集待扫描文本（命令参数 + 任务描述 + 用户输入）
2. 读取 `templates/config/keyword-mappings.json` 映射表
3. 合并 specification.md 中的自定义映射
4. 执行关键词匹配，跳过已加载资源
5. 如有匹配，提示用户确认加载：

```
🔍 **关键词触发检测**

检测到以下关键词，建议加载相关资源：
1. **"节奏"** → 节奏控制 (pacing)
   - 知识库: craft/pacing.md
   - 技巧: writing-techniques/pacing-control

是否加载这些资源？ [Y] 全部加载  [N] 跳过  [S] 选择性加载
```

> **性能优化**：参见 CLAUDE.md 中的「会话级资源复用」章节。

3. **再查（状态和数据）**：
   - `spec/tracking/character-state.json`（角色状态）
   - `spec/tracking/relationships.json`（关系网络）
   - `spec/tracking/plot-tracker.json`（情节追踪 - 如有）
   - `spec/tracking/validation-rules.json`（验证规则 - 如有）
   - `spec/tracking/story-facts.json`（设定事实 - 如有）

   **📋 本章引用的设定事实**（如当前章节已有 `<!-- story-facts: ... -->` 注释）：

   - 解析注释头，提取声明的 fact ID 列表
   - 从 `story-facts.json` 加载这些事实的当前值
   - 展示为写作参考：

   ```
   📋 本章引用的设定事实（来自 story-facts.json）:

     - finance-monthly-deficit: 宗门月亏损 = 1000灵石
     - finance-reserve: 灵石储备 = 5000灵石
     - finance-runway: 储备可撑月数 = 5月

   ⚠️ 写作时请确保上述数值与正文一致。
   ```

   - **快写模式（--fast）**: 跳过详细展示，但保留数据加载

4. **再查（知识库）**：
   - `spec/knowledge/` 相关文件（世界观、角色档案等）
   - `stories/*/content/`（前文内容 - 了解前情）

5. **再查（写作规范）**：
   - `memory/personal-voice.md`（个人语料 - 如有）
   - `spec/knowledge/natural-expression.md`（自然化表达 - 如有）
   - **⚠️ 必须加载**：`templates/knowledge-base/requirements/anti-ai-v4.md`（禁用词与替换策略权威参考）

6. **条件查询（前三章专用）**：
   - **如果章节编号 ≤ 3 或总字数 < 10000字**，额外查询 `spec/presets/golden-opening.md`

### ⚠️ 强制完成确认

**在开始写作前，必须列出已读取的核心文件**：

```markdown
📋 写作前检查清单（已完成）：

✓ 1. memory/constitution.md - 创作宪法
✓ 2. stories/*/specification.md - 故事规格
✓ 3. stories/*/creative-plan.md - 创作计划
✓ 4. stories/*/tasks.md - 当前任务
✓ 5. spec/tracking/ - 角色状态、关系、情节

🆕 三层资源加载：
✓ Layer 1-3 加载完成
✓ 已加载资源清单：[列出]

📊 上下文加载状态：✅ 完成
```

⚠️ **禁止跳过此步骤**：这是防止AI在长篇创作中失焦的核心机制。

<!-- PLUGIN_HOOK: genre-knowledge-write -->

---

## 🚀 快写模式（`--fast`）

**触发条件**：用户参数 `$ARGUMENTS` 包含 `--fast`

**快写模式流程**：

### Fast-1. 最小资源加载

**仅加载以下 3 项**（跳过三层资源加载）：
1. **当前任务**：`stories/*/tasks.md` 中 `pending` 或 `in_progress` 的任务
2. **上一章内容**：最近完成的章节文件（最后 500 字）
3. **角色状态**：`spec/tracking/character-state.json`（仅当前活跃角色）

### Fast-2. 极简写作提醒

```
📍 快写模式
━━━━━━━━━━━━━━━━━━━━
📋 任务：[当前任务标题]
📖 上章结尾：[一句话概括]
👤 在场角色：[角色列表]
━━━━━━━━━━━━━━━━━━━━
⚡ 直接开始写作
💡 如需完整上下文，请使用 /write（不带 --fast）
```

### Fast-3. 直接进入写作

跳过详细提醒，但仍遵守段落结构规范、反 AI 规范。

### Fast-4. 完整后置处理

写作完成后仍执行完整的后置处理（与正常模式相同）。

---

> ⚠️ **以下为正常模式流程**（`--fast` 模式跳过以下内容）

## 断点续写机制

### 恢复检测

在开始写作前，检查 `spec/tracking/write-checkpoint.json`：
- 如存在且 `status` 为 `in_progress` 且未过期（24小时内）→ 提示恢复
- 用户选择「继续写作」→ 从断点恢复
- 用户选择「重新开始」→ 删除 checkpoint，正常流程

### 断点恢复流程

1. **跳过资源加载**：使用 checkpoint 中的 `loadedResources` 列表
2. **恢复上下文**：读取已写内容，验证 hash
3. **从断点继续**：从已写内容末尾继续创作

### 断点保存时机

- 每完成一个场景/段落组后（约 500-1000 字）
- 用户主动中断时
- 写作完成时：`status` 更新为 `completed`

### Checkpoint 数据结构

```json
{
  "version": "1.0",
  "storyDir": "[故事目录名]",
  "chapter": { "number": "[章节编号]", "title": "[标题]", "taskId": "[任务ID]" },
  "progress": { "status": "in_progress", "wordsWritten": 0, "targetWords": 3000 },
  "context": { "loadedResources": [], "charactersFocused": [], "currentTask": "" },
  "content": { "filePath": "", "contentHash": "" },
  "timestamps": { "createdAt": "", "updatedAt": "", "expiresAt": "" }
}
```

---

## 写作执行流程

### 灵感扫描（前置）

在开始写作前，自动扫描 `notes/ideas.json`（如存在），推荐与当前章节相关的灵感：

**匹配规则**：

| 匹配维度 | 方法 |
|---------|------|
| 章节关联 | 灵感的 `relatedChapters` 包含当前章节号 |
| 角色关联 | 灵感的 `relatedCharacters` 与本章出场角色重叠 |
| 标签关联 | 灵感的 `tags` 与本章计划关键词重叠 |

```
💡 相关灵感提醒
━━━━━━━━━━━━━━━━━━━━

与第 [N] 章相关的灵感（[M] 条）：

1. 💡 [灵感内容]
   标签：#战斗 #师姐
   状态：🆕 未使用

是否要在本章使用这些灵感？
```

---

### 1. 选择写作任务
从 `tasks.md` 中选择状态为 `pending` 的写作任务，标记为 `in_progress`。

### 2. 验证前置条件
- 检查相关依赖任务是否完成
- 验证必要的设定是否就绪
- 确认前序章节是否完成

### 3. 写作前提醒

**基于宪法原则提醒**：核心价值观、质量标准、风格一致性

**基于规格要求提醒**：P0 必须包含的元素、目标读者特征、内容红线

**分段格式规范（重要）**：
- ⛔ **禁止使用**："一"、"二"、"三"等数字标记分段
- ✅ **使用方式**：场景转换时用两个空行（一个空白行）分隔

**反AI检测写作规范**：

⚠️ 核心原则（详见 CLAUDE.md 和 anti-ai-v4.md）：
- 单句成段 30%-50%，每段 50-100 字
- 短句优先（15-25 字），白话优先
- 一个准确细节胜过三个堆砌

**📋 禁用词与替换策略**：

> **引用外部规范**：完整的禁用词黑名单（200+ 词）和替换策略表，请参阅：
> `templates/knowledge-base/requirements/anti-ai-v4.md`
>
> ⚠️ **写作时必须加载此文件**，作为禁用词和替换的权威参考。

### 4. 实时辅助模式（可选）

如果用户在写作过程中遇到困难（如"帮我想一下主角该怎么办"），可主动提供 2-3 个行动选项。

⚠️ 不要主动提供选项，除非用户明确请求帮助。

### 5. 根据计划创作内容：
   - **开场**：吸引读者，承接前文
   - **发展**：推进情节，深化人物
   - **转折**：制造冲突或悬念
   - **收尾**：适当收束，引出下文

### 6. 质量自检

**宪法合规检查**：是否符合核心价值观、质量标准、风格一致

**规格符合检查**：是否包含必要元素、符合目标定位、遵守约束条件

**格式规范检查**：确认未使用数字标记分段，场景转换使用空行分隔

**设定事实校验**（如 story-facts.json 存在且非空）：
- 如果本章声明了 `<!-- story-facts: ... -->` 注释，调用 facts-checker skill
- 检查声明的事实值是否与 story-facts.json 一致
- 验证涉及本章 facts 的算术规则
- 如发现不一致，输出警告（不阻断写作流程）
- **快写模式（--fast）**: 仍执行校验，但简化报告

### 📊 具象化检查（去AI味关键）⭐

写完一段后，主动识别并替换抽象表达。

> **完整清单和示例**：首次写作时读取 `templates/knowledge-base/requirements/concretization.md`
>
> 核心要点：
> - 时间具体化（避免"最近"、"很久"）
> - 人物具体化（避免"有人"、"大家"）
> - 数量精确化（避免"很多"、"不少"）
> - 场景可视化（避免"很xx"的形容）
> - 关键情节必须具象，次要信息可以概括

### 7. 保存和更新
- 将章节内容保存到 `stories/*/content/`
- 更新任务状态为 `completed`
- 记录完成时间和字数

---

## 完成后行动

### 8. 验证字数和更新进度

**字数统计**：使用项目提供的脚本验证：
```bash
source .specify/scripts/bash/common.sh
count_chinese_words "stories/*/content/第X章.md"
```
⚠️ 不要使用 `wc -w` 统计中文字数。

**完成报告**：
```
✅ 章节写作完成
- 已保存：stories/*/content/第X章.md
- 实际字数：[X]字
- 字数要求：2000-4000字
- 字数状态：✅ 符合要求 / ⚠️ 字数不足
- 任务状态：已更新
```

### 9. 建议下一步
- 继续下一个写作任务
- 每5章运行 `/analyze` 进行质量检查

---

## 🆕 后置处理：自动 Tracking 更新

**执行时机**: 章节写作完成后

**更新策略**: 核心命令（/write）自动更新，无需用户确认

### 执行步骤

1. **分析本章内容**：提取角色、关系变化、情节推进、时间线信息
2. **读取现有 tracking 文件**：character-state.json, relationships.json, plot-tracker.json, timeline.json
3. **合并更新**：将新内容增量合并到现有数据
4. **记录日志**：追加到 `spec/tracking/tracking-log.md`

> **详细格式和示例**：参见 `.claude/skills/auto-tracking/SKILL.md`

### 灵感状态更新

写作完成后，检查本章是否使用了推荐的灵感：
- 如果使用 → 更新灵感状态为 `used`，记录 `usedInChapter`
- 如果未使用 → 保持 `new` 状态
- 自动将更新写回 `notes/ideas.json`

### 灵感快速捕捉

用户可在写作过程中随时记录灵感（「记一下」「等等，我突然想到」），AI 识别后自动分类、打标签、写入 `notes/ideas.json`。

### Checkpoint 完成标记

写作正常完成后，更新 `write-checkpoint.json` 的 `status` 为 `completed`。

### 新事实注册提示

写作完成后，检查正文中是否出现新的可量化事实（具体数字 + 单位的组合）：

**检测规则**：
- 数字 + 单位模式（如 `1000灵石`、`200人`、`5月`）
- 中文数字 + 单位（如 `五百灵石`，识别但提示用户确认）
- 专有名词首次出现（引号包围或首字母大写）

**去重逻辑**：
- 检查 `story-facts.json` 中是否已存在相同值
- 检查之前章节的 `<!-- story-facts: ... -->` 注释中是否已声明

**输出提示**：

```
💡 Story Facts 提示

检测到以下可能的新事实（未注册）:

1. "外门弟子二百人"
   建议 ID: sect-outer-disciples
   类型: number
   值: 200
   单位: 人

2. "内门长老十二位"
   建议 ID: sect-inner-elders
   类型: number
   值: 12
   单位: 位

使用 /facts 命令添加这些事实以便后续追踪。
```

- **仅提示，不自动注册**：用户需手动使用 `/facts` 命令确认添加
- **快写模式（--fast）**: 仍执行检测和提示

### 智能推荐（后置）

检查 P0/P1 级别推荐（角色缺席、伏笔紧急度），在命令链式提示中展示。

## 🔗 命令链式提示

```
💡 下一步建议：
1️⃣ `/write [下一章节号]` — 继续写作下一章
2️⃣ `/analyze` — 每5章执行一次质量分析（已写N章）
3️⃣ `/recap --brief` — 快速回顾上下文
```
