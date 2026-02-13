import fs from 'fs-extra';
import path from 'path';

const TEMPLATES_DIR = path.resolve(__dirname, '../../templates');
const COMMANDS_DIR = path.join(TEMPLATES_DIR, 'commands');

describe('Phase 4: Commands Refactoring for Ultra-Long Novel Support', () => {
  describe('/recap command', () => {
    const recapFile = path.join(COMMANDS_DIR, 'recap.md');
    let content: string;

    beforeAll(() => {
      content = fs.readFileSync(recapFile, 'utf-8');
    });

    it('should have updated argument-hint with volume parameters', () => {
      expect(content).toMatch(/argument-hint:.*--volume/);
      expect(content).toMatch(/argument-hint:.*vol-XX/);
    });

    it('should have parameter parsing section', () => {
      expect(content).toContain('参数解析');
      expect(content).toContain('--brief');
      expect(content).toContain('--full vol-XX');
      expect(content).toContain('--volume vol-XX');
    });

    it('should have three-layer fallback data loading', () => {
      expect(content).toContain('三层 Fallback 数据加载');
      expect(content).toContain('Layer 1: MCP 查询');
      expect(content).toContain('Layer 2: 分片 JSON');
      expect(content).toContain('Layer 3: 单文件 JSON');
    });

    it('should reference MCP tools for data queries', () => {
      expect(content).toContain('query_characters');
      expect(content).toContain('query_plot');
      expect(content).toContain('query_timeline');
    });

    it('should support volume-scoped chapter reading', () => {
      expect(content).toContain('只读该卷范围内的最近 3 章');
      expect(content).toContain('volume-summaries.json');
    });
  });

  describe('/track command', () => {
    const trackFile = path.join(COMMANDS_DIR, 'track.md');
    let content: string;

    beforeAll(() => {
      content = fs.readFileSync(trackFile, 'utf-8');
    });

    it('should have updated argument-hint with volume and incremental sync', () => {
      expect(content).toMatch(/argument-hint:.*--volume vol-XX/);
      expect(content).toMatch(/argument-hint:.*--incremental/);
    });

    it('should support volume-scoped check', () => {
      expect(content).toContain('--volume 范围限定');
      expect(content).toContain('只检查该卷的 tracking 数据');
    });

    it('should have incremental sync mode', () => {
      expect(content).toContain('增量同步（--sync --incremental）');
      expect(content).toContain('last_sync_chapter');
      expect(content).toContain('tracking-log.md');
    });

    it('should have data write protocol', () => {
      expect(content).toContain('数据写入协议');
      expect(content).toContain('三层 Fallback 数据加载');
      expect(content).toContain('分片模式写入');
      expect(content).toContain('单文件模式写入');
    });

    it('should reference MCP sync tool', () => {
      expect(content).toContain('sync_from_json');
    });
  });

  describe('/analyze command', () => {
    const analyzeFile = path.join(COMMANDS_DIR, 'analyze.md');
    let content: string;

    beforeAll(() => {
      content = fs.readFileSync(analyzeFile, 'utf-8');
    });

    it('should have updated argument-hint with volume-report', () => {
      expect(content).toMatch(/argument-hint:.*--volume-report vol-XX/);
      expect(content).toMatch(/argument-hint:.*--range/);
    });

    it('should have data loading strategy section', () => {
      expect(content).toContain('数据加载策略（三层 Fallback）');
      expect(content).toContain('Layer 1: MCP 查询');
      expect(content).toContain('Layer 2: 分片 JSON');
      expect(content).toContain('Layer 3: 单文件 JSON');
    });

    it('should have volume-report comprehensive analysis', () => {
      expect(content).toContain('--volume-report 综合报告');
      expect(content).toContain('卷概览');
      expect(content).toContain('情节分析');
      expect(content).toContain('跨卷对比');
    });

    it('should reference MCP stats tools', () => {
      expect(content).toContain('stats_volume');
      expect(content).toContain('query_characters');
      expect(content).toContain('query_plot');
    });

    it('should have sharded write protocol in tracking update', () => {
      expect(content).toContain('分片模式写入协议');
      expect(content).toContain('确定章节所属卷');
      expect(content).toContain('同步更新全局摘要');
    });
  });

  describe('/facts command', () => {
    const factsFile = path.join(COMMANDS_DIR, 'facts.md');
    let content: string;

    beforeAll(() => {
      content = fs.readFileSync(factsFile, 'utf-8');
    });

    it('should have updated argument-hint with volume and range', () => {
      expect(content).toMatch(/argument-hint:.*--volume vol-XX/);
      expect(content).toMatch(/argument-hint:.*--range ch-XXX-YYY/);
    });

    it('should have data loading protocol section', () => {
      expect(content).toContain('数据加载协议（三层 Fallback）');
      expect(content).toContain('Layer 1: MCP 查询');
      expect(content).toContain('query_facts');
    });

    it('should have chapter scanning scope control', () => {
      expect(content).toContain('章节扫描范围');
      expect(content).toContain('只扫描该卷范围内的章节');
      expect(content).toContain('volume-summaries.json');
    });

    it('should have MCP priority strategy for fact checking', () => {
      expect(content).toContain('MCP 优先策略');
      expect(content).toContain('search_content');
      expect(content).toContain('全文检索');
    });
  });

  describe('/write command', () => {
    const writeFile = path.join(COMMANDS_DIR, 'write.md');
    let content: string;

    beforeAll(() => {
      content = fs.readFileSync(writeFile, 'utf-8');
    });

    it('should have updated argument-hint with batch and volume', () => {
      expect(content).toMatch(/argument-hint:.*--batch N/);
      expect(content).toMatch(/argument-hint:.*--volume vol-XX/);
    });

    it('should have three-layer fallback for tracking data', () => {
      expect(content).toContain('三层 Fallback');
      expect(content).toContain('Layer 1: MCP 查询');
      expect(content).toContain('Layer 2: 分片 JSON');
      expect(content).toContain('Layer 3: 单文件 JSON');
    });

    it('should have batch writing mode', () => {
      expect(content).toContain('批量写作模式（`--batch N`）');
      expect(content).toContain('Flow-Pipeline');
      expect(content).toContain('上下文传递');
      expect(content).toContain('中断与恢复');
    });

    it('should have MCP sync in post-processing', () => {
      expect(content).toContain('MCP 同步');
      expect(content).toContain('log_writing_session');
      expect(content).toContain('sync_from_json');
      expect(content).toContain('FTS 索引');
    });

    it('should have sharded write protocol', () => {
      expect(content).toContain('分片模式');
      expect(content).toContain('确定当前章节所属卷');
      expect(content).toContain('更新该卷的分片文件');
    });

    it('should limit batch size to 5', () => {
      expect(content).toContain('最大值为 5');
    });
  });

  describe('/character command', () => {
    const characterFile = path.join(COMMANDS_DIR, 'character.md');
    let content: string;

    beforeAll(() => {
      content = fs.readFileSync(characterFile, 'utf-8');
    });

    it('should have updated argument-hint with volume', () => {
      expect(content).toMatch(/argument-hint:.*--volume vol-XX/);
    });

    it('should have three-layer fallback in prerequisites', () => {
      expect(content).toContain('三层 Fallback');
      expect(content).toContain('Layer 1: MCP 查询');
      expect(content).toContain('query_characters');
      expect(content).toContain('query_relationships');
    });

    it('should support volume filter in list command', () => {
      expect(content).toContain('--volume vol-XX');
      expect(content).toContain('仅显示该卷中出场的角色');
    });

    it('should have MCP priority in timeline command', () => {
      expect(content).toContain('MCP 优先');
      expect(content).toContain('search_content');
      expect(content).toContain('获取所有出场章节');
    });

    it('should have sharded write protocol', () => {
      expect(content).toContain('分片写入协议');
      expect(content).toContain('确定角色最后出场章节所属的卷');
      expect(content).toContain('同步更新全局摘要');
    });
  });

  describe('Cross-command consistency', () => {
    const commands = ['recap.md', 'track.md', 'analyze.md', 'facts.md', 'write.md', 'character.md'];

    it('should all reference three-layer fallback pattern', () => {
      for (const cmd of commands) {
        const content = fs.readFileSync(path.join(COMMANDS_DIR, cmd), 'utf-8');
        expect(content).toMatch(/三层.*Fallback|Fallback.*三层/);
        expect(content).toMatch(/MCP/);
        expect(content).toMatch(/分片/);
        expect(content).toMatch(/单文件/);
      }
    });

    it('should all reference volume-summaries.json for volume metadata', () => {
      const volumeAwareCommands = ['recap.md', 'analyze.md', 'facts.md'];
      for (const cmd of volumeAwareCommands) {
        const content = fs.readFileSync(path.join(COMMANDS_DIR, cmd), 'utf-8');
        expect(content).toContain('volume-summaries.json');
      }
    });

    it('should all reference MCP sync_from_json for data persistence', () => {
      const writeCommands = ['track.md', 'analyze.md', 'write.md', 'character.md'];
      for (const cmd of writeCommands) {
        const content = fs.readFileSync(path.join(COMMANDS_DIR, cmd), 'utf-8');
        expect(content).toContain('sync_from_json');
      }
    });
  });
});
