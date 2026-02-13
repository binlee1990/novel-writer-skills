# Phase 4: 重点命令改造 - 详细实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 改造 6 个重点命令（recap/track/analyze/facts/write/character），支持 --volume/--range 参数和三层 fallback

**依赖:** Phase 1（分片结构）、Phase 2（MCP 工具可选）

---

### 通用改造模式

所有命令改造遵循统一模式，在命令 markdown 中添加以下结构：

```markdown
## 数据加载协议（三层 Fallback）

按以下优先级加载 tracking 数据：

### Layer 1: MCP 查询（最优）
如果 MCP 工具可用（尝试调用任一 MCP 工具，如 `sync_status`），优先使用 MCP 查询：
- 精确查询所需数据，不加载无关内容
- 省 token，速度快

### Layer 2: 分片 JSON（次优）
如果 `spec/tracking/volumes/` 目录存在，按分片模式加载：
- 读取 `spec/tracking/summary/` 下的摘要文件获取全局视图
- 按 --volume 参数读取对应卷的详情文件
- 不带 --volume 时，读取最新卷（通过 volume-summaries.json 的 currentVolume 字段确定）

### Layer 3: 单文件 JSON（兜底）
直接读取 `spec/tracking/` 下的单文件（现有逻辑，完全兼容）
```

---

### Task 1: 改造 /recap

**Files:**
- Modify: `templates/commands/recap.md`

**改造内容：**

1. **frontmatter 更新：**
```yaml
argument-hint: [--brief | --full vol-XX | --volume vol-XX]
```

2. **在"阶段 1: 数据采集"之前插入参数解析段：**

```markdown
## 参数解析

- `--brief`：快速模式，只读 volume-summaries.json，生成一页参考卡片
- `--full vol-XX`：读取指定卷的完整详情数据
- `--volume vol-XX`：等同于 --full vol-XX
- 无参数：默认模式，读取当前卷详情 + 前卷摘要
```

3. **重写"阶段 1: 数据采集"的数据加载逻辑：**

```markdown
### 阶段 1: 数据采集

#### 三层 Fallback 数据加载

**Layer 1: MCP 查询（优先尝试）**

尝试调用 MCP 工具获取精简数据：
- `query_characters` --status=active --limit=30 → 活跃角色列表
- `query_plot` --status=active → 未解决伏笔
- `query_timeline` --chapter_from=[当前卷起始章] → 当前卷时间线
- `query_relationships` --volume=[当前卷号] → 当前卷关系

如果任一 MCP 调用失败，回退到 Layer 2。

**Layer 2: 分片 JSON（检测 spec/tracking/volumes/ 是否存在）**

**--brief 模式：**
- 只读 `spec/tracking/summary/volume-summaries.json`
- 只读 `spec/tracking/summary/characters-summary.json`（仅 active 部分）

**默认模式：**
- 读 `spec/tracking/summary/volume-summaries.json` → 获取前卷摘要
- 读 `spec/tracking/summary/characters-summary.json` → 活跃角色概览
- 读 `spec/tracking/summary/plot-summary.json` → 未解决伏笔
- 读当前卷详情：`spec/tracking/volumes/[currentVolume]/` 下的 4 个文件

**--full vol-XX 模式：**
- 读 `spec/tracking/volumes/vol-XX/` 下的 4 个文件（完整数据）
- 读 `spec/tracking/summary/volume-summaries.json` → 该卷前后的摘要

**Layer 3: 单文件 JSON（兜底，现有逻辑）**
- 读 `spec/tracking/character-state.json`
- 读 `spec/tracking/plot-tracker.json`
- 读 `spec/tracking/relationships.json`
- 读 `spec/tracking/timeline.json`
```

4. **最近章节读取也要适配：**

```markdown
#### 最近内容（第三优先级）

读取最近 3 章的章节文件。如果指定了 --volume：
- 只读该卷范围内的最近 3 章
- 卷的章节范围从 volume-summaries.json 获取
```

**提交：**
```powershell
git add templates/commands/recap.md
git commit -m "feat: add volume-aware data loading and 3-layer fallback to /recap"
```

---

### Task 2: 改造 /track

**Files:**
- Modify: `templates/commands/track.md`

**改造内容：**

1. **frontmatter 更新：**
```yaml
argument-hint: [--brief | --plot | --stats | --check [--volume vol-XX] | --fix | --sync [--incremental] | --migrate [...] | --log]
```

2. **新增增量同步模式（--sync --incremental）：**

```markdown
### 增量同步（--sync --incremental）

不扫描所有章节，只处理上次同步后的新章节：

1. 读取 `spec/tracking/tracking-log.md` 最后一条记录，获取 last_sync_chapter
2. 扫描 `stories/[current]/content/` 中编号 > last_sync_chapter 的章节
3. 只对这些新章节执行 tracking 更新
4. 更新 tracking-log.md 记录本次同步

如果 tracking-log.md 不存在或无法确定 last_sync_chapter，回退到全量同步。
```

3. **--check 支持 --volume：**

```markdown
### 一致性检查（--check）

支持 `--volume vol-XX` 限定检查范围：
- 带 --volume：只检查该卷的 tracking 数据和对应章节
- 不带 --volume：检查当前卷（分片模式）或全部（单文件模式）

**MCP 优先：** 如果 MCP 可用，调用 `stats_consistency` 获取一致性报告。
```

4. **写入时自动更新分片和摘要：**

```markdown
### 数据写入协议

当 /track 更新 tracking 数据时：

**分片模式：**
1. 确定当前章节属于哪个卷（从 volume-summaries.json 的 chapters 范围判断）
2. 更新该卷的分片文件（如 `spec/tracking/volumes/vol-03/character-state.json`）
3. 同步更新全局摘要文件（如 characters-summary.json 的 activeCount）
4. 如果 MCP 可用，调用 `sync_from_json` 同步到 SQLite

**单文件模式：**
- 直接更新 `spec/tracking/` 下的文件（现有逻辑）
```

**提交：**
```powershell
git add templates/commands/track.md
git commit -m "feat: add incremental sync, volume-scoped check, and sharded write to /track"
```

---

### Task 3: 改造 /analyze

**Files:**
- Modify: `templates/commands/analyze.md`

**改造内容：**

1. **frontmatter 更新** — 在 argument-hint 中明确 --range 和 --volume-report：
```yaml
argument-hint: [模式] [--range ch-XXX-YYY | --volume vol-XX | --volume-report vol-XX]
```

2. **--range 实现明确化：**

```markdown
### 范围分析（--range ch-XXX-YYY）

只分析指定章节范围：
1. 只读取范围内的章节文件
2. 只加载范围对应卷的 tracking 数据（通过 volume-summaries.json 确定）
3. 分析结果只针对该范围

**MCP 优先：** 调用 `query_chapter_entities` 获取范围内的实体数据，避免读取全部章节。
```

3. **新增 --volume-report：**

```markdown
### 整卷分析报告（--volume-report vol-XX）

生成指定卷的综合分析报告：
1. 加载该卷的所有 tracking 数据
2. 对该卷所有章节执行 10 个分析维度的抽样检查（每 5 章抽 1 章）
3. 生成卷级报告：整体质量评分、各维度得分、关键问题清单、改进建议

**MCP 优先：** 调用 `query_analysis_history` 对比该卷历史分析分数趋势。

分析完成后，如果 MCP 可用，调用 MCP 工具记录分析结果：
- `log_analysis_result`（记录到 analysis_results 表）
```

**提交：**
```powershell
git add templates/commands/analyze.md
git commit -m "feat: add range/volume analysis and MCP integration to /analyze"
```

---

### Task 4: 改造 /facts

**Files:**
- Modify: `templates/commands/facts.md`

**改造内容：**

1. **frontmatter 更新：**
```yaml
argument-hint: <add|check|list|update|remove> [--volume vol-XX | --range ch-XXX-YYY]
```

2. **`/facts check` 支持范围：**

```markdown
### 事实校验（/facts check）

支持 `--volume vol-XX` 或 `--range ch-XXX-YYY` 限定校验范围：

**MCP 优先（推荐）：**
1. 调用 `query_facts` 获取所有已记录的事实
2. 对每个事实，调用 `search_content` 全文检索所有提到该事实 key 的章节
3. 检查搜索结果中的 value 是否与记录一致
4. 输出不一致列表

**Fallback（无 MCP）：**
1. 读取 `spec/tracking/story-facts.json`
2. 按范围读取章节文件
3. 在章节内容中搜索事实 key，检查 value 一致性

示例：
- 事实：`{ "key": "天魂珠颜色", "value": "蓝色" }`
- MCP 搜索 "天魂珠" → 找到第 15 章 "蓝色的天魂珠"、第 203 章 "绿色的天魂珠"
- 报告：第 203 章与事实记录不一致（蓝色 vs 绿色）
```

**提交：**
```powershell
git add templates/commands/facts.md
git commit -m "feat: add volume/range scoped fact checking with FTS to /facts"
```

---

### Task 5: 改造 /write（含 --batch 批量写作）

**Files:**
- Modify: `templates/commands/write.md`

**改造内容分两部分：上下文优化 + 批量写作。**

#### Part A: 上下文加载优化

在 write.md 的"查询协议"部分之前插入：

```markdown
### Tracking 数据加载（三层 Fallback）

**Layer 1: MCP 查询（优先）**
- `query_characters` --status=active --volume=[当前卷] → 当前卷活跃角色
- `query_plot` --status=active → 未解决伏笔（只取 id, content, planted.chapter）
- `query_chapter_entities` --chapter=[上一章] → 上一章出现的实体
- `search_content` --query=[本章涉及的关键角色名] → 该角色最近出场的章节片段

**Layer 2: 分片 JSON**
- 读 `spec/tracking/summary/characters-summary.json` → active 角色列表
- 读 `spec/tracking/summary/plot-summary.json` → 未解决伏笔
- 读当前卷 `spec/tracking/volumes/[currentVolume]/character-state.json` → 角色详情

**Layer 3: 单文件 JSON（现有逻辑）**
```

在写作完成后的"自动追踪"部分添加：

```markdown
### 写作完成后自动同步

如果 MCP 可用，写作完成后自动调用：
1. `log_writing_session` — 记录本次写作的章节号、字数
2. 调用 `sync_from_json` — 如果 /write 过程中更新了 tracking 文件
3. 更新 FTS 索引 — 将新章节内容索引到全文检索
```

#### Part B: --batch 批量写作

在 write.md 末尾添加完整的批量写作章节：

```markdown
---

## 🆕 批量写作（--batch）

连续写作多个章节，支持中断恢复。

### 使用方法

```
/write --batch 5              # 从当前进度连续写 5 章
/write --batch 5 --fast       # 批量快写模式（跳过章间检查）
/write --batch ch-101-105     # 指定章节范围
/write --batch --resume       # 从上次中断处继续
```

### 批量上限

单次 batch 建议不超过 10 章。超过 10 章建议分多次 batch，每次之间人工审阅。

### 执行流程

#### Phase 1: 批量规划

1. 读取 `stories/[current]/tasks.md` 和 `stories/[current]/creative-plan.md`
2. 为 N 章生成简要大纲，每章包含：
   - 核心事件（1-2 句）
   - 情绪走向（如：紧张→释放→悬念）
   - 涉及的关键角色
   - 与前后章的衔接点
3. 将大纲写入 `spec/tracking/batch-plan.json`

**batch-plan.json 格式：**
```json
{
  "batchId": "batch-YYYYMMDD-NNN",
  "chapters": [
    {
      "chapter": 101,
      "outline": "林逸在青云宗藏经阁发现天魂珠的线索",
      "mood": "悬疑→震惊",
      "characters": ["林逸", "藏经阁长老"],
      "hookIn": "上一章长老的暗示",
      "hookOut": "发现密室入口"
    }
  ]
}
```

#### Phase 2: 逐章执行

对每一章循环执行：

**① 加载上下文**
- 固定上下文：batch-plan.json 中本章大纲
- MCP 查询（或 fallback 读分片）：当前卷活跃角色 + 未解决伏笔
- 滚动上下文：上一章最后 500-800 字 + 上一章的 track 更新摘要

**② 执行写作**
- 按本章大纲 + 上下文执行标准 /write 流程
- 遵循 constitution.md 和 style-reference.md

**③ 写入文件**
- 写入 `stories/[current]/content/chapter-XXX.md`

**④ 轻量 track 更新**
- 更新角色状态（位置、状态变化）
- 更新情节进展（伏笔推进/解决）
- 写入当前卷的分片文件（或单文件）

**⑤ MCP 同步**（如果可用）
- `log_writing_session`
- 更新 chapter_entities
- 更新 FTS 索引

**⑥ 更新进度**
- 更新 `spec/tracking/batch-progress.json`

**⑦ 章间检查**（默认模式）
- 检查本章与上一章的衔接是否自然
- 检查是否有 hook 遗漏
- 如果发现严重问题（如角色状态矛盾），暂停并提示

`--fast` 模式跳过步骤 ⑦。

#### Phase 3: 批量收尾

所有章节写完后：
1. 对批量章节做连贯性快检（首尾衔接、角色状态一致性）
2. 更新全局摘要文件
3. 更新 `stories/[current]/tasks.md` 标记已完成的任务
4. 输出批量写作报告：
   - 完成章节：N 章
   - 总字数：XXXXX 字
   - 新增角色：X 个
   - 推进伏笔：X 条
   - 质量警告：X 条

### 中断恢复

**batch-progress.json 格式：**
```json
{
  "batchId": "batch-20260213-001",
  "planned": ["ch-101", "ch-102", "ch-103", "ch-104", "ch-105"],
  "completed": ["ch-101", "ch-102"],
  "current": null,
  "status": "interrupted",
  "batchPlan": "spec/tracking/batch-plan.json"
}
```

`/write --batch --resume` 读取此文件：
1. 加载 batch-plan.json
2. 跳过 completed 中的章节
3. 从第一个未完成的章节继续
4. 如果 batch-plan.json 不存在，报错提示

### 质量控制模式

| 模式 | 章间检查 | 最终检查 | 适用场景 |
|------|---------|---------|---------|
| 默认 | 轻量检查 | 连贯性快检 | 日常写作 |
| `--strict` | 完整 checklist | 全面分析 | 重要章节 |
| `--fast` | 跳过 | 连贯性快检 | 赶进度 |
```

**提交：**
```powershell
git add templates/commands/write.md
git commit -m "feat: add context optimization, MCP sync, and --batch mode to /write"
```

---

### Task 6: 改造 /character

**Files:**
- Modify: `templates/commands/character.md`

**改造内容：**

1. **frontmatter 更新：**
```yaml
argument-hint: <create|list|show|update|relate|voice|timeline|archive> [角色名] [--volume vol-XX | --all | --inactive N]
```

2. **新增 archive 子命令：**

```markdown
### /character archive — 角色归档

将退场或长期不活跃的角色移入归档状态，减少活跃数据量。

**用法：**
```
/character archive 赵四 --reason "死亡" --chapter 45
/character archive --inactive 50    # 归档超过 50 章未出场的角色
```

**执行流程：**

1. **单角色归档**（`/character archive 赵四 --reason "死亡" --chapter 45`）：
   - 在 character-state.json 中将该角色从 supportingCharacters 移到 characterGroups.deceased（或 inactive）
   - 更新 characters-summary.json：从 active 移到 archived，记录 exitVolume/exitChapter/reason
   - 如果 MCP 可用，更新 characters 表的 status 字段

2. **批量归档**（`/character archive --inactive 50`）：
   - 扫描所有角色的 lastSeen.chapter
   - 找出 lastSeen.chapter < (当前章 - 50) 的角色
   - 列出候选角色，请用户确认
   - 批量执行归档
```

3. **list 默认只显示活跃角色：**

```markdown
### /character list

**默认行为变更：**
- 默认只显示活跃角色（status != archived/deceased）
- `--all`：显示所有角色（含归档和死亡）
- `--volume vol-XX`：只显示该卷中出场的角色

**MCP 优先：** 调用 `query_characters` --status=active
**Fallback：** 读 characters-summary.json 的 active 数组
```

4. **show 支持 --volume：**

```markdown
### /character show [角色名]

支持 `--volume vol-XX` 只查看该卷中的角色状态：
- MCP 优先：`query_characters` --name=[角色名] --volume=[卷号]
- Fallback：读对应卷的 `spec/tracking/volumes/vol-XX/character-state.json`
```

**提交：**
```powershell
git add templates/commands/character.md
git commit -m "feat: add archive subcommand, active filtering, and volume scope to /character"
```

---

### Task 7: 编写命令改造测试

**Files:**
- Create: `tests/unit/commands/ultra-long-commands.test.ts`

**测试要点：**

```typescript
import fs from 'fs-extra';
import path from 'path';

const COMMANDS_DIR = path.resolve(__dirname, '../../../templates/commands');

describe('Ultra-long novel command enhancements', () => {
  // 验证所有重点命令都包含三层 fallback 文档
  const majorCommands = ['recap.md', 'track.md', 'analyze.md', 'facts.md', 'write.md', 'character.md'];

  for (const cmd of majorCommands) {
    describe(cmd, () => {
      let content: string;

      beforeAll(() => {
        content = fs.readFileSync(path.join(COMMANDS_DIR, cmd), 'utf-8');
      });

      it('should mention MCP fallback', () => {
        expect(content).toMatch(/MCP|mcp/);
      });

      it('should support --volume parameter', () => {
        expect(content).toMatch(/--volume/);
      });
    });
  }

  describe('recap.md', () => {
    it('should support --brief and --full modes', () => {
      const content = fs.readFileSync(path.join(COMMANDS_DIR, 'recap.md'), 'utf-8');
      expect(content).toContain('--brief');
      expect(content).toContain('--full');
    });

    it('should reference summary files', () => {
      const content = fs.readFileSync(path.join(COMMANDS_DIR, 'recap.md'), 'utf-8');
      expect(content).toContain('volume-summaries.json');
      expect(content).toContain('characters-summary.json');
    });
  });

  describe('write.md', () => {
    it('should support --batch mode', () => {
      const content = fs.readFileSync(path.join(COMMANDS_DIR, 'write.md'), 'utf-8');
      expect(content).toContain('--batch');
      expect(content).toContain('batch-plan.json');
      expect(content).toContain('batch-progress.json');
    });

    it('should document MCP sync after writing', () => {
      const content = fs.readFileSync(path.join(COMMANDS_DIR, 'write.md'), 'utf-8');
      expect(content).toContain('log_writing_session');
    });
  });

  describe('track.md', () => {
    it('should support incremental sync', () => {
      const content = fs.readFileSync(path.join(COMMANDS_DIR, 'track.md'), 'utf-8');
      expect(content).toContain('--incremental');
    });

    it('should support --migrate', () => {
      const content = fs.readFileSync(path.join(COMMANDS_DIR, 'track.md'), 'utf-8');
      expect(content).toContain('--migrate');
    });
  });

  describe('character.md', () => {
    it('should support archive subcommand', () => {
      const content = fs.readFileSync(path.join(COMMANDS_DIR, 'character.md'), 'utf-8');
      expect(content).toContain('archive');
      expect(content).toContain('--inactive');
    });
  });

  describe('facts.md', () => {
    it('should support range-scoped fact checking', () => {
      const content = fs.readFileSync(path.join(COMMANDS_DIR, 'facts.md'), 'utf-8');
      expect(content).toContain('--range');
      expect(content).toContain('search_content');
    });
  });
});
```

**运行测试：**
```powershell
npx jest --config jest.config.cjs tests/unit/commands/ultra-long-commands.test.ts -v
```

**提交：**
```powershell
git add tests/unit/commands/ultra-long-commands.test.ts
git commit -m "test: add validation tests for ultra-long novel command enhancements"
```
