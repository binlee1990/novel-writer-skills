# Genre 知识库扩展实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 补全 PRD 中提到的 sci-fi（科幻）和 thriller（惊悚）两个 Genre 知识库，使类型知识库覆盖 7 种主流题材。

**Architecture:** 沿用现有 Genre 知识库的统一格式（快速参考 → 核心原则 → 详细说明 → 检查清单），每个知识库包含定义性特征、关键公式、类型划分、核心原则（含正反对比示例）、节奏模板、检查清单。同时为每个 Genre 创建对应的 SKILL.md 文件。

**Tech Stack:** Markdown 文档，无代码依赖

---

## 现有结构参考

### Genre 知识库（templates/knowledge-base/genres/）

```
templates/knowledge-base/genres/
├── romance.md      # 言情（已完成）
├── mystery.md      # 悬疑推理（已完成）
├── historical.md   # 历史（已完成）
├── revenge.md      # 复仇爽文（已完成）
└── wuxia.md        # 武侠（已完成）
```

### Genre Skills（templates/skills/genre-knowledge/）

```
templates/skills/genre-knowledge/
├── fantasy/SKILL.md    # 奇幻（已完成）
├── mystery/SKILL.md    # 悬疑推理（已完成）
└── romance/SKILL.md    # 言情（已完成）
```

### Genre 知识库标准格式

```markdown
# [类型名称]创作知识库

## 快速参考（Quick Reference）

**定义性特征**：
1. [特征1]
2. [特征2]
3. [特征3]

**关键公式**：
```
[类型] = [要素1] + [要素2] + [要素3]
```

**类型划分**：
- [子类型1]：描述
- [子类型2]：描述

---

## 核心原则（Core Principles）

### 1. [原则名称]

**原则**：[简洁陈述]

**如何实现**：
- [方法1]
- [方法2]

**示例对比**：
❌ **错误**：[反面例子]
✅ **正确**：[正面例子]

---

## 节奏模板（Pacing Template）
[章节节奏安排]

---

## 检查清单（Checklist）
[验证标准]
```

### Genre SKILL.md 标准格式

```yaml
---
name: [genre]-novel-conventions
description: "Use when user mentions [genre keywords] - provides genre conventions and [specific value] for [genre] writing"
allowed-tools: Read, Grep, Glob
---

# [中文类型名] 创作惯例

## 激活条件
[何时自动激活]

## 核心惯例
[类型核心规则]

## 常见陷阱
[容易犯的错误]

## 推荐节奏
[章节节奏建议]
```

---

## Task 1: 科幻知识库（sci-fi）

**Files:**
- Create: `templates/knowledge-base/genres/sci-fi.md`
- Create: `templates/skills/genre-knowledge/sci-fi/SKILL.md`
- Modify: `templates/skills/quality-assurance/setting-detector/SKILL.md`

### Step 1: 编写 sci-fi.md 知识库

创建 `templates/knowledge-base/genres/sci-fi.md`

**内容结构与要求：**

```markdown
# 科幻小说创作知识库

## 快速参考（Quick Reference）

**定义性特征**：
1. 科学或技术概念作为核心驱动力
2. 对未来/平行世界的合理推演
3. 探讨科技对人类社会的影响

**关键公式**：
科幻 = 科学概念 + 合理推演 + 人文关怀

**类型划分**：
- 硬科幻：以科学准确性为核心（刘慈欣《三体》、阿瑟·克拉克）
- 软科幻：以社会/人文影响为核心（厄休拉·勒古恩、菲利普·迪克）
- 赛博朋克：高科技低生活（威廉·吉布森《神经漫游者》）
- 太空歌剧：宏大宇宙叙事（《银河帝国》系列）
- 末日/后末日：文明崩溃与重建
- 近未来科幻：基于当前技术的短期推演
```

**核心原则（至少 6 条）：**

1. **科学基底原则** — 即使是软科幻也需要内在逻辑自洽
   - 如何实现：选择 1-2 个核心科幻设定深入推演，其余可模糊处理
   - 对比：❌ 随意发明万能技术解决所有问题 / ✅ 技术有明确的限制和代价

2. **诺维科夫自洽原则** — 设定的规则不能自相矛盾
   - 如何实现：建立设定文档，每次使用技术时检查一致性
   - 对比：❌ 同一技术在不同场景表现不同 / ✅ 技术表现始终遵循既定规则

3. **人文内核原则** — 科技是手段，人性是目的
   - 如何实现：每个科幻设定都要回答"这对人意味着什么"
   - 对比：❌ 堆砌技术术语炫技 / ✅ 通过技术折射人性困境

4. **陌生化效果原则** — 用熟悉的方式描写陌生事物
   - 如何实现：用日常类比解释科幻概念，用感官细节让读者"看见"
   - 对比：❌ 大段技术说明文 / ✅ 通过角色体验展现技术

5. **信息投放原则** — 世界观信息要融入叙事
   - 如何实现：通过角色行动和对话自然展现设定，避免"信息倾倒"
   - 对比：❌ 开头三章全是世界观介绍 / ✅ 读者跟随角色逐步发现世界

6. **技术代价原则** — 任何技术进步都有代价
   - 如何实现：为每项核心技术设计副作用、社会影响、伦理困境
   - 对比：❌ 技术完美无缺 / ✅ 技术带来新问题

**节奏模板：**
- 提供科幻小说的典型章节节奏（设定引入 → 日常展示 → 危机触发 → 探索发现 → 高潮对决 → 新平衡）

**检查清单：**
- 核心科幻设定是否有内在逻辑？
- 技术是否有明确的限制和代价？
- 世界观信息是否融入叙事而非信息倾倒？
- 是否有人文内核（不只是技术展示）？
- 设定规则是否前后一致？

**字数要求：** 800-1200 字（参考 wuxia.md 的精炼风格，或 romance.md 的详细风格，根据内容需要决定）

### Step 2: 编写 sci-fi SKILL.md

创建 `templates/skills/genre-knowledge/sci-fi/SKILL.md`

**内容要求：**

```yaml
---
name: sci-fi-novel-conventions
description: "Use when user mentions science fiction, sci-fi, 科幻, 未来, 太空, 赛博朋克, 人工智能, 末日 - provides genre conventions and world-building guidance for science fiction writing"
allowed-tools: Read, Grep, Glob
---
```

**正文内容：**
- 激活条件：用户提到科幻、未来、太空、AI、赛博朋克等关键词
- 核心惯例：科学基底、人文内核、信息投放、技术代价
- 子类型识别：根据用户描述判断硬科幻/软科幻/赛博朋克等
- 常见陷阱：技术说明过多、设定不自洽、缺乏人文关怀
- 推荐节奏：科幻小说的章节节奏建议
- 与其他 Skills 协作：配合 consistency-checker 检查设定一致性

**字数要求：** 300-500 字

### Step 3: 更新 setting-detector 关键词映射

修改 `templates/skills/quality-assurance/setting-detector/SKILL.md`，添加：

```yaml
sci-fi:
  keywords: [科幻, 未来, 太空, 赛博朋克, 人工智能, AI, 末日, 星际, 机器人, 时间旅行]
  auto_load: genres/sci-fi.md
```

### Step 4: 提交

```bash
git add templates/knowledge-base/genres/sci-fi.md
git add templates/skills/genre-knowledge/sci-fi/SKILL.md
git add templates/skills/quality-assurance/setting-detector/SKILL.md
git commit -m "feat(genres): 添加科幻小说知识库和 Skill (sci-fi)"
```

---

## Task 2: 惊悚知识库（thriller）

**Files:**
- Create: `templates/knowledge-base/genres/thriller.md`
- Create: `templates/skills/genre-knowledge/thriller/SKILL.md`
- Modify: `templates/skills/quality-assurance/setting-detector/SKILL.md`

### Step 1: 编写 thriller.md 知识库

创建 `templates/knowledge-base/genres/thriller.md`

**内容结构与要求：**

```markdown
# 惊悚小说创作知识库

## 快速参考（Quick Reference）

**定义性特征**：
1. 持续的紧张感和悬念
2. 主角面临迫在眉睫的威胁
3. 高风险（生命、安全、重大利益）

**关键公式**：
惊悚 = 迫在眉睫的威胁 + 时间压力 + 不断升级的风险

**惊悚 vs 悬疑的区别**：
- 悬疑：读者和主角都不知道真相（谁干的？）
- 惊悚：读者可能知道威胁，但主角不知道（他能逃脱吗？）

**类型划分**：
- 心理惊悚：内心恐惧和心理操控（《消失的爱人》）
- 政治惊悚：阴谋和权力斗争（《谍影重重》）
- 法律惊悚：法庭和司法系统（约翰·格里森姆）
- 医学惊悚：医疗和生物威胁（罗宾·库克）
- 科技惊悚：技术威胁（迈克尔·克莱顿）
- 生存惊悚：极端环境求生
```

**核心原则（至少 6 条）：**

1. **滴答钟原则** — 始终保持时间压力
   - 如何实现：设置明确的截止时间、倒计时、不可逆的进程
   - 对比：❌ 主角有充足时间从容应对 / ✅ 每一分钟都在流逝

2. **风险升级原则** — 赌注必须不断提高
   - 如何实现：从个人安全 → 亲人安全 → 更大范围的威胁
   - 对比：❌ 威胁程度始终不变 / ✅ 每次以为解决了，发现更大的危机

3. **信息不对称原则** — 利用读者和角色的信息差制造紧张
   - 如何实现：让读者看到角色看不到的危险（希区柯克式悬念）
   - 对比：❌ 读者和角色同时发现一切 / ✅ 读者知道炸弹在桌下，角色不知道

4. **喘息节奏原则** — 紧张需要间歇才能持续
   - 如何实现：高压场景后安排短暂的安全感，然后再次打破
   - 对比：❌ 从头到尾同一强度的紧张 / ✅ 张弛有度，每次放松后更紧张

5. **可信威胁原则** — 反派/威胁必须真实可信
   - 如何实现：给反派合理的动机和能力，展示威胁的真实后果
   - 对比：❌ 反派无缘无故作恶 / ✅ 反派有令人不寒而栗的逻辑

6. **主角脆弱原则** — 主角必须有真实的弱点
   - 如何实现：主角不是超人，有恐惧、犹豫、错误判断
   - 对比：❌ 主角永远冷静正确 / ✅ 主角会犯错，会害怕

**节奏模板：**
- 惊悚小说的典型节奏（钩子开场 → 日常打破 → 威胁显现 → 逃亡/对抗 → 虚假安全 → 真相揭露 → 最终对决 → 余波）

**检查清单：**
- 是否有明确的时间压力？
- 风险是否在不断升级？
- 反派/威胁是否可信且有深度？
- 是否利用了信息不对称制造悬念？
- 节奏是否张弛有度（不是一直高压）？
- 主角是否有真实的脆弱性？

**字数要求：** 800-1200 字

### Step 2: 编写 thriller SKILL.md

创建 `templates/skills/genre-knowledge/thriller/SKILL.md`

**内容要求：**

```yaml
---
name: thriller-novel-conventions
description: "Use when user mentions thriller, suspense, 惊悚, 悬疑, 紧张, 追杀, 逃亡, 阴谋 - provides genre conventions and tension-building techniques for thriller writing"
allowed-tools: Read, Grep, Glob
---
```

**正文内容：**
- 激活条件：用户提到惊悚、追杀、逃亡、阴谋、紧张等关键词
- 核心惯例：滴答钟、风险升级、信息不对称、喘息节奏
- 子类型识别：根据用户描述判断心理惊悚/政治惊悚/生存惊悚等
- 与悬疑（mystery）的区分：如果更偏"谁干的"引导用 mystery，更偏"能否逃脱"引导用 thriller
- 常见陷阱：紧张感疲劳、反派扁平、主角无敌
- 推荐节奏：惊悚小说的章节节奏建议
- 与其他 Skills 协作：配合 pacing-control 管理紧张节奏

**字数要求：** 300-500 字

### Step 3: 更新 setting-detector 关键词映射

修改 `templates/skills/quality-assurance/setting-detector/SKILL.md`，添加：

```yaml
thriller:
  keywords: [惊悚, 追杀, 逃亡, 阴谋, 紧张, 生存, 威胁, 绑架, 暗杀, 心理战]
  auto_load: genres/thriller.md
```

### Step 4: 提交

```bash
git add templates/knowledge-base/genres/thriller.md
git add templates/skills/genre-knowledge/thriller/SKILL.md
git add templates/skills/quality-assurance/setting-detector/SKILL.md
git commit -m "feat(genres): 添加惊悚小说知识库和 Skill (thriller)"
```

---

## Task 3: 最终验证

### Step 1: 验证 Genre 知识库完整性

```bash
ls templates/knowledge-base/genres/
```

**期望输出：**
```
historical.md
mystery.md
revenge.md
romance.md
sci-fi.md
thriller.md
wuxia.md
```

**总计：** 7 个 Genre 知识库（原有 5 个 + 新增 2 个）

### Step 2: 验证 Genre Skills 完整性

```bash
find templates/skills/genre-knowledge/ -name "SKILL.md"
```

**期望输出：**
```
templates/skills/genre-knowledge/fantasy/SKILL.md
templates/skills/genre-knowledge/mystery/SKILL.md
templates/skills/genre-knowledge/romance/SKILL.md
templates/skills/genre-knowledge/sci-fi/SKILL.md
templates/skills/genre-knowledge/thriller/SKILL.md
```

**总计：** 5 个 Genre Skills（原有 3 个 + 新增 2 个）

### Step 3: 验证 setting-detector 关键词映射

确认 `templates/skills/quality-assurance/setting-detector/SKILL.md` 包含全部 7 个 Genre 的关键词映射。

### Step 4: 最终提交（如有遗漏修改）

```bash
git status
# 如有未提交的修改
git add -A
git commit -m "chore: 验证并完善 Genre 知识库扩展"
```
