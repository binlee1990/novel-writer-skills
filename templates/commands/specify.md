---
description: 定义故事规格，明确要创造什么样的作品
argument-hint: [故事描述]
allowed-tools: Read(//stories/**/specification.md), Write(//stories/**/specification.md), Read(//resources/constitution.md), Read(//resources/anti-ai.md), Write(//resources/style-reference.md), Bash(ls:*), Bash(mkdir:*)
---

用户输入：$ARGUMENTS

## 目标

交互式引导用户定义故事的核心要素，输出 specification.md。

## 资源加载

读取 `resources/constitution.md`（如存在）作为创作原则参考。

## 执行步骤

### 1. 确定故事目录

- 如果 `stories/` 下已有故事目录，列出并询问是更新还是新建
- 新建时，根据用户输入生成目录名（如 `stories/my-story/`）
- 确保 `stories/<story>/content/` 目录存在

### 2. 交互式引导

逐项引导用户定义以下内容（每次只问一个问题）：

1. **故事类型**：玄幻/都市/言情/悬疑/科幻/历史/其他
2. **一句话概要**：30字以内的核心创意
3. **核心设定**：世界观、力量体系等关键设定（2-3句）
4. **主角**：姓名、身份、核心性格、初始目标（3-5句）
5. **核心配角**：2-5个关键配角，每人1-2句描述
6. **核心冲突**：主线矛盾是什么（2-3句）
7. **目标规模**：预计总章数、分几卷
8. **写作风格偏好**：叙述视角、语言风格、节奏偏好

### 3. 生成 specification.md

将收集的信息整理为结构化的 specification.md，写入 `stories/<story>/specification.md`。

格式：

```
# [故事名称] 规格书

## 基本信息
- 类型：
- 一句话概要：
- 目标规模：X章，分Y卷

## 核心设定
[世界观和关键设定]

## 角色
### 主角
[主角详情]

### 核心配角
[配角列表]

## 核心冲突
[主线矛盾]

## 写作风格
- 叙述视角：
- 语言风格：
- 节奏偏好：
```

### 4. 生成风格参考

如果 `resources/style-reference.md` 仍是模板默认内容（含 `[第一人称/第三人称有限/第三人称全知]`），根据用户的风格偏好自动填充：

- 在「故事类型」字段填入步骤 2 中确定的类型
- 参考模板中的 HTML 注释提示，为每个维度选择符合该类型的默认值（用户未明确指定时）
- 读取 `resources/anti-ai.md` 的「类型特有禁用词」段落，将对应类型的禁用词追加到「风格禁忌」字段

### 5. 后续建议

输出：「规格定义完成。下一步请使用 /plan 生成卷级大纲。」
