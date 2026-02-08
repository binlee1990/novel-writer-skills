# 性能优化设计方案

**文档类型**: 设计方案
**创建日期**: 2026-02-08
**版本**: 1.0.0
**状态**: 已批准，待实施

## 概述

本文档描述 novel-writer-skills 项目的性能优化设计方案。优化目标是提升命令执行速度和资源加载效率，减少重复计算和文件读取。

**优化范围**: 全部三阶段
- Phase 1: 脚本层优化（预估 2-3h）
- Phase 2: 会话层优化（预估 2-3h）
- Phase 3: 维护层优化（预估 1-2h）

**参考文档**: `docs/guides/performance-optimization.md`

---

## 1. 总体架构

### 1.1 优化架构概览

性能优化采用**三层架构**，与现有的资源加载三层架构平行：

```
┌─────────────────────────────────────────┐
│  Phase 1: 脚本层优化（基础设施）        │
│  - 文件时间戳缓存                       │
│  - 预编译正则表达式                     │
│  - YAML 解析结果缓存                    │
│  收益：命令启动时间减少 20-30%          │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│  Phase 2: 会话层优化（AI 协同）         │
│  - Prompt 缓存指导                      │
│  - 脚本输出缓存标记                     │
│  - 双层资源去重（脚本 + Prompt）        │
│  收益：重复命令执行速度提升 40%+        │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│  Phase 3: 维护层优化（长期稳定）        │
│  - 缓存文件自动清理                     │
│  - 性能监控埋点（可选）                 │
│  收益：避免缓存堆积，保持系统健康        │
└─────────────────────────────────────────┘
```

### 1.2 跳过的优化项

以下优化项经评估后决定**不实施**（成本收益比不高）：

- ❌ **并行文件读取**: Bash 环境下实现复杂度高，收益低（文件读取本身很快）
- ❌ **分层内存管理**: 无长驻进程，脚本执行完自动释放内存，不需要
- ❌ **独立 YAML 缓存**: 已包含在脚本缓存的 `spec_parsed` 字段中，无需单独实现

---

## 2. Phase 1: 脚本层优化

### 2.1 文件时间戳缓存

#### 2.1.1 设计决策

**选择方案**: 文件时间戳缓存

**理由**:
- ✅ 简单可靠，Bash/PowerShell 都容易实现
- ✅ 自动检测 specification.md 配置变化
- ✅ 无需手动清理（基于文件修改时间自动失效）

**替代方案**（未采用）:
- 内容哈希缓存：更精确但计算哈希有开销
- TTL 缓存：过于简单，用户修改配置后可能看不到效果

#### 2.1.2 缓存位置

**路径**: `.specify/.cache/resource-report.json`

**目录结构**:
```
.specify/
└── .cache/
    └── resource-report.json
```

#### 2.1.3 缓存内容

```json
{
  "cache_version": "1.0",
  "generated_at": "2026-02-08T12:34:56Z",
  "spec_file_mtime": 1707392096,
  "spec_parsed": {
    "resource_loading_enabled": true,
    "auto_load": true
  },
  "resources": {
    "knowledge_base": [
      "craft/dialogue.md",
      "craft/pacing.md",
      "craft/scene-structure.md"
    ],
    "skills": [
      "writing-techniques/dialogue-techniques",
      "writing-techniques/scene-structure"
    ]
  },
  "warnings": [],
  "cached": true
}
```

**字段说明**:
- `cache_version`: 缓存格式版本，用于兼容性检查
- `generated_at`: 缓存生成时间（ISO 8601 格式）
- `spec_file_mtime`: specification.md 的修改时间戳（Unix timestamp）
- `spec_parsed`: 解析后的 YAML 配置（包含 YAML 解析缓存）
- `resources`: 需要加载的资源列表
- `warnings`: 警告信息（如缺失的文件）
- `cached`: 布尔标记，表示此报告来自缓存

#### 2.1.4 失效逻辑

**Bash 实现**:

```bash
#!/bin/bash

CACHE_FILE=".specify/.cache/resource-report.json"
SPEC_FILE="stories/$STORY_NAME/specification.md"

# 检查缓存是否有效
is_cache_valid() {
  # 缓存文件和规格文件都必须存在
  if [ ! -f "$CACHE_FILE" ] || [ ! -f "$SPEC_FILE" ]; then
    return 1
  fi

  # 获取文件修改时间（兼容 macOS 和 Linux）
  if stat -c %Y "$CACHE_FILE" &>/dev/null; then
    # GNU stat (Linux)
    CACHE_TIME=$(stat -c %Y "$CACHE_FILE")
    SPEC_TIME=$(stat -c %Y "$SPEC_FILE")
  else
    # BSD stat (macOS)
    CACHE_TIME=$(stat -f %m "$CACHE_FILE")
    SPEC_TIME=$(stat -f %m "$SPEC_FILE")
  fi

  # 缓存时间必须晚于规格文件修改时间
  if [ $CACHE_TIME -gt $SPEC_TIME ]; then
    return 0  # 缓存有效
  else
    return 1  # 缓存失效
  fi
}

# 主逻辑
if is_cache_valid; then
  # 缓存有效，直接返回
  cat "$CACHE_FILE"
  exit 0
fi

# 缓存失效，重新生成
mkdir -p "$(dirname "$CACHE_FILE")"
generate_resource_report > "$CACHE_FILE"
cat "$CACHE_FILE"
```

**PowerShell 实现**:

```powershell
$cacheFile = ".specify\.cache\resource-report.json"
$specFile = "stories\$storyName\specification.md"

function Is-CacheValid {
  if (-not (Test-Path $cacheFile) -or -not (Test-Path $specFile)) {
    return $false
  }

  $cacheTime = (Get-Item $cacheFile).LastWriteTime
  $specTime = (Get-Item $specFile).LastWriteTime

  return $cacheTime -gt $specTime
}

# 主逻辑
if (Is-CacheValid) {
  Get-Content $cacheFile
  exit 0
}

# 缓存失效，重新生成
New-Item -ItemType Directory -Force -Path (Split-Path $cacheFile) | Out-Null
Generate-ResourceReport | Out-File $cacheFile -Encoding UTF8
Get-Content $cacheFile
```

### 2.2 预编译正则表达式

#### 2.2.1 设计决策

**选择方案**: 扩展 JSON 配置文件

**理由**:
- ✅ 正则只构建一次（在配置文件中）
- ✅ 脚本运行时直接使用，零开销
- ✅ 易于维护和审计

**替代方案**（未采用）:
- 脚本启动时编译：自动化但增加复杂度
- Markdown 模板层处理：分散在多个文件，难以维护

#### 2.2.2 配置文件扩展

**修改文件**: `templates/config/keyword-mappings.json`

**新增字段**: `regex` 和 `regex_flags`

**扩展后的配置**:

```json
{
  "version": "1.1.0",
  "description": "关键词触发机制的映射表（含预编译正则）",
  "mappings": {
    "craft-knowledge": {
      "dialogue": {
        "keywords": ["对话", "台词", "说话", "对白", "conversation", "dialogue"],
        "regex": "对话|台词|说话|对白|conversation|dialogue",
        "regex_flags": "i",
        "resources": [
          "templates/knowledge-base/craft/dialogue.md",
          "templates/skills/writing-techniques/dialogue-techniques/SKILL.md"
        ],
        "priority": 1
      },
      "scene-structure": {
        "keywords": ["场景", "镜头", "画面", "scene", "structure"],
        "regex": "场景|镜头|画面|scene|structure",
        "regex_flags": "i",
        "resources": [
          "templates/knowledge-base/craft/scene-structure.md",
          "templates/skills/writing-techniques/scene-structure/SKILL.md"
        ],
        "priority": 1
      },
      "character-arc": {
        "keywords": ["角色成长", "角色弧线", "弧线", "转变", "成长", "character arc", "transformation"],
        "regex": "角色成长|角色弧线|弧线|转变|成长|character\\s*arc|transformation",
        "regex_flags": "i",
        "resources": [
          "templates/knowledge-base/craft/character-arc.md",
          "templates/skills/writing-techniques/character-arc/SKILL.md"
        ],
        "priority": 1
      },
      "pacing": {
        "keywords": ["节奏", "拖沓", "太快", "太慢", "过快", "过慢", "pacing", "rhythm"],
        "regex": "节奏|拖沓|太快|太慢|过快|过慢|pacing|rhythm",
        "regex_flags": "i",
        "resources": [
          "templates/knowledge-base/craft/pacing.md",
          "templates/skills/writing-techniques/pacing-control/SKILL.md"
        ],
        "priority": 1
      },
      "show-not-tell": {
        "keywords": ["展示", "描写", "tell", "show", "showing", "telling"],
        "regex": "展示|描写|tell|show|showing|telling",
        "regex_flags": "i",
        "resources": [
          "templates/knowledge-base/craft/show-not-tell.md"
        ],
        "priority": 1
      }
    },
    "genre-knowledge": {
      "romance": {
        "keywords": ["言情", "恋爱", "感情", "爱情", "romance", "love"],
        "regex": "言情|恋爱|感情|爱情|romance|love",
        "regex_flags": "i",
        "resources": [
          "templates/knowledge-base/genres/romance.md",
          "templates/skills/genre-knowledge/romance/SKILL.md"
        ],
        "priority": 2
      },
      "mystery": {
        "keywords": ["悬疑", "推理", "线索", "mystery", "detective", "clue"],
        "regex": "悬疑|推理|线索|mystery|detective|clue",
        "regex_flags": "i",
        "resources": [
          "templates/knowledge-base/genres/mystery.md",
          "templates/skills/genre-knowledge/mystery/SKILL.md"
        ],
        "priority": 2
      }
    }
  }
}
```

#### 2.2.3 脚本使用

**Bash 实现**:

```bash
#!/bin/bash

# 读取预编译正则表达式
get_keyword_regex() {
  local category=$1
  local name=$2

  jq -r ".mappings[\"$category\"][\"$name\"].regex" \
    templates/config/keyword-mappings.json
}

# 匹配关键词
match_keywords() {
  local text=$1
  local matched=()

  # 遍历所有映射
  for category in "craft-knowledge" "genre-knowledge"; do
    # 获取该分类下的所有项
    local items=$(jq -r ".mappings[\"$category\"] | keys[]" \
      templates/config/keyword-mappings.json)

    for item in $items; do
      local regex=$(get_keyword_regex "$category" "$item")

      # 直接使用预编译的正则，无需运行时构建
      if echo "$text" | grep -iE "$regex" > /dev/null; then
        matched+=("$category:$item")
      fi
    done
  done

  echo "${matched[@]}"
}

# 使用示例
user_input="我想改进这段对话的节奏"
matches=$(match_keywords "$user_input")
echo "匹配到: $matches"
# 输出: 匹配到: craft-knowledge:dialogue craft-knowledge:pacing
```

**PowerShell 实现**:

```powershell
# 读取配置文件
$config = Get-Content templates/config/keyword-mappings.json | ConvertFrom-Json

function Match-Keywords($text) {
  $matched = @()

  foreach ($category in $config.mappings.PSObject.Properties) {
    foreach ($item in $category.Value.PSObject.Properties) {
      $regex = $item.Value.regex

      # 直接使用预编译的正则
      if ($text -match $regex) {
        $matched += "$($category.Name):$($item.Name)"
      }
    }
  }

  return $matched
}
```

### 2.3 YAML 解析缓存

#### 2.3.1 设计决策

**选择方案**: 包含在脚本缓存中

**理由**:
- ✅ 复用 Phase 1 的文件时间戳缓存机制
- ✅ YAML 解析只在缓存失效时执行一次
- ✅ 零额外成本，无需单独的缓存逻辑

**替代方案**（未采用）:
- 独立 YAML 缓存文件：增加复杂度，收益不明显

#### 2.3.2 实现方式

YAML 解析结果存储在 `resource-report.json` 的 `spec_parsed` 字段中：

```json
{
  "spec_parsed": {
    "resource_loading_enabled": true,
    "auto_load": true,
    "configured_resources": {
      "knowledge_base": {
        "craft": ["dialogue", "pacing"]
      },
      "skills": {
        "writing_techniques": ["dialogue-techniques"]
      }
    }
  }
}
```

当 specification.md 修改时，文件时间戳变化，缓存自动失效，YAML 重新解析。

---

## 3. Phase 2: 会话层优化

### 3.1 Prompt 缓存指导

#### 3.1.1 设计决策

**选择方案**: Prompt 指导 + 脚本标记组合

**理由**:
- ✅ 利用 Claude 的对话记忆能力
- ✅ 脚本和 prompt 结合，双重机制增加成功率
- ✅ 灵活，AI 可以智能判断缓存时机

**替代方案**（未采用）:
- 仅 Prompt 指导：依赖 AI 理解，不够可靠
- 跳过会话级缓存：放弃 40% 的性能提升潜力

#### 3.1.2 Markdown 模板修改

**修改文件**: 核心 Command 模板
- `templates/commands/write.md`
- `templates/commands/plan.md`
- `templates/commands/analyze.md`

**新增章节**（在资源加载章节后）:

```markdown
## 性能优化：会话级缓存

**缓存策略**：
本次对话中已加载的资源应复用，避免重复读取。

**操作指南**：
1. **首次加载**：读取资源文件，记住已加载的路径列表
2. **后续命令**：检查资源是否在"已加载列表"中
   - ✅ 如果已加载：直接使用现有知识，不要重新读取
   - ❌ 如果未加载：读取文件并添加到"已加载列表"

**示例**：
假设本次对话已执行过 `/write chapter-1`，加载了：
- craft/dialogue.md
- craft/scene-structure.md

当用户执行 `/write chapter-2` 时：
- 如需 dialogue 知识 → 直接使用，不重新读取
- 如需 pacing 知识 → 首次需要，读取文件

**注意**：如果用户修改了 specification.md 的 resource-loading 配置，
应重新读取资源（配置变化 = 缓存失效）。

**缓存失效条件**：
- 用户明确要求重新加载
- specification.md 被修改（脚本会标记 `cached: false`）
- 发现资源文件内容与记忆不符
```

### 3.2 脚本输出缓存标记

#### 3.2.1 JSON 输出扩展

**修改文件**: `templates/scripts/bash/check-writing-state.sh`

**在 JSON 输出中添加字段**:

```json
{
  "status": "ready",
  "timestamp": "2026-02-08T12:34:56Z",
  "cached": true,
  "cache_hint": "此报告基于缓存生成（specification.md 未修改）。AI 可复用本次会话中已加载的资源。",
  "session_cache_enabled": true,
  "spec_file_mtime": 1707392096,
  "resources": {
    "knowledge_base": ["craft/dialogue.md", "craft/pacing.md"],
    "skills": ["writing-techniques/dialogue-techniques"]
  },
  "warnings": []
}
```

**字段说明**:
- `cached`: 布尔值，true 表示报告来自缓存
- `cache_hint`: 给 AI 的缓存提示
- `session_cache_enabled`: 启用会话级缓存标记

#### 3.2.2 Markdown 模板识别

在 Command 模板的前置检查部分：

```markdown
## 前置检查

执行以下脚本获取写作状态：

\`\`\`bash
bash templates/scripts/bash/check-writing-state.sh --json
\`\`\`

**解读脚本输出**：
- 如果 `cached: true`：
  - specification.md 未修改，配置稳定
  - 本次会话已加载的资源可以复用
  - 优先使用已有知识，减少文件读取
- 如果 `cached: false`：
  - 配置可能已变化，需要重新读取资源
```

### 3.3 双层资源去重

#### 3.3.1 设计决策

**选择方案**: 脚本 + Prompt 双层去重

**理由**:
- ✅ 脚本层确保性能（关联数组 O(1) 查找）
- ✅ Prompt 层增加灵活性（AI 理解上下文）
- ✅ 双重保险，最大化去重效果

**替代方案**（未采用）:
- 仅 Bash 关联数组：性能最优但不够灵活
- 仅 Prompt 指导：依赖 AI，不可控

#### 3.3.2 脚本层实现

**Bash 实现（使用关联数组）**:

```bash
#!/bin/bash

# 声明关联数组（Bash 4.0+）
declare -A loaded_resources_set

# 检查资源是否已加载（O(1) 时间复杂度）
is_resource_loaded() {
  local path=$1
  [[ ${loaded_resources_set["$path"]+_} ]]
}

# 标记资源为已加载
mark_resource_loaded() {
  local path=$1
  loaded_resources_set["$path"]=1
}

# 使用示例
if ! is_resource_loaded "craft/dialogue.md"; then
  echo "首次加载: craft/dialogue.md"
  mark_resource_loaded "craft/dialogue.md"
else
  echo "已加载，跳过: craft/dialogue.md"
fi
```

**兼容性处理**（Bash 3.x 降级）:

```bash
# 检测 Bash 版本
if [ "${BASH_VERSINFO[0]}" -lt 4 ]; then
  echo "警告: Bash 版本低于 4.0，资源去重性能可能较低" >&2

  # 降级到线性数组
  loaded_resources_array=()

  is_resource_loaded() {
    local path=$1
    for loaded in "${loaded_resources_array[@]}"; do
      if [ "$loaded" = "$path" ]; then
        return 0
      fi
    done
    return 1
  }

  mark_resource_loaded() {
    local path=$1
    loaded_resources_array+=("$path")
  }
fi
```

**PowerShell 实现（使用 HashTable）**:

```powershell
# 声明 HashTable
$loadedResourcesSet = @{}

function Is-ResourceLoaded($path) {
  return $loadedResourcesSet.ContainsKey($path)
}

function Mark-ResourceLoaded($path) {
  $loadedResourcesSet[$path] = $true
}

# 使用示例
if (-not (Is-ResourceLoaded "craft/dialogue.md")) {
  Write-Host "首次加载: craft/dialogue.md"
  Mark-ResourceLoaded "craft/dialogue.md"
} else {
  Write-Host "已加载，跳过: craft/dialogue.md"
}
```

#### 3.3.3 Prompt 层实现

在 3.1 的 Prompt 缓存指导中已包含"已加载列表"的概念，AI 应维护这个列表并在加载前检查。

---

## 4. Phase 3: 维护层优化

### 4.1 缓存文件自动清理

#### 4.1.1 设计决策

**清理策略**:
- **触发时机**: 每次脚本执行时检查（轻量级，不影响性能）
- **清理规则**: 删除超过 24 小时未访问的缓存文件
- **保留条件**: 当前活跃故事的缓存不清理

**理由**:
- ✅ 防止缓存文件无限堆积
- ✅ 自动化，无需用户干预
- ✅ 24 小时阈值平衡了性能和磁盘占用

#### 4.1.2 Bash 实现

```bash
#!/bin/bash

# 清理旧缓存文件
cleanup_old_cache() {
  local cache_dir=".specify/.cache"

  # 缓存目录不存在，无需清理
  if [ ! -d "$cache_dir" ]; then
    return
  fi

  # 删除超过 24 小时未修改的缓存文件
  # -mtime +1 表示修改时间超过 1 天（24 小时）
  find "$cache_dir" -name "*.json" -type f -mtime +1 -delete 2>/dev/null || true

  # 删除空目录
  find "$cache_dir" -type d -empty -delete 2>/dev/null || true
}

# 在脚本开始时调用（轻量级，不影响性能）
cleanup_old_cache
```

#### 4.1.3 PowerShell 实现

```powershell
function Cleanup-OldCache {
  $cacheDir = ".specify\.cache"

  # 缓存目录不存在，无需清理
  if (-not (Test-Path $cacheDir)) {
    return
  }

  # 删除超过 24 小时的缓存文件
  $cutoffTime = (Get-Date).AddDays(-1)
  Get-ChildItem -Path $cacheDir -Filter "*.json" -File -ErrorAction SilentlyContinue |
    Where-Object { $_.LastWriteTime -lt $cutoffTime } |
    Remove-Item -Force -ErrorAction SilentlyContinue

  # 删除空目录
  Get-ChildItem -Path $cacheDir -Directory -ErrorAction SilentlyContinue |
    Where-Object { (Get-ChildItem $_.FullName -ErrorAction SilentlyContinue).Count -eq 0 } |
    Remove-Item -Force -ErrorAction SilentlyContinue
}

# 在脚本开始时调用
Cleanup-OldCache
```

### 4.2 性能监控埋点（可选）

#### 4.2.1 设计决策

**实现方式**: 轻量级性能指标嵌入 JSON 输出

**用途**:
- 开发阶段：验证优化效果
- 生产环境：可选启用（通过环境变量控制）

#### 4.2.2 JSON 输出扩展

```json
{
  "status": "ready",
  "cached": true,
  "performance": {
    "cache_hit": true,
    "generation_time_ms": 8,
    "timestamp": "2026-02-08T12:34:56Z"
  },
  "resources": {...}
}
```

#### 4.2.3 可选性能日志

```bash
# 环境变量控制
if [ "$PERF_LOG_ENABLED" = "true" ]; then
  local perf_log=".specify/.cache/perf.log"
  local timestamp=$(date -Iseconds)
  echo "$timestamp,cache_hit,$generation_time_ms" >> "$perf_log"
fi
```

### 4.3 缓存健壮性

#### 4.3.1 设计原则

**向后兼容性**:
- 缓存失败自动回退到重新生成
- 旧版本缓存自动失效
- 目录不存在时自动创建

#### 4.3.2 健壮性处理

```bash
#!/bin/bash

# 安全读取缓存
read_cache_safe() {
  local cache_file=$1

  # 缓存文件不存在
  if [ ! -f "$cache_file" ]; then
    return 1
  fi

  # 验证 JSON 格式
  if ! jq empty "$cache_file" 2>/dev/null; then
    echo "警告: 缓存文件损坏，删除并重新生成" >&2
    rm -f "$cache_file"
    return 1
  fi

  # 检查版本号
  local version=$(jq -r '.cache_version // "0.0"' "$cache_file")
  if [ "$version" != "1.0" ]; then
    echo "警告: 缓存版本不匹配（$version != 1.0），重新生成" >&2
    rm -f "$cache_file"
    return 1
  fi

  # 缓存有效，返回内容
  cat "$cache_file"
  return 0
}

# 原子写入缓存（避免并发写入导致损坏）
write_cache_atomic() {
  local cache_file=$1
  local content=$2

  # 写入临时文件
  local temp_file="${cache_file}.tmp.$$"
  echo "$content" > "$temp_file"

  # 验证 JSON 格式
  if ! jq empty "$temp_file" 2>/dev/null; then
    echo "错误: 生成的缓存内容无效，放弃写入" >&2
    rm -f "$temp_file"
    return 1
  fi

  # 原子重命名（覆盖旧缓存）
  mv -f "$temp_file" "$cache_file"
  return 0
}

# 使用示例
if read_cache_safe "$CACHE_FILE"; then
  # 缓存有效
  exit 0
else
  # 缓存失效，重新生成
  report=$(generate_resource_report)
  write_cache_atomic "$CACHE_FILE" "$report"
  echo "$report"
fi
```

---

## 5. 测试和验证方案

### 5.1 基准测试场景

#### 场景 1: 冷启动（无缓存）

**目的**: 测试首次执行性能（建立基线）

**步骤**:
```bash
# 清空缓存
rm -rf .specify/.cache/

# 执行命令并测量时间
time bash templates/scripts/bash/check-writing-state.sh
```

**预期结果**:
- 执行时间: ~40-50ms（首次生成）
- JSON 输出: `"cached": false`

#### 场景 2: 热启动（有缓存）

**目的**: 验证缓存命中性能

**步骤**:
```bash
# 第二次执行（缓存已生成）
time bash templates/scripts/bash/check-writing-state.sh
```

**预期结果**:
- 执行时间: ~5-10ms（读取缓存）
- JSON 输出: `"cached": true`
- **性能提升**: 比冷启动快 80%+

#### 场景 3: 缓存失效

**目的**: 验证缓存失效机制

**步骤**:
```bash
# 修改 specification.md（触发缓存失效）
touch stories/*/specification.md

# 执行命令
time bash templates/scripts/bash/check-writing-state.sh
```

**预期结果**:
- 执行时间: ~40-50ms（重新生成）
- JSON 输出: `"cached": false`
- 新缓存文件被创建

#### 场景 4: 关键词匹配性能

**目的**: 验证预编译正则的效果

**步骤**:
```bash
# 准备测试文本（5000 字，包含多个关键词）
test_text="这是一个包含对话、场景、节奏、角色成长等关键词的长文本..."

# 测试匹配时间
time bash -c '
  echo "$test_text" | \
  grep -iEf <(jq -r ".mappings[][] .regex" templates/config/keyword-mappings.json)
'
```

**预期结果**:
- 匹配时间: <50ms（使用预编译正则）
- 正确识别所有关键词

#### 场景 5: 连续命令执行

**目的**: 模拟真实使用场景

**步骤**:
```bash
# 连续执行 5 次 /write 命令
for i in {1..5}; do
  time bash templates/scripts/bash/check-writing-state.sh
done
```

**预期结果**:
- 第 1 次: ~45ms（冷启动）
- 第 2-5 次: ~8ms（缓存命中）
- **总时间**: ~100ms（vs 优化前 ~250ms）
- **性能提升**: 60%+

### 5.2 验收标准

#### Phase 1 验收标准

- ✅ **缓存命中率** > 90%（连续执行 10 次，9 次应命中缓存）
- ✅ **缓存读取速度** < 10ms
- ✅ **缓存失效正确性**: specification.md 修改后缓存自动失效
- ✅ **预编译正则性能**: 5000 字文本匹配时间 < 50ms
- ✅ **YAML 解析缓存**: 包含在 resource-report.json 的 `spec_parsed` 字段

#### Phase 2 验收标准

- ✅ **Markdown 模板完整性**: 所有核心 Command 包含"性能优化：会话级缓存"章节
- ✅ **脚本输出标记**: JSON 包含 `cached`、`cache_hint`、`session_cache_enabled` 字段
- ✅ **关联数组去重**: Bash 4.0+ 使用关联数组，O(1) 查找
- ✅ **PowerShell HashTable**: PowerShell 使用 HashTable 实现去重
- ✅ **Bash 3.x 兼容**: 低版本 Bash 降级到线性数组，功能正常

#### Phase 3 验收标准

- ✅ **缓存清理功能**: 24 小时前的缓存文件被自动清理
- ✅ **当前缓存保留**: 活跃故事的缓存不被清理
- ✅ **缓存损坏恢复**: JSON 损坏时自动删除并重新生成
- ✅ **版本兼容性**: 检测 `cache_version`，不匹配则重新生成
- ✅ **原子写入**: 使用临时文件 + 重命名，避免并发写入损坏

### 5.3 性能对比表

**预期性能提升**:

| 场景 | 优化前 | 优化后 | 提升 |
|------|--------|--------|------|
| 脚本执行（冷启动） | ~50ms | ~45ms | 10% |
| 脚本执行（热启动） | ~50ms | ~8ms | **84%** ⭐ |
| 关键词匹配（5000 字） | ~100ms | ~40ms | **60%** ⭐ |
| 连续 5 次 /write | ~250ms | ~100ms | **60%** ⭐ |

**总体目标**:
- Phase 1 单独: 命令启动时间减少 20-30%
- Phase 1+2 组合: 重复命令执行速度提升 40-60%
- Phase 1+2+3 组合: 长期运行保持性能稳定

### 5.4 回归测试

**功能完整性测试**:

```bash
#!/bin/bash
# 测试脚本：test-core-commands.sh

test_commands=(
  "/write chapter-1"
  "/plan"
  "/analyze chapter-1 --check pacing"
  "/track"
)

echo "开始回归测试..."

for cmd in "${test_commands[@]}"; do
  echo ""
  echo "测试命令: $cmd"

  # 执行命令（实际测试中需要 Claude Code 环境）
  # 此处仅验证脚本部分
  bash templates/scripts/bash/check-writing-state.sh --json > /tmp/test-output.json

  # 验证 JSON 格式
  if jq empty /tmp/test-output.json 2>/dev/null; then
    echo "✅ JSON 格式正确"
  else
    echo "❌ JSON 格式错误"
    exit 1
  fi

  # 验证必需字段
  if jq -e '.status, .resources' /tmp/test-output.json > /dev/null 2>&1; then
    echo "✅ 必需字段存在"
  else
    echo "❌ 缺少必需字段"
    exit 1
  fi
done

echo ""
echo "✅ 所有回归测试通过"
```

**兼容性测试矩阵**:

| 环境 | Bash 版本 | PowerShell 版本 | 测试状态 |
|------|-----------|----------------|----------|
| macOS Catalina | 3.2 | - | ✅ 降级到线性数组 |
| macOS Big Sur+ | 5.x | - | ✅ 使用关联数组 |
| Ubuntu 20.04+ | 5.x | - | ✅ 使用关联数组 |
| Windows Git Bash | 4.4+ | - | ✅ 使用关联数组 |
| Windows PowerShell | - | 5.1 | ✅ 使用 HashTable |
| Windows PowerShell Core | - | 7.x | ✅ 使用 HashTable |

---

## 6. 实施路线图

### 6.1 Phase 1: 脚本层优化（2-3 小时）

**任务清单**:

1. **扩展 keyword-mappings.json**（30 分钟）
   - [ ] 为所有映射添加 `regex` 字段
   - [ ] 添加 `regex_flags` 字段
   - [ ] 验证正则表达式语法正确性
   - [ ] 提交更改

2. **修改 check-writing-state.sh**（60 分钟）
   - [ ] 实现时间戳缓存逻辑
   - [ ] 实现缓存读取/写入
   - [ ] 使用预编译正则进行关键词匹配
   - [ ] 添加缓存版本检查
   - [ ] 提交更改

3. **修改 check-writing-state.ps1**（45 分钟）
   - [ ] PowerShell 版本的缓存逻辑
   - [ ] 使用预编译正则
   - [ ] 提交更改

4. **创建测试用例**（30 分钟）
   - [ ] 编写冷启动测试
   - [ ] 编写热启动测试
   - [ ] 编写缓存失效测试
   - [ ] 运行所有测试并验证通过

5. **文档更新**（15 分钟）
   - [ ] 更新 performance-optimization.md（标记 Phase 1 已实施）
   - [ ] 提交更改

**验收标准**:
- ✅ 缓存命中时脚本执行时间 < 10ms
- ✅ 所有测试用例通过
- ✅ Bash 和 PowerShell 版本功能一致

**预估工时**: 2-3 小时

---

### 6.2 Phase 2: 会话层优化（2-3 小时）

**任务清单**:

1. **修改核心 Command 模板**（60 分钟）
   - [ ] write.md 添加"性能优化：会话级缓存"章节
   - [ ] plan.md 添加缓存章节
   - [ ] analyze.md 添加缓存章节
   - [ ] 提交更改

2. **修改脚本 JSON 输出**（30 分钟）
   - [ ] check-writing-state.sh 添加缓存标记字段
   - [ ] check-writing-state.ps1 添加缓存标记字段
   - [ ] 提交更改

3. **实现双层去重**（60 分钟）
   - [ ] Bash 关联数组实现（Bash 4.0+）
   - [ ] Bash 3.x 降级处理（线性数组）
   - [ ] PowerShell HashTable 实现
   - [ ] 提交更改

4. **创建会话级缓存测试**（30 分钟）
   - [ ] 编写测试场景（模拟连续命令执行）
   - [ ] 手动测试 AI 是否理解缓存指导
   - [ ] 记录测试结果

5. **文档更新**（15 分钟）
   - [ ] 更新 performance-optimization.md（标记 Phase 2 已实施）
   - [ ] 提交更改

**验收标准**:
- ✅ Markdown 模板包含缓存指导
- ✅ 脚本输出包含 `cached: true` 标记
- ✅ 关联数组/HashTable 去重工作正常
- ✅ 手动测试验证 AI 理解缓存策略

**预估工时**: 2-3 小时

---

### 6.3 Phase 3: 维护层优化（1-2 小时）

**任务清单**:

1. **添加缓存清理逻辑**（30 分钟）
   - [ ] Bash 版本缓存清理函数
   - [ ] PowerShell 版本缓存清理函数
   - [ ] 集成到脚本开头
   - [ ] 提交更改

2. **添加性能监控埋点**（可选，30 分钟）
   - [ ] JSON 输出添加 performance 字段
   - [ ] 环境变量控制性能日志
   - [ ] 提交更改

3. **添加缓存健壮性处理**（30 分钟）
   - [ ] 实现 read_cache_safe 函数
   - [ ] 实现 write_cache_atomic 函数
   - [ ] 版本检查逻辑
   - [ ] 提交更改

4. **创建长期运行测试**（15 分钟）
   - [ ] 测试缓存清理功能
   - [ ] 测试缓存损坏恢复
   - [ ] 验证测试结果

5. **文档更新**（15 分钟）
   - [ ] 更新 performance-optimization.md（标记 Phase 3 已实施）
   - [ ] 提交更改

**验收标准**:
- ✅ 旧缓存文件自动清理
- ✅ 缓存损坏时自动恢复
- ✅ 所有健壮性测试通过

**预估工时**: 1-2 小时

---

### 6.4 文档和收尾（1 小时）

**任务清单**:

1. **创建性能测试报告**（30 分钟）
   - [ ] 运行所有基准测试
   - [ ] 记录优化前后对比数据
   - [ ] 创建 `docs/plans/performance-test-report.md`
   - [ ] 提交报告

2. **更新 performance-optimization.md**（15 分钟）
   - [ ] 标记所有优化项为"已实施"
   - [ ] 添加实际性能数据
   - [ ] 提交更改

3. **更新 README.md**（可选，15 分钟）
   - [ ] 添加性能优化说明（如需要）
   - [ ] 提交更改

4. **创建验收报告**（15 分钟）
   - [ ] 创建 `docs/plans/performance-optimization-validation-report.md`
   - [ ] 填写所有验收标准
   - [ ] 提交报告

**预估工时**: 1 小时

---

**总预估工时**: 6-9 小时

---

## 7. 风险和缓解措施

### 7.1 风险矩阵

| 风险 | 严重程度 | 可能性 | 优先级 |
|------|---------|--------|--------|
| 缓存一致性问题 | 中 | 中 | 🔴 高 |
| Bash 4.0 兼容性 | 低 | 中 | 🟡 中 |
| AI 不遵循缓存指导 | 低 | 中 | 🟡 中 |
| 缓存文件损坏 | 低 | 低 | 🟢 低 |

### 7.2 风险详情和缓解措施

#### 风险 1: 缓存一致性问题 🔴

**描述**: 用户修改 specification.md 后，缓存未失效，导致加载了错误的资源

**影响**:
- 命令使用过时的配置
- 资源加载不符合预期
- 用户困惑（为什么修改没生效）

**缓解措施**:
1. **技术保障**:
   - ✅ 使用文件时间戳检测变化（可靠性高）
   - ✅ 添加 `cache_version` 字段，版本不匹配则失效
   - ✅ 在 JSON 输出中包含 `spec_file_mtime`，可审计

2. **用户手段**:
   - ✅ 提供手动清理命令：`rm -rf .specify/.cache/`
   - ✅ 文档说明缓存机制和失效条件

3. **监控**:
   - ✅ 性能日志记录缓存命中/失效情况
   - ✅ 异常情况下输出警告信息

**严重程度**: 中（可能导致错误的资源加载，但有多重防护）

---

#### 风险 2: Bash 4.0 兼容性问题 🟡

**描述**: macOS 默认 Bash 3.2，不支持关联数组

**影响**:
- Phase 2 的关联数组去重功能无法使用
- 降级到线性数组，性能稍差（但功能正常）

**缓解措施**:
1. **版本检测和降级**:
   ```bash
   if [ "${BASH_VERSINFO[0]}" -lt 4 ]; then
     echo "警告: Bash 版本低于 4.0，使用降级方案" >&2
     # 使用线性数组
   fi
   ```

2. **文档说明**:
   - ✅ README 中说明 Bash 4.0+ 推荐
   - ✅ macOS 用户可使用 Homebrew 安装新版 Bash
   - ✅ 或使用 Git Bash（Windows）、zsh（macOS 默认）

3. **功能保证**:
   - ✅ 降级方案仍能正确去重
   - ✅ 性能影响有限（资源数量通常 < 30）

**严重程度**: 低（有降级方案，不影响功能正确性）

---

#### 风险 3: AI 不遵循缓存指导 🟡

**描述**: Phase 2 依赖 AI 理解 Prompt，可能不完全遵循缓存策略

**影响**:
- 会话级缓存效果不佳
- AI 可能重复读取已加载的资源
- 性能提升低于预期

**缓解措施**:
1. **双层缓存机制**:
   - ✅ 脚本层缓存仍然有效（Phase 1 保底）
   - ✅ Prompt 层作为增强，不成功也不影响基本性能

2. **Prompt 优化**:
   - ✅ 使用清晰、明确的指导语言
   - ✅ 提供具体示例（如 3.1.2 章节）
   - ✅ 在实际使用中收集反馈，迭代优化措辞

3. **脚本标记辅助**:
   - ✅ JSON 输出包含 `cache_hint` 字段
   - ✅ 明确告知 AI"此报告基于缓存生成"

**严重程度**: 低（不影响功能正确性，只影响性能上限）

---

#### 风险 4: 缓存文件损坏 🟢

**描述**: 意外中断（如 Ctrl+C）导致 JSON 文件写入不完整

**影响**:
- 读取缓存时 JSON 解析失败
- 脚本报错

**缓解措施**:
1. **健壮性处理**:
   ```bash
   # 读取前验证 JSON 格式
   if ! jq empty "$cache_file" 2>/dev/null; then
     rm -f "$cache_file"  # 删除损坏的缓存
     # 自动重新生成
   fi
   ```

2. **原子写入**:
   ```bash
   # 写入临时文件后重命名（原子操作）
   echo "$content" > "$cache_file.tmp"
   mv -f "$cache_file.tmp" "$cache_file"
   ```

3. **自动恢复**:
   - ✅ 缓存损坏时自动删除并重新生成
   - ✅ 用户无感知，无需手动干预

**严重程度**: 极低（自动恢复，无需人工介入）

---

## 8. 成功标准

### 8.1 技术指标

**性能指标**:
- ✅ 缓存命中时脚本执行时间 < 10ms（vs 当前 ~50ms，提升 80%）
- ✅ 连续 5 次命令执行总时间减少 40%+
- ✅ 关键词匹配时间 < 50ms（5000 字文本）
- ✅ 缓存命中率 > 90%

**功能指标**:
- ✅ 所有测试用例通过（冷启动、热启动、缓存失效、关键词匹配）
- ✅ 向后兼容（旧版本用户无感知）
- ✅ Bash 3.x 降级方案工作正常
- ✅ PowerShell 和 Bash 功能一致

**质量指标**:
- ✅ 缓存一致性：specification.md 修改后缓存自动失效
- ✅ 缓存健壮性：损坏时自动恢复
- ✅ 代码质量：遵循现有规范，添加注释

### 8.2 用户体验

**可感知的改善**:
- ✅ 命令响应更快（用户可感知）
- ✅ 连续执行多个命令时速度显著提升
- ✅ 无需手动配置缓存
- ✅ 无额外学习成本

**透明性**:
- ✅ JSON 输出包含 `cached` 标记，用户可知晓缓存状态
- ✅ 缓存失效时自动重新生成，用户无感知
- ✅ 提供手动清理命令（高级用户）

### 8.3 代码质量

**规范性**:
- ✅ 所有 Git 提交遵循 Conventional Commits 格式
- ✅ 包含 Co-Authored-By 签名
- ✅ 代码注释清晰，说明缓存逻辑

**可维护性**:
- ✅ 缓存逻辑集中在脚本开头，易于维护
- ✅ 配置文件（keyword-mappings.json）易于扩展
- ✅ 测试用例覆盖主要场景

---

## 9. 附录

### 9.1 相关文档

- `docs/guides/performance-optimization.md` - 性能优化建议（原始文档）
- `docs/opt-plans/2025-02-08-commands-optimization-design.md` - Commands 优化设计
- `docs/plans/2025-02-08-phase4-keyword-triggering.md` - 关键词触发实施计划

### 9.2 技术参考

**Bash 关联数组**:
- 最低版本：Bash 4.0
- macOS 默认：Bash 3.2（需升级或降级）
- Git Bash (Windows)：通常 4.4+

**PowerShell HashTable**:
- 支持版本：PowerShell 5.1+, PowerShell Core 7.x
- Windows 默认：PowerShell 5.1

**JSON 处理**:
- Bash: 使用 `jq` 工具
- PowerShell: 内置 `ConvertFrom-Json` / `ConvertTo-Json`

### 9.3 术语表

- **冷启动**: 首次执行命令，无缓存
- **热启动**: 缓存有效，直接读取
- **缓存失效**: 配置文件修改导致缓存过期
- **预编译正则**: 在配置文件中预先构建正则表达式字符串
- **会话级缓存**: 在单次对话会话中复用已加载的资源
- **关联数组**: Bash 4.0+ 的哈希表实现（类似 Python 的 dict）
- **HashTable**: PowerShell 的哈希表实现

---

**文档状态**: ✅ 已批准，待实施
**最后更新**: 2026-02-08
**维护者**: Claude Sonnet 4.5
**实施计划**: docs/opt-plans/2026-02-08-performance-optimization-plan.md（待创建）
