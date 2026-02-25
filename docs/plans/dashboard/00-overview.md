# Web Dashboard 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为 novelws CLI 新增 `novelws dashboard` 子命令，启动本地 Web 服务器提供可视化创作仪表盘。

**Architecture:** 嵌入式全栈架构。Vue 3 + Vite 前端构建产物嵌入 npm 包，Express 后端提供 REST API + 静态文件服务。数据源抽象层支持 PostgreSQL 和文件系统双轨切换。

**Tech Stack:** Vue 3, Vite, Element Plus, ECharts, vis-network, Express, pg, TypeScript

**Design Doc:** `docs/plans/2026-02-25-web-dashboard-design.md`

---

## 阶段概览

| 阶段 | 文件 | 任务 | 内容 |
|------|------|------|------|
| P1 | `01-backend-infra.md` | T1-T5 | 后端基础设施（依赖、类型定义、数据源工厂、Express 骨架、健康检查测试） |
| P2a | `02a-fs-datasource.md` | T6 | FsDataSource 故事/卷/章节方法 |
| P2b | `02b-fs-tracking.md` | T7 | FsDataSource tracking 数据方法（角色/关系/时间线/情节） |
| P2c | `02c-db-datasource.md` | T8 | DbDataSource PostgreSQL 完整实现 |
| P3a | `03a-routes-stories.md` | T9 | Stories/Volumes/Chapters API 路由 |
| P3b | `03b-routes-chars-rels.md` | T10-T11 | Characters + Relationships API 路由 |
| P3c | `03c-routes-timeline-plots-stats.md` | T12-T14 | Timeline/Plots/Stats API 路由 + 路由挂载汇总 |
| P4a | `04a-frontend-init.md` | T15 | Vue 3 项目初始化（package.json、Vite、入口） |
| P4b | `04b-frontend-router-api.md` | T16-T18 | Vue Router、API 请求层、占位页面 |
| P4c | `04c-dashboard-view.md` | T19 | DashboardView 仪表盘主页面 |
| P5a | `05a-characters-view.md` | T20 | CharactersView 角色管理页面 |
| P5b | `05b-relationships-view.md` | T21 | RelationshipsView 关系网络页面 |
| P5c | `05c-timeline-view.md` | T22 | TimelineView 时间线页面 |
| P5d | `05d-plots-view.md` | T23 | PlotsView 情节追踪页面 |
| P5e | `05e-chapters-view.md` | T24 | ChaptersView 章节浏览页面 |
| P6 | `06-cli-build.md` | T25-T28 | CLI 子命令、构建脚本、冒烟测试 |

**总计：28 个 Task，16 个计划文件**

## 关键约定

- 后端代码在 `src/server/` 下，随主包 TypeScript 编译
- 前端代码在 `dashboard/` 下，独立 package.json，Vite 构建到 `dist/dashboard/`
- 测试使用 Jest（`node node_modules/jest-cli/bin/jest.js --config jest.config.cjs`）
- 每个 Task 完成后提交一次
- 所有路径使用正斜杠（Windows 兼容）
