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

## 项目结构

- 计划文档存放在 `docs/plans/` 下，按阶段分目录
- 已完成的计划在 `docs/plans/completed/`（p0-plans, p1-plans, p2-plans, p3-plans）
- 中期扩展计划在 `docs/plans/mid-term/`
- 远程仓库地址：`https://github.com/binlee1990/novel-writer-skills.git`
