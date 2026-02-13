import Database from 'better-sqlite3';

export interface LogWritingSessionParams {
  chapter: number;
  word_count: number;
  commands_used?: string;
}

export function logWritingSession(db: Database.Database, params: LogWritingSessionParams): number {
  const result = db.prepare(`
    INSERT INTO writing_sessions (chapter, start_time, end_time, word_count, commands_used)
    VALUES (?, datetime('now'), datetime('now'), ?, ?)
  `).run(params.chapter, params.word_count, params.commands_used || null);

  return Number(result.lastInsertRowid);
}
