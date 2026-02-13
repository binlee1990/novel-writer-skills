import Database from 'better-sqlite3';

export interface QueryAnalysisHistoryParams {
  chapter?: number;
  analysis_type?: string;
  limit?: number;
}

export function queryAnalysisHistory(db: Database.Database, params: QueryAnalysisHistoryParams): any[] {
  let sql = 'SELECT * FROM analysis_results WHERE 1=1';
  const bindings: any[] = [];

  if (params.chapter) { sql += ' AND chapter = ?'; bindings.push(params.chapter); }
  if (params.analysis_type) { sql += ' AND analysis_type = ?'; bindings.push(params.analysis_type); }
  sql += ' ORDER BY timestamp DESC LIMIT ?';
  bindings.push(params.limit || 20);

  return db.prepare(sql).all(...bindings);
}
