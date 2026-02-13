# Guide.md 优化实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 重写 templates/commands/guide.md，将"列举多个选项"转变为"智能推荐最佳下一步"的三层优先级引擎

**Architecture:** Prompt 驱动的推荐系统，通过读取项目状态文件，计算 P0/P1/P2 三层优先级，输出 1 个主推荐 + 最多 2 个备选操作

**Tech Stack:** Markdown Prompt Engineering, Claude AI 自然语言处理

---

## 前置准备

**当前文件状态**：
- 存在：`templates/commands/guide.md` (299 行)
- 需要：完全重写

**依赖文件**（需要在 prompt 中引用）：
- `spec/tracking/write-checkpoint.json`
- `spec/tracking/character-state.json`
- `spec/tracking/plot-tracker.json`
- `spec/tracking/timeline.json`
- `spec/tracking/story-facts.json`
- `spec/tracking/tracking-log.md`
- `stories/*/specification.md`
- `stories/*/creative-plan.md`
- `stories/*/tasks.md`
- `stories/*/content/*.md`

---

## Task 1: 备份旧版本并创建新文件头

**Files:**
- Read: `templates/commands/guide.md`
- Write: `templates/commands/guide.md`

**Step 1: 备份旧版本**

```bash
cp templates/commands/guide.md templates/commands/guide.md.backup
```

**Step 2: 读取旧版本的 frontmatter**

读取 `templates/commands/guide.md` 第 1-6 行，保留 frontmatter：
```yaml
---
name: guide
description: "智能引导 — 根据当前故事状态自动推荐下一步操作，帮助新用户快速上手"
argument-hint: [故事目录名]
allowed-tools: Read, Glob, Grep
---
```

**Step 3: 写入新文件头和概述**

```markdown
---
name: guide
description: "智能引导 — 根据当前故事状态自动推荐下一步操作，帮助新用户快速上手"
argument-hint: [故事目录名]
allowed-tools: Read, Glob, Grep
---

# /guide — 智能引导中心

## 概述

自动检测当前故事的创作阶段和状态，基于三层优先级（P0/P1/P2）智能推荐**唯一最佳下一步**。

### 核心特性

- **1 个主推荐 + 最多 2 个备选**：聚焦决策，减少困惑
- **异常自动优先**：P0 级别问题（写作断点、tracking 严重落后）自动成为主推荐
- **长篇优化**：区分长篇（50-300章）和超长篇（>300章），差异化建议
- **健康提示折叠**：P2 级别问题（角色缺席、风格偏移）默认折叠，不干扰主流程

---
```

**Step 4: 验证格式**

检查：
- Frontmatter 格式正确（YAML）
- 中文标点符号一致
- Markdown 标题层级正确

**Step 5: 提交**

```bash
git add templates/commands/guide.md templates/commands/guide.md.backup
git commit -m "refactor(guide): add new file header and overview"
```

---

## Task 2: 实现状态检测模块

**Files:**
- Modify: `templates/commands/guide.md`

**Step 1: 添加状态检测逻辑部分**

在概述后添加：

```markdown
## 执行流程

### Step 1: 读取项目状态

**检测顺序**（从高优先级到低优先级）：

```javascript
// 1. 基础文件检测
specification = Read('stories/*/specification.md')
  → 提取 target-words, story-type
creative_plan = Read('stories/*/creative-plan.md')
  → 提取 总卷数, 总章节数规划
tasks = Read('stories/*/tasks.md')
  → 统计 pending/in_progress/completed 任务数
chapters = Glob('stories/*/content/*.md')
  → 统计已写章节数

// 2. Tracking 文件检测（仅检测存在性和修改时间）
write_checkpoint = exists('spec/tracking/write-checkpoint.json')
character_state = exists('spec/tracking/character-state.json')
plot_tracker = exists('spec/tracking/plot-tracker.json')
timeline = exists('spec/tracking/timeline.json')
story_facts = exists('spec/tracking/story-facts.json')
tracking_log = exists('spec/tracking/tracking-log.md')

// 3. 性能优化
- 只读取文件头部（前 50 行）判断状态
- Tracking 文件只检测存在性，不深度解析（除非触发 P0）
- 缓存读取结果，避免重复
```

**容错规则**：
- 文件读取失败 → 跳过该检测项，继续其他检测
- JSON 解析失败 → 降级为"文件存在性检测"
- 无法确定状态 → 使用默认值（长篇，空白项目）

---
```

**Step 2: 验证逻辑完整性**

检查：
- 所有需要的文件都在检测列表中
- 容错规则覆盖边界情况
- JavaScript 伪代码清晰易懂

**Step 3: 提交**

```bash
git add templates/commands/guide.md
git commit -m "feat(guide): add project state detection logic"
```

---

## Task 3: 实现项目规模判断模块

**Files:**
- Modify: `templates/commands/guide.md`

**Step 1: 添加规模判断逻辑**

在 Step 1 后添加：

```markdown
### Step 2: 计算项目规模

**判断逻辑**（针对长篇项目）：

```javascript
// 读取规划目标
planned_chapters = creative_plan.总章节数 || 0
actual_chapters = chapters.length

// 规模分级（只判断长篇类别）
IF planned_chapters > 500 OR actual_chapters > 300
  → project_scale = "超长篇"
ELSE IF planned_chapters > 100 OR actual_chapters > 50
  → project_scale = "长篇"
ELSE
  → project_scale = "长篇" // 默认
```

**规模影响的参数**：

| 规模 | Tracking 落后阈值（P0）| 质量检查频率 | 角色缺席警告阈值 |
|------|---------------------|------------|---------------|
| 长篇 | > 3 章 | 每 5 章 | > 5 章 |
| 超长篇 | > 2 章 | 每 3 章 | > 8 章 |

---
```

**Step 2: 验证规模判断规则**

检查：
- 规模分级条件覆盖所有情况
- 默认值合理（长篇）
- 参数表清晰

**Step 3: 提交**

```bash
git add templates/commands/guide.md
git commit -m "feat(guide): add project scale calculation"
```

---

## Task 4: 实现 P0 优先级检测

**Files:**
- Modify: `templates/commands/guide.md`

**Step 1: 添加 P0 检测逻辑**

在 Step 2 后添加：

```markdown
### Step 3: 扫描 P0 优先级（阻塞级 - 必须立即处理）

**P0 检测项**（按优先级排序）：

```javascript
p0_issues = []

// 1. 写作断点未恢复（最高优先级）
IF write_checkpoint.status == "in_progress"
  p0_issues.push({
    type: "checkpoint",
    priority: 100,
    command: "/write [checkpoint.chapter]",
    reason: "发现未完成的写作，可从断点恢复"
  })

// 2. Tracking 严重落后
tracking_lag = actual_chapters - tracking_log.last_chapter
IF (project_scale == "长篇" AND tracking_lag > 3) OR
   (project_scale == "超长篇" AND tracking_lag > 2)
  p0_issues.push({
    type: "tracking_lag",
    priority: 90,
    command: "/track --sync",
    reason: `Tracking 数据落后 ${tracking_lag} 章`
  })

// 3. 时间线冲突
IF timeline exists AND timeline.conflict == true
  p0_issues.push({
    type: "timeline_conflict",
    priority: 80,
    command: "/timeline --check",
    reason: "检测到时间线冲突"
  })

// 4. 伏笔超紧急
IF plot_tracker exists
  urgent_plots = plot_tracker.plots.filter(p => p.urgency > 0.9)
  IF urgent_plots.length > 0
    p0_issues.push({
      type: "plot_urgent",
      priority: 70,
      command: "/track --check",
      reason: `${urgent_plots.length} 个伏笔紧急度 > 0.9`
    })

// 5. Facts 冲突
IF story_facts exists
  // 调用 facts-checker 检测规则失败
  failed_rules = check_facts_rules(story_facts)
  IF failed_rules.length > 0
    p0_issues.push({
      type: "facts_conflict",
      priority: 65,
      command: "/facts check",
      reason: `${failed_rules.length} 个事实规则失败`
    })
```

**P0 选择规则**：
- 如果有 P0 问题 → 选择 priority 最高的作为主推荐
- P0 优先于 P1/P2

---
```

**Step 2: 验证 P0 检测逻辑**

检查：
- 5 个检测项都已实现
- 优先级分数合理（100 → 65）
- 错误信息清晰

**Step 3: 提交**

```bash
git add templates/commands/guide.md
git commit -m "feat(guide): add P0 priority detection"
```

---

## Task 5: 实现 P1 流程级推荐

**Files:**
- Modify: `templates/commands/guide.md`

**Step 1: 添加 P1 检测逻辑**

在 Step 3 后添加：

```markdown
### Step 4: 扫描 P1 优先级（流程级 - 按创作流程推荐）

**仅在无 P0 问题时执行**

```javascript
IF p0_issues.length > 0
  skip P1/P2 // P0 优先
ELSE
  // P1 流程判断

  // 1. 空白项目
  IF NOT specification exists
    primary_recommendation = {
      command: "/specify",
      reason: "创建故事规格书（定义核心设定）",
      alternatives: []
    }

  // 2. 规格草案
  ELSE IF specification.status == "draft"
    has_pending = specification.pending_items > 0
    primary_recommendation = {
      command: "/specify",
      reason: "继续完善规格书",
      alternatives: has_pending ? ["/clarify"] : []
    }

  // 3. 规格完成，无计划
  ELSE IF specification.status == "completed" AND NOT creative_plan exists
    primary_recommendation = {
      command: "/plan",
      reason: "制定创作计划",
      alternatives: ["/character create", "/specify --world"]
    }

  // 4. 计划完成，无任务
  ELSE IF creative_plan exists AND NOT tasks exists
    primary_recommendation = {
      command: "/tasks",
      reason: "生成写作任务列表",
      alternatives: ["/plan --detail vol-01", "/character list"]
    }

  // 5. 任务就绪，未开始写作
  ELSE IF tasks.pending > 0 AND actual_chapters == 0
    primary_recommendation = {
      command: "/write 第1章",
      reason: "开始写作第一章",
      alternatives: ["/recap", "/character list"]
    }

  // 6. 写作中（检查离开时长）
  ELSE IF tasks.pending > 0 AND actual_chapters > 0
    time_away = calculate_time_away()

    IF time_away > 1_day
      primary_recommendation = {
        command: "/recap --brief",
        reason: `距上次写作已 ${time_away}，建议先重建上下文`,
        alternatives: ["/write 第[N+1]章"]
      }
    ELSE
      next_chapter = actual_chapters + 1
      primary_recommendation = {
        command: `/write 第${next_chapter}章`,
        reason: "继续写作",
        alternatives: ["/recap --brief", "/facts check"]
      }

  // 7. 卷完成
  ELSE IF is_volume_complete()
    current_volume = get_current_volume()
    primary_recommendation = {
      command: `/analyze --range=vol-${current_volume}`,
      reason: "分析本卷质量（推荐）",
      alternatives: ["/checklist", `/plan --detail vol-${current_volume + 1}`]
    }

  // 8. 全书完成
  ELSE IF tasks.pending == 0 AND tasks.completed > 0
    primary_recommendation = {
      command: "/checklist",
      reason: "执行最终检查清单",
      alternatives: ["/analyze"]
    }
```

**辅助函数**：

```javascript
// 计算离开时长
function calculate_time_away() {
  sources = [
    write_checkpoint?.updatedAt,
    last_chapter_file?.mtime,
    tracking_log?.last_updated
  ]

  last_activity = max(sources.filter(s => s != null))
  return now - last_activity
}

// 判断是否卷完成
function is_volume_complete() {
  IF NOT creative_plan.volumes exists
    return false

  current_vol = creative_plan.volumes.find(v => v.status == "in_progress")
  IF NOT current_vol
    return false

  vol_chapters = current_vol.chapters.length
  vol_completed = chapters.filter(c => c.volume == current_vol.number).length

  return vol_completed >= vol_chapters
}
```

---
```

**Step 2: 验证 P1 流程覆盖**

检查：
- 8 个阶段都已覆盖
- 离开时长判断逻辑正确
- 卷完成判断考虑边界情况

**Step 3: 提交**

```bash
git add templates/commands/guide.md
git commit -m "feat(guide): add P1 workflow-level recommendations"
```

---

## Task 6: 实现 P2 健康提示计分

**Files:**
- Modify: `templates/commands/guide.md`

**Step 1: 添加 P2 检测和计分逻辑**

在 Step 4 后添加：

```markdown
### Step 5: 扫描 P2 优先级（优化级 - 质量提升建议）

**仅在无 P0 问题时执行，结果作为健康提示折叠显示**

```javascript
p2_issues = []

// 1. 角色长期缺席
IF character_state exists
  absent_threshold = (project_scale == "超长篇") ? 8 : 5

  absent_characters = character_state.characters.filter(c => c.absent_chapters > absent_threshold)

  FOR EACH char IN absent_characters
    score = 0
    IF project_scale == "长篇"
      IF char.absent_chapters >= 5 AND char.absent_chapters <= 7
        score = 30
      ELSE IF char.absent_chapters >= 8 AND char.absent_chapters <= 10
        score = 50
      ELSE IF char.absent_chapters > 10
        score = 70
    ELSE // 超长篇
      IF char.absent_chapters >= 8 AND char.absent_chapters <= 10
        score = 30
      ELSE IF char.absent_chapters >= 11 AND char.absent_chapters <= 15
        score = 50
      ELSE IF char.absent_chapters > 15
        score = 70

    p2_issues.push({
      type: "character_absent",
      score: score,
      command: "/character list",
      description: `角色「${char.name}」已 ${char.absent_chapters} 章未出场`
    })

// 2. 伏笔中等紧急
IF plot_tracker exists
  medium_plots = plot_tracker.plots.filter(p => p.urgency >= 0.5 AND p.urgency < 0.9)

  FOR EACH plot IN medium_plots
    score = 0
    IF plot.urgency >= 0.5 AND plot.urgency < 0.6
      score = 20
    ELSE IF plot.urgency >= 0.7 AND plot.urgency < 0.8
      score = 40
    ELSE IF plot.urgency >= 0.8 AND plot.urgency < 0.9
      score = 60

    p2_issues.push({
      type: "plot_medium",
      score: score,
      command: "/track --check",
      description: `伏笔「${plot.name}」紧急度 ${plot.urgency}`
    })

// 3. Tracking 轻微落后
IF tracking_lag >= 1 AND tracking_lag <= 2
  score = tracking_lag == 1 ? 15 : 30
  p2_issues.push({
    type: "tracking_light",
    score: score,
    command: "/track --sync",
    description: `Tracking 数据落后 ${tracking_lag} 章`
  })

// 4. 风格偏移（如果有检测）
IF style_deviation exists AND style_deviation > threshold
  p2_issues.push({
    type: "style_deviation",
    score: 25,
    command: "/analyze --focus=style",
    description: `检测到风格偏移`
  })

// 5. 爽点间隔过长
recent_chapters = chapters.slice(-5)
IF recent_chapters.filter(c => c.has_climax == false).length == 5
  p2_issues.push({
    type: "climax_gap",
    score: 35,
    command: "/analyze --focus=hook",
    description: `最近 5 章无高潮标记`
  })
```

**健康提示显示规则**：

```javascript
// 按 score 降序排序
p2_issues.sort((a, b) => b.score - a.score)

// 显示控制
IF p2_issues.length == 0
  → 不显示健康提示区域
ELSE IF p2_issues.length == 1 AND p2_issues[0].score < 30
  → 不显示（不重要）
ELSE IF p2_issues.some(i => i.score > 60)
  → 默认展开显示
ELSE
  → 折叠显示，用户可点击展开
```

---
```

**Step 2: 验证 P2 计分规则**

检查：
- 分数范围合理（15-70）
- 长篇和超长篇阈值区分正确
- 显示控制逻辑符合设计

**Step 3: 提交**

```bash
git add templates/commands/guide.md
git commit -m "feat(guide): add P2 health tips with scoring"
```

---

## Task 7: 实现备选操作选择逻辑

**Files:**
- Modify: `templates/commands/guide.md`

**Step 1: 添加备选操作选择规则**

在 Step 5 后添加：

```markdown
### Step 6: 选择备选操作

**仅在 P1 流程推荐时执行（P0 场景备选已在 Step 4 中定义）**

**动态备选规则**：

```javascript
alternatives = primary_recommendation.alternatives || []

// 规则 1: 离开时长 > 1 天 AND 主推荐是 /write
IF time_away > 1_day AND primary_recommendation.command.startsWith("/write")
  IF NOT alternatives.includes("/recap --brief")
    alternatives.unshift("/recap --brief") // 插入到第一位

// 规则 2: 检测到 P2 级别问题
IF p2_issues.length > 0
  top_p2 = p2_issues[0] // score 最高的问题
  IF top_p2.score > 40 AND NOT alternatives.includes(top_p2.command)
    IF alternatives.length < 2
      alternatives.push(top_p2.command)

// 规则 3: 主推荐是流程类命令
IF primary_recommendation.command IN ["/specify", "/plan", "/tasks"]
  // 备选已在 P1 中定义，不再添加

// 限制备选数量为 2 个
alternatives = alternatives.slice(0, 2)
```

**备选操作的展示格式**：

```markdown
备选操作：
  • [command] — [reason/context]
```

**不推荐的备选（避免噪音）**：
- ❌ 不把 `/guide` 作为备选（循环引用）
- ❌ 不把已完成阶段的命令作为备选
- ❌ 不把过于高级的分析作为备选（如刚开始写作就推荐 /analyze）

---
```

**Step 2: 验证备选逻辑**

检查：
- 动态规则与静态规则不冲突
- 备选数量限制为 2
- 排除逻辑正确

**Step 3: 提交**

```bash
git add templates/commands/guide.md
git commit -m "feat(guide): add alternative recommendations logic"
```

---

## Task 8: 实现标准输出模板

**Files:**
- Modify: `templates/commands/guide.md`

**Step 1: 添加标准输出模板**

在 Step 6 后添加：

```markdown
### Step 7: 输出推荐结果

**标准输出格式**：

```
📍 当前状态
━━━━━━━━━━━━━━━━━━━━
📊 进度：第 [actual_chapters] 章 / 共 [planned_chapters] 章（[progress_percent]%）
📚 当前卷：第 [current_volume] 卷 / 共 [total_volumes] 卷
⏰ 距上次写作：[time_away_display]

🎯 下一步推荐
━━━━━━━━━━━━━━━━━━━━
▶️ [primary_command] — [primary_reason]

[如果有备选操作]
备选操作：
  • [alt_1_command] — [alt_1_reason]
  • [alt_2_command] — [alt_2_reason]

[如果有 P2 问题]
⚠️ 健康提示（[p2_count] 个问题）[可展开]
  • [p2_1_description]
  • [p2_2_description]
  • [p2_3_description]
```

**变量计算**：

```javascript
// 进度百分比
progress_percent = planned_chapters > 0
  ? Math.round((actual_chapters / planned_chapters) * 100)
  : 0

// 时间显示
time_away_display = format_time(time_away)
  // 如：< 1 小时、2 小时、1 天、3 天

// 当前卷
current_volume = get_current_volume_number()
total_volumes = creative_plan?.volumes?.length || "未知"
```

---
```

**Step 2: 验证输出格式**

检查：
- Emoji 和分隔符正确
- 变量插值语法清晰
- 条件显示逻辑完整

**Step 3: 提交**

```bash
git add templates/commands/guide.md
git commit -m "feat(guide): add standard output template"
```

---

## Task 9: 实现场景变体（空白项目）

**Files:**
- Modify: `templates/commands/guide.md`

**Step 1: 添加空白项目场景**

在 Step 7 后添加：

```markdown
### 场景变体

#### 场景 1: 空白项目

**触发条件**: `NOT specification exists`

**输出模板**：

```
🚀 欢迎开始新故事！

🎯 下一步推荐
━━━━━━━━━━━━━━━━━━━━
▶️ /specify [故事名] — 创建故事规格书

💡 完整流程：/specify → /plan → /tasks → /write
```

---
```

**Step 2: 验证场景触发条件**

检查触发条件是否唯一且正确

**Step 3: 提交**

```bash
git add templates/commands/guide.md
git commit -m "feat(guide): add blank project scenario"
```

---

## Task 10: 实现场景变体（卷末、新卷、P0 紧急）

**Files:**
- Modify: `templates/commands/guide.md`

**Step 1: 添加卷末场景**

在场景 1 后添加：

```markdown
#### 场景 2: 卷末

**触发条件**: `is_volume_complete() == true`

**输出模板**：

```
🎉 第 [current_volume] 卷写作完成！

📊 本卷统计：[vol_chapters] 章，[vol_words] 字

🎯 下一步推荐
━━━━━━━━━━━━━━━━━━━━
▶️ /analyze [故事名] --range=vol-[current_volume] — 分析本卷质量（推荐）

备选操作：
  • /checklist — 执行卷末检查清单
  • /plan --detail vol-[next_volume] — 规划下一卷
```

---
```

**Step 2: 添加超长篇新卷开始场景**

```markdown
#### 场景 3: 超长篇新卷开始

**触发条件**: `project_scale == "超长篇" AND is_volume_start()`

**输出模板**：

```
📚 准备开始第 [next_volume] 卷

🎯 下一步推荐
━━━━━━━━━━━━━━━━━━━━
▶️ /recap --full — 重建全局上下文（超长篇推荐）

备选操作：
  • /plan --detail vol-[next_volume] — 查看本卷规划
  • /character list — 确认角色状态

💡 超长篇提示：新卷开始前建议执行完整 recap
```

---
```

**Step 3: 添加 P0 紧急场景**

```markdown
#### 场景 4: P0 紧急情况

**触发条件**: `p0_issues.length > 0`

**输出模板**：

```
📍 当前状态
━━━━━━━━━━━━━━━━━━━━
📊 进度：第 [actual_chapters] 章 / 共 [planned_chapters] 章（[progress_percent]%）

🔴 检测到紧急问题（优先处理）
━━━━━━━━━━━━━━━━━━━━
▶️ [p0_command] — [p0_reason]

备选操作：
  • [p0_alternative] — [alt_reason]

💡 完成紧急修复后，可继续正常流程
```

---
```

**Step 4: 验证所有场景**

检查：
- 4 个场景触发条件互斥
- 输出模板格式一致
- 变量插值正确

**Step 5: 提交**

```bash
git add templates/commands/guide.md
git commit -m "feat(guide): add volume-end, new-volume, and P0 emergency scenarios"
```

---

## Task 11: 添加容错和边界处理

**Files:**
- Modify: `templates/commands/guide.md`

**Step 1: 添加边界情况处理部分**

在场景变体后添加：

```markdown
## 边界情况处理

### 异常状态检测

```javascript
// 1. 文件不全（有 plan 但无 spec）
IF creative_plan exists AND NOT specification exists
  → P0 警告: {
    command: "/specify",
    reason: "检测到异常状态：有创作计划但无规格书，建议重新创建规格书"
  }

// 2. 多个 P0 同时触发
IF p0_issues.length > 1
  → 选择 priority 最高的
  → 其他 P0 问题作为健康提示展示

// 3. 已写章节超过规划章节
IF actual_chapters > planned_chapters
  → 添加提示: "⚠️ 已超出计划章节数，建议更新 creative-plan.md"

// 4. creative-plan 存在但无卷数信息
IF creative_plan exists AND NOT creative_plan.volumes
  → 默认为长篇（>100章）

// 5. Tracking 文件损坏/格式错误
IF tracking_file exists BUT parse_error
  → P0 警告: {
    command: "/track-init",
    reason: "Tracking 文件格式错误，建议重新初始化"
  }
```

### 容错规则

```javascript
// 文件读取失败
TRY
  content = Read(file_path)
CATCH error
  → 跳过该检测项
  → 记录日志（仅内部，不展示给用户）
  → 继续其他检测

// JSON 解析失败
TRY
  data = JSON.parse(content)
CATCH error
  → 降级为"文件存在性检测"
  → 不阻塞整体推荐

// 无法判断阶段
IF cannot_determine_stage
  → 默认推荐 P1 流程的第一步（/specify）
  → 添加提示: "💡 无法确定当前阶段，从头开始流程"
```

---
```

**Step 2: 验证容错逻辑**

检查：
- 边界情况覆盖设计中的 6 个场景
- 容错规则不会导致崩溃
- 降级策略合理

**Step 3: 提交**

```bash
git add templates/commands/guide.md
git commit -m "feat(guide): add error handling and edge cases"
```

---

## Task 12: 添加辅助说明和最终检查

**Files:**
- Modify: `templates/commands/guide.md`

**Step 1: 添加使用说明和注意事项**

在文件末尾添加：

```markdown
---

## 使用说明

### 命令调用

```bash
# 检查当前故事状态（自动检测故事目录）
/guide

# 指定故事目录
/guide my-story
```

### 优先级覆盖

如果用户明确知道要执行的操作，可以直接调用对应命令，无需通过 /guide 推荐。

### 健康提示展开

P2 健康提示默认折叠，用户可在需要时展开查看详情。

---

## 注意事项

### 性能优化

- 只读取文件头部（前 50 行）
- Tracking 文件只检测存在性，除非触发 P0
- 使用缓存避免重复读取

### 推荐原则

- P0 优先于一切
- P1 按流程推荐
- P2 仅作提示，不成为主推荐

### 扩展性

新增命令时，只需在对应优先级表中添加条目：
- P0：紧急异常场景
- P1：流程节点
- P2：质量提示

---

## 命令优先级参考表

| 命令 | P0 场景 | P1 场景 | P2 场景 |
|------|--------|---------|---------|
| /specify | 文件不全异常 | 空白项目、规格草案 | - |
| /clarify | - | 规格有待定项 | - |
| /plan | - | 规格完成 | - |
| /tasks | - | 计划完成 | - |
| /write | 写作断点恢复 | 任务就绪、写作中 | - |
| /recap | - | 离开>1天 | - |
| /analyze | - | 卷末 | - |
| /checklist | - | 全书完成 | - |
| /track | tracking 落后 >3/2章 | - | tracking 落后 1-2章 |
| /timeline | 时间线冲突 | - | - |
| /facts | facts 冲突 | - | - |
| /character | - | - | 角色缺席 >5/8章 |
| /revise | - | - | 风格偏移 |

---
```

**Step 2: 全文检查清单**

逐项检查：
- [ ] Frontmatter 格式正确
- [ ] 所有 P0/P1/P2 检测项已实现
- [ ] 4 个场景变体完整
- [ ] 容错逻辑覆盖边界情况
- [ ] 输出模板格式一致
- [ ] 中文标点符号一致
- [ ] Markdown 语法正确
- [ ] 变量插值语法清晰

**Step 3: 格式验证**

```bash
# 检查 Markdown 语法（如果有 linter）
markdownlint templates/commands/guide.md

# 或手工检查：
# - 标题层级正确
# - 代码块闭合
# - 列表格式一致
```

**Step 4: 最终提交**

```bash
git add templates/commands/guide.md
git commit -m "docs(guide): add usage notes and priority reference table"
```

---

## Task 13: 删除备份文件并验证

**Files:**
- Delete: `templates/commands/guide.md.backup`
- Read: `templates/commands/guide.md`

**Step 1: 对比新旧版本**

```bash
# 统计行数
wc -l templates/commands/guide.md.backup templates/commands/guide.md

# 查看差异
git diff --no-index templates/commands/guide.md.backup templates/commands/guide.md | head -100
```

**Step 2: 验证新版本功能完整性**

手工检查新版本是否包含：
- [ ] 三层优先级体系（P0/P1/P2）
- [ ] 项目规模判断（长篇/超长篇）
- [ ] 主推荐 + 最多 2 个备选
- [ ] 4 个场景变体
- [ ] 容错和边界处理
- [ ] 健康提示折叠逻辑

**Step 3: 删除备份文件**

```bash
rm templates/commands/guide.md.backup
```

**Step 4: 最终提交**

```bash
git add templates/commands/guide.md
git commit -m "refactor(guide): complete rewrite with priority-based recommendation engine

BREAKING CHANGE: Complete rewrite of guide.md logic from 8-stage enumeration
to 3-tier priority system (P0/P1/P2) with intelligent best-next-step recommendations.

Features:
- P0 (blocking): 5 emergency checks (checkpoint, tracking lag, timeline conflict, plot urgent, facts conflict)
- P1 (workflow): 8 stage-based recommendations following creative process
- P2 (optimization): 5 quality checks (character absent, plot medium, tracking light, style deviation, climax gap)
- Project scale: Long-form (50-300 ch) vs Super-long (>300 ch) differentiation
- Output: 1 primary + max 2 alternatives + health tips (collapsed by default)
- 4 scenario variants: blank project, volume end, new volume, P0 emergency
- Comprehensive error handling and edge cases

Original 8-stage approach → Priority-based recommendation engine
Original 299 lines → Approximately 600 lines (with detailed logic)
"