#!/bin/bash
set -euo pipefail

# 检查写作状态脚本
# 用于 /write 命令

# ============================================
# Phase 1: 文件时间戳缓存
# ============================================
#
# 缓存值约定:
# - mtime > 0: 文件存在，值为修改时间戳
# - mtime = 0: stat 命令失败（权限问题、文件系统错误等）
# - mtime = -1: 文件不存在（预加载时已确认）
# - 未缓存: 键不存在于缓存中

# Bash 版本检测
BASH_MAJOR_VERSION="${BASH_VERSION%%.*}"

# 缓存存储（关联数组或线性数组）
if [[ "$BASH_MAJOR_VERSION" -ge 4 ]]; then
    # Bash 4.0+: 使用关联数组
    declare -A FILE_MTIME_CACHE
else
    # Bash 3.x: 使用线性数组模拟
    FILE_MTIME_CACHE_KEYS=()
    FILE_MTIME_CACHE_VALUES=()
fi

# ============================================
# Phase 2: 资源去重机制
# ============================================
#
# 用于避免在单次脚本执行中重复检查同一资源文件

# Phase 2: 资源去重 - 检测 Bash 版本并选择实现
if [ "${BASH_VERSINFO[0]}" -ge 4 ]; then
    # Bash 4.0+: 使用关联数组（O(1) 查找）
    USE_ASSOCIATIVE_ARRAY=true
    declare -A loaded_resources_set
else
    # Bash 3.x: 降级到线性数组（O(n) 查找）
    USE_ASSOCIATIVE_ARRAY=false
    loaded_resources_array=()
    echo "警告: Bash 版本低于 4.0，资源去重使用降级方案（性能稍差）" >&2
fi

# 检查资源是否已加载（Bash 4.0+）
is_resource_loaded_assoc() {
    local path=$1
    [[ ${loaded_resources_set["$path"]+_} ]]
}

# 标记资源为已加载（Bash 4.0+）
mark_resource_loaded_assoc() {
    local path=$1
    loaded_resources_set["$path"]=1
}

# 检查资源是否已加载（Bash 3.x 降级）
is_resource_loaded_array() {
    local path=$1
    for loaded in "${loaded_resources_array[@]}"; do
        if [ "$loaded" = "$path" ]; then
            return 0
        fi
    done
    return 1
}

# 标记资源为已加载（Bash 3.x 降级）
mark_resource_loaded_array() {
    local path=$1
    loaded_resources_array+=("$path")
}

# 统一接口（自动选择实现）
is_resource_loaded() {
    if [ "$USE_ASSOCIATIVE_ARRAY" = true ]; then
        is_resource_loaded_assoc "$@"
    else
        is_resource_loaded_array "$@"
    fi
}

mark_resource_loaded() {
    if [ "$USE_ASSOCIATIVE_ARRAY" = true ]; then
        mark_resource_loaded_assoc "$@"
    else
        mark_resource_loaded_array "$@"
    fi
}

# 预加载文件修改时间到缓存
# 参数: $@ = 文件路径列表
# 说明: 由于 Bash 命令替换会创建子shell，我们使用预加载策略
#       在脚本初始化时一次性加载所有文件的 mtime
preload_file_mtimes() {
    local file_path
    local mtime

    for file_path in "$@"; do
        # 文件不存在：记录为 -1
        if [ ! -f "$file_path" ]; then
            if [[ "$BASH_MAJOR_VERSION" -ge 4 ]]; then
                FILE_MTIME_CACHE[$file_path]="-1"
            else
                FILE_MTIME_CACHE_KEYS+=("$file_path")
                FILE_MTIME_CACHE_VALUES+=("-1")
            fi
            continue
        fi

        # 读取文件时间戳 (macOS/Linux 兼容)
        if [[ "$OSTYPE" == "darwin"* ]]; then
            mtime=$(stat -f "%m" "$file_path" 2>/dev/null || echo "0")
        else
            mtime=$(stat -c "%Y" "$file_path" 2>/dev/null || echo "0")
        fi

        # 存入缓存
        if [[ "$BASH_MAJOR_VERSION" -ge 4 ]]; then
            FILE_MTIME_CACHE[$file_path]="$mtime"
        else
            FILE_MTIME_CACHE_KEYS+=("$file_path")
            FILE_MTIME_CACHE_VALUES+=("$mtime")
        fi
    done
}

# 获取文件修改时间（从缓存）
# 参数: $1 = 文件路径
# 返回: 修改时间戳（秒），如果未缓存则返回 0
get_file_mtime() {
    local file_path="$1"

    if [[ "$BASH_MAJOR_VERSION" -ge 4 ]]; then
        # Bash 4.0+: 关联数组查找
        echo "${FILE_MTIME_CACHE[$file_path]:-0}"
    else
        # Bash 3.x: 线性数组查找
        for i in "${!FILE_MTIME_CACHE_KEYS[@]}"; do
            if [[ "${FILE_MTIME_CACHE_KEYS[$i]}" == "$file_path" ]]; then
                echo "${FILE_MTIME_CACHE_VALUES[$i]}"
                return 0
            fi
        done
        echo "0"
    fi
}

# 检查文件是否已被缓存
# 参数: $1 = 文件路径
# 返回: 0 = 已缓存, 1 = 未缓存
is_file_cached() {
    local file_path="$1"

    if [[ "$BASH_MAJOR_VERSION" -ge 4 ]]; then
        [[ ${FILE_MTIME_CACHE[$file_path]+isset} ]]
    else
        for key in "${FILE_MTIME_CACHE_KEYS[@]}"; do
            [[ "$key" == "$file_path" ]] && return 0
        done
        return 1
    fi
}

# 检查文件是否存在（基于缓存）
# 参数: $1 = 文件路径
# 返回: 0 = 文件存在, 1 = 文件不存在或未缓存
is_file_exists_cached() {
    local file_path="$1"
    local mtime=$(get_file_mtime "$file_path")

    # mtime > 0: 文件存在
    # mtime = 0: stat 失败或未缓存
    # mtime = -1: 文件不存在
    [[ "$mtime" != "0" && "$mtime" != "-1" ]]
}

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# 预加载文件时间戳缓存（性能优化）
# 注意：必须在 get_project_root 之前进行，或者在确定项目根目录后再预加载
# 这里我们延迟到获取 PROJECT_ROOT 之后
PRELOAD_FILES_PENDING=true

# 检查是否为 checklist 模式
CHECKLIST_MODE=false
if [ "$1" = "--checklist" ]; then
    CHECKLIST_MODE=true
fi

# 检查是否为 JSON 输出模式
JSON_MODE=false
if [ "$1" = "--json" ] || [ "$2" = "--json" ]; then
    JSON_MODE=true
fi

# Get project root
PROJECT_ROOT=$(get_project_root)
cd "$PROJECT_ROOT"

# 获取当前故事
STORY_NAME=$(get_active_story)
STORY_DIR="stories/$STORY_NAME"

# 预加载文件时间戳（性能优化）
if [ "$PRELOAD_FILES_PENDING" = true ]; then
    # 构建待预加载的文件列表
    PRELOAD_FILE_LIST=(
        # 知识库文件
        "$PROJECT_ROOT/templates/knowledge-base/craft/dialogue.md"
        "$PROJECT_ROOT/templates/knowledge-base/craft/scene-structure.md"
        "$PROJECT_ROOT/templates/knowledge-base/craft/character-arc.md"
        "$PROJECT_ROOT/templates/knowledge-base/craft/pacing.md"
        "$PROJECT_ROOT/templates/knowledge-base/craft/show-not-tell.md"
        # Skill 文件
        "$PROJECT_ROOT/templates/skills/writing-techniques/dialogue-techniques/SKILL.md"
        "$PROJECT_ROOT/templates/skills/writing-techniques/scene-structure/SKILL.md"
        "$PROJECT_ROOT/templates/skills/writing-techniques/character-arc/SKILL.md"
        "$PROJECT_ROOT/templates/skills/writing-techniques/pacing-control/SKILL.md"
        "$PROJECT_ROOT/templates/skills/quality-assurance/consistency-checker/SKILL.md"
        # 规格文件
        "$STORY_DIR/specification.md"
    )

    # 执行预加载
    preload_file_mtimes "${PRELOAD_FILE_LIST[@]}"
    PRELOAD_FILES_PENDING=false
fi

# 检查方法论文档
check_methodology_docs() {
    local missing=()

    [ ! -f ".specify/memory/constitution.md" ] && missing+=("宪法")
    [ ! -f "$STORY_DIR/specification.md" ] && missing+=("规格")
    [ ! -f "$STORY_DIR/creative-plan.md" ] && missing+=("计划")
    [ ! -f "$STORY_DIR/tasks.md" ] && missing+=("任务")

    if [ ${#missing[@]} -gt 0 ]; then
        echo "⚠️ 缺少以下基准文档："
        for doc in "${missing[@]}"; do
            echo "  - $doc"
        done
        echo ""
        echo "建议按照七步方法论完成前置步骤："
        echo "1. /constitution - 创建创作宪法"
        echo "2. /specify - 定义故事规格"
        echo "3. /clarify - 澄清关键决策"
        echo "4. /plan - 制定创作计划"
        echo "5. /tasks - 生成任务清单"
        return 1
    fi

    echo "✅ 方法论文档完整"
    return 0
}

# 检查待写作任务
check_pending_tasks() {
    local tasks_file="$STORY_DIR/tasks.md"

    if [ ! -f "$tasks_file" ]; then
        echo "❌ 任务文件不存在"
        return 1
    fi

    # 统计任务状态
    local pending=$(grep -c "^- \[ \]" "$tasks_file" 2>/dev/null || echo 0)
    local in_progress=$(grep -c "^- \[~\]" "$tasks_file" 2>/dev/null || echo 0)
    local completed=$(grep -c "^- \[x\]" "$tasks_file" 2>/dev/null || echo 0)

    echo ""
    echo "任务状态："
    echo "  待开始：$pending"
    echo "  进行中：$in_progress"
    echo "  已完成：$completed"

    if [ $pending -eq 0 ] && [ $in_progress -eq 0 ]; then
        echo ""
        echo "🎉 所有任务已完成！"
        echo "建议运行 /analyze 进行综合验证"
        return 0
    fi

    # 显示下一个待写作任务
    echo ""
    echo "下一个写作任务："
    grep "^- \[ \]" "$tasks_file" | head -n 1 || echo "（无待处理任务）"
}

# 检查已完成内容
check_completed_content() {
    local content_dir="$STORY_DIR/content"
    local validation_rules="$STORY_DIR/spec/tracking/validation-rules.json"
    local min_words=2000
    local max_words=4000

    # 读取验证规则（如果存在）
    if [ -f "$validation_rules" ]; then
        if command -v jq >/dev/null 2>&1; then
            min_words=$(jq -r '.rules.chapterMinWords // 2000' "$validation_rules")
            max_words=$(jq -r '.rules.chapterMaxWords // 4000' "$validation_rules")
        fi
    fi

    if [ -d "$content_dir" ]; then
        local chapter_count=$(ls "$content_dir"/*.md 2>/dev/null | wc -l)
        if [ $chapter_count -gt 0 ]; then
            echo ""
            echo "已完成章节：$chapter_count"
            echo "字数要求：${min_words}-${max_words} 字"
            echo ""
            echo "最近写作："
            for file in $(ls -t "$content_dir"/*.md 2>/dev/null | head -n 3); do
                local filename=$(basename "$file")
                local words=$(count_chinese_words "$file")
                local status="✅"

                if [ "$words" -lt "$min_words" ]; then
                    status="⚠️ 字数不足"
                elif [ "$words" -gt "$max_words" ]; then
                    status="⚠️ 字数超出"
                fi

                echo "  - $filename: $words 字 $status"
            done
        fi
    else
        echo ""
        echo "尚未开始写作"
    fi
}

# 生成 checklist 格式输出
output_checklist() {
    local has_constitution=false
    local has_specification=false
    local has_plan=false
    local has_tasks=false
    local pending=0
    local in_progress=0
    local completed=0
    local chapter_count=0
    local bad_chapters=0
    local min_words=2000
    local max_words=4000

    # 检查文档
    [ -f ".specify/memory/constitution.md" ] && has_constitution=true
    [ -f "$STORY_DIR/specification.md" ] && has_specification=true
    [ -f "$STORY_DIR/creative-plan.md" ] && has_plan=true
    [ -f "$STORY_DIR/tasks.md" ] && has_tasks=true

    # 统计任务
    if [ "$has_tasks" = true ]; then
        pending=$(grep -c "^- \[ \]" "$STORY_DIR/tasks.md" 2>/dev/null || echo 0)
        in_progress=$(grep -c "^- \[~\]" "$STORY_DIR/tasks.md" 2>/dev/null || echo 0)
        completed=$(grep -c "^- \[x\]" "$STORY_DIR/tasks.md" 2>/dev/null || echo 0)
    fi

    # 读取验证规则
    local validation_rules="$STORY_DIR/spec/tracking/validation-rules.json"
    if [ -f "$validation_rules" ] && command -v jq >/dev/null 2>&1; then
        min_words=$(jq -r '.rules.chapterMinWords // 2000' "$validation_rules")
        max_words=$(jq -r '.rules.chapterMaxWords // 4000' "$validation_rules")
    fi

    # 检查章节内容
    local content_dir="$STORY_DIR/content"
    if [ -d "$content_dir" ]; then
        chapter_count=$(ls "$content_dir"/*.md 2>/dev/null | wc -l | tr -d ' ')

        # 统计不符合字数要求的章节
        for file in "$content_dir"/*.md; do
            [ -f "$file" ] || continue
            local words=$(count_chinese_words "$file")
            if [ "$words" -lt "$min_words" ] || [ "$words" -gt "$max_words" ]; then
                bad_chapters=$((bad_chapters + 1))
            fi
        done
    fi

    # 计算总任务和完成率
    local total_tasks=$((pending + in_progress + completed))
    local completion_rate=0
    if [ $total_tasks -gt 0 ]; then
        completion_rate=$((completed * 100 / total_tasks))
    fi

    # 输出 checklist
    cat <<EOF
# 写作状态检查 Checklist

**检查时间**: $(date '+%Y-%m-%d %H:%M:%S')
**当前故事**: $STORY_NAME
**字数标准**: ${min_words}-${max_words} 字

---

## 文档完整性

- [$([ "$has_constitution" = true ] && echo "x" || echo " ")] CHK001 constitution.md 存在
- [$([ "$has_specification" = true ] && echo "x" || echo " ")] CHK002 specification.md 存在
- [$([ "$has_plan" = true ] && echo "x" || echo " ")] CHK003 creative-plan.md 存在
- [$([ "$has_tasks" = true ] && echo "x" || echo " ")] CHK004 tasks.md 存在

## 任务进度

EOF

    if [ "$has_tasks" = true ]; then
        echo "- [$([ $in_progress -gt 0 ] && echo "x" || echo " ")] CHK005 有进行中的任务（$in_progress 个）"
        echo "- [x] CHK006 待开始任务数量（$pending 个）"
        echo "- [$([ $completed -gt 0 ] && echo "x" || echo " ")] CHK007 已完成任务进度（$completed/$total_tasks = $completion_rate%）"
    else
        echo "- [ ] CHK005 有进行中的任务（tasks.md 不存在）"
        echo "- [ ] CHK006 待开始任务数量（tasks.md 不存在）"
        echo "- [ ] CHK007 已完成任务进度（tasks.md 不存在）"
    fi

    cat <<EOF

## 内容质量

- [$([ $chapter_count -gt 0 ] && echo "x" || echo " ")] CHK008 已完成章节数（$chapter_count 章）
EOF

    if [ $chapter_count -gt 0 ]; then
        echo "- [$([ $bad_chapters -eq 0 ] && echo "x" || echo "!")] CHK009 字数符合标准（$([ $bad_chapters -eq 0 ] && echo "全部符合" || echo "$bad_chapters 章不符合")）"
    else
        echo "- [ ] CHK009 字数符合标准（尚未开始写作）"
    fi

    cat <<EOF

---

## 后续行动

EOF

    local has_actions=false

    # 检查缺失文档
    if [ "$has_constitution" = false ] || [ "$has_specification" = false ] || [ "$has_plan" = false ] || [ "$has_tasks" = false ]; then
        echo "- [ ] 完成方法论文档（运行对应命令：/constitution, /specify, /plan, /tasks）"
        has_actions=true
    fi

    # 检查任务
    if [ $pending -gt 0 ] || [ $in_progress -gt 0 ]; then
        if [ $in_progress -gt 0 ]; then
            echo "- [ ] 继续进行中的任务（$in_progress 个）"
        else
            echo "- [ ] 开始下一个待写作任务（共 $pending 个）"
        fi
        has_actions=true
    fi

    # 检查章节质量
    if [ $bad_chapters -gt 0 ]; then
        echo "- [ ] 修复字数不符合要求的章节（$bad_chapters 章）"
        has_actions=true
    fi

    # 完成建议
    if [ $pending -eq 0 ] && [ $in_progress -eq 0 ] && [ $completed -gt 0 ]; then
        echo "- [ ] 运行 /analyze 进行综合验证"
        has_actions=true
    fi

    if [ "$has_actions" = false ]; then
        echo "*写作状态良好，无需特别行动*"
    fi

    cat <<EOF

---

**检查工具**: check-writing-state.sh
**版本**: 1.1 (支持 checklist 输出)
EOF
}

# ==================== 新增：资源加载检查函数 ====================

# JSON 字符串转义辅助函数
json_escape() {
    local str="$1"
    # 按顺序转义：反斜杠 -> 引号 -> 控制字符
    str="${str//\\/\\\\}"    # \ -> \\
    str="${str//\"/\\\"}"    # " -> \"
    str="${str//$'\t'/\\t}"  # tab -> \t
    str="${str//$'\n'/\\n}"  # newline -> \n
    str="${str//$'\r'/\\r}"  # carriage return -> \r
    echo "$str"
}

# 解析 specification.md 的 resource-loading 配置
parse_resource_loading_config() {
    local spec_file="$STORY_DIR/specification.md"

    if [ ! -f "$spec_file" ]; then
        echo "{}" # 返回空 JSON
        return
    fi

    # 提取 YAML frontmatter 中的 resource-loading 配置
    # 这里简化处理，实际应该用 yq 或 python 解析 YAML
    # 当前版本：检测是否存在 resource-loading 配置

    if grep -q "resource-loading:" "$spec_file"; then
        echo '{"configured": true}'
    else
        echo '{"configured": false}'
    fi
}

# 检查 knowledge-base 文件是否存在
check_knowledge_base_available() {
    local missing=()
    local available=()

    # 检查所有 craft knowledge-base
    local craft_files=(
        "templates/knowledge-base/craft/dialogue.md"
        "templates/knowledge-base/craft/scene-structure.md"
        "templates/knowledge-base/craft/character-arc.md"
        "templates/knowledge-base/craft/pacing.md"
        "templates/knowledge-base/craft/show-not-tell.md"
    )

    for file in "${craft_files[@]}"; do
        local full_path="$PROJECT_ROOT/$file"
        # 使用缓存检查文件是否存在
        if is_file_exists_cached "$full_path"; then
            available+=("$file")
        else
            missing+=("$file")
        fi
    done

    # 输出结果（JSON 格式将在后续步骤实现）
    if [ ${#missing[@]} -gt 0 ]; then
        echo "⚠️ 缺少以下 knowledge-base 文件："
        for file in "${missing[@]}"; do
            echo "  - $file"
        done
        return 1
    fi

    echo "✅ Knowledge-base 文件完整 (${#available[@]} 个)"
    return 0
}

# 检查 skills 是否存在
check_skills_available() {
    local missing=()
    local available=()

    # 检查 writing-techniques skills
    local skill_dirs=(
        "templates/skills/writing-techniques/dialogue-techniques"
        "templates/skills/writing-techniques/scene-structure"
        "templates/skills/writing-techniques/character-arc"
        "templates/skills/writing-techniques/pacing-control"
    )

    for dir in "${skill_dirs[@]}"; do
        local skill_file="$PROJECT_ROOT/$dir/SKILL.md"
        # 使用缓存检查文件是否存在
        if is_file_exists_cached "$skill_file"; then
            available+=("$dir")
        else
            missing+=("$dir")
        fi
    done

    if [ ${#missing[@]} -gt 0 ]; then
        echo "⚠️ 缺少以下 skills："
        for dir in "${missing[@]}"; do
            echo "  - $dir/SKILL.md"
        done
        return 1
    fi

    echo "✅ Skills 完整 (${#available[@]} 个)"
    return 0
}

# 生成资源加载报告（JSON 格式）
generate_load_report() {
    local spec_file="$STORY_DIR/specification.md"

    local knowledge_base_files=(
        "craft/dialogue.md"
        "craft/scene-structure.md"
        "craft/character-arc.md"
        "craft/pacing.md"
        "craft/show-not-tell.md"
    )

    local skills_files=(
        "writing-techniques/dialogue-techniques"
        "writing-techniques/scene-structure"
        "writing-techniques/character-arc"
        "writing-techniques/pacing-control"
        "quality-assurance/consistency-checker"
    )

    local disabled_resources=()

    # 检查配置文件
    local has_config=false
    if [ -f "$spec_file" ] && grep -q "resource-loading:" "$spec_file"; then
        has_config=true

        # 检查是否禁用了 auto-load
        if grep -A 1 "resource-loading:" "$spec_file" | grep -q "auto-load: false"; then
            # 如果禁用自动加载，清空默认列表
            knowledge_base_files=()
            skills_files=()
        fi

        # TODO: 解析配置文件中的具体资源列表
        # 当前简化版本，完整解析需要 yq 或 python
    fi

    # 检查文件是否存在，生成警告（使用缓存 + Phase 2 去重）
    local warnings=()
    for kb in "${knowledge_base_files[@]}"; do
        local kb_path="templates/knowledge-base/$kb"

        # Phase 2: 资源去重检查
        if is_resource_loaded "$kb_path"; then
            # 资源已检查过，跳过
            continue
        fi

        # 标记为已加载
        mark_resource_loaded "$kb_path"

        # 检查文件是否存在（使用完整路径）
        if ! is_file_exists_cached "$PROJECT_ROOT/$kb_path"; then
            warnings+=("知识库文件不存在: $kb")
        fi
    done

    for skill in "${skills_files[@]}"; do
        local skill_path="templates/skills/$skill/SKILL.md"

        # Phase 2: 资源去重检查
        if is_resource_loaded "$skill_path"; then
            # 资源已检查过，跳过
            continue
        fi

        # 标记为已加载
        mark_resource_loaded "$skill_path"

        # 检查文件是否存在（使用完整路径）
        if ! is_file_exists_cached "$PROJECT_ROOT/$skill_path"; then
            warnings+=("Skill 文件不存在: $skill/SKILL.md")
        fi
    done

    # Phase 2: 检测缓存命中（基于 specification.md 是否已被缓存加载且有效）
    # 仅当文件在缓存中且成功读取时，才视为"缓存命中"
    # 缓存语义: -1 = 文件不存在, 0 = stat 失败或未缓存, >0 = 成功读取
    local cached=false
    local cache_hint=""

    # 获取缓存的 mtime
    local spec_mtime=$(get_file_mtime "$spec_file")

    # 仅当 mtime > 0 时才视为缓存命中
    if [[ "$spec_mtime" != "0" && "$spec_mtime" != "-1" ]]; then
        cached=true
        cache_hint="此报告基于缓存生成（specification.md 未修改）。AI 可复用本次会话中已加载的资源。"
    fi

    # 生成 JSON 报告（使用 echo 逐行输出，处理空数组）
    echo "{"
    echo "  \"status\": \"ready\","

    # 生成时间戳，带错误处理和回退
    local timestamp
    if timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null); then
        echo "  \"timestamp\": \"$timestamp\","
    elif timestamp=$(date +"%Y-%m-%dT%H:%M:%S%z" 2>/dev/null); then
        echo "  \"timestamp\": \"$timestamp\","
    else
        echo "  \"timestamp\": \"unknown\","
    fi

    echo "  \"has_config\": $has_config,"

    # Phase 2: 添加缓存标记字段
    echo "  \"cached\": $cached,"
    echo "  \"session_cache_enabled\": true,"
    if [ "$cached" = true ]; then
        echo "  \"cache_hint\": \"$(json_escape "$cache_hint")\","
    fi

    echo "  \"resources\": {"
    echo "    \"knowledge-base\": ["

    # 输出 knowledge-base 列表
    local first=true
    for kb in "${knowledge_base_files[@]}"; do
        if [ "$first" = true ]; then
            echo -n "      \"$(json_escape "$kb")\""
            first=false
        else
            echo ","
            echo -n "      \"$(json_escape "$kb")\""
        fi
    done
    echo ""
    echo "    ],"

    echo "    \"skills\": ["
    # 输出 skills 列表
    first=true
    for skill in "${skills_files[@]}"; do
        if [ "$first" = true ]; then
            echo -n "      \"$(json_escape "$skill")\""
            first=false
        else
            echo ","
            echo -n "      \"$(json_escape "$skill")\""
        fi
    done
    echo ""
    echo "    ],"

    echo "    \"disabled\": ["
    # 输出 disabled 列表
    first=true
    for res in "${disabled_resources[@]}"; do
        if [ "$first" = true ]; then
            echo -n "      \"$(json_escape "$res")\""
            first=false
        else
            echo ","
            echo -n "      \"$(json_escape "$res")\""
        fi
    done
    echo ""
    echo "    ]"

    echo "  },"
    echo "  \"warnings\": ["
    # 输出 warnings 列表
    first=true
    for warn in "${warnings[@]}"; do
        if [ "$first" = true ]; then
            echo -n "      \"$(json_escape "$warn")\""
            first=false
        else
            echo ","
            echo -n "      \"$(json_escape "$warn")\""
        fi
    done
    echo ""
    echo "    ]"
    echo "}"
}

# 主流程
main() {
    # JSON 模式优先处理
    if [ "$JSON_MODE" = true ]; then
        generate_load_report
        exit 0
    fi

    # Checklist 模式直接输出并退出
    if [ "$CHECKLIST_MODE" = true ]; then
        output_checklist
        exit 0
    fi

    # 原有的详细输出模式
    echo "写作状态检查"
    echo "============"
    echo "当前故事：$STORY_NAME"
    echo ""

    if ! check_methodology_docs; then
        exit 1
    fi

    check_pending_tasks
    check_completed_content

    echo ""
    echo "准备就绪，可以开始写作"
}

main