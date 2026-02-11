# Phase 1b：结构性补缺 — 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 补上最影响创作体验的结构性缺口，包括 1 个新命令、4 个命令增强、1 个新知识库、1 个新 Skill

**Architecture:** Phase 1b 在 Phase 1a 基础上进行更深层的结构性改进。核心是新增 `/character` 命令（统一角色管理入口）、增强 `/plan` 的卷级规划能力、增强 `/specify` 的世界观子模式、新增 `hook-checker` Skill。所有改动向后兼容。

**Tech Stack:** Markdown 模板、JSON 配置、Bash/PowerShell 脚本

---

## 计划清单

| # | 任务 | 文件 | 计划文档 |
|---|------|------|---------|
| 8 | `/character` 命令（新增） | `templates/commands/character.md` + JSON schema | [08-character-command.md](./08-character-command.md) |
| 9 | `/plan` 卷级规划能力 | `templates/commands/plan.md` | [09-plan-volume-detail.md](./09-plan-volume-detail.md) |
| 10 | `/plan` 爽点节奏规划和钩子设计 | `templates/commands/plan.md` | [10-plan-satisfaction-hooks.md](./10-plan-satisfaction-hooks.md) |
| 11 | `/specify` 金手指章节 + `--world` 子模式 | `templates/commands/specify.md` | [11-specify-world-mode.md](./11-specify-world-mode.md) |
| 12 | 新增 `power-system.md` 知识库 | `knowledge-base/craft/power-system.md` | [12-power-system-kb.md](./12-power-system-kb.md) |
| 13 | 新增 `hook-checker` Skill | `skills/quality-assurance/hook-checker/` | [13-hook-checker-skill.md](./13-hook-checker-skill.md) |
| 14 | `/analyze --focus=hook` | `templates/commands/analyze.md` | [14-analyze-focus-hook.md](./14-analyze-focus-hook.md) |
| 15 | `/write` 断点续写机制 | `templates/commands/write.md` | [15-write-checkpoint.md](./15-write-checkpoint.md) |

## 依赖关系

```
任务 8（character 命令）  → 独立
任务 9（plan 卷级规划）   → 独立
任务 10（plan 爽点钩子）  → 依赖 Phase 1a 任务 4（hook-design.md）
任务 11（specify --world） → 独立
任务 12（power-system KB） → 独立
任务 13（hook-checker）    → 依赖 Phase 1a 任务 4（hook-design.md）
任务 14（analyze hook）    → 依赖任务 13（hook-checker Skill）
任务 15（write 断点续写）  → 独立
```

## 执行顺序建议

1. 先执行独立项：任务 8、9、11、12、15（可并行）
2. 再执行依赖项：任务 10、13
3. 最后执行：任务 14（依赖任务 13）
