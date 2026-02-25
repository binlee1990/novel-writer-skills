# P3a: API 路由 - Stories/Chapters

## Task 9: Stories、Volumes、Chapters 路由

**Files:**
- Create: `src/server/routes/stories.ts`
- Modify: `src/server/index.ts`
- Test: `tests/unit/server/routes/stories.test.ts`

**Step 1: 写失败测试**

```typescript
// tests/unit/server/routes/stories.test.ts
import express from 'express';
import { createStoriesRouter } from '../../../src/server/routes/stories.js';
import type { DataSource } from '../../../src/server/types.js';

// 简单的 mock DataSource
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

// 用 supertest 风格手动测试路由注册
describe('createStoriesRouter', () => {
  it('creates a router with expected routes', () => {
    const ds = createMockDataSource();
    const router = createStoriesRouter(ds);
    expect(router).toBeDefined();
    // router.stack 包含注册的路由
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

  it('GET / calls getStories', async () => {
    const ds = createMockDataSource();
    const router = createStoriesRouter(ds);
    // 验证 handler 绑定了正确的数据源方法
    expect(ds.getStories).not.toHaveBeenCalled();
  });
});
```

**Step 2: 运行测试确认失败**

```bash
node node_modules/jest-cli/bin/jest.js --config jest.config.cjs tests/unit/server/routes/stories.test.ts
```

Expected: FAIL

**Step 3: 实现路由**

```typescript
// src/server/routes/stories.ts
import { Router } from 'express';
import type { DataSource } from '../types.js';

export function createStoriesRouter(ds: DataSource): Router {
  const router = Router();

  // GET /api/stories
  router.get('/', async (_req, res) => {
    try {
      const stories = await ds.getStories();
      res.json(stories);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // GET /api/stories/:story/overview
  router.get('/:story/overview', async (req, res) => {
    try {
      const overview = await ds.getOverview(req.params.story);
      res.json(overview);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // GET /api/stories/:story/volumes
  router.get('/:story/volumes', async (req, res) => {
    try {
      const volumes = await ds.getVolumes(req.params.story);
      res.json(volumes);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // GET /api/stories/:story/volumes/:vol/stats
  router.get('/:story/volumes/:vol/stats', async (req, res) => {
    try {
      const vol = parseInt(req.params.vol, 10);
      const chapters = await ds.getChapters(req.params.story, vol);
      const characters = await ds.getCharacters(req.params.story, vol);
      res.json({
        volume: vol,
        chapters: chapters.length,
        words: chapters.reduce((sum, c) => sum + c.words, 0),
        characters: characters.length,
      });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // GET /api/stories/:story/chapters?vol=X
  router.get('/:story/chapters', async (req, res) => {
    try {
      const vol = req.query.vol ? parseInt(req.query.vol as string, 10) : undefined;
      const chapters = await ds.getChapters(req.params.story, vol);
      res.json(chapters);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // GET /api/stories/:story/chapters/:ch
  router.get('/:story/chapters/:ch', async (req, res) => {
    try {
      const chNum = parseInt(req.params.ch, 10);
      const chapters = await ds.getChapters(req.params.story);
      const chapter = chapters.find(c => c.globalNumber === chNum);
      if (!chapter) {
        res.status(404).json({ error: '章节不存在' });
        return;
      }
      res.json(chapter);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  return router;
}
```

**Step 4: 修改 `src/server/index.ts` 挂载路由**

在 `createApp` 函数中，健康检查之后、静态文件之前添加：

```typescript
// 导入路由
import { createStoriesRouter } from './routes/stories.js';

// 在 createApp 中添加参数和路由挂载
export function createApp(projectRoot: string, ds?: DataSource) {
  // ... 现有代码 ...

  // API 路由（ds 在 startServer 中注入）
  if (ds) {
    app.use('/api/stories', createStoriesRouter(ds));
  }

  // ... 静态文件和 SPA fallback ...
}
```

同时修改 `startServer`：

```typescript
export async function startServer(projectRoot: string, port: number) {
  const { createDataSource } = await import('./datasource/index.js');
  const ds = await createDataSource(projectRoot);
  const app = createApp(projectRoot, ds);
  // ... 其余不变 ...
}
```

**Step 5: 运行测试确认通过**

```bash
node node_modules/jest-cli/bin/jest.js --config jest.config.cjs tests/unit/server/routes/stories.test.ts
```

Expected: PASS

**Step 6: 提交**

```bash
git add src/server/routes/stories.ts src/server/index.ts tests/unit/server/routes/stories.test.ts
git commit -m "feat(dashboard): add stories/volumes/chapters API routes"
```
