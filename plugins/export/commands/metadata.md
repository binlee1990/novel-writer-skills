---
title: 元数据管理 - /metadata
description: 编辑小说元数据（书名、作者、简介等），用于导出和发布
---

# 元数据管理

## 使用方法

```bash
/metadata [子命令] [选项]
```

### 基本用法

```bash
/metadata init                     # 从 specification.md 自动提取元数据
/metadata show                     # 查看当前元数据
/metadata edit                     # 交互式编辑
/metadata set title "新书名"       # 设置单个字段
/metadata validate                 # 验证元数据完整性
```

---

## 子命令

### /metadata init

从 `stories/[name]/specification.md` 自动提取元数据，生成 `metadata.json`。

```
/metadata init
      |
读取 specification.md：
  - 提取书名（标题）
  - 提取简介（description 部分）
  - 提取类型标签
      |
自动填充：
  - language: zh-CN（自动检测）
  - identifier: UUID 自动生成
  - date: 当前日期
  - publisher: 自出版
  - rights: 自动生成版权声明
      |
保存到 stories/[name]/metadata.json
      |
提示用户补充：
  - 作者名（必需）
  - 副标题（可选）
```

**示例：**

```
/metadata init

从 specification.md 提取元数据：
  书名：青云志
  简介：一个少年从山村走向修仙世界的故事...
  类型：玄幻、修仙

自动填充：
  语言：zh-CN
  标识：urn:uuid:550e8400-e29b-41d4-a716-446655440000
  日期：2025-02-09

请补充以下信息：
  作者名：___
  副标题（可选）：___

已保存到：stories/my-novel/metadata.json
```

---

### /metadata show

显示当前元数据。

```
/metadata show

  书名：青云志
  副标题：修仙之路
  作者：张三
  语言：中文（zh-CN）
  简介：一个少年从山村走向修仙世界的故事...
  分类：玄幻、修仙
  出版者：自出版
  日期：2025-02-09
  版权：Copyright 2025 张三. All rights reserved.
  字数：256,000
  章节：30 章

  状态：元数据完整
```

---

### /metadata edit

交互式引导编辑各字段。逐项显示当前值，用户可修改或回车跳过。

```
/metadata edit

编辑元数据（回车跳过不修改）：

  书名 [青云志]：___
  副标题 [修仙之路]：___
  作者 [张三]：___
  简介 [一个少年从山村走向修仙世界的故事...]：___
  分类标签 [玄幻, 修仙]：___
  出版者 [自出版]：___
  版权声明 [Copyright 2025 张三...]：___

已保存更新。
```

---

### /metadata set

设置单个字段。

```bash
/metadata set title "新书名"
/metadata set author "新作者名"
/metadata set description "新简介"
/metadata set subjects "玄幻,修仙,热血"
```

**支持的字段：**

| 字段名 | 说明 | 示例 |
|--------|------|------|
| `title` | 书名 | `"青云志"` |
| `subtitle` | 副标题 | `"修仙之路"` |
| `author` | 作者 | `"张三"` |
| `description` | 简介 | `"一个少年..."` |
| `subjects` | 分类标签（逗号分隔） | `"玄幻,修仙"` |
| `publisher` | 出版者 | `"自出版"` |
| `rights` | 版权声明 | `"Copyright 2025..."` |
| `language` | 语言代码 | `"zh-CN"` |

---

### /metadata validate

验证元数据完整性，检查导出所需的必填字段。

```
/metadata validate

元数据验证：
  title：青云志
  author：张三
  language：zh-CN
  identifier：urn:uuid:550e8400...
  description：一个少年从山村走向修仙世界的故事...
  subjects：玄幻, 修仙

  必填字段：4/4
  推荐字段：2/2
  可选字段：3/5

  状态：可以导出
```

**验证规则：**

| 字段 | 级别 | 缺失处理 |
|------|------|---------|
| title | 必填 | 错误：无法导出 |
| author | 必填 | 错误：无法导出 |
| language | 必填 | 自动填充 zh-CN |
| identifier | 必填 | 自动生成 UUID |
| description | 推荐 | 警告：建议填写 |
| subjects | 推荐 | 警告：建议填写 |
| publisher | 可选 | 默认"自出版" |
| date | 可选 | 默认当前日期 |
| rights | 可选 | 自动生成 |
| subtitle | 可选 | 留空 |
| series | 可选 | 留空 |

---

## 元数据 JSON 格式

```json
{
  "title": "青云志",
  "subtitle": "修仙之路",
  "author": "张三",
  "language": "zh-CN",
  "identifier": "urn:uuid:550e8400-e29b-41d4-a716-446655440000",
  "publisher": "自出版",
  "date": "2025-02-09",
  "description": "一个少年从山村走向修仙世界的故事...",
  "subjects": ["玄幻", "修仙", "热血"],
  "rights": "Copyright 2025 张三. All rights reserved.",
  "series": {
    "name": "",
    "position": 1
  },
  "cover": {
    "file": "cover.jpg",
    "width": 1600,
    "height": 2400
  },
  "stats": {
    "chapters": 30,
    "total_words": 256000,
    "last_updated": "2025-02-09"
  }
}
```

**字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `title` | string | 书名 |
| `subtitle` | string | 副标题 |
| `author` | string | 作者名 |
| `language` | string | BCP 47 语言代码（zh-CN, en, ja） |
| `identifier` | string | 唯一标识（UUID 格式） |
| `publisher` | string | 出版者 |
| `date` | string | 出版日期（ISO 8601） |
| `description` | string | 简介 |
| `subjects` | string[] | 分类标签 |
| `rights` | string | 版权声明 |
| `series.name` | string | 系列名称 |
| `series.position` | number | 系列中的位置 |
| `cover.file` | string | 封面文件名 |
| `cover.width` | number | 封面宽度（像素） |
| `cover.height` | number | 封面高度（像素） |
| `stats.chapters` | number | 章节数（自动统计） |
| `stats.total_words` | number | 总字数（自动统计） |
| `stats.last_updated` | string | 最后更新日期 |

---

## 元数据与导出格式的关系

| 字段 | EPUB | PDF | 网文平台 | Markdown |
|------|------|-----|---------|----------|
| title | dc:title | 封面/页眉 | 文件名 | 标题 |
| author | dc:creator | 封面 | - | 作者行 |
| language | dc:language | - | - | - |
| identifier | dc:identifier | - | - | - |
| description | dc:description | - | - | - |
| subjects | dc:subject | - | - | - |
| cover | 嵌入封面 | 第一页 | - | - |

---

## 与其他命令集成

### 与 /export 集成

```
/export --format epub
-> 自动读取 metadata.json
-> 如果不存在：提示先运行 /metadata init
-> 如果缺少必填字段：提示补充
```

### 与 /specify 集成

```
/specify 完成后 ->
自动提示："是否从 specification.md 初始化元数据？"
用户确认 -> /metadata init
```

### 与 /generate-cover 集成

```
/generate-cover ->
读取 metadata.json 中的 title 和 author
用于封面文字生成
```

---

## 常见陷阱

### 1. 忘记设置作者名

**症状**：导出的 EPUB 作者显示为空
**解决**：`/metadata set author "你的名字"`

### 2. 简介过长

**症状**：某些阅读器截断简介
**解决**：控制在 200 字以内，突出核心卖点

### 3. 分类标签不准确

**症状**：电子书商店分类错误
**解决**：使用标准分类（玄幻、言情、悬疑等），避免自创标签

### 4. 语言代码错误

**症状**：阅读器排版异常（如中文用了英文排版规则）
**解决**：中文用 `zh-CN`，英文用 `en`，日文用 `ja`
