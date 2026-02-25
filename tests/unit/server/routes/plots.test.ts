import { createPlotsRouter } from '../../../../src/server/routes/plots.js';
import type { DataSource } from '../../../../src/server/types.js';

function createMockDs(): Partial<DataSource> {
  return {
    getPlotThreads: jest.fn().mockResolvedValue([
      { name: '主线', type: 'main', status: 'active', description: '修仙之路', keyEvents: [] },
    ]),
    getForeshadowing: jest.fn().mockResolvedValue([
      { code: 'FS-001', description: '神秘玉佩', plantedChapter: 1, hintedChapters: [3], resolvedChapter: null, status: 'hinted', importance: 'high' },
    ]),
    getForeshadowingMatrix: jest.fn().mockResolvedValue({
      chapters: [1, 2, 3],
      rows: [{ code: 'FS-001', description: '神秘玉佩', cells: [] }],
    }),
  };
}

describe('createPlotsRouter', () => {
  it('creates router with expected routes', () => {
    const ds = createMockDs() as DataSource;
    const router = createPlotsRouter(ds);
    const routes = (router as any).stack
      .filter((l: any) => l.route)
      .map((l: any) => ({ path: l.route.path, method: Object.keys(l.route.methods)[0] }));

    expect(routes).toContainEqual({ path: '/plots', method: 'get' });
    expect(routes).toContainEqual({ path: '/foreshadowing', method: 'get' });
    expect(routes).toContainEqual({ path: '/foreshadowing/matrix', method: 'get' });
  });
});
