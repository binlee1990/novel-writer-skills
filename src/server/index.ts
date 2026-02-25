import express from 'express';
import path from 'path';
import type { DataSource } from './types.js';
import { createStoriesRouter } from './routes/stories.js';
import { createCharactersRouter } from './routes/characters.js';
import { createRelationshipsRouter } from './routes/relationships.js';
import { createTimelineRouter } from './routes/timeline.js';
import { createPlotsRouter } from './routes/plots.js';
import { createStatsRouter } from './routes/stats.js';
import { createProtagonistRouter } from './routes/protagonist.js';

/**
 * 创建 Express 应用
 * @param projectRoot 用户小说项目的根目录
 * @param ds 可选数据源，由 startServer 注入
 */
export function createApp(projectRoot: string, ds?: DataSource) {
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

  // API 路由
  if (ds) {
    app.use('/api/stories', createStoriesRouter(ds));
    app.use('/api/stories/:story/characters', createCharactersRouter(ds));
    app.use('/api/stories/:story/relationships', createRelationshipsRouter(ds));
    app.use('/api/stories/:story/timeline', createTimelineRouter(ds));
    app.use('/api/stories/:story', createPlotsRouter(ds));
    app.use('/api/stories/:story/protagonist', createProtagonistRouter(ds));
    app.use('/api/stats', createStatsRouter(ds));
  }

  // 静态文件服务（生产模式）
  // 在 CJS 环境 (Jest/tsc 编译后) __dirname 可用
  // 在 ESM 环境 (tsx 直接运行) 需要从 dashboardDir 参数或 dist 目录推断
  const dashboardDir = path.resolve(
    typeof __dirname !== 'undefined' ? __dirname : process.cwd(),
    typeof __dirname !== 'undefined' ? path.join('..', 'dashboard') : path.join('dist', 'dashboard')
  );
  app.use(express.static(dashboardDir));

  // SPA fallback：非 /api 路由返回 index.html
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(dashboardDir, 'index.html'), (err) => {
      if (err) {
        res.status(404).json({ error: 'Dashboard not built yet' });
      }
    });
  });

  return app;
}

/**
 * 启动服务器
 */
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
