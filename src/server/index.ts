import express from 'express';
import path from 'path';

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
  // 使用 __dirname 兼容 CJS/ESM
  const dashboardDir = path.resolve(__dirname, '..', 'dashboard');
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
  const app = createApp(projectRoot);
  return new Promise<ReturnType<typeof app.listen>>((resolve) => {
    const server = app.listen(port, () => {
      console.log(`🚀 Dashboard 已启动: http://localhost:${port}`);
      resolve(server);
    });
  });
}
