# Token 优化设计方案：长篇小说写作场景

## 1. 背景与问题

### 1.1 现状

`/write` 命令的 prompt 长度为 **1,617 行 / 48KB**，每次执行时作为 user message 发送到 API。在长篇小说创作的典型工作模式中（混合使用 `/write`、`/plan`、`/analyze` 等命令，连续写多章），token 消耗非常可观。

### 1.2 Token 消耗结构

| 类别 | 行数 | 占比 | 内容 |
|------|------|------|------|
| **A. 流程指令** | ~600 行 | 37% | 前置检查、查询协议、三层资源加载说明、执行流程 |
| **B. 规范示例** | ~450 行 | 28% | 反 AI 规范、具象化检查、禁用词、对比示例 |
| **C. 后置处理** | ~350 行 | 22% | Tracking 更新的 JSON 示例、日志格式、错误处理 |
| **D. 条件分支** | ~200 行 | 13% | 快写模式、断点续写、灵感扫描 |

### 1.3 核心问题

1. **Slash command prompt 无法被 prompt caching 命中**：Claude Code 的 prompt caching 基于前缀匹配，缓存的是 system prompt 和较早的对话轮次。Slash command 的内容作为 user message 展开，每次 `$ARGUMENTS` 不同导致无法缓存。
2. **固定指令占比过高**：约 58%（~950 行）的内容每次都完全相同地重复发送。
3. **存在内容重复**：write.md 内嵌的反 AI 规范（950-1024 行）与独立的 `anti-ai-v4.md` 文件内容重复，Claude 被迫读两遍相同内容。

### 1.4 浪费量化

写 5 章的成本对比：

| 指标 | 当前 | 目标 |
|------|------|------|
| write.md prompt | 1,617 行 × 5 = 8,085 行 | ~300 行 × 5 = 1,500 行 |
| 等效 token 消耗 | ~80,000 tokens | ~15,000-18,000 tokens |
| 节省率 | - | **~77-83%** |

---

## 2. 优化策略

### 2.1 策略一：Prompt 精简（节省 40-50%）

**原则**：精简的是「prompt 中的冗余内容」，不是「Claude 可用的知识」。所有被移除的内容仍然通过外部文件可访问。

#### 2.1.1 反 AI 规范精简（~250 行 → ~30 行）

**现状分析**：
- write.md 第 950-1024 行：内嵌了一份精简版反 AI 规范
- write.md 第 1027-1039 行：指示 Claude 读取完整的 `anti-ai-v4.md` 文件
- 结果：同样的规范被发送了两遍

**优化**：
- 删除 write.md 中内嵌的反 AI 规范（第 950-1024 行）
- 保留对 `anti-ai-v4.md` 的引用指令（第 1027-1039 行）
- 添加简短的核心提醒（~5 行，仅列出最关键的 3 条原则）

**质量保障**：Claude 仍然会读取完整的 `anti-ai-v4.md`，写作质量不受影响。

#### 2.1.2 具象化检查精简（~100 行 → ~15 行）

**现状分析**：第 1102-1196 行包含完整的具象化检查清单、示例对比。这些是教学性质的参考材料。

**优化**：
- 创建新文件 `templates/knowledge-base/requirements/concretization.md`，存放完整清单和示例
- write.md 中保留 ~15 行的精简引用，指示 Claude 首次写作时读取该文件

#### 2.1.3 后置处理精简（~350 行 → ~80 行）

**现状分析**：第 1267-1580 行包含 4 个 tracking 文件的完整 JSON 示例（character-state, relationships, plot-tracker, timeline）、日志格式模板、错误处理。

**优化**：
- 创建新文件 `templates/skills/auto-tracking/SKILL.md`，存放完整的 JSON 示例和格式模板
- write.md 中保留 ~80 行的执行步骤（分析内容 → 读取 tracking 文件 → 更新 → 记录日志），引用外部 skill 文件获取格式详情

#### 2.1.4 三层资源加载说明精简（~300 行 → ~50 行）

**现状分析**：第 162-537 行包含三层资源加载机制的完整 JavaScript 伪代码和配置示例。这些是实现说明，不是执行指令。

**优化**：
- `check-writing-state.sh` 脚本已经承担了实际的资源检测逻辑
- write.md 只保留「运行脚本 → 解析 JSON 报告 → 按报告加载资源」的精简指令
- 关键词触发的交互流程保留，但删除 JavaScript 伪代码

### 2.2 策略二：分层缓存架构（额外节省 20-30%）

**核心思路**：把跨命令共享的核心原则放入生成项目的 CLAUDE.md，利用 system prompt 的 prompt caching 机制（90% 折扣）。

#### 2.2.1 架构

```
生成的小说项目/
├── .claude/
│   └── CLAUDE.md              ← 新增：共享写作规范（~150 行）
├── .claude/commands/
│   ├── write.md               ← 精简后 ~300 行
│   ├── plan.md                ← 精简
│   ├── analyze.md             ← 精简
│   └── ...
└── .specify/
    └── templates/
        └── knowledge-base/
            └── requirements/
                ├── anti-ai-v4.md        ← 已有
                └── concretization.md    ← 新增
        └── skills/
            └── auto-tracking/
                └── SKILL.md             ← 新增
```

#### 2.2.2 CLAUDE.md 内容设计（~150 行）

**仅放入跨命令共享的核心原则**，不放命令特定的执行流程：

```markdown
# 小说创作核心原则

## 反 AI 写作核心（精简版）
- 单句成段比例 30%-50%，每段 50-100 字
- 短句优先（15-25 字），白话替代文绉绉
- 删除装饰性形容词，一个准确细节胜过三个堆砌
- 完整规范见 `templates/knowledge-base/requirements/anti-ai-v4.md`

## 段落结构规范
- 禁止使用"一"、"二"、"三"等数字标记分段
- 场景转换用两个空行（一个空白行）分隔

## 后置 Tracking 处理原则
- /write 完成后自动更新 4 个 tracking 文件
- 格式详情见 `templates/skills/auto-tracking/SKILL.md`

## 会话级资源复用
- 本次对话中已加载的资源知识应复用，避免重复读取文件
- 首次加载：读取文件，记住已加载列表
- 后续命令：已加载的直接使用，未加载的才读取

## 前文内容加载策略
- 读取上一章完整文件
- 如果 > 1500 字，只保留最后 1000 字
- 如果 ≤ 1500 字，保留全部
- 额外读取上一章标题和开篇第一段
```

#### 2.2.3 Token 成本模型

| 组件 | 首次 /write | 后续 /write | 说明 |
|------|------------|------------|------|
| CLAUDE.md (system) | 150 行 全价 | 150 行 × 10% = 15 行等效 | prompt caching |
| write.md (user) | 300 行 全价 | 300 行 全价 | 无法缓存 |
| 外部文件读取 | ~200 行 全价 | 0（复用） | 会话级资源复用 |
| **小计** | 650 行等效 | 315 行等效 | |

**写 5 章总成本**：650 + 315 × 4 = 1,910 行等效（vs 当前 8,085 行，**节省 76%**）

#### 2.2.4 CLAUDE.md 膨胀控制

**原则**：CLAUDE.md 只放「核心原则」（~150 行），不放「执行细节」。

**控制策略**：
- 每个命令可贡献到 CLAUDE.md 的内容不超过 30 行
- 详细的参考材料一律放在外部文件中
- 定期审计 CLAUDE.md 大小，保持在 200 行以内

### 2.3 策略三：运行时优化（额外节省 10-15%）

#### 2.3.1 资源文件合并加载

**现状**：每个 knowledge-base 和 skill 文件单独读取（5-9 次 Read 调用），每次工具调用都有 round-trip token 开销。

**优化**：
- 创建 `templates/knowledge-base/quick-reference.md`，将最常用的 craft 知识合并为一个文件
- 首次 `/write` 时一次性读取，后续复用

#### 2.3.2 Tracking 更新批量化

**现状**：后置处理分别读取和写入 4 个 JSON 文件（8 次文件操作）。

**优化**：
- 创建 `scripts/bash/batch-tracking.sh`，一次性读取所有 tracking 文件并输出合并状态
- 更新时也通过脚本批量写入
- 减少 4-6 次工具调用的 round-trip 开销

#### 2.3.3 `/compact` 策略性使用

在 write.md 后置处理中添加提示：

```markdown
## /compact 建议

每写完 2-3 章后，建议执行 `/compact` 压缩对话历史。

原因：
- 已写的章节文本保存在文件中，tracking 文件已更新关键信息
- 对话历史中的旧章节文本不再需要
- compact 会保留：已加载资源列表、最近章节要点、角色状态概要
- compact 会清除：完整的旧章节文本、工具调用详细日志
```

#### 2.3.4 前文内容智能裁剪

```markdown
前文内容加载策略：
1. 读取上一章的完整文件
2. 如果 > 1500 字，只保留最后 1000 字（覆盖最后 1-2 个场景）
3. 如果 ≤ 1500 字，保留全部内容
4. 额外读取上一章的标题和开篇第一段

补充上下文来源（不依赖前文全文）：
- creative-plan.md：整本书的章节大纲和情节走向
- tasks.md：当前章节的具体写作任务描述
- character-state.json：所有角色当前状态
- relationships.json：角色间关系
- plot-tracker.json：情节线进度和伏笔
- timeline.json：故事时间线
```

---

## 3. 实施计划

### Phase 1：Prompt 精简（策略一）

**修改文件**：
1. `templates/commands/write.md` — 精简从 1,617 行到 ~300 行
2. 新建 `templates/knowledge-base/requirements/concretization.md` — 具象化检查完整清单
3. 新建 `templates/skills/auto-tracking/SKILL.md` — Tracking 处理详细格式

**工作方式**：
- 将 write.md 中的重复内容和示例移到外部文件
- 保留所有执行指令，只删除冗余

### Phase 2：分层缓存架构（策略二）

**修改文件**：
1. `templates/dot-claude/CLAUDE.md` — 新建生成项目的 CLAUDE.md 模板
2. `src/` 中的 init 命令 — 确保 `novelws init` 生成 `.claude/CLAUDE.md`
3. `templates/commands/write.md` — 将共享原则移到 CLAUDE.md，write.md 中引用

### Phase 3：运行时优化（策略三）

**修改文件**：
1. 新建 `templates/knowledge-base/quick-reference.md` — 合并常用 craft 知识
2. 新建 `scripts/bash/batch-tracking.sh` — 批量 tracking 操作
3. `templates/commands/write.md` — 添加 compact 提示和前文裁剪策略

### Phase 4：其他命令优化

将同样的策略应用到其他高频命令：
1. `/plan`（1,285 行 → ~400 行）
2. `/analyze`（2,070 行 → ~500 行）
3. `/track`（910 行 → ~300 行）
4. `/specify`（904 行 → ~300 行）

---

## 4. 质量保障

### 4.1 质量不受影响的理由

| 精简内容 | 保障方式 |
|---------|---------|
| 反 AI 规范 | 完整规范仍在 `anti-ai-v4.md`，Claude 首次 /write 会读取 |
| 具象化检查 | 移到独立文件 `concretization.md`，首次读取后复用 |
| 后置 tracking 格式 | 移到 `auto-tracking/SKILL.md`，首次读取后复用 |
| 三层资源加载逻辑 | 由脚本 `check-writing-state.sh` 承担 |
| 段落结构规范 | 移到 CLAUDE.md（system prompt，始终可用） |

### 4.2 关键设计原则

- **「Claude 可用的知识总量」不减少**——只改变传递方式
- **首次 /write 加载所有必要资源**——后续复用
- **核心原则放在 CLAUDE.md**——始终可用且缓存友好
- **详细参考放在外部文件**——按需读取，会话内复用

### 4.3 回归验证

实施每个 Phase 后，应进行写作测试：
1. 使用优化后的命令写 3 章
2. 对比优化前后的写作质量（反 AI 指标、文笔自然度）
3. 确认 tracking 更新正确性
4. 确认资源加载完整性

---

## 5. 预期收益

### 5.1 Token 节省

| 场景 | 当前 | 优化后 | 节省 |
|------|------|--------|------|
| 单次 /write | ~16,000 tokens | ~3,500 tokens | 78% |
| 连续写 5 章 | ~80,000 tokens | ~18,000 tokens | 77% |
| 连续写 10 章 | ~160,000 tokens | ~33,000 tokens | 79% |
| 混合命令（/write + /plan + /analyze） | ~200,000 tokens | ~50,000 tokens | 75% |

### 5.2 其他收益

- **响应速度提升**：更短的 prompt 意味着更快的 API 响应（首 token 延迟降低）
- **上下文空间释放**：节省的 token 空间可用于更长的章节创作
- **维护性提升**：命令 prompt 更简洁，修改更方便
