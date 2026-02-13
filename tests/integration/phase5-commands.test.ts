/**
 * Phase 5 Integration Tests: Light Commands Adaptation
 * Tests for: /plan, /tasks, /timeline, /relations, /checklist, /guide, /revise, /volume-summary, /search
 */

import * as fs from 'fs-extra';
import * as path from 'path';

describe('Phase 5: Light Commands Adaptation', () => {
  describe('T1: /plan command adaptation', () => {
    const planPath = path.join(__dirname, '../../templates/commands/plan.md');

    it('should have three-layer fallback data loading section', () => {
      const content = fs.readFileSync(planPath, 'utf-8');
      expect(content).toContain('数据加载策略');
      expect(content).toContain('Layer 3: MCP 查询');
      expect(content).toContain('Layer 2: 分片 JSON');
      expect(content).toContain('Layer 1: 单文件 JSON');
    });

    it('should mention MCP plot query priority', () => {
      const content = fs.readFileSync(planPath, 'utf-8');
      expect(content).toContain('mcp.call');
      expect(content).toContain('query_plot');
    });

    it('should have sharded write protocol', () => {
      const content = fs.readFileSync(planPath, 'utf-8');
      expect(content).toContain('数据写入协议');
      expect(content).toContain('分片模式');
      expect(content).toContain('spec/tracking/volumes/');
    });
  });

  describe('T2: /tasks command adaptation', () => {
    const tasksPath = path.join(__dirname, '../../templates/commands/tasks.md');

    it('should have three-layer fallback for --from-plan mode', () => {
      const content = fs.readFileSync(tasksPath, 'utf-8');
      expect(content).toContain('三层回退');
      expect(content).toMatch(/Fallback|MCP.*查询|分片.*JSON/);
    });

    it('should mention query_plot with volume filter', () => {
      const content = fs.readFileSync(tasksPath, 'utf-8');
      expect(content).toContain('query_plot');
      expect(content).toMatch(/volume.*vol-/);
    });
  });

  describe('T3: /timeline command adaptation', () => {
    const timelinePath = path.join(__dirname, '../../templates/commands/timeline.md');

    it('should have updated argument-hint with --volume and --recent', () => {
      const content = fs.readFileSync(timelinePath, 'utf-8');
      expect(content).toMatch(/argument-hint:.*--volume.*--recent/);
    });

    it('should have three-layer fallback data loading', () => {
      const content = fs.readFileSync(timelinePath, 'utf-8');
      expect(content).toContain('数据加载策略');
      expect(content).toContain('三层回退');
      expect(content).toContain('query_timeline');
    });

    it('should document --volume and --recent parameter behavior', () => {
      const content = fs.readFileSync(timelinePath, 'utf-8');
      expect(content).toMatch(/--volume vol-XX/);
      expect(content).toMatch(/--recent N/);
      expect(content).toContain('仅加载指定卷');
    });

    it('should have data write protocol for sharded mode', () => {
      const content = fs.readFileSync(timelinePath, 'utf-8');
      expect(content).toContain('数据写入协议');
      expect(content).toContain('分片模式');
      expect(content).toContain('触发 MCP 同步');
    });
  });

  describe('T4: /relations command adaptation', () => {
    const relationsPath = path.join(__dirname, '../../templates/commands/relations.md');

    it('should have updated argument-hint with --volume and --character-focus', () => {
      const content = fs.readFileSync(relationsPath, 'utf-8');
      expect(content).toMatch(/argument-hint:.*--volume.*--character-focus/);
    });

    it('should have three-layer fallback data loading', () => {
      const content = fs.readFileSync(relationsPath, 'utf-8');
      expect(content).toContain('数据加载策略');
      expect(content).toContain('三层回退');
      expect(content).toContain('query_relationships');
    });

    it('should document --character-focus parameter', () => {
      const content = fs.readFileSync(relationsPath, 'utf-8');
      expect(content).toContain('--character-focus');
      expect(content).toContain('仅显示与指定角色相关的关系');
    });

    it('should have data write protocol with volume targeting', () => {
      const content = fs.readFileSync(relationsPath, 'utf-8');
      expect(content).toContain('数据写入协议');
      expect(content).toContain('确定目标卷');
      expect(content).toContain('relationships.json');
    });
  });

  describe('T5: /checklist command adaptation', () => {
    const checklistPath = path.join(__dirname, '../../templates/commands/checklist.md');

    it('should have argument-hint with --volume parameter', () => {
      const content = fs.readFileSync(checklistPath, 'utf-8');
      expect(content).toMatch(/argument-hint:.*--volume/);
    });

    it('should have three-layer fallback data loading', () => {
      const content = fs.readFileSync(checklistPath, 'utf-8');
      expect(content).toContain('数据加载策略');
      expect(content).toContain('三层回退');
      expect(content).toContain('stats_consistency');
    });

    it('should have volume filtering examples', () => {
      const content = fs.readFileSync(checklistPath, 'utf-8');
      expect(content).toContain('卷级检查');
      expect(content).toMatch(/--volume vol-\d+/);
    });

    it('should have data write protocol with volume-specific paths', () => {
      const content = fs.readFileSync(checklistPath, 'utf-8');
      expect(content).toContain('数据写入协议');
      expect(content).toContain('spec/checklists/validation/');
      expect(content).toMatch(/\$\{volumeFilter\}/);
    });
  });

  describe('T6: /guide command adaptation', () => {
    const guidePath = path.join(__dirname, '../../templates/commands/guide.md');

    it('should have three-layer data loading strategy section', () => {
      const content = fs.readFileSync(guidePath, 'utf-8');
      expect(content).toContain('数据加载策略');
      expect(content).toContain('三层回退');
      expect(content).toContain('stats_volume');
    });

    it('should detect sharded mode in Step 1', () => {
      const content = fs.readFileSync(guidePath, 'utf-8');
      expect(content).toContain('检测分片模式');
      expect(content).toMatch(/is_sharded.*=.*exists.*volumes/);
    });

    it('should update project scale calculation for sharded mode', () => {
      const content = fs.readFileSync(guidePath, 'utf-8');
      expect(content).toContain('IF is_sharded');
      expect(content).toContain('自动判定为超长篇');
    });

    it('should have new scenario for sharded mode migration suggestion', () => {
      const content = fs.readFileSync(guidePath, 'utf-8');
      expect(content).toMatch(/场景.*分片模式建议/);
      expect(content).toContain('actual_chapters > 300');
      expect(content).toContain('/track --migrate');
    });
  });

  describe('T7: /revise command adaptation', () => {
    const revisePath = path.join(__dirname, '../../templates/commands/revise.md');

    it('should have updated argument-hint with --volume parameter', () => {
      const content = fs.readFileSync(revisePath, 'utf-8');
      expect(content).toMatch(/argument-hint:.*--volume vol-XX/);
    });

    it('should have three-layer data loading strategy', () => {
      const content = fs.readFileSync(revisePath, 'utf-8');
      expect(content).toContain('数据加载策略');
      expect(content).toContain('三层回退');
      expect(content).toContain('query_characters');
    });

    it('should have volume-level modification scenario', () => {
      const content = fs.readFileSync(revisePath, 'utf-8');
      expect(content).toMatch(/场景.*卷级修改/);
      expect(content).toContain('/revise --volume vol-');
    });

    it('should update performance considerations with volume batching', () => {
      const content = fs.readFileSync(revisePath, 'utf-8');
      expect(content).toContain('性能考虑');
      expect(content).toContain('卷级修改');
      expect(content).toContain('三层回退优化');
    });
  });

  describe('T8: /volume-summary command (new)', () => {
    const volumeSummaryPath = path.join(__dirname, '../../templates/commands/volume-summary.md');

    it('should exist', () => {
      expect(fs.existsSync(volumeSummaryPath)).toBe(true);
    });

    it('should have correct frontmatter', () => {
      const content = fs.readFileSync(volumeSummaryPath, 'utf-8');
      expect(content).toMatch(/^---[\r\n]+name: volume-summary/);
      expect(content).toMatch(/argument-hint:.*vol-XX.*--export/);
    });

    it('should have three-layer data loading strategy', () => {
      const content = fs.readFileSync(volumeSummaryPath, 'utf-8');
      expect(content).toContain('数据加载策略');
      expect(content).toContain('Layer 3: MCP 查询');
      expect(content).toContain('stats_volume');
    });

    it('should have comprehensive report sections', () => {
      const content = fs.readFileSync(volumeSummaryPath, 'utf-8');
      expect(content).toContain('章节统计');
      expect(content).toContain('角色分析');
      expect(content).toContain('情节推进');
      expect(content).toContain('质量指标');
      expect(content).toContain('关键事件时间线');
    });

    it('should have export functionality', () => {
      const content = fs.readFileSync(volumeSummaryPath, 'utf-8');
      expect(content).toContain('--export');
      expect(content).toContain('spec/summaries/');
      expect(content).toMatch(/vol-.*-summary\.md/);
      expect(content).toMatch(/vol-.*-summary\.json/);
    });

    it('should have use cases and scenarios', () => {
      const content = fs.readFileSync(volumeSummaryPath, 'utf-8');
      expect(content).toContain('使用场景');
      expect(content).toContain('卷末回顾');
      expect(content).toContain('导出数据分析');
    });
  });

  describe('T9: /search command (new)', () => {
    const searchPath = path.join(__dirname, '../../templates/commands/search.md');

    it('should exist', () => {
      expect(fs.existsSync(searchPath)).toBe(true);
    });

    it('should have correct frontmatter', () => {
      const content = fs.readFileSync(searchPath, 'utf-8');
      expect(content).toMatch(/^---[\r\n]+name: search/);
      expect(content).toMatch(/argument-hint:.*--type.*--volume.*--fuzzy.*--regex/);
    });

    it('should have three-layer search strategy', () => {
      const content = fs.readFileSync(searchPath, 'utf-8');
      expect(content).toContain('数据加载策略');
      expect(content).toContain('Layer 3: MCP FTS5');
      expect(content).toContain('Layer 2: 分片 Grep');
      expect(content).toContain('Layer 1: 单文件 Grep');
    });

    it('should mention FTS5 and Chinese word segmentation', () => {
      const content = fs.readFileSync(searchPath, 'utf-8');
      expect(content).toContain('FTS5');
      expect(content).toContain('中文分词');
      expect(content).toContain('search_content');
    });

    it('should have search type filtering', () => {
      const content = fs.readFileSync(searchPath, 'utf-8');
      expect(content).toContain('--type=content');
      expect(content).toContain('--type=tracking');
      expect(content).toContain('--type=all');
    });

    it('should have volume filtering', () => {
      const content = fs.readFileSync(searchPath, 'utf-8');
      expect(content).toContain('--volume vol-');
      expect(content).toContain('卷级搜索');
    });

    it('should support fuzzy and regex search', () => {
      const content = fs.readFileSync(searchPath, 'utf-8');
      expect(content).toContain('--fuzzy');
      expect(content).toContain('--regex');
      expect(content).toContain('模糊匹配');
      expect(content).toContain('正则表达式');
    });

    it('should have comprehensive use cases', () => {
      const content = fs.readFileSync(searchPath, 'utf-8');
      expect(content).toContain('使用场景');
      expect(content).toContain('查找角色出场');
      expect(content).toContain('搜索特定伏笔');
      expect(content).toContain('卷级搜索');
    });
  });

  describe('Cross-command consistency', () => {
    const commandFiles = [
      'plan.md',
      'tasks.md',
      'timeline.md',
      'relations.md',
      'checklist.md',
      'guide.md',
      'revise.md',
      'volume-summary.md',
      'search.md',
    ];

    it('all adapted commands should mention three-layer fallback', () => {
      commandFiles.forEach((file) => {
        const filePath = path.join(__dirname, '../../templates/commands', file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          if (file !== 'guide.md') {
            // guide uses slightly different wording
            expect(content).toMatch(/三层.*回退|三层.*Fallback|Layer 3.*MCP/);
          } else {
            expect(content).toMatch(/三层.*回退|数据加载策略/);
          }
        }
      });
    });

    it('all adapted commands should mention MCP query tools', () => {
      const mcpCommands = [
        { file: 'plan.md', tool: 'query_plot' },
        { file: 'tasks.md', tool: 'query_plot' },
        { file: 'timeline.md', tool: 'query_timeline' },
        { file: 'relations.md', tool: 'query_relationships' },
        { file: 'checklist.md', tool: 'stats_consistency' },
        { file: 'guide.md', tool: 'stats_volume' },
        { file: 'revise.md', tool: 'query_characters' },
        { file: 'volume-summary.md', tool: 'stats_volume' },
        { file: 'search.md', tool: 'search_content' },
      ];

      mcpCommands.forEach(({ file, tool }) => {
        const filePath = path.join(__dirname, '../../templates/commands', file);
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).toContain(tool);
      });
    });

    it('volume filtering commands should have consistent --volume parameter format', () => {
      const volumeCommands = [
        'timeline.md',
        'relations.md',
        'checklist.md',
        'revise.md',
        'search.md',
      ];

      volumeCommands.forEach((file) => {
        const filePath = path.join(__dirname, '../../templates/commands', file);
        const content = fs.readFileSync(filePath, 'utf-8');
        // Accept both --volume vol-XX (template) and --volume vol-\d+ (example)
        expect(content).toMatch(/--volume vol-(?:XX|\d+)/);
      });
    });

    it('all commands should reference spec/tracking/volumes/ for sharded mode', () => {
      commandFiles.forEach((file) => {
        const filePath = path.join(__dirname, '../../templates/commands', file);
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).toMatch(/spec\/tracking\/volumes\/|分片模式|sharded/);
      });
    });
  });

  describe('New directory structure', () => {
    it('should have spec/summaries/ mentioned in volume-summary', () => {
      const content = fs.readFileSync(
        path.join(__dirname, '../../templates/commands/volume-summary.md'),
        'utf-8'
      );
      expect(content).toContain('spec/summaries/');
    });

    it('should have spec/checklists/validation/ mentioned in checklist', () => {
      const content = fs.readFileSync(
        path.join(__dirname, '../../templates/commands/checklist.md'),
        'utf-8'
      );
      expect(content).toContain('spec/checklists/validation/');
    });
  });

  describe('Documentation completeness', () => {
    it('all adapted commands should have usage examples', () => {
      const exampleCommands = [
        'timeline.md',
        'relations.md',
        'checklist.md',
        'revise.md',
        'volume-summary.md',
        'search.md',
      ];

      exampleCommands.forEach((file) => {
        const filePath = path.join(__dirname, '../../templates/commands', file);
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).toMatch(/使用场景|示例|场景/);
      });
    });

    it('all adapted commands should have command chain suggestions', () => {
      const commandFiles = [
        'timeline.md',
        'relations.md',
        'checklist.md',
        'volume-summary.md',
        'search.md',
      ];

      commandFiles.forEach((file) => {
        const filePath = path.join(__dirname, '../../templates/commands', file);
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).toMatch(/命令链式提示|下一步建议/);
      });
    });
  });
});
