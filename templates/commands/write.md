---
description: 基于任务清单执行章节写作，自动加载上下文和验证规则
argument-hint: [章节编号或任务ID]
allowed-tools: Read(//**), Write(//stories/**/content/**), Bash(ls:*), Bash(find:*), Bash(wc:*), Bash(grep:*), Bash(*)
model: claude-sonnet-4-5-20250929
scripts:
  sh: .specify/scripts/bash/check-writing-state.sh
  ps: .specify/scripts/powershell/check-writing-state.ps1
---

基于七步方法论流程执行章节写作。
---

## 前置检查

1. **运行脚本** `{SCRIPT}` 检查创作状态
2. **解析资源加载报告**

运行脚本并获取 JSON 格式的资源加载报告：

```bash
# Bash 环境
bash {SCRIPT} --json

# PowerShell 环境
powershell -File {SCRIPT} -Json
```

**报告格式**（JSON）：
```json
{
  "status": "ready",
  "timestamp": "2026-02-08T09:15:30Z",
  "has_config": true,
  "resources": {
    "knowledge-base": [
      "craft/dialogue.md",
      "craft/pacing.md",
      "craft/show-not-tell.md"
    ],
    "skills": [
      "writing-techniques/dialogue-techniques",
      "writing-techniques/pacing-control"
    ],
    "disabled": []
  },
  "warnings": []
}
```

**处理逻辑**：

1. **状态检查**：
   - 如果 `status` 不是 "ready"，终止执行并显示错误消息

2. **警告处理**：
   - 如果 `warnings` 非空，在控制台显示警告但继续执行
   - 建议用户检查 specification.md 配置或资源文件完整性

3. **资源加载**：
   - 按顺序加载 `resources.knowledge-base` 和 `resources.skills` 中的文件
   - **跳过** `resources.disabled` 中明确禁用的资源
   - 如果某个资源文件不存在，记录警告但不阻断流程

4. **降级策略**（向后兼容）：
   - 如果脚本不支持 `--json` 参数，回退到传统的检查模式
   - 使用默认的智能推断规则（Layer 1 默认推断）

⚠️ **资源加载说明**: 上述报告提供配置概览，但文件的实际查询顺序仍需遵循以下协议。报告中列出的 `knowledge-base` 和 `skills` 资源会在第三层（智能资源加载）自动加载。

### 查询协议（必读顺序 + 三层资源加载）

⚠️ **重要**：请严格按照以下顺序查询文档，确保上下文完整且优先级正确。

**查询顺序**：
1. **先查（最高优先级）**：
   - `memory/constitution.md`（创作宪法 - 最高原则）
   - `memory/style-reference.md`（风格参考 - 如果通过 `/book-internalize` 生成）

2. **再查（规格和计划）**：
   - `stories/*/specification.md`（故事规格）
   - `stories/*/creative-plan.md`（创作计划）
   - `stories/*/tasks.md`（当前任务）

2.5. **自动加载写作风格和规范（基于配置）**：
   - 读取 `specification.md` 的 YAML frontmatter
   - 检查是否配置了 `writing-style`（写作风格）
   - 检查是否配置了 `writing-requirements`（写作规范）

   **如果配置了 writing-style**，加载对应风格文档：
   ```yaml
   ---
   writing-style: natural-voice
   ---
   ```
   则读取：`.claude/knowledge-base/styles/natural-voice.md`

   **如果配置了 writing-requirements**，加载对应规范文档：
   ```yaml
   ---
   writing-requirements:
     - anti-ai-v4
     - fast-paced
   ---
   ```
   则读取：
   - `.claude/knowledge-base/requirements/anti-ai-v4.md`
   - `.claude/knowledge-base/requirements/fast-paced.md`

   ⚠️ **优先级说明**：
   - 风格文档（styles）的优先级**高于** spec/presets/ 中的旧版规范
   - 规范文档（requirements）会**叠加**应用（所有配置的规范都生效）
   - 如果未配置，则使用默认的 spec/presets/ 规范

2.6. **🆕 第三层智能资源加载（三层机制）**

**优先级顺序**: Layer 2 配置覆盖 > Layer 1 默认推断 > Layer 3 关键词触发

#### Layer 1: 默认智能推断

**如果 specification.md 未配置 resource-loading**，或 `auto-load: true`（默认），自动加载：

**Knowledge-base (craft)**:
- `templates/knowledge-base/craft/dialogue.md`
- `templates/knowledge-base/craft/scene-structure.md`
- `templates/knowledge-base/craft/character-arc.md`
- `templates/knowledge-base/craft/pacing.md`
- `templates/knowledge-base/craft/show-not-tell.md`

**Skills (writing-techniques)**:
- `templates/skills/writing-techniques/dialogue-techniques/SKILL.md`
- `templates/skills/writing-techniques/scene-structure/SKILL.md`
- `templates/skills/writing-techniques/character-arc/SKILL.md`
- `templates/skills/writing-techniques/pacing-control/SKILL.md`

**⚠️ 优先级说明**：
- 这些资源的优先级**低于** 第一层（constitution）和第二层（specification）
- 这些资源的优先级**高于** 第五层（前文内容）和第六层（写作规范细节）
- 资源内容用于辅助判断和提升质量，不覆盖核心原则

#### Layer 2: 配置覆盖

**如果 specification.md 配置了 resource-loading**，使用配置覆盖默认推断：

```yaml
---
resource-loading:
  auto-load: true  # 或 false（完全禁用默认推断）

  knowledge-base:
    craft:
      - dialogue
      - pacing
      - "!character-arc"  # ! 前缀表示排除
    styles:  # 覆盖 writing-style 字段
      - natural-voice
    requirements:  # 覆盖 writing-requirements 字段
      - anti-ai-v4

  skills:
    writing-techniques:
      - dialogue-techniques
      - pacing-control
    quality-assurance:
      - consistency-checker

  keyword-triggers:
    enabled: true  # 是否启用关键词触发（Layer 3）
    custom-mappings:  # 自定义关键词映射（覆盖默认）
      "情感节奏": "templates/knowledge-base/craft/pacing.md"
---
```

**配置处理逻辑**：
1. 如果 `auto-load: false`，清空 Layer 1 的默认推断
2. 如果配置了具体资源列表，使用配置的列表
3. 如果未配置某个分类（如 craft），使用 Layer 1 的默认推断
4. `!` 前缀用于排除特定资源（在默认推断基础上减去）

**向后兼容**：
- 如果未配置 `resource-loading`，保持原有行为（writing-style, writing-requirements）
- 如果配置了 `resource-loading.knowledge-base.styles`，覆盖 `writing-style` 字段
- 如果配置了 `resource-loading.knowledge-base.requirements`，覆盖 `writing-requirements` 字段

### 🆕 Layer 3: 运行时关键词触发（动态加载）

**触发时机**:
1. 用户在执行 `/write` 命令时提供的参数中（如 `--focus 节奏控制`）
2. 读取当前任务描述时（从 `tasks.md` 提取）
3. 用户在交互过程中的输入中

**检查配置**:

读取 `specification.md` 的 `resource-loading.keyword-triggers` 配置：

```yaml
resource-loading:
  keyword-triggers:
    enabled: true  # 默认启用，false 则跳过此步骤
    custom-mappings:
      "情感节奏": "knowledge-base/craft/pacing.md"
      "甜度": "knowledge-base/genres/romance.md"
```

**如果 `enabled: false`**，跳过关键词触发机制。

**如果 `enabled: true` 或未配置**（默认启用），执行以下流程：

#### 3.1. 收集待扫描文本

**收集以下来源的文本**:
1. 命令参数中的文本（如 `--focus 对话技巧`）
2. 当前任务描述（从 `tasks.md` 读取当前任务的 description 字段）
3. 用户在写作过程中的交互输入（如提示 "这段节奏太慢了"）

**拼接文本**:
```javascript
const textToScan = [
  commandArgs,      // 命令参数
  currentTaskDesc,  // 任务描述
  userInput         // 用户输入
].join('\n');
```

#### 3.2. 加载关键词映射表

**读取文件**: `templates/config/keyword-mappings.json`

**解析结构**:
```json
{
  "mappings": {
    "craft-knowledge": {
      "pacing": {
        "keywords": ["节奏", "拖沓", "太快", "太慢"],
        "resources": [
          "templates/knowledge-base/craft/pacing.md",
          "templates/skills/writing-techniques/pacing-control/SKILL.md"
        ],
        "priority": 1
      }
    }
  },
  "regex-patterns": {
    "pacing": "节奏|拖沓|太快|太慢|过快|过慢"
  }
}
```

**合并自定义映射**:

如果 `specification.md` 配置了 `keyword-triggers.custom-mappings`，合并到映射表中：

```javascript
const customMappings = spec.resourceLoading?.keywordTriggers?.customMappings || {};

// 为每个自定义映射创建条目
for (const [keyword, resourcePath] of Object.entries(customMappings)) {
  mappings['custom-' + keyword] = {
    keywords: [keyword],
    resources: [resourcePath],
    priority: 0  // 自定义映射优先级最高
  };
}
```

#### 3.3. 执行关键词匹配

**遍历所有映射条目**:

```javascript
const matched = [];

for (const [category, items] of Object.entries(mappings)) {
  for (const [name, config] of Object.entries(items)) {
    // 使用预定义正则或构建正则
    const pattern = regexPatterns[name] || config.keywords.join('|');
    const regex = new RegExp(pattern, 'i');  // 忽略大小写

    if (regex.test(textToScan)) {
      matched.push({
        category,
        name,
        resources: config.resources,
        priority: config.priority,
        matchedKeyword: textToScan.match(regex)[0]
      });
    }
  }
}
```

**按优先级排序**:
```javascript
matched.sort((a, b) => a.priority - b.priority);  // 数字越小优先级越高
```

#### 3.4. 资源去重检查

**检查已加载资源**:

维护一个已加载资源列表（从 Layer 1 和 Layer 2 的加载结果中获取）：

```javascript
const loadedResources = [
  ...layer1Resources,
  ...layer2Resources
];

const newResources = [];

for (const match of matched) {
  for (const resource of match.resources) {
    // 规范化路径（去除前缀 templates/）
    const normalizedPath = resource.replace(/^templates\//, '');

    // 检查是否已加载
    const isLoaded = loadedResources.some(loaded =>
      loaded.includes(normalizedPath) || normalizedPath.includes(loaded)
    );

    if (!isLoaded && !newResources.includes(resource)) {
      newResources.push({
        resource,
        trigger: match.name,
        keyword: match.matchedKeyword,
        category: match.category
      });
    }
  }
}
```

#### 3.5. 用户提示和确认

**如果有新资源待加载**，显示提示：

```markdown
---
🔍 **关键词触发检测**

检测到以下关键词，建议加载相关资源：

1. **"节奏"** → 节奏控制 (pacing)
   - 知识库: craft/pacing.md
   - 技巧: writing-techniques/pacing-control

2. **"对话"** → 对话技巧 (dialogue)
   - 知识库: craft/dialogue.md
   - 技巧: writing-techniques/dialogue-techniques

是否加载这些资源？
[Y] 全部加载  [N] 跳过  [S] 选择性加载
---
```

**处理用户响应**:

- **Y (全部加载)**: 加载所有建议的资源
- **N (跳过)**: 不加载任何资源，继续写作流程
- **S (选择性加载)**: 逐个询问

**选择性加载流程**:
```markdown
### 1. 节奏控制 (pacing)

资源：
- craft/pacing.md
- writing-techniques/pacing-control

是否加载？ [Y/N]
```

#### 3.6. 动态资源加载

**对于确认加载的资源**:

```javascript
for (const item of confirmedResources) {
  const { resource, trigger, keyword } = item;

  // 加载资源内容
  const content = await readFile(resource);

  // 添加到上下文
  context.push({
    source: resource,
    content: content,
    loadedBy: 'keyword-trigger',
    trigger: trigger,
    keyword: keyword
  });

  // 记录到日志
  console.log(`✓ 动态加载: ${resource} (触发词: "${keyword}")`);
}
```

**加载完成提示**:
```markdown
✅ 已加载 2 个资源：
  - craft/pacing.md
  - writing-techniques/pacing-control

继续写作流程...
```

#### 3.7. 交互过程中的实时触发

**在写作执行过程中**，每当用户提供新的输入时：

```javascript
// 用户输入新的指令或反馈
const userFeedback = getUserInput();

// 重新扫描关键词
const runtimeMatched = scanKeywords(userFeedback);

// 过滤已加载资源
const runtimeNew = filterAlreadyLoaded(runtimeMatched, loadedResources);

// 如果有新资源，提示用户
if (runtimeNew.length > 0) {
  promptUserToLoad(runtimeNew);
}
```

**实时提示示例**:
```markdown
💡 **提示**: 检测到关键词 "节奏太慢"，是否加载 pacing-control 技巧？ [Y/N]
```

---

### 🆕 配置示例

**启用关键词触发（默认）**:
```yaml
# specification.md
---
resource-loading:
  keyword-triggers:
    enabled: true
---
```

**禁用关键词触发**:
```yaml
---
resource-loading:
  keyword-triggers:
    enabled: false
---
```

**添加自定义关键词映射**:
```yaml
---
resource-loading:
  keyword-triggers:
    enabled: true
    custom-mappings:
      "情感节奏": "knowledge-base/craft/pacing.md"
      "甜度": "knowledge-base/genres/romance.md"
      "虐文": "knowledge-base/requirements/romance-angst.md"
---
```

**自定义映射优先级最高**（priority: 0），会优先于内置映射表。

#### 资源加载报告集成

从步骤 2 获取的 JSON 报告中，`resources` 字段反映了 Layer 1 和 Layer 2 的加载结果：

```json
{
  "resources": {
    "knowledge-base": ["craft/dialogue.md", "craft/pacing.md"],
    "skills": ["writing-techniques/dialogue-techniques"],
    "disabled": ["craft/character-arc"]  // ! 前缀排除的资源
  }
}
```

**加载顺序**：
1. 加载 `knowledge-base` 列表中的所有文件
2. 加载 `skills` 列表中的所有 SKILL.md
3. 记录 `disabled` 列表，确保不加载这些资源
4. 保持与原有查询协议的优先级关系

3. **再查（状态和数据）**：
   - `spec/tracking/character-state.json`（角色状态）
   - `spec/tracking/relationships.json`（关系网络）
   - `spec/tracking/plot-tracker.json`（情节追踪 - 如有）
   - `spec/tracking/validation-rules.json`（验证规则 - 如有）

4. **再查（知识库）**：
   - `spec/knowledge/` 相关文件（世界观、角色档案等）
   - `stories/*/content/`（前文内容 - 了解前情）

5. **再查（写作规范）**：
   - `memory/personal-voice.md`（个人语料 - 如有）
   - `spec/knowledge/natural-expression.md`（自然化表达 - 如有）
   - `spec/knowledge/punctuation-personality.md`（标点个性化 - 如有）
   - `spec/knowledge/detail-formulas.md`（具象化公式 - 如有）
   - `spec/presets/anti-ai-detection.md`（反AI检测规范）

6. **条件查询（前三章专用）**：
   - **如果章节编号 ≤ 3 或总字数 < 10000字**，额外查询：
     - `spec/presets/golden-opening.md`（黄金开篇法则）
     - 并严格遵循其中的五大法则

### ⚠️ 强制完成确认（解决失焦问题的关键）

**在开始写作前，你必须明确列出已读取的核心文件**：

```markdown
📋 写作前检查清单（已完成）：

✓ 1. memory/constitution.md - 创作宪法
✓ 2. memory/style-reference.md - 风格参考（如有）
✓ 3. stories/*/specification.md - 故事规格
✓ 4. stories/*/creative-plan.md - 创作计划
✓ 5. stories/*/tasks.md - 当前任务
✓ 6. spec/tracking/character-state.json - 角色状态
✓ 7. spec/tracking/relationships.json - 关系网络
✓ 8. spec/tracking/plot-tracker.json - 情节追踪（如有）
✓ 9. spec/tracking/validation-rules.json - 验证规则（如有）

🎨 写作风格和规范（基于配置）：
✓ 写作风格：[style-name]（如配置）或 无配置
✓ 写作规范：[requirement-1, requirement-2, ...]（如配置）或 无配置

🆕 **三层资源加载（基于配置）**：
✓ Layer 1 默认推断：[enabled/disabled]
✓ Layer 2 配置覆盖：[列出加载的 knowledge-base 和 skills]
✓ Layer 3 关键词触发：[enabled/disabled]
✓ 已加载资源清单：
  - Knowledge-base: [列出文件名]
  - Skills: [列出技巧名]
  - 排除资源: [列出被 ! 排除的资源]

📊 上下文加载状态：✅ 完成
```

**如果任何文件不存在或读取失败，必须明确说明原因**。

**风格和规范说明**：
- 如果 specification.md 中配置了 `writing-style` 或 `writing-requirements`，必须列出具体加载的文档
- 示例："写作风格：natural-voice"、"写作规范：anti-ai-v4, fast-paced"
- 如果未配置，标注"无配置"并使用默认规范

⚠️ **禁止跳过此步骤**：这是防止AI在长篇创作中失焦的核心机制。只有完成此确认后，才能进入下一步写作流程。

<!-- PLUGIN_HOOK: genre-knowledge-write -->
<!-- 插件增强区：风格应用
     如果你安装了 genre-knowledge 插件，请在此处插入风格应用增强提示词
     参考：plugins/genre-knowledge/README.md 的"2.3 增强 /write 命令"章节
-->

## 写作执行流程

### 1. 选择写作任务
从 `tasks.md` 中选择状态为 `pending` 的写作任务，标记为 `in_progress`。

### 2. 验证前置条件
- 检查相关依赖任务是否完成
- 验证必要的设定是否就绪
- 确认前序章节是否完成

### 3. 写作前提醒
**基于宪法原则提醒**：
- 核心价值观要点
- 质量标准要求
- 风格一致性准则

**基于规格要求提醒**：
- P0 必须包含的元素
- 目标读者特征
- 内容红线提醒

**基于写作风格和规范提醒（如已配置）**：
- 当前激活的写作风格及其核心原则
- 当前激活的写作规范及其关键要求
- 风格和规范的组合效果说明
- 需要特别注意的禁忌和要点

**示例**：
```
🎨 当前写作配置：
- 风格：natural-voice（自然人声）
  - 口语化优先，对话推动情节
  - 行为>心理，具体>抽象

- 规范：anti-ai-v4 + fast-paced
  - 200+禁用词，形容词限制
  - 每章至少2个爽点，节奏紧凑

组合效果：自然流畅的快节奏爽文
```

**分段格式规范（重要）**：
- ⛔ **禁止使用**："一"、"二"、"三"等数字标记分段
- ✅ **使用方式**：场景转换时用两个空行（一个空白行）分隔
- 📖 **原因**：数字标记过于生硬，破坏阅读沉浸感，不符合网络小说习惯

**反AI检测写作规范（基于腾讯朱雀标准）**：

⚠️ **重要背景**：AI编程工具使用低温度参数，但传统"补偿方法"（强制堆砌细节）会导致过度描写，反而增加AI特征。以下规范基于实测通过标准（AI浓度0%）。

### 📏 段落结构规范（关键）⭐

**单句成段比例**：
- ✅ **30%-50%的段落应为单句成段**
- ✅ **每段控制在50-100字**
- ✅ **重点信息独立成段**

**示例对比**：

❌ **AI化写法**（过度描写，95% AI浓度）:
> 房间里弥漫着霉味，唯一的光源是窗帘缝隙透进的灰白月光。他摸索着墙壁前行，指尖触到冰冷的石壁，直到膝盖撞上桌角——一张摇摇欲坠的木桌，上面堆满灰尘。

✅ **自然写法**（简洁克制，0% AI浓度）:
> 永嘉之乱后，中原被异族占领。
>
> 汉地士族百姓除了少数不愿离开家乡的，大都南下渡江。
>
> 王谯这些年招揽了百十流民为自己种地。

### 🚫 禁止事项清单（反AI腔）

1. **禁止无意义堆砌**
   - ❌ 不要强行凑够"3种感官"
   - ❌ 不要列举式情绪描写
   - ✅ 一个准确的细节胜过三个堆砌

2. **禁止华丽比喻**
   - ❌ "摇摇欲坠的木桌"、"空气凝固"
   - ✅ 直接描述："一张旧木桌"、"沉默"

3. **禁止过度戏剧化**
   - ❌ "话音未落，她已转身离开。他冲上去抓住..."
   - ✅ 简洁处理："她转身走了。他追上去。"

4. **禁止说明式对话**
   - ❌ "我很生气，因为你昨天没来"
   - ✅ "你昨天去哪了？""……不关你的事。"

5. **禁止直白心理描写**
   - ❌ "他心中暗想，这事不简单"
   - ✅ 通过行为暗示："他眉头一紧。"

### ✅ 自然化写作原则

**1. 历史白描法**（古代背景适用）
- 陈述事实，不加修饰
- 示例："这些年来，王谯招揽了百十流民为自己种地。"

**2. 口语化处理**（对话）
- 加入语病、停顿、重复
- 示例："大都分人都南下"（而非"大部分人"）

**3. 短句节奏**（叙事）
- 单句15-25字
- 关键信息独立成段

**4. 克制描写**（场景）
- 一个场景1-2个细节即可
- ❌ 不写："房间里弥漫着霉味，墙壁冰冷，光线昏暗..."
- ✅ 而写："房间很暗。"（足够）

### 📊 自检标准

写完一段后检查：
- [ ] 单句成段占比是否在30%-50%？
- [ ] 每段字数是否在50-100字？
- [ ] 是否有"唯一的"、"直到"、"弥漫"等AI高频词？
- [ ] 是否强行堆砌感官细节？
- [ ] 对话是否过于完整（缺少停顿、语病）？
- [ ] 比喻是否过于华丽？

**AI高频词黑名单**：
- "唯一的"、"直到"、"弥漫着"、"摇摇欲坠"
- "空气凝固"、"话音未落"、"猛地"
- "不禁"、"顿时"、"心中暗想"
- "皱起眉头"、"叹了口气"

**替换策略**：
| ❌ AI词汇 | ✅ 自然替换 |
|---------|----------|
| 弥漫着霉味 | 有股霉味 |
| 唯一的光源 | 只有一点光 |
| 摇摇欲坠的木桌 | 一张旧木桌 |
| 他心中暗想 | 他想 / 删除 |
| 话音未落 | 他话没说完 / 删除 |

### 4. 实时辅助模式（可选）

**如果用户在写作过程中遇到困难**，比如说：
- "帮我想一下主角该怎么办"
- "接下来如何发展情节？"
- "给我几个选项"

**你可以主动提供 2-3 个行动选项**，例如：

> **情节发展建议**：
>
> **选项A（主动型）**：主角直接出手，利用金手指碾压对手
> - 优点：爽点直接，读者满足感强
> - 风险：可能显得主角过于强大
>
> **选项B（策略型）**：主角隐藏实力，智取对手
> - 优点：展现主角智慧，增加悬念
> - 风险：节奏可能稍慢
>
> **选项C（意外型）**：引入新的变数，打断当前冲突
> - 优点：增加复杂度，引出新线索
> - 风险：可能让读者感觉被打断

**然后根据用户选择**，继续创作内容。

⚠️ **注意**：这是辅助模式，不要主动提供选项，除非用户明确请求帮助。

---

### 5. 根据计划创作内容：
   - **开场**：吸引读者，承接前文
   - **发展**：推进情节，深化人物
   - **转折**：制造冲突或悬念
   - **收尾**：适当收束，引出下文

### 6. 质量自检

**宪法合规检查**：
- 是否符合核心价值观
- 是否达到质量标准
- 是否保持风格一致

**规格符合检查**：
- 是否包含必要元素
- 是否符合目标定位
- 是否遵守约束条件

**计划执行检查**：
- 是否按照章节架构
- 是否符合节奏设计
- 是否达到字数要求

**格式规范检查**：
- ⚠️ 确认未使用"一"、"二"、"三"等数字标记分段
- ✅ 场景转换使用两个空行（一个空白行）
- ✅ 保持段落间距自然流畅

### 📊 具象化检查清单（去AI味关键）⭐

写完一段后,主动识别并替换抽象表达:

#### 🔍 识别抽象表达

**时间抽象** ❌ → **具体化** ✅
- "最近" → "上周三下午"
- "很久以前" → "三年前的秋天"
- "不久前" → "昨天早上八点"
- "过了很久" → "等了整整两个小时"

**人物抽象** ❌ → **具体化** ✅
- "很多人" → "我身边至少有5个朋友"
- "有人说" → "李叔告诉我" / "隔壁老王提起过"
- "大家都知道" → "村里的老人都说"
- "据说" → "听王叔私下说过"

**数量抽象** ❌ → **具体化** ✅
- "效果很好" → "这次比上次多收了三石粮" / "客人比平时多了一倍"
- "很贵" → "一顿饭花了三百块"
- "很远" → "开车要两小时"
- "很多" → "至少有二十个"

**场景抽象** ❌ → **具体化** ✅
- "房间很乱" → "地上堆着三天没洗的衣服"
- "天气很冷" → "呼出的气都能看见白雾"
- "很累" → "走了整整五个小时山路"
- "气氛紧张" → "没人说话,只听见时钟滴答声"

#### 💡 主动搜索建议

**当遇到以下情况时,考虑使用 WebSearch 获取真实细节**：
- 历史事件：搜索真实日期、人物、地点
- 技术细节：搜索实际参数、专业术语
- 地理信息：搜索真实地名、距离、地标
- 文化习俗：搜索当地方言、习俗、特产
- 数据支撑：搜索真实统计、案例、新闻

**搜索公式**：
```
- "中国古代 [朝代] 官职体系"
- "[城市名] 特色方言词汇"
- "[年代] 真实历史事件"
- "[行业] 专业术语大全"
```

#### ✅ 具象化自检问题

- [ ] 时间是否具体？（避免"最近"、"很久"）
- [ ] 人物来源是否明确？（避免"有人"、"大家"）
- [ ] 数量是否精确？（避免"很多"、"不少"）
- [ ] 场景细节是否可见？（避免"很xx"的形容）
- [ ] 是否用了真实的地名/人名/数据？
- [ ] 对话是否有具体内容？（避免"他说了很多"）

#### 📌 具象化注意事项

**适度原则**：
- ✅ 关键情节必须具象：转折点、高潮、伏笔
- ✅ 重要细节必须具象：第一印象、关键道具
- ⚠️ 次要信息可以概括：过渡段落、背景铺陈
- ❌ 避免过度具象：流水账、啰嗦

**场景适配**：
- 古代背景：历史白描,适度具象
- 现代背景：生活细节,高度具象
- 玄幻背景：世界观设定,适度具象

**示例对比**：

❌ **抽象版**（AI腔）:
```
最近城里发生了很多事,大家都在议论。王强听说后很担心,决定去看看情况。
```

✅ **具象版**（真实感）:
```
上周三开始,菜市场的李婶就一直在说东街出事了。

王强听了两天,实在忍不住:"到底出什么事了？"

"死了人啊！"李婶压低声音,"听说是那个开超市的老张..."

王强心里一紧。老张他认识,上个月还在他那买过米。

他决定下午过去看看。
```

**具象化效果对比**：
- 时间：最近 → 上周三
- 地点：城里 → 东街、菜市场
- 人物：大家 → 李婶、老张
- 事件：很多事 → 死了人、开超市的
- 细节：听说 → 压低声音、上个月买过米

### 7. 保存和更新
- 将章节内容保存到 `stories/*/content/`
- 更新任务状态为 `completed`
- 记录完成时间和字数

## 写作要点

- **遵循宪法**：始终符合创作原则
- **满足规格**：确保包含必要元素
- **执行计划**：按照技术方案推进
- **完成任务**：系统化推进任务清单
- **持续验证**：定期运行 `/analyze` 检查

## 完成后行动

### 8. 验证字数和更新进度

**字数统计说明**：
- 使用准确的中文字数统计方法
- 排除Markdown标记（`#`、`*`、`-`等）
- 只统计实际内容字符
- 字数要求来自 `spec/tracking/validation-rules.json`（默认2000-4000字）

**验证方法**：
使用项目提供的字数统计脚本验证章节字数：
```bash
source scripts/bash/common.sh
count_chinese_words "stories/*/content/第X章.md"
```

⚠️ **注意**：不要使用 `wc -w` 统计中文字数，它对中文极不准确！

**完成报告**：
```
✅ 章节写作完成
- 已保存：stories/*/content/第X章.md
- 实际字数：[X]字
- 字数要求：2000-4000字
- 字数状态：✅ 符合要求 / ⚠️ 字数不足 / ⚠️ 字数超出
- 任务状态：已更新
```

### 9. 建议下一步
- 继续下一个写作任务
- 每5章运行 `/analyze` 进行质量检查
- 发现问题及时调整计划

## 与方法论的关系

```
/constitution → 提供创作原则
     ↓
/specify → 定义故事需求
     ↓
/clarify → 澄清关键决策
     ↓
/plan → 制定技术方案
     ↓
/tasks → 分解执行任务
     ↓
/write → 【当前】执行写作
     ↓
/analyze → 验证质量一致
```

记住：写作是执行层，要严格遵循上层的规格和计划。

---

## 🆕 后置处理：自动 Tracking 更新

**执行时机**: 章节写作完成后，内容已写入 `stories/*/content/*.md` 文件

**更新策略**: 核心命令（/write）自动更新，无需用户确认

### 自动更新的文件（4 个）

#### 1. character-state.json

**更新内容**:
- 角色最后出场位置（`lastAppearance`）
- 角色关键状态变化（`keyStates`）
- 角色情绪变化（如配置了 emotions 字段）

**更新依据**:
- 分析本章中出现的所有角色
- 识别角色状态的关键变化点
- 记录角色在本章的重要决策或转折

**示例更新**:
```json
{
  "林晓": {
    "lastAppearance": "chapter-05",
    "keyStates": {
      "mental": "焦虑",
      "physical": "疲惫"
    }
  }
}
```

#### 2. relationships.json

**更新内容**:
- 新增或更新角色关系
- 关系强度变化
- 关系类型变化

**更新依据**:
- 分析角色互动场景
- 识别关系的关键变化点（冲突、和解、信任建立等）
- 量化关系强度变化

**示例更新**:
```json
{
  "relationships": [
    {
      "from": "林晓",
      "to": "队长",
      "type": "信任",
      "strength": 0.6,
      "lastUpdate": "chapter-05",
      "note": "首次合作任务中建立初步信任"
    }
  ]
}
```

#### 3. plot-tracker.json

**更新内容**:
- 情节线推进状态
- 新增情节事件
- 伏笔埋设记录

**更新依据**:
- 识别本章推进的情节线
- 记录重要情节转折点
- 标记埋下的伏笔（待后续回收）

**示例更新**:
```json
{
  "plotLines": [
    {
      "id": "主线-001",
      "name": "寻找真相",
      "status": "进行中",
      "progress": 0.3,
      "lastUpdate": "chapter-05",
      "events": [
        {
          "chapter": "chapter-05",
          "description": "发现第一条线索",
          "importance": "high"
        }
      ]
    }
  ],
  "foreshadowing": [
    {
      "chapter": "chapter-05",
      "content": "神秘人物的出现",
      "payoffChapter": null,
      "status": "planted"
    }
  ]
}
```

#### 4. timeline.json

**更新内容**:
- 新增时间线事件
- 更新故事时间进度

**更新依据**:
- 分析本章的时间跨度
- 识别标志性时间点
- 记录重要事件的时间戳

**示例更新**:
```json
{
  "events": [
    {
      "day": 15,
      "time": "14:00",
      "chapter": "chapter-05",
      "event": "首次合作任务",
      "participants": ["林晓", "队长"],
      "location": "城市中心"
    }
  ]
}
```

### 更新执行流程

#### Step 1: 分析本章内容

分析刚完成的章节内容（`stories/*/content/chapter-XX.md`）：
1. 提取所有出现的角色
2. 识别角色互动和关系变化
3. 识别情节推进点
4. 识别时间线信息

#### Step 2: 生成更新建议（内部）

基于分析结果，生成 4 个 tracking 文件的更新内容（JSON diff 格式）

#### Step 3: 自动应用更新

**无需用户确认**，直接更新文件：
1. 读取现有 tracking 文件
2. 合并新内容（保持 JSON 格式正确）
3. 写入更新后的文件
4. 验证 JSON 格式有效性

#### Step 4: 记录到 tracking-log.md

追加更新记录到 `stories/*/spec/tracking/tracking-log.md`。

**日志格式**:
```markdown
## [时间戳] - /write chapter-XX

### 命令执行
- **命令**: `/write chapter-XX`
- **章节**: Chapter XX - [章节标题]
- **字数**: XXXX 字
- **执行者**: AI
- **状态**: 已自动更新

### 自动更新内容

#### character-state.json
\`\`\`diff
  "林晓": {
-   "lastAppearance": "chapter-04",
+   "lastAppearance": "chapter-05",
    "keyStates": {
-     "mental": "平静",
+     "mental": "焦虑"
    }
  }
\`\`\`

#### relationships.json
\`\`\`diff
+ {
+   "from": "林晓",
+   "to": "队长",
+   "type": "信任",
+   "strength": 0.6,
+   "lastUpdate": "chapter-05"
+ }
\`\`\`

#### plot-tracker.json
\`\`\`diff
  "plotLines": [
    {
      "id": "主线-001",
-     "progress": 0.2,
+     "progress": 0.3,
-     "lastUpdate": "chapter-04",
+     "lastUpdate": "chapter-05"
    }
  ]
\`\`\`

#### timeline.json
\`\`\`diff
+ {
+   "day": 15,
+   "time": "14:00",
+   "chapter": "chapter-05",
+   "event": "首次合作任务"
+ }
\`\`\`

### 更新依据
- **角色分析**: 检测到林晓在本章出现，状态从平静转为焦虑
- **关系分析**: 林晓与队长在本章首次合作，建立初步信任关系
- **情节推进**: 主线情节推进 10%，发现第一条线索
- **时间线**: 故事进展到第 15 天，记录关键事件时间点

---
```

### 错误处理

#### 如果 tracking 文件不存在

```
⚠️ 警告：tracking 文件不存在
- 文件：[文件路径]
- 建议：运行 `/track --init` 初始化 tracking 文件
- 跳过本次更新
```

#### 如果 JSON 格式错误

```
❌ 错误：tracking 文件格式错误
- 文件：[文件路径]
- 错误：[JSON 解析错误信息]
- 建议：手动修复文件格式后重试
- 跳过本次更新
```

#### 如果更新失败

```
❌ 错误：更新 tracking 文件失败
- 文件：[文件路径]
- 错误：[写入错误信息]
- 建议：检查文件权限和磁盘空间
- 更新内容已记录到 tracking-log.md，可手动补充
```

### 性能考虑

- **批量更新**: 4 个文件一次性更新，减少 I/O 操作
- **增量写入**: 仅更新变化部分，保留其他内容
- **异步日志**: tracking-log.md 追加操作可异步执行