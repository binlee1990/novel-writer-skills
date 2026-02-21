# 卷级分片架构 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将平面结构（所有章节/tracking在同一层级）重构为卷级分片结构，以支持 200 卷/10000 章的超大规模小说。

**Architecture:** 以"卷"为分片单元。tracking/content 按卷隔离存储在 `volumes/vol-XXX/` 下，每卷有 `volume-summary.md` 作为跨卷状态交接文档。init 命令不再生成全局 tracking 目录。所有 5 个命令模板的路径从全局改为卷级。

**Tech Stack:** TypeScript (src/)、Markdown 模板 (templates/)、Jest 测试

---

### Task 1: 新增 volume-summary 模板文件

**Files:**
- Create: `templates/volume-summary.md`

**Step 1: 创建模板文件**

用 Write 工具创建 `templates/volume-summary.md`：

```markdown
# 第 X 卷 状态快照

> 本文件在卷切换时自动生成，是当前卷创作的入口条件。
> 第一卷的 volume-summary 在 /write 首次执行时由系统初始化（内容为空状态）。

## 故事进度
- 已完成章节：[从第 1 章到上一卷最后一章]
- 当前主线：[主线当前阶段一句话描述]

## 活跃角色状态
[最近 2 卷出场过的角色，每人 2-3 句描述当前状态]

## 活跃伏笔
[status=planted 或 hinted 的伏笔列表]

## 关键关系
[当前卷预计出场角色之间的关系]

## 待续悬念
[上一卷结尾留下的钩子/悬念]
```

**Step 2: 运行测试确认不破坏现有测试**

Run: `npm test`
Expected: 全部 PASS（新增文件不影响现有测试）

**Step 3: Commit**

```bash
git add templates/volume-summary.md
git commit -m "feat: add volume-summary.md template for volume sharding"
```

---

### Task 2: 更新 config.ts — 新增 VOLUMES 目录常量

**Files:**
- Modify: `src/core/config.ts:52-59` (DIRS 常量)
- Modify: `src/core/config.ts:100-115` (getProjectPaths)

**Step 1: 更新测试预期**

在 `tests/unit/core/config.test.ts` 中找到相关测试，确认是否有对 DIRS 或 getProjectPaths 的直接断言。如果有，先更新预期。

**Step 2: 修改 DIRS 常量**

在 `src/core/config.ts` 的 DIRS 对象中新增：

```typescript
export const DIRS = {
  CLAUDE: '.claude',
  STORIES: 'stories',
  COMMANDS: 'commands',
  TEMPLATES: 'templates',
  TRACKING: 'tracking',
  RESOURCES: 'resources',
  VOLUMES: 'volumes',        // 新增
} as const;
```

**Step 3: 更新 getProjectPaths**

移除顶层 tracking 路径，保留 stories 路径（volumes 在 stories 下面，由命令模板自行定位）：

```typescript
export function getProjectPaths(projectRoot: string) {
  return {
    root: projectRoot,
    // .claude/
    claude: path.join(projectRoot, DIRS.CLAUDE),
    claudeMd: path.join(projectRoot, DIRS.CLAUDE, 'CLAUDE.md'),
    commands: path.join(projectRoot, DIRS.CLAUDE, DIRS.COMMANDS),
    // resources/
    resources: path.join(projectRoot, DIRS.RESOURCES),
    resourcesConfig: path.join(projectRoot, DIRS.RESOURCES, FILES.CONFIG),
    // stories/
    stories: path.join(projectRoot, DIRS.STORIES),
  };
}
```

注意：移除了 `tracking` 属性，因为 tracking 现在在卷级目录下，不在项目根。

**Step 4: 运行测试**

Run: `npm test`
Expected: 可能有部分测试因引用 `paths.tracking` 而失败。记录失败测试，在 Task 3 中修复。

**Step 5: Commit**

```bash
git add src/core/config.ts
git commit -m "refactor(config): add VOLUMES dir constant, remove top-level tracking path"
```

---

### Task 3: 更新 init.ts — 新目录结构

**Files:**
- Modify: `src/commands/init.ts:50-104`

**Step 1: 修改目录创建逻辑**

将 init.ts 中的目录创建从：

```typescript
const baseDirs = [
  paths.claude,
  paths.commands,
  paths.resources,
  paths.tracking,  // 删除这行
  paths.stories,
];
```

改为：

```typescript
const baseDirs = [
  paths.claude,
  paths.commands,
  paths.resources,
  paths.stories,
];
```

**Step 2: 删除 tracking 模板复制**

删除 init.ts 中以下代码块（约第 101-104 行）：

```typescript
// 删除这段：复制 tracking/ 模板
// if (await fs.pathExists(templates.tracking)) {
//   await fs.copy(templates.tracking, paths.tracking);
// }
```

tracking 文件现在不在 init 时创建，而是在 /write 首次写入某卷时按需创建。

**Step 3: 构建并运行测试**

Run: `npm run build && npm test`
Expected: `init-project.test.ts` 中的 `should create tracking files` 和 `should create project with correct directory structure`（检查 tracking 目录存在）会失败。

**Step 4: Commit**

```bash
git add src/commands/init.ts
git commit -m "refactor(init): remove top-level tracking directory creation"
```

---

### Task 4: 更新 init-project.test.ts — 适配新结构

**Files:**
- Modify: `tests/integration/init-project.test.ts`

**Step 1: 移除 tracking 目录检查**

在 `should create project with correct directory structure` 测试中，删除：
```typescript
expect(fs.existsSync(path.join(projectPath, 'tracking'))).toBe(true);
```

**Step 2: 移除 tracking 文件测试**

删除整个 `should create tracking files` 测试用例（约第 112-131 行），因为 init 不再创建 tracking 文件。

**Step 3: 构建并运行测试**

Run: `npm run build && npm test`
Expected: 全部 PASS

**Step 4: Commit**

```bash
git add tests/integration/init-project.test.ts
git commit -m "test(init): remove tracking directory checks, tracking now per-volume"
```

---

### Task 5: 更新 template-validation.test.ts — 新增 volume-summary 检查

**Files:**
- Modify: `tests/integration/template-validation.test.ts`

**Step 1: 新增 volume-summary 模板验证**

在 `template-validation.test.ts` 尾部（`Tracking Templates` describe 之后）新增：

```typescript
describe('Volume Summary Template', () => {
  it('should have volume-summary.md template', () => {
    expect(fs.existsSync(path.join(TEMPLATES_DIR, 'volume-summary.md'))).toBe(true);
  });

  it('should have non-empty volume-summary template', () => {
    const content = fs.readFileSync(
      path.join(TEMPLATES_DIR, 'volume-summary.md'),
      'utf-8'
    );
    expect(content.trim().length).toBeGreaterThan(0);
  });
});
```

注意：保留 Tracking Templates 测试不变（tracking 模板文件仍然存在于 `templates/tracking/`，只是不在 init 时复制到项目根了——它们会被命令模板在卷级使用时按需初始化）。

**Step 2: 运行测试**

Run: `npm test`
Expected: 全部 PASS

**Step 3: Commit**

```bash
git add tests/integration/template-validation.test.ts
git commit -m "test: add volume-summary template validation"
```

---

### Task 6: 更新 plan.md — 输出卷级章节范围和卷目录名

**Files:**
- Modify: `templates/commands/plan.md`

**Step 1: 修改输出格式**

在 plan.md 的输出格式部分（第 42-66 行），为每卷新增 `卷目录` 字段：

将：
```
## 第一卷：[卷名]
- 章节范围：第1-XX章
```

改为：
```
## 第一卷：[卷名]
- 卷目录：vol-001
- 章节范围：第1-XX章（chapter-001 到 chapter-XXX）
```

**Step 2: 更新后续建议**

将第 70 行的后续建议更新为：

```
输出：「卷级大纲生成完成。下一步请使用 /write 1 开始逐章生成剧情概要（系统会自动创建 volumes/vol-001/ 目录结构）。可用 /write --batch 20 批量生成。」
```

**Step 3: 运行测试**

Run: `npm test`
Expected: 全部 PASS

**Step 4: Commit**

```bash
git add templates/commands/plan.md
git commit -m "feat(plan): add volume directory name to output format"
```

---

### Task 7: 重写 write.md — 卷级资源加载和卷切换

**Files:**
- Modify: `templates/commands/write.md` (全文重写)

**Step 1: 重写 write.md**

用 Write 工具将 `templates/commands/write.md` 全文替换为：

```markdown
---
description: 逐章生成剧情概要（200-500字），同步更新 tracking
argument-hint: [章节号] [--batch N]
recommended-model: claude-opus-4-6
allowed-tools: Read(//stories/**), Write(//stories/**), Bash(ls:*), Bash(mkdir:*)
---

用户输入：$ARGUMENTS

## 目标

为指定章节生成 200-500 字的纯剧情概要，同步生成 tracking 骨架数据。

## 参数解析

- 章节号：从 $ARGUMENTS 提取，如 `1`、`42`
- `--batch N`：批量生成 N 章概要（最大 20），从指定章节号开始

## 卷定位

根据章节号和 `stories/<story>/creative-plan.md` 中每卷的章节范围，确定目标章节所属的卷目录（如 `vol-001`）。

路径规则：
- 概要：`stories/<story>/volumes/vol-XXX/content/chapter-YYY-synopsis.md`
- Tracking：`stories/<story>/volumes/vol-XXX/tracking/`

### 首次写入某卷时的初始化

如果 `volumes/vol-XXX/` 目录不存在，自动创建：

1. 创建 `volumes/vol-XXX/content/` 和 `volumes/vol-XXX/tracking/`
2. 初始化 4 个空 tracking 文件（同 templates/tracking/ 的初始内容）
3. 如果是第一卷（vol-001），生成初始 volume-summary.md（空状态，从 specification.md 提取基本信息）
4. 如果不是第一卷，执行「卷切换」流程（见下方）

### 卷切换流程

当目标章节属于新卷时（上一卷已完成）：

1. 读取上一卷 `volumes/vol-NNN/tracking/` 的 4 个 JSON 文件
2. 读取上一卷最后一章 synopsis 的章末钩子
3. 读取 `creative-plan.md` 中下一卷的大纲段落
4. 生成新卷的 `volume-summary.md`：
   - 故事进度：已完成的章节范围
   - 活跃角色状态：从 character-state.json 提取最近 2 卷出场过的角色
   - 活跃伏笔：从 plot-tracker.json 提取 status=planted/hinted 的条目
   - 关键关系：从 relationships.json 提取活跃角色间的关系
   - 待续悬念：上一卷末章的章末钩子
5. volume-summary.md 控制在 500-1000 字

## 资源加载（卷级）

1. **specification.md 摘要**：读取 `stories/<story>/specification.md`，提取 100 字核心摘要（类型 + 主角 + 核心冲突）
2. **当前卷大纲**：读取 `stories/<story>/creative-plan.md`，只提取当前卷的段落
3. **volume-summary.md**：读取 `stories/<story>/volumes/vol-XXX/volume-summary.md`（跨卷上下文）
4. **本卷前序概要标题列表**：扫描 `stories/<story>/volumes/vol-XXX/content/chapter-*-synopsis.md`，只读取每个文件的第一行标题
5. **前一章概要全文**：读取前一章的 synopsis.md（200-500 字）。如果前一章在上一卷，从上一卷的 content/ 读取

**不加载**：resources 目录任何文件、tracking 文件（写入时直接追加）

## 执行步骤

### 1. 确定故事目录、章节号和所属卷

从 $ARGUMENTS 和 `stories/` 目录确定当前故事，从 creative-plan.md 确定章节所属卷。

### 2. 确保卷目录存在

如果卷目录不存在，执行初始化或卷切换流程。

### 3. 加载上下文

按上述「资源加载」规则加载最小上下文。

### 4. 生成概要

为当前章节生成 200-500 字纯剧情概要，包含：

- **本章标题**：简短的章节标题
- **核心事件**：本章发生的主要事件（1-3个）
- **出场角色**：本章出场的角色列表
- **情感走向**：本章的情感基调和变化
- **章末钩子**：本章结尾的悬念或引子

写入 `stories/<story>/volumes/vol-XXX/content/chapter-YYY-synopsis.md`（YYY 为三位数补零）。

### 5. 更新卷级 tracking

根据概要内容，更新 `stories/<story>/volumes/vol-XXX/tracking/` 下的 4 个文件：

**character-state.json**：
- 新出场角色：添加条目（role, status, location, state, lastAppearance）
- 已有角色：更新 status、location、state、lastAppearance

**relationships.json**：
- 新关系：添加条目（from, to, type, note, lastUpdate）
- 关系变化：更新 note 和 lastUpdate

**plot-tracker.json**：
- 更新 currentChapter
- 新情节线：添加到 plotlines（name, status, description, keyChapters）
- 伏笔埋设：添加到 foreshadowing（id, content, plantedAt, status=planted）
- 伏笔回收：更新 resolveAt 和 status=resolved

**timeline.json**：
- 添加本章事件到 events（chapter, time, event）

### 6. 批量模式

如果指定了 `--batch N`，重复步骤 3-5 共 N 次。如果批量过程中跨卷，自动触发卷切换。

### 7. 后续建议

单章完成：「第X章概要已生成（vol-XXX）。继续 /write [X+1] 或 /write --batch 20 批量生成。」

批量完成：「第X-Y章概要已生成（共Z章）。继续 /write [Y+1] --batch 20 或开始 /expand [章节号] 扩写。」
```

**Step 2: 运行测试**

Run: `npm test`
Expected: 全部 PASS（模板内容变更不影响测试，测试只检查文件存在和非空）

**Step 3: Commit**

```bash
git add templates/commands/write.md
git commit -m "feat(write): rewrite for volume-level sharding with auto volume switching"
```

---

### Task 8: 重写 expand.md — 卷级 tracking 加载

**Files:**
- Modify: `templates/commands/expand.md` (全文重写)

**Step 1: 重写 expand.md**

用 Write 工具将 `templates/commands/expand.md` 全文替换为：

```markdown
---
description: 将章节概要扩写为 3000-5000 字正文
argument-hint: [章节号] [--batch N]
recommended-model: claude-opus-4-6
allowed-tools: Read(//stories/**), Write(//stories/**/content/**), Read(//stories/**/tracking/**), Write(//stories/**/tracking/**), Read(//resources/style-reference.md), Read(//resources/anti-ai.md), Read(//resources/constitution.md), Bash(ls:*)
---

用户输入：$ARGUMENTS

## 上下文隔离（强制）

本命令的所有创作资源必须从文件系统重新加载，禁止依赖本对话中之前任何 /write 或其他命令的生成过程和中间记忆。

具体规则：
- 忽略对话历史中所有 /write 生成的概要内容，以文件系统中的 synopsis.md 为唯一真实来源
- 忽略对话历史中所有 tracking 文件的中间状态，重新从文件读取最新版本
- 不复用对话中已加载的 style-reference.md 或 anti-ai.md，重新读取

## 目标

将已生成的章节概要扩写为 3000-5000 字的完整正文。

## 参数解析

- 章节号：从 $ARGUMENTS 提取
- `--batch N`：批量扩写 N 章（最大 10），从指定章节号开始

## 卷定位

根据章节号和 `stories/<story>/creative-plan.md` 中每卷的章节范围，确定目标章节所属的卷目录（如 `vol-001`）。

路径规则：
- 概要：`stories/<story>/volumes/vol-XXX/content/chapter-YYY-synopsis.md`
- 正文：`stories/<story>/volumes/vol-XXX/content/chapter-YYY.md`
- Tracking：`stories/<story>/volumes/vol-XXX/tracking/`

## 资源加载（3 层结构，从文件系统重新加载）

所有资源必须从文件系统读取，不复用对话中的缓存。总上下文控制在 3500 字以内。

### 第 1 层 — 全局视角

1. **specification.md 摘要**：读取 `stories/<story>/specification.md`，提取 100 字核心摘要（类型 + 主角 + 核心冲突）
2. **当前卷大纲**：读取 `stories/<story>/creative-plan.md`，只提取当前章节所属卷的段落
3. **volume-summary.md**：读取 `stories/<story>/volumes/vol-XXX/volume-summary.md`（跨卷上下文，500-1000 字）

### 第 2 层 — 章节核心

4. **当前章概要**：读取 `stories/<story>/volumes/vol-XXX/content/chapter-YYY-synopsis.md`（200-500字）
5. **前一章正文末尾**：读取前一章 `chapter-YYY.md` 的最后 500-800 字（衔接用）。如果前一章在上一卷，从上一卷的 content/ 读取。如果前一章尚未扩写，读取前一章概要代替

### 第 3 层 — 细节支撑

6. **本章出场角色状态**：从概要中提取出场角色列表，然后从 `volumes/vol-XXX/tracking/character-state.json` 只提取这些角色的条目。如果角色在本卷 tracking 中不存在，从 volume-summary.md 的活跃角色状态中查找
7. **本章活跃伏笔**：从 `volumes/vol-XXX/tracking/plot-tracker.json` 提取 status=planted 或 status=hinted 的伏笔。补充 volume-summary.md 中的活跃伏笔
8. **本章相关角色关系**：从 `volumes/vol-XXX/tracking/relationships.json` 提取本章出场角色之间的关系条目（最多 5 条）。补充 volume-summary.md 中的关键关系
9. **风格参考**：读取 `resources/style-reference.md`
10. **反AI规范**：读取 `resources/anti-ai.md`

**上下文预算**：

| 层级 | 预估字数 |
|------|---------|
| 第 1 层 全局 | 700-1400 字（含 volume-summary） |
| 第 2 层 章节 | 700-1300 字 |
| 第 3 层 细节 | 800-1500 字 |
| **总计** | **2200-4200 字** |

每层加载完后检查上下文预算，超出则截断。volume-summary.md 超长时只保留活跃角色状态和活跃伏笔部分。

## 执行步骤

### 1. 前置检查

- 确认目标章节的 synopsis.md 存在，否则提示先运行 /write
- 确认目标章节的正文 chapter-YYY.md 不存在（避免覆盖），如已存在则询问是否覆盖

### 2. 加载上下文

按上述「资源加载」规则加载精准最小集。

### 3. 扩写正文

基于概要，扩写为 3000-5000 字正文。遵循以下原则：

- **忠实于概要**：核心事件、出场角色、情感走向必须与概要一致
- **全局一致性**：正文必须与 specification.md 的类型定位和 creative-plan.md 的卷级设计保持一致
- **角色关系驱动**：对话和互动必须体现 tracking/relationships.json 中的关系动态
- **文学表达**：专注于场景描写、对话、心理活动、动作细节
- **风格一致**：遵循 style-reference.md 的风格设定
- **反AI规范**：遵循 anti-ai.md 的写作规范
- **衔接自然**：与前一章末尾自然衔接
- **伏笔落地**：概要中标记的伏笔必须在正文中体现

写入 `stories/<story>/volumes/vol-XXX/content/chapter-YYY.md`。

### 4. 补充卷级 tracking 细节

扩写完成后，检查正文中是否产生了概要中没有的新细节：
- 对话中透露的新信息 → 更新 `volumes/vol-XXX/tracking/` 中的 character-state 或 relationships
- 新的场景细节 → 如有重要设定变化，更新相关 tracking

### 5. 批量模式

如果指定了 `--batch N`，重复步骤 2-4 共 N 次。每章完成后输出进度和字数。

**批量模式资源隔离**：每章都必须重新从文件系统加载所有资源。批量模式中每章视为独立的扩写任务。如果批量过程中跨卷，需要切换到下一卷的 tracking 和 content 目录。

### 6. 后续建议

单章完成：「第X章扩写完成（XXXX字，vol-XXX）。继续 /expand [X+1] 或使用 /analyze X 检查质量。」

批量完成：「第X-Y章扩写完成（共Z章，平均XXXX字/章）。使用 /analyze --range X-Y 批量检查质量。」
```

**Step 2: 运行测试**

Run: `npm test`
Expected: 全部 PASS

**Step 3: Commit**

```bash
git add templates/commands/expand.md
git commit -m "feat(expand): rewrite for volume-level tracking and volume-summary loading"
```

---

### Task 9: 更新 analyze.md — 卷级 tracking 路径

**Files:**
- Modify: `templates/commands/analyze.md:19-23`

**Step 1: 更新资源加载路径**

将 analyze.md 的资源加载部分（第 19-23 行）从：

```markdown
## 资源加载

- 目标章节正文：`stories/<story>/content/chapter-XXX.md`
- 对应概要：`stories/<story>/content/chapter-XXX-synopsis.md`
- tracking 数据：`tracking/character-state.json`、`tracking/plot-tracker.json`
```

改为：

```markdown
## 卷定位

根据章节号和 `stories/<story>/creative-plan.md` 确定目标章节所属卷（如 `vol-001`）。

## 资源加载

- 目标章节正文：`stories/<story>/volumes/vol-XXX/content/chapter-YYY.md`
- 对应概要：`stories/<story>/volumes/vol-XXX/content/chapter-YYY-synopsis.md`
- 卷级 tracking：`stories/<story>/volumes/vol-XXX/tracking/character-state.json`、`stories/<story>/volumes/vol-XXX/tracking/plot-tracker.json`
```

同时更新 allowed-tools（第 5 行）从：
```
allowed-tools: Read(//stories/**), Read(//tracking/**), Bash(ls:*)
```
改为：
```
allowed-tools: Read(//stories/**), Bash(ls:*)
```

（tracking 现在在 stories 下面，已被 `Read(//stories/**)` 覆盖）

**Step 2: 运行测试**

Run: `npm test`
Expected: 全部 PASS

**Step 3: Commit**

```bash
git add templates/commands/analyze.md
git commit -m "feat(analyze): update to volume-level tracking paths"
```

---

### Task 10: 更新 CLAUDE.md — 新目录结构和路径映射

**Files:**
- Modify: `templates/dot-claude/CLAUDE.md`

**Step 1: 更新 Tracking 文件表格**

将 CLAUDE.md 中的 Tracking 文件表格（第 38-46 行）从全局路径改为卷级路径：

从：
```markdown
## Tracking 文件

| 文件 | 用途 |
|------|------|
| tracking/character-state.json | 角色状态 |
| tracking/relationships.json | 角色关系 |
| tracking/plot-tracker.json | 情节线和伏笔 |
| tracking/timeline.json | 时间线 |

- /write 完成后自动更新 tracking 骨架
- /expand 完成后补充 tracking 细节
```

改为：
```markdown
## 卷级结构

每个故事按卷分片存储：

```
stories/<story>/
├── specification.md
├── creative-plan.md
└── volumes/
    └── vol-XXX/
        ├── volume-summary.md    # 跨卷状态快照
        ├── tracking/            # 卷级 tracking
        │   ├── character-state.json
        │   ├── plot-tracker.json
        │   ├── relationships.json
        │   └── timeline.json
        └── content/             # 卷级内容
            ├── chapter-YYY-synopsis.md
            └── chapter-YYY.md
```

- volume-summary.md 在卷切换时自动生成，是当前卷的入口条件
- /write 完成后自动更新卷级 tracking 骨架
- /expand 完成后补充卷级 tracking 细节
```

**Step 2: 运行测试**

Run: `npm test`
Expected: 全部 PASS

**Step 3: Commit**

```bash
git add templates/dot-claude/CLAUDE.md
git commit -m "docs(CLAUDE.md): update to volume-level directory structure"
```

---

### Task 11: 更新 upgrade.ts — 保留旧项目兼容

**Files:**
- Modify: `src/commands/upgrade.ts`

**Step 1: 添加 tracking 模板目录的存在性检查**

upgrade.ts 当前不复制 tracking 文件（只更新 commands、CLAUDE.md、resources）。不需要改动。但需要确认 upgrade 不会因为缺少 tracking 目录而报错。

读取 upgrade.ts 确认无 tracking 相关逻辑。如果没有，此 Task 标记为 no-op。

**Step 2: 运行测试**

Run: `npm test`
Expected: 全部 PASS

**Step 3: Commit（如有改动）**

```bash
git commit --allow-empty -m "chore: verify upgrade.ts compatible with volume sharding (no changes needed)"
```

---

### Task 12: 更新项目 CLAUDE.md — 目录结构文档

**Files:**
- Modify: `CLAUDE.md` (项目根目录的 CLAUDE.md，不是模板)

**Step 1: 更新生成项目的目录结构**

在项目根 CLAUDE.md 的"生成项目的目录结构"部分（约第 87 行），将目录树更新为卷级分片结构：

从：
```
my-novel/
├── .claude/
│   ├── commands/
│   └── skills/
├── .specify/
│   ├── memory/
│   ├── scripts/
│   └── templates/
├── stories/
│   └── <story>/
│       ├── specification.md
│       ├── creative-plan.md
│       ├── tasks.md
│       └── content/
├── spec/
│   ├── tracking/
│   └── knowledge/
└── plugins/
```

改为：
```
my-novel/
├── .claude/
│   ├── commands/       # Slash Commands
│   └── CLAUDE.md       # 核心规范
├── resources/          # 资源文件
│   ├── constitution.md
│   ├── style-reference.md
│   └── anti-ai.md
├── stories/
│   └── <story>/
│       ├── specification.md
│       ├── creative-plan.md
│       └── volumes/
│           └── vol-XXX/
│               ├── volume-summary.md
│               ├── tracking/
│               │   ├── character-state.json
│               │   ├── plot-tracker.json
│               │   ├── relationships.json
│               │   └── timeline.json
│               └── content/
│                   ├── chapter-YYY-synopsis.md
│                   └── chapter-YYY.md
```

同时更新关键路径映射部分，移除旧的 tracking 路径映射，新增：
```
- tracking 文件在 `stories/<story>/volumes/vol-XXX/tracking/`，不是项目根
- content 文件在 `stories/<story>/volumes/vol-XXX/content/`，不是 `stories/<story>/content/`
```

**Step 2: 运行测试**

Run: `npm test`
Expected: 全部 PASS

**Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update project directory structure to volume-level sharding"
```

---

### Task 13: 最终验证 — 全量测试 + 构建

**Files:** None (verification only)

**Step 1: 完整构建**

Run: `npm run build`
Expected: 编译成功，无错误

**Step 2: 完整测试**

Run: `npm test`
Expected: 全部 PASS

**Step 3: 检查 git 状态**

Run: `git status`
Expected: clean working tree

Run: `git log --oneline -15`
Expected: 看到本次所有 commit 的有序列表
