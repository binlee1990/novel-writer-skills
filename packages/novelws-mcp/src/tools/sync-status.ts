import Database from 'better-sqlite3';

export interface SyncStatusResult {
  tables: { name: string; rowCount: number }[];
  schemaVersion: number;
}

export function syncStatus(db: Database.Database): SyncStatusResult {
  const tableNames = [
    'characters', 'events', 'relationships', 'plot_threads', 'facts',
    'writing_sessions', 'command_log', 'chapter_entities', 'scene_index',
    'analysis_results', 'revision_history',
  ];

  const tables = tableNames.map(name => {
    const row = db.prepare(`SELECT COUNT(*) as cnt FROM ${name}`).get() as any;
    return { name, rowCount: row?.cnt || 0 };
  });

  const versionRow = db.prepare('SELECT version FROM schema_version').get() as any;

  return {
    tables,
    schemaVersion: versionRow?.version || 0,
  };
}
