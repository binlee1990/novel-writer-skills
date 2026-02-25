import { createStoriesRouter } from '../../../../src/server/routes/stories.js';
import type { DataSource } from '../../../../src/server/types.js';

function createMockDataSource(): DataSource {
  return {
    getStories: jest.fn().mockResolvedValue([
      { name: 'my-novel', path: '/fake/project/stories/my-novel' },
    ]),
    getOverview: jest.fn().mockResolvedValue({
      name: 'my-novel', totalVolumes: 2, totalChapters: 20, totalWords: 50000, currentVolume: 2,
    }),
    getVolumes: jest.fn().mockResolvedValue([
      { number: 1, title: '第 1 卷', chapters: 10, words: 25000, progress: 100 },
      { number: 2, title: '第 2 卷', chapters: 10, words: 25000, progress: 50 },
    ]),
    getChapters: jest.fn().mockResolvedValue([
      { globalNumber: 1, volumeNumber: 1, chapterInVolume: 1, title: '第 1 章', words: 2500, pov: '张三', participants: ['张三'], hasSynopsis: true, hasContent: true },
    ]),
    getCharacters: jest.fn().mockResolvedValue([]),
    getCharacterArc: jest.fn().mockResolvedValue([]),
    getRelationships: jest.fn().mockResolvedValue({ nodes: [], edges: [] }),
    getRelationshipHistory: jest.fn().mockResolvedValue([]),
    getTimeline: jest.fn().mockResolvedValue([]),
    getPlotThreads: jest.fn().mockResolvedValue([]),
    getForeshadowing: jest.fn().mockResolvedValue([]),
    getForeshadowingMatrix: jest.fn().mockResolvedValue({ chapters: [], rows: [] }),
    getDashboardStats: jest.fn().mockResolvedValue({
      totalWords: 0, totalChapters: 0, totalVolumes: 0,
      totalCharacters: 0, activePlotThreads: 0, unresolvedForeshadowing: 0, volumeStats: [],
    }),
  };
}

describe('createStoriesRouter', () => {
  it('creates a router with expected routes', () => {
    const ds = createMockDataSource();
    const router = createStoriesRouter(ds);
    const routes = (router as any).stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        method: Object.keys(layer.route.methods)[0],
      }));

    expect(routes).toContainEqual({ path: '/', method: 'get' });
    expect(routes).toContainEqual({ path: '/:story/overview', method: 'get' });
    expect(routes).toContainEqual({ path: '/:story/volumes', method: 'get' });
    expect(routes).toContainEqual({ path: '/:story/volumes/:vol/stats', method: 'get' });
    expect(routes).toContainEqual({ path: '/:story/chapters', method: 'get' });
    expect(routes).toContainEqual({ path: '/:story/chapters/:ch', method: 'get' });
  });
});
