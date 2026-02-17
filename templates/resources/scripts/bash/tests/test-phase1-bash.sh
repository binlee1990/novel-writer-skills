#!/bin/bash
set -euo pipefail

echo "=== Phase 1 Bash 缓存测试 ==="
echo ""

# 测试 2.1: 功能测试
echo "测试 2.1: 运行功能测试"
bash test-preload-cache.sh
echo ""

# 测试 2.2: 性能测试
echo "测试 2.2: 运行性能测试"
bash bench-preload-cache.sh
echo ""

# 测试 2.3: Bash 版本检测
echo "测试 2.3: Bash 版本检测"
bash_version="${BASH_VERSION%%.*}"
echo "当前 Bash 版本: $BASH_VERSION"
if [[ "$bash_version" -ge 4 ]]; then
    echo "✅ 使用关联数组（Bash 4.0+）"
else
    echo "✅ 使用线性数组（Bash 3.x 兼容）"
fi

echo ""
echo "✅ Bash 缓存测试全部通过"
