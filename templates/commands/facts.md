---
description: 管理和校验故事设定事实的一致性
argument-hint: [check | update <fact-id> | add | remove <fact-id>] [--volume vol-XX | --range ch-XXX-YYY]
allowed-tools: Read(//tracking/**), Read(//stories/**/content/**), Write(//tracking/story-facts.json), Bash(bash:*), Bash(powershell:*)
scripts:
  sh: resources/scripts/bash/check-facts.sh
  ps: resources/scripts/powershell/check-facts.ps1
---

# /facts - 故事设定事实管理

管理和校验故事中的可量化设定事实（数字、名称、地理等），确保全文一致性。

---

## 数据源：story-facts.json

**单一数据源原则**：所有可量化的设定事实都应注册在 `tracking/story-facts.json` 中，作为唯一可信来源（Single Source of Truth）。

### 数据结构示例

```json
{
  "version": 1,
  "facts": [
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
    },
    {
      "id": "sect-name",
      "category": "setting",
      "type": "string",
      "label": "宗门名称",
      "value": "青云宗",
      "source": "第1章"
    },
    {
      "id": "sect-rank",
      "category": "setting",
      "type": "enum",
      "label": "宗门等级",
      "value": "下三品",
      "options": ["上三品", "中三品", "下三品"],
      "source": "第1章"
    }
  ],
  "rules": [
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

#### fact 元素

| 字段 | 必填 | 说明 |
|------|------|------|
| id | 是 | 唯一标识符，kebab-case 格式 |
| category | 是 | 分类：economy / personnel / setting / geography / timeline |
| type | 是 | 类型：number / string / enum |
| label | 是 | 中文标签，用于报告展示 |
| value | 是 | 当前值 |
| unit | 否 | 单位（数字类型适用） |
| source | 是 | 首次出现的章节或文件 |
| refs | 否 | 关联事实 ID 列表 |
| derivation | 否 | 派生公式（自然语言描述） |
| options | 否 | 枚举类型的可选值列表 |
| constraint | 否 | 自然语言描述的约束条件 |

#### rule 元素

| 字段 | 必填 | 说明 |
|------|------|------|
| id | 是 | 规则唯一标识符 |
| type | 是 | 当前仅支持 "arithmetic" |
| expression | 是 | 算术表达式，使用 fact ID 作为变量 |
| description | 是 | 规则说明 |

---

## 章节引用注释格式

在章节头部使用 HTML 注释声明本章引用的事实：

```markdown
# 第4章 杂役的价码

<!-- story-facts: finance-monthly-deficit, finance-reserve, finance-runway, sect-outer-disciples -->

第四天，卯时。陆衡站在执事堂门口。
```

### 格式规范

- 使用 `<!-- story-facts: ... -->` 格式
- 逗号分隔多个 fact ID
- 放在章节标题和正文之间
- 一个章节只允许一个 story-facts 注释（多个时取第一个）

---

## 数据加载协议（三层 Fallback）

### 读取 story-facts.json

按以下优先级加载事实数据：

**Layer 1: MCP 查询（优先）**
- 调用 `query_facts` 获取事实列表
- 支持 `--volume vol-XX` 过滤：`query_facts --volume=vol-XX`
- 支持 `--range ch-XXX-YYY` 过滤：`query_facts --chapter_from=XXX --chapter_to=YYY`

**Layer 2: 分片 JSON（次优）**
- 检测 `tracking/volumes/` 是否存在
- 无 --volume 参数：读取 `tracking/story-facts.json`（全局事实文件，不按卷分片）
- 有 --volume 参数：读取全局事实文件，按 `source` 字段过滤属于该卷的事实

**Layer 3: 单文件 JSON（兜底）**
- 读取 `tracking/story-facts.json`

### 章节扫描范围

- `--volume vol-XX`：只扫描该卷范围内的章节文件（从 volume-summaries.json 获取章节范围）
- `--range ch-XXX-YYY`：只扫描指定范围的章节文件
- 无参数：扫描所有章节文件

---

## 命令用法

### `/facts` - 查看和管理

**无参数调用时**，展示当前所有已注册事实和规则状态。

#### 执行步骤

1. 读取 `tracking/story-facts.json`
2. 按 category 分组展示所有已注册事实
3. 展示 rules 列表及当前校验状态（算术是否成立）
4. 提示用户可用操作：add / remove / update

#### 输出格式示例

```
📊 Story Facts 数据源

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## Economy (3 个)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ finance-monthly-income
  宗门月收入 = 500灵石
  来源: 第2章

✓ finance-monthly-expense
  宗门月支出 = 1500灵石
  来源: 第2章

✓ finance-monthly-deficit
  宗门月亏损 = 1000灵石
  来源: 第2章
  派生自: finance-monthly-expense - finance-monthly-income

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## Setting (2 个)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ sect-name
  宗门名称 = "青云宗"
  来源: 第1章

✓ sect-rank
  宗门等级 = "下三品"
  来源: 第1章
  可选值: [上三品, 中三品, 下三品]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 算术规则 (1 个)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ rule-deficit: 支出-收入=亏损
  表达式: finance-monthly-expense - finance-monthly-income == finance-monthly-deficit
  状态: ✅ 成立

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 可用操作:
- 添加新事实: 继续对话，我会引导你填写必要字段
- 移除事实: 提供 fact ID，我会检查依赖关系
- 更新事实: 使用 /facts update <fact-id>
```

#### 添加事实（对话式）

当用户表达"添加"意图时，通过对话引导填写：

1. 询问 category 和 type
2. 根据 type 询问必填字段（id, label, value, unit, source）
3. 询问可选字段（refs, derivation, constraint, options）
4. 确认后写入 `story-facts.json`

**示例对话**：

```
用户: 添加一个新事实
助手: 好的，让我们一步步添加。

1. 这个事实属于哪个类别？
   - economy（经济）
   - personnel（人员）
   - setting（设定）
   - geography（地理）
   - timeline（时间线）

用户: economy

助手: 2. 这个事实的类型是？
   - number（数值）
   - string（字符串）
   - enum（枚举）

用户: number

助手: 3. 请提供以下信息：
   - ID（kebab-case 格式，如 finance-reserve）:
   - 中文标签（用于展示）:
   - 数值:
   - 单位（可选）:
   - 首次出现的章节:
```

#### 移除事实

当用户提供 fact ID 时：

1. 检查是否被其他 fact 的 `refs` 字段引用
2. 检查是否在 `rules` 中被使用
3. 运行 `{SCRIPT}` 检查是否在章节中被引用
4. 如有依赖，列出并要求用户确认
5. 确认后从 `story-facts.json` 删除

---

### `/facts check` - 全局一致性扫描

执行完整的事实一致性校验，包括章节引用和算术规则。

支持 `--volume vol-XX` 或 `--range ch-XXX-YYY` 限定校验范围。

#### MCP 优先策略（推荐）

如果 MCP 可用，优先使用全文检索进行校验：
1. 调用 `query_facts` 获取所有已记录的事实
2. 对每个事实，调用 `search_content` 全文检索所有提到该事实 key 的章节
3. 检查搜索结果中的 value 是否与记录一致
4. 输出不一致列表

示例：
- 事实：`{ "key": "天魂珠颜色", "value": "蓝色" }`
- MCP 搜索 "天魂珠" → 找到第 15 章 "蓝色的天魂珠"、第 203 章 "绿色的天魂珠"
- 报告：第 203 章与事实记录不一致（蓝色 vs 绿色）

如果 MCP 不可用，回退到脚本扫描方式。

#### 执行步骤（Fallback）

1. **运行脚本获取章节引用报告**：
   ```bash
   # Bash
   bash {SCRIPT} --json

   # PowerShell
   powershell -File {SCRIPT} -Json
   ```

2. **解析脚本输出**（JSON 格式）：
   ```json
   {
     "chapters": [
       {
         "file": "stories/my-story/content/第4章.md",
         "facts": ["finance-monthly-deficit", "finance-reserve"]
       }
     ],
     "unreferenced_facts": ["sect-name", "sect-rank"],
     "unknown_ids": []
   }
   ```

3. **读取 story-facts.json** 加载所有事实和规则

4. **执行算术规则校验**：
   - 遍历 `rules` 数组
   - 将 expression 中的 fact ID 替换为实际值
   - 计算表达式是否成立
   - 记录不成立的规则

5. **逐章校验声明的事实**：
   - 对于 `chapters` 中的每个文件，读取正文内容
   - 检查声明的每个 fact 的值是否在正文中一致出现
   - 记录不一致的情况

6. **输出综合报告**

#### 输出格式示例

```
🔍 Story Facts 一致性检查报告

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 章节引用扫描
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ 已扫描 5 个章节
✓ 3 个章节声明了事实引用
✓ 8 个已注册事实，5 个被引用

⚠️ 未被任何章节引用的事实 (2 个):
  - sect-name (宗门名称)
  - sect-rank (宗门等级)

❌ 章节中引用了未注册的 ID (0 个)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 算术规则校验
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ rule-deficit: 1500 - 500 == 1000 ✅ 成立

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 章节正文一致性
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

检查 第2章.md:
  ✓ finance-monthly-income: 500灵石 ✅ 一致
  ✓ finance-monthly-expense: 1500灵石 ✅ 一致
  ✓ finance-monthly-deficit: 1000灵石 ✅ 一致

检查 第4章.md:
  ✓ finance-monthly-deficit: 1000灵石 ✅ 一致
  ❌ finance-reserve: 期望 5000灵石，实际出现 "五千灵石" ⚠️ 表达不一致

检查 第5章.md:
  ✓ finance-monthly-deficit: 1000灵石 ✅ 一致

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 总结
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ 算术规则: 1/1 成立
⚠️ 正文一致性: 1 处不一致
💡 建议: 检查 第4章.md 中 finance-reserve 的表达方式
```

#### 错误处理

- **脚本执行失败**: 展示错误信息，提示检查脚本路径
- **story-facts.json 不存在**: 提示初始化（创建空文件）
- **story-facts.json 格式错误**: 展示 JSON 解析错误，提示修复

---

### `/facts update <fact-id>` - 变更传播

更新某个事实的值，并传播到所有引用位置。

#### 执行步骤

1. **读取当前事实**：
   - 从 `story-facts.json` 读取 fact 详情
   - 展示当前值和相关信息

2. **提示输入新值**：
   - 根据 type 验证输入格式
   - 如果是 enum，检查是否在 options 中

3. **检查派生关系**：
   - 如果 fact 有 `derivation` 字段，警告可能破坏派生逻辑
   - 如果其他 fact 的 `refs` 包含此 ID，列出需要同步更新的派生事实
   - 如果 `rules` 中引用了此 ID，列出可能受影响的规则

4. **用户确认变更**

5. **更新 story-facts.json**

6. **运行脚本获取引用报告**：
   ```bash
   bash {SCRIPT} --json
   ```

7. **列出所有引用位置**：
   - 从 `chapters` 列表中筛选出引用了此 fact 的文件
   - 同时检查 tracking 文件（如 `creative-plan.md`, `tasks.md`）中是否有文本引用

8. **生成修改清单**，示例：
   ```
   📝 需要修改的位置 (3 处):

   1. stories/my-story/content/第2章.md
      当前: "宗门月收入 500 灵石"
      修改为: "宗门月收入 800 灵石"

   2. stories/my-story/content/第4章.md
      当前: "每月收入仅有五百灵石"
      修改为: "每月收入仅有八百灵石"

   3. tracking/plot-tracker.json
      当前: "finance-monthly-income": 500
      修改为: "finance-monthly-income": 800
   ```

9. **用户确认后逐一修改**：
   - 读取每个文件
   - 使用 Edit 工具替换旧值为新值
   - 提示用户检查是否有遗漏（如中文数字表达）

#### 示例对话

```
用户: /facts update finance-monthly-income

助手: 当前事实信息:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ID: finance-monthly-income
标签: 宗门月收入
类型: number
当前值: 500
单位: 灵石
来源: 第2章
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

请输入新的数值（当前: 500）:

用户: 800

助手: ⚠️ 此事实被以下规则引用:
- rule-deficit: finance-monthly-expense - finance-monthly-income == finance-monthly-deficit

更新后，rule-deficit 将变为:
1500 - 800 == 1000 ❌ 不成立

建议同步更新 finance-monthly-deficit 为 700。

是否继续？(yes/no)

用户: yes

助手: ✓ 已更新 story-facts.json

扫描引用位置...

📝 找到 2 个章节引用此事实:
- 第2章.md
- 第4章.md

是否自动修改这些文件？(yes/no)
```

---

## 与 /write 集成

`/write` 命令在写作流程中会自动调用 facts 系统：

1. **资源加载阶段**：
   - 如果章节已有 `<!-- story-facts: ... -->` 注释，加载并展示这些事实的当前值
   - 提醒作者写作时保持一致

2. **质量自检阶段**：
   - 调用 facts-checker skill 校验本章声明的事实值
   - 验证相关算术规则
   - 不一致时输出警告（不阻断写作）

3. **后置处理阶段**：
   - 检测正文中是否出现新的可量化事实（具体数字 + 单位）
   - 如未注册，提示用户是否需要添加到 story-facts.json

---

## 常见场景

### 场景 1: 初次使用

1. 执行 `/facts`，发现 story-facts.json 为空
2. 对话式添加第一个事实
3. 手动在已写章节头部添加 `<!-- story-facts: ... -->` 注释
4. 执行 `/facts check` 验证

### 场景 2: 写作新章节

1. `/write 第10章`
2. 写作过程中引用了已注册的事实（如"宗门月亏损一千灵石"）
3. 写作完成后，系统自动在章节头部添加注释
4. facts-checker 校验引用值是否与 story-facts.json 一致

### 场景 3: 发现设定矛盾

1. `/facts check` 发现 第5章 中 "宗门月亏损" 值不一致
2. 确认正确值应该是 1000
3. 使用 Edit 工具手动修复 第5章 正文
4. 再次 `/facts check` 确认修复

### 场景 4: 剧情发展导致设定变更

1. 第20章 剧情中宗门收入提升到 1200 灵石
2. `/facts update finance-monthly-income`
3. 输入新值 1200
4. 系统列出所有引用此值的前置章节
5. 用户决定是否修改旧章节（通常不修改，因为是时间线发展）
6. 手动在 第20章 中添加新事实 `finance-monthly-income-after-ch20`

---

## 最佳实践

1. **在写作早期建立 facts 数据源**：前 3-5 章出现的关键数字都应注册
2. **章节引用注释在写作完成后立即添加**：不要等到后期批量补
3. **定期执行 `/facts check`**：建议每写完 5 章执行一次
4. **变更事实前先检查影响范围**：使用 `/facts update` 而非直接修改 JSON
5. **算术规则尽早建立**：发现数值关联时立即添加 rule

---

## 限制与未来扩展

### V1 限制

- 仅支持 `number`、`string`、`enum` 三种类型
- 仅支持 `arithmetic` 类型的规则
- 正文匹配使用精确字符串比对（不支持中文数字、近义表达）
- 仅扫描章节文件（不扫描 tracking 文件中的引用）

### 计划中的功能

- `date` 类型支持及时间线自动校验
- 正文模糊匹配（"五百" = 500）
- 语义约束规则（如 "sect-rank 为下三品时，sect-disciples 应 < 200"）
- tracking 文件中的事实引用扫描
