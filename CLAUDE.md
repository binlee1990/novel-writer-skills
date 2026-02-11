# CLAUDE.md - 项目开发规则

## 工具使用规则

### Write 工具
- 调用 Write 工具时，`file_path` 和 `content` 两个参数都是**必填项**，缺一不可
- 永远不要在没有准备好完整内容的情况下调用 Write
- 如果内容较长，也必须一次性提供完整的 content 参数

### Bash 工具（Windows 环境）
- 本项目运行在 **Windows** 平台上，Bash 通过兼容层执行
- Windows 路径末尾的反斜杠 `\` 会与引号冲突，使用正斜杠 `/` 代替
  - ✅ `ls D:/repository/cursor/novel-writer-skills/docs/plans/`
  - ❌ `ls "D:\repository\cursor\novel-writer-skills\docs\plans\"`
- 路径中包含空格时使用双引号，但避免路径以 `\` 结尾再紧跟 `"`

### 并发编辑规则
- **禁止多个 agent 同时编辑同一文件**：当使用后台 agent 并行处理时，必须确保每个文件只分配给一个 agent
- 如果主线程和后台 agent 都需要编辑同一文件，由 agent 完成后主线程再 Read + Edit
- Edit 前必须 Read，且两次操作之间该文件不能被其他 agent 修改

### 测试框架
- 本项目使用 **Jest**（配置文件：`jest.config.cjs`）
- 运行测试：`npm test`（等价于 `jest --config jest.config.cjs`）
- **禁止使用 vitest** 运行测试，会因 `describe is not defined` 全部失败
- 单文件测试：`npx jest --config jest.config.cjs <test-file-path>`

## 项目结构

- 计划文档存放在 `docs/plans/` 下，按阶段分目录
- 已完成的计划在 `docs/plans/completed/`（p0-plans, p1-plans, p2-plans, p3-plans）
- 中期扩展计划在 `docs/plans/mid-term/`
- 远程仓库地址：`https://github.com/binlee1990/novel-writer-skills.git`

### 生成项目的目录结构
- `novelws init` 生成的项目结构如下，`templates/commands/*.md` 中引用的路径必须与此一致：
```
my-novel/
├── .claude/
│   ├── commands/       # Slash Commands
│   └── skills/         # Agent Skills
├── .specify/
│   ├── memory/         # constitution.md, style-reference.md 等
│   ├── scripts/        # bash/, powershell/ 脚本
│   └── templates/
│       ├── commands/
│       ├── knowledge-base/   # craft/, genres/, requirements/, styles/
│       ├── skills/           # writing-techniques/, quality-assurance/, genre-knowledge/
│       └── config/           # keyword-mappings.json
├── stories/
│   └── <story>/
│       ├── specification.md
│       ├── creative-plan.md
│       ├── tasks.md
│       └── content/
├── spec/
│   ├── tracking/       # plot-tracker.json, timeline.json, character-state.json 等
│   └── knowledge/      # characters/, worldbuilding/, references/
└── plugins/
```
- **关键路径映射**（常见易错项）：
  - `memory/` → `.specify/memory/`
  - `templates/knowledge-base/` → `.specify/templates/knowledge-base/`
  - `templates/skills/` → `.specify/templates/skills/`
  - `templates/config/` → `.specify/templates/config/`
  - `scripts/bash/` → `.specify/scripts/bash/`
  - tracking 文件在项目根的 `spec/tracking/`，不是 `stories/*/spec/tracking/`
