# 小说创作核心原则

> 本文件由 novelws init 生成，包含所有 Slash Command 共享的核心写作规范。
> 修改此文件会影响所有命令的行为。

## 反 AI 写作核心

- **段落结构**：单句成段比例 30%-50%，每段 50-100 字
- **句式**：短句优先（15-25 字），白话替代文绉绉
- **描写**：删除装饰性形容词，一个准确细节胜过三个堆砌
- **禁止**：「然而」「殊不知」「缓缓」「深邃」「仿佛...一般」等 AI 高频词
- **完整规范**：`resources/requirements/anti-ai-v4.md`

## 段落格式规范

- ⛔ 禁止使用"一"、"二"、"三"等数字标记分段
- ✅ 场景转换用两个空行（一个空白行）分隔
- 📖 原因：数字标记破坏阅读沉浸感

## 后置 Tracking 处理

- `/write` 完成后**自动**更新 4 个 tracking 文件（character-state, relationships, plot-tracker, timeline）
- `/analyze` 完成后**询问用户确认**后更新 tracking 文件
- 格式详情：`.claude/skills/auto-tracking/SKILL.md`

## 会话级资源复用

本次对话中已加载的资源知识应复用，避免重复读取文件：

1. **首次加载**：读取资源文件内容，记住已加载的资源列表
2. **后续命令**：检查资源是否在"已加载列表"中
   - ✅ 已加载：直接使用已有知识，不重新读取文件
   - ❌ 未加载：读取文件并添加到"已加载列表"
3. **例外**：用户明确要求"重新加载"时重新读取

## 前文内容加载策略

写作下一章时的前文加载规则：
1. 读取上一章的完整文件
2. 如果 > 1500 字，只保留最后 1000 字（覆盖最后 1-2 个场景）
3. 如果 ≤ 1500 字，保留全部内容
4. 额外读取上一章的标题和开篇第一段

**补充上下文来源**（不依赖前文全文）：
- `creative-plan.md`：章节大纲和情节走向
- `tasks.md`：当前章节具体写作任务
- `tracking/*.json`：角色状态、关系、情节线、时间线

## /compact 使用建议

每写完 2-3 章后，建议执行 `/compact` 压缩对话历史：
- compact 会保留：已加载资源列表、最近章节要点、角色状态概要
- compact 会清除：完整的旧章节文本、工具调用详细日志
- 原因：tracking 系统已捕获关键信息，不依赖对话历史

## 超长篇支撑（分片模式）

当项目章节数超过 100 时，tracking 数据可以从单文件模式迁移到分卷分片模式：

### 目录结构（分片模式）

```
tracking/
├── story-facts.json          # 全局事实库
├── tracking-log.md           # 全局更新日志
├── summary/                  # 全局摘要（跨卷查询入口）
│   ├── characters-summary.json
│   ├── plot-summary.json
│   ├── timeline-summary.json
│   └── volume-summaries.json
├── volumes/                  # 分卷详情
│   ├── vol-01/               # 第 1 卷（如第 1-50 章）
│   │   ├── character-state.json
│   │   ├── plot-tracker.json
│   │   ├── timeline.json
│   │   └── relationships.json
│   ├── vol-02/               # 第 2 卷（如第 51-100 章）
│   │   └── ...
│   └── vol-XX/
└── novel-tracking.db         # SQLite 数据库（MCP 使用，可选）
```

### 数据加载规则

所有命令遵循 **三层 Fallback**：

1. **MCP 查询**（最优，需安装 novelws-mcp）
   - 毫秒级响应
   - 自动聚合统计
   - 支持全文搜索（FTS5）

2. **分片 JSON**（按卷加载，体积可控）
   - 读取 `summary/` 获取全局概览
   - 读取 `volumes/vol-XX/` 获取指定卷详情
   - 性能提升 10x+（相比单文件）

3. **单文件 JSON**（兜底，完全兼容）
   - 向下兼容小型项目（< 100 章）
   - 如果 `volumes/` 不存在，自动使用单文件模式

### 迁移命令

当 `/guide` 提示 tracking 文件过大时，执行以下命令进行分片迁移：

```bash
/track --migrate
```

**迁移流程**：
1. **检查模式**：分析当前 tracking 文件大小
2. **备份数据**：创建时间戳备份（`tracking-backup-YYYYMMDD/`）
3. **自动分片**：
   - 创建 `summary/` 和 `volumes/` 目录
   - 按卷拆分 tracking 数据（默认每卷 50 章）
   - 生成全局摘要文件

**迁移后**：
- 所有命令自动切换到分片模式
- 支持 `--volume vol-XX` 参数进行卷级操作
- 原单文件保留作为备份

### 卷级操作

分片模式下，多数命令支持 `--volume` 参数：

```bash
# 卷级分析
/analyze --volume vol-03

# 卷级回顾
/recap --volume vol-02

# 卷级摘要
/volume-summary vol-03 --export

# 卷级搜索
/search "关键词" --volume vol-01

# 卷级检查
/checklist --volume vol-03
```

### MCP 加速（可选）

**安装 MCP 服务器**（推荐 >300 章项目）：

```bash
# 初始化时启用 MCP
novelws init my-novel --with-mcp

# 或在现有项目中配置
# 编辑 resources/config/config.json，添加：
{
  "mcp": true
}
```

**MCP 优势**：
- 查询速度提升 **100x+**
- 支持中文全文搜索（FTS5）
- 自动聚合统计（卷统计、一致性检查等）
- 跨卷关联查询

**MCP 工具**：
- `query_characters` - 查询角色数据
- `query_plot` - 查询伏笔/情节
- `query_timeline` - 查询时间线
- `query_relationships` - 查询关系网络
- `query_facts` - 查询事实库
- `search_content` - 全文搜索
- `stats_volume` - 卷统计
- `stats_consistency` - 一致性统计

### 新增命令（超长篇专用）

**`/volume-summary vol-XX`**：生成卷级摘要报告
- 章节统计（字数、平均长度、更新频率）
- 角色分析（出场统计、关系变化、弧线进度）
- 情节推进（伏笔铺设/回收、主线进度）
- 质量指标（节奏评分、一致性检查、爽点密度）
- 关键事件时间线

**`/search <关键词>`**：全文搜索引擎
- 搜索章节内容和 tracking 数据
- 支持中文分词（MCP FTS5）
- 支持正则表达式（`--regex`）
- 支持模糊匹配（`--fuzzy`）
- 支持卷级过滤（`--volume vol-XX`）

### 自动激活 Skill

**`long-series-continuity`** skill 在章节数 > 100 时自动激活：

**监控维度**：
1. **角色出场间隔**：提醒久未出场的角色（>50 章）
2. **伏笔到期**：提醒超期伏笔（>200 章）
3. **设定一致性**：检测跨卷设定矛盾
4. **称呼一致性**：监控角色称呼变化合理性

**协作命令**：
- `/write`：实时提醒 + 自动更新 lastSeen
- `/recap`：附加超期伏笔和久未出场角色列表
- `/track --check`：提供跨卷一致性检查

### 性能对比

| 场景 | 单文件模式 | 分片模式 | MCP 模式 | 提升 |
|------|-----------|---------|---------|------|
| 加载 1000 章 tracking | ~2000ms | ~200ms | ~50ms | **40x** |
| 搜索关键词 | ~5000ms | ~500ms | ~10ms | **500x** |
| 卷级摘要生成 | ~8000ms | ~800ms | ~100ms | **80x** |
| 伏笔查询（紧急度筛选） | ~3000ms | ~300ms | ~5ms | **600x** |

### 最佳实践

1. **章节数 < 100**：使用单文件模式（默认），无需迁移
2. **章节数 100-300**：执行 `/track --migrate`，启用分片模式
3. **章节数 > 300**：安装 MCP 服务器（`--with-mcp`），获得最佳性能
4. **定期维护**：
   - 每写完一卷后执行 `/volume-summary`
   - 每 50 章执行 `/track --check` 深度检查
   - 使用 `/search` 快速定位历史内容
