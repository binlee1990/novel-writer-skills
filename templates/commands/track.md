---
name: track
description: 综合追踪小说创作进度和内容
argument-hint: [--brief | --plot | --stats | --check [--volume vol-XX] | --fix | --sync [--incremental] | --migrate [--auto | --volumes "1-100,101-200"] | --log]
allowed-tools: Read(//spec/tracking/**), Read(//spec/tracking/**), Read(//stories/**), Read(//stories/**), Bash(find:*), Bash(wc:*), Bash(grep:*), Bash(*)
scripts:
  sh: .specify/scripts/bash/track-progress.sh
  ps: .specify/scripts/powershell/track-progress.ps1
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
- `--check` - **[增强]** 执行深度一致性检查（包含角色验证），支持 `--volume vol-XX` 限定范围
- `--fix` - **[新增]** 自动修复发现的简单问题
- `--sync` - **[新增]** 批量同步多章节的 tracking 数据，支持 `--incremental` 增量同步

## 数据来源

整合多个追踪文件的信息：
- `progress.json` - 写作进度
- `spec/tracking/plot-tracker.json` - 情节追踪
- `spec/tracking/timeline.json` - 时间线
- `spec/tracking/relationships.json` - 关系网络
- `spec/tracking/character-state.json` - 角色状态
- `spec/tracking/narrative-threads.json` - **[新增]** 多线叙事追踪（POV调度、信息差、线程交汇）
- `spec/tracking/validation-rules.json` - **[新增]** 验证规则（用于--check和--fix）

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

当用户选择"[查看详情]"时，显示完整的 diff 和更新依据：

```markdown
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 更新记录详情
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 2026-02-08 14:30:25 - /write chapter-05

### 命令执行
- **命令**: `/write chapter-05 --focus emotion`
- **执行者**: AI
- **状态**: 已自动更新

### 更新内容

#### character-state.json
```diff
  "林晓": {
    "lastAppearance": "chapter-04",
+   "lastAppearance": "chapter-05",
    "emotion": "平静",
+   "emotion": "焦虑",
    "location": "训练场"
  }
```

#### relationships.json
```diff
+ {
+   "from": "林晓",
+   "to": "队长",
+   "type": "信任",
+   "strength": 0.6,
+   "evidence": "Ch.5 首次合作任务",
+   "lastUpdate": "chapter-05"
+ }
```

#### plot-tracker.json
```diff
  "plotLines": [
    {
      "id": "主线-001",
      "progress": 0.2,
+     "progress": 0.3,
      "lastUpdate": "chapter-04",
+     "lastUpdate": "chapter-05"
    }
  ]
```

#### timeline.json
```diff
+ {
+   "day": 15,
+   "time": "14:00",
+   "chapter": "chapter-05",
+   "event": "首次合作任务"
+ }
```

### 更新依据
- **角色分析**: Ch.5 林晓的对话和行为显示焦虑情绪
- **关系分析**: Ch.5 林晓与队长首次合作，建立初步信任
- **情节推进**: 主线进展 10%，发现第一条线索
- **时间线**: Ch.5 情节推进到第 15 天

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### 过滤查看示例

**按命令过滤**:
```markdown
📜 /write 命令的更新历史（12 条记录）

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 2026-02-08 14:30:25 - /write chapter-05
[摘要...]

## 2026-02-07 16:15:00 - /write chapter-04
[摘要...]

[继续列出其他 /write 记录...]
```

**按文件过滤**:
```markdown
📜 character-state.json 的更新历史（8 条记录）

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 2026-02-08 14:30:25 - /write chapter-05
**变更**: 林晓情绪 平静 → 焦虑

## 2026-02-07 16:15:00 - /write chapter-04
**变更**: 林晓位置更新

[继续列出其他记录...]
```

**按时间范围过滤**:
```markdown
📜 2026-02-01 至 2026-02-08 的更新历史（15 条记录）

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[列出时间范围内的所有记录...]
```

### 实现逻辑

**读取 tracking-log.md**:
1. 读取 `spec/tracking/tracking-log.md`
2. 解析日志格式，提取所有更新记录
3. 根据过滤条件筛选记录
4. 按时间倒序排列（最新的在前）

**解析日志条目**:
- 提取时间戳、命令类型、更新状态
- 提取更新文件列表
- 提取摘要信息（从 diff 中生成）
- 保留完整的 diff 和更新依据

**性能考虑**:
- 默认仅加载摘要信息（轻量级）
- 用户选择"查看详情"时才加载完整 diff
- 对于大型日志文件（>1000 条记录），分页显示

### 错误处理

#### 如果 tracking-log.md 不存在

```markdown
ℹ️ 提示：tracking-log.md 不存在
- 位置：spec/tracking/tracking-log.md
- 原因：尚未执行过任何 tracking 更新命令
- 建议：执行 /write 或 /plan 命令后会自动创建
```

#### 如果日志格式无法解析

```markdown
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

当故事使用多线叙事时（检测到 `narrative-threads.json` 存在或 `specification.md` 中标记了多线结构），`/track` 在章节同步流程中自动提取和更新叙事线数据。

#### 章节同步提取规则

从每个新写章节的内容中提取：

1. **视角角色** → 更新 `povSchedule`（记录本章的 POV 角色和对应线程）
2. **叙事线推进** → 更新对应 thread 的 `chapters` 和 `lastActiveChapter`
3. **信息揭示** → 更新 `informationState`（读者/角色的已知信息变化）
4. **叙事线交汇** → 更新 `intersections`（如本章有多条线交汇）

#### 叙事线健康度检测（--check 内）

```
📊 叙事线健康度
━━━━━━━━━━━━━━━━━━━━

| 叙事线 | 类型 | 最后活跃 | 冷线章数 | 状态 |
|--------|------|---------|---------|------|
| 主线 | main | 第 15 章 | 0 | ✅ 活跃 |
| 支线1 | sub | 第 12 章 | 3 | ⚠️ 注意 |
| 暗线 | hidden | 第 5 章 | 10 | 🔴 危险 |

⚠️ 警告：
- 暗线已 10 章未推进，读者可能遗忘
- 支线1 接近冷线阈值，建议近 2 章内推进

📊 视角分布
━━━━━━━━━━━━━━━━━━━━
主角视角：60%  ████████████░░░░░░░░
角色B视角：25%  █████░░░░░░░░░░░░░░
角色C视角：15%  ███░░░░░░░░░░░░░░░░

📊 活跃信息差：[N] 个
- 最长持续信息差：[描述]（已持续 [M] 章）
```


### 伏笔健康度检测（--check 扩展）

在 `--check` 模式下，对 `plot-tracker.json` 中的伏笔数据执行健康度检测。

#### 增强后的伏笔数据结构

`plot-tracker.json` 的 foreshadowing 条目支持以下增强字段：

```json
{
  "foreshadowing": [
    {
      "id": "fs-001",
      "content": "[伏笔内容]",
      "plantedChapter": 3,
      "plantedContext": "[埋设时的上下文摘要]",
      "status": "planted|hinted|partially_resolved|resolved|abandoned",
      "urgency": 0.5,

      "heat": {
        "current": 0.6,
        "trend": "rising|stable|cooling",
        "lastMentioned": 12,
        "mentionCount": 3,
        "readerAwareness": "high|medium|low"
      },

      "chain": {
        "parentId": null,
        "childIds": ["fs-003", "fs-005"],
        "relatedIds": ["fs-002"],
        "chainName": "[伏笔链名称，如「身世之谜」]"
      },

      "resolution": {
        "plannedChapter": 25,
        "plannedMethod": "[计划的回收方式]",
        "actualChapter": null,
        "actualMethod": null,
        "impact": "major|moderate|minor"
      },

      "hints": [
        {
          "chapter": 8,
          "content": "[提示内容]",
          "subtlety": "obvious|moderate|subtle"
        }
      ]
    }
  ]
}
```

#### 检测 1：伏笔热度管理

```
🔮 伏笔热度状态
━━━━━━━━━━━━━━━━━━━━

| 伏笔 | 热度 | 趋势 | 上次提及 | 状态 |
|------|------|------|---------|------|
| [身世之谜] | 🔥🔥🔥 高 | ↑ 上升 | 第 15 章 | ✅ 健康 |
| [神秘宝物] | 🔥🔥 中 | → 稳定 | 第 12 章 | ✅ 健康 |
| [失踪事件] | 🔥 低 | ↓ 冷却 | 第 5 章 | ⚠️ 需要提示 |
| [预言] | ❄️ 极低 | ↓ 冷却 | 第 2 章 | ❌ 读者可能已遗忘 |

💡 建议：
- [失踪事件]：在近 2 章内添加一个 subtle 提示
- [预言]：在近 1 章内添加一个 obvious 提示，或考虑放弃
```

#### 检测 2：伏笔回收时机

```
⏰ 伏笔回收建议
━━━━━━━━━━━━━━━━━━━━

🔴 紧急回收（紧急度 > 0.8）：
- [身世之谜]：已持续 20 章，读者期待值极高
  建议：在第 [N]-[N+3] 章内回收
  推荐方式：[基于情节的具体建议]

⚠️ 建议回收（紧急度 0.5-0.8）：
- [神秘宝物]：已持续 12 章，热度中等
  建议：在第 [M]-[M+5] 章内回收

✅ 可继续持有（紧急度 < 0.5）：
- [预言]：刚埋设 5 章，可继续持有
```

#### 检测 3：伏笔链完整性

```
🔗 伏笔链检查
━━━━━━━━━━━━━━━━━━━━

伏笔链「身世之谜」：
fs-001（身世暗示）→ fs-003（血脉觉醒）→ fs-005（真相揭示）
状态：fs-001 ✅ 已提示 → fs-003 🔄 进行中 → fs-005 ⏳ 待回收

伏笔链「远古秘密」：
fs-002（古籍线索）→ fs-004（遗迹发现）
状态：fs-002 ✅ 已提示 → fs-004 ⏳ 待回收

⚠️ 孤立伏笔（未关联到任何链）：
- fs-006（[内容]）— 考虑是否需要关联或放弃
```

### 模式：创作数据统计（`--stats`）

**触发条件**：`$ARGUMENTS` 包含 `--stats`

**数据收集**：
- 读取所有章节文件（`content/*.md`）
- 读取 `tasks.md`
- 读取 `spec/tracking/character-state.json`
- 读取 `spec/tracking/plot-tracker.json`
- 读取 `creative-plan.md`

#### 总览面板

```
📊 创作统计 — [故事名]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📖 总字数：[N] 字
📝 章节数：已写 [M] / 计划 [K]
📈 完成度：▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░ [X]%
👥 活跃角色：[A] 个
🔮 活跃伏笔：[B] 个
📋 待办任务：[C] 个
```

#### 字数详情

```
📝 字数详情
━━━━━━━━━━━━━━━━━━━━

每章字数分布：
第 01 章 ████████████████ 3,200 字
第 02 章 ██████████████░░ 2,800 字
第 03 章 ████████████████████ 4,100 字
...

统计摘要：
  平均每章：[N] 字
  最长章节：第 [X] 章（[N] 字）
  最短章节：第 [Y] 章（[M] 字）
  字数标准差：[S] 字

每卷字数：
  第 1 卷：[N] 字（[M] 章）✅ 已完成
  第 2 卷：[N] 字（[M] 章）🔄 进行中
```

#### 角色出场频率

```
👥 角色出场频率（Top 10）
━━━━━━━━━━━━━━━━━━━━

| # | 角色 | 出场 | 出场率 | 最近 | 缺席 |
|---|------|------|--------|------|------|
| 1 | [主角] | [N]/[M] | 100% | 第[K]章 | 0 |
| 2 | [角色A] | [N]/[M] | 72% | 第[K]章 | 1 |
| 3 | [角色B] | [N]/[M] | 48% | 第[K]章 | 5 ⚠️ |
...

⚠️ 长期缺席角色：
- [角色C]：10 章未出场
- [角色D]：8 章未出场
```

#### 内容构成分析

```
📊 内容构成（全书平均）
━━━━━━━━━━━━━━━━━━━━

对话：[X]% ████████░░
描写：[Y]% ██████░░░░
叙述：[Z]% ████░░░░░░
动作：[W]% ███░░░░░░░

参考范围（网文）：
  对话 30-40% | 描写 20-30% | 叙述 15-25% | 动作 15-25%

状态：[✅ 均衡 / ⚠️ 偏向描述]
```

#### 伏笔状态汇总

```
🔮 伏笔状态
━━━━━━━━━━━━━━━━━━━━

总计：[N] 个
  已回收：[A] 个 ✅
  进行中：[B] 个 🔄
  待回收：[C] 个 ⏳
  已放弃：[D] 个 ❌

回收率：[X]%（建议 > 80%）

紧急伏笔（紧急度 > 0.8）：
1. [伏笔内容] — 紧急度 [X]，持续 [N] 章
2. [伏笔内容] — 紧急度 [Y]，持续 [M] 章
```

#### 情节线进度

```
📋 情节线进度
━━━━━━━━━━━━━━━━━━━━

主线：[名称]
▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░ 60%

支线 1：[名称]
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░ 90%

支线 2：[名称]
▓▓▓▓▓▓░░░░░░░░░░░░░░ 30%
```

### 节奏健康度检测（--check 扩展）

当使用 `--check` 参数时，除了基础一致性验证外，还执行节奏健康度检测：

#### 检测 1：节奏单一性

分析最近 N 章的情绪节奏（高/中/低），检测是否过于单一：

```
📊 节奏分布（最近 10 章）
━━━━━━━━━━━━━━━━━━━━
高强度：[N] 章（[X]%）
中强度：[N] 章（[X]%）
低强度：[N] 章（[X]%）

判定：
✅ 节奏多样（高/中/低分布均匀）
⚠️ 节奏偏单一（连续 [N] 章 [高/中/低] 强度）
❌ 节奏严重单一（[X]% 章节为同一强度）
```

**判定标准**：
- ✅ 健康：高/中/低各占 20%-50%
- ⚠️ 偏单一：某一强度占比 > 60%
- ❌ 严重单一：某一强度占比 > 80%，或连续 5+ 章同一强度

#### 检测 2：爽点间隔

检查最近章节中爽点的分布间隔：

```
⭐ 爽点间隔检测
━━━━━━━━━━━━━━━━━━━━
最近爽点：第 [N] 章（[类型]）
当前间隔：[M] 章无爽点

判定：
✅ 间隔正常（≤ 3 章）
⚠️ 间隔偏长（4-5 章）— 建议在下一章安排爽点
❌ 间隔过长（> 5 章）— 读者流失风险！
```

#### 检测 3：钩子连续性

检查最近章节的钩子是否连续：

```
🪝 钩子连续性
━━━━━━━━━━━━━━━━━━━━
最近 5 章钩子状态：
第 [A] 章：✅ 悬念 ⭐⭐⭐
第 [B] 章：✅ 反转 ⭐⭐⭐⭐
第 [C] 章：❌ 无钩子
第 [D] 章：✅ 信息 ⭐⭐
第 [E] 章：✅ 情感 ⭐⭐⭐

判定：
⚠️ 第 [C] 章无钩子，建议补充
```

#### 检测 4：情绪曲线合理性

基于张弛有度原则，检查情绪曲线是否合理：

```
📈 情绪曲线
━━━━━━━━━━━━━━━━━━━━
第 [A] 章 ████████░░ 高
第 [B] 章 ██████████ 高
第 [C] 章 █████████░ 高
第 [D] 章 ████████░░ 高
第 [E] 章 ███████░░░ 中高

⚠️ 警告：连续 4 章高强度，读者可能疲劳
💡 建议：下一章安排过渡/日常/角色互动
```

#### 综合节奏健康度评分

```
🏥 节奏健康度
━━━━━━━━━━━━━━━━━━━━
节奏多样性：[✅/⚠️/❌]
爽点间隔  ：[✅/⚠️/❌]
钩子连续性：[✅/⚠️/❌]
情绪曲线  ：[✅/⚠️/❌]

综合评定：[健康 / 需关注 / 需改进]
```

---

### 数据一致性验证

基础检查（默认执行）：
- plot-tracker.json 与 creative-plan.md 的一致性
- timeline.json 的时间逻辑
- relationships.json 的关系冲突
- character-state.json 的位置合理性

### 深度验证模式 (--check)

当使用 `--check` 参数时，执行程序化的深度验证：

#### --volume 范围限定

支持 `--volume vol-XX` 限定检查范围：
- 带 --volume：只检查该卷的 tracking 数据和对应章节
- 不带 --volume：检查当前卷（分片模式）或全部（单文件模式）

**MCP 优先：** 如果 MCP 可用，调用 `stats_consistency` 获取一致性报告，避免逐文件扫描。

#### 内部任务流程（自动执行）
```markdown
# Phase 1: 基础验证 [并行执行]
- [x] T001 [P] 执行情节一致性检查 (plot-check逻辑)
- [x] T002 [P] 执行时间线验证 (timeline逻辑)
- [x] T003 [P] 执行关系验证 (relations逻辑)
- [x] T004 [P] 执行世界观验证 (world-check逻辑)

# Phase 2: 角色深度验证
- [x] T005 加载validation-rules.json验证规则
- [x] T006 扫描所有章节中的角色名称
- [x] T007 对比character-state.json验证名称一致性
- [x] T008 检查称呼是否符合relationships.json
- [x] T009 验证角色行为是否符合人设

# Phase 3: 生成综合报告
- [x] T010 汇总所有验证结果
- [x] T011 标记问题严重程度
- [x] T012 生成修复建议
```

#### 验证报告示例
```
📊 深度验证报告
━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 通过项目: 15/18

❌ 发现问题 (3):
1. [高] 第3章: 主角名"李明"应为"李中庸"
2. [中] 第7章: 沈玉卿称呼错误，用了"师兄"
3. [低] 第12章: 时间线跳跃未说明

🔧 可自动修复: 2个
📝 需人工确认: 1个

运行 /track --fix 自动修复简单问题
```

### 自动修复模式 (--fix)

当使用 `--fix` 参数时，基于验证报告自动修复：

#### 自动修复范围
1. **角色名称错误** - 根据validation-rules.json自动替换
2. **固定称呼错误** - 自动修正为正确称呼
3. **简单拼写错误** - 修正明显的typo

#### 修复流程
```markdown
# 内部修复任务（自动执行）
- [x] F001 读取验证报告中的问题列表
- [x] F002 [P] 修复第3章角色名称错误
- [x] F003 [P] 修复第7章称呼错误
- [x] F004 生成修复报告
- [x] F005 更新追踪文件
```

#### 修复报告示例
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

1. **进度分析**
   - 对比计划进度和实际进度
   - 预测完成时间
   - 识别写作瓶颈

2. **内容分析**
   - 伏笔覆盖率（已埋设/已回收）
   - 角色出场频率
   - 冲突强度曲线

3. **行动建议**
   根据分析结果提供：
   - 下一步写作重点
   - 需要处理的伏笔
   - 建议加强的关系线
   - 时间线调整建议

### 可视化报告

生成结构化报告：
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
- 第45章的时间跳跃需要说明
```

### 数据导出

支持导出追踪数据为：
- Markdown 格式的完整报告
- JSON 格式的原始数据
- 可视化图表（关系图、时间轴）

---

### 批量同步模式 (--sync)

当使用 `--sync` 参数时，批量扫描并同步多个章节的 tracking 数据：

#### 增量同步（--sync --incremental）

不扫描所有章节，只处理上次同步后的新章节：

1. 读取 `spec/tracking/tracking-log.md` 最后一条记录，获取 last_sync_chapter
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
已写章节：[N] 章
tracking 最后更新：第 [M] 章

需要同步的章节：第 [M+1] - [N] 章（共 [K] 章）

差异类型：
- 角色状态：[X] 处需更新
- 关系网络：[Y] 处需更新
- 情节进度：[Z] 处需更新
- 时间线：[W] 处需更新
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
2. **分片 JSON（次优）**：读取 `spec/tracking/volumes/[currentVolume]/` 下的分片文件
3. **单文件 JSON（兜底）**：读取 `spec/tracking/` 下的单文件

**分片模式写入：**
1. 确定当前章节属于哪个卷（从 volume-summaries.json 的 chapters 范围判断）
2. 更新该卷的分片文件（如 `spec/tracking/volumes/vol-03/character-state.json`）
3. 同步更新全局摘要文件（如 characters-summary.json 的 activeCount）
4. 如果 MCP 可用，调用 `sync_from_json` 同步到 SQLite

**单文件模式写入：**
- 直接更新 `spec/tracking/` 下的文件（现有逻辑）

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

#### 阶段 1：检测与备份

1. 运行脚本检测当前状态：
```powershell
powershell -File {SCRIPT_DIR}/migrate-tracking.ps1 -Mode check -Json
```

2. 如果已经是分片模式，提示用户并退出
3. 如果是单文件模式，运行备份：
```powershell
powershell -File {SCRIPT_DIR}/migrate-tracking.ps1 -Mode backup -Json
```

#### 阶段 2：确定卷边界

**--auto 模式：**
- 读取 `plot-tracker.json` 的 `checkpoints.volumeEnd` 确定已有的卷边界
- 如果没有卷边界信息，按每 100 章一卷自动划分
- 最后一卷可以不满 100 章

**--volumes 模式：**
- 解析用户提供的卷边界字符串，如 `"1-100,101-250,251-400"`
- 验证边界连续且覆盖所有已写章节

**交互式模式（默认）：**
- 读取 `plot-tracker.json` 和 `creative-plan.md`
- 分析情节弧线，建议合理的卷边界
- 向用户展示建议并确认

#### 阶段 3：数据拆分

运行脚本创建目录结构：
```powershell
powershell -File {SCRIPT_DIR}/migrate-tracking.ps1 -Mode auto -Json
```

然后按卷边界拆分每个 tracking 文件：

**character-state.json 拆分规则：**
- `protagonist` 复制到每个卷（状态更新为该卷末尾的状态）
- `supportingCharacters` 按 `lastSeen.chapter` 分配到对应卷
- `appearanceTracking` 按 `chapter` 分配到对应卷
- `characterGroups` 每卷独立维护

**timeline.json 拆分规则：**
- `events` 按 `chapter` 分配到对应卷
- `storyTime` 每卷记录该卷的时间范围
- `parallelEvents` 按时间点分配
- `anomalies` 分配到发现该异常的卷

**relationships.json 拆分规则：**
- `characters` 复制到每个卷（只保留该卷活跃的角色）
- `history` 按 `chapter` 分配到对应卷
- `factions` 复制到每个卷（状态更新为该卷末尾）

**plot-tracker.json 拆分规则：**
- `foreshadowing` 按 `planted.chapter` 分配到对应卷
- 跨卷未解决的伏笔在后续卷中保留引用
- `plotlines` 每卷记录该卷的进展
- `checkpoints` 按卷分配

将拆分后的数据写入 `spec/tracking/volumes/vol-XX/` 对应文件。

#### 阶段 4：生成全局摘要

基于拆分后的数据，生成 4 个摘要文件到 `spec/tracking/summary/`：

**characters-summary.json：**
- 遍历所有卷的 character-state.json
- active：最后一卷中仍活跃的角色
- archived：已退场/死亡的角色
- 统计 totalCount 和 activeCount

**plot-summary.json：**
- 汇总所有卷的伏笔状态
- unresolvedForeshadowing：所有 status=active 的伏笔
- resolvedCount / totalPlanted 统计

**timeline-summary.json：**
- 提取每卷的关键里程碑事件
- 记录故事时间范围

**volume-summaries.json：**
- 每卷生成一条摘要记录
- 包含：id, title, chapters, wordCount, keyEvents, unresolvedPlots, newCharacters, exitedCharacters

#### 阶段 5：初始化 SQLite（如果 MCP 可用）

如果检测到 novelws-mcp 已安装：
- 调用 MCP 工具 `sync_from_json` 将分片数据导入 SQLite
- 调用 `sync_status` 验证同步结果

如果 MCP 不可用，跳过此步骤。

#### 阶段 6：验证与清理

1. 验证每个卷的文件都存在且 JSON 格式正确
2. 验证摘要文件的统计数据与分卷数据一致
3. 确认无误后，删除原始单文件（备份已保存）
4. 输出迁移报告：
   - 迁移前：单文件模式，总大小 XXX KB
   - 迁移后：N 卷分片，每卷平均 XX KB
   - 备份位置：spec/tracking/backup/YYYYMMDD-HHMMSS/

### 错误处理

- 任何步骤失败时，提示用户从备份恢复：
  ```
  迁移失败。备份文件在 spec/tracking/backup/YYYYMMDD-HHMMSS/
  可以手动将备份文件复制回 spec/tracking/ 恢复原状。
  ```
- 不自动删除备份，由用户手动清理

---

## 🔗 命令链式提示

**追踪报告生成后，自动附加下一步建议**：

```
💡 下一步建议：
1️⃣ `/write [下一章节号]` — 数据正常，继续写作
2️⃣ `/guide` — 查看智能引导，获取全局建议
3️⃣ `/analyze --focus=logic` — 如发现一致性问题，执行逻辑专项分析
```
