#!/usr/bin/env node

import { Command } from '@commander-js/extra-typings';
import chalk from 'chalk';
import { getVersion, getVersionInfo } from './version.js';
import { registerInitCommand } from './commands/init.js';
import { registerCheckCommand } from './commands/check.js';
import { registerUpgradeCommand } from './commands/upgrade.js';
import { registerDashboardCommand } from './commands/dashboard.js';

// 显示欢迎横幅
function displayBanner(): void {
  const banner = `
╔═══════════════════════════════════════╗
║  📚  Novel Writer Skills  📝          ║
║  Claude Code 专用小说创作工具        ║
╚═══════════════════════════════════════╝
`;
  console.log(chalk.cyan(banner));
  console.log(chalk.gray(`  ${getVersionInfo()}\n`));
}

displayBanner();

const program = new Command();

program
  .name('novelws')
  .description(chalk.cyan('Novel Writer Skills - Claude Code 专用小说创作工具'))
  .version(getVersion(), '-v, --version', '显示版本号')
  .helpOption('-h, --help', '显示帮助信息');

// 注册子命令
registerInitCommand(program);
registerCheckCommand(program);
registerUpgradeCommand(program);
registerDashboardCommand(program);

// 自定义帮助信息
program.on('--help', () => {
  console.log('');
  console.log(chalk.yellow('使用示例:'));
  console.log('');
  console.log('  $ novelws init my-story      # 创建新项目');
  console.log('  $ novelws init --here        # 在当前目录初始化');
  console.log('  $ novelws check              # 检查环境');
  console.log('  $ novelws upgrade            # 升级项目');
  console.log('  $ novelws dashboard          # 启动可视化仪表盘');
  console.log('');
  console.log(chalk.gray('更多信息: https://github.com/binlee1990/novel-writer-skills'));
});

// 解析命令行参数
program.parse(process.argv);

// 如果没有提供任何命令，显示帮助信息
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
