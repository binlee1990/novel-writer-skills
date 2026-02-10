# Task 31: 伏笔管理增强

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 增强伏笔管理能力：伏笔热度追踪、伏笔链设计、伏笔回收时机建议；增强 `plot-tracker.json` 数据结构

**Architecture:** 在 `plot-tracker.json` 的伏笔数据结构中增加热度、链式关联、回收建议字段。在 `/track` 的 `--check` 模式中增加伏笔健康度检测。

**Tech Stack:** Markdown 模板、JSON 数据

---

### Task 31.1: 增强 plot-tracker.json 伏笔数据结构

**Files:**
- 文档定义（实际文件由 /track 运行时生成/更新）

**Step 1: 定义增强后的伏笔数据结构**

在现有 `plot-tracker.json` 的 foreshadowing 条目中增加字段：

```json
{
  "foreshadowing": [
    {
      "id": "fs-001",
      "content": "[伏笔内容]",
      "plantedChapter": 3,
      "plantedContext": "[埋设时的上下文摘要]",
      "status": "planted|hinted|partially_resolved|resolved|abandoned",
      "urgency": 0.5,

      "heat": {
        "current": 0.6,
        "trend": "rising|stable|cooling",
        "lastMentioned": 12,
        "mentionCount": 3,
        "readerAwareness": "high|medium|low"
      },

      "chain": {
        "parentId": null,
        "childIds": ["fs-003", "fs-005"],
        "relatedIds": ["fs-002"],
        "chainName": "[伏笔链名称，如「身世之谜」]"
      },

      "resolution": {
        "plannedChapter": 25,
        "plannedMethod": "[计划的回收方式]",
        "actualChapter": null,
        "actualMethod": null,
        "impact": "major|moderate|minor"
      },

      "hints": [
        {
          "chapter": 8,
          "content": "[提示内容]",
          "subtlety": "obvious|moderate|subtle"
        }
      ]
    }
  ]
}
```

---

### Task 31.2: 在 /track --check 中添加伏笔健康度检测

**Files:**
- Modify: `templates/commands/track.md`（--check 模式部分）

**Step 1: 添加伏笔健康度检测**

```markdown

#### 伏笔健康度检测

##### 检测 1：伏笔热度管理

```
🔮 伏笔热度状态
━━━━━━━━━━━━━━━━━━━━

| 伏笔 | 热度 | 趋势 | 上次提及 | 状态 |
|------|------|------|---------|------|
| [身世之谜] | 🔥🔥🔥 高 | ↑ 上升 | 第 15 章 | ✅ 健康 |
| [神秘宝物] | 🔥🔥 中 | → 稳定 | 第 12 章 | ✅ 健康 |
| [失踪事件] | 🔥 低 | ↓ 冷却 | 第 5 章 | ⚠️ 需要提示 |
| [预言] | ❄️ 极低 | ↓ 冷却 | 第 2 章 | ❌ 读者可能已遗忘 |

💡 建议：
- [失踪事件]：在近 2 章内添加一个 subtle 提示
- [预言]：在近 1 章内添加一个 obvious 提示，或考虑放弃
```

##### 检测 2：伏笔回收时机

```
⏰ 伏笔回收建议
━━━━━━━━━━━━━━━━━━━━

🔴 紧急回收（紧急度 > 0.8）：
- [身世之谜]：已持续 20 章，读者期待值极高
  建议：在第 [N]-[N+3] 章内回收
  推荐方式：[基于情节的具体建议]

⚠️ 建议回收（紧急度 0.5-0.8）：
- [神秘宝物]：已持续 12 章，热度中等
  建议：在第 [M]-[M+5] 章内回收

✅ 可继续持有（紧急度 < 0.5）：
- [预言]：刚埋设 5 章，可继续持有
```

##### 检测 3：伏笔链完整性

```
🔗 伏笔链检查
━━━━━━━━━━━━━━━━━━━━

伏笔链「身世之谜」：
fs-001（身世暗示）→ fs-003（血脉觉醒）→ fs-005（真相揭示）
状态：fs-001 ✅ 已提示 → fs-003 🔄 进行中 → fs-005 ⏳ 待回收

伏笔链「远古秘密」：
fs-002（古籍线索）→ fs-004（遗迹发现）
状态：fs-002 ✅ 已提示 → fs-004 ⏳ 待回收

⚠️ 孤立伏笔（未关联到任何链）：
- fs-006（[内容]）— 考虑是否需要关联或放弃
```
```

**Step 2: Commit**

```bash
git add templates/commands/track.md
git commit -m "feat(track): add foreshadowing health detection (heat tracking, resolution timing, chain integrity)"
```

---

### Task 31.3: 在 /plan --detail 中集成伏笔规划

**Files:**
- Modify: `templates/commands/plan.md`（卷级详细规划部分）

**Step 1: 在逐章规划模板中强化伏笔操作**

确认 Task 9（`/plan --detail`）中的「伏笔操作」部分已包含：
- 埋设：新伏笔 + 预计回收章节
- 推进：已有伏笔 + 本章推进方式
- 回收：已有伏笔 + 本章回收方式

如已包含则无需修改。如需补充，添加伏笔链关联信息。

**Step 2: Commit（如有修改）**

```bash
git add templates/commands/plan.md
git commit -m "feat(plan): enhance foreshadowing planning with chain association in volume detail mode"
```
