# 资源加载和关键词触发使用指南

**最后更新**: 2026-02-08
**版本**: 1.0.0

本指南介绍如何使用 novel-writer-skills 的资源加载和关键词触发功能。

---

## 目录

1. [快速开始](#1-快速开始)
2. [资源加载机制](#2-资源加载机制)
3. [关键词触发](#3-关键词触发)
4. [配置示例](#4-配置示例)
5. [常见问题](#5-常见问题)

---

## 1. 快速开始

### 1.1 无需配置（默认模式）

如果你的 `specification.md` 中没有 `resource-loading` 配置，系统会使用智能默认值：

```yaml
---
title: "我的小说"
genre: romance
writing-style: natural-voice
---
```

**自动加载的资源**:
- ✅ 类型知识库（genres/romance.md）
- ✅ 风格指南（styles/natural-voice.md）
- ✅ 所有核心写作技巧（craft/*）

### 1.2 最小配置（禁用自动加载）

如果你只想手动控制资源加载：

```yaml
---
title: "我的小说"
resource-loading:
  auto-load: false  # 禁用智能推断
  keyword-triggers:
    enabled: false   # 禁用关键词触发
---
```

---

## 2. 资源加载机制

### 2.1 三层加载架构

资源加载分为三层，按优先级从低到高：

```
Layer 3: 关键词触发（运行时动态）
    ↓ 覆盖
Layer 2: 配置文件（specification.md 声明）
    ↓ 覆盖
Layer 1: 智能推断（自动默认）
```

**优先级规则**:
- Layer 2 的配置会覆盖 Layer 1 的默认推断
- Layer 3 的关键词触发在运行时补充 Layer 1/2
- 如果资源已在 Layer 1/2 加载，Layer 3 不会重复提示

### 2.2 Layer 1: 智能推断

**核心命令默认加载**:

#### /write 命令
```yaml
# 自动推断加载（无需配置）
- craft/* (所有 5 个写作技巧)
- genres/* (根据 genre 字段)
- styles/* (根据 writing-style 字段)
- requirements/* (根据 writing-requirements 字段)
```

#### /plan 命令
```yaml
# 自动推断加载
- craft/scene-structure
- craft/character-arc
- genres/* (根据类型)
```

#### /analyze 命令
```yaml
# 自动推断加载
- craft/* (全部，用于对照检查)
- requirements/* (验证规范)
- skills/quality-assurance/* (全部)
```

### 2.3 Layer 2: 配置覆盖

**完整配置示例**:

```yaml
---
title: "我的小说"
genre: romance
writing-style: natural-voice

resource-loading:
  auto-load: true  # 是否启用智能推断

  # 知识库配置
  knowledge-base:
    craft:
      - dialogue
      - pacing
      - "!character-arc"  # ! 前缀表示禁用
    genres:
      - romance
    styles:
      - natural-voice
    requirements:
      - anti-ai-v4

  # 技巧配置
  skills:
    writing-techniques:
      - dialogue-techniques
      - pacing-control
    quality-assurance:
      - consistency-checker

  # 命令专用配置
  write:
    knowledge-base:
      craft:
        - dialogue  # 只加载对话相关

  analyze:
    knowledge-base:
      craft:
        - pacing  # 分析时只检查节奏
---
```

**配置规则**:

1. **列出的资源会加载**（除非有 `!` 前缀）
2. **`!` 前缀表示禁用**（即使默认推断会加载）
3. **未列出的资源不会加载**（除非默认推断包含）
4. **命令专用配置覆盖全局配置**

### 2.4 Layer 3: 关键词触发

**触发时机**:
- 命令参数（如 `/write --focus 对话技巧`）
- 任务描述（从 tasks.md 读取）
- 用户交互输入（写作过程中）

**触发流程**:
1. 系统扫描文本，匹配关键词
2. 检查资源是否已加载（去重）
3. 提示用户加载建议的资源
4. 用户确认后动态加载

**用户确认选项**:
- **Y** (Yes): 全部加载
- **N** (No): 跳过所有
- **S** (Selective): 逐个选择

**示例**:
```
🔍 关键词触发检测

检测到 "节奏太慢"，建议加载：
- craft/pacing.md
- writing-techniques/pacing-control

是否加载？ [Y/N/S]
```

---

## 3. 关键词触发

### 3.1 内置关键词映射

系统内置了常用关键词映射（`templates/config/keyword-mappings.json`）:

| 关键词 | 触发资源 |
|--------|---------|
| 对话、台词、说话 | craft/dialogue.md + dialogue-techniques |
| 场景、镜头、画面 | craft/scene-structure.md + scene-structure |
| 角色成长、弧线 | craft/character-arc.md + character-arc |
| 节奏、拖沓、太快 | craft/pacing.md + pacing-control |
| 展示、描写、tell | craft/show-not-tell.md |
| 言情、恋爱、感情 | genres/romance.md + romance skill |
| 悬疑、推理、线索 | genres/mystery.md + mystery skill |

### 3.2 自定义关键词映射

**配置方法**:

```yaml
resource-loading:
  keyword-triggers:
    enabled: true
    custom-mappings:
      "甜度": "knowledge-base/genres/romance.md"
      "虐文": "knowledge-base/requirements/romance-angst.md"
      "情感节奏": "knowledge-base/craft/pacing.md"
```

**优先级**:
- 自定义映射优先级最高（priority: 0）
- 内置映射优先级次之（priority: 1-3）

### 3.3 禁用关键词触发

```yaml
resource-loading:
  keyword-triggers:
    enabled: false
```

---

## 4. 配置示例

### 4.1 言情小说（自然风格）

```yaml
---
title: "都市言情"
genre: romance
writing-style: natural-voice
writing-requirements:
  - anti-ai-v4
  - romance-sweet

resource-loading:
  auto-load: true  # 使用智能推断
  keyword-triggers:
    enabled: true
    custom-mappings:
      "甜度": "knowledge-base/genres/romance.md"
---
```

**加载结果**:
- ✅ craft/* (全部)
- ✅ genres/romance.md
- ✅ styles/natural-voice.md
- ✅ requirements/anti-ai-v4.md
- ✅ requirements/romance-sweet.md
- ✅ writing-techniques/* (全部)

### 4.2 悬疑小说（精简配置）

```yaml
---
title: "推理悬疑"
genre: mystery

resource-loading:
  auto-load: true
  knowledge-base:
    craft:
      - dialogue
      - pacing
      - "!character-arc"  # 不关注角色成长
  skills:
    writing-techniques:
      - dialogue-techniques
      - pacing-control
---
```

**加载结果**:
- ✅ craft/dialogue.md
- ✅ craft/pacing.md
- ❌ craft/character-arc.md (明确禁用)
- ✅ genres/mystery.md
- ✅ dialogue-techniques
- ✅ pacing-control

### 4.3 网文爽文（快节奏）

```yaml
---
title: "网络小说"
genre: wuxia
writing-style: web-novel
writing-requirements:
  - fast-paced

resource-loading:
  auto-load: true
  knowledge-base:
    craft:
      - pacing
      - scene-structure
    requirements:
      - fast-paced

  keyword-triggers:
    enabled: false  # 禁用关键词触发（减少打断）
---
```

### 4.4 严肃文学（全功能）

```yaml
---
title: "严肃文学作品"
genre: literary
writing-style: literary
writing-requirements:
  - serious-literature
  - strong-emotion

resource-loading:
  auto-load: true
  knowledge-base:
    craft:
      - dialogue
      - scene-structure
      - character-arc
      - pacing
      - show-not-tell
    styles:
      - literary
    requirements:
      - serious-literature
      - strong-emotion

  skills:
    writing-techniques:
      - dialogue-techniques
      - scene-structure
      - character-arc
      - pacing-control
    quality-assurance:
      - consistency-checker
      - requirement-detector
      - style-detector

  keyword-triggers:
    enabled: true
    custom-mappings:
      "深度": "knowledge-base/requirements/serious-literature.md"
      "情感": "knowledge-base/requirements/strong-emotion.md"
---
```

---

## 5. 常见问题

### 5.1 资源加载相关

**Q: 如何知道哪些资源被加载了？**

A: 核心命令（/write, /plan）会在执行前运行脚本并输出资源加载报告（JSON 格式）。查看控制台输出。

**Q: 如何禁用所有自动加载？**

A: 设置 `auto-load: false`：
```yaml
resource-loading:
  auto-load: false
```

**Q: 如何只加载特定资源？**

A: 设置 `auto-load: false` 并明确列出资源：
```yaml
resource-loading:
  auto-load: false
  knowledge-base:
    craft:
      - dialogue  # 只加载这一个
```

**Q: `!` 前缀和不列出有什么区别？**

A:
- **不列出**: 不主动加载（但智能推断可能加载）
- **`!` 前缀**: 明确禁用（即使智能推断也不加载）

### 5.2 关键词触发相关

**Q: 关键词触发会不会很烦人？**

A: 不会。系统有去重机制：
1. 已加载的资源不会重复提示
2. 你可以选择 N 跳过所有提示
3. 你可以设置 `enabled: false` 完全禁用

**Q: 如何添加自己的关键词？**

A: 使用 `custom-mappings` 配置：
```yaml
resource-loading:
  keyword-triggers:
    custom-mappings:
      "我的关键词": "path/to/resource.md"
```

**Q: 关键词不区分大小写吗？**

A: 正确，关键词匹配忽略大小写。"节奏" 和 "节奏" 效果相同。

**Q: 可以使用正则表达式吗？**

A: 系统内部使用正则，但用户配置只需提供关键词字符串。系统会自动转换为正则。

### 5.3 性能相关

**Q: 加载很多资源会影响性能吗？**

A: 有轻微影响，但已优化：
1. 脚本会缓存资源列表
2. 已加载资源不会重复读取
3. 关键词匹配使用预编译正则

**Q: 如何减少加载时间？**

A:
1. 只配置必需的资源
2. 使用 `!` 禁用不需要的默认资源
3. 禁用关键词触发（如果不需要）

### 5.4 故障排查

**Q: 配置了资源但没有加载？**

A: 检查以下项：
1. YAML 格式是否正确（缩进、引号）
2. 文件路径是否存在
3. 是否有 `!` 前缀禁用了资源
4. 查看脚本输出的 warnings

**Q: 关键词触发不工作？**

A: 检查：
1. `keyword-triggers.enabled` 是否为 `true`
2. 关键词是否在内置映射表中
3. 资源是否已经在 Layer 1/2 加载（会跳过提示）

**Q: 脚本报错怎么办？**

A:
1. 检查脚本文件是否存在（`.specify/scripts/...`）
2. 检查 specification.md 格式是否正确
3. 查看错误消息中的具体提示

---

## 附录

### A. 完整资源路径列表

**知识库** (`templates/knowledge-base/`):
- `craft/dialogue.md`
- `craft/scene-structure.md`
- `craft/character-arc.md`
- `craft/pacing.md`
- `craft/show-not-tell.md`
- `genres/romance.md`
- `genres/mystery.md`
- `genres/fantasy.md`
- `genres/wuxia.md`
- `styles/natural-voice.md`
- `styles/literary.md`
- `styles/web-novel.md`
- `requirements/anti-ai-v4.md`
- `requirements/fast-paced.md`
- `requirements/romance-sweet.md`
- `requirements/romance-angst.md`
- `requirements/serious-literature.md`
- `requirements/strong-emotion.md`

**技巧** (`templates/skills/`):
- `writing-techniques/dialogue-techniques`
- `writing-techniques/scene-structure`
- `writing-techniques/character-arc`
- `writing-techniques/pacing-control`
- `quality-assurance/consistency-checker`
- `quality-assurance/requirement-detector`
- `quality-assurance/style-detector`
- `quality-assurance/workflow-guide`
- `genre-knowledge/romance`
- `genre-knowledge/mystery`
- `genre-knowledge/fantasy`

### B. 关键词映射表完整列表

见 `templates/config/keyword-mappings.json`

### C. 相关文档

- [Phase 1 实施计划](../plans/2025-02-08-phase1-infrastructure.md)
- [Phase 2 实施计划](../plans/2025-02-08-phase2-core-commands.md)
- [Phase 3 实施计划](../plans/2025-02-08-phase3-auxiliary-commands.md)
- [Phase 4 实施计划](../plans/2025-02-08-phase4-keyword-triggering.md)
- [优化设计文档](../opt-plans/2025-02-08-commands-optimization-design.md)

---

**文档版本**: 1.0.0
**最后更新**: 2026-02-08
**维护者**: Claude Sonnet 4.5
