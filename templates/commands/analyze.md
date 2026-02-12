---
description: 智能分析：自动选择框架分析（write前）或内容分析（write后），支持 --type 手动指定
argument-hint: [--type=framework|content]
allowed-tools: Bash(find:*), Bash(wc:*), Bash(grep:*), Read(//**), Read(//plugins/**), Read(//plugins/**), Write(//stories/**/analysis-report.md), Bash(*)
scripts:
  sh: .specify/scripts/bash/check-analyze-stage.sh --json
  ps: .specify/scripts/powershell/check-analyze-stage.ps1 -Json
---

对小说项目进行智能化综合分析。根据当前创作阶段，自动选择执行**框架一致性分析**（write 之前）或**内容质量分析**（write 之后）。

---

## 执行流程

### 1. 智能阶段检测

运行 `{SCRIPT}` 获取当前创作状态：

```json
{
  "analyze_type": "framework|content",
  "chapter_count": 0,
  "has_spec": true,
  "has_plan": true,
  "has_tasks": true,
  "story_dir": "/path/to/story",
  "reason": "原因说明"
}
```

### 2. 决策逻辑

解析用户参数 `$ARGUMENTS`：

**手动指定模式**（优先级最高）：
- 包含 `--type=framework` → 强制框架分析
- 包含 `--type=content` → 强制内容分析

**批量范围分析**：
- `--range ch-XX-YY` → 指定章节范围分析
- `--range vol-XX` → 指定卷分析
- `--range vol-XX-YY` → 多卷范围分析（含跨卷对比）

**专项分析模式**：
- `--focus=opening` → 开篇专项分析（前3章）
- `--focus=pacing` → 节奏专项分析（爽点/冲突分布）
- `--focus=character` → 人物专项分析（人物弧光）
- `--focus=foreshadow` → 伏笔专项分析（埋设与回收）
- `--focus=logic` → 逻辑专项分析（逻辑漏洞）
- `--focus=style` → 风格专项分析（文笔一致性）
- `--focus=reader` → 读者体验分析（爽点密度、钩子强度、信息投喂、期待管理）
- `--focus=hook` → 钩子专项分析（每章结尾钩子类型、强度、兑现率）
- `--focus=power` → 力量体系专项分析（力量等级一致性、战力对比合理性、升级节奏）
- `--focus=voice` → 对话一致性分析（检测各角色对话是否符合语言指纹设定）

**自动判断模式**：
- 章节数 < 3 → **框架分析**
- 章节数 ≥ 3 → **内容分析**

### 3. 资源加载

**参考 CLAUDE.md 中的资源加载规则**，加载以下基准文档：
- 宪法文件：`.specify/memory/constitution.md`
- 规格文件：`stories/*/specification.md`
- 计划文件：`stories/*/creative-plan.md`
- 任务文件：`stories/*/tasks.md`

**分析专用资源**（Layer 1 默认加载）：
- `templates/knowledge-base/craft/` 下所有 craft 知识库（用于质量对照检查）
- `templates/skills/quality-assurance/` 下的 QA skills（用于一致性验证）

**Layer 2: 配置覆盖**：如果 `specification.md` 配置了 `resource-loading.analysis`，按配置加载。

**Layer 3: 关键词触发**：读取 `specification.md` 的 `resource-loading.keyword-triggers.enabled`，扫描 `--check` 参数值动态加载 skills。

**会话级资源复用**：本次对话中已加载的资源直接复用，不重复读取。

---

## 模式A：框架一致性分析

**目标**：在写作前验证准备工作是否充分，确保规格、计划、任务之间无矛盾。

### A1. 覆盖率分析

检查所有规格需求是否都有对应的计划和任务：
- P0/P1/P2 需求覆盖率
- 任务完整性（所有计划章节是否有对应任务）

### A2. 一致性检查

验证文档之间是否存在矛盾：
- **规格 ↔ 计划**：主题一致性、节奏设定、约束遵守
- **计划 ↔ 任务**：章节对应、字数预估、优先级匹配
- **宪法合规**：价值观、质量标准

### A3. 逻辑问题预警

分析故事线设计中的潜在逻辑漏洞：
- 时间线冲突
- 角色能力矛盾
- 伏笔未规划

### A4. 准备就绪评估

```markdown
## 准备就绪评估

### 必要条件 (P0)
- [ ] 规格完整且明确
- [ ] 计划覆盖所有 P0 需求
- [ ] 任务分解完整
- [ ] 无致命逻辑矛盾

### 建议条件 (P1)
- [ ] 角色档案完善
- [ ] 世界观设定文档详细
- [ ] 时间线规划清晰

### 总体评分：[X]/10

**建议**：
1. 🔴 必须修复：[P0问题]
2. 🟡 建议优化：[P1问题]
3. 🟢 可选：[P2问题]
```

---

## 模式B：内容质量分析

**目标**：对已完成的内容进行综合质量验证，确保符合规格并提供改进建议。

### B1. 加载验证基准

- 基准文档（同资源加载部分）
- **已完成内容**：`stories/*/content/*.md` 或 `stories/*/chapters/*.md`

### B2. 宪法合规性检查

- 核心价值观检查
- 质量标准验证（逻辑一致性、人物饱满度、文字水准）
- 风格一致性

### B3. 规格符合度分析

- P0/P1/P2 核心需求覆盖率
- 目标达成度（读者适配、市场定位、成功标准）
- 约束条件遵守

### B4. 计划执行分析

- 章节架构对比（计划 vs 实际）
- 人物发展轨迹符合度
- 世界观展开进度

### B5. 内容质量分析

- 文本统计（总字数、章节长度、完成进度）
- 结构分析（情节密度、冲突频率、节奏变化）
- 技术问题（逻辑问题、连贯性问题、人物一致性）
- 亮点识别

### B5.1 专项分析（可选）

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
| `--focus=voice` | 对话一致性分析 | `.claude/skills/analysis/voice-analysis/SKILL.md` |

**执行流程**：读取对应 Skill 文件 → 按文件中的指令执行分析 → 输出报告

**voice 分析说明**：调用 `voice-consistency-checker` Skill 执行批量对话一致性检查，检测各角色对话是否符合语言指纹设定。

### B6. 任务完成度审计

- 总体进度（已完成/进行中/未开始）
- 关键里程碑达成情况
- 阻塞和风险

### B7. 生成改进建议

基于分析结果提供分级建议：
- **P0 紧急修复**：逻辑矛盾、角色能力矛盾
- **P1 优化建议**：悬念不足、配角功能未体现
- **P2 长期改进**：世界观展开节奏、深层设定

### B8. 生成验证报告

创建 `stories/*/analysis-report.md`，包含：

```markdown
# 作品分析报告

## 摘要
- 分析日期 / 范围 / 字数 / 总体评分

## 核心指标
| 维度 | 得分 | 说明 |
|------|------|------|
| 宪法合规 | [X]/10 | ... |
| 规格符合 | [X]/10 | ... |
| 计划执行 | [X]/10 | ... |
| 内容质量 | [X]/10 | ... |
| 读者体验 | [X]/10 | ... |
| 期待管理 | [X]/10 | ... |
| 线程平衡 | [X]/10 | ... |

## 关键发现
[✅ 优点 / ⚠️ 警告 / ❌ 问题]

## 下一步行动
[分级行动建议]
```

---

## 后置处理：询问式 Tracking 更新

**执行时机**: 内容分析完成后，发现可更新的 tracking 信息

**更新策略**: 辅助命令（/analyze）生成建议，**需用户确认后**才更新

**从分析结果中提取更新建议**:
1. **角色状态变化**（→ character-state.json）
2. **关系网络变化**（→ relationships.json）
3. **情节推进**（→ plot-tracker.json）
4. **时间线补充**（→ timeline.json）

**用户确认选项**:
- **[Y]** 全部应用
- **[N]** 跳过更新
- **[S]** 选择性应用（逐项确认）

应用后追加更新记录到 `tracking-log.md`。

**错误处理**：
- tracking 文件不存在 → 建议运行 `/track --init`
- JSON 格式错误 → 提示手动修复
- tracking 目录不存在 → 建议创建 `spec/tracking/`

---

## 🔄 反馈建议

在分析报告的最后，根据发现的问题生成反馈建议，指向需要修改的上游文档：

### 反馈分类

| 问题类型 | 反馈目标 | 操作建议 |
|---------|---------|---------|
| 角色设定与实际描写不符 | `specification.md` | `/specify --feedback` 更新角色设定 |
| 情节走向偏离计划 | `creative-plan.md` | `/plan --feedback` 调整计划 |
| 任务粒度不合理 | `tasks.md` | `/tasks` 重新拆分 |
| 力量体系不一致 | `specification.md` | `/specify --feedback` 修正力量体系 |
| 世界观设定冲突 | `specification.md` | `/specify --feedback` 修正世界观 |
| 节奏问题 | `creative-plan.md` | `/plan --feedback` 调整章节规划 |

### 输出格式

```
🔄 反馈建议
━━━━━━━━━━━━━━━━━━━━

本次分析发现以下问题需要回溯修改上游文档：

📋 规格书反馈（/specify --feedback）：
1. [具体问题描述] → 选择：修改设定 or 修改章节内容

📋 计划反馈（/plan --feedback）：
2. [具体问题描述] → 建议运行 /plan --detail 重新规划

⚠️ 未处理的反馈会在下次 /guide 中提醒
```

---

## 🔧 修改引导

**内容分析完成后，自动提示修改选项**：

```markdown
📋 分析完成。发现 [X] 个问题。

如需系统性修改，可执行：
  /revise                         完整四层修改（结构→节奏→一致性→文字）
  /revise --layer polish          仅文字润色
  /revise --layer consistency     仅一致性修复
  /revise --quick                 快速修改（一致性+文字）
  /revise --chapters 1-10         指定范围修改
```

**问题到修改层的映射**：

| /analyze 发现的问题类型 | 对应 /revise 层 |
|----------------------|----------------|
| 结构问题、章节缺失、高潮位置 | `--layer=structure` |
| 节奏偏慢/偏快、缺少钩子 | `--layer=pacing` |
| 角色矛盾、时间线错误、伏笔遗漏 | `--layer=consistency` |
| 重复用词、AI痕迹、风格不一致 | `--layer=polish` |

---

**记住**：**一个命令，三种模式（框架/内容/专项），智能而精准。** 分析发现问题后，使用 `/revise` 进行系统性修改。

---

## 🔗 命令链式提示

**命令执行完成后，自动附加下一步建议**：

```
💡 下一步建议：
1️⃣ `/revise` — 基于分析结果进行系统性修改润色
2️⃣ `/write [下一章节号]` — 继续写作（如无严重问题）
3️⃣ `/analyze --focus=[维度]` — 针对特定维度深入分析（opening/pacing/logic/style/reader/hook/power/voice）
```
