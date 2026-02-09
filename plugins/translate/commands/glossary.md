---
title: 术语表管理 - /glossary
description: 管理翻译术语表，确保角色名、地名、专有名词翻译统一
---

# 术语表管理

## 使用方法

### 初始化

```bash
/glossary init
```

在 `.specify/translation/` 创建空的 `glossary.json`，并自动扫描 `spec/knowledge/` 提取角色名和地名。

### 添加术语

```bash
/glossary add "类别:中文|英文|日文"
```

**示例：**
```bash
/glossary add "角色:李明|Li Ming|リ・ミン"
/glossary add "地名:青云宗|Azure Cloud Sect"
/glossary add "功法:青云剑法|Azure Cloud Sword Art"
```

**支持的类别：**
- `角色` (characters) - 人物名称
- `地名` (places) - 地点、门派、城市
- `功法` (skills) - 武功、法术、技能
- `道具` (items) - 物品、装备、宝物
- `组织` (organizations) - 门派、帮会、势力
- `概念` (concepts) - 修炼体系、世界观概念
- `称呼` (titles) - 师父、长老等称呼

### 批量导入

```bash
/glossary import glossary.csv
```

**CSV 格式：**
```csv
类别,中文,英文,日文,备注
角色,李明,Li Ming,リ・ミン,主角
地名,青云宗,Azure Cloud Sect,青雲宗,主角门派
功法,青云剑法,Azure Cloud Sword Art,青雲剣法,主角剑法
```

### 查看术语

```bash
/glossary list                      # 查看全部
/glossary list --category 角色      # 按类别筛选
/glossary list --search 青云        # 搜索
```

### 编辑术语

```bash
/glossary edit "李明" --en "Lee Ming"
/glossary edit "青云宗" --ja "青雲宗"
```

### 删除术语

```bash
/glossary remove "李明"
```

### 自动提取

```bash
/glossary extract
```

扫描已写章节，AI 自动识别专有名词：
- 列出未在术语表中的名词
- 提供翻译建议
- 用户确认后添加

### 导出

```bash
/glossary export --format csv           # 导出为 CSV
/glossary export --format markdown      # 导出为 Markdown
```

---

## 术语表格式

术语表存储在 `.specify/translation/glossary.json`：

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
      }
    ],
    "places": [
      {
        "id": "place_001",
        "zh": "青云宗",
        "en": "Azure Cloud Sect",
        "ja": "青雲宗",
        "notes": "主角所属门派"
      }
    ],
    "skills": [],
    "items": [],
    "organizations": [],
    "concepts": [],
    "titles": []
  }
}
```

---

## 术语冲突检测

自动检测以下冲突：

### 1. 相同中文、不同英文（不一致）

```
⚠️ 检测到术语不一致：
  "青云宗" 有两个英文译名：
  - Azure Cloud Sect (chapter-01)
  - Green Cloud Sect (chapter-05)

建议：统一为 "Azure Cloud Sect"
```

### 2. 不同中文、相同英文（混淆）

```
⚠️ 检测到术语冲突：
  "李明" 和 "黎明" 的英文都是 "Li Ming"

建议：区分为：
  - 李明 → Li Ming
  - 黎明 → Lí Míng 或 Li Ming (dawn)
```

### 3. 拼音相似的角色名（容易混淆）

```
⚠️ 检测到拼音相似：
  - 李明 (Lǐ Míng) → Li Ming
  - 李敏 (Lǐ Mǐn) → Li Min

建议：保持当前译名，读者可区分
```

---

## 执行流程

### /glossary init

当用户调用 `/glossary init` 时：

**Step 1: 检查是否已存在**
```
如果 .specify/translation/glossary.json 已存在：
  提示："术语表已存在，是否覆盖？(y/n)"
  用户确认 → 继续
  用户拒绝 → 退出
```

**Step 2: 创建目录**
```bash
mkdir -p .specify/translation
```

**Step 3: 扫描知识库**
```
读取 spec/knowledge/ 下的文件：
- characters.md → 提取角色名
- world.md → 提取地名、组织
- magic-system.md → 提取概念、功法
```

**Step 4: 生成初始术语表**
```json
{
  "version": "1.0",
  "story": "[从 spec/metadata.yaml 读取]",
  "last_updated": "2025-02-09",
  "languages": ["zh", "en", "ja"],
  "categories": {
    "characters": [
      // 从 characters.md 提取的角色
    ],
    "places": [
      // 从 world.md 提取的地名
    ],
    // 其他类别为空数组
  }
}
```

**Step 5: 提示用户**
```
✅ 术语表初始化成功！

自动提取：
- 角色：5 个
- 地名：3 个

术语表位置：.specify/translation/glossary.json

下一步：
1. 检查自动提取的术语是否正确
2. 为每个术语添加英文/日文译名
3. 使用 /glossary add 添加更多术语

示例：
  /glossary add "角色:李明|Li Ming|リ・ミン"
```

---

### /glossary add

当用户调用 `/glossary add "类别:中文|英文|日文"` 时：

**Step 1: 解析参数**
```
输入："角色:李明|Li Ming|リ・ミン"

解析：
  category = "角色" → "characters"
  zh = "李明"
  en = "Li Ming"
  ja = "リ・ミン" (可选)
```

**Step 2: 验证类别**
```
支持的类别：
  角色 → characters
  地名 → places
  功法 → skills
  道具 → items
  组织 → organizations
  概念 → concepts
  称呼 → titles

如果类别不支持 → 提示错误
```

**Step 3: 检查冲突**
```
检查是否已存在相同中文术语：
  如果存在 → 提示："李明 已存在，是否覆盖？(y/n)"
  用户确认 → 继续
  用户拒绝 → 退出

检查是否有相同英文译名：
  如果存在 → 警告："Li Ming 已用于其他术语，可能混淆"
```

**Step 4: 生成 ID**
```
根据类别生成唯一 ID：
  characters → char_001, char_002, ...
  places → place_001, place_002, ...
```

**Step 5: 添加到术语表**
```json
{
  "id": "char_001",
  "zh": "李明",
  "en": "Li Ming",
  "ja": "リ・ミン",
  "pinyin": "Lǐ Míng",  // 自动生成
  "notes": "",
  "first_appearance": "",
  "aliases": {
    "zh": [],
    "en": [],
    "ja": []
  }
}
```

**Step 6: 保存并提示**
```
✅ 术语添加成功！

类别：角色
中文：李明
英文：Li Ming
日文：リ・ミン

当前术语总数：6 个
```

---

### /glossary list

当用户调用 `/glossary list` 时：

**Step 1: 读取术语表**
```
读取 .specify/translation/glossary.json
如果不存在 → 提示："术语表未初始化，请先运行 /glossary init"
```

**Step 2: 过滤（如果有参数）**
```
--category 角色 → 只显示 characters
--search 青云 → 搜索包含"青云"的术语
```

**Step 3: 格式化输出**
```
术语表（共 15 个术语）

【角色】(5 个)
┌────────┬──────────────┬──────────────┬──────────┐
│ 中文   │ 英文         │ 日文         │ 备注     │
├────────┼──────────────┼──────────────┼──────────┤
│ 李明   │ Li Ming      │ リ・ミン     │ 主角     │
│ 苏婉儿 │ Su Wan'er    │ 蘇婉児       │ 女主角   │
│ ...    │ ...          │ ...          │ ...      │
└────────┴──────────────┴──────────────┴──────────┘

【地名】(3 个)
┌────────┬──────────────────┬──────────┬──────────┐
│ 中文   │ 英文             │ 日文     │ 备注     │
├────────┼──────────────────┼──────────┼──────────┤
│ 青云宗 │ Azure Cloud Sect │ 青雲宗   │ 主角门派 │
│ ...    │ ...              │ ...      │ ...      │
└────────┴──────────────────┴──────────┴──────────┘

【功法】(2 个)
...

使用 /glossary list --category 角色 查看特定类别
使用 /glossary list --search 青云 搜索术语
```

---

### /glossary extract

当用户调用 `/glossary extract` 时：

**Step 1: 扫描章节**
```
读取 stories/[story-name]/content/ 下的所有章节
```

**Step 2: AI 识别专有名词**
```
提示词：
你是专有名词识别专家。请分析以下小说文本，识别所有专有名词。

专有名词包括：
- 人物名称（主角、配角、路人）
- 地名（城市、门派、地点）
- 功法/技能名称
- 道具/物品名称
- 组织名称
- 修炼体系/世界观概念
- 特殊称呼

文本：
[章节内容]

请列出所有专有名词，格式：
类别 | 名词 | 出现次数 | 首次出现章节
```

**Step 3: 过滤已存在的术语**
```
对比 glossary.json，过滤掉已存在的术语
```

**Step 4: 提供翻译建议**
```
对每个新术语，AI 提供翻译建议：

提示词：
请为以下中文专有名词提供英文和日文翻译建议。

类别：角色
名词：李明
上下文：[首次出现的段落]

翻译要求：
- 人名：拼音翻译（Li Ming）
- 地名：意译为主（Azure Cloud Sect）
- 功法：意译（Azure Cloud Sword Art）
- 概念：意译（spiritual energy）

请提供：
1. 英文译名（推荐）
2. 日文译名（推荐）
3. 翻译理由
```

**Step 5: 展示结果并确认**
```
🔍 扫描完成！发现 12 个新专有名词：

【角色】(5 个)
1. 李明 → Li Ming | リ・ミン
   首次出现：chapter-01
   出现次数：145 次

2. 苏婉儿 → Su Wan'er | 蘇婉児
   首次出现：chapter-03
   出现次数：89 次

【地名】(3 个)
3. 天都城 → Celestial Capital | 天都城
   首次出现：chapter-02
   出现次数：67 次

...

是否添加这些术语到术语表？
[a] 全部添加
[s] 选择性添加
[n] 不添加

用户选择 → 执行相应操作
```

---

### /glossary import

当用户调用 `/glossary import glossary.csv` 时：

**Step 1: 读取 CSV 文件**
```csv
类别,中文,英文,日文,备注
角色,李明,Li Ming,リ・ミン,主角
地名,青云宗,Azure Cloud Sect,青雲宗,主角门派
```

**Step 2: 解析每一行**
```
跳过标题行
对每一行：
  解析类别、中文、英文、日文、备注
  验证格式
  检查冲突
```

**Step 3: 批量添加**
```
成功：15 个
失败：2 个（冲突或格式错误）

失败详情：
  第 3 行："李明" 已存在
  第 7 行：类别 "武器" 不支持（应为 "道具"）
```

---

### /glossary edit

当用户调用 `/glossary edit "李明" --en "Lee Ming"` 时：

**Step 1: 查找术语**
```
在 glossary.json 中搜索 zh="李明"
如果不存在 → 提示："术语 '李明' 不存在"
```

**Step 2: 更新字段**
```
支持的字段：
  --en <英文>
  --ja <日文>
  --notes <备注>
  --pinyin <拼音>
```

**Step 3: 保存并提示**
```
✅ 术语更新成功！

李明
  英文：Li Ming → Lee Ming
```

---

### /glossary remove

当用户调用 `/glossary remove "李明"` 时：

**Step 1: 查找术语**
```
在 glossary.json 中搜索 zh="李明"
如果不存在 → 提示："术语 '李明' 不存在"
```

**Step 2: 确认删除**
```
⚠️ 确认删除术语？

中文：李明
英文：Li Ming
类别：角色
出现次数：145 次（如果已翻译）

删除后，已翻译的内容不会自动更新。
确认删除？(y/n)
```

**Step 3: 删除并保存**
```
✅ 术语已删除

当前术语总数：14 个
```

---

### /glossary export

当用户调用 `/glossary export --format csv` 时：

**CSV 格式：**
```csv
类别,中文,英文,日文,拼音,备注,首次出现
角色,李明,Li Ming,リ・ミン,Lǐ Míng,主角,chapter-01
地名,青云宗,Azure Cloud Sect,青雲宗,,主角门派,chapter-01
```

**Markdown 格式：**
```markdown
# 术语表

## 角色 (5 个)

| 中文 | 英文 | 日文 | 拼音 | 备注 |
|------|------|------|------|------|
| 李明 | Li Ming | リ・ミン | Lǐ Míng | 主角 |
| ... | ... | ... | ... | ... |

## 地名 (3 个)

| 中文 | 英文 | 日文 | 备注 |
|------|------|------|------|
| 青云宗 | Azure Cloud Sect | 青雲宗 | 主角门派 |
| ... | ... | ... | ... |
```

---

## 术语冲突检测详解

### 检测时机

- 添加新术语时（/glossary add）
- 批量导入时（/glossary import）
- 自动提取时（/glossary extract）
- 手动触发（/glossary check）

### 检测规则

**规则 1：相同中文、不同译名**
```
术语 A：李明 → Li Ming
术语 B：李明 → Lee Ming

结果：❌ 冲突（同一术语有多个译名）
```

**规则 2：不同中文、相同译名**
```
术语 A：李明 → Li Ming
术语 B：黎明 → Li Ming

结果：⚠️ 警告（不同术语共享译名，可能混淆）
```

**规则 3：拼音相似**
```
术语 A：李明 (Lǐ Míng) → Li Ming
术语 B：李敏 (Lǐ Mǐn) → Li Min

结果：ℹ️ 提示（拼音相似，注意区分）
```

**规则 4：别名冲突**
```
术语 A：李明，别名 ["小明"]
术语 B：王小明，别名 ["小明"]

结果：⚠️ 警告（别名冲突）
```

---

## 最佳实践

### 1. 初始化时机

**推荐：** 在开始写作前初始化术语表

```bash
# 创建项目后立即初始化
/glossary init

# 添加主要角色和地名
/glossary add "角色:李明|Li Ming"
/glossary add "地名:青云宗|Azure Cloud Sect"
```

### 2. 术语命名规范

**人名：**
- 中文 → 拼音（Li Ming）
- 保持声调区分（Lǐ vs Lí）
- 复姓连写（Sima Zhao）

**地名：**
- 意译为主（Azure Cloud Sect）
- 保留文化特色（Celestial Capital）
- 避免过度直译（不要 Blue Cloud Sect）

**功法/技能：**
- 意译（Azure Cloud Sword Art）
- 保持意境（不要 Blue Cloud Sword Method）

**概念：**
- 通用译法（spiritual energy）
- 首次出现时注释

**称呼：**
- 保留拼音（Shifu, Shixiong）
- 或使用通用翻译（Master, Senior Brother）

### 3. 维护频率

- **写作中：** 发现新专有名词立即添加
- **写作后：** 运行 /glossary extract 检查遗漏
- **翻译前：** 确保所有术语已添加
- **定期：** 检查冲突和不一致

### 4. 备份

```bash
# 定期导出备份
/glossary export --format csv > glossary-backup-2025-02-09.csv
```

---

## 常见问题

### Q: 术语表可以多人协作吗？

A: 可以。术语表是 JSON 文件，可以通过 Git 协作。建议：
- 一人负责维护术语表
- 其他人提交术语建议
- 定期合并更新

### Q: 如何处理一词多义？

A: 使用备注字段区分：
```bash
/glossary add "概念:道|Dao|道" --notes "修炼之道"
/glossary add "地名:道|Road|道" --notes "道路"
```

### Q: 术语表可以导入到其他项目吗？

A: 可以。导出为 CSV 后，在新项目中导入：
```bash
/glossary export --format csv > terms.csv
# 在新项目中
/glossary import terms.csv
```

### Q: 如何处理角色别名？

A: 在添加术语后手动编辑 JSON，添加 aliases 字段：
```json
{
  "zh": "李明",
  "en": "Li Ming",
  "aliases": {
    "zh": ["小明", "明哥"],
    "en": ["Ming", "Brother Ming"]
  }
}
```

---

## 相关命令

- `/translate` - 使用术语表翻译
- `/translate-preview` - 预览术语应用效果
- `/analyze` - 检查术语一致性
