# Emotional Beats Library 实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标:** 创建情感节拍知识库,提供常见情感节拍的模板和设计指导

**架构:** Knowledge Base 格式,包含 20+ 种核心情感节拍的场景模板

**技术栈:** Markdown 知识库,情感节拍理论(Blake Snyder, Save the Cat)

**预估工时:** 10-15 小时

---

## 背景

### 问题
作者设计情感场景时常遇到困难:
- **套路陈旧:** "我爱你"、"误会"、"和好"千篇一律
- **情感苍白:** 无法打动读者
- **节奏失控:** 不知道何时该有情感爆发
- **缺乏灵感:** 不知道如何设计新颖的情感场景

### 解决方案
创建情感节拍知识库:
- 20+ 种核心情感节拍(告白、背叛、牺牲等)
- 每种节拍的场景设计模板
- 正面/反面示例
- 新颖变体建议

### 核心价值
- **场景库:** 快速找到适合的情感场景类型
- **避免套路:** 提供新颖变体,超越陈词滥调
- **情感真实:** 学习如何设计打动人的场景
- **节奏指导:** 何时该使用何种情感节拍

---

## 核心内容

### 20+ 种核心情感节拍

#### 正面情感
1. **First Meeting (初遇)** - 主要角色第一次见面
2. **Bonding Moment (联结时刻)** - 建立深层连接
3. **Declaration (告白)** - 表达爱/忠诚/承诺
4. **Triumph (胜利)** - 成功时刻
5. **Reunion (重逢)** - 分离后重聚
6. **Forgiveness (原谅)** - 宽恕与和解

#### 负面情感
7. **Betrayal (背叛)** - 信任被破坏
8. **Loss (失去)** - 失去重要的人/物
9. **Rejection (拒绝)** - 被拒绝/排斥
10. **Failure (失败)** - 关键失败时刻
11. **Misunderstanding (误会)** - 错误理解导致冲突
12. **Farewell (告别)** - 永久或长期分离

#### 转折情感
13. **Revelation (真相揭露)** - 重要信息揭晓
14. **Point of No Return (不归路)** - 决定性选择
15. **Dark Night of the Soul (至暗时刻)** - 最低谷
16. **Sacrifice (牺牲)** - 为他人放弃
17. **Awakening (觉醒)** - 意识转变
18. **Confrontation (对峙)** - 正面冲突

#### 复杂情感
19. **Bittersweet Goodbye (苦乐参半的告别)** - 必要但痛苦的分离
20. **Moral Dilemma (道德困境)** - 两难选择
21. **Temptation (诱惑)** - 面对诱惑的挣扎
22. **Redemption (救赎)** - 弥补过错

---

## Task 1: 创建知识库基础结构

**Files:**
- Create: `knowledge/emotional-beats/config.yaml`
- Create: `knowledge/emotional-beats/README.md`

### Step 1: 编写 config.yaml

```yaml
name: emotional-beats
version: 1.0.0
description: 情感节拍知识库,提供常见情感场景的设计模板
type: knowledge-base

activation:
  keywords:
    - 情感
    - 节拍
    - 告白
    - 背叛
    - 牺牲
    - 重逢
    - 误会
    - 和解
    - 情感场景
    - emotional beat
  auto_activate: true
  confidence_threshold: 0.7

integration:
  works_with:
    - character-arc
    - pacing-control
    - /write

metadata:
  word_count: 6000
  estimated_reading_time: "20分钟"
  complexity: beginner-intermediate
```

### Step 2: 编写 README.md

```markdown
# Emotional Beats Knowledge Base

## 什么是情感节拍?

**Emotional Beat** = 故事中触发读者情感反应的关键场景

**特征:**
- 情感强度高
- 角色关系转变
- 读者共鸣强
- 推动情节或角色成长

## 为什么重要?

✅ **读者记住的是情感:** 情节会忘记,情感会记住
✅ **情感驱动投入:** 读者因情感而继续阅读
✅ **角色真实性:** 情感场景展示角色深度

## 知识库内容

### 22 种核心情感节拍

| 类别 | 节拍 | 情感类型 |
|------|------|---------|
| **正面** | 初遇、联结、告白、胜利、重逢、原谅 | 喜悦、温暖、希望 |
| **负面** | 背叛、失去、拒绝、失败、误会、告别 | 悲伤、愤怒、绝望 |
| **转折** | 真相、不归路、至暗时刻、牺牲、觉醒、对峙 | 震惊、决心、转变 |
| **复杂** | 苦乐参半、道德困境、诱惑、救赎 | 矛盾、挣扎、成长 |

### 每种节拍包含

1. **核心元素** - 必备组成部分
2. **常见套路** - 陈旧的写法(应避免)
3. **新颖变体** - 打破套路的方法
4. **情感真实性** - 如何让读者相信
5. **示例分析** - 经典场景解析
6. **写作提示** - 实用建议

## 使用方法

### 自动激活
当你设计情感场景时,知识库会自动提供参考

### 查找节拍
```
我要写一个告白场景
→ 加载 "Declaration" 节拍知识
→ 提供模板、变体、避免套路
```

### 节拍序列设计
```
我的角色关系应该如何发展?
→ 建议节拍序列:
  初遇 → 联结 → 误会 → 和解 → 告白
```

## 最佳实践

1. **避免套路:** 使用新颖变体,不要陈词滥调
2. **情感真实:** 基于角色性格和处境,不要为情感而情感
3. **节拍分布:** 正负情感交替,不要连续多个负面
4. **强度递增:** 情感节拍强度应逐渐升级

## 节拍 vs 情节

- **情节:** 发生了什么(事件)
- **节拍:** 感受到什么(情感)

**示例:**
- 情节: 主角打败了敌人
- 节拍: 胜利的喜悦、失去战友的悲伤
```

### Step 3: Commit

```bash
git add knowledge/emotional-beats/
git commit -m "feat(p3): add emotional-beats knowledge base structure"
```

---

## Task 2: 编写正面情感节拍

**Files:**
- Create: `knowledge/emotional-beats/01-first-meeting.md`
- Create: `knowledge/emotional-beats/02-bonding-moment.md`
- Create: `knowledge/emotional-beats/03-declaration.md`
- Create: `knowledge/emotional-beats/04-triumph.md`
- Create: `knowledge/emotional-beats/05-reunion.md`
- Create: `knowledge/emotional-beats/06-forgiveness.md`

### Step 1: 编写 First Meeting 节拍

```markdown
# First Meeting (初遇节拍)

## 核心定义

**初遇** = 主要角色第一次见面,建立关系基调

**重要性:** 读者对关系的第一印象

## 核心元素

1. **对比/冲突:** 两人有明显差异或冲突
2. **印象设定:** 彼此的第一印象(可能错误)
3. **关系预示:** 暗示未来关系走向
4. **记忆点:** 独特的细节让场景难忘

## 常见套路(应避免)

❌ **一见钟情(无铺垫):** "他看到她,心跳加速,知道这就是真爱"
❌ **救美英雄:** 男主恰好救了女主
❌ **无聊相遇:** 只是平淡的介绍,没有张力
❌ **误会梗(过度使用):** "她以为他是XX,其实是YY"

## 新颖变体

### 变体 1: 敌对初遇
两人因冲突相遇,为后续发展制造张力

**示例:** 《傲慢与偏见》
- 达西第一次见伊丽莎白:轻视她
- 建立对立,后续转变更有力

### 变体 2: 非典型场景
不是舞会/街头,而是独特情境

**示例:**
- 监狱/法庭相遇
- 葬礼上初遇
- 逃亡途中被迫合作

### 变体 3: 错位初遇
一方记得,一方不记得

**示例:**
- A在重要时刻见过B,但B不记得
- 后来B发现,产生愧疚/感动

### 变体 4: 延迟初遇
读者早就期待的相遇,延迟到后期

**示例:** 《权游》琼恩和丹妮
- 前6季一直没见面
- 第7季初遇成为重大事件

## 情感真实性

### 让初遇可信的方法

1. **基于情境:** 相遇有合理原因,不是巧合
2. **个性展现:** 通过互动展示性格
3. **细节记忆:** 角色记住独特细节(不只是"她很美")
4. **非完美:** 初遇可以尴尬、失败、误会

## 示例分析

### 示例 1: 《星球大战》卢克遇莱娅

**场景:** 卢克救莱娅出监狱

**元素:**
- 对比: 天真农场男孩 vs 坚强公主
- 非典型: 不是浪漫场景,是行动场景
- 印象: 莱娅觉得卢克不靠谱("你个子有点矮")
- 关系预示: 伙伴关系(后揭晓是兄妹)

### 示例 2: 《哈利波特》哈利遇罗恩/赫敏

**罗恩:**
- 场景: 火车上
- 对比: 穷困 vs 名人(但哈利不在意)
- 联结: 分享食物
- 预示: 深厚友谊

**赫敏:**
- 场景: 火车上
- 印象: 讨厌的万事通
- 转变: 后来成为最好的朋友

## 写作提示

### 设计初遇时问自己

1. **他们为什么在这里相遇?**(避免纯巧合)
2. **第一印象是什么?**(可以错误)
3. **有什么冲突或张力?**(避免太顺利)
4. **什么细节让这次相遇难忘?**
5. **这次相遇如何预示未来关系?**

### 检查清单

- [ ] 相遇有合理情境(非纯巧合)
- [ ] 有对比或冲突制造张力
- [ ] 展示双方性格
- [ ] 有独特记忆点
- [ ] 避免陈词滥调(一见钟情、救美等)

## 进阶技巧

### 技巧 1: 多层初遇
第一次相遇只是表面,后来揭示更早的联系

**示例:**
- 表面: 成年后工作中相遇
- 真相: 童年时曾短暂相遇,但不记得

### 技巧 2: 视角差异
从不同角色视角,展示初遇的不同感受

**示例:**
- A的视角: 紧张、印象深刻
- B的视角: 没注意到A
- 制造不对等,后续发展有张力

### 技巧 3: 预示反转
初遇时的印象,后来完全反转

**示例:**
- 初遇: B显得冷漠无情
- 后来: 发现B其实很温柔,只是不善表达
```

### Step 2: 编写其他正面情感节拍(格式同上,省略详细内容)

重点:
- **Bonding Moment:** 深层连接建立(分享秘密、共同经历危险)
- **Declaration:** 告白时刻(避免"我爱你"套路)
- **Triumph:** 胜利时刻(个人/团队成就)
- **Reunion:** 重逢(久别重逢的情感爆发)
- **Forgiveness:** 原谅与和解(真诚的道歉与接受)

### Step 3: Commit

```bash
git add knowledge/emotional-beats/01-first-meeting.md
git add knowledge/emotional-beats/02-bonding-moment.md
git add knowledge/emotional-beats/03-declaration.md
git add knowledge/emotional-beats/04-triumph.md
git add knowledge/emotional-beats/05-reunion.md
git add knowledge/emotional-beats/06-forgiveness.md
git commit -m "feat(p3): add positive emotional beats"
```

---

## Task 3: 编写负面情感节拍

**Files:**
- Create: `knowledge/emotional-beats/07-betrayal.md`
- Create: `knowledge/emotional-beats/08-loss.md`
- Create: `knowledge/emotional-beats/09-rejection.md`
- Create: `knowledge/emotional-beats/10-failure.md`
- Create: `knowledge/emotional-beats/11-misunderstanding.md`
- Create: `knowledge/emotional-beats/12-farewell.md`

### Step 1-2: 编写各负面节拍(格式同正面节拍)

重点内容:
- **Betrayal:** 信任被破坏(分层揭露、动机复杂化)
- **Loss:** 失去重要的人/物(避免廉价死亡)
- **Rejection:** 被拒绝(真实的痛苦,不只是"没关系")
- **Failure:** 关键失败(有后果,不能轻易翻盘)
- **Misunderstanding:** 误会(基于性格和处境,不是愚蠢)
- **Farewell:** 告别(永久或长期分离的情感重量)

### Step 3: Commit

```bash
git add knowledge/emotional-beats/07-betrayal.md
git add knowledge/emotional-beats/08-loss.md
git add knowledge/emotional-beats/09-rejection.md
git add knowledge/emotional-beats/10-failure.md
git add knowledge/emotional-beats/11-misunderstanding.md
git add knowledge/emotional-beats/12-farewell.md
git commit -m "feat(p3): add negative emotional beats"
```

---

## Task 4: 编写转折和复杂情感节拍

**Files:**
- Create: `knowledge/emotional-beats/13-revelation.md`
- Create: `knowledge/emotional-beats/14-point-of-no-return.md`
- Create: `knowledge/emotional-beats/15-dark-night.md`
- Create: `knowledge/emotional-beats/16-sacrifice.md`
- Create: `knowledge/emotional-beats/17-awakening.md`
- Create: `knowledge/emotional-beats/18-confrontation.md`
- Create: `knowledge/emotional-beats/19-bittersweet-goodbye.md`
- Create: `knowledge/emotional-beats/20-moral-dilemma.md`
- Create: `knowledge/emotional-beats/21-temptation.md`
- Create: `knowledge/emotional-beats/22-redemption.md`

### Step 1-2: 编写各节拍(格式同上)

重点内容:
- **Revelation:** 重要真相揭露(时机、方式、反应)
- **Point of No Return:** 不可逆转的决定
- **Dark Night of the Soul:** 失去一切希望的至暗时刻
- **Sacrifice:** 为他人牺牲(真实代价)
- **Awakening:** 意识/能力觉醒
- **Confrontation:** 正面对峙(语言或武力)
- **Bittersweet Goodbye:** 必要但痛苦的分离
- **Moral Dilemma:** 无完美选择的困境
- **Temptation:** 面对诱惑的挣扎
- **Redemption:** 弥补过错的救赎

### Step 3: Commit

```bash
git add knowledge/emotional-beats/13-revelation.md
git add knowledge/emotional-beats/14-point-of-no-return.md
git add knowledge/emotional-beats/15-dark-night.md
git add knowledge/emotional-beats/16-sacrifice.md
git add knowledge/emotional-beats/17-awakening.md
git add knowledge/emotional-beats/18-confrontation.md
git add knowledge/emotional-beats/19-bittersweet-goodbye.md
git add knowledge/emotional-beats/20-moral-dilemma.md
git add knowledge/emotional-beats/21-temptation.md
git add knowledge/emotional-beats/22-redemption.md
git commit -m "feat(p3): add turning point and complex emotional beats"
```

---

## Task 5: 创建节拍序列设计指南

**Files:**
- Create: `knowledge/emotional-beats/beat-sequences.md`
- Create: `knowledge/emotional-beats/pacing-guide.md`

### Step 1: 编写节拍序列指南

```markdown
# Emotional Beat Sequences

## 什么是节拍序列?

节拍序列 = 一系列情感节拍的组合,构建完整的情感弧线

## 常见序列模式

### 模式 1: 关系发展序列(浪漫/友情)

```
初遇 (First Meeting)
  ↓
联结时刻 (Bonding Moment)
  ↓
误会/冲突 (Misunderstanding/Conflict)
  ↓
分离 (Separation)
  ↓
觉醒 (Awakening) - 意识到对方的重要性
  ↓
告白/和解 (Declaration/Forgiveness)
  ↓
胜利/重逢 (Triumph/Reunion)
```

**示例:** 《傲慢与偏见》伊丽莎白与达西
1. 初遇(敌对)
2. 逐渐了解
3. 达西第一次求婚(被拒)
4. 分离
5. 伊丽莎白觉醒(重新认识达西)
6. 第二次求婚(接受)

### 模式 2: 英雄成长序列

```
初遇导师 (Meeting Mentor)
  ↓
胜利(小) (Small Triumph)
  ↓
失败 (Failure)
  ↓
至暗时刻 (Dark Night)
  ↓
觉醒 (Awakening)
  ↓
牺牲 (Sacrifice)
  ↓
胜利(大) (Major Triumph)
```

**示例:** 《星球大战》卢克
1. 遇欧比旺
2. 小胜利(逃离塔图因)
3. 失败(欧比旺死亡)
4. 至暗时刻(第五部手被砍断)
5. 觉醒(认识到原力本质)
6. 牺牲(拒绝杀父亲)
7. 胜利(救赎父亲)

### 模式 3: 背叛-救赎序列

```
联结 (Bonding)
  ↓
背叛 (Betrayal)
  ↓
对峙 (Confrontation)
  ↓
分离 (Separation)
  ↓
道德困境 (Moral Dilemma) - 背叛者的挣扎
  ↓
牺牲 (Sacrifice) - 背叛者自我牺牲
  ↓
原谅 (Forgiveness)
```

**示例:** 《纳尼亚》埃德蒙
1. 与兄弟姐妹关系紧张
2. 背叛(投靠白女巫)
3. 被救出
4. 分离(单独面对后果)
5. 道德挣扎
6. 在战斗中勇敢表现
7. 被原谅

## 节拍节奏

### 正负交替
避免连续多个负面或正面节拍

**好的节奏:**
```
正面 → 负面 → 正面 → 大负面 → 大正面
胜利 → 失去 → 小胜利 → 至暗时刻 → 最终胜利
```

**差的节奏:**
```
负面 → 负面 → 负面 → 正面 ❌ (过于压抑)
正面 → 正面 → 正面 → 正面 ❌ (缺乏张力)
```

### 强度递增
情感节拍强度应逐渐升级

**示例: 失去的递增**
```
1. 失去物品(小失去)
2. 失去导师(中失去)
3. 失去爱人(大失去)
```

## 不同体裁的序列

### 爽文/升级流
- **频率:** 高频正面节拍
- **序列:** 胜利 → 小挫折 → 更大胜利
- **避免:** 长期负面

### 悲剧
- **频率:** 更多负面节拍
- **序列:** 胜利 → 失败 → 觉醒(太晚) → 毁灭
- **特点:** 至暗时刻后没有真正复苏

### 史诗奇幻
- **频率:** 平衡,但波动大
- **序列:** 多次胜利-失败循环
- **特点:** 多条线程,节拍交织
```

### Step 2: 编写节奏指南

```markdown
# Emotional Pacing Guide

## 节拍密度

### 高密度(每2-3章一个)
- **适用:** 爽文、短篇、高潮部分
- **风险:** 可能情感疲劳

### 中密度(每5-7章一个)
- **适用:** 大多数长篇小说
- **平衡:** 情节与情感并重

### 低密度(每10+章一个)
- **适用:** 注重情节/世界观的史诗
- **风险:** 可能情感苍白

## 节拍位置

### 开篇节拍
- **类型:** 初遇、失去(触发事件)
- **作用:** 建立情感基调

### 中期节拍
- **类型:** 联结、背叛、误会
- **作用:** 深化关系和冲突

### 高潮节拍
- **类型:** 对峙、牺牲、至暗时刻
- **作用:** 情感爆发

### 结尾节拍
- **类型:** 胜利、重逢、和解、苦乐参半告别
- **作用:** 情感解决

## 多线程节拍协调

当有多条故事线时:

### 错开节拍
不要所有线程同时爆发情感
```
A线 Ch10: 胜利
B线 Ch12: 失去
C线 Ch15: 对峙
```

### 主题共鸣
不同线程的节拍可呼应同一主题
```
A线: 牺牲(为团队)
B线: 牺牲(为爱人)
→ 同一章,不同线程,共同主题
```

## 读者情感曲线

### 理想曲线
```
        高潮(情感峰值)
       /\
      /  \
     /    \___中期起伏
    /
开篇建立
```

### 避免的曲线
```
平坦线: ————————— (无情感波动)
过山车: /\/\/\/\/\ (疲劳)
断崖: /\_____ (高开低走)
```
```

### Step 3: Commit

```bash
git add knowledge/emotional-beats/beat-sequences.md
git add knowledge/emotional-beats/pacing-guide.md
git commit -m "feat(p3): add beat sequences and pacing guide"
```

---

## Task 6: 编写文档

**Files:**
- Create: `docs/knowledge-bases/emotional-beats.md`

### Step 1: 编写用户文档

```markdown
# Emotional Beats Knowledge Base

## 简介

情感节拍知识库提供 22 种核心情感场景的设计模板,帮助你:
- 设计打动人心的情感场景
- 避免陈词滥调和套路
- 控制情感节奏
- 构建完整的情感弧线

## 内容概览

### 22 种核心节拍

**正面情感(6种):**
初遇、联结时刻、告白、胜利、重逢、原谅

**负面情感(6种):**
背叛、失去、拒绝、失败、误会、告别

**转折情感(6种):**
真相揭露、不归路、至暗时刻、牺牲、觉醒、对峙

**复杂情感(4种):**
苦乐参半告别、道德困境、诱惑、救赎

### 每种节拍包含

- 核心元素
- 常见套路(应避免)
- 新颖变体
- 情感真实性建议
- 经典示例分析
- 写作提示和检查清单

## 使用方法

### 自动激活
当你设计情感场景时,知识库会自动提供相关节拍的参考

### 查找特定节拍
```
我要写一个背叛场景
→ 加载 "Betrayal" 节拍
→ 查看核心元素、避免套路、新颖变体
```

### 设计节拍序列
```
我的角色关系该如何发展?
→ 查看 "Beat Sequences"
→ 选择适合的序列模式(如:关系发展序列)
→ 定制化调整
```

## 最佳实践

✅ **情感真实:** 基于角色性格和处境
✅ **避免套路:** 使用新颖变体
✅ **节奏平衡:** 正负情感交替
✅ **强度递增:** 逐渐升级情感强度
✅ **服务故事:** 情感节拍推动情节或角色成长

❌ **为情感而情感:** 不要强行插入不合理的情感场景
❌ **过度使用:** 不要每章都是情感爆发
❌ **陈词滥调:** 避免"我爱你"、"救美英雄"等老套
❌ **情感不实:** 基于巧合或强行的情感

## 示例

### 设计背叛场景

**套路写法(避免):**
```
"没想到你竟然背叛我!"他愤怒地吼道。
"对不起..."她低下头。
```

**使用知识库改进:**

查看 "Betrayal" 节拍:
- **核心元素:** 信任建立、背叛动机、揭露方式、情感反应
- **新颖变体:** 分层揭露(逐渐发现)、动机复杂化

**改进写法:**
```
开始:小细节不对劲(她的话有漏洞)
中期:更多证据(发现她在隐瞒)
高潮:真相大白(她是卧底)
但:动机复杂(她是为了保护他而不得已)
```

## 相关资源

- **Pacing Control Skill:** 整体节奏控制
- **Character Arc Skill:** 角色成长弧线
```

### Step 2: Commit

```bash
git add docs/knowledge-bases/emotional-beats.md
git commit -m "docs(p3): add emotional-beats documentation"
```

---

## 验证标准

### 内容完整性
- [ ] 包含至少 20 种情感节拍
- [ ] 每种节拍至少 400 字
- [ ] 包含节拍序列和节奏指南
- [ ] 总字数 ≥ 6000 字

### 实用性
- [ ] 核心元素清晰
- [ ] 提供新颖变体(不只是列举套路)
- [ ] 示例贴近现代作品
- [ ] 包含检查清单

### 准确性
- [ ] 节拍定义准确
- [ ] 示例分析合理
- [ ] 避免套路建议可操作

### 用户体验
- [ ] 结构清晰
- [ ] 易于查找特定节拍
- [ ] 语言通俗

---

## 预估工时

- **Task 1:** 基础结构 - 1h
- **Task 2:** 正面情感节拍(6种) - 3h
- **Task 3:** 负面情感节拍(6种) - 3h
- **Task 4:** 转折和复杂节拍(10种) - 4h
- **Task 5:** 序列和节奏指南 - 2h
- **Task 6:** 文档 - 1h

**总计:14 小时**

---

Closes: P3 优先级任务 #4
