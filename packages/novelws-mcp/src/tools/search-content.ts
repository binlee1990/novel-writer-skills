import Database from 'better-sqlite3';

export interface SearchContentParams {
  query: string;
  volume?: number;
  limit?: number;
}

export function searchContent(db: Database.Database, params: SearchContentParams): any[] {
  const limit = params.limit || 20;

  // Try FTS5 MATCH first
  let results = ftsSearch(db, params.query, params.volume, limit);

  // Fallback to LIKE for CJK text (FTS5 default tokenizer doesn't handle Chinese well)
  if (results.length === 0) {
    results = likeSearch(db, params.query, params.volume, limit);
  }

  return results;
}

function ftsSearch(db: Database.Database, query: string, volume: number | undefined, limit: number): any[] {
  try {
    if (volume) {
      return db.prepare(`
        SELECT * FROM (
          SELECT chapter, volume, title,
                 snippet(chapter_fts, 3, '<mark>', '</mark>', '...', 30) as snippet,
                 rank
          FROM chapter_fts WHERE chapter_fts MATCH ?
        ) WHERE volume = ?
        ORDER BY rank LIMIT ?
      `).all(query, volume, limit);
    }

    return db.prepare(`
      SELECT chapter, volume, title,
             snippet(chapter_fts, 3, '<mark>', '</mark>', '...', 30) as snippet,
             rank
      FROM chapter_fts WHERE chapter_fts MATCH ?
      ORDER BY rank LIMIT ?
    `).all(query, limit);
  } catch {
    return [];
  }
}

function likeSearch(db: Database.Database, query: string, volume: number | undefined, limit: number): any[] {
  const pattern = `%${query}%`;

  if (volume) {
    return db.prepare(`
      SELECT chapter, volume, title, content as snippet, 0 as rank
      FROM chapter_fts
      WHERE (title LIKE ? OR content LIKE ?) AND volume = ?
      LIMIT ?
    `).all(pattern, pattern, volume, limit);
  }

  return db.prepare(`
    SELECT chapter, volume, title, content as snippet, 0 as rank
    FROM chapter_fts
    WHERE title LIKE ? OR content LIKE ?
    LIMIT ?
  `).all(pattern, pattern, limit);
}

export function updateFtsIndex(db: Database.Database, chapter: number, volume: number, title: string, content: string): void {
  db.prepare('DELETE FROM chapter_fts WHERE chapter = ? AND volume = ?').run(chapter, volume);
  db.prepare('INSERT INTO chapter_fts (chapter, volume, title, content) VALUES (?, ?, ?, ?)').run(chapter, volume, title, content);
}
