import path from 'path';
import fs from 'fs-extra';
import type {
  DataSource, Story, StoryOverview, Volume, Chapter,
  Character, CharacterState, RelationshipGraph, RelationshipEvent,
  TimelineEvent, PlotThread, Foreshadow, ForeshadowMatrix, DashboardStats,
  ProtagonistOverview, ProtagonistSkill, ProtagonistItem, CultivationNode,
} from '../types.js';

export class FsDataSource implements DataSource {
  constructor(public projectRoot: string) {}

  private storiesDir(): string {
    return path.join(this.projectRoot, 'stories');
  }

  private storyDir(story: string): string {
    return path.join(this.storiesDir(), story);
  }

  private volumeDir(story: string, vol: number): string {
    return path.join(this.storyDir(story), 'volumes', `vol-${String(vol).padStart(3, '0')}`);
  }

  async getStories(): Promise<Story[]> {
    const dir = this.storiesDir();
    if (!await fs.pathExists(dir)) return [];
    const entries = await fs.readdir(dir);
    const stories: Story[] = [];
    for (const entry of entries) {
      const full = path.join(dir, entry);
      const stat = await fs.stat(full);
      if (stat.isDirectory()) {
        stories.push({ name: entry, path: full });
      }
    }
    return stories;
  }

  async getOverview(story: string): Promise<StoryOverview> {
    const volumes = await this.getVolumes(story);
    const totalWords = volumes.reduce((sum, v) => sum + v.words, 0);
    const totalChapters = volumes.reduce((sum, v) => sum + v.chapters, 0);
    const currentVolume = volumes.length > 0 ? volumes[volumes.length - 1].number : 0;
    return {
      name: story,
      totalVolumes: volumes.length,
      totalChapters,
      totalWords,
      currentVolume,
    };
  }

  async getVolumes(story: string): Promise<Volume[]> {
    const volsDir = path.join(this.storyDir(story), 'volumes');
    if (!await fs.pathExists(volsDir)) return [];
    const entries = await fs.readdir(volsDir);
    const volumes: Volume[] = [];
    for (const entry of entries) {
      const match = entry.match(/^vol-(\d+)$/);
      if (!match) continue;
      const full = path.join(volsDir, entry);
      const stat = await fs.stat(full);
      if (!stat.isDirectory()) continue;

      const num = parseInt(match[1], 10);
      const contentDir = path.join(full, 'content');
      let chapterCount = 0;
      let words = 0;

      if (await fs.pathExists(contentDir)) {
        const files = await fs.readdir(contentDir);
        const chapterFiles = files.filter(f => /^chapter-\d+\.md$/.test(f));
        chapterCount = chapterFiles.length;
        for (const cf of chapterFiles) {
          try {
            const content = await fs.readFile(path.join(contentDir, cf), 'utf-8');
            words += content.length;
          } catch { /* skip */ }
        }
      }

      let title = `第 ${num} 卷`;
      const summaryPath = path.join(full, 'volume-summary.md');
      if (await fs.pathExists(summaryPath)) {
        try {
          const summary = await fs.readFile(summaryPath, 'utf-8');
          const titleMatch = summary.match(/^#\s+(.+)/m);
          if (titleMatch) title = titleMatch[1];
        } catch { /* skip */ }
      }

      volumes.push({ number: num, title, chapters: chapterCount, words, progress: 0 });
    }
    return volumes.sort((a, b) => a.number - b.number);
  }

  async getChapters(story: string, vol?: number): Promise<Chapter[]> {
    const volumes = await this.getVolumes(story);
    const targetVols = vol ? volumes.filter(v => v.number === vol) : volumes;
    const chapters: Chapter[] = [];

    for (const v of targetVols) {
      const contentDir = path.join(this.volumeDir(story, v.number), 'content');
      if (!await fs.pathExists(contentDir)) continue;
      const files = await fs.readdir(contentDir);
      const chapterNums = [...new Set(
        files.map(f => f.match(/^chapter-(\d+)/)?.[1]).filter(Boolean)
      )];

      for (const chNum of chapterNums) {
        const num = parseInt(chNum!, 10);
        const contentFile = path.join(contentDir, `chapter-${chNum}.md`);
        const synopsisFile = path.join(contentDir, `chapter-${chNum}-synopsis.md`);
        let words = 0;
        const hasContent = await fs.pathExists(contentFile);
        const hasSynopsis = await fs.pathExists(synopsisFile);
        if (hasContent) {
          try {
            const content = await fs.readFile(contentFile, 'utf-8');
            words = content.length;
          } catch { /* skip */ }
        }
        chapters.push({
          globalNumber: num,
          volumeNumber: v.number,
          chapterInVolume: num,
          title: `第 ${num} 章`,
          words,
          pov: '',
          participants: [],
          hasSynopsis,
          hasContent,
        });
      }
    }
    return chapters.sort((a, b) => a.globalNumber - b.globalNumber);
  }

  // --- Tracking 辅助方法 ---

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

  // --- Tracking 数据方法 ---

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
    return { chapters: [], rows: [] };
  }

  async getDashboardStats(story: string): Promise<DashboardStats> {
    const overview = await this.getOverview(story);
    const characters = await this.getCharacters(story);
    const plots = await this.getPlotThreads(story);
    const foreshadowing = await this.getForeshadowing(story);
    return {
      ...overview,
      totalCharacters: characters.length,
      activePlotThreads: plots.filter(p => p.status === 'active').length,
      unresolvedForeshadowing: foreshadowing.filter(f => !f.resolvedChapter).length,
      volumeStats: (await this.getVolumes(story)).map(v => ({
        volume: v.number, title: v.title, words: v.words, chapters: v.chapters, progress: v.progress,
      })),
    };
  }

  async getProtagonistOverview(_story: string): Promise<ProtagonistOverview> {
    return { currentLevel: '', currentProgress: 0, totalSkills: 0, activeSkills: 0, totalItems: 0, heldItems: 0 };
  }

  async getProtagonistSkills(_story: string): Promise<ProtagonistSkill[]> {
    return [];
  }

  async getProtagonistInventory(_story: string): Promise<ProtagonistItem[]> {
    return [];
  }

  async getCultivationCurve(_story: string): Promise<CultivationNode[]> {
    return [];
  }
}
