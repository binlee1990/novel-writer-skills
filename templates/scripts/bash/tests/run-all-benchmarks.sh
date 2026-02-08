#!/bin/bash

set -euo pipefail

echo "=== Phase 1 性能基准测试 ==="
echo ""

echo "【Bash 性能测试】"
bash bench-preload-cache.sh
echo ""

echo "【PowerShell 性能测试】"
pwsh bench-ps-cache.ps1
echo ""

echo "✅ 所有性能基准测试完成"
