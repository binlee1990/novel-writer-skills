/**
 * 插件管理器
 *
 * 协调层：安装器选择 → 安装 → 验证 → 注册 → 注入。
 * 注册表管理已拆到 registry.ts，安装器已拆到 installers/。
 *
 * Bug 修复:
 * - removePlugin() 现在会清理注入的命令文件
 * - installPlugin() 统一更新注册表
 */

import fs from 'fs-extra';
import path from 'path';
import { logger } from '../utils/logger.js';
import { PluginConfig, PluginMetadata } from './types.js';
import { parsePluginIdentifier } from './identifier.js';
import { NpmInstaller } from './installers/npm.js';
import { GitHubInstaller } from './installers/github.js';
import { LocalInstaller } from './installers/local.js';
import { PluginValidator } from './validator.js';
import { PluginRegistry } from './registry.js';
import { getProjectPaths } from '../core/config.js';
import {
  PluginNotFoundError,
  PluginAlreadyInstalledError,
  PluginValidationError,
  PluginInstallError,
} from '../core/errors.js';

export class PluginManager {
  private projectRoot: string;
  private pluginsDir: string;
  private commandsDir: string;
  private skillsDir: string;
  private registry: PluginRegistry;
  private npmInstaller: NpmInstaller;
  private githubInstaller: GitHubInstaller;
  private localInstaller: LocalInstaller;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    const paths = getProjectPaths(projectRoot);
    this.pluginsDir = paths.plugins;
    this.commandsDir = paths.commands;
    this.skillsDir = paths.skills;
    this.registry = new PluginRegistry(paths.pluginRegistry);
    this.npmInstaller = new NpmInstaller();
    this.githubInstaller = new GitHubInstaller();
    this.localInstaller = new LocalInstaller();
  }

  /**
   * 扫描并加载所有插件
   */
  async loadPlugins(): Promise<void> {
    try {
      await fs.ensureDir(this.pluginsDir);
      const plugins = await this.scanPlugins();

      if (plugins.length === 0) {
        logger.info('没有发现插件');
        return;
      }

      logger.info(`发现 ${plugins.length} 个插件`);

      for (const pluginName of plugins) {
        await this.loadPlugin(pluginName);
      }

      logger.success('所有插件加载完成');
    } catch (error) {
      logger.error('加载插件失败:', error);
    }
  }

  /**
   * 扫描插件目录
   */
  private async scanPlugins(): Promise<string[]> {
    try {
      if (!await fs.pathExists(this.pluginsDir)) {
        return [];
      }

      const entries = await fs.readdir(this.pluginsDir, { withFileTypes: true });
      const plugins = [];

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const configPath = path.join(this.pluginsDir, entry.name, 'config.yaml');
          if (await fs.pathExists(configPath)) {
            plugins.push(entry.name);
          }
        }
      }

      return plugins;
    } catch (error) {
      logger.error('扫描插件目录失败:', error);
      return [];
    }
  }

  /**
   * 加载单个插件（注入 commands 和 skills）
   */
  private async loadPlugin(pluginName: string): Promise<void> {
    try {
      logger.info(`加载插件: ${pluginName}`);

      const configPath = path.join(this.pluginsDir, pluginName, 'config.yaml');
      const config = await PluginValidator.parseConfig(configPath);

      if (!config) {
        logger.warn(`插件 ${pluginName} 配置无效`);
        return;
      }

      if (config.commands && config.commands.length > 0) {
        await this.injectCommands(pluginName, config.commands);
      }

      if (config.skills && config.skills.length > 0) {
        await this.injectSkills(pluginName, config.skills);
      }

      logger.success(`插件 ${pluginName} 加载成功`);

      if (config.installation?.message) {
        console.log(config.installation.message);
      }
    } catch (error) {
      logger.error(`加载插件 ${pluginName} 失败:`, error);
    }
  }

  /**
   * 注入插件命令
   */
  private async injectCommands(
    pluginName: string,
    commands: NonNullable<PluginConfig['commands']>
  ): Promise<void> {
    for (const cmd of commands) {
      try {
        const sourcePath = path.join(this.pluginsDir, pluginName, cmd.file);
        const destPath = path.join(this.commandsDir, `${cmd.id}.md`);

        await fs.ensureDir(this.commandsDir);
        await fs.copy(sourcePath, destPath);
        logger.debug(`注入命令: /${cmd.id}`);
      } catch (error) {
        logger.error(`注入命令 ${cmd.id} 失败:`, error);
      }
    }
  }

  /**
   * 注入插件 Skills
   */
  private async injectSkills(
    pluginName: string,
    skills: NonNullable<PluginConfig['skills']>
  ): Promise<void> {
    for (const skill of skills) {
      try {
        const sourcePath = path.join(this.pluginsDir, pluginName, skill.file);
        const destPath = path.join(this.skillsDir, pluginName, path.basename(skill.file));

        await fs.ensureDir(path.dirname(destPath));
        await fs.copy(sourcePath, destPath);
        logger.debug(`注入 Skill: ${skill.id}`);
      } catch (error) {
        logger.error(`注入 Skill ${skill.id} 失败:`, error);
      }
    }
  }

  /**
   * 清理插件注入的命令文件
   */
  private async cleanupCommands(commands: NonNullable<PluginConfig['commands']>): Promise<void> {
    for (const cmd of commands) {
      try {
        const cmdPath = path.join(this.commandsDir, `${cmd.id}.md`);
        if (await fs.pathExists(cmdPath)) {
          await fs.remove(cmdPath);
          logger.debug(`清理命令: /${cmd.id}`);
        }
      } catch (error) {
        logger.error(`清理命令 ${cmd.id} 失败:`, error);
      }
    }
  }

  /**
   * 列出所有已安装的插件
   */
  async listPlugins(): Promise<PluginConfig[]> {
    const plugins = await this.scanPlugins();
    const configs: PluginConfig[] = [];

    for (const pluginName of plugins) {
      const configPath = path.join(this.pluginsDir, pluginName, 'config.yaml');
      const config = await PluginValidator.parseConfig(configPath);
      if (config) {
        configs.push(config);
      }
    }

    return configs;
  }

  /**
   * 从本地路径安装插件（内置插件）
   */
  async installPlugin(pluginName: string, source?: string): Promise<void> {
    try {
      logger.info(`安装插件: ${pluginName}`);

      if (source) {
        const result = await this.localInstaller.installFromPath(source, pluginName, this.pluginsDir);

        // 更新注册表
        await this.registry.load();
        const configPath = path.join(this.pluginsDir, pluginName, 'config.yaml');
        const config = await PluginValidator.parseConfig(configPath);

        this.registry.add({
          name: pluginName,
          version: result.version,
          source: 'builtin',
          installedAt: new Date().toISOString(),
          path: `plugins/${pluginName}`,
          commands: config?.commands?.map(c => c.id),
          skills: config?.skills?.map(s => s.id),
        });
        await this.registry.save();
      } else {
        logger.warn('未指定安装源，请使用 installRemotePlugin() 进行远程安装');
        return;
      }

      await this.loadPlugin(pluginName);
      logger.success(`插件 ${pluginName} 安装成功`);
    } catch (error) {
      logger.error(`安装插件 ${pluginName} 失败:`, error);
      throw error;
    }
  }

  /**
   * 移除插件
   * 修复: 现在会读取配置并清理注入的命令文件
   */
  async removePlugin(pluginName: string): Promise<void> {
    try {
      logger.info(`移除插件: ${pluginName}`);

      const pluginPath = path.join(this.pluginsDir, pluginName);

      // 先读取配置，获取需要清理的命令和 Skills
      const configPath = path.join(pluginPath, 'config.yaml');
      const config = await PluginValidator.parseConfig(configPath);

      // 清理注入的命令文件
      if (config?.commands && config.commands.length > 0) {
        await this.cleanupCommands(config.commands);
      }

      // 清理注入的 Skills
      const pluginSkillsDir = path.join(this.skillsDir, pluginName);
      if (await fs.pathExists(pluginSkillsDir)) {
        await fs.remove(pluginSkillsDir);
      }

      // 删除插件目录
      await fs.remove(pluginPath);

      // 更新注册表
      await this.registry.load();
      this.registry.remove(pluginName);
      await this.registry.save();

      logger.success(`插件 ${pluginName} 移除成功`);
    } catch (error) {
      logger.error(`移除插件 ${pluginName} 失败:`, error);
      throw error;
    }
  }

  /**
   * 检查插件是否已安装
   */
  async isPluginInstalled(name: string): Promise<boolean> {
    await this.registry.load();
    return this.registry.has(name);
  }

  /**
   * 远程安装插件（支持 npm/GitHub/local）
   */
  async installRemotePlugin(input: string): Promise<void> {
    const identifier = parsePluginIdentifier(input);

    // 检查是否已安装
    if (await this.isPluginInstalled(identifier.name)) {
      throw new PluginAlreadyInstalledError(identifier.name);
    }

    logger.info(`安装插件: ${input}`);

    let installedVersion: string;
    let pluginPath: string;

    // 根据类型选择安装器
    switch (identifier.type) {
      case 'npm': {
        const result = await this.npmInstaller.install(identifier, this.pluginsDir);
        installedVersion = result.version;
        pluginPath = result.pluginPath;
        break;
      }
      case 'github': {
        const result = await this.githubInstaller.install(identifier, this.pluginsDir);
        installedVersion = result.version;
        pluginPath = result.pluginPath;
        break;
      }
      case 'local': {
        const result = await this.localInstaller.install(identifier, this.pluginsDir);
        installedVersion = result.version;
        pluginPath = result.pluginPath;
        break;
      }
      default:
        throw new PluginInstallError(identifier.name, identifier.type, '不支持的插件来源');
    }

    // 验证插件
    const validation = await PluginValidator.validate(pluginPath);

    if (!validation.valid) {
      await fs.remove(pluginPath);
      throw new PluginValidationError(identifier.name, validation.errors, validation.warnings);
    }

    if (validation.warnings.length > 0) {
      for (const warning of validation.warnings) {
        logger.warn(warning);
      }
    }

    // 加载插件（注入 commands 和 skills）
    await this.loadPlugin(identifier.name);

    // 读取配置获取 commands/skills 信息
    const configPath = path.join(pluginPath, 'config.yaml');
    const config = await PluginValidator.parseConfig(configPath);

    // 更新注册表
    await this.registry.load();
    const metadata: PluginMetadata = {
      name: identifier.name,
      version: installedVersion,
      source: identifier.type,
      installedAt: new Date().toISOString(),
      path: `plugins/${identifier.name}`,
      registry: identifier.type === 'npm' ? 'https://registry.npmjs.org' : undefined,
      repository: identifier.repository,
      commands: config?.commands?.map(c => c.id),
      skills: config?.skills?.map(s => s.id),
    };

    this.registry.add(metadata);
    await this.registry.save();

    logger.success(`插件 ${identifier.name}@${installedVersion} 安装成功`);
  }

  /**
   * 更新插件
   */
  async updatePlugin(name: string): Promise<void> {
    await this.registry.load();
    const plugin = this.registry.find(name);

    if (!plugin) {
      throw new PluginNotFoundError(name);
    }

    // 移除旧版本
    await this.removePlugin(name);

    // 重新安装
    const input = plugin.source === 'npm'
      ? plugin.name
      : plugin.repository || plugin.name;

    await this.installRemotePlugin(input);
  }

  /**
   * 获取已安装插件的注册表信息
   */
  async getRegistry(): Promise<PluginRegistry> {
    await this.registry.load();
    return this.registry;
  }
}
