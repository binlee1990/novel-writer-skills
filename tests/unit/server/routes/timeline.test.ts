import { createTimelineRouter } from '../../../../src/server/routes/timeline.js';
import type { DataSource } from '../../../../src/server/types.js';

function createMockDs(): Partial<DataSource> {
  return {
    getTimeline: jest.fn().mockResolvedValue([
      { id: 1, chapter: 1, storyTime: '元历1年', location: '青云山', description: '入门', tags: ['开端'] },
    ]),
  };
}

describe('createTimelineRouter', () => {
  it('creates router with GET /', () => {
    const ds = createMockDs() as DataSource;
    const router = createTimelineRouter(ds);
    const routes = (router as any).stack
      .filter((l: any) => l.route)
      .map((l: any) => ({ path: l.route.path, method: Object.keys(l.route.methods)[0] }));
    expect(routes).toContainEqual({ path: '/', method: 'get' });
  });
});
