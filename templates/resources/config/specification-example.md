# 故事规格说明示例

## 最小配置（使用默认智能推断）

```yaml
---
title: "我的小说"
genre: romance
---
```

**说明**：
- 不配置 `resource-loading` 时，使用默认智能推断
- 根据 `genre` 自动加载对应的 genre knowledge-base
- 自动加载所有 craft knowledge-base 和 writing-techniques skills

---

## 标准配置（使用原有机制）

```yaml
---
title: "我的小说"
genre: romance
writing-style: natural-voice
writing-requirements:
  - anti-ai-v4
  - fast-paced
---
```

**说明**：
- `writing-style` 会自动加载 `knowledge-base/styles/natural-voice.md`
- `writing-requirements` 会自动加载对应的 requirements 文档
- 向后兼容现有项目

---

## 完整配置（使用三层机制）

```yaml
---
title: "我的小说"
genre: romance
writing-style: natural-voice
writing-requirements:
  - anti-ai-v4
  - fast-paced

# 新增：资源加载配置
resource-loading:
  # 控制自动推断
  auto-load: true  # false 则完全禁用智能推断

  # 知识库配置
  knowledge-base:
    craft:
      - dialogue        # 明确启用
      - scene-structure
      - pacing
      - "!character-arc"  # ! 前缀表示禁用
      - "!show-not-tell"
    genres:
      - romance         # 自动从 genre 字段推断，也可手动指定
    requirements:
      - anti-ai-v4      # 自动从 writing-requirements 推断
      - fast-paced

  # Skills 配置
  skills:
    writing-techniques:
      - dialogue-techniques
      - pacing-control
      - "!character-arc"  # 禁用某个 skill
    quality-assurance:
      - consistency-checker  # 默认会加载，可省略

  # 关键词触发配置
  keyword-triggers:
    enabled: true  # 是否启用运行时关键词触发
    custom-mappings:  # 自定义关键词映射
      "情感节奏": knowledge-base/craft/pacing.md
      "甜度": knowledge-base/genres/romance.md

  # 分析命令专用配置
  analysis:
    knowledge-base:
      craft:
        - dialogue  # 只检查对话质量
        - pacing    # 只检查节奏
    skills:
      quality-assurance:
        - consistency-checker
        - "!workflow-guide"  # 分析时不需要工作流引导
---
```

**说明**：

### resource-loading 配置详解

#### auto-load（自动加载开关）
- `true`（默认）：启用默认智能推断
- `false`：完全禁用智能推断，只加载显式配置的资源

#### knowledge-base（知识库配置）
- **craft**: 写作技巧知识库
  - 可选值：`dialogue`, `scene-structure`, `character-arc`, `pacing`, `show-not-tell`
  - 使用 `!` 前缀禁用（如 `!character-arc`）
- **genres**: 类型知识库
  - 自动从 `genre` 字段推断
  - 可手动指定其他类型
- **requirements**: 写作规范
  - 自动从 `writing-requirements` 字段推断

#### skills（Skills 配置）
- **writing-techniques**: 写作技巧 Skills
  - 可选值：`dialogue-techniques`, `scene-structure`, `character-arc`, `pacing-control`
- **quality-assurance**: 质量保证 Skills
  - 可选值：`consistency-checker`, `workflow-guide`

#### keyword-triggers（关键词触发）
- **enabled**: 是否启用运行时关键词触发
- **custom-mappings**: 自定义关键词 → 资源映射

#### analysis（分析命令专用）
- 为 `/analyze` 等分析命令指定专用配置
- 结构与主配置相同，但只在分析命令中生效

---

## 配置优先级

**优先级**：配置声明 > 智能推断 > 关键词触发

1. **配置声明最高**：显式配置的资源一定会加载/禁用
2. **智能推断次之**：根据 genre、writing-style 等字段推断
3. **关键词触发最低**：运行时检测关键词动态加载

---

## 向后兼容性

- 不配置 `resource-loading` → 使用默认智能推断 + 原有机制
- 部分配置 `resource-loading` → 未配置的部分使用默认值
- 现有项目无需修改，自动享受智能推断
