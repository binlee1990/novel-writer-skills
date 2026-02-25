# Web Dashboard 设计文档

> 日期：2026-02-25
> 状态：已批准

## 1. 概述

为 novelws CLI 工具新增 `novelws dashboard` 子命令，启动本地 Web 服务器，提供可视化创作仪表盘。作者可在浏览器中查看创作进度、角色关系、时间线、情节追踪等信息。

### 目标用户
小说作者本人，本地使用。

### 核心目标
- 创作进度可视化（字数、章节、卷进度）
- 角色与关系网络可视化
- 时间线与情节追踪
- 伏笔埋设/回收矩阵
- 参考星月写作、Sudowrite 等产品的核心能力

### 非目标（第一版）
- AI 辅助创作交互（后续迭代）
- 多人协作
- 云端部署

## 2. 架构方案：嵌入式全栈

### 技术栈
- 前端：Vue 3 + Vite + Element Plus + ECharts + vis-network
- 后端：Express + pg（PostgreSQL 客户端）
- 数据源：PostgreSQL 数据库 + 文件系统双轨支持

### 工作流程
1. `novelws dashboard` → 启动 Express 服务器（默认端口 3210）
2. Express 同时提供 REST API 和静态文件服务（`dist/dashboard/`）
3. 数据源工厂读取项目 `resources/config.json`，自动选择 DB 或文件系统
4. 开发时：Vite dev server（5173）代理 API 到 Express（3210）

### 目录结构

```
novel-writer-skills/
├── src/
│   ├── commands/
│   │   └── dashboard.ts          # 新增子命令入口
│   └── server/
│       ├── index.ts              # Express 服务器启动
│       ├── routes/
│       │   ├── stories.ts        # 故事/卷/章节 API
│       │   ├── characters.ts     # 角色与状态 API
│       │   ├── relationships.ts  # 关系网络 API
│       │   ├── timeline.ts       # 时间线 API
│       │   ├── plots.ts          # 情节线与伏笔 API
│       │   └── stats.ts          # 统计数据 API
│       └── datasource/
│           ├── index.ts          # 数据源工厂（自动检测 DB/文件）
│           ├── db.ts             # PostgreSQL 数据源
│           └── fs.ts             # 文件系统数据源
├── dashboard/                    # Vue 3 前端项目
│   ├── package.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── App.vue
│       ├── main.ts
│       ├── router/
│       ├── views/                # 页面组件
│       ├── components/           # 通用组件
│       ├── composables/          # 组合式函数
│       └── api/                  # API 调用层
└── dist/
    └── dashboard/                # 构建产物（发布时嵌入）
```

## 3. 后端 API 设计

```
GET /api/stories                    # 故事列表
GET /api/stories/:story/overview    # 故事总览（卷数、章数、总字数、进度）

GET /api/stories/:story/volumes              # 卷列表（含进度百分比）
GET /api/stories/:story/volumes/:vol/stats   # 单卷统计

GET /api/stories/:story/chapters             # 章节列表（支持 ?vol=X 过滤）
GET /api/stories/:story/chapters/:ch         # 单章详情

GET /api/stories/:story/characters                # 角色列表（支持 ?vol=X 过滤）
GET /api/stories/:story/characters/:name/arc      # 角色弧线（跨卷状态变化）

GET /api/stories/:story/relationships             # 关系网络（节点+边）
GET /api/stories/:story/relationships/history      # 关系变迁时间线

GET /api/stories/:story/timeline              # 时间线事件列表（支持 ?vol=X）

GET /api/stories/:story/plots                 # 情节线列表
GET /api/stories/:story/foreshadowing         # 伏笔列表
GET /api/stories/:story/foreshadowing/matrix  # 伏笔×章节矩阵

GET /api/stats/dashboard                      # 仪表盘聚合数据
```

## 4. 数据源抽象层

```typescript
interface DataSource {
  getStories(): Promise<Story[]>
  getOverview(story: string): Promise<StoryOverview>
  getVolumes(story: string): Promise<Volume[]>
  getChapters(story: string, vol?: number): Promise<Chapter[]>
  getCharacters(story: string, vol?: number): Promise<Character[]>
  getCharacterArc(story: string, name: string): Promise<CharacterState[]>
  getRelationships(story: string, vol?: number): Promise<RelationshipGraph>
  getRelationshipHistory(story: string): Promise<RelationshipEvent[]>
  getTimeline(story: string, vol?: number): Promise<TimelineEvent[]>
  getPlotThreads(story: string): Promise<PlotThread[]>
  getForeshadowing(story: string): Promise<Foreshadow[]>
  getForeshadowingMatrix(story: string): Promise<ForeshadowMatrix>
  getDashboardStats(story: string): Promise<DashboardStats>
}
```

### 双轨切换逻辑
1. 读取 `resources/config.json` 中的 `database.enabled`
2. `true` → 尝试连接 PostgreSQL，失败则降级到文件系统并警告
3. `false` → 直接使用文件系统数据源

### 文件系统数据源限制
- 无跨卷聚合统计
- 关系历史、伏笔矩阵等高级功能不可用
- 前端显示"启用数据库以解锁此功能"提示

## 5. 前端页面设计

### 5.1 仪表盘 (/)
- 创作进度总览卡片（总字数、章节完成率、当前卷进度）
- 每日/每周字数趋势图（折线图）
- 各卷完成度对比（柱状图）
- 最近更新章节列表

### 5.2 角色管理 (/characters)
- 角色卡片网格（名字、身份、修为、阵营、状态标签）
- 角色详情面板（基础信息、跨卷状态时间轴、关联关系）
- 筛选：按卷、按阵营、按状态

### 5.3 关系网络 (/relationships)
- 力导向图（节点=角色，边=关系）
- 节点大小按出场频率，颜色按阵营
- 边颜色按关系类型（盟友/敌对/师徒/恋人等）
- 关系变迁回放（按章节滑动）
- 筛选：按卷、按关系类型

### 5.4 时间线 (/timeline)
- 横向时间轴（按故事内时间排列）
- 事件节点（颜色按类型/重要度）
- 点击展开事件详情
- 筛选：按卷、按位置、按角色

### 5.5 情节追踪 (/plots)
- 情节线看板（Kanban 风格，按状态分列）
- 伏笔矩阵（横轴=章节，纵轴=伏笔，标记埋设/暗示/回收）
- 伏笔健康度指标（未回收数、平均回收跨度）

### 5.6 章节浏览 (/chapters)
- 卷→章节树形导航
- 章节卡片（字数、POV角色、参与角色）
- 章节概要预览
- 字数分布热力图

### 可视化技术选型
- 图表：ECharts
- 关系网络图：vis-network
- UI 组件库：Element Plus

## 6. 构建与发布

### 新增依赖

主包（src/server/）：
- `express` — HTTP 服务器
- `pg` — PostgreSQL 客户端
- `open` — 自动打开浏览器

dashboard/ 子目录：
- `vue` + `vue-router`
- `element-plus`
- `echarts` + `vue-echarts`
- `vis-network`
- `axios`

### 构建流程

```bash
# 开发模式
novelws dashboard --dev    # 启动 API 服务器
cd dashboard && npm run dev  # 手动启动 Vite

# 生产构建
npm run build:dashboard    # vite build → dist/dashboard/

# 用户使用
novelws dashboard          # 启动服务器 + 自动打开浏览器
```

### CLI 命令

```bash
novelws dashboard              # 默认端口 3210
novelws dashboard --port 8080  # 自定义端口
novelws dashboard --dev        # 开发模式
novelws dashboard --no-open    # 不自动打开浏览器
```

### 发布集成

GitHub Actions workflow 增加 dashboard 构建步骤：
```yaml
- name: Build Dashboard
  run: cd dashboard && npm ci && npm run build
```

`.npmignore` 排除 `dashboard/src/`，保留 `dist/dashboard/`。

## 7. 后续迭代方向

- AI 辅助创作交互（调用 LLM API 实现续写/扩写/润色）
- 创意工具箱（书名生成、人设生成、开篇生成等，参考星月写作）
- 提示词库管理
- 章节内容在线编辑
- 数据导出（PDF/Word 报告）
