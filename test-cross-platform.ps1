#!/usr/bin/env pwsh

Write-Host "=== Phase 1 跨平台兼容性测试 (PowerShell) ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "【系统信息】" -ForegroundColor Yellow
Write-Host "操作系统: $($PSVersionTable.OS)"
Write-Host "PowerShell 版本: $($PSVersionTable.PSVersion)"
Write-Host "平台: $($PSVersionTable.Platform)"
Write-Host ""

Write-Host "【路径处理测试】" -ForegroundColor Yellow
# 测试 Join-Path 跨平台兼容性
$testPath = Join-Path "templates" "config" "keyword-mappings.json"
if (Test-Path $testPath) {
    Write-Host "✅ 路径处理正常: $testPath" -ForegroundColor Green
} else {
    Write-Host "❌ 路径处理失败: $testPath" -ForegroundColor Red
    exit 1
}

Write-Host ""
if ($PSVersionTable.PSVersion.Major -ge 7) {
    Write-Host "✅ 跨平台兼容性测试通过（PowerShell 7+ 跨平台）" -ForegroundColor Green
} else {
    Write-Host "✅ 跨平台兼容性测试通过（Windows PowerShell 5.1）" -ForegroundColor Green
}
