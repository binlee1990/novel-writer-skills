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
        // 检测项目：先查新路径，再查旧路径判断是否需要迁移
        const isNewStructure = await fs.pathExists(paths.resourcesConfig);
        const isLegacy = !isNewStructure && await fs.pathExists(paths._legacy_specify);

        if (!isNewStructure && !isLegacy) {
          console.log(chalk.red('❌ 当前目录不是 novel-writer-skills 项目'));
          process.exit(1);
        }

        const configPath = isNewStructure
          ? paths.resourcesConfig
          : path.join(paths._legacy_specify, 'config.json');
        const config = await fs.readJson(configPath);
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
          if (await fs.pathExists(templates.resources)) {
            const scriptsSource = path.join(templates.resources, 'scripts');
            if (await fs.pathExists(scriptsSource)) {
              await fs.ensureDir(paths.resourcesScripts);
              await fs.copy(scriptsSource, paths.resourcesScripts, { overwrite: true });
            }
          }
        }

        // v3→v4 迁移
        if (isLegacy) {
          spinner.text = '检测到 v3 项目结构，执行迁移...';

          // 创建新目录
          await fs.ensureDir(paths.resources);
          await fs.ensureDir(paths.tracking);
          await fs.ensureDir(paths.cache);
          await fs.ensureDir(path.join(paths.resources, 'config'));

          // 移动文件（按设计文档映射表）
          const migrations = [
            { from: path.join(paths._legacy_specify, 'memory'), to: paths.resourcesMemory },
            { from: path.join(paths._legacy_specify, 'templates', 'knowledge-base', 'craft'), to: path.join(paths.resources, 'craft') },
            { from: path.join(paths._legacy_specify, 'templates', 'knowledge-base', 'genres'), to: path.join(paths.resources, 'genres') },
            { from: path.join(paths._legacy_specify, 'templates', 'knowledge-base', 'styles'), to: path.join(paths.resources, 'styles') },
            { from: path.join(paths._legacy_specify, 'templates', 'knowledge-base', 'requirements'), to: path.join(paths.resources, 'requirements') },
            { from: path.join(paths._legacy_specify, 'templates', 'knowledge-base', 'emotional-beats'), to: path.join(paths.resources, 'emotional-beats') },
            { from: path.join(paths._legacy_specify, 'templates', 'knowledge-base', 'character-archetypes'), to: path.join(paths.resources, 'character-archetypes') },
            { from: path.join(paths._legacy_specify, 'templates', 'knowledge-base', 'references'), to: path.join(paths.resources, 'references') },
            { from: path.join(paths._legacy_specify, 'templates', 'config'), to: path.join(paths.resources, 'config') },
            { from: path.join(paths._legacy_specify, 'scripts'), to: paths.resourcesScripts },
            { from: path.join(paths._legacy_spec, 'tracking'), to: paths.tracking },
            { from: path.join(paths._legacy_spec, 'knowledge'), to: paths.resourcesKnowledge },
            { from: path.join(paths._legacy_spec, 'presets'), to: path.join(paths.resources, 'presets') },
          ];

          for (const { from, to } of migrations) {
            if (await fs.pathExists(from)) {
              await fs.move(from, to, { overwrite: true });
            }
          }

          // 迁移 config.json
          const oldConfig = path.join(paths._legacy_specify, 'config.json');
          if (await fs.pathExists(oldConfig)) {
            await fs.ensureDir(path.dirname(paths.resourcesConfig));
            await fs.move(oldConfig, paths.resourcesConfig, { overwrite: true });
          }

          // 清理空旧目录
          for (const dir of [paths._legacy_specify, paths._legacy_spec]) {
            if (await fs.pathExists(dir)) {
              await fs.remove(dir);
            }
          }

          // 清除缓存
          if (await fs.pathExists(paths.cache)) {
            await fs.remove(paths.cache);
            await fs.ensureDir(paths.cache);
          }

          spinner.text = 'v3→v4 迁移完成...';
        }

        config.version = getVersion();
        await fs.writeJson(paths.resourcesConfig, config, { spaces: 2 });

        // 检测 tracking 文件大小，提示迁移
        const MIGRATION_THRESHOLD = 50 * 1024; // 50KB
        const trackingFileNames = [
          'character-state.json',
          'plot-tracker.json',
          'timeline.json',
          'relationships.json',
        ];

        let hasLargeFiles = false;
        for (const file of trackingFileNames) {
          const filePath = path.join(paths.tracking, file);
          if (await fs.pathExists(filePath)) {
            const stat = await fs.stat(filePath);
            if (stat.size > MIGRATION_THRESHOLD) {
              hasLargeFiles = true;
              break;
            }
          }
        }

        spinner.succeed(chalk.green('升级完成！\n'));

        if (hasLargeFiles) {
          console.log(chalk.yellow('⚠️  检测到 tracking 文件较大，建议执行分片迁移以提升性能'));
          console.log(chalk.gray('  运行 /track --migrate 将数据按卷分片存储\n'));
        }

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
