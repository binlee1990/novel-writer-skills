---
description: 将章节概要扩写为 3000-5000 字正文
argument-hint: [章节号] [--batch N]
recommended-model: claude-opus-4-6
allowed-tools: Read(//stories/**), Write(//stories/**/content/**), Read(//tracking/**), Write(//tracking/**), Read(//resources/style-reference.md), Read(//resources/anti-ai.md), Read(//resources/constitution.md), Bash(ls:*)
---

用户输入：$ARGUMENTS

## 上下文隔离（强制）

本命令的所有创作资源必须从文件系统重新加载，禁止依赖本对话中之前任何 /write 或其他命令的生成过程和中间记忆。

具体规则：
- 忽略对话历史中所有 /write 生成的概要内容，以文件系统中的 synopsis.md 为唯一真实来源
- 忽略对话历史中所有 tracking 文件的中间状态，重新从文件读取最新版本
- 不复用对话中已加载的 style-reference.md 或 anti-ai.md，重新读取

## 目标

将已生成的章节概要扩写为 3000-5000 字的完整正文。

## 参数解析

- 章节号：从 $ARGUMENTS 提取
- `--batch N`：批量扩写 N 章（最大 10），从指定章节号开始

## 资源加载（精准最小集）

1. **当前章概要**：读取 `stories/<story>/content/chapter-XXX-synopsis.md`（200-500字）
2. **前一章正文末尾**：读取前一章 `chapter-XXX.md` 的最后 500-800 字（衔接用）。如果前一章尚未扩写，读取前一章概要代替
3. **本章出场角色状态**：从概要中提取出场角色列表，然后从 `tracking/character-state.json` 只提取这些角色的条目
4. **本章活跃伏笔**：从 `tracking/plot-tracker.json` 提取 status=planted 或 status=hinted 且 keyChapters 包含当前章或相邻章（±3章）的伏笔
5. **风格参考**：读取 `resources/style-reference.md`
6. **反AI规范**：读取 `resources/anti-ai.md`

**总上下文控制在 2000-3000 字以内。**

**不加载**：specification.md、creative-plan.md、constitution.md、其他 tracking 文件

## 执行步骤

### 1. 前置检查

- 确认目标章节的 synopsis.md 存在，否则提示先运行 /write
- 确认目标章节的正文 chapter-XXX.md 不存在（避免覆盖），如已存在则询问是否覆盖

### 2. 加载上下文

按上述「资源加载」规则加载精准最小集。

### 3. 扩写正文

基于概要，扩写为 3000-5000 字正文。遵循以下原则：

- **忠实于概要**：核心事件、出场角色、情感走向必须与概要一致
- **文学表达**：专注于场景描写、对话、心理活动、动作细节
- **风格一致**：遵循 style-reference.md 的风格设定
- **反AI规范**：遵循 anti-ai.md 的写作规范
- **衔接自然**：与前一章末尾自然衔接
- **伏笔落地**：概要中标记的伏笔必须在正文中体现

写入 `stories/<story>/content/chapter-XXX.md`。

### 4. 补充 tracking 细节

扩写完成后，检查正文中是否产生了概要中没有的新细节：
- 对话中透露的新信息 → 更新 character-state 或 relationships
- 新的场景细节 → 如有重要设定变化，更新相关 tracking

### 5. 批量模式

如果指定了 `--batch N`，重复步骤 2-4 共 N 次。每章完成后输出进度和字数。

### 6. 后续建议

单章完成：「第X章扩写完成（XXXX字）。继续 /expand [X+1] 或使用 /analyze X 检查质量。」

批量完成：「第X-Y章扩写完成（共Z章，平均XXXX字/章）。使用 /analyze --range X-Y 批量检查质量。」
