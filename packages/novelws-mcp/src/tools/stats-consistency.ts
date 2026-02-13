import Database from 'better-sqlite3';

export interface StatsConsistencyParams {
  volume?: number;
}

export interface ConsistencyStats {
  duplicateFacts: number;
  timelineAnomalies: number;
  orphanedRelationships: number;
}

export function statsConsistency(db: Database.Database, params: StatsConsistencyParams): ConsistencyStats {
  // Duplicate facts: same key with different values
  const dupFacts = (db.prepare(
    'SELECT COUNT(*) as cnt FROM (SELECT key, COUNT(DISTINCT value) as vals FROM facts GROUP BY key HAVING vals > 1)'
  ).get() as any)?.cnt || 0;

  // Timeline anomalies: events with chapter out of order within same volume
  let anomalyQuery = `
    SELECT COUNT(*) as cnt FROM events e1
    JOIN events e2 ON e1.volume = e2.volume AND e1.id < e2.id
    WHERE e1.chapter > e2.chapter
  `;
  const bindings: any[] = [];
  if (params.volume) {
    anomalyQuery += ' AND e1.volume = ?';
    bindings.push(params.volume);
  }
  const anomalies = (db.prepare(anomalyQuery).get(...bindings) as any)?.cnt || 0;

  // Orphaned relationships: relationships referencing characters not in characters table
  const orphaned = (db.prepare(
    'SELECT COUNT(*) as cnt FROM relationships r WHERE r.char_a NOT IN (SELECT name FROM characters) OR r.char_b NOT IN (SELECT name FROM characters)'
  ).get() as any)?.cnt || 0;

  return {
    duplicateFacts: dupFacts,
    timelineAnomalies: anomalies,
    orphanedRelationships: orphaned,
  };
}
