import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import { logger } from '../utils/logger.js';
import { PluginRegistry, PluginMetadata } from './types.js';
import { parsePluginIdentifier } from './identifier.js';
import { NpmInstaller } from './installers/npm.js';
import { GitHubInstaller } from './installers/github.js';
import { PluginValidator } from './validator.js';

interface PluginConfig {
  name: string;
  version: string;
  description: string;
  type: 'feature' | 'expert' | 'workflow';
  commands?: Array<{
    id: string;
    file: string;
    description: string;
  }>;
  skills?: Array<{
    id: string;
    file: string;
    description: string;
  }>;
  dependencies?: {
    core: string;
  };
  installation?: {
    message?: string;
  };
}

export class PluginManager {
  private projectRoot: string;
  private pluginsDir: string;
  private commandsDir: string;
  private skillsDir: string;
  private npmInstaller: NpmInstaller;
  private githubInstaller: GitHubInstaller;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.pluginsDir = path.join(projectRoot, 'plugins');
    this.commandsDir = path.join(projectRoot, '.claude', 'commands');
    this.skillsDir = path.join(projectRoot, '.claude', 'skills');
    this.npmInstaller = new NpmInstaller();
    this.githubInstaller = new GitHubInstaller();
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
   * 加载单个插件
   */
  private async loadPlugin(pluginName: string): Promise<void> {
    try {
      logger.info(`加载插件: ${pluginName}`);

      const configPath = path.join(this.pluginsDir, pluginName, 'config.yaml');
      const config = await this.loadConfig(configPath);

      if (!config) {
        logger.warn(`插件 ${pluginName} 配置无效`);
        return;
      }

      // 注入命令
      if (config.commands && config.commands.length > 0) {
        await this.injectCommands(pluginName, config.commands);
      }

      // 注入 Skills
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
   * 读取插件配置
   */
  private async loadConfig(configPath: string): Promise<PluginConfig | null> {
    try {
      const content = await fs.readFile(configPath, 'utf-8');
      const config = yaml.load(content) as PluginConfig;

      if (!config.name || !config.version) {
        return null;
      }

      return config;
    } catch (error) {
      logger.error(`读取配置文件失败: ${configPath}`, error);
      return null;
    }
  }

  /**
   * 注入插件命令
   */
  private async injectCommands(
    pluginName: string,
    commands: PluginConfig['commands']
  ): Promise<void> {
    if (!commands) return;

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
    skills: PluginConfig['skills']
  ): Promise<void> {
    if (!skills) return;

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
   * 列出所有已安装的插件
   */
  async listPlugins(): Promise<PluginConfig[]> {
    const plugins = await this.scanPlugins();
    const configs: PluginConfig[] = [];

    for (const pluginName of plugins) {
      const configPath = path.join(this.pluginsDir, pluginName, 'config.yaml');
      const config = await this.loadConfig(configPath);
      if (config) {
        configs.push(config);
      }
    }

    return configs;
  }

  /**
   * 安装插件
   */
  async installPlugin(pluginName: string, source?: string): Promise<void> {
    try {
      logger.info(`安装插件: ${pluginName}`);

      if (source) {
        const destPath = path.join(this.pluginsDir, pluginName);
        await fs.copy(source, destPath);
      } else {
        logger.warn('远程安装功能尚未实现');
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
   */
  async removePlugin(pluginName: string): Promise<void> {
    try {
      logger.info(`移除插件: ${pluginName}`);

      // 删除插件目录
      const pluginPath = path.join(this.pluginsDir, pluginName);
      await fs.remove(pluginPath);

      // 删除注入的命令
      if (await fs.pathExists(this.commandsDir)) {
        const commandFiles = await fs.readdir(this.commandsDir);
        for (const file of commandFiles) {
          // 这里简化处理，实际应该读取插件配置来确定要删除的文件
          // 暂时跳过，因为我们需要知道哪些命令属于这个插件
        }
      }

      // 删除注入的 Skills
      const pluginSkillsDir = path.join(this.skillsDir, pluginName);
      if (await fs.pathExists(pluginSkillsDir)) {
        await fs.remove(pluginSkillsDir);
      }

      logger.success(`插件 ${pluginName} 移除成功`);
    } catch (error) {
      logger.error(`移除插件 ${pluginName} 失败:`, error);
      throw error;
    }
  }

  /**
   * 加载插件注册表
   */
  private loadRegistry(): PluginRegistry {
    const registryPath = path.join(this.projectRoot, '.specify', 'plugins.json');

    try {
      if (fs.existsSync(registryPath)) {
        return fs.readJsonSync(registryPath);
      }
    } catch {
      // 注册表损坏，返回空注册表
    }

    return { version: '1.0.0', plugins: [] };
  }

  /**
   * 保存插件注册表
   */
  private saveRegistry(registry: PluginRegistry): void {
    const registryPath = path.join(this.projectRoot, '.specify', 'plugins.json');
    fs.ensureDirSync(path.dirname(registryPath));
    fs.writeJsonSync(registryPath, registry, { spaces: 2 });
  }

  /**
   * 检查插件是否已安装
   */
  isPluginInstalled(name: string): boolean {
    const registry = this.loadRegistry();
    return registry.plugins.some(p => p.name === name);
  }

  /**
   * 远程安装插件（支持 npm/GitHub/local）
   */
  async installRemotePlugin(input: string): Promise<void> {
    const identifier = parsePluginIdentifier(input);

    // 检查是否已安装
    if (this.isPluginInstalled(identifier.name)) {
      throw new Error(`插件 ${identifier.name} 已安装。如需更新请使用 plugin:update`);
    }

    logger.info(`安装插件: ${input}`);

    let installedVersion: string;

    // 根据类型选择安装器
    switch (identifier.type) {
      case 'npm':
        installedVersion = await this.npmInstaller.install(identifier, this.pluginsDir);
        break;
      case 'github':
        installedVersion = await this.githubInstaller.install(identifier, this.pluginsDir);
        break;
      case 'local':
        throw new Error('本地 tarball 安装暂不支持');
      default:
        throw new Error(`不支持的插件来源: ${identifier.type}`);
    }

    // 验证插件
    const pluginPath = path.join(this.pluginsDir, identifier.name);
    const validation = await PluginValidator.validate(pluginPath);

    if (!validation.valid) {
      // 验证失败，清理并抛出错误
      await fs.remove(pluginPath);
      throw new Error(`插件验证失败: ${validation.errors.join(', ')}`);
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
    const config = await this.loadConfig(configPath);

    // 更新注册表
    const registry = this.loadRegistry();
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

    registry.plugins.push(metadata);
    this.saveRegistry(registry);

    logger.success(`插件 ${identifier.name}@${installedVersion} 安装成功`);

    // 处理依赖
    if (config?.dependencies) {
      await this.installDependencies(config.dependencies);
    }
  }

  /**
   * 安装插件依赖
   */
  private async installDependencies(dependencies: PluginConfig['dependencies']): Promise<void> {
    if (!dependencies) return;

    // dependencies.core 是核心版本要求，跳过
    // 未来可以扩展为插件间依赖
  }

  /**
   * 更新插件
   */
  async updatePlugin(name: string): Promise<void> {
    const registry = this.loadRegistry();
    const plugin = registry.plugins.find(p => p.name === name);

    if (!plugin) {
      throw new Error(`插件 ${name} 未安装`);
    }

    // 移除旧版本
    await this.removePlugin(name);

    // 从注册表中也删除
    const updatedRegistry = this.loadRegistry();
    updatedRegistry.plugins = updatedRegistry.plugins.filter(p => p.name !== name);
    this.saveRegistry(updatedRegistry);

    // 重新安装
    const input = plugin.source === 'npm'
      ? plugin.name
      : plugin.repository || plugin.name;

    await this.installRemotePlugin(input);
  }

  /**
   * 获取已安装插件的注册表信息
   */
  getRegistry(): PluginRegistry {
    return this.loadRegistry();
  }
}

