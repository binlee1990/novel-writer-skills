---
description: 逐章生成剧情概要（200-500字），同步更新 tracking
argument-hint: [章节号] [--batch N]
recommended-model: claude-opus-4-6
allowed-tools: Read(//stories/**), Write(//stories/**), Bash(ls:*), Bash(mkdir:*)
---

用户输入：$ARGUMENTS

## 目标

为指定章节生成 200-500 字的纯剧情概要，同步生成 tracking 骨架数据。

## 参数解析

- 章节号：从 $ARGUMENTS 提取，如 `1`、`42`
- `--batch N`：批量生成 N 章概要（最大 20），从指定章节号开始

## 卷定位

根据章节号和 `stories/<story>/creative-plan.md` 中每卷的章节范围，确定目标章节所属的卷目录（如 `vol-001`）。

路径规则：
- 概要：`stories/<story>/volumes/vol-XXX/content/chapter-YYY-synopsis.md`
- Tracking：`stories/<story>/volumes/vol-XXX/tracking/`

### 首次写入某卷时的初始化

如果 `volumes/vol-XXX/` 目录不存在，自动创建：

1. 创建 `volumes/vol-XXX/content/` 和 `volumes/vol-XXX/tracking/`
2. 初始化 4 个空 tracking 文件（同 templates/tracking/ 的初始内容）
3. 如果是第一卷（vol-001），生成初始 volume-summary.md（空状态，从 specification.md 提取基本信息）
4. 如果不是第一卷，执行「卷切换」流程（见下方）

### 卷切换流程

当目标章节属于新卷时（上一卷已完成）：

1. 读取上一卷 `volumes/vol-NNN/tracking/` 的 4 个 JSON 文件
2. 读取上一卷最后一章 synopsis 的章末钩子
3. 读取 `creative-plan.md` 中下一卷的大纲段落
4. 生成新卷的 `volume-summary.md`：
   - 故事进度：已完成的章节范围
   - 活跃角色状态：从 character-state.json 提取最近 2 卷出场过的角色
   - 活跃伏笔：从 plot-tracker.json 提取 status=planted/hinted 的条目
   - 关键关系：从 relationships.json 提取活跃角色间的关系
   - 待续悬念：上一卷末章的章末钩子
5. volume-summary.md 控制在 500-1000 字

## 资源加载（卷级）

1. **specification.md 摘要**：读取 `stories/<story>/specification.md`，提取 100 字核心摘要（类型 + 主角 + 核心冲突）
2. **当前卷大纲**：读取 `stories/<story>/creative-plan.md`，只提取当前卷的段落
3. **volume-summary.md**：读取 `stories/<story>/volumes/vol-XXX/volume-summary.md`（跨卷上下文）
4. **本卷前序概要标题列表**：扫描 `stories/<story>/volumes/vol-XXX/content/chapter-*-synopsis.md`，只读取每个文件的第一行标题
5. **前一章概要全文**：读取前一章的 synopsis.md（200-500 字）。如果前一章在上一卷，从上一卷的 content/ 读取

**不加载**：resources 目录任何文件、tracking 文件（写入时直接追加）

## 执行步骤

### 1. 确定故事目录、章节号和所属卷

从 $ARGUMENTS 和 `stories/` 目录确定当前故事，从 creative-plan.md 确定章节所属卷。

### 2. 确保卷目录存在

如果卷目录不存在，执行初始化或卷切换流程。

### 3. 加载上下文

按上述「资源加载」规则加载最小上下文。

### 4. 生成概要

为当前章节生成 200-500 字纯剧情概要，包含：

- **本章标题**：简短的章节标题
- **核心事件**：本章发生的主要事件（1-3个）
- **出场角色**：本章出场的角色列表
- **情感走向**：本章的情感基调和变化
- **章末钩子**：本章结尾的悬念或引子

写入 `stories/<story>/volumes/vol-XXX/content/chapter-YYY-synopsis.md`（YYY 为三位数补零）。

### 5. 更新卷级 tracking

根据概要内容，更新 `stories/<story>/volumes/vol-XXX/tracking/` 下的 4 个文件：

**character-state.json**：
- 新出场角色：添加条目（role, status, location, state, lastAppearance）
- 已有角色：更新 status、location、state、lastAppearance

**relationships.json**：
- 新关系：添加条目（from, to, type, note, lastUpdate）
- 关系变化：更新 note 和 lastUpdate

**plot-tracker.json**：
- 更新 currentChapter
- 新情节线：添加到 plotlines（name, status, description, keyChapters）
- 伏笔埋设：添加到 foreshadowing（id, content, plantedAt, status=planted）
- 伏笔回收：更新 resolveAt 和 status=resolved

**timeline.json**：
- 添加本章事件到 events（chapter, time, event）

### 6. 批量模式

如果指定了 `--batch N`，重复步骤 3-5 共 N 次。如果批量过程中跨卷，自动触发卷切换。

### 7. 后续建议

单章完成：「第X章概要已生成（vol-XXX）。继续 /write [X+1] 或 /write --batch 20 批量生成。」

批量完成：「第X-Y章概要已生成（共Z章）。继续 /write [Y+1] --batch 20 或开始 /expand [章节号] 扩写。」
