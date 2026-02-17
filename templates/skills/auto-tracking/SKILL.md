# Auto-Tracking Skill

> 自动更新 Tracking 文件的详细格式和流程规范

## 概述

写作完成后，自动分析章节内容并更新 4 个 tracking 文件，记录角色状态、关系变化、情节推进和时间线信息。

## 自动更新的文件（4 个）

### 1. character-state.json

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

### 2. relationships.json

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

### 3. plot-tracker.json

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

### 4. timeline.json

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

## 更新执行流程

### Step 1: 分析本章内容

分析刚完成的章节内容（`stories/*/content/chapter-XX.md`）：
1. 提取所有出现的角色
2. 识别角色互动和关系变化
3. 识别情节推进点
4. 识别时间线信息

### Step 2: 生成更新内容

基于分析结果，生成 4 个 tracking 文件的更新内容（JSON diff 格式）

### Step 3: 自动应用更新

**无需用户确认**（/write 模式），直接更新文件：
1. 读取现有 tracking 文件
2. 合并新内容（保持 JSON 格式正确）
3. 写入更新后的文件
4. 验证 JSON 格式有效性

**需用户确认**（/analyze 模式），展示更新内容后等待确认。

### Step 4: 记录到 tracking-log.md

追加更新记录到 `tracking/tracking-log.md`。

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
- **角色分析**: [角色变化说明]
- **关系分析**: [关系变化说明]
- **情节推进**: [情节推进说明]
- **时间线**: [时间线更新说明]

---
```

## Checkpoint 完成标记

写作正常完成后，更新 `write-checkpoint.json` 的 `status` 为 `completed`：

```json
{
  "progress": {
    "status": "completed",
    "wordsWritten": "[最终字数]"
  },
  "timestamps": {
    "updatedAt": "[当前时间]"
  }
}
```

## 错误处理

### 如果 tracking 文件不存在

```
⚠️ 警告：tracking 文件不存在
- 文件：[文件路径]
- 建议：运行 `/track --init` 初始化 tracking 文件
- 跳过本次更新
```

### 如果 JSON 格式错误

```
❌ 错误：tracking 文件格式错误
- 文件：[文件路径]
- 错误：[JSON 解析错误信息]
- 建议：手动修复文件格式后重试
- 跳过本次更新
```

### 如果更新失败

```
❌ 错误：更新 tracking 文件失败
- 文件：[文件路径]
- 错误：[写入错误信息]
- 建议：检查文件权限和磁盘空间
- 更新内容已记录到 tracking-log.md，可手动补充
```

## 性能考虑

- **批量更新**: 4 个文件一次性更新，减少 I/O 操作
- **增量写入**: 仅更新变化部分，保留其他内容
- **异步日志**: tracking-log.md 追加操作可异步执行
