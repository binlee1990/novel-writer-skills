# Phase 6: 新增 Skill + 集成测试 + 文档 - 详细实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 新增 long-series-continuity skill，更新项目模板文档，编写端到端集成测试

**依赖:** Phase 1-5 全部完成

---

### Task 1: 创建 long-series-continuity skill

**Files:**
- Create: `templates/skills/quality-assurance/long-series-continuity/SKILL.md`

**实现：**

```markdown
---
name: long-series-continuity
description: "Automatically activates when the project has more than 100 chapters - monitors cross-volume character continuity, foreshadowing expiration, and setting consistency across ultra-long novels"
allowed-tools: Read, Grep
---

# 超长篇连贯性守护

## 自动激活条件

当项目章节数 > 100 时自动激活。通过检测 `stories/*/content/` 下的章节文件数量判断。

## 核心监控维度

### 1. 角色出场间隔提醒

写作时自动检查当前章涉及的角色：

**检查流程：**
1. 识别当前章节中出现的角色名
2. 查询该角色上次出场的章节号（MCP: `query_chapter_entities`，Fallback: 读 character-state.json 的 lastSeen）
3. 如果间隔 > 50 章，输出提醒：

```
📌 角色出场提醒：
  赵四 上次出场在第 203 章（距今 147 章），当时状态：
  - 位置：青云宗外门
  - 身份：外门弟子
  - 最后行为：与林逸发生冲突后离开

  请确认本章中赵四的状态描写与上次一致。
```

### 2. 伏笔到期提醒

监控长期未解决的伏笔：

**检查流程：**
1. 查询所有 status=active 的伏笔（MCP: `query_plot` --status=active，Fallback: 读 plot-tracker.json）
2. 计算每个伏笔的"年龄"（当前章 - planted.chapter）
3. 按阈值分级提醒：

| 伏笔年龄 | 级别 | 提醒 |
|----------|------|------|
| 100-200 章 | 📝 注意 | 该伏笔已埋设较久，考虑推进 |
| 200-500 章 | ⚠️ 警告 | 读者可能已遗忘，建议近期回收或重新提示 |
| > 500 章 | 🔴 紧急 | 严重超期，必须尽快处理或明确放弃 |

```
⚠️ 伏笔到期提醒：
  "天魂珠的第二块碎片"（埋于第 15 章，已过 285 章）
  - 重要性：高
  - 最后一次提及：第 120 章
  - 建议：在近 10 章内安排线索推进，或通过角色对话重新提醒读者
```

### 3. 设定一致性检测

跨卷检测设定矛盾：

**被动监控（写作时）：**
- 当前章提到的地名、组织名、力量等级等，与 story-facts.json 交叉验证
- MCP 优先：调用 `query_facts` 查询相关事实，调用 `search_content` 搜索历史描述
- 发现不一致时立即提醒

**主动检测（/track --check 时）：**
- 配合 consistency-checker skill 执行深度检查
- 重点关注跨卷的设定变化

### 4. 角色称呼一致性

监控同一角色在不同章节中的称呼变化：

```
📝 称呼变化检测：
  "林逸" 在不同章节中的称呼：
  - 第 1-50 章：林逸、小逸（母亲称呼）
  - 第 51-100 章：林逸、林师弟（同门称呼）
  - 第 203 章：林道友 ← 新称呼，请确认是否合理
```

## 与其他命令的协作

### 在 /write 期间
- 自动执行角色出场间隔检查
- 自动执行伏笔到期检查
- 被动监控设定一致性

### 在 /write --batch 期间
- 每章写完后执行轻量检查（角色间隔 + 伏笔）
- 批量完成后执行完整检查

### 在 /recap 期间
- 在简报中附加"超期伏笔"和"久未出场角色"列表

### 在 /track --check 期间
- 提供跨卷一致性检查的额外维度

## 数据来源优先级

1. MCP 工具（query_chapter_entities, query_plot, query_facts, search_content）
2. 分片 JSON（spec/tracking/volumes/ + spec/tracking/summary/）
3. 单文件 JSON（spec/tracking/）

## 配置

本 skill 无需手动配置，自动根据项目规模激活。

如需调整阈值，可在 `specification.md` 的 frontmatter 中添加：

```yaml
long-series:
  character-gap-warning: 50    # 角色出场间隔警告阈值（章）
  foreshadow-warning: 200      # 伏笔超期警告阈值（章）
  foreshadow-critical: 500     # 伏笔超期紧急阈值（章）
```
```

**提交：**
```powershell
git add templates/skills/quality-assurance/long-series-continuity/SKILL.md
git commit -m "feat: add long-series-continuity skill for 100+ chapter novels"
```

---

### Task 2: 更新生成项目的 CLAUDE.md 模板

**Files:**
- Modify: `templates/dot-claude/CLAUDE.md`

**在模板末尾添加分片存储说明段：**

```markdown
## 超长篇支撑（分片模式）

当项目章节数超过 100 时，tracking 数据可以从单文件模式迁移到分卷分片模式：

### 目录结构（分片模式）

```
spec/tracking/
├── story-facts.json          # 全局
├── tracking-log.md           # 全局
├── summary/                  # 全局摘要（跨卷查询入口）
│   ├── characters-summary.json
│   ├── plot-summary.json
│   ├── timeline-summary.json
│   └── volume-summaries.json
├── volumes/                  # 分卷详情
│   ├── vol-01/
│   │   ├── character-state.json
│   │   ├── plot-tracker.json
│   │   ├── timeline.json
│   │   └── relationships.json
│   └── vol-02/
│       └── ...
└── novel-tracking.db         # SQLite 数据库（MCP 使用）
```

### 数据加载规则

所有命令遵循三层 Fallback：
1. MCP 查询（最优，需安装 novelws-mcp）
2. 分片 JSON（按卷加载，体积可控）
3. 单文件 JSON（兜底，完全兼容）

### 迁移命令

当 /guide 提示 tracking 文件过大时，执行 `/track --migrate` 进行分片迁移。
```

**提交：**
```powershell
git add templates/dot-claude/CLAUDE.md
git commit -m "docs: add sharding mode documentation to generated project CLAUDE.md"
```

---

### Task 3: 更新 init.ts 确保新模板被复制

**Files:**
- Modify: `src/commands/init.ts`

**检查项：**

1. `templates/tracking/summary/` 下的 4 个摘要模板在 `--scale large` 时被复制 → 已在 Phase 1 Task 3 实现
2. `templates/commands/volume-summary.md` 和 `search.md` 作为普通命令模板被复制 → 已由现有的 `fs.copy(templates.commands, paths.commands)` 覆盖
3. `templates/skills/quality-assurance/long-series-continuity/` 作为普通 skill 被复制 → 已由现有的 `fs.copy(templates.skills, paths.skills)` 覆盖

**验证：** 运行现有的 init 集成测试确认新文件被正确复制。

```powershell
npm run build && npx jest --config jest.config.cjs tests/integration/init-project.test.ts -v
```

如果需要额外的测试用例，添加到 init-project.test.ts：

```typescript
it('should copy volume-summary and search commands', () => {
  const projectName = 'new-commands-test';
  execSync(`node "${CLI_PATH}" init ${projectName} --no-git`, {
    cwd: testDir,
    stdio: 'pipe',
  });

  const commandsDir = path.join(testDir, projectName, '.claude', 'commands');
  expect(fs.existsSync(path.join(commandsDir, 'volume-summary.md'))).toBe(true);
  expect(fs.existsSync(path.join(commandsDir, 'search.md'))).toBe(true);
});

it('should copy long-series-continuity skill', () => {
  const projectName = 'skill-test';
  execSync(`node "${CLI_PATH}" init ${projectName} --no-git`, {
    cwd: testDir,
    stdio: 'pipe',
  });

  const skillPath = path.join(testDir, projectName, '.claude', 'skills',
    'quality-assurance', 'long-series-continuity', 'SKILL.md');
  expect(fs.existsSync(skillPath)).toBe(true);
});
```

**提交：**
```powershell
git add src/commands/init.ts tests/integration/init-project.test.ts
git commit -m "test: verify new commands and skills are copied during init"
```

---

### Task 4: 编写端到端集成测试

**Files:**
- Create: `tests/integration/ultra-long-novel.test.ts`

**测试场景：**

```typescript
import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

const CLI_PATH = path.resolve(__dirname, '../../dist/cli.js');

describe('Ultra-long novel support - integration', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nws-ultra-'));
  });

  afterEach(async () => {
    try { await fs.remove(testDir); } catch { /* ignore */ }
  });

  describe('init --scale large', () => {
    it('should create complete sharded directory structure', () => {
      execSync(`node "${CLI_PATH}" init large-novel --no-git --scale large`, {
        cwd: testDir,
        stdio: 'pipe',
      });

      const projectPath = path.join(testDir, 'large-novel');

      // Summary files
      const summaryDir = path.join(projectPath, 'spec', 'tracking', 'summary');
      expect(fs.existsSync(path.join(summaryDir, 'characters-summary.json'))).toBe(true);
      expect(fs.existsSync(path.join(summaryDir, 'plot-summary.json'))).toBe(true);
      expect(fs.existsSync(path.join(summaryDir, 'timeline-summary.json'))).toBe(true);
      expect(fs.existsSync(path.join(summaryDir, 'volume-summaries.json'))).toBe(true);

      // Volume directory
      const vol01Dir = path.join(projectPath, 'spec', 'tracking', 'volumes', 'vol-01');
      expect(fs.existsSync(path.join(vol01Dir, 'character-state.json'))).toBe(true);
      expect(fs.existsSync(path.join(vol01Dir, 'plot-tracker.json'))).toBe(true);
      expect(fs.existsSync(path.join(vol01Dir, 'timeline.json'))).toBe(true);
      expect(fs.existsSync(path.join(vol01Dir, 'relationships.json'))).toBe(true);

      // Config should record scale
      const config = fs.readJsonSync(path.join(projectPath, '.specify', 'config.json'));
      expect(config.scale).toBe('large');
    });

    it('should also create standard tracking files for backward compat', () => {
      execSync(`node "${CLI_PATH}" init compat-novel --no-git --scale large`, {
        cwd: testDir,
        stdio: 'pipe',
      });

      const projectPath = path.join(testDir, 'compat-novel');
      // Standard tracking files should still exist (copied by default init logic)
      expect(fs.existsSync(path.join(projectPath, 'spec', 'tracking', 'character-state.json'))).toBe(true);
    });
  });

  describe('init --with-mcp', () => {
    it('should imply --scale large and set mcp flag', () => {
      execSync(`node "${CLI_PATH}" init mcp-novel --no-git --with-mcp`, {
        cwd: testDir,
        stdio: 'pipe',
      });

      const projectPath = path.join(testDir, 'mcp-novel');
      const config = fs.readJsonSync(path.join(projectPath, '.specify', 'config.json'));
      expect(config.mcp).toBe(true);

      // Should have summary dir (implied --scale large)
      expect(fs.existsSync(path.join(projectPath, 'spec', 'tracking', 'summary'))).toBe(true);
    });
  });

  describe('summary template validation', () => {
    it('all summary templates should be valid JSON', () => {
      const summaryDir = path.resolve(__dirname, '../../templates/tracking/summary');
      const files = fs.readdirSync(summaryDir).filter(f => f.endsWith('.json'));

      for (const file of files) {
        const content = fs.readFileSync(path.join(summaryDir, file), 'utf-8');
        expect(() => JSON.parse(content)).not.toThrow();
      }
    });

    it('volume-summaries.json should have correct structure', () => {
      const filePath = path.resolve(__dirname, '../../templates/tracking/summary/volume-summaries.json');
      const data = fs.readJsonSync(filePath);
      expect(data).toHaveProperty('version');
      expect(data).toHaveProperty('currentVolume');
      expect(data).toHaveProperty('volumes');
      expect(Array.isArray(data.volumes)).toBe(true);
    });

    it('characters-summary.json should have correct structure', () => {
      const filePath = path.resolve(__dirname, '../../templates/tracking/summary/characters-summary.json');
      const data = fs.readJsonSync(filePath);
      expect(data).toHaveProperty('active');
      expect(data).toHaveProperty('archived');
      expect(data).toHaveProperty('totalCount');
      expect(data).toHaveProperty('activeCount');
    });
  });

  describe('new commands exist', () => {
    it('volume-summary.md should exist in templates', () => {
      const filePath = path.resolve(__dirname, '../../templates/commands/volume-summary.md');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('search.md should exist in templates', () => {
      const filePath = path.resolve(__dirname, '../../templates/commands/search.md');
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  describe('new skill exists', () => {
    it('long-series-continuity SKILL.md should exist', () => {
      const filePath = path.resolve(__dirname,
        '../../templates/skills/quality-assurance/long-series-continuity/SKILL.md');
      expect(fs.existsSync(filePath)).toBe(true);

      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('long-series-continuity');
      expect(content).toContain('100');
    });
  });

  describe('migrate-tracking.ps1 exists', () => {
    it('should exist in templates/scripts/powershell/', () => {
      const filePath = path.resolve(__dirname,
        '../../templates/scripts/powershell/migrate-tracking.ps1');
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });
});
```

**运行测试：**
```powershell
npm run build && npx jest --config jest.config.cjs tests/integration/ultra-long-novel.test.ts -v
```

**提交：**
```powershell
git add tests/integration/ultra-long-novel.test.ts
git commit -m "test: add end-to-end integration tests for ultra-long novel support"
```

---

### Task 5: 运行全部测试确认无回归

```powershell
npm run build && npm test
```

Expected: ALL PASS

如有失败修复后提交：
```powershell
git add -A
git commit -m "fix: resolve test regressions from Phase 6"
```

---

### Task 6: 最终提交和版本标记

```powershell
git add -A
git commit -m "feat: complete ultra-long novel support (Plan B+) - all 6 phases"
```

可选：打版本标签
```powershell
git tag v3.0.0-beta.1 -m "Ultra-long novel support (Plan B+)"
```
