# /expand 命令上下文重载 实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 改进 /expand 命令，使其从文件系统重新加载所有资源，不依赖对话历史，并扩大资源加载范围以提升扩写质量。

**Architecture:** 修改两个模板文件：expand.md（命令模板）和 CLAUDE.md（会话规范）。expand.md 增加上下文隔离声明、3 层资源加载结构、增强扩写原则和批量模式独立加载。CLAUDE.md 修改会话级复用规则为分命令策略。

**Tech Stack:** Markdown 模板文件，无代码变更。

---

### Task 1: 修改 expand.md — 更新 frontmatter allowed-tools

**Files:**
- Modify: `templates/commands/expand.md:5`

**Step 1: 更新 allowed-tools**

将 expand.md 第 5 行的 allowed-tools 从：

```
allowed-tools: Read(//stories/**), Write(//stories/**/content/**), Read(//tracking/**), Write(//tracking/**), Read(//resources/style-reference.md), Read(//resources/anti-ai.md), Bash(ls:*)
```

替换为：

```
allowed-tools: Read(//stories/**), Write(//stories/**/content/**), Read(//tracking/**), Write(//tracking/**), Read(//resources/style-reference.md), Read(//resources/anti-ai.md), Read(//resources/constitution.md), Bash(ls:*)
```

新增 `Read(//resources/constitution.md)`。注意：specification.md 和 creative-plan.md 已被 `Read(//stories/**)` 覆盖，relationships.json 已被 `Read(//tracking/**)` 覆盖，所以只需新增 constitution.md 的权限。

**Step 2: 验证修改**

用 Read 工具读取 `templates/commands/expand.md` 第 1-6 行，确认 frontmatter 正确。

**Step 3: Commit**

```bash
git add templates/commands/expand.md
git commit -m "feat(expand): add constitution.md to allowed-tools"
```

---

### Task 2: 修改 expand.md — 添加上下文隔离声明

**Files:**
- Modify: `templates/commands/expand.md:8-9`

**Step 1: 在"用户输入"之后、"目标"之前插入上下文隔离声明**

在第 8 行 `用户输入：$ARGUMENTS` 之后、第 10 行 `## 目标` 之前，插入：

```markdown

## 上下文隔离（强制）

本命令的所有创作资源必须从文件系统重新加载，禁止依赖本对话中之前任何 /write 或其他命令的生成过程和中间记忆。

具体规则：
- 忽略对话历史中所有 /write 生成的概要内容，以文件系统中的 synopsis.md 为唯一真实来源
- 忽略对话历史中所有 tracking 文件的中间状态，重新从文件读取最新版本
- 不复用对话中已加载的 style-reference.md 或 anti-ai.md，重新读取

```

**Step 2: 验证修改**

用 Read 工具读取 `templates/commands/expand.md` 第 8-20 行，确认上下文隔离声明正确插入。

**Step 3: Commit**

```bash
git add templates/commands/expand.md
git commit -m "feat(expand): add context isolation declaration"
```

---

### Task 3: 修改 expand.md — 重写资源加载为 3 层结构

**Files:**
- Modify: `templates/commands/expand.md` — "资源加载" 整节

**Step 1: 替换资源加载章节**

将原来的 `## 资源加载（精准最小集）` 整节（从标题到 `**不加载**` 行）替换为：

```markdown
## 资源加载（3 层结构，从文件系统重新加载）

所有资源必须从文件系统读取，不复用对话中的缓存。总上下文控制在 3500 字以内。

### 第 1 层 — 全局视角

1. **specification.md 摘要**：读取 `stories/<story>/specification.md`，提取 100 字核心摘要（类型 + 主角 + 核心冲突）
2. **当前卷大纲**：读取 `stories/<story>/creative-plan.md`，只提取当前章节所属卷的段落

### 第 2 层 — 章节核心

3. **当前章概要**：读取 `stories/<story>/content/chapter-XXX-synopsis.md`（200-500字）
4. **前一章正文末尾**：读取前一章 `chapter-XXX.md` 的最后 500-800 字（衔接用）。如果前一章尚未扩写，读取前一章概要代替

### 第 3 层 — 细节支撑

5. **本章出场角色状态**：从概要中提取出场角色列表，然后从 `tracking/character-state.json` 只提取这些角色的条目
6. **本章活跃伏笔**：从 `tracking/plot-tracker.json` 提取 status=planted 或 status=hinted 且 keyChapters 包含当前章或相邻章（±3章）的伏笔
7. **本章相关角色关系**：从 `tracking/relationships.json` 提取本章出场角色之间的关系条目（最多 5 条，超出则取最近更新的）
8. **风格参考**：读取 `resources/style-reference.md`
9. **反AI规范**：读取 `resources/anti-ai.md`

**上下文预算**：

| 层级 | 预估字数 |
|------|---------|
| 第 1 层 全局 | 200-400 字 |
| 第 2 层 章节 | 700-1300 字 |
| 第 3 层 细节 | 800-1500 字 |
| **总计** | **1700-3200 字** |

每层加载完后检查上下文预算，超出则截断（如角色关系条目过多时只取最核心的 5 条）。
```

**Step 2: 验证修改**

用 Read 工具读取 `templates/commands/expand.md` 的资源加载章节，确认 3 层结构完整。

**Step 3: Commit**

```bash
git add templates/commands/expand.md
git commit -m "feat(expand): rewrite resource loading as 3-tier structure"
```

---

### Task 4: 修改 expand.md — 增强扩写原则和批量模式

**Files:**
- Modify: `templates/commands/expand.md` — "扩写正文" 和 "批量模式" 两节

**Step 1: 在扩写正文的原则列表中添加两条新原则**

在 `### 3. 扩写正文`（注意：因为前面插入了内容，步骤编号可能已变化，按实际内容定位）的原则列表中，在 `**忠实于概要**` 之后添加：

```markdown
- **全局一致性**：正文必须与 specification.md 的类型定位和 creative-plan.md 的卷级设计保持一致
- **角色关系驱动**：对话和互动必须体现 relationships.json 中的关系动态
```

**Step 2: 增强批量模式声明**

将批量模式章节从：

```markdown
如果指定了 `--batch N`，重复步骤 2-4 共 N 次。每章完成后输出进度和字数。
```

替换为：

```markdown
如果指定了 `--batch N`，重复步骤 2-4 共 N 次。每章完成后输出进度和字数。

**批量模式资源隔离**：每章都必须重新从文件系统加载所有资源（前一章扩写可能更新了 tracking）。批量模式中每章视为独立的扩写任务，不复用前一章扩写过程中的中间状态。
```

**Step 3: 验证修改**

用 Read 工具读取 `templates/commands/expand.md` 的扩写正文和批量模式章节，确认新增内容正确。

**Step 4: Commit**

```bash
git add templates/commands/expand.md
git commit -m "feat(expand): add global consistency and relationship-driven principles, enhance batch mode"
```

---

### Task 5: 修改 CLAUDE.md — 更新会话级复用规则

**Files:**
- Modify: `templates/dot-claude/CLAUDE.md:50-58`

**Step 1: 替换会话级资源复用章节**

将 `## 会话级资源复用` 整节（第 50-58 行）从：

```markdown
## 会话级资源复用

本次对话中已加载的资源知识应复用，避免重复读取文件：

1. **首次加载**：读取资源文件内容，记住已加载的资源列表
2. **后续命令**：检查资源是否在"已加载列表"中
   - ✅ 已加载：直接使用已有知识，不重新读取文件
   - ❌ 未加载：读取文件并添加到"已加载列表"
3. **例外**：用户明确要求"重新加载"时重新读取
```

替换为：

```markdown
## 会话级资源复用

不同命令的资源复用策略不同：

**可复用命令**（/specify、/plan、/write）：
1. **首次加载**：读取资源文件内容，记住已加载的资源列表
2. **后续命令**：检查资源是否在"已加载列表"中
   - ✅ 已加载：直接使用已有知识，不重新读取文件
   - ❌ 未加载：读取文件并添加到"已加载列表"

**强制重载命令**（/expand、/analyze）：
- 必须从文件系统重新加载所有资源，不复用对话中的缓存
- 忽略对话历史中其他命令的生成过程和中间记忆
- 以文件系统中的数据为唯一真实来源

**例外**：用户明确要求"重新加载"时，任何命令都重新读取
```

**Step 2: 验证修改**

用 Read 工具读取 `templates/dot-claude/CLAUDE.md` 第 50 行到末尾，确认会话级复用规则正确。

**Step 3: Commit**

```bash
git add templates/dot-claude/CLAUDE.md
git commit -m "feat(CLAUDE.md): split session resource reuse rules by command type"
```

---

### Task 6: 运行测试验证

**Files:**
- Read: `tests/integration/template-validation.test.ts`
- Read: `tests/integration/init-project.test.ts`

**Step 1: 运行全部测试**

```bash
npm test
```

Expected: 所有测试通过。本次修改只涉及模板内容变更，不涉及结构变更，测试应全部通过。

**Step 2: 如果测试失败，检查失败原因并修复**

读取失败的测试输出，定位问题。

**Step 3: 最终 Commit（如有修复）**

```bash
git add -A
git commit -m "fix: resolve test failures from expand context-reload changes"
```
