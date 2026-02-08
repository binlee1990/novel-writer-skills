# /recap 上下文重建算法文档

本文档详细说明 `/recap` 命令使用的智能汇总算法。

---

## 1. 伏笔优先级判断算法

### 数据来源

`spec/tracking/plot-tracker.json` → `foreshadowing` 数组

### 输入

```json
{
  "id": "foreshadow-001",
  "content": "伏笔内容描述",
  "planted": { "chapter": 5, "description": "..." },
  "hints": [...],
  "plannedReveal": { "chapter": 25, "description": "..." },
  "status": "active",
  "importance": "high"
}
```

### 算法

```
function calculate_foreshadow_priority(foreshadow, current_chapter):
    # 仅处理 status == "active" 的伏笔
    if foreshadow.status != "active":
        return SKIP

    chapters_since = current_chapter - foreshadow.planted.chapter
    planned_resolve = foreshadow.plannedReveal.chapter

    # 高优先级条件（满足任一即为高优先级）
    if chapters_since > 15:
        return HIGH  # 超期未处理
    if planned_resolve != null AND planned_resolve - current_chapter <= 3:
        return HIGH  # 即将需要解决

    # 中优先级
    if chapters_since > 8:
        return MEDIUM

    # 低优先级
    return LOW
```

### 处理建议生成

```
function generate_foreshadow_advice(foreshadow, current_chapter):
    chapters_since = current_chapter - foreshadow.planted.chapter
    planned_resolve = foreshadow.plannedReveal.chapter

    if chapters_since > 15 AND planned_resolve < current_chapter:
        return "此伏笔已严重超期，建议在接下来 3 章内处理或明确推迟"

    if chapters_since > 15 AND planned_resolve >= current_chapter:
        return "此伏笔时间较长，建议在近期章节中埋入暗示保持读者兴趣"

    if planned_resolve - current_chapter <= 3:
        return "此伏笔即将到达计划解决点，请在第 {planned_resolve} 章前做好铺垫"

    return null  # 无需特别建议
```

---

## 2. 角色状态警告算法

### 数据来源

`spec/tracking/character-state.json` → `supportingCharacters` + `appearanceTracking`

### 算法

```
function check_character_warnings(character_state, current_chapter):
    warnings = []

    # 检查主角
    protagonist = character_state.protagonist
    if protagonist.currentStatus.chapter != null:
        last_seen = protagonist.currentStatus.chapter
        gap = current_chapter - last_seen
        if gap > 5:
            warnings.append({
                character: protagonist.name,
                type: "protagonist_absence",
                gap: gap,
                message: "主角已 {gap} 章未更新状态"
            })

    # 检查配角
    for name, char in character_state.supportingCharacters:
        if char.importance == "high":
            threshold = 10
        elif char.importance == "medium":
            threshold = 15
        else:
            continue  # 低重要性角色不检查

        last_seen = char.status.lastSeen.chapter
        if last_seen == null:
            continue  # 从未出场，不算警告

        gap = current_chapter - last_seen
        if gap > threshold:
            warnings.append({
                character: name,
                type: "absence",
                importance: char.importance,
                gap: gap,
                threshold: threshold,
                message: "{name} 已 {gap} 章未出场（{importance} 角色，阈值 {threshold} 章）"
            })

    return warnings
```

### 阈值说明

| 角色重要性 | 缺席阈值 | 说明 |
|-----------|---------|------|
| high | 10 章 | 重要角色长期缺席会让读者遗忘 |
| medium | 15 章 | 中等重要性角色有更宽的容忍度 |
| low | 不检查 | 低重要性角色可以长期不出场 |

---

## 3. 关系变化趋势算法

### 数据来源

`spec/tracking/relationships.json` → `history` 数组 + `characters.*.dynamicRelations`

### 算法

```
function analyze_relationship_trends(relationships, current_chapter):
    trends = []
    recent_range = max(1, current_chapter - 5)

    # 从 history 中提取最近 5 章的变化（保留 chapter 信息）
    recent_changes = []
    for entry in relationships.history:
        if entry.chapter >= recent_range:
            for change in entry.changes:
                recent_changes.append({
                    ...change,
                    chapter: entry.chapter
                })

    # 按 impact 排序
    recent_changes.sort(key=lambda c: impact_order(c.impact))

    # 只展示 high 和 medium impact 的变化
    for change in recent_changes:
        if change.impact in ["high", "medium"]:
            trends.append({
                characters: change.characters,
                type: change.type,
                relation: change.relation,
                impact: change.impact,
                chapter: change.chapter
            })

    # 从 dynamicRelations 提取趋势方向
    for char_name, char_data in relationships.characters:
        for relation in char_data.dynamicRelations:
            trends_for_pair = {
                characters: [char_name, relation.character],
                trajectory: relation.trajectory,
                current: relation.current,
                symbol: trajectory_to_symbol(relation.trajectory)
            }
            trends.append(trends_for_pair)

    return trends

function trajectory_to_symbol(trajectory):
    mapping = {
        "positive": "↗",
        "negative": "↘",
        "stable": "→",
        "volatile": "↕"
    }
    return mapping.get(trajectory, "→")

function impact_order(impact):
    order = {"high": 0, "medium": 1, "low": 2}
    return order.get(impact, 3)
```

---

## 4. 节奏评估算法

### 数据来源

最近 5 章内容 + `plot-tracker.json`

### 算法

```
function evaluate_pacing(recent_chapters):
    # 分析每章的事件密度
    densities = []
    for chapter in recent_chapters:
        density = count_plot_events(chapter)
        densities.append(density)

    # 计算统计指标
    mean = average(densities)
    variance = calculate_variance(densities)
    max_val = max(densities)
    min_val = min(densities)

    # 评估
    if variance < 2:
        return {
            assessment: "过于平淡",
            suggestion: "建议增加起伏，穿插高潮和低谷",
            detail: "最近 5 章的事件密度变化过小（方差 {variance}）"
        }

    if mean > 7:
        return {
            assessment: "过于紧张",
            suggestion: "建议适当放缓，让读者有喘息的空间",
            detail: "最近 5 章的平均事件密度为 {mean}，持续处于高压"
        }

    if max_val - min_val > 5:
        return {
            assessment: "节奏良好",
            suggestion: "有张有弛的节奏感",
            detail: "事件密度在 {min_val}-{max_val} 之间波动"
        }

    return {
        assessment: "节奏正常",
        suggestion: null,
        detail: "事件密度适中"
    }

function count_plot_events(chapter_content):
    # 从章节内容中识别关键情节点
    # 基于以下标志：
    #   - 场景转换（时间/地点变化）
    #   - 对话冲突（争论、揭示、承诺）
    #   - 动作事件（追逐、打斗、逃跑）
    #   - 情感转折（关系变化、内心决定）
    #   - 信息揭露（秘密、真相、伏笔回收）
    #
    # 每个标志计 1-2 分
    # 返回 1-10 的密度评分
    pass
```

### 评估标准

| 密度评分 | 描述 | 示例 |
|---------|------|------|
| 1-3 | 低 | 日常对话、环境描写、内心独白 |
| 4-6 | 中 | 一般情节推进、小冲突、铺垫 |
| 7-9 | 高 | 重大事件、高潮、反转、决战 |
| 10 | 极高 | 多线并进、连续反转 |

---

## 5. 数据完整性评估

### 算法

```
function assess_data_completeness(story_dir):
    score = 0
    max_score = 10
    missing = []

    files = {
        "spec/tracking/character-state.json": 2,
        "spec/tracking/plot-tracker.json": 2,
        "spec/tracking/relationships.json": 2,
        "spec/tracking/timeline.json": 1,
        "specification.md": 1,
        "creative-plan.md": 1,
        "tasks.md": 1
    }

    for file, weight in files:
        if exists(file):
            score += weight
        else:
            missing.append(file)

    completeness = score / max_score * 100

    return {
        score: score,
        max_score: max_score,
        completeness: completeness,
        missing: missing,
        quality: categorize(completeness)
    }

function categorize(completeness):
    if completeness >= 90: return "优秀"
    if completeness >= 70: return "良好"
    if completeness >= 50: return "基本可用"
    return "数据不足"
```

---

## 6. 上一章内容提取算法

### 算法

```
function extract_last_chapter_summary(chapter_content):
    # 1. 提取标题
    title = extract_first_heading(chapter_content)

    # 2. 统计字数
    word_count = count_chinese_characters(chapter_content)

    # 3. 提取结尾段落（续写衔接点）
    paragraphs = split_into_paragraphs(chapter_content)
    ending = paragraphs[-3:]  # 最后 3 段

    # 4. 概括核心事件（AI 分析）
    events = ai_summarize_events(chapter_content, max_events=5)

    # 5. 分析结尾状态
    ending_state = {
        has_cliffhanger: detect_cliffhanger(ending),
        time_point: extract_time_from_context(chapter_content),
        location: extract_location_from_context(chapter_content)
    }

    return {
        title: title,
        word_count: word_count,
        ending_text: join(ending),
        events: events,
        ending_state: ending_state
    }
```

---

## 附录：数据结构快速参考

### character-state.json 关键字段

```
protagonist.currentStatus.location  → 主角位置
protagonist.currentStatus.chapter   → 最后更新章节
protagonist.development.currentPhase → 弧线阶段
supportingCharacters[name].importance → 角色重要性（high/medium/low）
supportingCharacters[name].status.lastSeen.chapter → 最后出场章节
characterGroups.active → 活跃角色列表
```

### plot-tracker.json 关键字段

```
currentState.chapter → 当前章节
plotlines.main.status → 主线状态
plotlines.main.completedNodes → 已完成节点
plotlines.subplots[].status → 副线状态
foreshadowing[].status → 伏笔状态（active/resolved/abandoned）
foreshadowing[].planted.chapter → 伏笔埋下章节
foreshadowing[].plannedReveal.chapter → 计划揭示章节
notes.inconsistencies → 不一致性记录
```

### relationships.json 关键字段

```
characters[name].dynamicRelations[].trajectory → 关系趋势
characters[name].dynamicRelations[].current → 当前关系
history[].chapter → 变化发生的章节
history[].changes[].impact → 变化影响力（high/medium/low）
factions[].status → 派系状态
```

### timeline.json 关键字段

```
events[].day → 故事内天数
events[].chapter → 对应章节
events[].event → 事件描述
events[].participants → 参与角色
```
