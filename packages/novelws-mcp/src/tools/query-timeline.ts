import Database from 'better-sqlite3';

export interface QueryTimelineParams {
  volume?: number;
  chapter_from?: number;
  chapter_to?: number;
  type?: string;
  limit?: number;
}

export function queryTimeline(db: Database.Database, params: QueryTimelineParams): any[] {
  let sql = 'SELECT * FROM events WHERE 1=1';
  const bindings: any[] = [];

  if (params.volume) { sql += ' AND volume = ?'; bindings.push(params.volume); }
  if (params.chapter_from) { sql += ' AND chapter >= ?'; bindings.push(params.chapter_from); }
  if (params.chapter_to) { sql += ' AND chapter <= ?'; bindings.push(params.chapter_to); }
  if (params.type) { sql += ' AND type = ?'; bindings.push(params.type); }
  sql += ' ORDER BY chapter ASC LIMIT ?';
  bindings.push(params.limit || 100);

  return db.prepare(sql).all(...bindings);
}
