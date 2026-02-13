---
name: search
description: 全文搜索章节内容和 tracking 数据（支持中文分词、正则表达式、范围过滤）
argument-hint: <关键词> [--type=content|tracking|all] [--volume vol-XX] [--fuzzy] [--regex]
allowed-tools: Read, Grep, Bash
---

# /search — 全文搜索引擎

在章节内容和 tracking 数据中进行高性能全文搜索，支持中文分词、模糊匹配、正则表达式。

---

## 核心功能

1. **章节内容搜索** - 在已写章节中搜索文本片段
2. **Tracking 数据搜索** - 在角色、情节、事实等数据中搜索
3. **混合搜索** - 同时搜索内容和数据
4. **智能排序** - 按相关性、章节顺序、出现频率排序
5. **上下文预览** - 显示搜索结果的上下文片段

---

## 数据加载策略

本命令采用 **三层回退** 机制执行搜索：

### Layer 3: MCP FTS5 全文搜索（优先）

```typescript
// 如果 MCP 已启用且数据已同步
const results = await mcp.call('novelws-mcp/search_content', {
  query: '沈玉卿',
  volume: 'vol-03',     // 可选
  limit: 50
});
```

**优势**：
- **中文分词支持**：自动处理中文分词
- **高性能**：SQLite FTS5 索引，毫秒级响应
- **相关性排序**：基于 BM25 算法自动排序
- **CJK 回退**：FTS5 不支持时自动回退到 LIKE 搜索

### Layer 2: 分片 Grep（次优）

```bash
# 当 spec/tracking/volumes/ 存在时
if [[ -n "$VOLUME_FILTER" ]]; then
  # 仅搜索指定卷
  grep -rn "$QUERY" "stories/*/content/" | grep "ch-$(volume_to_range $VOLUME_FILTER)"
  grep -rn "$QUERY" "spec/tracking/volumes/$VOLUME_FILTER/"
else
  # 搜索所有内容
  grep -rn "$QUERY" "stories/*/content/"
  grep -rn "$QUERY" "spec/tracking/volumes/"
fi
```

**适用场景**：
- MCP 未启用或同步延迟
- 需要正则表达式搜索
- 搜索未索引的新内容

### Layer 1: 单文件 Grep（兜底）

```bash
# 传统模式，搜索所有文件
grep -rn "$QUERY" "stories/*/content/"
grep -rn "$QUERY" "spec/tracking/"
```

**向下兼容**：小型项目（< 300 章）使用标准 Grep

---

## 执行流程

### Step 1: 解析参数

```javascript
const args = parseArguments($ARGUMENTS);

// 搜索关键词（必填）
const query = args.query || args._[0];
if (!query) {
  throw new Error("请指定搜索关键词：/search <关键词>");
}

// 搜索类型（可选）
const searchType = args.type || 'all'; // content | tracking | all

// 卷过滤（可选）
const volumeFilter = args.volume; // vol-03

// 搜索模式（可选）
const isFuzzy = args.fuzzy || false;   // 模糊匹配
const isRegex = args.regex || false;   // 正则表达式
```

### Step 2: 检测数据模式

```javascript
const isSharded = fs.existsSync('spec/tracking/volumes/');
const hasMCP = fs.existsSync('mcp-servers.json');

// 选择搜索策略
let searchStrategy;
if (hasMCP) {
  searchStrategy = 'mcp-fts5';
} else if (isSharded) {
  searchStrategy = 'sharded-grep';
} else {
  searchStrategy = 'single-grep';
}
```

### Step 3: 执行搜索

根据搜索策略执行：

#### MCP FTS5 搜索

```typescript
// 章节内容搜索
let contentResults = [];
if (searchType === 'content' || searchType === 'all') {
  contentResults = await mcp.call('novelws-mcp/search_content', {
    query: query,
    volume: volumeFilter,
    limit: 50
  });
}

// Tracking 数据搜索（分表查询）
let trackingResults = [];
if (searchType === 'tracking' || searchType === 'all') {
  // 搜索角色数据
  const characterResults = await mcp.call('novelws-mcp/query_characters', {
    search: query,
    volume: volumeFilter
  });

  // 搜索情节数据
  const plotResults = await mcp.call('novelws-mcp/query_plot', {
    search: query,
    volume: volumeFilter
  });

  // 搜索事实数据
  const factsResults = await mcp.call('novelws-mcp/query_facts', {
    search: query,
    volume: volumeFilter
  });

  trackingResults = [...characterResults, ...plotResults, ...factsResults];
}
```

#### 分片 Grep 搜索

```bash
QUERY="$1"
VOLUME_FILTER="$2"

# 确定章节范围
if [[ -n "$VOLUME_FILTER" ]]; then
  # 根据卷编号确定章节范围
  # 假设每卷 50 章：vol-01 = ch-001-050, vol-02 = ch-051-100
  VOLUME_NUM=$(echo "$VOLUME_FILTER" | sed 's/vol-//')
  START_CH=$((($VOLUME_NUM - 1) * 50 + 1))
  END_CH=$(($VOLUME_NUM * 50))

  # 搜索章节内容
  for i in $(seq $START_CH $END_CH); do
    CH_ID=$(printf "ch-%03d" $i)
    grep -n "$QUERY" "stories/*/content/${CH_ID}.md" 2>/dev/null
  done

  # 搜索 tracking 数据
  grep -rn "$QUERY" "spec/tracking/volumes/$VOLUME_FILTER/"
else
  # 搜索所有内容
  grep -rn "$QUERY" "stories/*/content/"
  grep -rn "$QUERY" "spec/tracking/volumes/"
fi
```

#### 单文件 Grep 搜索

```bash
QUERY="$1"

# 搜索章节内容
grep -rn "$QUERY" "stories/*/content/"

# 搜索 tracking 数据
grep -rn "$QUERY" "spec/tracking/" --exclude-dir=volumes
```

### Step 4: 处理搜索结果

```javascript
// 合并结果
const allResults = [...contentResults, ...trackingResults];

// 去重（基于文件路径 + 行号）
const uniqueResults = deduplicateResults(allResults);

// 排序
const sortedResults = sortResults(uniqueResults, {
  // 优先级：完全匹配 > 部分匹配 > 模糊匹配
  byRelevance: true,
  // 次级排序：章节顺序（ch-001 < ch-002）
  byChapterOrder: true
});

// 提取上下文
const resultsWithContext = sortedResults.map(result => ({
  ...result,
  context: extractContext(result.file, result.line, 3) // 前后 3 行
}));
```

### Step 5: 生成搜索报告

```markdown
# 搜索结果

**搜索关键词**：[query]
**搜索范围**：[content/tracking/all]
**数据来源**：[MCP FTS5/分片 Grep/单文件 Grep]
**总结果数**：[X] 个

---

## 一、章节内容（[X] 个结果）

### 第 [N] 章：[章节标题]

**文件**：stories/my-story/content/ch-[NNN].md:[行号]

**匹配片段**：
```
[上文...]
→ [包含关键词的行，高亮关键词]
[下文...]
```

**相关性**：★★★★☆ (BM25: 8.5)

---

### 第 [M] 章：[章节标题]

...

---

## 二、Tracking 数据（[X] 个结果）

### 角色数据

**文件**：spec/tracking/volumes/vol-03/character-state.json

**匹配项**：
```json
{
  "name": "沈玉卿",
  "description": "礼部侍郎沈鲤之女，才华横溢",
  "introduced_in": "ch-042"
}
```

---

### 情节数据

**文件**：spec/tracking/volumes/vol-03/plot-tracker.json

**匹配项**：
```json
{
  "id": "plot-015",
  "description": "沈玉卿身世之谜",
  "planted_in": "ch-042",
  "resolved_in": "ch-055"
}
```

---

## 三、搜索建议

### 相关搜索

基于当前搜索，您可能还想搜索：
- "沈鲤"（沈玉卿的父亲）
- "礼部侍郎"（沈玉卿的家族背景）
- "ch-042"（沈玉卿首次出场）

### 扩展搜索

如果结果不满意，尝试：
- `--fuzzy`：启用模糊匹配
- `--regex`：使用正则表达式（如 "沈[玉鲤]"）
- `--volume vol-XX`：缩小搜索范围

---

## 四、快速操作

基于搜索结果，您可能想要：

1️⃣ `/character show 沈玉卿` — 查看角色完整档案
2️⃣ `/recap --chapters 42-55` — 回顾相关章节
3️⃣ `/facts check "沈玉卿"` — 检查相关事实一致性
```

---

## 使用场景

### 场景 1：查找角色出场

```bash
用户：我想找"沈玉卿"在哪些章节出现过
助手：好的，让我搜索一下

用户：/search 沈玉卿
助手：【搜索中...】

使用 MCP FTS5 全文搜索...
✓ 章节内容：找到 23 处匹配
✓ Tracking 数据：找到 5 处匹配

【搜索结果】
总共找到 28 个结果：

章节内容（23 个）：
- 第 42 章（首次出场）：5 处
- 第 43 章：3 处
- 第 55 章（身世揭露）：8 处
- 第 60 章（卷末高潮）：7 处

Tracking 数据（5 个）：
- character-state.json：1 处
- relationships.json：2 处
- plot-tracker.json：2 处

💡 建议：执行 /character show 沈玉卿 查看完整档案
```

### 场景 2：搜索特定伏笔

```bash
用户：/search "东厂密令" --type=tracking
助手：仅搜索 Tracking 数据...

【搜索结果】
找到 3 个匹配：

1. plot-tracker.json (vol-02):
   伏笔ID: plot-008
   描述：东厂密令泄露事件
   铺设：第 35 章
   回收：第 58 章

2. story-facts.json (vol-02):
   事实ID: fact-042
   内容：密令内容为「监视张居正余党」

3. timeline.json (vol-02):
   事件：万历三十年六月，密令被截获
```

### 场景 3：卷级搜索

```bash
用户：/search "修炼突破" --volume vol-03
助手：搜索范围：第 3 卷（第 101-150 章）

【搜索结果】
找到 12 个匹配：

第 105 章：1 处
- "经过三个月的闭关，他终于突破到了筑基中期"

第 118 章：2 处
- "这次修炼突破来得比预期早"
- "突破后的实力提升明显"

...

💡 本卷共 3 次修炼突破，平均每 16 章一次
```

### 场景 4：正则表达式搜索

```bash
用户：/search "沈[玉鲤]" --regex
助手：使用正则表达式模式...

【搜索结果】
找到 45 个匹配：

- "沈玉卿"：28 处
- "沈鲤"：17 处

按章节分布：
第 42-55 章：主要是"沈玉卿"
第 60-65 章：两者都有（父女同时出场）
```

### 场景 5：模糊搜索

```bash
用户：/search "突破" --fuzzy
助手：启用模糊匹配...

【搜索结果】
精确匹配（42 个）：
- "突破"：35 处
- "突破口"：5 处
- "突破性"：2 处

相关匹配（18 个）：
- "进阶"：12 处
- "晋升"：6 处

💡 提示：模糊匹配会返回语义相似的词，但相关性可能较低
```

---

## 搜索语法

### 基础搜索

```bash
/search <关键词>              # 简单搜索
/search "多个词组"            # 短语搜索（完全匹配）
```

### 类型过滤

```bash
/search <关键词> --type=content    # 仅搜索章节内容
/search <关键词> --type=tracking   # 仅搜索 tracking 数据
/search <关键词> --type=all        # 搜索所有（默认）
```

### 范围过滤

```bash
/search <关键词> --volume vol-03   # 仅搜索第 3 卷
```

### 搜索模式

```bash
/search <关键词> --fuzzy           # 模糊匹配（包含相似词）
/search <关键词> --regex           # 正则表达式模式
```

### 组合使用

```bash
/search "修炼突破" --volume vol-02 --type=content
/search "沈[玉鲤]" --regex --volume vol-03
```

---

## 与其他命令的关系

```text
/search → 找到关键信息
    ↓
/recap --chapters <range> → 回顾相关章节
    ↓
/character show <name> → 查看角色详情
    ↓
/facts check <keyword> → 验证事实一致性
```

**互补关系**：
- `/search` 快速定位，`/recap` 深度回顾
- `/search` 找到角色出场，`/character` 查看完整档案
- `/search` 发现伏笔，`/track` 管理伏笔状态

---

## 注意事项

### 搜索性能

- **MCP FTS5**：毫秒级响应，适合频繁搜索
- **分片 Grep**：秒级响应，适合中等规模项目
- **单文件 Grep**：在超长篇项目中可能较慢（> 10 秒）

### 搜索精度

- **中文分词**：MCP FTS5 自动处理中文分词，Grep 需要完全匹配
- **相关性排序**：MCP FTS5 使用 BM25 算法，Grep 按文件顺序
- **上下文提取**：自动显示匹配行前后 3 行上下文

### 特殊字符

- 正则表达式特殊字符需转义：`. * + ? ^ $ ( ) [ ] { } | \`
- 中文标点符号会影响搜索结果，建议使用 `--fuzzy`

### 搜索限制

- 默认返回前 50 个结果
- MCP 搜索不支持跨表关联查询（需分别查询后合并）
- Grep 搜索不支持相关性排序

---

## 🔗 命令链式提示

**命令执行完成后，自动附加下一步建议**：

```
💡 下一步建议：
1️⃣ `/character show <角色名>` — 查看搜索到的角色完整档案
2️⃣ `/recap --chapters <范围>` — 回顾包含关键词的章节
3️⃣ `/facts check "<关键词>"` — 检查相关事实一致性
```
