# migrate-tracking.ps1
# 用法: migrate-tracking.ps1 [-Mode <auto|check|backup>] [-Json]

param(
    [ValidateSet('auto', 'check', 'backup')]
    [string]$Mode = 'check',
    [switch]$Json
)

$trackingDir = Join-Path (Join-Path $PWD 'spec') 'tracking'
$backupDir = Join-Path $trackingDir 'backup'
$summaryDir = Join-Path $trackingDir 'summary'
$volumesDir = Join-Path $trackingDir 'volumes'

$trackingFiles = @(
    'character-state.json',
    'plot-tracker.json',
    'timeline.json',
    'relationships.json'
)

function Get-TrackingStatus {
    $status = @{
        mode = 'single-file'
        files = @()
        totalSize = 0
        needsMigration = $false
    }

    if (Test-Path $volumesDir) {
        $status.mode = 'sharded'
        $volumes = Get-ChildItem $volumesDir -Directory | Where-Object { $_.Name -match '^vol-\d+$' }
        $status.volumes = @($volumes).Count
        return $status
    }

    foreach ($file in $trackingFiles) {
        $filePath = Join-Path $trackingDir $file
        if (Test-Path $filePath) {
            $size = (Get-Item $filePath).Length
            $status.files += @{
                name = $file
                size = $size
                sizeKB = [math]::Round($size / 1024, 1)
            }
            $status.totalSize += $size
        }
    }

    # 50KB threshold
    $status.needsMigration = $status.totalSize -gt (50 * 1024)
    return $status
}

function Backup-TrackingFiles {
    $timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $backupPath = Join-Path $backupDir $timestamp

    if (-not (Test-Path $backupPath)) {
        New-Item -ItemType Directory -Path $backupPath -Force | Out-Null
    }

    foreach ($file in $trackingFiles) {
        $src = Join-Path $trackingDir $file
        if (Test-Path $src) {
            Copy-Item $src (Join-Path $backupPath $file)
        }
    }

    # Also backup story-facts.json
    $factsFile = Join-Path $trackingDir 'story-facts.json'
    if (Test-Path $factsFile) {
        Copy-Item $factsFile (Join-Path $backupPath 'story-facts.json')
    }

    return $backupPath
}

function Initialize-ShardedStructure {
    if (-not (Test-Path $summaryDir)) {
        New-Item -ItemType Directory -Path $summaryDir -Force | Out-Null
    }
    if (-not (Test-Path $volumesDir)) {
        New-Item -ItemType Directory -Path $volumesDir -Force | Out-Null
    }
}

# Main execution
switch ($Mode) {
    'check' {
        $status = Get-TrackingStatus
        if ($Json) {
            $status | ConvertTo-Json -Depth 5
        } else {
            Write-Host "Tracking mode: $($status.mode)"
            if ($status.mode -eq 'single-file') {
                Write-Host "Total size: $([math]::Round($status.totalSize / 1024, 1)) KB"
                Write-Host "Needs migration: $($status.needsMigration)"
                foreach ($f in $status.files) {
                    Write-Host "  $($f.name): $($f.sizeKB) KB"
                }
            } else {
                Write-Host "Volumes: $($status.volumes)"
            }
        }
    }
    'backup' {
        $backupPath = Backup-TrackingFiles
        if ($Json) {
            @{ backupPath = $backupPath } | ConvertTo-Json
        } else {
            Write-Host "Backup created at: $backupPath"
        }
    }
    'auto' {
        $status = Get-TrackingStatus
        if ($status.mode -eq 'sharded') {
            if ($Json) {
                @{ status = 'already-sharded' } | ConvertTo-Json
            } else {
                Write-Host "Already in sharded mode."
            }
            exit 0
        }

        # Backup first
        $backupPath = Backup-TrackingFiles

        # Create directory structure
        Initialize-ShardedStructure

        if ($Json) {
            @{
                status = 'ready'
                backupPath = $backupPath
                summaryDir = $summaryDir
                volumesDir = $volumesDir
                message = 'Directory structure created. AI should now split data by volume boundaries.'
            } | ConvertTo-Json -Depth 3
        } else {
            Write-Host "Backup: $backupPath"
            Write-Host "Structure created. AI should now split data by volume boundaries."
        }
    }
}
