import Database from 'better-sqlite3';

export interface QueryChapterEntitiesParams {
  chapter: number;
  entity_type?: string;
}

export function queryChapterEntities(db: Database.Database, params: QueryChapterEntitiesParams): any[] {
  let sql = 'SELECT * FROM chapter_entities WHERE chapter = ?';
  const bindings: any[] = [params.chapter];

  if (params.entity_type) { sql += ' AND entity_type = ?'; bindings.push(params.entity_type); }
  sql += ' ORDER BY entity_name ASC';

  return db.prepare(sql).all(...bindings);
}
