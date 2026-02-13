# Token 优化实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 精简 write.md、analyze.md、plan.md 三个核心命令的 prompt，减少 76% 的 token 消耗，同时保持写作质量不变。

**Architecture:** 将命令 prompt 中的冗余内容（重复规范、JSON 示例、条件分支）提取到独立文件（skill、knowledge-base、CLAUDE.md），命令 prompt 只保留执行指令和引用链接。通过 CLAUDE.md（system prompt 自动缓存）承载跨命令共享原则，通过会话级资源复用减少重复读取。

**Tech Stack:** TypeScript (src/)、Markdown 模板 (templates/)、Jest 测试、fs-extra 文件操作

**Design Doc:** `docs/plans/2026-02-12-token-optimization-design.md`

---

## Phase 1: 创建外部文件（被引用的资源）

先创建所有被其他精简步骤引用的外部文件，确保精简命令时有引用目标。

### Task 1: 创建具象化检查文件 (concretization.md)

**Files:**
- Create: `templates/knowledge-base/requirements/concretization.md`

**Step 1: 从 write.md 提取具象化检查内容**

从 `templates/commands/write.md` 的第 1102-1196 行提取完整的具象化检查清单和示例，创建为独立文件。

Read `templates/commands/write.md` lines 1102-1196，将以下内容写入新文件：

```markdown
# 具象化写作检查清单

> 来源：从 /write 命令提取的具象化检查规范

## 识别抽象表达

### 时间抽象 → 具体化
- "最近" → "上周三下午"
- "很久以前" → "三年前的秋天"
- "不久前" → "昨天早上八点"
- "过了很久" → "等了整整两个小时"

### 人物抽象 → 具体化
- "很多人" → "我身边至少有5个朋友"
- "有人说" → "李叔告诉我" / "隔壁老王提起过"
- "大家都知道" → "村里的老人都说"
- "据说" → "听王叔私下说过"

### 数量抽象 → 具体化
- "效果很好" → "这次比上次多收了三石粮"
- "很贵" → "一顿饭花了三百块"
- "很远" → "开车要两小时"
- "很多" → "至少有二十个"

### 场景抽象 → 具体化
- "房间很乱" → "地上堆着三天没洗的衣服"
- "天气很冷" → "呼出的气都能看见白雾"
- "很累" → "走了整整五个小时山路"
- "气氛紧张" → "没人说话,只听见时钟滴答声"

## 主动搜索建议

当遇到以下情况时,考虑使用 WebSearch 获取真实细节：
- 历史事件：搜索真实日期、人物、地点
- 技术细节：搜索实际参数、专业术语
- 地理信息：搜索真实地名、距离、地标
- 文化习俗：搜索当地方言、习俗、特产

## 具象化自检问题

- [ ] 时间是否具体？（避免"最近"、"很久"）
- [ ] 人物来源是否明确？（避免"有人"、"大家"）
- [ ] 数量是否精确？（避免"很多"、"不少"）
- [ ] 场景细节是否可见？（避免"很xx"的形容）
- [ ] 是否用了真实的地名/人名/数据？
- [ ] 对话是否有具体内容？（避免"他说了很多"）

## 适度原则

- ✅ 关键情节必须具象：转折点、高潮、伏笔
- ✅ 重要细节必须具象：第一印象、关键道具
- ⚠️ 次要信息可以概括：过渡段落、背景铺陈
- ❌ 避免过度具象：流水账、啰嗦

## 示例对比

❌ **抽象版**（AI腔）:
> 最近城里发生了很多事,大家都在议论。王强听说后很担心,决定去看看情况。

✅ **具象版**（真实感）:
> 上周三开始,菜市场的李婶就一直在说东街出事了。
>
> 王强听了两天,实在忍不住:"到底出什么事了？"
>
> "死了人啊！"李婶压低声音,"听说是那个开超市的老张..."
>
> 王强心里一紧。老张他认识,上个月还在他那买过米。
>
> 他决定下午过去看看。
```

**Step 2: 验证文件创建**

Run: `npx jest --config jest.config.cjs tests/integration/template-validation.test.ts --testNamePattern "knowledge-base" -v`

确认测试仍然通过（新文件在 requirements/ 下，已有 requirements 测试）。

**Step 3: Commit**

```bash
git add templates/knowledge-base/requirements/concretization.md
git commit -m "feat: extract concretization checklist from write.md to standalone file"
```

---

### Task 2: 创建 auto-tracking SKILL 文件

**Files:**
- Create: `templates/skills/auto-tracking/SKILL.md`

**Step 1: 从 write.md 和 analyze.md 提取 Tracking 处理格式**

从 `templates/commands/write.md` 第 1267-1580 行提取完整的 Tracking 更新格式、JSON 示例、日志格式和错误处理，创建为独立 skill 文件。

Read `templates/commands/write.md` lines 1267-1580，写入新文件（包含完整的 4 个 JSON 文件更新格式、tracking-log.md 日志格式、错误处理策略）。

文件应包含以下核心结构：
- 自动更新的 4 个文件说明（character-state.json, relationships.json, plot-tracker.json, timeline.json）
- 每个文件的更新内容和 JSON 示例
- 更新执行流程（4 步：分析、生成、应用、记录）
- tracking-log.md 日志格式
- Checkpoint 完成标记
- 错误处理（文件不存在、JSON 格式错误、更新失败）
- 性能考虑（批量更新、增量写入）

**Step 2: Commit**

```bash
git add templates/skills/auto-tracking/SKILL.md
git commit -m "feat: extract auto-tracking skill from write.md post-processing"
```

---

### Task 3: 创建 CLAUDE.md 模板

**Files:**
- Create: `templates/dot-claude/CLAUDE.md`
- Modify: `src/core/config.ts` — 添加 `dotClaude` 路径
- Modify: `src/commands/init.ts` — 添加 CLAUDE.md 复制逻辑

**Step 1: 创建 CLAUDE.md 模板文件**

创建 `templates/dot-claude/CLAUDE.md`，内容为跨命令共享的核心原则（~150 行）：

```markdown
# 小说创作核心原则

> 本文件由 novelws init 生成，包含所有 Slash Command 共享的核心写作规范。
> 修改此文件会影响所有命令的行为。

## 反 AI 写作核心

- **段落结构**：单句成段比例 30%-50%，每段 50-100 字
- **句式**：短句优先（15-25 字），白话替代文绉绉
- **描写**：删除装饰性形容词，一个准确细节胜过三个堆砌
- **禁止**：「然而」「殊不知」「缓缓」「深邃」「仿佛...一般」等 AI 高频词
- **完整规范**：`.specify/templates/knowledge-base/requirements/anti-ai-v4.md`

## 段落格式规范

- ⛔ 禁止使用"一"、"二"、"三"等数字标记分段
- ✅ 场景转换用两个空行（一个空白行）分隔
- 📖 原因：数字标记破坏阅读沉浸感

## 后置 Tracking 处理

- `/write` 完成后**自动**更新 4 个 tracking 文件（character-state, relationships, plot-tracker, timeline）
- `/analyze` 完成后**询问用户确认**后更新 tracking 文件
- 格式详情：`.claude/skills/auto-tracking/SKILL.md`

## 会话级资源复用

本次对话中已加载的资源知识应复用，避免重复读取文件：

1. **首次加载**：读取资源文件内容，记住已加载的资源列表
2. **后续命令**：检查资源是否在"已加载列表"中
   - ✅ 已加载：直接使用已有知识，不重新读取文件
   - ❌ 未加载：读取文件并添加到"已加载列表"
3. **例外**：用户明确要求"重新加载"时重新读取

## 前文内容加载策略

写作下一章时的前文加载规则：
1. 读取上一章的完整文件
2. 如果 > 1500 字，只保留最后 1000 字（覆盖最后 1-2 个场景）
3. 如果 ≤ 1500 字，保留全部内容
4. 额外读取上一章的标题和开篇第一段

**补充上下文来源**（不依赖前文全文）：
- `creative-plan.md`：章节大纲和情节走向
- `tasks.md`：当前章节具体写作任务
- `spec/tracking/*.json`：角色状态、关系、情节线、时间线

## /compact 使用建议

每写完 2-3 章后，建议执行 `/compact` 压缩对话历史：
- compact 会保留：已加载资源列表、最近章节要点、角色状态概要
- compact 会清除：完整的旧章节文本、工具调用详细日志
- 原因：tracking 系统已捕获关键信息，不依赖对话历史
```

**Step 2: 在 config.ts 中添加路径**

在 `src/core/config.ts` 的 `getTemplateSourcePaths()` 函数中添加 `dotClaude` 路径：

```typescript
// 在 getTemplateSourcePaths() 的 return 对象中添加：
dotClaude: path.join(templatesDir, 'dot-claude'),
```

在 `getProjectPaths()` 中添加 `claudeMd` 路径：

```typescript
// 在 getProjectPaths() 的 return 对象中添加：
claudeMd: path.join(projectRoot, DIRS.CLAUDE, 'CLAUDE.md'),
```

**Step 3: 在 init.ts 中添加 CLAUDE.md 复制逻辑**

在 `src/commands/init.ts` 的复制 Skills 文件之后（约第 93 行后），添加：

```typescript
// 复制 CLAUDE.md 到 .claude/
if (await fs.pathExists(templates.dotClaude)) {
  const claudeMdSrc = path.join(templates.dotClaude, 'CLAUDE.md');
  if (await fs.pathExists(claudeMdSrc)) {
    await fs.copy(claudeMdSrc, paths.claudeMd, { overwrite: false });
    spinner.text = '已安装 CLAUDE.md 核心规范...';
  }
}
```

**Step 4: 运行现有测试确认无破坏**

Run: `npx jest --config jest.config.cjs -v`

所有 161 个测试应通过。

**Step 5: 添加新测试验证 CLAUDE.md 生成**

在 `tests/integration/init-project.test.ts` 中添加测试用例，验证 init 生成的项目包含 `.claude/CLAUDE.md`。

**Step 6: 运行测试验证**

Run: `npx jest --config jest.config.cjs tests/integration/init-project.test.ts -v`

**Step 7: Commit**

```bash
git add templates/dot-claude/CLAUDE.md src/core/config.ts src/commands/init.ts tests/integration/init-project.test.ts
git commit -m "feat: add CLAUDE.md template with shared writing principles for generated projects"
```

---

## Phase 2: 精简 write.md

### Task 4: 精简 write.md — 移除重复的反 AI 规范

**Files:**
- Modify: `templates/commands/write.md`

**Step 1: 移除内嵌的反 AI 规范（第 950-1024 行）**

Read `templates/commands/write.md` lines 945-1044。

删除「反AI检测写作规范」段落下的全部详细内容（段落结构规范示例、禁止事项清单 5 条、自然化写作原则 4 条、自检标准），只保留对 `anti-ai-v4.md` 的引用指令（第 1025-1039 行）和一个精简版提醒（~10 行）。

替换为：

```markdown
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
```

**Step 2: 运行测试确认无破坏**

Run: `npx jest --config jest.config.cjs tests/integration/template-validation.test.ts -v`

**Step 3: Commit**

```bash
git add templates/commands/write.md
git commit -m "refactor(write): remove duplicated anti-AI rules, reference anti-ai-v4.md"
```

---

### Task 5: 精简 write.md — 移除具象化检查清单

**Files:**
- Modify: `templates/commands/write.md`

**Step 1: 替换具象化检查清单（第 1102-1196 行）为引用**

Read `templates/commands/write.md` lines 1100-1200。

将完整的具象化检查清单、示例对比替换为：

```markdown
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
```

**Step 2: Commit**

```bash
git add templates/commands/write.md
git commit -m "refactor(write): extract concretization checklist to standalone file"
```

---

### Task 6: 精简 write.md — 精简后置处理

**Files:**
- Modify: `templates/commands/write.md`

**Step 1: 替换后置处理详细内容（第 1267-1580 行）为引用**

Read `templates/commands/write.md` lines 1265-1582。

将 4 个 JSON 文件的完整示例、日志格式模板、错误处理替换为精简版：

```markdown
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

### 智能推荐（后置）

检查 P0/P1 级别推荐（角色缺席、伏笔紧急度），在命令链式提示中展示。
```

**Step 2: Commit**

```bash
git add templates/commands/write.md
git commit -m "refactor(write): extract tracking details to auto-tracking skill"
```

---

### Task 7: 精简 write.md — 精简三层资源加载说明

**Files:**
- Modify: `templates/commands/write.md`

**Step 1: 精简三层资源加载的 JavaScript 伪代码（第 162-537 行）**

Read `templates/commands/write.md` lines 160-540。

保留：
- Layer 1/2/3 的概念说明（各 ~10 行）
- 配置示例（YAML 格式，~20 行）
- 关键词触发的交互流程（用户确认提示，~15 行）

删除：
- JavaScript 伪代码（第 264-380 行的 `const textToScan...`, `for...of...`, `regex.test...` 等）
- 去重检查的 JavaScript 代码（第 348-378 行）
- 动态资源加载的 JavaScript 代码（第 425-443 行）
- 交互过程中实时触发的 JavaScript 代码（第 456-473 行）

替换为精简版：

```markdown
### 🆕 Layer 3: 运行时关键词触发（动态加载）

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
```

**Step 2: 同时精简会话级资源复用段落（第 540-573 行）**

替换为：

```markdown
## 性能优化：会话级资源复用

> 详见 CLAUDE.md 中的「会话级资源复用」章节，此处不再重复。
```

**Step 3: Commit**

```bash
git add templates/commands/write.md
git commit -m "refactor(write): simplify resource loading docs, remove JS pseudocode"
```

---

### Task 8: 精简 write.md — 移除使用场景示例

**Files:**
- Modify: `templates/commands/write.md`

**Step 1: 删除使用场景示例段落**

删除 write.md 末尾的教学性内容，如场景示例（如果存在）。同时精简命令链式提示和"与方法论的关系"段落，因为这些是每个命令都有的通用内容，可引用 CLAUDE.md。

**Step 2: 统计精简后的行数**

Read 精简后的 `templates/commands/write.md`，确认总行数接近 ~400 行（考虑到实际操作中可能需要保留更多上下文，允许 300-500 行范围）。

**Step 3: 运行全部测试**

Run: `npx jest --config jest.config.cjs -v`

所有测试应通过。

**Step 4: Commit**

```bash
git add templates/commands/write.md
git commit -m "refactor(write): complete prompt simplification, ~400 lines from 1617"
```

---

## Phase 3: 精简 analyze.md — 提取 10 种专项分析

### Task 9: 提取 10 种专项分析为独立 skill 文件

**Files:**
- Create: `templates/skills/analysis/opening-analysis/SKILL.md`
- Create: `templates/skills/analysis/pacing-analysis/SKILL.md`
- Create: `templates/skills/analysis/character-analysis/SKILL.md`
- Create: `templates/skills/analysis/foreshadow-analysis/SKILL.md`
- Create: `templates/skills/analysis/logic-analysis/SKILL.md`
- Create: `templates/skills/analysis/style-analysis/SKILL.md`
- Create: `templates/skills/analysis/reader-analysis/SKILL.md`
- Create: `templates/skills/analysis/hook-analysis/SKILL.md`
- Create: `templates/skills/analysis/power-analysis/SKILL.md`
- Create: `templates/skills/analysis/voice-analysis/SKILL.md`

**Step 1: 逐个提取专项分析**

Read `templates/commands/analyze.md` lines 464-1272。

从 analyze.md 中逐个提取 10 种专项分析的完整内容，每种创建为独立的 SKILL.md 文件。每个文件包含：
- 专项分析的目标
- 前置加载资源
- 分析维度和方法
- 输出格式模板
- 评分标准

**Step 2: Commit**

```bash
git add templates/skills/analysis/
git commit -m "feat: extract 10 analysis modes from analyze.md to separate skills"
```

---

### Task 10: 精简 analyze.md 主体

**Files:**
- Modify: `templates/commands/analyze.md`

**Step 1: 替换 10 种专项分析为调度表**

将 analyze.md 中 800 行的专项分析内容替换为 ~40 行的调度表：

```markdown
### 🆕 B5.1 专项分析（可选）

**如果用户指定了 `--focus` 参数，读取对应的分析 Skill 文件并执行**：

| 参数 | 分析类型 | Skill 文件 |
|------|---------|-----------|
| `--focus=opening` | 开篇分析 | `.claude/skills/analysis/opening-analysis/SKILL.md` |
| `--focus=pacing` | 节奏分析 | `.claude/skills/analysis/pacing-analysis/SKILL.md` |
| `--focus=character` | 人物分析 | `.claude/skills/analysis/character-analysis/SKILL.md` |
| `--focus=foreshadow` | 伏笔分析 | `.claude/skills/analysis/foreshadow-analysis/SKILL.md` |
| `--focus=logic` | 逻辑分析 | `.claude/skills/analysis/logic-analysis/SKILL.md` |
| `--focus=style` | 风格分析 | `.claude/skills/analysis/style-analysis/SKILL.md` |
| `--focus=reader` | 读者体验 | `.claude/skills/analysis/reader-analysis/SKILL.md` |
| `--focus=hook` | 钩子分析 | `.claude/skills/analysis/hook-analysis/SKILL.md` |
| `--focus=power` | 力量体系 | `.claude/skills/analysis/power-analysis/SKILL.md` |
| `--focus=voice` | 对话一致性 | `.claude/skills/analysis/voice-analysis/SKILL.md` |

**执行流程**：读取对应 Skill 文件 → 按文件中的指令执行分析 → 输出报告
```

**Step 2: 精简资源加载和会话复用段落**

将重复的资源加载协议（Layer 1-3）和会话级资源复用（第 126-200 行）替换为引用：

```markdown
### A1.1. 加载分析辅助资源

运行 `{SCRIPT}` 获取资源加载报告。

**资源加载规则**：参见 CLAUDE.md 中的「会话级资源复用」章节。

**分析专用资源**：
- /analyze 需要**所有** craft 知识库用于质量对照检查
- /analyze 需要 quality-assurance skills 用于一致性验证
- 如果 specification.md 配置了 `resource-loading.analysis`，按配置覆盖
```

**Step 3: 精简后置处理段落**

将询问式 Tracking 更新的详细流程（第 1680-1978 行）替换为精简版，引用 `auto-tracking/SKILL.md`。

**Step 4: 删除使用场景示例和教学性注意事项**

删除第 1418-1541 行的使用场景示例和第 1572-1654 行的教学性注意事项。

**Step 5: 统计精简后的行数**

确认 analyze.md 总行数在 ~400 行范围内。

**Step 6: 运行全部测试**

Run: `npx jest --config jest.config.cjs -v`

**Step 7: Commit**

```bash
git add templates/commands/analyze.md
git commit -m "refactor(analyze): simplify prompt to ~400 lines, dispatch to skill files"
```

---

## Phase 4: 精简 plan.md

### Task 11: 提取网文结构模板和卷级规划

**Files:**
- Create: `templates/knowledge-base/craft/story-structures.md`
- Create: `templates/skills/planning/volume-detail/SKILL.md`

**Step 1: 从 plan.md 提取 4 种网文结构模板**

Read `templates/commands/plan.md` lines 229-365。

将 4 种网文结构模板（升级流、副本流、任务流、日常流）和结构选择建议表提取到：`templates/knowledge-base/craft/story-structures.md`

**Step 2: 从 plan.md 提取卷级详细规划**

Read `templates/commands/plan.md` lines 507-728。

将卷级详细规划流程（Step 1-6）和多卷批量规划提取到：`templates/skills/planning/volume-detail/SKILL.md`

**Step 3: Commit**

```bash
git add templates/knowledge-base/craft/story-structures.md templates/skills/planning/volume-detail/SKILL.md
git commit -m "feat: extract story structures and volume-detail planning from plan.md"
```

---

### Task 12: 精简 plan.md 主体

**Files:**
- Modify: `templates/commands/plan.md`

**Step 1: 替换网文结构模板为引用**

将 4 种结构模板替换为：

```markdown
#### 2.1 写作方法选择

基于规格分析和故事类型，选择最适合的写作方法：
- **三幕结构**：适合线性叙事
- **英雄之旅**：适合成长型故事
- **七点结构**：适合悬念反转
- **故事圈**：适合角色驱动
- **网文专用结构**：升级流/副本流/任务流/日常流

> **网文结构模板详情**：读取 `templates/knowledge-base/craft/story-structures.md`
> 包含每种结构的卷模板、爽点分布、选择建议表
```

**Step 2: 替换卷级详细规划为引用**

```markdown
#### 2.2.1 卷级详细规划（`--detail vol-XX`）

**触发条件**：`$ARGUMENTS` 包含 `--detail vol-XX`

> **完整规划流程**：读取 `.claude/skills/planning/volume-detail/SKILL.md`
> 包含：卷概要确认、逐章规划、节奏总览、写入策略、任务生成、灵感分配
```

**Step 3: 精简资源加载和会话复用**

替换为引用 CLAUDE.md。

**Step 4: 精简后置处理**

替换 plot-tracker 更新的详细 JSON 示例为引用 auto-tracking skill。

**Step 5: 统计精简后行数**

确认 plan.md 总行数在 ~400 行范围内。

**Step 6: 运行全部测试**

Run: `npx jest --config jest.config.cjs -v`

**Step 7: Commit**

```bash
git add templates/commands/plan.md
git commit -m "refactor(plan): simplify prompt to ~400 lines, extract structures and volume-detail"
```

---

## Phase 5: 跨命令共享内容清理

### Task 13: 清理其他命令中的重复内容

**Files:**
- Modify: 所有包含「会话级资源复用」重复段落的命令文件

**Step 1: 识别并替换重复内容**

在以下命令文件中，将「会话级资源复用」段落（~35 行）替换为引用 CLAUDE.md 的单行：

```markdown
> **性能优化**：参见 CLAUDE.md 中的「会话级资源复用」章节。
```

涉及的文件：
- `templates/commands/track.md`
- `templates/commands/specify.md`
- `templates/commands/recap.md`
- 其他包含相同段落的命令

**Step 2: 运行全部测试**

Run: `npx jest --config jest.config.cjs -v`

**Step 3: Commit**

```bash
git add templates/commands/
git commit -m "refactor: replace duplicated session-reuse docs with CLAUDE.md reference"
```

---

### Task 14: 最终验证和版本更新

**Files:**
- Modify: `package.json` — 版本号
- Modify: `CHANGELOG.md` — 更新日志（如存在）

**Step 1: 运行全部测试**

Run: `npx jest --config jest.config.cjs -v`

所有测试必须通过。

**Step 2: 验证精简效果**

统计三个核心命令精简后的行数：

```bash
wc -l templates/commands/write.md templates/commands/analyze.md templates/commands/plan.md
```

预期结果：
- write.md: ~300-500 行（从 1,617 行）
- analyze.md: ~350-450 行（从 2,070 行）
- plan.md: ~350-450 行（从 1,286 行）

**Step 3: 验证新建文件完整**

确认所有新建文件存在且非空：
- `templates/dot-claude/CLAUDE.md`
- `templates/knowledge-base/requirements/concretization.md`
- `templates/skills/auto-tracking/SKILL.md`
- `templates/skills/analysis/` 下 10 个 SKILL.md
- `templates/knowledge-base/craft/story-structures.md`
- `templates/skills/planning/volume-detail/SKILL.md`

**Step 4: Commit（如有残余修改）**

```bash
git add -A
git commit -m "chore: token optimization complete - 76% reduction for core commands"
```
