# P2c: PostgreSQL 数据源实现

## Task 8: DbDataSource 实现

**Files:**
- Create: `src/server/datasource/db.ts`
- Test: `tests/unit/server/datasource/db.test.ts`

**前置知识：** 数据库表结构定义在 `templates/scripts/phase_a_init_db.py`，schema 为 `novelws`。核心表：`volumes`, `chapters`, `characters`, `character_states`, `relationships`, `relationship_history`, `timeline_events`, `plot_threads`, `foreshadowing`, `chapter_foreshadowing`。

**Step 1: 写失败测试**

```typescript
// tests/unit/server/datasource/db.test.ts
import { DbDataSource } from '../../../src/server/datasource/db.js';

// Mock pg
jest.mock('pg', () => {
  const mockClient = {
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn(),
  };
  return { Client: jest.fn(() => mockClient) };
});

import { Client } from 'pg';

describe('DbDataSource', () => {
  let ds: DbDataSource;
  let mockQuery: jest.Mock;

  beforeEach(() => {
    const config = {
      host: '127.0.0.1', port: 5432,
      dbname: 'test', user: 'postgres',
      password: '', schema: 'novelws',
    };
    ds = new DbDataSource(config, '/fake/project');
    const instance = (Client as unknown as jest.Mock).mock.results[0]?.value;
    mockQuery = instance?.query || jest.fn();
    jest.clearAllMocks();
  });

  describe('getStories', () => {
    it('returns story from project directory name', async () => {
      const stories = await ds.getStories();
      expect(stories.length).toBe(1);
      expect(stories[0].path).toBe('/fake/project');
    });
  });

  describe('getOverview', () => {
    it('queries volumes and chapters for overview', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '3' }] }) // volume count
        .mockResolvedValueOnce({ rows: [{ count: '30', total_words: '100000' }] }) // chapter stats
        .mockResolvedValueOnce({ rows: [{ vol_number: 3 }] }); // current volume

      const overview = await ds.getOverview('my-novel');
      expect(overview.totalVolumes).toBe(3);
    });
  });

  describe('getCharacters', () => {
    it('queries characters table', async () => {
      mockQuery.mockResolvedValue({
        rows: [{
          name: '张三', aliases: '三哥', identity_type: '主角',
          first_vol: 1, first_chap: 1, cultivation_level: '筑基',
          faction: '正道', status: '活跃',
        }],
      });

      const chars = await ds.getCharacters('my-novel');
      expect(chars.length).toBe(1);
      expect(chars[0].name).toBe('张三');
    });
  });

  describe('getRelationships', () => {
    it('builds graph from characters and relationships tables', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            { name: '张三', faction: '正道', identity_type: '主角', appearances: 20 },
            { name: '李四', faction: '正道', identity_type: '配角', appearances: 10 },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            { char_a: '张三', char_b: '李四', rel_type: '盟友', current_status: '稳定', last_updated_chap: 5 },
          ],
        });

      const graph = await ds.getRelationships('my-novel');
      expect(graph.nodes.length).toBe(2);
      expect(graph.edges.length).toBe(1);
    });
  });

  describe('getForeshadowingMatrix', () => {
    it('builds matrix from foreshadowing and chapter_foreshadowing', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            { code: 'FS-001', description: '神秘玉佩', status: 'hinted', importance: 'high' },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            { fs_code: 'FS-001', chapter_number: 1, action_type: 'plant' },
            { fs_code: 'FS-001', chapter_number: 5, action_type: 'hint' },
          ],
        })
        .mockResolvedValueOnce({
          rows: [{ max_chap: 10 }],
        });

      const matrix = await ds.getForeshadowingMatrix('my-novel');
      expect(matrix.rows.length).toBe(1);
      expect(matrix.rows[0].code).toBe('FS-001');
    });
  });
});
```

**Step 2: 运行测试确认失败**

```bash
node node_modules/jest-cli/bin/jest.js --config jest.config.cjs tests/unit/server/datasource/db.test.ts
```

Expected: FAIL

**Step 3: 实现 DbDataSource**

```typescript
// src/server/datasource/db.ts
import { Client } from 'pg';
import path from 'path';
import type {
  DataSource, Story, StoryOverview, Volume, Chapter,
  Character, CharacterState, RelationshipGraph, RelationshipEvent,
  TimelineEvent, PlotThread, Foreshadow, ForeshadowMatrix, DashboardStats,
} from '../types.js';

interface DbConfig {
  host: string;
  port: number;
  dbname: string;
  user: string;
  password: string;
  schema: string;
}

export class DbDataSource implements DataSource {
  private client: Client;
  private schema: string;

  constructor(private config: DbConfig, private projectRoot: string) {
    this.schema = config.schema || 'novelws';
    this.client = new Client({
      host: config.host,
      port: config.port,
      database: config.dbname,
      user: config.user,
      password: config.password,
    });
  }

  async connect(): Promise<void> {
    await this.client.connect();
    await this.client.query(`SET search_path TO ${this.schema}, public`);
  }

  async disconnect(): Promise<void> {
    await this.client.end();
  }

  private async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    const result = await this.client.query(sql, params);
    return result.rows;
  }

  async getStories(): Promise<Story[]> {
    return [{ name: path.basename(this.projectRoot), path: this.projectRoot }];
  }

  async getOverview(_story: string): Promise<StoryOverview> {
    const [volCount] = await this.query<{ count: string }>('SELECT COUNT(*) as count FROM volumes');
    const [chapStats] = await this.query<{ count: string; total_words: string }>(
      'SELECT COUNT(*) as count, COALESCE(SUM(word_count), 0) as total_words FROM chapters'
    );
    const [current] = await this.query<{ vol_number: number }>(
      'SELECT vol_number FROM volumes ORDER BY vol_number DESC LIMIT 1'
    );
    return {
      name: path.basename(this.projectRoot),
      totalVolumes: parseInt(volCount?.count || '0', 10),
      totalChapters: parseInt(chapStats?.count || '0', 10),
      totalWords: parseInt(chapStats?.total_words || '0', 10),
      currentVolume: current?.vol_number || 0,
    };
  }

  async getVolumes(_story: string): Promise<Volume[]> {
    const rows = await this.query(`
      SELECT v.vol_number, v.vol_title,
        COUNT(c.global_chapter_number) as chapters,
        COALESCE(SUM(c.word_count), 0) as words
      FROM volumes v
      LEFT JOIN chapters c ON c.vol_number = v.vol_number
      GROUP BY v.vol_number, v.vol_title
      ORDER BY v.vol_number
    `);
    return rows.map(r => ({
      number: r.vol_number,
      title: r.vol_title || `第 ${r.vol_number} 卷`,
      chapters: parseInt(r.chapters, 10),
      words: parseInt(r.words, 10),
      progress: 0,
    }));
  }

  async getChapters(_story: string, vol?: number): Promise<Chapter[]> {
    const where = vol ? 'WHERE c.vol_number = $1' : '';
    const params = vol ? [vol] : [];
    const rows = await this.query(`
      SELECT c.global_chapter_number, c.vol_number, c.chapter_in_vol,
        c.word_count, c.pov_character,
        ARRAY_AGG(cp.character_name) FILTER (WHERE cp.character_name IS NOT NULL) as participants
      FROM chapters c
      LEFT JOIN chapter_participants cp ON cp.chapter_number = c.global_chapter_number
      ${where}
      GROUP BY c.global_chapter_number, c.vol_number, c.chapter_in_vol, c.word_count, c.pov_character
      ORDER BY c.global_chapter_number
    `, params);
    return rows.map(r => ({
      globalNumber: r.global_chapter_number,
      volumeNumber: r.vol_number,
      chapterInVolume: r.chapter_in_vol,
      title: `第 ${r.global_chapter_number} 章`,
      words: r.word_count || 0,
      pov: r.pov_character || '',
      participants: r.participants || [],
      hasSynopsis: true,
      hasContent: (r.word_count || 0) > 0,
    }));
  }

  async getCharacters(_story: string, vol?: number): Promise<Character[]> {
    let sql: string;
    let params: any[];
    if (vol) {
      sql = `
        SELECT DISTINCT ch.name, ch.aliases, ch.identity_type,
          ch.first_vol, ch.first_chap, ch.cultivation_level, ch.faction, ch.status
        FROM characters ch
        JOIN character_states cs ON cs.character_name = ch.name
        WHERE cs.vol_number = $1
        ORDER BY ch.name
      `;
      params = [vol];
    } else {
      sql = 'SELECT name, aliases, identity_type, first_vol, first_chap, cultivation_level, faction, status FROM characters ORDER BY name';
      params = [];
    }
    const rows = await this.query(sql, params);
    return rows.map(r => ({
      name: r.name,
      aliases: r.aliases ? r.aliases.split(',').map((a: string) => a.trim()) : [],
      role: r.identity_type || '',
      firstVolume: r.first_vol || 0,
      firstChapter: r.first_chap || 0,
      cultivation: r.cultivation_level || '',
      faction: r.faction || '',
      status: r.status || '活跃',
    }));
  }

  async getCharacterArc(_story: string, name: string): Promise<CharacterState[]> {
    const rows = await this.query(`
      SELECT vol_number, cultivation_level, location, state_summary, last_appearance_chap
      FROM character_states
      WHERE character_name = $1
      ORDER BY vol_number
    `, [name]);
    return rows.map(r => ({
      volume: r.vol_number,
      cultivation: r.cultivation_level || '',
      location: r.location || '',
      summary: r.state_summary || '',
      lastChapter: r.last_appearance_chap || 0,
    }));
  }

  async getRelationships(_story: string, _vol?: number): Promise<RelationshipGraph> {
    const charRows = await this.query(`
      SELECT ch.name, ch.faction, ch.identity_type,
        COUNT(cp.chapter_number) as appearances
      FROM characters ch
      LEFT JOIN chapter_participants cp ON cp.character_name = ch.name
      WHERE ch.status != '已故'
      GROUP BY ch.name, ch.faction, ch.identity_type
    `);
    const relRows = await this.query(`
      SELECT char_a, char_b, rel_type, current_status, last_updated_chap
      FROM relationships
    `);
    return {
      nodes: charRows.map(r => ({
        id: r.name,
        name: r.name,
        faction: r.faction || '',
        role: r.identity_type || '',
        appearances: parseInt(r.appearances, 10) || 0,
      })),
      edges: relRows.map(r => ({
        source: r.char_a,
        target: r.char_b,
        type: r.rel_type || '',
        status: r.current_status || '',
        lastChapter: r.last_updated_chap || 0,
      })),
    };
  }

  async getRelationshipHistory(_story: string): Promise<RelationshipEvent[]> {
    const rows = await this.query(`
      SELECT chapter_number, char_a, char_b, rel_type, old_status, new_status
      FROM relationship_history
      ORDER BY chapter_number
    `);
    return rows.map(r => ({
      chapter: r.chapter_number,
      source: r.char_a,
      target: r.char_b,
      type: r.rel_type || '',
      oldStatus: r.old_status || '',
      newStatus: r.new_status || '',
    }));
  }

  async getTimeline(_story: string, vol?: number): Promise<TimelineEvent[]> {
    const where = vol ? 'WHERE c.vol_number = $1' : '';
    const params = vol ? [vol] : [];
    const rows = await this.query(`
      SELECT te.id, te.chapter_number, te.story_time, te.location, te.description, te.tags
      FROM timeline_events te
      JOIN chapters c ON c.global_chapter_number = te.chapter_number
      ${where}
      ORDER BY te.chapter_number
    `, params);
    return rows.map(r => ({
      id: r.id,
      chapter: r.chapter_number,
      storyTime: r.story_time || '',
      location: r.location || '',
      description: r.description || '',
      tags: r.tags || [],
    }));
  }

  async getPlotThreads(_story: string): Promise<PlotThread[]> {
    const rows = await this.query(`
      SELECT thread_name, thread_type, status, description
      FROM plot_threads
      ORDER BY thread_name
    `);
    return rows.map(r => ({
      name: r.thread_name,
      type: r.thread_type || '',
      status: r.status || 'active',
      description: r.description || '',
      keyEvents: [],
    }));
  }

  async getForeshadowing(_story: string): Promise<Foreshadow[]> {
    const rows = await this.query(`
      SELECT fs.fs_code, fs.description, fs.planted_chapter,
        fs.hinted_chapters, fs.resolved_chapter, fs.status, fs.importance
      FROM foreshadowing fs
      ORDER BY fs.planted_chapter
    `);
    return rows.map(r => ({
      code: r.fs_code,
      description: r.description || '',
      plantedChapter: r.planted_chapter || 0,
      hintedChapters: r.hinted_chapters || [],
      resolvedChapter: r.resolved_chapter || null,
      status: r.status || 'planted',
      importance: r.importance || 'normal',
    }));
  }

  async getForeshadowingMatrix(_story: string): Promise<ForeshadowMatrix> {
    const fsRows = await this.query(`
      SELECT fs_code, description, status, importance
      FROM foreshadowing ORDER BY planted_chapter
    `);
    const cfRows = await this.query(`
      SELECT fs_code, chapter_number, action_type
      FROM chapter_foreshadowing ORDER BY chapter_number
    `);
    const [maxChap] = await this.query<{ max_chap: number }>(
      'SELECT MAX(global_chapter_number) as max_chap FROM chapters'
    );
    const totalChapters = maxChap?.max_chap || 0;
    const chapters = Array.from({ length: totalChapters }, (_, i) => i + 1);

    const cfMap = new Map<string, Map<number, string>>();
    for (const cf of cfRows) {
      if (!cfMap.has(cf.fs_code)) cfMap.set(cf.fs_code, new Map());
      cfMap.get(cf.fs_code)!.set(cf.chapter_number, cf.action_type);
    }

    const rows = fsRows.map(fs => ({
      code: fs.fs_code,
      description: fs.description,
      cells: chapters.map(ch => ({
        chapter: ch,
        action: (cfMap.get(fs.fs_code)?.get(ch) as any) || null,
      })),
    }));

    return { chapters, rows };
  }

  async getDashboardStats(_story: string): Promise<DashboardStats> {
    const overview = await this.getOverview(_story);
    const [charCount] = await this.query<{ count: string }>('SELECT COUNT(*) as count FROM characters');
    const [plotCount] = await this.query<{ count: string }>("SELECT COUNT(*) as count FROM plot_threads WHERE status = 'active'");
    const [fsCount] = await this.query<{ count: string }>("SELECT COUNT(*) as count FROM foreshadowing WHERE status != 'resolved'");
    const volumes = await this.getVolumes(_story);

    return {
      totalWords: overview.totalWords,
      totalChapters: overview.totalChapters,
      totalVolumes: overview.totalVolumes,
      totalCharacters: parseInt(charCount?.count || '0', 10),
      activePlotThreads: parseInt(plotCount?.count || '0', 10),
      unresolvedForeshadowing: parseInt(fsCount?.count || '0', 10),
      volumeStats: volumes.map(v => ({
        volume: v.number, title: v.title, words: v.words, chapters: v.chapters, progress: v.progress,
      })),
    };
  }
}
```

**Step 4: 运行测试确认通过**

```bash
node node_modules/jest-cli/bin/jest.js --config jest.config.cjs tests/unit/server/datasource/db.test.ts
```

Expected: PASS

**Step 5: 提交**

```bash
git add src/server/datasource/db.ts tests/unit/server/datasource/db.test.ts
git commit -m "feat(dashboard): implement DbDataSource with full PostgreSQL query support"
```
