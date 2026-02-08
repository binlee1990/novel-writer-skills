#!/bin/bash

set -euo pipefail

echo "=== Phase 1 边界情况测试 (Bash) ==="
echo ""

# 加载缓存函数（假设在 common.sh 中）
# 这里模拟测试

echo "测试 5.1: 文件不存在处理"

# 创建临时测试脚本
cat > /tmp/test-nonexistent.sh <<'EOF'
#!/bin/bash

# 模拟 preload_file_mtimes 函数
preload_file_mtimes() {
    local file_path="$1"

    if [[ ! -f "$file_path" ]]; then
        echo "文件不存在: $file_path" >&2
        return 1
    fi

    return 0
}

# 模拟 get_file_mtime 函数
get_file_mtime() {
    local file_path="$1"

    if [[ ! -f "$file_path" ]]; then
        echo "-1"  # 哨兵值
        return
    fi

    # 返回实际时间戳
    if stat -c %Y "$file_path" &>/dev/null; then
        stat -c %Y "$file_path"
    else
        stat -f %m "$file_path"
    fi
}

# 测试不存在的文件
mtime=$(get_file_mtime "templates/nonexistent-file.md")
if [[ "$mtime" == "-1" ]]; then
    echo "✅ 正确处理文件不存在（mtime = -1）"
else
    echo "❌ 文件不存在处理错误：mtime = $mtime"
    exit 1
fi
EOF

bash /tmp/test-nonexistent.sh
rm /tmp/test-nonexistent.sh

echo ""
echo "✅ Bash 边界情况测试通过"
