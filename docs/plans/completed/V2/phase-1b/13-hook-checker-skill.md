# Task 13: 新增 `hook-checker` Skill

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 创建 `hook-checker` Skill，在写作完成后自动检查章节结尾的钩子质量，提供强度评分和改进建议

**Architecture:** 在 `templates/skills/quality-assurance/` 目录下创建 `hook-checker/` 子目录，包含 `SKILL.md`（主文件）和 `experts/hook-analyst.md`（专家角色）。Skill 被 `/write` 的后置处理和 `/analyze --focus=hook` 调用。

**依赖:** Phase 1a Task 4（`hook-design.md` 知识库）

**Tech Stack:** Markdown Skill 模板

---

### Task 13.1: 创建 hook-checker 目录结构

**Files:**
- Create: `templates/skills/quality-assurance/hook-checker/SKILL.md`
- Create: `templates/skills/quality-assurance/hook-checker/experts/hook-analyst.md`

**Step 1: 创建 SKILL.md**

```markdown
---
name: hook-checker
description: "Automatically evaluates chapter ending hooks for strength, type diversity, and reader retention potential - provides scoring and improvement suggestions"
allowed-tools: Read, Grep
---

# 钩子质量检查器 (Hook Checker)

## 概述

在章节写作完成后，自动分析章节结尾（最后 300-500 字）的钩子质量，评估其留住读者的能力。

## 触发条件

- `/write` 完成后的后置处理阶段（自动触发）
- `/analyze --focus=hook` 调用时（手动触发）
- 用户直接请求检查钩子质量时

## 前置加载

- 加载知识库：`templates/knowledge-base/craft/hook-design.md`（钩子设计参考）
- 读取当前章节内容（重点关注最后 500 字）
- 读取上一章结尾（检查钩子兑现）
- 读取 `plot-tracker.json`（检查伏笔关联）

## 检查流程

### Phase 1: 钩子识别

**分析章节最后 500 字，识别钩子**：

1. **是否存在钩子**：
   - 章节是否以某种「未完成感」结束？
   - 读者是否有理由翻到下一章？
   - 如果没有钩子 → 直接标记为 ❌ 无钩子

2. **钩子类型判断**：
   - 悬念钩子：未知威胁、未解之谜
   - 反转钩子：认知颠覆、意外揭示
   - 信息钩子：关键信息即将揭示
   - 情感钩子：情感悬而未决
   - 时间压力钩子：倒计时、截止日期
   - 选择钩子：两难抉择

3. **钩子边界确定**：
   - 钩子从哪一句开始？
   - 钩子的核心句是哪一句？

### Phase 2: 钩子评分

**五维评分（每维 1-5 分）**：

| 维度 | 评分标准 |
|------|---------|
| **悬念强度** | 读者想知道「接下来会怎样」的程度 |
| **情感冲击** | 钩子引发的情感反应强度 |
| **信息缺口** | 钩子制造的信息不对称程度 |
| **紧迫感** | 读者感受到的时间压力 |
| **意外性** | 钩子是否出乎读者预料 |

**综合评分计算**：

```
综合分 = (悬念强度 × 0.3) + (情感冲击 × 0.25) + (信息缺口 × 0.2) + (紧迫感 × 0.15) + (意外性 × 0.1)
```

**星级映射**：
- 4.0-5.0 → ⭐⭐⭐⭐⭐ 极强钩子
- 3.0-3.9 → ⭐⭐⭐⭐ 强钩子
- 2.0-2.9 → ⭐⭐⭐ 中等钩子
- 1.0-1.9 → ⭐⭐ 弱钩子
- 0-0.9 → ⭐ 极弱/无钩子

### Phase 3: 上下文检查

1. **钩子兑现检查**：
   - 上一章的钩子是否在本章得到回应？
   - 回应方式是否令人满意？（直接兑现/延迟兑现/部分兑现）

2. **钩子多样性检查**：
   - 最近 5 章的钩子类型是否有变化？
   - 是否过度依赖某一种钩子类型？

3. **钩子与情节关联**：
   - 钩子是否与主线情节相关？
   - 钩子是否推进了某个伏笔？

### Phase 4: 输出报告

#### 单章检查报告（/write 后置处理）

```
🪝 钩子质量检查
━━━━━━━━━━━━━━━━━━━━

📍 第 [N] 章结尾分析

✅ 钩子类型：[悬念/反转/信息/情感/时间压力/选择]
⭐ 综合评分：[X.X]/5.0（[星级]）

五维评分：
  悬念强度：████░ 4/5
  情感冲击：███░░ 3/5
  信息缺口：████░ 4/5
  紧迫感  ：██░░░ 2/5
  意外性  ：███░░ 3/5

📝 钩子内容：
"[提取的钩子核心句]"

✅ 上章钩子兑现：已在本章第 [M] 段回应

💡 改进建议：
- [具体建议 1]
- [具体建议 2]
```

#### 无钩子警告

```
🪝 钩子质量检查
━━━━━━━━━━━━━━━━━━━━

📍 第 [N] 章结尾分析

❌ 未检测到有效钩子

当前结尾：
"[最后一段内容]"

⚠️ 警告：没有钩子的章节 = 读者的退出点

💡 改进建议：
1. [基于章节内容的具体钩子建议]
2. [可选的钩子类型和示例]
3. 参考：templates/knowledge-base/craft/hook-design.md
```

## 与其他系统的集成

### /write 集成

在 `/write` 的后置处理中，钩子检查作为可选步骤执行：
- 默认开启（可通过 `specification.md` 中的配置关闭）
- 检查结果附在写作输出之后
- 如果评分 < 2.0，显示改进建议

### /analyze --focus=hook 集成

在 `/analyze --focus=hook` 中，对所有已写章节执行批量钩子检查，生成汇总报告。

### /track 集成

钩子检查结果可选择性写入 `plot-tracker.json` 的章节记录中。
```

**Step 2: 创建 hook-analyst.md 专家角色**

```markdown
---
name: hook-analyst
role: expert
---

# 钩子分析专家

## 角色定义

你是一位专注于章节结尾钩子设计的分析专家。你的核心能力是：

1. **识别钩子**：从章节结尾中准确识别钩子的存在和类型
2. **评估强度**：基于五维模型评估钩子的读者留存能力
3. **提供改进**：给出具体、可操作的钩子改进建议

## 分析原则

- **读者视角**：始终从读者的角度评估钩子效果
- **类型适配**：不同类型的故事对钩子的要求不同（网文需要更强的钩子）
- **具体建议**：不说「加强悬念」，而说「在最后一句加入一个未知角色的出现」
- **尊重风格**：不强制所有章节都用强钩子，过渡章可以用中等钩子

## 评估标准

### 网文标准（默认）
- 每章必须有钩子（无钩子 = 不合格）
- 平均强度应 ≥ 3.0
- 卷末钩子应 ≥ 4.0

### 文学标准
- 80% 章节应有钩子
- 平均强度应 ≥ 2.0
- 允许部分章节以情感余韵结尾（非传统钩子）
```

**Step 3: 验证文件创建**

Run: `ls -la templates/skills/quality-assurance/hook-checker/`
Run: `ls -la templates/skills/quality-assurance/hook-checker/experts/`
Expected: SKILL.md 和 hook-analyst.md 都存在

**Step 4: Commit**

```bash
git add templates/skills/quality-assurance/hook-checker/
git commit -m "feat(skill): add hook-checker skill with 5-dimension scoring, auto-check after /write, and improvement suggestions"
```
