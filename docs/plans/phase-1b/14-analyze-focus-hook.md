# Task 14: `/analyze --focus=hook` 钩子专项分析

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在 `/analyze` 命令中新增 `--focus=hook` 专项分析模式，对所有已写章节进行批量钩子检查，生成钩子质量汇总报告

**Architecture:** 在 `analyze.md` 的专项分析部分（B5.1）新增「专项 8：钩子专项分析」。该专项调用 `hook-checker` Skill 对每章进行检查，然后汇总为全局报告。

**依赖:** Phase 1b Task 13（`hook-checker` Skill）

**Tech Stack:** Markdown 模板

---

### Task 14.1: 在 analyze.md 决策逻辑中注册 --focus=hook

**Files:**
- Modify: `templates/commands/analyze.md:50-57`（专项分析模式列表）

**Step 1: 在专项分析模式列表中添加 hook**

在 `--focus=reader` 之后添加新行：

```markdown
- 包含 `--focus=hook` → 钩子专项分析（重点分析每章结尾钩子的类型、强度、兑现率）
```

**Step 2: Commit**

```bash
git add templates/commands/analyze.md
git commit -m "feat(analyze): register --focus=hook in decision logic"
```

---

### Task 14.2: 在 B5.1 专项分析中添加「专项 8：钩子专项分析」

**Files:**
- Modify: `templates/commands/analyze.md`（专项 7 读者体验分析结束后）

**Step 1: 在专项 7 结束后插入新的专项分析章节**

```markdown

#### 专项 8：钩子专项分析（`--focus=hook`）

**触发条件**：`$ARGUMENTS` 包含 `--focus=hook`

**前置加载**：
- 加载 Skill：`templates/skills/quality-assurance/hook-checker/SKILL.md`
- 加载 Expert：`templates/skills/quality-assurance/hook-checker/experts/hook-analyst.md`
- 加载知识库：`templates/knowledge-base/craft/hook-design.md`
- 读取所有已写章节内容

**分析流程**：

##### 8.1 逐章钩子扫描

对每个已写章节执行 `hook-checker` Skill 的检查流程：
1. 提取章节最后 500 字
2. 识别钩子类型
3. 五维评分
4. 检查与上一章钩子的兑现关系

##### 8.2 汇总报告

```
🪝 钩子专项分析报告
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 总体统计
- 已分析章节：[N] 章
- 有钩子章节：[M] 章（[X]%）
- 无钩子章节：[K] 章（[Y]%）← ⚠️ 如 > 10% 则警告
- 平均钩子强度：[Z.Z]/5.0

📈 钩子强度分布
⭐⭐⭐⭐⭐ ：[N] 章（[X]%）
⭐⭐⭐⭐   ：[N] 章（[X]%）
⭐⭐⭐     ：[N] 章（[X]%）
⭐⭐       ：[N] 章（[X]%）
⭐         ：[N] 章（[X]%）
❌ 无钩子  ：[N] 章（[X]%）

🎯 钩子类型分布
悬念钩子：[N] 次（[X]%）██████████
反转钩子：[N] 次（[X]%）████████
信息钩子：[N] 次（[X]%）██████
情感钩子：[N] 次（[X]%）████
时间压力：[N] 次（[X]%）██
选择钩子：[N] 次（[X]%）█

🔄 钩子兑现率
- 已兑现：[N]/[M]（[X]%）
- 延迟兑现（跨 2+ 章）：[K] 个
- 未兑现：[L] 个 ← ⚠️ 如有则列出

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

##### 8.3 逐章明细

```
📋 逐章钩子明细
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| 章节 | 钩子类型 | 强度 | 兑现 | 核心句摘要 |
|------|---------|------|------|-----------|
| 第 1 章 | 悬念 | ⭐⭐⭐ | ✅ 第 2 章 | "门外的脚步声停了..." |
| 第 2 章 | 信息 | ⭐⭐ | ✅ 第 3 章 | "她想起了什么..." |
| 第 3 章 | ❌ 无 | — | — | — |
| 第 4 章 | 反转 | ⭐⭐⭐⭐ | ✅ 第 5 章 | "那封信是假的。" |
| ... | ... | ... | ... | ... |
```

##### 8.4 问题诊断

```
⚠️ 问题诊断
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔴 严重问题：
- 第 [N] 章：无钩子（读者退出风险）
- 第 [M] 章：钩子未兑现（读者信任损失）

⚠️ 中度问题：
- 第 [A]-[B] 章：连续 [C] 章使用同类型钩子（悬念），建议增加多样性
- 第 [D] 章：钩子强度仅 ⭐，作为卷末章节偏弱

💡 轻度建议：
- 整体悬念钩子占比过高（[X]%），建议增加反转和情感钩子
- 平均强度 [Z.Z] 略低于网文建议值 3.0
```

##### 8.5 改进建议

```
💡 改进建议
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 优先修复（影响读者留存）：
1. 第 [N] 章：建议添加 [具体钩子类型] 钩子
   示例："[基于章节内容的具体钩子建议]"

2. 第 [M] 章：钩子 "[原钩子]" 未在后续章节兑现
   建议：在第 [K] 章中添加回应

📌 优化建议（提升体验）：
3. 增加反转钩子的使用频率（当前仅 [X]%）
4. 卷末钩子（第 [N] 章）建议提升至 ⭐⭐⭐⭐ 以上

📚 参考资源：
- 钩子设计指南：templates/knowledge-base/craft/hook-design.md
- 六种钩子类型详解和示例
```
```

**Step 2: 验证插入位置**

Run: `grep -n "专项 7\|专项 8\|focus=hook\|focus=reader" templates/commands/analyze.md`
Expected: 专项 8 出现在专项 7 之后

**Step 3: Commit**

```bash
git add templates/commands/analyze.md
git commit -m "feat(analyze): add --focus=hook analysis (per-chapter hook scan, strength distribution, fulfillment rate, diagnostics)"
```

---

### Task 14.3: 在注意事项中添加 hook 分析的使用场景

**Files:**
- Modify: `templates/commands/analyze.md`（专项分析使用场景部分）

**Step 1: 在读者体验分析使用场景之后添加**

```markdown
#### 钩子专项分析（`--focus=hook`）
**适用场景**：
- 写了 5+ 章后，想检查钩子设计是否有效
- 发现读者反馈「不够吸引人」或「看不下去」
- 想系统性改进章节结尾
- 准备发布前的最终检查

**前置建议**：
- 至少完成 5 章以上内容
- 如有 `hook-design.md` 知识库，分析会更精准

**后续行动**：
- 无钩子章节 → 参考 `hook-design.md` 补充钩子
- 钩子类型单一 → 尝试不同类型的钩子
- 钩子未兑现 → 在后续章节补充回应
- 整体强度偏低 → 使用 `/plan --detail` 重新规划钩子链

**与 `--focus=reader` 的区别**：
- `--focus=hook`：专注于章节结尾钩子的技术分析
- `--focus=reader`：综合分析爽点、钩子、信息投喂、期待管理
```

**Step 2: Commit**

```bash
git add templates/commands/analyze.md
git commit -m "feat(analyze): add --focus=hook usage scenarios in notes section"
```
