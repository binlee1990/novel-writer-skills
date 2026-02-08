# Phase 3 辅助 Commands 测试用例

## 测试环境准备

### 前置条件
- Phase 1 和 Phase 2 已完成
- 存在测试故事项目目录结构
- 包含已写入的章节内容（用于分析）

### 测试项目结构
```
test-story/
├── .specify/
│   └── scripts/
│       ├── bash/
│       │   └── check-writing-state.sh
│       └── powershell/
│           └── check-writing-state.ps1
├── memory/
│   └── constitution.md
├── stories/
│   └── test-novel/
│       ├── specification.md（包含 resource-loading 配置）
│       ├── creative-plan.md
│       ├── tasks.md
│       ├── content/
│       │   ├── chapter-01.md
│       │   ├── chapter-02.md
│       │   └── chapter-03.md
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

## 测试用例 1: /analyze - 资源加载集成

### 测试配置

**specification.md** (包含 analysis 专用配置):
```yaml
---
resource-loading:
  analysis:
    knowledge-base:
      craft:
        - dialogue
        - pacing
    skills:
      quality-assurance:
        - consistency-checker
---
```

### 测试步骤

1. **运行命令**:
   ```bash
   /analyze --type=content
   ```

2. **预期行为 - 资源加载**:
   - 执行 `check-writing-state.sh --json`
   - 加载 Layer 2 配置的分析辅助资源（dialogue, pacing, consistency-checker）

3. **预期行为 - 分析执行**:
   - 执行内容质量分析
   - 重点检查对话质量和节奏

### 验证方法

```bash
# 手动测试资源加载逻辑（需要实际运行 /analyze）
# 观察是否加载了正确的资源
```

---

## 测试用例 2: /analyze - 询问式 tracking 更新（全部应用）

### 测试配置

**已有章节内容**: chapter-01.md 到 chapter-05.md

### 测试步骤

1. **运行命令**:
   ```bash
   /analyze --type=content
   ```

2. **预期行为 - 生成更新建议**:
   - 分析章节内容
   - 生成 tracking 更新建议
   - 显示建议的 diff 格式更新

3. **预期行为 - 用户确认提示**:
   ```markdown
   是否应用这些 tracking 更新？
   [Y] 全部应用  [N] 跳过  [S] 选择性应用
   ```

4. **用户操作**: 输入 **Y**

5. **预期行为 - 应用更新**:
   - 应用所有建议的更新
   - 更新 4 个 tracking 文件
   - 追加记录到 tracking-log.md

### 验证方法

```bash
# 验证 tracking 文件更新
git diff stories/test-novel/spec/tracking/character-state.json

# 验证日志记录
tail -n 50 stories/test-novel/spec/tracking/tracking-log.md | grep "/analyze"
```

Expected:
- tracking 文件包含建议的更新
- tracking-log.md 包含完整的更新记录和用户选择（全部应用）

---

## 测试用例 3: /analyze - 询问式 tracking 更新（选择性应用）

### 测试步骤

1. **运行命令**:
   ```bash
   /analyze --type=content
   ```

2. **用户操作**: 输入 **S**（选择性应用）

3. **预期行为 - 逐项确认**:
   ```markdown
   ### 1. character-state.json - 林晓情绪变化
   是否应用此更新？ [Y/n]

   ### 2. relationships.json - 新增信任关系
   是否应用此更新？ [Y/n]

   [继续其他更新...]
   ```

4. **用户操作**:
   - 第 1 项输入 **Y**
   - 第 2 项输入 **n**
   - 第 3 项输入 **Y**

5. **预期行为 - 应用选中的更新**:
   - 仅应用用户确认的更新（第 1 和第 3 项）
   - 跳过用户拒绝的更新（第 2 项）
   - 记录用户的选择到 tracking-log.md

### 验证方法

```bash
# 验证日志记录包含选择详情
grep -A 10 "用户选择详情" stories/test-novel/spec/tracking/tracking-log.md
```

Expected: 日志中显示哪些更新被应用，哪些被跳过

---

## 测试用例 4: /analyze - 询问式 tracking 更新（跳过）

### 测试步骤

1. **运行命令**:
   ```bash
   /analyze --type=content
   ```

2. **用户操作**: 输入 **N**（跳过更新）

3. **预期行为 - 跳过更新**:
   - 不修改任何 tracking 文件
   - 记录用户选择到 tracking-log.md

### 验证方法

```bash
# 验证 tracking 文件未修改
git status stories/test-novel/spec/tracking/

# 验证日志记录包含跳过信息
grep "用户选择跳过" stories/test-novel/spec/tracking/tracking-log.md
```

Expected:
- tracking 文件无变化
- 日志记录显示用户选择跳过

---

## 测试用例 5: /track - 查看所有历史更新

### 测试前提

已执行过多次 /write、/analyze、/plan 命令，tracking-log.md 包含历史记录

### 测试步骤

1. **运行命令**:
   ```bash
   /track --log
   ```

2. **预期行为 - 显示历史列表**:
   - 显示所有历史更新记录的摘要
   - 按时间倒序排列
   - 每条记录显示时间戳、命令、状态、更新文件摘要

### 验证方法

```bash
# 手动测试历史查看功能（需要实际运行 /track）
# 验证输出格式是否符合预期
```

Expected:
- 显示完整的历史列表
- 格式清晰易读
- 包含所有历史记录

---

## 测试用例 6: /track - 过滤查看特定命令的历史

### 测试步骤

1. **运行命令**:
   ```bash
   /track --log --command=write
   ```

2. **预期行为 - 过滤显示**:
   - 仅显示 /write 命令的历史更新
   - 按时间倒序排列

### 验证方法

```bash
# 手动测试过滤功能
# 验证输出仅包含 /write 命令的记录
```

Expected: 输出仅包含 /write 命令的历史记录

---

## 测试用例 7: /track - 查看单条记录详情

### 测试步骤

1. **运行命令**:
   ```bash
   /track --log
   ```

2. **用户操作**: 选择"[查看详情]"

3. **预期行为 - 显示详情**:
   - 显示完整的 diff 格式更新
   - 显示更新依据
   - 显示命令执行信息

### 验证方法

```bash
# 手动测试详情查看功能
# 验证详情包含完整的 diff 和依据
```

Expected:
- 显示完整的更新详情
- diff 格式正确
- 包含更新依据

---

## 测试用例 8: /checklist - 基本资源加载

### 测试配置

**specification.md** (包含 checklist 专用配置):
```yaml
---
resource-loading:
  checklist:
    knowledge-base:
      craft:
        - scene-structure
        - pacing
---
```

### 测试步骤

1. **运行命令**:
   ```bash
   /checklist
   ```

2. **预期行为 - 资源加载**:
   - 加载默认资源（宪法、规格、任务、tracking）
   - 加载 checklist 专用配置的资源（scene-structure, pacing）

3. **预期行为 - 生成检查清单**:
   - 生成包含场景结构和节奏相关检查项的清单

### 验证方法

```bash
# 手动测试资源加载和检查清单生成
# 验证检查清单是否包含相关检查项
```

Expected: 检查清单包含场景结构和节奏相关的检查项

---

## 验收标准

### /analyze 命令

- ✅ 能正确加载 analysis 专用资源
- ✅ 能生成 tracking 更新建议
- ✅ 能处理用户确认（Y/N/S 三种模式）
- ✅ 能正确应用用户确认的更新
- ✅ tracking-log.md 正确记录用户选择

### /track 命令

- ✅ 能显示 tracking-log.md 的历史列表
- ✅ 能按命令类型过滤历史
- ✅ 能按时间范围过滤历史
- ✅ 能按文件过滤历史
- ✅ 能显示单条记录的详细信息

### /checklist 命令

- ✅ 能正确加载默认资源
- ✅ 能正确加载 checklist 专用配置
- ✅ 生成的检查清单包含相关检查项

### 向后兼容

- ✅ 无 resource-loading 配置时使用默认加载
- ✅ 无 tracking-log.md 时优雅降级
- ✅ tracking 文件不存在时提示初始化

---

## 性能指标

- ✅ /analyze 询问式更新耗时 < 5s（含用户交互）
- ✅ /track 历史查看耗时 < 2s
- ✅ /checklist 资源加载耗时 < 2s
