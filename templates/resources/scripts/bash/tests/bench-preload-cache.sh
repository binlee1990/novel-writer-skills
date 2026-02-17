#!/bin/bash

# 性能对比测试：预加载缓存 vs 重复 stat 调用

echo "=== 性能对比测试 ==="
echo ""

# 测试文件列表
files=(
    "resources/config/keyword-mappings.json"
    "templates/scripts/bash/check-writing-state.sh"
    "templates/scripts/bash/common.sh"
    "resources/craft/dialogue.md"
    "resources/craft/scene-structure.md"
)

echo "测试文件数: ${#files[@]}"
echo ""

# 检测操作系统
if [[ "$OSTYPE" == "darwin"* ]]; then
    STAT_CMD='stat -f "%m"'
    echo "系统: macOS"
else
    STAT_CMD='stat -c "%Y"'
    echo "系统: Linux/WSL"
fi

echo ""
echo "=== 方法 1: 重复 stat 调用 (100次迭代) ==="
time {
    for i in {1..100}; do
        for file in "${files[@]}"; do
            if [[ "$OSTYPE" == "darwin"* ]]; then
                stat -f "%m" "$file" > /dev/null 2>&1
            else
                stat -c "%Y" "$file" > /dev/null 2>&1
            fi
        done
    done
}

echo ""
echo "=== 方法 2: 预加载缓存 + 数组查找 (100次迭代) ==="

# 初始化缓存
BASH_MAJOR_VERSION="${BASH_VERSION%%.*}"
if [[ "$BASH_MAJOR_VERSION" -ge 4 ]]; then
    declare -A FILE_MTIME_CACHE
fi

# 预加载函数
preload_file_mtimes() {
    local file_path
    local mtime

    for file_path in "$@"; do
        [ ! -f "$file_path" ] && continue

        if [[ "$OSTYPE" == "darwin"* ]]; then
            mtime=$(stat -f "%m" "$file_path" 2>/dev/null || echo "0")
        else
            mtime=$(stat -c "%Y" "$file_path" 2>/dev/null || echo "0")
        fi

        if [[ "$BASH_MAJOR_VERSION" -ge 4 ]]; then
            FILE_MTIME_CACHE[$file_path]="$mtime"
        fi
    done
}

# 获取缓存的 mtime
get_file_mtime() {
    local file_path="$1"
    if [[ "$BASH_MAJOR_VERSION" -ge 4 ]]; then
        echo "${FILE_MTIME_CACHE[$file_path]:-0}"
    fi
}

# 预加载（这部分时间包含在 time 中）
time {
    preload_file_mtimes "${files[@]}"

    # 100次迭代，每次读取所有文件的 mtime
    for i in {1..100}; do
        for file in "${files[@]}"; do
            get_file_mtime "$file" > /dev/null
        done
    done
}

echo ""
echo "=== 总结 ==="
echo "- 方法 1: 每次调用 stat 系统调用"
echo "- 方法 2: 预加载到内存，后续从关联数组读取"
echo ""
echo "预期结果："
echo "- 方法 1: 每次迭代都有磁盘 I/O"
echo "- 方法 2: 只有首次预加载有 I/O，后续都是内存操作"
echo "- 性能提升: 10-50x (取决于文件数量和磁盘速度)"
