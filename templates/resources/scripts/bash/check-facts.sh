#!/bin/bash
set -euo pipefail

# check-facts.sh - Story Facts 引用扫描脚本
# 扫描章节中的 story-facts 注释，生成引用报告

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# 默认参数
OUTPUT_JSON=false
STORY_NAME=""

# 解析参数
while [[ $# -gt 0 ]]; do
    case $1 in
        --json)
            OUTPUT_JSON=true
            shift
            ;;
        --story)
            STORY_NAME="$2"
            shift 2
            ;;
        *)
            echo "Usage: $0 [--json] [--story <story-name>]" >&2
            exit 1
            ;;
    esac
done

# 检查 story-facts.json 是否存在
FACTS_FILE="$PROJECT_ROOT/tracking/story-facts.json"
if [[ ! -f "$FACTS_FILE" ]]; then
    if [[ "$OUTPUT_JSON" == true ]]; then
        echo '{"error": "story-facts.json not found", "chapters": [], "unreferenced_facts": [], "unknown_ids": []}'
    else
        echo -e "${RED}❌ 未找到 story-facts.json${NC}" >&2
        echo -e "   路径: $FACTS_FILE" >&2
        echo -e "   请先使用 /facts 命令初始化" >&2
    fi
    exit 1
fi

# 读取已注册的 fact ID 列表
# 使用 jq 提取（如果有），否则使用 grep + sed
if command -v jq &> /dev/null; then
    REGISTERED_FACTS=$(jq -r '.facts[].id' "$FACTS_FILE" 2>/dev/null || echo "")
else
    # 降级方案：使用 grep 提取 "id": "xxx"
    REGISTERED_FACTS=$(grep -o '"id"[[:space:]]*:[[:space:]]*"[^"]*"' "$FACTS_FILE" | sed 's/"id"[[:space:]]*:[[:space:]]*"\([^"]*\)"/\1/' || echo "")
fi

# 转换为数组
if [[ -n "$REGISTERED_FACTS" ]]; then
    mapfile -t REGISTERED_FACTS_ARRAY <<< "$REGISTERED_FACTS"
else
    REGISTERED_FACTS_ARRAY=()
fi

# 确定扫描目录
if [[ -n "$STORY_NAME" ]]; then
    CONTENT_DIR="$PROJECT_ROOT/stories/$STORY_NAME/content"
    if [[ ! -d "$CONTENT_DIR" ]]; then
        if [[ "$OUTPUT_JSON" == true ]]; then
            echo "{\"error\": \"story directory not found: $STORY_NAME\", \"chapters\": [], \"unreferenced_facts\": [], \"unknown_ids\": []}"
        else
            echo -e "${RED}❌ 未找到故事目录: $STORY_NAME${NC}" >&2
        fi
        exit 1
    fi
    SEARCH_PATTERN="$CONTENT_DIR/*.md"
else
    SEARCH_PATTERN="$PROJECT_ROOT/stories/*/content/*.md"
fi

# 初始化数据结构
declare -A chapter_facts  # key: 文件路径, value: fact IDs (逗号分隔)
declare -A fact_referenced  # key: fact ID, value: 1 if referenced
declare -A unknown_ids_map  # key: unknown ID, value: 1

# 扫描章节文件
shopt -s nullglob  # 如果没有匹配文件，glob 返回空而非原始字符串
for chapter_file in $SEARCH_PATTERN; do
    # 提取 <!-- story-facts: ... --> 注释
    # 正则：<!-- story-facts: (.+?) -->
    facts_line=$(grep -oP '<!--\s*story-facts:\s*\K[^-]+(?=\s*-->)' "$chapter_file" || true)

    if [[ -n "$facts_line" ]]; then
        # 去除空格，分割为数组
        IFS=',' read -ra fact_ids <<< "$facts_line"

        # 处理每个 fact ID
        cleaned_ids=()
        for id in "${fact_ids[@]}"; do
            # 去除前后空格
            id=$(echo "$id" | xargs)
            if [[ -n "$id" ]]; then
                cleaned_ids+=("$id")

                # 检查是否已注册
                if printf '%s\n' "${REGISTERED_FACTS_ARRAY[@]}" | grep -q "^${id}$"; then
                    fact_referenced["$id"]=1
                else
                    unknown_ids_map["$id"]=1
                fi
            fi
        done

        # 保存到 chapter_facts
        if [[ ${#cleaned_ids[@]} -gt 0 ]]; then
            chapter_facts["$chapter_file"]=$(IFS=,; echo "${cleaned_ids[*]}")
        fi
    fi
done

# 计算未被引用的事实
unreferenced_facts=()
for fact_id in "${REGISTERED_FACTS_ARRAY[@]}"; do
    if [[ ! -v fact_referenced["$fact_id"] ]]; then
        unreferenced_facts+=("$fact_id")
    fi
done

# 收集 unknown IDs
unknown_ids=("${!unknown_ids_map[@]}")

# 输出结果
if [[ "$OUTPUT_JSON" == true ]]; then
    # JSON 输出
    echo "{"
    echo '  "chapters": ['

    first=true
    for file in "${!chapter_facts[@]}"; do
        if [[ "$first" == false ]]; then
            echo ","
        fi
        first=false

        # 转换为相对路径
        rel_path="${file#$PROJECT_ROOT/}"

        # 转换 fact IDs 为 JSON 数组
        IFS=',' read -ra ids <<< "${chapter_facts[$file]}"
        ids_json=$(printf '"%s",' "${ids[@]}" | sed 's/,$//')

        echo -n "    {\"file\": \"$rel_path\", \"facts\": [$ids_json]}"
    done

    if [[ "$first" == false ]]; then
        echo ""
    fi
    echo "  ],"

    # unreferenced_facts
    echo -n '  "unreferenced_facts": ['
    if [[ ${#unreferenced_facts[@]} -gt 0 ]]; then
        printf '"%s",' "${unreferenced_facts[@]}" | sed 's/,$//'
    fi
    echo "],"

    # unknown_ids
    echo -n '  "unknown_ids": ['
    if [[ ${#unknown_ids[@]} -gt 0 ]]; then
        printf '"%s",' "${unknown_ids[@]}" | sed 's/,$//'
    fi
    echo "]"

    echo "}"
else
    # 人类可读输出
    echo -e "${BOLD}${BLUE}📊 Story Facts 引用报告${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    echo -e "${GREEN}已注册事实:${NC} ${#REGISTERED_FACTS_ARRAY[@]} 个"
    echo -e "${GREEN}引用章节:${NC} ${#chapter_facts[@]} 个"
    echo ""

    if [[ ${#chapter_facts[@]} -gt 0 ]]; then
        echo -e "${BOLD}章节引用:${NC}"
        for file in "${!chapter_facts[@]}"; do
            rel_path="${file#$PROJECT_ROOT/}"
            filename=$(basename "$rel_path")
            facts="${chapter_facts[$file]}"
            echo -e "  ${BLUE}$filename${NC} → ${facts//,/, }"
        done
        echo ""
    fi

    if [[ ${#unreferenced_facts[@]} -gt 0 ]]; then
        echo -e "${YELLOW}未被引用的事实:${NC} ${unreferenced_facts[*]}"
        echo ""
    else
        echo -e "${GREEN}✓ 所有事实都被至少一个章节引用${NC}"
        echo ""
    fi

    if [[ ${#unknown_ids[@]} -gt 0 ]]; then
        echo -e "${RED}未知 ID (章节中引用但未注册):${NC} ${unknown_ids[*]}"
        echo -e "  ${YELLOW}提示: 可能是拼写错误或需要注册到 story-facts.json${NC}"
    else
        echo -e "${GREEN}✓ 未检测到未知 ID${NC}"
    fi
fi
