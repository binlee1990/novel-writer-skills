import { Command } from '@commander-js/extra-typings';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';

export function registerDashboardCommand(program: Command): void {
  program
    .command('dashboard')
    .description('启动可视化创作仪表盘')
    .option('--port <port>', '服务器端口', '3210')
    .option('--dev', '开发模式（仅启动 API 服务器）')
    .option('--no-open', '不自动打开浏览器')
    .action(async (options) => {
      const projectRoot = process.cwd();

      // 检查是否在 novelws 项目中
      const configPath = path.join(projectRoot, 'resources', 'config.json');
      if (!await fs.pathExists(configPath)) {
        console.error(chalk.red('❌ 当前目录不是 novelws 项目（未找到 resources/config.json）'));
        process.exit(1);
      }

      const port = parseInt(options.port, 10);

      console.log(chalk.cyan('📊 正在启动 Dashboard...'));
      console.log(chalk.gray(`   项目: ${projectRoot}`));
      console.log(chalk.gray(`   端口: ${port}`));
      console.log(chalk.gray(`   模式: ${options.dev ? '开发' : '生产'}`));

      try {
        const { startServer } = await import('../server/index.js');
        await startServer(projectRoot, port);

        if (options.open !== false && !options.dev) {
          const { default: open } = await import('open');
          await open(`http://localhost:${port}`);
        }

        if (options.dev) {
          console.log(chalk.yellow('\n💡 开发模式：请手动启动前端开发服务器'));
          console.log(chalk.white('   cd dashboard && npm run dev'));
        }
      } catch (error) {
        console.error(chalk.red('❌ Dashboard 启动失败:'), error);
        process.exit(1);
      }
    });
}
