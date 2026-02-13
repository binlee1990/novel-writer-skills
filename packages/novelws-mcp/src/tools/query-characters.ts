import Database from 'better-sqlite3';

export interface QueryCharactersParams {
  volume?: number;
  status?: string;
  name?: string;
  limit?: number;
}

export function queryCharacters(db: Database.Database, params: QueryCharactersParams): any[] {
  let sql = 'SELECT * FROM characters WHERE 1=1';
  const bindings: any[] = [];

  if (params.volume) { sql += ' AND volume = ?'; bindings.push(params.volume); }
  if (params.status) { sql += ' AND status = ?'; bindings.push(params.status); }
  if (params.name) { sql += ' AND name LIKE ?'; bindings.push(`%${params.name}%`); }
  sql += ' ORDER BY last_chapter DESC LIMIT ?';
  bindings.push(params.limit || 50);

  return db.prepare(sql).all(...bindings);
}
