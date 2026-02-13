# check-facts.ps1 - Story Facts 引用扫描脚本
# 扫描章节中的 story-facts 注释，生成引用报告

param(
    [switch]$Json,
    [string]$Story = ""
)

$ErrorActionPreference = "Stop"

# 获取项目根目录
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = (Get-Item (Join-Path $ScriptDir ".." "..")).FullName

# 检查 story-facts.json 是否存在
$FactsFile = Join-Path $ProjectRoot "spec" "tracking" "story-facts.json"
if (-not (Test-Path $FactsFile)) {
    if ($Json) {
        $errorObj = @{
            error = "story-facts.json not found"
            chapters = @()
            unreferenced_facts = @()
            unknown_ids = @()
        }
        Write-Output ($errorObj | ConvertTo-Json -Compress)
    } else {
        Write-Host "❌ 未找到 story-facts.json" -ForegroundColor Red
        Write-Host "   路径: $FactsFile"
        Write-Host "   请先使用 /facts 命令初始化"
    }
    exit 1
}

# 读取已注册的 fact ID 列表
try {
    $factsData = Get-Content $FactsFile -Raw | ConvertFrom-Json
    $registeredFacts = $factsData.facts | ForEach-Object { $_.id }
    if ($null -eq $registeredFacts) {
        $registeredFacts = @()
    } elseif ($registeredFacts -isnot [array]) {
        $registeredFacts = @($registeredFacts)
    }
} catch {
    if ($Json) {
        $errorObj = @{
            error = "Failed to parse story-facts.json: $_"
            chapters = @()
            unreferenced_facts = @()
            unknown_ids = @()
        }
        Write-Output ($errorObj | ConvertTo-Json -Compress)
    } else {
        Write-Host "❌ 无法解析 story-facts.json: $_" -ForegroundColor Red
    }
    exit 1
}

# 确定扫描目录
if ($Story) {
    $ContentDir = Join-Path $ProjectRoot "stories" $Story "content"
    if (-not (Test-Path $ContentDir)) {
        if ($Json) {
            $errorObj = @{
                error = "story directory not found: $Story"
                chapters = @()
                unreferenced_facts = @()
                unknown_ids = @()
            }
            Write-Output ($errorObj | ConvertTo-Json -Compress)
        } else {
            Write-Host "❌ 未找到故事目录: $Story" -ForegroundColor Red
        }
        exit 1
    }
    $chapterFiles = Get-ChildItem -Path $ContentDir -Filter "*.md" -File
} else {
    $storiesDir = Join-Path $ProjectRoot "stories"
    if (Test-Path $storiesDir) {
        $chapterFiles = Get-ChildItem -Path $storiesDir -Recurse -Filter "*.md" -File |
            Where-Object { $_.FullName -match '\\content\\[^\\]+\.md$' }
    } else {
        $chapterFiles = @()
    }
}

# 初始化数据结构
$chapterFacts = @{}  # key: 文件路径, value: fact IDs 数组
$factReferenced = @{}  # key: fact ID, value: $true if referenced
$unknownIdsMap = @{}  # key: unknown ID, value: $true

# 扫描章节文件
foreach ($file in $chapterFiles) {
    $content = Get-Content $file.FullName -Raw

    # 提取 <!-- story-facts: ... --> 注释
    # 正则：<!-- story-facts: (.+?) -->
    $match = [regex]::Match($content, '<!--\s*story-facts:\s*([^-]+?)\s*-->')

    if ($match.Success) {
        $factsLine = $match.Groups[1].Value.Trim()

        # 分割为数组并去除空格
        $factIds = $factsLine -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ }

        if ($factIds.Count -gt 0) {
            $cleanedIds = @()

            foreach ($id in $factIds) {
                $cleanedIds += $id

                # 检查是否已注册
                if ($registeredFacts -contains $id) {
                    $factReferenced[$id] = $true
                } else {
                    $unknownIdsMap[$id] = $true
                }
            }

            $chapterFacts[$file.FullName] = $cleanedIds
        }
    }
}

# 计算未被引用的事实
$unreferencedFacts = @()
foreach ($factId in $registeredFacts) {
    if (-not $factReferenced.ContainsKey($factId)) {
        $unreferencedFacts += $factId
    }
}

# 收集 unknown IDs
$unknownIds = @($unknownIdsMap.Keys)

# 输出结果
if ($Json) {
    # JSON 输出
    $chapters = @()
    foreach ($file in $chapterFacts.Keys) {
        $relPath = $file.Replace($ProjectRoot + "\", "").Replace("\", "/")
        $chapters += @{
            file = $relPath
            facts = $chapterFacts[$file]
        }
    }

    $result = @{
        chapters = $chapters
        unreferenced_facts = $unreferencedFacts
        unknown_ids = $unknownIds
    }

    Write-Output ($result | ConvertTo-Json -Depth 10 -Compress)
} else {
    # 人类可读输出
    Write-Host ""
    Write-Host "📊 Story Facts 引用报告" -ForegroundColor Cyan
    Write-Host ("━" * 40)
    Write-Host ""

    Write-Host "已注册事实: " -NoNewline
    Write-Host "$($registeredFacts.Count) 个" -ForegroundColor Green
    Write-Host "引用章节: " -NoNewline
    Write-Host "$($chapterFacts.Count) 个" -ForegroundColor Green
    Write-Host ""

    if ($chapterFacts.Count -gt 0) {
        Write-Host "章节引用:" -ForegroundColor White
        foreach ($file in $chapterFacts.Keys) {
            $filename = Split-Path -Leaf $file
            $facts = $chapterFacts[$file] -join ", "
            Write-Host "  " -NoNewline
            Write-Host $filename -ForegroundColor Blue -NoNewline
            Write-Host " → $facts"
        }
        Write-Host ""
    }

    if ($unreferencedFacts.Count -gt 0) {
        Write-Host "未被引用的事实: " -ForegroundColor Yellow -NoNewline
        Write-Host ($unreferencedFacts -join ", ")
        Write-Host ""
    } else {
        Write-Host "✓ 所有事实都被至少一个章节引用" -ForegroundColor Green
        Write-Host ""
    }

    if ($unknownIds.Count -gt 0) {
        Write-Host "未知 ID (章节中引用但未注册): " -ForegroundColor Red -NoNewline
        Write-Host ($unknownIds -join ", ")
        Write-Host "  提示: 可能是拼写错误或需要注册到 story-facts.json" -ForegroundColor Yellow
    } else {
        Write-Host "✓ 未检测到未知 ID" -ForegroundColor Green
    }
}
