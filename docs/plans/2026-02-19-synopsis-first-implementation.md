# Synopsis-First v5.0.0 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the existing seven-step methodology (21 commands, 55+ skills, 100+ resource files) with a minimal five-command pipeline: specify → plan → write → expand → analyze.

**Architecture:** Templates-driven slash commands with zero skills, three resource files, four simplified tracking JSON files. The `init.ts` source code copies templates to user projects.

**Tech Stack:** TypeScript (Node.js), Jest, fs-extra, commander.js

**Design Doc:** `docs/plans/2026-02-19-synopsis-first-design.md`

---

## Task 1: Create simplified tracking templates

**Files:**
- Modify: `templates/tracking/character-state.json`
- Modify: `templates/tracking/relationships.json`
- Modify: `templates/tracking/plot-tracker.json`
- Modify: `templates/tracking/timeline.json`
- Delete: `templates/tracking/story-facts.json`
- Delete: `templates/tracking/validation-rules.json`
- Delete: `templates/tracking/tracking-log.md`
- Delete: `templates/tracking/summary/` (entire directory)

**Step 1: Replace character-state.json with simplified version**

```json
{
  "characters": {}
}
```

Schema per character entry:
```json
{
  "role": "protagonist|supporting|minor",
  "status": "alive|dead|missing",
  "location": "当前位置",
  "state": "当前核心状态（一句话）",
  "lastAppearance": 0
}
```

**Step 2: Replace relationships.json with simplified version**

```json
{
  "relationships": []
}
```

Schema per entry:
```json
{
  "from": "角色A",
  "to": "角色B",
  "type": "信任|敌对|爱情|友谊|师徒|从属",
  "note": "当前关系状态（一句话）",
  "lastUpdate": 0
}
```

**Step 3: Replace plot-tracker.json with simplified version**

```json
{
  "currentChapter": 0,
  "plotlines": [],
  "foreshadowing": []
}
```

Plotline schema:
```json
{
  "name": "情节线名称",
  "status": "active|resolved|pending",
  "description": "一句话描述",
  "keyChapters": []
}
```

Foreshadowing schema:
```json
{
  "id": "fs-001",
  "content": "伏笔内容",
  "plantedAt": 0,
  "resolveAt": null,
  "status": "planted|hinted|resolved"
}
```

**Step 4: Replace timeline.json with simplified version**

```json
{
  "events": []
}
```

Event schema:
```json
{
  "chapter": 0,
  "time": "第X年春",
  "event": "事件描述（一句话）"
}
```

**Step 5: Delete obsolete tracking files**

```bash
rm templates/tracking/story-facts.json
rm templates/tracking/validation-rules.json
rm templates/tracking/tracking-log.md
rm -rf templates/tracking/summary/
```

**Step 6: Commit**

```bash
git add templates/tracking/
git commit -m "refactor(tracking): simplify to 4 minimal JSON templates for v5"
```

---

## Task 2: Create simplified resource templates

**Files:**
- Modify: `templates/resources/memory/constitution.md` → move to `templates/resources/constitution.md`
- Create: `templates/resources/style-reference.md`
- Create: `templates/resources/anti-ai.md`
- Delete: `templates/resources/craft/` (entire directory)
- Delete: `templates/resources/genres/` (entire directory)
- Delete: `templates/resources/styles/` (entire directory, not style-reference.md)
- Delete: `templates/resources/requirements/` (entire directory)
- Delete: `templates/resources/config/` (entire directory)
- Delete: `templates/resources/memory/` (entire directory, content moved)
- Delete: `templates/resources/scripts/` (entire directory)
- Delete: `templates/resources/emotional-beats/` (entire directory)
- Delete: `templates/resources/character-archetypes/` (entire directory)
- Delete: `templates/resources/references/` (entire directory)
- Delete: `templates/resources/presets/` (if exists)

**Step 1: Create new constitution.md at templates/resources/constitution.md**

Copy content from existing `templates/resources/memory/constitution.md` (the 140-line file). This is a direct move, no content changes.

**Step 2: Create style-reference.md template**

```markdown
# 风格参考

> 本文件定义你的写作风格偏好。在 /specify 阶段根据你的选择自动生成。
> 扩写阶段会加载此文件作为风格锚点。

## 叙述视角
[第一人称/第三人称有限/第三人称全知]

## 语言风格
[简洁利落/细腻优美/口语化/古风]

## 节奏偏好
[快节奏/中等/慢节奏]

## 对话风格
[简短有力/生活化/文学化]

## 特殊要求
[用户自定义的风格要求]
```

**Step 3: Create anti-ai.md (200字以内)**

```markdown
# 反AI写作规范

## 核心原则
自然表达，像真人写的。

## 必须做到
- 句长混合：短句(30-40%)、中句(40-50%)、长句(10-20%)
- 单句成段比例 30%-50%，每段 50-100 字
- 用具体细节替代抽象描写
- 对话符合角色身份，不千人一面

## 必须避免
- 「然而」「殊不知」「缓缓」「深邃」「不禁」等AI高频词
- 连续使用相同句式结构
- 空洞的心理描写和环境渲染
- 每段都以角色名开头
```

**Step 4: Delete all obsolete resource directories**

```bash
rm -rf templates/resources/craft/
rm -rf templates/resources/genres/
rm -rf templates/resources/styles/
rm -rf templates/resources/requirements/
rm -rf templates/resources/config/
rm -rf templates/resources/memory/
rm -rf templates/resources/scripts/
rm -rf templates/resources/emotional-beats/
rm -rf templates/resources/character-archetypes/
rm -rf templates/resources/references/
rm -rf templates/resources/presets/
```

**Step 5: Commit**

```bash
git add templates/resources/
git commit -m "refactor(resources): reduce to 3 core files for v5"
```

---

## Task 3: Delete all skill templates

**Files:**
- Delete: `templates/skills/` (entire directory, ~55 SKILL.md files)

**Step 1: Delete the entire skills directory**

```bash
rm -rf templates/skills/
```

**Step 2: Commit**

```bash
git add templates/skills/
git commit -m "refactor(skills): remove all 55+ skill templates for v5 zero-skills architecture"
```

---

## Task 4: Delete obsolete command templates

**Files:**
- Delete: `templates/commands/constitution.md`
- Delete: `templates/commands/clarify.md`
- Delete: `templates/commands/tasks.md`
- Delete: `templates/commands/track-init.md`
- Delete: `templates/commands/track.md`
- Delete: `templates/commands/recap.md`
- Delete: `templates/commands/timeline.md`
- Delete: `templates/commands/relations.md`
- Delete: `templates/commands/revise.md`
- Delete: `templates/commands/checklist.md`
- Delete: `templates/commands/expert.md`
- Delete: `templates/commands/facts.md`
- Delete: `templates/commands/guide.md`
- Delete: `templates/commands/help-me.md`
- Delete: `templates/commands/character.md`
- Delete: `templates/commands/search.md`
- Delete: `templates/commands/volume-summary.md`

Keep only: `specify.md`, `plan.md`, `write.md`, `analyze.md` (will be rewritten) + create `expand.md` (new)

**Step 1: Delete 17 obsolete command files**

```bash
cd templates/commands/
rm constitution.md clarify.md tasks.md track-init.md track.md recap.md timeline.md relations.md revise.md checklist.md expert.md facts.md guide.md help-me.md character.md search.md volume-summary.md
```

**Step 2: Commit**

```bash
git add templates/commands/
git commit -m "refactor(commands): remove 17 obsolete commands, keep 4 for rewrite"
```

---

## Task 5: Rewrite specify.md command template

**Files:**
- Modify: `templates/commands/specify.md`

**Step 1: Replace specify.md with simplified version**

```markdown
---
description: 定义故事规格，明确要创造什么样的作品
argument-hint: [故事描述]
---

用户输入：$ARGUMENTS

## 目标

交互式引导用户定义故事的核心要素，输出 specification.md。

## 资源加载

读取 `resources/constitution.md`（如存在）作为创作原则参考。

## 执行步骤

### 1. 确定故事目录

- 如果 `stories/` 下已有故事目录，列出并询问是更新还是新建
- 新建时，根据用户输入生成目录名

### 2. 交互式引导

逐项引导用户定义以下内容（每次只问一个问题）：

1. **故事类型**：玄幻/都市/言情/悬疑/科幻/历史/其他
2. **一句话概要**：30字以内的核心创意
3. **核心设定**：世界观、力量体系等关键设定（2-3句）
4. **主角**：姓名、身份、核心性格、初始目标（3-5句）
5. **核心配角**：2-5个关键配角，每人1-2句描述
6. **核心冲突**：主线矛盾是什么（2-3句）
7. **目标规模**：预计总章数、分几卷
8. **写作风格偏好**：叙述视角、语言风格、节奏偏好

### 3. 生成 specification.md

将收集的信息整理为结构化的 specification.md，写入 `stories/<story>/specification.md`。

格式：
```
# [故事名称] 规格书

## 基本信息
- 类型：
- 一句话概要：
- 目标规模：X章，分Y卷

## 核心设定
[世界观和关键设定]

## 角色
### 主角
[主角详情]

### 核心配角
[配角列表]

## 核心冲突
[主线矛盾]

## 写作风格
- 叙述视角：
- 语言风格：
- 节奏偏好：
```

### 4. 生成风格参考（如不存在）

如果 `resources/style-reference.md` 不存在，根据用户的风格偏好自动生成。

### 5. 后续建议

输出：「规格定义完成。下一步请使用 /plan 生成卷级大纲。」
```

**Step 2: Commit**

```bash
git add templates/commands/specify.md
git commit -m "refactor(specify): rewrite as simplified interactive story definition"
```

---

## Task 6: Rewrite plan.md command template

**Files:**
- Modify: `templates/commands/plan.md`

**Step 1: Replace plan.md with simplified version**

```markdown
---
description: 基于故事规格生成卷级大纲
argument-hint: [故事目录名]
---

用户输入：$ARGUMENTS

## 目标

将 specification.md 转化为卷级大纲，规划全书的宏观架构。

## 资源加载

1. 读取 `stories/<story>/specification.md`（完整读取）
2. 如果已有 `creative-plan.md`，读取并询问是覆盖还是追加

## 执行步骤

### 1. 确定故事目录

从 $ARGUMENTS 提取故事目录名，或列出 `stories/` 下的目录让用户选择。

### 2. 生成卷级大纲

根据 specification.md 中的目标规模，为每一卷生成：

- **卷名**：卷名 + 核心主题（一句话）
- **章节范围**：如第1-80章
- **核心冲突**：本卷的主要矛盾
- **转折点**：2-3个主要转折
- **高潮事件**：本卷最高潮的场景
- **结尾钩子**：引向下一卷的悬念
- **角色变动**：本卷新增/退场的角色
- **伏笔规划**：本卷需要埋设/回收的伏笔

### 3. 输出格式

写入 `stories/<story>/creative-plan.md`：

```
# [故事名称] 创作计划

## 全书概览
- 总章数：
- 总卷数：
- 主线概要：

## 第一卷：[卷名]
- 章节范围：第1-XX章
- 核心主题：
- 核心冲突：
- 转折点：
  1. [转折1]
  2. [转折2]
- 高潮事件：
- 结尾钩子：
- 角色变动：新增[XX]，退场[XX]
- 伏笔规划：
  - 埋设：[伏笔1]、[伏笔2]
  - 回收：[伏笔X]（来自第Y卷）

## 第二卷：[卷名]
...
```

### 4. 后续建议

输出：「卷级大纲生成完成。下一步请使用 /write 1 开始逐章生成剧情概要。可用 /write --batch 20 批量生成。」
```

**Step 2: Commit**

```bash
git add templates/commands/plan.md
git commit -m "refactor(plan): rewrite as volume-level outline generator"
```

---

## Task 7: Rewrite write.md command template

**Files:**
- Modify: `templates/commands/write.md`

**Step 1: Replace write.md with simplified version**

```markdown
---
description: 逐章生成剧情概要（200-500字），同步更新 tracking
argument-hint: [章节号] [--batch N]
---

用户输入：$ARGUMENTS

## 目标

为指定章节生成 200-500 字的纯剧情概要，同步生成 tracking 骨架数据。

## 参数解析

- 章节号：从 $ARGUMENTS 提取，如 `1`、`42`、`ch-042`
- `--batch N`：批量生成 N 章概要（最大 20），从指定章节号开始

## 资源加载（极简）

1. **specification.md 摘要**：读取 `stories/<story>/specification.md`，提取100字核心摘要（类型+主角+核心冲突）
2. **当前卷大纲**：读取 `stories/<story>/creative-plan.md`，只提取当前章节所属卷的段落
3. **前序概要标题列表**：扫描 `stories/<story>/content/chapter-*-synopsis.md`，只读取每个文件的第一行标题
4. **前一章概要全文**：读取前一章的 synopsis.md（200-500字）

**不加载**：resources 目录任何文件、tracking 文件（写入时直接追加）

## 执行步骤

### 1. 确定故事目录和章节号

从 $ARGUMENTS 和 `stories/` 目录确定当前故事和目标章节。

### 2. 加载上下文

按上述「资源加载」规则加载最小上下文。

### 3. 生成概要

为当前章节生成 200-500 字纯剧情概要，包含：

- **本章标题**：简短的章节标题
- **核心事件**：本章发生的主要事件（1-3个）
- **出场角色**：本章出场的角色列表
- **情感走向**：本章的情感基调和变化
- **章末钩子**：本章结尾的悬念或引子

写入 `stories/<story>/content/chapter-XXX-synopsis.md`（XXX 为三位数补零）。

### 4. 更新 tracking 骨架

根据概要内容，更新 4 个 tracking 文件：

**character-state.json**：
- 新出场角色：添加条目
- 已有角色：更新 status、location、state、lastAppearance

**relationships.json**：
- 新关系：添加条目
- 关系变化：更新 note 和 lastUpdate

**plot-tracker.json**：
- 更新 currentChapter
- 新情节线：添加到 plotlines
- 伏笔埋设：添加到 foreshadowing（status=planted）
- 伏笔回收：更新 resolveAt 和 status=resolved

**timeline.json**：
- 添加本章事件到 events

### 5. 批量模式

如果指定了 `--batch N`，重复步骤 2-4 共 N 次，每次递增章节号。每章完成后输出进度。

### 6. 后续建议

单章完成：「第X章概要已生成。继续 /write [X+1] 或 /write --batch 20 批量生成。概要全部完成后使用 /expand 开始扩写。」

批量完成：「第X-Y章概要已生成（共Z章）。继续 /write [Y+1] --batch 20 或开始 /expand [章节号] 扩写。」
```

**Step 2: Commit**

```bash
git add templates/commands/write.md
git commit -m "refactor(write): rewrite as synopsis generator with minimal context"
```

---

## Task 8: Create expand.md command template

**Files:**
- Create: `templates/commands/expand.md`

**Step 1: Create expand.md**

```markdown
---
description: 将章节概要扩写为 3000-5000 字正文
argument-hint: [章节号] [--batch N]
---

用户输入：$ARGUMENTS

## 目标

将已生成的章节概要扩写为 3000-5000 字的完整正文。

## 参数解析

- 章节号：从 $ARGUMENTS 提取
- `--batch N`：批量扩写 N 章（最大 10），从指定章节号开始

## 资源加载（精准最小集）

1. **当前章概要**：读取 `stories/<story>/content/chapter-XXX-synopsis.md`（200-500字）
2. **前一章正文末尾**：读取前一章 `chapter-XXX.md` 的最后 500-800 字（衔接用）。如果前一章尚未扩写，读取前一章概要代替
3. **本章出场角色状态**：从概要中提取出场角色列表，然后从 `tracking/character-state.json` 只提取这些角色的条目
4. **本章活跃伏笔**：从 `tracking/plot-tracker.json` 提取 status=planted 或 status=hinted 且 keyChapters 包含当前章或相邻章（±3章）的伏笔
5. **风格参考**：读取 `resources/style-reference.md`
6. **反AI规范**：读取 `resources/anti-ai.md`

**总上下文控制在 2000-3000 字以内。**

**不加载**：specification.md、creative-plan.md、constitution.md、其他 tracking 文件

## 执行步骤

### 1. 前置检查

- 确认目标章节的 synopsis.md 存在，否则提示先运行 /write
- 确认目标章节的正文 chapter-XXX.md 不存在（避免覆盖），如已存在则询问是否覆盖

### 2. 加载上下文

按上述「资源加载」规则加载精准最小集。

### 3. 扩写正文

基于概要，扩写为 3000-5000 字正文。遵循以下原则：

- **忠实于概要**：核心事件、出场角色、情感走向必须与概要一致
- **文学表达**：专注于场景描写、对话、心理活动、动作细节
- **风格一致**：遵循 style-reference.md 的风格设定
- **反AI规范**：遵循 anti-ai.md 的写作规范
- **衔接自然**：与前一章末尾自然衔接
- **伏笔落地**：概要中标记的伏笔必须在正文中体现

写入 `stories/<story>/content/chapter-XXX.md`。

### 4. 补充 tracking 细节

扩写完成后，检查正文中是否产生了概要中没有的新细节：
- 对话中透露的新信息 → 更新 character-state 或 relationships
- 新的场景细节 → 如有重要设定变化，更新相关 tracking

### 5. 批量模式

如果指定了 `--batch N`，重复步骤 2-4 共 N 次。每章完成后输出进度和字数。

### 6. 后续建议

单章完成：「第X章扩写完成（XXXX字）。继续 /expand [X+1] 或使用 /analyze X 检查质量。」

批量完成：「第X-Y章扩写完成（共Z章，平均XXXX字/章）。使用 /analyze --range X-Y 批量检查质量。」
```

**Step 2: Commit**

```bash
git add templates/commands/expand.md
git commit -m "feat(expand): add new expand command for synopsis-to-prose conversion"
```

---

## Task 9: Rewrite analyze.md command template

**Files:**
- Modify: `templates/commands/analyze.md`

**Step 1: Replace analyze.md with simplified version**

```markdown
---
description: 质量检查：对比概要与正文，检测一致性和AI味
argument-hint: [章节号] [--range start-end]
---

用户输入：$ARGUMENTS

## 目标

对已扩写的章节进行质量检查，输出分析报告到终端。

## 参数解析

- 章节号：分析单章
- `--range start-end`：批量分析章节范围（如 `--range 1-20`）

## 资源加载

- 目标章节正文：`stories/<story>/content/chapter-XXX.md`
- 对应概要：`stories/<story>/content/chapter-XXX-synopsis.md`
- tracking 数据：`tracking/character-state.json`、`tracking/plot-tracker.json`

## 检查项（5项）

### 1. 概要符合度
对比正文与概要，检查：
- 概要中的核心事件是否都在正文中体现
- 出场角色是否一致
- 情感走向是否一致
- 章末钩子是否落地

评分：✅ 完全符合 / ⚠️ 部分偏离 / ❌ 严重偏离

### 2. 角色一致性
对比正文中角色行为与 tracking 中的角色状态：
- 角色性格是否一致（有无 OOC）
- 角色位置是否合理
- 角色关系互动是否符合 tracking 记录

评分：✅ / ⚠️ / ❌

### 3. 伏笔完整性
对比 plot-tracker 中标记的伏笔：
- 本章应埋设的伏笔是否在正文中体现
- 本章应回收的伏笔是否已回收
- 是否有遗漏

评分：✅ / ⚠️ / ❌

### 4. 连贯性
检查与前后章的衔接：
- 开头是否与前一章结尾自然衔接
- 时间线是否连续
- 场景转换是否合理

评分：✅ / ⚠️ / ❌

### 5. AI味检测
检查常见AI写作痕迹：
- AI高频词使用（然而、殊不知、缓缓、深邃等）
- 句式重复度
- 空洞描写比例
- 段落结构单一性

评分：✅ 自然 / ⚠️ 轻微AI味 / ❌ 明显AI味

## 输出格式

直接输出到终端，不生成文件：

```
## 第X章 质量分析报告

| 检查项 | 评分 | 说明 |
|--------|------|------|
| 概要符合度 | ✅ | ... |
| 角色一致性 | ⚠️ | ... |
| 伏笔完整性 | ✅ | ... |
| 连贯性 | ✅ | ... |
| AI味检测 | ⚠️ | ... |

### 需要关注的问题
1. [具体问题和建议]

### 后续建议
- 如有 ⚠️ 或 ❌：建议手动修改正文后重新 /analyze
- 全部 ✅：可以继续扩写下一章
```
```

**Step 2: Commit**

```bash
git add templates/commands/analyze.md
git commit -m "refactor(analyze): rewrite as 5-item quality checker"
```

---

## Task 10: Rewrite CLAUDE.md project template

**Files:**
- Modify: `templates/dot-claude/CLAUDE.md`

**Step 1: Replace CLAUDE.md with simplified version**

```markdown
# 小说创作核心规范

> 本文件由 novelws init 生成，定义五命令流水线的共享规范。

## 五命令流水线

```
/specify → /plan → /write → /expand → /analyze
```

| 命令 | 职责 |
|------|------|
| /specify | 定义故事设定、角色、世界观 |
| /plan | 生成卷级大纲 |
| /write | 逐章生成 200-500 字剧情概要 + tracking |
| /expand | 将概要扩写为 3000-5000 字正文 |
| /analyze | 质量检查（概要符合度、角色一致性、伏笔、连贯性、AI味） |

## 段落格式规范

- ⛔ 禁止使用"一"、"二"、"三"等数字标记分段
- ✅ 场景转换用两个空行（一个空白行）分隔

## 资源文件

| 文件 | 用途 | 加载阶段 |
|------|------|---------|
| resources/constitution.md | 创作宪法 | /specify |
| resources/style-reference.md | 风格参考 | /expand |
| resources/anti-ai.md | 反AI规范 | /expand |

## Tracking 文件

| 文件 | 用途 |
|------|------|
| tracking/character-state.json | 角色状态 |
| tracking/relationships.json | 角色关系 |
| tracking/plot-tracker.json | 情节线和伏笔 |
| tracking/timeline.json | 时间线 |

- /write 完成后自动更新 tracking 骨架
- /expand 完成后补充 tracking 细节
```

**Step 2: Commit**

```bash
git add templates/dot-claude/CLAUDE.md
git commit -m "refactor(CLAUDE.md): rewrite as minimal five-command spec"
```

---

## Task 11: Delete knowledge templates

**Files:**
- Delete: `templates/knowledge/` (entire directory)

**Step 1: Delete knowledge directory**

```bash
rm -rf templates/knowledge/
```

**Step 2: Commit**

```bash
git add templates/knowledge/
git commit -m "refactor(knowledge): remove knowledge templates for v5"
```

---

## Task 12: Update src/core/config.ts

**Files:**
- Modify: `src/core/config.ts`

**Step 1: Remove obsolete DIRS constants**

Remove from DIRS:
- `SPECIFY` (no longer used)
- `SPEC` (no longer used)
- `KNOWLEDGE_BASE` (no longer used)
- `PLUGINS` (no longer used)
- `MEMORY` (no longer used, resources are flat)
- `KNOWLEDGE` (no longer used)
- `SCRIPTS` (no longer used)
- `SUMMARY` (no longer used)
- `VOLUMES` (no longer used)
- `CACHE` (no longer used)

Keep:
- `CLAUDE`, `STORIES`, `COMMANDS`, `SKILLS` (kept for backward compat even though empty), `TEMPLATES`, `TRACKING`, `RESOURCES`

Updated DIRS:
```typescript
export const DIRS = {
  CLAUDE: '.claude',
  STORIES: 'stories',
  COMMANDS: 'commands',
  TEMPLATES: 'templates',
  TRACKING: 'tracking',
  RESOURCES: 'resources',
} as const;
```

**Step 2: Remove obsolete FILES constants**

Remove from FILES:
- `PLUGIN_REGISTRY`
- `PLUGIN_CONFIG`
- `RESOURCE_DIGEST`
- `WRITE_CONTEXT`

Keep:
- `CONFIG`, `GITIGNORE`, `MCP_SERVERS`

Updated FILES:
```typescript
export const FILES = {
  CONFIG: 'config.json',
  GITIGNORE: '.gitignore',
  MCP_SERVERS: 'mcp-servers.json',
} as const;
```

**Step 3: Simplify getProjectPaths**

```typescript
export function getProjectPaths(projectRoot: string) {
  return {
    root: projectRoot,
    // .claude/
    claude: path.join(projectRoot, DIRS.CLAUDE),
    claudeMd: path.join(projectRoot, DIRS.CLAUDE, 'CLAUDE.md'),
    commands: path.join(projectRoot, DIRS.CLAUDE, DIRS.COMMANDS),
    // resources/
    resources: path.join(projectRoot, DIRS.RESOURCES),
    resourcesConfig: path.join(projectRoot, DIRS.RESOURCES, FILES.CONFIG),
    // tracking/
    tracking: path.join(projectRoot, DIRS.TRACKING),
    // stories/
    stories: path.join(projectRoot, DIRS.STORIES),
  };
}
```

**Step 4: Simplify getTemplateSourcePaths**

```typescript
export function getTemplateSourcePaths() {
  const templatesDir = getTemplatesDir();
  return {
    commands: path.join(templatesDir, DIRS.COMMANDS),
    dotClaude: path.join(templatesDir, 'dot-claude'),
    resources: path.join(templatesDir, DIRS.RESOURCES),
    tracking: path.join(templatesDir, DIRS.TRACKING),
    all: templatesDir,
  };
}
```

**Step 5: Commit**

```bash
git add src/core/config.ts
git commit -m "refactor(config): simplify path constants for v5 architecture"
```

---

## Task 13: Update src/commands/init.ts

**Files:**
- Modify: `src/commands/init.ts`

**Step 1: Remove obsolete options**

Remove these CLI options:
- `--plugins <names>` (no plugin system)
- `--scale <size>` (no sharding)
- `--with-mcp` (no MCP)

Keep:
- `[name]` argument
- `--here`
- `--model <name>`
- `--no-git`

**Step 2: Simplify directory creation**

Replace baseDirs array (lines 61-72) with:
```typescript
const baseDirs = [
  paths.claude,
  paths.commands,
  paths.resources,
  paths.tracking,
  paths.stories,
];
```

**Step 3: Remove skills copy block**

Delete lines 104-108 (copy skills to .claude/skills/).

**Step 4: Remove large-scale sharding block**

Delete lines 137-153 (create volumes/vol-01, copy tracking to shards).

**Step 5: Remove knowledge copy block**

Delete lines 155-158 (copy knowledge templates).

**Step 6: Remove MCP config block**

Delete lines 160-173 (MCP config generation).

**Step 7: Remove plugin installation block**

Delete lines 176-191 (plugin installation).

**Step 8: Simplify config.json generation**

Replace config object (lines 79-87) with:
```typescript
const config = {
  name,
  type: 'novel',
  version: getVersion(),
  created: new Date().toISOString(),
};
```

Write to `path.join(paths.resources, FILES.CONFIG)`.

**Step 9: Update post-init console output**

Replace the seven-step methodology display (lines 218-233) with:
```typescript
console.log('\n' + chalk.yellow('     📝 五命令流水线:'));
console.log(`     ${chalk.cyan('/specify')}  - 定义故事设定、角色、世界观`);
console.log(`     ${chalk.cyan('/plan')}     - 生成卷级大纲`);
console.log(`     ${chalk.cyan('/write')}    - 逐章生成剧情概要`);
console.log(`     ${chalk.cyan('/expand')}   - 将概要扩写为正文`);
console.log(`     ${chalk.cyan('/analyze')}  - 质量检查`);
```

Remove the tracking commands section and the "Agent Skills 会自动激活" line.

**Step 10: Remove unused imports**

Remove `PluginManager` import (line 12) since plugins are removed.

**Step 11: Commit**

```bash
git add src/commands/init.ts
git commit -m "refactor(init): simplify to five-command pipeline, remove plugins/MCP/sharding"
```

---

## Task 14: Update tests

**Files:**
- Modify: `tests/integration/init-project.test.ts`
- Modify: `tests/integration/template-validation.test.ts`
- Delete: `tests/unit/skills/writing-balance.test.ts`
- Delete: `tests/integration/phase1-writing-balance.test.ts`
- Delete: `tests/integration/phase4-commands.test.ts`
- Delete: `tests/integration/phase5-commands.test.ts`
- Delete: `tests/integration/ultra-long-novel.test.ts`
- Delete: `tests/unit/tracking/migration.test.ts`

**Step 1: Rewrite init-project.test.ts**

Key changes:
- Remove test "should copy skills to .claude/skills/" — no skills in v5
- Remove test "should create summary directory with --scale large" — no sharding
- Remove test "should NOT create summary/volumes directories without --scale large"
- Remove test "should store scale in config.json when --scale large"
- Remove test "should store withMcp flag in config.json when --with-mcp"
- Remove test "should imply --scale large when --with-mcp"
- Remove test "should copy volume-summary and search commands"
- Remove test "should copy long-series-continuity skill"
- Update test "should create project with correct directory structure":
  - Remove `.claude/skills` assertion
  - Keep `.claude`, `resources`, `stories`, `tracking`
- Update test "should copy commands to .claude/commands/":
  - Change requiredCommands to `['specify.md', 'plan.md', 'write.md', 'expand.md', 'analyze.md']`
  - Change `commands.length >= 8` to `commands.length === 5`
- Update test "should generate CLAUDE.md in .claude/":
  - Change content assertions to match new CLAUDE.md (`五命令流水线`, `/expand`)
- Add new test "should have only 3 resource files":
  ```typescript
  const resourceFiles = fs.readdirSync(path.join(projectPath, 'resources'))
    .filter(f => f.endsWith('.md'));
  expect(resourceFiles).toContain('constitution.md');
  expect(resourceFiles).toContain('style-reference.md');
  expect(resourceFiles).toContain('anti-ai.md');
  ```
- Add new test "should have 4 tracking JSON files":
  ```typescript
  const trackingFiles = fs.readdirSync(path.join(projectPath, 'tracking'));
  expect(trackingFiles).toEqual(expect.arrayContaining([
    'character-state.json', 'relationships.json', 'plot-tracker.json', 'timeline.json'
  ]));
  expect(trackingFiles.length).toBe(4);
  ```

**Step 2: Rewrite template-validation.test.ts**

Key changes:
- Replace "Command Templates" describe block:
  - Change required commands to `['specify.md', 'plan.md', 'write.md', 'expand.md', 'analyze.md']`
  - Change `commands.length >= 10` to `commands.length === 5`
  - Remove all v4-specific content assertions (narrative-threads, foreshadowing health, etc.)
  - Add: test expand.md exists and contains "概要" and "扩写"
  - Add: test write.md contains "概要" and "tracking"
- Remove entire "Skill Templates" describe block
- Replace "Knowledge Base" describe block with "Resource Templates":
  - Test only 3 files exist: constitution.md, style-reference.md, anti-ai.md
  - Remove categories test (craft, genres, requirements, styles)
- Remove entire "Script Templates" describe block

**Step 3: Delete obsolete test files**

```bash
rm tests/unit/skills/writing-balance.test.ts
rm tests/integration/phase1-writing-balance.test.ts
rm tests/integration/phase4-commands.test.ts
rm tests/integration/phase5-commands.test.ts
rm tests/integration/ultra-long-novel.test.ts
rm tests/unit/tracking/migration.test.ts
```

**Step 4: Run tests**

```bash
npx jest --config jest.config.cjs
```

Expected: All tests pass.

**Step 5: Commit**

```bash
git add tests/
git commit -m "test: update all tests for v5 five-command architecture"
```

---

## Task 15: Build, verify, and version bump

**Files:**
- Modify: `package.json` (version bump)
- Modify: `CHANGELOG.md`

**Step 1: Build the project**

```bash
npm run build
```

Expected: No errors.

**Step 2: Run full test suite**

```bash
npm test
```

Expected: All tests pass.

**Step 3: Manual verification**

```bash
node dist/cli.js init test-v5-project --no-git
```

Verify:
- `test-v5-project/.claude/commands/` has exactly 5 files
- `test-v5-project/.claude/skills/` does NOT exist
- `test-v5-project/resources/` has exactly 3 .md files + config.json
- `test-v5-project/tracking/` has exactly 4 .json files
- No `summary/`, `volumes/`, `plugins/` directories

```bash
rm -rf test-v5-project
```

**Step 4: Update package.json version**

Change version from `4.0.0` to `5.0.0`.

**Step 5: Update CHANGELOG.md**

Add v5.0.0 entry at the top.

**Step 6: Final commit**

```bash
git add package.json CHANGELOG.md
git commit -m "release: bump version to v5.0.0 with synopsis-first architecture"
```
