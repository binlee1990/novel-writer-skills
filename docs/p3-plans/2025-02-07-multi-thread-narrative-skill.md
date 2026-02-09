# Multi-Thread Narrative Tracking Skill 实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标：** 创建多线程叙事追踪 Skill，帮助作者管理和平衡多条平行故事线

**架构：** Agent Skill 格式，提供实时线程状态分析、进度平衡建议、交织点设计

**技术栈：** TypeScript, 线程状态机模型，叙事密度分析

**预估工时：** 20-28 小时

---

## 背景

### 问题
复杂小说（如权游式多POV、群像剧）常有多条故事线：
- **进度失衡：** A线推进快，B线长时间未更新，读者失去兴趣
- **交织混乱：** 线程切换不当，破坏节奏或造成困惑
- **遗忘线索：** 多线写作时，容易遗忘某条线的未完伏笔
- **缺乏工具：** 现有工具仅做记录，不提供智能分析

### 解决方案
创建 Agent Skill 实时监控多条故事线：
- 自动识别故事线（基于 POV、地点、时间线）
- 追踪每条线的进度、张力、字数占比
- 建议平衡策略和交织时机
- 警告长期冷线和伏笔遗忘

### 核心价值
- **自动线程识别：** 无需手动标记，AI 识别 POV 和故事线
- **进度可视化：** 清晰展示各线程状态和占比
- **智能建议：** 何时切换、如何交织、哪条线需要推进
- **伏笔追踪：** 关联各线的伏笔和回应

---

## Task 1: 创建 Skill 基础结构

**Files:**
- Create: `skills/multi-thread-narrative/config.yaml`
- Create: `skills/multi-thread-narrative/system-prompt.md`
- Create: `skills/multi-thread-narrative/examples/example-analysis.md`

### Step 1: 编写 config.yaml

```yaml
name: multi-thread-narrative
version: 1.0.0
description: 追踪和平衡多线程叙事的故事线进度
type: agent-skill

activation:
  keywords:
    - 多线程
    - 多POV
    - 故事线
    - 线程
    - 平行叙事
    - 章节平衡
    - POV切换
    - 群像
  file_patterns:
    - "**/.specify/narrative-threads.json"  # 线程配置文件
  auto_activate: true
  confidence_threshold: 0.75

capabilities:
  - thread_identification    # 自动识别故事线
  - progress_tracking        # 进度追踪
  - balance_analysis         # 平衡分析
  - interweaving_suggestion  # 交织建议
  - foreshadowing_tracking   # 伏笔追踪

integration:
  depends_on:
    - character-tracking  # 角色追踪（如果可用）
  works_with:
    - /plan              # 计划命令
    - /analyze           # 分析命令
```

### Step 2: 编写 system-prompt.md 核心提示

```markdown
# Multi-Thread Narrative Tracking Skill

## Role
你是多线程叙事专家，帮助作者管理复杂小说中的多条平行故事线。

## Core Capabilities

### 1. 线程识别
自动识别故事中的不同线程，基于：
- **POV 角色：** 不同视点人物
- **地理位置：** 不同地点的事件
- **时间线：** 不同时间段的平行事件
- **主题线：** 不同的主题或副情节

### 2. 进度追踪
为每条线程追踪：
- **章节数：** 该线出现的章节数量
- **字数占比：** 该线字数占总字数的比例
- **最后更新：** 该线最后一次推进是第几章
- **进度状态：** 开局/发展/高潮/收尾

### 3. 平衡分析
评估多线程的平衡性：
- **热线/冷线识别：** 哪些线太频繁/太少
- **失衡警告：** 某线超过 5 章未更新
- **占比合理性：** 根据线程重要性评估占比
- **节奏匹配：** 各线的叙事速度是否协调

### 4. 交织建议
提供线程切换的智能建议：
- **切换时机：** 何时是切换到另一线的最佳时机（悬念点、场景结束）
- **交织模式：** A-B-A vs A-B-C-A vs 混合
- **悬念设计：** 如何在切换点制造悬念
- **过渡自然性：** 切换是否流畅

### 5. 伏笔追踪
关联各线的伏笔和呼应：
- **线内伏笔：** 线程内的铺垫和回应
- **线间联系：** 不同线程间的交叉伏笔
- **未回应警告：** 长期未回应的伏笔
- **汇聚点设计：** 多线汇聚的关键节点

## Thread Data Model

```json
{
  "threads": [
    {
      "id": "thread-1",
      "name": "艾莉亚的逃亡",
      "type": "pov",  // pov | location | timeline | theme
      "主角": "艾莉亚",
      "起点": "第1章",
      "状态": "发展中",
      "章节": [1, 3, 6, 9, 12],
      "字数": 15000,
      "占比": "18%",
      "最后更新": "第12章",
      "冷线天数": 0,
      "伏笔": [
        {"内容": "父亲的遗言", "埋设": "第1章", "回应": null}
      ]
    }
  ],
  "balance_status": {
    "热线": ["thread-1", "thread-3"],
    "冷线": ["thread-5"],
    "失衡警告": ["thread-5 已 8 章未更新"]
  },
  "next_suggestion": {
    "推荐切换到": "thread-5",
    "原因": "该线已冷 8 章，且前一章留下悬念",
    "交织点设计": "在 thread-1 当前悬念点切换"
  }
}
```

## Analysis Output Format

When analyzing narrative threads, provide:

### 1. 线程总览
```
📊 故事线总览

已识别 5 条故事线：
1. [艾莉亚线] - POV | 5章 | 18% | ⚠️ 2章未更新
2. [琼恩线] - POV | 6章 | 22% | ✅ 活跃
3. [提利昂线] - POV | 4章 | 15% | 🔥 热线
4. [丹妮莉丝线] - POV | 3章 | 12% | ⚠️ 5章未更新
5. [布兰线] - POV | 2章 | 8% | ❄️ 冷线（8章未更新）
```

### 2. 平衡性分析
```
⚖️ 平衡性分析

【警告】布兰线已 8 章未更新，建议尽快推进
【提示】提利昂线过热（连续 3 章），考虑降温
【良好】艾莉亚/琼恩线交替平衡
```

### 3. 下一步建议
```
💡 下一章建议

推荐：切换到【布兰线】
- 原因：长期冷线需要推进
- 切换点：琼恩线当前章末（发现异鬼遗迹）是天然悬念点
- 衔接提示：布兰在北方，可呼应琼恩的异鬼发现
- 预计篇幅：3000-4000字（追赶进度）
```

### 4. 伏笔检查
```
🔍 伏笔追踪

【未回应】
- 艾莉亚线："父亲的遗言"（第1章埋设，12章未回应）
- 丹妮莉丝线："龙蛋的异动"（第5章埋设，7章未回应）

【建议】
在下一次丹妮莉丝章节中，回应龙蛋伏笔
```

## Interaction Patterns

### When Activated
1. 自动扫描已写章节，识别线程
2. 提供当前线程总览
3. 给出平衡性评估
4. 建议下一章写哪条线

### When User Asks "下一章写什么？"
1. 分析各线程状态
2. 考虑节奏和悬念
3. 推荐最合适的线程
4. 提供切换点设计

### When User Asks "线程进度如何？"
1. 展示线程总览表
2. 标注热线/冷线
3. 警告失衡问题
4. 给出平衡建议

## Best Practices

1. **线程识别精准度：** 准确区分不同线程，避免误判
2. **平衡建议合理性：** 考虑叙事需要，不机械平均
3. **切换点自然性：** 建议的切换点应符合叙事逻辑
4. **伏笔关联准确：** 正确识别线内和线间伏笔

## Limitations

- 需要至少 3 章内容才能有效识别线程
- 无法理解复杂的嵌套叙事（如《云图》式结构）
- 伏笔识别依赖明确的铺垫语言
```

### Step 3: Commit

```bash
git add skills/multi-thread-narrative/
git commit -m "feat(p3): add multi-thread-narrative skill structure"
```

---

## Task 2: 实现线程识别引擎

**Files:**
- Create: `skills/multi-thread-narrative/thread-identifier.md`

### Step 1: 编写线程识别规则文档

```markdown
# Thread Identification Rules

## POV-Based Threads
识别依据：
- 章节标题中的人物名（"第3章 - 艾莉亚"）
- 第一句的POV提示（"艾莉亚醒来时..."）
- 持续的视点聚焦（整章跟随同一角色）

## Location-Based Threads
识别依据：
- 明确的地理位置（"君临城" vs "临冬城"）
- 场景描述的地点标记
- 角色所处环境的差异

## Timeline-Based Threads
识别依据：
- 时间标记（"三个月前"）
- 插叙/倒叙标识
- 平行时间线的事件

## Theme-Based Threads
识别依据：
- 副情节标记（"暗线：复仇"）
- 主题关键词聚类
- 情节线的独立性

## Auto-Detection Algorithm

```
For each chapter:
  1. Extract POV indicators (title, first sentence, focus character)
  2. Extract location markers
  3. Extract time markers
  4. Cluster similar chapters into threads
  5. Name threads based on dominant feature
```

## Edge Cases

- **混合POV章节：** 同一章切换视点 → 拆分为子线程
- **群戏章节：** 多角色均等 → 标记为"ensemble"线程
- **过渡章节：** 连接两线 → 归入占比更大的线
```

### Step 2: 添加示例分析

**File:** `skills/multi-thread-narrative/examples/example-analysis.md`

```markdown
# Example: 权游式多POV小说分析

## Input: 已写 15 章

第1章 - 艾莉亚：逃离君临
第2章 - 琼恩：长城新兵
第3章 - 提利昂：被囚禁
第4章 - 艾莉亚：荒野求生
第5章 - 丹妮莉丝：龙蛋异动
...

## Output: Thread Analysis

```json
{
  "threads": [
    {
      "id": "arya-escape",
      "name": "艾莉亚的逃亡",
      "type": "pov",
      "chapters": [1, 4, 7, 10, 13],
      "word_count": 18500,
      "percentage": "22%",
      "last_update": "第13章",
      "cold_chapters": 2,
      "status": "active",
      "arc_stage": "middle",
      "tension_level": "high"
    },
    {
      "id": "jon-wall",
      "name": "琼恩的长城守夜",
      "type": "pov",
      "chapters": [2, 5, 8, 11, 14],
      "word_count": 19000,
      "percentage": "23%",
      "last_update": "第14章",
      "cold_chapters": 1,
      "status": "active",
      "arc_stage": "middle",
      "tension_level": "medium"
    },
    {
      "id": "bran-north",
      "name": "布兰的北境遭遇",
      "type": "pov",
      "chapters": [6, 15],
      "word_count": 7000,
      "percentage": "8%",
      "last_update": "第15章",
      "cold_chapters": 0,
      "status": "cold_line",
      "arc_stage": "early",
      "tension_level": "low"
    }
  ],
  "balance": {
    "hot_threads": ["arya-escape", "jon-wall"],
    "cold_threads": ["bran-north"],
    "warnings": [
      "布兰线仅 2 章，占比过低（8%）",
      "提利昂线已 6 章未更新"
    ]
  },
  "next_chapter_suggestion": {
    "recommended_thread": "bran-north",
    "reason": "冷线需要推进，且琼恩线刚完成悬念点（发现异鬼），适合切换",
    "interweaving_tip": "布兰在北方，可与琼恩的异鬼发现形成呼应",
    "target_length": "3500-4500 字"
  }
}
```
```

### Step 3: Commit

```bash
git add skills/multi-thread-narrative/thread-identifier.md
git add skills/multi-thread-narrative/examples/
git commit -m "feat(p3): implement thread identification rules"
```

---

## Task 3: 实现平衡分析和建议系统

**Files:**
- Create: `skills/multi-thread-narrative/balance-analyzer.md`
- Create: `skills/multi-thread-narrative/interweaving-strategies.md`

### Step 1: 编写平衡分析规则

```markdown
# Balance Analysis Rules

## Hot/Cold Thread Detection

### Hot Thread (过热)
- 连续 3+ 章出现
- 短期内占比 > 40%
- 建议：降温，切换到其他线

### Cold Thread (冷线)
- 5+ 章未更新
- 总占比 < 10%（对于主线）
- 建议：尽快推进

### Active Thread (活跃)
- 2-4 章交替频率
- 占比 15-25%（主线）
- 状态：健康

## Balance Metrics

### 1. 章节分布均衡度
```
Gini系数 = 计算各线章节数的基尼系数
- < 0.3: 高度均衡（可能过于机械）
- 0.3-0.5: 良好均衡
- > 0.5: 失衡（主次分明）
```

### 2. 字数占比合理性
```
主线: 20-30%
重要副线: 15-20%
次要副线: 8-12%
```

### 3. 更新频率
```
理想间隔: 2-4章
警告阈值: 5章
危险阈值: 8章
```

## Suggestion Algorithm

```
IF cold_thread exists AND last_chapter has suspension:
    SUGGEST: switch to cold_thread
ELSE IF hot_thread exists:
    SUGGEST: cool down, switch to balanced thread
ELSE:
    SUGGEST: continue natural rotation
```
```

### Step 2: 编写交织策略文档

```markdown
# Interweaving Strategies

## Strategy 1: Suspension Point Switching
在悬念点切换到另一线，制造期待感

**示例：**
- 艾莉亚章末：脚步声逼近...（切换）
- 下一章：琼恩线
- 几章后：艾莉亚线继续（揭晓脚步声是谁）

## Strategy 2: Parallel Escalation
多线同步升级张力，汇聚到高潮

**示例：**
- A线：敌军逼近
- B线：阴谋暴露
- C线：龙蛋孵化
- 汇聚点：三线在大战中交汇

## Strategy 3: Call and Response
一线埋设，另一线呼应

**示例：**
- 琼恩线：发现异鬼遗迹
- 切换到布兰线：做噩梦见到异鬼
- 两线通过主题关联

## Strategy 4: Time-Synced Cuts
不同线程在同一时间点切换

**示例：**
- A线：日落时分的战斗
- B线：同一天日落时的密谋
- 制造"同时发生"的紧迫感

## Anti-Patterns

❌ **Random Switching:** 无理由的线程跳跃
❌ **Unresolved Threads:** 开启线程后长期不推进
❌ **Mechanical Rotation:** A-B-A-B 过于机械
```

### Step 3: Commit

```bash
git add skills/multi-thread-narrative/balance-analyzer.md
git add skills/multi-thread-narrative/interweaving-strategies.md
git commit -m "feat(p3): implement balance analysis and interweaving strategies"
```

---

## Task 4: 创建伏笔追踪系统

**Files:**
- Create: `skills/multi-thread-narrative/foreshadowing-tracker.md`

### Step 1: 编写伏笔追踪规则

```markdown
# Foreshadowing Tracking System

## Foreshadowing Types

### 1. 线内伏笔 (Intra-Thread)
同一线程内的铺垫和回应

**示例：**
- 艾莉亚线第1章："父亲临死前说了什么"
- 艾莉亚线第15章：回忆起父亲的话

### 2. 线间伏笔 (Inter-Thread)
不同线程间的交叉伏笔

**示例：**
- 琼恩线第3章：发现神秘符号
- 布兰线第8章：梦中见到同样的符号
- 第20章：两线汇聚，符号意义揭晓

### 3. 全局伏笔 (Global)
贯穿所有线程的核心谜题

**示例：**
- 预言："当长夜降临..."
- 多个线程从不同角度推进预言

## Tracking Model

```json
{
  "foreshadowing": [
    {
      "id": "fh-001",
      "type": "inter-thread",
      "content": "父亲的遗言",
      "planted": {
        "thread": "arya-escape",
        "chapter": 1,
        "line": "父亲在临死前握住我的手，说..."
      },
      "payoff": {
        "thread": "arya-escape",
        "chapter": null,  // 未回应
        "status": "pending"
      },
      "urgency": "high",  // 12章未回应
      "reminder": "建议在第16-18章回应"
    }
  ]
}
```

## Detection Rules

### Planting Indicators
关键词：
- "会记住的"
- "总有一天"
- "隐隐觉得"
- "这个细节..."
- "莫名的预感"

### Payoff Indicators
关键词：
- "终于明白了"
- "原来..."
- "那时候..."
- "应验了"

## Urgency Calculation

```
章节间隔 <= 5: Low urgency
章节间隔 6-10: Medium urgency
章节间隔 > 10: High urgency (需要尽快回应)
```
```

### Step 2: Commit

```bash
git add skills/multi-thread-narrative/foreshadowing-tracker.md
git commit -m "feat(p3): implement foreshadowing tracking system"
```

---

## Task 5: 创建交互界面和命令集成

**Files:**
- Modify: `src/commands/analyze.ts` (添加线程分析)
- Create: `.specify/narrative-threads.json` (线程配置示例)

### Step 1: 创建线程配置示例

```json
{
  "$schema": "../schemas/narrative-threads.schema.json",
  "enabled": true,
  "tracking_mode": "auto",  // auto | manual
  "threads": [
    {
      "name": "艾莉亚的逃亡",
      "type": "pov",
      "importance": "major",
      "target_percentage": "20-25%"
    },
    {
      "name": "琼恩的长城",
      "type": "pov",
      "importance": "major",
      "target_percentage": "20-25%"
    }
  ],
  "balance_rules": {
    "max_cold_chapters": 5,
    "min_percentage_major": 15,
    "min_percentage_minor": 8
  }
}
```

### Step 2: 创建 JSON Schema

**File:** `.specify/schemas/narrative-threads.schema.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Narrative Threads Configuration",
  "type": "object",
  "properties": {
    "enabled": {"type": "boolean"},
    "tracking_mode": {"enum": ["auto", "manual"]},
    "threads": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {"type": "string"},
          "type": {"enum": ["pov", "location", "timeline", "theme"]},
          "importance": {"enum": ["major", "minor"]},
          "target_percentage": {"type": "string"}
        }
      }
    }
  }
}
```

### Step 3: Commit

```bash
git add .specify/narrative-threads.json
git add .specify/schemas/narrative-threads.schema.json
git commit -m "feat(p3): add narrative threads configuration"
```

---

## Task 6: 编写文档和测试用例

**Files:**
- Create: `docs/skills/multi-thread-narrative.md`
- Create: `skills/multi-thread-narrative/test-cases.md`

### Step 1: 编写用户文档

```markdown
# Multi-Thread Narrative Tracking Skill

## 什么是多线程叙事？

复杂小说（如《权力的游戏》）常有多条平行故事线：
- **多POV：** 不同角色的视点章节
- **多地点：** 同时发生在不同地方的事件
- **多时间线：** 现在、回忆、预言等

## 这个 Skill 能做什么？

✅ **自动识别线程：** 无需手动标记，AI 自动分析
✅ **追踪进度：** 每条线的章节数、字数、最后更新
✅ **平衡建议：** 哪条线太热/太冷，如何调整
✅ **交织策略：** 何时切换线程，如何制造悬念
✅ **伏笔追踪：** 哪些伏笔未回应，何时该收线

## 使用方法

### 自动激活
当你的小说有多条故事线时，Skill 会自动激活：
- 检测到多个 POV 角色
- 检测到并行地点或时间线
- 检测到 `.specify/narrative-threads.json` 配置文件

### 手动查询
```
/analyze
→ 选择"线程分析"
→ 查看线程总览、平衡性、下一步建议
```

### 配置文件（可选）
创建 `.specify/narrative-threads.json`：
```json
{
  "threads": [
    {"name": "艾莉亚线", "type": "pov", "importance": "major"}
  ],
  "balance_rules": {
    "max_cold_chapters": 5
  }
}
```

## 输出示例

```
📊 线程总览
1. [艾莉亚线] POV | 5章 (18%) | ⚠️ 2章未更新
2. [琼恩线] POV | 6章 (22%) | ✅ 活跃
3. [布兰线] POV | 2章 (8%) | ❄️ 冷线（8章未更新）

⚖️ 平衡性分析
【警告】布兰线已 8 章未更新，建议尽快推进
【良好】艾莉亚/琼恩线交替平衡

💡 下一章建议
推荐：切换到【布兰线】
- 理由：冷线需要推进，且琼恩线刚完成悬念点
- 衔接：布兰在北方，可呼应琼恩的异鬼发现
- 篇幅：3000-4000字

🔍 伏笔追踪
【未回应】艾莉亚线："父亲的遗言"（12章未回应）
```

## 最佳实践

1. **至少 3 章后启用：** 需要一定内容才能识别线程
2. **遵循建议但不机械：** 叙事需要优先于机械平衡
3. **标记重要伏笔：** 在关键铺垫处添加注释便于追踪
4. **定期检查：** 每写完 5-10 章后，运行一次线程分析

## 局限性

- 需要明确的 POV 或地点标识
- 无法理解极复杂的嵌套叙事
- 伏笔识别依赖明确的语言标记
```

### Step 2: 编写测试用例

```markdown
# Test Cases for Multi-Thread Narrative Skill

## Test Case 1: POV Thread Identification

**Input:**
- 第1章 - 艾莉亚：逃离君临
- 第2章 - 琼恩：长城新兵
- 第3章 - 艾莉亚：荒野求生

**Expected Output:**
```
Identified 2 threads:
- arya-escape (chapters 1, 3)
- jon-wall (chapter 2)
```

## Test Case 2: Cold Thread Warning

**Input:**
- Arya thread: chapters 1, 3, 5
- Jon thread: chapters 2, 4, 6, 8, 10, 12, 14
- Bran thread: chapter 7

**Expected Output:**
```
⚠️ Warning: Bran thread is cold (7 chapters since last update)
Suggest: Switch to Bran thread in next chapter
```

## Test Case 3: Foreshadowing Tracking

**Input:**
- Chapter 1: "父亲说：'总有一天你会明白'"
- ...no payoff in next 10 chapters

**Expected Output:**
```
🔍 Pending Foreshadowing:
- "父亲的话" planted in Ch1, 10 chapters unresolve
- Urgency: HIGH
```

## Test Case 4: Interweaving Suggestion

**Input:**
- Jon thread ends with: "他听到了奇怪的声音..."
- Current chapter: 12
- Bran thread: last update chapter 7

**Expected Output:**
```
💡 Next Chapter Suggestion:
- Switch to: Bran thread
- Reason: Jon's suspension point + Bran is cold
- Tip: Bran can echo Jon's mysterious sound
```
```

### Step 3: Commit

```bash
git add docs/skills/multi-thread-narrative.md
git add skills/multi-thread-narrative/test-cases.md
git commit -m "docs(p3): add multi-thread-narrative documentation and tests"
```

---

## 验证标准

### 功能完整性
- [ ] 能自动识别至少 3 种类型的线程（POV/地点/时间线）
- [ ] 能追踪每条线程的章节、字数、占比、最后更新
- [ ] 能检测热线/冷线并给出警告
- [ ] 能建议下一章写哪条线，并给出理由
- [ ] 能识别和追踪至少 2 层伏笔（线内/线间）

### 准确性
- [ ] 线程识别准确率 > 90%（在明确POV小说中）
- [ ] 冷线警告准确率 > 95%（5章阈值）
- [ ] 伏笔识别准确率 > 80%

### 用户体验
- [ ] 输出格式清晰，包含表格和emoji标识
- [ ] 建议具体可操作（不只是"平衡一下"）
- [ ] 自动激活不干扰单线程小说

### 性能
- [ ] 分析 50 章小说 < 5 秒
- [ ] 配置文件读取 < 100ms

---

## 预估工时

- **Task 1:** Skill 基础结构 - 3h
- **Task 2:** 线程识别引擎 - 6h
- **Task 3:** 平衡分析和建议 - 5h
- **Task 4:** 伏笔追踪 - 4h
- **Task 5:** 命令集成 - 3h
- **Task 6:** 文档和测试 - 3h

**总计：24 小时**

---

Closes: P3 优先级任务 #1
