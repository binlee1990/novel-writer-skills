---
name: character
description: "统一角色管理 — 创建、查看、更新角色档案，管理角色关系，设定对话指纹"
argument-hint: [子命令] [角色名或参数] [--volume vol-XX]
recommended-model: claude-sonnet-4-5-20250929 # 角色设定中等复杂度；复杂角色可用 opus
allowed-tools: Read, Write, Glob, Grep, Edit
---

# /character — 角色管理中心

## 概述

统一管理故事中所有角色的档案、状态、关系和对话风格。所有角色数据存储在 `tracking/` 目录下。

## 前置条件

1. 确认当前故事目录存在：`stories/*/`
2. 确认 `tracking/` 目录存在，不存在则创建
3. 按三层 Fallback 加载角色数据：

**Layer 1: MCP 查询（优先）**
- `query_characters` → 角色列表（支持 `--volume vol-XX` 过滤）
- `query_relationships` → 关系网络
- `search_content --query=[角色名]` → 角色出场章节

**Layer 2: 分片 JSON（次优，检测 tracking/volumes/ 是否存在）**
- 无 --volume：读取 `tracking/summary/characters-summary.json`（活跃角色概览）
- 有 --volume：读取 `tracking/volumes/vol-XX/character-state.json` 和 `relationships.json`

**Layer 3: 单文件 JSON（兜底）**
- `tracking/character-state.json`
- `tracking/relationships.json`

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

向用户询问以下信息（未提供的标记为待定，可后续用 update 补充）：
- 角色名称（必填）、角色类型（主角/重要配角/次要配角/龙套）
- 一句话描述、外貌特征（≤3 个）、性格核心（1-3 词）
- 初始状态、核心目标、核心冲突

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

输出角色名、类型、描述、目标、冲突的摘要，并提示后续可用 `voice`、`relate`、`update` 子命令。

---

## 子命令 2：角色列表（`list`）

### 执行流程

**Step 1: 读取所有角色数据**

从三层 Fallback 加载角色数据（见前置条件）。

如果指定了 `--volume vol-XX`，仅显示该卷中出场的角色（按 `lastAppearance` 或 `firstAppearance` 在该卷章节范围内过滤）。

**Step 2: 按类型分组输出**

按角色类型（主角 → 重要配角 → 次要配角 → 龙套）分组，每组以表格显示：角色名、状态、位置、最近出场章节、出场次数。次要配角和龙套可用简略列表。

末尾附加需关注提醒（如超过 5 章未出场、状态异常的角色）。

---

## 子命令 3：角色详情（`show`）

### 执行流程

**Step 1: 查找角色**

在 `character-state.json` 中按名称模糊匹配。

**Step 2: 输出完整档案**

输出以下分区信息：
- 基本信息：角色名、类型、一句话描述
- 外貌：外貌描述和关键特征
- 性格：核心性格词、优点、缺点、习惯/怪癖
- 当前状态：状态、位置、情绪、健康
- 目标与冲突：主要目标、核心冲突、弧线阶段
- 对话风格：说话方式、常用词汇、口头禅
- 关系网络：从 relationships.json 提取，表格显示（对象、关系、状态、备注）
- 出场记录：首次出场、最近出场、总出场次数

---

## 子命令 4：更新角色（`update`）

### 执行流程

**Step 1: 查找角色并显示当前状态**

**Step 2: 询问要更新的内容**

支持更新的类别：状态变化（位置/情绪/健康/处境）、性格补充、目标变化、弧线推进、外貌变化、其他。用户也可直接描述变化内容，由 AI 判断更新字段。

**Step 3: 更新 JSON 并确认**

更新 `character-state.json` 中对应字段，更新 `updatedAt` 时间戳。

---

## 子命令 5：关系管理（`relate`）

### 执行流程

**Step 1: 确认两个角色存在**

**Step 2: 收集关系信息**

向用户询问：关系类型（师徒/朋友/恋人/敌人/亲属/同门/主从/竞争等）、关系状态（稳定/紧张/发展中/破裂/暧昧等）、双方态度（A→B / B→A）、关系起源、预期走向。

**Step 3: 更新 relationships.json**

写入关系条目，包含字段：`id`, `characterA`, `characterB`, `type`, `status`, `attitudeAtoB`, `attitudeBtoA`, `origin`, `trajectory`, `history`（事件数组），`createdAt`, `updatedAt`。

---

## 子命令 6：对话指纹（`voice`）

### 执行流程

**Step 1: 查找角色**

**Step 2: 收集对话风格信息**

向用户询问：说话方式（简洁/啰嗦/文雅/粗犷等）、常用句式、口头禅、禁忌用语、语气词偏好、方言/口音、教育水平体现、情绪表达方式。也可接受示例对话由 AI 分析提取。

**Step 3: 更新 character-state.json 的 voice 字段**

**Step 4: 输出对话风格卡片**

输出角色对话风格摘要（说话方式、句式、口头禅、禁忌、语气词、情绪表达）及一段基于风格设定生成的示例对话。提示 `/write` 会自动加载此风格。

---

## 子命令 7：角色时间线（`timeline`）

### 执行流程

**Step 1: 从 timeline.json 和章节内容中提取角色相关事件**

**MCP 优先**：如果 MCP 可用，调用 `search_content --query=[角色名]` 获取所有出场章节，按章节号排序生成时间线。

**Fallback**：从 timeline.json（或分片 `volumes/vol-XX/timeline.json`）和章节内容中提取。如果指定了 `--volume vol-XX`，仅显示该卷范围内的时间线。

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

### 分片写入协议

当 `/character` 更新角色数据时：

**分片模式（检测到 tracking/volumes/ 存在）**：
1. 确定角色最后出场章节所属的卷
2. 更新该卷的 `character-state.json` 或 `relationships.json`
3. 同步更新全局摘要：`tracking/summary/characters-summary.json`
4. 如果 MCP 可用，调用 `sync_from_json` 同步到 SQLite

**单文件模式**：
- 直接更新 `tracking/character-state.json` 和 `relationships.json`

### 数据校验

每次读取数据时，检查：
- JSON 格式是否有效
- 必填字段是否存在（id, name, type）
- 关系引用的角色 ID 是否存在

### 向后兼容

如果 `character-state.json` 中的角色条目缺少新增字段（如 `voice`），自动补充默认值而非报错。

---

## 🔗 命令链式提示

**命令执行完成后，自动附加下一步建议**：

```
💡 下一步建议：
1️⃣ `/character voice [角色名]` — 设定角色对话风格（如刚创建角色）
2️⃣ `/character relate [角色A] [角色B]` — 建立角色关系
3️⃣ `/write [章节号]` — 角色就绪，开始写作
```
