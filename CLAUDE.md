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
  - ✅ `ls D:/repository/novel-writer-skills/docs/plans/`
  - ❌ `ls "D:\repository\novel-writer-skills\docs\plans\"`
- 路径中包含空格时使用双引号，但避免路径以 `\` 结尾再紧跟 `"`
- **WSL 冲突问题**：`npx` 和 `npm` 命令可能触发 WSL 而非 MSYS bash，导致 `execvpe(/bin/bash) failed` 错误
  - **解决方案**：直接用 `node` 调用 JS 入口，绕过 shell 脚本包装
  - ✅ `node node_modules/jest-cli/bin/jest.js --config jest.config.cjs`
  - ❌ `npx jest --config jest.config.cjs`（可能触发 WSL 错误）
  - 如果 `npx`/`npm` 命令报 WSL 错误，一律改用 `node` 直接调用对应的 JS 入口文件

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

### 测试框架
- 本项目使用 **Jest**（配置文件：`jest.config.cjs`）
- 运行测试（推荐，避免 WSL 问题）：`node node_modules/jest-cli/bin/jest.js --config jest.config.cjs`
- 备选：`npm test`（等价于 `jest --config jest.config.cjs`，但可能触发 WSL 错误）
- **禁止使用 vitest** 运行测试，会因 `describe is not defined` 全部失败
- 单文件测试：`node node_modules/jest-cli/bin/jest.js --config jest.config.cjs <test-file-path>`

## 发布流程

- 发布通过 GitHub Actions 自动完成（`.github/workflows/publish.yml`）
- 触发方式：打 tag 推送
  ```bash
  git tag v5.2.0
  git push origin v5.2.0
  ```
- workflow 会自动：运行测试 → 构建 → 发布到 npm → 创建 GitHub Release
- 也支持手动触发：GitHub Actions 页面 → Publish → Run workflow

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
│   └── CLAUDE.md       # 核心规范
├── resources/          # 资源文件
│   ├── config.json
│   ├── constitution.md
│   ├── style-reference.md
│   └── anti-ai.md
├── scripts/            # DB 工具脚本（可选）
│   ├── requirements.txt
│   ├── phase_a_init_db.py
│   ├── db_sync.py
│   ├── db_context.py
│   └── db_volume_switch.py
├── stories/
│   └── <story>/
│       ├── specification.md
│       ├── creative-plan.md
│       └── volumes/
│           └── vol-XXX/
│               ├── volume-summary.md
│               ├── tracking/
│               │   ├── character-state.json
│               │   ├── plot-tracker.json
│               │   ├── relationships.json
│               │   └── timeline.json
│               └── content/
│                   ├── chapter-YYY-synopsis.md
│                   └── chapter-YYY.md
```
- **关键路径映射**（常见易错项）：
  - tracking 文件在 `stories/<story>/volumes/vol-XXX/tracking/`，不是项目根
  - content 文件在 `stories/<story>/volumes/vol-XXX/content/`，不是 `stories/<story>/content/`
  - resources 在项目根的 `resources/`，不是 `.specify/memory/`
