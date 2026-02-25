import type {
  Story,
  StoryOverview,
  Volume,
  Chapter,
  Character,
  CharacterState,
  RelationshipGraph,
  RelationshipNode,
  RelationshipEdge,
  RelationshipEvent,
  TimelineEvent,
  PlotThread,
  Foreshadow,
  ForeshadowMatrix,
  ForeshadowCell,
  DashboardStats,
  DataSource,
} from '../../../src/server/types.js';

describe('server types', () => {
  it('Story type has required fields', () => {
    const story: Story = { name: 'test', path: '/test' };
    expect(story.name).toBe('test');
  });

  it('StoryOverview type has required fields', () => {
    const overview: StoryOverview = {
      name: 'test',
      totalVolumes: 3,
      totalChapters: 30,
      totalWords: 100000,
      currentVolume: 2,
    };
    expect(overview.totalVolumes).toBe(3);
  });

  it('RelationshipGraph has nodes and edges', () => {
    const graph: RelationshipGraph = { nodes: [], edges: [] };
    expect(graph.nodes).toEqual([]);
  });

  it('ForeshadowMatrix has chapters and rows', () => {
    const matrix: ForeshadowMatrix = { chapters: [], rows: [] };
    expect(matrix.rows).toEqual([]);
  });

  it('DashboardStats has all summary fields', () => {
    const stats: DashboardStats = {
      totalWords: 0,
      totalChapters: 0,
      totalVolumes: 0,
      totalCharacters: 0,
      activePlotThreads: 0,
      unresolvedForeshadowing: 0,
      volumeStats: [],
    };
    expect(stats.totalWords).toBe(0);
  });
});
