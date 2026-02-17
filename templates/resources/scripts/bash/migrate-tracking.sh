#!/usr/bin/env bash
# migrate-tracking.sh
# 用法: migrate-tracking.sh [-m|--mode <auto|check|backup>] [-j|--json]

set -euo pipefail

# 默认参数
MODE="check"
JSON_OUTPUT=false

# 解析参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -m|--mode)
            MODE="$2"
            if [[ ! "$MODE" =~ ^(auto|check|backup)$ ]]; then
                echo "错误: Mode 必须是 auto, check 或 backup" >&2
                exit 1
            fi
            shift 2
            ;;
        -j|--json)
            JSON_OUTPUT=true
            shift
            ;;
        *)
            echo "未知参数: $1" >&2
            exit 1
            ;;
    esac
done

# 目录路径
TRACKING_DIR="${PWD}/tracking"
BACKUP_DIR="${TRACKING_DIR}/backup"
SUMMARY_DIR="${TRACKING_DIR}/summary"
VOLUMES_DIR="${TRACKING_DIR}/volumes"

# 跟踪文件列表
TRACKING_FILES=(
    "character-state.json"
    "plot-tracker.json"
    "timeline.json"
    "relationships.json"
)

# 获取跟踪状态
get_tracking_status() {
    local mode="single-file"
    local total_size=0
    local needs_migration=false
    local files_json="[]"
    local volumes=0

    # 检查是否为分片模式
    if [[ -d "$VOLUMES_DIR" ]]; then
        mode="sharded"
        volumes=$(find "$VOLUMES_DIR" -maxdepth 1 -type d -name "vol-*" 2>/dev/null | wc -l)

        if [[ "$JSON_OUTPUT" == true ]]; then
            echo "{\"mode\":\"${mode}\",\"volumes\":${volumes}}"
        else
            echo "Tracking mode: ${mode}"
            echo "Volumes: ${volumes}"
        fi
        return
    fi

    # 单文件模式 - 检查文件大小
    local file_list=""
    for file in "${TRACKING_FILES[@]}"; do
        local file_path="${TRACKING_DIR}/${file}"
        if [[ -f "$file_path" ]]; then
            local size=$(stat -f%z "$file_path" 2>/dev/null || stat -c%s "$file_path" 2>/dev/null || echo 0)
            local size_kb=$(awk "BEGIN {printf \"%.1f\", $size / 1024}")
            total_size=$((total_size + size))

            if [[ -n "$file_list" ]]; then
                file_list="${file_list},"
            fi
            file_list="${file_list}{\"name\":\"${file}\",\"size\":${size},\"sizeKB\":${size_kb}}"
        fi
    done

    # 50KB 阈值
    if [[ $total_size -gt $((50 * 1024)) ]]; then
        needs_migration=true
    fi

    if [[ "$JSON_OUTPUT" == true ]]; then
        local total_kb=$(awk "BEGIN {printf \"%.1f\", $total_size / 1024}")
        echo "{\"mode\":\"${mode}\",\"files\":[${file_list}],\"totalSize\":${total_size},\"totalKB\":${total_kb},\"needsMigration\":${needs_migration}}"
    else
        echo "Tracking mode: ${mode}"
        echo "Total size: $(awk "BEGIN {printf \"%.1f\", $total_size / 1024}") KB"
        echo "Needs migration: ${needs_migration}"
        for file in "${TRACKING_FILES[@]}"; do
            local file_path="${TRACKING_DIR}/${file}"
            if [[ -f "$file_path" ]]; then
                local size=$(stat -f%z "$file_path" 2>/dev/null || stat -c%s "$file_path" 2>/dev/null || echo 0)
                local size_kb=$(awk "BEGIN {printf \"%.1f\", $size / 1024}")
                echo "  ${file}: ${size_kb} KB"
            fi
        done
    fi
}

# 备份跟踪文件
backup_tracking_files() {
    local timestamp=$(date +"%Y%m%d-%H%M%S")
    local backup_path="${BACKUP_DIR}/${timestamp}"

    if [[ ! -d "$backup_path" ]]; then
        mkdir -p "$backup_path"
    fi

    for file in "${TRACKING_FILES[@]}"; do
        local src="${TRACKING_DIR}/${file}"
        if [[ -f "$src" ]]; then
            cp "$src" "${backup_path}/${file}"
        fi
    done

    # 也备份 story-facts.json
    local facts_file="${TRACKING_DIR}/story-facts.json"
    if [[ -f "$facts_file" ]]; then
        cp "$facts_file" "${backup_path}/story-facts.json"
    fi

    echo "$backup_path"
}

# 初始化分片结构
initialize_sharded_structure() {
    if [[ ! -d "$SUMMARY_DIR" ]]; then
        mkdir -p "$SUMMARY_DIR"
    fi
    if [[ ! -d "$VOLUMES_DIR" ]]; then
        mkdir -p "$VOLUMES_DIR"
    fi
}

# 主执行逻辑
case $MODE in
    check)
        get_tracking_status
        ;;
    backup)
        backup_path=$(backup_tracking_files)
        if [[ "$JSON_OUTPUT" == true ]]; then
            echo "{\"backupPath\":\"${backup_path}\"}"
        else
            echo "Backup created at: ${backup_path}"
        fi
        ;;
    auto)
        # 检查是否已经是分片模式
        if [[ -d "$VOLUMES_DIR" ]]; then
            volumes=$(find "$VOLUMES_DIR" -maxdepth 1 -type d -name "vol-*" 2>/dev/null | wc -l)
            if [[ "$JSON_OUTPUT" == true ]]; then
                echo "{\"status\":\"already-sharded\",\"volumes\":${volumes}}"
            else
                echo "Already in sharded mode."
            fi
            exit 0
        fi

        # 先备份
        backup_path=$(backup_tracking_files)

        # 创建目录结构
        initialize_sharded_structure

        if [[ "$JSON_OUTPUT" == true ]]; then
            cat <<EOF
{"status":"ready","backupPath":"${backup_path}","summaryDir":"${SUMMARY_DIR}","volumesDir":"${VOLUMES_DIR}","message":"Directory structure created. AI should now split data by volume boundaries."}
EOF
        else
            echo "Backup: ${backup_path}"
            echo "Structure created. AI should now split data by volume boundaries."
        fi
        ;;
esac
