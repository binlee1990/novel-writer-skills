import Database from 'better-sqlite3';
import fs from 'fs-extra';
import path from 'path';

export interface SyncResult {
  characters: number;
  events: number;
  relationships: number;
  plotThreads: number;
  facts: number;
  mode: 'single-file' | 'sharded';
}

export function syncFromJson(db: Database.Database, projectRoot: string): SyncResult {
  const trackingDir = path.join(projectRoot, 'spec', 'tracking');
  const volumesDir = path.join(trackingDir, 'volumes');
  const isSharded = fs.existsSync(volumesDir);

  // Clear mirror tables
  db.exec(`
    DELETE FROM characters;
    DELETE FROM events;
    DELETE FROM relationships;
    DELETE FROM plot_threads;
    DELETE FROM facts;
  `);

  const result: SyncResult = {
    characters: 0,
    events: 0,
    relationships: 0,
    plotThreads: 0,
    facts: 0,
    mode: isSharded ? 'sharded' : 'single-file',
  };

  if (isSharded) {
    const volumes = fs.readdirSync(volumesDir).filter(d =>
      d.startsWith('vol-') && fs.statSync(path.join(volumesDir, d)).isDirectory()
    ).sort();

    for (const vol of volumes) {
      const volNum = parseInt(vol.replace('vol-', ''), 10);
      const volDir = path.join(volumesDir, vol);
      result.characters += syncCharacters(db, path.join(volDir, 'character-state.json'), volNum);
      result.events += syncTimeline(db, path.join(volDir, 'timeline.json'), volNum);
      result.relationships += syncRelationships(db, path.join(volDir, 'relationships.json'), volNum);
      result.plotThreads += syncPlotTracker(db, path.join(volDir, 'plot-tracker.json'));
    }
  } else {
    result.characters += syncCharacters(db, path.join(trackingDir, 'character-state.json'), 1);
    result.events += syncTimeline(db, path.join(trackingDir, 'timeline.json'), 1);
    result.relationships += syncRelationships(db, path.join(trackingDir, 'relationships.json'), 1);
    result.plotThreads += syncPlotTracker(db, path.join(trackingDir, 'plot-tracker.json'));
  }

  // Facts are always global
  result.facts += syncFacts(db, path.join(trackingDir, 'story-facts.json'));

  return result;
}

function syncCharacters(db: Database.Database, filePath: string, volume: number): number {
  if (!fs.existsSync(filePath)) return 0;
  const data = fs.readJsonSync(filePath);
  let count = 0;

  const insert = db.prepare(`
    INSERT OR REPLACE INTO characters (id, name, volume, status, last_chapter, role, data_json)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  if (data.protagonist?.name) {
    const p = data.protagonist;
    insert.run(
      `protagonist-${p.name}`, p.name, volume, 'active',
      p.currentStatus?.chapter || null, 'protagonist',
      JSON.stringify(p)
    );
    count++;
  }

  if (data.supportingCharacters) {
    for (const [name, char] of Object.entries(data.supportingCharacters)) {
      const c = char as any;
      insert.run(
        `supporting-${name}`, name, volume,
        c.status?.alive === false ? 'deceased' : 'active',
        c.status?.lastSeen?.chapter || null,
        c.role || 'supporting',
        JSON.stringify(c)
      );
      count++;
    }
  }

  return count;
}

function syncTimeline(db: Database.Database, filePath: string, volume: number): number {
  if (!fs.existsSync(filePath)) return 0;
  const data = fs.readJsonSync(filePath);
  if (!data.events?.length) return 0;

  const insert = db.prepare(`
    INSERT INTO events (chapter, volume, timestamp_story, type, summary)
    VALUES (?, ?, ?, ?, ?)
  `);

  let count = 0;
  for (const event of data.events) {
    insert.run(event.chapter, volume, event.date || '', event.type || 'general', event.event);
    count++;
  }
  return count;
}

function syncRelationships(db: Database.Database, filePath: string, volume: number): number {
  if (!fs.existsSync(filePath)) return 0;
  const data = fs.readJsonSync(filePath);
  if (!data.characters) return 0;

  const insert = db.prepare(`
    INSERT INTO relationships (char_a, char_b, volume, type, status)
    VALUES (?, ?, ?, ?, ?)
  `);

  let count = 0;
  for (const [charName, charData] of Object.entries(data.characters)) {
    const c = charData as any;
    if (c.dynamicRelations) {
      for (const rel of c.dynamicRelations) {
        insert.run(charName, rel.character, volume, rel.current || 'unknown', 'active');
        count++;
      }
    }
  }
  return count;
}

function syncPlotTracker(db: Database.Database, filePath: string): number {
  if (!fs.existsSync(filePath)) return 0;
  const data = fs.readJsonSync(filePath);
  let count = 0;

  const insert = db.prepare(`
    INSERT OR REPLACE INTO plot_threads (id, type, status, planted_chapter, resolved_chapter, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // Sync main plotline
  if (data.plotlines?.main?.name) {
    const main = data.plotlines.main;
    insert.run(
      'main-plotline', 'main', main.status || 'active',
      null, null, main.name
    );
    count++;
  }

  // Sync subplots
  if (data.plotlines?.subplots?.length) {
    for (const subplot of data.plotlines.subplots) {
      insert.run(
        `subplot-${subplot.name}`, 'subplot', subplot.status || 'active',
        null, null, subplot.description || subplot.name
      );
      count++;
    }
  }

  // Sync foreshadowing
  if (data.foreshadowing?.length) {
    for (const fs of data.foreshadowing) {
      insert.run(
        fs.id, 'foreshadowing', fs.status || 'active',
        fs.planted?.chapter || null,
        fs.plannedReveal?.chapter || null,
        fs.content
      );
      count++;
    }
  }

  return count;
}

function syncFacts(db: Database.Database, filePath: string): number {
  if (!fs.existsSync(filePath)) return 0;
  const data = fs.readJsonSync(filePath);
  if (!data.facts?.length) return 0;

  const insert = db.prepare(`
    INSERT INTO facts (category, key, value, first_chapter, last_verified)
    VALUES (?, ?, ?, ?, ?)
  `);

  let count = 0;
  for (const fact of data.facts) {
    insert.run(
      fact.category || 'general', fact.key || '', fact.value || '',
      fact.firstChapter || null, fact.lastVerified || null
    );
    count++;
  }
  return count;
}
