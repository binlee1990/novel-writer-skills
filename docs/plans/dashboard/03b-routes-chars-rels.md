# P3b: API 路由 - Characters/Relationships

## Task 10: Characters 路由

**Files:**
- Create: `src/server/routes/characters.ts`
- Test: `tests/unit/server/routes/characters.test.ts`

**Step 1: 写失败测试**

```typescript
// tests/unit/server/routes/characters.test.ts
import { createCharactersRouter } from '../../../src/server/routes/characters.js';
import type { DataSource } from '../../../src/server/types.js';

function createMockDs(): Partial<DataSource> {
  return {
    getCharacters: jest.fn().mockResolvedValue([
      { name: '张三', aliases: ['三哥'], role: '主角', firstVolume: 1, firstChapter: 1, cultivation: '筑基', faction: '正道', status: '活跃' },
    ]),
    getCharacterArc: jest.fn().mockResolvedValue([
      { volume: 1, cultivation: '筑基', location: '青云山', summary: '入门弟子', lastChapter: 10 },
      { volume: 2, cultivation: '金丹', location: '天都城', summary: '突破金丹', lastChapter: 20 },
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
```

**Step 2: 运行测试确认失败**

```bash
node node_modules/jest-cli/bin/jest.js --config jest.config.cjs tests/unit/server/routes/characters.test.ts
```

**Step 3: 实现路由**

```typescript
// src/server/routes/characters.ts
import { Router } from 'express';
import type { DataSource } from '../types.js';

export function createCharactersRouter(ds: DataSource): Router {
  const router = Router({ mergeParams: true });

  // GET /api/stories/:story/characters?vol=X
  router.get('/', async (req, res) => {
    try {
      const vol = req.query.vol ? parseInt(req.query.vol as string, 10) : undefined;
      const characters = await ds.getCharacters(req.params.story, vol);
      res.json(characters);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // GET /api/stories/:story/characters/:name/arc
  router.get('/:name/arc', async (req, res) => {
    try {
      const arc = await ds.getCharacterArc(req.params.story, decodeURIComponent(req.params.name));
      res.json(arc);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  return router;
}
```

**Step 4: 运行测试，提交**

```bash
node node_modules/jest-cli/bin/jest.js --config jest.config.cjs tests/unit/server/routes/characters.test.ts
git add src/server/routes/characters.ts tests/unit/server/routes/characters.test.ts
git commit -m "feat(dashboard): add characters API routes"
```

---

## Task 11: Relationships 路由

**Files:**
- Create: `src/server/routes/relationships.ts`
- Test: `tests/unit/server/routes/relationships.test.ts`

**Step 1: 写失败测试**

```typescript
// tests/unit/server/routes/relationships.test.ts
import { createRelationshipsRouter } from '../../../src/server/routes/relationships.js';
import type { DataSource } from '../../../src/server/types.js';

function createMockDs(): Partial<DataSource> {
  return {
    getRelationships: jest.fn().mockResolvedValue({
      nodes: [
        { id: '张三', name: '张三', faction: '正道', role: '主角', appearances: 20 },
      ],
      edges: [
        { source: '张三', target: '李四', type: '盟友', status: '稳定', lastChapter: 5 },
      ],
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
```

**Step 2: 运行测试确认失败**

```bash
node node_modules/jest-cli/bin/jest.js --config jest.config.cjs tests/unit/server/routes/relationships.test.ts
```

**Step 3: 实现路由**

```typescript
// src/server/routes/relationships.ts
import { Router } from 'express';
import type { DataSource } from '../types.js';

export function createRelationshipsRouter(ds: DataSource): Router {
  const router = Router({ mergeParams: true });

  // GET /api/stories/:story/relationships?vol=X
  router.get('/', async (req, res) => {
    try {
      const vol = req.query.vol ? parseInt(req.query.vol as string, 10) : undefined;
      const graph = await ds.getRelationships(req.params.story, vol);
      res.json(graph);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // GET /api/stories/:story/relationships/history
  router.get('/history', async (req, res) => {
    try {
      const history = await ds.getRelationshipHistory(req.params.story);
      res.json(history);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  return router;
}
```

**Step 4: 运行测试，提交**

```bash
node node_modules/jest-cli/bin/jest.js --config jest.config.cjs tests/unit/server/routes/relationships.test.ts
git add src/server/routes/relationships.ts tests/unit/server/routes/relationships.test.ts
git commit -m "feat(dashboard): add relationships API routes"
```
