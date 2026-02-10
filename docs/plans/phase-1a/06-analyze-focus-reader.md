# Task 6: `/analyze --focus=reader` 读者体验分析

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在 `/analyze` 命令中新增 `--focus=reader` 专项分析模式，分析爽点密度、钩子强度、信息投喂节奏、期待管理，并增强现有 `reader-expectation` Skill

**Architecture:** 分两步实施：(1) 在 `analyze.md` 的专项分析部分（B5.1）新增「专项 7：读者体验分析」；(2) 在 `reader-expectation/SKILL.md` 中增加爽点密度统计和信息密度分析能力。`analyze.md` 的读者体验分析调用增强后的 `reader-expectation` Skill。

**Tech Stack:** Markdown 模板

---

### Task 6.1: 在 analyze.md 决策逻辑中注册新的 --focus=reader

**Files:**
- Modify: `templates/commands/analyze.md:50-56`（专项分析模式列表）

**Step 1: 在专项分析模式列表中添加 reader**

在 `analyze.md` 第 56 行（`--focus=style` 之后）添加新行：

将原来的：
```markdown
**🆕 专项分析模式**（新增）：
- 包含 `--focus=opening` → 开篇专项分析（重点分析前3章）
- 包含 `--focus=pacing` → 节奏专项分析（重点分析爽点/冲突分布）
- 包含 `--focus=character` → 人物专项分析（重点分析人物弧光）
- 包含 `--focus=foreshadow` → 伏笔专项分析（重点分析伏笔埋设与回收）
- 包含 `--focus=logic` → 逻辑专项分析（重点查找逻辑漏洞）
- 包含 `--focus=style` → 风格专项分析（重点检查文笔一致性）
```

改为：
```markdown
**🆕 专项分析模式**（新增）：
- 包含 `--focus=opening` → 开篇专项分析（重点分析前3章）
- 包含 `--focus=pacing` → 节奏专项分析（重点分析爽点/冲突分布）
- 包含 `--focus=character` → 人物专项分析（重点分析人物弧光）
- 包含 `--focus=foreshadow` → 伏笔专项分析（重点分析伏笔埋设与回收）
- 包含 `--focus=logic` → 逻辑专项分析（重点查找逻辑漏洞）
- 包含 `--focus=style` → 风格专项分析（重点检查文笔一致性）
- 包含 `--focus=reader` → 读者体验分析（重点分析爽点密度、钩子强度、信息投喂、期待管理）
```

**Step 2: 验证修改**

Run: `grep -n "focus=reader\|focus=style" templates/commands/analyze.md`
Expected: `--focus=reader` 出现在 `--focus=style` 之后

**Step 3: Commit**

```bash
git add templates/commands/analyze.md
git commit -m "feat(analyze): register --focus=reader in decision logic"
```

---

### Task 6.2: 在 B5.1 专项分析中添加「专项 7：读者体验分析」

**Files:**
- Modify: `templates/commands/analyze.md:781`（专项 6 风格分析结束后）

**Step 1: 在第 781 行（专项 6 风格分析结束后）插入新的专项分析章节**

在 `analyze.md` 的专项 6（风格分析，约第 729-781 行）之后插入：

```markdown

#### 专项 7：读者体验分析（`--focus=reader`）

**触发条件**：`$ARGUMENTS` 包含 `--focus=reader`

**前置加载**：
- 加载 Skill：`templates/skills/writing-techniques/reader-expectation/SKILL.md`
- 加载 Expert：`templates/skills/writing-techniques/reader-expectation/experts/expectation-analyst.md`
- 加载知识库：`templates/knowledge-base/craft/hook-design.md`（如存在）
- 加载 tracking 数据：`plot-tracker.json`、`character-state.json`

**分析维度**：

##### 7.1 爽点密度分析

**定义**：爽点 = 让读者产生满足感/快感的情节事件（打脸、升级、获得、逆袭、真相揭示）

**分析方法**：
1. 逐章扫描，标记每个爽点事件及其类型
2. 计算爽点密度：`爽点数 / 章节数`
3. 计算爽点间隔：相邻爽点之间的章节数

**评分标准**：
| 指标 | 优秀 | 良好 | 需改进 |
|------|------|------|--------|
| 爽点密度 | ≥ 0.8/章 | 0.5-0.8/章 | < 0.5/章 |
| 最大爽点间隔 | ≤ 3 章 | 4-5 章 | > 5 章 |
| 爽点类型多样性 | ≥ 3 种 | 2 种 | 1 种 |

**输出格式**：
```
📊 爽点密度分析
━━━━━━━━━━━━━━━━━━━━
总爽点数：[N] 个（[M] 章中）
爽点密度：[X]/章
最大间隔：第 [A]-[B] 章（[C] 章无爽点）

爽点分布：
第 1 章：⭐ 逆袭（废物觉醒）
第 3 章：⭐ 打脸（击败对手）
第 4 章：⭐ 升级（突破境界）
第 7 章：⭐ 获得（得到神器）
...

⚠️ 警告：第 5-6 章连续无爽点，建议补充
```

##### 7.2 钩子强度分析

**分析方法**：
1. 提取每章最后 300 字
2. 判断钩子类型（悬念/反转/信息/情感/时间压力/选择/无钩子）
3. 评估钩子强度（1-5 星）
4. 检查钩子兑现情况

**评分标准**：
| 指标 | 优秀 | 良好 | 需改进 |
|------|------|------|--------|
| 有钩子章节占比 | ≥ 90% | 70-90% | < 70% |
| 平均钩子强度 | ≥ 3.0 | 2.0-3.0 | < 2.0 |
| 钩子类型多样性 | ≥ 4 种 | 2-3 种 | 1 种 |
| 钩子兑现率 | ≥ 85% | 70-85% | < 70% |

**输出格式**：
```
🪝 钩子强度分析
━━━━━━━━━━━━━━━━━━━━
有钩子章节：[N]/[M]（[X]%）
平均强度：[Y] ⭐
钩子类型分布：悬念 40% | 反转 20% | 情感 20% | 信息 15% | 其他 5%

逐章钩子：
第 1 章：⭐⭐⭐ 悬念（"门外传来脚步声"）
第 2 章：⭐⭐ 信息（"她想起了什么"）
第 3 章：❌ 无钩子 ← ⚠️
第 4 章：⭐⭐⭐⭐ 反转（身份揭露）
...

⚠️ 警告：第 3 章无钩子，建议补充
⚠️ 警告：悬念钩子占比过高（40%），建议增加其他类型
```

##### 7.3 信息投喂节奏分析

**定义**：信息投喂 = 向读者释放新信息（世界观、角色背景、情节线索）的节奏

**分析方法**：
1. 逐章标记新信息释放事件
2. 计算信息密度：`新信息数 / 章节字数`
3. 检测信息过载或信息饥荒

**评分标准**：
| 指标 | 优秀 | 需改进 |
|------|------|--------|
| 信息密度 | 每章 2-4 个新信息点 | < 1 或 > 6 |
| 信息类型平衡 | 世界观/角色/情节均有 | 单一类型 |
| 信息间隔 | 无连续 2 章以上的信息真空 | 有信息真空 |

##### 7.4 期待管理分析

**调用 `reader-expectation` Skill**：

使用 Skill 中定义的期待追踪框架：
1. 识别所有活跃期待（情节承诺、谜题悬念、角色成长、关系弧线、世界观谜题）
2. 计算每个期待的紧急度（使用 Skill 中的公式：`Urgency = (Chapter Interval / Genre Threshold) × Setup Intensity × Type Weight`）
3. 评估期待满足的节奏

**输出格式**：
```
🎯 期待管理分析
━━━━━━━━━━━━━━━━━━━━
活跃期待数：[N] 个
紧急期待（需立即处理）：[M] 个
已满足期待：[K] 个

活跃期待列表：
| 期待 | 类型 | 埋设章节 | 紧急度 | 建议 |
|------|------|---------|--------|------|
| [描述] | 情节承诺 | 第 2 章 | 🔴 0.9 | 下一章必须推进 |
| [描述] | 谜题悬念 | 第 5 章 | ⚠️ 0.6 | 近期需要线索 |
...
```

##### 7.5 综合读者体验评分

**综合评分**（10 分制）：

```
📋 读者体验综合评分
━━━━━━━━━━━━━━━━━━━━
爽点密度：[X]/10
钩子强度：[X]/10
信息投喂：[X]/10
期待管理：[X]/10
━━━━━━━━━━━━━━━━━━━━
综合评分：[X]/10

🏆 最大优势：[描述]
⚠️ 最大短板：[描述]
💡 首要改进建议：[具体建议]
```
```

**Step 2: 验证插入位置**

Run: `grep -n "专项 6\|专项 7\|B5.1\|focus=reader" templates/commands/analyze.md`
Expected: 专项 7 出现在专项 6 之后

**Step 3: Commit**

```bash
git add templates/commands/analyze.md
git commit -m "feat(analyze): add --focus=reader analysis (satisfaction density, hook strength, info pacing, expectation management)"
```

---

### Task 6.3: 在注意事项中添加 reader 分析的使用场景

**Files:**
- Modify: `templates/commands/analyze.md:1082-1125`（专项分析使用场景部分）

**Step 1: 在专项分析使用场景列表中添加 reader 分析**

在现有使用场景列表末尾添加：

```markdown
#### 读者体验分析（`--focus=reader`）
**适用场景**：
- 写了 10+ 章后，想检查读者是否会觉得「爽」
- 担心节奏太慢、爽点不够
- 想检查钩子设计是否有效
- 网文作者的核心分析需求

**前置建议**：
- 至少完成 5 章以上内容
- 建议先执行 `/track` 确保 tracking 数据最新
- 如有 `hook-design.md` 知识库，分析会更精准

**后续行动**：
- 爽点不足 → 在 `/plan` 中补充爽点规划
- 钩子弱 → 参考 `hook-design.md` 改进章节结尾
- 期待管理问题 → 使用 `/recap` 查看伏笔状态
```

**Step 2: Commit**

```bash
git add templates/commands/analyze.md
git commit -m "feat(analyze): add --focus=reader usage scenarios in notes section"
```

---

### Task 6.4: 增强 reader-expectation Skill

**Files:**
- Modify: `templates/skills/writing-techniques/reader-expectation/SKILL.md`

**Step 1: 在 SKILL.md 末尾添加新的分析能力章节**

在 `reader-expectation/SKILL.md` 文件末尾添加：

```markdown

---

## 扩展能力：读者体验量化分析

> 以下能力在 `/analyze --focus=reader` 调用时激活

### 爽点密度统计

**爽点定义**：让读者产生满足感/快感的情节事件

**爽点类型分类**：
| 类型 | 描述 | 典型场景 | 爽感强度 |
|------|------|---------|---------|
| 打脸 | 主角碾压看不起他的人 | 宗门大比、退婚后重逢 | ⭐⭐⭐⭐⭐ |
| 升级 | 境界/能力突破 | 闭关突破、战斗中领悟 | ⭐⭐⭐⭐ |
| 获得 | 得到珍贵资源/法宝 | 秘境探险、拍卖会 | ⭐⭐⭐ |
| 逆袭 | 从劣势翻盘 | 绝境反击、废物觉醒 | ⭐⭐⭐⭐⭐ |
| 揭秘 | 重要真相揭示 | 身世之谜、阴谋揭露 | ⭐⭐⭐⭐ |
| 认可 | 获得他人认可/尊重 | 师父认可、敌人敬佩 | ⭐⭐⭐ |

**统计方法**：
1. 逐章扫描内容，识别爽点事件
2. 标记爽点类型和强度
3. 计算密度和间隔
4. 与类型基准对比（网文建议 ≥ 0.8/章，文学作品 ≥ 0.3/章）

### 信息密度分析

**信息类型**：
- **世界观信息**：新的设定、规则、历史
- **角色信息**：新角色登场、角色背景揭示、角色关系变化
- **情节信息**：新线索、新冲突、新目标

**密度计算**：
```
信息密度 = 新信息点数 / 章节字数 × 1000
```

**健康范围**：
- 网文：2-5 信息点/千字（太少无聊，太多信息过载）
- 文学：1-3 信息点/千字

### 与期待管理的整合

当进行读者体验分析时，将爽点和信息投喂与期待管理结合：
- 爽点是否对应了某个期待的满足？
- 信息释放是否推进了某个悬念？
- 是否有期待被满足但没有产生爽感？（满足方式不够精彩）
```

**Step 2: 验证修改**

Run: `grep -n "爽点密度\|信息密度\|扩展能力" templates/skills/writing-techniques/reader-expectation/SKILL.md`
Expected: 在文件末尾看到新增内容

**Step 3: Commit**

```bash
git add templates/skills/writing-techniques/reader-expectation/SKILL.md
git commit -m "feat(skill): enhance reader-expectation with satisfaction density and info density analysis"
```
