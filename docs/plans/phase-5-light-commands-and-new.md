# Phase 5: 轻度命令改造 + 新增命令 - 详细实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 改造 5 个轻度命令（timeline/relations/revise/checklist/guide），新增 /volume-summary 和 /search 命令

**依赖:** Phase 1（分片结构）、Phase 4（模式一致性）

---

### Task 1: 改造 /timeline

**Files:**
- Modify: `templates/commands/timeline.md`

**改造内容：**

1. **frontmatter argument-hint 更新：**
```yaml
argument-hint: <show|add|check|visualize> [--volume vol-XX | --recent N]
```

2. **添加 --volume 过滤：**

```markdown
### 卷级过滤

所有子命令支持 `--volume vol-XX` 限定范围：
- `show --volume vol-02`：只显示第 2 卷的时间线事件
- `check --volume vol-03`：只检查第 3 卷的时间逻辑
- `--recent N`：只显示最近 N 章的事件

**MCP 优先：** 调用 `query_timeline` --volume=[卷号] 获取精确数据
**Layer 2：** 读 `spec/tracking/volumes/vol-XX/timeline.json`
**Layer 3：** 读 `spec/tracking/timeline.json`（全量，现有逻辑）
```

**提交：**
```powershell
git add templates/commands/timeline.md
git commit -m "feat: add --volume and --recent filtering to /timeline"
```

---

### Task 2: 改造 /relations

**Files:**
- Modify: `templates/commands/relations.md`

**改造内容：**

1. **frontmatter argument-hint 更新：**
```yaml
argument-hint: <show|add|update|history|graph> [--volume vol-XX | --focus 角色名]
```

2. **添加 --focus 聚焦查询：**

```markdown
### 聚焦查询

`--focus 角色名`：只加载与该角色相关的关系数据，大幅减少 token 消耗。

**MCP 优先：** 调用 `query_relationships` --character=[角色名]
**Fallback：** 读 relationships.json，只提取包含该角色的关系条目

### 卷级过滤

`--volume vol-XX`：只显示该卷中的关系变化。

**MCP 优先：** 调用 `query_relationships` --volume=[卷号]
**Layer 2：** 读 `spec/tracking/volumes/vol-XX/relationships.json`
**Layer 3：** 读 `spec/tracking/relationships.json`，按 history[].chapter 过滤
```

**提交：**
```powershell
git add templates/commands/relations.md
git commit -m "feat: add --focus and --volume filtering to /relations"
```

---

### Task 3: 改造 /revise

**Files:**
- Modify: `templates/commands/revise.md`

**改造内容：**

revise.md 已有 `--chapters` 范围支持，只需补充 MCP 集成：

```markdown
### MCP 集成（可选增强）

如果 MCP 可用，修订前自动查询历史分析数据：
- 调用 `query_analysis_history` --chapter=[目标章节] → 获取该章节的历史分析分数
- 对比前后修订的分数变化，量化修订效果
- 修订完成后调用 `log_analysis_result` 记录新的分析结果到 revision_history 表

这使得修订过程可追踪：每次修订的前后分数、修改摘要都记录在 SQLite 中。
```

**提交：**
```powershell
git add templates/commands/revise.md
git commit -m "feat: add MCP analysis history integration to /revise"
```

---

### Task 4: 改造 /checklist

**Files:**
- Modify: `templates/commands/checklist.md`

**改造内容：**

```markdown
### 卷级范围限定

支持 `--volume vol-XX` 限定检查范围：
- pre-write checklist：加载该卷的 tracking 数据而非全量
- post-write checklist：只检查该卷范围内的章节
- volume-end checklist：专门用于卷末检查，自动加载该卷的完整数据

**数据加载遵循三层 Fallback 协议。**
```

**提交：**
```powershell
git add templates/commands/checklist.md
git commit -m "feat: add --volume scoping to /checklist"
```

---

### Task 5: 改造 /guide

**Files:**
- Modify: `templates/commands/guide.md`

**改造内容：**

guide.md 已经优化良好（只读文件头部），需要添加两个增强：

1. **MCP 统计数据增强推荐：**

```markdown
### MCP 增强推荐（可选）

如果 MCP 可用，guide 的推荐引擎可以利用更丰富的数据：
- 调用 `stats_consistency` → 如果一致性问题 > 0，提升 /track --check 的推荐优先级
- 调用 `query_plot` --status=active → 如果有超过 200 章未解决的伏笔，推荐处理
- 调用 `query_writing_stats` → 基于写作统计推荐合理的下一步

MCP 不可用时，guide 使用现有的文件头部读取逻辑（已足够高效）。
```

2. **迁移阈值检测提示：**

```markdown
### 迁移提示（P0 级别）

在 guide 的 P0 检测中添加：
- 检查 `spec/tracking/` 下的 JSON 文件大小
- 如果任一文件 > 50KB 且 `spec/tracking/volumes/` 不存在：
  - 输出 P0 提示："tracking 文件较大（XX KB），建议执行 `/track --migrate` 分片迁移以提升性能"
```

**提交：**
```powershell
git add templates/commands/guide.md
git commit -m "feat: add MCP stats and migration threshold detection to /guide"
```

---

### Task 6: 新建 /volume-summary 命令

**Files:**
- Create: `templates/commands/volume-summary.md`

**完整命令模板：**

```markdown
---
name: volume-summary
description: 生成或更新卷摘要，汇总角色弧线、关键事件、未解决伏笔和世界观变化
argument-hint: [vol-XX | --refresh-all]
allowed-tools: Read(//**), Write(//spec/tracking/summary/**), Bash(*)
---

# /volume-summary - 卷摘要生成

在一卷完结时使用，生成结构化摘要供跨卷查询使用。

## 使用方法

```
/volume-summary                    # 生成当前卷摘要
/volume-summary vol-03             # 生成/更新指定卷摘要
/volume-summary --refresh-all      # 重新生成所有卷摘要
```

## 执行流程

### 阶段 1：确定目标卷

- 无参数：从 `spec/tracking/summary/volume-summaries.json` 读取 currentVolume
- `vol-XX`：使用指定卷号
- `--refresh-all`：遍历 `spec/tracking/volumes/` 下所有卷目录

### 阶段 2：数据采集

读取目标卷的完整 tracking 数据：

**MCP 优先：**
- `query_characters` --volume=[卷号] → 该卷角色数据
- `query_timeline` --volume=[卷号] → 该卷时间线
- `query_plot` → 筛选 planted_chapter 在该卷范围内的伏笔
- `stats_volume` --volume=[卷号] → 统计数据

**Fallback：**
- 读 `spec/tracking/volumes/vol-XX/` 下的 4 个文件
- 读该卷范围内的章节文件统计字数

### 阶段 3：生成摘要

为目标卷生成以下结构化摘要：

```json
{
  "id": "vol-XX",
  "title": "[卷标题，从 creative-plan.md 提取或 AI 生成]",
  "chapters": "XXX-YYY",
  "wordCount": 250000,
  "keyEvents": [
    "事件1的一句话描述",
    "事件2的一句话描述"
  ],
  "characterArcs": [
    { "name": "林逸", "change": "从筑基突破到金丹，性格从冲动变为沉稳" }
  ],
  "unresolvedPlots": [
    "伏笔1描述",
    "伏笔2描述"
  ],
  "worldChanges": [
    "新地图/势力/设定变化"
  ],
  "newCharacters": 15,
  "exitedCharacters": 3,
  "connectionToPrevious": "承接上卷的XXX事件",
  "connectionToNext": "为下卷的XXX埋下伏笔"
}
```

### 阶段 4：写入

1. 更新 `spec/tracking/summary/volume-summaries.json` 中对应卷的条目
2. 同步更新 `characters-summary.json`（基于最新的角色状态）
3. 同步更新 `plot-summary.json`（基于最新的伏笔状态）
4. 同步更新 `timeline-summary.json`（基于最新的里程碑）
5. 如果 MCP 可用，调用 `sync_from_json` 同步到 SQLite

### 输出格式

```
📖 卷摘要生成完成：第 3 卷「青云试炼」

章节范围：201-300（共 100 章，约 25 万字）

🎭 角色变化：
  - 林逸：金丹初期 → 金丹中期，获得青云剑诀
  - 新增角色 8 人，退场 2 人

📌 关键事件：
  1. 青云宗大比，林逸获得第三名
  2. 发现天魂珠与上古遗迹的关联
  3. 赵四叛出青云宗

⏳ 未解决伏笔（3 条）：
  1. 天魂珠的第二块碎片位置（埋于第 15 章）
  2. 父亲失踪与魔族的关联（埋于第 1 章）
  3. 青云宗禁地的秘密（埋于第 205 章）

已更新：volume-summaries.json, characters-summary.json, plot-summary.json
```
```

**提交：**
```powershell
git add templates/commands/volume-summary.md
git commit -m "feat: add /volume-summary command for structured volume summaries"
```

---

### Task 7: 新建 /search 命令

**Files:**
- Create: `templates/commands/search.md`

**完整命令模板：**

```markdown
---
name: search
description: 跨卷全文检索和实体搜索，快速定位角色出场、地点、物品、伏笔等
argument-hint: <关键词> [--character 角色名 | --location 地点 | --planted-before ch-XXX --unresolved] [--volume vol-XX]
allowed-tools: Read(//**), Bash(grep:*), Bash(find:*), Bash(*)
---

# /search - 跨卷搜索

在超长篇小说中快速定位信息。写到 800 章时想回忆"天魂珠最后一次出现是什么时候"，用这个命令。

## 使用方法

```
/search 天魂珠                     # 全文搜索所有提到天魂珠的章节
/search --character 林逸 --volume 3 # 搜索第 3 卷林逸出场的所有章节
/search --location 青云宗           # 搜索所有发生在青云宗的场景
/search --planted-before ch-100 --unresolved  # 100 章前埋下且未解决的伏笔
```

## 执行流程

### 搜索模式判断

根据参数选择搜索模式：

| 参数 | 搜索模式 | MCP 工具 | Fallback |
|------|---------|----------|----------|
| 纯关键词 | 全文检索 | `search_content` | Grep 章节文件 |
| --character | 角色出场 | `query_chapter_entities` | 搜索 character-state.json |
| --location | 场景搜索 | `query_chapter_entities` --entity_type=location | Grep 章节文件 |
| --planted-before + --unresolved | 伏笔搜索 | `query_plot` | 读 plot-tracker.json |

### MCP 优先路径

**全文检索：**
```
调用 search_content --query="天魂珠" --limit=20
→ 返回：章节号、卷号、标题、匹配片段（高亮）、相关度排名
```

**角色出场搜索：**
```
调用 query_chapter_entities --entity_type=character --entity_name="林逸"
→ 返回：该角色出场的所有章节列表
如果指定了 --volume，添加 volume 过滤
```

**伏笔搜索：**
```
调用 query_plot --status=active --planted_before=100
→ 返回：所有在第 100 章前埋下且未解决的伏笔
```

### Fallback 路径（无 MCP）

**全文检索 Fallback：**
1. 用 Glob 找到所有章节文件：`stories/*/content/chapter-*.md`
2. 如果指定了 --volume，从 volume-summaries.json 获取该卷的章节范围，只搜索范围内的文件
3. 用 Grep 在章节文件中搜索关键词
4. 返回匹配的章节号和上下文片段

**角色出场 Fallback：**
1. 读 character-state.json（或分片）的 appearanceTracking
2. 过滤出目标角色的出场记录

**伏笔搜索 Fallback：**
1. 读 plot-tracker.json（或分片）的 foreshadowing 数组
2. 按条件过滤

### 输出格式

```
🔍 搜索结果："天魂珠"（共 12 处匹配）

第 3 章（第 1 卷）：
  "...林逸从废墟中捡起一颗散发蓝光的【天魂珠】，珠体温热..."

第 15 章（第 1 卷）：
  "...长老说道：'这颗【天魂珠】来历不凡，传说是上古...'"

第 203 章（第 3 卷）：
  "...【天魂珠】突然发出绿色光芒，与之前的蓝色截然不同..."
  ⚠️ 注意：此处颜色描述（绿色）与第 3 章（蓝色）不一致

第 456 章（第 5 卷）：
  "...他将【天魂珠】嵌入剑柄，感受到一股磅礴的力量..."

... 还有 8 处匹配（使用 --limit 20 查看更多）
```
```

**提交：**
```powershell
git add templates/commands/search.md
git commit -m "feat: add /search command for cross-volume full-text and entity search"
```

---

### Task 8: 编写测试

**Files:**
- Create: `tests/unit/commands/phase5-commands.test.ts`

**测试要点：**

```typescript
import fs from 'fs-extra';
import path from 'path';

const COMMANDS_DIR = path.resolve(__dirname, '../../../templates/commands');

describe('Phase 5 command enhancements', () => {
  const lightCommands = ['timeline.md', 'relations.md', 'revise.md', 'checklist.md', 'guide.md'];

  for (const cmd of lightCommands) {
    it(`${cmd} should mention --volume`, () => {
      const content = fs.readFileSync(path.join(COMMANDS_DIR, cmd), 'utf-8');
      expect(content).toContain('--volume');
    });
  }

  it('relations.md should support --focus', () => {
    const content = fs.readFileSync(path.join(COMMANDS_DIR, 'relations.md'), 'utf-8');
    expect(content).toContain('--focus');
  });

  it('guide.md should detect migration threshold', () => {
    const content = fs.readFileSync(path.join(COMMANDS_DIR, 'guide.md'), 'utf-8');
    expect(content).toContain('50KB');
  });

  describe('new commands', () => {
    it('volume-summary.md should exist with correct frontmatter', () => {
      const filePath = path.join(COMMANDS_DIR, 'volume-summary.md');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('name: volume-summary');
      expect(content).toContain('volume-summaries.json');
    });

    it('search.md should exist with correct frontmatter', () => {
      const filePath = path.join(COMMANDS_DIR, 'search.md');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('name: search');
      expect(content).toContain('search_content');
      expect(content).toContain('query_chapter_entities');
    });
  });
});
```

**运行测试：**
```powershell
npx jest --config jest.config.cjs tests/unit/commands/phase5-commands.test.ts -v
```

**提交：**
```powershell
git add tests/unit/commands/phase5-commands.test.ts
git commit -m "test: add validation tests for Phase 5 command enhancements"
```
