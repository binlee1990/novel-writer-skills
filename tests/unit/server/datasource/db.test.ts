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

  describe('getProtagonistOverview', () => {
    it('returns cultivation level and skill/item counts', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ level: '段1·炼气前期', progress_pct: 37.8 }] })
        .mockResolvedValueOnce({ rows: [{ total: '11', active: '11' }] })
        .mockResolvedValueOnce({ rows: [{ total: '15', held: '10' }] });

      const ov = await ds.getProtagonistOverview('my-novel');
      expect(ov.currentLevel).toBe('段1·炼气前期');
      expect(ov.currentProgress).toBe(37.8);
      expect(ov.totalSkills).toBe(11);
      expect(ov.activeSkills).toBe(11);
      expect(ov.totalItems).toBe(15);
      expect(ov.heldItems).toBe(10);
    });
  });

  describe('getProtagonistSkills', () => {
    it('returns skills from skill_overview view', async () => {
      mockQuery.mockResolvedValue({
        rows: [
          { skill_name: '账本脑', skill_category: '账本脑', skill_level: '入门', status: 'active', description: '数据化思维', acquired_chapter: 1, use_count: 0 },
          { skill_name: '定身符', skill_category: '符', skill_level: '入门', status: 'active', description: '3秒静止', acquired_chapter: 68, use_count: 0 },
        ],
      });

      const skills = await ds.getProtagonistSkills('my-novel');
      expect(skills.length).toBe(2);
      expect(skills[0].name).toBe('账本脑');
      expect(skills[1].category).toBe('符');
    });
  });

  describe('getProtagonistInventory', () => {
    it('returns items from protagonist_inventory', async () => {
      mockQuery.mockResolvedValue({
        rows: [
          { item_name: '短刃', item_type: '装备', quantity: 1, quality: '普通', description: '来自补给点', acquired_chapter: 30, status: 'held' },
        ],
      });

      const items = await ds.getProtagonistInventory('my-novel');
      expect(items.length).toBe(1);
      expect(items[0].name).toBe('短刃');
      expect(items[0].type).toBe('装备');
    });
  });

  describe('getCultivationCurve', () => {
    it('returns cultivation nodes ordered by chapter', async () => {
      mockQuery.mockResolvedValue({
        rows: [
          { chapter_number: 1, level: '段0', progress_pct: '0.0', breakthrough_type: 'major', trigger: '铜盘觉醒' },
          { chapter_number: 68, level: '段1·炼气前期', progress_pct: '0.0', breakthrough_type: 'major', trigger: '修炼突破' },
          { chapter_number: 300, level: '段1·炼气前期', progress_pct: '37.8', breakthrough_type: null, trigger: '卷3完结状态' },
        ],
      });

      const curve = await ds.getCultivationCurve('my-novel');
      expect(curve.length).toBe(3);
      expect(curve[0].chapter).toBe(1);
      expect(curve[0].breakthroughType).toBe('major');
      expect(curve[2].progressPct).toBe(37.8);
      expect(curve[2].detail).toBe('卷3完结状态');
    });
  });
});
