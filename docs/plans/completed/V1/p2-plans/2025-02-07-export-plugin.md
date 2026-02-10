# Export 导出插件实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标：** 创建 export 导出插件，将小说导出为可发布格式（EPUB/PDF/网文平台格式）

**架构：** Plugin 格式，包含导出命令、格式转换、封面生成、元数据管理

**技术栈：** Markdown 解析，EPUB 3.0 生成，PDF 转换（Pandoc/Puppeteer），网文平台格式适配

**预估工时：** 18-25 小时（MVP: 10-12h）

---

## 背景与动机

### 问题

**场景 1：手动排版导出太复杂**
```
作者写完 30 万字小说，想发布到 Kindle：
- 需要把 30+ 个 Markdown 文件合并
- 手动创建目录结构
- 转换为 EPUB 格式（需要了解 EPUB 标准）
- 添加封面、元数据
- 排版调整（字体、行距、段距）
→ 光是导出就花了一整天
```

**场景 2：网文平台格式要求不同**
```
同一部小说，想发布到多个平台：
- 起点中文网：要求特定章节标题格式（"第X章 标题"）
- 番茄小说：要求每章不超过 3000 字
- 晋江文学城：支持简单 HTML
- 每个平台的格式规范不同
→ 每个平台都要手动调整一遍格式
```

**场景 3：想打印实体书，但排版不专业**
```
作者想打印自己的小说：
- 需要 PDF 格式
- 页面设置（纸张大小、边距、页码）
- 章节分页
- 字体选择
- 页眉页脚
→ 不会用排版工具（InDesign、LaTeX），结果不美观
```

**场景 4：缺少封面和元数据**
```
导出电子书需要：
- 封面图片（尺寸、比例有要求）
- 书名、作者、简介等元数据
- 分类标签
- 版权声明
→ 作者不知道这些要求，导致导出的电子书不专业
```

### 当前状态

**市场现状：**
- Pandoc：强大但复杂，命令行学习成本高
- Calibre：功能多但 UI 复杂
- 在线转换工具：功能有限，不支持自定义
- 没有专为小说创作者设计的一键导出工具

**项目现状：**
- 小说内容以 Markdown 格式存储在 `stories/[name]/content/` 目录
- 有完整的 specification.md 和 creative-plan.md
- 有角色档案、世界观等 spec/knowledge/ 数据
- 插件系统已完成（P1），支持远程安装
- 无任何导出功能实现

### 价值主张

1. **一键导出** - 一个命令完成格式转换、封面、目录、元数据
2. **多格式支持** - EPUB、PDF、网文平台格式全覆盖
3. **专业排版** - 自动处理字体、行距、分页等排版细节
4. **零学习成本** - 不需要了解 EPUB 标准或 LaTeX
5. **打通闭环** - 创作 → 导出 → 发布，完整工作流

---

## Task 1: 研究导出格式需求

**Files:**
- Read: `plugins/authentic-voice/config.yaml`（参考插件结构）
- Read: 现有小说的 `stories/` 目录结构
- Research: EPUB 3.0 标准、PDF 生成方案、网文平台格式规范

**Step 1: 分析各导出格式的要求**

### EPUB 3.0

| 维度 | 要求 |
|------|------|
| 标准 | EPUB 3.0 (IDPF/W3C) |
| 文件结构 | ZIP 压缩，包含 META-INF/, OEBPS/ |
| 内容格式 | XHTML 5 |
| 样式 | CSS |
| 元数据 | Dublin Core (dc:title, dc:creator 等) |
| 导航 | nav.xhtml (EPUB 3) + toc.ncx (EPUB 2 兼容) |
| 封面 | JPG/PNG，建议 1600x2400 (2:3) |
| 验证工具 | EPUBCheck |

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

### PDF

**方案对比：**

| 方案 | 工具 | 优点 | 缺点 | 适用 |
|------|------|------|------|------|
| A: HTML → PDF | Puppeteer/wkhtmltopdf | 无需外部依赖 | 排版选项有限 | MVP |
| B: Markdown → LaTeX → PDF | Pandoc + XeLaTeX | 专业排版 | 需安装 Pandoc + TeX | 高级 |
| C: Markdown → HTML → PDF | Pandoc + CSS | 中等质量 | 需安装 Pandoc | 推荐 |

**PDF 排版要求：**

| 维度 | 默认值 | 可选 |
|------|--------|------|
| 纸张 | A5 (148 x 210mm) | A4, B5, 6x9 英寸 |
| 边距 | 上下 2cm，左右 1.5cm | 自定义 |
| 字体 | 思源宋体（中文）/ Times New Roman（英文） | 自定义 |
| 字号 | 11pt | 10-14pt |
| 行距 | 1.5 倍 | 1.2-2.0 |
| 页码 | 居中底部 | 右下角 |
| 页眉 | 书名 | 章节名 / 无 |

### 网文平台格式

| 平台 | 格式 | 章节标题 | 特殊要求 |
|------|------|---------|---------|
| 起点中文网 | TXT | `第X章 标题` | 段落空两格，直角引号 |
| 番茄小说 | TXT | `X. 标题` | 每章 < 3000 字，段落间空行 |
| 晋江文学城 | HTML | 自定义 | 支持简单 HTML 标签 |
| 飞卢 | TXT | `第X章 标题` | 段落空两格 |

**Step 2: 确定 MVP 范围**

**MVP（Phase 1）：**
- EPUB 导出（最核心需求）
- 基础封面（纯色 + 文字）
- 自动目录
- 基础元数据

**完整版（Phase 2+）：**
- PDF 导出
- 网文平台格式
- 高级封面
- 附录（角色表、世界观）

---

## Task 2: 设计插件结构和配置

**Files:**
- Create: `plugins/export/config.yaml`
- Create: `plugins/export/README.md`
- Create: `plugins/export/commands/export.md`
- Create: `plugins/export/commands/generate-cover.md`
- Create: `plugins/export/commands/metadata.md`
- Create: `plugins/export/experts/publishing-expert.md`
- Create: `plugins/export/templates/epub/stylesheet.css`
- Create: `plugins/export/templates/epub/cover-template.html`

**Step 1: 定义目录结构**

```
plugins/export/
├── config.yaml                       # 插件配置
├── README.md                         # 使用说明
├── commands/
│   ├── export.md                     # /export 导出命令
│   ├── generate-cover.md             # /generate-cover 封面生成
│   └── metadata.md                   # /metadata 元数据管理
├── experts/
│   └── publishing-expert.md          # 出版格式专家
└── templates/                        # 导出模板
    ├── epub/
    │   ├── stylesheet.css            # EPUB 样式表
    │   ├── cover-template.html       # 封面页 XHTML 模板
    │   └── chapter-template.html     # 章节页 XHTML 模板
    ├── pdf/
    │   ├── print-style.css           # 打印样式
    │   └── ebook-style.css           # 电子阅读样式
    └── platforms/
        ├── qidian-format.md          # 起点格式规范
        ├── tomato-format.md          # 番茄格式规范
        └── jinjiang-format.md        # 晋江格式规范
```

**运行时输出目录：**
```
stories/[story-name]/exports/
├── epub/
│   └── my-novel.epub
├── pdf/
│   └── my-novel.pdf
├── platforms/
│   ├── qidian/
│   │   └── my-novel.txt             # 单文件合并版
│   ├── tomato/
│   │   ├── chapter-01.txt
│   │   └── ...
│   └── jinjiang/
│       └── my-novel.html
└── metadata.json                     # 导出用的元数据
```

**Step 2: 编写 config.yaml**

```yaml
name: export
version: 1.0.0
description: 小说导出插件 - 支持 EPUB/PDF/网文平台格式，自动目录和封面
type: feature
author: Novel Writer Community

commands:
  - id: export
    file: commands/export.md
    description: 导出小说为可发布格式（EPUB/PDF/网文平台）
  - id: generate-cover
    file: commands/generate-cover.md
    description: 生成或上传封面图片
  - id: metadata
    file: commands/metadata.md
    description: 编辑小说元数据（书名、作者、简介等）

experts:
  - id: publishing-expert
    file: experts/publishing-expert.md
    title: 出版格式专家
    description: 精通 EPUB/PDF 格式规范与网文平台要求

dependencies:
  core: ">=1.0.0"
  external:
    pandoc: ">=2.0 (可选，用于高级 PDF 导出)"

installation:
  message: |
    export 导出插件安装成功

    支持格式：
    - EPUB 3.0（Kindle, Apple Books, Google Play Books）
    - PDF（打印 / 阅读）
    - 网文平台（起点、番茄、晋江）
    - Markdown 合集（单文件备份）

    快速开始：
    1. /metadata edit                  编辑元数据（书名、作者、简介）
    2. /generate-cover                 生成或上传封面
    3. /export --format epub           导出 EPUB
    4. /export --format pdf            导出 PDF
    5. /export --format qidian         导出起点格式

    可选依赖（高级 PDF）：
    - Pandoc: https://pandoc.org/installing.html
```

---

## Task 3: 实现 /export 命令

**Files:**
- Create: `plugins/export/commands/export.md`

**内容框架：**

```markdown
---
title: 导出小说 - /export
description: 将小说导出为可发布格式（EPUB/PDF/网文平台），自动目录、封面和元数据
---

# 导出小说

## 使用方法

/export [选项]

### 基本用法
- `/export --format epub`             导出 EPUB
- `/export --format pdf`              导出 PDF
- `/export --format qidian`           导出起点格式
- `/export --format markdown`         导出 Markdown 合集

### 选项

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `--format <格式>` | 导出格式（必需） | - |
| `--output <路径>` | 输出路径 | stories/[name]/exports/ |
| `--chapters <范围>` | 导出章节范围 | 全部 |
| `--cover <文件>` | 指定封面图 | 自动生成 |
| `--template <模板>` | 使用自定义模板 | 默认模板 |
| `--include-appendix` | 包含附录（角色表、世界观） | false |
| `--lang <语言>` | 导出语言版本 | 原文 |

### 导出格式

| 格式 | 代码 | 适用场景 |
|------|------|---------|
| EPUB | `epub` | Kindle, Apple Books, 通用电子书 |
| PDF | `pdf` | 打印、PDF 阅读器 |
| 起点 | `qidian` | 起点中文网 |
| 番茄 | `tomato` | 番茄小说 |
| 晋江 | `jinjiang` | 晋江文学城 |
| Markdown | `markdown` | 单文件合集备份 |

## 功能详解

### 1. EPUB 导出

**完整流程：**
```
读取章节文件（stories/[name]/content/）
      ↓
读取元数据（metadata.json 或 specification.md）
      ↓
读取封面（cover.jpg 或自动生成）
      ↓
Markdown → XHTML 转换
      ↓
生成目录（nav.xhtml + toc.ncx）
      ↓
生成 content.opf（元数据 + manifest + spine）
      ↓
打包为 EPUB（ZIP 格式）
      ↓
验证（EPUBCheck 规则）
      ↓
输出 .epub 文件
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

**样式定制：**
```css
/* plugins/export/templates/epub/stylesheet.css */

body {
  font-family: "Source Han Serif SC", "Noto Serif CJK SC", serif;
  line-height: 1.8;
  margin: 1em;
}

h1 {  /* 章节标题 */
  text-align: center;
  margin-top: 3em;
  margin-bottom: 2em;
  page-break-before: always;
}

p {
  text-indent: 2em;
  margin: 0.5em 0;
}

.dialogue {  /* 对话 */
  text-indent: 2em;
}
```

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

### 2. PDF 导出

**方案 A - 基础方案（无需外部依赖）：**
```
Markdown → HTML（内置解析器）
       → 嵌入 CSS 样式
       → 交给用户用浏览器"打印为 PDF"
       → 或使用 Node.js 的 PDF 库
```

**方案 B - 高级方案（需要 Pandoc）：**
```
Markdown → Pandoc
       → HTML + CSS → PDF
       → 或 LaTeX → PDF（最佳排版质量）
```

**页面设置选项：**

| 预设 | 纸张 | 适用 |
|------|------|------|
| `a5-print` | A5, 宋体, 1.5行距 | 实体书打印 |
| `a4-read` | A4, 黑体, 1.3行距 | 屏幕阅读 |
| `6x9-publish` | 6x9英寸, 标准出版尺寸 | 国际出版 |
| `custom` | 自定义 | 高级用户 |

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

### 3. 网文平台格式

**起点中文网（qidian）：**
```
转换规则：
1. 章节标题：# 标题 → 第X章 标题
2. 去除 Markdown 格式标记
3. 段落空两格（全角空格×2）
4. 引号：""'' → 「」『』（直角引号）
5. 合并为单文件 TXT
6. UTF-8 编码

输出：
stories/[name]/exports/platforms/qidian/my-novel.txt
```

**番茄小说（tomato）：**
```
转换规则：
1. 章节标题：# 标题 → X. 标题
2. 去除 Markdown 格式
3. 段落间空一行
4. 每章独立文件
5. 章节 < 3000 字（超出自动拆分并提示）
6. UTF-8 编码

输出：
stories/[name]/exports/platforms/tomato/
├── 001-chapter-title.txt
├── 002-chapter-title.txt
└── ...
```

**晋江文学城（jinjiang）：**
```
转换规则：
1. 保留简单 HTML（<b>, <i>, <br>）
2. Markdown → HTML 转换
3. 章节标题自定义格式
4. UTF-8 编码

输出：
stories/[name]/exports/platforms/jinjiang/my-novel.html
```

**输出示例：**
```
导出起点格式完成

  文件：my-novel.txt
  大小：512 KB
  章节：30 章
  总字数：256,000 字
  格式检查：通过
    章节标题格式正确
    段落空两格
    引号已转换为直角引号

  位置：stories/my-novel/exports/platforms/qidian/my-novel.txt
```

### 4. Markdown 合集

将所有章节合并为单个 Markdown 文件，便于备份和分享。

```
转换规则：
1. 按章节顺序合并
2. 每章之间插入分隔线
3. 在文件开头添加目录
4. 保留原始 Markdown 格式

输出：
stories/[name]/exports/my-novel-complete.md
```

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
- 读取每个章节文件的一级标题
- 自动编号（如果原文没有编号）
- EPUB：嵌入式导航
- PDF：带页码的目录
- TXT：文本目录（无页码）

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

## 与其他命令集成

### 与 /write 集成
```
全书写完 →
提示："恭喜完成全书！是否导出为 EPUB？"
用户确认 → 自动引导：
  1. /metadata edit（检查元数据）
  2. /generate-cover（生成封面）
  3. /export --format epub
```

### 与 /translate 集成
```
/export --format epub --lang en
→ 检查 translations/en/ 是否存在
→ 存在：导出英文版 EPUB
→ 不存在：提示先运行 /translate --to en --all
```

### 与 /analyze 集成
```
/analyze --export-ready
→ 检查导出准备状态：
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

## 导出质量检查

### 导出前自动检查

| 检查项 | 说明 | 处理 |
|--------|------|------|
| 章节完整性 | 所有预期章节文件是否存在 | 错误 → 列出缺失章节 |
| 元数据 | 书名、作者是否设置 | 警告 → 使用默认值 |
| 封面 | 封面图是否存在 | 警告 → 自动生成基础封面 |
| Markdown 格式 | 标题层级是否正确 | 警告 → 自动修正 |
| 特殊字符 | 是否有不兼容字符 | 自动转义 |
| 文件大小 | 封面图是否过大 | 警告 → 建议压缩 |

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

## 常见陷阱

### 1. 封面尺寸不对
**症状**：EPUB 封面在阅读器中显示被拉伸或裁剪
**解决**：使用 2:3 比例（推荐 1600x2400 像素）

### 2. PDF 文件过大
**症状**：PDF 超过 10MB
**原因**：封面图片未压缩
**解决**：压缩封面图或使用纯文本封面

### 3. 网文平台上传被拒
**症状**：格式不符合平台要求
**解决**：使用对应平台的专用格式命令（如 `--format qidian`）

### 4. 目录显示不正确
**症状**：EPUB 目录缺少章节
**原因**：章节文件缺少一级标题
**解决**：确保每个章节文件有 `# 章节标题`

### 5. 中文字体不显示
**症状**：PDF 中文字显示为方块
**原因**：系统缺少中文字体
**解决**：安装思源宋体或使用 EPUB 格式（阅读器自带字体）

## 检查清单

导出前：
- [ ] 所有章节已完成？
- [ ] 元数据已设置？（/metadata edit）
- [ ] 封面已准备？（/generate-cover）
- [ ] 章节顺序正确？
- [ ] 章节标题格式统一？

导出后：
- [ ] 文件能正常打开？
- [ ] 目录显示正确？
- [ ] 封面显示正常？
- [ ] 排版美观？
- [ ] 字数统计正确？
```

**预估字数：** 导出命令文件约 400-500 行

---

## Task 4: 实现 /generate-cover 封面命令

**Files:**
- Create: `plugins/export/commands/generate-cover.md`

**内容框架：**

```markdown
---
title: 封面生成 - /generate-cover
description: 生成或上传小说封面图片
---

# 封面生成

## 使用方法

### 上传封面（推荐）
/generate-cover --upload cover.jpg
→ 验证尺寸和格式
→ 复制到 stories/[name]/cover.jpg

### 自动生成基础封面
/generate-cover
→ 读取元数据（书名、作者）
→ 生成纯色背景 + 文字封面
→ 保存到 stories/[name]/cover.jpg

### 选择模板
/generate-cover --template modern
/generate-cover --template classic
/generate-cover --template minimal

## 封面模板

| 模板 | 风格 | 适用 |
|------|------|------|
| `modern` | 现代简约，大字标题 | 都市、现代题材 |
| `classic` | 古典风格，竖排书名 | 古代、武侠、仙侠 |
| `minimal` | 极简风格，白底黑字 | 通用 |
| `dark` | 暗色系，适合悬疑 | 悬疑、恐怖 |

## 封面要求

| 维度 | 推荐值 | 说明 |
|------|--------|------|
| 尺寸 | 1600 x 2400 像素 | 2:3 比例 |
| 格式 | JPG 或 PNG | JPG 较小，PNG 更清晰 |
| 大小 | < 1 MB | 太大影响 EPUB 大小 |
| 色彩 | RGB | 不使用 CMYK |

## 封面验证

上传或生成后自动检查：
- 尺寸比例（2:3 ± 5%）
- 文件大小（< 1 MB）
- 格式（JPG/PNG）
- 分辨率（> 300 DPI 适合打印）

## 生成的封面结构

纯色背景 + 文字封面包含：
- 书名（居中，大号字）
- 副标题（可选，小号字）
- 作者名（底部）
- 装饰线条（上下分隔）

## 示例

### 示例 1：上传封面
/generate-cover --upload ~/Desktop/my-cover.jpg

  封面验证：
    尺寸：1600x2400
    大小：450 KB
    格式：JPG

  已保存到：stories/my-novel/cover.jpg

### 示例 2：自动生成
/generate-cover --template modern

  封面生成完成：
    模板：modern
    书名：我的小说
    作者：作者名
    尺寸：1600x2400

  已保存到：stories/my-novel/cover.jpg
  预览：[终端中显示缩略图描述]
```

---

## Task 5: 实现 /metadata 元数据管理命令

**Files:**
- Create: `plugins/export/commands/metadata.md`
- Create: 元数据 JSON 模板

**Step 1: 定义元数据格式**

```json
{
  "title": "我的小说",
  "subtitle": "",
  "author": "作者名",
  "language": "zh-CN",
  "identifier": "urn:uuid:550e8400-e29b-41d4-a716-446655440000",
  "publisher": "自出版",
  "date": "2025-02-09",
  "description": "一句话简介：这是一个关于...",
  "subjects": ["玄幻", "修仙", "热血"],
  "rights": "Copyright 2025 作者名. All rights reserved.",
  "series": {
    "name": "系列名（如有）",
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

**Step 2: 编写 /metadata 命令**

```markdown
---
title: 元数据管理 - /metadata
description: 编辑小说元数据（书名、作者、简介等），用于导出和发布
---

# 元数据管理

## 使用方法

### 查看当前元数据
/metadata show

### 编辑元数据
/metadata edit
→ 交互式引导编辑各字段
→ 自动从 specification.md 提取默认值

### 设置单个字段
/metadata set title "新书名"
/metadata set author "新作者名"
/metadata set description "新简介"

### 从 specification.md 自动提取
/metadata init
→ 读取 stories/[name]/specification.md
→ 提取书名、简介等信息
→ 生成 metadata.json

### 验证元数据
/metadata validate
→ 检查所有必填字段
→ 提示缺失项

## 元数据字段

| 字段 | 说明 | 必需 | 来源 |
|------|------|------|------|
| title | 书名 | 是 | specification.md |
| author | 作者 | 是 | 用户输入 |
| language | 语言 | 是 | 自动检测 |
| identifier | 唯一标识 | 自动 | UUID 自动生成 |
| description | 简介 | 推荐 | specification.md |
| subjects | 分类标签 | 推荐 | 类型知识库 |
| publisher | 出版者 | 否 | 默认"自出版" |
| date | 日期 | 否 | 自动当前日期 |
| rights | 版权声明 | 否 | 自动生成 |

## 示例

/metadata show

  书名：我的小说
  作者：作者名
  语言：中文
  简介：这是一个关于...
  分类：玄幻、修仙
  字数：256,000
  状态：元数据完整
```

---

## Task 6: 实现导出模板和转换逻辑

**Files:**
- Create: `plugins/export/templates/epub/stylesheet.css`
- Create: `plugins/export/templates/epub/cover-template.html`
- Create: `plugins/export/templates/epub/chapter-template.html`
- Create: `plugins/export/templates/pdf/print-style.css`
- Create: `plugins/export/templates/platforms/qidian-format.md`
- Create: `plugins/export/templates/platforms/tomato-format.md`
- Create: `plugins/export/experts/publishing-expert.md`

**Step 1: EPUB 模板**

**stylesheet.css：**
```css
/* EPUB 3.0 样式表 */

@charset "UTF-8";

body {
  font-family: "Source Han Serif SC", "Noto Serif CJK SC",
               "Songti SC", "SimSun", serif;
  font-size: 1em;
  line-height: 1.8;
  margin: 1em 1.5em;
  text-align: justify;
}

/* 章节标题 */
h1.chapter-title {
  text-align: center;
  font-size: 1.5em;
  margin-top: 3em;
  margin-bottom: 2em;
  page-break-before: always;
}

/* 正文段落 */
p {
  text-indent: 2em;
  margin: 0.3em 0;
}

/* 对话段落 */
p.dialogue {
  text-indent: 2em;
}

/* 场景分隔 */
hr.scene-break {
  border: none;
  text-align: center;
  margin: 2em 0;
}
hr.scene-break::after {
  content: "* * *";
  color: #666;
}

/* 封面页 */
.cover-page {
  text-align: center;
  padding-top: 30%;
}
.cover-page .title {
  font-size: 2em;
  font-weight: bold;
  margin-bottom: 1em;
}
.cover-page .author {
  font-size: 1.2em;
  color: #666;
}
```

**chapter-template.html：**
```html
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>{{chapter_title}}</title>
  <link rel="stylesheet" type="text/css" href="stylesheet.css" />
</head>
<body>
  <h1 class="chapter-title">{{chapter_title}}</h1>
  {{chapter_content}}
</body>
</html>
```

**Step 2: PDF 打印样式**

```css
/* PDF 打印样式 - A5 */

@page {
  size: A5;
  margin: 2cm 1.5cm;

  @top-center {
    content: "{{book_title}}";
    font-size: 9pt;
    color: #999;
  }

  @bottom-center {
    content: counter(page);
    font-size: 10pt;
  }
}

@page :first {
  @top-center { content: none; }
  @bottom-center { content: none; }
}

body {
  font-family: "Source Han Serif SC", serif;
  font-size: 11pt;
  line-height: 1.5;
}

h1 {
  page-break-before: always;
  text-align: center;
  font-size: 16pt;
  margin-top: 3cm;
  margin-bottom: 2cm;
}

p {
  text-indent: 2em;
  margin: 0;
  orphans: 2;
  widows: 2;
}
```

**Step 3: 网文平台格式规范**

**qidian-format.md：**
```markdown
# 起点中文网格式规范

## 转换规则

### 1. 章节标题
- 原始：`# 开端` → 转换为：`第一章 开端`
- 自动编号（第一章、第二章...）
- 支持自定义编号格式

### 2. 正文格式
- 去除所有 Markdown 标记（**粗体**、*斜体*、> 引用 等）
- 每段开头空两个全角空格
- 段落之间不空行

### 3. 引号转换
- `""` → `「」`（对话）
- `''` → `『』`（引用）

### 4. 场景分隔
- `---` 或 `***` → 空行

### 5. 编码
- UTF-8

### 6. 输出
- 单文件 TXT
- 文件名：书名.txt
```

**Step 4: publishing-expert Expert**

```markdown
---
title: 出版格式专家 - expert:publishing-expert
description: 精通 EPUB/PDF 格式规范与网文平台要求
---

作为"出版格式专家"，你的职责是：

## 核心能力

1. **EPUB 格式专家**
   - 熟悉 EPUB 3.0 标准
   - 确保元数据完整性（Dublin Core）
   - 优化样式和排版
   - 解决格式兼容性问题

2. **PDF 排版专家**
   - 页面设置优化
   - 中文排版规范（避头尾、段首缩进）
   - 字体选择建议
   - 打印 vs 阅读排版差异

3. **网文平台规范**
   - 熟悉各平台格式要求
   - 自动格式转换
   - 上传前格式验证

4. **封面设计建议**
   - 尺寸和比例要求
   - 不同平台的封面规范
   - 基础设计原则

## 工作流程

1. 读取小说内容和元数据
2. 根据目标格式选择转换方案
3. 执行格式转换
4. 质量检查和验证
5. 输出文件和报告
```

---

## Task 7: 集成测试和文档

**Files:**
- Create: `plugins/export/README.md`
- Modify: `docs/p2-plans/README.md`（更新状态）

**Step 1: 测试用例**

### 测试 1：EPUB 导出
```
输入：10 章小说 + 元数据 + 封面
命令：/export --format epub

验证：
- [ ] EPUB 文件生成
- [ ] 目录正确（10 章）
- [ ] 封面显示正常
- [ ] 元数据完整
- [ ] 文件可在 Apple Books / Kindle 打开
```

### 测试 2：PDF 导出
```
输入：10 章小说 + 元数据
命令：/export --format pdf

验证：
- [ ] PDF 文件生成
- [ ] 章节分页正确
- [ ] 页码连续
- [ ] 中文字体显示正常
- [ ] 页眉页脚正确
```

### 测试 3：网文平台格式
```
输入：10 章小说
命令：/export --format qidian

验证：
- [ ] TXT 文件生成
- [ ] 章节标题格式正确（第X章 标题）
- [ ] 段落空两格
- [ ] 引号已转换
- [ ] 编码为 UTF-8
```

### 测试 4：元数据管理
```
操作：/metadata init → /metadata edit → /metadata validate

验证：
- [ ] 从 specification.md 正确提取
- [ ] 编辑后正确保存
- [ ] 验证能检测缺失字段
```

### 测试 5：封面生成
```
操作：/generate-cover --template modern

验证：
- [ ] 封面图片生成
- [ ] 尺寸正确（1600x2400）
- [ ] 书名和作者名显示
- [ ] 文件大小 < 1 MB
```

**Step 2: 验证标准**

| 指标 | 标准 | 方法 |
|------|------|------|
| EPUB 有效性 | 通过 EPUBCheck | 自动验证 |
| PDF 可打开 | 主流阅读器可打开 | 手动测试 |
| 平台格式符合 | 各平台上传不报错 | 手动测试 |
| 元数据完整性 | 必填字段 100% | 自动检查 |
| 导出速度 | < 30 秒/10 章 | 计时 |

**Step 3: 文档更新**

更新 `plugins/export/README.md`：
```markdown
# Export 导出插件

## 概述
将小说导出为多种可发布格式，自动处理目录、封面、元数据和排版。

## 命令
- `/export` - 导出小说（EPUB/PDF/网文平台）
- `/generate-cover` - 生成或上传封面
- `/metadata` - 管理元数据

## 支持格式
- EPUB 3.0（Kindle, Apple Books）
- PDF（打印 / 阅读）
- 起点中文网、番茄小说、晋江文学城
- Markdown 合集

## 快速开始
1. /metadata init          初始化元数据
2. /generate-cover         生成封面
3. /export --format epub   导出 EPUB

## 详细文档
参见各命令文件。
```

---

## 验证和测试

### 内容质量
- [ ] 各格式的转换规则清晰明确
- [ ] 模板文件可直接使用
- [ ] 元数据字段定义完整
- [ ] 封面要求明确

### 格式规范
- [ ] config.yaml 符合插件规范
- [ ] 命令文件有正确的 YAML front matter
- [ ] 模板文件格式正确
- [ ] 与现有插件格式一致

### 集成测试
- [ ] 与 /write 的集成逻辑清晰
- [ ] 与 /translate 的集成逻辑清晰
- [ ] 与 /analyze 的集成逻辑清晰
- [ ] 与 /track 的集成逻辑清晰

### 可用性测试
- [ ] 新用户能在 5 分钟内导出第一本 EPUB
- [ ] 常见操作步骤 < 3 步
- [ ] 错误提示友好且有指导性

---

## 文档和提交

**更新文档列表：**
- `plugins/export/README.md`
- `docs/p2-plans/README.md`（更新状态）

**提交：**

```bash
git add plugins/export/
git commit -m "feat(plugins): 添加 export 导出插件

- /export: 导出小说为可发布格式
  - EPUB 3.0（Kindle, Apple Books）
  - PDF（打印/阅读，支持 A5/A4）
  - 网文平台（起点、番茄、晋江）
  - Markdown 合集
- /generate-cover: 封面生成
  - 上传封面图 + 验证
  - 自动生成基础封面（4种模板）
- /metadata: 元数据管理
  - 从 specification.md 自动提取
  - 交互式编辑
  - 验证完整性

核心特性：
- 自动目录生成
- 封面 + 元数据一站式管理
- EPUB 格式验证（EPUBCheck 规则）
- 网文平台格式自动转换
- 附录生成（角色表、世界观）

Closes: P2 优先级任务 #4"
```

---

## 预估工作量

| Task | 内容 | 预估时间 |
|------|------|---------|
| 1 | 研究格式需求 | 2-3h |
| 2 | 插件结构和配置 | 2-3h |
| 3 | /export 命令 | 4-6h |
| 4 | /generate-cover 命令 | 2-3h |
| 5 | /metadata 命令 | 2-3h |
| 6 | 模板和转换逻辑 | 4-5h |
| 7 | 集成测试和文档 | 2-3h |

**总计：** 18-26 小时

**最小可用版本（仅 EPUB + 基础封面）：** 10-12 小时

---

## 分阶段实施建议

### Phase 1: MVP（10-12h）
- EPUB 导出
- 基础封面生成
- 自动目录
- 元数据管理
- 基础样式

**交付物：**
- config.yaml
- commands/export.md
- commands/generate-cover.md
- commands/metadata.md
- templates/epub/

**价值：** 可导出标准 EPUB，覆盖最核心需求

### Phase 2: PDF + 平台格式（6-8h）
- PDF 导出（Pandoc 集成）
- 起点/番茄/晋江格式
- Markdown 合集
- 高级排版选项

**交付物：**
- templates/pdf/
- templates/platforms/
- PDF 导出支持

**价值：** 多格式全覆盖

### Phase 3: 高级功能（2-5h）
- 附录自动生成
- publishing-expert Expert
- 与 /translate 深度集成
- 批量导出优化
- 自定义模板

**价值：** 专业级出版工具

---

## 成功标准

**用户反馈目标：**
- "一个命令就导出了 EPUB，太方便了"
- "不用学 Pandoc 和 LaTeX 了"
- "直接上传到起点，格式完全正确"

**技术指标：**
- EPUB 有效性：通过 EPUBCheck 验证
- PDF 可打开率：100%（主流阅读器）
- 网文平台格式正确率：100%
- 导出速度：< 30 秒/10 章
- 用户满意度：> 80%
