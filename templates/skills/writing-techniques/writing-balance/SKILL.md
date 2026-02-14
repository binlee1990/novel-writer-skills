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
