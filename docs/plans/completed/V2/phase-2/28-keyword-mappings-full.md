# Task 28: Keyword Mappings 全面补全

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将 Phase 2 新增的所有知识库注册到 `keyword-mappings.json`，并补全 Phase 1a/1b 中可能遗漏的映射

**依赖:** Task 22-25（新知识库）、Phase 1a Task 4（hook-design.md）、Phase 1a Task 5（xuanhuan.md）、Phase 1b Task 12（power-system.md）

**Architecture:** 在 `templates/knowledge-base/keyword-mappings.json` 中添加/补全关键词映射条目。

**Tech Stack:** JSON

---

### Task 28.1: 注册 Phase 2 新增知识库

**Files:**
- Modify: `templates/knowledge-base/keyword-mappings.json`

**Step 1: 添加 tension-management.md 映射**

```json
{
  "keywords": ["张力", "紧张感", "信息不对称", "时间压力", "两难", "悬念管理", "tension"],
  "resource": "templates/knowledge-base/craft/tension-management.md",
  "description": "张力管理技巧：信息不对称、时间压力、两难选择、期待与意外平衡"
}
```

**Step 2: 添加 urban.md 映射**

```json
{
  "keywords": ["都市", "都市异能", "都市重生", "商战", "职场", "现代都市", "urban"],
  "resource": "templates/knowledge-base/genres/urban.md",
  "description": "都市小说类型知识：都市异能、重生、系统流、商战、职场、现实逻辑约束"
}
```

**Step 3: 添加 game-lit.md 映射**

```json
{
  "keywords": ["游戏", "系统文", "LitRPG", "副本", "技能树", "装备", "数值", "无限流", "game"],
  "resource": "templates/knowledge-base/genres/game-lit.md",
  "description": "游戏/系统文类型知识：LitRPG、数值化叙事、副本设计、技能树、装备系统"
}
```

**Step 4: 添加 rebirth.md 映射**

```json
{
  "keywords": ["重生", "穿越", "穿书", "快穿", "先知", "蝴蝶效应", "rebirth", "transmigration"],
  "resource": "templates/knowledge-base/genres/rebirth.md",
  "description": "重生/穿越框架知识：先知优势管理、蝴蝶效应、前世记忆控制、身份适应"
}
```

---

### Task 28.2: 补全 Phase 1a/1b 知识库映射

**Files:**
- Modify: `templates/knowledge-base/keyword-mappings.json`

**Step 1: 确认 Phase 1a 知识库已注册**

检查以下知识库是否已在 keyword-mappings.json 中：
- `hook-design.md`（Task 4）— 关键词：钩子、hook、章末、悬念、cliffhanger
- `xuanhuan.md`（Task 5）— 关键词：玄幻、修仙、仙侠、境界、灵气

如未注册，添加对应映射。

**Step 2: 确认 Phase 1b 知识库已注册**

检查以下知识库是否已在 keyword-mappings.json 中：
- `power-system.md`（Task 12）— 关键词：力量体系、战力、境界、等级、power system

如未注册，添加对应映射。

---

### Task 28.3: 交叉引用优化

**Files:**
- Modify: `templates/knowledge-base/keyword-mappings.json`

**Step 1: 添加交叉触发规则**

某些关键词应同时触发多个知识库：

| 关键词 | 触发知识库 |
|--------|-----------|
| 「玄幻升级」 | xuanhuan.md + power-system.md |
| 「都市重生」 | urban.md + rebirth.md |
| 「游戏副本」 | game-lit.md + hook-design.md（副本 Boss 战需要钩子设计） |
| 「战斗张力」 | tension-management.md + pacing.md |

**实现方式**：在 keyword-mappings.json 中，为交叉关键词添加多条映射，或在单条映射中引用多个 resource（取决于现有 JSON 结构）。

**Step 2: 检查现有 JSON 结构**

先读取 `keyword-mappings.json` 的当前结构，确认是否支持多 resource 映射。如不支持，为交叉关键词创建多条独立映射。

---

### Task 28.4: 验证与提交

**Step 1: 验证 JSON 格式**

```bash
# 验证 JSON 格式正确
node -e "JSON.parse(require('fs').readFileSync('templates/knowledge-base/keyword-mappings.json', 'utf8')); console.log('JSON valid')"
```

**Step 2: Commit**

```bash
git add templates/knowledge-base/keyword-mappings.json
git commit -m "feat(kb): comprehensive keyword-mappings update — register Phase 2 KBs, verify Phase 1 KBs, add cross-reference triggers"
```
