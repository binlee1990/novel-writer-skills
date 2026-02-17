---
name: track
description: 综合追踪小说创作进度和内容
argument-hint: [--brief | --plot | --stats | --check [--volume vol-XX] | --fix | --sync [--incremental] | --migrate [--auto | --volumes "1-100,101-200"] | --log]
recommended-model: claude-haiku-4-5-20251001 # --sync 数据更新速度优先；--check 深度检查可用 sonnet
allowed-tools: Read(//tracking/**), Read(//tracking/**), Read(//stories/**), Read(//stories/**), Bash(find:*), Bash(wc:*), Bash(grep:*), Bash(*)
scripts:
  sh: resources/scripts/bash/track-progress.sh
  ps: resources/scripts/powershell/track-progress.ps1
---

# 综合进度追踪

全面展示小说创作的各项进度和状态。

## 资源加载（可选）

本命令用于管理 tracking 文件，默认不加载额外资源。

### 可选配置

```yaml
resource-loading:
  track:
    skills:
      quality-assurance:
        - consistency-checker  # 追踪数据一致性检查
```

**推荐资源**: consistency-checker（验证追踪数据一致性）

## 追踪维度

1. **写作进度** - 字数、章节、完成率
2. **情节发展** - 主线进度、支线状态
3. **时间线** - 故事时间推进
4. **角色状态** - 角色发展和位置
5. **伏笔管理** - 埋设和回收状态
6. **叙事线管理** - **[新增]** 多线叙事进度、视角调度、信息差

## 使用方法

执行脚本 {SCRIPT} [选项]：
- 无参数 - 显示完整追踪报告
- `--brief` - 显示简要信息
- `--plot` - 仅显示情节追踪
- `--stats` - 仅显示统计数据
- `--check` - **[增强]** 执行深度一致性检查（包含角色验证），支持 `--volume vol-XX` --volume 范围限定，只检查该卷的 tracking 数据
- `--fix` - **[新增]** 自动修复发现的简单问题
- `--sync` - **[新增]** 批量同步多章节的 tracking 数据，支持 `--incremental` 增量同步

## 数据来源

整合多个追踪文件的信息：
- `progress.json` - 写作进度
- `tracking/plot-tracker.json` - 情节追踪
- `tracking/timeline.json` - 时间线
- `tracking/relationships.json` - 关系网络
- `tracking/character-state.json` - 角色状态
- `tracking/narrative-threads.json` - **[新增]** 多线叙事追踪（POV调度、信息差、线程交汇）
- `tracking/validation-rules.json` - **[新增]** 验证规则（用于--check和--fix）

---

## 🆕 Tracking 历史查看

**新增功能**: 查看 tracking-log.md 中记录的所有历史更新

### 使用方法

**查看所有历史更新**:
```bash
/track --log
```

**查看特定命令的历史**:
```bash
/track --log --command=write
/track --log --command=analyze
/track --log --command=plan
```

**查看特定时间范围的历史**:
```bash
/track --log --since=2026-02-01
/track --log --until=2026-02-08
/track --log --since=2026-02-01 --until=2026-02-08
```

**查看特定文件的更新历史**:
```bash
/track --log --file=character-state.json
/track --log --file=relationships.json
/track --log --file=plot-tracker.json
/track --log --file=timeline.json
```

### 输出格式

#### 完整历史列表

```markdown
📜 Tracking 更新历史

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 2026-02-08 14:30:25 - /write chapter-05

**状态**: 已自动更新
**更新文件**: character-state.json, relationships.json, plot-tracker.json, timeline.json

**摘要**:
- 林晓情绪变化：平静 → 焦虑
- 新增关系：林晓 → 队长（信任）
- 情节推进：主线 +10%
- 时间线事件：Day 15 - 首次合作任务

[查看详情]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 2026-02-08 15:45:10 - /analyze chapter-01-05

**状态**: 用户确认后更新（选择：全部应用）
**更新文件**: character-state.json, relationships.json, timeline.json, plot-tracker.json

**摘要**:
- 角色分析：Ch.5 林晓焦虑情绪
- 关系分析：林晓与队长建立信任
- 时间线：第 15 天事件补充
- 情节推进：主线 +10%

[查看详情]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 2026-02-07 10:20:00 - /plan 创作计划

**状态**: 已自动更新
**更新文件**: plot-tracker.json

**摘要**:
- 初始化 5 条情节线定义
- 设置里程碑和伏笔规划

[查看详情]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

总计：23 次更新记录
```

#### 详细查看单条记录

选择"[查看详情]"时，显示完整的 diff 和更新依据：

```markdown
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 更新记录详情
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 2026-02-08 14:30:25 - /write chapter-05

### 命令执行
- **命令**: `/write chapter-05 --focus emotion`
- **状态**: 已自动更新

### 更新内容

#### character-state.json
- 林晓：lastAppearance chapter-04 → chapter-05，emotion 平静 → 焦虑

#### relationships.json
+ 新增：林晓 → 队长（信任，strength: 0.6，evidence: Ch.5 首次合作任务）

#### plot-tracker.json
- 主线-001：progress 0.2 → 0.3，lastUpdate chapter-04 → chapter-05

#### timeline.json
+ 新增：Day 15 14:00 chapter-05 首次合作任务

### 更新依据
- 角色分析: Ch.5 林晓对话和行为显示焦虑情绪
- 关系分析: 林晓与队长首次合作，建立初步信任
- 情节推进: 主线进展 10%，发现第一条线索
- 时间线: Ch.5 推进到第 15 天
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### 过滤查看

支持按命令、文件、时间范围过滤：
- **按命令**: `/track --log --command=write` → 只显示 /write 命令的更新记录
- **按文件**: `/track --log --file=character-state.json` → 只显示该文件的变更记录
- **按时间**: `/track --log --since=2026-02-01 --until=2026-02-08` → 时间范围内的记录

### 实现逻辑

1. 读取 `tracking/tracking-log.md`，解析日志格式
2. 根据过滤条件筛选，按时间倒序排列
3. 默认仅加载摘要（轻量级），选择"查看详情"时加载完整 diff
4. 大型日志（>1000 条）分页显示

**注意**：如果 `tracking-log.md` 不存在，说明尚未执行过 tracking 更新命令，执行 `/write` 或 `/plan` 后会自动创建。

### 错误处理

#### 如果 tracking-log.md 不存在

```
ℹ️ 提示：tracking-log.md 不存在
- 位置：tracking/tracking-log.md
- 原因：尚未执行过任何 tracking 更新命令
- 建议：执行 /write 或 /plan 命令后会自动创建
```

#### 如果日志格式无法解析

```
⚠️ 警告：日志文件格式异常
- 文件：tracking-log.md
- 问题：无法解析部分日志条目
- 影响：部分历史记录可能无法显示
- 建议：检查日志文件格式是否被手动修改
```

## 输出示例

```
📊 小说创作综合报告
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 《大明风华录》

✍️ 写作进度
  完成：60/240章 (25%)
  字数：162,000/800,000
  当前：第二卷《朝堂风云》

📍 情节状态
  主线：改革大业 [朝堂初入阶段]
  支线：感情线 [相互了解]

⏰ 时间线
  故事时间：万历三十年春
  时间跨度：5个月

👥 主要角色
  李中庸：翰林院编修 @北京
  沈玉卿：张居正义女 [活跃]

⚡ 待处理
  伏笔：3个未回收
  冲突：改革vs保守 [升级中]

✅ 一致性检查：通过
```

## 增强功能

### 叙事线同步（--check 扩展）

当检测到 `narrative-threads.json` 或多线叙事结构时，自动提取和更新叙事线数据：
- **视角角色** → 更新 `povSchedule`
- **叙事线推进** → 更新 thread 的 `chapters` 和 `lastActiveChapter`
- **信息揭示** → 更新 `informationState`
- **叙事线交汇** → 更新 `intersections`

检测内容：叙事线活跃度（冷线警告）、视角分布比例、活跃信息差数量。

```
📊 叙事线健康度
━━━━━━━━━━━━━━━━━━━━
| 叙事线 | 最后活跃 | 冷线章数 | 状态 |
|--------|---------|---------|------|
| 主线   | 第 15 章 | 0       | ✅ 活跃 |
| 支线1  | 第 12 章 | 3       | ⚠️ 注意 |
| 暗线   | 第 5 章  | 10      | 🔴 危险 |

视角分布：主角 60% / 角色B 25% / 角色C 15%
活跃信息差：[N] 个
```


### 伏笔健康度检测（--check 扩展）

在 `--check` 模式下，对 `plot-tracker.json` 中的伏笔执行健康度检测，包含三项检测：

1. **伏笔热度管理** — 基于 `heat` 字段（current/trend/lastMentioned/readerAwareness）检测冷却伏笔
2. **伏笔回收时机** — 基于 `urgency` 和持续章数，按紧急/建议/可持有三级分类
3. **伏笔链完整性** — 基于 `chain` 字段（parentId/childIds/chainName）检测孤立伏笔

#### 增强后的伏笔数据结构

`plot-tracker.json` 的 foreshadowing 条目增强字段：

```json
{
  "id": "fs-001",
  "content": "[伏笔内容]",
  "plantedChapter": 3,
  "status": "planted|hinted|partially_resolved|resolved|abandoned",
  "urgency": 0.5,
  "heat": { "current": 0.6, "trend": "rising|stable|cooling", "lastMentioned": 12, "readerAwareness": "high|medium|low" },
  "chain": { "parentId": null, "childIds": ["fs-003"], "chainName": "身世之谜" },
  "resolution": { "plannedChapter": 25, "plannedMethod": "[回收方式]", "impact": "major|moderate|minor" },
  "hints": [{ "chapter": 8, "content": "[提示内容]", "subtlety": "obvious|moderate|subtle" }]
}
```

#### 检测输出示例

```
🔮 伏笔健康度
━━━━━━━━━━━━━━━━━━━━
| 伏笔 | 热度 | 趋势 | 上次提及 | 状态 |
|------|------|------|---------|------|
| [身世之谜] | 🔥🔥🔥 高 | ↑ 上升 | 第 15 章 | ✅ 健康 |
| [失踪事件] | 🔥 低 | ↓ 冷却 | 第 5 章 | ⚠️ 需要提示 |
| [预言] | ❄️ 极低 | ↓ 冷却 | 第 2 章 | ❌ 读者可能已遗忘 |

⏰ 伏笔回收建议
  🔴 紧急：[身世之谜] 已持续 20 章，建议第 [N]-[N+3] 章内回收
  ⚠️ 建议：[神秘宝物] 已持续 12 章，建议第 [M]-[M+5] 章内回收
  ✅ 可持有：[预言] 刚埋设 5 章

🔗 伏笔链「身世之谜」：fs-001 ✅ → fs-003 🔄 → fs-005 ⏳
🔗 伏笔链「远古秘密」：fs-002 ✅ → fs-004 ⏳
⚠️ 孤立伏笔：fs-006 — 考虑关联或放弃
```

### 模式：创作数据统计（`--stats`）

**触发条件**：`$ARGUMENTS` 包含 `--stats`

**数据收集**：
- 读取所有章节文件（`content/*.md`）
- 读取 `tasks.md`、`creative-plan.md`
- 读取 `tracking/character-state.json`、`tracking/plot-tracker.json`

#### 总览面板

```
📊 创作统计 — [故事名]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📖 总字数：[N] 字 | 📝 章节：已写 [M] / 计划 [K]
📈 完成度：▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░ [X]%
👥 活跃角色：[A] 个 | 🔮 活跃伏笔：[B] 个 | 📋 待办：[C] 个
```

#### 字数详情与角色

```
📝 字数统计
━━━━━━━━━━━━━━━━━━━━
每章字数分布：
第 01 章 ████████████████ 3,200 字
第 02 章 ██████████████░░ 2,800 字
第 03 章 ████████████████████ 4,100 字
...

统计：平均 [N] 字/章 | 最长：第[X]章([N]字) | 最短：第[Y]章([M]字)
每卷：第 1 卷 [N] 字（[M] 章）✅ | 第 2 卷 [N] 字（[M] 章）🔄

👥 角色出场频率（Top 5）
━━━━━━━━━━━━━━━━━━━━
| 角色 | 出场率 | 最近 | 缺席 |
|------|--------|------|------|
| [主角] | 100% | 第[K]章 | 0 |
| [角色A] | 72% | 第[K]章 | 1 |
| [角色B] | 48% | 第[K]章 | 5 ⚠️ |

⚠️ 长期缺席：[角色C] 10 章未出场、[角色D] 8 章未出场
```

#### 内容构成与伏笔状态

```
📊 内容构成（全书平均）
━━━━━━━━━━━━━━━━━━━━
对话 [X]% | 描写 [Y]% | 叙述 [Z]% | 动作 [W]%
参考范围：对话 30-40% | 描写 20-30% | 叙述 15-25% | 动作 15-25%
状态：[✅ 均衡 / ⚠️ 偏向描述]

🔮 伏笔状态：[N]个（已回收[A] ✅ | 进行中[B] 🔄 | 待回收[C] ⏳）
回收率：[X]%（建议 > 80%）
紧急伏笔：[伏笔内容] — 紧急度 [X]，持续 [N] 章

📋 情节线进度
━━━━━━━━━━━━━━━━━━━━
主线 [名称] ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░ 60%
支线1 [名称] ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░ 90%
支线2 [名称] ▓▓▓▓▓▓░░░░░░░░░░░░░░ 30%
```

### 节奏健康度检测（--check 扩展）

`--check` 时执行四项节奏检测：

1. **节奏单一性** — 分析最近 N 章情绪强度分布（健康：高/中/低各占 20%-50%；偏单一：某项 >60%；严重：>80% 或连续 5+ 章同强度）
2. **爽点间隔** — 检测爽点分布（正常 ≤3 章；偏长 4-5 章；过长 >5 章）
3. **钩子连续性** — 检查最近章节是否有钩子（悬念/反转/信息/情感），标记无钩子章节
4. **情绪曲线合理性** — 基于张弛有度原则，检测连续高强度导致的读者疲劳

#### 检测输出示例

```
📊 节奏分布（最近 10 章）
━━━━━━━━━━━━━━━━━━━━
高强度：[N] 章（[X]%）| 中强度：[N] 章（[X]%）| 低强度：[N] 章（[X]%）
判定：[✅ 节奏多样 / ⚠️ 偏单一 / ❌ 严重单一]

⭐ 爽点间隔：最近爽点第 [N] 章，当前间隔 [M] 章 [✅/⚠️/❌]

🪝 钩子连续性（最近 5 章）：
第[A]章 ✅ 悬念 | 第[B]章 ✅ 反转 | 第[C]章 ❌ 无钩子 | 第[D]章 ✅ 信息 | 第[E]章 ✅ 情感

📈 情绪曲线：
第[A]章 ████████░░ 高 → 第[B]章 ██████████ 高 → 第[C]章 █████████░ 高
⚠️ 连续 3 章高强度，建议下一章安排过渡/日常

🏥 综合节奏健康度
━━━━━━━━━━━━━━━━━━━━
节奏多样性：[✅/⚠️/❌]  高[X]% 中[Y]% 低[Z]%
爽点间隔  ：[✅/⚠️/❌]  当前间隔 [M] 章
钩子连续性：[✅/⚠️/❌]  最近 5 章中 [N] 章有钩子
情绪曲线  ：[✅/⚠️/❌]  连续 [K] 章高强度

综合评定：[健康 / 需关注 / 需改进]
```

---

### 数据一致性验证与深度检查

**基础检查**（默认执行）：验证 plot-tracker / timeline / relationships / character-state 的一致性、时间逻辑、关系冲突、位置合理性。

**深度验证 (--check)**：在基础检查之上，增加角色深度验证（名称一致性、称呼规则、行为人设匹配），基于 `validation-rules.json`。支持 `--volume vol-XX` 限定范围。MCP 可用时优先调用 `stats_consistency`。

#### 内部任务流程（自动执行）

```
Phase 1: 基础验证 [并行]
  T001-T004: 情节一致性 / 时间线验证 / 关系验证 / 世界观验证

Phase 2: 角色深度验证
  T005: 加载 validation-rules.json
  T006-T007: 扫描章节角色名称，对比 character-state.json
  T008-T009: 检查称呼规则，验证角色行为人设

Phase 3: 生成综合报告
  T010-T012: 汇总结果 → 标记严重程度 → 生成修复建议
```

```
📊 深度验证报告
━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 通过项目: 15/18

❌ 发现问题 (3):
1. [高] 第3章: 主角名"李明"应为"李中庸"
2. [中] 第7章: 沈玉卿称呼错误，用了"师兄"
3. [低] 第12章: 时间线跳跃未说明

🔧 可自动修复: 2个 → 运行 /track --fix
```

### 自动修复模式 (--fix)

基于验证报告自动修复：角色名称错误、固定称呼错误、简单拼写错误（根据 validation-rules.json）。不可自动修复的问题标记为需人工处理。修复后建议重新运行 `--check` 验证。

```
🔧 自动修复报告
━━━━━━━━━━━━━━━━━━━
✅ 已修复: 2个问题
- 第3章: "李明" → "李中庸"
- 第7章: "师兄" → "公子"

⚠️ 需人工处理: 1个问题
- 第12章: 时间线跳跃需要补充说明

修复完成！建议重新运行 /track --check 验证
```

### 智能分析与建议

根据追踪数据自动分析：进度对比（计划 vs 实际）、完成时间预测、伏笔覆盖率、角色出场频率、冲突强度曲线。基于分析结果提供下一步写作重点、待处理伏笔、关系线和时间线调整建议。

```
📊 综合追踪报告
━━━━━━━━━━━━━━━━━━━━━━━━━━
[进度条] ████████░░░░░░░ 25%

🎯 下一步建议：
1. 第65章前回收"青铜古镜"伏笔
2. 加强主角与反派的正面冲突
3. 补充第二卷的时间线细节

⚠️ 需要关注：
- 角色B已5章未出场
- 支线剧情进度滞后
```

### 数据导出

支持导出为 Markdown 报告、JSON 原始数据、可视化图表（关系图、时间轴）。

---

### 批量同步模式 (--sync)

批量扫描并同步多个章节的 tracking 数据。适用于连续写了多章但忘记更新 tracking、导入外部内容、数据严重不同步等场景。

#### 增量同步（--sync --incremental）

只处理上次同步后的新章节：

1. 读取 `tracking/tracking-log.md` 最后一条记录，获取 last_sync_chapter
2. 扫描 `stories/[current]/content/` 中编号 > last_sync_chapter 的章节
3. 只对这些新章节执行 tracking 更新
4. 更新 tracking-log.md 记录本次同步

如果 tracking-log.md 不存在或无法确定 last_sync_chapter，回退到全量同步。

#### 使用场景

- 连续写了多章但忘记更新 tracking
- 导入外部写作内容后需要同步
- tracking 数据与实际内容严重不同步

#### 同步流程

##### Step 1: 差异检测

扫描所有已写章节，对比 tracking 数据，找出不同步的部分：

```
📊 同步差异检测
━━━━━━━━━━━━━━━━━━━━
已写章节：[N] 章 | tracking 最后更新：第 [M] 章
需要同步：第 [M+1]-[N] 章（共 [K] 章）
差异：角色 [X] 处 | 关系 [Y] 处 | 情节 [Z] 处 | 时间线 [W] 处
```

##### Step 2: 批量分析

对每个未同步的章节执行内容分析，提取：
1. 出场角色及状态变化
2. 角色关系变化
3. 情节推进事件
4. 时间线信息

##### Step 3: 生成同步方案

```
📋 同步方案
━━━━━━━━━━━━━━━━━━━━

### character-state.json
[列出所有需要更新的角色状态变化]

### relationships.json
[列出所有需要更新的关系变化]

### plot-tracker.json
[列出所有需要更新的情节进度]

### timeline.json
[列出所有需要更新的时间线事件]

是否应用同步？ [Y/N/S(选择性)]
```

##### Step 4: 执行同步

用户确认后，批量更新所有 tracking 文件，并记录到 tracking-log.md。

#### 性能优化

- 按章节顺序处理，避免重复分析
- 增量更新：仅更新变化部分
- 批量写入：所有更新一次性写入文件

---

### 数据写入协议

当 /track 更新 tracking 数据时，根据当前模式选择写入方式：

**三层 Fallback 数据加载：**

读取 tracking 数据时按以下优先级：
1. **MCP 查询（优先）**：调用对应 MCP 工具获取精确数据
2. **分片 JSON（次优）**：读取 `tracking/volumes/[currentVolume]/` 下的分片文件
3. **单文件 JSON（兜底）**：读取 `tracking/` 下的单文件

**分片模式写入：**
1. 确定当前章节属于哪个卷（从 volume-summaries.json 的 chapters 范围判断）
2. 更新该卷的分片文件（如 `tracking/volumes/vol-03/character-state.json`）
3. 同步更新全局摘要文件（如 characters-summary.json 的 activeCount）
4. 如果 MCP 可用，调用 `sync_from_json` 同步到 SQLite

**单文件模式写入：**
- 直接更新 `tracking/` 下的文件（现有逻辑）

---

## 🆕 分片迁移（--migrate）

当 tracking 文件过大（单文件超过 50KB）时，将数据从单文件模式迁移到分卷分片模式。

### 使用方法

```
/track --migrate              # 交互式迁移（AI 引导确认卷边界）
/track --migrate --auto       # 自动迁移（按 100 章一卷拆分）
/track --migrate --volumes "1-100,101-250,251-400"  # 自定义卷边界
```

### 迁移流程

**阶段 1：检测与备份**

1. 运行脚本检测当前状态：
```powershell
powershell -File {SCRIPT_DIR}/migrate-tracking.ps1 -Mode check -Json
```

2. 如果已经是分片模式，提示用户并退出
3. 如果是单文件模式，运行备份：
```powershell
powershell -File {SCRIPT_DIR}/migrate-tracking.ps1 -Mode backup -Json
```

**阶段 2：确定卷边界**
- `--auto`：从 `plot-tracker.json` 的 `checkpoints.volumeEnd` 获取，无则按 100 章一卷
- `--volumes`：解析用户提供的边界字符串，验证连续性
- 交互式（默认）：分析情节弧线建议卷边界，用户确认

**阶段 3：数据拆分**

运行脚本创建目录结构：
```powershell
powershell -File {SCRIPT_DIR}/migrate-tracking.ps1 -Mode auto -Json
```

按卷边界拆分 character-state / timeline / relationships / plot-tracker 四个文件：
- 拆分原则：按 chapter 分配数据到对应卷，跨卷数据保留引用
- 写入 `tracking/volumes/vol-XX/`

拆分规则概要：
| 文件 | 拆分方式 |
|------|---------|
| character-state.json | protagonist 复制到每卷（状态为卷末）；supportingCharacters 按 lastSeen.chapter 分配；appearanceTracking 按 chapter 分配 |
| timeline.json | events 按 chapter 分配；storyTime 每卷记录时间范围；parallelEvents 按时间点分配 |
| relationships.json | characters 复制到每卷（只保留活跃角色）；history 按 chapter 分配；factions 复制到每卷（状态为卷末） |
| plot-tracker.json | foreshadowing 按 planted.chapter 分配（跨卷未解决伏笔保留引用）；plotlines 每卷记录进展；checkpoints 按卷分配 |

**阶段 4：生成全局摘要**
- 生成 4 个摘要文件到 `tracking/summary/`：
  - characters-summary.json — 活跃/归档角色统计
  - plot-summary.json — 未解决伏笔汇总、回收统计
  - timeline-summary.json — 每卷关键里程碑、故事时间范围
  - volume-summaries.json — 每卷摘要（id, title, chapters, wordCount, keyEvents, unresolvedPlots, newCharacters, exitedCharacters）

**阶段 5：初始化 SQLite**（MCP 可用时）
- 调用 `sync_from_json` 导入 + `sync_status` 验证

**阶段 6：验证与清理**

1. 验证每个卷的文件都存在且 JSON 格式正确
2. 验证摘要文件的统计数据与分卷数据一致
3. 确认无误后，删除原始单文件（备份已保存）
4. 输出迁移报告：

```
📦 分片迁移报告
━━━━━━━━━━━━━━━━━━━
迁移前：单文件模式，总大小 XXX KB
迁移后：N 卷分片，每卷平均 XX KB
备份位置：tracking/backup/YYYYMMDD-HHMMSS/
```

### 错误处理

任何步骤失败时，提示用户从备份恢复：
```
迁移失败。备份文件在 tracking/backup/YYYYMMDD-HHMMSS/
可以手动将备份文件复制回 tracking/ 恢复原状。
```
不自动删除备份，由用户手动清理。

---

## 🔗 命令链式提示

**追踪报告生成后，自动附加下一步建议**：

```
💡 下一步建议：
1️⃣ `/write [下一章节号]` — 数据正常，继续写作
2️⃣ `/guide` — 查看智能引导，获取全局建议
3️⃣ `/analyze --focus=logic` — 如发现一致性问题，执行逻辑专项分析
```
