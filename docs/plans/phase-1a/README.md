# Phase 1a：最小可用增量 — 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 用最小改动量获得最大体验提升，快速交付 7 项核心改进

**Architecture:** Phase 1a 聚焦于现有文件的增量修改和少量新文件创建。主要涉及 3 个命令模板修改（write.md, recap.md, analyze.md）、2 个新知识库文件、1 个 Skill 增强、1 个配置更新。所有改动向后兼容，不影响现有项目。

**Tech Stack:** Markdown 模板、JSON 配置、Bash/PowerShell 脚本

---

## 计划清单

| # | 任务 | 文件 | 计划文档 |
|---|------|------|---------|
| 1 | `/write --fast` 快写模式 | `templates/commands/write.md` | [01-write-fast-mode.md](./01-write-fast-mode.md) |
| 2 | `/write` 反 AI 规范数据外置 | `write.md` + `anti-ai-v4.md` | [02-write-anti-ai-externalize.md](./02-write-anti-ai-externalize.md) |
| 3 | `/recap` 预测性提示 | `templates/commands/recap.md` | [03-recap-predictive-hints.md](./03-recap-predictive-hints.md) |
| 4 | 新增 `hook-design.md` 知识库 | `knowledge-base/craft/hook-design.md` | [04-hook-design-kb.md](./04-hook-design-kb.md) |
| 5 | 新增 `xuanhuan.md` 知识库 | `knowledge-base/genres/xuanhuan.md` | [05-xuanhuan-kb.md](./05-xuanhuan-kb.md) |
| 6 | `/analyze --focus=reader` | `analyze.md` + `reader-expectation/SKILL.md` | [06-analyze-focus-reader.md](./06-analyze-focus-reader.md) |
| 7 | Keyword Mappings 补全 | `config/keyword-mappings.json` | [07-keyword-mappings-expand.md](./07-keyword-mappings-expand.md) |

## 依赖关系

```
任务 1（快写模式）    → 独立
任务 2（反AI外置）    → 独立
任务 3（预测性提示）  → 独立
任务 4（hook-design） → 独立
任务 5（xuanhuan）    → 独立
任务 6（analyze reader）→ 独立（但建议在任务 4 之后，可引用 hook-design.md）
任务 7（keyword映射） → 建议最后执行（需要知道所有新增文件的路径）
```

## 执行顺序建议

1. 先执行独立的知识库创建（任务 4、5）
2. 再执行命令模板修改（任务 1、2、3、6）
3. 最后执行配置更新（任务 7）
