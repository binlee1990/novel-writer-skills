/**
 * plugin 系列命令 - 插件管理
 */

import { Command } from '@commander-js/extra-typings';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import ora from 'ora';
import { PluginManager } from '../plugins/manager.js';
import { ensureProjectRoot, getProjectInfo } from '../utils/project.js';
import { getPackageRoot } from '../core/config.js';
import { ProjectNotFoundError } from '../core/errors.js';

export function registerPluginCommands(program: Command): void {
  // plugin 帮助命令
  program
    .command('plugin')
    .description('插件管理 (使用 plugin:list, plugin:add, plugin:remove)')
    .action(() => {
      console.log(chalk.cyan('\n📦 插件管理命令:\n'));
      console.log('  novelws plugin:list              - 列出已安装的插件');
      console.log('  novelws plugin:add <name>        - 安装插件');
      console.log('  novelws plugin:remove <name>     - 移除插件');
      console.log('\n' + chalk.gray('可用插件:'));
      console.log('  authentic-voice   - 真实人声写作插件');
    });

  // plugin:list
  program
    .command('plugin:list')
    .description('列出已安装的插件')
    .action(async () => {
      try {
        const projectPath = await ensureProjectRoot();
        const projectInfo = await getProjectInfo(projectPath);

        if (!projectInfo) {
          console.log(chalk.red('❌ 无法读取项目信息'));
          process.exit(1);
        }

        const pluginManager = new PluginManager(projectPath);
        const plugins = await pluginManager.listPlugins();

        console.log(chalk.cyan('\n📦 已安装的插件\n'));
        console.log(chalk.gray(`项目: ${path.basename(projectPath)}\n`));

        if (plugins.length === 0) {
          console.log(chalk.yellow('暂无插件'));
          console.log(chalk.gray('\n使用 "novelws plugin:add <name>" 安装插件'));
          console.log(chalk.gray('可用插件: authentic-voice\n'));
          return;
        }

        for (const plugin of plugins) {
          console.log(chalk.yellow(`  ${plugin.name}`) + ` (v${plugin.version})`);
          console.log(chalk.gray(`    ${plugin.description}`));

          if (plugin.commands && plugin.commands.length > 0) {
            console.log(chalk.gray(`    命令: ${plugin.commands.map(c => `/${c.id}`).join(', ')}`));
          }

          if (plugin.skills && plugin.skills.length > 0) {
            console.log(chalk.gray(`    Skills: ${plugin.skills.map(s => s.id).join(', ')}`));
          }
          console.log('');
        }
      } catch (error: any) {
        if (error instanceof ProjectNotFoundError) {
          console.log(chalk.red(`\n❌ ${error.message}`));
          console.log(chalk.gray('   请在项目根目录运行此命令\n'));
          process.exit(1);
        }

        console.error(chalk.red('❌ 列出插件失败:'), error);
        process.exit(1);
      }
    });

  // plugin:add
  program
    .command('plugin:add <name>')
    .description('安装插件')
    .action(async (name) => {
      try {
        const projectPath = await ensureProjectRoot();
        const projectInfo = await getProjectInfo(projectPath);

        if (!projectInfo) {
          console.log(chalk.red('❌ 无法读取项目信息'));
          process.exit(1);
        }

        console.log(chalk.cyan('\n📦 NovelWrite 插件安装\n'));
        console.log(chalk.gray(`项目版本: ${projectInfo.version}\n`));

        const packageRoot = getPackageRoot();
        const builtinPluginPath = path.join(packageRoot, 'plugins', name);

        if (!await fs.pathExists(builtinPluginPath)) {
          console.log(chalk.red(`❌ 插件 ${name} 未找到\n`));
          console.log(chalk.gray('可用插件:'));
          console.log(chalk.gray('  - authentic-voice (真实人声插件)'));
          process.exit(1);
        }

        const spinner = ora('正在安装插件...').start();
        const pluginManager = new PluginManager(projectPath);

        await pluginManager.installPlugin(name, builtinPluginPath);
        spinner.succeed(chalk.green('插件安装成功！\n'));
      } catch (error: any) {
        if (error instanceof ProjectNotFoundError) {
          console.log(chalk.red(`\n❌ ${error.message}`));
          console.log(chalk.gray('   请在项目根目录运行此命令\n'));
          process.exit(1);
        }

        console.log(chalk.red('\n❌ 安装插件失败'));
        console.error(chalk.gray(error.message || error));
        console.log('');
        process.exit(1);
      }
    });

  // plugin:remove
  program
    .command('plugin:remove <name>')
    .description('移除插件')
    .action(async (name) => {
      try {
        const projectPath = await ensureProjectRoot();
        const pluginManager = new PluginManager(projectPath);

        console.log(chalk.cyan('\n📦 NovelWrite 插件移除\n'));
        console.log(chalk.gray(`准备移除插件: ${name}\n`));

        const spinner = ora('正在移除插件...').start();
        await pluginManager.removePlugin(name);
        spinner.succeed(chalk.green('插件移除成功！\n'));
      } catch (error: any) {
        if (error instanceof ProjectNotFoundError) {
          console.log(chalk.red(`\n❌ ${error.message}`));
          console.log(chalk.gray('   请在项目根目录运行此命令\n'));
          process.exit(1);
        }

        console.log(chalk.red('\n❌ 移除插件失败'));
        console.error(chalk.gray(error.message || error));
        console.log('');
        process.exit(1);
      }
    });
}
