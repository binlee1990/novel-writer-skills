# Story Facts 实现设计

基于 [story-facts-design.md](completed/2026-02-13-story-facts-design.md) 的实现方案。

## 实现方案：全 Prompt 驱动（方案 A）

所有校验逻辑写在 `/facts` 命令的 prompt 和 `facts-checker` skill 中，由 AI 执行。脚本仅做辅助（解析注释头、列出引用关系）。

### 选择理由

1. 项目核心模式就是"模板 + Prompt 驱动"，facts 系统保持一致
2. V1 只做声明引用校验，AI 完全能胜任
3. 脚本只做 AI 不擅长的事：文件系统扫描、结构化提取
4. 算术规则校验在 prompt 中用自然语言描述即可

## 一、文件清单与职责

### 新增文件（5 个）

| 文件 | 职责 |
|------|------|
| `templates/tracking/story-facts.json` | 事实数据源模板，`novelws init` 时复制到 `spec/tracking/` |
| `templates/commands/facts.md` | `/facts` Slash Command，含查看/check/update 三个子功能 |
| `templates/skills/quality-assurance/facts-checker/SKILL.md` | 事实校验 skill，被 `/write` 后置流程和 `/facts check` 调用 |
| `templates/scripts/bash/check-facts.sh` | Bash 辅助脚本：解析章节注释头、列出引用关系、输出 JSON 报告 |
| `templates/scripts/powershell/check-facts.ps1` | PowerShell 版本 |

### 修改文件（1 个）

| 文件 | 修改内容 |
|------|---------|
| `templates/commands/write.md` | 资源加载新增 facts；质量自检新增 facts 校验；后置处理新增新事实注册提示 |

### 不需要改的

- `src/commands/init.ts` — `templates/tracking/` 已整体复制到 `spec/tracking/`（第 126-128 行），新增的 `story-facts.json` 自动被带过去
- `templates/dot-claude/CLAUDE.md` — V1 不改，等实际使用后再决定

## 二、story-facts.json 数据结构

模板文件提供空结构：

```json
{
  "version": 1,
  "facts": [],
  "rules": []
}
```

### fact 元素 schema

```json
{
  "id": "finance-monthly-deficit",
  "category": "economy",
  "type": "number",
  "label": "宗门月亏损",
  "value": 1000,
  "unit": "灵石",
  "source": "第2章",
  "refs": ["finance-monthly-expense", "finance-monthly-income"],
  "derivation": "finance-monthly-expense - finance-monthly-income = 1000"
}
```

### rule 元素 schema

```json
{
  "id": "rule-deficit",
  "type": "arithmetic",
  "expression": "finance-monthly-expense - finance-monthly-income == finance-monthly-deficit",
  "description": "支出-收入=亏损"
}
```

### 字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| id | 是 | 唯一标识符，kebab-case |
| category | 是 | 分类：economy / personnel / setting / geography / timeline |
| type | 是 | 类型：number / string / enum（V1 不含 date） |
| label | 是 | 中文标签，用于报告展示 |
| value | 是 | 当前值 |
| unit | 否 | 单位（数字类型适用） |
| source | 是 | 首次出现的章节或文件 |
| refs | 否 | 关联事实 ID 列表 |
| derivation | 否 | 派生公式 |
| options | 否 | 枚举类型的可选值列表 |
| constraint | 否 | 自然语言描述的约束条件 |

### V1 范围

- 支持的 type：`number`、`string`、`enum`。`date` 留作后续
- 支持的 rule type：仅 `arithmetic`。语义约束留作后续
- 模板只放空数组，不放示例数据。示例放在 `/facts` 命令 prompt 中

## 三、章节注释引用

### 格式

```markdown
# 第4章 杂役的价码

<!-- story-facts: finance-monthly-deficit, finance-reserve, finance-runway, sect-outer-disciples -->

第四天，卯时。陆衡站在执事堂门口。
```

### 解析规则

- 正则：`<!-- story-facts: (.+?) -->`
- 逗号分隔，trim 空格，得到 fact ID 列表
- 一个章节只允许一个 story-facts 注释（多个时取第一个，脚本报 warning）

### 谁负责添加注释

- `/write` 写作完成后，AI 自动在章节头部添加（如果本章引用了已注册的 facts）
- `/facts check` 扫描时，如果发现章节引用了 facts 但没有注释头，输出提示

### 脚本输出格式

```json
{
  "chapters": [
    {
      "file": "stories/my-story/content/第4章.md",
      "facts": ["finance-monthly-deficit", "finance-reserve", "finance-runway", "sect-outer-disciples"]
    }
  ],
  "unreferenced_facts": ["sect-name", "sect-rank"],
  "unknown_ids": []
}
```

- `unknown_ids`：章节注释中声明了但 `story-facts.json` 中不存在的 ID（拼写错误检测）

## 四、/facts 命令设计

### Frontmatter

```yaml
---
description: 管理和校验故事设定事实的一致性
argument-hint: [check | update <fact-id> | add | remove <fact-id>]
allowed-tools: Read(//spec/tracking/**), Read(//stories/**/content/**), Write(//spec/tracking/story-facts.json), Bash(bash:*), Bash(powershell:*)
scripts:
  sh: .specify/scripts/bash/check-facts.sh
  ps: .specify/scripts/powershell/check-facts.ps1
---
```

### `/facts`（无参数）— 查看和管理

1. 读取 `spec/tracking/story-facts.json`
2. 按 category 分组展示所有已注册事实
3. 展示 rules 列表及当前校验状态（算术是否成立）
4. 提示用户可用操作：add / remove / update

### `/facts check` — 全局一致性扫描

1. 运行脚本 `{SCRIPT}`，获取章节引用报告
2. 读取 `story-facts.json` 加载所有事实和规则
3. 执行算术规则校验（遍历 rules，验证 expression 是否成立）
4. 逐章读取声明了 facts 的章节正文，检查引用的事实值是否与数据源一致
5. 输出不一致报告

### `/facts update <fact-id>` — 变更传播

1. 读取当前 fact 值，提示用户输入新值
2. 检查 `derivation` 和 `rules`，列出需要同步更新的派生事实
3. 用户确认后更新 `story-facts.json`
4. 运行脚本获取引用报告，列出所有引用了该 fact 的章节和 tracking 文件
5. 生成修改清单，用户确认后逐一修改

### 设计决策

`/facts add` 不做独立子命令，在无参数模式下通过对话引导用户添加。添加事实需要填多个字段，对话式交互比命令行参数更友好。

## 五、facts-checker Skill

### Metadata

```yaml
---
name: story-facts-checker
description: "Use during and after chapter writing to verify that quantifiable facts (numbers, names, settings) match the single source of truth in story-facts.json - alerts when detecting inconsistencies"
allowed-tools: Read, Grep
---
```

### 校验流程（V1 — 仅声明引用校验）

1. 读取当前章节的 `<!-- story-facts: -->` 注释，提取声明的 fact ID 列表
2. 从 `story-facts.json` 加载对应事实的当前值
3. 扫描正文，检查声明的事实值是否与数据源一致
4. 遍历 `rules`，验证涉及本章 facts 的算术规则是否成立
5. 如发现不一致，输出警告

### 与 consistency-checker 的分工

- `consistency-checker`：角色行为、世界规则、时间线逻辑（定性）
- `facts-checker`：可量化设定事实、数值逻辑（定量）
- 两者互不替代

### 新事实发现提示

写作完成后，如果正文中出现新的可量化事实（具体数字 + 单位的组合）且未在 `story-facts.json` 中注册，提示用户。仅提示，不自动注册。

## 六、/write 集成点

### 修改点 1：资源加载阶段

在"再查（状态和数据）"步骤中新增：

```markdown
- `spec/tracking/story-facts.json`（设定事实 - 如有）
```

如果当前章节已有 `<!-- story-facts: -->` 注释，解析出 fact ID 列表，将对应事实的值作为写作上下文：

```
📋 本章引用的设定事实：
- finance-monthly-deficit: 宗门月亏损 = 1000灵石
- finance-reserve: 灵石储备 = 5000灵石
- finance-runway: 储备可撑月数 = 5月

⚠️ 写作时请确保上述数值与正文一致。
```

### 修改点 2：质量自检阶段

在"格式规范检查"之后新增：

```markdown
**设定事实校验**（如 story-facts.json 存在且非空）：
- 检查本章声明的 facts 值是否与正文一致
- 验证涉及本章 facts 的算术规则
- 不一致时输出警告，不阻断写作流程
```

### 修改点 3：后置处理阶段

在"自动 Tracking 更新"之后新增：

```markdown
### 新事实注册提示

写作完成后，检查正文中是否出现新的可量化事实（具体数字 + 单位的组合），
如果未在 story-facts.json 中注册，提示用户是否需要注册。
仅提示，不自动注册。
```

### 快写模式（--fast）

跳过修改点 1 的详细事实展示，但保留修改点 2 的校验和修改点 3 的提示（与现有快写模式"完整后置处理"一致）。

## 七、辅助脚本设计

### 输入参数

```bash
# 无参数：扫描所有章节
bash check-facts.sh

# 指定故事目录
bash check-facts.sh --story my-story

# JSON 输出
bash check-facts.sh --json
```

### 核心逻辑

1. 定位 `spec/tracking/story-facts.json`，读取所有已注册的 fact ID 列表
2. 扫描 `stories/*/content/*.md`，用正则提取每个文件的 `<!-- story-facts: ... -->` 注释
3. 交叉比对：chapters、unreferenced_facts、unknown_ids

### 输出格式

人类可读模式（默认）：

```
📊 Story Facts 引用报告
━━━━━━━━━━━━

已注册事实: 8 个
引用章节: 3 个

章节引用:
  第2章.md → finance-monthly-income, finance-monthly-expense, finance-monthly-deficit
  第4章.md → finance-monthly-deficit, finance-reserve, finance-runway, sect-outer-disciples
  第5章.md → finance-monthly-deficit

未被引用的事实: sect-name, sect-rank
未知 ID: (无)
```

JSON 模式（`--json`）：第三节中的 JSON 结构。

### 不做的事

- 不读取正文内容
- 不做数值匹配或算术校验
- 不修改任何文件

## 八、V1 范围与后续迭代

### V1 做的

- story-facts.json 数据结构（number/string/enum + arithmetic rules）
- 章节注释引用格式
- /facts 命令（查看/check/update）
- facts-checker skill（声明引用校验）
- /write 三处集成
- check-facts 辅助脚本

### 后续迭代

- date 类型支持
- 正文模糊匹配（中文数字、近义表达）
- 语义约束规则
- tracking 文件（creative-plan.md、tasks.md 等）中的事实引用扫描
