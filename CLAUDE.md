# CLAUDE.md - 项目开发规则

## 核心规则
1. 请始终用简体中文进行对话和回复。
2. 必填项：在每次聊天回复的开头，您必须明确说明“模型名称、模型大小、模型类型及其修订版本（更新日期）”。此规定仅适用于聊天回复，不适用于内联编辑。
3. 系统为Windows，执行命令或者脚本需要适配系统
4. 不要懒惰

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

### Glob 工具使用优化
- Glob 工具**不会自动排除** `node_modules`、`dist`、`.git` 等目录，搜索 `**/*.md` 这类宽泛 pattern 时结果会被淹没
- **优化策略**：
  1. **指定精确的 path 参数**：搜索项目文件时，用 `path` 限定到具体子目录（如 `docs/`、`src/`、`templates/`），避免扫描 `node_modules`
  2. **避免 `**/` 递归通配**：如果目标文件在项目根目录，直接用 `README.md` 而非 `**/README.md`
  3. **优先用 Grep 搜索代码内容**：Grep 工具默认尊重 `.gitignore`，不会搜索 `node_modules`
  4. **已知文件直接 Read**：如果已知文件路径（如 `README.md`、`CHANGELOG.md`），直接用 Read 工具读取，不需要先 Glob 确认存在
- **示例**：
  - ✅ `Glob pattern="README.md" path="D:/repository/cursor/novel-writer-skills"` （只搜根目录）
  - ✅ `Glob pattern="*.md" path="D:/repository/cursor/novel-writer-skills/docs"` （限定子目录）
  - ❌ `Glob pattern="**/README.md"` （会扫描 node_modules，结果被淹没）

### Bash 最小化原则
- **禁止用 Bash 执行文件读写操作**，必须使用专用工具替代：
  - 读取文件：用 `Read` 工具，**禁止** `cat`/`head`/`tail`
  - 编辑文件：用 `Edit` 工具，**禁止** `sed`/`awk`
  - 创建文件：用 `Write` 工具，**禁止** `echo >`/`cat <<EOF`
  - 搜索文件：用 `Grep`/`Glob` 工具，**禁止** `grep`/`find`/`rg`
- Bash **仅限**以下场景使用：
  - `git` 命令（commit、add、status、log 等）
  - `npx jest` / `npm test`（运行测试）
  - `npm` / `npx` 命令（包管理、脚本执行）
  - 其他必须在 shell 中执行的系统命令
- **Subagent / 后台 agent 同样遵守此规则**：在 subagent prompt 中必须明确指出使用 Read/Edit/Write 替代 Bash 文件操作，避免产生不必要的终端确认请求

### Skill Subagent 写文件限制
- **Skill subagent 内禁止写大文件**：当 subagent 上下文已经很长（读取了大量文件）时，生成 Write 工具调用的参数可能被截断为空，导致 `file_path` 和 `content` 缺失报错
- **解决方案**：如果 skill subagent 需要生成大文件（如实现计划），应让 subagent 只返回内容，由主线程执行 Write
- 或者直接在主线程完成文件写入，不委托给 skill subagent
- 如果必须在 subagent 内写文件，确保 subagent 上下文尽量精简，不要预先读取大量无关文件

### 并发编辑规则
- **禁止多个 agent 同时编辑同一文件**：当使用后台 agent 并行处理时，必须确保每个文件只分配给一个 agent
- 如果主线程和后台 agent 都需要编辑同一文件，由 agent 完成后主线程再 Read + Edit
- Edit 前必须 Read，且两次操作之间该文件不能被其他 agent 修改

### 并行任务与共享文件的执行策略
- 当多个任务各自修改不同文件、但都需要修改同一个共享文件（如测试文件）时，**将共享文件的修改从 subagent 中剥离**：
  1. 并行派发 subagent，每个只负责修改各自独立的文件并 git commit
  2. 所有 subagent 完成后，由主线程统一修改共享文件（如一次性添加所有测试用例）
  3. 主线程提交共享文件的修改、运行测试验证
- **禁止**将共享文件分配给某一个 subagent 修改后再让其他 subagent 串行等待
- 这样既保证了并行效率，又避免了文件编辑冲突

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
