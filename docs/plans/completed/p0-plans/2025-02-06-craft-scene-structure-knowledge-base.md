# Craft/Scene-Structure 知识库实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标：** 创建场景结构写作知识库文件 templates/knowledge-base/craft/scene-structure.md

**架构：** 基于经典场景结构理论（Scene/Sequel、目标-冲突-灾难模型），编写 600-800 行的系统化场景构建指南

**技术栈：** Markdown 文档，遵循项目知识库格式规范

---

## 背景与动机

### 问题
- templates/knowledge-base/README.md (第42行) 列出 craft/scene-structure.md 但文件不存在
- PRD 承诺的 5 个 craft 知识库之一
- P0 优先级任务

### 价值
1. **系统化场景构建方法** - 提供可复用的场景设计框架
2. **解决常见问题** - 场景拖沓、缺乏张力、过渡生硬等
3. **跨题材通用** - 适用于所有小说类型
4. **与 Skill 互补** - skills/writing-techniques/scene-structure/ Skill（如果存在）提供实时建议，knowledge-base 提供深度理论

### 核心理论基础
- **Scene/Sequel 模型** (Dwight Swain)
- **目标-冲突-灾难** (Goal-Conflict-Disaster)
- **反应-困境-决定** (Reaction-Dilemma-Decision)
- **场景节奏** (Pacing within scenes)

---

## Task 1: 研究现有资源和理论基础

**Files:**
- Read: `templates/knowledge-base/genres/romance.md` (场景相关部分)
- Read: `templates/knowledge-base/genres/mystery.md` (场景相关部分)
- Read: `templates/skills/writing-techniques/scene-structure/SKILL.md` (如果存在)

**Step 1: 读取现有知识库中的场景内容**

```bash
# 搜索场景相关内容
grep -n "场景\|Scene" templates/knowledge-base/genres/*.md
```

**目的：** 提取已有的场景知识，避免重复

**Step 2: 整理经典场景理论**

核心概念：
1. **Scene（场景）**：行动发生的地方
   - Goal（目标）：角色想要什么
   - Conflict（冲突）：障碍和对抗
   - Disaster（灾难）：失败或意外转折

2. **Sequel（续场）**：反应和决策的地方
   - Reaction（反应）：情感反应
   - Dilemma（困境）：分析选项
   - Decision（决定）：做出选择，进入下一个 Scene

---

## Task 2: 设计 scene-structure.md 内容大纲

**Files:**
- Create: `docs/plans/scene-structure-outline.md` (临时大纲)

**内容结构：**

```markdown
# 场景结构写作知识库

## 快速参考（Quick Reference）
- 场景 vs 续场的区别
- 基本单元：Scene-Sequel 模式
- 核心公式

## 核心原则（Core Principles）

### 1. Scene（场景）- 行动单元
#### A. Goal（目标）
- 角色在这个场景中想要什么
- 必须明确、具体、可见
- 示例：错误的目标 vs 正确的目标

#### B. Conflict（冲突）
- 什么阻碍了角色
- 冲突的类型（人物、环境、内心）
- 冲突升级的节奏

#### C. Disaster（灾难）
- 场景结束时的转折
- 不是"得偿所愿"而是"Yes, but" / "No" / "No, and"
- 制造悬念的技巧

### 2. Sequel（续场）- 反应单元

#### A. Reaction（情感反应）
- 对灾难的即时反应
- 情感的真实性
- 时长控制

#### B. Dilemma（困境）
- 分析选项
- 两难选择的设计
- 展示角色思维过程

#### C. Decision（决定）
- 做出选择
- 引向下一个 Scene 的 Goal
- 决策的代价

### 3. 场景的四种节奏

#### 快节奏场景（Action Scene）
- 特征：短句、动作描写、少内心独白
- 适用：打斗、追逐、紧急情况
- 示例

#### 慢节奏场景（Reflection Scene）
- 特征：长句、内心活动、氛围描写
- 适用：情感高潮后、决策前、氛围营造
- 示例

#### 对话场景（Dialogue Scene）
- 特征：对话主导、少叙述
- 冲突在对话中展开
- 示例

#### 过渡场景（Transition Scene）
- 特征：简短、信息传递
- 避免拖沓
- 何时可以省略

### 4. 场景的开始与结束

#### 进入场景（Scene Entry）
- 晚进早出原则（Late In, Early Out）
- 避免无关紧要的开场
- 示例对比

#### 离开场景（Scene Exit）
- 钩子结尾（Hook Ending）
- 悬念制造
- 过渡技巧

### 5. 多重场景线的交织

#### 切换场景的时机
- 悬念最高点切换
- 避免读者疲劳

#### 平行场景的节奏
- 交叉剪辑技巧
- 时间线管理

## 实践应用（Practical Application）

### 在 /specify 阶段
- 规划核心场景序列
- 识别关键场景类型

### 在 /plan 阶段
- Scene-Sequel 结构规划
- 场景节奏分配

### 在 /write 阶段
- 场景写作检查清单
- 实时结构调整

### 在 /analyze 阶段
- 场景有效性分析
- 节奏问题诊断

## 常见陷阱（Common Pitfalls）

### 1. 没有明确目标的场景
[示例]

### 2. 冲突不足或太容易解决
[示例]

### 3. 场景太长或太短
[示例]

### 4. 所有场景节奏相同
[示例]

### 5. 过渡场景占比过高
[示例]

### 6. 灾难不够"灾难"
[示例]

## 示例分析（Examples）

### 案例 1: 完整的 Scene-Sequel 单元
[详细场景 + 续场 + 分析]

### 案例 2: 快节奏动作场景
[示例 + 技巧解析]

### 案例 3: 慢节奏情感场景
[示例 + 技巧解析]

### 案例 4: 场景切换技巧
[多场景交织示例]

## 进阶技巧（Advanced Techniques）

### 1. 省略 Sequel
- 何时可以省略反应/困境/决定
- 快节奏故事的处理

### 2. 嵌套场景结构
- 大场景中的小场景
- 复杂场景的层次管理

### 3. 场景的象征意义
- 环境与情感的呼应
- 场景设置的隐喻

### 4. 群戏场景的控制
- 多角色场景的管理
- 保持焦点清晰

## 场景结构检查清单（Checklist）

每个场景写完后检查：
- [ ] 角色的目标是否明确？
- [ ] 是否有足够的冲突？
- [ ] 结尾是否有转折/悬念？
- [ ] 节奏是否符合场景类型？
- [ ] 是否能删除前 1/3 的开场废话？
- [ ] 是否在高潮时结束而非拖尾？
- [ ] 下一个场景的目标是否清晰？

## 场景类型快速参考表

| 场景类型 | 主要功能 | 节奏 | 长度 | 示例 |
|---------|---------|------|------|------|
| 行动场景 | 推进情节 | 快 | 中 | 打斗、追逐 |
| 对话场景 | 揭示信息/冲突 | 中 | 中-长 | 谈判、争吵 |
| 反思场景 | 角色成长 | 慢 | 短-中 | 独处、回忆 |
| 过渡场景 | 时空转换 | 快 | 短 | 路上、准备 |
| 高潮场景 | 解决冲突 | 极快 | 长 | 决战、真相 |

## 与 Commands 的集成

[详细说明]
```

---

## Task 3: 编写 scene-structure.md 核心内容

**Files:**
- Create: `templates/knowledge-base/craft/scene-structure.md`

**Step 1: 编写快速参考**

```markdown
# 场景结构写作知识库

## 快速参考（Quick Reference）

场景是小说的基本构成单元。一个好的场景不是"描述发生了什么"，而是"让读者体验发生了什么"。

**Scene vs Sequel**：

- **Scene（场景）**：角色行动、遭遇冲突、产生转折
- **Sequel（续场）**：角色反应、思考、做决定

**经典公式**：
```
Scene = Goal + Conflict + Disaster
Sequel = Reaction + Dilemma + Decision
```

**场景必须回答的三个问题**：
1. 角色想要什么？（Goal）
2. 什么阻止了他？（Conflict）
3. 结果如何？（Disaster - 通常是失败或意外）

**不是场景的东西**：
- ❌ 纯粹的背景描写（没有角色目标）
- ❌ 信息倾泻（没有冲突）
- ❌ 流水账叙述（没有转折）

---
```

**Step 2-6: 逐步完成各章节**

（按大纲展开，每个章节 100-150 行）

**总预估字数：** 600-800 行

---

## Task 4: 更新 README.md 关键词映射

**Files:**
- Modify: `templates/knowledge-base/README.md`

**Step 1: 添加 scene-structure 映射**

```yaml
scene-structure:
  triggers: [场景, 场景结构, 章节结构, 情节推进, 场景设计, 场景构建, scene]
  auto_load: craft/scene-structure.md
```

---

## Task 5: 验证和测试

**验证标准：**
- [ ] 文件 600-800 行
- [ ] 包含 Scene/Sequel 完整理论
- [ ] 至少 8 组示例对比
- [ ] 包含场景类型快速参考表
- [ ] README.md 更新

**测试用例：**
```
用户："这个场景感觉很拖沓，怎么改进场景结构？"
Expected: setting-detector 检测到"场景""场景结构"，建议加载 scene-structure.md
```

---

## Task 6: 提交

```bash
git add templates/knowledge-base/craft/scene-structure.md
git add templates/knowledge-base/README.md
git commit -m "feat(knowledge-base): 添加 craft/scene-structure.md 场景结构知识库

- Scene/Sequel 经典模型详解
- Goal-Conflict-Disaster 结构
- 四种场景节奏分析
- 场景开始与结束技巧
- 场景类型快速参考表

Closes: P0 优先级任务 #2"
```

---

**预估工作量：** 2.5-3.5 小时
