#!/usr/bin/env pwsh
# 检查 novelws 的发布状态

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

Write-Host "`n🔍 检查 novelws 发布状态...`n" -ForegroundColor Cyan

# 1. 检查本地版本
Write-Host "📦 本地版本:" -ForegroundColor Yellow
$localVersion = (Get-Content package.json | ConvertFrom-Json).version
Write-Host "   $localVersion`n"

# 2. 检查 npm 上的最新版本
Write-Host "🌐 npm 仓库版本:" -ForegroundColor Yellow
try {
    $npmInfo = npm view novelws --json | ConvertFrom-Json
    $npmVersion = $npmInfo.version
    $publishTime = $npmInfo.time.modified

    Write-Host "   版本: $npmVersion"
    Write-Host "   发布时间: $publishTime"

    if ($localVersion -eq $npmVersion) {
        Write-Host "   ✅ 本地版本与 npm 版本一致`n" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  版本不匹配！本地: $localVersion, npm: $npmVersion`n" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ 无法获取 npm 信息: $_`n" -ForegroundColor Red
}

# 3. 检查 GitHub 标签
Write-Host "🏷️  GitHub 标签:" -ForegroundColor Yellow
try {
    $tags = git tag -l "v*" | Sort-Object -Descending | Select-Object -First 5
    foreach ($tag in $tags) {
        if ($tag -eq "v$localVersion") {
            Write-Host "   ✅ $tag (当前版本)" -ForegroundColor Green
        } else {
            Write-Host "   - $tag"
        }
    }
    Write-Host ""
} catch {
    Write-Host "   ❌ 无法获取 git 标签`n" -ForegroundColor Red
}

# 4. 检查 GitHub Actions 状态（需要 gh CLI）
Write-Host "🤖 GitHub Actions 状态:" -ForegroundColor Yellow
if (Get-Command gh -ErrorAction SilentlyContinue) {
    try {
        $runs = gh run list --workflow=publish.yml --limit 5 --json conclusion,status,name,createdAt,headBranch | ConvertFrom-Json

        if ($runs.Count -eq 0) {
            Write-Host "   ℹ️  未找到发布工作流运行记录`n" -ForegroundColor Gray
        } else {
            foreach ($run in $runs) {
                $status = $run.status
                $conclusion = $run.conclusion
                $date = $run.createdAt
                $branch = $run.headBranch

                $icon = switch ($conclusion) {
                    "success" { "✅" }
                    "failure" { "❌" }
                    "cancelled" { "⚠️" }
                    default { "🔄" }
                }

                Write-Host "   $icon $status - $conclusion ($date)"
            }
            Write-Host ""
        }
    } catch {
        Write-Host "   ❌ 无法获取 GitHub Actions 状态: $_`n" -ForegroundColor Red
    }
} else {
    Write-Host "   ℹ️  gh CLI 未安装，跳过检查" -ForegroundColor Gray
    Write-Host "   提示: 访问 https://github.com/binlee1990/novel-writer-skills/actions`n"
}

# 5. 验证安装
Write-Host "💻 验证安装命令:" -ForegroundColor Yellow
Write-Host "   npm install -g novelws@$localVersion`n"

# 6. 提供有用链接
Write-Host "🔗 相关链接:" -ForegroundColor Yellow
Write-Host "   npm 包页面: https://www.npmjs.com/package/novelws"
Write-Host "   GitHub Actions: https://github.com/binlee1990/novel-writer-skills/actions"
Write-Host "   GitHub Releases: https://github.com/binlee1990/novel-writer-skills/releases"
Write-Host ""

Write-Host "✨ 检查完成！`n" -ForegroundColor Green
