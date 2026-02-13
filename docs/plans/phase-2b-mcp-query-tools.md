# Phase 2B: MCP 查询工具 - 详细实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现所有 MCP 查询工具、统计工具、全文检索工具和创作数据工具

**依赖:** Phase 2A（schema + connection + sync-from-json）

---

### Task 5: 实现数据查询工具（6个）

每个工具一个文件，统一模式：接收参数 → 构建 SQL → 查询 → 返回结果。

**Files:**
- Create: `packages/novelws-mcp/src/tools/query-characters.ts`
- Create: `packages/novelws-mcp/src/tools/query-timeline.ts`
- Create: `packages/novelws-mcp/src/tools/query-relationships.ts`
- Create: `packages/novelws-mcp/src/tools/query-plot.ts`
- Create: `packages/novelws-mcp/src/tools/query-facts.ts`
- Create: `packages/novelws-mcp/src/tools/query-chapter-entities.ts`
- Test: `packages/novelws-mcp/tests/tools/query-tools.test.ts`

**统一工具接口模式：**

```typescript
// 每个工具导出一个 register 函数，在 index.ts 中调用
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import Database from 'better-sqlite3';

export function registerQueryCharacters(server: McpServer, getDb: () => Database.Database) {
  server.tool(
    'query_characters',
    '按卷/活跃状态/名字搜索角色',
    {
      volume: z.number().optional().describe('限定卷号'),
      status: z.enum(['active', 'archived', 'deceased']).optional().describe('角色状态'),
      name: z.string().optional().describe('名字模糊搜索'),
      limit: z.number().optional().default(50).describe('返回数量上限'),
    },
    async (params) => {
      const db = getDb();
      let sql = 'SELECT * FROM characters WHERE 1=1';
      const bindings: any[] = [];

      if (params.volume) { sql += ' AND volume = ?'; bindings.push(params.volume); }
      if (params.status) { sql += ' AND status = ?'; bindings.push(params.status); }
      if (params.name) { sql += ' AND name LIKE ?'; bindings.push(`%${params.name}%`); }
      sql += ' ORDER BY last_chapter DESC LIMIT ?';
      bindings.push(params.limit || 50);

      const rows = db.prepare(sql).all(...bindings);
      return { content: [{ type: 'text', text: JSON.stringify(rows, null, 2) }] };
    }
  );
}
```

**query-timeline.ts 参数：**
- `volume`: number optional
- `chapter_from`: number optional
- `chapter_to`: number optional
- `type`: string optional
- `limit`: number optional, default 100

**query-relationships.ts 参数：**
- `character`: string optional（查某角色的所有关系）
- `volume`: number optional
- `type`: string optional
- `limit`: number optional, default 50

**query-plot.ts 参数：**
- `status`: 'active' | 'resolved' optional
- `type`: 'foreshadowing' | 'subplot' optional
- `planted_before`: number optional（在某章之前埋下的）
- `limit`: number optional, default 50

**query-facts.ts 参数：**
- `category`: string optional
- `keyword`: string optional（key 或 value 模糊搜索）
- `limit`: number optional, default 50

**query-chapter-entities.ts 参数：**
- `chapter`: number required
- `entity_type`: 'character' | 'location' | 'item' | 'power' | 'faction' optional

**测试要点：**
- 每个工具插入测试数据 → 调用查询 → 验证返回结果
- 测试过滤条件组合
- 测试空结果返回

**提交：**
```powershell
git add packages/novelws-mcp/src/tools/query-*.ts packages/novelws-mcp/tests/tools/query-tools.test.ts
git commit -m "feat: implement 6 data query MCP tools"
```

---

### Task 6: 实现聚合统计工具（3个）

**Files:**
- Create: `packages/novelws-mcp/src/tools/stats-volume.ts`
- Create: `packages/novelws-mcp/src/tools/stats-character.ts`
- Create: `packages/novelws-mcp/src/tools/stats-consistency.ts`
- Test: `packages/novelws-mcp/tests/tools/stats-tools.test.ts`

**stats-volume 参数和 SQL：**
- `volume`: number required
- 返回：章节数、字数（从 writing_sessions 聚合）、角色出场数、新增伏笔数、解决伏笔数

```sql
-- 角色出场统计
SELECT COUNT(DISTINCT entity_name) as character_count
FROM chapter_entities WHERE volume = ? AND entity_type = 'character';

-- 伏笔统计
SELECT status, COUNT(*) as count FROM plot_threads
WHERE planted_chapter BETWEEN ? AND ? GROUP BY status;
```

**stats-character 参数和 SQL：**
- `name`: string required
- 返回：总出场章节数、各卷出场分布、关系数量、弧线阶段

```sql
SELECT volume, COUNT(*) as appearances
FROM chapter_entities WHERE entity_name = ? AND entity_type = 'character'
GROUP BY volume ORDER BY volume;
```

**stats-consistency 参数和 SQL：**
- `volume`: number optional（不传则全局检查）
- 返回：事实冲突数、时间线异常数、角色状态矛盾数
- 实现：交叉查询 facts 表和 chapter_entities 表，检测同一 key 不同 value

**提交：**
```powershell
git add packages/novelws-mcp/src/tools/stats-*.ts packages/novelws-mcp/tests/tools/stats-tools.test.ts
git commit -m "feat: implement 3 aggregate statistics MCP tools"
```

---

### Task 7: 实现全文检索工具

**Files:**
- Create: `packages/novelws-mcp/src/tools/search-content.ts`
- Test: `packages/novelws-mcp/tests/tools/search-content.test.ts`

**参数：**
- `query`: string required（搜索关键词）
- `volume`: number optional
- `limit`: number optional, default 20

**核心 SQL：**
```sql
SELECT chapter, volume, title, snippet(chapter_fts, 3, '<mark>', '</mark>', '...', 30) as snippet,
       rank
FROM chapter_fts
WHERE chapter_fts MATCH ?
ORDER BY rank
LIMIT ?;
```

如果指定了 volume，用子查询过滤：
```sql
SELECT * FROM (
  SELECT chapter, volume, title, snippet(chapter_fts, 3, '<mark>', '</mark>', '...', 30) as snippet, rank
  FROM chapter_fts WHERE chapter_fts MATCH ?
) WHERE volume = ?
ORDER BY rank LIMIT ?;
```

**FTS 索引更新函数（供 /write 完成后调用）：**
```typescript
export function updateFtsIndex(db: Database.Database, chapter: number, volume: number, title: string, content: string) {
  // 先删除旧记录
  db.prepare('DELETE FROM chapter_fts WHERE chapter = ? AND volume = ?').run(chapter, volume);
  // 插入新记录
  db.prepare('INSERT INTO chapter_fts (chapter, volume, title, content) VALUES (?, ?, ?, ?)').run(chapter, volume, title, content);
}
```

**提交：**
```powershell
git add packages/novelws-mcp/src/tools/search-content.ts packages/novelws-mcp/tests/tools/search-content.test.ts
git commit -m "feat: implement FTS5 full-text search MCP tool"
```

---

### Task 8: 实现数据同步和创作数据工具

**Files:**
- Create: `packages/novelws-mcp/src/tools/sync-status.ts`
- Create: `packages/novelws-mcp/src/tools/log-writing-session.ts`
- Create: `packages/novelws-mcp/src/tools/query-analysis-history.ts`
- Create: `packages/novelws-mcp/src/tools/query-writing-stats.ts`
- Test: `packages/novelws-mcp/tests/tools/data-tools.test.ts`

**sync-status：** 无参数，返回各表行数 + 最后同步时间

**log-writing-session 参数：**
- `chapter`: number required
- `word_count`: number required
- `commands_used`: string optional
- 自动记录 start_time/end_time

**query-analysis-history 参数：**
- `chapter`: number optional
- `analysis_type`: string optional
- `limit`: number optional, default 20
- 返回按时间倒序的分析记录

**query-writing-stats 参数：**
- `volume`: number optional
- 返回：总字数、总章节数、平均每章字数、写作天数

```sql
SELECT
  COUNT(*) as total_sessions,
  SUM(word_count) as total_words,
  AVG(word_count) as avg_words_per_chapter,
  COUNT(DISTINCT date(start_time)) as writing_days
FROM writing_sessions
WHERE (? IS NULL OR chapter IN (SELECT chapter FROM chapter_entities WHERE volume = ?));
```

**提交：**
```powershell
git add packages/novelws-mcp/src/tools/sync-status.ts packages/novelws-mcp/src/tools/log-writing-session.ts packages/novelws-mcp/src/tools/query-analysis-history.ts packages/novelws-mcp/src/tools/query-writing-stats.ts packages/novelws-mcp/tests/tools/data-tools.test.ts
git commit -m "feat: implement sync-status and creative data MCP tools"
```

---

### Task 9: 注册所有工具到 MCP Server 入口

**Files:**
- Modify: `packages/novelws-mcp/src/index.ts`

**实现：**

```typescript
#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import path from 'path';
import { DatabaseManager } from './db/connection.js';
import { registerQueryCharacters } from './tools/query-characters.js';
import { registerQueryTimeline } from './tools/query-timeline.js';
import { registerQueryRelationships } from './tools/query-relationships.js';
import { registerQueryPlot } from './tools/query-plot.js';
import { registerQueryFacts } from './tools/query-facts.js';
import { registerQueryChapterEntities } from './tools/query-chapter-entities.js';
import { registerStatsVolume } from './tools/stats-volume.js';
import { registerStatsCharacter } from './tools/stats-character.js';
import { registerStatsConsistency } from './tools/stats-consistency.js';
import { registerSearchContent } from './tools/search-content.js';
import { registerSyncFromJson } from './tools/sync-from-json.js';
import { registerSyncStatus } from './tools/sync-status.js';
import { registerLogWritingSession } from './tools/log-writing-session.js';
import { registerQueryAnalysisHistory } from './tools/query-analysis-history.js';
import { registerQueryWritingStats } from './tools/query-writing-stats.js';

// Resolve project root from args or cwd
const projectRoot = process.argv[2] || process.cwd();
const dbPath = path.join(projectRoot, 'spec', 'tracking', 'novel-tracking.db');

const dbManager = new DatabaseManager(dbPath);
dbManager.open();

const server = new McpServer({
  name: 'novelws-mcp',
  version: '0.1.0',
});

const getDb = () => dbManager.getDb();

// Register all tools
registerQueryCharacters(server, getDb);
registerQueryTimeline(server, getDb);
registerQueryRelationships(server, getDb);
registerQueryPlot(server, getDb);
registerQueryFacts(server, getDb);
registerQueryChapterEntities(server, getDb);
registerStatsVolume(server, getDb);
registerStatsCharacter(server, getDb);
registerStatsConsistency(server, getDb);
registerSearchContent(server, getDb);
registerSyncFromJson(server, getDb, projectRoot);
registerSyncStatus(server, getDb);
registerLogWritingSession(server, getDb);
registerQueryAnalysisHistory(server, getDb);
registerQueryWritingStats(server, getDb);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error('Failed to start novelws-mcp:', err);
  process.exit(1);
});

process.on('SIGINT', () => {
  dbManager.close();
  process.exit(0);
});
```

注意：`registerSyncFromJson` 需要额外接收 `projectRoot` 参数，因为它需要知道 JSON 文件的位置。

**提交：**
```powershell
git add packages/novelws-mcp/src/index.ts
git commit -m "feat: register all 15 MCP tools in server entry point"
```

---

### Task 10: 运行全部 MCP 包测试

```powershell
cd packages/novelws-mcp && npm install && npm test
```

Expected: ALL PASS

如有失败修复后提交：
```powershell
git add -A && git commit -m "fix: resolve test issues in novelws-mcp"
```
