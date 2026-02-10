/**
 * check 命令 - 检查系统环境
 */

import { Command } from '@commander-js/extra-typings';
import chalk from 'chalk';
import { execSync } from 'child_process';

export function registerCheckCommand(program: Command): void {
  program
    .command('check')
    .description('检查系统环境和 Claude Code')
    .action(() => {
      console.log(chalk.cyan('检查系统环境...\n'));

      const checks = [
        { name: 'Node.js', command: 'node --version', installed: false },
        { name: 'Git', command: 'git --version', installed: false },
      ];

      checks.forEach(check => {
        try {
          const version = execSync(check.command, { encoding: 'utf-8' }).trim();
          check.installed = true;
          console.log(chalk.green('✓') + ` ${check.name} 已安装 (${version})`);
        } catch {
          console.log(chalk.yellow('⚠') + ` ${check.name} 未安装`);
        }
      });

      console.log('\n' + chalk.cyan('Claude Code 检测:'));
      console.log(chalk.gray('请确保已安装 Claude Code 并可以正常使用'));
      console.log(chalk.gray('下载地址: https://claude.ai/download'));

      console.log('\n' + chalk.green('环境检查完成！'));
    });
}
