# P3c: API 路由 - Timeline/Plots/Stats

## Task 12: Timeline 路由

**Files:**
- Create: `src/server/routes/timeline.ts`
- Test: `tests/unit/server/routes/timeline.test.ts`

**Step 1: 写失败测试**

```typescript
// tests/unit/server/routes/timeline.test.ts
import { createTimelineRouter } from '../../../src/server/routes/timeline.js';
import type { DataSource } from '../../../src/server/types.js';

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
```

**Step 2: 实现路由**

```typescript
// src/server/routes/timeline.ts
import { Router } from 'express';
import type { DataSource } from '../types.js';

export function createTimelineRouter(ds: DataSource): Router {
  const router = Router({ mergeParams: true });

  // GET /api/stories/:story/timeline?vol=X
  router.get('/', async (req, res) => {
    try {
      const vol = req.query.vol ? parseInt(req.query.vol as string, 10) : undefined;
      const events = await ds.getTimeline(req.params.story, vol);
      res.json(events);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  return router;
}
```

**Step 3: 运行测试，提交**

```bash
node node_modules/jest-cli/bin/jest.js --config jest.config.cjs tests/unit/server/routes/timeline.test.ts
git add src/server/routes/timeline.ts tests/unit/server/routes/timeline.test.ts
git commit -m "feat(dashboard): add timeline API route"
```

---

## Task 13: Plots 路由（情节线 + 伏笔）

**Files:**
- Create: `src/server/routes/plots.ts`
- Test: `tests/unit/server/routes/plots.test.ts`

**Step 1: 写失败测试**

```typescript
// tests/unit/server/routes/plots.test.ts
import { createPlotsRouter } from '../../../src/server/routes/plots.js';
import type { DataSource } from '../../../src/server/types.js';

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
```

**Step 2: 实现路由**

```typescript
// src/server/routes/plots.ts
import { Router } from 'express';
import type { DataSource } from '../types.js';

export function createPlotsRouter(ds: DataSource): Router {
  const router = Router({ mergeParams: true });

  // GET /api/stories/:story/plots
  router.get('/plots', async (req, res) => {
    try {
      const plots = await ds.getPlotThreads(req.params.story);
      res.json(plots);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // GET /api/stories/:story/foreshadowing
  router.get('/foreshadowing', async (req, res) => {
    try {
      const items = await ds.getForeshadowing(req.params.story);
      res.json(items);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // GET /api/stories/:story/foreshadowing/matrix
  router.get('/foreshadowing/matrix', async (req, res) => {
    try {
      const matrix = await ds.getForeshadowingMatrix(req.params.story);
      res.json(matrix);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  return router;
}
```

**Step 3: 运行测试，提交**

```bash
node node_modules/jest-cli/bin/jest.js --config jest.config.cjs tests/unit/server/routes/plots.test.ts
git add src/server/routes/plots.ts tests/unit/server/routes/plots.test.ts
git commit -m "feat(dashboard): add plots and foreshadowing API routes"
```

---

## Task 14: Stats 路由 + 路由挂载汇总

**Files:**
- Create: `src/server/routes/stats.ts`
- Modify: `src/server/index.ts`（挂载所有路由）
- Test: `tests/unit/server/routes/stats.test.ts`

**Step 1: 写失败测试**

```typescript
// tests/unit/server/routes/stats.test.ts
import { createStatsRouter } from '../../../src/server/routes/stats.js';
import type { DataSource } from '../../../src/server/types.js';

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
```

**Step 2: 实现路由**

```typescript
// src/server/routes/stats.ts
import { Router } from 'express';
import type { DataSource } from '../types.js';

export function createStatsRouter(ds: DataSource): Router {
  const router = Router();

  // GET /api/stats/dashboard?story=X
  router.get('/dashboard', async (req, res) => {
    try {
      const story = req.query.story as string;
      if (!story) {
        res.status(400).json({ error: '缺少 story 参数' });
        return;
      }
      const stats = await ds.getDashboardStats(story);
      res.json(stats);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  return router;
}
```

**Step 3: 修改 `src/server/index.ts` 挂载所有路由**

```typescript
// src/server/index.ts 完整版
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import type { DataSource } from './types.js';
import { createStoriesRouter } from './routes/stories.js';
import { createCharactersRouter } from './routes/characters.js';
import { createRelationshipsRouter } from './routes/relationships.js';
import { createTimelineRouter } from './routes/timeline.js';
import { createPlotsRouter } from './routes/plots.js';
import { createStatsRouter } from './routes/stats.js';

export function createApp(projectRoot: string, ds?: DataSource) {
  const app = express();
  app.use(express.json());

  // CORS
  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
  });

  // 健康检查
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', project: projectRoot });
  });

  // API 路由
  if (ds) {
    app.use('/api/stories', createStoriesRouter(ds));
    app.use('/api/stories/:story/characters', createCharactersRouter(ds));
    app.use('/api/stories/:story/relationships', createRelationshipsRouter(ds));
    app.use('/api/stories/:story/timeline', createTimelineRouter(ds));
    app.use('/api/stories/:story', createPlotsRouter(ds));
    app.use('/api/stats', createStatsRouter(ds));
  }

  // 静态文件
  const dashboardDir = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '..', 'dashboard'
  );
  app.use(express.static(dashboardDir));

  // SPA fallback
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(dashboardDir, 'index.html'));
  });

  return app;
}

export async function startServer(projectRoot: string, port: number) {
  const { createDataSource } = await import('./datasource/index.js');
  const ds = await createDataSource(projectRoot);
  console.log(`📦 数据源: ${(ds as any).type === 'db' ? 'PostgreSQL' : '文件系统'}`);
  const app = createApp(projectRoot, ds);
  return new Promise<ReturnType<typeof app.listen>>((resolve) => {
    const server = app.listen(port, () => {
      console.log(`🚀 Dashboard 已启动: http://localhost:${port}`);
      resolve(server);
    });
  });
}
```

**Step 4: 运行全部路由测试**

```bash
node node_modules/jest-cli/bin/jest.js --config jest.config.cjs tests/unit/server/routes/
```

Expected: ALL PASS

**Step 5: 提交**

```bash
git add src/server/routes/stats.ts src/server/index.ts tests/unit/server/routes/stats.test.ts
git commit -m "feat(dashboard): add stats route and mount all API routes in Express app"
```
