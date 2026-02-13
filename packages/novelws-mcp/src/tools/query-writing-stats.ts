import Database from 'better-sqlite3';

export interface QueryWritingStatsParams {
  volume?: number;
}

export interface WritingStats {
  totalSessions: number;
  totalWords: number;
  avgWordsPerSession: number;
  writingDays: number;
}

export function queryWritingStats(db: Database.Database, params: QueryWritingStatsParams): WritingStats {
  let sql: string;
  const bindings: any[] = [];

  if (params.volume) {
    sql = `
      SELECT
        COUNT(*) as total_sessions,
        COALESCE(SUM(word_count), 0) as total_words,
        COALESCE(AVG(word_count), 0) as avg_words,
        COUNT(DISTINCT date(start_time)) as writing_days
      FROM writing_sessions
      WHERE chapter IN (SELECT DISTINCT chapter FROM chapter_entities WHERE volume = ?)
    `;
    bindings.push(params.volume);
  } else {
    sql = `
      SELECT
        COUNT(*) as total_sessions,
        COALESCE(SUM(word_count), 0) as total_words,
        COALESCE(AVG(word_count), 0) as avg_words,
        COUNT(DISTINCT date(start_time)) as writing_days
      FROM writing_sessions
    `;
  }

  const row = db.prepare(sql).get(...bindings) as any;

  return {
    totalSessions: row?.total_sessions || 0,
    totalWords: row?.total_words || 0,
    avgWordsPerSession: Math.round(row?.avg_words || 0),
    writingDays: row?.writing_days || 0,
  };
}
