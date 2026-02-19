---
description: 基于故事规格生成卷级大纲
argument-hint: [故事目录名]
recommended-model: claude-opus-4-6
allowed-tools: Read(//stories/**/specification.md), Read(//stories/**/creative-plan.md), Write(//stories/**/creative-plan.md), Bash(ls:*)
---

用户输入：$ARGUMENTS

## 目标

将 specification.md 转化为卷级大纲，规划全书的宏观架构。

## 资源加载

1. 读取 `stories/<story>/specification.md`（完整读取）
2. 如果已有 `creative-plan.md`，读取并询问是覆盖还是追加

## 执行步骤

### 1. 确定故事目录

从 $ARGUMENTS 提取故事目录名，或列出 `stories/` 下的目录让用户选择。

### 2. 生成卷级大纲

根据 specification.md 中的目标规模，为每一卷生成：

- **卷名**：卷名 + 核心主题（一句话）
- **章节范围**：如第1-80章
- **核心冲突**：本卷的主要矛盾
- **转折点**：2-3个主要转折
- **高潮事件**：本卷最高潮的场景
- **结尾钩子**：引向下一卷的悬念
- **角色变动**：本卷新增/退场的角色
- **伏笔规划**：本卷需要埋设/回收的伏笔

### 3. 输出格式

写入 `stories/<story>/creative-plan.md`：

```
# [故事名称] 创作计划

## 全书概览
- 总章数：
- 总卷数：
- 主线概要：

## 第一卷：[卷名]
- 章节范围：第1-XX章
- 核心主题：
- 核心冲突：
- 转折点：
  1. [转折1]
  2. [转折2]
- 高潮事件：
- 结尾钩子：
- 角色变动：新增[XX]，退场[XX]
- 伏笔规划：
  - 埋设：[伏笔1]、[伏笔2]
  - 回收：[伏笔X]（来自第Y卷）

## 第二卷：[卷名]
...
```

### 4. 后续建议

输出：「卷级大纲生成完成。下一步请使用 /write 1 开始逐章生成剧情概要。可用 /write --batch 20 批量生成。」
