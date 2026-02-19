---
description: 逐章生成剧情概要（200-500字），同步更新 tracking
argument-hint: [章节号] [--batch N]
recommended-model: claude-opus-4-6
allowed-tools: Read(//stories/**), Write(//stories/**/content/**), Read(//tracking/**), Write(//tracking/**), Bash(ls:*)
---

用户输入：$ARGUMENTS

## 目标

为指定章节生成 200-500 字的纯剧情概要，同步生成 tracking 骨架数据。

## 参数解析

- 章节号：从 $ARGUMENTS 提取，如 `1`、`42`
- `--batch N`：批量生成 N 章概要（最大 20），从指定章节号开始

## 资源加载（极简）

1. **specification.md 摘要**：读取 `stories/<story>/specification.md`，提取100字核心摘要（类型+主角+核心冲突）
2. **当前卷大纲**：读取 `stories/<story>/creative-plan.md`，只提取当前章节所属卷的段落
3. **前序概要标题列表**：扫描 `stories/<story>/content/chapter-*-synopsis.md`，只读取每个文件的第一行标题
4. **前一章概要全文**：读取前一章的 synopsis.md（200-500字）

**不加载**：resources 目录任何文件、tracking 文件（写入时直接追加）

## 执行步骤

### 1. 确定故事目录和章节号

从 $ARGUMENTS 和 `stories/` 目录确定当前故事和目标章节。

### 2. 加载上下文

按上述「资源加载」规则加载最小上下文。

### 3. 生成概要

为当前章节生成 200-500 字纯剧情概要，包含：

- **本章标题**：简短的章节标题
- **核心事件**：本章发生的主要事件（1-3个）
- **出场角色**：本章出场的角色列表
- **情感走向**：本章的情感基调和变化
- **章末钩子**：本章结尾的悬念或引子

写入 `stories/<story>/content/chapter-XXX-synopsis.md`（XXX 为三位数补零）。

### 4. 更新 tracking 骨架

根据概要内容，更新 4 个 tracking 文件：

**tracking/character-state.json**：
- 新出场角色：添加条目（role, status, location, state, lastAppearance）
- 已有角色：更新 status、location、state、lastAppearance

**tracking/relationships.json**：
- 新关系：添加条目（from, to, type, note, lastUpdate）
- 关系变化：更新 note 和 lastUpdate

**tracking/plot-tracker.json**：
- 更新 currentChapter
- 新情节线：添加到 plotlines（name, status, description, keyChapters）
- 伏笔埋设：添加到 foreshadowing（id, content, plantedAt, status=planted）
- 伏笔回收：更新 resolveAt 和 status=resolved

**tracking/timeline.json**：
- 添加本章事件到 events（chapter, time, event）

### 5. 批量模式

如果指定了 `--batch N`，重复步骤 2-4 共 N 次，每次递增章节号。每章完成后输出进度。

### 6. 后续建议

单章完成：「第X章概要已生成。继续 /write [X+1] 或 /write --batch 20 批量生成。概要全部完成后使用 /expand 开始扩写。」

批量完成：「第X-Y章概要已生成（共Z章）。继续 /write [Y+1] --batch 20 或开始 /expand [章节号] 扩写。」
