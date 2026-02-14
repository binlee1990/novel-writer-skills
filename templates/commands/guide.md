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

## 上下文感知推荐引擎

在给出推荐前，先检测项目当前状态：

### 检测清单

1. **文件存在性检测**:
```javascript
const hasSpec = fileExists('specification.md')
const hasPlan = fileExists('creative-plan.md')
const hasTasks = fileExists('tasks.md')
const chapterCount = countFiles('stories/*/content/*.md')
const hasTracking = fileExists('spec/tracking/character-state.json')
```

2. **模式检测**:
```javascript
const isSingleFileMode = fileExists('spec/tracking/character-state.json')
const isShardedMode = dirExists('spec/tracking/volumes')
const isMCPMode = fileExists('spec/tracking/novel-tracking.db')
```

3. **问题检测**:
```javascript
const trackingSize = getFileSize('spec/tracking/character-state.json')
const needMigration = trackingSize > 50 * 1024  // >50KB
const mcpAvailable = isMCPMode && chapterCount > 300
```

### 决策逻辑

```yaml
IF not hasSpec:
  推荐: /specify 或 /constitution
  原因: 缺少故事规格文件

ELSE IF hasSpec and not hasPlan:
  推荐: /plan
  原因: 有规格但无计划

ELSE IF hasPlan and not hasTasks:
  推荐: /tasks
  原因: 有计划但无任务分解

ELSE IF hasTasks and chapterCount == 0:
  推荐: /write
  原因: 任务已分解，可以开始写作

ELSE IF chapterCount > 0:
  推荐: /analyze 或 /track --sync
  原因: 已有内容，建议分析或同步

IF needMigration:
  警告: /track --migrate --target sharded
  原因: 追踪文件过大(>50KB)

IF chapterCount > 300 and not isMCPMode:
  提示: 考虑启用MCP模式获得更好性能
  命令: /track --migrate --target mcp
```

---

## 新手引导模式

检测用户是否为新手（通过历史命令数量或配置文件）：

### 首次使用（显示完整流程图）

```
📖 七步方法论完整流程

1. /constitution ─┐
                  ├─→ 定义创作原则和风格
2. /specify ──────┘

3. /clarify ─────→ 澄清关键决策

4. /plan ────────→ 制定创作计划

5. /tasks ───────→ 分解任务清单

6. /write ───────→ 执行写作

7. /analyze ─────→ 质量验证

当前位置: ● 1 ○ 2 ○ 3 ○ 4 ○ 5 ○ 6 ○ 7
```

### 第2-5次使用（简化提示）

```
📍 当前进度: 已完成 specification.md

下一步:
  🎯 /plan - 制定创作计划
  💡 /clarify - 如有疑问可先澄清

进度: ● ● ○ ○ ○ ○ ○
```

### 熟练用户（仅显示异常）

```
⚠️ 异常提醒:
- spec/tracking/ 目录为空 → 建议运行 /track-init
```

---

## 数据加载策略

本命令在检测项目状态时，采用 **三层回退** 机制：

### Layer 3: MCP 查询（优先）

```typescript
// 如果 MCP 已启用且数据已同步
const volumeStats = await mcp.call('novelws-mcp/stats_volume', {});
const consistencyStats = await mcp.call('novelws-mcp/stats_consistency', {});
```

**优势**：
- 高性能聚合统计（章节数、追踪状态）
- 自动计算一致性指标
- 跨卷数据对比

### Layer 2: 分片 JSON（次优）

```bash
# 当 spec/tracking/volumes/ 存在时
# 读取 summary/ 文件夹的摘要数据
character_summary=$(cat spec/tracking/summary/characters-summary.json)
plot_summary=$(cat spec/tracking/summary/plot-summary.json)
```

**适用场景**：
- MCP 未启用或同步延迟
- 需要快速检测项目状态
- 摘要数据已足够进行状态判断

### Layer 1: 单文件 JSON（兜底）

```bash
# 传统模式，加载完整文件
character_state=$(cat spec/tracking/character-state.json)
plot_tracker=$(cat spec/tracking/plot-tracker.json)
```

**向下兼容**：小型项目（< 300 章）继续使用单文件模式

### 检测流程

```javascript
// 1. 检测分片模式
is_sharded = exists('spec/tracking/volumes/')

// 2. 检测 MCP
has_mcp = exists('mcp-servers.json')

// 3. 选择数据源
if (has_mcp) {
  // Layer 3: 使用 MCP 查询
  stats = await mcp.call('novelws-mcp/stats_volume', {});
} else if (is_sharded) {
  // Layer 2: 读取 summary 摘要
  stats = readSummaryFiles();
} else {
  // Layer 1: 读取单文件
  stats = readTrackingFiles();
}
```

---

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

// 2. 检测分片模式
is_sharded = exists('spec/tracking/volumes/')
has_mcp = exists('mcp-servers.json') // MCP 是否配置

// 3. Tracking 文件检测（仅检测存在性和修改时间）
// 分片模式：检测 summary/ 和 volumes/
// 单文件模式：检测根目录 JSON
if (is_sharded) {
  write_checkpoint = exists('spec/tracking/summary/write-checkpoint.json')
  character_state = exists('spec/tracking/summary/characters-summary.json')
  plot_tracker = exists('spec/tracking/summary/plot-summary.json')
  timeline = exists('spec/tracking/summary/timeline-summary.json')
  story_facts = exists('spec/tracking/summary/story-facts-summary.json')
  tracking_log = exists('spec/tracking/summary/tracking-log-summary.md')
} else {
  write_checkpoint = exists('spec/tracking/write-checkpoint.json')
  character_state = exists('spec/tracking/character-state.json')
  plot_tracker = exists('spec/tracking/plot-tracker.json')
  timeline = exists('spec/tracking/timeline.json')
  story_facts = exists('spec/tracking/story-facts.json')
  tracking_log = exists('spec/tracking/tracking-log.md')
}

// 4. 性能优化
- 只读取文件头部（前 50 行）判断状态
- Tracking 文件只检测存在性，不深度解析（除非触发 P0）
- 缓存读取结果，避免重复
```

**容错规则**：
- 文件读取失败 → 跳过该检测项，继续其他检测
- JSON 解析失败 → 降级为"文件存在性检测"
- 无法确定状态 → 使用默认值（长篇，空白项目）

---

### Step 2: 计算项目规模

**判断逻辑**（针对长篇项目）：

```javascript
// 读取规划目标
planned_chapters = creative_plan.总章节数 || 0
actual_chapters = chapters.length

// 规模分级（考虑分片模式）
IF is_sharded
  // 如果已启用分片，自动判定为超长篇
  → project_scale = "超长篇"
ELSE IF planned_chapters > 500 OR actual_chapters > 300
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

### Step 6: 选择备选操作

**仅在 P1 流程推荐时执行（P0 场景备选已在 Step 3 中定义）**

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

#### 场景 4: 分片模式建议

**触发条件**: `actual_chapters > 300 AND NOT is_sharded`

**输出模板**：

```
📍 当前状态
━━━━━━━━━━━━━━━━━━━━
📊 进度：第 [actual_chapters] 章（超过 300 章）

💡 超长篇优化建议
━━━━━━━━━━━━━━━━━━━━
检测到项目已超过 300 章，建议启用分片模式以提升性能：

  /track --migrate

迁移后的优势：
  • 按卷拆分 tracking 数据，降低单文件大小
  • 命令支持 --volume 参数进行范围操作
  • 可选启用 MCP 加速查询

🎯 下一步推荐
━━━━━━━━━━━━━━━━━━━━
▶️ [primary_command] — [primary_reason]
```

---

#### 场景 5: P0 紧急情况

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
