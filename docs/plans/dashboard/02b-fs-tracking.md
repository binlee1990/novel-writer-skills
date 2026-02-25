# P2b: FsDataSource - Tracking 数据方法

## Task 7: FsDataSource - 角色/关系/时间线/情节方法

**Files:**
- Modify: `src/server/datasource/fs.ts`
- Test: `tests/unit/server/datasource/fs-tracking.test.ts`

**Step 1: 写失败测试**

```typescript
// tests/unit/server/datasource/fs-tracking.test.ts
import { FsDataSource } from '../../../src/server/datasource/fs.js';

jest.mock('fs-extra', () => ({
  pathExists: jest.fn(),
  readdir: jest.fn(),
  readJson: jest.fn(),
  readFile: jest.fn(),
  stat: jest.fn(),
}));

import fs from 'fs-extra';
const mockPathExists = fs.pathExists as jest.MockedFunction<typeof fs.pathExists>;
const mockReaddir = fs.readdir as jest.MockedFunction<typeof fs.readdir>;
const mockReadJson = fs.readJson as jest.MockedFunction<typeof fs.readJson>;
const mockStat = fs.stat as jest.MockedFunction<typeof fs.stat>;

describe('FsDataSource - tracking data', () => {
  let ds: FsDataSource;

  beforeEach(() => {
    ds = new FsDataSource('/fake/project');
    jest.clearAllMocks();
  });

  describe('getCharacters', () => {
    it('reads characters from tracking JSON', async () => {
      mockPathExists.mockResolvedValue(true as any);
      mockReaddir.mockResolvedValue(['vol-001'] as any);
      mockStat.mockResolvedValue({ isDirectory: () => true } as any);
      mockReadJson.mockResolvedValue({
        characters: [
          {
            name: '张三',
            aliases: ['三哥'],
            role: '主角',
            firstVolume: 1,
            firstChapter: 1,
            cultivation: '筑基',
            faction: '正道',
            status: '活跃',
          },
        ],
      });

      const chars = await ds.getCharacters('my-novel', 1);
      expect(chars.length).toBe(1);
      expect(chars[0].name).toBe('张三');
      expect(chars[0].role).toBe('主角');
    });

    it('returns empty when tracking file missing', async () => {
      mockPathExists.mockResolvedValue(false as any);
      const chars = await ds.getCharacters('my-novel', 1);
      expect(chars).toEqual([]);
    });
  });

  describe('getRelationships', () => {
    it('reads relationships and builds graph', async () => {
      mockPathExists.mockResolvedValue(true as any);
      mockReaddir.mockResolvedValue(['vol-001'] as any);
      mockStat.mockResolvedValue({ isDirectory: () => true } as any);
      mockReadJson
        .mockResolvedValueOnce({
          characters: [
            { name: '张三', aliases: [], role: '主角', firstVolume: 1, firstChapter: 1, cultivation: '', faction: '正道', status: '活跃' },
            { name: '李四', aliases: [], role: '配角', firstVolume: 1, firstChapter: 2, cultivation: '', faction: '正道', status: '活跃' },
          ],
        })
        .mockResolvedValueOnce({
          relationships: [
            { source: '张三', target: '李四', type: '盟友', status: '稳定', lastChapter: 5 },
          ],
        });

      const graph = await ds.getRelationships('my-novel', 1);
      expect(graph.nodes.length).toBe(2);
      expect(graph.edges.length).toBe(1);
      expect(graph.edges[0].type).toBe('盟友');
    });
  });

  describe('getTimeline', () => {
    it('reads timeline events from tracking JSON', async () => {
      mockPathExists.mockResolvedValue(true as any);
      mockReaddir.mockResolvedValue(['vol-001'] as any);
      mockStat.mockResolvedValue({ isDirectory: () => true } as any);
      mockReadJson.mockResolvedValue({
        events: [
          { id: 1, chapter: 1, storyTime: '元历1年', location: '青云山', description: '入门', tags: ['开端'] },
        ],
      });

      const events = await ds.getTimeline('my-novel', 1);
      expect(events.length).toBe(1);
      expect(events[0].location).toBe('青云山');
    });
  });

  describe('getPlotThreads', () => {
    it('reads plot threads from tracking JSON', async () => {
      mockPathExists.mockResolvedValue(true as any);
      mockReaddir.mockResolvedValue(['vol-001'] as any);
      mockStat.mockResolvedValue({ isDirectory: () => true } as any);
      mockReadJson.mockResolvedValue({
        currentChapter: 10,
        plotlines: [
          { name: '主线', type: 'main', status: 'active', description: '修仙之路', keyEvents: [] },
        ],
        foreshadowing: [],
      });

      const plots = await ds.getPlotThreads('my-novel');
      expect(plots.length).toBe(1);
      expect(plots[0].name).toBe('主线');
    });
  });

  describe('getForeshadowing', () => {
    it('reads foreshadowing from tracking JSON', async () => {
      mockPathExists.mockResolvedValue(true as any);
      mockReaddir.mockResolvedValue(['vol-001'] as any);
      mockStat.mockResolvedValue({ isDirectory: () => true } as any);
      mockReadJson.mockResolvedValue({
        currentChapter: 10,
        plotlines: [],
        foreshadowing: [
          {
            code: 'FS-001',
            description: '神秘玉佩',
            plantedChapter: 1,
            hintedChapters: [3, 5],
            resolvedChapter: null,
            status: 'hinted',
            importance: 'high',
          },
        ],
      });

      const items = await ds.getForeshadowing('my-novel');
      expect(items.length).toBe(1);
      expect(items[0].code).toBe('FS-001');
      expect(items[0].status).toBe('hinted');
    });
  });
});
```

**Step 2: 运行测试确认失败**

```bash
node node_modules/jest-cli/bin/jest.js --config jest.config.cjs tests/unit/server/datasource/fs-tracking.test.ts
```

Expected: FAIL（方法返回空数组，不匹配预期）

**Step 3: 实现 tracking 数据方法**

在 `src/server/datasource/fs.ts` 中，替换桩方法为真实实现：

```typescript
// 在 FsDataSource 类中添加辅助方法

private async findLatestVolume(story: string): Promise<number | null> {
  const volumes = await this.getVolumes(story);
  return volumes.length > 0 ? volumes[volumes.length - 1].number : null;
}

private trackingDir(story: string, vol: number): string {
  return path.join(this.volumeDir(story, vol), 'tracking');
}

private async readTrackingJson<T>(story: string, vol: number, filename: string, fallback: T): Promise<T> {
  const filePath = path.join(this.trackingDir(story, vol), filename);
  if (!await fs.pathExists(filePath)) return fallback;
  try {
    return await fs.readJson(filePath);
  } catch {
    return fallback;
  }
}

private async collectFromAllVolumes<T>(
  story: string,
  filename: string,
  fallback: T,
  vol?: number,
): Promise<Array<{ vol: number; data: T }>> {
  if (vol) {
    const data = await this.readTrackingJson<T>(story, vol, filename, fallback);
    return [{ vol, data }];
  }
  const volumes = await this.getVolumes(story);
  const results: Array<{ vol: number; data: T }> = [];
  for (const v of volumes) {
    const data = await this.readTrackingJson<T>(story, v.number, filename, fallback);
    results.push({ vol: v.number, data });
  }
  return results;
}

// 替换 getCharacters
async getCharacters(story: string, vol?: number): Promise<Character[]> {
  const results = await this.collectFromAllVolumes(
    story, 'character-state.json', { characters: [] }, vol
  );
  const charMap = new Map<string, Character>();
  for (const { data } of results) {
    for (const c of (data as any).characters || []) {
      if (!charMap.has(c.name)) {
        charMap.set(c.name, {
          name: c.name,
          aliases: c.aliases || [],
          role: c.role || '',
          firstVolume: c.firstVolume || 0,
          firstChapter: c.firstChapter || 0,
          cultivation: c.cultivation || '',
          faction: c.faction || '',
          status: c.status || '活跃',
        });
      }
    }
  }
  return [...charMap.values()];
}

async getCharacterArc(story: string, name: string): Promise<CharacterState[]> {
  const volumes = await this.getVolumes(story);
  const states: CharacterState[] = [];
  for (const v of volumes) {
    const data = await this.readTrackingJson<any>(story, v.number, 'character-state.json', { characters: [] });
    const char = (data.characters || []).find((c: any) => c.name === name);
    if (char) {
      states.push({
        volume: v.number,
        cultivation: char.cultivation || '',
        location: char.location || '',
        summary: char.summary || '',
        lastChapter: char.lastChapter || 0,
      });
    }
  }
  return states;
}

async getRelationships(story: string, vol?: number): Promise<RelationshipGraph> {
  const targetVol = vol || await this.findLatestVolume(story);
  if (!targetVol) return { nodes: [], edges: [] };

  const charData = await this.readTrackingJson<any>(story, targetVol, 'character-state.json', { characters: [] });
  const relData = await this.readTrackingJson<any>(story, targetVol, 'relationships.json', { relationships: [] });

  const nodes = (charData.characters || []).map((c: any) => ({
    id: c.name,
    name: c.name,
    faction: c.faction || '',
    role: c.role || '',
    appearances: 0,
  }));

  const edges = (relData.relationships || []).map((r: any) => ({
    source: r.source,
    target: r.target,
    type: r.type || '',
    status: r.status || '',
    lastChapter: r.lastChapter || 0,
  }));

  return { nodes, edges };
}

async getRelationshipHistory(_story: string): Promise<RelationshipEvent[]> {
  // 文件系统数据源不支持关系历史（需要 DB）
  return [];
}

async getTimeline(story: string, vol?: number): Promise<TimelineEvent[]> {
  const results = await this.collectFromAllVolumes(
    story, 'timeline.json', { events: [] }, vol
  );
  const events: TimelineEvent[] = [];
  for (const { data } of results) {
    for (const e of (data as any).events || []) {
      events.push({
        id: e.id || events.length,
        chapter: e.chapter || 0,
        storyTime: e.storyTime || '',
        location: e.location || '',
        description: e.description || '',
        tags: e.tags || [],
      });
    }
  }
  return events;
}

async getPlotThreads(story: string): Promise<PlotThread[]> {
  const results = await this.collectFromAllVolumes(
    story, 'plot-tracker.json', { plotlines: [], foreshadowing: [] }
  );
  const plotMap = new Map<string, PlotThread>();
  for (const { data } of results) {
    for (const p of (data as any).plotlines || []) {
      plotMap.set(p.name, {
        name: p.name,
        type: p.type || '',
        status: p.status || 'active',
        description: p.description || '',
        keyEvents: p.keyEvents || [],
      });
    }
  }
  return [...plotMap.values()];
}

async getForeshadowing(story: string): Promise<Foreshadow[]> {
  const results = await this.collectFromAllVolumes(
    story, 'plot-tracker.json', { plotlines: [], foreshadowing: [] }
  );
  const fsMap = new Map<string, Foreshadow>();
  for (const { data } of results) {
    for (const f of (data as any).foreshadowing || []) {
      fsMap.set(f.code, {
        code: f.code,
        description: f.description || '',
        plantedChapter: f.plantedChapter || 0,
        hintedChapters: f.hintedChapters || [],
        resolvedChapter: f.resolvedChapter || null,
        status: f.status || 'planted',
        importance: f.importance || 'normal',
      });
    }
  }
  return [...fsMap.values()];
}

async getForeshadowingMatrix(_story: string): Promise<ForeshadowMatrix> {
  // 文件系统数据源不支持伏笔矩阵（需要 DB）
  return { chapters: [], rows: [] };
}
```

**Step 4: 运行测试确认通过**

```bash
node node_modules/jest-cli/bin/jest.js --config jest.config.cjs tests/unit/server/datasource/fs-tracking.test.ts
```

Expected: PASS

**Step 5: 提交**

```bash
git add src/server/datasource/fs.ts tests/unit/server/datasource/fs-tracking.test.ts
git commit -m "feat(dashboard): implement FsDataSource tracking data methods (characters, relationships, timeline, plots)"
```
