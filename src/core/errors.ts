/**
 * 自定义错误类型层级
 *
 * 所有 NovelWriter 错误继承自 NovelWriterError，
 * CLI 层统一捕获并格式化输出。
 */

export class NovelWriterError extends Error {
  readonly code: string;
  readonly exitCode: number;

  constructor(message: string, code: string, exitCode: number = 1) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.exitCode = exitCode;
  }
}

/** 不在项目目录中 */
export class ProjectNotFoundError extends NovelWriterError {
  constructor(dir?: string) {
    const msg = dir
      ? `目录 "${dir}" 不是 novel-writer-skills 项目`
      : '当前目录不是 novel-writer-skills 项目，请在项目根目录运行此命令';
    super(msg, 'PROJECT_NOT_FOUND');
  }
}

/** 项目已存在 */
export class ProjectExistsError extends NovelWriterError {
  constructor(name: string) {
    super(`项目目录 "${name}" 已存在`, 'PROJECT_EXISTS');
  }
}

/** 网络请求失败 */
export class NetworkError extends NovelWriterError {
  readonly url: string;
  readonly statusCode?: number;

  constructor(url: string, statusCode?: number, reason?: string) {
    const msg = reason
      ? `网络请求失败 (${url}): ${reason}`
      : statusCode
        ? `网络请求失败 (${url}): HTTP ${statusCode}`
        : `网络请求失败 (${url})`;
    super(msg, 'NETWORK_ERROR');
    this.url = url;
    this.statusCode = statusCode;
  }
}

/** 平台不兼容 */
export class PlatformError extends NovelWriterError {
  constructor(message: string) {
    super(message, 'PLATFORM_ERROR');
  }
}

/** 配置文件损坏或缺失 */
export class ConfigError extends NovelWriterError {
  readonly configPath: string;

  constructor(configPath: string, reason?: string) {
    const msg = reason
      ? `配置文件错误 (${configPath}): ${reason}`
      : `配置文件错误: ${configPath}`;
    super(msg, 'CONFIG_ERROR');
    this.configPath = configPath;
  }
}

/** 文件缺失错误（带修复建议） */
export class MissingFileError extends NovelWriterError {
  constructor(filePath: string, suggestion: string) {
    super(
      `文件不存在: ${filePath}\n\n💡 修复建议: ${suggestion}`,
      'MISSING_FILE'
    );
  }
}

/**
 * CLI 全局错误处理
 * 将 NovelWriterError 格式化为用户友好的输出，非预期错误输出堆栈
 */
export function handleError(error: unknown): never {
  if (error instanceof NovelWriterError) {
    console.error(`\n❌ ${error.message}`);
    process.exit(error.exitCode);
  }

  if (error instanceof Error) {
    // Commander.js 的 exitOverride 错误
    if (error.message === '(outputHelp)' || (error as any).exitCode === 0) {
      process.exit(0);
    }
    console.error(`\n❌ 未预期的错误: ${error.message}`);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }

  console.error('\n❌ 未知错误:', error);
  process.exit(1);
}
