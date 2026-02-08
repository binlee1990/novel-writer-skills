# Craft/Dialogue 知识库实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标：** 创建对话技巧写作知识库文件，填补 templates/knowledge-base/craft/dialogue.md 的缺失

**架构：** 基于现有 genres/ 知识库格式，编写 500-800 行的专业对话写作指南，与 setting-detector Skill 集成，支持关键词自动激活

**技术栈：** Markdown 文档，YAML 前置元数据（可选），遵循项目知识库格式规范

---

## 背景与动机

### 问题
- templates/knowledge-base/README.md (第 37-47 行) 明确列出了 5 个 craft 知识库文件
- craft/dialogue.md 被列为第一个，但实际文件不存在
- 这是 PRD 承诺但未兑现的内容债务（P0 优先级）

### 价值
1. **补全知识库体系** - craft/ 目录完全空白，此为首个文件
2. **自动激活支持** - 当用户提到"对话""台词"等关键词时自动加载
3. **跨题材通用** - 对话技巧适用于所有小说类型
4. **与现有 Skill 互补** - skills/writing-techniques/dialogue-techniques/SKILL.md 提供实时建议，knowledge-base 提供深度参考

### 参考文件
- `templates/knowledge-base/genres/romance.md` - 了解知识库格式（948 行）
- `templates/knowledge-base/styles/natural-voice.md` - 对话相关内容可参考
- `templates/skills/writing-techniques/dialogue-techniques/SKILL.md` - 相关 Skill，避免重复
- `templates/knowledge-base/README.md` - 关键词映射规范

---

## Task 1: 研究现有知识库格式和对话相关内容

**Files:**
- Read: `templates/knowledge-base/genres/romance.md` (全文)
- Read: `templates/knowledge-base/styles/natural-voice.md` (全文)
- Read: `templates/skills/writing-techniques/dialogue-techniques/SKILL.md` (全文)
- Read: `templates/knowledge-base/README.md` (lines 37-47, 96-118)

**Step 1: 读取 romance.md 全文**

```bash
# 使用 Read 工具读取
Read: templates/knowledge-base/genres/romance.md
```

**目的：** 理解知识库的标准格式结构
- 章节组织方式
- 示例的编写风格
- "❌ 错误" vs "✅ 正确" 对比格式
- Quick Reference、Core Principles、Common Pitfalls 等标准章节

**Step 2: 读取 natural-voice.md 全文**

```bash
Read: templates/knowledge-base/styles/natural-voice.md
```

**目的：** 提取对话相关的内容要点
- 第 52-69 行：对话推动情节原则
- 可能包含对话示例和技巧

**Step 3: 读取 dialogue-techniques SKILL.md**

```bash
Read: templates/skills/writing-techniques/dialogue-techniques/SKILL.md
```

**目的：** 避免与 Skill 内容重复
- Skill 侧重：实时写作建议、快速检查清单
- Knowledge Base 侧重：深度理论、详细案例、系统化技法

**Step 4: 提取关键词映射规范**

```bash
Read: templates/knowledge-base/README.md (lines 96-118)
```

**目的：** 了解关键词如何映射到知识库
- 格式：`dialogue: triggers: [对话, 角色说话, 台词, 交流场景, 谈话]`
- 确认是否需要更新 README.md

---

## Task 2: 设计 dialogue.md 内容大纲

**Files:**
- Create: `docs/plans/dialogue-knowledge-outline.md` (临时大纲文件)

**Step 1: 设计内容结构**

基于研究结果，设计以下章节：

```markdown
# 对话技巧写作知识库

## 快速参考（Quick Reference）
[3-5 段核心原则概述]

## 核心原则（Core Principles）

### 1. 对话的三重功能
- 揭示角色性格
- 推动情节发展
- 营造氛围与张力

### 2. 潜台词的艺术
- 表面意思 vs 真实意图
- 冲突中的隐藏信息
- 示例对比

### 3. 角色声音的差异化
- 用词选择
- 句式结构
- 口头禅与语言习惯
- 教育/阶层/地域的影响

### 4. 对话的节奏与动态
- 打断与重叠
- 停顿的意义
- 快节奏 vs 慢节奏对话

### 5. 对话标签与动作描写
- 何时使用"他说"
- 动作描写代替标签
- 避免过度修饰

## 实践应用（Practical Application）

### 在 /specify 阶段
- 定义角色对话风格差异

### 在 /plan 阶段
- 规划关键对话场景

### 在 /write 阶段
- 实时检查对话自然度
- 潜台词检验清单

### 在 /analyze 阶段
- 对话质量分析标准

## 常见陷阱（Common Pitfalls）

### 1. 信息倾泻（Info Dumping）
[示例]

### 2. 过度解释情绪
[示例]

### 3. 所有角色说话方式相同
[示例]

### 4. 对话标签过度修饰
[示例]

### 5. 缺乏冲突的对话
[示例]

## 示例分析（Examples）

### 案例 1: 冲突对话的潜台词
[完整对话片段 + 分析]

### 案例 2: 性格差异化的对话
[3-4 个角色的对话对比]

### 案例 3: 推动情节的对话
[情节转折场景]

## 进阶技巧（Advanced Techniques）

### 1. 集体对话的管理
- 3 人以上的对话场景
- 避免读者混淆

### 2. 方言与口音的处理
- 适度表现
- 避免难以阅读

### 3. 内心独白 vs 外部对话
- 何时使用哪种

### 4. 沉默的力量
- 不说话也是对话

## 检查清单（Checklist）

每场对话写完后检查：
- [ ] 是否推动情节或揭示角色？
- [ ] 是否有潜台词？
- [ ] 每个角色声音是否有区别？
- [ ] 是否有足够的冲突/张力？
- [ ] 对话标签是否简洁？
- [ ] 是否避免了信息倾泻？

## 与 Commands 的集成

[详细说明如何在各命令中应用]
```

**Step 2: 记录大纲到临时文件**

```bash
# 将大纲保存到 docs/plans/dialogue-knowledge-outline.md
# 用于后续内容编写参考
```

---

## Task 3: 编写 dialogue.md 核心内容

**Files:**
- Create: `templates/knowledge-base/craft/dialogue.md`

**Step 1: 编写文件头和快速参考**

```markdown
# 对话技巧写作知识库

## 快速参考（Quick Reference）

好的对话不仅仅是"角色在说话"——它是小说中最高效的工具之一。

**对话的三重黄金法则**：
1. **每句对话必须服务于目的** - 揭示角色、推进情节、或营造氛围（最好同时做到 2 项）
2. **说什么不重要，不说什么才重要** - 潜台词比表面话语更有力量
3. **每个角色都应该有独特的声音** - 闭上眼睛听，能分辨出谁在说话

**核心公式**：
```
优秀对话 = 明确目的 + 潜台词 + 角色独特性 + 适度冲突
```

**不是对话的作用**：
- ❌ 向读者传递作者想说的信息（信息倾泻）
- ❌ 解释角色的感受（"我很生气"）
- ❌ 填充页面让章节显得更长
```

**预估字数：** 50-80 行

**Step 2: 编写核心原则第一部分**

```markdown
## 核心原则（Core Principles）

### 1. 对话的三重功能

好的对话从不"只是聊天"。每一段对话都应该至少完成以下一项功能，最好同时完成两项甚至三项：

#### A. 揭示角色性格

对话是展现角色性格最直接的方式。

❌ **糟糕示例**（直接叙述）：
```
林晓是一个性格谨慎、凡事三思而后行的人。
```

✅ **优秀示例**（通过对话揭示）：
```
"你确定吗？"林晓又问了一遍。
"确定！"
"那万一……"
"没有万一。"
"可是如果……"
张伟终于忍不住了："你能不能别总是这样！"
```

**为什么更好**：
- 读者从对话中自然推导出林晓的性格
- 展示而非讲述（Show, Don't Tell）
- 同时揭示了张伟的性格（急躁、直接）
- 产生了人物冲突

#### B. 推动情节发展
[继续编写...]
```

**预估字数：** 200-300 行

**Step 3: 编写潜台词章节**

```markdown
### 2. 潜台词的艺术

**核心原则**：人们很少直接说出真实意图。

真实对话中，人们会：
- 避免直接冲突（社交礼貌）
- 隐藏真实情感（自我保护）
- 通过暗示表达（试探对方）
- 说反话或讽刺（情绪表达）

#### 潜台词的层次

**表面层**：字面意义
**情感层**：真实感受
**关系层**：权力动态和亲密度
**主题层**：与故事主题的联系

#### 示例分析：误会场景

❌ **直白对话**（无潜台词）：
```
"你昨晚为什么没回我消息？"
"因为我在加班，手机静音了。"
"哦,原来是这样,我还以为你不想理我了。"
"没有,我一直很在意你。"
```

✅ **富含潜台词的对话**：
```
"昨晚睡得好吗？"
"还行。"
"我给你发了消息。"
"嗯,看到了。"
"……那你怎么没回？"
"手机静音。"
"静音一整晚？"
他没接话。
"算了,不重要。"她转身要走。
"等等——"
```

**潜台词解读**：
- "睡得好吗"（表面：关心）→（实际：试探，你是不是故意不回我）
- "还行"（表面：普通回答）→（实际：防御，不想解释）
- "静音一整晚？"（表面：疑问）→（实际：不相信，质疑）
- "算了,不重要"（表面：放弃）→（实际：很重要，在赌气）

**为什么有张力**：
- 双方都没有直接表达情绪
- 冲突隐藏在平淡的对话下
- 读者需要解读潜台词
- 更贴近真实人际交往
[继续...]
```

**预估字数：** 150-200 行

**Step 4: 编写角色声音差异化章节**

```markdown
### 3. 角色声音的差异化

**测试标准**：去掉对话标签，读者是否仍能分辨谁在说话？

如果答案是"不能"，说明角色缺乏独特的声音。

#### 塑造独特声音的五个维度

##### A. 用词选择

不同角色使用不同的词汇范围：

| 角色类型 | 词汇特征 | 示例 |
|---------|---------|------|
| 受过高等教育 | 书面语、专业术语 | "这个方案在理论层面是可行的" |
| 街头混混 | 俚语、粗话 | "这事儿能整不？" |
| 老年人 | 老派用语 | "这孩子真是懂事儿" |
| 年轻人 | 网络流行语 | "绝了！这也太离谱了吧" |
| 技术宅 | 技术术语 | "这个算法的时间复杂度是 O(n)" |

**示例对比**：

同一个意思，不同角色的表达方式：

**情境**：表达不满

```
教授："我对这个决定持保留意见。"
工人："这不扯淡吗？"
老太太："唉，你们年轻人啊……"
青少年："无语了家人们。"
```

##### B. 句式结构
[继续...]
```

**预估字数：** 200-250 行

**Step 5: 编写常见陷阱章节**

**预估字数：** 150-200 行

**Step 6: 编写示例分析和检查清单**

**预估字数：** 100-150 行

**总预估字数：** 500-800 行（符合知识库标准长度）

---

## Task 4: 更新 README.md 关键词映射表

**Files:**
- Modify: `templates/knowledge-base/README.md` (lines 96-118)

**Step 1: 在 README.md 添加 dialogue 关键词映射**

```markdown
### 写作技法关键词

```yaml
dialogue:
  triggers: [对话, 台词, 交流, 谈话, 说话, 角色对话, 对话场景, 会话]
  auto_load: craft/dialogue.md

scene-structure:
  triggers: [场景, 章节结构, 情节推进, 场景设计]
  auto_load: craft/scene-structure.md

[其他...]
```
```

**Step 2: 验证修改正确**

```bash
# 检查 YAML 格式是否正确
cat templates/knowledge-base/README.md | grep -A 3 "dialogue:"
```

Expected: 显示完整的 dialogue 映射条目

---

## Task 5: 验证知识库格式和集成

**Files:**
- Read: `templates/knowledge-base/craft/dialogue.md`
- Test: 关键词检测逻辑（概念验证）

**Step 1: 验证文件格式**

```bash
# 检查文件行数
wc -l templates/knowledge-base/craft/dialogue.md

# 检查章节结构
grep "^##" templates/knowledge-base/craft/dialogue.md
```

Expected:
- 行数：500-800 行之间
- 包含标准章节：Quick Reference, Core Principles, Practical Application, Common Pitfalls, Examples

**Step 2: 验证示例格式**

```bash
# 检查是否使用了标准的对比格式
grep -c "❌" templates/knowledge-base/craft/dialogue.md
grep -c "✅" templates/knowledge-base/craft/dialogue.md
```

Expected: 至少各出现 5 次以上

**Step 3: 验证 Markdown 语法**

使用 Markdown linter（如果有）或手动检查：
- 代码块是否正确闭合
- 列表格式是否一致
- 标题层级是否正确

**Step 4: 概念验证关键词激活**

在 Claude Code 中测试：
```
用户输入："我要写对话场景，怎么让角色说话更自然？"
```

Expected:
- setting-detector 应该检测到"对话场景"关键词
- 建议加载 craft/dialogue.md
- （注：完整测试需要在实际项目中进行）

---

## Task 6: 创建文档和提交

**Files:**
- Create: `CHANGELOG.md` entry
- Commit message

**Step 1: 更新 CHANGELOG**

```markdown
## [Unreleased]

### Added

- ✨ **craft/dialogue.md** - 对话技巧写作知识库（500+ 行专业指南）
  - 潜台词的艺术
  - 角色声音差异化
  - 对话的三重功能
  - 常见陷阱与示例分析
  - 与七步方法论各命令的集成
```

**Step 2: 创建 Git commit**

```bash
git add templates/knowledge-base/craft/dialogue.md
git add templates/knowledge-base/README.md
git add CHANGELOG.md

git commit -m "feat(knowledge-base): 添加 craft/dialogue.md 对话技巧知识库

- 实现 PRD 规划的写作技法知识库第一项
- 500+ 行专业对话写作指南
- 包含潜台词、角色声音、对话功能等核心原则
- 更新 README.md 关键词映射表
- 支持 setting-detector 自动激活

Closes: P0 优先级任务 #1"
```

---

## 验证标准

### 完成标准
- [x] craft/dialogue.md 文件存在
- [x] 文件长度 500-800 行
- [x] 包含所有标准章节
- [x] 至少 10 组 ❌/✅ 对比示例
- [x] README.md 更新关键词映射
- [x] CHANGELOG.md 记录新增功能
- [x] Git commit 提交

### 质量标准
- [x] 内容与 dialogue-techniques Skill 互补（不重复）
- [x] 示例清晰易懂
- [x] 格式与现有知识库一致
- [x] 关键词能被 setting-detector 正确识别

---

## 后续任务

完成此任务后，按相同模式实现：
1. craft/scene-structure.md
2. craft/character-arc.md
3. craft/pacing.md
4. craft/show-not-tell.md

---

**预估工作量：** 2-3 小时（研究 30 分钟 + 编写 90-120 分钟 + 验证 30 分钟）
