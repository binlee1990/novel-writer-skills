# 检查写作状态脚本
# 用于 /write 命令

param(
    [switch]$Json
)

# ============================================
# Phase 1: 文件时间戳缓存
# ============================================
#
# 缓存值约定:
# - LastWriteTime 对象: 文件存在，值为修改时间
# - $null: 文件不存在（预加载时已确认）
# - 未缓存: 键不存在于 HashTable 中

# 缓存存储（HashTable）
$script:FileMTimeCache = @{}
$script:PreloadCompleted = $false

# 预加载文件修改时间到缓存
# 参数: FilePathList (string[]) - 文件路径列表
# 说明: 预加载策略避免多次磁盘访问
function Preload-FileMTimes {
    param(
        [Parameter(Mandatory=$true)]
        [string[]]$FilePathList
    )

    foreach ($filePath in $FilePathList) {
        # 文件不存在：记录为 $null
        if (-not (Test-Path $filePath -PathType Leaf)) {
            $script:FileMTimeCache[$filePath] = $null
            continue
        }

        # 读取文件时间戳
        try {
            $fileInfo = Get-Item $filePath -ErrorAction Stop
            $script:FileMTimeCache[$filePath] = $fileInfo.LastWriteTime
        } catch {
            # Get-Item 失败：记录为空 DateTime
            $script:FileMTimeCache[$filePath] = [DateTime]::MinValue
        }
    }
}

# 获取文件修改时间（从缓存）
# 参数: FilePath (string) - 文件路径
# 返回: DateTime 对象，或 $null（文件不存在），或 MinValue（读取失败）
function Get-FileMTimeFromCache {
    param(
        [Parameter(Mandatory=$true)]
        [string]$FilePath
    )

    if ($script:FileMTimeCache.ContainsKey($FilePath)) {
        return $script:FileMTimeCache[$FilePath]
    }

    # 未缓存：返回 MinValue
    return [DateTime]::MinValue
}

# 检查文件是否存在（基于缓存）
# 参数: FilePath (string) - 文件路径
# 返回: $true（文件存在），$false（文件不存在或未缓存）
function Test-FileExistsCached {
    param(
        [Parameter(Mandatory=$true)]
        [string]$FilePath
    )

    $mtime = Get-FileMTimeFromCache $FilePath

    # $null: 文件不存在
    # MinValue: Get-Item 失败或未缓存
    # 其他 DateTime: 文件存在
    return ($null -ne $mtime -and $mtime -ne [DateTime]::MinValue)
}

# 导入通用函数
. "$PSScriptRoot\common.ps1"

# 获取项目根目录
$ProjectRoot = Get-ProjectRoot
Set-Location $ProjectRoot

# 获取当前故事
$StoryName = Get-ActiveStory
$StoryDir = Join-Path "stories" $StoryName

# 预加载文件时间戳（性能优化）
if (-not $script:PreloadCompleted) {
    $preloadFileList = @(
        # 知识库文件
        (Join-Path $ProjectRoot "templates/knowledge-base/craft/dialogue.md")
        (Join-Path $ProjectRoot "templates/knowledge-base/craft/scene-structure.md")
        (Join-Path $ProjectRoot "templates/knowledge-base/craft/character-arc.md")
        (Join-Path $ProjectRoot "templates/knowledge-base/craft/pacing.md")
        (Join-Path $ProjectRoot "templates/knowledge-base/craft/show-not-tell.md")
        # Skill 文件
        (Join-Path $ProjectRoot "templates/skills/writing-techniques/dialogue-techniques/SKILL.md")
        (Join-Path $ProjectRoot "templates/skills/writing-techniques/scene-structure/SKILL.md")
        (Join-Path $ProjectRoot "templates/skills/writing-techniques/character-arc/SKILL.md")
        (Join-Path $ProjectRoot "templates/skills/writing-techniques/pacing-control/SKILL.md")
        (Join-Path $ProjectRoot "templates/skills/quality-assurance/consistency-checker/SKILL.md")
        # 规格文件
        (Join-Path $StoryDir "specification.md")
    )

    Preload-FileMTimes -FilePathList $preloadFileList
    $script:PreloadCompleted = $true
}

# ==================== 资源加载报告生成函数 ====================

function Generate-LoadReport {
    param (
        [string]$StoryDir
    )

    $specFile = Join-Path $StoryDir "specification.md"
    $warnings = @()

    # 默认加载所有资源
    $knowledgeBaseFiles = @(
        "craft/dialogue.md",
        "craft/scene-structure.md",
        "craft/character-arc.md",
        "craft/pacing.md",
        "craft/show-not-tell.md"
    )

    $skillsFiles = @(
        "writing-techniques/dialogue-techniques",
        "writing-techniques/scene-structure",
        "writing-techniques/character-arc",
        "writing-techniques/pacing-control",
        "quality-assurance/consistency-checker"
    )

    $disabledResources = @()
    $hasConfig = $false

    if (Test-Path $specFile) {
        $content = Get-Content $specFile -Raw
        if ($content -match "resource-loading:") {
            $hasConfig = $true
        }
    }

    # 检查文件存在性（使用缓存）
    foreach ($kb in $knowledgeBaseFiles) {
        $fullPath = Join-Path $ProjectRoot "templates/knowledge-base/$kb"
        if (-not (Test-FileExistsCached $fullPath)) {
            $warnings += "知识库文件不存在: $kb"
        }
    }

    foreach ($skill in $skillsFiles) {
        $fullPath = Join-Path $ProjectRoot "templates/skills/$skill/SKILL.md"
        if (-not (Test-FileExistsCached $fullPath)) {
            $warnings += "Skill 文件不存在: $skill/SKILL.md"
        }
    }

    # Phase 2: 检测缓存命中（基于 specification.md 是否已被缓存加载且有效）
    # 仅当文件在缓存中且成功读取时，才视为"缓存命中"
    # 缓存语义: $null = 文件不存在, MinValue = stat 失败, DateTime = 成功读取
    $cached = $script:FileMTimeCache.ContainsKey($specFile) -and
              $script:FileMTimeCache[$specFile] -ne $null -and
              $script:FileMTimeCache[$specFile] -ne [DateTime]::MinValue
    $cacheHint = "此报告基于缓存生成（specification.md 未修改）。AI 可复用本次会话中已加载的资源。"

    # 生成 JSON
    $report = @{
        status = "ready"
        timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        has_config = $hasConfig
        cached = $cached
        session_cache_enabled = $true
        resources = @{
            "knowledge-base" = $knowledgeBaseFiles
            skills = $skillsFiles
            disabled = $disabledResources
        }
        warnings = $warnings
    }

    # 仅在缓存命中时添加 cache_hint
    if ($cached) {
        $report.cache_hint = $cacheHint
    }

    return $report | ConvertTo-Json -Depth 10
}

# JSON 模式
if ($Json) {
    try {
        $report = Generate-LoadReport -StoryDir $StoryDir
        Write-Output $report
        exit 0
    } catch {
        Write-Error "生成资源加载报告失败: $_"
        exit 1
    }
}

Write-Host "写作状态检查"
Write-Host "============"
Write-Host "当前故事：$StoryName"
Write-Host ""

# 检查方法论文档
function Test-MethodologyDocs {
    $missing = @()

    if (-not (Test-Path ".specify\memory\constitution.md")) {
        $missing += "宪法"
    }
    if (-not (Test-Path "$StoryDir\specification.md")) {
        $missing += "规格"
    }
    if (-not (Test-Path "$StoryDir\creative-plan.md")) {
        $missing += "计划"
    }
    if (-not (Test-Path "$StoryDir\tasks.md")) {
        $missing += "任务"
    }

    if ($missing.Count -gt 0) {
        Write-Host "⚠️ 缺少以下基准文档：" -ForegroundColor Yellow
        foreach ($doc in $missing) {
            Write-Host "  - $doc"
        }
        Write-Host ""
        Write-Host "建议按照七步方法论完成前置步骤："
        Write-Host "1. /constitution - 创建创作宪法"
        Write-Host "2. /specify - 定义故事规格"
        Write-Host "3. /clarify - 澄清关键决策"
        Write-Host "4. /plan - 制定创作计划"
        Write-Host "5. /tasks - 生成任务清单"
        return $false
    }

    Write-Host "✅ 方法论文档完整" -ForegroundColor Green
    return $true
}

# 检查待写作任务
function Test-PendingTasks {
    $tasksFile = "$StoryDir\tasks.md"

    if (-not (Test-Path $tasksFile)) {
        Write-Host "❌ 任务文件不存在" -ForegroundColor Red
        return $false
    }

    # 统计任务状态
    $content = Get-Content $tasksFile -Raw
    $pending = ([regex]::Matches($content, '^- \[ \]', [System.Text.RegularExpressions.RegexOptions]::Multiline)).Count
    $inProgress = ([regex]::Matches($content, '^- \[~\]', [System.Text.RegularExpressions.RegexOptions]::Multiline)).Count
    $completed = ([regex]::Matches($content, '^- \[x\]', [System.Text.RegularExpressions.RegexOptions]::Multiline)).Count

    Write-Host ""
    Write-Host "任务状态："
    Write-Host "  待开始：$pending"
    Write-Host "  进行中：$inProgress"
    Write-Host "  已完成：$completed"

    if ($pending -eq 0 -and $inProgress -eq 0) {
        Write-Host ""
        Write-Host "🎉 所有任务已完成！" -ForegroundColor Green
        Write-Host "建议运行 /analyze 进行综合验证"
        return $true
    }

    # 显示下一个待写作任务
    Write-Host ""
    Write-Host "下一个写作任务："
    $lines = $content -split "`n"
    foreach ($line in $lines) {
        if ($line -match '^- \[ \]') {
            Write-Host $line
            break
        }
    }

    return $true
}

# 检查已完成内容
function Test-CompletedContent {
    $contentDir = "$StoryDir\content"

    if (Test-Path $contentDir) {
        $mdFiles = Get-ChildItem "$contentDir\*.md" -ErrorAction SilentlyContinue
        $chapterCount = $mdFiles.Count

        if ($chapterCount -gt 0) {
            Write-Host ""
            Write-Host "已完成章节：$chapterCount"
            Write-Host "最近写作："

            $recentFiles = $mdFiles |
                Sort-Object LastWriteTime -Descending |
                Select-Object -First 3

            foreach ($file in $recentFiles) {
                Write-Host "  - $($file.Name)"
            }
        }
    }
    else {
        Write-Host ""
        Write-Host "尚未开始写作"
    }
}

# ==================== 新增：资源加载检查函数 ====================

function Check-KnowledgeBaseAvailable {
    $missing = @()
    $available = @()

    $craftFiles = @(
        "templates/knowledge-base/craft/dialogue.md",
        "templates/knowledge-base/craft/scene-structure.md",
        "templates/knowledge-base/craft/character-arc.md",
        "templates/knowledge-base/craft/pacing.md",
        "templates/knowledge-base/craft/show-not-tell.md"
    )

    foreach ($file in $craftFiles) {
        $fullPath = Join-Path $ProjectRoot $file

        # 使用缓存检查文件是否存在
        if (Test-FileExistsCached $fullPath) {
            $available += $file
        } else {
            $missing += $file
        }
    }

    if ($missing.Count -gt 0) {
        Write-Host "⚠️ 缺少以下 knowledge-base 文件："
        foreach ($file in $missing) {
            Write-Host "  - $file"
        }
        return $false
    }

    Write-Host "✅ Knowledge-base 文件完整 ($($available.Count) 个)"
    return $true
}

function Check-SkillsAvailable {
    $missing = @()
    $available = @()

    $skillDirs = @(
        "templates/skills/writing-techniques/dialogue-techniques",
        "templates/skills/writing-techniques/scene-structure",
        "templates/skills/writing-techniques/character-arc",
        "templates/skills/writing-techniques/pacing-control"
    )

    foreach ($dir in $skillDirs) {
        $skillPath = Join-Path $ProjectRoot "$dir/SKILL.md"

        # 使用缓存检查文件是否存在
        if (Test-FileExistsCached $skillPath) {
            $available += $dir
        } else {
            $missing += $dir
        }
    }

    if ($missing.Count -gt 0) {
        Write-Host "⚠️ 缺少以下 skills："
        foreach ($dir in $missing) {
            Write-Host "  - $dir/SKILL.md"
        }
        return $false
    }

    Write-Host "✅ Skills 完整 ($($available.Count) 个)"
    return $true
}

# 主流程
if (-not (Test-MethodologyDocs)) {
    exit 1
}

Test-PendingTasks | Out-Null
Test-CompletedContent

Write-Host ""
Write-Host "准备就绪，可以开始写作"
