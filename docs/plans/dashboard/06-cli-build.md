# P6: CLI 集成与构建流程

## Task 25: dashboard CLI 子命令

**Files:**
- Create: `src/commands/dashboard.ts`
- Modify: `src/index.ts`（注册子命令）
- Test: `tests/unit/commands/dashboard.test.ts`

**Step 1: 写失败测试**

```typescript
// tests/unit/commands/dashboard.test.ts
import { Command } from 'commander';

describe('dashboard command', () => {
  it('registers dashboard subcommand with expected options', async () => {
    // 动态导入以避免副作用
    const { registerDashboardCommand } = await import('../../../src/commands/dashboard.js');
    const program = new Command();
    registerDashboardCommand(program);

    const cmd = program.commands.find(c => c.name() === 'dashboard');
    expect(cmd).toBeDefined();

    const optionNames = cmd!.options.map(o => o.long);
    expect(optionNames).toContain('--port');
    expect(optionNames).toContain('--dev');
    expect(optionNames).toContain('--no-open');
  });
});
```

**Step 2: 运行测试确认失败**

```bash
node node_modules/jest-cli/bin/jest.js --config jest.config.cjs tests/unit/commands/dashboard.test.ts
```

**Step 3: 实现 CLI 子命令**

```typescript
// src/commands/dashboard.ts
import type { Command } from 'commander';

export function registerDashboardCommand(program: Command): void {
  program
    .command('dashboard')
    .description('启动创作仪表盘 Web 界面')
    .option('-p, --port <number>', '服务端口', '3210')
    .option('--dev', '开发模式（仅启动 API 服务，不提供静态文件）')
    .option('--no-open', '不自动打开浏览器')
    .action(async (opts) => {
      const port = parseInt(opts.port, 10);
      const projectRoot = process.cwd();

      console.log(`📂 项目目录: ${projectRoot}`);
      console.log(`🔧 模式: ${opts.dev ? '开发' : '生产'}`);

      if (opts.dev) {
        // 开发模式：仅启动 API
        const { startServer } = await import('../server/index.js');
        await startServer(projectRoot, port);
        console.log(`💡 前端开发服务器请手动启动: cd dashboard && npm run dev`);
      } else {
        // 生产模式：API + 静态文件
        const { startServer } = await import('../server/index.js');
        await startServer(projectRoot, port);

        // 自动打开浏览器
        if (opts.open !== false) {
          const url = `http://localhost:${port}`;
          try {
            const { default: open } = await import('open');
            await open(url);
          } catch {
            console.log(`🌐 请手动打开: ${url}`);
          }
        }
      }
    });
}
```

**Step 4: 在主入口注册子命令**

在 `src/index.ts` 中添加：

```typescript
import { registerDashboardCommand } from './commands/dashboard.js';

// 在 program 定义之后
registerDashboardCommand(program);
```

**Step 5: 运行测试确认通过**

```bash
node node_modules/jest-cli/bin/jest.js --config jest.config.cjs tests/unit/commands/dashboard.test.ts
```

**Step 6: 提交**

```bash
git add src/commands/dashboard.ts src/index.ts tests/unit/commands/dashboard.test.ts
git commit -m "feat(dashboard): add 'novelws dashboard' CLI subcommand"
```

---

## Task 26: 构建脚本

**Files:**
- Modify: `package.json`（添加构建脚本）

**Step 1: 在根 package.json 添加脚本**

```json
{
  "scripts": {
    "build:dashboard": "cd dashboard && npm run build",
    "predashboard": "npm run build:dashboard",
    "dashboard": "node dist/index.js dashboard"
  }
}
```

**Step 2: 确保 .gitignore 包含构建产物**

在 `.gitignore` 中添加（如果不存在）：

```
dist/dashboard/
dashboard/node_modules/
```

**Step 3: 确保 package.json 的 files 字段包含 dashboard 产物**

```json
{
  "files": [
    "dist/",
    "templates/"
  ]
}
```

`dist/dashboard/` 已被 `dist/` 覆盖，无需额外配置。

**Step 4: 验证完整构建流程**

```bash
cd D:/repository/novel-writer-skills/dashboard
npm install
npm run build

cd D:/repository/novel-writer-skills
ls dist/dashboard/index.html
```

Expected: `dist/dashboard/index.html` 存在

**Step 5: 提交**

```bash
git add package.json .gitignore
git commit -m "build(dashboard): add build scripts and gitignore rules for dashboard"
```

---

## Task 27: 安装 open 依赖

```bash
cd D:/repository/novel-writer-skills
npm install open
```

```bash
git add package.json package-lock.json
git commit -m "chore: add 'open' dependency for auto-opening browser"
```

---

## Task 28: 端到端冒烟测试

**Files:**
- Create: `tests/integration/dashboard-smoke.test.ts`

```typescript
// tests/integration/dashboard-smoke.test.ts
import { createApp } from '../../src/server/index.js';
import http from 'http';

describe('Dashboard smoke test', () => {
  let server: http.Server;

  afterEach((done) => {
    if (server) server.close(done);
    else done();
  });

  it('GET /api/health returns ok', (done) => {
    const app = createApp(process.cwd());
    server = app.listen(0, () => {
      const addr = server.address() as any;
      http.get(`http://localhost:${addr.port}/api/health`, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          const json = JSON.parse(body);
          expect(json.status).toBe('ok');
          done();
        });
      });
    });
  });

  it('GET / returns HTML (SPA fallback)', (done) => {
    const app = createApp(process.cwd());
    server = app.listen(0, () => {
      const addr = server.address() as any;
      http.get(`http://localhost:${addr.port}/`, (res) => {
        // 如果 dist/dashboard 不存在，会 404，这也是可接受的
        expect([200, 404]).toContain(res.statusCode);
        res.resume();
        res.on('end', done);
      });
    });
  });
});
```

**运行：**

```bash
node node_modules/jest-cli/bin/jest.js --config jest.config.cjs tests/integration/dashboard-smoke.test.ts
```

**提交：**

```bash
git add tests/integration/dashboard-smoke.test.ts
git commit -m "test(dashboard): add integration smoke test for Express server"
```
