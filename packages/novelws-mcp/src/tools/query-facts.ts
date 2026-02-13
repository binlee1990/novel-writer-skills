import Database from 'better-sqlite3';

export interface QueryFactsParams {
  category?: string;
  keyword?: string;
  limit?: number;
}

export function queryFacts(db: Database.Database, params: QueryFactsParams): any[] {
  let sql = 'SELECT * FROM facts WHERE 1=1';
  const bindings: any[] = [];

  if (params.category) { sql += ' AND category = ?'; bindings.push(params.category); }
  if (params.keyword) { sql += ' AND (key LIKE ? OR value LIKE ?)'; bindings.push(`%${params.keyword}%`, `%${params.keyword}%`); }
  sql += ' ORDER BY first_chapter ASC LIMIT ?';
  bindings.push(params.limit || 50);

  return db.prepare(sql).all(...bindings);
}
