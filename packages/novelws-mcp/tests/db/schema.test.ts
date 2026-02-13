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

  it('should create indexes', () => {
    initializeSchema(db);

    const indexes = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%' ORDER BY name"
    ).all() as { name: string }[];
    const indexNames = indexes.map(i => i.name);

    expect(indexNames).toContain('idx_characters_volume');
    expect(indexNames).toContain('idx_characters_status');
    expect(indexNames).toContain('idx_events_chapter');
    expect(indexNames).toContain('idx_events_volume');
    expect(indexNames).toContain('idx_chapter_entities_chapter');
  });
});
