#!/bin/bash
set -euo pipefail

# 测试缓存语义修复
# 验证 mtime=-1 表示文件不存在，mtime=0 表示 stat 失败

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== 测试缓存语义修复 ==="
echo ""

# 测试准备：创建临时测试文件
TEST_EXISTING="$SCRIPT_DIR/temp-test-existing.txt"
TEST_MISSING="$SCRIPT_DIR/temp-test-missing.txt"

echo "test content" > "$TEST_EXISTING"

# 清理函数
cleanup() {
    rm -f "$TEST_EXISTING"
}
trap cleanup EXIT

# ============================================
# 复制缓存函数（从源脚本）
# ============================================

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

# 预加载文件修改时间到缓存
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

# 检查文件是否存在（基于缓存）
is_file_exists_cached() {
    local file_path="$1"
    local mtime=$(get_file_mtime "$file_path")

    # mtime > 0: 文件存在
    # mtime = 0: stat 失败或未缓存
    # mtime = -1: 文件不存在
    [[ "$mtime" != "0" && "$mtime" != "-1" ]]
}

# ============================================
# 测试用例
# ============================================

# 测试 1: 存在的文件
echo "测试 1: 存在的文件"
preload_file_mtimes "$TEST_EXISTING"
if is_file_exists_cached "$TEST_EXISTING"; then
    echo "✅ 存在的文件检测正确"
else
    echo "❌ 存在的文件检测错误"
    exit 1
fi

# 测试 2: 不存在的文件
echo ""
echo "测试 2: 不存在的文件"
preload_file_mtimes "$TEST_MISSING"
if is_file_exists_cached "$TEST_MISSING"; then
    echo "❌ 不存在的文件被误判为存在"
    exit 1
else
    echo "✅ 不存在的文件检测正确"
fi

# 测试 3: 检查缓存值
echo ""
echo "测试 3: 检查缓存值"
mtime_existing=$(get_file_mtime "$TEST_EXISTING")
mtime_missing=$(get_file_mtime "$TEST_MISSING")

echo "存在文件的 mtime: $mtime_existing (应该 > 0)"
echo "不存在文件的 mtime: $mtime_missing (应该 = -1)"

if [[ "$mtime_existing" -gt 0 && "$mtime_missing" == "-1" ]]; then
    echo "✅ 缓存值语义正确"
else
    echo "❌ 缓存值语义错误"
    echo "  存在文件 mtime: $mtime_existing (期望 > 0)"
    echo "  不存在文件 mtime: $mtime_missing (期望 = -1)"
    exit 1
fi

# 测试 4: 测试批量预加载
echo ""
echo "测试 4: 批量预加载混合文件"
TEST_MISSING_2="$SCRIPT_DIR/temp-test-missing-2.txt"
preload_file_mtimes "$TEST_EXISTING" "$TEST_MISSING" "$TEST_MISSING_2"

existing_count=0
missing_count=0

for file in "$TEST_EXISTING" "$TEST_MISSING" "$TEST_MISSING_2"; do
    if is_file_exists_cached "$file"; then
        existing_count=$((existing_count + 1))
    else
        missing_count=$((missing_count + 1))
    fi
done

echo "检测到存在的文件: $existing_count (期望 1)"
echo "检测到不存在的文件: $missing_count (期望 2)"

if [[ "$existing_count" -eq 1 && "$missing_count" -eq 2 ]]; then
    echo "✅ 批量预加载检测正确"
else
    echo "❌ 批量预加载检测错误"
    exit 1
fi

# 测试 5: 未缓存文件（返回 mtime=0）
echo ""
echo "测试 5: 未缓存的文件"
UNCACHED_FILE="$SCRIPT_DIR/temp-uncached.txt"
mtime_uncached=$(get_file_mtime "$UNCACHED_FILE")
echo "未缓存文件的 mtime: $mtime_uncached (应该 = 0)"

if [[ "$mtime_uncached" == "0" ]]; then
    echo "✅ 未缓存文件返回值正确"
else
    echo "❌ 未缓存文件返回值错误 (期望 0，实际 $mtime_uncached)"
    exit 1
fi

if is_file_exists_cached "$UNCACHED_FILE"; then
    echo "❌ 未缓存文件被误判为存在"
    exit 1
else
    echo "✅ 未缓存文件检测正确（不存在）"
fi

echo ""
echo "=== 测试完成 ==="
echo ""
echo "所有测试通过！缓存语义修复成功。"
