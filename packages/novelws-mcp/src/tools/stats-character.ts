import Database from 'better-sqlite3';

export interface StatsCharacterParams {
  name: string;
}

export interface CharacterStats {
  name: string;
  totalAppearances: number;
  volumeDistribution: { volume: number; appearances: number }[];
  relationshipCount: number;
  roles: string[];
}

export function statsCharacter(db: Database.Database, params: StatsCharacterParams): CharacterStats {
  const name = params.name;

  const volumeDist = db.prepare(
    'SELECT volume, COUNT(*) as appearances FROM chapter_entities WHERE entity_name = ? AND entity_type = ? GROUP BY volume ORDER BY volume'
  ).all(name, 'character') as { volume: number; appearances: number }[];

  const totalAppearances = volumeDist.reduce((sum, v) => sum + v.appearances, 0);

  const relCount = (db.prepare(
    'SELECT COUNT(*) as cnt FROM relationships WHERE char_a = ? OR char_b = ?'
  ).get(name, name) as any)?.cnt || 0;

  const roles = db.prepare(
    'SELECT DISTINCT role FROM characters WHERE name = ?'
  ).all(name) as { role: string }[];

  return {
    name,
    totalAppearances,
    volumeDistribution: volumeDist,
    relationshipCount: relCount,
    roles: roles.map(r => r.role).filter(Boolean),
  };
}
