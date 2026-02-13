import Database from 'better-sqlite3';

export const SCHEMA_VERSION = 1;

export function initializeSchema(db: Database.Database): void {
  db.pragma('journal_mode=WAL');
  db.pragma('foreign_keys=ON');

  db.exec(`
    -- Schema version tracking
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER NOT NULL
    );

    -- === Mirror index tables (rebuildable from JSON) ===

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

    -- === Native data tables (DB is source of truth) ===

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

  // FTS5 virtual table
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

  // Indexes
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
