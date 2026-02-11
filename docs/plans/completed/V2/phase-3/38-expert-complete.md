# Task 38: `/expert` 内容补全

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 补全 `/expert` 命令的模板内容，使其能提供专业领域的写作咨询：角色塑造、情节设计、世界观构建、文笔提升等

**Architecture:** 完善 `templates/commands/expert.md` 的执行流程和输出格式。

**Tech Stack:** Markdown 模板

---

### Task 38.1: 读取现有 expert.md 并评估缺失内容

**Files:**
- Read: `templates/commands/expert.md`

**Step 1: 读取文件，记录已有内容和缺失部分**

需要确认以下能力是否已实现：
- [ ] 专家角色定义（不同领域的专家）
- [ ] 咨询流程（问题分析 → 建议生成）
- [ ] 领域知识库引用
- [ ] 示例对话

---

### Task 38.2: 补全专家领域定义

**Files:**
- Modify: `templates/commands/expert.md`

**Step 1: 添加专家领域定义**

```markdown
#### 专家领域

`/expert` 支持以下专家领域，根据用户问题自动匹配或由用户指定：

##### 领域 1：角色塑造专家

```
🎭 角色塑造专家
━━━━━━━━━━━━━━━━━━━━

擅长领域：
- 角色动机设计（内在动机 vs 外在动机）
- 角色弧光规划（成长型、堕落型、平坦型）
- 角色关系网络设计
- 角色语言风格设计
- 配角功能定位（镜像角色、导师、对手、催化剂）

咨询方式：
1. 分析用户描述的角色问题
2. 引用 character-design.md 知识库
3. 结合当前故事的角色数据（character-state.json）
4. 给出具体、可操作的建议
```

##### 领域 2：情节设计专家

```
📖 情节设计专家
━━━━━━━━━━━━━━━━━━━━

擅长领域：
- 三幕结构 / 英雄之旅 / 起承转合
- 冲突设计（人 vs 人、人 vs 自然、人 vs 自我）
- 转折点设计（意外但合理）
- 节奏控制（张弛有度）
- 伏笔设计与回收
- 网文特有结构（开局钩子、爽点节奏、卷末高潮）

咨询方式：
1. 分析用户的情节困境
2. 引用 plot-structure.md、tension-management.md 知识库
3. 结合当前故事的情节数据（plot-tracker.json）
4. 提供多个方案供选择
```

##### 领域 3：世界观构建专家

```
🌍 世界观构建专家
━━━━━━━━━━━━━━━━━━━━

擅长领域：
- 力量体系设计（硬体系 vs 软体系）
- 社会结构设计（政治、经济、文化）
- 地理环境设计
- 历史背景设计
- 规则一致性维护

咨询方式：
1. 分析用户的世界观问题
2. 引用 power-system.md、对应类型知识库
3. 结合当前故事的世界设定（world-setting.json）
4. 给出系统性建议
```

##### 领域 4：文笔提升专家

```
✍️ 文笔提升专家
━━━━━━━━━━━━━━━━━━━━

擅长领域：
- 描写技巧（五感描写、动态描写、留白）
- 对话技巧（潜台词、节奏、个性化）
- 叙述视角（第一人称、第三人称、全知）
- 修辞运用（比喻、拟人、排比、通感）
- 网文文笔（简洁有力、画面感、代入感）

咨询方式：
1. 分析用户提供的文本片段
2. 引用 writing-craft 相关知识库
3. 提供修改前后对比
4. 解释修改原因
```

##### 领域 5：类型写作专家

```
📚 类型写作专家
━━━━━━━━━━━━━━━━━━━━

擅长领域：
- 玄幻/仙侠写作要点
- 都市小说写作要点
- 游戏/系统文写作要点
- 重生/穿越写作要点
- 各类型的读者期待管理

咨询方式：
1. 识别用户故事的类型
2. 引用对应类型知识库（xuanhuan.md、urban.md 等）
3. 结合类型惯例给出建议
4. 指出类型禁忌和常见陷阱
```

---

### Task 38.3: 补全咨询流程

**Files:**
- Modify: `templates/commands/expert.md`

**Step 1: 添加标准咨询流程**

```markdown
#### 咨询流程

##### Step 1: 问题分析

```
用户问题：[用户的问题]

问题分类：
  领域：[自动匹配的领域]
  类型：[概念性问题 / 具体问题 / 修改建议 / 方案选择]
  紧急度：[当前章节需要 / 后续规划 / 学习提升]
```

##### Step 2: 上下文收集

根据问题类型，自动加载相关数据：
- 角色问题 → 加载 character-state.json + specification.md 角色部分
- 情节问题 → 加载 plot-tracker.json + creative-plan.md
- 世界观问题 → 加载 world-setting.json + specification.md 世界观部分
- 文笔问题 → 加载用户指定的章节内容
- 类型问题 → 加载对应类型知识库

##### Step 3: 建议生成

```
💡 专家建议
━━━━━━━━━━━━━━━━━━━━

📋 问题诊断：
[对问题的分析]

🎯 核心建议：
[最重要的 1-2 条建议]

📝 具体方案：
方案 A：[描述]
  优点：...
  缺点：...

方案 B：[描述]
  优点：...
  缺点：...

📚 参考资料：
- [相关知识库条目]
- [相关写作技巧]

🔗 后续操作：
- [建议运行的命令]
```
```

**Step 2: Commit**

```bash
git add templates/commands/expert.md
git commit -m "feat(expert): complete expert consultation with domain definitions, consultation flow, and context-aware advice"
```
