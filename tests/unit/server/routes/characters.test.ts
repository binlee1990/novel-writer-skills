import { createCharactersRouter } from '../../../../src/server/routes/characters.js';
import type { DataSource } from '../../../../src/server/types.js';

function createMockDs(): Partial<DataSource> {
  return {
    getCharacters: jest.fn().mockResolvedValue([
      { name: '张三', aliases: ['三哥'], role: '主角', firstVolume: 1, firstChapter: 1, cultivation: '筑基', faction: '正道', status: '活跃' },
    ]),
    getCharacterArc: jest.fn().mockResolvedValue([
      { volume: 1, cultivation: '筑基', location: '青云山', summary: '入门弟子', lastChapter: 10 },
    ]),
  };
}

describe('createCharactersRouter', () => {
  it('creates router with expected routes', () => {
    const ds = createMockDs() as DataSource;
    const router = createCharactersRouter(ds);
    const routes = (router as any).stack
      .filter((l: any) => l.route)
      .map((l: any) => ({ path: l.route.path, method: Object.keys(l.route.methods)[0] }));

    expect(routes).toContainEqual({ path: '/', method: 'get' });
    expect(routes).toContainEqual({ path: '/:name/arc', method: 'get' });
  });
});
