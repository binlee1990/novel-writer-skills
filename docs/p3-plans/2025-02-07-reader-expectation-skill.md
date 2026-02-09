# Reader Expectation Management Skill 实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标：** 创建读者期待管理 Skill,帮助作者识别和满足读者期待,避免期待落空或过度满足

**架构:** Agent Skill 格式,提供期待识别、满足度分析、节奏控制建议

**技术栈:** TypeScript, 期待模型理论, 满足度评估算法

**预估工时:** 15-22 小时

---

## 背景

### 问题
读者对故事有期待,管理不当会导致问题:
- **期待落空:** 铺垫的事件没有发生,读者失望(如:承诺的决战一直不来)
- **过早满足:** 太快满足期待,失去悬念(如:第5章就击败最终boss)
- **期待错位:** 读者期待A,作者给B,体验不佳(如:期待爽文,给悲剧)
- **缺乏工具:** 作者难以量化"读者期待"这一抽象概念

### 解决方案
创建 Agent Skill 追踪读者期待:
- 识别明确承诺和隐含期待
- 评估当前满足程度
- 建议何时满足、如何延迟
- 警告期待管理失衡

### 核心价值
- **期待可视化:** 明确当前有哪些未满足的期待
- **满足度量化:** 用数值衡量期待的紧迫性
- **节奏建议:** 何时该满足、何时该延迟
- **体裁适配:** 不同类型小说的期待管理策略

---

## 核心概念

### 期待类型

#### 1. Plot Promises (情节承诺)
明确承诺会发生的事件
- **示例:** "总有一天我要打败他!" → 期待最终决战
- **满足方式:** 事件发生
- **延迟策略:** 增加障碍、阶段性胜利

#### 2. Mystery Questions (谜题问题)
需要解答的悬念
- **示例:** "那个人是谁?" → 期待身份揭露
- **满足方式:** 揭晓真相
- **延迟策略:** 提供部分线索、制造新谜题

#### 3. Character Growth (角色成长)
角色发展的期待
- **示例:** 弱者主角 → 期待变强
- **满足方式:** 突破、成长时刻
- **延迟策略:** 阶段性进步、挫折回退

#### 4. Relationship Arcs (关系弧线)
人物关系的发展
- **示例:** 敌对二人 → 期待和解/对决
- **满足方式:** 关系转变
- **延迟策略:** 误会加深、第三方介入

#### 5. World Mysteries (世界观谜题)
世界观层面的疑问
- **示例:** "这个世界的真相是什么?" → 期待世界观展开
- **满足方式:** 揭秘、探索新区域
- **延迟策略:** 渐进式揭露

### 满足度模型

```
Expectation Fulfillment = (Progress / Total) * Urgency

Progress: 当前满足程度 (0-100%)
Total: 完全满足所需的量
Urgency: 紧迫性 (基于章节数、铺垫强度)
```

**紧迫性计算:**
- 章节间隔 < 5: Low urgency (可继续延迟)
- 章节间隔 5-15: Medium urgency (需要进展)
- 章节间隔 > 15: High urgency (必须满足或重新激活)

---

## Task 1: 创建 Skill 基础结构

**Files:**
- Create: `skills/reader-expectation/config.yaml`
- Create: `skills/reader-expectation/system-prompt.md`

### Step 1: 编写 config.yaml

```yaml
name: reader-expectation
version: 1.0.0
description: 管理和追踪读者期待,避免期待落空或过度满足
type: agent-skill

activation:
  keywords:
    - 期待
    - 承诺
    - 悬念
    - 铺垫
    - 伏笔
    - 读者期望
    - 满足感
    - 失望
    - payoff
  file_patterns:
    - "**/.specify/expectations.json"
  auto_activate: true
  confidence_threshold: 0.75

capabilities:
  - expectation_detection    # 期待识别
  - fulfillment_tracking     # 满足度追踪
  - urgency_calculation      # 紧迫性计算
  - pacing_suggestion        # 节奏建议
  - genre_adaptation         # 体裁适配

integration:
  depends_on:
    - character-arc  # 角色弧线
  works_with:
    - /plan
    - /analyze
```

### Step 2: 编写 system-prompt.md

```markdown
# Reader Expectation Management Skill

## Role
你是读者期待管理专家,帮助作者识别、追踪并适时满足读者期待。

## Core Concepts

### What is Reader Expectation?
读者期待 = 读者预期会发生的事情
- **来源:** 明确承诺、类型惯例、铺垫暗示、角色目标
- **重要性:** 管理得当 = 满足感; 管理不当 = 失望或乏味

### Expectation Lifecycle
```
1. 建立期待 (Setup)
   ↓
2. 强化期待 (Reinforcement)
   ↓
3. 延迟满足 (Delay) ← 制造张力
   ↓
4. 满足期待 (Payoff)
```

## Expectation Data Model

```json
{
  "expectations": [
    {
      "id": "exp-001",
      "type": "plot_promise",
      "content": "主角要打败大反派",
      "setup_chapter": 1,
      "setup_line": "总有一天,我要亲手击败他!",
      "current_chapter": 25,
      "progress": 45,  // 0-100%
      "urgency": "medium",
      "status": "unfulfilled",
      "milestones": [
        {"chapter": 10, "event": "打败小喽啰", "progress": 15},
        {"chapter": 18, "event": "击败副手", "progress": 45}
      ],
      "suggested_payoff": "第35-40章",
      "risk": "如果超过40章仍未满足,读者可能失去耐心"
    }
  ]
}
```

## Detection Rules

### Plot Promise Indicators
关键句式:
- "总有一天我要..."
- "我发誓..."
- "等我XXX之后..."
- "终有一日..."

### Mystery Indicators
关键句式:
- "他是谁?"
- "为什么..."
- "真相究竟..."
- "那个XX到底..."

### Character Goal Indicators
关键元素:
- 明确的目标声明
- "我想要..."
- "我的梦想是..."

## Fulfillment Strategies

### When to Fulfill
✅ **Fulfill Now:**
- 紧迫性 High + 章节 > 阈值
- 到达预定高潮点
- 读者期待值达峰值

### When to Delay
✅ **Delay More:**
- 紧迫性 Low + 进度 < 50%
- 尚未到达高潮准备
- 可通过阶段性满足维持兴趣

### Partial Fulfillment
✅ **Give Small Wins:**
- 提供进展感但不完全满足
- 示例:打败小boss,但大boss更强

## Genre-Specific Guidelines

### 爽文/升级流
- **期待:** 频繁的阶段性满足
- **节奏:** 每3-5章一次小满足
- **警告:** 延迟 > 10章 = 危险

### 悬疑/推理
- **期待:** 谜题揭晓
- **节奏:** 渐进式线索披露
- **警告:** 过早揭晓 = 失去悬念

### 史诗奇幻
- **期待:** 长期弧线满足
- **节奏:** 可延迟20-30章
- **警告:** 需要中期里程碑维持兴趣

## Analysis Output Format

```
🎯 期待总览

【活跃期待】3项
1. [Plot] 击败大反派 | Ch1铺设 | 进度:45% | ⚠️ 中等紧迫(24章)
2. [Mystery] 父亲的秘密 | Ch5铺设 | 进度:20% | ✅ 低紧迫(20章)
3. [Growth] 主角突破瓶颈 | Ch15铺设 | 进度:60% | 🔥 高紧迫(10章)

【满足度分析】
✅ 良好:父亲的秘密(渐进披露中)
⚠️ 注意:击败大反派(需要加速进展或提供阶段性满足)
🚨 警告:主角突破(紧迫性高,建议3-5章内满足)

【下一步建议】
💡 第26章:提供主角突破的阶段性满足(小突破)
💡 第30章:设计主角完全突破的payoff
💡 第28章:对大反派期待提供进展(再次交手或新情报)
```

## Best Practices

1. **明确追踪:** 每个承诺都应被识别和追踪
2. **阶段性满足:** 大期待分解为小里程碑
3. **体裁适配:** 根据小说类型调整满足节奏
4. **避免遗忘:** 长期未满足的期待要么满足,要么重新激活
```

### Step 3: Commit

```bash
git add skills/reader-expectation/
git commit -m "feat(p3): add reader-expectation skill structure"
```

---

## Task 2: 实现期待检测引擎

**Files:**
- Create: `skills/reader-expectation/detection-rules.md`

### Step 1: 编写检测规则

```markdown
# Expectation Detection Rules

## Rule 1: Explicit Promises

### Pattern
```regex
(总有一天|终有一日|等我|我发誓).*(要|会|一定).*
```

### Examples
- "总有一天我要打败他!" → Plot Promise
- "等我变强之后,一定回来报仇!" → Plot Promise

### Classification
```
Type: plot_promise
Urgency_Base: medium (需要在合理时间内满足)
```

## Rule 2: Mystery Questions

### Pattern
```regex
(是谁|为什么|到底|究竟|真相).*(？|...)
```

### Examples
- "那个人究竟是谁?" → Mystery
- "为什么父亲要离开?" → Mystery

### Classification
```
Type: mystery
Urgency_Base: depends on context
  - 核心谜题: high
  - 次要谜题: medium
```

## Rule 3: Character Goals

### Pattern
明确的目标声明:
- "我的目标是..."
- "我想要..."
- "我的梦想是..."

### Examples
- "我的梦想是成为最强剑士" → Character Growth Expectation
- "我想要找到父亲" → Plot Promise

### Classification
```
Type: character_goal
Urgency_Base: low to medium (长期目标)
```

## Rule 4: Foreshadowing

### Pattern
暗示性语言:
- "不知为何,他隐隐觉得..."
- "这个XX似乎别有深意..."
- "总有一天会明白..."

### Examples
- "他隐隐觉得这把剑不简单" → Mystery (剑的秘密)

### Classification
```
Type: mystery or world_mystery
Urgency_Base: low (隐含期待)
```

## Detection Algorithm

```
For each chapter:
  1. Scan for explicit promise patterns
  2. Scan for mystery question patterns
  3. Identify character goal statements
  4. Detect foreshadowing language
  5. Classify each detected expectation
  6. Calculate initial urgency based on type
  7. Add to expectations tracker
```

## Context-Based Classification

### Genre Context
- **爽文:** Plot promises → High urgency
- **悬疑:** Mysteries → High urgency
- **文艺:** Character growth → High urgency

### Setup Strength
- **强铺垫:** (主角大喊誓言) → High urgency
- **弱铺垫:** (心中暗想) → Low urgency
```

### Step 2: Commit

```bash
git add skills/reader-expectation/detection-rules.md
git commit -m "feat(p3): implement expectation detection rules"
```

---

## Task 3: 实现满足度追踪系统

**Files:**
- Create: `skills/reader-expectation/fulfillment-tracker.md`
- Create: `skills/reader-expectation/urgency-calculator.md`

### Step 1: 编写满足度追踪规则

```markdown
# Fulfillment Tracking System

## Progress Measurement

### Plot Promises
进度 = 目标实现的百分比

**示例:击败大反派**
- 0%: 刚立誓
- 25%: 打败小喽啰
- 50%: 击败副手
- 75%: 与boss正面交锋
- 100%: 击败boss

### Mysteries
进度 = 揭露的信息百分比

**示例:父亲的秘密**
- 0%: 只知道"父亲有秘密"
- 30%: 发现线索(父亲的信)
- 60%: 了解部分真相(父亲的过往)
- 100%: 完全揭晓

### Character Growth
进度 = 成长阶段

**示例:突破境界**
- 0%: 瓶颈期
- 40%: 感悟
- 70%: 半只脚踏入
- 100%: 完全突破

## Milestone Tracking

```json
{
  "expectation": "击败大反派",
  "milestones": [
    {
      "chapter": 8,
      "event": "第一次见面(被秒杀)",
      "progress": 10,
      "type": "setup_reinforcement"
    },
    {
      "chapter": 15,
      "event": "打败其小弟",
      "progress": 30,
      "type": "partial_fulfillment"
    },
    {
      "chapter": 25,
      "event": "正面交手(不敌但逃脱)",
      "progress": 60,
      "type": "partial_fulfillment"
    },
    {
      "chapter": 40,
      "event": "最终决战",
      "progress": 100,
      "type": "full_payoff"
    }
  ]
}
```

## Fulfillment Patterns

### Full Payoff
完全满足期待
- **时机:** 高潮时刻
- **效果:** 高满足感,期待关闭

### Partial Fulfillment
部分满足期待
- **时机:** 中期里程碑
- **效果:** 维持兴趣,期待继续

### Subversion
颠覆期待
- **时机:** 转折点
- **效果:** 惊喜或失望(需谨慎)
- **示例:** 期待英雄胜利,实则惨败

### Re-activation
重新激活期待
- **时机:** 长期未提及后
- **方法:** 新线索、新威胁、新动机
```

### Step 2: 编写紧迫性计算规则

```markdown
# Urgency Calculation

## Base Formula

```
Urgency_Score = (Chapter_Gap / Genre_Threshold) * Setup_Strength * Type_Weight

Chapter_Gap: 当前章节 - 铺设章节
Genre_Threshold: 体裁容忍阈值
Setup_Strength: 铺垫强度(1-3)
Type_Weight: 类型权重
```

## Genre Thresholds

```
爽文/升级流: 10章
都市/现实: 15章
悬疑/推理: 20章
史诗奇幻: 30章
```

## Setup Strength

```
1 = 弱铺垫(心中暗想、隐约感觉)
2 = 中等铺垫(对话提及、目标声明)
3 = 强铺垫(发誓、大喊、重要事件)
```

## Type Weights

```
plot_promise: 1.0 (最高权重)
mystery: 0.9
character_goal: 0.8
relationship: 0.7
world_mystery: 0.6
```

## Urgency Levels

```
Score < 0.3: Low urgency (可继续延迟)
Score 0.3-0.7: Medium urgency (需要进展)
Score > 0.7: High urgency (紧急)
Score > 1.0: Critical (必须满足)
```

## Examples

### Example 1: 爽文复仇承诺
```
章节差距: 15章
体裁阈值: 10章
铺垫强度: 3(大喊发誓)
类型权重: 1.0(plot_promise)

Urgency = (15/10) * 3 * 1.0 = 4.5 (Critical!)
```

### Example 2: 史诗奇幻世界观谜题
```
章节差距: 25章
体裁阈值: 30章
铺垫强度: 1(隐约暗示)
类型权重: 0.6(world_mystery)

Urgency = (25/30) * 1 * 0.6 = 0.5 (Medium)
```
```

### Step 3: Commit

```bash
git add skills/reader-expectation/fulfillment-tracker.md
git add skills/reader-expectation/urgency-calculator.md
git commit -m "feat(p3): implement fulfillment tracking and urgency calculation"
```

---

## Task 4: 创建节奏建议系统

**Files:**
- Create: `skills/reader-expectation/pacing-strategies.md`

### Step 1: 编写节奏策略文档

```markdown
# Expectation Pacing Strategies

## Strategy 1: Ladder Pattern (阶梯模式)
逐步满足,每次提升一层

**适用:** 升级流、成长型故事

**示例:**
```
Ch5: 打败E级敌人
Ch10: 打败D级敌人
Ch15: 打败C级敌人
...
Ch50: 打败S级最终boss
```

**优点:** 持续满足感
**风险:** 可能单调

## Strategy 2: Delay-Payoff (延迟-满足)
长时间延迟,一次性大满足

**适用:** 史诗奇幻、严肃文学

**示例:**
```
Ch1: "总有一天我要击败暗黑领主"
Ch2-29: 各种准备、历练、挫折
Ch30: 最终决战,击败暗黑领主
```

**优点:** 满足感强烈
**风险:** 中期可能失去读者

## Strategy 3: Multi-Track (多轨并行)
多个期待交替满足

**适用:** 多线叙事

**示例:**
```
期待A(复仇): Ch1铺设 → Ch15满足
期待B(爱情): Ch5铺设 → Ch20满足
期待C(真相): Ch10铺设 → Ch25满足
```

**优点:** 节奏丰富
**风险:** 管理复杂

## Strategy 4: Subversion-Redirect (颠覆-重定向)
颠覆原期待,建立新期待

**适用:** 转折型故事

**示例:**
```
Ch1-15: 期待"击败恶龙"
Ch16: 发现恶龙是盟友,真正的敌人是XX
Ch17-30: 新期待"击败真正的敌人"
```

**优点:** 惊喜感
**风险:** 处理不当会让读者失望

## Maintenance Strategies

### When Urgency is High
✅ **立即满足** (完全payoff)
✅ **部分满足** (给进展但不结束)
❌ **继续延迟** (风险高)

### When Urgency is Medium
✅ **提供进展** (新线索、小胜利)
✅ **重新激活** (新威胁、新动机)
⚠️ **继续延迟** (需要好理由)

### When Urgency is Low
✅ **继续延迟** (积累张力)
✅ **偶尔提及** (维持存在感)
⚠️ **立即满足** (可能太早)
```

### Step 2: Commit

```bash
git add skills/reader-expectation/pacing-strategies.md
git commit -m "feat(p3): implement pacing strategies"
```

---

## Task 5: 创建配置文件和命令集成

**Files:**
- Create: `.specify/expectations.json`
- Create: `.specify/schemas/expectations.schema.json`

### Step 1: 创建期待配置示例

```json
{
  "$schema": "../schemas/expectations.schema.json",
  "tracking_mode": "auto",
  "genre": "xuanhuan",
  "thresholds": {
    "low_urgency": 10,
    "medium_urgency": 20,
    "high_urgency": 30
  },
  "expectations": [
    {
      "type": "plot_promise",
      "content": "击败云海宗宗主",
      "setup_chapter": 1,
      "importance": "major",
      "estimated_payoff_chapter": 50
    }
  ]
}
```

### Step 2: 创建 JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Reader Expectations Configuration",
  "type": "object",
  "properties": {
    "tracking_mode": {
      "enum": ["auto", "manual"],
      "default": "auto"
    },
    "genre": {
      "enum": ["xuanhuan", "mystery", "romance", "epic_fantasy", "litrpg"]
    },
    "thresholds": {
      "type": "object",
      "properties": {
        "low_urgency": {"type": "number"},
        "medium_urgency": {"type": "number"},
        "high_urgency": {"type": "number"}
      }
    },
    "expectations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": {"enum": ["plot_promise", "mystery", "character_goal", "relationship", "world_mystery"]},
          "content": {"type": "string"},
          "setup_chapter": {"type": "number"},
          "importance": {"enum": ["major", "minor"]},
          "estimated_payoff_chapter": {"type": "number"}
        }
      }
    }
  }
}
```

### Step 3: Commit

```bash
git add .specify/expectations.json
git add .specify/schemas/expectations.schema.json
git commit -m "feat(p3): add expectations configuration"
```

---

## Task 6: 编写文档

**Files:**
- Create: `docs/skills/reader-expectation.md`

### Step 1: 编写用户文档

```markdown
# Reader Expectation Management Skill

## 什么是读者期待?

读者期待 = 读者预期故事中会发生的事情

**来源:**
- **明确承诺:** "总有一天我要打败他!"
- **类型惯例:** 爽文读者期待主角变强
- **铺垫暗示:** "这把剑似乎不简单"
- **角色目标:** "我要找到父亲"

## 为什么要管理期待?

✅ **管理得当:**
- 读者有满足感
- 节奏紧凑
- 高潮有力

❌ **管理不当:**
- 期待落空 → 读者失望
- 过早满足 → 失去悬念
- 遗忘承诺 → 情节漏洞

## 这个 Skill 能做什么?

✅ **自动识别期待:** 扫描已写章节,找出所有承诺和谜题
✅ **追踪满足度:** 量化每个期待的进展(0-100%)
✅ **计算紧迫性:** 评估哪些期待急需满足
✅ **节奏建议:** 何时满足、如何延迟、阶段性策略

## 使用方法

### 自动激活
当检测到期待相关内容时自动激活:
- 明确承诺("我发誓...")
- 谜题("他是谁?")
- 角色目标("我要...")

### 查询期待状态
```
/analyze
→ 选择"期待分析"
→ 查看所有未满足期待、紧迫性、建议
```

### 配置文件(可选)
创建 `.specify/expectations.json`:
```json
{
  "genre": "xuanhuan",
  "thresholds": {
    "high_urgency": 15
  }
}
```

## 输出示例

```
🎯 期待总览

【活跃期待】3项
1. [Plot] 击败云海宗宗主 | Ch1 | 进度:45% | ⚠️ 中等(24章)
2. [Mystery] 父亲的秘密 | Ch5 | 进度:20% | ✅ 低(20章)
3. [Growth] 突破金丹 | Ch15 | 进度:60% | 🔥 高(10章)

【紧迫性分析】
🚨 警告:"突破金丹"紧迫性高,建议3-5章内满足
⚠️ 注意:"击败宗主"需提供进展(阶段性胜利)
✅ 良好:"父亲的秘密"渐进披露中

【建议】
💡 第26章:主角金丹小突破(部分满足)
💡 第30章:金丹完全突破(完整payoff)
💡 第28章:与宗主手下交手(宗主期待进展)
```

## 最佳实践

1. **明确承诺:** 重要情节明确铺垫,让Skill能识别
2. **阶段性满足:** 大期待分解为小里程碑
3. **体裁适配:** 爽文频繁满足,史诗可长延迟
4. **定期检查:** 每10章查看一次期待状态

## 与其他 Skills 配合

- **Character Arc:** 角色目标 = 期待
- **Multi-Thread Narrative:** 多线期待管理
- **Pacing Control:** 期待节奏影响整体节奏
```

### Step 2: Commit

```bash
git add docs/skills/reader-expectation.md
git commit -m "docs(p3): add reader-expectation documentation"
```

---

## 验证标准

### 功能完整性
- [ ] 能检测至少 4 种期待类型(plot/mystery/goal/relationship)
- [ ] 能追踪每个期待的进度(0-100%)
- [ ] 能计算紧迫性(low/medium/high/critical)
- [ ] 能给出具体的满足建议(何时、如何)
- [ ] 支持体裁适配(至少3种体裁)

### 准确性
- [ ] 期待检测准确率 > 85%
- [ ] 紧迫性计算合理性 > 90%
- [ ] 建议可操作性 > 80%

### 用户体验
- [ ] 输出清晰,包含emoji和进度百分比
- [ ] 建议具体(不只是"该满足了")
- [ ] 自动激活不干扰

### 性能
- [ ] 分析 50 章小说 < 5 秒

---

## 预估工时

- **Task 1:** Skill 基础结构 - 3h
- **Task 2:** 期待检测引擎 - 5h
- **Task 3:** 满足度追踪系统 - 5h
- **Task 4:** 节奏建议系统 - 4h
- **Task 5:** 配置和集成 - 2h
- **Task 6:** 文档 - 2h

**总计:21 小时**

---

Closes: P3 优先级任务 #2
