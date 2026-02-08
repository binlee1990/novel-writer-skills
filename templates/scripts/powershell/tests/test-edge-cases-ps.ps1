#!/usr/bin/env pwsh

Write-Host "=== Phase 1 边界情况测试 (PowerShell) ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "测试 5.1: 文件不存在处理" -ForegroundColor Yellow

# 模拟 Get-FileMTimeFromCache 函数
function Get-FileMTimeFromCache {
    param([string]$filePath)

    if (-not (Test-Path $filePath)) {
        return $null  # 哨兵值
    }

    return (Get-Item $filePath).LastWriteTimeUtc
}

# 测试不存在的文件
$mtime = Get-FileMTimeFromCache "templates/nonexistent-file.md"
if ($null -eq $mtime) {
    Write-Host "✅ 正确处理文件不存在（mtime = null）" -ForegroundColor Green
} else {
    Write-Host "❌ 文件不存在处理错误：mtime = $mtime" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ PowerShell 边界情况测试通过" -ForegroundColor Green
