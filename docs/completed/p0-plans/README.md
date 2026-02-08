# Novel Writer Skills 实现计划文档目录

本目录包含所有扩展功能的详细实现计划文档。

---

## 📋 P0 优先级任务（已规划）

P0 任务是项目 PRD 中承诺但未实现的核心功能，属于"还债"性质。

### Craft 知识库（5 项）

填补 `templates/knowledge-base/craft/` 目录的空白，这是 PRD 明确规划但完全未实现的内容。

| # | 文件 | 计划文档 | 预估工时 | 状态 |
|---|------|---------|---------|------|
| 1 | dialogue.md | [2025-02-06-craft-dialogue-knowledge-base.md](2025-02-06-craft-dialogue-knowledge-base.md) | 2-3h | 📝 已规划 |
| 2 | scene-structure.md | [2025-02-06-craft-scene-structure-knowledge-base.md](2025-02-06-craft-scene-structure-knowledge-base.md) | 2.5-3.5h | 📝 已规划 |
| 3 | character-arc.md | [2025-02-06-craft-character-arc-knowledge-base.md](2025-02-06-craft-character-arc-knowledge-base.md) | 3-4h | 📝 已规划 |
| 4 | pacing.md | [2025-02-06-craft-pacing-knowledge-base.md](2025-02-06-craft-pacing-knowledge-base.md) | 2.5-3h | 📝 已规划 |
| 5 | show-not-tell.md | [2025-02-06-craft-show-not-tell-knowledge-base.md](2025-02-06-craft-show-not-tell-knowledge-base.md) | 2-2.5h | 📝 已规划 |

**Craft 知识库小计：** 12-16 小时

### Writing Techniques Skills（2 项）

补全 `templates/skills/writing-techniques/` 目录，PRD 规划了 5 个但只实现了 2 个。

| # | Skill 名称 | 计划文档 | 预估工时 | 状态 |
|---|-----------|---------|---------|------|
| 6 | character-arc | [2025-02-06-character-arc-skill.md](2025-02-06-character-arc-skill.md) | 1.5-2h | 📝 已规划 |
| 7 | pacing-control | [2025-02-06-pacing-control-skill.md](2025-02-06-pacing-control-skill.md) | 1.5-2h | 📝 已规划 |

**Skills 小计：** 3-4 小时

### P0 总计

- **任务数量：** 7 项
- **预估总工时：** 15-20 小时
- **完成状态：** 0/7 已实现，7/7 已规划

---

## 📁 计划文档结构

每个计划文档包含以下标准章节：

### 1. Header（头部元信息）
- 目标（Goal）
- 架构（Architecture）
- 技术栈（Tech Stack）

### 2. 背景与动机（Context）
- 问题描述
- 价值主张
- 参考文件

### 3. Task 分解
每个任务分为 6 个步骤：
1. 研究现有资源
2. 设计内容大纲
3. 编写核心内容
4. 更新关键词映射/集成
5. 验证和测试
6. 提交

### 4. 验证标准
- 完成标准清单
- 质量标准清单
- 测试用例

### 5. 后续任务
- 相关任务链接
- 依赖关系说明

---

## 🎯 使用指南

### For 执行者（执行计划的人/AI）

1. **选择一个任务**
   ```bash
   # 例如：实现 dialogue.md 知识库
   cat docs/plans/2025-02-06-craft-dialogue-knowledge-base.md
   ```

2. **使用 executing-plans skill**
   ```
   I need to implement the plan in docs/plans/2025-02-06-craft-dialogue-knowledge-base.md
   Please use superpowers:executing-plans to execute this task-by-task.
   ```

3. **逐步执行**
   - 按照 Task 1 → Task 2 → ... → Task 6 的顺序
   - 每个 Step 严格按照计划操作
   - 完成后进行验证

4. **提交时引用计划**
   ```bash
   git commit -m "feat(knowledge-base): 添加 craft/dialogue.md

   按照 docs/plans/2025-02-06-craft-dialogue-knowledge-base.md 实现

   Closes: P0 优先级任务 #1"
   ```

### For 规划者（创建新计划的人）

1. **遵循模板格式**
   - 参考现有的 7 个计划文档
   - 保持结构一致性

2. **命名规范**
   ```
   YYYY-MM-DD-<feature-name>.md
   例如：2025-02-06-craft-dialogue-knowledge-base.md
   ```

3. **任务粒度**
   - 每个 Task 是一个逻辑单元（如"编写核心内容"）
   - 每个 Step 是一个具体操作（2-5 分钟）

4. **预估工时**
   - 基于内容复杂度和字数要求
   - 包含研究、编写、验证、提交的完整时间

---

## 📊 进度追踪

### P0 实现进度

```
总进度: 0/7 (0%)

Craft 知识库: 0/5 (0%)
├── dialogue.md          [ ]
├── scene-structure.md   [ ]
├── character-arc.md     [ ]
├── pacing.md            [ ]
└── show-not-tell.md     [ ]

Skills: 0/2 (0%)
├── character-arc        [ ]
└── pacing-control       [ ]
```

### 下一步建议

**优先顺序（按依赖关系）：**

1. **先完成知识库** - Skills 会引用知识库内容
   - dialogue.md
   - scene-structure.md
   - character-arc.md
   - pacing.md
   - show-not-tell.md

2. **再完成 Skills** - 可以与知识库形成互补
   - character-arc Skill（依赖 character-arc.md）
   - pacing-control Skill（依赖 pacing.md）

**并行执行建议：**

如果有多人协作，可以并行：
- 人员 A：dialogue.md + scene-structure.md
- 人员 B：character-arc.md + pacing.md
- 人员 C：show-not-tell.md
- 人员 D：两个 Skills（等知识库完成后）

---

## 🔗 相关文档

- [项目总体分析](../../README.md)
- [PRD 文档](../novel-writer-skills-prd.md)
- [v1.0.3 升级 PRD](../v1.0.3-upgrade-prd.md)
- [知识库系统说明](../../templates/knowledge-base/README.md)

---

## 📝 更新日志

| 日期 | 更新内容 | 作者 |
|------|---------|------|
| 2025-02-06 | 创建 P0 任务的 7 个实现计划 | Claude |

---

**计划状态：** ✅ P0 任务规划完成，等待执行

**下一步行动：** 按照计划文档逐个实现功能
