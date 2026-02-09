# Export 导出插件

## 概述

将小说导出为多种可发布格式，自动处理目录、封面、元数据和排版。

## 功能特性

### 核心功能
- **一键导出** - 一个命令完成格式转换、封面、目录、元数据
- **多格式支持** - EPUB、PDF、网文平台格式全覆盖
- **专业排版** - 自动处理字体、行距、分页等排版细节
- **零学习成本** - 不需要了解 EPUB 标准或 LaTeX

### 支持格式

| 格式 | 适用场景 | 命令 |
|------|---------|------|
| EPUB 3.0 | Kindle, Apple Books, 通用电子书 | `/export --format epub` |
| PDF | 打印、PDF 阅读器 | `/export --format pdf` |
| 起点中文网 | 起点平台上传 | `/export --format qidian` |
| 番茄小说 | 番茄平台上传 | `/export --format tomato` |
| 晋江文学城 | 晋江平台上传 | `/export --format jinjiang` |
| Markdown 合集 | 单文件备份 | `/export --format markdown` |

## 命令

### /export - 导出小说
将小说导出为可发布格式（EPUB/PDF/网文平台），自动目录、封面和元数据。

**基本用法：**
```
/export --format epub              导出 EPUB
/export --format pdf               导出 PDF
/export --format qidian            导出起点格式
/export --format markdown          导出 Markdown 合集
```

**选项：**
- `--format <格式>` - 导出格式（必需）
- `--output <路径>` - 输出路径（默认：stories/[name]/exports/）
- `--chapters <范围>` - 导出章节范围（默认：全部）
- `--cover <文件>` - 指定封面图（默认：自动生成）
- `--include-appendix` - 包含附录（角色表、世界观）

### /generate-cover - 封面生成
生成或上传小说封面图片。

**基本用法：**
```
/generate-cover                    自动生成基础封面
/generate-cover --upload cover.jpg 上传封面图片
/generate-cover --template modern  使用指定模板
```

**封面模板：**
- `modern` - 现代简约，大字标题（都市、现代题材）
- `classic` - 古典风格，竖排书名（古代、武侠、仙侠）
- `minimal` - 极简风格，白底黑字（通用）
- `dark` - 暗色系（悬疑、恐怖）

### /metadata - 元数据管理
编辑小说元数据（书名、作者、简介等），用于导出和发布。

**基本用法：**
```
/metadata show                     查看当前元数据
/metadata edit                     交互式编辑元数据
/metadata init                     从 specification.md 自动提取
/metadata validate                 验证元数据完整性
/metadata set title "新书名"       设置单个字段
```

## 快速开始

### 第一次导出 EPUB

1. **初始化元数据**
   ```
   /metadata init
   ```
   自动从 `specification.md` 提取书名、简介等信息。

2. **生成封面**
   ```
   /generate-cover --template modern
   ```
   或上传自己的封面：
   ```
   /generate-cover --upload ~/Desktop/my-cover.jpg
   ```

3. **导出 EPUB**
   ```
   /export --format epub
   ```

4. **验证结果**
   - 文件位置：`stories/[name]/exports/epub/[name].epub`
   - 用 Apple Books 或 Kindle 打开测试

### 导出到网文平台

**起点中文网：**
```
/export --format qidian
```
输出：`stories/[name]/exports/platforms/qidian/[name].txt`

**番茄小说：**
```
/export --format tomato
```
输出：`stories/[name]/exports/platforms/tomato/` 目录（每章独立文件）

**晋江文学城：**
```
/export --format jinjiang
```
输出：`stories/[name]/exports/platforms/jinjiang/[name].html`

### 导出 PDF

```
/export --format pdf
```

**页面预设：**
- `a5-print` - A5 纸张，适合实体书打印
- `a4-read` - A4 纸张，适合屏幕阅读
- `6x9-publish` - 6x9 英寸，国际出版标准

## 输出目录结构

```
stories/[story-name]/
├── exports/
│   ├── epub/
│   │   └── my-novel.epub
│   ├── pdf/
│   │   └── my-novel.pdf
│   ├── platforms/
│   │   ├── qidian/
│   │   │   └── my-novel.txt
│   │   ├── tomato/
│   │   │   ├── 001-chapter-title.txt
│   │   │   └── ...
│   │   └── jinjiang/
│   │       └── my-novel.html
│   ├── my-novel-complete.md      # Markdown 合集
│   └── metadata.json              # 导出时使用的元数据快照
├── cover.jpg                      # 封面图片
└── metadata.json                  # 元数据文件
```

## 与其他命令集成

### 与 /write 集成
全书写完后，自动提示导出：
```
恭喜完成全书！是否导出为 EPUB？
→ /metadata edit（检查元数据）
→ /generate-cover（生成封面）
→ /export --format epub
```

### 与 /translate 集成
导出翻译版本：
```
/export --format epub --lang en
→ 检查 translations/en/ 是否存在
→ 导出英文版 EPUB
```

### 与 /analyze 集成
检查导出准备状态：
```
/analyze --export-ready
→ 检查章节完整性
→ 检查元数据
→ 检查封面
→ 检查格式错误
```

## 导出质量检查

### 导出前自动检查
- ✅ 章节完整性（所有预期章节文件是否存在）
- ✅ 元数据（书名、作者是否设置）
- ✅ 封面（封面图是否存在）
- ✅ Markdown 格式（标题层级是否正确）
- ✅ 特殊字符（是否有不兼容字符）
- ✅ 文件大小（封面图是否过大）

### 导出后验证
```
导出完成

质量检查：
  ✓ 章节完整性：30/30
  ✓ 元数据：完整
  ✓ 封面：1600x2400 (OK)
  ✓ 格式验证：通过
  ✓ 文件大小：856 KB (OK)

警告：
  ⚠ 第 15 章标题层级异常（## 应该是 #）
  ⚠ 封面图较大（2.1 MB），建议压缩到 < 1 MB
```

## 常见问题

### 1. 封面尺寸不对
**症状：** EPUB 封面在阅读器中显示被拉伸或裁剪
**解决：** 使用 2:3 比例（推荐 1600x2400 像素）

### 2. PDF 文件过大
**症状：** PDF 超过 10MB
**原因：** 封面图片未压缩
**解决：** 压缩封面图或使用纯文本封面

### 3. 网文平台上传被拒
**症状：** 格式不符合平台要求
**解决：** 使用对应平台的专用格式命令（如 `--format qidian`）

### 4. 目录显示不正确
**症状：** EPUB 目录缺少章节
**原因：** 章节文件缺少一级标题
**解决：** 确保每个章节文件有 `# 章节标题`

### 5. 中文字体不显示
**症状：** PDF 中文字显示为方块
**原因：** 系统缺少中文字体
**解决：** 安装思源宋体或使用 EPUB 格式（阅读器自带字体）

## 检查清单

### 导出前
- [ ] 所有章节已完成？
- [ ] 元数据已设置？（/metadata edit）
- [ ] 封面已准备？（/generate-cover）
- [ ] 章节顺序正确？
- [ ] 章节标题格式统一？

### 导出后
- [ ] 文件能正常打开？
- [ ] 目录显示正确？
- [ ] 封面显示正常？
- [ ] 排版美观？
- [ ] 字数统计正确？

## 技术细节

### EPUB 3.0 规范
- 标准：EPUB 3.0 (IDPF/W3C)
- 内容格式：XHTML 5
- 样式：CSS
- 元数据：Dublin Core
- 导航：nav.xhtml + toc.ncx（EPUB 2 兼容）
- 验证：EPUBCheck 规则

### PDF 排版
- 纸张：A5 (148 x 210mm) / A4 / 6x9 英寸
- 边距：上下 2cm，左右 1.5cm
- 字体：思源宋体（中文）/ Times New Roman（英文）
- 字号：11pt
- 行距：1.5 倍
- 页码：居中底部

### 网文平台格式
- **起点：** TXT，`第X章 标题`，段落空两格，直角引号
- **番茄：** TXT，`X. 标题`，每章 < 3000 字，段落间空行
- **晋江：** HTML，支持简单 HTML 标签

## 专家

### expert:publishing-expert - 出版格式专家
精通 EPUB/PDF 格式规范与网文平台要求，提供专业的导出和排版建议。

**核心能力：**
- EPUB 格式专家（EPUB 3.0 标准、元数据、样式优化）
- PDF 排版专家（页面设置、中文排版规范、字体选择）
- 网文平台规范（各平台格式要求、自动转换、验证）
- 封面设计建议（尺寸、比例、平台规范）

## 依赖

### 核心依赖
- Novel Writer Skills Core >= 1.0.0

### 可选依赖
- **Pandoc >= 2.0** - 用于高级 PDF 导出（LaTeX 排版）
  - 安装：https://pandoc.org/installing.html
  - 不安装也可使用基础 PDF 导出功能

## 版本历史

### v1.0.0 (2025-02-09)
- 初始版本
- EPUB 3.0 导出
- PDF 导出（基础 + Pandoc）
- 网文平台格式（起点、番茄、晋江）
- Markdown 合集导出
- 封面生成（4 种模板）
- 元数据管理
- 自动目录生成
- 导出质量检查

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 支持

如有问题，请访问：https://github.com/novel-writer-skills/plugins
