# P1: 后端基础设施

## Task 1: 安装后端依赖

**Files:**
- Modify: `package.json`

**Step 1: 安装运行时依赖**

```bash
cd D:/repository/novel-writer-skills
npm install express pg open
```

**Step 2: 安装类型定义**

```bash
npm install -D @types/express @types/pg
```

**Step 3: 验证 package.json**

确认 dependencies 中新增了 `express`、`pg`、`open`，devDependencies 中新增了 `@types/express`、`@types/pg`。

**Step 4: 提交**

```bash
git add package.json package-lock.json
git commit -m "chore: add express, pg, open dependencies for dashboard"
```

---

## Task 2: 数据源类型定义

**Files:**
- Create: `src/server/types.ts`
- Test: `tests/unit/server/types.test.ts`

**Step 1: 写失败测试**

```typescript
// tests/unit/server/types.test.ts
import type {
  Story,
  StoryOverview,
  Volume,
  Chapter,
  Character,
  CharacterState,
  RelationshipGraph,
  RelationshipNode,
  RelationshipEdge,
  RelationshipEvent,
  TimelineEvent,
  PlotThread,
  Foreshadow,
  ForeshadowMatrix,
  ForeshadowCell,
  DashboardStats,
  DataSource,
} from '../../src/server/types.js';

describe('server types', () => {
  it('Story type has required fields', () => {
    const story: Story = { name: 'test', path: '/test' };
    expect(story.name).toBe('test');
  });

  it('StoryOverview type has required fields', () => {
    const overview: StoryOverview = {
      name: 'test',
      totalVolumes: 3,
      totalChapters: 30,
      totalWords: 100000,
      currentVolume: 2,
    };
    expect(overview.totalVolumes).toBe(3);
  });

  it('RelationshipGraph has nodes and edges', () => {
    const graph: RelationshipGraph = { nodes: [], edges: [] };
    expect(graph.nodes).toEqual([]);
  });

  it('ForeshadowMatrix has chapters and rows', () => {
    const matrix: ForeshadowMatrix = { chapters: [], rows: [] };
    expect(matrix.rows).toEqual([]);
  });

  it('DashboardStats has all summary fields', () => {
    const stats: DashboardStats = {
      totalWords: 0,
      totalChapters: 0,
      totalVolumes: 0,
      totalCharacters: 0,
      activePlotThreads: 0,
      unresolvedForeshadowing: 0,
      volumeStats: [],
    };
    expect(stats.totalWords).toBe(0);
  });
});
```

**Step 2: 运行测试确认失败**

```bash
node node_modules/jest-cli/bin/jest.js --config jest.config.cjs tests/unit/server/types.test.ts
```

Expected: FAIL（模块不存在）

**Step 3: 实现类型定义**

```typescript
// src/server/types.ts

/** 故事基础信息 */
export interface Story {
  name: string;
  path: string;
}

/** 故事总览 */
export interface StoryOverview {
  name: string;
  totalVolumes: number;
  totalChapters: number;
  totalWords: number;
  currentVolume: number;
}

/** 卷信息 */
export interface Volume {
  number: number;
  title: string;
  chapters: number;
  words: number;
  progress: number; // 0-100
}

/** 章节信息 */
export interface Chapter {
  globalNumber: number;
  volumeNumber: number;
  chapterInVolume: number;
  title: string;
  words: number;
  pov: string;
  participants: string[];
  hasSynopsis: boolean;
  hasContent: boolean;
}

/** 角色信息 */
export interface Character {
  name: string;
  aliases: string[];
  role: string; // 主角/配角/龙套
  firstVolume: number;
  firstChapter: number;
  cultivation: string;
  faction: string;
  status: string; // 活跃/已故/退场
}

/** 角色状态快照（按卷） */
export interface CharacterState {
  volume: number;
  cultivation: string;
  location: string;
  summary: string;
  lastChapter: number;
}

/** 关系图节点 */
export interface RelationshipNode {
  id: string;
  name: string;
  faction: string;
  role: string;
  appearances: number;
}

/** 关系图边 */
export interface RelationshipEdge {
  source: string;
  target: string;
  type: string; // 盟友/敌对/师徒/恋人等
  status: string;
  lastChapter: number;
}

/** 关系网络图 */
export interface RelationshipGraph {
  nodes: RelationshipNode[];
  edges: RelationshipEdge[];
}

/** 关系变迁事件 */
export interface RelationshipEvent {
  chapter: number;
  source: string;
  target: string;
  type: string;
  oldStatus: string;
  newStatus: string;
}

/** 时间线事件 */
export interface TimelineEvent {
  id: number;
  chapter: number;
  storyTime: string;
  location: string;
  description: string;
  tags: string[];
}

/** 情节线 */
export interface PlotThread {
  name: string;
  type: string;
  status: string; // active/paused/resolved
  description: string;
  keyEvents: string[];
}

/** 伏笔 */
export interface Foreshadow {
  code: string;
  description: string;
  plantedChapter: number;
  hintedChapters: number[];
  resolvedChapter: number | null;
  status: string; // planted/hinted/resolved
  importance: string;
}

/** 伏笔矩阵单元格 */
export interface ForeshadowCell {
  chapter: number;
  action: 'plant' | 'hint' | 'resolve' | null;
}

/** 伏笔矩阵 */
export interface ForeshadowMatrix {
  chapters: number[];
  rows: Array<{
    code: string;
    description: string;
    cells: ForeshadowCell[];
  }>;
}

/** 卷级统计 */
export interface VolumeStat {
  volume: number;
  title: string;
  words: number;
  chapters: number;
  progress: number;
}

/** 仪表盘聚合统计 */
export interface DashboardStats {
  totalWords: number;
  totalChapters: number;
  totalVolumes: number;
  totalCharacters: number;
  activePlotThreads: number;
  unresolvedForeshadowing: number;
  volumeStats: VolumeStat[];
}

/** 数据源抽象接口 */
export interface DataSource {
  getStories(): Promise<Story[]>;
  getOverview(story: string): Promise<StoryOverview>;
  getVolumes(story: string): Promise<Volume[]>;
  getChapters(story: string, vol?: number): Promise<Chapter[]>;
  getCharacters(story: string, vol?: number): Promise<Character[]>;
  getCharacterArc(story: string, name: string): Promise<CharacterState[]>;
  getRelationships(story: string, vol?: number): Promise<RelationshipGraph>;
  getRelationshipHistory(story: string): Promise<RelationshipEvent[]>;
  getTimeline(story: string, vol?: number): Promise<TimelineEvent[]>;
  getPlotThreads(story: string): Promise<PlotThread[]>;
  getForeshadowing(story: string): Promise<Foreshadow[]>;
  getForeshadowingMatrix(story: string): Promise<ForeshadowMatrix>;
  getDashboardStats(story: string): Promise<DashboardStats>;
}
```

**Step 4: 运行测试确认通过**

```bash
node node_modules/jest-cli/bin/jest.js --config jest.config.cjs tests/unit/server/types.test.ts
```

Expected: PASS

**Step 5: 提交**

```bash
git add src/server/types.ts tests/unit/server/types.test.ts
git commit -m "feat(dashboard): add DataSource interface and DTO types"
```

---

## Task 3: 数据源工厂

**Files:**
- Create: `src/server/datasource/index.ts`
- Test: `tests/unit/server/datasource/index.test.ts`

**Step 1: 写失败测试**

```typescript
// tests/unit/server/datasource/index.test.ts
import { createDataSource } from '../../../src/server/datasource/index.js';

// Mock fs-extra
jest.mock('fs-extra', () => ({
  readJson: jest.fn(),
}));

import fs from 'fs-extra';
const mockReadJson = fs.readJson as jest.MockedFunction<typeof fs.readJson>;

describe('createDataSource', () => {
  it('returns fs datasource when database.enabled is false', async () => {
    mockReadJson.mockResolvedValue({
      database: { enabled: false },
    });
    const ds = await createDataSource('/fake/project');
    expect(ds.type).toBe('fs');
  });

  it('returns fs datasource when config has no database field', async () => {
    mockReadJson.mockResolvedValue({});
    const ds = await createDataSource('/fake/project');
    expect(ds.type).toBe('fs');
  });

  it('returns db datasource when database.enabled is true', async () => {
    mockReadJson.mockResolvedValue({
      database: {
        enabled: true,
        host: '127.0.0.1',
        port: 5432,
        dbname: 'test',
        user: 'postgres',
        password: '',
        schema: 'novelws',
      },
    });
    // DB 连接会失败（测试环境无 DB），应降级到 fs
    const ds = await createDataSource('/fake/project');
    // 降级到 fs
    expect(ds.type).toBe('fs');
  });
});
```

**Step 2: 运行测试确认失败**

```bash
node node_modules/jest-cli/bin/jest.js --config jest.config.cjs tests/unit/server/datasource/index.test.ts
```

Expected: FAIL

**Step 3: 实现数据源工厂**

```typescript
// src/server/datasource/index.ts
import path from 'path';
import fs from 'fs-extra';
import type { DataSource } from '../types.js';
import { FsDataSource } from './fs.js';

export interface DataSourceWithType extends DataSource {
  type: 'fs' | 'db';
}

interface DbConfig {
  enabled: boolean;
  host: string;
  port: number;
  dbname: string;
  user: string;
  password: string;
  schema: string;
}

/**
 * 创建数据源实例
 * 读取项目 config.json，根据 database.enabled 选择 DB 或 FS 数据源
 * DB 连接失败时自动降级到 FS
 */
export async function createDataSource(projectRoot: string): Promise<DataSourceWithType> {
  const configPath = path.join(projectRoot, 'resources', 'config.json');

  let dbConfig: DbConfig | undefined;
  try {
    const config = await fs.readJson(configPath);
    dbConfig = config.database;
  } catch {
    // config.json 不存在或解析失败，使用 FS
  }

  if (dbConfig?.enabled) {
    try {
      const { DbDataSource } = await import('./db.js');
      const dbDs = new DbDataSource(dbConfig, projectRoot);
      await dbDs.connect();
      return Object.assign(dbDs, { type: 'db' as const });
    } catch (err) {
      console.warn('⚠️  数据库连接失败，降级到文件系统数据源:', (err as Error).message);
    }
  }

  const fsDs = new FsDataSource(projectRoot);
  return Object.assign(fsDs, { type: 'fs' as const });
}
```

**Step 4: 运行测试确认通过**

注意：此测试依赖 FsDataSource 存在，需要先创建一个最小桩文件：

```typescript
// src/server/datasource/fs.ts (临时桩)
import type { DataSource } from '../types.js';

export class FsDataSource implements DataSource {
  constructor(public projectRoot: string) {}
  async getStories() { return []; }
  async getOverview() { return { name: '', totalVolumes: 0, totalChapters: 0, totalWords: 0, currentVolume: 0 }; }
  async getVolumes() { return []; }
  async getChapters() { return []; }
  async getCharacters() { return []; }
  async getCharacterArc() { return []; }
  async getRelationships() { return { nodes: [], edges: [] }; }
  async getRelationshipHistory() { return []; }
  async getTimeline() { return []; }
  async getPlotThreads() { return []; }
  async getForeshadowing() { return []; }
  async getForeshadowingMatrix() { return { chapters: [], rows: [] }; }
  async getDashboardStats() { return { totalWords: 0, totalChapters: 0, totalVolumes: 0, totalCharacters: 0, activePlotThreads: 0, unresolvedForeshadowing: 0, volumeStats: [] }; }
}
```

```bash
node node_modules/jest-cli/bin/jest.js --config jest.config.cjs tests/unit/server/datasource/index.test.ts
```

Expected: PASS

**Step 5: 提交**

```bash
git add src/server/datasource/index.ts src/server/datasource/fs.ts tests/unit/server/datasource/index.test.ts
git commit -m "feat(dashboard): add datasource factory with auto-detection and fallback"
```

---

## Task 4: Express 服务器骨架

**Files:**
- Create: `src/server/index.ts`
- Test: `tests/unit/server/index.test.ts`

**Step 1: 写失败测试**

```typescript
// tests/unit/server/index.test.ts
import { createApp } from '../../src/server/index.js';

// Mock express
jest.mock('express', () => {
  const mockRouter = {
    get: jest.fn().mockReturnThis(),
    use: jest.fn().mockReturnThis(),
  };
  const mockApp = {
    use: jest.fn().mockReturnThis(),
    get: jest.fn().mockReturnThis(),
    listen: jest.fn((port: number, cb: () => void) => {
      cb();
      return { close: jest.fn() };
    }),
  };
  const express = jest.fn(() => mockApp);
  (express as any).static = jest.fn();
  (express as any).json = jest.fn(() => jest.fn());
  (express as any).Router = jest.fn(() => mockRouter);
  return { __esModule: true, default: express };
});

describe('createApp', () => {
  it('returns an express app with use and listen methods', () => {
    const app = createApp('/fake/project');
    expect(app).toBeDefined();
    expect(typeof app.listen).toBe('function');
  });
});
```

**Step 2: 运行测试确认失败**

```bash
node node_modules/jest-cli/bin/jest.js --config jest.config.cjs tests/unit/server/index.test.ts
```

Expected: FAIL

**Step 3: 实现 Express 服务器**

```typescript
// src/server/index.ts
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * 创建 Express 应用
 * @param projectRoot 用户小说项目的根目录
 */
export function createApp(projectRoot: string) {
  const app = express();

  // JSON 解析
  app.use(express.json());

  // CORS（开发模式下 Vite dev server 需要）
  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
  });

  // 健康检查
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', project: projectRoot });
  });

  // 静态文件服务（生产模式）
  const dashboardDir = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '..', 'dashboard'
  );
  app.use(express.static(dashboardDir));

  // SPA fallback：非 /api 路由返回 index.html
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(dashboardDir, 'index.html'));
  });

  return app;
}

/**
 * 启动服务器
 */
export async function startServer(projectRoot: string, port: number) {
  const app = createApp(projectRoot);
  return new Promise<ReturnType<typeof app.listen>>((resolve) => {
    const server = app.listen(port, () => {
      console.log(`🚀 Dashboard 已启动: http://localhost:${port}`);
      resolve(server);
    });
  });
}
```

**Step 4: 运行测试确认通过**

```bash
node node_modules/jest-cli/bin/jest.js --config jest.config.cjs tests/unit/server/index.test.ts
```

Expected: PASS

**Step 5: 提交**

```bash
git add src/server/index.ts tests/unit/server/index.test.ts
git commit -m "feat(dashboard): add Express server skeleton with health check and SPA fallback"
```

---

## Task 5: dashboard 子命令

**Files:**
- Create: `src/commands/dashboard.ts`
- Modify: `src/cli.ts`
- Test: `tests/unit/commands/dashboard.test.ts`

**Step 1: 写失败测试**

```typescript
// tests/unit/commands/dashboard.test.ts
import { Command } from '@commander-js/extra-typings';
import { registerDashboardCommand } from '../../src/commands/dashboard.js';

describe('registerDashboardCommand', () => {
  it('registers dashboard command on program', () => {
    const program = new Command();
    registerDashboardCommand(program);
    const cmd = program.commands.find(c => c.name() === 'dashboard');
    expect(cmd).toBeDefined();
    expect(cmd!.description()).toContain('仪表盘');
  });

  it('has --port option with default 3210', () => {
    const program = new Command();
    registerDashboardCommand(program);
    const cmd = program.commands.find(c => c.name() === 'dashboard');
    const portOpt = cmd!.options.find(o => o.long === '--port');
    expect(portOpt).toBeDefined();
    expect(portOpt!.defaultValue).toBe('3210');
  });

  it('has --dev flag', () => {
    const program = new Command();
    registerDashboardCommand(program);
    const cmd = program.commands.find(c => c.name() === 'dashboard');
    const devOpt = cmd!.options.find(o => o.long === '--dev');
    expect(devOpt).toBeDefined();
  });

  it('has --no-open flag', () => {
    const program = new Command();
    registerDashboardCommand(program);
    const cmd = program.commands.find(c => c.name() === 'dashboard');
    const noOpenOpt = cmd!.options.find(o => o.long === '--no-open');
    expect(noOpenOpt).toBeDefined();
  });
});
```

**Step 2: 运行测试确认失败**

```bash
node node_modules/jest-cli/bin/jest.js --config jest.config.cjs tests/unit/commands/dashboard.test.ts
```

Expected: FAIL

**Step 3: 实现 dashboard 命令**

```typescript
// src/commands/dashboard.ts
import { Command } from '@commander-js/extra-typings';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';

export function registerDashboardCommand(program: Command): void {
  program
    .command('dashboard')
    .description('启动可视化创作仪表盘')
    .option('--port <port>', '服务器端口', '3210')
    .option('--dev', '开发模式（仅启动 API 服务器）')
    .option('--no-open', '不自动打开浏览器')
    .action(async (options) => {
      const projectRoot = process.cwd();

      // 检查是否在 novelws 项目中
      const configPath = path.join(projectRoot, 'resources', 'config.json');
      if (!await fs.pathExists(configPath)) {
        console.error(chalk.red('❌ 当前目录不是 novelws 项目（未找到 resources/config.json）'));
        process.exit(1);
      }

      const port = parseInt(options.port, 10);

      console.log(chalk.cyan('📊 正在启动 Dashboard...'));
      console.log(chalk.gray(`   项目: ${projectRoot}`));
      console.log(chalk.gray(`   端口: ${port}`));
      console.log(chalk.gray(`   模式: ${options.dev ? '开发' : '生产'}`));

      try {
        const { startServer } = await import('../server/index.js');
        await startServer(projectRoot, port);

        if (options.open !== false && !options.dev) {
          const { default: open } = await import('open');
          await open(`http://localhost:${port}`);
        }

        if (options.dev) {
          console.log(chalk.yellow('\n💡 开发模式：请手动启动前端开发服务器'));
          console.log(chalk.white('   cd dashboard && npm run dev'));
        }
      } catch (error) {
        console.error(chalk.red('❌ Dashboard 启动失败:'), error);
        process.exit(1);
      }
    });
}
```

**Step 4: 修改 cli.ts 注册命令**

在 `src/cli.ts` 中添加：

```typescript
// 在 import 区域添加
import { registerDashboardCommand } from './commands/dashboard.js';

// 在注册子命令区域添加
registerDashboardCommand(program);

// 在帮助信息中添加
console.log('  $ novelws dashboard          # 启动可视化仪表盘');
```

**Step 5: 运行测试确认通过**

```bash
node node_modules/jest-cli/bin/jest.js --config jest.config.cjs tests/unit/commands/dashboard.test.ts
```

Expected: PASS

**Step 6: 提交**

```bash
git add src/commands/dashboard.ts src/cli.ts tests/unit/commands/dashboard.test.ts
git commit -m "feat(dashboard): add dashboard CLI subcommand with --port, --dev, --no-open options"
```
