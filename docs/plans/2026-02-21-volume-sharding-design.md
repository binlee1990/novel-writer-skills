# 设计文档：卷级分片架构

> 日期：2026-02-21
> 状态：已批准

## 问题

当前架构为平面结构——所有章节文件和 tracking 数据在同一层级。在超大规模小说（200卷/10000章/3000万字）下：

1. **tracking 文件无界增长** — timeline.json 可达 1MB+，plot-tracker.json 累积 1000+ 伏笔
2. **文件数量爆炸** — 10000 个 synopsis + 10000 个 chapter 文件在同一目录
3. **/write 前序扫描** — 每次扫描 10000 个文件的标题
4. **/expand 上下文浪费** — 从 MB 级 JSON 中提取少量相关条目
5. **跨卷上下文断裂** — AI 无法一次加载足够历史保持一致性

## 方案：卷级分片

以"卷"为分片单元，tracking/content 按卷隔离。

### 目录结构

```
stories/<story>/
├── specification.md
├── creative-plan.md
└── volumes/
    ├── vol-001/
    │   ├── volume-summary.md     # 状态快照（入口条件）
    │   ├── tracking/
    │   │   ├── character-state.json
    │   │   ├── plot-tracker.json
    │   │   ├── relationships.json
    │   │   └── timeline.json
    │   └── content/
    │       ├── chapter-001-synopsis.md
    │       ├── chapter-001.md
    │       └── ...
    ├── vol-002/
    │   ├── volume-summary.md
    │   ├── tracking/
    │   └── content/
    └── ...
```

### volume-summary.md（核心机制）

卷与卷之间的"交接文档"，控制在 500-1000 字：

```markdown
# 第 X 卷 状态快照

## 故事进度
- 已完成章节：第 1-250 章（第 1-5 卷）
- 当前主线：[一句话]

## 活跃角色状态
[最近2卷出场过的角色，每人2-3句]

## 活跃伏笔
[status=planted/hinted 的伏笔列表]

## 关键关系
[当前活跃角色间的关系]

## 待续悬念
[上一卷结尾钩子]
```

### 命令模板变更

#### /plan
- 为每卷分配章节范围（如 vol-001: 第1-50章）

#### /write
- 资源加载改为卷级：
  1. specification.md 摘要（不变）
  2. creative-plan.md 当前卷段落（不变）
  3. **volume-summary.md**（新增）
  4. 前序概要扫描：**只扫描当前卷** content/
  5. 前一章概要全文（路径变更）
- tracking 写入改为 `volumes/vol-XXX/tracking/`
- 检测到章节号超出当前卷范围时，触发卷切换

#### /expand
- 第 3 层资源加载路径改为卷级 tracking
- 第 1 层新增 volume-summary.md

#### /analyze
- tracking 路径改为卷级

### 卷切换流程

当 /write 发现目标章节属于下一卷时：

1. 读取当前卷 tracking/（最终状态）
2. 读取 creative-plan.md（下一卷大纲）
3. 生成下一卷的 volume-summary.md：
   - 从当前卷 tracking 提取活跃角色
   - 提取未解决的伏笔
   - 提取活跃关系
   - 记录上一卷结尾悬念
4. 创建 volumes/vol-XXX+1/ 目录结构
5. 初始化空 tracking 文件
6. 继续生成目标章节概要

### 向后兼容

- 新项目 `novelws init` 直接使用卷级结构
- 旧项目需要 `novelws upgrade` 迁移（未来实现）

### 规模控制效果

| 指标 | 平面结构 (10000章) | 卷级分片 (50章/卷) |
|------|-------------------|-------------------|
| /write 前序扫描 | 10000 文件 | 50 文件 |
| tracking JSON 大小 | 1MB+ | ~10-20KB |
| /expand 加载 tracking | 从 MB 级 JSON 提取 | 从 KB 级 JSON 提取 |
| 跨卷上下文 | 加载全局 tracking | 读 volume-summary (500-1000字) |

### 实施范围

**修改文件**：
- `templates/commands/write.md` — 资源加载路径、卷切换逻辑
- `templates/commands/expand.md` — tracking 加载路径、新增 volume-summary
- `templates/commands/plan.md` — 输出卷级章节范围
- `templates/commands/analyze.md` — tracking 路径
- `src/commands/init.ts` — 新目录结构生成
- `templates/dot-claude/CLAUDE.md` — 更新路径映射

**新增文件**：
- `templates/volume-summary.md` — volume-summary 模板

**修改测试**：
- `tests/integration/init-project.test.ts` — 验证新目录结构
- `tests/integration/template-validation.test.ts` — 验证新模板

**预估工作量**：中大型改动，涉及 6+ 文件修改和 1 个新模板
