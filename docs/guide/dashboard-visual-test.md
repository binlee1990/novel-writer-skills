# Dashboard 可视化测试指南

使用 Playwright MCP 拦截 API 请求并注入 mock 数据，在浏览器中验证 Dashboard 页面渲染效果。

## 前置条件

1. TypeScript 已编译：`npm run build`
2. Dashboard 前端已构建：`cd dashboard && npx vite build`
3. Playwright MCP 已配置

## 步骤

### 1. 创建临时测试项目并启动后端

```bash
# 创建临时项目（提供 resources/config.json）
cd /tmp && node "<项目根>/dist/cli.js" init test-dashboard --no-git

# 在测试项目目录启动 API 服务器
cd /tmp/test-dashboard && node "<项目根>/dist/cli.js" dashboard --no-open --port 3210
```

### 2. 启动 Vite Dev Server

```bash
cd <项目根>/dashboard && npx vite --port 5173
```

Vite 会将 `/api` 请求代理到 `http://localhost:3210`（见 `vite.config.ts`）。

### 3. Playwright 注入 Mock 数据并访问页面

使用 `browser_run_code` 工具执行以下脚本：

```js
async (page) => {
  // ===== Mock Stories =====
  await page.route('**/api/stories', route => {
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify([{ name: 'test-novel', path: '/tmp/test-novel' }])
    });
  });

  // ===== Mock 主角概览 =====
  await page.route('**/api/stories/test-novel/protagonist/overview', route => {
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        currentLevel: '段1·炼气前期',
        currentProgress: 37.8,
        totalSkills: 11,
        activeSkills: 11,
        totalItems: 15,
        heldItems: 10
      })
    });
  });

  // ===== Mock 技能列表 =====
  await page.route('**/api/stories/test-novel/protagonist/skills', route => {
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify([
        { name: '账本脑', category: '账本脑', level: '入门', description: '数据化思维，信息分类归档', acquiredChapter: 1, useCount: 42, status: 'active' },
        { name: '分解功能', category: '账本脑', level: '入门', description: '铜盘分解灵材', acquiredChapter: 40, useCount: 15, status: 'active' },
        { name: 'P0轮回仓应急', category: '账本脑', level: '入门', description: '72小时冷却，副本内有效', acquiredChapter: 108, useCount: 3, status: 'active' },
        { name: '灵气感知', category: '被动', level: '入门', description: '灵气初步感知能力', acquiredChapter: 49, useCount: 0, status: 'active' },
        { name: '灵气内敛', category: '被动', level: '入门', description: '压制灵气外泄，5分钟持续', acquiredChapter: 129, useCount: 8, status: 'active' },
        { name: '伪装术', category: '被动', level: '固化', description: '禁忌乡伪装术固化为永久技能', acquiredChapter: 139, useCount: 20, status: 'active' },
        { name: '定身符', category: '符', level: '入门', description: '3秒静止效果', acquiredChapter: 68, useCount: 12, status: 'active' },
        { name: '假身符', category: '符', level: '入门', description: '8秒维持时间', acquiredChapter: 178, useCount: 6, status: 'active' },
        { name: 'Build雏形', category: '符', level: '入门', description: '陷阱链+符毒联动+镜面系统+假身符四系统联动', acquiredChapter: 240, useCount: 2, status: 'active' },
        { name: '镜面系统', category: '阵', level: '入门', description: '镜面反射间接观察，规避视线类铁律', acquiredChapter: 215, useCount: 10, status: 'active' },
        { name: '镜杀阵', category: '阵', level: '入门', description: '用镜片反射诅咒实体目光回自身', acquiredChapter: 262, useCount: 1, status: 'active' },
      ])
    });
  });

  // ===== Mock 道具背包 =====
  await page.route('**/api/stories/test-novel/protagonist/inventory', route => {
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify([
        { name: '短刃', type: '装备', quantity: 1, quality: '普通', description: '来自前探索者补给点', acquiredChapter: 30, status: 'held' },
        { name: '铁丝绊索', type: '工具', quantity: 1, quality: '普通', description: '陷阱材料', acquiredChapter: 30, status: 'held' },
        { name: '定身符纸成品', type: '消耗品', quantity: 6, quality: '普通', description: '3秒静止效果', acquiredChapter: 68, status: 'held' },
        { name: '假身符纸成品', type: '消耗品', quantity: 2, quality: '普通', description: '假身符成品', acquiredChapter: 181, status: 'held' },
        { name: '阴气结晶', type: '材料', quantity: 1, quality: '稀有', description: '禁忌乡副本掉落', acquiredChapter: 139, status: 'held' },
        { name: '灵魂印记碎片', type: '材料', quantity: 3, quality: '稀有', description: '副本掉落累计', acquiredChapter: 268, status: 'held' },
        { name: '灵墨', type: '材料', quantity: 1, quality: '普通', description: '画符用灵墨', acquiredChapter: 165, status: 'held' },
        { name: '空白符纸', type: '材料', quantity: 10, quality: '普通', description: '画符用空白符纸', acquiredChapter: 68, status: 'held' },
        { name: '镜面符材', type: '材料', quantity: 5, quality: '稀有', description: '可制作反射观察符', acquiredChapter: 268, status: 'held' },
        { name: '诅咒封存体（林安）', type: '材料', quantity: 1, quality: '古纪级', description: '林安灵魂封存在轮回盘中', acquiredChapter: 268, status: 'held' },
        { name: '迷香', type: '消耗品', quantity: 1, quality: '普通', description: '来自前探索者补给点', acquiredChapter: 30, status: 'consumed' },
        { name: '兽血', type: '材料', quantity: 1, quality: '普通', description: '来自前探索者补给点', acquiredChapter: 30, status: 'consumed' },
        { name: '灵气结晶', type: '材料', quantity: 3, quality: '普通', description: '蜂巢副本掉落', acquiredChapter: 40, status: 'consumed' },
        { name: '灵气压制符', type: '消耗品', quantity: 1, quality: '精良', description: '压制灵气波动约六小时', acquiredChapter: 191, status: 'consumed' },
      ])
    });
  });

  // ===== Mock 修炼曲线 =====
  await page.route('**/api/stories/test-novel/protagonist/cultivation', route => {
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify([
        { chapter: 1, level: '段0', progressPct: 0, breakthroughType: 'major', detail: '铜盘觉醒' },
        { chapter: 49, level: '段0', progressPct: 80, breakthroughType: null, detail: '首次主动感知灵气' },
        { chapter: 68, level: '段1·炼气前期', progressPct: 0, breakthroughType: 'major', detail: '突破段1' },
        { chapter: 154, level: '段1·炼气前期', progressPct: 25, breakthroughType: null, detail: '段1修炼进度达25%' },
        { chapter: 182, level: '段1·炼气前期', progressPct: 30, breakthroughType: null, detail: '画符训练' },
        { chapter: 272, level: '段1·炼气前期', progressPct: 35, breakthroughType: null, detail: '超标副本高压环境' },
        { chapter: 300, level: '段1·炼气前期', progressPct: 37.8, breakthroughType: null, detail: '卷3完结状态' },
      ])
    });
  });

  await page.goto('http://localhost:5173/protagonist');
  await page.waitForTimeout(2000);
  return 'Mock data injected, page loaded';
}
```

### 4. 截图验证

```
browser_take_screenshot({ fullPage: true, filename: 'protagonist-test.png' })
```

### 5. 验证其他页面

同样的方式可以 mock 其他 API 端点来测试仪表盘、角色管理、关系网络等页面。只需替换 `page.route` 中的 URL 和返回数据即可。

## Mock 数据结构参考

| 端点 | 类型定义 |
|------|----------|
| `/api/stories/:story/protagonist/overview` | `ProtagonistOverview` |
| `/api/stories/:story/protagonist/skills` | `ProtagonistSkill[]` |
| `/api/stories/:story/protagonist/inventory` | `ProtagonistInventory[]` |
| `/api/stories/:story/protagonist/cultivation` | `CultivationCurve[]` |

类型定义见 `src/server/types.ts`。

## 清理

测试完成后关闭 Vite dev server 和 API 服务器，删除临时项目：

```bash
rm -rf /tmp/test-dashboard
```
