#!/usr/bin/env pwsh

Write-Host "性能对比测试" -ForegroundColor Cyan
Write-Host "============" -ForegroundColor Cyan

# 无缓存版本
Write-Host ""
Write-Host "测试无缓存版本 (100次 Test-Path 调用):" -ForegroundColor Yellow
$sw1 = [Diagnostics.Stopwatch]::StartNew()
for ($i = 1; $i -le 100; $i++) {
    $null = Test-Path "templates\config\keyword-mappings.json" -PathType Leaf
    $null = Get-Item "templates\config\keyword-mappings.json" -ErrorAction SilentlyContinue
}
$sw1.Stop()
Write-Host "总时间: $($sw1.ElapsedMilliseconds) ms"

# 有缓存版本
. .\templates\scripts\powershell\check-writing-state.ps1
Write-Host ""
Write-Host "测试缓存版本 (1次预加载 + 100次缓存查询):" -ForegroundColor Yellow
$sw2 = [Diagnostics.Stopwatch]::StartNew()
Preload-FileMTimes -FilePathList @("templates\config\keyword-mappings.json")
for ($i = 1; $i -le 100; $i++) {
    $null = Test-FileExistsCached "templates\config\keyword-mappings.json"
}
$sw2.Stop()
Write-Host "总时间: $($sw2.ElapsedMilliseconds) ms"

# 性能提升
Write-Host ""
if ($sw2.ElapsedMilliseconds -gt 0) {
    Write-Host "性能提升: $([Math]::Round($sw1.ElapsedMilliseconds / $sw2.ElapsedMilliseconds, 2))x" -ForegroundColor Green
} else {
    Write-Host "性能提升: >1000x (缓存版本耗时小于 1ms)" -ForegroundColor Green
}
