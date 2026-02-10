# Phase 4: 关键词触发机制测试用例

**创建日期**: 2025-02-08
**Phase**: 4 - 关键词触发机制
**目标**: 验证运行时动态资源加载功能

---

## 测试环境

**测试项目**:
- 使用 `templates/` 作为测试基础
- 创建测试 specification.md 配置

**测试工具**:
- 手动验证（通过 Claude Code 执行命令）
- Git commit 历史检查

---

## Test Case 1: /write 命令参数关键词触发

**场景**: 用户在 `/write` 命令参数中提供关键词

**测试配置**:
```yaml
# stories/test-story/specification.md
---
title: "测试小说"
resource-loading:
  auto-load: false  # 禁用默认加载，便于测试
  keyword-triggers:
    enabled: true
---
```

**执行命令**:
```bash
/write chapter-01 --focus 对话技巧
```

**预期行为**:
1. 扫描参数文本："对话技巧"
2. 匹配关键词："对话" (dialogue)
3. 提示用户：
   ```
   🔍 关键词触发检测

   检测到 "对话"，建议加载：
   - craft/dialogue.md
   - writing-techniques/dialogue-techniques

   是否加载？ [Y/N/S]
   ```
4. 用户选择 Y → 加载资源
5. 控制台显示：`✓ 动态加载: craft/dialogue.md (触发词: "对话")`

**验证方法**:
- 检查命令执行日志
- 确认资源加载提示出现
- 确认资源实际加载到上下文

**状态**: ⬜ 待测试

---

## Test Case 2: /write 任务描述关键词触发

**场景**: tasks.md 中的任务描述包含关键词

**测试数据**:
```markdown
# stories/test-story/tasks.md

## 待写任务

### Task 1: 第一章 - 开篇
- **章节**: chapter-01
- **描述**: 写一段节奏紧凑的对话场景，展示两人的矛盾
- **字数**: 2000
```

**执行命令**:
```bash
/write chapter-01
```

**预期行为**:
1. 读取任务描述："节奏紧凑的对话场景"
2. 匹配关键词："节奏" (pacing) + "对话" (dialogue)
3. 提示用户加载：
   - craft/pacing.md
   - craft/dialogue.md
   - pacing-control skill
   - dialogue-techniques skill

**验证方法**:
- 检查任务描述是否被正确扫描
- 验证多个关键词同时触发
- 验证优先级排序（priority 1 资源优先）

**状态**: ⬜ 待测试

---

## Test Case 3: 自定义关键词映射

**场景**: 用户配置自定义关键词映射

**测试配置**:
```yaml
# specification.md
---
resource-loading:
  keyword-triggers:
    enabled: true
    custom-mappings:
      "甜度": "knowledge-base/genres/romance.md"
      "虐文": "knowledge-base/requirements/romance-angst.md"
---
```

**执行命令**:
```bash
/write chapter-05 --focus 提升甜度
```

**预期行为**:
1. 扫描参数："提升甜度"
2. 匹配自定义关键词："甜度"
3. 提示加载：`knowledge-base/genres/romance.md`
4. 优先级：自定义映射 (priority 0) 优先于内置映射

**验证方法**:
- 确认自定义映射被正确读取
- 确认优先级最高（在提示列表中排第一）
- 确认资源路径正确解析

**状态**: ⬜ 待测试

---

## Test Case 4: 禁用关键词触发

**场景**: 用户禁用关键词触发功能

**测试配置**:
```yaml
---
resource-loading:
  keyword-triggers:
    enabled: false
---
```

**执行命令**:
```bash
/write chapter-01 --focus 对话节奏
```

**预期行为**:
1. 检测到 `enabled: false`
2. 跳过关键词扫描步骤
3. **不显示**任何关键词触发提示
4. 直接进入写作流程

**验证方法**:
- 确认没有关键词触发提示
- 确认写作流程正常进行
- 确认日志中无 "动态加载" 记录

**状态**: ⬜ 待测试

---

## Test Case 5: 资源去重检查

**场景**: Layer 1/2 已加载的资源不应重复提示

**测试配置**:
```yaml
---
resource-loading:
  auto-load: true  # Layer 1 会加载所有 craft knowledge
  keyword-triggers:
    enabled: true
---
```

**执行命令**:
```bash
/write chapter-01 --focus 对话
```

**预期行为**:
1. Layer 1 自动加载：craft/dialogue.md（已加载）
2. 扫描参数："对话"
3. 匹配到 craft/dialogue.md
4. **去重检查**: 发现已加载
5. **不提示** craft/dialogue.md
6. **仅提示** dialogue-techniques skill（如未加载）

**验证方法**:
- 检查 Layer 1 加载列表
- 确认已加载资源不在触发提示中
- 确认未加载的 skill 正常提示

**状态**: ⬜ 待测试

---

## Test Case 6: 选择性加载 (S 模式)

**场景**: 用户选择逐个确认资源加载

**执行命令**:
```bash
/write chapter-01 --focus 节奏和对话
```

**预期行为**:
1. 匹配两个关键词：pacing + dialogue
2. 提示加载 4 个资源
3. 用户选择 **S** (选择性加载)
4. 逐个询问：
   ```
   ### 1. 节奏控制 (pacing)

   资源：
   - craft/pacing.md
   - writing-techniques/pacing-control

   是否加载？ [Y/N]
   ```
5. 用户对第 1 个选 Y，第 2 个选 N
6. 仅加载第 1 个资源

**验证方法**:
- 确认逐个询问流程
- 确认仅加载用户确认的资源
- 确认跳过用户拒绝的资源

**状态**: ⬜ 待测试

---

## Test Case 7: /plan 命令关键词触发

**场景**: 在 /plan 命令中触发关键词检测

**执行命令**:
```bash
/plan 下一章节奏加快，增加对话冲突
```

**预期行为**:
1. 扫描参数："节奏加快，增加对话冲突"
2. 匹配：pacing + dialogue
3. 提示加载相关资源
4. 用户确认后加载

**验证方法**:
- 确认 /plan 命令支持关键词触发
- 确认逻辑与 /write 一致

**状态**: ⬜ 待测试

---

## Test Case 8: /analyze 轻量级触发

**场景**: /analyze --check 参数触发

**执行命令**:
```bash
/analyze --check 对话
```

**预期行为**:
1. 扫描 `--check` 参数值："对话"
2. 匹配 dialogue
3. 提示加载 dialogue-techniques skill（knowledge 已在 Layer 1 加载）

**验证方法**:
- 确认参数扫描正确
- 确认只提示未加载的资源

**状态**: ⬜ 待测试

---

## Test Case 9: /checklist 最轻量级触发

**场景**: /checklist --focus 参数触发

**执行命令**:
```bash
/checklist --focus 节奏
```

**预期行为**:
1. 检查 keyword-triggers.enabled
2. 如果 enabled: true，扫描参数
3. 提示加载 craft/pacing.md

**验证方法**:
- 确认配置控制生效
- 确认提示正确

**状态**: ⬜ 待测试

---

## Test Case 10: 实时触发（写作过程中）

**场景**: 用户在写作过程中提供新输入

**执行流程**:
1. 执行 `/write chapter-01`（初始无关键词）
2. AI 询问："您希望重点关注什么？"
3. 用户回复："我觉得节奏有点慢"
4. 实时触发检测

**预期行为**:
1. 扫描用户输入："节奏有点慢"
2. 匹配 pacing
3. 提示：`💡 检测到 "节奏太慢"，是否加载 pacing-control？ [Y/N]`
4. 用户确认后动态加载

**验证方法**:
- 确认实时扫描机制工作
- 确认交互过程中的触发
- 确认资源加载后立即可用

**状态**: ⬜ 待测试

---

## 验收标准

| Test Case | 描述 | 状态 |
|-----------|------|------|
| TC1 | /write 参数关键词触发 | ⬜ |
| TC2 | /write 任务描述触发 | ⬜ |
| TC3 | 自定义关键词映射 | ⬜ |
| TC4 | 禁用关键词触发 | ⬜ |
| TC5 | 资源去重检查 | ⬜ |
| TC6 | 选择性加载 (S 模式) | ⬜ |
| TC7 | /plan 命令触发 | ⬜ |
| TC8 | /analyze 轻量级触发 | ⬜ |
| TC9 | /checklist 最轻量级触发 | ⬜ |
| TC10 | 实时触发（交互中） | ⬜ |

**全部通过标准**: 10/10 ✅

---

## 测试执行记录

### 测试批次 1: 2025-02-08

**执行者**: [待填写]
**结果**: [待填写]

---

## 问题和修复

### Issue 1: [待发现]

**描述**: [待填写]
**修复**: [待填写]
**验证**: [待填写]

---

## 总结

**通过率**: 0/10 (0%)
**阻塞问题**: 0
**建议**: 按顺序执行测试，优先验证核心功能（TC1-TC5）
