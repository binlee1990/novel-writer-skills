import Database from 'better-sqlite3';
import { initializeSchema } from '../../src/db/schema';
import { queryCharacters } from '../../src/tools/query-characters';
import { queryTimeline } from '../../src/tools/query-timeline';
import { queryRelationships } from '../../src/tools/query-relationships';
import { queryPlot } from '../../src/tools/query-plot';
import { queryFacts } from '../../src/tools/query-facts';
import { queryChapterEntities } from '../../src/tools/query-chapter-entities';

describe('Query Tools', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(':memory:');
    initializeSchema(db);
    seedTestData(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('queryCharacters', () => {
    it('should return all characters', () => {
      const result = queryCharacters(db, {});
      expect(result).toHaveLength(3);
    });

    it('should filter by volume', () => {
      const result = queryCharacters(db, { volume: 1 });
      expect(result).toHaveLength(2);
    });

    it('should filter by status', () => {
      const result = queryCharacters(db, { status: 'deceased' });
      expect(result).toHaveLength(1);
      expect((result[0] as any).name).toBe('张三');
    });

    it('should filter by name (fuzzy)', () => {
      const result = queryCharacters(db, { name: '林' });
      expect(result).toHaveLength(1);
      expect((result[0] as any).name).toBe('林逸');
    });

    it('should respect limit', () => {
      const result = queryCharacters(db, { limit: 1 });
      expect(result).toHaveLength(1);
    });

    it('should return empty for no match', () => {
      const result = queryCharacters(db, { name: '不存在' });
      expect(result).toHaveLength(0);
    });
  });

  describe('queryTimeline', () => {
    it('should return all events', () => {
      const result = queryTimeline(db, {});
      expect(result).toHaveLength(3);
    });

    it('should filter by volume', () => {
      const result = queryTimeline(db, { volume: 1 });
      expect(result).toHaveLength(2);
    });

    it('should filter by chapter range', () => {
      const result = queryTimeline(db, { chapter_from: 3, chapter_to: 10 });
      expect(result).toHaveLength(1);
    });

    it('should filter by type', () => {
      const result = queryTimeline(db, { type: 'battle' });
      expect(result).toHaveLength(1);
    });
  });

  describe('queryRelationships', () => {
    it('should return all relationships', () => {
      const result = queryRelationships(db, {});
      expect(result).toHaveLength(2);
    });

    it('should filter by character', () => {
      const result = queryRelationships(db, { character: '林逸' });
      expect(result).toHaveLength(2);
    });

    it('should filter by volume', () => {
      const result = queryRelationships(db, { volume: 2 });
      expect(result).toHaveLength(1);
    });

    it('should filter by type', () => {
      const result = queryRelationships(db, { type: '对手' });
      expect(result).toHaveLength(1);
    });
  });

  describe('queryPlot', () => {
    it('should return all plot threads', () => {
      const result = queryPlot(db, {});
      expect(result).toHaveLength(3);
    });

    it('should filter by status', () => {
      const result = queryPlot(db, { status: 'resolved' });
      expect(result).toHaveLength(1);
    });

    it('should filter by type', () => {
      const result = queryPlot(db, { type: 'foreshadowing' });
      expect(result).toHaveLength(2);
    });

    it('should filter by planted_before', () => {
      const result = queryPlot(db, { planted_before: 3 });
      expect(result).toHaveLength(2);
    });
  });

  describe('queryFacts', () => {
    it('should return all facts', () => {
      const result = queryFacts(db, {});
      expect(result).toHaveLength(2);
    });

    it('should filter by category', () => {
      const result = queryFacts(db, { category: 'world' });
      expect(result).toHaveLength(1);
    });

    it('should filter by keyword', () => {
      const result = queryFacts(db, { keyword: '青云' });
      expect(result).toHaveLength(1);
    });
  });

  describe('queryChapterEntities', () => {
    it('should return entities for a chapter', () => {
      const result = queryChapterEntities(db, { chapter: 1 });
      expect(result).toHaveLength(2);
    });

    it('should filter by entity_type', () => {
      const result = queryChapterEntities(db, { chapter: 1, entity_type: 'character' });
      expect(result).toHaveLength(1);
    });

    it('should return empty for chapter with no entities', () => {
      const result = queryChapterEntities(db, { chapter: 999 });
      expect(result).toHaveLength(0);
    });
  });
});

function seedTestData(db: Database.Database) {
  // Characters
  const insertChar = db.prepare(
    'INSERT INTO characters (id, name, volume, status, last_chapter, role) VALUES (?, ?, ?, ?, ?, ?)'
  );
  insertChar.run('p-林逸', '林逸', 1, 'active', 50, 'protagonist');
  insertChar.run('s-赵四', '赵四', 1, 'active', 45, 'supporting');
  insertChar.run('s-张三', '张三', 2, 'deceased', 80, 'supporting');

  // Events
  const insertEvent = db.prepare(
    'INSERT INTO events (chapter, volume, timestamp_story, type, summary) VALUES (?, ?, ?, ?, ?)'
  );
  insertEvent.run(1, 1, '第一天', 'general', '主角出场');
  insertEvent.run(5, 1, '第五天', 'battle', '首战');
  insertEvent.run(101, 2, '第百天', 'general', '进入新地图');

  // Relationships
  const insertRel = db.prepare(
    'INSERT INTO relationships (char_a, char_b, volume, type, status) VALUES (?, ?, ?, ?, ?)'
  );
  insertRel.run('林逸', '赵四', 1, '朋友', 'active');
  insertRel.run('林逸', '张三', 2, '对手', 'active');

  // Plot threads
  const insertPlot = db.prepare(
    'INSERT INTO plot_threads (id, type, status, planted_chapter, resolved_chapter, description) VALUES (?, ?, ?, ?, ?, ?)'
  );
  insertPlot.run('fs-001', 'foreshadowing', 'active', 1, null, '天魂珠来历');
  insertPlot.run('fs-002', 'foreshadowing', 'resolved', 3, 50, '父亲失踪');
  insertPlot.run('main', 'main', 'active', null, null, '主线剧情');

  // Facts
  const insertFact = db.prepare(
    'INSERT INTO facts (category, key, value, first_chapter, last_verified) VALUES (?, ?, ?, ?, ?)'
  );
  insertFact.run('world', '宗门', '青云宗是五大宗门之一', 1, 50);
  insertFact.run('character', '林逸年龄', '16岁', 1, 1);

  // Chapter entities
  const insertEntity = db.prepare(
    'INSERT INTO chapter_entities (chapter, volume, entity_type, entity_name, action) VALUES (?, ?, ?, ?, ?)'
  );
  insertEntity.run(1, 1, 'character', '林逸', '出场');
  insertEntity.run(1, 1, 'location', '青云宗', '场景');
}
