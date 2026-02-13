import Database from 'better-sqlite3';

export interface QueryRelationshipsParams {
  character?: string;
  volume?: number;
  type?: string;
  limit?: number;
}

export function queryRelationships(db: Database.Database, params: QueryRelationshipsParams): any[] {
  let sql = 'SELECT * FROM relationships WHERE 1=1';
  const bindings: any[] = [];

  if (params.character) { sql += ' AND (char_a = ? OR char_b = ?)'; bindings.push(params.character, params.character); }
  if (params.volume) { sql += ' AND volume = ?'; bindings.push(params.volume); }
  if (params.type) { sql += ' AND type = ?'; bindings.push(params.type); }
  sql += ' ORDER BY char_a, char_b LIMIT ?';
  bindings.push(params.limit || 50);

  return db.prepare(sql).all(...bindings);
}
