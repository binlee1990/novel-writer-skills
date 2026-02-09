---
title: 导出小说 - /export
description: 将小说导出为可发布格式（EPUB/PDF/网文平台），自动目录、封面和元数据
---

# 导出小说

## 使用方法

```bash
/export [选项]
```

### 基本用法

```bash
/export --format epub              # 导出 EPUB
/export --format pdf               # 导出 PDF
/export --format qidian            # 导出起点格式
/export --format tomato            # 导出番茄格式
/export --format jinjiang          # 导出晋江格式
/export --format markdown          # 导出 Markdown 合集
```

### 选项

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `--format <格式>` | 导出格式（必需） | - |
| `--output <路径>` | 输出路径 | stories/[name]/exports/ |
| `--chapters <范围>` | 导出章节范围（如 `1-10`） | 全部 |
| `--cover <文件>` | 指定封面图 | 自动生成 |
| `--template <模板>` | 使用自定义模板 | 默认模板 |
| `--include-appendix` | 包含附录（角色表、世界观） | false |
| `--lang <语言>` | 导出语言版本（需先翻译） | 原文 |

### 导出格式

| 格式 | 代码 | 适用场景 |
|------|------|---------|
| EPUB | `epub` | Kindle, Apple Books, Google Play Books |
| PDF | `pdf` | 打印、PDF 阅读器 |
| 起点 | `qidian` | 起点中文网 |
| 番茄 | `tomato` | 番茄小说 |
| 晋江 | `jinjiang` | 晋江文学城 |
| Markdown | `markdown` | 单文件合集备份 |

---

## 功能详解

### 1. EPUB 导出

**完整流程：**

```
读取章节文件（stories/[name]/content/）
      |
读取元数据（metadata.json 或 specification.md）
      |
读取封面（cover.jpg 或自动生成）
      |
Markdown -> XHTML 转换
      |
生成目录（nav.xhtml + toc.ncx）
      |
生成 content.opf（元数据 + manifest + spine）
      |
打包为 EPUB（ZIP 格式）
      |
验证（EPUBCheck 规则）
      |
输出 .epub 文件
```

**EPUB 文件结构：**

```
my-novel.epub (ZIP)
├── mimetype                    # 必须是第一个文件，不压缩
├── META-INF/
│   └── container.xml           # 指向 content.opf
└── OEBPS/
    ├── content.opf             # 包文件（元数据 + manifest + spine）
    ├── toc.ncx                 # 目录（EPUB 2 兼容）
    ├── nav.xhtml               # 导航（EPUB 3）
    ├── cover.xhtml             # 封面页
    ├── cover.jpg               # 封面图片
    ├── stylesheet.css          # 样式表
    ├── chapter-01.xhtml        # 章节内容
    ├── chapter-02.xhtml
    └── ...
```

**元数据（Dublin Core）：**

```xml
<dc:title>我的小说</dc:title>
<dc:creator>作者名</dc:creator>
<dc:language>zh-CN</dc:language>
<dc:identifier>urn:uuid:xxx</dc:identifier>
<dc:publisher>自出版</dc:publisher>
<dc:date>2025-02-09</dc:date>
<dc:description>一句话简介...</dc:description>
<dc:subject>玄幻</dc:subject>
<dc:rights>作者版权声明</dc:rights>
```

**Markdown -> XHTML 转换规则：**

| Markdown | XHTML | 说明 |
|----------|-------|------|
| `# 标题` | `<h1 class="chapter-title">标题</h1>` | 章节标题 |
| 普通段落 | `<p>段落内容</p>` | 自动缩进 2em |
| `"对话"` | `<p class="dialogue">"对话"</p>` | 对话段落 |
| `---` | `<hr class="scene-break" />` | 场景分隔 |
| `**粗体**` | `<strong>粗体</strong>` | 强调 |
| `*斜体*` | `<em>斜体</em>` | 强调 |

**输出示例：**

```
导出 EPUB 完成

  文件：my-novel.epub
  大小：856 KB
  章节：30 章
  字数：256,000 字
  封面：自动生成
  目录：30 项
  验证：通过

  位置：stories/my-novel/exports/epub/my-novel.epub
```

---

### 2. PDF 导出

**方案 A - 基础方案（无需外部依赖）：**

```
Markdown -> HTML（内置解析器）
       -> 嵌入 CSS 样式
       -> 生成可打印 HTML 文件
       -> 用户用浏览器"打印为 PDF"
```

**方案 B - 高级方案（需要 Pandoc）：**

```
Markdown -> Pandoc -> HTML + CSS -> PDF
                   -> 或 LaTeX -> PDF（最佳排版质量）
```

**页面设置预设：**

| 预设 | 纸张 | 字体 | 行距 | 适用 |
|------|------|------|------|------|
| `a5-print` | A5 (148x210mm) | 思源宋体 | 1.5 | 实体书打印 |
| `a4-read` | A4 (210x297mm) | 思源黑体 | 1.3 | 屏幕阅读 |
| `6x9-publish` | 6x9 英寸 | Times New Roman | 1.4 | 国际出版 |
| `custom` | 自定义 | 自定义 | 自定义 | 高级用户 |

**PDF 排版要求：**

| 维度 | 默认值 | 可选范围 |
|------|--------|---------|
| 纸张 | A5 | A4, B5, 6x9 英寸 |
| 边距 | 上下 2cm，左右 1.5cm | 自定义 |
| 字体 | 思源宋体（中文）/ Times New Roman（英文） | 自定义 |
| 字号 | 11pt | 10-14pt |
| 行距 | 1.5 倍 | 1.2-2.0 |
| 页码 | 居中底部 | 右下角 / 无 |
| 页眉 | 书名 | 章节名 / 无 |

**输出示例：**

```
导出 PDF 完成

  文件：my-novel.pdf
  大小：3.2 MB
  页数：324 页
  纸张：A5
  字体：思源宋体

  位置：stories/my-novel/exports/pdf/my-novel.pdf
```

---

### 3. 网文平台格式

#### 起点中文网（qidian）

```
转换规则：
1. 章节标题：# 标题 -> 第X章 标题（自动编号）
2. 去除所有 Markdown 格式标记
3. 段落空两个全角空格
4. 引号转换：""'' -> 「」『』（直角引号）
5. 场景分隔：--- -> 空行
6. 合并为单文件 TXT，UTF-8 编码

输出：stories/[name]/exports/platforms/qidian/my-novel.txt
```

#### 番茄小说（tomato）

```
转换规则：
1. 章节标题：# 标题 -> X. 标题
2. 去除 Markdown 格式
3. 段落间空一行
4. 每章独立文件
5. 章节 < 3000 字（超出自动提示拆分）
6. UTF-8 编码

输出：
stories/[name]/exports/platforms/tomato/
├── 001-chapter-title.txt
├── 002-chapter-title.txt
└── ...
```

#### 晋江文学城（jinjiang）

```
转换规则：
1. Markdown -> 简单 HTML（保留 <b>, <i>, <br>）
2. 章节标题自定义格式
3. UTF-8 编码

输出：stories/[name]/exports/platforms/jinjiang/my-novel.html
```

**输出示例（起点格式）：**

```
导出起点格式完成

  文件：my-novel.txt
  大小：512 KB
  章节：30 章
  总字数：256,000 字
  格式检查：通过
    - 章节标题格式正确
    - 段落空两格
    - 引号已转换为直角引号

  位置：stories/my-novel/exports/platforms/qidian/my-novel.txt
```

---

### 4. Markdown 合集

将所有章节合并为单个 Markdown 文件，便于备份和分享。

```
转换规则：
1. 按章节顺序合并
2. 每章之间插入分隔线（---）
3. 在文件开头添加目录
4. 保留原始 Markdown 格式

输出：stories/[name]/exports/my-novel-complete.md
```

---

### 5. 自动目录生成

从章节文件自动生成目录：

```markdown
# 目录

- 第一章 开端 .................. 1
- 第二章 转折 .................. 15
- 第三章 冲突 .................. 28
...
```

**规则：**
- 读取每个章节文件的一级标题（`# 标题`）
- 自动编号（如果原文没有编号）
- EPUB：嵌入式导航（nav.xhtml + toc.ncx）
- PDF：带页码的目录
- TXT：文本目录（无页码）

---

### 6. 附录生成（可选）

当使用 `--include-appendix` 时，自动从 `spec/knowledge/` 提取：

```markdown
# 附录 A：角色表

| 角色 | 身份 | 关系 |
|------|------|------|
| 李明 | 青云宗弟子 | 主角 |
| 苏婉儿 | 天都城才女 | 女主角 |
| ... | ... | ... |

# 附录 B：世界观设定

[从 spec/knowledge/ 中的世界观文档提取]
```

---

## 输出目录结构

```
stories/[story-name]/exports/
├── epub/
│   └── my-novel.epub
├── pdf/
│   └── my-novel.pdf
├── platforms/
│   ├── qidian/
│   │   └── my-novel.txt
│   ├── tomato/
│   │   ├── 001-chapter-title.txt
│   │   └── ...
│   └── jinjiang/
│       └── my-novel.html
├── my-novel-complete.md          # Markdown 合集
└── metadata.json                 # 导出时使用的元数据快照
```

---

## 与其他命令集成

### 与 /write 集成

```
全书写完 ->
提示："恭喜完成全书！是否导出为 EPUB？"
用户确认 -> 自动引导：
  1. /metadata edit（检查元数据）
  2. /generate-cover（生成封面）
  3. /export --format epub
```

### 与 /translate 集成

```
/export --format epub --lang en
-> 检查 translations/en/ 是否存在
-> 存在：导出英文版 EPUB
-> 不存在：提示先运行 /translate --to en --all
```

### 与 /analyze 集成

```
/analyze --export-ready
-> 检查导出准备状态：
  - 所有章节完整
  - 元数据已设置
  - 封面已准备
  - 无严重格式错误
```

### 与 /track 集成

```
/track 显示进度时，包含导出状态：
  导出状态：
  - EPUB：已导出（2025-02-09）
  - PDF：未导出
  - 起点：未导出
```

---

## 导出质量检查

### 导出前自动检查

| 检查项 | 说明 | 处理 |
|--------|------|------|
| 章节完整性 | 所有预期章节文件是否存在 | 错误 -> 列出缺失章节 |
| 元数据 | 书名、作者是否设置 | 警告 -> 使用默认值 |
| 封面 | 封面图是否存在 | 警告 -> 自动生成基础封面 |
| Markdown 格式 | 标题层级是否正确 | 警告 -> 自动修正 |
| 特殊字符 | 是否有不兼容字符 | 自动转义 |
| 文件大小 | 封面图是否过大 | 警告 -> 建议压缩 |

### 导出后验证

```
导出完成

质量检查：
  章节完整性：30/30
  元数据：完整
  封面：1600x2400 (OK)
  格式验证：通过
  文件大小：856 KB (OK)

警告：
  第 15 章标题层级异常（## 应该是 #）
  封面图较大（2.1 MB），建议压缩到 < 1 MB
```

---

## 常见陷阱

### 1. 封面尺寸不对

**症状**：EPUB 封面在阅读器中显示被拉伸或裁剪
**解决**：使用 2:3 比例（推荐 1600x2400 像素），可通过 `/generate-cover` 自动处理

### 2. PDF 文件过大

**症状**：PDF 超过 10MB
**原因**：封面图片未压缩
**解决**：压缩封面图到 < 1MB，或使用纯文本封面

### 3. 网文平台上传被拒

**症状**：格式不符合平台要求
**解决**：使用对应平台的专用格式命令（如 `--format qidian`），系统会自动处理格式规范

### 4. 目录显示不正确

**症状**：EPUB 目录缺少章节
**原因**：章节文件缺少一级标题
**解决**：确保每个章节文件有 `# 章节标题`

### 5. 中文字体不显示

**症状**：PDF 中文字显示为方块
**原因**：系统缺少中文字体
**解决**：安装思源宋体（Source Han Serif），或使用 EPUB 格式（阅读器自带字体）

---

## 检查清单

**导出前：**
- [ ] 所有章节已完成？
- [ ] 元数据已设置？（`/metadata edit`）
- [ ] 封面已准备？（`/generate-cover`）
- [ ] 章节顺序正确？
- [ ] 章节标题格式统一（`# 标题`）？

**导出后：**
- [ ] 文件能正常打开？
- [ ] 目录显示正确？
- [ ] 封面显示正常？
- [ ] 排版美观？
- [ ] 字数统计正确？
