---
name: track
description: 综合追踪小说创作进度和内容
argument-hint: [--brief | --plot | --stats | --check | --fix]
allowed-tools: Read(//spec/tracking/**), Read(spec/tracking/**), Read(//stories/**), Read(stories/**), Bash(find:*), Bash(wc:*), Bash(grep:*), Bash(*)
model: claude-sonnet-4-5-20250929
scripts:
  sh: .specify/scripts/bash/track-progress.sh
  ps: .specify/scripts/powershell/track-progress.ps1
---

# 综合进度追踪

全面展示小说创作的各项进度和状态。

## 追踪维度

1. **写作进度** - 字数、章节、完成率
2. **情节发展** - 主线进度、支线状态
3. **时间线** - 故事时间推进
4. **角色状态** - 角色发展和位置
5. **伏笔管理** - 埋设和回收状态

## 使用方法

执行脚本 {SCRIPT} [选项]：
- 无参数 - 显示完整追踪报告
- `--brief` - 显示简要信息
- `--plot` - 仅显示情节追踪
- `--stats` - 仅显示统计数据
- `--check` - **[增强]** 执行深度一致性检查（包含角色验证）
- `--fix` - **[新增]** 自动修复发现的简单问题

## 数据来源

整合多个追踪文件的信息：
- `progress.json` - 写作进度
- `spec/tracking/plot-tracker.json` - 情节追踪
- `spec/tracking/timeline.json` - 时间线
- `spec/tracking/relationships.json` - 关系网络
- `spec/tracking/character-state.json` - 角色状态
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
1. 读取 `stories/*/spec/tracking/tracking-log.md`
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
- 位置：stories/*/spec/tracking/tracking-log.md
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

### 数据一致性验证

基础检查（默认执行）：
- plot-tracker.json 与 outline.md 的一致性
- timeline.json 的时间逻辑
- relationships.json 的关系冲突
- character-state.json 的位置合理性

### 深度验证模式 (--check)

当使用 `--check` 参数时，执行程序化的深度验证：

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
