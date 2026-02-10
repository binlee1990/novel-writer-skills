# Task 3: `/recap` 增加预测性提示

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在 `/recap` 命令的上下文简报中增加「下一章注意事项」预测性提示，包括即将到期伏笔、需出场角色、情绪曲线要求

**Architecture:** 在 `recap.md` 的第 8 部分「快速参考卡片」之后、简报尾部之前，插入新的第 9 部分「下一章预测性提示」。同时更新 `--brief` 模式，使其也包含关键预测提示。

**Tech Stack:** Markdown 模板

---

### Task 3.1: 插入第 9 部分「下一章预测性提示」

**Files:**
- Modify: `templates/commands/recap.md:485-489`（第 8 部分结束后、简报尾部之前）

**Step 1: 在第 485 行（第 8 部分快速参考卡片的结束 ``` 之后）和第 489 行（`## 简报尾部`）之间插入新章节**

在 `recap.md` 的第 485 行之后插入：

```markdown

### 第 9 部分：下一章预测性提示

**数据来源**：综合 `plot-tracker.json`、`character-state.json`、`relationships.json`、`timeline.json`、`creative-plan.md`、`tasks.md`

```markdown
### 9. 下一章预测性提示 🔮

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

#### ⏰ 即将到期伏笔
[从 plot-tracker.json 中筛选 urgency > 0.7 的伏笔]

| 伏笔 | 埋设章节 | 已过章数 | 紧急度 | 建议 |
|------|---------|---------|--------|------|
| [伏笔描述] | 第 N 章 | M 章 | 🔴 紧急 | [推进/回收/提及] |
| [伏笔描述] | 第 N 章 | M 章 | ⚠️ 较高 | [推进/回收/提及] |

**计算规则**：
- 紧急度 = 已过章数 / 类型阈值（悬疑类 5-8 章，情节类 10-15 章，世界观类 20-30 章）
- 🔴 紧急（> 0.8）：必须在下一章有所推进
- ⚠️ 较高（0.5-0.8）：建议在近 2-3 章内推进
- 如无紧急伏笔，显示「✅ 当前无紧急伏笔」

#### 👤 需关注角色
[从 character-state.json 中筛选长期未出场或状态需跟进的角色]

| 角色 | 上次出场 | 未出场章数 | 当前状态 | 建议 |
|------|---------|-----------|---------|------|
| [角色名] | 第 N 章 | M 章 | [状态] | [出场/提及/暂不需要] |

**筛选规则**：
- 主要角色超过 3 章未出场 → 建议出场或提及
- 次要角色超过 8 章未出场 → 提醒（非强制）
- 角色处于关键状态变化中（受伤、失踪、冲突中）→ 必须跟进

#### 📈 情绪曲线建议
[基于 creative-plan.md 的情绪曲线设计和最近 3 章的实际节奏]

- **最近 3 章节奏**：[高/中/低] → [高/中/低] → [高/中/低]
- **建议下一章节奏**：[基于张弛有度原则的建议]
- **理由**：[例如：连续 2 章高强度冲突后，建议适当放缓，安排过渡或角色互动]

#### 🎯 计划执行检查
[对比 creative-plan.md / tasks.md 的规划与实际进度]

- **当前进度**：第 [N] 章 / 计划第 [M] 章的内容
- **偏离检测**：[无偏离 / 轻微偏离 / 显著偏离]
- **偏离说明**：[如有偏离，说明偏离内容和建议]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**生成逻辑**：

1. **即将到期伏笔**：
   - 读取 `plot-tracker.json` 中所有 `status: "open"` 的伏笔
   - 计算每个伏笔的紧急度：`(当前章节 - 埋设章节) / 类型阈值`
   - 按紧急度降序排列，取 top 5
   - 如果没有 `plot-tracker.json`，显示「⚠️ 未找到情节追踪数据，建议执行 /track 初始化」

2. **需关注角色**：
   - 读取 `character-state.json` 中所有角色的 `lastAppearance` 字段
   - 计算未出场章数：`当前章节 - lastAppearance`
   - 筛选超过阈值的角色（主要角色 3 章，次要角色 8 章）
   - 如果没有 `character-state.json`，显示「⚠️ 未找到角色状态数据」

3. **情绪曲线建议**：
   - 读取最近 3 章的内容，判断每章的整体节奏（高/中/低）
   - 基于「高-低-高」张弛有度原则，建议下一章节奏
   - 如果最近章节不足 3 章，基于已有章节分析

4. **计划执行检查**：
   - 对比 `tasks.md` 中当前任务的描述与实际已写内容
   - 检测是否有显著偏离（新增未计划角色、跳过计划事件等）
```

**Step 2: 验证插入位置**

Run: `grep -n "第 8 部分\|第 9 部分\|简报尾部" templates/commands/recap.md`
Expected: 第 8 部分 → 第 9 部分 → 简报尾部，顺序正确

**Step 3: Commit**

```bash
git add templates/commands/recap.md
git commit -m "feat(recap): add predictive hints section (foreshadow urgency, character tracking, pacing suggestion)"
```

---

### Task 3.2: 更新 `--brief` 模式包含关键预测

**Files:**
- Modify: `templates/commands/recap.md:460-485`（第 8 部分快速参考卡片）

**Step 1: 在快速参考卡片中增加预测性提示摘要**

在第 8 部分的快速参考卡片模板中（第 478 行 `💡 **续写衔接**` 之后），添加预测性提示的精简版：

将原来的：
```markdown
💡 **续写衔接**
- 上章结尾：[一句话概括]
- 衔接方式：[建议的开头方向]

📊 **进度**：第 [N]/[M] 章（[X]%）
```

改为：
```markdown
💡 **续写衔接**
- 上章结尾：[一句话概括]
- 衔接方式：[建议的开头方向]

🔮 **下一章注意**
- [最紧急的 1-2 个伏笔提醒，如有]
- [需出场角色提醒，如有]
- [节奏建议：一句话]

📊 **进度**：第 [N]/[M] 章（[X]%）
```

**Step 2: 验证修改**

Run: `grep -n "下一章注意\|续写衔接\|进度" templates/commands/recap.md`
Expected: 在快速参考卡片中看到新增的「下一章注意」部分

**Step 3: Commit**

```bash
git add templates/commands/recap.md
git commit -m "feat(recap): add predictive hints summary to --brief mode quick reference card"
```

---

### Task 3.3: 更新简报尾部的建议行动

**Files:**
- Modify: `templates/commands/recap.md:489-506`（简报尾部）

**Step 1: 在建议行动中增加预测性提示相关的行动项**

将原来的：
```markdown
**建议行动**：
1. 如果有 ⚠️ 警告，先处理警告项
2. 重读上一章结尾，找到续写衔接点
3. 确认下一章任务
4. 执行 /write 开始创作
```

改为：
```markdown
**建议行动**：
1. 如果有 ⚠️ 警告，先处理警告项
2. 如果有 🔴 紧急伏笔，确认下一章如何推进
3. 重读上一章结尾，找到续写衔接点
4. 确认下一章任务
5. 执行 /write 开始创作（灵感充足时可用 /write --fast）
```

**Step 2: 验证修改**

Run: `grep -n "建议行动\|紧急伏笔\|write --fast" templates/commands/recap.md`
Expected: 看到更新后的建议行动列表

**Step 3: Commit**

```bash
git add templates/commands/recap.md
git commit -m "feat(recap): update suggested actions to include foreshadow urgency and --fast hint"
```
