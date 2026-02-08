# Phase 2 核心 Commands 测试用例

## 测试环境准备

### 前置条件
- Phase 1 已完成（check-writing-state.sh 增强、keyword-mappings.json、tracking-log.md）
- 存在测试故事项目目录结构

### 测试项目结构
```
test-story/
├── .specify/
│   └── config.json
├── memory/
│   └── constitution.md
├── stories/
│   └── test-novel/
│       ├── specification.md（包含 resource-loading 配置）
│       ├── creative-plan.md
│       ├── tasks.md
│       ├── content/
│       │   └── chapter-01.md
│       └── spec/
│           └── tracking/
│               ├── character-state.json
│               ├── relationships.json
│               ├── plot-tracker.json
│               ├── timeline.json
│               └── tracking-log.md
└── templates/（项目全局 templates）
```

---

## 测试用例 1: /write - 默认资源加载（Layer 1）

### 测试配置

**specification.md** (无 resource-loading 配置):
```yaml
---
title: 测试小说
writing-style: natural-voice
---
```

### 测试步骤

1. **运行命令**:
   ```bash
   # 假设有 Claude Code 环境
   /write chapter-01
   ```

2. **预期行为 - 前置检查**:
   - 执行 `check-writing-state.sh --json`
   - 显示资源加载报告
   - `resources.knowledge-base` 包含 5 个 craft 文件
   - `resources.skills` 包含 4 个 writing-techniques

3. **预期行为 - 查询协议**:
   - 显示"📋 写作前检查清单"
   - 列出 Layer 1 默认推断状态：enabled
   - 列出已加载资源清单（5 个 craft + 4 个 skills）

4. **预期行为 - 后置处理**:
   - 更新 character-state.json（角色出场位置）
   - 更新 relationships.json（角色关系）
   - 更新 plot-tracker.json（情节推进）
   - 更新 timeline.json（时间线事件）
   - 追加日志到 tracking-log.md

### 验证方法

```bash
# 验证 JSON 报告
bash .specify/scripts/bash/check-writing-state.sh --json | jq '.resources["knowledge-base"]'
# Expected: 包含 5 个 craft 文件路径

# 验证 tracking 文件更新
git diff stories/test-novel/spec/tracking/character-state.json
# Expected: 显示新增或修改的角色状态

# 验证日志记录
tail -n 50 stories/test-novel/spec/tracking/tracking-log.md | grep "/write chapter-01"
# Expected: 找到本次执行的日志记录
```

---

## 测试用例 2: /write - 配置覆盖（Layer 2）

### 测试配置

**specification.md** (包含 resource-loading 配置):
```yaml
---
title: 测试小说
resource-loading:
  auto-load: true
  knowledge-base:
    craft:
      - dialogue
      - pacing
      - "!character-arc"  # 排除角色弧线
  skills:
    writing-techniques:
      - dialogue-techniques
    quality-assurance:
      - consistency-checker
  keyword-triggers:
    enabled: true
---
```

### 测试步骤

1. **运行命令**:
   ```bash
   /write chapter-02
   ```

2. **预期行为 - 资源加载报告**:
   - `resources.knowledge-base` 仅包含 2 个 craft 文件（dialogue, pacing）
   - `resources.disabled` 包含 `craft/character-arc`
   - `resources.skills` 包含 dialogue-techniques 和 consistency-checker

3. **预期行为 - 查询协议**:
   - 显示 Layer 2 配置覆盖状态
   - 列出已加载资源：dialogue.md, pacing.md, dialogue-techniques, consistency-checker
   - 列出排除资源：character-arc

4. **预期行为 - 后置处理**:
   - tracking 更新和日志记录（同测试用例 1）

### 验证方法

```bash
# 验证 JSON 报告
bash .specify/scripts/bash/check-writing-state.sh --json | jq '.resources.disabled'
# Expected: ["craft/character-arc"]

# 验证资源加载数量
bash .specify/scripts/bash/check-writing-state.sh --json | jq '.resources["knowledge-base"] | length'
# Expected: 2
```

---

## 测试用例 3: /write - 关键词触发（Layer 3）

### 测试配置

**specification.md** (启用关键词触发):
```yaml
---
resource-loading:
  keyword-triggers:
    enabled: true
    custom-mappings:
      "情感节奏": "templates/knowledge-base/craft/pacing.md"
---
```

**tasks.md** (任务描述包含关键词):
```markdown
- [ ] Chapter 03 - 重点处理**对话**场景，注意**情感节奏**的把控
```

### 测试步骤

1. **运行命令**:
   ```bash
   /write chapter-03
   ```

2. **预期行为 - 关键词检测**:
   - 检测到关键词："对话"、"情感节奏"
   - 显示提示：
     ```markdown
     💡 检测到关键词："对话"
     建议加载以下资源：
     - templates/knowledge-base/craft/dialogue.md
     - templates/skills/writing-techniques/dialogue-techniques/SKILL.md

     💡 检测到关键词："情感节奏"（自定义映射）
     建议加载以下资源：
     - templates/knowledge-base/craft/pacing.md

     是否加载？[Y/n]
     ```

3. **预期行为 - 去重检查**:
   - 如果 dialogue.md 已通过 Layer 1/2 加载，不重复提示

4. **预期行为 - 用户确认**:
   - 用户输入 Y → 加载资源
   - 用户输入 n → 跳过加载

### 验证方法

```bash
# 手动测试关键词检测逻辑（需要实际运行 /write）
# 观察是否显示关键词提示
```

---

## 测试用例 4: /plan - 资源加载集成

### 测试配置

**specification.md** (包含 planning 专用配置):
```yaml
---
resource-loading:
  planning:
    knowledge-base:
      craft:
        - scene-structure
        - character-arc
    skills:
      planning:
        - story-structure
---
```

### 测试步骤

1. **运行命令**:
   ```bash
   /plan
   ```

2. **预期行为 - 前置检查**:
   - 执行 `check-writing-state.sh --json`
   - 加载 Layer 2 配置的规划辅助资源（scene-structure, character-arc）

3. **预期行为 - 创作计划生成**:
   - 生成 `creative-plan.md`
   - 包含章节架构、情节线设计、关键场景规划

4. **预期行为 - 后置处理**:
   - 解析 creative-plan.md
   - 初始化/更新 plot-tracker.json
   - 记录情节线定义和里程碑
   - 追加日志到 tracking-log.md

### 验证方法

```bash
# 验证 creative-plan.md 创建
test -f stories/test-novel/creative-plan.md && echo "✓ 计划文件创建成功"

# 验证 plot-tracker.json 初始化
jq '.plotLines | length' stories/test-novel/spec/tracking/plot-tracker.json
# Expected: > 0（至少有一条情节线）

# 验证日志记录
grep "/plan" stories/test-novel/spec/tracking/tracking-log.md
# Expected: 找到 /plan 的执行记录
```

---

## 测试用例 5: /plan - plot-tracker 合并逻辑

### 测试配置

**已存在 plot-tracker.json** (包含进度数据):
```json
{
  "plotLines": [
    {
      "id": "主线-001",
      "name": "寻找真相",
      "status": "in-progress",
      "progress": 0.3
    }
  ]
}
```

### 测试步骤

1. **运行命令**:
   ```bash
   /plan  # 第二次运行
   ```

2. **预期行为 - 合并逻辑**:
   - 保留已有情节线的 progress 字段
   - 添加新的情节线定义
   - 不覆盖现有进度数据

3. **预期行为 - 日志记录**:
   - 记录合并操作
   - 显示"保留现有进度"的说明

### 验证方法

```bash
# 验证 progress 字段保留
jq '.plotLines[] | select(.id == "主线-001") | .progress' stories/test-novel/spec/tracking/plot-tracker.json
# Expected: 0.3（未被重置为 0）
```

---

## 测试用例 6: 错误处理 - tracking 文件不存在

### 测试配置

**删除 tracking 目录**:
```bash
rm -rf stories/test-novel/spec/tracking/
```

### 测试步骤

1. **运行命令**:
   ```bash
   /write chapter-01
   ```

2. **预期行为 - 错误提示**:
   ```markdown
   ⚠️ 警告：tracking 文件不存在
   - 文件：stories/test-novel/spec/tracking/character-state.json
   - 建议：运行 `/track --init` 初始化 tracking 文件
   - 跳过本次更新
   ```

3. **预期行为 - 继续执行**:
   - 写作流程正常完成
   - 仅跳过 tracking 更新步骤

### 验证方法

```bash
# 验证章节文件创建
test -f stories/test-novel/content/chapter-01.md && echo "✓ 章节写作成功"

# 验证 tracking 更新被跳过（无文件创建）
test ! -f stories/test-novel/spec/tracking/character-state.json && echo "✓ 正确跳过 tracking 更新"
```

---

## 测试用例 7: 错误处理 - JSON 格式错误

### 测试配置

**破坏 character-state.json 格式**:
```json
{
  "林晓": {
    "lastAppearance": "chapter-01"
    # 缺少逗号，格式错误
  }
}
```

### 测试步骤

1. **运行命令**:
   ```bash
   /write chapter-02
   ```

2. **预期行为 - 错误提示**:
   ```markdown
   ❌ 错误：tracking 文件格式错误
   - 文件：stories/test-novel/spec/tracking/character-state.json
   - 错误：Unexpected token } in JSON at position 58
   - 建议：手动修复文件格式后重试
   - 跳过本次更新
   ```

3. **预期行为 - 日志记录**:
   - 在 tracking-log.md 中记录错误
   - 包含更新内容的 JSON（供手动修复参考）

### 验证方法

```bash
# 验证错误日志
grep "错误：tracking 文件格式错误" stories/test-novel/spec/tracking/tracking-log.md
# Expected: 找到错误记录
```

---

## 验收标准

### /write 命令

- ✅ 默认资源加载（Layer 1）正常工作
- ✅ 配置覆盖（Layer 2）正确应用
- ✅ 关键词触发（Layer 3）能检测并提示
- ✅ 自动更新 4 个 tracking 文件
- ✅ tracking-log.md 正确记录更新
- ✅ 错误处理不影响主流程

### /plan 命令

- ✅ 资源加载报告解析正常
- ✅ 规划辅助资源正确加载
- ✅ 自动初始化/更新 plot-tracker.json
- ✅ tracking-log.md 正确记录更新
- ✅ 合并逻辑保留现有进度

### 向后兼容

- ✅ 无 resource-loading 配置时使用默认推断
- ✅ 保持 writing-style 和 writing-requirements 字段功能
- ✅ 无 tracking 目录时优雅降级

---

## 性能指标

- ✅ 前置检查耗时 < 2s
- ✅ JSON 报告解析耗时 < 0.5s
- ✅ tracking 更新总耗时 < 3s（4 个文件 + 日志）
- ✅ 日志追加操作不阻塞主流程
