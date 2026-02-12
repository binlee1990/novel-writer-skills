/**
 * init 命令 - 初始化小说项目
 */

import { Command } from '@commander-js/extra-typings';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import ora from 'ora';
import { execSync } from 'child_process';
import { getVersion } from '../version.js';
import { PluginManager } from '../plugins/manager.js';
import {
  getPackageRoot,
  getTemplateSourcePaths,
  getProjectPaths,
  DEFAULT_GITIGNORE,
} from '../core/config.js';
import { injectModelToCommands } from '../utils/project.js';

export function registerInitCommand(program: Command): void {
  program
    .command('init')
    .argument('[name]', '小说项目名称')
    .option('--here', '在当前目录初始化')
    .option('--model <name>', '指定命令使用的 AI 模型')
    .option('--plugins <names>', '预装插件，逗号分隔')
    .option('--no-git', '跳过 Git 初始化')
    .description('初始化一个新的小说项目')
    .action(async (name, options) => {
      const spinner = ora('正在初始化小说项目...').start();

      try {
        // 确定项目路径
        let projectPath: string;
        if (options.here) {
          projectPath = process.cwd();
          name = path.basename(projectPath);
        } else {
          if (!name) {
            spinner.fail('请提供项目名称或使用 --here 参数');
            process.exit(1);
          }
          projectPath = path.join(process.cwd(), name);
          if (await fs.pathExists(projectPath)) {
            spinner.fail(`项目目录 "${name}" 已存在`);
            process.exit(1);
          }
          await fs.ensureDir(projectPath);
        }

        // 创建基础项目结构
        const paths = getProjectPaths(projectPath);
        const baseDirs = [
          paths.specify,
          paths.specifyMemory,
          paths.specifyTemplates,
          paths.claude,
          paths.commands,
          paths.skills,
          paths.stories,
          paths.spec,
          paths.tracking,
          paths.knowledge,
          paths.specifyScripts,
        ];

        for (const dir of baseDirs) {
          await fs.ensureDir(dir);
        }

        // 创建基础配置文件
        const config = {
          name,
          type: 'novel',
          ai: 'claude',
          created: new Date().toISOString(),
          version: getVersion(),
        };

        await fs.writeJson(paths.specifyConfig, config, { spaces: 2 });

        // 从 novel-writer-skills 包复制模板文件
        const templates = getTemplateSourcePaths();

        // 复制命令文件
        if (await fs.pathExists(templates.commands)) {
          await fs.copy(templates.commands, paths.commands);
          // 如果指定了 --model，注入到命令文件 frontmatter
          if (options.model) {
            await injectModelToCommands(paths.commands, options.model);
          }
          spinner.text = '已安装 Slash Commands...';
        }

        // 复制 Skills 文件
        if (await fs.pathExists(templates.skills)) {
          await fs.copy(templates.skills, paths.skills);
          spinner.text = '已安装 Agent Skills...';
        }

        // 复制 CLAUDE.md 到 .claude/
        if (await fs.pathExists(templates.dotClaude)) {
          const claudeMdSrc = path.join(templates.dotClaude, 'CLAUDE.md');
          if (await fs.pathExists(claudeMdSrc)) {
            await fs.copy(claudeMdSrc, paths.claudeMd, { overwrite: false });
            spinner.text = '已安装 CLAUDE.md 核心规范...';
          }
        }

        // 复制模板文件到 .specify/templates（排除 scripts，scripts 单独复制到 .specify/scripts/）
        if (await fs.pathExists(templates.all)) {
          const scriptsDir = path.normalize(templates.scripts);
          await fs.copy(templates.all, paths.specifyTemplates, {
            overwrite: false,
            filter: (src: string) => !path.normalize(src).startsWith(scriptsDir),
          });
        }

        // 复制 memory 文件
        if (await fs.pathExists(templates.memory)) {
          await fs.copy(templates.memory, paths.specifyMemory);
        }

        // 复制追踪文件模板
        if (await fs.pathExists(templates.tracking)) {
          await fs.copy(templates.tracking, paths.tracking);
        }

        // 复制知识库模板（项目特定）
        if (await fs.pathExists(templates.knowledge)) {
          await fs.copy(templates.knowledge, paths.knowledge);
        }

        // 复制脚本文件到 .specify/scripts/
        if (await fs.pathExists(templates.scripts)) {
          await fs.copy(templates.scripts, paths.specifyScripts);
          spinner.text = '已安装脚本文件...';
        }


        // 如果指定了 --plugins，安装插件
        if (options.plugins) {
          spinner.text = '安装插件...';
          const pluginNames = options.plugins.split(',').map((p: string) => p.trim());
          const pluginManager = new PluginManager(projectPath);
          const packageRoot = getPackageRoot();

          for (const pluginName of pluginNames) {
            const builtinPluginPath = path.join(packageRoot, 'plugins', pluginName);
            if (await fs.pathExists(builtinPluginPath)) {
              await pluginManager.installPlugin(pluginName, builtinPluginPath);
            } else {
              console.log(chalk.yellow(`\n警告: 插件 "${pluginName}" 未找到`));
            }
          }
        }

        // Git 初始化
        if (options.git !== false) {
          try {
            execSync('git init', { cwd: projectPath, stdio: 'ignore' });
            await fs.writeFile(path.join(projectPath, '.gitignore'), DEFAULT_GITIGNORE);
            execSync('git add .', { cwd: projectPath, stdio: 'ignore' });
            execSync('git commit -m "初始化小说项目"', { cwd: projectPath, stdio: 'ignore' });
          } catch {
            console.log(chalk.yellow('\n提示: Git 初始化失败，但项目已创建成功'));
          }
        }

        spinner.succeed(chalk.green(`小说项目 "${name}" 创建成功！`));

        // 显示后续步骤
        console.log('\n' + chalk.cyan('接下来:'));
        console.log(chalk.gray('─────────────────────────────'));

        if (!options.here) {
          console.log(`  1. ${chalk.white(`cd ${name}`)} - 进入项目目录`);
        }

        console.log(`  2. ${chalk.white('在 Claude Code 中打开项目')}`);
        console.log(`  3. 使用以下斜杠命令开始创作:`);

        console.log('\n' + chalk.yellow('     📝 七步方法论:'));
        console.log(`     ${chalk.cyan('/constitution')} - 创建创作宪法，定义核心原则`);
        console.log(`     ${chalk.cyan('/specify')}      - 定义故事规格，明确要创造什么`);
        console.log(`     ${chalk.cyan('/clarify')}      - 澄清关键决策点，明确模糊之处`);
        console.log(`     ${chalk.cyan('/plan')}         - 制定技术方案，决定如何创作`);
        console.log(`     ${chalk.cyan('/tasks')}        - 分解执行任务，生成可执行清单`);
        console.log(`     ${chalk.cyan('/write')}        - AI 辅助写作章节内容`);
        console.log(`     ${chalk.cyan('/analyze')}      - 综合验证分析，确保质量一致`);

        console.log('\n' + chalk.yellow('     📊 追踪管理命令:'));
        console.log(`     ${chalk.cyan('/track-init')}  - 初始化追踪系统`);
        console.log(`     ${chalk.cyan('/track')}       - 综合追踪更新`);
        console.log(`     ${chalk.cyan('/checklist')}   - 质量检查清单`);
        console.log(`     ${chalk.cyan('/timeline')}    - 管理故事时间线`);

        console.log('\n' + chalk.gray('Agent Skills 会自动激活，无需手动调用'));
        console.log(chalk.dim('提示: 斜杠命令在 Claude Code 内部使用，不是在终端中'));
      } catch (error) {
        spinner.fail(chalk.red('项目初始化失败'));
        console.error(error);
        process.exit(1);
      }
    });
}
