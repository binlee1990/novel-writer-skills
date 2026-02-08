#!/usr/bin/env pwsh

Write-Host "=== PowerShell 缓存性能测试 ===" -ForegroundColor Cyan
Write-Host ""

# 测试 1: 基准测试（1 个文件 × 100 次）
Write-Host "测试 1: 基准测试（1 个文件 × 100 次）" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

Write-Host "无缓存版本:"
$sw1 = [Diagnostics.Stopwatch]::StartNew()
for ($i = 1; $i -le 100; $i++) {
    $null = Test-Path "templates/config/keyword-mappings.json" -PathType Leaf
    $null = Get-Item "templates/config/keyword-mappings.json" -ErrorAction SilentlyContinue
}
$sw1.Stop()
Write-Host "  总时间: $($sw1.ElapsedMilliseconds) ms"

. .\templates\scripts\powershell\check-writing-state.ps1
Write-Host "有缓存版本:"
$sw2 = [Diagnostics.Stopwatch]::StartNew()
Preload-FileMTimes -FilePathList @("templates/config/keyword-mappings.json")
for ($i = 1; $i -le 100; $i++) {
    $null = Test-FileExistsCached "templates/config/keyword-mappings.json"
}
$sw2.Stop()
Write-Host "  总时间: $($sw2.ElapsedMilliseconds) ms"
Write-Host "  性能提升: $([Math]::Round($sw1.ElapsedMilliseconds / $sw2.ElapsedMilliseconds, 2))x" -ForegroundColor Green

Write-Host ""

# 测试 2: 真实场景（11 个文件 × 3 次检查）
Write-Host "测试 2: 真实场景（11 个文件 × 3 次检查）" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

# 构造文件列表（与实际脚本一致）
$ProjectRoot = Get-Location
$testFileList = @(
    "templates/knowledge-base/craft/dialogue.md"
    "templates/knowledge-base/craft/scene-structure.md"
    "templates/knowledge-base/craft/character-arc.md"
    "templates/knowledge-base/craft/pacing.md"
    "templates/knowledge-base/craft/show-not-tell.md"
    "templates/skills/writing-techniques/dialogue-techniques/SKILL.md"
    "templates/skills/writing-techniques/scene-structure/SKILL.md"
    "templates/skills/writing-techniques/character-arc/SKILL.md"
    "templates/skills/writing-techniques/pacing-control/SKILL.md"
    "templates/skills/quality-assurance/consistency-checker/SKILL.md"
    "templates/config/keyword-mappings.json"  # 替代 specification.md（测试文件）
)

# 无缓存版本
Write-Host "无缓存版本（11 个文件 × 3 次）:"
$sw3 = [Diagnostics.Stopwatch]::StartNew()
for ($i = 1; $i -le 3; $i++) {
    foreach ($file in $testFileList) {
        $null = Test-Path $file -PathType Leaf
        $null = Get-Item $file -ErrorAction SilentlyContinue
    }
}
$sw3.Stop()
Write-Host "  总时间: $($sw3.ElapsedMilliseconds) ms"

# 有缓存版本
Write-Host "有缓存版本（1 次预加载 + 3 次查询）:"
$sw4 = [Diagnostics.Stopwatch]::StartNew()
Preload-FileMTimes -FilePathList $testFileList
for ($i = 1; $i -le 3; $i++) {
    foreach ($file in $testFileList) {
        $null = Test-FileExistsCached $file
    }
}
$sw4.Stop()
Write-Host "  总时间: $($sw4.ElapsedMilliseconds) ms"
Write-Host "  预加载耗时: ~$([Math]::Round($sw4.ElapsedMilliseconds * 0.8, 1)) ms (估算)"
Write-Host "  查询耗时: ~$([Math]::Round($sw4.ElapsedMilliseconds * 0.2, 1)) ms (估算)"
Write-Host "  性能提升: $([Math]::Round($sw3.ElapsedMilliseconds / $sw4.ElapsedMilliseconds, 2))x" -ForegroundColor Green

Write-Host ""
Write-Host "=== 测试完成 ===" -ForegroundColor Cyan
