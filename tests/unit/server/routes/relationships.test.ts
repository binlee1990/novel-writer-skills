import { createRelationshipsRouter } from '../../../../src/server/routes/relationships.js';
import type { DataSource } from '../../../../src/server/types.js';

function createMockDs(): Partial<DataSource> {
  return {
    getRelationships: jest.fn().mockResolvedValue({
      nodes: [{ id: '张三', name: '张三', faction: '正道', role: '主角', appearances: 20 }],
      edges: [{ source: '张三', target: '李四', type: '盟友', status: '稳定', lastChapter: 5 }],
    }),
    getRelationshipHistory: jest.fn().mockResolvedValue([
      { chapter: 5, source: '张三', target: '李四', type: '盟友', oldStatus: '陌生', newStatus: '稳定' },
    ]),
  };
}

describe('createRelationshipsRouter', () => {
  it('creates router with expected routes', () => {
    const ds = createMockDs() as DataSource;
    const router = createRelationshipsRouter(ds);
    const routes = (router as any).stack
      .filter((l: any) => l.route)
      .map((l: any) => ({ path: l.route.path, method: Object.keys(l.route.methods)[0] }));

    expect(routes).toContainEqual({ path: '/', method: 'get' });
    expect(routes).toContainEqual({ path: '/history', method: 'get' });
  });
});
