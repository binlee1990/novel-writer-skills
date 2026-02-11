---
name: checklist
description: 生成或执行质量检查清单（规格验证 + 内容扫描）
allowed-tools: Read, Bash, Write, Edit, Glob, Grep
model: claude-sonnet-4-5-20250929
scripts:
  sh: .specify/scripts/bash/common.sh
  ps: .specify/scripts/powershell/common.ps1
---

# 质量检查清单（Checklist）

生成或执行质量检查清单，支持两种模式：

## 🎯 支持的检查类型

### 第一类：规格质量检查（问题生成式）
验证规划文档本身的质量（类似"需求的单元测试"）：

- `大纲质量` - 检查 outline.md 的完整性、清晰度、一致性
- `角色设定` - 检查 spec/knowledge/characters.md
- `世界观` - 检查 spec/knowledge/world-setting.md 及相关文档
- `创作计划` - 检查 creative-plan.md / specification.md
- `伏笔管理` - 检查 spec/tracking/plot-tracker.json 的伏笔定义

### 第二类：内容验证检查（结果报告式）
扫描已写章节，验证实际内容：

- `世界观一致性` - 扫描章节内容，检查世界观描述矛盾
- `情节对齐` - 对比进度与大纲，检查情节发展
- `数据同步` - 验证所有 tracking JSON 文件的同步性
- `时间线` - 检查时间事件的逻辑连续性
- `写作状态` - 检查写作准备度和任务状态

## 用户输入

```text
$ARGUMENTS
```

## 🆕 前置资源加载

**运行脚本** `{SCRIPT}` 检查创作状态（如果配置了 scripts）

**加载检查清单辅助资源**：

### 默认加载

自动加载以下资源用于生成检查清单：
- `.specify/memory/constitution.md`（创作宪法）
- `stories/*/specification.md`（故事规格）
- `stories/*/tasks.md`（当前任务）
- `spec/tracking/plot-tracker.json`（情节追踪）
- `spec/tracking/character-state.json`（角色状态）

### 可选加载

如果 `specification.md` 配置了 `resource-loading.checklist`：

```yaml
resource-loading:
  checklist:  # /checklist 命令专用配置
    knowledge-base:
      craft:
        - scene-structure  # 场景结构检查清单
        - pacing           # 节奏检查清单
    skills:
      quality-assurance:
        - consistency-checker  # 一致性检查项
```

**加载优先级**：
- 检查清单辅助资源的优先级**低于**宪法和规格
- 检查清单辅助资源用于**生成更全面的检查项**

### 🆕 Layer 3: 关键词触发（可选）

**触发时机**: 命令参数（如 `/checklist --focus 节奏`）

**配置**: 读取 `specification.md` 的 `resource-loading.keyword-triggers.enabled`

**如果 `enabled: true` 且参数包含关键词**:

检测参数中的关键词，提示加载相关资源：

```markdown
💡 检测到 "--focus 节奏"，建议加载：
- craft/pacing.md

是否加载？ [Y/N]
```

**默认行为**: 如果未配置 keyword-triggers，此步骤不执行。

## 执行流程

### 1. 识别检查类型

根据用户输入，确定检查类型（规格质量 vs 内容验证）：

**关键词映射**：
- "大纲"、"质量" → 规格质量类：大纲质量
- "角色"、"设定" → 规格质量类：角色设定
- "世界观" + "质量/完整性/规格" → 规格质量类：世界观
- "世界观" + "一致性/检查/扫描" → 内容验证类：世界观一致性
- "创作计划"、"规划" → 规格质量类：创作计划
- "伏笔" → 规格质量类：伏笔管理
- "情节"、"对齐"、"进度" → 内容验证类：情节对齐
- "数据"、"同步"、"一致性" → 内容验证类：数据同步
- "时间线"、"时间" → 内容验证类：时间线
- "写作状态"、"准备" → 内容验证类：写作状态

如果用户输入不明确，询问选择。

### 2. 执行对应的检查逻辑

#### 规格质量类检查（生成问题式 Checklist）

执行类似 spec-kit 的需求质量验证逻辑：

##### 2.1 大纲质量检查

**目标**：验证 outline.md 是否具备良好的完整性、清晰度和一致性。

**读取文件**：
- `outline.md` 或 `stories/*/outline.md`
- `spec/tracking/plot-tracker.json`（如果存在）

**生成检查项维度**：

**完整性 (Completeness)**：
- 是否为每个主要情节节点定义了触发条件和结果？
- 是否明确每个卷/章的故事目标？
- 是否覆盖所有主要角色的成长弧？
- 是否定义了主要冲突的升级路径？
- 是否明确故事的高潮和结局？

**清晰度 (Clarity)**：
- 情节节点的触发条件是否具体可验证？
- 章节分配是否有明确的依据（如字数、情节密度）？
- 角色动机是否用具体事件量化？
- 场景描述是否避免模糊词汇（"某个地方"、"一段时间"）？

**一致性 (Consistency)**：
- 情节线索前后是否矛盾？
- 角色行为是否符合设定？
- 时间跨度是否合理？
- 世界观规则是否与大纲描述一致？

**可测量性 (Measurability)**：
- 章节分配是否合理可行（如每章2000-4000字）？
- 伏笔回收时机是否明确（章节号或章节范围）？
- 角色成长是否有明确的里程碑？

**覆盖范围 (Coverage)**：
- 是否考虑了所有主要场景类型（冲突、日常、转折）？
- 是否覆盖了所有主要角色的戏份？
- 是否包含必要的伏笔铺设和回收？

**输出格式示例**：
```markdown
# 大纲质量检查清单
**创建时间**: 2025-10-11
**检查对象**: outline.md
**检查维度**: 完整性、清晰度、一致性、可测量性、覆盖范围

## 完整性 (Completeness)

- [ ] CHK001 是否为每个主要情节节点定义了触发条件和结果？ [Spec §大纲3.2]
- [ ] CHK002 是否明确每个卷/章的故事目标？ [Gap]
- [ ] CHK003 是否覆盖所有主要角色的成长弧？ [Spec §大纲5.1]

## 清晰度 (Clarity)

- [ ] CHK004 情节节点的触发条件是否具体可验证？ [Ambiguity, Spec §大纲3.2]
- [ ] CHK005 章节分配是否有明确的依据？ [Clarity]

## 一致性 (Consistency)

- [ ] CHK006 情节线索前后是否矛盾？ [Consistency]
- [ ] CHK007 世界观规则是否与大纲描述一致？ [Consistency, vs §世界观]

## 可测量性 (Measurability)

- [ ] CHK008 章节分配是否合理可行（如每章2000-4000字）？ [Measurability]
- [ ] CHK009 伏笔回收时机是否明确（章节号或范围）？ [Gap]

## 覆盖范围 (Coverage)

- [ ] CHK010 是否考虑了所有主要场景类型？ [Coverage]
- [ ] CHK011 是否包含必要的伏笔铺设和回收？ [Coverage, Gap]

## 使用说明

勾选已验证项：`[x]`
标记问题项：`[!]` 并在下方记录具体问题
```

##### 2.2 角色设定检查

**读取文件**：
- `spec/knowledge/characters.md`
- `spec/tracking/character-state.json`
- `spec/tracking/relationships.json`

**生成检查项维度**：

**完整性**：
- 主要角色是否定义了基本信息（姓名、年龄、身份、外貌）？
- 是否定义了角色的核心动机和目标？
- 是否定义了角色的性格特征和行为模式？
- 是否定义了角色的背景故事？
- 是否定义了角色的能力和局限？

**清晰度**：
- 角色动机是否具体可验证（非"想要成功"而是"想通过科举改变家族命运"）？
- 性格特征是否通过具体行为体现？
- 角色目标是否可量化或有明确的达成标准？

**一致性**：
- 角色设定与大纲中的行为是否一致？
- 不同文档中的角色描述是否一致？
- 角色关系定义是否对称（A对B的关系 vs B对A的关系）？

**可测量性**：
- 角色成长是否有明确的阶段划分？
- 角色能力变化是否可追踪？

##### 2.3 世界观检查

**读取文件**：
- `spec/knowledge/world-setting.md`
- `spec/knowledge/locations.md`
- `spec/knowledge/culture.md`
- `spec/knowledge/rules.md`

**生成检查项维度**：

**完整性**：
- 是否定义了核心世界观规则（魔法体系、科技水平、社会结构）？
- 是否定义了主要地点及其特征？
- 是否定义了文化风俗、语言、传统？
- 是否定义了时代背景和历史脉络？

**清晰度**：
- 世界观规则是否明确无歧义？
- 地理位置、距离、方位是否清晰？
- 特殊术语是否有明确定义？

**一致性**：
- 不同文档中的世界观设定是否一致？
- 世界观规则是否存在内部矛盾？
- 与大纲描述是否一致？

**覆盖范围**：
- 是否覆盖了故事涉及的所有地点？
- 是否定义了所有出现的特殊规则或能力？

##### 2.4 创作计划检查

**读取文件**：
- `creative-plan.md` 或 `specification.md`
- `tasks.md`

**生成检查项维度**：

**完整性**：
- 是否定义了创作目标和里程碑？
- 是否明确了创作流程和步骤？
- 是否定义了质量标准？

**清晰度**：
- 任务划分是否清晰具体？
- 时间安排是否合理？
- 验收标准是否明确？

**一致性**：
- 计划是否与大纲规模匹配？
- 任务是否涵盖所有规划内容？

##### 2.5 伏笔管理检查

**读取文件**：
- `spec/tracking/plot-tracker.json`
- `outline.md`

**生成检查项维度**：

**完整性**：
- 是否记录了所有规划的伏笔？
- 每个伏笔是否定义了铺设章节和回收章节？
- 是否定义了伏笔的类型和重要性？

**清晰度**：
- 伏笔内容描述是否清晰？
- 回收方式是否明确？

**可测量性**：
- 回收时机是否有明确的章节号或范围？
- 是否定义了铺设密度（避免过多未回收伏笔）？

**一致性**：
- 伏笔是否与大纲情节匹配？
- planted 和 resolved 字段是否一致？

#### 内容验证类检查（执行脚本生成报告）

这些检查需要扫描实际写作内容，调用对应的 bash 脚本：

##### 2.5 世界观一致性检查

执行命令：
```bash
bash .specify/scripts/bash/check-world.sh --checklist
```

如果脚本不存在，提示用户该功能正在开发中。

##### 2.6 情节对齐检查

执行命令：
```bash
bash .specify/scripts/bash/check-plot.sh --checklist
```

##### 2.7 数据同步检查

执行命令：
```bash
bash .specify/scripts/bash/check-consistency.sh --checklist
```

##### 2.8 时间线检查

执行命令：
```bash
bash .specify/scripts/bash/check-timeline.sh check --checklist
```

##### 2.9 写作状态检查

**目标**：检查写作准备度，确保所有必要资源就绪。

**检查项**：

**风格指南状态**：
- [ ] personal-voice.md 是否存在？
- [ ] 如果不存在且已写 3+ 章，是否需要执行风格学习？
- [ ] 风格指南是否过时（最后更新 > 10 章前）？

**规格文档状态**：
- [ ] specification.md 是否存在且完整？
- [ ] outline.md 是否存在？
- [ ] 角色设定是否完整？

**追踪数据状态**：
- [ ] plot-tracker.json 是否存在？
- [ ] character-state.json 是否存在？
- [ ] 追踪数据是否与已写章节同步？

**任务状态**：
- [ ] tasks.md 是否存在？
- [ ] 当前任务是否明确？
- [ ] 是否有阻塞任务？

**实现方式**：

如果存在脚本，执行：
```bash
bash .specify/scripts/bash/check-writing-state.sh --checklist
```

否则，手动检查上述项目并生成报告。

**风格学习集成**：

如果检测到 personal-voice.md 不存在且已写 3+ 章：
```markdown
⚠️ 风格指南缺失

检测到：
- 已写章节：5 章
- personal-voice.md：不存在

建议：
执行风格学习生成个性化风格指南：
  /style-learning

或手动创建：
  .specify/memory/personal-voice.md
```

### 3. 输出 Checklist

**保存位置**：`spec/checklists/`

**文件命名规则**：
- 规格质量类：`[类型]-quality.md`（如 `outline-quality.md`）
- 内容验证类：`[类型]-[日期].md`（如 `world-consistency-20251011.md`）

**输出格式**：使用 `templates/checklist-template.md` 作为模板。

### 4. 报告结果

输出：
- Checklist 文件路径
- 检查项总数
- 检查类型和范围
- 如何使用 checklist 的说明

## 示例用法

```bash
# 规格质量检查
/checklist 大纲质量
/checklist 角色设定
/checklist 世界观

# 内容验证检查
/checklist 世界观一致性
/checklist 情节对齐
/checklist 数据同步
```

## 注意事项

1. **规格质量类 checklist**：用于写作前的规划验证，发现文档本身的质量问题
2. **内容验证类 checklist**：用于写作后的内容检查，发现实际产出的问题
3. 两类 checklist 互补，建议：规划阶段使用第一类，写作阶段使用第二类
4. 所有 checklist 保存在 `spec/checklists/` 目录，便于追踪历史检查记录

## 向后兼容说明

旧命令 `/world-check` 和 `/plot-check` 仍然可用，但推荐使用统一的 `/checklist` 命令。

---

## 增强功能

### 阶段性检查模板

根据创作阶段自动选择对应的检查清单：

#### 写前检查（/checklist --pre-write）

在开始写新章节之前运行：

```
📋 写前检查 — 第 [N] 章
━━━━━━━━━━━━━━━━━━━━

上下文准备：
  □ 已阅读前一章结尾（衔接）
  □ 已确认本章计划（creative-plan.md）
  □ 已确认本章任务（tasks.md）

角色准备：
  □ 本章出场角色已确认
  □ 角色当前状态已了解（位置、情绪、目标）
  □ 角色语言指纹已加载

情节准备：
  □ 本章需要推进的情节线已确认
  □ 本章需要处理的伏笔已确认
  □ 本章的爽点/钩子已规划

世界观准备：
  □ 本章涉及的场景/地点已确认
  □ 力量体系相关设定已确认（如有战斗）
```

#### 写后检查（/checklist --post-write）

在完成章节写作后运行：

```
📋 写后检查 — 第 [N] 章
━━━━━━━━━━━━━━━━━━━━

内容质量：
  □ 章节字数在合理范围（2000-4000 字）
  □ 开头有吸引力（前 200 字）
  □ 结尾有钩子
  □ 无明显的 AI 痕迹

一致性：
  □ 角色行为符合设定
  □ 对话符合角色语言指纹
  □ 时间线无冲突
  □ 力量体系无矛盾

节奏：
  □ 有至少一个小爽点
  □ 节奏与前后章节协调
  □ 信息密度适中（不过载也不空洞）

追踪：
  □ tracking 数据已同步
  □ 新伏笔已记录
  □ 角色状态已更新
```

#### 卷末检查（/checklist --volume-end）

在完成一卷后运行：

```
📋 卷末检查 — 第 [N] 卷
━━━━━━━━━━━━━━━━━━━━

结构完整性：
  □ 本卷主要冲突已解决（或推向高潮）
  □ 本卷伏笔回收率 > 70%
  □ 本卷有明确的高潮章节
  □ 卷末有承上启下的钩子

角色发展：
  □ 主角在本卷有明显成长/变化
  □ 重要配角有足够戏份
  □ 角色关系有推进

节奏回顾：
  □ 整卷节奏张弛有度
  □ 无连续 3+ 章的节奏单一
  □ 爽点分布合理

数据同步：
  □ 所有 tracking 数据已同步
  □ 角色状态已更新至最新
  □ 情节线进度已更新
```

### 自定义检查项

用户可以添加自己的检查项，保存在 `spec/custom-checklist.json` 中：

**添加**：`/checklist --add "检查项内容" --stage=post-write`
**删除**：`/checklist --remove [检查项ID]`
**查看**：`/checklist --custom`

#### 自定义检查项数据结构

```json
{
  "customChecks": [
    {
      "id": "custom-001",
      "content": "确认主角没有使用「我」（本书为第三人称）",
      "stage": "post-write",
      "category": "一致性"
    },
    {
      "id": "custom-002",
      "content": "确认战斗场景不超过 800 字（本书偏轻松风格）",
      "stage": "post-write",
      "category": "风格"
    }
  ]
}
```

### 自动修复建议

对于检查未通过的项目，自动生成修复建议和可执行的命令：

```
📋 检查结果 — 第 [N] 章
━━━━━━━━━━━━━━━━━━━━

✅ 通过：8/12
⚠️ 警告：2/12
❌ 未通过：2/12

❌ 未通过项：

1. 结尾缺少钩子
   当前结尾："他回到了房间，躺在床上睡着了。"
   修复建议：
   A. 添加悬念："他回到房间，却发现桌上多了一封信——上面只有三个字。"
   B. 添加预告："他躺在床上，不知道明天等待他的将是一场改变命运的相遇。"
   → 运行 /revise ch[N] --focus=ending 修改结尾

2. tracking 数据未同步
   落后章节：第 [N] 章
   → 运行 /track --sync 同步数据
```

---
## 🔗 命令链式提示

**命令执行完成后，自动附加下一步建议**：

```
💡 下一步建议：
1️⃣ `/revise` — 基于检查清单结果修复发现的问题
2️⃣ `/analyze` — 执行更深入的内容质量分析
3️⃣ `/write [章节号]` — 检查通过后继续写作
```
