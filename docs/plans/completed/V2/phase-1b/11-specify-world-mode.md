# Task 11: `/specify` 金手指章节 + `--world` 子模式

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** (1) 在 `/specify` 的 Level 4 规格模板中新增「金手指/核心设定」章节；(2) 新增 `--world` 子模式，专门用于世界观设定（力量体系、势力、地理、经济）

**Architecture:** 在 `specify.md` 的 Level 4 规格模板（九章结构）中插入新的第五章「金手指/核心设定」（原第五章及之后顺延）。`--world` 子模式作为独立流程分支，在检测到参数后跳转到世界观专项设定流程。

**Tech Stack:** Markdown 模板

---

### Task 11.1: 在 Level 4 规格模板中插入「金手指/核心设定」章节

**Files:**
- Modify: `templates/commands/specify.md:394-410`（第四章「核心需求」之后、原第五章之前）

**Step 1: 在第四章「核心需求」结束后插入新章节**

在 `specify.md` 的 `## 四、核心需求` 结束后、原 `## 五、` 之前，插入：

```markdown

## 五、金手指/核心设定

> 本章适用于网文类型。文学类型可跳过或简化。

### 金手指设定（如适用）
- 金手指类型：[系统/传承/特殊体质/空间/重生/无]
- 核心能力：[金手指提供什么能力]
- 限制条件：[使用限制、冷却、代价]
- 成长路线：[金手指如何随主角成长]
- 暴露风险：[被发现的后果]
- 与主线的关系：[金手指如何推动主线]

### 力量体系概要（如适用）
- 体系名称：[如：灵气修炼体系]
- 境界划分：[简要列出主要境界]
- 突破条件：[资源/悟性/机缘的比重]
- 越级规则：[什么条件下可以越级战斗]
- 详细设定：[如需详细设定，使用 /specify --world]

### 核心卖点
- 差异化卖点：[本书与同类作品的核心区别]
- 读者期待管理：[读者会期待什么，如何满足/超越]
- 爽点类型：[本书主要的爽点类型，参考类型知识库]
```

**Step 2: 更新后续章节编号**

将原来的：
- `## 五、角色设计` → `## 六、角色设计`
- `## 六、世界观设定` → `## 七、世界观设定`
- `## 七、情节架构` → `## 八、情节架构`
- `## 八、写作风格` → `## 九、写作风格`
- `## 九、附录` → `## 十、附录`

**Step 3: 验证章节编号连续**

Run: `grep -n "^## [一二三四五六七八九十]" templates/commands/specify.md`
Expected: 一 → 二 → 三 → 四 → 五（新增）→ 六 → 七 → 八 → 九 → 十

**Step 4: Commit**

```bash
git add templates/commands/specify.md
git commit -m "feat(specify): add chapter 5 'golden finger / core setting' to Level 4 spec template"
```

---

### Task 11.2: 更新 frontmatter 参数提示

**Files:**
- Modify: `templates/commands/specify.md:1-8`

**Step 1: 修改 argument-hint**

将：
```yaml
argument-hint: [故事目录名或主题描述]
```

改为：
```yaml
argument-hint: [故事目录名或主题描述] [--world]
```

**Step 2: Commit**

```bash
git add templates/commands/specify.md
git commit -m "feat(specify): add --world flag to argument-hint"
```

---

### Task 11.3: 插入 `--world` 子模式流程

**Files:**
- Modify: `templates/commands/specify.md`（在执行流程开头的参数解析部分）

**Step 1: 在参数解析部分添加 --world 检测**

在 `specify.md` 的执行流程开头（Level 判断之前），添加：

```markdown

---

## 🌍 世界观专项设定（`--world`）

**触发条件**：`$ARGUMENTS` 包含 `--world`

**前置条件**：
1. 必须已有 `specification.md`（至少 Level 2），如没有则提示先执行 `/specify`
2. 读取现有 `specification.md` 中的世界观章节（如有）

**适用场景**：
- 玄幻/修仙：需要详细的力量体系、宗门势力、地理设定
- 科幻：需要详细的科技体系、星际政治、物理规则
- 奇幻：需要详细的魔法体系、种族设定、历史
- 历史：需要详细的朝代背景、社会制度、文化习俗

### World-1. 力量/科技体系

```
🔮 力量体系设定
━━━━━━━━━━━━━━━━━━━━
请回答以下问题（可以先回答部分，后续补充）：

1. 体系名称和基本原理
   - 力量来源是什么？（灵气/魔力/科技/血脉/...）
   - 为什么有些人能使用，有些人不能？

2. 等级划分
   - 有多少个大境界？
   - 每个大境界有几个小境界？
   - 每个境界的标志性能力是什么？
   - 相邻境界的差距有多大？

3. 突破机制
   - 突破需要什么条件？（修炼时间/资源/悟性/机缘）
   - 有没有瓶颈？瓶颈如何突破？
   - 突破失败的后果是什么？

4. 战斗规则
   - 同境界战斗的决定因素是什么？（技巧/法宝/血脉/经验）
   - 越级战斗在什么条件下可能？
   - 有没有「一力降十会」的规则？

5. 特殊能力
   - 有没有特殊体质/血脉/天赋？
   - 有没有禁术/禁忌？
   - 有没有外挂类能力？（法宝、阵法、丹药）
```

### World-2. 势力/政治体系

```
🏛️ 势力体系设定
━━━━━━━━━━━━━━━━━━━━
1. 势力层级
   - 最小势力单位是什么？（家族/帮派/小队）
   - 最大势力单位是什么？（帝国/联盟/位面）
   - 中间有几个层级？

2. 主要势力
   - 故事涉及哪些主要势力？
   - 它们之间的关系是什么？（联盟/对抗/中立）
   - 每个势力的核心利益是什么？

3. 权力结构
   - 势力内部的权力如何分配？
   - 有没有特殊的制度？（长老会/世袭/选举/实力为尊）

4. 主角与势力的关系
   - 主角属于哪个势力？
   - 主角与各势力的关系如何变化？
```

### World-3. 地理/空间设定

```
🗺️ 地理设定
━━━━━━━━━━━━━━━━━━━━
1. 世界结构
   - 世界的整体结构是什么？（单大陆/多大陆/多位面/星际）
   - 有没有特殊区域？（禁地/秘境/上界）

2. 故事地图
   - 故事主要发生在哪些地方？
   - 地图随主角实力如何扩展？
   - 每个区域的特色是什么？

3. 资源分布
   - 修炼/科技资源如何分布？
   - 有没有资源争夺的冲突？
```

### World-4. 经济/社会体系

```
💰 经济社会设定
━━━━━━━━━━━━━━━━━━━━
1. 货币/交易体系
   - 使用什么货币？（灵石/金币/信用点）
   - 有没有特殊的交易场所？（拍卖行/黑市）

2. 社会阶层
   - 社会如何分层？
   - 阶层流动性如何？
   - 主角处于什么阶层？

3. 日常生活
   - 普通人的生活是什么样的？
   - 修炼者/能力者的日常是什么样的？
```

### World-5. 生成世界观文档

将以上设定整理后写入 `specification.md` 的世界观章节（第七章），格式化为结构化文档。

同时生成 `stories/*/spec/world-setting.json`（如需要被 tracking 系统引用）：

```json
{
  "powerSystem": {
    "name": "[体系名称]",
    "source": "[力量来源]",
    "levels": [
      {
        "rank": 1,
        "name": "[境界名]",
        "abilities": "[标志性能力]",
        "rarity": "[稀有度]"
      }
    ],
    "breakthroughRules": "[突破规则概要]",
    "combatRules": "[战斗规则概要]"
  },
  "factions": [...],
  "geography": {...},
  "economy": {...},
  "updatedAt": "[ISO日期]"
}
```

**输出确认**：

```
✅ 世界观设定完成
━━━━━━━━━━━━━━━━━━━━
📝 已更新：specification.md 第七章
📊 已生成：spec/world-setting.json

💡 后续操作：
- /plan — 基于世界观制定创作计划
- /character create — 创建角色（可引用世界观设定）
- /specify --world — 随时回来补充或修改世界观
```
```

**Step 2: 验证插入位置**

Run: `grep -n "世界观专项\|--world\|World-1\|World-5" templates/commands/specify.md`
Expected: 世界观专项设定章节完整存在

**Step 3: Commit**

```bash
git add templates/commands/specify.md
git commit -m "feat(specify): add --world sub-mode for detailed world-building (power system, factions, geography, economy)"
```

---

### Task 11.4: 验证章节编号和整体结构

**Step 1: 验证 Level 4 模板章节编号**

Run: `grep -n "^## [一二三四五六七八九十]" templates/commands/specify.md`
Expected: 十个章节，编号连续

**Step 2: 验证 --world 模式与正常模式互不干扰**

确认：
- 不带 `--world` 时，执行正常的 Level 判断和规格生成流程
- 带 `--world` 时，跳转到世界观专项设定流程
- 两种模式都写入同一个 `specification.md`

**Step 3: 最终 Commit**

```bash
git log --oneline -4
```
Expected: 看到 3 个相关 commit
