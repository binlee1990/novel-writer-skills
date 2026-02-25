/**
 * upgrade 命令 - 升级现有项目到最新版本
 */

import { Command } from '@commander-js/extra-typings';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import ora from 'ora';
import { getVersion } from '../version.js';
import {
  getProjectPaths,
  getTemplateSourcePaths,
} from '../core/config.js';
import { injectModelToCommands } from '../utils/project.js';

export function registerUpgradeCommand(program: Command): void {
  program
    .command('upgrade')
    .option('--commands', '更新命令文件')
    .option('--scripts', '更新 DB 工具脚本')
    .option('--model <name>', '指定命令使用的 AI 模型')
    .option('--all', '更新所有内容')
    .option('-y, --yes', '跳过确认提示')
    .description('升级现有项目到最新版本')
    .action(async (options) => {
      const projectPath = process.cwd();
      const paths = getProjectPaths(projectPath);
      const templates = getTemplateSourcePaths();

      try {
        const isProject = await fs.pathExists(paths.resourcesConfig);

        if (!isProject) {
          console.log(chalk.red('❌ 当前目录不是 novel-writer-skills 项目'));
          process.exit(1);
        }

        const config = await fs.readJson(paths.resourcesConfig);
        const projectVersion = config.version || '未知';

        console.log(chalk.cyan('\n📦 NovelWrite 项目升级\n'));
        console.log(chalk.gray(`当前版本: ${projectVersion}`));
        console.log(chalk.gray(`目标版本: ${getVersion()}\n`));

        const updateCommands = options.all || options.commands || true;

        if (!options.yes) {
          const inquirer = (await import('inquirer')).default;
          const answers = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'proceed',
              message: '确认执行升级?',
              default: true,
            },
          ]);

          if (!answers.proceed) {
            console.log(chalk.yellow('\n升级已取消'));
            process.exit(0);
          }
        }

        const spinner = ora('正在升级项目...').start();

        if (updateCommands) {
          spinner.text = '更新 Slash Commands...';
          if (await fs.pathExists(templates.commands)) {
            await fs.copy(templates.commands, paths.commands, { overwrite: true });
            if (options.model) {
              await injectModelToCommands(paths.commands, options.model);
            }
          }
        }

        // 更新 CLAUDE.md
        spinner.text = '更新 CLAUDE.md...';
        if (await fs.pathExists(templates.dotClaude)) {
          const claudeMdSrc = path.join(templates.dotClaude, 'CLAUDE.md');
          if (await fs.pathExists(claudeMdSrc)) {
            await fs.copy(claudeMdSrc, paths.claudeMd, { overwrite: true });
          }
        }

        // 更新 resources
        spinner.text = '更新资源文件...';
        if (await fs.pathExists(templates.resources)) {
          await fs.copy(templates.resources, paths.resources, { overwrite: true });
        }

        // 更新 scripts
        spinner.text = '更新 DB 工具脚本...';
        if (await fs.pathExists(templates.scripts)) {
          await fs.ensureDir(paths.scripts);
          await fs.copy(templates.scripts, paths.scripts, { overwrite: true });
        }

        config.version = getVersion();

        // 向后兼容：补充新字段
        if (!config.story) {
          config.story = '';
        }
        if (!config.database) {
          config.database = {
            enabled: false,
            host: '127.0.0.1',
            port: 5432,
            dbname: 'postgres',
            user: 'postgres',
            password: '',
            schema: 'novelws',
          };
        }

        await fs.writeJson(paths.resourcesConfig, config, { spaces: 2 });

        spinner.succeed(chalk.green('升级完成！\n'));

        console.log(chalk.cyan('✨ 升级内容:'));
        console.log('  • Slash Commands 已更新');
        console.log('  • CLAUDE.md 已更新');
        console.log('  • 资源文件已更新');
        console.log('  • DB 工具脚本已更新');
        console.log(`  • 版本号: ${projectVersion} → ${getVersion()}`);
      } catch (error) {
        console.error(chalk.red('\n❌ 升级失败:'), error);
        process.exit(1);
      }
    });
}
