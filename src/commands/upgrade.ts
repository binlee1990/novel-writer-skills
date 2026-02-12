/**
 * upgrade 命令 - 升级现有项目到最新版本
 */

import { Command } from '@commander-js/extra-typings';
import chalk from 'chalk';
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
    .option('--skills', '更新 Skills 文件')
    .option('--scripts', '更新脚本文件')
    .option('--model <name>', '指定命令使用的 AI 模型')
    .option('--all', '更新所有内容')
    .option('-y, --yes', '跳过确认提示')
    .description('升级现有项目到最新版本')
    .action(async (options) => {
      const projectPath = process.cwd();
      const paths = getProjectPaths(projectPath);
      const templates = getTemplateSourcePaths();

      try {
        if (!await fs.pathExists(paths.specifyConfig)) {
          console.log(chalk.red('❌ 当前目录不是 novel-writer-skills 项目'));
          process.exit(1);
        }

        const config = await fs.readJson(paths.specifyConfig);
        const projectVersion = config.version || '未知';

        console.log(chalk.cyan('\n📦 NovelWrite 项目升级\n'));
        console.log(chalk.gray(`当前版本: ${projectVersion}`));
        console.log(chalk.gray(`目标版本: ${getVersion()}\n`));

        let updateCommands = options.all || options.commands || false;
        let updateSkills = options.all || options.skills || false;
        let updateScripts = options.all || options.scripts || false;

        if (!updateCommands && !updateSkills && !updateScripts) {
          updateCommands = true;
          updateSkills = true;
          updateScripts = true;
        }

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

        if (updateSkills) {
          spinner.text = '更新 Agent Skills...';
          if (await fs.pathExists(templates.skills)) {
            await fs.copy(templates.skills, paths.skills, { overwrite: true });
          }
        }

        if (updateScripts) {
          spinner.text = '更新脚本文件...';
          if (await fs.pathExists(templates.scripts)) {
            await fs.ensureDir(paths.specifyScripts);
            await fs.copy(templates.scripts, paths.specifyScripts, { overwrite: true });
          }
        }


        config.version = getVersion();
        await fs.writeJson(paths.specifyConfig, config, { spaces: 2 });

        spinner.succeed(chalk.green('升级完成！\n'));

        console.log(chalk.cyan('✨ 升级内容:'));
        if (updateCommands) console.log('  • Slash Commands 已更新');
        if (updateSkills) console.log('  • Agent Skills 已更新');
        if (updateScripts) console.log('  • 脚本文件已更新');
        console.log(`  • 版本号: ${projectVersion} → ${getVersion()}`);
      } catch (error) {
        console.error(chalk.red('\n❌ 升级失败:'), error);
        process.exit(1);
      }
    });
}
