#!/bin/bash

set -euo pipefail

echo "=== Phase 1 跨平台兼容性测试 ==="
echo ""

echo "【系统信息】"
echo "操作系统: $(uname -s)"
echo "Bash 版本: $BASH_VERSION"
echo ""

echo "【Bash 数组类型检测】"
bash_major_version="${BASH_VERSION%%.*}"
if [[ "$bash_major_version" -ge 4 ]]; then
    echo "✅ Bash 4.0+ 检测到 - 应使用关联数组"
    array_type="associative"
else
    echo "✅ Bash 3.x 检测到 - 应使用线性数组（兼容模式）"
    array_type="linear"
fi

echo ""
echo "【路径处理测试】"
# 测试路径分隔符处理
test_path="templates/config/keyword-mappings.json"
if [[ -f "$test_path" ]]; then
    echo "✅ 路径处理正常: $test_path"
else
    echo "❌ 路径处理失败: $test_path"
    exit 1
fi

echo ""
echo "✅ 跨平台兼容性测试通过（数组类型: $array_type）"
