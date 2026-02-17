#!/bin/bash

set -euo pipefail

echo "=== Phase 1 预编译正则表达式测试 ==="
echo ""

# 测试 1.1: 验证 JSON 结构
echo "测试 1.1: 验证 JSON 结构"
version=$(jq -r '.version' resources/config/keyword-mappings.json)
if [[ "$version" == "1.1.0" ]]; then
    echo "✅ 版本号正确: $version"
else
    echo "❌ 版本号错误: $version (期望 1.1.0)"
    exit 1
fi

# 测试 1.2: 验证正则字段
echo ""
echo "测试 1.2: 验证正则字段"
mappings=(
    "craft-knowledge.dialogue"
    "craft-knowledge.character-arc"
    "craft-knowledge.pacing"
    "craft-knowledge.show-not-tell"
    "craft-knowledge.scene-structure"
    "genre-knowledge.romance"
    "genre-knowledge.mystery"
    "quality-assurance.consistency"
)

all_passed=true
for mapping in "${mappings[@]}"; do
    # 使用 jq 的嵌套路径语法
    category=$(echo "$mapping" | cut -d. -f1)
    name=$(echo "$mapping" | cut -d. -f2)

    regex=$(jq -r ".mappings[\"$category\"][\"$name\"].regex" resources/config/keyword-mappings.json)
    regex_flags=$(jq -r ".mappings[\"$category\"][\"$name\"].regex_flags" resources/config/keyword-mappings.json)

    if [[ -n "$regex" && "$regex" != "null" ]]; then
        echo "✅ $mapping: regex='$regex', flags='$regex_flags'"
    else
        echo "❌ $mapping: 缺少 regex 字段"
        all_passed=false
    fi
done

if [[ "$all_passed" != true ]]; then
    exit 1
fi

# 测试 1.3: 测试正则匹配
echo ""
echo "测试 1.3: 测试正则匹配"
declare -A test_cases=(
    ["dialogue:对话"]="craft-knowledge.dialogue"
    ["dialogue:conversation"]="craft-knowledge.dialogue"
    ["dialogue:DIALOGUE"]="craft-knowledge.dialogue"  # 大小写不敏感
    ["pacing:节奏"]="craft-knowledge.pacing"
    ["pacing:太快"]="craft-knowledge.pacing"
    ["character-arc:character arc"]="craft-knowledge.character-arc"  # 支持空格
    ["consistency:一致性"]="quality-assurance.consistency"
    ["romance:爱情"]="genre-knowledge.romance"
)

for test_case in "${!test_cases[@]}"; do
    keyword=$(echo "$test_case" | cut -d: -f2)
    mapping=${test_cases[$test_case]}

    category=$(echo "$mapping" | cut -d. -f1)
    name=$(echo "$mapping" | cut -d. -f2)

    regex=$(jq -r ".mappings[\"$category\"][\"$name\"].regex" resources/config/keyword-mappings.json)

    if echo "$keyword" | grep -iE "$regex" > /dev/null; then
        echo "✅ $mapping + '$keyword' → 匹配成功"
    else
        echo "❌ $mapping + '$keyword' → 匹配失败"
        all_passed=false
    fi
done

if [[ "$all_passed" != true ]]; then
    exit 1
fi

echo ""
echo "✅ 所有预编译正则测试通过 (3/3)"
