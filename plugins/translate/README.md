# Translate 翻译插件

## 概述

支持小说的多语言翻译（中英日），保持文学性与术语一致性。

## 核心特性

- **术语一致性 100%** - 自动应用术语表，确保角色名、地名、专有名词翻译统一
- **保持文学性** - 非直译，而是文学翻译（意译 + 文化适应）
- **智能分段翻译** - 每段 ~2000 字 + 上下文，避免超长输入导致质量下降
- **两遍翻译策略** - 第一遍直译（准确性），第二遍润色（流畅性）
- **文化适应处理** - 成语、典故、称呼等自动本地化
- **翻译质量检查** - 自动检测术语一致性、段落对应、长度合理性

## 命令

### /translate - 翻译章节或全书

```bash
/translate --to en chapter-01.md        # 翻译单章为英文
/translate --to en --all                # 翻译全书为英文
/translate --to ja --chapters 1-10      # 翻译第 1-10 章为日文
```

**选项：**
- `--from <语言>` - 源语言（默认自动检测）
- `--to <语言>` - 目标语言（必需）
- `--all` - 翻译全书
- `--chapters <范围>` - 章节范围（如 `1-10`）
- `--style <风格>` - 翻译风格（literary/casual/formal，默认 literary）
- `--glossary <文件>` - 指定术语表（默认 .specify/translation/glossary.json）
- `--skip-existing` - 跳过已翻译章节

### /glossary - 管理术语表

```bash
/glossary init                                  # 初始化术语表
/glossary add "角色:李明|Li Ming|リ・ミン"       # 添加术语
/glossary list                                  # 查看全部术语
/glossary extract                               # 自动提取专有名词
/glossary import glossary.csv                   # 批量导入
```

### /translate-preview - 预览翻译效果

```bash
/translate-preview --to en                      # 预览当前章节
/translate-preview --to en --compare-styles     # 对比三种风格
```

## 支持的语言

| 代码 | 语言 | 说明 |
|------|------|------|
| `zh` | 中文（简体） | 默认源语言 |
| `en` | 英文 | 网文出海首选 |
| `ja` | 日文 | 轻小说市场 |

## 翻译风格

| 风格 | 说明 | 适用场景 |
|------|------|---------|
| `literary`（默认） | 文学性翻译，保持意境和节奏 | 严肃文学、文青向网文 |
| `casual` | 口语化翻译，通俗易懂 | 爽文、轻小说 |
| `formal` | 正式翻译，庄重典雅 | 历史、武侠 |

## 快速开始

### 1. 初始化术语表

```bash
/glossary init
```

这会在 `.specify/translation/` 创建 `glossary.json`，并自动扫描 `spec/knowledge/` 提取角色名和地名。

### 2. 添加核心术语

```bash
/glossary add "角色:李明|Li Ming"
/glossary add "地名:青云宗|Azure Cloud Sect"
/glossary add "功法:青云剑法|Azure Cloud Sword Art"
```

### 3. 预览翻译风格

```bash
/translate-preview --to en --compare-styles
```

查看三种翻译风格（literary/casual/formal）的效果，选择最适合的。

### 4. 翻译章节

```bash
/translate --to en chapter-01.md
```

### 5. 翻译全书

```bash
/translate --to en --all
```

## 输出目录结构

```
stories/[story-name]/translations/
├── en/                              # 英文版
│   ├── content/
│   │   ├── chapter-01.md
│   │   ├── chapter-02.md
│   │   └── ...
│   ├── glossary-used.json           # 本次使用的术语快照
│   └── translation-report.md        # 翻译报告
└── ja/                              # 日文版
    └── ...
```

## 术语表格式

术语表存储在 `.specify/translation/glossary.json`，格式如下：

```json
{
  "version": "1.0",
  "story": "my-novel",
  "categories": {
    "characters": [
      {
        "zh": "李明",
        "en": "Li Ming",
        "ja": "リ・ミン",
        "notes": "主角"
      }
    ],
    "places": [...],
    "skills": [...],
    "items": [...],
    "concepts": [...]
  }
}
```

## 翻译质量保证

### 自动检查项

- ✅ **术语一致性** - glossary 中的术语 100% 统一
- ✅ **段落对应** - 原文和译文段落数一致
- ✅ **长度合理性** - 中→英 +20-50%，中→日 -10-20%
- ✅ **特殊符号** - 引号、书名号正确转换
- ✅ **未定义术语** - 检测专有名词并提示添加

### 警告示例

```
翻译完成！

术语应用：85/85（100%）

⚠️ 警告：
  第 3 章第 12 段：检测到未定义术语"天灵根"（出现 5 次）
    建议：/glossary add "天灵根|Heavenly Spirit Root"

  第 7 章：译文长度异常（原文 3200 字，译文 6100 词，+90%）
    可能原因：过度解释
    建议：人工检查润色
```

## 常见问题

### Q: 如何确保角色名翻译统一？

A: 翻译前先用 `/glossary init` 初始化术语表，然后添加所有主要角色名。系统会自动在翻译时应用这些术语。

### Q: 翻译质量如何？

A: 使用两遍翻译策略（直译 + 润色）+ 文化适应处理，质量远超 Google 翻译。建议先用 `/translate-preview` 预览效果。

### Q: 可以翻译多长的文本？

A: 支持任意长度。系统会自动分段（每段 ~2000 字），并附带上下文，确保翻译质量和连贯性。

### Q: 如何处理文化特定表达？

A: AI 会自动识别成语、典故、称呼等，并进行文化适应处理。复杂情况会标记待人工确认。

## 与其他命令集成

- **与 /write 集成** - 写完章节后自动提示是否翻译
- **与 /export 集成** - 导出时可选择翻译版本
- **与 /analyze 集成** - 分析翻译质量和术语一致性

## 专家

### expert:literary-translator - 文学翻译专家

精通中英日文学翻译，保持文学性与风格一致性。可以直接调用：

```
@expert:literary-translator 请帮我翻译这段文字...
```

## 技术细节

### 智能分段策略

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

### 术语预处理策略

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

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！
