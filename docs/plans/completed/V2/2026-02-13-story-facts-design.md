# Story Facts 数据源与一致性校验系统

## 背景

在小说创作过程中，第2章的宗门财务数字（月亏300→1000）改动后，波及了15个文件：第2-5章正文、creative-plan.md、tasks.md、analysis-report.md、vol-01-detail.md、world-setting.md/json、character-state.json、timeline.json、tracking-log.md、personal-voice.md。

暴露两个核心问题：

1. **数字一致性**：改一处数据，需要手动排查全部引用位置，极易遗漏
2. **数值逻辑验证**：原文"月亏300，储备5000，五个月见底"——5000÷300≈16.7个月，算术错误在写作时未被拦截

根源：框架把数字和设定事实当作普通文本处理，没有"数据即资产"的概念。

## 设计目标

- 建立设定事实的唯一数据源，消除多处硬编码
- 章节正文保持干净，用 HTML 注释声明引用关系
- 写作时自动校验事实一致性和算术逻辑
- 事实变更时一条命令完成全局传播

## 一、Story Facts 数据源

新增 `spec/tracking/story-facts.json` 作为所有可量化设定事实的唯一数据源。

### 数据结构

```json
{
  "version": 1,
  "facts": [
    {
      "id": "finance-monthly-income",
      "category": "economy",
      "type": "number",
      "label": "宗门月收入",
      "value": 800,
      "unit": "灵石",
      "source": "第2章",
      "refs": ["finance-monthly-expense", "finance-monthly-deficit"]
    },
    {
      "id": "finance-monthly-expense",
      "category": "economy",
      "type": "number",
      "label": "宗门月支出",
      "value": 1800,
      "unit": "灵石",
      "source": "第2章"
    },
    {
      "id": "finance-monthly-deficit",
      "category": "economy",
      "type": "number",
      "label": "宗门月亏损",
      "value": 1000,
      "unit": "灵石",
      "source": "第2章",
      "derivation": "finance-monthly-expense - finance-monthly-income = 1000"
    },
    {
      "id": "finance-reserve",
      "category": "economy",
      "type": "number",
      "label": "灵石储备",
      "value": 5000,
      "unit": "灵石",
      "source": "第2章"
    },
    {
      "id": "finance-runway",
      "category": "economy",
      "type": "number",
      "label": "储备可撑月数",
      "value": 5,
      "unit": "月",
      "source": "第2章",
      "derivation": "finance-reserve / finance-monthly-deficit = 5"
    },
    {
      "id": "sect-name",
      "category": "setting",
      "type": "string",
      "label": "宗门名称",
      "value": "云霄宗",
      "source": "第1章"
    },
    {
      "id": "sect-rank",
      "category": "setting",
      "type": "enum",
      "label": "宗门等级",
      "value": "下宗",
      "options": ["上宗", "中宗", "下宗"],
      "source": "第1章"
    },
    {
      "id": "sect-outer-disciples",
      "category": "personnel",
      "type": "number",
      "label": "外门杂役总数",
      "value": 320,
      "unit": "人",
      "source": "第4章"
    }
  ],
  "rules": [
    {
      "id": "rule-runway",
      "type": "arithmetic",
      "expression": "finance-reserve / finance-monthly-deficit == finance-runway",
      "description": "储备÷月亏=可撑月数"
    },
    {
      "id": "rule-deficit",
      "type": "arithmetic",
      "expression": "finance-monthly-expense - finance-monthly-income == finance-monthly-deficit",
      "description": "支出-收入=亏损"
    }
  ]
}
```

### 字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| id | 是 | 唯一标识符，kebab-case |
| category | 是 | 分类：economy / personnel / setting / geography / timeline |
| type | 是 | 类型：number / string / enum / date |
| label | 是 | 中文标签，用于报告展示 |
| value | 是 | 当前值 |
| unit | 否 | 单位（数字类型适用） |
| source | 是 | 首次出现的章节或文件 |
| refs | 否 | 关联事实 ID 列表 |
| derivation | 否 | 派生公式，记录该值如何从其他事实计算得出 |
| options | 否 | 枚举类型的可选值列表 |
| constraint | 否 | 自然语言描述的约束条件 |

### 支持的事实类型

| type | 校验方式 | 示例 |
|------|---------|------|
| number | 精确数值匹配 + 算术规则 | 月亏1000灵石 |
| string | 矛盾检测 | 宗门名称、等级 |
| enum | 枚举值约束 | 宗门等级只能是上宗/中宗/下宗 |
| date | 时间逻辑校验 | 事件发生顺序 |

## 二、章节注释引用

章节正文中用 HTML 注释声明本章引用了哪些事实，放在文件头部（标题之后）：

```markdown
# 第4章 杂役的价码

<!-- story-facts: finance-monthly-deficit, finance-reserve, finance-runway, sect-outer-disciples -->

第四天，卯时。陆衡站在执事堂门口。
...
```

### 设计原则

- 正文完全不受影响，读者和导出时看不到标记
- `/write` 时知道本章依赖哪些事实，可以精确校验
- 事实变更时，能快速定位所有引用了该事实的章节

### 校验逻辑

`/write` 完成后自动执行：

1. 解析章节头部的 `<!-- story-facts: ... -->` 注释
2. 从 `story-facts.json` 加载对应事实的当前值
3. 扫描正文，检查引用的事实值是否与数据源一致
4. 执行 `rules` 中的算术约束校验
5. 不一致时输出警告，列出具体位置和期望值

### 警告输出示例

```
⚠️ 事实一致性检查发现 2 个问题：

1. 第4章 第143行：提到"月亏三百块灵石"
   → 数据源 finance-monthly-deficit = 1000灵石

2. 第5章 第34行：提到"月亏从300灵石降到195"
   → 数据源 finance-monthly-deficit = 1000灵石
```

## 三、/facts 命令

新增 `/facts` 命令，提供三个子功能：

### 3.1 `/facts` — 查看和管理事实

- 列出所有已注册事实，按 category 分组
- 支持增删改操作
- 修改时自动校验 rules 中的算术约束，提示派生值是否需要同步更新

### 3.2 `/facts check` — 全局一致性扫描

- 扫描所有章节的 `<!-- story-facts: -->` 声明
- 对比正文内容与数据源
- 执行所有算术规则校验
- 输出完整的不一致报告
- 可独立运行，也在 `/write` 完成后自动执行

### 3.3 `/facts update <fact-id>` — 变更传播

修改某个事实的值后，自动：

1. 检查 `derivation` 和 `rules`，提示需要同步更新的派生事实
2. 扫描所有声明了该事实的章节，列出需要修改的位置
3. 扫描 tracking 文件（creative-plan.md、tasks.md、tracking-log.md 等）中的旧值
4. 生成修改清单，用户确认后批量执行

## 四、与 /write 流程的集成

```
/write 现有流程
    ↓
[资源加载]  ← 新增：加载本章声明的 facts 作为写作上下文
    ↓
[写作执行]
    ↓
[质量自检]  ← 新增：story-facts 一致性校验 + 算术规则校验
    ↓
[后置 tracking 更新]  ← 新增：检测新出现的可量化事实，提示注册
    ↓
[完成]
```

具体新增两步：

- **写作前**：加载本章声明的 facts，作为写作上下文提供给 AI，确保写出的数字与数据源一致
- **写作后**：校验正文与 facts 一致性；如果发现新的可量化事实（首次出现的数字），提示用户是否注册到 story-facts.json

## 五、需要新增/修改的文件

### 新增文件

| 文件 | 说明 |
|------|------|
| `spec/tracking/story-facts.json` | 事实数据源 |
| `.claude/commands/facts.md` | /facts 命令定义 |
| `.claude/skills/quality-assurance/facts-checker/SKILL.md` | 事实校验 skill |
| `.specify/scripts/bash/check-facts.sh` | 事实校验脚本 |
| `.specify/scripts/powershell/check-facts.ps1` | PowerShell 版本 |

### 修改文件

| 文件 | 修改内容 |
|------|---------|
| `.claude/commands/write.md` | 写作前加载 facts、写作后校验、新事实注册提示 |
| `CLAUDE.md` | 新增 story-facts 相关规范说明 |
| 各章节 .md | 添加 `<!-- story-facts: -->` 注释头 |

## 六、不做的事

- 不做正文模板变量替换（`{{月亏}}` 这种），保持正文纯自然语言
- 不做自动修正，只做检测和报告，修改由用户确认
- 不替代现有的 validation-rules.json（那个管角色名称，这个管设定事实，职责不同）
- 不强制所有数字都注册，只注册跨章节引用的关键事实
