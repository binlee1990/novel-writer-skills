import chalk from 'chalk';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

let _currentLevel: LogLevel = 'info';

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[_currentLevel];
}

export const logger = {
  /** 设置日志级别 */
  setLevel(level: LogLevel): void {
    _currentLevel = level;
  },

  /** 获取当前日志级别 */
  getLevel(): LogLevel {
    return _currentLevel;
  },

  info: (message: string, ...args: any[]) => {
    if (shouldLog('info')) {
      console.log(chalk.blue('ℹ'), message, ...args);
    }
  },

  success: (message: string, ...args: any[]) => {
    if (shouldLog('info')) {
      console.log(chalk.green('✓'), message, ...args);
    }
  },

  warn: (message: string, ...args: any[]) => {
    if (shouldLog('warn')) {
      console.log(chalk.yellow('⚠'), message, ...args);
    }
  },

  error: (message: string, ...args: any[]) => {
    if (shouldLog('error')) {
      console.log(chalk.red('✗'), message, ...args);
    }
  },

  debug: (message: string, ...args: any[]) => {
    if (shouldLog('debug') && process.env.DEBUG) {
      console.log(chalk.gray('🐛'), message, ...args);
    }
  },
};
