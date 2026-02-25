import { createProtagonistRouter } from '../../../../src/server/routes/protagonist.js';
import type { DataSource } from '../../../../src/server/types.js';

function createMockDs(): Partial<DataSource> {
  return {
    getProtagonistOverview: jest.fn().mockResolvedValue({
      currentLevel: '段1·炼气前期', currentProgress: 37.8,
      totalSkills: 11, activeSkills: 11, totalItems: 15, heldItems: 10,
    }),
    getProtagonistSkills: jest.fn().mockResolvedValue([
      { name: '账本脑', category: '账本脑', level: '入门', description: '数据化思维', acquiredChapter: 1, useCount: 0, status: 'active' },
      { name: '定身符', category: '符', level: '入门', description: '3秒静止效果', acquiredChapter: 68, useCount: 0, status: 'active' },
    ]),
    getProtagonistInventory: jest.fn().mockResolvedValue([
      { name: '定身符纸成品', type: '消耗品', quantity: 6, quality: '普通', description: '3秒静止效果', acquiredChapter: 68, status: 'held' },
    ]),
    getCultivationCurve: jest.fn().mockResolvedValue([
      { chapter: 1, level: '段0', progressPct: 0, breakthroughType: 'major', detail: '铜盘觉醒' },
      { chapter: 68, level: '段1·炼气前期', progressPct: 0, breakthroughType: 'major', detail: '修炼突破' },
      { chapter: 300, level: '段1·炼气前期', progressPct: 37.8, breakthroughType: null, detail: '卷3完结状态' },
    ]),
  };
}

describe('createProtagonistRouter', () => {
  it('creates router with expected routes', () => {
    const ds = createMockDs() as DataSource;
    const router = createProtagonistRouter(ds);
    const routes = (router as any).stack
      .filter((l: any) => l.route)
      .map((l: any) => ({ path: l.route.path, method: Object.keys(l.route.methods)[0] }));

    expect(routes).toContainEqual({ path: '/overview', method: 'get' });
    expect(routes).toContainEqual({ path: '/skills', method: 'get' });
    expect(routes).toContainEqual({ path: '/inventory', method: 'get' });
    expect(routes).toContainEqual({ path: '/cultivation', method: 'get' });
  });
});
