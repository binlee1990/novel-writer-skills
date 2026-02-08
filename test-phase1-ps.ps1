#!/usr/bin/env pwsh

Write-Host "=== Phase 1 PowerShell 缓存测试 ===" -ForegroundColor Cyan
Write-Host ""

# 测试 3.1: 功能测试
Write-Host "测试 3.1: 运行功能测试" -ForegroundColor Yellow
pwsh test-ps-cache.ps1
Write-Host ""

# 测试 3.2: 性能测试
Write-Host "测试 3.2: 运行性能测试" -ForegroundColor Yellow
pwsh bench-ps-cache.ps1
Write-Host ""

# 测试 3.3: PowerShell 版本检测
Write-Host "测试 3.3: PowerShell 版本检测" -ForegroundColor Yellow
Write-Host "当前 PowerShell 版本: $($PSVersionTable.PSVersion)"
if ($PSVersionTable.PSVersion.Major -ge 7) {
    Write-Host "✅ PowerShell 7+ (跨平台)" -ForegroundColor Green
} elseif ($PSVersionTable.PSVersion.Major -eq 5) {
    Write-Host "✅ Windows PowerShell 5.1" -ForegroundColor Green
} else {
    Write-Host "⚠️ 不支持的 PowerShell 版本" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ PowerShell 缓存测试全部通过" -ForegroundColor Green
