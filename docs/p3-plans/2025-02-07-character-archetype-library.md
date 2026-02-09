# Character Archetype Library 实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标:** 创建角色原型知识库,提供经典角色原型的模板和设计指导

**架构:** Knowledge Base 格式,包含12种核心原型的详细解析

**技术栈:** Markdown 知识库,原型理论(英雄之旅、荣格原型)

**预估工时:** 12-18 小时

---

## 背景

### 问题
作者设计角色时常遇到困难:
- **角色扁平:** 缺乏深度和层次
- **重复雷同:** 多个角色性格相似
- **缺乏弧线:** 角色没有成长变化
- **功能性不足:** 角色在故事中的作用不清晰

### 解决方案
创建角色原型知识库:
- 12种经典原型(英雄、导师、阴影等)
- 每种原型的核心特征、功能、弧线
- 正面/反面示例
- 组合和变体指导

### 核心价值
- **快速起步:** 基于原型快速构建角色框架
- **避免雷同:** 理解原型差异,设计多样化角色
- **功能明确:** 每种原型在故事中的作用
- **深度指导:** 如何为原型添加独特性

---

## 核心内容

### 12 种核心原型(基于克里斯托弗·沃格勒)

1. **Hero (英雄)** - 主角,踏上旅程的人
2. **Mentor (导师)** - 提供指导和训练
3. **Threshold Guardian (守门人)** - 考验英雄的障碍
4. **Herald (信使)** - 带来召唤的人
5. **Shapeshifter (变形者)** - 忠诚不定的角色
6. **Shadow (阴影)** - 对手/反派
7. **Ally (盟友)** - 帮助英雄的伙伴
8. **Trickster (捣蛋鬼)** - 制造混乱的喜剧角色
9. **Father (父亲)** - 权威/规则
10. **Mother (母亲)** - nurturing/保护
11. **Child (孩童)** - 天真/新生
12. **Sage (智者)** - 知识/洞察

---

## Task 1: 创建知识库基础结构

**Files:**
- Create: `knowledge/character-archetypes/config.yaml`
- Create: `knowledge/character-archetypes/README.md`

### Step 1: 编写 config.yaml

```yaml
name: character-archetypes
version: 1.0.0
description: 角色原型知识库,提供12种经典原型的设计模板
type: knowledge-base

activation:
  keywords:
    - 角色设计
    - 角色原型
    - archetype
    - 英雄
    - 导师
    - 反派
    - 角色功能
    - 角色类型
  auto_activate: true
  confidence_threshold: 0.7

integration:
  works_with:
    - character-arc
    - character-tracking
    - /specify

metadata:
  word_count: 8000
  estimated_reading_time: "25分钟"
  complexity: intermediate
```

### Step 2: 编写 README.md

```markdown
# Character Archetypes Knowledge Base

## 什么是角色原型?

原型 = 跨文化、跨时代反复出现的典型角色模式

**来源:**
- **荣格心理学:** 集体无意识中的原始意象
- **神话学:** 约瑟夫·坎贝尔的英雄之旅
- **编剧理论:** 克里斯托弗·沃格勒的《作家之旅》

## 为什么使用原型?

✅ **快速起步:** 原型提供角色框架
✅ **读者共鸣:** 原型植根于人类共同经验
✅ **功能清晰:** 每种原型在故事中有明确作用
✅ **变化空间:** 原型是起点,可添加独特性

## 知识库内容

### 12 种核心原型

| 原型 | 核心功能 | 代表人物 |
|------|---------|---------|
| Hero | 成长、牺牲、胜利 | 弗罗多、哈利波特 |
| Mentor | 指导、传授、牺牲 | 甘道夫、邓布利多 |
| Shadow | 对抗、考验、镜像 | 索伦、伏地魔 |
| Ally | 支持、互补、忠诚 | 山姆、赫敏 |
| Shapeshifter | 不确定性、浪漫张力 | 斯内普、洛基 |
| Trickster | 喜剧、混乱、真相 | 皮平、弗雷德/乔治 |
| Threshold Guardian | 考验、障碍、守护 | 守门人、看守 |
| Herald | 召唤、信息、转折 | 甘道夫(初访) |
| Father | 权威、法则、秩序 | 大帝、国王 |
| Mother | 养育、保护、治愈 | 凯特琳、莫丽 |
| Child | 天真、希望、新生 | 孩子角色 |
| Sage | 智慧、知识、平静 | 伊尔敏、欧比旺 |

### 每种原型包含

1. **核心特征** - 定义性特质
2. **故事功能** - 在叙事中的作用
3. **典型弧线** - 成长轨迹
4. **正面/反面示例** - 学习范例
5. **常见错误** - 避免陷阱
6. **独特化建议** - 超越原型

## 使用方法

1. **识别需求:** 故事需要什么功能的角色?
2. **选择原型:** 哪种原型最适合?
3. **建立框架:** 使用原型作为基础
4. **添加独特性:** 个人化、背景、怪癖
5. **考虑变体:** 颠覆或混合原型

## 原型组合

一个角色可以:
- **主原型 + 次原型:** 英雄(主) + Trickster(次)
- **原型转变:** 从 Shapeshifter → Ally
- **原型颠覆:** 反英雄 = 扭曲的英雄原型
```

### Step 3: Commit

```bash
git add knowledge/character-archetypes/
git commit -m "feat(p3): add character-archetypes knowledge base structure"
```

---

## Task 2: 编写核心原型文档(第一组)

**Files:**
- Create: `knowledge/character-archetypes/01-hero.md`
- Create: `knowledge/character-archetypes/02-mentor.md`
- Create: `knowledge/character-archetypes/03-shadow.md`
- Create: `knowledge/character-archetypes/04-ally.md`

### Step 1: 编写英雄原型

```markdown
# Hero (英雄原型)

## 核心定义

**英雄** = 踏上旅程、面对考验、获得成长的主角

**关键词:** 成长、牺牲、勇气、选择、转变

## 核心特征

### 1. 不完整性
故事开始时,英雄有缺陷或不足:
- 技能不足(弱者)
- 心理创伤(受伤)
- 错误信念(误解)

### 2. 召唤
被推入或选择踏上旅程:
- 被动召唤(家园被毁)
- 主动选择(追求梦想)

### 3. 成长
通过考验和选择,获得转变:
- 技能提升
- 心理成熟
- 信念修正

### 4. 牺牲
为更大的善,愿意牺牲:
- 舒适(离开家园)
- 欲望(放弃爱情)
- 生命(终极牺牲)

## 故事功能

- **视角提供者:** 读者通过英雄的眼睛看世界
- **成长示范:** 展示如何克服困难
- **价值传达:** 体现故事的核心主题

## 典型弧线

### 经典英雄弧线
```
1. 平凡世界 (普通生活)
   ↓
2. 召唤 (冒险开始)
   ↓
3. 拒绝召唤 (恐惧/怀疑)
   ↓
4. 遇见导师 (获得指导)
   ↓
5. 跨越第一道门槛 (进入新世界)
   ↓
6. 试炼、盟友、敌人 (考验)
   ↓
7. 深入洞穴 (面对恐惧)
   ↓
8. 磨难 (危机/死亡与重生)
   ↓
9. 奖赏 (获得宝剑/知识)
   ↓
10. 返回之路 (回归)
    ↓
11. 复活 (最终考验)
    ↓
12. 带着灵药回归 (成长完成)
```

## 示例分析

### 正面示例

**弗罗多(《魔戒》)**
- **不完整性:** 平凡霍比特人,没有战斗力
- **召唤:** 继承魔戒
- **成长:** 从天真到承受重担
- **牺牲:** 愿意牺牲自己摧毁魔戒

**哈利波特**
- **不完整性:** 孤儿,不了解魔法世界
- **召唤:** 霍格沃茨录取信
- **成长:** 从被动到主动对抗伏地魔
- **牺牲:** 为朋友牺牲(第7部)

### 反面示例(扭曲的英雄)

**安纳金·天行者**
- 英雄弧线的失败:选择黑暗面
- 展示英雄也可能堕落

## 常见错误

❌ **完美英雄:** 没有缺陷,无成长空间
❌ **被动英雄:** 只被事件推动,从不主动选择
❌ **无牺牲:** 轻松获得一切,缺乏张力
❌ **无弧线:** 从头到尾没有变化

## 独特化建议

### 超越原型的方法

1. **特殊背景:** 独特的文化/职业/经历
   - 示例:不是农家少年,是落魄贵族

2. **独特缺陷:** 非典型的"不完整性"
   - 示例:不是缺乏勇气,是过于鲁莽

3. **特殊动机:** 不同的"召唤"原因
   - 示例:不是拯救世界,是为了个人复仇

4. **非典型弧线:** 颠覆传统成长路径
   - 示例:不是从弱到强,是从强大到接受软弱

5. **个性化细节:** 怪癖、习惯、说话方式
   - 示例:总是带着祖母的遗物

## 与其他原型的关系

- **需要 Mentor:** 提供指导
- **对抗 Shadow:** 主要冲突
- **伴随 Ally:** 支持系统
- **被 Herald 召唤:** 开启旅程
- **被 Threshold Guardian 考验:** 证明资格

## 写作提示

### 设计英雄时问自己

1. 他的不完整性是什么?(缺陷/创伤/误解)
2. 什么召唤他踏上旅程?(外部事件/内部渴望)
3. 他最大的恐惧是什么?
4. 他愿意为什么牺牲?
5. 故事结束时他将如何不同?

### 检查清单

- [ ] 英雄有明确的缺陷或不足
- [ ] 召唤足够强烈(不能轻易拒绝)
- [ ] 有清晰的成长弧线
- [ ] 面临真正的选择(不只是被推动)
- [ ] 有牺牲或代价

## 变体

### 反英雄 (Anti-Hero)
英雄的扭曲版本:
- 缺乏传统美德(自私、懦弱)
- 但仍完成"英雄旅程"
- 示例:《绝命毒师》的沃尔特

### 悲剧英雄
英雄的失败版本:
- 因致命缺陷而失败
- 示例:麦克白

### 勉强英雄 (Reluctant Hero)
不愿意但被迫成为英雄:
- 拒绝召唤更强烈
- 示例:《比尔博》

## 文化变体

### 中国式英雄
- 强调集体而非个人
- 重视孝道和忠义
- 示例:花木兰

### 日本式英雄
- 强调修行和自律
- 重视师承和传统
- 示例:宫本武藏
```

### Step 2: 编写导师、阴影、盟友原型(省略详细内容,格式同上)

### Step 3: Commit

```bash
git add knowledge/character-archetypes/01-hero.md
git add knowledge/character-archetypes/02-mentor.md
git add knowledge/character-archetypes/03-shadow.md
git add knowledge/character-archetypes/04-ally.md
git commit -m "feat(p3): add Hero, Mentor, Shadow, Ally archetypes"
```

---

## Task 3: 编写次要原型文档(第二组)

**Files:**
- Create: `knowledge/character-archetypes/05-shapeshifter.md`
- Create: `knowledge/character-archetypes/06-trickster.md`
- Create: `knowledge/character-archetypes/07-threshold-guardian.md`
- Create: `knowledge/character-archetypes/08-herald.md`

### Step 1-2: 编写各原型文档(格式同 Hero)

重点内容:
- **Shapeshifter:** 忠诚不定,制造不确定性,常见于浪漫角色
- **Trickster:** 喜剧元素,打破常规,揭示真相
- **Threshold Guardian:** 考验英雄资格的守门人
- **Herald:** 带来召唤或转折的信使

### Step 3: Commit

```bash
git add knowledge/character-archetypes/05-shapeshifter.md
git add knowledge/character-archetypes/06-trickster.md
git add knowledge/character-archetypes/07-threshold-guardian.md
git add knowledge/character-archetypes/08-herald.md
git commit -m "feat(p3): add Shapeshifter, Trickster, Guardian, Herald archetypes"
```

---

## Task 4: 编写象征性原型(第三组)

**Files:**
- Create: `knowledge/character-archetypes/09-father.md`
- Create: `knowledge/character-archetypes/10-mother.md`
- Create: `knowledge/character-archetypes/11-child.md`
- Create: `knowledge/character-archetypes/12-sage.md`

### Step 1-2: 编写各原型文档

重点内容:
- **Father:** 权威、法则、秩序、严厉之爱
- **Mother:** 养育、保护、无条件之爱
- **Child:** 天真、希望、新开始
- **Sage:** 智慧、知识、超然

### Step 3: Commit

```bash
git add knowledge/character-archetypes/09-father.md
git add knowledge/character-archetypes/10-mother.md
git add knowledge/character-archetypes/11-child.md
git add knowledge/character-archetypes/12-sage.md
git commit -m "feat(p3): add Father, Mother, Child, Sage archetypes"
```

---

## Task 5: 创建原型组合和应用指南

**Files:**
- Create: `knowledge/character-archetypes/archetype-combinations.md`
- Create: `knowledge/character-archetypes/application-guide.md`

### Step 1: 编写原型组合指南

```markdown
# Archetype Combinations

## 单角色多原型

一个角色可以同时体现多种原型:

### 主原型 + 次原型

**示例: 甘道夫**
- **主原型:** Mentor(指导弗罗多)
- **次原型:** Herald(带来召唤)、Threshold Guardian(考验)

**示例: 斯内普**
- **主原型:** Shapeshifter(忠诚不定)
- **次原型:** Mentor(最终保护哈利)

### 原型转变

角色在故事中从一种原型转变为另一种:

**示例: 索林(《霍比特人》)**
```
开始: Mentor(带领比尔博)
  ↓
中期: Shadow(被龙病侵蚀)
  ↓
结局: 回归 Mentor(悔悟牺牲)
```

**示例: 洛基(MCU)**
```
Thor 1: Trickster + Shadow
  ↓
Avengers: Shadow
  ↓
Thor 2-3: Shapeshifter → Ally
```

## 原型对立

某些原型天然对立:

- **Hero ↔ Shadow:** 主要冲突
- **Father ↔ Child:** 权威vs叛逆
- **Trickster ↔ Father:** 混乱vs秩序

## 原型互补

某些原型天然互补:

- **Hero + Ally:** 互相支持
- **Hero + Mentor:** 传承关系
- **Trickster + Hero:** 互补性格

## 复杂角色设计

### 三原型角色

**示例:杰克·斯派罗**
- Hero(主角,有成长)
- Trickster(滑稽、不可预测)
- Shapeshifter(忠诚不定)

### 原型颠覆

**颠覆 Mentor:**
- 传统:智慧长者
- 颠覆:年轻导师、反面导师(教什么不该做)

**颠覆 Hero:**
- 传统:勇敢无畏
- 颠覆:反英雄(自私、懦弱但仍成长)

## 配角团队设计

确保配角团队覆盖不同原型,避免重复:

**示例:《魔戒》护戒队**
- 弗罗多: Hero
- 甘道夫: Mentor
- 山姆: Ally(忠诚伙伴)
- 皮平/梅里: Trickster(喜剧)
- 阿拉贡: Hero(次要)+ Mentor
- 莱格拉斯/金雳: Ally(战斗支持)
- 波罗米尔: Shapeshifter(忠诚挣扎)
```

### Step 2: 编写应用指南

```markdown
# Archetype Application Guide

## 使用流程

### Step 1: 识别故事需求
问自己:
- 这个故事需要什么功能的角色?
- 主角需要导师吗?
- 需要喜剧元素吗?
- 需要内部冲突(Shapeshifter)吗?

### Step 2: 选择原型
根据需求选择原型:
- 主角 → Hero
- 需要指导 → Mentor
- 需要对手 → Shadow
- 需要笑料 → Trickster

### Step 3: 建立基础框架
使用原型提供的:
- 核心特征
- 典型弧线
- 故事功能

### Step 4: 添加独特性
- 特殊背景
- 独特缺陷
- 个性化细节
- 非典型弧线

### Step 5: 检查团队平衡
- 是否覆盖必要功能?
- 角色是否太相似?
- 是否缺少某种原型?

## 不同体裁的原型应用

### 爽文/升级流
- **必备:** Hero(成长明显)、Mentor(传授技能)
- **常用:** Threshold Guardian(关卡boss)、Ally
- **少用:** Trickster(可能干扰爽感)

### 史诗奇幻
- **必备:** Hero、Mentor、Shadow、Ally团队
- **常用:** Herald、Threshold Guardian、Sage
- **特点:** 原型齐全,复杂关系

### 悬疑推理
- **必备:** Hero(侦探)、Shadow(凶手)
- **常用:** Shapeshifter(嫌疑人)、Herald(报案人)
- **特点:** 多 Shapeshifter 制造不确定性

### 浪漫爱情
- **必备:** Hero、Shapeshifter(爱情对象)
- **常用:** Threshold Guardian(父母反对)、Ally(闺蜜)
- **特点:** Shapeshifter 核心,制造浪漫张力

## 常见陷阱

### 陷阱 1: 机械套用
❌ 错误:生硬套用原型,角色像模板
✅ 正确:原型作为起点,添加独特性

### 陷阱 2: 原型过载
❌ 错误:试图让一个角色体现所有原型
✅ 正确:主原型 + 1-2个次原型

### 陷阱 3: 忽视原型
❌ 错误:完全不考虑原型功能
✅ 正确:至少确保主要角色有清晰功能

### 陷阱 4: 原型冲突
❌ 错误:让角色同时是 Mentor 和 Shadow(对同一 Hero)
✅ 正确:原型组合要合理

## 实战练习

### 练习 1: 识别原型
选择熟悉的故事,识别各角色的原型:
- 《哈利波特》各角色属于什么原型?
- 是否有原型转变?

### 练习 2: 设计角色团队
为你的故事设计 5-8 人团队:
- 列出需要的原型
- 为每个原型添加独特性
- 检查平衡性

### 练习 3: 原型颠覆
选择一种原型,设计颠覆版本:
- 如何扭曲 Mentor?
- 如何让 Hero 反常规?
```

### Step 3: Commit

```bash
git add knowledge/character-archetypes/archetype-combinations.md
git add knowledge/character-archetypes/application-guide.md
git commit -m "feat(p3): add archetype combinations and application guide"
```

---

## Task 6: 编写总体文档和测试

**Files:**
- Create: `docs/knowledge-bases/character-archetypes.md`
- Create: `knowledge/character-archetypes/examples-analysis.md`

### Step 1: 编写用户文档

```markdown
# Character Archetypes Knowledge Base

## 简介

角色原型知识库提供 12 种经典角色原型的详细解析,帮助你:
- 快速设计角色框架
- 理解角色在故事中的功能
- 避免角色扁平和雷同
- 创造有深度的复杂角色

## 内容概览

### 12 种核心原型

1. **Hero** - 成长、牺牲的主角
2. **Mentor** - 提供指导的智者
3. **Shadow** - 对立的反派
4. **Ally** - 忠诚的伙伴
5. **Shapeshifter** - 忠诚不定的角色
6. **Trickster** - 制造混乱的喜剧角色
7. **Threshold Guardian** - 考验资格的守门人
8. **Herald** - 带来召唤的信使
9. **Father** - 权威与秩序
10. **Mother** - 养育与保护
11. **Child** - 天真与希望
12. **Sage** - 智慧与洞察

### 每种原型包含

- **核心特征:** 定义性特质
- **故事功能:** 在叙事中的作用
- **典型弧线:** 成长轨迹
- **示例分析:** 正面/反面示例
- **常见错误:** 避免陷阱
- **独特化建议:** 超越原型的方法

## 使用方法

### 自动激活
当你讨论角色设计时,知识库会自动激活

### 浏览原型
```
我需要设计一个导师角色
→ 自动加载 Mentor 原型知识
```

### 设计流程
1. **识别需求:** 故事需要什么功能?
2. **选择原型:** 哪种原型最适合?
3. **建立框架:** 使用原型核心特征
4. **添加独特性:** 个性化背景和细节
5. **检查平衡:** 团队原型是否多样?

## 最佳实践

✅ **原型是起点:** 不要机械套用,要添加独特性
✅ **主 + 次原型:** 一个角色可以有主原型和 1-2 个次原型
✅ **团队平衡:** 确保主要角色覆盖不同原型
✅ **原型转变:** 角色可以在故事中从一种原型转变为另一种

❌ **避免完美套用:** 不要让角色像原型复制品
❌ **避免过载:** 不要让一个角色体现所有原型
❌ **避免忽视:** 至少主要角色应有清晰原型功能

## 示例

### 设计主角(Hero)
```
需求: 玄幻小说主角

基础框架(Hero原型):
- 不完整性: 废材(灵根损毁)
- 召唤: 获得神秘传承
- 成长: 从废材到强者
- 牺牲: 愿意为宗门牺牲

添加独特性:
- 背景: 曾是天才,因意外成废材
- 性格: 外表温和内心坚韧
- 怪癖: 喜欢研究古籍
- 动机: 不只是变强,更要找出真相
```

### 设计导师
```
基础框架(Mentor原型):
- 智慧、经验丰富
- 传授技能和哲理
- 可能牺牲

添加独特性:
- 颠覆: 年轻导师(20多岁但极强)
- 缺陷: 有心魔,无法突破
- 关系: 与主角亦师亦友
```

## 相关资源

- **Character Arc Skill:** 追踪角色成长
- **Character Tracking:** 管理角色信息
```

### Step 2: 创建示例分析文档

```markdown
# Character Archetype Examples Analysis

## 《魔戒》护戒队原型分析

### 弗罗多 - Hero
- **不完整性:** 平凡霍比特人
- **召唤:** 继承魔戒
- **成长:** 承受重担的心理成长
- **牺牲:** 愿意牺牲自己

### 甘道夫 - Mentor + Herald
- **Mentor:** 指导护戒队
- **Herald:** 首次带来魔戒威胁的消息
- **牺牲:** 莫瑞亚坠落(后复活)

### 山姆 - Ally
- **忠诚:** 从不背叛弗罗多
- **支持:** 身体和精神支持
- **成长:** 从仆人到真正的伙伴

### 阿拉贡 - Hero(次要) + Mentor
- **自己的Hero之旅:** 接受王位
- **对霍比特人的Mentor:** 保护和指导

### 波罗米尔 - Shapeshifter
- **忠诚不定:** 被魔戒诱惑
- **转变:** 最后悔悟牺牲

### 皮平/梅里 - Trickster
- **喜剧元素:** 制造笑料
- **成长:** 从捣蛋鬼到战士

---

## 《哈利波特》系列原型分析

### 哈利 - Hero
典型英雄弧线,从孤儿到救世主

### 邓布利多 - Mentor
智慧导师,最终牺牲

### 伏地魔 - Shadow
终极对手,哈利的镜像(都是孤儿)

### 赫敏/罗恩 - Ally
忠诚伙伴,提供不同类型支持

### 斯内普 - Shapeshifter
忠诚不定,最终揭晓为 Ally

### 弗雷德/乔治 - Trickster
喜剧元素

---

## 《权力的游戏》复杂原型分析

### 琼恩·雪诺 - Hero
经典英雄,死亡与重生

### 艾莉亚 - Hero(非典型)
复仇英雄,更黑暗的弧线

### 提利昂 - Hero + Trickster
智慧型英雄,用智谋而非武力

### 丹妮莉丝 - Hero → Shadow
悲剧英雄,从解放者到暴君

### 瑟曦 - Shadow
反派,但有复杂动机(保护子女)
```

### Step 3: Commit

```bash
git add docs/knowledge-bases/character-archetypes.md
git add knowledge/character-archetypes/examples-analysis.md
git commit -m "docs(p3): add character-archetypes documentation and examples"
```

---

## 验证标准

### 内容完整性
- [ ] 包含全部 12 种原型的详细文档
- [ ] 每种原型至少 800 字
- [ ] 每种原型至少 2 个示例分析
- [ ] 包含原型组合和应用指南
- [ ] 总字数 ≥ 8000 字

### 实用性
- [ ] 核心特征清晰明确
- [ ] 故事功能可操作
- [ ] 示例贴近现代作品
- [ ] 独特化建议具体

### 准确性
- [ ] 原型定义符合经典理论
- [ ] 示例分析准确
- [ ] 无明显理论错误

### 用户体验
- [ ] 结构清晰,易于导航
- [ ] 语言通俗易懂
- [ ] 包含实战练习

---

## 预估工时

- **Task 1:** 基础结构 - 2h
- **Task 2:** 核心原型(Hero/Mentor/Shadow/Ally) - 4h
- **Task 3:** 次要原型(Shapeshifter/Trickster/Guardian/Herald) - 3h
- **Task 4:** 象征性原型(Father/Mother/Child/Sage) - 3h
- **Task 5:** 组合和应用指南 - 3h
- **Task 6:** 文档和示例 - 2h

**总计:17 小时**

---

Closes: P3 优先级任务 #3
