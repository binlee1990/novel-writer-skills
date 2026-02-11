# Task 33: 智能「下一步」推荐系统

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在 `/guide` 命令的基础上，构建更智能的推荐系统：基于 tracking 数据、写作历史、当前问题自动推荐最优操作

**依赖:** Phase 2 Task 16（`/guide` 命令）

**Architecture:** 增强 `guide.md` 命令，从简单的阶段检测升级为基于多维数据的智能推荐。

**Tech Stack:** Markdown 模板

---

### Task 33.1: 增强 /guide 的推荐引擎

**Files:**
- Modify: `templates/commands/guide.md`

**Step 1: 在 Step 3（输出引导）之后添加智能推荐引擎**

```markdown

### Step 5: 智能推荐引擎

在基础阶段引导之外，基于以下数据源进行深度分析，生成个性化推荐：

#### 数据源

| 数据源 | 提取信息 | 推荐依据 |
|--------|---------|---------|
| `character-state.json` | 角色出场频率、缺席章数 | 角色管理建议 |
| `plot-tracker.json` | 伏笔紧急度、情节进度 | 伏笔回收/情节推进建议 |
| `timeline.json` | 时间线冲突 | 时间线修复建议 |
| `narrative-threads.json` | 叙事线活跃度、信息差 | 视角切换/信息揭示建议 |
| `write-checkpoint.json` | 未完成写作 | 断点恢复建议 |
| 最近 5 章内容 | 节奏、风格、爽点 | 节奏调整建议 |

#### 推荐优先级

推荐按优先级排序（高 → 低）：

```
P0（紧急）：
  - 写作断点未恢复
  - 伏笔紧急度 > 0.9
  - 时间线冲突未解决
  - tracking 数据严重落后

P1（重要）：
  - 角色缺席 > 5 章
  - 爽点间隔 > 5 章
  - 节奏连续 3+ 章单一
  - 叙事线暂停 > 8 章

P2（建议）：
  - 伏笔紧急度 0.5-0.9
  - 风格偏移检测到异常
  - 对话一致性评分 < 7
  - tracking 数据轻微落后

P3（优化）：
  - 可以运行的分析命令
  - 可以补充的角色/世界设定
  - 可以优化的章节
```

#### 输出格式

```
🧠 智能推荐
━━━━━━━━━━━━━━━━━━━━

🔴 紧急（立即处理）：
1. 伏笔「身世之谜」紧急度 0.95，已持续 22 章
   → 建议在第 [N] 章回收
   → 运行 /track --check 查看详情

⚠️ 重要（近期处理）：
2. 角色「师姐」已 7 章未出场
   → 建议在第 [N+1] 或 [N+2] 章安排出场
   → 运行 /character list 查看所有角色状态

3. 最近 4 章节奏偏高，读者可能疲劳
   → 建议第 [N+1] 章安排过渡/日常场景
   → 运行 /analyze --focus=hook 检查钩子质量

💡 建议（有空时处理）：
4. tracking 数据落后 2 章
   → 运行 /track --sync=ch[M]-ch[N]

5. 第 18 章风格偏移较大
   → 运行 /analyze 查看详情
```
```

**Step 2: Commit**

```bash
git add templates/commands/guide.md
git commit -m "feat(guide): add intelligent recommendation engine with multi-source data analysis and priority-based suggestions"
```

---

### Task 33.2: 在各命令后置处理中集成轻量推荐

**Files:**
- Modify: `templates/commands/write.md`（后置处理部分）

**Step 1: 在 /write 后置处理中添加轻量推荐**

在 `/write` 完成后的输出中，除了 Task 21 的衔接提示外，增加基于数据的个性化推荐：

```markdown
#### 智能推荐（后置）

在标准衔接提示之前，检查是否有 P0/P1 级别的推荐：
- 如有 P0 推荐 → 在衔接提示中优先展示
- 如有 P1 推荐 → 在衔接提示中附加展示
- 如无 P0/P1 → 仅展示标准衔接提示

示例：
```
━━━━━━━━━━━━━━━━━━━━
⚠️ 注意：角色「师姐」已 7 章未出场，建议在下一章安排

💡 下一步建议：
1️⃣ /write [下一章] — 继续写作（建议安排师姐出场）
2️⃣ /recap [故事名] — 查看上下文简报
3️⃣ /track --check — 检查数据健康度
```
```

**Step 2: Commit**

```bash
git add templates/commands/write.md
git commit -m "feat(write): integrate lightweight smart recommendations in post-processing"
```
