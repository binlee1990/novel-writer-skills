#!/usr/bin/env pwsh

# 加载脚本（使用 dot sourcing）
. .\templates\scripts\powershell\check-writing-state.ps1

Write-Host "=== 测试 PowerShell 缓存功能 ===" -ForegroundColor Cyan
Write-Host ""

# 测试 1: 存在的文件
Write-Host "测试 1: 存在的文件" -ForegroundColor Yellow
Preload-FileMTimes -FilePathList @("resources/config/keyword-mappings.json")
if (Test-FileExistsCached "resources/config/keyword-mappings.json") {
    Write-Host "✅ 存在的文件检测正确" -ForegroundColor Green
} else {
    Write-Host "❌ 存在的文件检测错误" -ForegroundColor Red
}

# 测试 2: 不存在的文件
Write-Host ""
Write-Host "测试 2: 不存在的文件" -ForegroundColor Yellow
Preload-FileMTimes -FilePathList @("templates/nonexistent-file.md")
if (Test-FileExistsCached "templates/nonexistent-file.md") {
    Write-Host "❌ 不存在的文件被误判为存在" -ForegroundColor Red
} else {
    Write-Host "✅ 不存在的文件检测正确" -ForegroundColor Green
}

# 测试 3: 检查缓存值
Write-Host ""
Write-Host "测试 3: 检查缓存值" -ForegroundColor Yellow
$mtimeExisting = Get-FileMTimeFromCache "resources/config/keyword-mappings.json"
$mtimeMissing = Get-FileMTimeFromCache "templates/nonexistent-file.md"

Write-Host "存在文件的 mtime: $mtimeExisting"
Write-Host "不存在文件的 mtime: $mtimeMissing (应该为 null)"

if ($null -ne $mtimeExisting -and $null -eq $mtimeMissing) {
    Write-Host "✅ 缓存值语义正确" -ForegroundColor Green
} else {
    Write-Host "❌ 缓存值语义错误" -ForegroundColor Red
}

# 测试 4: 批量预加载
Write-Host ""
Write-Host "测试 4: 批量预加载混合文件" -ForegroundColor Yellow
$mixedFiles = @(
    "resources/config/keyword-mappings.json"   # 存在
    "templates/nonexistent1.md"                # 不存在
    "templates/nonexistent2.md"                # 不存在
)
Preload-FileMTimes -FilePathList $mixedFiles

$existsCount = 0
$missingCount = 0
foreach ($file in $mixedFiles) {
    if (Test-FileExistsCached $file) {
        $existsCount++
    } else {
        $missingCount++
    }
}

Write-Host "检测到存在的文件: $existsCount (期望 1)"
Write-Host "检测到不存在的文件: $missingCount (期望 2)"

if ($existsCount -eq 1 -and $missingCount -eq 2) {
    Write-Host "✅ 批量预加载检测正确" -ForegroundColor Green
} else {
    Write-Host "❌ 批量预加载检测错误" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== 测试完成 ===" -ForegroundColor Cyan
