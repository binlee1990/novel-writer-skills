# Phase-3 Batch 1 执行计划：多线叙事 / 伏笔增强 / 风格引擎

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 增强三个核心 Skill/命令模板——多线叙事管理（Task 29）、伏笔管理（Task 31）、风格一致性引擎（Task 32），为 Phase-3 高级分析能力奠定基础。

**Architecture:** 本批次全部是 Markdown 模板增强，无 TypeScript 代码变更。每个任务修改 1-2 个模板文件（Skill SKILL.md 或 Command .md），通过集成测试验证文件结构完整性。三个任务完全独立，无交叉文件编辑。

**Tech Stack:** Markdown 模板、JSON schema 定义（文档化）、Jest 集成测试

---

## Task 29: 多线叙事管理系统增强

### Task 29.1: 在 SKILL.md 中添加扩展能力章节

**Files:**
- Modify: `templates/skills/writing-techniques/multi-thread-narrative/SKILL.md`

**Step 1: Write the failing test**

在 `tests/integration/template-validation.test.ts` 中添加测试，验证 multi-thread-narrative SKILL.md 包含扩展能力章节：

```typescript
// 添加到 describe('Skill Templates') 内部
it('should have enhanced multi-thread-narrative skill with extended capabilities', () => {
  const skillFile = path.join(skillsDir, 'writing-techniques', 'multi-thread-narrative', 'SKILL.md');
  const content = fs.readFileSync(skillFile, 'utf-8');
  expect(content).toContain('## 扩展能力');
  expect(content).toContain('视角切换规划');
  expect(content).toContain('信息差追踪');
  expect(content).toContain('叙事线交汇设计');
  expect(content).toContain('narrative-threads.json');
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest --config jest.config.cjs tests/integration/template-validation.test.ts -t "enhanced multi-thread-narrative"`
Expected: FAIL — "expect(received).toContain(expected)" for "扩展能力"

**Step 3: Write the implementation**

在 `templates/skills/writing-techniques/multi-thread-narrative/SKILL.md` 文件末尾（在 `**本Skill版本**: v1.0` 之前）追加以下内容：

```markdown

---

## 扩展能力

### narrative-threads.json 数据结构

多线叙事的追踪数据存储在 `spec/tracking/narrative-threads.json` 中，由 `/track` 运行时生成和更新：

```json
{
  "version": "1.0",
  "threads": [
    {
      "id": "thread-001",
      "name": "[叙事线名称]",
      "type": "main|sub|hidden",
      "pov": "[视角角色]",
      "status": "active|paused|resolved|abandoned",
      "startChapter": 1,
      "lastActiveChapter": 15,
      "chapters": [1, 3, 5, 8, 12, 15],
      "summary": "[叙事线概要]",
      "goal": "[叙事线目标/终点]",
      "currentState": "[当前进展]",
      "informationState": {
        "readerKnows": ["[读者已知信息]"],
        "characterKnows": {
          "[角色A]": ["[角色A已知信息]"],
          "[角色B]": ["[角色B已知信息]"]
        },
        "hiddenFromReader": ["[读者尚不知道的信息]"]
      },
      "intersections": [
        {
          "withThread": "thread-002",
          "chapter": 20,
          "type": "merge|cross|diverge|collision",
          "description": "[交汇描述]"
        }
      ]
    }
  ],
  "povSchedule": [
    {
      "chapter": 1,
      "pov": "[视角角色]",
      "thread": "thread-001"
    }
  ],
  "updatedAt": "[ISO日期]"
}
```

### 扩展 1：视角切换规划

**管理多视角叙事的切换节奏**：

#### 视角切换规则

| 规则 | 说明 |
|------|------|
| 切换频率 | 同一视角至少持续 1 章，建议 2-3 章 |
| 切换时机 | 在当前视角的悬念/钩子处切换（最大化张力） |
| 回归时机 | 切换后 3-5 章内回到原视角（避免读者遗忘） |
| 信息衔接 | 切换后的视角应提供新信息或新视角 |

#### 视角调度表

```
📊 视角调度
━━━━━━━━━━━━━━━━━━━━

| 章节 | 视角 | 叙事线 | 切换理由 |
|------|------|--------|---------|
| 第 1-3 章 | 主角 | 主线 | 开篇建立 |
| 第 4 章 | 角色B | 支线1 | 主线悬念处切换 |
| 第 5-6 章 | 角色B | 支线1 | 展示另一面 |
| 第 7-9 章 | 主角 | 主线 | 回归主线 |
| 第 10 章 | 角色C | 支线2 | 引入新线索 |
| ... | ... | ... | ... |

⚠️ 警告：
- 角色B 视角已 8 章未出现，读者可能遗忘
- 主角视角连续 5 章，考虑切换
```

### 扩展 2：信息差追踪

**追踪不同角色和读者之间的信息差**：

#### 信息差矩阵

```
📊 信息差矩阵
━━━━━━━━━━━━━━━━━━━━

信息：[关键信息描述]

| 知情者 | 状态 | 获知章节 |
|--------|------|---------|
| 读者 | ✅ 已知 | 第 5 章 |
| 主角 | ❌ 未知 | — |
| 角色A | ✅ 已知 | 第 3 章 |
| 角色B | ❌ 未知 | — |

张力类型：戏剧性反讽（读者知道，主角不知道）
预计揭示：第 [N] 章
```

#### 信息差汇总

```
📋 活跃信息差
━━━━━━━━━━━━━━━━━━━━

1. [信息A] — 读者✅ 主角❌ → 戏剧性反讽（持续 [N] 章）
2. [信息B] — 读者❌ 角色A✅ → 悬念（持续 [M] 章）
3. [信息C] — 角色A✅ 角色B❌ → 人际张力（持续 [K] 章）

⚠️ 信息差 #1 已持续 8 章，考虑在近期揭示
```

### 扩展 3：叙事线交汇设计

**规划多条叙事线的交汇时机和方式**：

#### 交汇类型

| 类型 | 描述 | 效果 |
|------|------|------|
| 合流 (merge) | 两条线合为一条 | 信息汇聚，冲突升级 |
| 交叉 (cross) | 两条线短暂交汇后分开 | 信息交换，新线索 |
| 分叉 (diverge) | 一条线分为两条 | 复杂度增加，视角扩展 |
| 碰撞 (collision) | 两条线的角色直接冲突 | 高潮场景 |

#### 交汇规划

```
📊 叙事线交汇规划
━━━━━━━━━━━━━━━━━━━━

主线 ─────────────────────────────────────→
                    ↗ 交叉(第20章)
支线1 ──────────────────────────→ 合流(第35章)
              ↗ 交叉(第15章)
支线2 ────────────────→ 碰撞(第28章)

关键交汇点：
1. 第 15 章：支线2 与主线交叉（角色C 获得关键线索）
2. 第 20 章：支线1 与主线交叉（角色B 与主角相遇）
3. 第 28 章：支线2 与主线碰撞（角色C 与主角冲突）
4. 第 35 章：支线1 合流入主线（角色B 加入主角团队）
```
```

同时更新版本号：`v1.0` → `v2.0`，更新日期为当前日期。

**Step 4: Run test to verify it passes**

Run: `npx jest --config jest.config.cjs tests/integration/template-validation.test.ts -t "enhanced multi-thread-narrative"`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/integration/template-validation.test.ts templates/skills/writing-techniques/multi-thread-narrative/SKILL.md
git commit -m "feat(skill): enhance multi-thread-narrative with POV scheduling, information gap tracking, thread intersection design"
```

---

### Task 29.2: 在 /track 命令中集成 narrative-threads.json 同步

**Files:**
- Modify: `templates/commands/track.md`
- Test: `tests/integration/template-validation.test.ts`

**Step 1: Write the failing test**

```typescript
it('should reference narrative-threads.json in track command', () => {
  const trackFile = path.join(commandsDir, 'track.md');
  const content = fs.readFileSync(trackFile, 'utf-8');
  expect(content).toContain('narrative-threads.json');
  expect(content).toContain('叙事线同步');
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest --config jest.config.cjs tests/integration/template-validation.test.ts -t "narrative-threads.json in track"`
Expected: FAIL

**Step 3: Write the implementation**

在 `templates/commands/track.md` 的「数据来源」部分（约第 53-59 行），在 `- \`spec/tracking/character-state.json\`` 后面添加：

```markdown
- `spec/tracking/narrative-threads.json` - **[新增]** 多线叙事追踪（POV调度、信息差、线程交汇）
```

在「追踪维度」部分（约第 33-39 行），在第 5 项「伏笔管理」后面添加：

```markdown
6. **叙事线管理** - **[新增]** 多线叙事进度、视角调度、信息差
```

在 track.md 的「增强功能」部分（约第 336 行之前），添加新的章节：

```markdown
### 叙事线同步（--check 扩展）

当故事使用多线叙事时（检测到 `narrative-threads.json` 存在或 `specification.md` 中标记了多线结构），`/track` 在章节同步流程中自动提取和更新叙事线数据。

#### 章节同步提取规则

从每个新写章节的内容中提取：

1. **视角角色** → 更新 `povSchedule`（记录本章的 POV 角色和对应线程）
2. **叙事线推进** → 更新对应 thread 的 `chapters` 和 `lastActiveChapter`
3. **信息揭示** → 更新 `informationState`（读者/角色的已知信息变化）
4. **叙事线交汇** → 更新 `intersections`（如本章有多条线交汇）

#### 叙事线健康度检测（--check 内）

```
📊 叙事线健康度
━━━━━━━━━━━━━━━━━━━━

| 叙事线 | 类型 | 最后活跃 | 冷线章数 | 状态 |
|--------|------|---------|---------|------|
| 主线 | main | 第 15 章 | 0 | ✅ 活跃 |
| 支线1 | sub | 第 12 章 | 3 | ⚠️ 注意 |
| 暗线 | hidden | 第 5 章 | 10 | 🔴 危险 |

⚠️ 警告：
- 暗线已 10 章未推进，读者可能遗忘
- 支线1 接近冷线阈值，建议近 2 章内推进

📊 视角分布
━━━━━━━━━━━━━━━━━━━━
主角视角：60%  ████████████░░░░░░░░
角色B视角：25%  █████░░░░░░░░░░░░░░
角色C视角：15%  ███░░░░░░░░░░░░░░░░

📊 活跃信息差：[N] 个
- 最长持续信息差：[描述]（已持续 [M] 章）
```
```

**Step 4: Run test to verify it passes**

Run: `npx jest --config jest.config.cjs tests/integration/template-validation.test.ts -t "narrative-threads.json in track"`
Expected: PASS

**Step 5: Commit**

```bash
git add templates/commands/track.md tests/integration/template-validation.test.ts
git commit -m "feat(track): add narrative-threads.json sync and narrative health detection in --check mode"
```

---

## Task 31: 伏笔管理增强

### Task 31.1: 在 /track 命令中添加伏笔健康度检测

**Files:**
- Modify: `templates/commands/track.md`
- Test: `tests/integration/template-validation.test.ts`

**Important:** 本任务修改 track.md 的不同位置（伏笔相关部分），与 Task 29.2 修改的叙事线部分不冲突。但 **必须在 Task 29.2 commit 之后再执行本任务**，避免同时编辑同一文件。

**Step 1: Write the failing test**

```typescript
it('should have foreshadowing health detection in track command', () => {
  const trackFile = path.join(commandsDir, 'track.md');
  const content = fs.readFileSync(trackFile, 'utf-8');
  expect(content).toContain('伏笔健康度检测');
  expect(content).toContain('伏笔热度');
  expect(content).toContain('伏笔回收');
  expect(content).toContain('伏笔链');
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest --config jest.config.cjs tests/integration/template-validation.test.ts -t "foreshadowing health detection"`
Expected: FAIL

**Step 3: Write the implementation**

在 `templates/commands/track.md` 的「增强功能」部分，在叙事线同步章节之后（Task 29.2 添加的内容之后），添加：

```markdown
### 伏笔健康度检测（--check 扩展）

在 `--check` 模式下，对 `plot-tracker.json` 中的伏笔数据执行健康度检测。

#### 增强后的伏笔数据结构

`plot-tracker.json` 的 foreshadowing 条目支持以下增强字段：

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

#### 检测 1：伏笔热度管理

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

#### 检测 2：伏笔回收时机

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

#### 检测 3：伏笔链完整性

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

**Step 4: Run test to verify it passes**

Run: `npx jest --config jest.config.cjs tests/integration/template-validation.test.ts -t "foreshadowing health detection"`
Expected: PASS

**Step 5: Commit**

```bash
git add templates/commands/track.md tests/integration/template-validation.test.ts
git commit -m "feat(track): add foreshadowing health detection with heat tracking, resolution timing, chain integrity"
```

---

### Task 31.2: 验证 /plan --detail 中的伏笔规划

**Files:**
- Verify: `templates/commands/plan.md`（约第 563-566 行）

**Step 1: 检查现有实现**

读取 `templates/commands/plan.md` 的逐章规划模板，确认「伏笔操作」部分是否已包含：
- 埋设：新伏笔 + 预计回收章节
- 推进：已有伏笔 + 本章推进方式
- 回收：已有伏笔 + 本章回收方式

**Step 2: 判断是否需要修改**

plan.md 第 563-566 行已包含：
```markdown
**伏笔操作**：
- 埋设：[新伏笔描述]（预计第 [M] 章回收）
- 推进：[已有伏笔] → [本章推进方式]
- 回收：[已有伏笔] → [本章回收方式]
```

这已满足 Task 31.3 的要求。如需增强，添加伏笔链关联信息：

```markdown
**伏笔操作**：
- 埋设：[新伏笔描述]（预计第 [M] 章回收）（伏笔链：[链名称]）
- 推进：[已有伏笔] → [本章推进方式]
- 回收：[已有伏笔] → [本章回收方式]（影响：major|moderate|minor）
```

**Step 3: Commit（如有修改）**

```bash
git add templates/commands/plan.md
git commit -m "feat(plan): enhance foreshadowing planning with chain association and impact level"
```

---

## Task 32: 风格一致性引擎增强

### Task 32.1: 在 style-detector SKILL.md 中添加扩展能力

**Files:**
- Modify: `templates/skills/quality-assurance/style-detector/SKILL.md`
- Test: `tests/integration/template-validation.test.ts`

**Step 1: Write the failing test**

```typescript
it('should have enhanced style-detector skill with baseline and drift detection', () => {
  const skillFile = path.join(skillsDir, 'quality-assurance', 'style-detector', 'SKILL.md');
  const content = fs.readFileSync(skillFile, 'utf-8');
  expect(content).toContain('## 扩展能力');
  expect(content).toContain('风格基线建立');
  expect(content).toContain('风格偏移检测');
  expect(content).toContain('跨章节风格一致性评分');
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest --config jest.config.cjs tests/integration/template-validation.test.ts -t "enhanced style-detector"`
Expected: FAIL

**Step 3: Write the implementation**

在 `templates/skills/quality-assurance/style-detector/SKILL.md` 文件末尾（在 `**Skill 版本**` 之前）追加：

```markdown

---

## 扩展能力

### 扩展 1：风格基线建立

**从已写章节中提取风格基线**，作为后续一致性检测的参照。

#### 基线提取维度

| 维度 | 指标 | 提取方法 |
|------|------|---------|
| 句式 | 平均句长、长短句比例、句式多样性 | 统计分析 |
| 词汇 | 常用词频、词汇丰富度、专业术语密度 | 词频统计 |
| 修辞 | 比喻/拟人/排比等修辞手法的使用频率 | 模式识别 |
| 叙述 | 叙述/对话/描写/动作的比例 | 段落分类统计 |
| 节奏 | 段落长度分布、场景切换频率 | 结构分析 |
| 视角 | 叙述人称、视角距离（远/近/内心） | 文本分析 |

#### 基线建立流程

1. 选取「代表性章节」（默认前 5 章，或用户指定）
2. 对每个维度提取数值
3. 计算均值和标准差
4. 生成风格基线报告

#### 基线报告格式

```
📊 风格基线报告
━━━━━━━━━━━━━━━━━━━━
基线来源：第 1-5 章

句式特征：
  平均句长：18 字/句
  长句（>30字）占比：15%
  短句（<10字）占比：25%
  句式多样性：7/10

词汇特征：
  词汇丰富度：6/10
  口语化程度：中高
  专业术语密度：低

叙述构成：
  对话：35%  ████████░░
  描写：25%  ██████░░░░
  叙述：20%  █████░░░░░
  动作：20%  █████░░░░░

修辞频率：
  比喻：每千字 1.2 次
  排比：每千字 0.3 次
  其他：每千字 0.5 次

节奏特征：
  平均段落长度：120 字
  场景切换频率：每章 4-6 次
```

### 扩展 2：风格偏移检测

**将新章节与风格基线对比，检测偏移**：

#### 偏移检测规则

| 偏移程度 | 判定标准 | 级别 |
|---------|---------|------|
| 正常波动 | 在基线 ±1 标准差内 | ✅ |
| 轻微偏移 | 在基线 ±1-2 标准差 | ⚠️ 提示 |
| 显著偏移 | 超出基线 ±2 标准差 | 🔴 警告 |

#### 偏移报告格式

```
📊 风格偏移检测 — 第 [N] 章
━━━━━━━━━━━━━━━━━━━━

| 维度 | 基线值 | 本章值 | 偏移 | 状态 |
|------|--------|--------|------|------|
| 平均句长 | 18字 | 22字 | +22% | ⚠️ 偏长 |
| 对话占比 | 35% | 50% | +43% | 🔴 偏高 |
| 描写占比 | 25% | 10% | -60% | 🔴 偏低 |
| 比喻频率 | 1.2/千字 | 1.0/千字 | -17% | ✅ 正常 |
| 段落长度 | 120字 | 130字 | +8% | ✅ 正常 |

🔴 显著偏移：
- 对话占比从 35% 升至 50%，描写占比从 25% 降至 10%
  可能原因：本章为纯对话场景
  建议：如非刻意为之，增加环境描写和动作描写

⚠️ 轻微偏移：
- 平均句长偏长，可能影响阅读节奏
  建议：适当拆分长句
```

### 扩展 3：跨章节风格一致性评分

**对多章节进行整体风格一致性评估**：

#### 评分维度

```
📊 风格一致性评分（第 1-[N] 章）
━━━━━━━━━━━━━━━━━━━━

句式一致性：████████░░ 8/10
词汇一致性：███████░░░ 7/10
叙述构成  ：██████░░░░ 6/10 ⚠️
修辞风格  ：████████░░ 8/10
节奏一致性：█████████░ 9/10

综合评分：7.6/10

📈 趋势：
第 1-10 章：稳定（基线建立期）
第 11-15 章：轻微偏移（对话增多）
第 16-20 章：回归基线
第 21-25 章：⚠️ 显著偏移（描写风格变化）

💡 建议：
- 第 21-25 章的描写风格与前期不同，检查是否为刻意变化
- 如非刻意，参考第 1-10 章的描写风格进行调整
```

### 与 /analyze --focus=style 的协作

风格基线和偏移检测能力增强了 `/analyze --focus=style` 的分析深度：

```
/analyze --focus=style 触发时：
1. 检查是否存在风格基线 → 如不存在，先建立基线
2. 对目标章节执行偏移检测
3. 生成跨章节一致性评分
4. 综合 style-reference.md（如存在）的对标分析
```
```

同时更新版本号：`v1.1` → `v2.0`，更新日期为当前日期。

**Step 4: Run test to verify it passes**

Run: `npx jest --config jest.config.cjs tests/integration/template-validation.test.ts -t "enhanced style-detector"`
Expected: PASS

**Step 5: Commit**

```bash
git add templates/skills/quality-assurance/style-detector/SKILL.md tests/integration/template-validation.test.ts
git commit -m "feat(skill): enhance style-detector with baseline establishment, drift detection, cross-chapter consistency scoring"
```

---

## 执行顺序总结

由于 Task 29.2 和 Task 31.1 都修改 `track.md`，必须串行执行：

```
执行顺序：
1. Task 29.1 — 修改 multi-thread-narrative/SKILL.md（独立）
2. Task 32.1 — 修改 style-detector/SKILL.md（独立，可与 29.1 并行）
3. Task 29.2 — 修改 track.md（叙事线同步部分）
4. Task 31.1 — 修改 track.md（伏笔健康度部分，依赖 29.2 完成）
5. Task 31.2 — 验证/修改 plan.md（独立）
6. 运行全部测试 — npx jest --config jest.config.cjs
```

**并行安全矩阵**：

| 步骤 | 可并行 | 说明 |
|------|--------|------|
| 29.1 + 32.1 | ✅ | 不同文件 |
| 29.1 + 29.2 | ❌ | 29.2 测试依赖 29.1 的 skill 存在 |
| 29.2 + 31.1 | ❌ | 都修改 track.md |
| 31.1 + 31.2 | ✅ | 不同文件 |
| 32.1 + 31.2 | ✅ | 不同文件 |

---

## 验收标准

1. 所有测试通过：`npx jest --config jest.config.cjs`
2. `multi-thread-narrative/SKILL.md` 包含扩展能力章节（视角切换、信息差、交汇设计）
3. `style-detector/SKILL.md` 包含扩展能力章节（风格基线、偏移检测、一致性评分）
4. `track.md` 包含 narrative-threads.json 同步和伏笔健康度检测
5. `plan.md` 的伏笔操作部分包含链关联信息（如有修改）
6. 所有文件无语法错误，Markdown 格式正确
