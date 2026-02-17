---
name: help-me
description: "通过自然语言描述需求，AI推荐最合适的命令并给出使用示例"
argument-hint: <你的需求描述>
recommended-model: claude-haiku-4-5-20251001 # 命令推荐，速度优先
allowed-tools: Read, Glob
---

# help-me - 自然语言命令查询

## 命令描述

通过自然语言描述需求，AI推荐最合适的命令并给出使用示例。

## 用法

```bash
/help-me <你的需求描述>
```

## 示例

```bash
/help-me 我想修改角色的性格设定
/help-me 怎么检查时间线有没有矛盾
/help-me 查找某个情节
/help-me 分析最近几章的节奏
```

---

## 工作流程

1. 理解用户自然语言需求
2. 匹配到最合适的命令
3. 给出使用示例和相关命令
4. 提供详细文档链接

---

## 场景映射表（50+场景）

### 角色管理

| 用户需求 | 推荐命令 |
|---------|---------|
| 修改角色性格 | /character update <角色名> |
| 查看角色卡片 | /character show <角色名> |
| 创建新角色 | /character create |
| 分析角色对话风格 | /character voice <角色名> |
| 查看角色时间线 | /character timeline <角色名> |
| 查看角色关系 | /character relate <角色名> |

### 情节管理

| 用户需求 | 推荐命令 |
|---------|---------|
| 检查时间线矛盾 | /timeline |
| 查看角色关系图 | /relations |
| 追踪情节线进度 | /track --check |
| 同步追踪数据 | /track --sync |
| 查看创作统计 | /track --stats |

### 内容查询

| 用户需求 | 推荐命令 |
|---------|---------|
| 查找某个情节 | /search <关键词> (需MCP) |
| 生成第X卷摘要 | /volume-summary --volume vol-0X |
| 回顾前情 | /recap --brief |
| 查看某章内容 | 直接打开文件 stories/*/content/ch-XX.md |

### 质量分析

| 用户需求 | 推荐命令 |
|---------|---------|
| 分析节奏 | /analyze --focus=pacing |
| 检查人物对话 | /analyze --focus=voice |
| 检查伏笔 | /analyze --focus=foreshadow |
| 分析最近3章 | /analyze --range ch-10-12 |
| 分析整卷 | /analyze --range vol-01 |
| 检查写作平衡度 | /analyze --focus=balance |

### 修改与完善

| 用户需求 | 推荐命令 |
|---------|---------|
| 修改某章 | /revise <章节> |
| 系统性修改 | /revise --level structure/pacing/consistency/polish |
| 质量检查 | /checklist |

### 系统操作

| 用户需求 | 推荐命令 |
|---------|---------|
| 迁移到大型项目模式 | /track --migrate --target sharded |
| 迁移到MCP模式 | /track --migrate --target mcp |
| 初始化追踪系统 | /track-init |
| 升级项目 | novelws upgrade |

### 专家咨询

| 用户需求 | 推荐命令 |
|---------|---------|
| 角色塑造建议 | /expert character |
| 情节设计建议 | /expert plot |
| 世界观构建建议 | /expert worldbuilding |
| 文笔提升建议 | /expert prose |
| 类型小说建议 | /expert genre |

---

## 输出模板

```markdown
📌 推荐命令：<命令名称>

用法示例：
  <具体命令示例>

这个命令会：
1. <功能点1>
2. <功能点2>
3. <功能点3>

💡 相关命令：
- <相关命令1> - <说明>
- <相关命令2> - <说明>

📖 详细文档：运行 <获取更多帮助的命令>
```

---

## 示例对话

### 示例1：修改角色

```
用户: /help-me 我想修改角色的性格设定

输出:
📌 推荐命令：/character update

用法示例：
  /character update 李明

这个命令会：
1. 读取当前角色卡片（resources/knowledge/characters/李明.md）
2. 让你修改性格、背景、能力等信息
3. 自动更新文件
4. 同步更新 tracking 数据（如已启用）

💡 相关命令：
- /character show 李明 - 查看当前设定
- /track --sync - 同步修改到追踪文件
- /character voice 李明 - 分析角色对话风格

📖 详细文档：运行 /expert character 获取角色塑造专家咨询
```

### 示例2：检查时间线

```
用户: /help-me 怎么检查时间线有没有矛盾

输出:
📌 推荐命令：/timeline

用法示例：
  /timeline

这个命令会：
1. 读取 tracking/timeline.json
2. 可视化时间线（按时间顺序排列所有事件）
3. 自动检测时间冲突（同一时间多个事件）
4. 标记可疑的时间跳跃

💡 相关命令：
- /character timeline <角色名> - 查看某个角色的时间线
- /track --check - 深度健康检查（包括时间线）
- /analyze --focus=logic - 逻辑一致性分析

📖 详细文档：在 CLAUDE.md 中搜索"时间线管理"
```

---

## 模糊匹配

如果用户需求不明确，给出多个选项：

```
用户: /help-me 分析

输出:
🤔 "分析"可能指：

1. 分析章节质量 → /analyze
2. 分析角色对话 → /analyze --focus=voice
3. 分析节奏 → /analyze --focus=pacing
4. 分析故事框架 → /analyze（框架模式）

请提供更多信息，或选择上述命令之一。
```

---

## 实施说明

**For Claude Code**:
- 本命令使用简单的关键词匹配 + 场景映射表
- 不需要复杂的NLP，基于预定义的映射即可
- 重点是覆盖常见场景（50+场景）
- 如果匹配不到，给出相关命令列表供选择

---

## 版本历史

- **v1.0** (2026-02-15): 初始版本，50+场景映射
