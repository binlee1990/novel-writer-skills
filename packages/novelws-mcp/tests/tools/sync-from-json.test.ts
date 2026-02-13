import Database from 'better-sqlite3';
import fs from 'fs-extra';
import path from 'path';
import { initializeSchema } from '../../src/db/schema';
import { syncFromJson } from '../../src/tools/sync-from-json';

describe('syncFromJson', () => {
  let db: Database.Database;
  let tempDir: string;

  beforeEach(() => {
    db = new Database(':memory:');
    initializeSchema(db);
    tempDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'nws-sync-'));
  });

  afterEach(() => {
    db.close();
    fs.removeSync(tempDir);
  });

  it('should sync characters from single-file mode', () => {
    const trackingDir = path.join(tempDir, 'spec', 'tracking');
    fs.ensureDirSync(trackingDir);
    fs.writeJsonSync(path.join(trackingDir, 'character-state.json'), {
      protagonist: {
        name: '林逸',
        currentStatus: { chapter: 50, location: '青云宗', alive: true },
        development: { currentPhase: '成长期' },
      },
      supportingCharacters: {
        '赵四': {
          role: '对手',
          importance: 'high',
          status: { alive: true, lastSeen: { chapter: 45 } },
        },
      },
    });

    const result = syncFromJson(db, tempDir);

    expect(result.characters).toBe(2);
    expect(result.mode).toBe('single-file');
    const chars = db.prepare('SELECT * FROM characters ORDER BY name').all() as any[];
    expect(chars).toHaveLength(2);
    expect(chars.find((c: any) => c.name === '林逸')).toBeDefined();
    expect(chars.find((c: any) => c.name === '赵四')).toBeDefined();
  });

  it('should sync from volume-sharded mode', () => {
    const vol01Dir = path.join(tempDir, 'spec', 'tracking', 'volumes', 'vol-01');
    fs.ensureDirSync(vol01Dir);
    fs.writeJsonSync(path.join(vol01Dir, 'character-state.json'), {
      protagonist: { name: '林逸', currentStatus: { chapter: 100 } },
      supportingCharacters: {},
    });

    const vol02Dir = path.join(tempDir, 'spec', 'tracking', 'volumes', 'vol-02');
    fs.ensureDirSync(vol02Dir);
    fs.writeJsonSync(path.join(vol02Dir, 'character-state.json'), {
      protagonist: { name: '林逸', currentStatus: { chapter: 200 } },
      supportingCharacters: {
        '王五': { role: '盟友', importance: 'medium', status: { alive: true } },
      },
    });

    const result = syncFromJson(db, tempDir);

    expect(result.mode).toBe('sharded');
    // vol-02 protagonist overwrites vol-01 (INSERT OR REPLACE), plus 王五
    expect(result.characters).toBeGreaterThanOrEqual(2);
  });

  it('should sync timeline events', () => {
    const trackingDir = path.join(tempDir, 'spec', 'tracking');
    fs.ensureDirSync(trackingDir);
    fs.writeJsonSync(path.join(trackingDir, 'timeline.json'), {
      events: [
        { chapter: 1, date: '第一天', event: '主角出场', duration: '1天', participants: ['林逸'] },
        { chapter: 5, date: '第五天', event: '拜入青云宗', duration: '1天', participants: ['林逸'] },
      ],
    });

    const result = syncFromJson(db, tempDir);

    expect(result.events).toBe(2);
    const events = db.prepare('SELECT * FROM events ORDER BY chapter').all() as any[];
    expect(events).toHaveLength(2);
    expect(events[0].summary).toBe('主角出场');
  });

  it('should sync relationships', () => {
    const trackingDir = path.join(tempDir, 'spec', 'tracking');
    fs.ensureDirSync(trackingDir);
    fs.writeJsonSync(path.join(trackingDir, 'relationships.json'), {
      characters: {
        '林逸': {
          dynamicRelations: [
            { character: '赵四', initial: '陌生人', current: '对手', trajectory: 'negative' },
            { character: '苏瑶', initial: '陌生人', current: '朋友', trajectory: 'positive' },
          ],
        },
      },
    });

    const result = syncFromJson(db, tempDir);

    expect(result.relationships).toBe(2);
    const rels = db.prepare('SELECT * FROM relationships ORDER BY char_b').all() as any[];
    expect(rels).toHaveLength(2);
  });

  it('should sync plot threads and foreshadowing', () => {
    const trackingDir = path.join(tempDir, 'spec', 'tracking');
    fs.ensureDirSync(trackingDir);
    fs.writeJsonSync(path.join(trackingDir, 'plot-tracker.json'), {
      foreshadowing: [
        { id: 'fs-001', content: '天魂珠来历', planted: { chapter: 3 }, status: 'active', importance: 'high' },
        { id: 'fs-002', content: '父亲失踪', planted: { chapter: 1 }, plannedReveal: { chapter: 50 }, status: 'active', importance: 'high' },
      ],
    });

    const result = syncFromJson(db, tempDir);

    expect(result.plotThreads).toBe(2);
    const threads = db.prepare('SELECT * FROM plot_threads ORDER BY id').all() as any[];
    expect(threads).toHaveLength(2);
    expect(threads[0].description).toBe('天魂珠来历');
    expect(threads[1].resolved_chapter).toBe(50);
  });

  it('should clear existing data before sync', () => {
    const trackingDir = path.join(tempDir, 'spec', 'tracking');
    fs.ensureDirSync(trackingDir);
    fs.writeJsonSync(path.join(trackingDir, 'character-state.json'), {
      protagonist: { name: '林逸', currentStatus: { chapter: 1 } },
      supportingCharacters: {},
    });

    syncFromJson(db, tempDir);

    // Modify and re-sync
    fs.writeJsonSync(path.join(trackingDir, 'character-state.json'), {
      protagonist: { name: '林逸改', currentStatus: { chapter: 1 } },
      supportingCharacters: {},
    });

    syncFromJson(db, tempDir);

    const chars = db.prepare('SELECT * FROM characters').all() as any[];
    expect(chars).toHaveLength(1);
    expect(chars[0].name).toBe('林逸改');
  });

  it('should handle missing tracking files gracefully', () => {
    // No tracking files at all
    fs.ensureDirSync(path.join(tempDir, 'spec', 'tracking'));

    const result = syncFromJson(db, tempDir);

    expect(result.characters).toBe(0);
    expect(result.events).toBe(0);
    expect(result.relationships).toBe(0);
    expect(result.plotThreads).toBe(0);
  });

  it('should sync subplots from plot-tracker', () => {
    const trackingDir = path.join(tempDir, 'spec', 'tracking');
    fs.ensureDirSync(trackingDir);
    fs.writeJsonSync(path.join(trackingDir, 'plot-tracker.json'), {
      plotlines: {
        main: { name: '主线', status: 'active' },
        subplots: [
          { name: '感情线', status: 'active', description: '林逸与苏瑶' },
        ],
      },
      foreshadowing: [],
    });

    const result = syncFromJson(db, tempDir);

    // main + 1 subplot
    expect(result.plotThreads).toBe(2);
  });
});
