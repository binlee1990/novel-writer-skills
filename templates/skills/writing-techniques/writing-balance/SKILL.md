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
