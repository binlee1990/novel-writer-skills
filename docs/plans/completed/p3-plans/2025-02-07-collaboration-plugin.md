# Collaboration Plugin 实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标:** 创建协作插件,支持多人共同创作小说

**架构:** Plugin 格式,包含协作命令、冲突解决、版本管理

**技术栈:** Git 工作流, 协作协议, 实时同步(可选)

**预估工时:** 20-30 小时

---

## 背景

### 问题
多人共同创作小说时常遇到困难:
- **冲突频繁:** 同时编辑导致内容冲突
- **风格不一致:** 不同作者写作风格差异大
- **进度混乱:** 不知道谁在写什么
- **缺乏工具:** 现有工具不适合小说协作

### 解决方案
创建协作插件:
- 基于 Git 的分支管理
- 章节/角色级别的锁定机制
- 风格指南自动检查
- 进度看板和任务分配

### 核心价值
- **避免冲突:** 智能锁定,减少编辑冲突
- **保持一致:** 自动检查风格一致性
- **清晰分工:** 任务分配和进度追踪
- **版本管理:** 完整的历史记录和回滚

---

## 核心功能

### 1. 协作工作流
- 基于 Git 分支的章节隔离
- 合并前的自动检查
- 冲突解决辅助

### 2. 锁定机制
- 章节锁定(正在编辑中)
- 角色锁定(正在发展弧线)
- 时间锁定(自动释放)

### 3. 风格一致性
- 统一风格指南
- 自动风格检查
- 偏差警告

### 4. 任务管理
- 章节分配
- 进度看板
- 截止日期提醒

---

## Task 1: 创建 Plugin 基础结构

**Files:**
- Create: `plugins/collaboration/config.yaml`
- Create: `plugins/collaboration/README.md`

### Step 1: 编写 config.yaml

```yaml
name: collaboration
version: 1.0.0
description: 多人协作创作小说的插件
type: plugin

commands:
  - name: collab
    description: 协作管理主命令
    subcommands:
      - init        # 初始化协作项目
      - assign      # 分配任务
      - lock        # 锁定资源
      - unlock      # 解锁资源
      - status      # 查看协作状态
      - merge       # 合并分支
      - check       # 检查风格一致性

dependencies:
  - git             # 版本控制
  - character-tracking  # 角色追踪(可选)

configuration:
  lock_timeout: 7200  # 锁定超时(秒),默认2小时
  style_check: true   # 是否启用风格检查
  auto_merge: false   # 是否自动合并(慎用)

metadata:
  author: "Novel Writer Skills Team"
  category: "workflow"
  tags: ["collaboration", "git", "team"]
```

### Step 2: 编写 README.md

```markdown
# Collaboration Plugin

## 功能概述

支持多人协作创作小说:
- 基于 Git 的分支管理
- 章节/角色锁定机制
- 风格一致性检查
- 任务分配和进度追踪

## 快速开始

### 1. 初始化协作项目

```bash
/collab init
```

创建:
- `.collab/` 配置目录
- `COLLABORATION.md` 协作指南
- `.collab/locks.json` 锁定记录
- `.collab/assignments.json` 任务分配

### 2. 分配任务

```bash
/collab assign chapter-05 @alice
/collab assign character-john @bob
```

### 3. 锁定资源

开始编辑前:
```bash
/collab lock chapter-05
```

### 4. 提交和解锁

完成后:
```bash
git add chapters/chapter-05.md
git commit -m "完成第5章"
/collab unlock chapter-05
```

### 5. 合并工作

```bash
/collab merge alice/chapter-05
```

自动进行:
- 风格一致性检查
- 角色设定冲突检查
- 时间线冲突检查

## 协作工作流

### 推荐工作流(Feature Branch)

```
main (主分支)
  ↓
alice/chapter-05 (分支)
  - 编辑第5章
  - 提交
  ↓
merge → main (合并回主分支)
```

### 避免的工作流

❌ **直接在 main 上编辑** (易冲突)
❌ **长期不合并的分支** (合并困难)

## 命令详解

### /collab init
初始化协作项目

**选项:**
- `--team-size <n>` - 团队人数
- `--workflow <type>` - 工作流类型(feature-branch|gitflow)

### /collab assign
分配任务给成员

**用法:**
```bash
/collab assign <resource> <member>
/collab assign chapter-10 @alice
/collab assign character-john @bob
```

### /collab lock
锁定资源,防止冲突

**用法:**
```bash
/collab lock <resource>
/collab lock chapter-05
/collab lock character-mary
```

**锁定类型:**
- `chapter` - 章节锁定
- `character` - 角色锁定
- `timeline` - 时间线锁定

### /collab unlock
解锁资源

**用法:**
```bash
/collab unlock <resource>
```

**自动解锁:**
- 超时(默认2小时)
- 提交后自动解锁(可配置)

### /collab status
查看协作状态

**输出:**
```
📊 协作状态

【已锁定资源】
- chapter-05: @alice (1小时前)
- character-john: @bob (30分钟前)

【任务分配】
- chapter-06: @alice (进行中)
- chapter-07: @bob (待开始)
- chapter-08: 未分配

【待合并分支】
- alice/chapter-05 (1 commits)
- bob/character-john-arc (3 commits)
```

### /collab merge
合并分支,自动检查

**用法:**
```bash
/collab merge <branch>
```

**自动检查:**
- 风格一致性
- 角色设定冲突
- 时间线冲突
- 术语一致性

### /collab check
检查风格一致性

**用法:**
```bash
/collab check <file>
```

**检查项:**
- 平均句长(与项目基线对比)
- 对话格式
- 人称一致性
- 时态一致性
```

### Step 3: Commit

```bash
git add plugins/collaboration/
git commit -m "feat(p3): add collaboration plugin structure"
```

---

## Task 2: 实现锁定机制

**Files:**
- Create: `plugins/collaboration/commands/lock.md`
- Create: `plugins/collaboration/commands/unlock.md`
- Create: `.collab/locks.schema.json`

### Step 1: 编写锁定命令

```markdown
# Lock Command

## 功能
锁定资源(章节/角色),防止协作冲突

## 实现逻辑

### Step 1: 检查是否已锁定

```typescript
function lock(resource: string, user: string): Result {
  const locks = readLocks('.collab/locks.json')

  if (locks[resource]) {
    const existing = locks[resource]
    if (existing.user === user) {
      return { status: 'already_locked_by_you' }
    } else {
      return {
        status: 'locked_by_other',
        user: existing.user,
        since: existing.timestamp
      }
    }
  }

  // 继续锁定...
}
```

### Step 2: 创建锁定记录

```json
{
  "chapter-05": {
    "user": "alice",
    "timestamp": "2025-02-07T10:30:00Z",
    "expires": "2025-02-07T12:30:00Z",
    "type": "chapter"
  }
}
```

### Step 3: 通知其他成员(可选)

发送通知(如果配置了 webhook):
```
Alice 锁定了 chapter-05
```

## 锁定类型

### Chapter Lock
锁定整个章节文件

### Character Lock
锁定角色弧线编辑权

### Timeline Lock
锁定时间线段

## 超时机制

**默认超时:** 2小时

**超时后:**
- 自动解锁
- 记录警告日志
- 可选:发送通知

## 命令格式

```bash
/collab lock <resource> [--timeout <seconds>]
```

**示例:**
```bash
/collab lock chapter-05
/collab lock character-john --timeout 3600
```
```

### Step 2: 编写解锁命令

```markdown
# Unlock Command

## 功能
解锁资源,允许他人编辑

## 实现逻辑

### Step 1: 验证权限

```typescript
function unlock(resource: string, user: string, force: boolean = false): Result {
  const locks = readLocks('.collab/locks.json')

  if (!locks[resource]) {
    return { status: 'not_locked' }
  }

  const lock = locks[resource]

  if (lock.user !== user && !force) {
    return {
      status: 'permission_denied',
      message: '只能解锁自己的锁定,或使用 --force'
    }
  }

  // 继续解锁...
}
```

### Step 2: 删除锁定记录

```typescript
delete locks[resource]
saveLocks('.collab/locks.json', locks)
```

### Step 3: 日志记录

```
[2025-02-07 12:00:00] Alice unlocked chapter-05
```

## 自动解锁

### 触发条件

1. **超时:** 超过 `lock_timeout` 时间
2. **提交后:** (可配置)Git commit 后自动解锁
3. **合并后:** 分支合并后自动解锁

### 实现

```typescript
// Git hook: post-commit
function postCommit() {
  const changedFiles = getChangedFiles()
  for (const file of changedFiles) {
    autoUnlock(file, currentUser)
  }
}
```

## 强制解锁

**用法:**
```bash
/collab unlock chapter-05 --force
```

**权限:**
- 项目管理员
- 锁定超时后任何人

**警告:**
可能导致工作丢失,谨慎使用
```

### Step 3: 创建锁定数据 Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Collaboration Locks",
  "type": "object",
  "patternProperties": {
    "^.*$": {
      "type": "object",
      "properties": {
        "user": {
          "type": "string",
          "description": "锁定者用户名"
        },
        "timestamp": {
          "type": "string",
          "format": "date-time",
          "description": "锁定时间"
        },
        "expires": {
          "type": "string",
          "format": "date-time",
          "description": "过期时间"
        },
        "type": {
          "enum": ["chapter", "character", "timeline"],
          "description": "锁定类型"
        },
        "branch": {
          "type": "string",
          "description": "工作分支"
        }
      },
      "required": ["user", "timestamp", "expires", "type"]
    }
  }
}
```

### Step 4: Commit

```bash
git add plugins/collaboration/commands/lock.md
git add plugins/collaboration/commands/unlock.md
git add .collab/locks.schema.json
git commit -m "feat(p3): implement lock/unlock mechanism"
```

---

## Task 3: 实现任务分配和状态管理

**Files:**
- Create: `plugins/collaboration/commands/assign.md`
- Create: `plugins/collaboration/commands/status.md`
- Create: `.collab/assignments.json`

### Step 1: 编写任务分配命令

```markdown
# Assign Command

## 功能
分配任务(章节/角色)给团队成员

## 实现逻辑

### 数据结构

```json
{
  "assignments": [
    {
      "id": "task-001",
      "type": "chapter",
      "resource": "chapter-05",
      "assignee": "alice",
      "status": "in_progress",
      "created": "2025-02-07T10:00:00Z",
      "deadline": "2025-02-10T23:59:59Z",
      "branch": "alice/chapter-05"
    }
  ]
}
```

### 分配流程

```typescript
function assign(resource: string, assignee: string, deadline?: Date): Result {
  // 1. 检查资源是否存在
  if (!resourceExists(resource)) {
    return { status: 'resource_not_found' }
  }

  // 2. 检查是否已分配
  const existing = findAssignment(resource)
  if (existing && existing.status !== 'completed') {
    return {
      status: 'already_assigned',
      assignee: existing.assignee
    }
  }

  // 3. 创建分配记录
  const task = {
    id: generateId(),
    type: detectType(resource),
    resource,
    assignee,
    status: 'assigned',
    created: new Date(),
    deadline: deadline || getDefaultDeadline()
  }

  saveAssignment(task)
  return { status: 'success', task }
}
```

## 命令用法

```bash
/collab assign <resource> <assignee> [--deadline <date>]
```

**示例:**
```bash
/collab assign chapter-05 @alice
/collab assign chapter-06 @bob --deadline 2025-02-10
/collab assign character-john @alice
```

## 任务状态

- `assigned` - 已分配,未开始
- `in_progress` - 进行中
- `review` - 审核中
- `completed` - 已完成
- `blocked` - 阻塞

## 自动状态更新

### 触发条件

1. **分支创建** → `in_progress`
2. **PR 创建** → `review`
3. **PR 合并** → `completed`
4. **锁定资源** → `in_progress`
```

### Step 2: 编写状态命令

```markdown
# Status Command

## 功能
查看协作状态(锁定、任务、分支)

## 输出格式

```
📊 协作状态

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 已锁定资源 (2)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

chapter-05
  👤 锁定者: @alice
  ⏰ 时间: 1小时前
  ⌛ 剩余: 1小时
  📁 分支: alice/chapter-05

character-john
  👤 锁定者: @bob
  ⏰ 时间: 30分钟前
  ⌛ 剩余: 1.5小时
  📁 分支: bob/character-john-arc

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 任务分配 (4)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

进行中 (2):
  ✏️ chapter-05 → @alice (截止: 2天后)
  ✏️ character-john → @bob (截止: 5天后)

待开始 (1):
  ⏸️ chapter-06 → @alice (截止: 7天后)

未分配 (1):
  ❓ chapter-07 (无截止日期)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌿 待合并分支 (2)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

alice/chapter-05
  📝 1 commit
  ⏰ 最后更新: 2小时前
  ✅ 检查通过

bob/character-john-arc
  📝 3 commits
  ⏰ 最后更新: 1天前
  ⚠️ 风格偏差: 句长较长

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ 警告 (1)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- bob/character-john-arc 长时间未合并(1天)
  建议: 尽快审核和合并,避免冲突
```

## 实现逻辑

```typescript
function status(): StatusReport {
  return {
    locks: getActiveLocks(),
    assignments: getAssignments(),
    branches: getPendingBranches(),
    warnings: generateWarnings()
  }
}

function generateWarnings(): Warning[] {
  const warnings = []

  // 检查长时间未合并的分支
  const oldBranches = getBranches().filter(b =>
    daysSince(b.lastUpdate) > 2
  )
  for (const branch of oldBranches) {
    warnings.push({
      type: 'stale_branch',
      branch: branch.name,
      message: `长时间未合并(${daysSince(branch.lastUpdate)}天)`
    })
  }

  // 检查即将超时的锁定
  const expiringLocks = getLocks().filter(l =>
    minutesUntil(l.expires) < 30
  )
  for (const lock of expiringLocks) {
    warnings.push({
      type: 'lock_expiring',
      resource: lock.resource,
      message: `锁定即将超时(${minutesUntil(lock.expires)}分钟)`
    })
  }

  return warnings
}
```
```

### Step 3: Commit

```bash
git add plugins/collaboration/commands/assign.md
git add plugins/collaboration/commands/status.md
git add .collab/assignments.json
git commit -m "feat(p3): implement task assignment and status"
```

---

## Task 4: 实现风格一致性检查

**Files:**
- Create: `plugins/collaboration/commands/check.md`
- Create: `plugins/collaboration/style-checker.md`

### Step 1: 编写风格检查命令

```markdown
# Check Command - 风格一致性检查

## 功能
检查新内容与项目风格基线的一致性

## 检查维度

### 1. 句长分布
```typescript
function checkSentenceLength(text: string, baseline: Baseline): CheckResult {
  const sentences = splitSentences(text)
  const avgLength = average(sentences.map(s => s.length))

  const deviation = Math.abs(avgLength - baseline.avgSentenceLength)

  if (deviation > baseline.tolerance) {
    return {
      passed: false,
      metric: 'sentence_length',
      actual: avgLength,
      expected: baseline.avgSentenceLength,
      deviation
    }
  }

  return { passed: true }
}
```

### 2. 对话格式
- 是否使用引号(统一)
- 对话标签位置(前/后/无)
- 动作描写格式

### 3. 人称一致性
- 第一人称 vs 第三人称
- 单一视角 vs 多视角

### 4. 时态一致性
- 过去时 vs 现在时
- 混用检测

### 5. 术语一致性
- 角色名拼写
- 地名拼写
- 专有名词

## 基线建立

从现有章节计算风格基线:

```typescript
function buildBaseline(chapters: string[]): Baseline {
  const allText = chapters.join('\n')

  return {
    avgSentenceLength: calculateAvgSentenceLength(allText),
    tolerance: 5,  // 容忍度:±5字符
    dialogueRatio: calculateDialogueRatio(allText),
    pov: detectPOV(allText),
    tense: detectTense(allText),
    terms: extractTerms(allText)
  }
}
```

## 检查报告

```
🔍 风格一致性检查

文件: chapters/chapter-10.md
作者: @alice

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 通过项 (3)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ 人称一致性 (第三人称)
✓ 时态一致性 (过去时)
✓ 对话格式 (使用引号)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ 偏差项 (1)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ 句长偏差
  项目基线: 18.5 字符/句
  当前文本: 25.3 字符/句
  偏差: +6.8 (超出容忍度 ±5)
  建议: 考虑拆分长句,保持节奏一致

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ 错误项 (1)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ 术语不一致
  问题: 角色名拼写
  - 第3段: "艾莉亚"
  - 第15段: "艾利亚"
  建议: 统一使用 "艾莉亚"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 总结
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

通过: 3/5
偏差: 1/5 (可接受)
错误: 1/5 (需修复)

建议: 修复术语不一致后可合并
```

## 命令用法

```bash
/collab check <file>
/collab check chapters/chapter-10.md

# 检查整个分支
/collab check --branch alice/chapter-10

# 严格模式(降低容忍度)
/collab check <file> --strict
```

## 自动检查

在合并前自动运行:
```bash
/collab merge alice/chapter-10
→ 自动运行 /collab check
→ 如果有错误,提示修复后再合并
```
```

### Step 2: Commit

```bash
git add plugins/collaboration/commands/check.md
git add plugins/collaboration/style-checker.md
git commit -m "feat(p3): implement style consistency check"
```

---

## Task 5: 实现合并辅助

**Files:**
- Create: `plugins/collaboration/commands/merge.md`
- Create: `plugins/collaboration/conflict-resolver.md`

### Step 1: 编写合并命令(简化内容)

```markdown
# Merge Command

## 功能
合并分支,自动执行检查和冲突解决辅助

## 合并流程

```
1. 风格检查
2. 角色设定冲突检查
3. 时间线冲突检查
4. Git 合并
5. 冲突解决辅助(如有)
6. 自动解锁
```

## 命令用法

```bash
/collab merge <branch>
/collab merge alice/chapter-05
```

## 冲突类型

### 文本冲突(Git)
标准 Git 冲突解决

### 角色设定冲突
两个分支修改同一角色的不同属性

### 时间线冲突
两个分支在同一时间段添加事件
```

### Step 2: Commit

```bash
git add plugins/collaboration/commands/merge.md
git add plugins/collaboration/conflict-resolver.md
git commit -m "feat(p3): implement merge assistant"
```

---

## Task 6: 编写文档

**Files:**
- Create: `docs/plugins/collaboration.md`

### Step 1: 编写用户文档(简化)

```markdown
# Collaboration Plugin

## 简介

支持多人协作创作小说的插件。

## 核心功能

- 资源锁定(章节/角色)
- 任务分配和进度追踪
- 风格一致性自动检查
- Git 工作流集成

## 快速开始

1. 初始化: `/collab init`
2. 分配任务: `/collab assign chapter-05 @alice`
3. 锁定资源: `/collab lock chapter-05`
4. 编辑和提交
5. 检查风格: `/collab check chapters/chapter-05.md`
6. 合并: `/collab merge alice/chapter-05`

## 最佳实践

- 使用分支隔离工作
- 编辑前先锁定
- 定期合并,避免长期分支
- 关注风格检查建议
```

### Step 2: Commit

```bash
git add docs/plugins/collaboration.md
git commit -m "docs(p3): add collaboration plugin documentation"
```

---

## 验证标准

### 功能完整性
- [ ] 锁定/解锁机制工作正常
- [ ] 任务分配和状态追踪
- [ ] 风格一致性检查(至少3个维度)
- [ ] 合并辅助(检查+冲突提示)

### 可用性
- [ ] 命令清晰易用
- [ ] 状态输出可读性强
- [ ] 错误提示明确

### 可靠性
- [ ] 锁定超时自动释放
- [ ] 冲突检测准确
- [ ] 不会丢失数据

---

## 预估工时

- **Task 1:** Plugin 基础结构 - 3h
- **Task 2:** 锁定机制 - 5h
- **Task 3:** 任务分配和状态 - 4h
- **Task 4:** 风格检查 - 6h
- **Task 5:** 合并辅助 - 4h
- **Task 6:** 文档 - 2h

**总计:24 小时**

---

Closes: P3 优先级任务 #5
