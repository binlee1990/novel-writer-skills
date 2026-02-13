---
description: 基于故事规格制定技术实现方案
argument-hint: [技术偏好和选择] [--detail vol-XX]
allowed-tools: Read(//stories/**/specification.md), Read(//stories/**/specification.md), Read(//stories/**/creative-plan.md), Read(//stories/**/creative-plan.md), Read(//plugins/**), Read(//plugins/**), Write(//stories/**/creative-plan.md), Write(//stories/**/creative-plan.md), Read(//.specify/memory/constitution.md), Read(//.specify/memory/constitution.md), Bash(find:*), Bash(grep:*), Bash(*)
scripts:
  sh: .specify/scripts/bash/plan-story.sh
  ps: .specify/scripts/powershell/plan-story.ps1
---

用户输入：$ARGUMENTS

## 目标

将"要创造什么"（规格）转化为"如何创造"（计划）。这是从需求到实现的关键转换。

## 参数解析

1. **故事目录名**：从 `$ARGUMENTS` 中提取故事目录名
2. **卷级详细规划**：检查 `$ARGUMENTS` 是否包含 `--detail vol-XX` 或 `--detail vol-XX-YY`
   - 单卷（`--detail vol-XX`）→ 跳转到「卷级详细规划」
   - 多卷范围（`--detail vol-XX-YY`）→ 跳转到「多卷批量规划」
   - 不包含 → 执行正常的全书规划流程
3. **反馈接收模式**：检查 `$ARGUMENTS` 是否包含 `--feedback` → 跳转到「反馈接收模式」

## 执行步骤

### 1. 加载前置文档

**运行脚本** `{SCRIPT}` 检查并加载：
- 宪法文件：`.specify/memory/constitution.md`
- 规格文件：`stories/*/specification.md`
- 澄清记录（如果已运行 `/clarify`）

**解析资源加载报告**：

```bash
# Bash 环境
bash {SCRIPT} --json

# PowerShell 环境
powershell -File {SCRIPT} -Json
```

**报告处理**：检查 `status` 是否为 "ready"，记录 `resources` 列表。

**加载规划辅助资源（三层机制）**：

#### Layer 1: 默认推断

未配置 resource-loading 或 `auto-load: true` 时，自动加载：
- `.specify/templates/knowledge-base/craft/scene-structure.md`
- `.specify/templates/knowledge-base/craft/character-arc.md`
- `.specify/templates/knowledge-base/craft/pacing.md`
- `.specify/templates/skills/planning/story-structure/SKILL.md`（如存在）

#### Layer 2: 配置覆盖

读取 `specification.md` 的 `resource-loading.planning` 配置，按配置加载资源。
优先级：宪法/规格 > 规划辅助资源 > 类型知识库。

#### Layer 3: 运行时关键词触发

读取 `specification.md` 的 `resource-loading.keyword-triggers` 配置。
扫描命令参数、现有计划、用户输入，匹配关键词后提示用户确认加载。
跳过 Layer 1/2 已加载的资源。

**会话级资源复用**：已加载的资源直接使用，不重复读取。用户要求"重新加载"或配置变化时重新读取。

---

<!-- PLUGIN_HOOK: genre-knowledge-plan -->

**条件加载：黄金开篇法则**：

如果总字数 < 10000字 或规划范围包含第1-3章：
- 检查 `spec/presets/golden-opening.md` 是否存在
- 如存在则读取，在规划前三章时应用五大黄金法则

**条件加载：节奏配置**：

如果 `spec/presets/rhythm-config.json` 存在：
- 读取并应用对标作品的节奏参数（章节字数、爽点间隔、内容比例）
- 参数优先级：用户即时指令 > rhythm-config.json > 类型知识库 > 默认值

**验证规格澄清状态**：如有未澄清的关键决策，提示先运行 `/clarify`。

---

## Tracking 数据加载策略

在更新 `plot-tracker.json` 时，采用 **三层回退** 机制：

### Layer 3: MCP 查询（优先）

```typescript
// 如果 MCP 已启用且数据已同步
const plotData = await mcp.call('novelws-mcp/query_plot', {
  volume: 'vol-03',      // 如果指定了 --detail vol-XX
  status: 'all'
});
```

**优势**：
- 高性能范围查询（按卷过滤伏笔）
- 自动聚合紧急度统计
- 支持跨卷伏笔关联查询

### Layer 2: 分片 JSON（次优）

```bash
# 当 spec/tracking/volumes/ 存在时
if [[ -n "$VOLUME_FILTER" ]]; then
  # 仅读取指定卷的 plot-tracker
  cat "spec/tracking/volumes/$VOLUME_FILTER/plot-tracker.json"
else
  # 读取全局摘要 + 所有卷数据
  cat "spec/tracking/summary/plot-summary.json"
  for vol in spec/tracking/volumes/vol-*/; do
    cat "$vol/plot-tracker.json"
  done
fi
```

**适用场景**：
- MCP 未启用或同步延迟
- 需要精确章节级别的伏笔数据
- 手动编辑 JSON 后即时验证

### Layer 1: 单文件 JSON（兜底）

```bash
# 传统模式，加载完整文件
cat spec/tracking/plot-tracker.json
```

**向下兼容**：小型项目（< 300 章）继续使用单文件模式

### 数据写入协议

**分片模式**（spec/tracking/volumes/ 存在）：

1. **确定目标卷**：
   - 如果指定 `--detail vol-XX`，写入该卷
   - 否则根据规划的章节范围确定卷

2. **写入分片文件**：
   ```bash
   Write(spec/tracking/volumes/${target_volume}/plot-tracker.json)
   ```

3. **更新全局摘要**：
   ```bash
   # 更新 plot-summary.json 的伏笔统计
   Write(spec/tracking/summary/plot-summary.json)
   ```

4. **触发 MCP 同步**（如果启用）：
   ```bash
   mcp-cli call novelws-mcp/sync_from_json '{
     "mode": "incremental",
     "tables": ["plot_threads", "foreshadows"]
   }'
   ```

**单文件模式**（传统）：

直接写入完整 `plot-tracker.json`：
```bash
Write(spec/tracking/plot-tracker.json)
```

---

### 2. 制定创作计划

创建 `stories/*/creative-plan.md`，包含以下内容：

#### 2.1 写作方法选择

基于规格分析和故事类型，选择最适合的写作方法：
- **三幕结构**：适合线性叙事、明确起承转合
- **英雄之旅**：适合成长型、冒险类故事
- **七点结构**：适合悬念、反转类故事
- **故事圈**：适合角色驱动、心理深度
- **混合方法**：主线+支线使用不同方法
- **类型专用结构**：如爽文的"爽点分布结构"、悬疑的"线索布局结构"等

**网文专用结构**：如果类型为网文类（玄幻、都市、言情、游戏文等），加载 `.specify/templates/knowledge-base/craft/story-structures.md`，从升级流/副本流/任务流/日常流中选择适合的结构模板。

记录选择理由和应用方式。

#### 2.2 章节架构设计

```markdown
## 章节架构

### 总体规划
- 总章数：[基于目标字数和章节长度]
- 章节长度：[基于节奏配置或默认2000-3000字/章]
- 分卷安排：[如适用]

**节奏参数（如有rhythm-config.json）**：
- 平均章节字数：[从配置读取]
- 小高潮间隔 / 大高潮间隔：[从配置读取]
- 内容比例：对话[X]% / 动作[X]% / 描写[X]% / 心理[X]%

### 黄金开篇规划（如果包含第1-3章）

**重要**：基于 golden-opening.md，逐条检查五大法则：

#### 第一章规划
- **法则1-动态场景切入**：从冲突/动作/对话直接切入，禁止静止场景
- **法则2-核心冲突前置**：第一章内抛出主角核心冲突
- **法则3-避免信息轰炸**：采用"滴灌式"信息透露
- **法则4-限制出场人数**：有名有姓角色不超过3人

#### 第二-三章规划
- **法则5-快速展现金手指**：第二或第三章内展现"金手指"作用
- 开篇节奏：第一章钩住读者 → 第二章展现能力 → 第三章初步爽点

### 情绪曲线设计

**核心理念**：读者追读的本质是追逐情绪的起伏和满足。

**情绪类型**：爽点（获胜/反转）、虐点（失败/压抑）、悬念（未知/伏笔）、平缓（日常/过渡）

**设计原则**：
1. **欲扬先抑**：爽点前适度铺垫虐点
2. **张弛有度**：避免连续同类型情绪
3. **悬念驱动**：每章结尾留悬念
4. **情绪递进**：高潮强度递增

**章节段情绪规划表**：

| 章节段 | 情绪类型 | 强度 | 目标效果 | 关键场景 |
|--------|---------|------|---------|---------|
| 第1-3章 | 虐→爽→悬念 | 中→高→中 | 建立追读欲 | [具体描述] |
| ... | ... | ... | ... | ... |

**情绪强度等级**：低（铺垫过渡）→ 中（明显起伏）→ 高（爆发投入）→ 极高（全书顶点，1-3处）

**自检**：开篇3章有钩子？无连续5章平缓？虐点后有爽点回报？每卷有情绪高潮？

### 结构映射
[根据选定方法，映射关键节点到具体章节]

### 线索分布规划

从 specification.md 第五章读取线索管理规格，在每个卷/章节段标注活跃线索：

| 章节段 | 内容 | 关键事件 | 活跃线索 | 交汇点 |
|--------|------|---------|---------|--------|
| [X-Y章] | [内容] | [事件] | PL-XX⭐⭐⭐ | X-XXX |

线索标注：⭐⭐⭐主推进、⭐⭐辅助、⭐背景

### 节奏设计
- 开篇钩子 / 第一个高潮 / 中点转折 / 最大危机 / 最终高潮：各标注章节号
```

#### 2.2.1 卷级详细规划（`--detail vol-XX`）

**触发条件**：`$ARGUMENTS` 包含 `--detail vol-XX` 或 `--detail vol-XX-YY`

加载 `.specify/templates/skills/planning/volume-detail/SKILL.md`，按其流程执行：
- 单卷：卷概要确认 → 逐章规划 → 节奏总览 → 写入 → 生成 tasks.md → 灵感分配
- 多卷：范围确认 → 逐卷规划 → 跨卷节奏对比 → 批量生成 tasks.md

**灵感分配**：规划完成后自动检查 `notes/ideas.json`，将 `status=new` 的灵感按标签/角色/类别匹配到章节，生成灵感分配建议，用户确认后更新灵感状态。

#### 2.2.2 爽点分布规划

**执行时机**：全书规划时（非 `--detail` 模式）

根据故事类型确定爽点类型池：

| 故事类型 | 主要爽点类型 | 次要爽点类型 |
|---------|------------|------------|
| 玄幻/修仙 | 升级、打脸、获得 | 逆袭、揭秘、认可 |
| 都市 | 打脸、逆袭、认可 | 获得、揭秘 |
| 言情 | 情感满足、误会解除、认可 | 逆袭、揭秘 |
| 悬疑 | 揭秘、反转 | 逆袭、认可 |
| 文学 | 顿悟、和解、成长 | 揭秘 |

**爽点密度规划**：
- 每卷开头3章内必须有1个爽点
- 每卷高潮必须有1个强爽点（⭐⭐⭐⭐以上）
- 连续无爽点章节不超过N章（网文≤3，文学≤5）
- 爽点类型至少3种
- 后续卷爽点强度应≥前卷

在 `creative-plan.md` 中记录全书爽点曲线表和爽点递进设计。

#### 2.2.3 钩子链设计

**执行时机**：全书规划时（非 `--detail` 模式）

**关键钩子节点**（必须⭐⭐⭐⭐以上）：
- 第1章结尾、每卷最后一章、重大转折前一章、免费章节最后一章

**卷间钩子链**：规划每个卷末的钩子类型、强度、内容和下卷兑现方式。

**主线钩子链**：埋设悬念 → 部分线索 → 误导揭示 → 真相大白。

将爽点分布和钩子链写入 `creative-plan.md`。

#### 2.3 人物体系设计

```markdown
## 人物体系

### 主角设计
- 初始状态 / 成长弧线 / 核心冲突 / 关键转变点

### 配角功能
[每个重要配角的功能定位和出场计划]

### 关系网络
[人物关系图和演变计划]
```

#### 2.4 世界观构建

```markdown
## 世界观体系

### 核心设定
- 世界规则 / 社会结构 / 历史背景

### 设定展开计划
- 第一层（开篇）：基础设定
- 第二层（发展）：深入设定
- 第三层（高潮）：核心秘密
```

#### 2.5 情节技术设计

```markdown
## 情节技术

### 冲突升级路径
1. 初级冲突：[个人层面]
2. 中级冲突：[团体层面]
3. 高级冲突：[世界层面]

### 悬念设置
- 主悬念 / 章节悬念 / 支线悬念

### 伏笔布局
[伏笔清单和回收计划]
```

#### 2.6 叙事技术选择

```markdown
## 叙事技术

### POV设计
- 视角类型 / 视角限制 / 多视角安排

### 时间线设计
- 主线时间 / 回忆穿插 / 平行叙事

### 叙事节奏
- 快节奏段落（动作/冲突）/ 慢节奏段落（情感/描写）/ 节奏变化规律
```

### 3. 技术决策记录

记录决策、理由、风险和备案。

### 4. 质量保证计划

自检清单：逻辑一致性、人物行为合理性、世界观自洽性、节奏流畅性。
验证节点：每5章小循环、每卷大循环、完稿全面验证。

### 5. 风险管理

识别创作风险（灵感/逻辑/节奏）、技术风险（复杂度/一致性）、时间风险（进度/质量平衡）。

### 6. 输出和验证

- 保存计划到 `stories/*/creative-plan.md`
- 验证计划符合宪法原则和规格需求
- 提示下一步：运行 `/tasks` 生成任务

## 与其他命令的关系

- **输入**：来自 `/specify` 的规格 + `/clarify` 的澄清
- **输出**：为 `/tasks` 提供任务生成依据
- **验证**：被 `/analyze` 用于检查实现符合度
- **期待管理**：参考 `reader-expectation` Skill，确保每个情节承诺都有明确的 payoff 章节
- **多线叙事**：参考 `multi-thread-narrative` Skill，设计线程分配和汇聚点

## 注意事项

- **技术服务于故事**：所有技术选择服务于故事表达，保持方案灵活性
- **可执行性**：计划要具体可执行，避免过于理想化
- **迭代优化**：计划可根据实践调整，记录调整原因，保持版本追踪
- **黄金开篇是硬规则**，其他规划可以灵活

---

## 后置处理：plot-tracker 自动更新

**执行时机**：`creative-plan.md` 写入完成后，自动执行（无需用户确认）。

**更新流程**：
1. 从 `creative-plan.md` 提取情节线定义、章节分配、伏笔规划
2. 按三层 Fallback 读取现有 plot-tracker 数据：
   - **MCP 查询（优先）**：`query_plot` 获取现有情节线和伏笔
   - **分片 JSON（次优）**：读取 `spec/tracking/volumes/` 下各卷的 `plot-tracker.json`
   - **单文件 JSON（兜底）**：读取 `spec/tracking/plot-tracker.json`
3. 生成或合并 plot-tracker 数据（保留已有 progress）
4. 写入 tracking 数据：
   - **分片模式**：按卷写入 `spec/tracking/volumes/vol-XX/plot-tracker.json`，同步更新 `spec/tracking/summary/plot-summary.json`
   - **单文件模式**：直接写入 `spec/tracking/plot-tracker.json`
5. 如果 MCP 可用，调用 `sync_from_json` 同步到 SQLite
6. 追加更新记录到 `spec/tracking/tracking-log.md`（使用 diff 格式）
7. 验证 JSON 格式有效性

**错误处理**：
- 计划格式不完整 → 创建基础 plot-tracker（仅含元信息）
- plot-tracker 已存在 → 合并新情节线，保留现有进度
- tracking 目录不存在 → 提示运行 `/track --init`，跳过本次更新

---

### 反馈接收模式（`--feedback`）

**触发条件**：`$ARGUMENTS` 包含 `--feedback`

**执行流程**：
1. 读取最近一次 `/analyze` 的计划反馈
2. 展示需要调整的计划内容
3. 提供调整建议
4. 用户确认后，更新 `creative-plan.md`

**处理的反馈类型**：
- 节奏问题 → 调整章节分配
- 高潮位置偏移 → 调整高潮章节
- 伏笔回收时机 → 调整伏笔规划
- 情节线进度 → 调整支线安排

**输出格式**：

```
计划反馈处理
━━━━━━━━━━━━━━━━━━━━

反馈 #1：节奏问题
  当前计划：第 2 卷共 10 章，全部为高强度战斗
  分析建议：节奏过快，读者可能疲劳

  调整方案：
  A. 在第 5 章后插入一个过渡章节
  B. 将第 7-8 章改为低强度剧情
  C. 保持原计划

请选择 [A/B/C]：
```

---

## 命令链式提示

**命令执行完成后，自动附加下一步建议**：

```
下一步建议：
1. `/tasks` — 将创作计划分解为可执行的写作任务
2. `/plan --detail vol-01` — 细化第一卷的逐章规划
3. `/analyze --type=framework` — 验证框架一致性，确认准备就绪
```
