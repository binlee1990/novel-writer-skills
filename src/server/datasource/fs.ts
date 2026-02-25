import path from 'path';
import fs from 'fs-extra';
import type {
  DataSource, Story, StoryOverview, Volume, Chapter,
  Character, CharacterState, RelationshipGraph, RelationshipEvent,
  TimelineEvent, PlotThread, Foreshadow, ForeshadowMatrix, DashboardStats,
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

  // --- 以下方法将在 Task 7 实现 ---

  async getCharacters(_story: string, _vol?: number): Promise<Character[]> { return []; }
  async getCharacterArc(_story: string, _name: string): Promise<CharacterState[]> { return []; }
  async getRelationships(_story: string, _vol?: number): Promise<RelationshipGraph> { return { nodes: [], edges: [] }; }
  async getRelationshipHistory(_story: string): Promise<RelationshipEvent[]> { return []; }
  async getTimeline(_story: string, _vol?: number): Promise<TimelineEvent[]> { return []; }
  async getPlotThreads(_story: string): Promise<PlotThread[]> { return []; }
  async getForeshadowing(_story: string): Promise<Foreshadow[]> { return []; }
  async getForeshadowingMatrix(_story: string): Promise<ForeshadowMatrix> { return { chapters: [], rows: [] }; }
  async getDashboardStats(story: string): Promise<DashboardStats> {
    const overview = await this.getOverview(story);
    return {
      ...overview,
      totalCharacters: 0,
      activePlotThreads: 0,
      unresolvedForeshadowing: 0,
      volumeStats: (await this.getVolumes(story)).map(v => ({
        volume: v.number, title: v.title, words: v.words, chapters: v.chapters, progress: v.progress,
      })),
    };
  }
}
