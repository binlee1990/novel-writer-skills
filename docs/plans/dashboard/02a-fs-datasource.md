# P2a: 文件系统数据源实现

## Task 6: FsDataSource - 故事/卷/章节方法

**Files:**
- Modify: `src/server/datasource/fs.ts`
- Test: `tests/unit/server/datasource/fs-stories.test.ts`

**Step 1: 写失败测试**

```typescript
// tests/unit/server/datasource/fs-stories.test.ts
import path from 'path';
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
const mockReadFile = fs.readFile as jest.MockedFunction<typeof fs.readFile>;
const mockStat = fs.stat as jest.MockedFunction<typeof fs.stat>;

describe('FsDataSource - stories/volumes/chapters', () => {
  let ds: FsDataSource;

  beforeEach(() => {
    ds = new FsDataSource('/fake/project');
    jest.clearAllMocks();
  });

  describe('getStories', () => {
    it('returns story list from stories/ directory', async () => {
      mockPathExists.mockResolvedValue(true as any);
      mockReaddir.mockResolvedValue(['my-novel'] as any);
      mockStat.mockResolvedValue({ isDirectory: () => true } as any);

      const stories = await ds.getStories();
      expect(stories).toEqual([
        { name: 'my-novel', path: '/fake/project/stories/my-novel' },
      ]);
    });

    it('returns empty array when stories/ does not exist', async () => {
      mockPathExists.mockResolvedValue(false as any);
      const stories = await ds.getStories();
      expect(stories).toEqual([]);
    });
  });

  describe('getVolumes', () => {
    it('returns volume list from volumes/ directory', async () => {
      mockPathExists.mockResolvedValue(true as any);
      mockReaddir.mockResolvedValue(['vol-001', 'vol-002'] as any);
      mockStat.mockResolvedValue({ isDirectory: () => true } as any);
      // volume-summary.md 存在
      mockReadFile.mockResolvedValue('# 第 1 卷 标题\n\n## 故事进度\n- 已完成章节：1-10' as any);

      const volumes = await ds.getVolumes('my-novel');
      expect(volumes.length).toBe(2);
      expect(volumes[0].number).toBe(1);
    });
  });

  describe('getChapters', () => {
    it('returns chapter list from content/ directory', async () => {
      mockPathExists.mockResolvedValue(true as any);
      mockReaddir.mockResolvedValue(['vol-001'] as any);
      mockStat.mockResolvedValue({ isDirectory: () => true } as any);

      // content 目录下的文件
      const contentFiles = ['chapter-001-synopsis.md', 'chapter-001.md', 'chapter-002-synopsis.md'];
      mockReaddir
        .mockResolvedValueOnce(['vol-001'] as any) // volumes
        .mockResolvedValueOnce(contentFiles as any); // content files

      mockReadFile.mockResolvedValue('章节内容，大约一千字...' as any);

      const chapters = await ds.getChapters('my-novel', 1);
      expect(chapters.length).toBeGreaterThan(0);
    });
  });
});
```

**Step 2: 运行测试确认失败**

```bash
node node_modules/jest-cli/bin/jest.js --config jest.config.cjs tests/unit/server/datasource/fs-stories.test.ts
```

Expected: FAIL

**Step 3: 实现 FsDataSource 故事/卷/章节方法**

替换 `src/server/datasource/fs.ts` 中的桩实现：

```typescript
// src/server/datasource/fs.ts
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

  // --- 以下方法从 tracking JSON 读取 ---

  async getCharacters(_story: string, _vol?: number): Promise<Character[]> {
    // 将在 Task 7 实现
    return [];
  }
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
```

**Step 4: 运行测试确认通过**

```bash
node node_modules/jest-cli/bin/jest.js --config jest.config.cjs tests/unit/server/datasource/fs-stories.test.ts
```

Expected: PASS

**Step 5: 提交**

```bash
git add src/server/datasource/fs.ts tests/unit/server/datasource/fs-stories.test.ts
git commit -m "feat(dashboard): implement FsDataSource stories/volumes/chapters methods"
```
