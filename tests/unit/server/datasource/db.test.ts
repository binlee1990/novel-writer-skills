import { DbDataSource } from '../../../../src/server/datasource/db.js';

jest.mock('pg', () => {
  const mockClient = {
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn(),
  };
  return { Client: jest.fn(() => mockClient) };
});

import { Client } from 'pg';

describe('DbDataSource', () => {
  let ds: DbDataSource;
  let mockQuery: jest.Mock;

  beforeEach(() => {
    const config = {
      host: '127.0.0.1', port: 5432,
      dbname: 'test', user: 'postgres',
      password: '', schema: 'novelws',
    };
    ds = new DbDataSource(config, '/fake/project');
    const instance = (Client as unknown as jest.Mock).mock.results[0]?.value;
    mockQuery = instance?.query || jest.fn();
    jest.clearAllMocks();
  });

  describe('getStories', () => {
    it('returns story from project directory name', async () => {
      const stories = await ds.getStories();
      expect(stories.length).toBe(1);
      expect(stories[0].path).toBe('/fake/project');
    });
  });

  describe('getOverview', () => {
    it('queries volumes and chapters for overview', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '3' }] })
        .mockResolvedValueOnce({ rows: [{ count: '30', total_words: '100000' }] })
        .mockResolvedValueOnce({ rows: [{ vol_number: 3 }] });

      const overview = await ds.getOverview('my-novel');
      expect(overview.totalVolumes).toBe(3);
      expect(overview.totalChapters).toBe(30);
      expect(overview.totalWords).toBe(100000);
    });
  });

  describe('getCharacters', () => {
    it('queries characters table', async () => {
      mockQuery.mockResolvedValue({
        rows: [{
          name: '张三', aliases: '三哥', identity_type: '主角',
          first_vol: 1, first_chap: 1, cultivation_level: '筑基',
          faction: '正道', status: '活跃',
        }],
      });

      const chars = await ds.getCharacters('my-novel');
      expect(chars.length).toBe(1);
      expect(chars[0].name).toBe('张三');
    });
  });

  describe('getRelationships', () => {
    it('builds graph from characters and relationships tables', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            { name: '张三', faction: '正道', identity_type: '主角', appearances: 20 },
            { name: '李四', faction: '正道', identity_type: '配角', appearances: 10 },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            { char_a: '张三', char_b: '李四', rel_type: '盟友', current_status: '稳定', last_updated_chap: 5 },
          ],
        });

      const graph = await ds.getRelationships('my-novel');
      expect(graph.nodes.length).toBe(2);
      expect(graph.edges.length).toBe(1);
    });
  });

  describe('getForeshadowingMatrix', () => {
    it('builds matrix from foreshadowing and chapter_foreshadowing', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            { fs_code: 'FS-001', description: '神秘玉佩', status: 'hinted', importance: 'high' },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            { fs_code: 'FS-001', chapter_number: 1, action_type: 'plant' },
            { fs_code: 'FS-001', chapter_number: 5, action_type: 'hint' },
          ],
        })
        .mockResolvedValueOnce({
          rows: [{ max_chap: 10 }],
        });

      const matrix = await ds.getForeshadowingMatrix('my-novel');
      expect(matrix.rows.length).toBe(1);
      expect(matrix.rows[0].code).toBe('FS-001');
      expect(matrix.chapters.length).toBe(10);
    });
  });
});
