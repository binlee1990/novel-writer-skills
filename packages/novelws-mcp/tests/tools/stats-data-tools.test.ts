import Database from 'better-sqlite3';
import { initializeSchema } from '../../src/db/schema';
import { statsVolume } from '../../src/tools/stats-volume';
import { statsCharacter } from '../../src/tools/stats-character';
import { statsConsistency } from '../../src/tools/stats-consistency';
import { searchContent, updateFtsIndex } from '../../src/tools/search-content';
import { syncStatus } from '../../src/tools/sync-status';
import { logWritingSession } from '../../src/tools/log-writing-session';
import { queryAnalysisHistory } from '../../src/tools/query-analysis-history';
import { queryWritingStats } from '../../src/tools/query-writing-stats';

describe('Stats, Search & Data Tools', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(':memory:');
    initializeSchema(db);
    seedTestData(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('statsVolume', () => {
    it('should return volume statistics', () => {
      const result = statsVolume(db, { volume: 1 });
      expect(result.volume).toBe(1);
      expect(result.characterCount).toBe(2);
      expect(result.eventCount).toBe(2);
      expect(result.entityCount).toBe(2);
    });

    it('should return zero for empty volume', () => {
      const result = statsVolume(db, { volume: 99 });
      expect(result.characterCount).toBe(0);
      expect(result.eventCount).toBe(0);
    });
  });

  describe('statsCharacter', () => {
    it('should return character statistics', () => {
      const result = statsCharacter(db, { name: '林逸' });
      expect(result.name).toBe('林逸');
      expect(result.totalAppearances).toBe(2);
      expect(result.volumeDistribution).toHaveLength(2);
      expect(result.relationshipCount).toBe(1);
    });

    it('should return zero for unknown character', () => {
      const result = statsCharacter(db, { name: '不存在' });
      expect(result.totalAppearances).toBe(0);
      expect(result.relationshipCount).toBe(0);
    });
  });

  describe('statsConsistency', () => {
    it('should detect duplicate facts', () => {
      // Add conflicting fact
      db.prepare('INSERT INTO facts (category, key, value, first_chapter) VALUES (?, ?, ?, ?)').run('world', '宗门', '不同的值', 10);
      const result = statsConsistency(db, {});
      expect(result.duplicateFacts).toBe(1);
    });

    it('should return zero issues for clean data', () => {
      const result = statsConsistency(db, {});
      expect(result.duplicateFacts).toBe(0);
    });

    it('should detect orphaned relationships', () => {
      db.prepare('INSERT INTO relationships (char_a, char_b, volume, type, status) VALUES (?, ?, ?, ?, ?)').run('不存在A', '不存在B', 1, '朋友', 'active');
      const result = statsConsistency(db, {});
      expect(result.orphanedRelationships).toBeGreaterThan(0);
    });
  });

  describe('searchContent', () => {
    it('should search FTS index', () => {
      updateFtsIndex(db, 1, 1, '第一章', '林逸走进了青云宗的大门');
      updateFtsIndex(db, 2, 1, '第二章', '赵四在山脚等待');

      const result = searchContent(db, { query: '青云宗' });
      expect(result).toHaveLength(1);
      expect((result[0] as any).chapter).toBe(1);
    });

    it('should filter by volume', () => {
      updateFtsIndex(db, 1, 1, '第一章', '林逸出场');
      updateFtsIndex(db, 101, 2, '第101章', '林逸进入新地图');

      const result = searchContent(db, { query: '林逸', volume: 2 });
      expect(result).toHaveLength(1);
      expect((result[0] as any).chapter).toBe(101);
    });

    it('should return empty for no match', () => {
      const result = searchContent(db, { query: '不存在的内容' });
      expect(result).toHaveLength(0);
    });

    it('should update existing FTS entry', () => {
      updateFtsIndex(db, 1, 1, '第一章', '旧内容');
      updateFtsIndex(db, 1, 1, '第一章', '新内容包含关键词');

      const result = searchContent(db, { query: '关键词' });
      expect(result).toHaveLength(1);

      const old = searchContent(db, { query: '旧内容' });
      expect(old).toHaveLength(0);
    });
  });

  describe('syncStatus', () => {
    it('should return table row counts', () => {
      const result = syncStatus(db);
      expect(result.schemaVersion).toBe(1);
      expect(result.tables.length).toBeGreaterThan(5);

      const charTable = result.tables.find(t => t.name === 'characters');
      expect(charTable?.rowCount).toBe(2);
    });
  });

  describe('logWritingSession', () => {
    it('should insert a writing session', () => {
      const id = logWritingSession(db, { chapter: 10, word_count: 3000 });
      expect(id).toBeGreaterThan(0);

      const row = db.prepare('SELECT * FROM writing_sessions WHERE id = ?').get(id) as any;
      expect(row.chapter).toBe(10);
      expect(row.word_count).toBe(3000);
    });

    it('should store commands_used', () => {
      const id = logWritingSession(db, { chapter: 10, word_count: 2000, commands_used: 'write,recap' });
      const row = db.prepare('SELECT * FROM writing_sessions WHERE id = ?').get(id) as any;
      expect(row.commands_used).toBe('write,recap');
    });
  });

  describe('queryAnalysisHistory', () => {
    it('should return analysis results', () => {
      db.prepare('INSERT INTO analysis_results (chapter, analysis_type, score, timestamp) VALUES (?, ?, ?, ?)').run(1, 'pacing', 8.5, '2026-01-01');
      db.prepare('INSERT INTO analysis_results (chapter, analysis_type, score, timestamp) VALUES (?, ?, ?, ?)').run(2, 'dialogue', 7.0, '2026-01-02');

      const result = queryAnalysisHistory(db, {});
      expect(result).toHaveLength(2);
    });

    it('should filter by chapter', () => {
      db.prepare('INSERT INTO analysis_results (chapter, analysis_type, score, timestamp) VALUES (?, ?, ?, ?)').run(1, 'pacing', 8.5, '2026-01-01');
      db.prepare('INSERT INTO analysis_results (chapter, analysis_type, score, timestamp) VALUES (?, ?, ?, ?)').run(2, 'dialogue', 7.0, '2026-01-02');

      const result = queryAnalysisHistory(db, { chapter: 1 });
      expect(result).toHaveLength(1);
    });

    it('should filter by analysis_type', () => {
      db.prepare('INSERT INTO analysis_results (chapter, analysis_type, score, timestamp) VALUES (?, ?, ?, ?)').run(1, 'pacing', 8.5, '2026-01-01');
      db.prepare('INSERT INTO analysis_results (chapter, analysis_type, score, timestamp) VALUES (?, ?, ?, ?)').run(2, 'dialogue', 7.0, '2026-01-02');

      const result = queryAnalysisHistory(db, { analysis_type: 'pacing' });
      expect(result).toHaveLength(1);
    });
  });

  describe('queryWritingStats', () => {
    it('should return global writing stats', () => {
      logWritingSession(db, { chapter: 1, word_count: 3000 });
      logWritingSession(db, { chapter: 2, word_count: 2500 });

      const result = queryWritingStats(db, {});
      expect(result.totalSessions).toBe(2);
      expect(result.totalWords).toBe(5500);
      expect(result.avgWordsPerSession).toBe(2750);
    });

    it('should return zero for no sessions', () => {
      const result = queryWritingStats(db, {});
      expect(result.totalSessions).toBe(0);
      expect(result.totalWords).toBe(0);
    });
  });
});

function seedTestData(db: Database.Database) {
  const insertChar = db.prepare('INSERT INTO characters (id, name, volume, status, last_chapter, role) VALUES (?, ?, ?, ?, ?, ?)');
  insertChar.run('p-林逸', '林逸', 1, 'active', 50, 'protagonist');
  insertChar.run('s-赵四', '赵四', 1, 'active', 45, 'supporting');

  const insertEvent = db.prepare('INSERT INTO events (chapter, volume, timestamp_story, type, summary) VALUES (?, ?, ?, ?, ?)');
  insertEvent.run(1, 1, '第一天', 'general', '主角出场');
  insertEvent.run(5, 1, '第五天', 'battle', '首战');

  const insertRel = db.prepare('INSERT INTO relationships (char_a, char_b, volume, type, status) VALUES (?, ?, ?, ?, ?)');
  insertRel.run('林逸', '赵四', 1, '朋友', 'active');

  const insertFact = db.prepare('INSERT INTO facts (category, key, value, first_chapter) VALUES (?, ?, ?, ?)');
  insertFact.run('world', '宗门', '青云宗是五大宗门之一', 1);

  const insertEntity = db.prepare('INSERT INTO chapter_entities (chapter, volume, entity_type, entity_name, action) VALUES (?, ?, ?, ?, ?)');
  insertEntity.run(1, 1, 'character', '林逸', '出场');
  insertEntity.run(1, 1, 'location', '青云宗', '场景');
  insertEntity.run(101, 2, 'character', '林逸', '出场');
}
