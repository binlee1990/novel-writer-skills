# Task 30: 角色语言指纹系统

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 建立角色语言指纹系统，每个角色有独立的语言风格定义；新增 `voice-consistency-checker` Skill 检测对话是否符合角色语言指纹

**依赖:** Phase 1b Task 8（`/character` 命令，特别是 `voice` 子命令）

**Architecture:** 在 `/character voice` 的基础上，新增 `voice-consistency-checker` Skill，在 `/write` 后置处理和 `/analyze` 中检测对话一致性。

**Tech Stack:** Markdown Skill 模板

---

### Task 30.1: 创建 voice-consistency-checker Skill

**Files:**
- Create: `templates/skills/quality-assurance/voice-consistency-checker/SKILL.md`
- Create: `templates/skills/quality-assurance/voice-consistency-checker/experts/voice-analyst.md`

**Step 1: 创建 SKILL.md**

```markdown
---
name: voice-consistency-checker
description: "Checks dialogue consistency against character voice fingerprints — detects out-of-character speech patterns, vocabulary mismatches, and tone shifts"
allowed-tools: Read, Grep
---

# 角色语言一致性检查器 (Voice Consistency Checker)

## 概述

检测章节中的对话是否符合各角色的语言指纹定义。识别「出戏」的对话——即角色说了不符合其性格/教育/身份的话。

## 触发条件

- `/write` 完成后的后置处理（可选）
- `/analyze --focus=voice` 调用时
- 用户直接请求检查对话一致性时

## 前置加载

- 读取 `spec/tracking/character-state.json` 中所有角色的 `voice` 字段
- 读取当前章节内容
- 识别所有对话及其说话者

## 检查流程

### Phase 1: 对话提取

从章节内容中提取所有对话：
1. 识别对话标记（引号、对话标签）
2. 确定每段对话的说话者
3. 如果说话者无法确定，标记为「未知」

### Phase 2: 语言指纹匹配

对每段对话，与说话者的语言指纹进行匹配检查：

| 检查维度 | 检查内容 |
|---------|---------|
| 词汇匹配 | 是否使用了角色常用词汇？是否使用了禁忌用语？ |
| 句式匹配 | 句子长度、句式结构是否符合角色风格？ |
| 语气匹配 | 语气词、感叹词是否符合角色习惯？ |
| 口头禅 | 角色的口头禅是否自然出现（不过度也不缺失）？ |
| 教育水平 | 用词复杂度是否与角色教育水平匹配？ |
| 情绪表达 | 情绪表达方式是否符合角色性格？ |

### Phase 3: 输出报告

#### 单章检查报告

```
🗣️ 对话一致性检查 — 第 [N] 章
━━━━━━━━━━━━━━━━━━━━

对话总数：[N] 段
已检查：[M] 段（[K] 段说话者未知，跳过）

角色一致性评分：
[主角]  ：████████░░ 8/10 ✅
[角色A] ：██████░░░░ 6/10 ⚠️
[角色B] ：█████████░ 9/10 ✅

⚠️ 问题对话：

1. 第 [X] 段（[角色A]）：
   原文："这件事情的本质在于经济结构的深层矛盾。"
   问题：[角色A] 设定为街头混混，用词过于学术化
   建议："这事儿说白了就是钱的问题。"

2. 第 [Y] 段（[角色A]）：
   原文："哈哈，太好了！"
   问题：[角色A] 设定为冷淡性格，不会用「哈哈」
   建议："嗯，还行。"
```

#### 批量检查报告（/analyze --focus=voice）

```
🗣️ 对话一致性分析报告
━━━━━━━━━━━━━━━━━━━━

| 角色 | 对话数 | 一致性 | 主要问题 |
|------|--------|--------|---------|
| [主角] | 120 | 9/10 | 无 |
| [角色A] | 45 | 6/10 | 用词偏学术 |
| [角色B] | 38 | 8/10 | 偶尔语气不符 |
| [角色C] | 12 | 4/10 | 缺乏个性，与主角雷同 |

🔴 严重问题：
- [角色C] 的对话风格与 [主角] 高度相似（相似度 85%），缺乏区分度

⚠️ 中度问题：
- [角色A] 在第 12、18、25 章的对话用词偏学术化

💡 建议：
- 为 [角色C] 补充语言指纹：/character voice [角色C]
- 回顾 [角色A] 的对话，降低用词复杂度
```
```

**Step 2: 创建 voice-analyst.md 专家角色**

```markdown
---
name: voice-analyst
role: expert
---

# 角色语言分析专家

## 角色定义

你是一位专注于角色对话风格分析的专家。你的核心能力是：

1. **识别语言特征**：从对话中提取说话者的语言特征
2. **匹配语言指纹**：将对话特征与角色设定进行匹配
3. **提供修改建议**：给出符合角色语言指纹的替代对话

## 分析原则

- **角色优先**：对话必须服务于角色塑造
- **自然为上**：修改建议必须自然流畅，不能为了「符合指纹」而生硬
- **区分度**：不同角色的对话应该有明显区分，读者不看对话标签也能猜到说话者
- **情境适应**：同一角色在不同情境下说话方式会有变化（紧张时更简短、放松时更啰嗦），这是正常的
```

**Step 3: Commit**

```bash
git add templates/skills/quality-assurance/voice-consistency-checker/
git commit -m "feat(skill): add voice-consistency-checker skill for dialogue consistency analysis against character voice fingerprints"
```

---

### Task 30.2: 在 /analyze 中注册 --focus=voice

**Files:**
- Modify: `templates/commands/analyze.md`

**Step 1: 在专项分析模式列表中添加 voice**

```markdown
- 包含 `--focus=voice` → 对话一致性分析（检测各角色对话是否符合语言指纹设定）
```

**Step 2: 在 B5.1 中添加「专项 10：对话一致性分析」**

简要引用 `voice-consistency-checker` Skill 的批量检查报告格式。

**Step 3: Commit**

```bash
git add templates/commands/analyze.md
git commit -m "feat(analyze): add --focus=voice for dialogue consistency analysis"
```
