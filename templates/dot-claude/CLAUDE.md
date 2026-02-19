# 小说创作核心规范

> 本文件由 novelws init 生成，定义五命令流水线的共享规范。

## 核心规则
1. 请始终用简体中文进行对话和回复。
2. 必填项：在每次聊天回复的开头，您必须明确说明“模型名称、模型大小、模型类型及其修订版本（更新日期）”。此规定仅适用于聊天回复，不适用于内联编辑。
3. 系统为Windows，执行命令或者脚本需要适配系统
4. 不要懒惰

## 五命令流水线

```
/specify → /plan → /write → /expand → /analyze
```

| 命令 | 职责 |
|------|------|
| /specify | 定义故事设定、角色、世界观 |
| /plan | 生成卷级大纲 |
| /write | 逐章生成 200-500 字剧情概要 + tracking |
| /expand | 将概要扩写为 3000-5000 字正文 |
| /analyze | 质量检查（概要符合度、角色一致性、伏笔、连贯性、AI味） |

## 段落格式规范

- ⛔ 禁止使用"一"、"二"、"三"等数字标记分段
- ✅ 场景转换用两个空行（一个空白行）分隔

## 资源文件

| 文件 | 用途 | 加载阶段 |
|------|------|---------|
| resources/constitution.md | 创作宪法 | /specify |
| resources/style-reference.md | 风格参考 | /expand |
| resources/anti-ai.md | 反AI规范 | /expand |

## Tracking 文件

| 文件 | 用途 |
|------|------|
| tracking/character-state.json | 角色状态（role, status, location, state, lastAppearance） |
| tracking/relationships.json | 角色关系（from, to, type, note, lastUpdate） |
| tracking/plot-tracker.json | 情节线和伏笔（plotlines, foreshadowing） |
| tracking/timeline.json | 时间线（chapter, time, event） |

- /write 完成后自动更新 tracking 骨架
- /expand 完成后补充 tracking 细节

## 会话级资源复用

不同命令的资源复用策略不同：

**可复用命令**（/specify、/plan、/write）：
1. **首次加载**：读取资源文件内容，记住已加载的资源列表
2. **后续命令**：检查资源是否在"已加载列表"中
   - ✅ 已加载：直接使用已有知识，不重新读取文件
   - ❌ 未加载：读取文件并添加到"已加载列表"

**强制重载命令**（/expand、/analyze）：
- 必须从文件系统重新加载所有资源，不复用对话中的缓存
- 忽略对话历史中其他命令的生成过程和中间记忆
- 以文件系统中的数据为唯一真实来源

**例外**：用户明确要求"重新加载"时，任何命令都重新读取
