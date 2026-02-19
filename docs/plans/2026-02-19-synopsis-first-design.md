# 概要先行 + 批量扩写 设计文档

> 日期：2026-02-19
> 版本：v5.0.0（破坏性变更，完全替代现有七步方法论）

## 一、设计动机

现有系统（v4.0.0）的 `/write` 命令加载了大量资源（L0/L1/L2 三层资源、tracking 三层 fallback、39 个 skills、keyword triggers 等），但最终写出的正文质量不稳定。核心问题是 AI 在写作时被过多的上下文信息"分心"，无法专注于文学表达。

新方案将写作拆分为两个独立阶段：
1. **概要阶段**：专注剧情设计，生成 200-500 字的纯剧情概要
2. **扩写阶段**：专注文学表达，将概要扩写为 3000-5000 字正文

## 二、整体架构

### 2.1 五命令流水线

```
/specify → /plan → /write → /expand → /analyze
```

| 命令 | 输入 | 输出 | 核心职责 |
|------|------|------|---------|
| `/specify` | 用户交互 | `specification.md` | 定义故事设定、角色、世界观 |
| `/plan` | specification.md | `creative-plan.md` | 生成卷级大纲（每卷核心冲突、转折、高潮） |
| `/write` | creative-plan.md + 前序概要 | `chapter-XXX-synopsis.md` + tracking 骨架 | 逐章生成 200-500 字纯剧情概要 |
| `/expand` | 概要 + 精简上下文 | `chapter-XXX.md` + tracking 细节补充 | 将概要扩写为 3000-5000 字正文 |
| `/analyze` | 正文章节 | 分析报告 | 质量检查（精简版） |

### 2.2 生成项目目录结构

```
my-novel/
├── .claude/
│   ├── commands/          # 5 个命令（specify, plan, write, expand, analyze）
│   └── CLAUDE.md          # 项目规范（精简版）
├── resources/
│   ├── constitution.md    # 创作宪法
│   ├── style-reference.md # 风格参考
│   └── anti-ai.md         # 反AI规范（200字以内）
├── tracking/
│   ├── character-state.json
│   ├── relationships.json
│   ├── plot-tracker.json
│   └── timeline.json
└── stories/
    └── <story>/
        ├── specification.md
        ├── creative-plan.md
        └── content/
            ├── chapter-001-synopsis.md
            ├── chapter-001.md
            ├── chapter-002-synopsis.md
            ├── chapter-002.md
            └── ...
```

### 2.3 关键简化

- 去掉 `.claude/skills/` 目录（零 skills，全部内联到命令模板）
- 去掉 `resources/` 下的 craft/、genres/、styles/、requirements/、config/ 等子目录
- 去掉 `.claude/.cache/` 增量缓存机制
- 去掉 `tracking/summary/`、`tracking/volumes/` 分片机制
- 去掉 `plugins/` 目录

## 三、各命令详细设计

### 3.1 `/specify` — 定义故事

**加载资源**：`resources/constitution.md`

**交互式引导用户定义**：
- 故事类型（玄幻/都市/言情/悬疑等）
- 核心设定（世界观、力量体系等）
- 主要角色（主角、核心配角，每人 2-3 句描述）
- 核心冲突与主线
- 目标规模（总章数、分几卷）
- 写作风格偏好（用于生成 style-reference.md）

**输出**：`stories/<story>/specification.md`

如果用户还没有 `resources/constitution.md` 和 `resources/style-reference.md`，在此阶段一并生成。

### 3.2 `/plan` — 卷级大纲

**加载资源**：`specification.md`（完整读取）

**为每一卷生成**：
- 卷名 + 核心主题（一句话）
- 章节范围（如第1-80章）
- 本卷核心冲突
- 本卷主要转折点（2-3个）
- 本卷高潮事件
- 本卷结尾钩子（引向下一卷）
- 本卷新增/退场角色
- 本卷需要埋设/回收的伏笔

**输出**：`stories/<story>/creative-plan.md`

不生成 tracking，不生成章节级内容。纯粹是全局架构设计。

### 3.3 `/write [章节号] [--batch N]` — 逐章概要

**加载资源（极简）**：
- specification.md 摘要（100字）
- creative-plan.md 中当前卷的大纲段落
- 前面所有已生成概要的标题列表（仅标题，不读全文）
- 前一章概要全文（200-500字）

**每章输出**：
- `content/chapter-XXX-synopsis.md`：200-500 字纯剧情概要，包含：
  - 本章核心事件
  - 出场角色
  - 情感走向
  - 章末钩子
- tracking 骨架更新：
  - character-state.json：本章角色状态变化
  - relationships.json：本章关系变化
  - plot-tracker.json：伏笔埋设/回收、情节线推进
  - timeline.json：时间推进

**支持 `--batch N`**（最大 20），逐章串行生成，每章完成后更新 tracking 再生成下一章。

### 3.4 `/expand [章节号] [--batch N]` — 扩写正文

**加载资源（精准最小集）**：
- 当前章概要（200-500字）
- 前一章正文末尾 500-800 字（衔接用）
- 本章出场角色的当前状态（从 character-state.json 精确提取，不是整个文件）
- 本章涉及的活跃伏笔（从 plot-tracker.json 精确提取）
- `resources/style-reference.md`（风格锚点）
- `resources/anti-ai.md`（反AI规范，200字以内）

**总上下文量控制在 2000-3000 字以内。**

**输出**：
- `content/chapter-XXX.md`：3000-5000 字正文
- tracking 细节补充：扩写中产生的新细节写回 tracking

**支持 `--batch N`**（最大 10），逐章串行扩写。

### 3.5 `/analyze [章节号] [--range start-end]` — 质量检查

**加载资源**：
- 目标章节正文
- 对应概要（用于对比是否偏离）
- tracking 中相关数据

**检查项（精简为 5 项）**：
1. **概要符合度**：正文是否忠实于概要的剧情设计
2. **角色一致性**：角色行为是否符合设定，有无 OOC
3. **伏笔完整性**：该埋的伏笔是否埋了，该回收的是否回收了
4. **连贯性**：与前后章的衔接是否自然
5. **AI味检测**：是否存在明显的AI写作痕迹

**输出**：分析报告（直接输出到终端，不生成文件）

## 四、Tracking 系统

### 4.1 生命周期

```
/plan 阶段：不生成 tracking
    ↓
/write 阶段：生成 tracking 骨架（每写一章概要，同步更新）
    ↓
/expand 阶段：补充 tracking 细节（扩写后追加新细节）
    ↓
/analyze 阶段：只读 tracking，用于一致性校验
```

### 4.2 数据结构（精简版）

**character-state.json**：
```json
{
  "characters": {
    "角色名": {
      "role": "protagonist|supporting|minor",
      "status": "alive|dead|missing",
      "location": "当前位置",
      "state": "当前核心状态（一句话）",
      "lastAppearance": 42
    }
  }
}
```

**relationships.json**：
```json
{
  "relationships": [
    {
      "from": "角色A",
      "to": "角色B",
      "type": "信任|敌对|爱情|友谊|师徒|从属",
      "note": "当前关系状态（一句话）",
      "lastUpdate": 42
    }
  ]
}
```

**plot-tracker.json**：
```json
{
  "currentChapter": 42,
  "plotlines": [
    {
      "name": "情节线名称",
      "status": "active|resolved|pending",
      "description": "一句话描述",
      "keyChapters": [1, 15, 42]
    }
  ],
  "foreshadowing": [
    {
      "id": "fs-001",
      "content": "伏笔内容",
      "plantedAt": 5,
      "resolveAt": null,
      "status": "planted|hinted|resolved"
    }
  ]
}
```

**timeline.json**：
```json
{
  "events": [
    {
      "chapter": 42,
      "time": "第三年春",
      "event": "事件描述（一句话）"
    }
  ]
}
```

### 4.3 扩写时的 Tracking 提取策略

不加载整个 tracking 文件。从概要中提取本章出场角色列表，然后：
- 从 character-state.json 只提取这些角色的条目
- 从 relationships.json 只提取这些角色之间的关系
- 从 plot-tracker.json 只提取 status=active 且 keyChapters 包含当前章或相邻章的伏笔
- 不加载 timeline.json（扩写不需要时间线）

即使 1000 章的长篇，扩写时的 tracking 上下文也只有几百字。

### 4.4 数据流总结

| 阶段 | character-state | relationships | plot-tracker | timeline |
|------|----------------|---------------|-------------|----------|
| /write | 新增/更新角色状态 | 新增/更新关系 | 新增情节线、埋伏笔 | 新增事件 |
| /expand | 补充状态细节 | 补充关系细节 | 标记伏笔回收 | 不变 |
| /analyze | 只读校验 | 只读校验 | 只读校验 | 只读校验 |

## 五、实现策略

### 5.1 实现范围

**新增/重写的模板文件**：
- `templates/commands/specify.md` — 重写
- `templates/commands/plan.md` — 重写
- `templates/commands/write.md` — 重写
- `templates/commands/expand.md` — 新增
- `templates/commands/analyze.md` — 重写
- `templates/resources/constitution.md` — 精简版
- `templates/resources/style-reference.md` — 精简版
- `templates/resources/anti-ai.md` — 新增（200字以内）
- `templates/tracking/character-state.json` — 精简版
- `templates/tracking/relationships.json` — 精简版
- `templates/tracking/plot-tracker.json` — 精简版
- `templates/tracking/timeline.json` — 精简版
- `templates/CLAUDE.md` — 精简版

**修改的源码文件**：
- `src/commands/init.ts` — 更新 init 逻辑
- `src/core/config.ts` — 更新路径常量

**删除的模板文件**：
- 现有 `templates/commands/` 下除上述 5 个以外的所有命令模板
- 整个 `templates/skills/` 目录
- `templates/resources/` 下的 craft/、genres/、styles/、requirements/、config/ 等子目录
- `templates/resources/scripts/` 目录
- 增量缓存相关模板

### 5.2 版本策略

发布为 **v5.0.0**（破坏性变更）。现有用户已生成的项目不受影响。

### 5.3 不在本次范围内

- MCP 集成（SQLite 数据库、全文搜索）
- 插件系统
- 分卷分片 tracking
- v4→v5 迁移命令

## 六、核心设计原则

1. **每个命令只做一件事**：specify 定义、plan 架构、write 概要、expand 扩写、analyze 检查
2. **最小上下文原则**：每个阶段只加载必需的最少信息，控制 token 消耗
3. **概要是核心枢纽**：概要承载剧情设计，正文只负责文学表达
4. **tracking 两阶段生成**：概要阶段生成骨架，扩写阶段补充细节
5. **零 skills、零缓存、零插件**：最大限度简化系统复杂度
