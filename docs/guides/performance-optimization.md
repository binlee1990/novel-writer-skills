# 性能优化建议

**文档类型**: 优化建议（未实施）
**创建日期**: 2026-02-08
**版本**: 1.0.0

本文档记录 novel-writer-skills 项目的性能优化建议。这些优化尚未实施，供未来开发参考。

---

## 1. 资源加载缓存

### 1.1 问题描述

当前实现中，每次执行命令时都会重新读取：
- `specification.md` 的 YAML frontmatter
- `templates/config/keyword-mappings.json`
- Knowledge-base 文件（craft/*, genres/*, etc.）
- Skills 文件（SKILL.md）

对于频繁执行的命令（如 /write），这会导致重复读取。

### 1.2 优化方案

**方案 A: 会话级缓存**

在单次对话会话中缓存已读取的资源：

```javascript
// 伪代码
const sessionCache = {
  specification: null,
  keywordMappings: null,
  loadedResources: {}
};

function getSpecification() {
  if (!sessionCache.specification) {
    sessionCache.specification = readYAML('specification.md');
  }
  return sessionCache.specification;
}

function getKeywordMappings() {
  if (!sessionCache.keywordMappings) {
    sessionCache.keywordMappings = readJSON('keyword-mappings.json');
  }
  return sessionCache.keywordMappings;
}

function loadResource(path) {
  if (!sessionCache.loadedResources[path]) {
    sessionCache.loadedResources[path] = readFile(path);
  }
  return sessionCache.loadedResources[path];
}
```

**方案 B: 文件哈希缓存**

使用文件内容哈希判断是否需要重新读取：

```javascript
const fileHashCache = {};

function loadResourceWithHash(path) {
  const currentHash = getFileHash(path);

  if (fileHashCache[path]?.hash === currentHash) {
    return fileHashCache[path].content;
  }

  const content = readFile(path);
  fileHashCache[path] = { hash: currentHash, content };
  return content;
}
```

**预期收益**:
- 减少文件读取次数 70%+
- 命令执行时间减少 30-40%

### 1.3 实施优先级

**低** - 当前性能可接受，未成为瓶颈

---

## 2. 关键词匹配优化

### 2.1 问题描述

当前关键词匹配逻辑：
1. 遍历所有映射条目（~20+ 项）
2. 每个条目构建正则表达式
3. 对文本执行正则测试

对于长文本（如整章内容），这可能较慢。

### 2.2 优化方案

**方案 A: 预编译正则表达式**

在加载 keyword-mappings.json 时预编译所有正则：

```javascript
// 加载时执行一次
const compiledPatterns = {};
for (const [category, items] of Object.entries(mappings)) {
  for (const [name, config] of Object.entries(items)) {
    const pattern = regexPatterns[name] || config.keywords.join('|');
    compiledPatterns[name] = {
      regex: new RegExp(pattern, 'i'),  // 预编译
      config: config
    };
  }
}

// 匹配时直接使用
function matchKeywords(text) {
  const matched = [];
  for (const [name, { regex, config }] of Object.entries(compiledPatterns)) {
    if (regex.test(text)) {
      matched.push({ name, ...config });
    }
  }
  return matched;
}
```

**方案 B: 分段匹配**

对于长文本，分段匹配避免单次正则执行时间过长：

```javascript
function matchKeywordsChunked(text, chunkSize = 500) {
  const chunks = splitText(text, chunkSize);
  const matched = new Set();

  for (const chunk of chunks) {
    const chunkMatches = matchKeywords(chunk);
    chunkMatches.forEach(m => matched.add(m.name));
  }

  return Array.from(matched);
}
```

**预期收益**:
- 关键词匹配速度提升 50%+
- 长文本处理不会明显延迟

### 2.3 实施优先级

**中** - 对于长文本场景有明显收益

---

## 3. 资源去重优化

### 3.1 问题描述

当前去重逻辑：
```javascript
const isLoaded = loadedResources.some(loaded =>
  loaded.includes(normalizedPath) || normalizedPath.includes(loaded)
);
```

使用字符串包含判断，对于大量已加载资源（50+ 项），效率较低。

### 3.2 优化方案

**方案: 使用 Set 数据结构**

```javascript
const loadedResourcesSet = new Set();

// 加载时添加
function loadResource(path) {
  const normalized = normalizePath(path);
  if (loadedResourcesSet.has(normalized)) {
    return; // 已加载，跳过
  }

  const content = readFile(path);
  loadedResourcesSet.add(normalized);
  return content;
}

// 检查时使用
function isResourceLoaded(path) {
  const normalized = normalizePath(path);
  return loadedResourcesSet.has(normalized);
}
```

**预期收益**:
- 去重检查从 O(n) 降到 O(1)
- 对于大量资源场景，性能提升明显

### 3.3 实施优先级

**低** - 当前资源数量不大（<30），线性搜索可接受

---

## 4. YAML 解析优化

### 4.1 问题描述

当前每次读取 specification.md 都需要：
1. 读取完整文件内容
2. 提取 YAML frontmatter（前三行 `---` 之间）
3. 解析 YAML

对于频繁执行的命令，重复解析浪费资源。

### 4.2 优化方案

**方案: 延迟解析 + 缓存**

```javascript
let specCache = null;
let specFileModTime = null;

function getSpecification() {
  const currentModTime = getFileModTime('specification.md');

  if (specCache && specFileModTime === currentModTime) {
    return specCache; // 使用缓存
  }

  // 文件已修改，重新解析
  const content = readFile('specification.md');
  const yaml = extractFrontmatter(content);
  specCache = parseYAML(yaml);
  specFileModTime = currentModTime;

  return specCache;
}
```

**预期收益**:
- 避免重复解析，节省 10-20ms 每次

### 4.3 实施优先级

**低** - YAML 解析本身很快

---

## 5. 脚本执行优化

### 5.1 问题描述

当前每个核心命令都会执行脚本（check-writing-state.sh）获取资源加载报告。脚本内部也会读取 specification.md 和验证文件存在性。

### 5.2 优化方案

**方案: 脚本结果缓存**

```bash
#!/bin/bash
# check-writing-state.sh (优化版)

CACHE_FILE=".specify/.cache/resource-report.json"
SPEC_FILE="stories/*/specification.md"

# 检查缓存是否有效
if [ -f "$CACHE_FILE" ]; then
  CACHE_TIME=$(stat -c %Y "$CACHE_FILE")
  SPEC_TIME=$(stat -c %Y "$SPEC_FILE")

  if [ $CACHE_TIME -gt $SPEC_TIME ]; then
    # 缓存仍有效
    cat "$CACHE_FILE"
    exit 0
  fi
fi

# 缓存失效，重新生成
generate_resource_report > "$CACHE_FILE"
cat "$CACHE_FILE"
```

**预期收益**:
- 脚本执行时间减少 80%+（从 ~50ms 到 ~10ms）

### 5.3 实施优先级

**中** - 对命令启动速度有明显改善

---

## 6. 批量文件读取优化

### 6.1 问题描述

当前加载多个 craft knowledge-base 时，逐个读取：

```javascript
for (const craft of ['dialogue', 'pacing', 'character-arc']) {
  const content = readFile(`craft/${craft}.md`);
  processContent(content);
}
```

串行读取效率低。

### 6.2 优化方案

**方案: 并行读取**（如果环境支持）

```javascript
const craftFiles = ['dialogue', 'pacing', 'character-arc'];

// 并行读取
const contents = await Promise.all(
  craftFiles.map(name => readFileAsync(`craft/${name}.md`))
);

// 处理内容
contents.forEach(processContent);
```

**预期收益**:
- 文件读取时间减少 60%+（5 个文件从 ~100ms 到 ~40ms）

### 6.3 实施优先级

**低** - 需要异步 API 支持，当前同步读取已足够快

---

## 7. 内存优化

### 7.1 问题描述

加载大量 knowledge-base 和 skills 文件会占用内存。如果不及时清理，长时间运行可能导致内存占用过高。

### 7.2 优化方案

**方案: 分层内存管理**

```javascript
const resourceCache = {
  core: {},      // 核心资源，常驻内存
  temporary: {}, // 临时资源，命令结束后清理
  session: {}    // 会话资源，对话结束后清理
};

function loadResource(path, level = 'temporary') {
  if (resourceCache[level][path]) {
    return resourceCache[level][path];
  }

  const content = readFile(path);
  resourceCache[level][path] = content;
  return content;
}

function clearTemporaryResources() {
  resourceCache.temporary = {};
}

// 命令结束时调用
onCommandComplete(() => {
  clearTemporaryResources();
});
```

**预期收益**:
- 长时间运行时内存占用减少 40%+

### 7.3 实施优先级

**低** - 当前内存占用不是问题

---

## 8. 实施路线图

### 8.1 Phase 1: 高优先级优化（快速收益）

**目标**: 解决明显性能瓶颈

**任务**:
1. ✅ 预编译关键词正则表达式
2. ✅ 脚本结果缓存

**预期收益**: 命令执行时间减少 20-30%

**预估工时**: 2-3h

### 8.2 Phase 2: 中优先级优化（渐进改善）

**目标**: 提升用户体验

**任务**:
1. ✅ 会话级资源缓存
2. ✅ 资源去重使用 Set

**预期收益**: 重复命令执行速度提升 40%+

**预估工时**: 2-3h

### 8.3 Phase 3: 低优先级优化（锦上添花）

**目标**: 长期维护性改善

**任务**:
1. ⬜ 并行文件读取
2. ⬜ 分层内存管理
3. ⬜ YAML 解析缓存

**预期收益**: 边际改善

**预估工时**: 3-4h

---

## 9. 性能测试建议

### 9.1 基准测试场景

**场景 1: 单次 /write 执行**
- 测试指标：总执行时间
- 基准值：<2s
- 优化目标：<1.5s

**场景 2: 连续 /write 执行（5 次）**
- 测试指标：平均执行时间
- 基准值：~1.8s/次
- 优化目标：<1s/次（缓存生效）

**场景 3: 关键词匹配（长文本）**
- 测试指标：匹配时间
- 文本长度：5000 字
- 基准值：<100ms
- 优化目标：<50ms

**场景 4: 资源加载（10 个文件）**
- 测试指标：总读取时间
- 基准值：~200ms
- 优化目标：<100ms

### 9.2 监控指标

建议收集以下性能指标：

```javascript
const performanceMetrics = {
  commandExecutionTime: 0,
  resourceLoadingTime: 0,
  keywordMatchingTime: 0,
  scriptExecutionTime: 0,
  yamlParsingTime: 0
};

function trackPerformance(metric, fn) {
  const start = Date.now();
  const result = fn();
  performanceMetrics[metric] += Date.now() - start;
  return result;
}
```

---

## 10. 注意事项

### 10.1 优化原则

1. **测量优先**: 先测量，确认瓶颈，再优化
2. **避免过早优化**: 当前性能可接受时，不急于优化
3. **保持简单**: 优化不应增加代码复杂度
4. **向后兼容**: 优化不应破坏现有功能

### 10.2 风险

1. **缓存一致性**: 文件修改后缓存未更新
2. **内存泄漏**: 缓存未正确清理
3. **并发问题**: 并行读取可能导致竞态条件

### 10.3 替代方案

如果性能问题严重，考虑架构级优化：

1. **使用数据库**: 替代文件读取（如 SQLite）
2. **预处理**: 构建时生成索引文件
3. **增量加载**: 只加载必需的资源部分

---

**文档状态**: 📝 建议文档（未实施）
**最后更新**: 2026-02-08
**维护者**: Claude Sonnet 4.5
