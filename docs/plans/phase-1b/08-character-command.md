# Task 8: `/character` 命令（新增）

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 新增 `/character` 命令，提供统一的角色管理入口，支持角色创建、查看、更新、关系管理、对话指纹设定

**Architecture:** 创建 `templates/commands/character.md`，遵循现有命令模板结构（frontmatter + 执行流程）。角色数据统一存储在 `stories/*/spec/tracking/` 目录下的 `character-state.json` 和 `relationships.json`。命令支持子命令模式：`/character create`、`/character list`、`/character update`、`/character relate`、`/character voice`。

**Tech Stack:** Markdown 模板、JSON 数据

---

### Task 8.1: 创建 character.md 命令文件

**Files:**
- Create: `templates/commands/character.md`

**Step 1: 创建文件**

```markdown
---
name: character
description: "统一角色管理 — 创建、查看、更新角色档案，管理角色关系，设定对话指纹"
argument-hint: [子命令] [角色名或参数]
allowed-tools: Read, Write, Glob, Grep, Edit
---

# /character — 角色管理中心

## 概述

统一管理故事中所有角色的档案、状态、关系和对话风格。所有角色数据存储在 `stories/*/spec/tracking/` 目录下。

## 前置条件

1. 确认当前故事目录存在：`stories/*/`
2. 确认 `spec/tracking/` 目录存在，不存在则创建
3. 读取现有角色数据（如有）：
   - `spec/tracking/character-state.json`
   - `spec/tracking/relationships.json`

## 子命令决策

根据 `$ARGUMENTS` 判断子命令：

| 参数模式 | 子命令 | 说明 |
|---------|--------|------|
| `create [角色名]` | 创建角色 | 交互式创建新角色档案 |
| `list` 或无参数 | 角色列表 | 显示所有角色概览 |
| `show [角色名]` | 角色详情 | 显示单个角色完整档案 |
| `update [角色名]` | 更新角色 | 更新角色状态或属性 |
| `relate [角色A] [角色B]` | 关系管理 | 设定或更新两个角色的关系 |
| `voice [角色名]` | 对话指纹 | 设定角色的说话风格和语言习惯 |
| `timeline [角色名]` | 角色时间线 | 显示角色的出场和状态变化历史 |

---

## 子命令 1：创建角色（`create`）

### 执行流程

**Step 1: 收集基本信息**

向用户询问以下信息（未提供的标记为待定）：

```
📝 创建新角色
━━━━━━━━━━━━━━━━━━━━
请提供以下信息（可以先填部分，后续用 /character update 补充）：

1. 角色名称：[必填]
2. 角色类型：主角 / 重要配角 / 次要配角 / 龙套
3. 一句话描述：[角色的核心定位]
4. 外貌特征：[关键外貌，不超过 3 个特征]
5. 性格核心：[1-3 个核心性格词]
6. 初始状态：[出场时的状态/处境]
7. 核心目标：[角色想要什么]
8. 核心冲突：[角色面临的主要矛盾]
```

**Step 2: 生成角色档案**

在 `character-state.json` 中添加新角色条目：

```json
{
  "id": "[自动生成，如 char-001]",
  "name": "[角色名]",
  "type": "[主角/重要配角/次要配角/龙套]",
  "summary": "[一句话描述]",
  "appearance": {
    "features": ["[特征1]", "[特征2]", "[特征3]"],
    "description": "[简短外貌描述]"
  },
  "personality": {
    "core": ["[性格词1]", "[性格词2]"],
    "strengths": [],
    "weaknesses": [],
    "quirks": []
  },
  "status": {
    "current": "[初始状态]",
    "health": "正常",
    "location": "[初始位置]",
    "mood": "[初始情绪]"
  },
  "goals": {
    "primary": "[核心目标]",
    "secondary": [],
    "hidden": ""
  },
  "conflict": "[核心冲突]",
  "arc": {
    "startPoint": "[起点状态]",
    "endPoint": "[预期终点，可为空]",
    "currentPhase": "初始"
  },
  "voice": {
    "speechPattern": "",
    "vocabulary": "",
    "catchphrases": [],
    "dialect": ""
  },
  "firstAppearance": null,
  "lastAppearance": null,
  "appearanceCount": 0,
  "createdAt": "[ISO日期]",
  "updatedAt": "[ISO日期]"
}
```

**Step 3: 输出确认**

```
✅ 角色创建成功
━━━━━━━━━━━━━━━━━━━━
📛 [角色名]（[角色类型]）
📝 [一句话描述]
🎯 目标：[核心目标]
⚡ 冲突：[核心冲突]

💡 后续操作：
- /character voice [角色名] — 设定对话风格
- /character relate [角色名] [其他角色] — 建立关系
- /character update [角色名] — 补充更多信息
```

---

## 子命令 2：角色列表（`list`）

### 执行流程

**Step 1: 读取所有角色数据**

从 `character-state.json` 读取所有角色。

**Step 2: 按类型分组输出**

```
📋 角色总览
━━━━━━━━━━━━━━━━━━━━

👑 主角（[N] 人）
| 角色 | 状态 | 位置 | 最近出场 | 出场次数 |
|------|------|------|---------|---------|
| [名] | [状态] | [位置] | 第 N 章 | M 次 |

⭐ 重要配角（[N] 人）
| 角色 | 状态 | 位置 | 最近出场 | 出场次数 |
|------|------|------|---------|---------|
| [名] | [状态] | [位置] | 第 N 章 | M 次 |

👤 次要配角（[N] 人）
[简略列表]

⚠️ 需关注：
- [角色A]：超过 5 章未出场
- [角色B]：状态为「受伤」，需跟进
```

---

## 子命令 3：角色详情（`show`）

### 执行流程

**Step 1: 查找角色**

在 `character-state.json` 中按名称模糊匹配。

**Step 2: 输出完整档案**

```
📛 [角色名] — [角色类型]
━━━━━━━━━━━━━━━━━━━━

📝 [一句话描述]

👤 外貌
[外貌描述]

🧠 性格
- 核心：[性格词]
- 优点：[优点]
- 缺点：[缺点]
- 习惯：[小习惯/怪癖]

📊 当前状态
- 状态：[当前状态]
- 位置：[当前位置]
- 情绪：[当前情绪]
- 健康：[健康状况]

🎯 目标与冲突
- 主要目标：[目标]
- 核心冲突：[冲突]
- 弧线阶段：[当前阶段]

🗣️ 对话风格
- 说话方式：[描述]
- 常用词汇：[词汇]
- 口头禅：[口头禅]

🔗 关系网络
[从 relationships.json 提取与此角色相关的所有关系]
| 对象 | 关系 | 状态 | 备注 |
|------|------|------|------|
| [角色B] | [关系类型] | [当前状态] | [备注] |

📅 出场记录
- 首次出场：第 [N] 章
- 最近出场：第 [M] 章
- 总出场次数：[K] 次
```

---

## 子命令 4：更新角色（`update`）

### 执行流程

**Step 1: 查找角色并显示当前状态**

**Step 2: 询问要更新的内容**

```
🔄 更新 [角色名]
━━━━━━━━━━━━━━━━━━━━
请告诉我要更新什么：

1. 状态变化（位置、情绪、健康、处境）
2. 性格补充（新发现的性格特征）
3. 目标变化（目标达成、新目标、目标转变）
4. 弧线推进（角色成长阶段变化）
5. 外貌变化（受伤、变装、成长）
6. 其他信息

或者直接描述变化内容，我来判断更新哪些字段。
```

**Step 3: 更新 JSON 并确认**

更新 `character-state.json` 中对应字段，更新 `updatedAt` 时间戳。

---

## 子命令 5：关系管理（`relate`）

### 执行流程

**Step 1: 确认两个角色存在**

**Step 2: 收集关系信息**

```
🔗 建立关系：[角色A] ↔ [角色B]
━━━━━━━━━━━━━━━━━━━━
请提供：

1. 关系类型：[师徒/朋友/恋人/敌人/亲属/同门/主从/竞争/...]
2. 关系状态：[稳定/紧张/发展中/破裂/暧昧/...]
3. A 对 B 的态度：[信任/警惕/依赖/厌恶/...]
4. B 对 A 的态度：[信任/警惕/依赖/厌恶/...]
5. 关系起源：[如何认识的]
6. 关系走向：[预期发展方向，可为空]
```

**Step 3: 更新 relationships.json**

```json
{
  "id": "[自动生成]",
  "characterA": "[角色A的ID]",
  "characterB": "[角色B的ID]",
  "type": "[关系类型]",
  "status": "[关系状态]",
  "attitudeAtoB": "[A对B的态度]",
  "attitudeBtoA": "[B对A的态度]",
  "origin": "[关系起源]",
  "trajectory": "[预期走向]",
  "history": [
    {
      "chapter": null,
      "event": "关系建立",
      "date": "[ISO日期]"
    }
  ],
  "createdAt": "[ISO日期]",
  "updatedAt": "[ISO日期]"
}
```

---

## 子命令 6：对话指纹（`voice`）

### 执行流程

**Step 1: 查找角色**

**Step 2: 收集对话风格信息**

```
🗣️ 设定 [角色名] 的对话风格
━━━━━━━━━━━━━━━━━━━━
请提供以下信息（可部分填写）：

1. 说话方式：[简洁/啰嗦/文雅/粗犷/冷淡/热情/...]
2. 常用句式：[例如：总是用反问句、喜欢用比喻]
3. 口头禅：[例如："有意思"、"哼"]
4. 禁忌用语：[这个角色绝对不会说的话]
5. 语气词偏好：[例如：常用"嗯"、不用"哈哈"]
6. 方言/口音：[如有]
7. 教育水平体现：[用词复杂度]
8. 情绪表达方式：[直接/含蓄/压抑/爆发]

💡 也可以提供一段示例对话，我来分析提取风格特征。
```

**Step 3: 更新 character-state.json 的 voice 字段**

**Step 4: 输出对话风格卡片**

```
🗣️ [角色名] 对话风格卡片
━━━━━━━━━━━━━━━━━━━━
说话方式：[描述]
常用句式：[描述]
口头禅：[列表]
禁忌用语：[列表]
语气词：[偏好]
情绪表达：[方式]

📝 示例对话：
"[基于风格设定生成的示例对话]"

💡 写作时，/write 会自动加载此角色的对话风格作为参考。
```

---

## 子命令 7：角色时间线（`timeline`）

### 执行流程

**Step 1: 从 timeline.json 和章节内容中提取角色相关事件**

**Step 2: 输出角色时间线**

```
📅 [角色名] 时间线
━━━━━━━━━━━━━━━━━━━━

第 1 章 — 首次登场
  状态：[状态]
  事件：[关键事件]

第 3 章 — 状态变化
  状态：[新状态]
  事件：[触发事件]

第 7 章 — 关系变化
  与 [角色B] 的关系从 [旧关系] 变为 [新关系]
  事件：[触发事件]

...

📊 统计：
- 总出场：[N] 章
- 状态变化：[M] 次
- 关系变化：[K] 次
```

---

## 数据完整性保障

### 自动同步

当 `/write` 或 `/track` 更新 tracking 数据时，`character-state.json` 和 `relationships.json` 的格式必须与 `/character` 命令兼容。

### 数据校验

每次读取数据时，检查：
- JSON 格式是否有效
- 必填字段是否存在（id, name, type）
- 关系引用的角色 ID 是否存在

### 向后兼容

如果 `character-state.json` 中的角色条目缺少新增字段（如 `voice`），自动补充默认值而非报错。
```

**Step 2: 验证文件创建**

Run: `ls -la templates/commands/character.md`
Expected: 文件存在

Run: `wc -l templates/commands/character.md`
Expected: 约 300-350 行

**Step 3: Commit**

```bash
git add templates/commands/character.md
git commit -m "feat: add /character command for unified character management (create, list, show, update, relate, voice, timeline)"
```

---

### Task 8.2: 注册 /character 到 keyword-mappings.json

**Files:**
- Modify: `templates/config/keyword-mappings.json`

**Step 1: 无需修改**

`/character` 是一个命令而非知识库资源，不需要在 `keyword-mappings.json` 中注册。命令通过 `templates/commands/` 目录自动发现。

---

### Task 8.3: 验证与现有 tracking 系统的兼容性

**Step 1: 检查现有 character-state.json 的结构**

Run: `grep -rn "character-state.json" templates/commands/ templates/skills/`
Expected: 确认 `/write`、`/track`、`/recap` 等命令引用了此文件

**Step 2: 确认 JSON schema 兼容**

检查 `/character` 命令定义的 JSON 结构是否与现有 tracking 系统的读写兼容。关键是：
- 新增字段（`voice`、`arc`、`goals`）不影响现有读取
- 现有字段（`name`、`status`、`firstAppearance`、`lastAppearance`）保持不变

Expected: 完全兼容，新增字段为可选

**Step 3: 最终 Commit**

```bash
git log --oneline -2
```
Expected: 看到 1 个相关 commit
