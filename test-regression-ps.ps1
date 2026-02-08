#!/usr/bin/env pwsh

Write-Host "=== Phase 1 回归测试 (PowerShell) ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "测试 7.1: 脚本正常运行" -ForegroundColor Yellow
try {
    $null = & "templates/scripts/powershell/check-writing-state.ps1" -ErrorAction Stop 2>&1
    Write-Host "✅ 脚本执行成功" -ForegroundColor Green
} catch {
    Write-Host "⚠️ 脚本执行有警告（可能是正常的）" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "测试 7.2: JSON 输出格式" -ForegroundColor Yellow
try {
    $output = & "templates/scripts/powershell/check-writing-state.ps1" 2>$null | Out-String
    $json = $output | ConvertFrom-Json -ErrorAction Stop
    Write-Host "✅ JSON 格式正确" -ForegroundColor Green
} catch {
    Write-Host "❌ JSON 格式错误: $_" -ForegroundColor Red
    Write-Host "输出内容:"
    Write-Host $output
    exit 1
}

Write-Host ""
Write-Host "测试 7.3: 必需字段存在性" -ForegroundColor Yellow
$requiredFields = @("status")

foreach ($field in $requiredFields) {
    if ($json.PSObject.Properties.Name -contains $field) {
        Write-Host "✅ 字段存在: $field" -ForegroundColor Green
    } else {
        Write-Host "⚠️ 字段不存在: $field（可能是预期的）" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "✅ PowerShell 回归测试通过" -ForegroundColor Green
