---
description: 基于任务清单执行章节写作，自动加载上下文和验证规则
argument-hint: [章节编号或任务ID] [--fast] [--batch N] [--volume vol-XX]
recommended-model: claude-opus-4-6 # 创作质量最高；--fast 时可用 sonnet
allowed-tools: Read(//**), Write(//stories/**/content/**), Bash(ls:*), Bash(find:*), Bash(wc:*), Bash(grep:*), Bash(*)
scripts:
  sh: resources/scripts/bash/check-writing-state.sh
  ps: resources/scripts/powershell/check-writing-state.ps1
---

基于七步方法论流程执行章节写作。

---

## 自动激活的Skills

本命令自动激活以下Skills：

1. **writing-balance** - 智能写作平衡监控
   - 文件: @templates/skills/writing-techniques/writing-balance/SKILL.md
   - 功能: 写作完成后自动评估6个维度平衡度
   - 输出: 平衡度评估报告 + 改进建议

2. **writing-techniques** - 写作技巧教学
   - 文件: @templates/skills/writing-techniques/writing-techniques/SKILL.md
   - 功能: 应用8个模块的写作技巧
   - 效果: 提升文字自然度、层次感、节奏变化

**说明**:
- 这两个Skills协同工作，替代了旧的 anti-ai-v4 禁止列表
- 用户无需手动激活，AI会自动应用
- 如需自定义配置，可在 specification.md 中添加 `writing_balance_config`

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

### 增量缓存加载（性能优化核心）

⚠️ **此机制大幅减少重复加载，连续写作时跳过未变化的资源。**

**步骤 0: 检查缓存**

```
1. 读取 .claude/.cache/resource-digest.json
   ├─ 不存在 → 首次加载（全量），生成 digest + context
   └─ 存在 → 进入增量检查

2. 对比每个已缓存文件的 mtime（用 Bash stat 命令）
   ├─ 全部未变 → 直接复用 .claude/.cache/write-context.json，跳到 L0 加载
   └─ 有变化 → 只重新读取变化的文件

3. 更新 write-context.json 中变化的部分
   ├─ L1 文件变化 → 重新生成该文件的摘要（200-300字）
   └─ L2 文件变化 → 重新缓存全文

4. 写回更新后的 resource-digest.json + write-context.json
```

**资源分级**：

| 级别 | 内容 | 策略 |
|------|------|------|
| L0 必读 | tasks.md、上一章最后500字、当前活跃角色 | 每次读取全文，不缓存 |
| L1 摘要 | constitution.md、specification.md、creative-plan.md、plot-tracker.json、relationships.json | 首次读全文生成摘要，后续只在 mtime 变化时重新生成 |
| L2 按需 | craft/、genres/、styles/、requirements/、skills/ | 仅在关键词触发或配置指定时加载，加载后缓存全文 |

**缓存复用判定**：
- 如果 `write-context.json` 存在且 `digest_version` 与 `resource-digest.json` 的 `version` 一致 → 复用 L1 摘要 + L2 缓存
- 如果 `digest_version` 不一致 → 全量重建
- 用户删除 `.claude/.cache/` → 下次全量重建

**首次加载（无缓存）**：按下方完整查询协议执行，完成后生成两个缓存文件。

**后续加载（有缓存且未过期）**：
1. 直接使用 `write-context.json` 中的 `l1_summaries` 作为 L1 上下文
2. 直接使用 `l2_loaded` 中的缓存资源
3. 仅实时加载 L0 资源（tasks.md、上一章、活跃角色）
4. 合并 L0 + L1 缓存 + L2 缓存 → 进入写作

---

### 查询协议（必读顺序 + 三层资源加载）

⚠️ **严格按以下顺序查询文档**（首次加载或缓存失效时执行完整流程）：

1. **先查（最高优先级）**【L1 — 缓存摘要】：
   - `memory/constitution.md`（创作宪法）
   - `memory/personal-voice.md`（个人风格指南 - 如有）
   - `memory/style-reference.md`（风格参考 - 如有）

2. **再查（规格和计划）**【L1 — 缓存摘要】：
   - `stories/*/specification.md`（故事规格）
   - `stories/*/creative-plan.md`（创作计划）
   - `stories/*/tasks.md`（当前任务）【L0 — 每次必读】

2.1. **风格学习前置检查**：
   - 如果 `memory/personal-voice.md` 不存在且已写 ≥ 3 章，提示用户执行 `/style-learning`

2.5. **自动加载写作风格和规范（基于配置）**：
   - 读取 `specification.md` 的 YAML frontmatter
   - 如配置了 `writing-style`，加载 `resources/styles/[name].md`
   - 如配置了 `writing-requirements`，加载对应规范文档

2.6. **第三层智能资源加载（三层机制）**

**优先级顺序**: Layer 2 配置覆盖 > Layer 1 默认推断 > Layer 3 关键词触发

#### Layer 1: 默认智能推断

如果 specification.md 未配置 `resource-loading`，自动加载：

**Knowledge-base (craft)**:
- `resources/craft/dialogue.md`
- `resources/craft/scene-structure.md`
- `resources/craft/character-arc.md`
- `resources/craft/pacing.md`
- `resources/craft/show-not-tell.md`

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
2. 读取 `resources/config/keyword-mappings.json` 映射表
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

3. **再查（状态和数据 — 三层 Fallback）**【L0/L1 混合】：

   按以下优先级加载 tracking 数据：

   **Layer 1: MCP 查询（优先）**【L0 — 每次查询】
   - `query_characters --status=active --limit=20` → 活跃角色
   - `query_relationships --volume=[当前卷号]` → 当前卷关系
   - `query_plot --status=active` → 活跃伏笔
   - `query_facts` → 设定事实
   - 如果指定了 `--volume vol-XX`，所有查询限定到该卷

   **Layer 2: 分片 JSON（次优，检测 tracking/volumes/ 是否存在）**【L1 — 缓存摘要】
   - 确定当前章节属于哪个卷（从 volume-summaries.json 的 chapters 范围判断）
   - 读取该卷的分片文件：`tracking/volumes/[currentVolume]/character-state.json` 等
   - 读取全局摘要：`tracking/summary/characters-summary.json`（活跃角色概览）

   **Layer 3: 单文件 JSON（兜底，现有逻辑）**【L1 — 缓存摘要】
   - `tracking/character-state.json`（角色状态）
   - `tracking/relationships.json`（关系网络）
   - `tracking/plot-tracker.json`（情节追踪 - 如有）
   - `tracking/validation-rules.json`（验证规则 - 如有）
   - `tracking/story-facts.json`（设定事实 - 如有）

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

4. **再查（知识库）**【L2 — 按需缓存】：
   - `resources/knowledge/` 相关文件（世界观、角色档案等）
   - `stories/*/content/`（前文内容 - 了解前情）

5. **再查（写作规范）**【L2 — 按需缓存】：
   - `memory/personal-voice.md`（个人语料 - 如有）
   - `resources/knowledge/natural-expression.md`（自然化表达 - 如有）
   - **⚠️ 必须加载**：`resources/requirements/anti-ai-v4.md`（禁用词与替换策略权威参考）

6. **条件查询（前三章专用）**：
   - **如果章节编号 ≤ 3 或总字数 < 10000字**，额外查询 `resources/presets/golden-opening.md`

### ⚠️ 强制完成确认

**在开始写作前，必须列出已读取的核心文件**：

```markdown
📋 写作前检查清单（已完成）：

✓ 1. memory/constitution.md - 创作宪法
✓ 2. stories/*/specification.md - 故事规格
✓ 3. stories/*/creative-plan.md - 创作计划
✓ 4. stories/*/tasks.md - 当前任务
✓ 5. tracking/ - 角色状态、关系、情节

🆕 三层资源加载：
✓ Layer 1-3 加载完成
✓ 已加载资源清单：[列出]

📊 上下文加载状态：✅ 完成
```

⚠️ **禁止跳过此步骤**：这是防止AI在长篇创作中失焦的核心机制。

### 缓存写回

**首次加载或有文件变化时**，将加载结果写入缓存：

1. **生成 resource-digest.json**：记录所有已读文件的 mtime 和 size
```json
{
  "version": 1,
  "updated_at": "[ISO时间]",
  "files": {
    "resources/memory/constitution.md": { "mtime": [毫秒时间戳], "size": [字节] },
    "tracking/character-state.json": { "mtime": [毫秒时间戳], "size": [字节] }
  }
}
```

2. **生成 write-context.json**：保存 L1 摘要和 L2 缓存状态
```json
{
  "version": 1,
  "story": "[故事目录名]",
  "last_chapter": [章节号],
  "generated_at": "[ISO时间]",
  "digest_version": 1,
  "context": {
    "l1_summaries": {
      "constitution": "[200字摘要]",
      "specification": "[300字摘要]",
      "creative_plan": "[200字摘要]",
      "active_plots": [{"id": "", "name": "", "status": "", "progress": ""}],
      "active_relationships": [{"from": "", "to": "", "type": "", "tension": ""}]
    },
    "l2_loaded": {
      "resources/craft/dialogue.md": "已缓存",
      "resources/requirements/anti-ai-v5-balanced.md": "已缓存"
    }
  }
}
```

3. 使用 `Write` 工具写入 `.claude/.cache/resource-digest.json` 和 `.claude/.cache/write-context.json`

<!-- PLUGIN_HOOK: genre-knowledge-write -->

---

## 🚀 快写模式（`--fast`）

**触发条件**：用户参数 `$ARGUMENTS` 包含 `--fast`

**快写模式流程**：

### Fast-1. 最小资源加载

**仅加载以下 3 项**（跳过三层资源加载）：
1. **当前任务**：`stories/*/tasks.md` 中 `pending` 或 `in_progress` 的任务
2. **上一章内容**：最近完成的章节文件（最后 500 字）
3. **角色状态**：`tracking/character-state.json`（仅当前活跃角色）

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

在开始写作前，检查 `tracking/write-checkpoint.json`：
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
> `resources/requirements/anti-ai-v4.md`
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

> **完整清单和示例**：首次写作时读取 `resources/requirements/concretization.md`
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
source resources/scripts/bash/common.sh
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
2. **读取现有 tracking 文件**（按三层 Fallback 加载）
3. **合并更新**：将新内容增量合并到现有数据
4. **写入 tracking 数据**：
   - **分片模式**：确定当前章节所属卷，更新该卷的分片文件，同步更新全局摘要
   - **单文件模式**：直接更新 `tracking/` 下的文件
5. **MCP 同步**（如果可用）：
   - `log_writing_session` — 记录本次写作的章节号、字数
   - `sync_from_json` — 将更新后的 tracking 数据同步到 SQLite
   - 更新 FTS 索引 — 将新章节内容索引到全文检索
6. **记录日志**：追加到 `tracking/tracking-log.md`

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

## 🆕 批量写作模式（`--batch N`）

**触发条件**：用户参数 `$ARGUMENTS` 包含 `--batch N`（N 为章节数，1-5）

**执行模型**：Flow-Pipeline，逐章执行完整写作流程。

### 流程

```
for i in 1..N:
  1. 加载上下文（首章完整加载，后续章增量更新）
  2. 执行写作（正常模式或 --fast 模式）
  3. 后置处理（tracking 更新、checkpoint 保存）
  4. 将本章结果作为下一章的上下文输入
```

### 上下文传递

- **首章**：完整执行三层 Fallback 数据加载
- **后续章**：复用已加载的资源，仅增量更新：
  - 上一章的结尾内容（续写衔接）
  - 上一章更新后的角色状态
  - 上一章更新后的伏笔状态
  - tasks.md 中的下一个 pending 任务

### 中断与恢复

- 每章完成后保存 checkpoint（含 batch 进度：`batchIndex: 2/5`）
- 中断后可通过 `/write --batch` 恢复（检测 checkpoint 中的 batch 状态）
- 单章写作失败不影响已完成的章节

### 限制

- `--batch` 最大值为 5（避免上下文过长导致质量下降）
- 可与 `--fast` 组合使用：`/write --batch 3 --fast`
- 可与 `--volume` 组合使用：`/write --batch 3 --volume vol-02`

---

## 🔗 命令链式提示

```
💡 下一步建议：
1️⃣ `/write [下一章节号]` — 继续写作下一章
2️⃣ `/analyze` — 每5章执行一次质量分析（已写N章）
3️⃣ `/recap --brief` — 快速回顾上下文
```
