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
import {
  getTemplateSourcePaths,
  getProjectPaths,
  DEFAULT_GITIGNORE,
  FILES,
} from '../core/config.js';
import { injectModelToCommands } from '../utils/project.js';

export function registerInitCommand(program: Command): void {
  program
    .command('init')
    .argument('[name]', '小说项目名称')
    .option('--here', '在当前目录初始化')
    .option('--model <name>', '指定命令使用的 AI 模型')
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
          paths.claude,
          paths.commands,
          paths.resources,
          paths.stories,
        ];

        for (const dir of baseDirs) {
          await fs.ensureDir(dir);
        }

        // 创建基础配置文件
        const config = {
          name,
          type: 'novel',
          version: getVersion(),
          created: new Date().toISOString(),
          story: '',
          database: {
            enabled: false,
            host: '127.0.0.1',
            port: 5432,
            dbname: 'postgres',
            user: 'postgres',
            password: 'admin',
            schema: 'novelws',
          },
        };

        await fs.writeJson(paths.resourcesConfig, config, { spaces: 2 });

        // 从 novel-writer-skills 包复制模板文件
        const templates = getTemplateSourcePaths();

        // 复制命令文件
        if (await fs.pathExists(templates.commands)) {
          await fs.copy(templates.commands, paths.commands);
          if (options.model) {
            await injectModelToCommands(paths.commands, options.model);
          }
          spinner.text = '已安装 Slash Commands...';
        }

        // 复制 CLAUDE.md 到 .claude/
        if (await fs.pathExists(templates.dotClaude)) {
          const claudeMdSrc = path.join(templates.dotClaude, 'CLAUDE.md');
          if (await fs.pathExists(claudeMdSrc)) {
            await fs.copy(claudeMdSrc, paths.claudeMd, { overwrite: false });
            spinner.text = '已安装 CLAUDE.md 核心规范...';
          }
        }

        // 复制 resources/ 模板（constitution.md, style-reference.md, anti-ai.md）
        if (await fs.pathExists(templates.resources)) {
          await fs.copy(templates.resources, paths.resources);
          spinner.text = '已安装资源文件...';
        }

        // 复制 scripts/ 模板（DB 工具脚本）
        if (await fs.pathExists(templates.scripts)) {
          await fs.copy(templates.scripts, paths.scripts);
          spinner.text = '已安装 DB 工具脚本...';
        }

        // 复制 dashboard/ 模板（Web 仪表盘静态文件）
        if (await fs.pathExists(templates.dashboard)) {
          await fs.copy(templates.dashboard, paths.dashboard);
          spinner.text = '已安装 Dashboard...';
        }

        // 复制 server/ 后端代码
        if (await fs.pathExists(templates.server)) {
          await fs.copy(templates.server, paths.server);
          spinner.text = '已安装 Dashboard 后端...';

          // 创建 server/package.json（包含运行时依赖）
          const serverPackageJson = {
            name: `${name}-dashboard-server`,
            type: 'module',
            dependencies: {
              express: '^5.2.1',
              'fs-extra': '^11.2.0',
              pg: '^8.18.0',
              'js-yaml': '^4.1.0',
            },
          };
          await fs.writeJson(path.join(paths.server, 'package.json'), serverPackageJson, { spaces: 2 });
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

        console.log('\n' + chalk.yellow('     📝 五命令流水线:'));
        console.log(`     ${chalk.cyan('/specify')}  - 定义故事设定、角色、世界观`);
        console.log(`     ${chalk.cyan('/plan')}     - 生成卷级大纲`);
        console.log(`     ${chalk.cyan('/write')}    - 逐章生成剧情概要`);
        console.log(`     ${chalk.cyan('/expand')}   - 将概要扩写为正文`);
        console.log(`     ${chalk.cyan('/analyze')}  - 质量检查`);

        console.log('\n' + chalk.dim('提示: 斜杠命令在 Claude Code 内部使用，不是在终端中'));

        console.log('\n' + chalk.yellow('     📊 Dashboard 可视化仪表盘:'));
        console.log(`     运行 ${chalk.white('novelws dashboard')} 启动 Web 界面`);

        console.log('\n' + chalk.yellow('     🗄️  DB 增强（可选）:'));
        console.log(`     编辑 ${chalk.white('resources/config.json')} 中的 database 配置`);
        console.log(`     运行 ${chalk.white('pip install -r scripts/requirements.txt')}`);
        console.log(`     运行 ${chalk.white('python scripts/phase_a_init_db.py')} 初始化数据库`);
      } catch (error) {
        spinner.fail(chalk.red('项目初始化失败'));
        console.error(error);
        process.exit(1);
      }
    });
}
