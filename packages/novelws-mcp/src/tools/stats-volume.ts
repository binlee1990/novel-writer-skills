import Database from 'better-sqlite3';

export interface StatsVolumeParams {
  volume: number;
}

export interface VolumeStats {
  volume: number;
  characterCount: number;
  eventCount: number;
  entityCount: number;
  activePlotThreads: number;
  resolvedPlotThreads: number;
  totalWordCount: number;
  sessionCount: number;
}

export function statsVolume(db: Database.Database, params: StatsVolumeParams): VolumeStats {
  const vol = params.volume;

  const charCount = (db.prepare(
    'SELECT COUNT(DISTINCT id) as cnt FROM characters WHERE volume = ?'
  ).get(vol) as any)?.cnt || 0;

  const eventCount = (db.prepare(
    'SELECT COUNT(*) as cnt FROM events WHERE volume = ?'
  ).get(vol) as any)?.cnt || 0;

  const entityCount = (db.prepare(
    'SELECT COUNT(DISTINCT entity_name) as cnt FROM chapter_entities WHERE volume = ?'
  ).get(vol) as any)?.cnt || 0;

  const activePlots = (db.prepare(
    "SELECT COUNT(*) as cnt FROM plot_threads WHERE status = 'active'"
  ).get() as any)?.cnt || 0;

  const resolvedPlots = (db.prepare(
    "SELECT COUNT(*) as cnt FROM plot_threads WHERE status = 'resolved'"
  ).get() as any)?.cnt || 0;

  const wordStats = db.prepare(
    'SELECT COUNT(*) as sessions, COALESCE(SUM(word_count), 0) as words FROM writing_sessions WHERE chapter IN (SELECT DISTINCT chapter FROM chapter_entities WHERE volume = ?)'
  ).get(vol) as any;

  return {
    volume: vol,
    characterCount: charCount,
    eventCount: eventCount,
    entityCount: entityCount,
    activePlotThreads: activePlots,
    resolvedPlotThreads: resolvedPlots,
    totalWordCount: wordStats?.words || 0,
    sessionCount: wordStats?.sessions || 0,
  };
}
