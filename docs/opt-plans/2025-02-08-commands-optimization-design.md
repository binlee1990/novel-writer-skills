# Commands 优化设计文档

**创建日期**: 2025-02-08
**目标**: 重新综合分析和扩展优化所有 templates/commands，使其能够适配和应用所有 templates/knowledge-base、templates/memory、templates/skills、templates/tracking、templates/scripts、templates/knowledge

---

## 目录

1. [整体架构设计](#1-整体架构设计)
2. [配置文件格式设计](#2-配置文件格式设计)
3. [智能推断规则设计](#3-智能推断规则设计)
4. [关键词触发机制设计](#4-关键词触发机制设计)
5. [Scripts 扩展设计](#5-scripts-扩展设计)
6. [Tracking 自动更新机制](#6-tracking-自动更新机制)
7. [Command 实现示例 - /write](#7-command-实现示例---write)
8. [Command 实现示例 - /analyze](#8-command-实现示例---analyze)
9. [分阶段实施路线图](#9-分阶段实施路线图)

---

## 1. 整体架构设计

### 三层资源加载机制

**Layer 1: 默认智能推断（自动）**
- Commands 根据上下文自动推断需要的资源
- 推断规则：
  - `/write` → 自动加载所有 5 个 craft knowledge-base
  - `/analyze` → 自动加载 quality-assurance skills
  - 检测到类型关键词（如 "romance"）→ 加载对应 genre knowledge

**Layer 2: 配置文件声明（覆盖）**
- 在 `specification.md` YAML frontmatter 中显式声明
- 配置可以：
  - **禁用**默认推断（`auto-load: false`）
  - **扩展**默认推断（添加额外的 knowledge-base）
  - **精简**默认推断（排除某些不需要的资源）

**Layer 3: 运行时关键词触发（增强）**
- 在 command 执行过程中，检测用户输入/内容中的关键词
- 动态加载相关资源（不在 Layer 1/2 中的）
- 例如：用户在 `/write` 过程中提到"节奏太慢" → 自动提示 pacing-control skill

**优先级**：配置声明 > 智能推断 > 关键词触发

---

## 2. 配置文件格式设计

### specification.md 的 YAML Frontmatter 扩展

```yaml
---
# 现有字段
title: "我的小说"
genre: romance
writing-style: natural-voice
writing-requirements:
  - anti-ai-v4
  - fast-paced

# 新增：资源加载配置
resource-loading:
  # 控制自动推断
  auto-load: true  # false 则完全禁用智能推断

  # 知识库配置
  knowledge-base:
    craft:
      - dialogue        # 明确启用
      - scene-structure
      - "!character-arc"  # ! 前缀表示禁用（即使默认推断会加载）
    genres:
      - romance         # 自动从 genre 字段推断，也可手动指定
    requirements:
      - anti-ai-v4      # 自动从 writing-requirements 推断

  # Skills 配置
  skills:
    writing-techniques:
      - dialogue-techniques
      - pacing-control
      - "!character-arc"  # 禁用某个 skill
    quality-assurance:
      - consistency-checker  # 默认会加载，可省略

  # 关键词触发配置
  keyword-triggers:
    enabled: true  # 是否启用运行时关键词触发
    custom-mappings:  # 自定义关键词映射
      "情感节奏": knowledge-base/craft/pacing.md
      "甜度": knowledge-base/genres/romance.md

  # 分析命令专用配置
  analysis:
    knowledge-base:
      craft:
        - dialogue
        - pacing
    skills:
      quality-assurance:
        - consistency-checker
---
```

**设计要点**：
- 向后兼容：如果没有 `resource-loading` 配置，使用默认智能推断
- `!` 前缀表示显式禁用（覆盖默认推断）
- 可以只配置部分字段，其他使用默认值
- `analysis` 字段用于 `/analyze` 等分析命令的专用配置

---

## 3. 智能推断规则设计

### 各 Command 的默认资源加载规则

#### 核心创作 Commands（自动更新 tracking）

**`/write` - 章节写作**
- **Knowledge-base**:
  - craft/* (所有 5 个：dialogue, scene-structure, character-arc, pacing, show-not-tell)
  - genres/* (根据 specification.genre 推断)
  - requirements/* (根据 writing-requirements 推断)
- **Skills**:
  - writing-techniques/* (全部)
  - quality-assurance/consistency-checker (后台监控)
- **Tracking**: 自动更新 character-state, plot-tracker, relationships, timeline
- **Scripts**: check-writing-state.sh (前置检查)

**`/plan` - 制定创作计划**
- **Knowledge-base**:
  - craft/scene-structure, craft/character-arc (结构相关)
  - genres/* (根据类型推断)
- **Skills**: writing-techniques/scene-structure
- **Tracking**: 自动更新 plot-tracker 的计划部分

#### 辅助检查 Commands（询问后更新 tracking）

**`/analyze` - 质量分析**
- **Knowledge-base**:
  - craft/* (用于对照检查)
  - requirements/* (验证规范遵守情况)
- **Skills**: quality-assurance/* (全部)
- **Tracking**: 生成更新建议，询问后应用

**`/track` - 综合追踪更新**
- **Tracking**: 自动更新所有 tracking 文件

**其他辅助 Commands**（`/checklist`, `/timeline`, `/relations` 等）
- 根据功能加载对应的 knowledge-base 和 skills
- 只读 tracking，不自动更新

---

## 4. 关键词触发机制设计

### 运行时动态资源加载

**触发时机**：
- 用户输入包含特定关键词时
- AI 分析内容时检测到相关主题

**关键词映射表**（内置于 commands 或配置文件）：

```javascript
// 示例：关键词 → 资源映射
const KEYWORD_MAPPINGS = {
  // Craft 知识库触发词
  "对话|台词|说话": "knowledge-base/craft/dialogue.md",
  "场景|镜头|画面": "knowledge-base/craft/scene-structure.md",
  "角色成长|弧线|转变": "knowledge-base/craft/character-arc.md",
  "节奏|拖沓|太快|太慢": "knowledge-base/craft/pacing.md",
  "展示|描写|tell": "knowledge-base/craft/show-not-tell.md",

  // Skills 触发词
  "对话技巧": "skills/writing-techniques/dialogue-techniques",
  "节奏控制": "skills/writing-techniques/pacing-control",
  "角色弧线": "skills/writing-techniques/character-arc",

  // Genre 触发词
  "言情|恋爱|感情": "knowledge-base/genres/romance.md",
  "悬疑|推理|线索": "knowledge-base/genres/mystery.md",
  "奇幻|魔法|世界观": "knowledge-base/genres/fantasy.md"
}
```

**触发流程**：
1. 检测用户输入/内容中的关键词
2. 检查该资源是否已加载
3. 如未加载且未被配置禁用 → 提示用户："检测到关键词'节奏'，是否加载 pacing.md 和 pacing-control skill？"
4. 用户确认后加载并应用

**智能去重**：避免重复提示已加载的资源

**配置文件集成**：
- 可在 `specification.md` 的 `resource-loading.keyword-triggers.custom-mappings` 中添加自定义关键词
- 可设置 `keyword-triggers.enabled: false` 完全禁用关键词触发

---

## 5. Scripts 扩展设计

### 增强 check-writing-state.sh 脚本

**新增检查项**：

```bash
#!/bin/bash
# check-writing-state.sh (增强版)

# 原有检查项
check_specification_exists()
check_tasks_exists()
check_tracking_initialized()

# 新增检查项
check_knowledge_base_available() {
  # 检查配置的 knowledge-base 文件是否存在
  # 读取 specification.md 的 resource-loading 配置
  # 验证文件路径有效性
}

check_skills_available() {
  # 检查配置的 skills 是否存在
  # 验证 SKILL.md 格式正确性
}

check_resource_conflicts() {
  # 检查配置中是否有冲突
  # 例如：同时启用和禁用同一资源
}

generate_load_report() {
  # 生成资源加载报告
  # 输出：将加载哪些 knowledge-base 和 skills
  # 格式：JSON，供 command 解析
}
```

**输出格式**（JSON）：
```json
{
  "status": "ready",
  "resources": {
    "knowledge-base": [
      "craft/dialogue.md",
      "craft/pacing.md",
      "genres/romance.md"
    ],
    "skills": [
      "writing-techniques/dialogue-techniques",
      "quality-assurance/consistency-checker"
    ],
    "disabled": [
      "craft/character-arc.md"
    ]
  },
  "warnings": [
    "pacing-control skill 配置了但文件不存在"
  ]
}
```

**Commands 使用流程**：
1. 执行前调用脚本：`{SCRIPT}`
2. 解析 JSON 输出
3. 按结果加载资源
4. 如有 warnings，提示用户

---

## 6. Tracking 自动更新机制

### 核心 Commands 全面自动更新

**`/write` 执行后**：
```javascript
// 自动更新所有 tracking 文件
updateTracking({
  // character-state.json
  characterState: {
    lastAppearance: "chapter-05",
    emotionalState: "从对话中推断",
    arcProgress: "根据行为判断阶段"
  },

  // plot-tracker.json
  plotTracker: {
    currentChapter: 5,
    wordCount: 3500,
    majorEvents: ["提取关键情节点"]
  },

  // relationships.json
  relationships: {
    add: [
      { from: "林晓", to: "队长", type: "信任", strength: 0.6, evidence: "接受建议" }
    ],
    update: [
      { from: "林晓", to: "队长", strength: 0.4 -> 0.6 }
    ]
  },

  // timeline.json
  timeline: {
    add: [
      { event: "首次合作任务", chapter: 5, day: 15, significance: "high" }
    ]
  }
});

// 静默更新，仅在控制台显示
console.log("✓ 已更新 character-state.json");
console.log("✓ 已更新 plot-tracker.json");
console.log("✓ 已更新 relationships.json");
console.log("✓ 已更新 timeline.json");
```

### 辅助 Commands 询问更新

**`/analyze` 执行后**：
```javascript
// 生成更新建议
const suggestions = {
  relationships: {
    add: [
      { from: "林晓", to: "队长", type: "信任", strength: 0.6 }
    ]
  },
  timeline: {
    add: [
      { event: "首次合作任务", chapter: 5, day: 15 }
    ]
  }
};

// 询问用户
askUser(`
检测到以下 tracking 更新建议：

【relationships.json】
+ 林晓 → 队长：信任关系（强度 0.6）

【timeline.json】
+ Day 15: 首次合作任务 (Ch.5)

是否应用这些更新？
[Y] 全部应用  [N] 跳过  [S] 选择性应用
`);
```

### 可追溯日志记录

**新增文件：`templates/tracking/tracking-log.md`**

```markdown
# Tracking 更新日志

## 2025-02-08 01:45:23 - /write chapter-05

### 命令执行
- **命令**: `/write chapter-05`
- **章节**: 第 5 章
- **字数**: 3,500 字
- **执行时长**: 8 分钟

### 自动更新内容

#### character-state.json
```diff
+ 林晓.lastAppearance: "chapter-05"
+ 林晓.emotionalState: "开始动摇"
  林晓.arcProgress: stage-3 -> stage-4
```

#### plot-tracker.json
```diff
  currentChapter: 4 -> 5
  totalWordCount: 12000 -> 15500
+ majorEvents[4]: "林晓首次接受队友建议"
```

#### relationships.json
```diff
+ 林晓 -> 队长: { type: "信任", strength: 0.6, evidence: "Ch.5 接受建议" }
```

#### timeline.json
```diff
+ Day 15: "首次合作任务" (chapter: 5, significance: high)
```

### 更新依据
- 对话分析：检测到林晓对队长态度转变
- 行为变化：从"拒绝"到"沉默后同意"
- 情节推进：完成任务列表第 5 项

---

## 2025-02-08 02:30:15 - /analyze chapter-01-05

### 命令执行
- **命令**: `/analyze 内容 chapter-01-05`
- **分析范围**: 第 1-5 章
- **执行时长**: 3 分钟

### 用户确认更新内容

#### relationships.json
```diff
+ 林晓 -> 队友A: { type: "怀疑", strength: 0.3, evidence: "Ch.2 对话" }
```

### 更新依据
- 用户选择：[Y] 全部应用
- 分析发现：Ch.2 中林晓对队友A的态度

---
```

**日志格式规范**：
- 每次命令执行后追加新条目
- 使用 diff 格式清晰展示变化
- 记录更新依据（AI 的推理过程）
- 保留完整历史，永不删除
- 区分自动更新和用户确认更新

---

## 7. Command 实现示例 - /write

### `templates/commands/write.md` 增强版

```markdown
---
description: 基于任务清单执行章节写作，自动加载上下文和验证规则
argument-hint: [章节编号或任务ID]
allowed-tools: Read(//**), Write(//stories/**/content/**), Bash(*)
model: claude-sonnet-4-5-20250929
scripts:
  sh: .specify/scripts/bash/check-writing-state.sh
  ps: .specify/scripts/powershell/check-writing-state.ps1
---

## 前置检查

1. **运行脚本** `{SCRIPT}` 检查创作状态和资源加载配置
2. **解析资源加载报告**（脚本输出的 JSON）

## 资源加载协议（分层查询 + 三层增强）

### 第一层：核心原则（最高优先级）
**始终加载，不受配置影响**：
1. `memory/constitution.md`（创作宪法）
2. `memory/style-reference.md`（风格参考 - 如果存在）

### 第二层：规格和计划
**始终加载**：
3. `stories/*/specification.md`（故事规格）
4. `stories/*/creative-plan.md`（创作计划）
5. `stories/*/tasks.md`（当前任务）

### 第三层：智能资源加载（三层机制）

**3.1 写作风格和规范（原有机制 + 配置增强）**

**原有机制（保留）**：
- 读取 `specification.md` 的 YAML frontmatter
- 如果配置了 `writing-style` → 加载 `knowledge-base/styles/natural-voice.md`
- 如果配置了 `writing-requirements` → 加载 `knowledge-base/requirements/anti-ai-v4.md` 等

**新增：三层机制**
```yaml
# 在 specification.md 中可以进一步控制
resource-loading:
  # Layer 1: 默认智能推断（在原有基础上扩展）
  auto-load: true  # 默认加载所有 craft knowledge-base 和 writing-techniques skills

  # Layer 2: 配置覆盖
  knowledge-base:
    craft:
      - dialogue
      - pacing
      - "!character-arc"  # 排除某个
    styles:  # 如果不配置，使用 writing-style 字段
      - natural-voice
    requirements:  # 如果不配置，使用 writing-requirements 字段
      - anti-ai-v4
      - fast-paced

  skills:
    writing-techniques:
      - dialogue-techniques
      - pacing-control

  # Layer 3: 关键词触发（运行时）
  keyword-triggers:
    enabled: true
```

**加载顺序**：
1. 检查 `resource-loading` 是否存在
2. 如果不存在 → 使用原有机制（writing-style, writing-requirements）+ 默认推断
3. 如果存在 → 使用配置覆盖（向后兼容：未配置的部分使用原有机制）

### 第四层：状态和数据
**始终加载**：
6. `spec/tracking/character-state.json`
7. `spec/tracking/relationships.json`
8. `spec/tracking/plot-tracker.json`
9. `spec/tracking/validation-rules.json`（如有）

### 第五层：知识库和前文
**始终加载**：
10. `spec/knowledge/`（世界观、角色档案等）
11. `stories/*/content/`（前文内容）

### 第六层：写作规范细节
**始终加载**（如果文件存在）：
12. `memory/personal-voice.md`
13. `spec/knowledge/natural-expression.md`
14. `spec/knowledge/punctuation-personality.md`
15. `spec/knowledge/detail-formulas.md`
16. `spec/presets/anti-ai-detection.md`

### 第七层：条件查询
**前三章专用（章节 ≤ 3 或总字数 < 10000）**：
17. `knowledge-base/craft/opening-hooks.md`（如果存在）
18. 其他开篇专用资源

### 第八层：运行时关键词触发（Layer 3）
**写作过程中动态加载**：
- 检测关键词 → 提示加载相关资源
- 例如："节奏" → pacing.md + pacing-control skill

## 写作执行

[按照原有的写作流程执行...]

## 后置更新

**自动更新 Tracking**（无需询问）：
1. 更新 `character-state.json`
2. 更新 `plot-tracker.json`
3. 更新 `relationships.json`
4. 更新 `timeline.json`

**记录日志**：
追加更新记录到 `tracking/tracking-log.md`：
- 命令类型：/write
- 章节信息
- 更新内容：diff 格式
- 更新依据：推理过程
```

---

## 8. Command 实现示例 - /analyze

### `templates/commands/analyze.md` 增强版

```markdown
---
description: 对已写内容进行质量验证分析（框架模式/内容模式）
argument-hint: [框架|内容] [章节范围]
allowed-tools: Read(//**), Bash(ls:*, find:*, wc:*, grep:*)
model: claude-sonnet-4-5-20250929
scripts:
  sh: .specify/scripts/bash/check-writing-state.sh
---

## 前置检查

1. **运行脚本** `{SCRIPT}` 检查分析环境
2. **解析资源加载报告**

## 资源加载协议（分析专用）

### 第一层：核心原则
1. `memory/constitution.md`（对照检查）

### 第二层：规格和追踪
2. `stories/*/specification.md`
3. `spec/tracking/*`（所有追踪文件，用于验证一致性）

### 第三层：智能资源加载

**默认推断（Layer 1）**：
- **Knowledge-base**: craft/* (全部，用于质量对照)
- **Knowledge-base**: requirements/* (验证规范遵守)
- **Skills**: quality-assurance/* (全部)

**配置覆盖（Layer 2）**：
读取 `specification.md` 的 `resource-loading.analysis` 配置：
```yaml
resource-loading:
  analysis:  # analyze 命令专用配置
    knowledge-base:
      craft:
        - dialogue  # 只检查对话质量
        - pacing    # 只检查节奏
    skills:
      quality-assurance:
        - consistency-checker
        - "!workflow-guide"  # 分析时不需要工作流引导
```

**关键词触发（Layer 3）**：
- 分析过程中检测到问题类型 → 提示加载对应资源
- 例如：发现节奏问题 → 加载 pacing-control skill 提供修复建议

### 第四层：待分析内容
4. `stories/*/content/`（待分析的章节）

## 分析执行

[按照原有的分析流程执行...]

## 后置处理

**生成 Tracking 更新建议**（不自动应用）：
```markdown
## Tracking 更新建议

### relationships.json
建议添加：
- 林晓 → 队长：信任关系（强度 0.6）
  依据：Ch.5 对话分析

### timeline.json
建议添加：
- Day 15: 首次合作任务 (Ch.5)
  依据：情节推进分析

是否应用这些更新？
[Y] 全部应用  [N] 跳过  [S] 选择性应用
```

**记录日志**（如果用户选择应用）：
追加到 `tracking/tracking-log.md`：
- 命令类型：/analyze
- 更新方式：用户确认后应用
- 更新内容：diff 格式
- 用户选择：显示用户的具体选择
```

---

## 9. 分阶段实施路线图

### Phase 1: 基础架构（优先级最高）

**目标**：建立三层资源加载机制的基础设施

**任务清单**：
1. **扩展 specification.md 配置格式**
   - 添加 `resource-loading` YAML schema
   - 向后兼容检查（无配置时使用默认值）
   - 创建配置示例文档
   - **预估工时**: 2-3h

2. **增强 check-writing-state.sh 脚本**
   - 添加资源检查函数
   - 实现 JSON 输出格式
   - 添加错误处理和警告提示
   - **预估工时**: 2-3h

3. **建立关键词映射表**
   - 创建 `templates/config/keyword-mappings.json`
   - 定义所有关键词 → 资源的映射关系
   - 支持正则表达式匹配
   - **预估工时**: 1-2h

4. **创建 tracking-log.md 模板**
   - 定义日志格式标准
   - 创建日志追加函数
   - **预估工时**: 0.5-1h

**预估总工时**: 5.5-9h

**验收标准**：
- ✅ 脚本能正确解析 specification.md 的 resource-loading 配置
- ✅ 脚本能输出正确的 JSON 格式资源加载报告
- ✅ 关键词映射表完整覆盖所有现有资源
- ✅ tracking-log.md 模板创建成功

---

### Phase 2: 核心 Commands 改造（高优先级）

**目标**：改造 `/write` 和 `/plan` 命令

**任务清单**：
1. **改造 `/write` 命令**
   - 整合分层查询协议（保留原有 8 层）
   - 添加三层资源加载机制
   - 实现自动 tracking 更新（4 个文件）
   - 实现 tracking-log 记录
   - 实现关键词触发提示
   - **预估工时**: 4-5h

2. **改造 `/plan` 命令**
   - 添加资源加载逻辑
   - 实现自动 plot-tracker 更新
   - 添加 tracking-log 记录
   - **预估工时**: 2-3h

3. **测试核心流程**
   - 创建测试项目
   - 测试默认推断模式
   - 测试配置覆盖模式
   - 测试关键词触发
   - 验证 tracking 自动更新
   - 验证 tracking-log 记录
   - **预估工时**: 2h

**预估总工时**: 8-10h

**验收标准**：
- ✅ `/write` 能正确加载所有 8 层资源
- ✅ `/write` 能根据配置覆盖资源加载
- ✅ `/write` 执行后自动更新 4 个 tracking 文件
- ✅ tracking-log.md 正确记录所有更新
- ✅ `/plan` 能正确加载资源并更新 plot-tracker

---

### Phase 3: 辅助 Commands 改造（中优先级）

**目标**：改造 `/analyze`、`/track`、`/checklist` 等辅助命令

**任务清单**：
1. **改造 `/analyze` 命令**
   - 添加资源加载逻辑（支持 analysis 专用配置）
   - 实现询问式 tracking 更新
   - 添加 tracking-log 记录（标注用户确认）
   - **预估工时**: 3-4h

2. **改造 `/track` 命令**
   - 与 tracking-log 集成
   - 支持查看历史更新记录
   - **预估工时**: 1-2h

3. **改造 `/checklist` 和其他辅助命令**
   - 添加基本资源加载
   - 整合关键词触发
   - **预估工时**: 2-3h

**预估总工时**: 6-9h

**验收标准**：
- ✅ `/analyze` 能生成 tracking 更新建议
- ✅ `/analyze` 询问后正确应用更新
- ✅ `/track` 能显示 tracking-log 历史
- ✅ 所有辅助命令能正确加载资源

---

### Phase 4: 关键词触发机制（中优先级）

**目标**：实现运行时动态资源加载

**任务清单**：
1. **实现关键词检测逻辑**
   - 在 commands 中添加关键词扫描
   - 实现正则匹配和优先级排序
   - 实现资源去重检查
   - 实现用户提示和确认
   - 实现动态资源加载
   - **预估工时**: 3-4h

2. **测试关键词触发**
   - 测试各种关键词场景
   - 测试自定义关键词映射
   - 测试禁用关键词触发
   - **预估工时**: 1-2h

**预估总工时**: 4-6h

**验收标准**：
- ✅ 用户输入关键词能触发资源加载提示
- ✅ 自定义关键词映射正确工作
- ✅ keyword-triggers.enabled: false 能禁用触发
- ✅ 已加载资源不会重复提示

---

### Phase 5: 文档和优化（低优先级）

**目标**：完善文档和性能优化

**任务清单**：
1. **更新所有 command 文档**
   - 为每个 command 添加资源加载说明
   - 更新示例和最佳实践
   - **预估工时**: 2-3h

2. **创建用户指南**
   - 如何配置 resource-loading
   - 如何使用关键词触发
   - 常见问题 FAQ
   - **预估工时**: 2h

3. **性能优化**
   - 实现资源加载缓存
   - 优化重复文件读取
   - 优化关键词匹配性能
   - **预估工时**: 2-3h

4. **创建测试套件**
   - 单元测试（脚本函数）
   - 集成测试（完整流程）
   - **预估工时**: 2-3h (可选)

**预估总工时**: 6-8h (不含测试套件)

**验收标准**：
- ✅ 所有 command 文档更新完成
- ✅ 用户指南清晰易懂
- ✅ 资源加载性能提升 30%+
- ✅ 无明显性能瓶颈

---

### 总体时间估算

| Phase | 工时 | 可并行 | 依赖关系 |
|-------|------|--------|---------|
| Phase 1: 基础架构 | 5.5-9h | 否 | - |
| Phase 2: 核心 Commands | 8-10h | 部分 | 依赖 Phase 1 |
| Phase 3: 辅助 Commands | 6-9h | 是 | 依赖 Phase 1, 2 |
| Phase 4: 关键词触发 | 4-6h | 是 | 依赖 Phase 1 |
| Phase 5: 文档优化 | 6-8h | 是 | 依赖 Phase 1-4 |

**总工时估算**：
- **串行执行**（1 人）: 29.5-42h
- **并行执行**（2 人）: 20-28h
  - 人员 A: Phase 1 → Phase 2 → Phase 5
  - 人员 B: Phase 1 (协助) → Phase 3 → Phase 4

**推荐实施顺序**：
1. Phase 1（必须先完成，作为基础）
2. Phase 2 + Phase 4（并行：核心功能 + 关键词触发）
3. Phase 3（基于 Phase 2 的经验改造辅助命令）
4. Phase 5（最后完善文档和优化）

---

## 附录

### A. 关键词映射表完整示例

见 `templates/config/keyword-mappings.json`（待创建）

### B. tracking-log.md 格式规范

见第 6 部分详细说明

### C. 配置示例

**最小配置**（使用默认智能推断）：
```yaml
---
title: "我的小说"
genre: romance
---
```

**完整配置**（完全控制）：
```yaml
---
title: "我的小说"
genre: romance
writing-style: natural-voice
writing-requirements:
  - anti-ai-v4
  - fast-paced

resource-loading:
  auto-load: true
  knowledge-base:
    craft:
      - dialogue
      - scene-structure
      - pacing
      - "!character-arc"
      - "!show-not-tell"
    genres:
      - romance
    requirements:
      - anti-ai-v4
      - fast-paced

  skills:
    writing-techniques:
      - dialogue-techniques
      - pacing-control
    quality-assurance:
      - consistency-checker

  keyword-triggers:
    enabled: true
    custom-mappings:
      "情感节奏": knowledge-base/craft/pacing.md

  analysis:
    knowledge-base:
      craft:
        - dialogue
        - pacing
---
```

---

## 更新日志

| 日期 | 版本 | 更新内容 | 作者 |
|------|------|---------|------|
| 2025-02-08 | 1.0.0 | 初始版本，完整设计文档 | Claude Sonnet 4.5 |

---

**文档状态**: ✅ 设计完成，等待实施

**下一步行动**: 执行 Phase 1 任务，建立基础架构
