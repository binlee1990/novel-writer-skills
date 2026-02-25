import path from 'path';
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
        { name: 'my-novel', path: path.join('/fake/project', 'stories', 'my-novel') },
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
      // pathExists: volsDir=true, contentDir=true, summaryPath=true
      mockPathExists.mockResolvedValue(true as any);
      mockReaddir
        .mockResolvedValueOnce(['vol-001', 'vol-002'] as any) // volumes entries
        .mockResolvedValueOnce(['chapter-001.md'] as any) // vol-001 content
        .mockResolvedValueOnce(['chapter-001.md', 'chapter-002.md'] as any); // vol-002 content
      mockStat.mockResolvedValue({ isDirectory: () => true } as any);
      mockReadFile.mockResolvedValue('# 第 1 卷 标题\n\n内容' as any);

      const volumes = await ds.getVolumes('my-novel');
      expect(volumes.length).toBe(2);
      expect(volumes[0].number).toBe(1);
      expect(volumes[1].number).toBe(2);
    });
  });

  describe('getChapters', () => {
    it('returns chapter list from content/ directory', async () => {
      mockPathExists.mockResolvedValue(true as any);
      // getVolumes internals
      mockReaddir
        .mockResolvedValueOnce(['vol-001'] as any) // volumes for getVolumes
        .mockResolvedValueOnce(['chapter-001.md'] as any) // content for getVolumes word count
        .mockResolvedValueOnce(['chapter-001.md', 'chapter-001-synopsis.md'] as any); // content for getChapters
      mockStat.mockResolvedValue({ isDirectory: () => true } as any);
      mockReadFile.mockResolvedValue('章节内容' as any);

      const chapters = await ds.getChapters('my-novel', 1);
      expect(chapters.length).toBe(1);
      expect(chapters[0].globalNumber).toBe(1);
      expect(chapters[0].hasContent).toBe(true);
      expect(chapters[0].hasSynopsis).toBe(true);
    });
  });

  describe('getOverview', () => {
    it('returns aggregated overview', async () => {
      mockPathExists.mockResolvedValue(true as any);
      mockReaddir
        .mockResolvedValueOnce(['vol-001'] as any)
        .mockResolvedValueOnce(['chapter-001.md'] as any);
      mockStat.mockResolvedValue({ isDirectory: () => true } as any);
      mockReadFile.mockResolvedValue('一些内容' as any);

      const overview = await ds.getOverview('my-novel');
      expect(overview.name).toBe('my-novel');
      expect(overview.totalVolumes).toBe(1);
    });
  });
});
