# 对话一致性分析 Skill（--focus=voice）

**触发条件**：`$ARGUMENTS` 包含 `--focus=voice`

**前置加载**：
- 加载 Skill：`templates/skills/quality-assurance/voice-consistency-checker/SKILL.md`
- 加载 Expert：`templates/skills/quality-assurance/voice-consistency-checker/experts/voice-analyst.md`
- 读取 `tracking/character-state.json` 中所有角色的 `voice` 字段
- 读取所有已写章节内容

**分析流程**：

调用 `voice-consistency-checker` Skill 执行批量对话一致性检查：

1. 逐章提取所有对话及说话者
2. 对每段对话执行六维语言指纹匹配（词汇、句式、语气、口头禅、教育水平、情绪表达）
3. 计算每个角色的对话一致性评分
4. 检测对话风格过度相似的角色对（缺乏区分度）

**输出格式**：

```
🗣️ 对话一致性分析报告
━━━━━━━━━━━━━━━━━━━━

| 角色 | 对话数 | 一致性 | 主要问题 |
|------|--------|--------|---------|
| [主角] | 120 | 9/10 | 无 |
| [角色A] | 45 | 6/10 | 用词偏学术 |
| [角色B] | 38 | 8/10 | 偶尔语气不符 |
| [角色C] | 12 | 4/10 | 缺乏个性，与主角雷同 |

🔴 严重问题：
- [角色C] 的对话风格与 [主角] 高度相似（相似度 85%），缺乏区分度

⚠️ 中度问题：
- [角色A] 在第 12、18、25 章的对话用词偏学术化

💡 建议：
- 为 [角色C] 补充语言指纹：/character voice [角色C]
- 回顾 [角色A] 的对话，降低用词复杂度
```
