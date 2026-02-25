import { createStatsRouter } from '../../../../src/server/routes/stats.js';
import type { DataSource } from '../../../../src/server/types.js';

function createMockDs(): Partial<DataSource> {
  return {
    getDashboardStats: jest.fn().mockResolvedValue({
      totalWords: 100000, totalChapters: 30, totalVolumes: 3,
      totalCharacters: 15, activePlotThreads: 4, unresolvedForeshadowing: 8,
      volumeStats: [],
    }),
  };
}

describe('createStatsRouter', () => {
  it('creates router with GET /dashboard', () => {
    const ds = createMockDs() as DataSource;
    const router = createStatsRouter(ds);
    const routes = (router as any).stack
      .filter((l: any) => l.route)
      .map((l: any) => ({ path: l.route.path, method: Object.keys(l.route.methods)[0] }));
    expect(routes).toContainEqual({ path: '/dashboard', method: 'get' });
  });
});
