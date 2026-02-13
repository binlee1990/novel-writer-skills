# Phase 2A: MCP Server 基础设施 - 详细实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 创建 novelws-mcp 包骨架，实现 SQLite schema 和数据库连接管理，搭建 MCP server 入口

**Architecture:** 独立 npm 包 `packages/novelws-mcp/`，使用 better-sqlite3 作为 SQLite 驱动，@modelcontextprotocol/sdk 作为 MCP 框架

**Tech Stack:** TypeScript, better-sqlite3, @modelcontextprotocol/sdk, Jest

---

### Task 1: 初始化 novelws-mcp 包结构

**Files:**
- Create: `packages/novelws-mcp/package.json`
- Create: `packages/novelws-mcp/tsconfig.json`
- Create: `packages/novelws-mcp/jest.config.cjs`
- Create: `packages/novelws-mcp/src/index.ts`

**Step 1: 创建 package.json**

```json
{
  "name": "novelws-mcp",
  "version": "0.1.0",
  "description": "MCP server for novel-writer-skills tracking data",
  "type": "module",
  "main": "dist/index.js",
  "bin": {
    "novelws-mcp": "dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "test": "jest --config jest.config.cjs",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "better-sqlite3": "^11.0.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.0",
    "@types/jest": "^29.5.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.3.0"
  }
}
```

**Step 2: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node16",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*"]
}
```

**Step 3: 创建 jest.config.cjs**

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
```

**Step 4: 创建入口文件骨架 src/index.ts**

```typescript
#!/usr/bin/env node

/**
 * novelws-mcp - MCP server for novel-writer-skills tracking data
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new McpServer({
  name: 'novelws-mcp',
  version: '0.1.0',
});

// Tools will be registered here in subsequent tasks

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
```

**Step 5: 提交**

```powershell
git add packages/novelws-mcp/
git commit -m "feat: initialize novelws-mcp package skeleton"
```

---

### Task 2: 实现 SQLite Schema

**Files:**
- Create: `packages/novelws-mcp/src/db/schema.ts`
- Test: `packages/novelws-mcp/tests/db/schema.test.ts`

**Step 1: 写失败测试**

```typescript
import Database from 'better-sqlite3';
import { initializeSchema, SCHEMA_VERSION } from '../../src/db/schema.js';

describe('SQLite Schema', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(':memory:');
  });

  afterEach(() => {
    db.close();
  });

  it('should create all mirror index tables', () => {
    initializeSchema(db);

    const tables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    ).all() as { name: string }[];
    const tableNames = tables.map(t => t.name);

    expect(tableNames).toContain('characters');
    expect(tableNames).toContain('events');
    expect(tableNames).toContain('relationships');
    expect(tableNames).toContain('plot_threads');
    expect(tableNames).toContain('facts');
  });

  it('should create all native data tables', () => {
    initializeSchema(db);

    const tables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    ).all() as { name: string }[];
    const tableNames = tables.map(t => t.name);

    expect(tableNames).toContain('writing_sessions');
    expect(tableNames).toContain('command_log');
    expect(tableNames).toContain('chapter_entities');
    expect(tableNames).toContain('scene_index');
    expect(tableNames).toContain('analysis_results');
    expect(tableNames).toContain('revision_history');
  });

  it('should create FTS5 virtual table', () => {
    initializeSchema(db);

    const tables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    ).all() as { name: string }[];
    const tableNames = tables.map(t => t.name);

    expect(tableNames).toContain('chapter_fts');
  });

  it('should create schema_version table with correct version', () => {
    initializeSchema(db);

    const row = db.prepare('SELECT version FROM schema_version').get() as { version: number };
    expect(row.version).toBe(SCHEMA_VERSION);
  });

  it('should be idempotent (safe to call twice)', () => {
    initializeSchema(db);
    expect(() => initializeSchema(db)).not.toThrow();
  });
});
```

**Step 2: 运行测试验证失败**

```powershell
cd packages/novelws-mcp && npx jest --config jest.config.cjs tests/db/schema.test.ts -v
```

**Step 3: 实现 schema.ts**

```typescript
import Database from 'better-sqlite3';

export const SCHEMA_VERSION = 1;

export function initializeSchema(db: Database.Database): void {
  db.exec('PRAGMA journal_mode=WAL');
  db.exec('PRAGMA foreign_keys=ON');

  db.exec(`
    -- Schema version tracking
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER NOT NULL
    );

    -- === Type 1: Mirror index tables (rebuildable from JSON) ===

    CREATE TABLE IF NOT EXISTS characters (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      volume INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      last_chapter INTEGER,
      role TEXT,
      data_json TEXT
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chapter INTEGER NOT NULL,
      volume INTEGER NOT NULL,
      timestamp_story TEXT,
      type TEXT,
      summary TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS relationships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      char_a TEXT NOT NULL,
      char_b TEXT NOT NULL,
      volume INTEGER NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active'
    );

    CREATE TABLE IF NOT EXISTS plot_threads (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      planted_chapter INTEGER,
      resolved_chapter INTEGER,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS facts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      first_chapter INTEGER,
      last_verified INTEGER
    );

    -- === Type 2: Native data tables (DB is source of truth) ===

    CREATE TABLE IF NOT EXISTS writing_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chapter INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT,
      word_count INTEGER,
      commands_used TEXT
    );

    CREATE TABLE IF NOT EXISTS command_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      command TEXT NOT NULL,
      args TEXT,
      duration INTEGER,
      chapter_context INTEGER
    );

    CREATE TABLE IF NOT EXISTS chapter_entities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chapter INTEGER NOT NULL,
      volume INTEGER NOT NULL,
      entity_type TEXT NOT NULL,
      entity_name TEXT NOT NULL,
      action TEXT
    );

    CREATE TABLE IF NOT EXISTS scene_index (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chapter INTEGER NOT NULL,
      scene_no INTEGER NOT NULL,
      location TEXT,
      pov_character TEXT,
      mood TEXT,
      word_count INTEGER
    );

    CREATE TABLE IF NOT EXISTS analysis_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chapter INTEGER NOT NULL,
      analysis_type TEXT NOT NULL,
      score REAL,
      issues_json TEXT,
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS revision_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chapter INTEGER NOT NULL,
      revision_round INTEGER NOT NULL,
      layer TEXT NOT NULL,
      changes_summary TEXT,
      before_score REAL,
      after_score REAL
    );
  `);

  // FTS5 virtual table (separate exec because CREATE VIRTUAL TABLE IF NOT EXISTS syntax)
  const ftsExists = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='chapter_fts'"
  ).get();

  if (!ftsExists) {
    db.exec(`
      CREATE VIRTUAL TABLE chapter_fts USING fts5(
        chapter, volume, title, content
      );
    `);
  }

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_characters_volume ON characters(volume);
    CREATE INDEX IF NOT EXISTS idx_characters_status ON characters(status);
    CREATE INDEX IF NOT EXISTS idx_events_chapter ON events(chapter);
    CREATE INDEX IF NOT EXISTS idx_events_volume ON events(volume);
    CREATE INDEX IF NOT EXISTS idx_chapter_entities_chapter ON chapter_entities(chapter);
    CREATE INDEX IF NOT EXISTS idx_chapter_entities_volume ON chapter_entities(volume);
    CREATE INDEX IF NOT EXISTS idx_chapter_entities_name ON chapter_entities(entity_name);
    CREATE INDEX IF NOT EXISTS idx_plot_threads_status ON plot_threads(status);
    CREATE INDEX IF NOT EXISTS idx_analysis_results_chapter ON analysis_results(chapter);
    CREATE INDEX IF NOT EXISTS idx_writing_sessions_chapter ON writing_sessions(chapter);
  `);

  // Insert schema version if not exists
  const versionRow = db.prepare('SELECT version FROM schema_version').get();
  if (!versionRow) {
    db.prepare('INSERT INTO schema_version (version) VALUES (?)').run(SCHEMA_VERSION);
  }
}
```

**Step 4: 运行测试验证通过**

```powershell
cd packages/novelws-mcp && npx jest --config jest.config.cjs tests/db/schema.test.ts -v
```

**Step 5: 提交**

```powershell
git add packages/novelws-mcp/src/db/schema.ts packages/novelws-mcp/tests/db/schema.test.ts
git commit -m "feat: implement SQLite schema with 3 data tiers and FTS5"
```

---

### Task 3: 实现数据库连接管理

**Files:**
- Create: `packages/novelws-mcp/src/db/connection.ts`
- Test: `packages/novelws-mcp/tests/db/connection.test.ts`

**Step 1: 写失败测试**

```typescript
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { DatabaseManager } from '../../src/db/connection.js';

describe('DatabaseManager', () => {
  let tempDir: string;
  let dbPath: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nws-db-'));
    dbPath = path.join(tempDir, 'novel-tracking.db');
  });

  afterEach(() => {
    fs.removeSync(tempDir);
  });

  it('should create database file on open', () => {
    const manager = new DatabaseManager(dbPath);
    manager.open();
    expect(fs.existsSync(dbPath)).toBe(true);
    manager.close();
  });

  it('should initialize schema on open', () => {
    const manager = new DatabaseManager(dbPath);
    manager.open();

    const db = manager.getDb();
    const tables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table'"
    ).all() as { name: string }[];

    expect(tables.length).toBeGreaterThan(5);
    manager.close();
  });

  it('should return same db instance on repeated getDb calls', () => {
    const manager = new DatabaseManager(dbPath);
    manager.open();

    const db1 = manager.getDb();
    const db2 = manager.getDb();
    expect(db1).toBe(db2);

    manager.close();
  });

  it('should throw if getDb called before open', () => {
    const manager = new DatabaseManager(dbPath);
    expect(() => manager.getDb()).toThrow();
  });

  it('should rebuild database from scratch', () => {
    const manager = new DatabaseManager(dbPath);
    manager.open();

    // Insert some data
    manager.getDb().prepare(
      "INSERT INTO characters (id, name, volume, status) VALUES (?, ?, ?, ?)"
    ).run('c1', 'Test', 1, 'active');

    manager.rebuild();

    // Data should be gone after rebuild
    const row = manager.getDb().prepare('SELECT * FROM characters WHERE id = ?').get('c1');
    expect(row).toBeUndefined();

    manager.close();
  });
});
```

**Step 2: 运行测试验证失败**

```powershell
cd packages/novelws-mcp && npx jest --config jest.config.cjs tests/db/connection.test.ts -v
```

**Step 3: 实现 connection.ts**

```typescript
import Database from 'better-sqlite3';
import fs from 'fs';
import { initializeSchema } from './schema.js';

export class DatabaseManager {
  private dbPath: string;
  private db: Database.Database | null = null;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  open(): void {
    if (this.db) return;
    this.db = new Database(this.dbPath);
    initializeSchema(this.db);
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  getDb(): Database.Database {
    if (!this.db) {
      throw new Error('Database not opened. Call open() first.');
    }
    return this.db;
  }

  rebuild(): void {
    this.close();
    if (fs.existsSync(this.dbPath)) {
      fs.unlinkSync(this.dbPath);
    }
    this.open();
  }
}
```

**Step 4: 运行测试验证通过**

```powershell
cd packages/novelws-mcp && npx jest --config jest.config.cjs tests/db/connection.test.ts -v
```

**Step 5: 提交**

```powershell
git add packages/novelws-mcp/src/db/connection.ts packages/novelws-mcp/tests/db/connection.test.ts
git commit -m "feat: implement DatabaseManager with open/close/rebuild"
```

---

### Task 4: 实现 sync-from-json 工具

**Files:**
- Create: `packages/novelws-mcp/src/tools/sync-from-json.ts`
- Test: `packages/novelws-mcp/tests/tools/sync-from-json.test.ts`

这是最关键的工具——从 JSON 分片文件同步数据到 SQLite。其他查询工具都依赖它。

**Step 1: 写失败测试**

```typescript
import Database from 'better-sqlite3';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { initializeSchema } from '../../src/db/schema.js';
import { syncFromJson } from '../../src/tools/sync-from-json.js';

describe('syncFromJson', () => {
  let db: Database.Database;
  let tempDir: string;

  beforeEach(() => {
    db = new Database(':memory:');
    initializeSchema(db);
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nws-sync-'));
  });

  afterEach(() => {
    db.close();
    fs.removeSync(tempDir);
  });

  it('should sync characters from single-file mode', () => {
    const trackingDir = path.join(tempDir, 'spec', 'tracking');
    fs.ensureDirSync(trackingDir);
    fs.writeJsonSync(path.join(trackingDir, 'character-state.json'), {
      protagonist: {
        name: '林逸',
        currentStatus: { chapter: 50, location: '青云宗' },
        development: { currentPhase: '成长期' },
      },
      supportingCharacters: {
        '赵四': {
          role: '对手',
          importance: 'high',
          status: { alive: true, lastSeen: { chapter: 45 } },
        },
      },
    });

    const result = syncFromJson(db, tempDir);

    expect(result.characters).toBe(2);
    const chars = db.prepare('SELECT * FROM characters ORDER BY name').all() as any[];
    expect(chars).toHaveLength(2);
    expect(chars.find((c: any) => c.name === '林逸')).toBeDefined();
  });

  it('should sync from volume-sharded mode', () => {
    const vol01Dir = path.join(tempDir, 'spec', 'tracking', 'volumes', 'vol-01');
    fs.ensureDirSync(vol01Dir);
    fs.writeJsonSync(path.join(vol01Dir, 'character-state.json'), {
      protagonist: { name: '林逸', currentStatus: { chapter: 100 } },
      supportingCharacters: {},
    });

    const vol02Dir = path.join(tempDir, 'spec', 'tracking', 'volumes', 'vol-02');
    fs.ensureDirSync(vol02Dir);
    fs.writeJsonSync(path.join(vol02Dir, 'character-state.json'), {
      protagonist: { name: '林逸', currentStatus: { chapter: 200 } },
      supportingCharacters: {
        '王五': { role: '盟友', importance: 'medium', status: { alive: true } },
      },
    });

    const result = syncFromJson(db, tempDir);

    expect(result.characters).toBeGreaterThanOrEqual(2);
  });

  it('should sync timeline events', () => {
    const trackingDir = path.join(tempDir, 'spec', 'tracking');
    fs.ensureDirSync(trackingDir);
    fs.writeJsonSync(path.join(trackingDir, 'timeline.json'), {
      events: [
        { chapter: 1, date: '第一天', event: '主角出场', duration: '1天', participants: ['林逸'] },
        { chapter: 5, date: '第五天', event: '拜入青云宗', duration: '1天', participants: ['林逸'] },
      ],
    });

    const result = syncFromJson(db, tempDir);

    expect(result.events).toBe(2);
    const events = db.prepare('SELECT * FROM events ORDER BY chapter').all();
    expect(events).toHaveLength(2);
  });

  it('should sync plot threads and foreshadowing', () => {
    const trackingDir = path.join(tempDir, 'spec', 'tracking');
    fs.ensureDirSync(trackingDir);
    fs.writeJsonSync(path.join(trackingDir, 'plot-tracker.json'), {
      foreshadowing: [
        { id: 'fs-001', content: '天魂珠来历', planted: { chapter: 3 }, status: 'active', importance: 'high' },
        { id: 'fs-002', content: '父亲失踪', planted: { chapter: 1 }, status: 'active', importance: 'high' },
      ],
    });

    const result = syncFromJson(db, tempDir);

    expect(result.plotThreads).toBe(2);
  });

  it('should clear existing data before sync', () => {
    // First sync
    const trackingDir = path.join(tempDir, 'spec', 'tracking');
    fs.ensureDirSync(trackingDir);
    fs.writeJsonSync(path.join(trackingDir, 'character-state.json'), {
      protagonist: { name: '林逸', currentStatus: { chapter: 1 } },
      supportingCharacters: {},
    });

    syncFromJson(db, tempDir);

    // Modify and re-sync
    fs.writeJsonSync(path.join(trackingDir, 'character-state.json'), {
      protagonist: { name: '林逸改', currentStatus: { chapter: 1 } },
      supportingCharacters: {},
    });

    syncFromJson(db, tempDir);

    const chars = db.prepare('SELECT * FROM characters').all();
    expect(chars).toHaveLength(1);
    expect((chars[0] as any).name).toBe('林逸改');
  });
});
```

**Step 2: 运行测试验证失败**

```powershell
cd packages/novelws-mcp && npx jest --config jest.config.cjs tests/tools/sync-from-json.test.ts -v
```

**Step 3: 实现 sync-from-json.ts**

```typescript
import Database from 'better-sqlite3';
import fs from 'fs-extra';
import path from 'path';

interface SyncResult {
  characters: number;
  events: number;
  relationships: number;
  plotThreads: number;
  facts: number;
  mode: 'single-file' | 'sharded';
}

export function syncFromJson(db: Database.Database, projectRoot: string): SyncResult {
  const trackingDir = path.join(projectRoot, 'spec', 'tracking');
  const volumesDir = path.join(trackingDir, 'volumes');
  const isSharded = fs.existsSync(volumesDir);

  // Clear mirror tables
  db.exec(`
    DELETE FROM characters;
    DELETE FROM events;
    DELETE FROM relationships;
    DELETE FROM plot_threads;
    DELETE FROM facts;
  `);

  const result: SyncResult = {
    characters: 0,
    events: 0,
    relationships: 0,
    plotThreads: 0,
    facts: 0,
    mode: isSharded ? 'sharded' : 'single-file',
  };

  if (isSharded) {
    const volumes = fs.readdirSync(volumesDir).filter(d =>
      d.startsWith('vol-') && fs.statSync(path.join(volumesDir, d)).isDirectory()
    ).sort();

    for (const vol of volumes) {
      const volNum = parseInt(vol.replace('vol-', ''), 10);
      const volDir = path.join(volumesDir, vol);
      result.characters += syncCharacters(db, path.join(volDir, 'character-state.json'), volNum);
      result.events += syncTimeline(db, path.join(volDir, 'timeline.json'), volNum);
      result.relationships += syncRelationships(db, path.join(volDir, 'relationships.json'), volNum);
      result.plotThreads += syncPlotTracker(db, path.join(volDir, 'plot-tracker.json'));
    }
  } else {
    result.characters += syncCharacters(db, path.join(trackingDir, 'character-state.json'), 1);
    result.events += syncTimeline(db, path.join(trackingDir, 'timeline.json'), 1);
    result.relationships += syncRelationships(db, path.join(trackingDir, 'relationships.json'), 1);
    result.plotThreads += syncPlotTracker(db, path.join(trackingDir, 'plot-tracker.json'));
  }

  // Facts are always global
  result.facts += syncFacts(db, path.join(trackingDir, 'story-facts.json'));

  return result;
}

function syncCharacters(db: Database.Database, filePath: string, volume: number): number {
  if (!fs.existsSync(filePath)) return 0;
  const data = fs.readJsonSync(filePath);
  let count = 0;

  const insert = db.prepare(`
    INSERT OR REPLACE INTO characters (id, name, volume, status, last_chapter, role, data_json)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  if (data.protagonist?.name) {
    const p = data.protagonist;
    insert.run(
      `protagonist-${p.name}`, p.name, volume, 'active',
      p.currentStatus?.chapter || null, 'protagonist',
      JSON.stringify(p)
    );
    count++;
  }

  if (data.supportingCharacters) {
    for (const [name, char] of Object.entries(data.supportingCharacters)) {
      const c = char as any;
      insert.run(
        `supporting-${name}`, name, volume,
        c.status?.alive === false ? 'deceased' : 'active',
        c.status?.lastSeen?.chapter || null,
        c.role || 'supporting',
        JSON.stringify(c)
      );
      count++;
    }
  }

  return count;
}

function syncTimeline(db: Database.Database, filePath: string, volume: number): number {
  if (!fs.existsSync(filePath)) return 0;
  const data = fs.readJsonSync(filePath);
  if (!data.events?.length) return 0;

  const insert = db.prepare(`
    INSERT INTO events (chapter, volume, timestamp_story, type, summary)
    VALUES (?, ?, ?, ?, ?)
  `);

  let count = 0;
  for (const event of data.events) {
    insert.run(event.chapter, volume, event.date || '', event.type || 'general', event.event);
    count++;
  }
  return count;
}

function syncRelationships(db: Database.Database, filePath: string, volume: number): number {
  if (!fs.existsSync(filePath)) return 0;
  const data = fs.readJsonSync(filePath);
  if (!data.characters) return 0;

  const insert = db.prepare(`
    INSERT INTO relationships (char_a, char_b, volume, type, status)
    VALUES (?, ?, ?, ?, ?)
  `);

  let count = 0;
  for (const [charName, charData] of Object.entries(data.characters)) {
    const c = charData as any;
    if (c.dynamicRelations) {
      for (const rel of c.dynamicRelations) {
        insert.run(charName, rel.character, volume, rel.current || 'unknown', 'active');
        count++;
      }
    }
  }
  return count;
}

function syncPlotTracker(db: Database.Database, filePath: string): number {
  if (!fs.existsSync(filePath)) return 0;
  const data = fs.readJsonSync(filePath);
  if (!data.foreshadowing?.length) return 0;

  const insert = db.prepare(`
    INSERT OR REPLACE INTO plot_threads (id, type, status, planted_chapter, resolved_chapter, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  let count = 0;
  for (const fs of data.foreshadowing) {
    insert.run(
      fs.id, 'foreshadowing', fs.status || 'active',
      fs.planted?.chapter || null,
      fs.plannedReveal?.chapter || null,
      fs.content
    );
    count++;
  }
  return count;
}

function syncFacts(db: Database.Database, filePath: string): number {
  if (!fs.existsSync(filePath)) return 0;
  const data = fs.readJsonSync(filePath);
  if (!data.facts?.length) return 0;

  const insert = db.prepare(`
    INSERT INTO facts (category, key, value, first_chapter, last_verified)
    VALUES (?, ?, ?, ?, ?)
  `);

  let count = 0;
  for (const fact of data.facts) {
    insert.run(
      fact.category || 'general', fact.key || '', fact.value || '',
      fact.firstChapter || null, fact.lastVerified || null
    );
    count++;
  }
  return count;
}
```

**Step 4: 运行测试验证通过**

```powershell
cd packages/novelws-mcp && npx jest --config jest.config.cjs tests/tools/sync-from-json.test.ts -v
```

**Step 5: 提交**

```powershell
git add packages/novelws-mcp/src/tools/sync-from-json.ts packages/novelws-mcp/tests/tools/sync-from-json.test.ts
git commit -m "feat: implement sync-from-json tool for JSON-to-SQLite sync"
```
