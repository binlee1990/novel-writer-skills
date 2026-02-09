# 测试体系实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标：** 为 Novel Writer Skills 建立完整的测试体系，确保项目可维护性和代码质量

**架构：** Jest 测试框架 + 单元测试 + 集成测试 + E2E 测试，覆盖 CLI、模板、插件系统

**技术栈：** Jest, TypeScript, ts-jest, 自定义测试工具

---

## 背景与动机

### 当前状态

**测试覆盖率：** 0%
- 无测试目录
- 无测试依赖
- 无测试脚本
- tsconfig.json 明确排除 `**/*.test.ts`

### 问题

1. **代码质量无保障**
   - 重构时无法验证功能未破坏
   - Bug 修复可能引入新 Bug
   - 无法确保向后兼容

2. **开发效率低**
   - 每次修改需要手动测试所有功能
   - 无法快速验证 PR 质量
   - 发布前需要大量手动测试

3. **协作困难**
   - 新贡献者不敢重构代码
   - Code Review 缺乏客观标准
   - 难以确保 PR 质量

### 价值主张

1. **回归保护** - 防止修改破坏现有功能
2. **文档作用** - 测试即用法文档
3. **重构自信** - 有测试保护，放心重构
4. **CI/CD 基础** - 自动化测试是持续集成的前提
5. **质量标准** - 为 PR 提供客观验收标准

---

## Task 1: 研究项目结构和测试需求

**Files:**
- Read: `src/cli.ts` (全文)
- Read: `src/plugins/manager.ts` (全文)
- Read: `src/utils/project.ts` (全文)
- Read: `package.json`
- Read: `tsconfig.json`

**Step 1: 分析需要测试的模块**

```bash
# 统计源代码文件
find src/ -name "*.ts" | wc -l

# 查看源代码结构
tree src/
```

**识别测试范围**：

| 模块 | 文件 | 复杂度 | 测试类型 |
|------|------|--------|---------|
| CLI 路由 | cli.ts | 高 | 集成测试 |
| 插件管理器 | plugins/manager.ts | 高 | 单元 + 集成 |
| 项目工具 | utils/project.ts | 中 | 单元测试 |
| 日志工具 | utils/logger.ts | 低 | 单元测试 |
| 版本管理 | version.ts | 低 | 单元测试 |

**Step 2: 分析测试依赖**

需要的测试工具：
- Jest - 测试框架
- ts-jest - TypeScript 支持
- @types/jest - 类型定义
- mock-fs - 文件系统 mock
- 其他可能需要的工具

**Step 3: 设计测试目录结构**

```
novel-writer-skills/
├── src/
│   ├── cli.ts
│   ├── plugins/
│   └── utils/
├── tests/                    # 新增
│   ├── unit/                 # 单元测试
│   │   ├── utils/
│   │   │   ├── project.test.ts
│   │   │   └── logger.test.ts
│   │   ├── plugins/
│   │   │   └── manager.test.ts
│   │   └── version.test.ts
│   │
│   ├── integration/          # 集成测试
│   │   ├── cli.test.ts
│   │   ├── init-project.test.ts
│   │   ├── plugin-install.test.ts
│   │   └── upgrade.test.ts
│   │
│   ├── e2e/                  # 端到端测试
│   │   ├── full-workflow.test.ts
│   │   └── plugin-lifecycle.test.ts
│   │
│   ├── fixtures/             # 测试数据
│   │   ├── mock-project/
│   │   ├── mock-plugin/
│   │   └── sample-configs/
│   │
│   └── helpers/              # 测试工具
│       ├── test-utils.ts
│       ├── mock-filesystem.ts
│       └── assertions.ts
│
├── jest.config.js            # 新增
└── package.json              # 更新
```

---

## Task 2: 配置测试环境

**Files:**
- Modify: `package.json`
- Create: `jest.config.js`
- Modify: `tsconfig.json` (可选)
- Create: `.github/workflows/test.yml` (CI 配置)

**Step 1: 安装测试依赖**

```bash
npm install --save-dev \
  jest \
  ts-jest \
  @types/jest \
  mock-fs \
  @types/mock-fs
```

**Step 2: 创建 Jest 配置**

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

**Step 3: 更新 package.json**

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration",
    "test:e2e": "jest tests/e2e"
  }
}
```

**Step 4: 创建 GitHub Actions 配置**

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm test
      - run: npm run test:coverage
```

---

## Task 3: 编写单元测试

### 3.1 测试 utils/project.ts

**Files:**
- Create: `tests/unit/utils/project.test.ts`

**测试用例：**

```typescript
import { isProjectRoot, findProjectRoot, getProjectInfo } from '@/utils/project';
import mockFs from 'mock-fs';
import path from 'path';

describe('project.ts', () => {
  afterEach(() => {
    mockFs.restore();
  });

  describe('isProjectRoot()', () => {
    it('should return true when .specify directory exists', () => {
      mockFs({
        '/test-project/.specify': {},
      });

      expect(isProjectRoot('/test-project')).toBe(true);
    });

    it('should return false when .specify directory does not exist', () => {
      mockFs({
        '/test-project': {},
      });

      expect(isProjectRoot('/test-project')).toBe(false);
    });
  });

  describe('findProjectRoot()', () => {
    it('should find project root from nested directory', () => {
      mockFs({
        '/project/.specify': {},
        '/project/stories/chapter-01': {},
      });

      const result = findProjectRoot('/project/stories/chapter-01');
      expect(result).toBe('/project');
    });

    it('should return null if no project root found', () => {
      mockFs({
        '/random-dir': {},
      });

      expect(findProjectRoot('/random-dir')).toBeNull();
    });
  });

  describe('getProjectInfo()', () => {
    it('should read project config correctly', () => {
      mockFs({
        '/project/.specify/config.json': JSON.stringify({
          name: 'test-novel',
          type: 'novel-project',
          version: '1.0.0',
        }),
      });

      const info = getProjectInfo('/project');
      expect(info.name).toBe('test-novel');
      expect(info.type).toBe('novel-project');
    });

    it('should throw error if config not found', () => {
      mockFs({
        '/project/.specify': {},
      });

      expect(() => getProjectInfo('/project')).toThrow();
    });
  });
});
```

**预估：** 100-150 行

### 3.2 测试 utils/logger.ts

**Files:**
- Create: `tests/unit/utils/logger.test.ts`

**测试用例：**

```typescript
import { info, success, warn, error } from '@/utils/logger';

describe('logger.ts', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should log info with correct format', () => {
    info('Test message');
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Test message')
    );
  });

  it('should log success with checkmark', () => {
    success('Success message');
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('✓')
    );
  });

  // 更多测试...
});
```

**预估：** 50-80 行

### 3.3 测试 version.ts

**Files:**
- Create: `tests/unit/version.test.ts`

**测试用例：**

```typescript
import { getVersion } from '@/version';

describe('version.ts', () => {
  it('should return version from package.json', () => {
    const version = getVersion();
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
```

**预估：** 20-30 行

### 3.4 测试 plugins/manager.ts（单元部分）

**Files:**
- Create: `tests/unit/plugins/manager.test.ts`

**测试用例：**

```typescript
import { PluginManager } from '@/plugins/manager';
import mockFs from 'mock-fs';

describe('PluginManager', () => {
  let manager: PluginManager;

  beforeEach(() => {
    manager = new PluginManager('/test-project');
  });

  afterEach(() => {
    mockFs.restore();
  });

  describe('loadPlugins()', () => {
    it('should load plugins from plugins directory', async () => {
      mockFs({
        '/test-project/plugins/test-plugin/config.yaml': `
name: test-plugin
version: 1.0.0
description: Test plugin
`,
      });

      const plugins = await manager.loadPlugins();
      expect(plugins).toHaveLength(1);
      expect(plugins[0].name).toBe('test-plugin');
    });

    it('should skip invalid plugin configs', async () => {
      mockFs({
        '/test-project/plugins/invalid-plugin/config.yaml': 'invalid yaml: [[[',
      });

      const plugins = await manager.loadPlugins();
      expect(plugins).toHaveLength(0);
    });
  });

  // 更多测试...
});
```

**预估：** 200-300 行

---

## Task 4: 编写集成测试

### 4.1 测试 CLI init 命令

**Files:**
- Create: `tests/integration/init-project.test.ts`

**测试用例：**

```typescript
import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

describe('novelwrite init', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = path.join(os.tmpdir(), `test-${Date.now()}`);
    fs.mkdirSync(testDir);
  });

  afterEach(() => {
    fs.removeSync(testDir);
  });

  it('should create project with correct structure', () => {
    const projectName = 'test-novel';
    const projectPath = path.join(testDir, projectName);

    execSync(`node dist/cli.js init ${projectName}`, {
      cwd: testDir,
    });

    // 验证目录结构
    expect(fs.existsSync(path.join(projectPath, '.claude'))).toBe(true);
    expect(fs.existsSync(path.join(projectPath, '.specify'))).toBe(true);
    expect(fs.existsSync(path.join(projectPath, 'stories'))).toBe(true);
    expect(fs.existsSync(path.join(projectPath, 'spec'))).toBe(true);

    // 验证配置文件
    const config = fs.readJsonSync(
      path.join(projectPath, '.specify/config.json')
    );
    expect(config.name).toBe(projectName);
  });

  it('should copy commands correctly', () => {
    const projectName = 'test-novel';
    const projectPath = path.join(testDir, projectName);

    execSync(`node dist/cli.js init ${projectName}`, {
      cwd: testDir,
    });

    const commandsDir = path.join(projectPath, '.claude/commands');
    const commands = fs.readdirSync(commandsDir);

    expect(commands).toContain('constitution.md');
    expect(commands).toContain('specify.md');
    expect(commands.length).toBeGreaterThanOrEqual(13);
  });

  it('should copy skills correctly', () => {
    const projectName = 'test-novel';
    const projectPath = path.join(testDir, projectName);

    execSync(`node dist/cli.js init ${projectName}`, {
      cwd: testDir,
    });

    const skillsDir = path.join(projectPath, '.claude/skills');
    expect(fs.existsSync(skillsDir)).toBe(true);

    // 验证至少存在某些 skills
    const genreSkills = path.join(skillsDir, 'genre-knowledge');
    expect(fs.existsSync(genreSkills)).toBe(true);
  });
});
```

**预估：** 150-200 行

### 4.2 测试插件安装流程

**Files:**
- Create: `tests/integration/plugin-install.test.ts`

**测试用例：**

```typescript
describe('Plugin Installation', () => {
  let testProject: string;

  beforeEach(() => {
    // 创建测试项目
  });

  it('should install plugin from local directory', () => {
    // 测试从本地安装插件
  });

  it('should inject plugin commands correctly', () => {
    // 验证命令注入
  });

  it('should inject plugin skills correctly', () => {
    // 验证 skills 注入
  });

  it('should handle plugin removal', () => {
    // 测试插件卸载
  });
});
```

**预估：** 100-150 行

### 4.3 测试 upgrade 命令

**Files:**
- Create: `tests/integration/upgrade.test.ts`

**测试用例：**

```typescript
describe('novelwrite upgrade', () => {
  it('should upgrade project from v1.0.0 to v1.1.0', () => {
    // 创建 v1.0.0 项目
    // 执行 upgrade
    // 验证新文件存在
    // 验证配置版本更新
  });

  it('should not overwrite user-modified files', () => {
    // 测试升级时保护用户修改
  });
});
```

**预估：** 80-120 行

---

## Task 5: 编写 E2E 测试

### 5.1 完整工作流测试

**Files:**
- Create: `tests/e2e/full-workflow.test.ts`

**测试场景：**

```typescript
describe('Complete Workflow E2E', () => {
  it('should complete full novel creation workflow', () => {
    // 1. init project
    // 2. 验证项目结构
    // 3. 模拟创建 stories
    // 4. 验证文件生成
    // 5. check 命令验证
  });
});
```

**预估：** 100-150 行

---

## Task 6: 创建测试工具和 Fixtures

### 6.1 测试工具

**Files:**
- Create: `tests/helpers/test-utils.ts`

```typescript
// 创建临时测试目录
export function createTempDir(): string;

// 创建模拟项目
export function createMockProject(name: string, options?: any): string;

// 清理测试文件
export function cleanup(path: string): void;

// 执行 CLI 命令并捕获输出
export function runCli(args: string[]): { stdout: string; stderr: string; exitCode: number };
```

**预估：** 100-150 行

### 6.2 Mock 文件系统工具

**Files:**
- Create: `tests/helpers/mock-filesystem.ts`

```typescript
// 创建标准的项目文件系统结构
export function mockProjectFilesystem(projectPath: string): void;

// 创建模拟插件
export function mockPlugin(pluginName: string, config: any): void;
```

**预估：** 80-120 行

### 6.3 Fixtures（测试数据）

**Files:**
- Create: `tests/fixtures/mock-project/.specify/config.json`
- Create: `tests/fixtures/mock-plugin/config.yaml`
- Create: `tests/fixtures/sample-specification.md`
- Create: `tests/fixtures/sample-tracking-data.json`

**预估：** 10-20 个 fixture 文件

---

## Task 7: 模板文件测试

### 7.1 验证模板文件格式

**Files:**
- Create: `tests/integration/template-validation.test.ts`

**测试用例：**

```typescript
describe('Template Files Validation', () => {
  it('should have all required commands', () => {
    const commandsDir = path.join(__dirname, '../../templates/commands');
    const commands = fs.readdirSync(commandsDir);

    const required = [
      'constitution.md',
      'specify.md',
      'clarify.md',
      'plan.md',
      'tasks.md',
      'write.md',
      'analyze.md',
    ];

    required.forEach(cmd => {
      expect(commands).toContain(cmd);
    });
  });

  it('should have valid YAML frontmatter in skills', () => {
    const skillsDir = path.join(__dirname, '../../templates/skills');
    // 递归查找所有 SKILL.md 文件
    // 验证 YAML frontmatter 格式
  });

  it('should have valid knowledge base structure', () => {
    const kbDir = path.join(__dirname, '../../templates/knowledge-base');
    // 验证 README.md 中的关键词映射
    // 验证实际文件存在
  });
});
```

**预估：** 150-200 行

---

## Task 8: 覆盖率报告和 CI 集成

**Step 1: 配置覆盖率阈值**

在 `jest.config.js` 中已配置：
- 70% 覆盖率目标

**Step 2: 生成覆盖率报告**

```bash
npm run test:coverage
```

输出：
- 控制台摘要
- `coverage/` 目录（HTML 报告）

**Step 3: CI 集成**

已在 Task 2 创建 `.github/workflows/test.yml`

**Step 4: 添加 Badge 到 README**

```markdown
[![Tests](https://github.com/wordflowlab/novel-writer-skills/actions/workflows/test.yml/badge.svg)](https://github.com/wordflowlab/novel-writer-skills/actions/workflows/test.yml)
[![Coverage](https://img.shields.io/codecov/c/github/wordflowlab/novel-writer-skills)](https://codecov.io/gh/wordflowlab/novel-writer-skills)
```

---

## Task 9: 文档和最佳实践

**Files:**
- Create: `docs/testing-guide.md`

**内容：**

```markdown
# 测试指南

## 运行测试

```bash
# 运行所有测试
npm test

# 运行特定类型测试
npm run test:unit
npm run test:integration
npm run test:e2e

# Watch 模式（开发时）
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

## 编写测试的最佳实践

### 1. 测试命名
- 使用 `describe` 描述模块/类/函数
- 使用 `it` 描述具体行为
- 命名清晰，一眼看出测试什么

### 2. AAA 模式
- Arrange（准备）：设置测试数据
- Act（执行）：调用被测试的函数
- Assert（断言）：验证结果

### 3. 独立性
- 每个测试应该独立
- 使用 `beforeEach` / `afterEach` 清理状态
- 不要依赖测试执行顺序

### 4. Mock 外部依赖
- 文件系统：使用 `mock-fs`
- 网络请求：使用 `nock` 或 `jest.mock()`
- 时间：使用 `jest.useFakeTimers()`

## 贡献者注意事项

- 新功能必须包含测试
- Bug 修复应该先写失败的测试，再修复
- PR 必须通过所有测试
- 保持覆盖率不低于 70%
```

---

## Task 10: 验证和提交

**验证标准：**

- [ ] 测试框架配置完成（Jest, ts-jest）
- [ ] 单元测试覆盖核心模块
  - [ ] utils/project.ts
  - [ ] utils/logger.ts
  - [ ] version.ts
  - [ ] plugins/manager.ts
- [ ] 集成测试覆盖关键流程
  - [ ] init 命令
  - [ ] plugin 安装
  - [ ] upgrade 命令
- [ ] E2E 测试覆盖完整工作流
- [ ] 模板验证测试
- [ ] 覆盖率 ≥ 70%
- [ ] CI/CD 配置完成
- [ ] 文档完善

**提交：**

```bash
git add tests/
git add jest.config.js
git add .github/workflows/test.yml
git add package.json
git add docs/testing-guide.md
git commit -m "feat(test): 建立完整的测试体系

- 配置 Jest + ts-jest 测试框架
- 单元测试（utils, plugins, version）
- 集成测试（CLI 命令、插件系统）
- E2E 测试（完整工作流）
- 模板文件验证测试
- CI/CD 自动化测试
- 覆盖率目标 70%

测试统计：
- 单元测试：~20 个用例
- 集成测试：~15 个用例
- E2E 测试：~5 个用例
- 覆盖率：~75%

Closes: P1 优先级任务 #2"
```

---

## 预估工作量

| Task | 内容 | 预估时间 |
|------|------|---------|
| 1 | 研究和规划 | 1-2h |
| 2 | 配置测试环境 | 1h |
| 3 | 单元测试（4 个模块） | 4-5h |
| 4 | 集成测试（3 个流程） | 3-4h |
| 5 | E2E 测试 | 2h |
| 6 | 测试工具和 Fixtures | 2-3h |
| 7 | 模板验证测试 | 1-2h |
| 8 | 覆盖率和 CI | 1h |
| 9 | 文档 | 1h |
| 10 | 验证和调试 | 2-3h |

**总计：** 18-25 小时

---

## 成功标准

**技术指标：**
- 测试覆盖率 ≥ 70%
- 所有 CI 测试通过
- 测试执行时间 < 2 分钟

**质量指标：**
- 能捕获回归问题
- 测试即文档（可读性强）
- 新贡献者能轻松添加测试

**长期价值：**
- 重构时有信心
- PR Review 有客观标准
- 发布前有质量保障
