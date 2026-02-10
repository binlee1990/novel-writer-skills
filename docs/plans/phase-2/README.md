# Phase 2：体验提升 — 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 让工具用起来更顺畅 — 1 个新命令 + 多项增强 + 4 个新知识库 + 2 个 Skill 增强 + 配置更新

**Architecture:** Phase 2 在 Phase 1a/1b 基础上进行体验层面的优化。核心是新增 `/guide` 智能引导命令、补全 4 个知识库（tension-management、urban、game-lit、rebirth）、增强 2 个 Skill（pacing-control、reader-expectation）、增加批量操作和命令衔接。

**Tech Stack:** Markdown 模板、JSON 配置

---

## 计划清单

| # | 任务 | 涉及文件 | 计划文档 |
|---|------|---------|---------|
| 16 | `/guide` 智能引导命令（新增） | `templates/commands/guide.md` | [16-guide-command.md](./16-guide-command.md) |
| 17 | `/analyze --focus=power` 力量体系一致性 | `analyze.md` + `consistency-checker` Skill | [17-analyze-focus-power.md](./17-analyze-focus-power.md) |
| 18 | `/plan` 网文结构模板 | `plan.md` | [18-plan-webnovel-templates.md](./18-plan-webnovel-templates.md) |
| 19 | `/track --check` 节奏健康度检测 | `track.md` | [19-track-rhythm-health.md](./19-track-rhythm-health.md) |
| 20 | 批量操作支持 | `plan.md`, `analyze.md`, `track.md` | [20-batch-operations.md](./20-batch-operations.md) |
| 21 | 命令间自动衔接提示 | 各命令文件 | [21-command-chaining-hints.md](./21-command-chaining-hints.md) |
| 22 | 新增 `tension-management.md` 知识库 | `knowledge-base/craft/` | [22-tension-management-kb.md](./22-tension-management-kb.md) |
| 23 | 新增 `urban.md` 知识库 | `knowledge-base/genres/` | [23-urban-kb.md](./23-urban-kb.md) |
| 24 | 新增 `game-lit.md` 知识库 | `knowledge-base/genres/` | [24-game-lit-kb.md](./24-game-lit-kb.md) |
| 25 | 新增 `rebirth.md` 知识库 | `knowledge-base/genres/` | [25-rebirth-kb.md](./25-rebirth-kb.md) |
| 26 | 增强 `pacing-control` Skill | `skills/writing-techniques/pacing-control/` | [26-pacing-control-enhance.md](./26-pacing-control-enhance.md) |
| 27 | 增强 `reader-expectation` Skill | `skills/writing-techniques/reader-expectation/` | [27-reader-expectation-enhance.md](./27-reader-expectation-enhance.md) |
| 28 | Keyword Mappings 全面补全 | `config/keyword-mappings.json` | [28-keyword-mappings-full.md](./28-keyword-mappings-full.md) |

## 依赖关系

```
任务 16（/guide）         → 独立（但建议在所有命令增强后实施，以便引导内容完整）
任务 17（analyze power）  → 依赖 Phase 1b 任务 12（power-system.md）
任务 18（plan 网文模板）  → 独立
任务 19（track 节奏检测） → 依赖 Phase 1b 任务 10（plan 爽点规划）
任务 20（批量操作）       → 依赖任务 18、19（需要先有单项功能）
任务 21（衔接提示）       → 依赖任务 16（/guide 命令提供推荐逻辑）
任务 22-25（知识库）      → 独立（可并行）
任务 26（pacing Skill）   → 独立
任务 27（reader Skill）   → 依赖 Phase 1a 任务 6（analyze --focus=reader）
任务 28（keyword 补全）   → 依赖任务 22-25（新知识库需要注册）
```

## 执行顺序建议

1. **第一批（独立项，可并行）**：任务 18、22、23、24、25、26
2. **第二批（轻依赖）**：任务 17、19、27
3. **第三批（组合依赖）**：任务 20、28
4. **第四批（全局依赖）**：任务 16、21
