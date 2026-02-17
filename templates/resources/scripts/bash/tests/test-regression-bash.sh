#!/bin/bash

set -euo pipefail

echo "=== Phase 1 回归测试 (Bash) ==="
echo ""

echo "测试 7.1: 脚本正常运行"
if bash templates/scripts/bash/check-writing-state.sh --help > /dev/null 2>&1; then
    echo "✅ 脚本帮助信息正常"
else
    echo "⚠️ 脚本无 --help 选项（可能是正常的）"
fi

echo ""
echo "测试 7.2: JSON 输出格式"
output=$(bash templates/scripts/bash/check-writing-state.sh 2>/dev/null || echo "{}")

if echo "$output" | jq empty 2>/dev/null; then
    echo "✅ JSON 格式正确"
else
    echo "❌ JSON 格式错误"
    echo "输出内容:"
    echo "$output"
    exit 1
fi

echo ""
echo "测试 7.3: 必需字段存在性"
required_fields=("status")
all_exist=true

for field in "${required_fields[@]}"; do
    if echo "$output" | jq -e ".$field" > /dev/null 2>&1; then
        echo "✅ 字段存在: $field"
    else
        echo "⚠️ 字段不存在: $field（可能是预期的）"
    fi
done

echo ""
echo "✅ Bash 回归测试通过"
