import { FsDataSource } from '../../../../src/server/datasource/fs.js';

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
