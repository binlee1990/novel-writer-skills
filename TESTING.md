# 测试说明

本文档说明如何运行 Phase 1 性能优化测试套件。

## 测试文件概览

### 测试用例文档
- `docs/plans/performance-phase1-test-cases.md` - 完整的测试用例文档

### 测试脚本

#### 功能测试
- `test-regex-precompile.sh` - 预编译正则表达式功能测试
- `test-phase1-bash.sh` - Bash 缓存集成测试
- `test-phase1-ps.ps1` - PowerShell 缓存集成测试

#### 边界情况测试
- `test-edge-cases-bash.sh` - Bash 边界情况测试
- `test-edge-cases-ps.ps1` - PowerShell 边界情况测试

#### 兼容性测试
- `test-cross-platform.sh` - Bash 跨平台兼容性测试
- `test-cross-platform.ps1` - PowerShell 跨平台兼容性测试

#### 回归测试
- `test-regression-bash.sh` - Bash 回归测试
- `test-regression-ps.ps1` - PowerShell 回归测试

#### 性能基准测试
- `run-all-benchmarks.sh` - 完整性能基准测试套件
- `bench-preload-cache.sh` - Bash 缓存性能基准
- `bench-ps-cache.ps1` - PowerShell 缓存性能基准

## 快速开始

### 运行所有 Bash 测试

```bash
# 1. 正则表达式测试（需要 jq）
bash test-regex-precompile.sh

# 2. Bash 缓存测试
bash test-phase1-bash.sh

# 3. 边界情况测试
bash test-edge-cases-bash.sh

# 4. 跨平台兼容性测试
bash test-cross-platform.sh

# 5. 回归测试
bash test-regression-bash.sh

# 6. 性能基准测试
bash bench-preload-cache.sh
```

### 运行所有 PowerShell 测试

```powershell
# 1. PowerShell 缓存测试
pwsh test-phase1-ps.ps1

# 2. 边界情况测试
pwsh test-edge-cases-ps.ps1

# 3. 跨平台兼容性测试
pwsh test-cross-platform.ps1

# 4. 回归测试
pwsh test-regression-ps.ps1

# 5. 性能基准测试
pwsh bench-ps-cache.ps1
```

### 运行完整性能基准测试

```bash
bash run-all-benchmarks.sh
```

## 测试要求

### Bash 测试
- Bash 3.2+ 或 4.0+
- 可选: `jq` (用于 JSON 解析测试)

### PowerShell 测试
- PowerShell 5.1+ 或 PowerShell 7+

## 测试结果说明

### 成功标记
- ✅ 测试通过
- ⚠️ 警告（可能是预期的）
- ❌ 测试失败

### 预期性能提升
- Bash: 50x+ (5 文件 × 100 次 stat)
- PowerShell: 10x+ (基准测试), 3x+ (真实场景)

## 测试覆盖率

| 测试类型 | 覆盖率 |
|---------|--------|
| 功能测试 | 100% |
| 性能测试 | 100% |
| 边界测试 | 90% |
| 兼容性测试 | 80% |
| 回归测试 | 100% |

## 常见问题

### Q: Windows 上运行 Bash 测试提示 "command not found"
A: 需要安装 Git Bash 或 WSL (Windows Subsystem for Linux)

### Q: test-regex-precompile.sh 提示 "jq: command not found"
A: 需要安装 jq 工具
- macOS: `brew install jq`
- Linux: `apt-get install jq` 或 `yum install jq`
- Windows: 下载 jq-win64.exe 并添加到 PATH

### Q: PowerShell 测试失败
A: 确保使用 PowerShell 5.1+ 或 PowerShell 7+
- 检查版本: `$PSVersionTable.PSVersion`
- Windows: 使用 `pwsh` 而不是 `powershell`

## 详细文档

完整的测试用例文档请参考: `docs/plans/performance-phase1-test-cases.md`

## 相关文档

- 设计文档: `docs/opt-plans/2026-02-08-performance-optimization-design.md`
- 实施计划: `docs/opt-plans/2026-02-08-performance-optimization-plan.md`
- 测试用例: `docs/plans/performance-phase1-test-cases.md`
