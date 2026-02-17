#!/bin/bash

# 测试预加载缓存功能

echo "=== 测试预加载缓存 ==="
echo ""

# Bash 版本检测
BASH_MAJOR_VERSION="${BASH_VERSION%%.*}"
echo "Bash 主版本: $BASH_MAJOR_VERSION"

# 缓存存储
if [[ "$BASH_MAJOR_VERSION" -ge 4 ]]; then
    declare -A FILE_MTIME_CACHE
    echo "使用关联数组"
else
    FILE_MTIME_CACHE_KEYS=()
    FILE_MTIME_CACHE_VALUES=()
    echo "使用线性数组"
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
        else
            FILE_MTIME_CACHE_KEYS+=("$file_path")
            FILE_MTIME_CACHE_VALUES+=("$mtime")
        fi
    done
}

# 获取缓存的 mtime
get_file_mtime() {
    local file_path="$1"

    if [[ "$BASH_MAJOR_VERSION" -ge 4 ]]; then
        echo "${FILE_MTIME_CACHE[$file_path]:-0}"
    else
        for i in "${!FILE_MTIME_CACHE_KEYS[@]}"; do
            if [[ "${FILE_MTIME_CACHE_KEYS[$i]}" == "$file_path" ]]; then
                echo "${FILE_MTIME_CACHE_VALUES[$i]}"
                return 0
            fi
        done
        echo "0"
    fi
}

# 检查是否已缓存
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

echo ""
echo "=== 测试 1: 预加载文件 ==="
files=(
    "resources/config/keyword-mappings.json"
    "templates/scripts/bash/check-writing-state.sh"
    "templates/scripts/bash/common.sh"
)

echo "预加载 ${#files[@]} 个文件..."
preload_file_mtimes "${files[@]}"

echo "缓存大小: ${#FILE_MTIME_CACHE[@]}"

echo ""
echo "=== 测试 2: 检查缓存状态 ==="
for file in "${files[@]}"; do
    if is_file_cached "$file"; then
        mtime=$(get_file_mtime "$file")
        echo "✅ $file (mtime: $mtime)"
    else
        echo "❌ $file 未缓存"
    fi
done

echo ""
echo "=== 测试 3: 获取 mtime (不使用命令替换) ==="
for file in "${files[@]}"; do
    get_file_mtime "$file"
done

echo ""
echo "=== 测试 4: 测试不存在的文件 ==="
nonexistent="/nonexistent/file.txt"
if is_file_cached "$nonexistent"; then
    echo "❌ 不存在的文件被标记为已缓存"
else
    echo "✅ 不存在的文件未被缓存"
fi

mtime=$(get_file_mtime "$nonexistent")
if [[ "$mtime" == "0" ]]; then
    echo "✅ 未缓存文件返回 0"
else
    echo "❌ 未缓存文件返回: $mtime"
fi

echo ""
echo "=== 测试完成 ==="
