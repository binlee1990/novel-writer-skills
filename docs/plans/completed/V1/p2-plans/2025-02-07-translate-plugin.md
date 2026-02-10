# Translate 翻译插件实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标：** 创建 translate 翻译插件，支持小说的多语言翻译（中英日等），保持文学性与术语一致性

**架构：** Plugin 格式，包含翻译命令、术语表管理、翻译专家、质量检查

**技术栈：** Claude API（翻译引擎），术语表 JSON 系统，上下文管理

**预估工时：** 15-20 小时（MVP: 8-10h）

---

## 背景与动机

### 问题

**场景 1：翻译成本高昂**
```
网文作者想拓展海外读者：
- 一部 30 万字小说，人工翻译报价 3-6 万元
- 翻译周期 3-6 个月
- 修改反复，沟通成本高
- 多数独立作者负担不起
```

**场景 2：术语翻译不一致**
```
分章节翻译时：
- 第 1 章："青云宗" → "Azure Cloud Sect"
- 第 5 章："青云宗" → "Green Cloud Faction"
- 第 12 章："青云宗" → "Qingyun Sect"
→ 同一名词三种译法，读者困惑
```

**场景 3：机翻质量差，失去文学性**
```
原文："他的心如刀绞，眼看着师父倒在血泊中。"

Google 翻译："His heart was like a knife, watching his master fall in a pool of blood."
→ "心如刀绞"直译为"心像一把刀"，完全失去意境

期望翻译："His heart wrenched with agony as he watched his master collapse into a pool of blood."
→ 保持了原文的痛苦感和画面感
```

**场景 4：文化特定表达处理困难**
```
原文："他三十六计走为上计，脚底抹油溜了。"

直译："He thirty-six stratagems walk is the best, feet rub oil slipped away."
→ 完全不可读

期望："He chose discretion over valor and quietly slipped away."
→ 文化适应，保持原意
```

### 当前状态

**市场现状：**
- Webnovel（起点国际版）：大量中文网文翻译需求
- 日本轻小说翻译到中文的需求同样庞大
- 现有方案：Google Translate（差）、DeepL（中）、人工翻译（贵）
- 没有专门针对小说的翻译工具

**项目现状：**
- 插件系统已完成（P1），支持远程安装
- 已有 authentic-voice 等插件作为参考
- 无任何翻译功能实现

### 价值主张

1. **降低成本** - AI 翻译 + 术语管理 = 人工翻译 5% 的成本
2. **术语一致** - 统一管理角色名、地名、专有名词，100% 一致
3. **保持文学性** - 不是直译，而是文学翻译（意译 + 文化适应）
4. **快速迭代** - 30 万字小说，翻译时间从 3 个月 → 几小时
5. **风格保持** - 翻译后保持原文的叙述风格和节奏
6. **多语言** - 一次设置，支持多种目标语言

---

## Task 1: 研究小说翻译特殊需求

**Files:**
- Read: `plugins/authentic-voice/config.yaml`（参考插件结构）
- Read: `templates/knowledge-base/styles/natural-voice.md`（参考风格保持）
- Research: 小说翻译 vs 通用翻译的差异

**Step 1: 分析小说翻译与通用翻译的差异**

| 维度 | 通用翻译 | 小说翻译 |
|------|---------|---------|
| 准确性 | 信息准确即可 | 需要保持意境和情感 |
| 风格 | 不重要 | 必须保持原文风格 |
| 术语 | 通用词汇 | 大量专有名词（角色名、地名、功法名） |
| 文化 | 直译为主 | 需要文化适应 |
| 长度 | 短文本 | 数十万字的长文本 |
| 一致性 | 不重要 | 术语必须全书统一 |
| 对话 | 无特殊要求 | 需要保持角色声音 |
| 节奏 | 无特殊要求 | 需要保持叙述节奏 |

**Step 2: 定义翻译质量标准**

| 指标 | 标准 | 测量方法 |
|------|------|---------|
| 术语一致性 | 100% | 自动检查 glossary 匹配 |
| 信息完整性 | > 95% | 段落对应检查 |
| 流畅度 | 目标语母语者可读 | 人工评分 8/10+ |
| 文学性 | 保持原文意境 | 对比评估 |
| 长度合理性 | 中→英 +20-50%，中→日 -10-20% | 自动计算 |

**Step 3: 设计翻译策略**

**智能分段策略：**
```
输入：30 万字小说
         ↓
按章节分割（每章 3000-5000 字）
         ↓
每章再按段落分组（每组 ~2000 字）
         ↓
每组翻译时附带：
  - 前 200 字上下文（已翻译部分）
  - 后 200 字预览（原文）
  - 术语表
         ↓
两遍翻译：
  第一遍：直译（准确性优先）
  第二遍：润色（流畅性优先）
         ↓
术语一致性检查
         ↓
输出翻译结果
```

**术语预处理策略：**
```
原文：李明走进青云宗的大门
         ↓
预处理（术语替换为占位符）：
  {{CHAR_001}}走进{{PLACE_001}}的大门
         ↓
翻译：
  {{CHAR_001}} walked through the gates of {{PLACE_001}}
         ↓
还原（占位符替换为标准译名）：
  Li Ming walked through the gates of Azure Cloud Sect
```

---

## Task 2: 设计插件结构和配置

**Files:**
- Create: `plugins/translate/config.yaml`
- Create: `plugins/translate/README.md`
- Create: `plugins/translate/commands/translate.md`
- Create: `plugins/translate/commands/glossary.md`
- Create: `plugins/translate/commands/translate-preview.md`
- Create: `plugins/translate/experts/literary-translator.md`

**Step 1: 定义目录结构**

```
plugins/translate/
├── config.yaml                   # 插件配置
├── README.md                     # 使用说明
├── commands/
│   ├── translate.md              # /translate 翻译命令
│   ├── glossary.md               # /glossary 术语表管理
│   └── translate-preview.md      # /translate-preview 翻译预览
└── experts/
    └── literary-translator.md    # 文学翻译专家
```

**运行时数据目录：**
```
.specify/translation/
├── glossary.json                 # 术语表
├── config.json                   # 翻译配置（默认语言对、风格等）
└── history/                      # 翻译历史
    └── 2025-02-09-chapter-01.json

stories/[story-name]/translations/
├── en/                           # 英文版
│   └── content/
│       ├── chapter-01.md
│       └── ...
└── ja/                           # 日文版
    └── content/
        └── ...
```

**Step 2: 编写 config.yaml**

```yaml
name: translate
version: 1.0.0
description: 小说翻译插件 - 支持中英日翻译，保持文学性与术语一致性
type: feature
author: Novel Writer Community

commands:
  - id: translate
    file: commands/translate.md
    description: 翻译章节或全书（中→英/日，英→中）
  - id: glossary
    file: commands/glossary.md
    description: 管理翻译术语表（角色名、地名、专有名词）
  - id: translate-preview
    file: commands/translate-preview.md
    description: 预览翻译效果（试译前 500 字，对比多种风格）

experts:
  - id: literary-translator
    file: experts/literary-translator.md
    title: 文学翻译专家
    description: 精通中英日文学翻译，保持文学性与风格一致性

dependencies:
  core: ">=1.0.0"

installation:
  message: |
    translate 翻译插件安装成功

    支持语言对：
    - 中文 -> 英文（网文出海首选）
    - 中文 -> 日文（轻小说市场）
    - 英文 -> 中文（引进翻译）

    快速开始：
    1. /glossary init                          初始化术语表
    2. /glossary add "角色:李明|Li Ming"        添加术语
    3. /translate-preview --to en              预览翻译风格
    4. /translate --to en chapter-01.md        翻译单章
    5. /translate --to en --all               翻译全书

    建议：先用 /translate-preview 预览翻译风格，确认满意后再翻译全书
```

---

## Task 3: 实现 /translate 命令

**Files:**
- Create: `plugins/translate/commands/translate.md`

**内容框架：**

```markdown
---
title: 小说翻译 - /translate
description: 翻译章节或全书，保持文学性与术语一致性
---

# 小说翻译

## 使用方法

/translate [选项] [文件/范围]

### 基本用法
- `/translate --to en chapter-01.md`  翻译单章为英文
- `/translate --to en --all`          翻译全书为英文
- `/translate --to ja --chapters 1-10` 翻译第 1-10 章为日文

### 选项

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `--from <语言>` | 源语言 | 自动检测 |
| `--to <语言>` | 目标语言（必需） | - |
| `--all` | 翻译全书 | false |
| `--chapters <范围>` | 章节范围（如 `1-10`） | - |
| `--style <风格>` | 翻译风格 | literary |
| `--glossary <文件>` | 指定术语表 | .specify/translation/glossary.json |
| `--skip-existing` | 跳过已翻译章节 | false |

### 语言代码

| 代码 | 语言 | 说明 |
|------|------|------|
| `zh` | 中文（简体） | 默认源语言 |
| `en` | 英文 | 网文出海首选 |
| `ja` | 日文 | 轻小说市场 |

### 翻译风格

| 风格 | 说明 | 适用场景 |
|------|------|---------|
| `literary`（默认） | 文学性翻译，保持意境和节奏 | 严肃文学、文青向网文 |
| `casual` | 口语化翻译，通俗易懂 | 爽文、轻小说 |
| `formal` | 正式翻译，庄重典雅 | 历史、武侠 |

## 功能详解

### 1. 智能分段翻译

将长文本按段落分组，每组 ~2000 字，附带上下文：

```
[前文上下文 200 字（已翻译版本）]
---
[待翻译段落组 ~2000 字]
---
[后文预览 200 字（原文）]
+ [术语表]
```

**优势：**
- 避免超长输入导致质量下降
- 保持上下文连贯
- 术语实时提醒

### 2. 术语自动应用

**翻译前：**
1. 读取 `.specify/translation/glossary.json`
2. 扫描原文，标记所有术语出现位置
3. 将术语替换为带标注的占位符

**翻译中：**
- AI 翻译时看到占位符和标准译名
- 确保译名一致

**翻译后：**
1. 验证所有术语已正确应用
2. 检测原文中未在术语表的专有名词
3. 提示添加新术语

### 3. 两遍翻译策略

**第一遍 - 直译（准确性优先）：**
```
Focus: 确保信息完整传达
允许: 略显生硬的表达
目标: 不遗漏任何信息
```

**第二遍 - 润色（流畅性优先）：**
```
Focus: 让目标语母语者读起来自然
调整: 句式重组、词汇润色
目标: 流畅自然的文学翻译
```

**对比检查：**
```
逐段对比初译和润色版：
- 关键信息是否保留？
- 情感基调是否一致？
- 角色语气是否匹配？
```

### 4. 文化适应处理

| 类型 | 原文 | 直译 | 文化适应 |
|------|------|------|---------|
| 成语 | 三十六计走为上计 | Thirty-six stratagems, fleeing is best | He chose discretion over valor |
| 典故 | 司马昭之心 | Sima Zhao's heart | An open secret / obvious intentions |
| 称呼 | 师父 | Master (martial arts context) | 保留 "Shifu" 或用 "Master" |
| 度量 | 三尺 | Three chi | About three feet |
| 诗词 | 举头望明月 | Raise head gaze bright moon | I lift my gaze to the bright moon |

**处理策略：**
- **成语/俗语：** 寻找目标语对等表达，无对等则意译
- **称呼：** 保留拼音（如 Shifu）+ 首次出现时注释
- **度量单位：** 转换为目标文化单位
- **诗词：** 保留韵律感的意译，或直译 + 注释
- **专有名词（如功法名）：** 意译为主，首次出现附带拼音

## 输出格式

### 目录结构

```
stories/[story-name]/translations/
├── en/
│   ├── content/
│   │   ├── chapter-01.md      # 翻译后的章节
│   │   ├── chapter-02.md
│   │   └── ...
│   ├── glossary-used.json     # 本次使用的术语快照
│   └── translation-report.md  # 翻译报告
└── ja/
    └── ...
```

### 翻译报告

```markdown
# 翻译报告

- 源语言：中文
- 目标语言：英文
- 翻译风格：literary
- 翻译日期：2025-02-09

## 统计

| 指标 | 值 |
|------|---|
| 翻译章节数 | 30 |
| 原文总字数 | 256,000 字 |
| 译文总词数 | 312,000 词 |
| 应用术语数 | 85 个 |
| 新发现术语 | 12 个（待确认） |

## 术语应用情况

| 术语 | 译名 | 出现次数 |
|------|------|---------|
| 李明 | Li Ming | 1,245 |
| 青云宗 | Azure Cloud Sect | 389 |
| ... | ... | ... |

## 注意事项

- 第 5 章有 2 处文化典故需人工确认
- 第 12 章诗词翻译建议人工审阅
- 发现 12 个新专有名词，建议添加到术语表
```

## 与其他命令集成

### 与 /write 集成
```
/write 完成第 5 章 →
提示："第 5 章已完成，是否翻译为英文？"
用户确认 → 自动调用 /translate --to en chapter-05.md
```

### 与 /export 集成
```
/export --format epub --lang en
→ 先检查英文版是否存在
→ 不存在则提示先翻译
→ 存在则直接导出英文版 EPUB
```

### 与 /analyze 集成
```
/analyze --translation en
→ 检查翻译质量
→ 术语一致性报告
→ 疑似翻译错误标记
```

## 翻译质量保证

### 自动检查项

| 检查项 | 说明 | 处理 |
|--------|------|------|
| 术语一致性 | glossary 中的术语是否 100% 统一 | 错误 → 自动修正 |
| 段落对应 | 原文和译文段落数是否一致 | 警告 → 人工检查 |
| 长度合理性 | 中→英 +20-50%，中→日 -10-20% | 警告 → 可能过度翻译或遗漏 |
| 特殊符号 | 引号、书名号是否正确转换 | 自动修正 |
| 未定义术语 | 是否有专有名词不在 glossary 中 | 提示 → 建议添加 |

### 警告示例

```
翻译完成

术语应用：85/85（100%）

警告：
  第 3 章第 12 段：检测到未定义术语"天灵根"（出现 5 次）
    建议：/glossary add "天灵根|Heavenly Spirit Root|天霊根"

  第 7 章：译文长度异常（原文 3200 字，译文 6100 词，+90%）
    可能原因：过度解释
    建议：人工检查润色

  第 15 章第 8 段：检测到诗词内容
    已使用意译策略，建议人工审阅
```

## 常见陷阱

### 1. 未初始化术语表就翻译
**症状**：同一角色名出现多种译法
**解决**：翻译前先 `/glossary init`，至少添加主要角色和地名

### 2. 过度直译
**症状**：读起来像机器翻译
**解决**：使用 `literary` 风格，AI 会自动调整

### 3. 文化误译
**症状**："三长两短" → "three long two short"
**解决**：AI 会自动识别 idiom 并本地化，复杂情况会标记待人工确认

### 4. 一次翻译太多
**症状**：翻译质量随文本长度下降
**解决**：系统自动分段，每段 ~2000 字

## 检查清单

翻译前：
- [ ] 已初始化术语表？（/glossary init）
- [ ] 已添加主要角色名/地名？（/glossary add）
- [ ] 已选择合适的翻译风格？
- [ ] 已用 /translate-preview 预览效果？

翻译后：
- [ ] 术语一致性 100%？
- [ ] 翻译报告中无严重警告？
- [ ] 关键章节已人工抽查？
- [ ] 新发现术语已添加到 glossary？
```

**预估字数：** 翻译命令文件约 300-400 行

---

## Task 4: 实现 /glossary 术语表管理命令

**Files:**
- Create: `plugins/translate/commands/glossary.md`
- Create: `.specify/translation/glossary.json`（模板）

**Step 1: 定义术语表 JSON 格式**

```json
{
  "version": "1.0",
  "story": "my-novel",
  "last_updated": "2025-02-09",
  "languages": ["zh", "en", "ja"],
  "categories": {
    "characters": [
      {
        "id": "char_001",
        "zh": "李明",
        "en": "Li Ming",
        "ja": "リ・ミン",
        "pinyin": "Lǐ Míng",
        "notes": "主角，青云宗弟子",
        "first_appearance": "chapter-01",
        "aliases": {
          "zh": ["小明", "明哥"],
          "en": ["Ming", "Brother Ming"],
          "ja": ["ミンくん"]
        }
      },
      {
        "id": "char_002",
        "zh": "苏婉儿",
        "en": "Su Wan'er",
        "ja": "蘇婉児",
        "pinyin": "Sū Wǎn'ér",
        "notes": "女主角",
        "first_appearance": "chapter-03"
      }
    ],
    "places": [
      {
        "id": "place_001",
        "zh": "青云宗",
        "en": "Azure Cloud Sect",
        "ja": "青雲宗",
        "notes": "主角所属门派"
      },
      {
        "id": "place_002",
        "zh": "天都城",
        "en": "Celestial Capital",
        "ja": "天都城",
        "notes": "故事主要发生地"
      }
    ],
    "skills": [
      {
        "id": "skill_001",
        "zh": "青云剑法",
        "en": "Azure Cloud Sword Art",
        "ja": "青雲剣法",
        "notes": "主角初始剑法"
      }
    ],
    "items": [
      {
        "id": "item_001",
        "zh": "灵石",
        "en": "Spirit Stone",
        "ja": "霊石",
        "notes": "修仙世界通用货币"
      }
    ],
    "organizations": [],
    "concepts": [
      {
        "id": "concept_001",
        "zh": "灵气",
        "en": "spiritual energy",
        "ja": "霊気",
        "notes": "修炼的基础能量"
      }
    ],
    "titles": [
      {
        "id": "title_001",
        "zh": "师父",
        "en": "Shifu",
        "ja": "師匠",
        "notes": "武术/修炼的师傅，保留拼音"
      }
    ]
  }
}
```

**Step 2: 编写 /glossary 命令**

```markdown
---
title: 术语表管理 - /glossary
description: 管理翻译术语表，确保角色名、地名、专有名词翻译统一
---

# 术语表管理

## 使用方法

### 初始化
/glossary init
→ 在 .specify/translation/ 创建空的 glossary.json
→ 自动扫描 spec/knowledge/ 提取角色名和地名

### 添加术语
/glossary add "类别:中文|英文|日文"

示例：
  /glossary add "角色:李明|Li Ming|リ・ミン"
  /glossary add "地名:青云宗|Azure Cloud Sect"
  /glossary add "功法:青云剑法|Azure Cloud Sword Art"

支持的类别：
  角色(characters)、地名(places)、功法(skills)、
  道具(items)、组织(organizations)、概念(concepts)、
  称呼(titles)

### 批量导入
/glossary import glossary.csv

CSV 格式：
  类别,中文,英文,日文,备注
  角色,李明,Li Ming,リ・ミン,主角
  地名,青云宗,Azure Cloud Sect,青雲宗,主角门派

### 查看术语
/glossary list                  查看全部
/glossary list --category 角色  按类别筛选
/glossary list --search 青云    搜索

### 编辑术语
/glossary edit "李明" --en "Lee Ming"

### 删除术语
/glossary remove "李明"

### 自动提取
/glossary extract
→ 扫描已写章节，AI 自动识别专有名词
→ 列出未在术语表中的名词
→ 提供翻译建议
→ 用户确认后添加

### 导出
/glossary export --format csv
/glossary export --format markdown

## 术语冲突检测

自动检测：
- 相同中文、不同英文（不一致）
- 不同中文、相同英文（混淆）
- 拼音相似的角色名（容易混淆）

示例：
  检测到术语冲突：
  "李明" 和 "黎明" 的英文都是 "Li Ming"
  建议：区分为 "Li Ming" 和 "Li Ming (dawn)" 或 "Lí Míng"
```

---

## Task 5: 实现 /translate-preview 预览命令

**Files:**
- Create: `plugins/translate/commands/translate-preview.md`

**内容框架：**

```markdown
---
title: 翻译预览 - /translate-preview
description: 预览翻译效果，试译前 500 字，对比多种翻译风格
---

# 翻译预览

## 使用方法

/translate-preview [选项] [文件]

/translate-preview --to en                     预览当前章节
/translate-preview --to en chapter-01.md       预览指定章节
/translate-preview --to en --compare-styles    对比三种风格

## 功能

### 1. 快速试译

取当前章节前 500 字试译，让用户确认风格满意度。

### 2. 风格对比

同时展示三种翻译风格：

**原文：**
他的心如刀绞，眼看着师父倒在血泊中。

**Literary 风格：**
His heart wrenched with agony as he watched his master collapse into a pool of blood.

**Casual 风格：**
His heart ached like crazy, seeing his master fall in a pool of blood.

**Formal 风格：**
His heart was seized by profound anguish as he observed his master fall into a pool of blood.

推荐：Literary（最接近原文意境）

### 3. 术语预览

展示术语表在翻译中的应用效果：

原文中检测到的术语：
  - 师父 → Shifu (from glossary)
  - 青云宗 → Azure Cloud Sect (from glossary)
  - 灵气 → [未定义] 建议添加
```

---

## Task 6: 实现 literary-translator Expert

**Files:**
- Create: `plugins/translate/experts/literary-translator.md`

**内容框架：**

```markdown
---
title: 文学翻译专家 - expert:literary-translator
description: 精通中英日文学翻译，保持文学性与风格一致性
---

作为"文学翻译专家"，你的职责是：

## 核心能力

1. **文学性翻译**
   - 不是直译，而是传达原文的意境、情感、节奏
   - 保持原文的叙述风格（短句 vs 长句、对话密度等）
   - 处理比喻、意象、文化特定表达

2. **术语管理**
   - 严格遵守 glossary.json 中的译名
   - 发现新专有名词时标记并建议译名
   - 确保全文术语 100% 一致

3. **文化适应**
   - 成语/俗语：寻找目标语对等表达
   - 称呼：保留拼音或使用通用翻译
   - 度量单位：适当转换
   - 文化背景：必要时添加简短注释

4. **角色声音保持**
   - 不同角色的说话方式应有区分
   - 保持角色的语气和用词习惯
   - 年龄、身份、性格体现在翻译中

## 翻译原则（优先级）

1. **准确性** > **流畅性** > **优雅性**
2. 保留原文结构（除非目标语言不自然）
3. 文化适应但不过度解释
4. 宁可略显异域风味，不要失去原文特色

## 特殊处理

### 对话翻译
- 保持对话的简洁和节奏
- 反映角色性格（老练 vs 天真、粗犷 vs 优雅）
- 口语化表达用目标语口语替代

### 动作描写
- 保持动作的紧凑感
- 动词选择精准
- 武打场景保持画面感

### 内心独白
- 保持内心活动的流动感
- 适当使用目标语的内心独白惯用句式

### 环境描写
- 保持意境
- 适当调整比喻（如果原文比喻在目标文化中不成立）

## 工作流程

1. 读取术语表（.specify/translation/glossary.json）
2. 扫描待翻译文本，标记术语和特殊表达
3. 第一遍：注重准确传达（直译倾向）
4. 第二遍：注重流畅自然（润色）
5. 检查术语一致性
6. 标记需要人工确认的内容
7. 输出翻译结果 + 注释
```

---

## Task 7: 集成测试和文档

**Files:**
- Modify: `templates/knowledge-base/README.md`（添加翻译关键词映射）
- Create: `plugins/translate/README.md`
- Modify: `docs/p2-plans/README.md`（更新状态）

**Step 1: 测试用例**

### 测试 1：基础翻译
```
输入：1000 字中文章节
术语表：5 个角色名 + 3 个地名
风格：literary

验证：
- [ ] 术语一致性 100%
- [ ] 段落数一致
- [ ] 译文流畅可读
- [ ] 长度在合理范围内（+20-50%）
```

### 测试 2：术语管理
```
操作：/glossary init → /glossary add → /translate

验证：
- [ ] 术语表正确创建
- [ ] 添加的术语在翻译中正确应用
- [ ] 未定义术语被检测并提示
```

### 测试 3：翻译预览
```
操作：/translate-preview --to en --compare-styles

验证：
- [ ] 三种风格均有输出
- [ ] 风格差异明显
- [ ] 术语应用一致
```

### 测试 4：长文本翻译
```
输入：10 章（约 30,000 字）
风格：literary

验证：
- [ ] 分段翻译正常工作
- [ ] 上下文连贯
- [ ] 全书术语一致
- [ ] 翻译报告生成
```

**Step 2: 验证标准**

| 指标 | 标准 | 方法 |
|------|------|------|
| 术语一致性 | 100% | 自动检查 |
| 信息完整性 | > 95% | 段落对应 |
| 翻译速度 | < 2 分钟/千字 | 计时 |
| 用户满意度 | 风格满意 | /translate-preview 确认 |

**Step 3: 文档更新**

更新 `plugins/translate/README.md`：
```markdown
# Translate 翻译插件

## 概述
支持小说的多语言翻译（中英日），保持文学性与术语一致性。

## 命令
- `/translate` - 翻译章节或全书
- `/glossary` - 管理术语表
- `/translate-preview` - 预览翻译效果

## 快速开始
1. 安装插件
2. 初始化术语表
3. 添加核心术语
4. 预览翻译风格
5. 开始翻译

## 详细文档
参见各命令文件。
```

---

## 验证和测试

### 内容质量
- [ ] 命令说明清晰，用户能理解
- [ ] 参数说明完整，示例充分
- [ ] 翻译策略合理，覆盖主要场景
- [ ] 术语表格式满足需求

### 格式规范
- [ ] config.yaml 符合插件规范
- [ ] 命令文件有正确的 YAML front matter
- [ ] 目录结构清晰
- [ ] 与现有插件格式一致

### 集成测试
- [ ] 与 /write 的集成逻辑清晰
- [ ] 与 /export 的集成逻辑清晰
- [ ] 与 /analyze 的集成逻辑清晰
- [ ] 术语表文件路径与现有约定一致

### 可用性测试
- [ ] 新用户能在 5 分钟内开始使用
- [ ] 常见操作步骤 < 3 步
- [ ] 错误提示友好且有指导性

---

## 文档和提交

**更新文档列表：**
- `plugins/translate/README.md`
- `docs/p2-plans/README.md`（更新状态）

**提交：**

```bash
git add plugins/translate/
git add .specify/translation/
git commit -m "feat(plugins): 添加 translate 翻译插件

- /translate: 翻译章节或全书（中→英/日，英→中）
  - 智能分段翻译（~2000 字/段 + 上下文）
  - 两遍策略（直译 + 润色）
  - 文化适应处理
- /glossary: 术语表管理
  - JSON 格式术语表（角色/地名/功法/道具/概念）
  - 自动提取 + 冲突检测
- /translate-preview: 翻译风格预览
  - 三种风格对比（literary/casual/formal）
- expert:literary-translator 文学翻译专家

核心特性：
- 术语一致性 100%（自动应用 glossary）
- 保持文学性（非直译）
- 文化适应（idiom 本地化）
- 翻译质量自动检查

Closes: P2 优先级任务 #3"
```

---

## 预估工作量

| Task | 内容 | 预估时间 |
|------|------|---------|
| 1 | 研究翻译需求 | 1-2h |
| 2 | 插件结构和配置 | 2-3h |
| 3 | /translate 命令 | 3-4h |
| 4 | /glossary 命令 + 术语表 | 3-4h |
| 5 | /translate-preview 命令 | 1-2h |
| 6 | literary-translator Expert | 2-3h |
| 7 | 集成测试和文档 | 2-3h |

**总计：** 14-21 小时

**最小可用版本（仅 /translate + /glossary，仅中→英）：** 8-10 小时

---

## 分阶段实施建议

### Phase 1: MVP（8-10h）
- 仅中→英翻译
- 基础术语表（手动添加）
- /translate + /glossary 两个命令
- literary 风格

**交付物：**
- config.yaml
- commands/translate.md
- commands/glossary.md
- glossary.json 模板

**价值：** 基本可用，覆盖网文出海核心需求

### Phase 2: 完整功能（4-6h）
- 添加中→日、英→中
- /translate-preview 预览命令
- literary-translator Expert
- 自动术语提取

**交付物：**
- commands/translate-preview.md
- experts/literary-translator.md
- 术语自动提取功能

**价值：** 多语言支持，专业翻译质量

### Phase 3: 质量优化（2-3h）
- 翻译质量评分
- 翻译历史管理
- 与 /export 深度集成
- 批量翻译优化

**价值：** 专业级翻译工具链

---

## 成功标准

**用户反馈目标：**
- "术语终于统一了，不用自己一个个检查"
- "翻译质量比 Google 翻译好太多"
- "几小时翻译完一本书，以前要几个月"

**技术指标：**
- 术语一致性：100%（自动保证）
- 翻译流畅度：> 8/10（人工评分）
- 翻译速度：< 2 分钟/千字
- 信息完整性：> 95%（段落对应）
- 用户满意度：> 80%
