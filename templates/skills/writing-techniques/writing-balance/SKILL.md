---
name: writing-balance-monitor
description: "Use when writing to monitor writing balance across 6 dimensions - provides real-time scoring and improvement suggestions to avoid AI-like patterns"
allowed-tools: Read
---

# Writing Balance - 智能写作平衡监控

## Skill类型
- **类别**: writing-techniques
- **激活方式**: /write 命令自动激活
- **优先级**: 高（核心创作质量保障）

## 设计理念

从"禁止列表"转向"平衡评分"——不强制100分，70-85分即为优秀。

**核心原则**:
1. **平衡优于完美** - 允许适度使用AI常用词,但要求多样化
2. **自然优于机械** - 长短句混合、词汇丰富、层次分明
3. **指导优于禁止** - 给出改进建议,而非简单拒绝

## 功能概述

实时监控写作平衡度,提供6个维度的评分和具体改进建议。

---

## 核心指标（6个维度）

### 1. 句长分布平衡度 (Sentence Length Distribution)

**检测标准**:
- 短句（<12字）: 30-40%
- 中句（12-25字）: 40-50%
- 长句（>25字）: 10-20%

**评分算法**:

```python
# 伪代码示例
def score_sentence_length(sentences):
    short = count(len(s) < 12 for s in sentences)
    medium = count(12 <= len(s) <= 25 for s in sentences)
    long = count(len(s) > 25 for s in sentences)

    total = len(sentences)
    short_pct = short / total
    medium_pct = medium / total
    long_pct = long / total

    # 理想分布：短35% 中50% 长15%
    ideal = (0.35, 0.50, 0.15)
    actual = (short_pct, medium_pct, long_pct)

    # 计算偏差（欧氏距离）
    deviation = sqrt(sum((a - i)^2 for a, i in zip(actual, ideal)))

    # 转换为分数（0-100）
    score = max(0, 100 - deviation * 200)
    return score
```

**示例输出**:
```yaml
句长分布：85/100 ✅
  短句: 38% (目标30-40%)
  中句: 48% (目标40-50%)
  长句: 14% (目标10-20%)

改进建议: 当前分布良好，保持节奏变化
```

**常见问题**:
- ❌ 短句过多（>60%）→ 节奏单一，缺乏张力
- ❌ 长句过多（>30%）→ 读者容易疲劳
- ✅ 平衡分布 → 节奏自然，适合长篇阅读

---

### 2. 词汇丰富度 (Lexical Diversity)

**检测标准**:
- TTR (Type-Token Ratio) > 0.65
- 高频词（出现5次+）不超过总词数的15%
- 同义词轮换（"说"的同义词：讲、开口、道、答、回、问、应）

**评分算法**:
```python
def score_lexical_diversity(text):
    tokens = tokenize(text)
    types = set(tokens)
    ttr = len(types) / len(tokens)

    # TTR > 0.65 为优秀
    if ttr >= 0.65:
        score = 100
    else:
        score = (ttr / 0.65) * 100

    return score, ttr
```

**示例输出**:
```yaml
词汇丰富度：72/100 ⚠️
  TTR: 0.58 (目标>0.65)
  高频词: "说"出现8次

改进建议:
  - "说"的同义词：讲、开口、道、答、回、问、应
  - 尝试用动作/表情代替对话标签
```

---

### 3. 描写层次感 (Descriptive Depth)

**检测标准**:
- 感官分布: 视觉40% | 听觉20% | 触/嗅/味40%
- 形容词密度: 4-8个/100字
- 动/名/形平衡: 5:3:2

**评分算法**:
```python
def score_descriptive_depth(text):
    adjectives = extract_adjectives(text)
    adj_density = len(adjectives) / (len(text) / 100)

    # 4-8个/100字为理想
    if 4 <= adj_density <= 8:
        score = 100
    elif adj_density < 4:
        score = (adj_density / 4) * 100
    else:  # > 8
        score = 100 - (adj_density - 8) * 10

    return score
```

**示例输出**:
```yaml
描写层次：68/100 ⚠️
  形容词密度: 3.2/100字 (目标4-8)
  感官分布: 视觉85% 听觉10% 其他5%

改进建议:
  - 增加触觉描写（温度、质感）
  - 增加嗅觉描写（气味、香味）
  - 当前过度依赖视觉，尝试多感官交叉
```

---

### 4. 成语/四字词使用度 (Idiom Usage)

**检测标准**:
- ≤5个成语/1000字
- 口语化成语优先
- 避免连续使用

**白名单**（口语化成语，可用）:
- 一言难尽、莫名其妙、不以为然、若无其事、心照不宣
- 半信半疑、理所当然、面面相觑、目瞪口呆、张口结舌

**黑名单**（文言成语，避免）:
- 肝肠寸断、踌躇满志、从容不迫、五味杂陈、百感交集
- 欣喜若狂、怒不可遏、忐忑不安、惴惴不安、如释重负

**评分算法**:
```python
def score_idiom_usage(text, idioms):
    count = len(idioms)
    limit = len(text) / 1000 * 5  # 5个/1000字

    if count <= limit:
        score = 100
    else:
        score = max(0, 100 - (count - limit) * 10)

    # 检查黑名单成语
    blacklist_count = count_blacklist_idioms(idioms)
    score -= blacklist_count * 15

    return max(0, score)
```

**示例输出**:
```yaml
成语使用：90/100 ✅
  总数: 2个/1000字 (目标≤5)
  口语化: 2个 ✅
  文言化: 0个 ✅

改进建议: 成语使用合理，保持当前水平
```

---

### 5. 句式变化度 (Sentence Pattern Variety)

**检测标准**:
- 避免连续3个以上相同句式
- 主谓宾/倒装/省略/疑问句混合
- AI高频句式限制频率（≤2次/1000字）

**AI高频句式**（需要限制频率）:
1. "在...下" - 在月光的照耀下
2. "仿佛...一般" - 快得仿佛一阵风一般
3. "此时此刻" - 此时此刻，她的心情
4. "让...让..." - 温热的触感让她的思绪
5. "然而" - 然而，事情并不像

**评分算法**:
```python
def score_pattern_variety(sentences):
    patterns = extract_patterns(sentences)
    consecutive = max_consecutive_same_pattern(patterns)
    ai_patterns = count_ai_patterns(sentences)

    # 连续相同句式扣分
    score = 100 - max(0, consecutive - 2) * 20

    # AI高频句式扣分
    ai_limit = len(sentences) / 1000 * 2
    if ai_patterns > ai_limit:
        score -= (ai_patterns - ai_limit) * 10

    return max(0, score)
```

**示例输出**:
```yaml
句式变化：65/100 ⚠️
  连续相同句式: 5个主谓宾结构
  AI高频句式: "在...下"出现3次

改进建议:
  - 增加倒装句："门，开了"而非"门开了"
  - 增加省略句："他走了。没回头。"
  - 减少"在...下"句式（当前3次，建议≤2次/1000字）
```

---

### 6. 自然度评分 (Naturalness Score)

**检测标准**:
- 标点变化: 句号70% | 问号10% | 感叹号5% | 逗号15%
- 段落长度: 1-6句混合
- 对话真实: 语气词、口头禅、未完成句

**评分算法**:
```python
def score_naturalness(text, paragraphs, dialogues):
    # 标点分布评分
    punctuation_score = score_punctuation_variety(text)

    # 段落长度评分
    para_lengths = [count_sentences(p) for p in paragraphs]
    para_score = score_paragraph_variety(para_lengths)

    # 对话真实度评分
    dialogue_score = score_dialogue_naturalness(dialogues)

    return (punctuation_score + para_score + dialogue_score) / 3
```

**示例输出**:
```yaml
自然度：80/100 ✅
  标点分布: 句号75% 问号8% 感叹号3% 逗号14%
  段落长度: 1-5句混合 ✅
  对话真实度: 包含语气词"啊、吧" ✅

改进建议: 自然度良好，对话真实感强
```

---

## 综合评估输出格式

当用户使用 `/write` 命令完成一段写作后，自动输出平衡度评估报告：

```yaml
📊 写作平衡度评估报告

总分：78/100 (良好)

详细维度：
  ✅ 句长分布：85/100 (短30% 中50% 长20%)
  ⚠️ 词汇丰富度：72/100 ("说"出现8次，建议轮换)
  ⚠️ 描写层次：68/100 (形容词偏少，建议增加触觉描写)
  ✅ 成语使用：90/100 (仅2个，且均为口语化)
  ⚠️ 句式变化：65/100 (连续5个主谓宾结构)
  ✅ 自然度：80/100 (段落长度自然，对话真实)

改进建议（优先级排序）：
  1. 【高】增加1-2个长句（>30字）丰富节奏
  2. 【中】"说"的同义词：讲、开口、道、答
  3. 【中】第3段加入嗅觉描写（咖啡香气）
  4. 【低】尝试倒装句增加句式变化
```

**评分等级**:
- 90-100: 优秀 ⭐⭐⭐⭐⭐
- 80-89: 良好 ⭐⭐⭐⭐
- 70-79: 良好 ⭐⭐⭐
- 60-69: 及格 ⚠️ 需改进
- <60: 不及格 ❌ 需要大幅调整

**说明**:
- 总分70-85为推荐范围（过高可能过度优化）
- 不要追求100分（会导致僵化）
- 维度间可以互补（如句式变化略低但词汇丰富度高）

---

## 配置化支持

用户可在 `specification.md` 中自定义阈值：

```yaml
writing_balance_config:
  strictness: medium  # strict | medium | loose

  # 自定义目标分布
  sentence_length_target:
    short: 35%        # 默认30-40%
    medium: 50%       # 默认40-50%
    long: 15%         # 默认10-20%

  # 成语配置
  allow_idioms: true
  idiom_limit_per_1000: 5

  # 形容词密度
  adjective_density: 6  # per 100 words

  # 自定义白名单（额外允许的词）
  custom_whitelist:
    - "某个特殊成语"

  # 自定义黑名单（额外禁用的词）
  custom_blacklist:
    - "某个讨厌的词"
```

**严格度模式**:
- **strict**: 阈值更严格，评分更严苛（适合追求极致去AI的作者）
- **medium**: 默认平衡模式（推荐）
- **loose**: 宽松模式，允许更多灵活性（适合快速创作）

---

## 使用示例

### 场景1：写作中实时监控

```
用户: /write 继续写第3章

[AI生成500字内容]

AI自动评估:
📊 写作平衡度评估报告
总分：82/100 (良好) ⭐⭐⭐⭐

详细维度：
  ✅ 句长分布：88/100
  ✅ 词汇丰富度：85/100
  ⚠️ 描写层次：70/100 (可增加嗅觉描写)
  ✅ 成语使用：95/100
  ✅ 句式变化：80/100
  ✅ 自然度：85/100

改进建议：
  - 当前平衡度良好，可继续保持
  - 可选：增加1-2处嗅觉描写增强沉浸感
```

### 场景2：用户主动检查

```
用户: /analyze --focus=balance --range ch-10

[AI分析第10章]

输出:
📊 第10章 写作平衡度评估

总分：68/100 (及格) ⚠️

详细维度：
  ⚠️ 句长分布：55/100 (短句72%，过多)
  ⚠️ 词汇丰富度：60/100 (TTR=0.52)
  ✅ 描写层次：85/100
  ✅ 成语使用：90/100
  ⚠️ 句式变化：58/100 (连续10个主谓宾)
  ✅ 自然度：80/100

改进建议（优先级排序）：
  1. 【高】增加5-8个长句（>30字），当前长句仅3%
  2. 【高】句式过于单一，尝试倒装/省略/疑问句
  3. 【中】扩展词汇，参考同义词表
```

---

## 与 anti-ai-v4 的对比

| 维度 | anti-ai-v4（禁止列表） | writing-balance（平衡评分） |
|------|----------------------|---------------------------|
| **方法** | 200+禁用词 + 7层规则 | 6个维度评分 |
| **结果** | 零AI味，但文学性差 | 平衡AI识别度与自然表达 |
| **句长** | 强制80%<15字 | 灵活分布（短30-40% 中40-50% 长10-20%） |
| **形容词** | 限制3个/100字 | 允许4-8个/100字 |
| **成语** | 完全禁用 | 允许口语成语（≤5个/1000字） |
| **用户体验** | 规则机械，缺乏灵活性 | 给出建议，用户可选择 |

---

## 实施建议

1. **渐进式启用**: 先用 `loose` 模式熟悉系统，再逐步调整为 `medium`
2. **保留v4选项**: 如果用户确实需要极端去AI，可以在配置中启用 `anti-ai-v4-mode: true`
3. **定期校准**: 每写完10章后，运行一次全章节平衡度分析
4. **个性化配置**: 根据自己的写作风格调整阈值

---

## 技术实现说明

**For Claude Code**:
- 本Skill在 `/write` 命令结束后自动激活
- 读取用户配置（如有）：`specification.md` 中的 `writing_balance_config`
- 分析生成的文本，计算6个维度评分
- 输出综合报告和改进建议

**注意**:
- 评分算法为伪代码示例，实际实现由AI根据文本内容分析
- 不需要复杂的NLP库，基于正则表达式和简单统计即可
- 重点是给出有价值的建议，而非精确的数值

---

## 版本历史

- **v1.0** (2026-02-15): 初始版本，6个维度评分系统
- 替代: anti-ai-v4.md（保留为 anti-ai-v4-deprecated.md）

---

## 参考资料

- 设计文档: `docs/plans/2026-02-14-optimization-design.md`
- 替代规则: `templates/knowledge-base/requirements/anti-ai-v4-deprecated.md`
- 协同Skill: `templates/skills/writing-techniques/writing-techniques/SKILL.md`

---
