import Database from 'better-sqlite3';

export interface QueryPlotParams {
  status?: string;
  type?: string;
  planted_before?: number;
  limit?: number;
}

export function queryPlot(db: Database.Database, params: QueryPlotParams): any[] {
  let sql = 'SELECT * FROM plot_threads WHERE 1=1';
  const bindings: any[] = [];

  if (params.status) { sql += ' AND status = ?'; bindings.push(params.status); }
  if (params.type) { sql += ' AND type = ?'; bindings.push(params.type); }
  if (params.planted_before) { sql += ' AND planted_chapter <= ?'; bindings.push(params.planted_before); }
  sql += ' ORDER BY planted_chapter ASC LIMIT ?';
  bindings.push(params.limit || 50);

  return db.prepare(sql).all(...bindings);
}
