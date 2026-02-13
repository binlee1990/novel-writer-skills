# Phase 3: 迁移系统 - 详细实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现 `/track --migrate` 命令，支持从单文件 tracking 到分片结构的迁移

**依赖:** Phase 1（分片目录结构）+ Phase 2（SQLite 初始化）

**Tech Stack:** PowerShell scripts, command template markdown

---

### Task 1: 创建迁移辅助 PowerShell 脚本

**Files:**
- Create: `templates/scripts/powershell/migrate-tracking.ps1`

**脚本功能：**
- 检测当前 tracking 模式（单文件 vs 已分片）
- 检测各 tracking 文件大小
- 备份当前文件到 `spec/tracking/backup/`
- 按卷边界拆分数据（需要 AI 配合，脚本只做文件操作）
- 验证迁移后的文件完整性

**实现：**

```powershell
# migrate-tracking.ps1
# 用法: migrate-tracking.ps1 [-Mode <auto|check|backup>] [-Json]

param(
    [ValidateSet('auto', 'check', 'backup')]
    [string]$Mode = 'check',
    [switch]$Json
)

$trackingDir = Join-Path $PWD 'spec' 'tracking'
$backupDir = Join-Path $trackingDir 'backup'
$summaryDir = Join-Path $trackingDir 'summary'
$volumesDir = Join-Path $trackingDir 'volumes'

$trackingFiles = @(
    'character-state.json',
    'plot-tracker.json',
    'timeline.json',
    'relationships.json'
)

function Get-TrackingStatus {
    $status = @{
        mode = 'single-file'
        files = @()
        totalSize = 0
        needsMigration = $false
    }

    if (Test-Path $volumesDir) {
        $status.mode = 'sharded'
        $volumes = Get-ChildItem $volumesDir -Directory | Where-Object { $_.Name -match '^vol-\d+$' }
        $status.volumes = $volumes.Count
        return $status
    }

    foreach ($file in $trackingFiles) {
        $filePath = Join-Path $trackingDir $file
        if (Test-Path $filePath) {
            $size = (Get-Item $filePath).Length
            $status.files += @{
                name = $file
                size = $size
                sizeKB = [math]::Round($size / 1024, 1)
            }
            $status.totalSize += $size
        }
    }

    # 50KB threshold
    $status.needsMigration = $status.totalSize -gt (50 * 1024)
    return $status
}

function Backup-TrackingFiles {
    $timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $backupPath = Join-Path $backupDir $timestamp

    if (-not (Test-Path $backupPath)) {
        New-Item -ItemType Directory -Path $backupPath -Force | Out-Null
    }

    foreach ($file in $trackingFiles) {
        $src = Join-Path $trackingDir $file
        if (Test-Path $src) {
            Copy-Item $src (Join-Path $backupPath $file)
        }
    }

    # Also backup story-facts.json
    $factsFile = Join-Path $trackingDir 'story-facts.json'
    if (Test-Path $factsFile) {
        Copy-Item $factsFile (Join-Path $backupPath 'story-facts.json')
    }

    return $backupPath
}

function Initialize-ShardedStructure {
    if (-not (Test-Path $summaryDir)) {
        New-Item -ItemType Directory -Path $summaryDir -Force | Out-Null
    }
    if (-not (Test-Path $volumesDir)) {
        New-Item -ItemType Directory -Path $volumesDir -Force | Out-Null
    }
}

# Main execution
switch ($Mode) {
    'check' {
        $status = Get-TrackingStatus
        if ($Json) {
            $status | ConvertTo-Json -Depth 5
        } else {
            Write-Host "Tracking mode: $($status.mode)"
            if ($status.mode -eq 'single-file') {
                Write-Host "Total size: $([math]::Round($status.totalSize / 1024, 1)) KB"
                Write-Host "Needs migration: $($status.needsMigration)"
                foreach ($f in $status.files) {
                    Write-Host "  $($f.name): $($f.sizeKB) KB"
                }
            } else {
                Write-Host "Volumes: $($status.volumes)"
            }
        }
    }
    'backup' {
        $backupPath = Backup-TrackingFiles
        if ($Json) {
            @{ backupPath = $backupPath } | ConvertTo-Json
        } else {
            Write-Host "Backup created at: $backupPath"
        }
    }
    'auto' {
        $status = Get-TrackingStatus
        if ($status.mode -eq 'sharded') {
            if ($Json) {
                @{ status = 'already-sharded' } | ConvertTo-Json
            } else {
                Write-Host "Already in sharded mode."
            }
            exit 0
        }

        # Backup first
        $backupPath = Backup-TrackingFiles

        # Create directory structure
        Initialize-ShardedStructure

        if ($Json) {
            @{
                status = 'ready'
                backupPath = $backupPath
                summaryDir = $summaryDir
                volumesDir = $volumesDir
                message = 'Directory structure created. AI should now split data by volume boundaries.'
            } | ConvertTo-Json -Depth 3
        } else {
            Write-Host "Backup: $backupPath"
            Write-Host "Structure created. AI should now split data by volume boundaries."
        }
    }
}
```

**提交：**
```powershell
git add templates/scripts/powershell/migrate-tracking.ps1
git commit -m "feat: add migrate-tracking.ps1 script for sharding migration"
```

---

### Task 2: 在 track.md 中添加 --migrate 模式

**Files:**
- Modify: `templates/commands/track.md`

**在 frontmatter 的 argument-hint 中添加 `--migrate`：**

```yaml
argument-hint: [--brief | --plot | --stats | --check | --fix | --sync | --migrate [--auto | --volumes "1-100,101-200"]]
```

**在命令文档末尾添加完整的 --migrate 章节：**

```markdown
---

## 🆕 分片迁移（--migrate）

当 tracking 文件过大（单文件超过 50KB）时，将数据从单文件模式迁移到分卷分片模式。

### 使用方法

```
/track --migrate              # 交互式迁移（AI 引导确认卷边界）
/track --migrate --auto       # 自动迁移（按 100 章一卷拆分）
/track --migrate --volumes "1-100,101-250,251-400"  # 自定义卷边界
```

### 迁移流程

#### 阶段 1：检测与备份

1. 运行脚本检测当前状态：
```powershell
powershell -File {SCRIPT_DIR}/migrate-tracking.ps1 -Mode check -Json
```

2. 如果已经是分片模式，提示用户并退出
3. 如果是单文件模式，运行备份：
```powershell
powershell -File {SCRIPT_DIR}/migrate-tracking.ps1 -Mode backup -Json
```

#### 阶段 2：确定卷边界

**--auto 模式：**
- 读取 `plot-tracker.json` 的 `checkpoints.volumeEnd` 确定已有的卷边界
- 如果没有卷边界信息，按每 100 章一卷自动划分
- 最后一卷可以不满 100 章

**--volumes 模式：**
- 解析用户提供的卷边界字符串，如 `"1-100,101-250,251-400"`
- 验证边界连续且覆盖所有已写章节

**交互式模式（默认）：**
- 读取 `plot-tracker.json` 和 `creative-plan.md`
- 分析情节弧线，建议合理的卷边界
- 向用户展示建议并确认

#### 阶段 3：数据拆分

运行脚本创建目录结构：
```powershell
powershell -File {SCRIPT_DIR}/migrate-tracking.ps1 -Mode auto -Json
```

然后按卷边界拆分每个 tracking 文件：

**character-state.json 拆分规则：**
- `protagonist` 复制到每个卷（状态更新为该卷末尾的状态）
- `supportingCharacters` 按 `lastSeen.chapter` 分配到对应卷
- `appearanceTracking` 按 `chapter` 分配到对应卷
- `characterGroups` 每卷独立维护

**timeline.json 拆分规则：**
- `events` 按 `chapter` 分配到对应卷
- `storyTime` 每卷记录该卷的时间范围
- `parallelEvents` 按时间点分配
- `anomalies` 分配到发现该异常的卷

**relationships.json 拆分规则：**
- `characters` 复制到每个卷（只保留该卷活跃的角色）
- `history` 按 `chapter` 分配到对应卷
- `factions` 复制到每个卷（状态更新为该卷末尾）

**plot-tracker.json 拆分规则：**
- `foreshadowing` 按 `planted.chapter` 分配到对应卷
- 跨卷未解决的伏笔在后续卷中保留引用
- `plotlines` 每卷记录该卷的进展
- `checkpoints` 按卷分配

将拆分后的数据写入 `spec/tracking/volumes/vol-XX/` 对应文件。

#### 阶段 4：生成全局摘要

基于拆分后的数据，生成 4 个摘要文件到 `spec/tracking/summary/`：

**characters-summary.json：**
- 遍历所有卷的 character-state.json
- active：最后一卷中仍活跃的角色
- archived：已退场/死亡的角色
- 统计 totalCount 和 activeCount

**plot-summary.json：**
- 汇总所有卷的伏笔状态
- unresolvedForeshadowing：所有 status=active 的伏笔
- resolvedCount / totalPlanted 统计

**timeline-summary.json：**
- 提取每卷的关键里程碑事件
- 记录故事时间范围

**volume-summaries.json：**
- 每卷生成一条摘要记录
- 包含：id, title, chapters, wordCount, keyEvents, unresolvedPlots, newCharacters, exitedCharacters

#### 阶段 5：初始化 SQLite（如果 MCP 可用）

如果检测到 novelws-mcp 已安装：
- 调用 MCP 工具 `sync_from_json` 将分片数据导入 SQLite
- 调用 `sync_status` 验证同步结果

如果 MCP 不可用，跳过此步骤。

#### 阶段 6：验证与清理

1. 验证每个卷的文件都存在且 JSON 格式正确
2. 验证摘要文件的统计数据与分卷数据一致
3. 确认无误后，删除原始单文件（备份已保存）
4. 输出迁移报告：
   - 迁移前：单文件模式，总大小 XXX KB
   - 迁移后：N 卷分片，每卷平均 XX KB
   - 备份位置：spec/tracking/backup/YYYYMMDD-HHMMSS/

### 错误处理

- 任何步骤失败时，提示用户从备份恢复：
  ```
  迁移失败。备份文件在 spec/tracking/backup/YYYYMMDD-HHMMSS/
  可以手动将备份文件复制回 spec/tracking/ 恢复原状。
  ```
- 不自动删除备份，由用户手动清理
```

**提交：**
```powershell
git add templates/commands/track.md
git commit -m "feat: add --migrate mode to /track command for sharding migration"
```

---

### Task 3: 编写迁移测试

**Files:**
- Create: `tests/unit/tracking/migration.test.ts`

**测试用例：**

1. **migrate-tracking.ps1 check 模式**：创建不同大小的 tracking 文件，验证 needsMigration 判断
2. **migrate-tracking.ps1 backup 模式**：验证备份目录创建和文件复制
3. **migrate-tracking.ps1 auto 模式**：验证目录结构创建
4. **track.md 模板验证**：验证 --migrate 参数在 argument-hint 中存在

```typescript
import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

describe('migrate-tracking.ps1', () => {
  let tempDir: string;
  let trackingDir: string;
  let scriptPath: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nws-migrate-'));
    trackingDir = path.join(tempDir, 'spec', 'tracking');
    fs.ensureDirSync(trackingDir);
    scriptPath = path.resolve(__dirname, '../../../templates/scripts/powershell/migrate-tracking.ps1');
  });

  afterEach(async () => {
    try { await fs.remove(tempDir); } catch { /* ignore */ }
  });

  it('should detect single-file mode and report sizes', () => {
    // Create a small tracking file
    fs.writeJsonSync(path.join(trackingDir, 'character-state.json'), { protagonist: { name: 'test' } });

    const output = execSync(
      `powershell -File "${scriptPath}" -Mode check -Json`,
      { cwd: tempDir, encoding: 'utf-8' }
    );

    const result = JSON.parse(output);
    expect(result.mode).toBe('single-file');
    expect(result.needsMigration).toBe(false);
  });

  it('should detect need for migration when files are large', () => {
    // Create a large tracking file (> 50KB)
    const largeData = { data: 'x'.repeat(60 * 1024) };
    fs.writeJsonSync(path.join(trackingDir, 'character-state.json'), largeData);

    const output = execSync(
      `powershell -File "${scriptPath}" -Mode check -Json`,
      { cwd: tempDir, encoding: 'utf-8' }
    );

    const result = JSON.parse(output);
    expect(result.needsMigration).toBe(true);
  });

  it('should create backup on backup mode', () => {
    fs.writeJsonSync(path.join(trackingDir, 'character-state.json'), { test: true });

    const output = execSync(
      `powershell -File "${scriptPath}" -Mode backup -Json`,
      { cwd: tempDir, encoding: 'utf-8' }
    );

    const result = JSON.parse(output);
    expect(fs.existsSync(result.backupPath)).toBe(true);
    expect(fs.existsSync(path.join(result.backupPath, 'character-state.json'))).toBe(true);
  });

  it('should create directory structure on auto mode', () => {
    fs.writeJsonSync(path.join(trackingDir, 'character-state.json'), { test: true });

    const output = execSync(
      `powershell -File "${scriptPath}" -Mode auto -Json`,
      { cwd: tempDir, encoding: 'utf-8' }
    );

    const result = JSON.parse(output);
    expect(result.status).toBe('ready');
    expect(fs.existsSync(path.join(trackingDir, 'summary'))).toBe(true);
    expect(fs.existsSync(path.join(trackingDir, 'volumes'))).toBe(true);
  });
});

describe('track.md --migrate', () => {
  it('should include --migrate in argument-hint', () => {
    const trackMd = fs.readFileSync(
      path.resolve(__dirname, '../../../templates/commands/track.md'), 'utf-8'
    );
    expect(trackMd).toContain('--migrate');
  });
});
```

**运行测试：**
```powershell
npx jest --config jest.config.cjs tests/unit/tracking/migration.test.ts -v
```

**提交：**
```powershell
git add tests/unit/tracking/migration.test.ts
git commit -m "test: add migration system tests for track --migrate"
```
