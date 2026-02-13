# Phase 1: JSON 分片基础设施 - 详细实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 建立分卷存储结构、全局摘要模板文件，扩展 init/upgrade 命令支持大型项目模式

**Architecture:** 在现有 `spec/tracking/` 下新增 `summary/` 和 `volumes/` 目录层级，模板文件提供初始结构，init 命令支持 `--scale large` 创建分片目录，upgrade 命令检测文件大小并提示迁移

**Tech Stack:** TypeScript, fs-extra, Jest

---

### Task 1: 创建全局摘要 JSON 模板文件

**Files:**
- Create: `templates/tracking/summary/characters-summary.json`
- Create: `templates/tracking/summary/plot-summary.json`
- Create: `templates/tracking/summary/timeline-summary.json`
- Create: `templates/tracking/summary/volume-summaries.json`

**Step 1: 创建 characters-summary.json**

```json
{
  "version": 1,
  "active": [],
  "archived": [],
  "totalCount": 0,
  "activeCount": 0
}
```

说明：`active` 数组中每个元素结构为 `{ "name": "", "role": "protagonist|supporting|minor", "currentVolume": 1, "lastChapter": 0, "arcPhase": "" }`，`archived` 数组中每个元素结构为 `{ "name": "", "role": "", "exitVolume": 0, "exitChapter": 0, "reason": "" }`

**Step 2: 创建 plot-summary.json**

```json
{
  "version": 1,
  "mainPlot": {
    "name": "",
    "status": "active",
    "currentStage": "",
    "completionPercent": 0
  },
  "activeSubplots": [],
  "unresolvedForeshadowing": [],
  "resolvedCount": 0,
  "totalPlanted": 0
}
```

**Step 3: 创建 timeline-summary.json**

```json
{
  "version": 1,
  "storyTimeStart": "",
  "storyTimeCurrent": "",
  "totalEvents": 0,
  "keyMilestones": [],
  "activeAnomalies": 0
}
```

**Step 4: 创建 volume-summaries.json**

```json
{
  "version": 1,
  "currentVolume": "vol-01",
  "volumes": []
}
```

说明：`volumes` 数组中每个元素结构为 `{ "id": "vol-01", "title": "", "chapters": "1-100", "wordCount": 0, "keyEvents": [], "unresolvedPlots": [], "newCharacters": 0, "exitedCharacters": 0 }`

**Step 5: 提交**

```powershell
git add templates/tracking/summary/
git commit -m "feat: add global summary JSON templates for volume sharding"
```

---

### Task 2: 扩展 config.ts 路径常量

**Files:**
- Modify: `src/core/config.ts:52-66` (DIRS 常量)
- Modify: `src/core/config.ts:114-134` (getProjectPaths)
- Modify: `src/core/config.ts:139-152` (getTemplateSourcePaths)
- Test: `tests/unit/core/config.test.ts`

**Step 1: 写失败测试**

在 `tests/unit/core/config.test.ts` 的 `getProjectPaths()` describe 块中添加：

```typescript
it('should include trackingSummary path', () => {
  const paths = getProjectPaths(projectRoot);
  expect(paths.trackingSummary).toBe(path.join(projectRoot, 'spec', 'tracking', 'summary'));
});

it('should include trackingVolumes path', () => {
  const paths = getProjectPaths(projectRoot);
  expect(paths.trackingVolumes).toBe(path.join(projectRoot, 'spec', 'tracking', 'volumes'));
});
```

在 `getTemplateSourcePaths()` describe 块中添加：

```typescript
it('should include trackingSummary template path', () => {
  const templates = getTemplateSourcePaths();
  const templatesDir = getTemplatesDir();
  expect(templates.trackingSummary).toBe(path.join(templatesDir, 'tracking', 'summary'));
});
```

**Step 2: 运行测试验证失败**

```powershell
npx jest --config jest.config.cjs tests/unit/core/config.test.ts -v
```

Expected: FAIL — `paths.trackingSummary` is undefined

**Step 3: 实现 — 修改 DIRS 常量**

在 `src/core/config.ts` 的 `DIRS` 对象中添加：

```typescript
SUMMARY: 'summary',
VOLUMES: 'volumes',
```

**Step 4: 实现 — 修改 getProjectPaths()**

在 `getProjectPaths()` 返回对象中添加：

```typescript
trackingSummary: path.join(projectRoot, DIRS.SPEC, DIRS.TRACKING, DIRS.SUMMARY),
trackingVolumes: path.join(projectRoot, DIRS.SPEC, DIRS.TRACKING, DIRS.VOLUMES),
```

**Step 5: 实现 — 修改 getTemplateSourcePaths()**

在 `getTemplateSourcePaths()` 返回对象中添加：

```typescript
trackingSummary: path.join(templatesDir, DIRS.TRACKING, DIRS.SUMMARY),
```

**Step 6: 运行测试验证通过**

```powershell
npx jest --config jest.config.cjs tests/unit/core/config.test.ts -v
```

Expected: PASS

**Step 7: 提交**

```powershell
git add src/core/config.ts tests/unit/core/config.test.ts
git commit -m "feat: add trackingSummary and trackingVolumes paths to config"
```

---

### Task 3: 修改 init.ts 支持 --scale large

**Files:**
- Modify: `src/commands/init.ts:22-30` (command options)
- Modify: `src/commands/init.ts:53-70` (directory creation)
- Modify: `src/commands/init.ts:125-128` (tracking template copy)
- Test: `tests/integration/init-project.test.ts`

**Step 1: 写失败测试**

在 `tests/integration/init-project.test.ts` 中添加：

```typescript
it('should create summary directory with --scale large', () => {
  const projectName = 'large-novel';

  execSync(`node "${CLI_PATH}" init ${projectName} --no-git --scale large`, {
    cwd: testDir,
    stdio: 'pipe',
  });

  const projectPath = path.join(testDir, projectName);

  // 验证 summary 目录和文件
  const summaryDir = path.join(projectPath, 'spec', 'tracking', 'summary');
  expect(fs.existsSync(summaryDir)).toBe(true);
  expect(fs.existsSync(path.join(summaryDir, 'characters-summary.json'))).toBe(true);
  expect(fs.existsSync(path.join(summaryDir, 'plot-summary.json'))).toBe(true);
  expect(fs.existsSync(path.join(summaryDir, 'timeline-summary.json'))).toBe(true);
  expect(fs.existsSync(path.join(summaryDir, 'volume-summaries.json'))).toBe(true);

  // 验证 volumes 目录
  const volumesDir = path.join(projectPath, 'spec', 'tracking', 'volumes');
  expect(fs.existsSync(volumesDir)).toBe(true);
  expect(fs.existsSync(path.join(volumesDir, 'vol-01'))).toBe(true);
});

it('should NOT create summary/volumes directories without --scale large', () => {
  const projectName = 'normal-novel';

  execSync(`node "${CLI_PATH}" init ${projectName} --no-git`, {
    cwd: testDir,
    stdio: 'pipe',
  });

  const projectPath = path.join(testDir, projectName);
  const summaryDir = path.join(projectPath, 'spec', 'tracking', 'summary');
  const volumesDir = path.join(projectPath, 'spec', 'tracking', 'volumes');

  expect(fs.existsSync(summaryDir)).toBe(false);
  expect(fs.existsSync(volumesDir)).toBe(false);
});

it('should store scale in config.json when --scale large', () => {
  const projectName = 'scale-config-test';

  execSync(`node "${CLI_PATH}" init ${projectName} --no-git --scale large`, {
    cwd: testDir,
    stdio: 'pipe',
  });

  const configPath = path.join(testDir, projectName, '.specify', 'config.json');
  const config = fs.readJsonSync(configPath);
  expect(config.scale).toBe('large');
});
```

**Step 2: 运行测试验证失败**

```powershell
npx jest --config jest.config.cjs tests/integration/init-project.test.ts -v
```

Expected: FAIL — unknown option '--scale'

**Step 3: 实现 — 添加 --scale 选项**

在 `src/commands/init.ts` 的 command 定义中添加 option：

```typescript
.option('--scale <size>', '项目规模预设 (large: 启用分片存储)')
```

**Step 4: 实现 — 创建分片目录**

在 init action 中，tracking 模板复制之后，添加：

```typescript
// 大型项目：创建分片目录结构
if (options.scale === 'large') {
  const summaryDir = paths.trackingSummary;
  const volumesDir = paths.trackingVolumes;
  await fs.ensureDir(summaryDir);
  await fs.ensureDir(path.join(volumesDir, 'vol-01'));

  // 复制 summary 模板
  if (await fs.pathExists(templates.trackingSummary)) {
    await fs.copy(templates.trackingSummary, summaryDir);
  }

  // 复制 tracking 模板到 vol-01 作为初始卷
  const trackingFiles = ['character-state.json', 'plot-tracker.json', 'timeline.json', 'relationships.json'];
  for (const file of trackingFiles) {
    const src = path.join(templates.tracking, file);
    const dest = path.join(volumesDir, 'vol-01', file);
    if (await fs.pathExists(src)) {
      await fs.copy(src, dest);
    }
  }

  spinner.text = '已创建大型项目分片结构...';
}
```

**Step 5: 实现 — 在 config.json 中记录 scale**

在 config 对象创建处添加：

```typescript
const config = {
  name,
  type: 'novel',
  ai: 'claude',
  created: new Date().toISOString(),
  version: getVersion(),
  ...(options.scale && { scale: options.scale }),
};
```

**Step 6: 运行测试验证通过**

```powershell
npm run build && npx jest --config jest.config.cjs tests/integration/init-project.test.ts -v
```

Expected: PASS

**Step 7: 提交**

```powershell
git add src/commands/init.ts tests/integration/init-project.test.ts
git commit -m "feat: add --scale large option to init for volume sharding"
```

---

### Task 4: 添加 --with-mcp 选项（预留）

**Files:**
- Modify: `src/commands/init.ts`
- Test: `tests/integration/init-project.test.ts`

**Step 1: 写失败测试**

```typescript
it('should store withMcp flag in config.json when --with-mcp', () => {
  const projectName = 'mcp-test';

  execSync(`node "${CLI_PATH}" init ${projectName} --no-git --with-mcp`, {
    cwd: testDir,
    stdio: 'pipe',
  });

  const configPath = path.join(testDir, projectName, '.specify', 'config.json');
  const config = fs.readJsonSync(configPath);
  expect(config.mcp).toBe(true);
});

it('should imply --scale large when --with-mcp', () => {
  const projectName = 'mcp-large-test';

  execSync(`node "${CLI_PATH}" init ${projectName} --no-git --with-mcp`, {
    cwd: testDir,
    stdio: 'pipe',
  });

  const projectPath = path.join(testDir, projectName);
  const summaryDir = path.join(projectPath, 'spec', 'tracking', 'summary');
  expect(fs.existsSync(summaryDir)).toBe(true);
});
```

**Step 2: 运行测试验证失败**

```powershell
npm run build && npx jest --config jest.config.cjs tests/integration/init-project.test.ts -v
```

**Step 3: 实现**

在 init command 定义中添加：

```typescript
.option('--with-mcp', '启用 MCP + SQLite 数据中枢（隐含 --scale large）')
```

在 action 开头添加：

```typescript
// --with-mcp 隐含 --scale large
if (options.withMcp && !options.scale) {
  options.scale = 'large';
}
```

在 config 对象中添加：

```typescript
...(options.withMcp && { mcp: true }),
```

**Step 4: 运行测试验证通过**

```powershell
npm run build && npx jest --config jest.config.cjs tests/integration/init-project.test.ts -v
```

**Step 5: 提交**

```powershell
git add src/commands/init.ts tests/integration/init-project.test.ts
git commit -m "feat: add --with-mcp option to init (placeholder for Phase 2)"
```

---

### Task 5: 修改 upgrade.ts 添加迁移提示

**Files:**
- Modify: `src/commands/upgrade.ts`
- Test: `tests/integration/init-project.test.ts` (或新建 `tests/integration/upgrade-project.test.ts`)

**Step 1: 写失败测试**

新建 `tests/integration/upgrade-project.test.ts`：

```typescript
import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

const CLI_PATH = path.resolve(__dirname, '../../dist/cli.js');

describe('novelws upgrade', () => {
  let testDir: string;
  let projectPath: string;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nws-upgrade-'));
    // 先创建一个项目
    execSync(`node "${CLI_PATH}" init test-novel --no-git`, {
      cwd: testDir,
      stdio: 'pipe',
    });
    projectPath = path.join(testDir, 'test-novel');
  });

  afterEach(async () => {
    try {
      await fs.remove(testDir);
    } catch {
      // ignore cleanup errors on Windows
    }
  });

  it('should detect large tracking files and output migration hint', () => {
    // 创建一个超过 50KB 的 character-state.json
    const trackingPath = path.join(projectPath, 'spec', 'tracking', 'character-state.json');
    const largeData = { characters: 'x'.repeat(60 * 1024) };
    fs.writeJsonSync(trackingPath, largeData);

    const output = execSync(`node "${CLI_PATH}" upgrade -y`, {
      cwd: projectPath,
      stdio: 'pipe',
      encoding: 'utf-8',
    });

    expect(output).toContain('tracking');
  });

  it('should not show migration hint for small tracking files', () => {
    const output = execSync(`node "${CLI_PATH}" upgrade -y`, {
      cwd: projectPath,
      stdio: 'pipe',
      encoding: 'utf-8',
    });

    expect(output).not.toContain('迁移');
  });
});
```

**Step 2: 运行测试验证失败**

```powershell
npm run build && npx jest --config jest.config.cjs tests/integration/upgrade-project.test.ts -v
```

**Step 3: 实现**

在 `src/commands/upgrade.ts` 的 action 中，spinner.succeed 之前添加：

```typescript
// 检测 tracking 文件大小，提示迁移
const MIGRATION_THRESHOLD = 50 * 1024; // 50KB
const trackingFiles = [
  'character-state.json',
  'plot-tracker.json',
  'timeline.json',
  'relationships.json',
];

let hasLargeFiles = false;
for (const file of trackingFiles) {
  const filePath = path.join(paths.tracking, file);
  if (await fs.pathExists(filePath)) {
    const stat = await fs.stat(filePath);
    if (stat.size > MIGRATION_THRESHOLD) {
      hasLargeFiles = true;
      break;
    }
  }
}

if (hasLargeFiles) {
  console.log(chalk.yellow('\n⚠️  检测到 tracking 文件较大，建议执行分片迁移以提升性能'));
  console.log(chalk.gray('  运行 /track --migrate 将数据按卷分片存储'));
}
```

**Step 4: 运行测试验证通过**

```powershell
npm run build && npx jest --config jest.config.cjs tests/integration/upgrade-project.test.ts -v
```

**Step 5: 提交**

```powershell
git add src/commands/upgrade.ts tests/integration/upgrade-project.test.ts
git commit -m "feat: detect large tracking files and suggest migration on upgrade"
```

---

### Task 6: 运行全部测试确认无回归

**Step 1: 构建项目**

```powershell
npm run build
```

**Step 2: 运行全部测试**

```powershell
npm test
```

Expected: ALL PASS

**Step 3: 如有失败，修复后重新运行**

**Step 4: 最终提交（如有修复）**

```powershell
git add -A
git commit -m "fix: resolve test regressions from Phase 1 changes"
```
