---
name: long-series-continuity
description: "Automatically activates when the project has more than 100 chapters - monitors cross-volume character continuity, foreshadowing expiration, and setting consistency across ultra-long novels"
allowed-tools: Read, Grep
---

# 超长篇连贯性守护

自动监控超长篇小说（>100 章）中的跨卷连贯性问题，包括角色出场间隔、伏笔到期、设定一致性等。

---

## 自动激活条件

**触发阈值**：项目章节数 > 100

**检测方法**：
```typescript
const contentDir = 'stories/*/content/';
const chapterCount = fs.readdirSync(contentDir)
  .filter(f => f.match(/^ch-\d{3,}\.md$/))
  .length;

if (chapterCount > 100) {
  // 激活 long-series-continuity skill
}
```

**激活时机**：
- `/write` 命令执行前
- `/write --batch` 每章完成后
- `/recap` 生成简报时
- `/track --check` 深度检查时

---

## 核心监控维度

### 1. 角色出场间隔提醒

**目的**：避免读者遗忘久未出场的角色

**检查流程**：
1. 识别当前章节中出现的角色名（通过 NER 或关键词匹配）
2. 查询该角色上次出场的章节号
3. 计算间隔章节数
4. 按阈值分级提醒

**数据来源（三层回退）**：
- **MCP**：`query_chapter_entities({ character: '角色名' })`
- **分片 JSON**：读取对应卷的 `character-state.json`，查找 `lastSeen`
- **单文件 JSON**：读取 `character-state.json`

**提醒格式**：

```
📌 角色出场提醒：
  赵四 上次出场在第 203 章（距今 147 章）
  当时状态：
    - 位置：青云宗外门
    - 身份：外门弟子
    - 修为：炼气七层
    - 最后行为：与林逸发生冲突后离开

  请确认本章中赵四的状态描写与上次一致。
  如有变化（如修为提升），需在文中说明。
```

**阈值配置**：

| 间隔章节数 | 级别 | 提醒 |
|----------|------|------|
| 30-50 章 | 📝 注意 | 该角色已较久未出场，注意衔接 |
| 50-100 章 | ⚠️ 警告 | 读者可能已淡忘，建议重新介绍 |
| > 100 章 | 🔴 紧急 | 强烈建议补充背景，避免读者困惑 |

---

### 2. 伏笔到期提醒

**目的**：防止伏笔埋设过久导致读者遗忘或失去兴趣

**检查流程**：
1. 查询所有 `status=active` 的伏笔
2. 计算每个伏笔的"年龄"（当前章节 - planted.chapter）
3. 查询最后一次提及的章节
4. 按阈值分级提醒

**数据来源（三层回退）**：
- **MCP**：`query_plot({ status: 'active', urgency: '>0.5' })`
- **分片 JSON**：读取 `summary/plot-summary.json` 获取未解决伏笔列表
- **单文件 JSON**：读取 `plot-tracker.json`，筛选 `status=active`

**提醒格式**：

```
⚠️ 伏笔到期提醒：
  "天魂珠的第二块碎片"（埋于第 15 章，已过 285 章）

  基本信息：
    - 重要性：高
    - 紧急度：0.85（即将过期）
    - 最后提及：第 120 章（已过 165 章）
    - 预计回收章节：第 300-350 章

  建议操作：
    1. 在近 10-20 章内安排线索推进
    2. 通过角色对话或回忆重新提醒读者
    3. 如果确定放弃，请更新 plot-tracker 状态为 'abandoned'
```

**阈值配置**：

| 伏笔年龄 | 级别 | 提醒 |
|----------|------|------|
| 100-200 章 | 📝 注意 | 该伏笔已埋设较久，考虑推进 |
| 200-500 章 | ⚠️ 警告 | 读者可能已遗忘，建议近期回收或重新提示 |
| > 500 章 | 🔴 紧急 | 严重超期，必须尽快处理或明确放弃 |

**额外检测**：
- 如果伏笔超过 100 章未提及，额外提醒需要"重新引入"
- 如果伏笔的 `urgency` > 0.9，直接标记为 🔴 紧急

---

### 3. 设定一致性检测

**目的**：确保跨卷设定描述一致，避免前后矛盾

**被动监控（写作时）**：

1. **实体识别**：
   - 地名（青云宗、天元城）
   - 组织名（东厂、天魂殿）
   - 力量等级（炼气、筑基）
   - 特殊物品（天魂珠、九转金丹）

2. **交叉验证**：
   - 当前章提到的实体，与 `story-facts.json` 交叉验证
   - MCP 优先：`query_facts({ keyword: '实体名' })`
   - 如果发现不一致，立即提醒

**提醒格式**：

```
⚠️ 设定不一致检测：
  "青云宗外门弟子人数"

  历史描述：
    - 第 12 章："青云宗外门约有三千弟子"
    - 第 156 章："青云宗外门弟子超过五千"

  当前章节：
    - 第 303 章："青云宗外门弟子仅两千余人"

  冲突类型：数量不一致（且无战争/天灾等合理解释）

  建议：
    1. 确认是否有剧情原因导致人数减少
    2. 如果是笔误，修正为符合历史描述的数字
    3. 如果确定修改设定，更新 story-facts.json
```

**主动检测（/track --check 时）**：
- 配合 `consistency-checker` skill 执行深度检查
- 重点关注跨卷的设定变化
- 生成详细的不一致报告

**数据来源（三层回退）**：
- **MCP**：`query_facts()` + `search_content({ query: '实体名' })`
- **分片 JSON**：读取 `story-facts.json` + Grep 搜索章节内容
- **单文件 JSON**：读取 `story-facts.json` + Grep 搜索章节内容

---

### 4. 角色称呼一致性

**目的**：监控同一角色在不同章节中的称呼变化，确保合理过渡

**检查流程**：
1. 识别当前章节中对角色的称呼
2. 查询该角色的历史称呼记录
3. 如果出现新称呼，检查是否有合理过渡

**提醒格式**：

```
📝 称呼变化检测：
  "林逸" 在不同章节中的称呼变化：

  历史称呼：
    - 第 1-50 章：林逸、小逸（母亲称呼）
    - 第 51-150 章：林逸、林师弟（同门称呼）
    - 第 151-250 章：林道友（外派交流）

  当前章节（第 303 章）：
    - 新称呼：林前辈

  分析：
    ✓ 称呼升级合理（修为提升，辈分上升）
    ⚠️ 建议：在首次使用新称呼时，通过对话或旁白说明原因
```

**特殊场景**：
- 如果称呼突然降级（道友 → 师弟），标记为 🔴 异常
- 如果亲密称呼突变（小逸 → 林道友），提示检查关系变化
- 如果不同角色对同一人的称呼不一致，提示确认是否合理

**数据来源**：
- **MCP**：`search_content({ query: '角色名' })` 获取所有出现位置，分析上下文
- **分片 JSON**：Grep 搜索章节内容，分析称呼
- **单文件 JSON**：同上

---

## 与其他命令的协作

### 在 /write 期间

**前置检查**（写作开始前）：
```
🔍 超长篇连贯性预检：
  ✓ 本章涉及 3 个角色，无长期缺席
  ⚠️ 1 个伏笔接近超期（详见下方）
  ✓ 无设定冲突风险
```

**实时监控**（写作过程中）：
- 被动监控设定一致性
- 角色出场时自动加载上次状态

**后置检查**（写作完成后）：
- 更新角色 `lastSeen` 字段
- 更新伏笔 `lastMentioned` 字段（如果本章提及）

---

### 在 /write --batch 期间

**轻量检查**（每章完成后）：
- 角色出场间隔检查
- 伏笔到期检查

**完整检查**（批量完成后）：
- 执行全部四个维度的深度检查
- 生成批量章节的连贯性报告

---

### 在 /recap 期间

**附加信息**（在简报末尾）：

```
🚨 超长篇连贯性提醒：

  超期伏笔（2 个）：
    • "天魂珠第二块碎片"（已过 285 章，紧急度 0.85）
    • "师姐的身世之谜"（已过 178 章，紧急度 0.65）

  久未出场角色（3 个）：
    • 赵四（距今 147 章）
    • 王五（距今 89 章）
    • 李六（距今 62 章）

  设定提醒：
    • 青云宗外门弟子人数在第 156 章和第 303 章描述不一致
```

---

### 在 /track --check 期间

**提供额外检查维度**：
- 跨卷角色出场间隔统计
- 跨卷伏笔年龄分布
- 跨卷设定一致性深度检查
- 跨卷称呼变化合理性分析

**生成专项报告**：
```
📊 超长篇连贯性深度检查报告
━━━━━━━━━━━━━━━━━━━━

角色出场间隔分析：
  正常范围（< 30 章）：85% 的角色
  需要关注（30-50 章）：10% 的角色
  严重缺席（> 50 章）：5% 的角色

伏笔年龄分析：
  健康（< 100 章）：60% 的伏笔
  接近超期（100-200 章）：25% 的伏笔
  已超期（> 200 章）：15% 的伏笔

设定一致性分析：
  无冲突：90% 的设定
  轻微不一致：8% 的设定
  严重矛盾：2% 的设定

建议：
  1. 优先处理 3 个严重超期伏笔
  2. 安排 5 个久未出场角色的戏份
  3. 修复 2 个严重设定矛盾
```

---

## 数据来源优先级

所有检查遵循 **三层回退** 机制：

### Layer 3: MCP 工具（优先）

```typescript
// 角色出场查询
const lastSeen = await mcp.call('novelws-mcp/query_chapter_entities', {
  character: '赵四',
  type: 'lastSeen'
});

// 伏笔查询
const overduePlots = await mcp.call('novelws-mcp/query_plot', {
  status: 'active',
  urgency: '>0.5'
});

// 事实查询
const facts = await mcp.call('novelws-mcp/query_facts', {
  keyword: '青云宗'
});

// 全文搜索
const mentions = await mcp.call('novelws-mcp/search_content', {
  query: '天魂珠',
  volume: 'all'
});
```

**优势**：
- 毫秒级响应
- 自动聚合统计
- 支持复杂查询

---

### Layer 2: 分片 JSON（次优）

```bash
# 读取摘要
character_summary=$(cat tracking/summary/characters-summary.json)
plot_summary=$(cat tracking/summary/plot-summary.json)

# 读取特定卷
if [[ -n "$VOLUME" ]]; then
  character_state=$(cat "tracking/volumes/$VOLUME/character-state.json")
  plot_tracker=$(cat "tracking/volumes/$VOLUME/plot-tracker.json")
fi

# Grep 搜索
grep -rn "青云宗" stories/*/content/
```

**适用场景**：
- MCP 未启用
- 需要精确章节级别数据
- 快速扫描摘要

---

### Layer 1: 单文件 JSON（兜底）

```bash
# 读取完整 tracking 数据
character_state=$(cat tracking/character-state.json)
plot_tracker=$(cat tracking/plot-tracker.json)
story_facts=$(cat tracking/story-facts.json)

# Grep 搜索
grep -rn "天魂珠" stories/*/content/
```

**向下兼容**：小型项目（< 300 章）使用单文件模式

---

## 配置选项

本 skill **无需手动配置**，自动根据项目规模激活。

### 自定义阈值（可选）

如需调整提醒阈值，可在 `stories/*/specification.md` 的 frontmatter 中添加：

```yaml
long-series:
  # 角色出场间隔警告阈值（章）
  character-gap-warning: 50
  character-gap-critical: 100

  # 伏笔超期警告阈值（章）
  foreshadow-warning: 200
  foreshadow-critical: 500

  # 伏笔未提及警告阈值（章）
  foreshadow-mention-gap: 100

  # 是否启用称呼一致性检查
  check-name-consistency: true

  # 是否启用设定一致性检查
  check-setting-consistency: true
```

### 禁用特定检查

如果某些检查不适用，可以禁用：

```yaml
long-series:
  enabled-checks:
    - character-gap        # 角色出场间隔
    - foreshadow-expiry    # 伏笔到期
    # - setting-consistency  # 设定一致性（已禁用）
    # - name-consistency     # 称呼一致性（已禁用）
```

---

## 性能考虑

**轻量化设计**：
- 所有检查基于现有 tracking 数据，无需重新读取章节内容
- MCP 查询采用索引，毫秒级响应
- 仅在必要时执行深度检查（如 `/track --check`）

**缓存策略**：
- 角色 `lastSeen` 缓存在 `character-state.json`
- 伏笔 `lastMentioned` 缓存在 `plot-tracker.json`
- 避免重复的全文搜索

**渐进式检查**：
- `/write` 期间：仅检查当前章涉及的角色和伏笔
- `/write --batch` 期间：批量章节完成后统一检查
- `/track --check` 期间：执行完整深度检查

---

## 使用示例

### 场景 1：写作时的实时提醒

```bash
用户：/write 第303章
AI：准备写作第 303 章...

🔍 超长篇连贯性预检（long-series-continuity）：

  📌 角色出场提醒：
    • 赵四（距今 147 章）- 上次状态：外门弟子，炼气七层

  ⚠️ 伏笔到期提醒：
    • "天魂珠第二块碎片"（埋于第 15 章，已过 288 章）
      → 建议在本章或近期章节推进此线索

  ✓ 无设定冲突风险

继续写作？
```

---

### 场景 2：recap 时的附加提醒

```bash
用户：/recap --brief
AI：【简报内容...】

━━━━━━━━━━━━━━━━━━━━

🚨 超长篇连贯性提醒（long-series-continuity）：

  超期伏笔（2 个）：
    • "天魂珠第二块碎片"（已过 288 章，🔴 紧急）
    • "师姐身世之谜"（已过 178 章，⚠️ 警告）

  久未出场角色（3 个）：
    • 赵四（147 章）、王五（89 章）、李六（62 章）

  💡 建议：在接下来的 20 章内安排这些伏笔或角色的戏份
```

---

### 场景 3：深度检查时的完整报告

```bash
用户：/track --check
AI：执行深度一致性检查...

【常规检查报告...】

━━━━━━━━━━━━━━━━━━━━

📊 超长篇连贯性深度检查（long-series-continuity）：

角色出场间隔分析：
  健康（< 30 章）：85% (17/20)
  关注（30-50 章）：10% (2/20)
  缺席（> 50 章）：5% (1/20)

  严重缺席角色：
    • 赵四（147 章）- 最后出场：第 156 章

伏笔年龄分析：
  健康（< 100 章）：60% (6/10)
  接近超期（100-200 章）：20% (2/10)
  已超期（> 200 章）：20% (2/10)

  超期伏笔：
    • "天魂珠第二块碎片"（288 章，🔴）
    • "师姐身世之谜"（178 章，⚠️）

设定一致性分析：
  无冲突：95% (19/20)
  轻微不一致：5% (1/20)

  不一致设定：
    • "青云宗外门弟子人数"（第 156 章 vs 第 303 章）

称呼一致性分析：
  合理过渡：90% (9/10)
  需要确认：10% (1/10)

  需确认的称呼变化：
    • 林逸：林道友 → 林前辈（第 303 章）

━━━━━━━━━━━━━━━━━━━━

💡 优先级建议：
  1️⃣ 🔴 处理 2 个严重超期伏笔
  2️⃣ ⚠️ 安排 1 个严重缺席角色的戏份
  3️⃣ 📝 修复 1 个设定不一致
```

---

## 注意事项

1. **自动激活**：章节数 > 100 时自动启用，无需手动配置
2. **轻量运行**：基于 tracking 数据，不影响写作性能
3. **渐进式检查**：写作时轻量检查，深度检查时完整分析
4. **三层回退**：优先使用 MCP，兼容分片和单文件模式
5. **可配置**：阈值可根据项目特点自定义调整

---

## 与其他 Skill 的协作

- **consistency-checker**: 提供跨卷一致性检查的补充维度
- **foreshadow-tracker**: 共享伏笔数据，互相补充
- **character-arc**: 结合角色弧线检查出场频率合理性

---

## 版本信息

- **版本**：1.0.0
- **适用**：章节数 > 100 的超长篇项目
- **依赖**：需要 tracking 数据（character-state, plot-tracker, story-facts）
- **可选**：MCP 工具（novelws-mcp）以获得最佳性能
