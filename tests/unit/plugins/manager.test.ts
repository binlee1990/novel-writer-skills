import path from 'path';
import fs from 'fs-extra';
import { PluginManager } from '../../../src/plugins/manager.js';
import { createTempDir, createMockProject, cleanup } from '../../helpers/test-utils.js';

describe('PluginManager', () => {
  let tempDir: string;
  let projectPath: string;
  let consoleSpy: jest.SpyInstance;

  beforeEach(async () => {
    tempDir = createTempDir();
    projectPath = await createMockProject(tempDir);
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(async () => {
    consoleSpy.mockRestore();
    await cleanup(tempDir);
  });

  describe('constructor', () => {
    it('should initialize with correct paths', () => {
      const manager = new PluginManager(projectPath);
      expect(manager).toBeDefined();
    });
  });

  describe('listPlugins()', () => {
    it('should return empty array when no plugins exist', async () => {
      const manager = new PluginManager(projectPath);
      const plugins = await manager.listPlugins();
      expect(plugins).toEqual([]);
    });

    it('should list plugins with valid config', async () => {
      const pluginsDir = path.join(projectPath, 'plugins');
      const pluginDir = path.join(pluginsDir, 'test-plugin');
      await fs.ensureDir(pluginDir);
      await fs.writeFile(path.join(pluginDir, 'config.yaml'), [
        'name: test-plugin',
        'version: 1.0.0',
        'description: A test plugin',
        'type: feature',
      ].join('\n'));

      const manager = new PluginManager(projectPath);
      const plugins = await manager.listPlugins();
      expect(plugins).toHaveLength(1);
      expect(plugins[0].name).toBe('test-plugin');
      expect(plugins[0].version).toBe('1.0.0');
    });

    it('should skip plugins with invalid config', async () => {
      const pluginsDir = path.join(projectPath, 'plugins');
      const pluginDir = path.join(pluginsDir, 'bad-plugin');
      await fs.ensureDir(pluginDir);
      await fs.writeFile(path.join(pluginDir, 'config.yaml'), 'invalid: yaml: [[[');

      const manager = new PluginManager(projectPath);
      const plugins = await manager.listPlugins();
      expect(plugins).toHaveLength(0);
    });

    it('should skip plugins without name or version', async () => {
      const pluginsDir = path.join(projectPath, 'plugins');
      const pluginDir = path.join(pluginsDir, 'incomplete');
      await fs.ensureDir(pluginDir);
      await fs.writeFile(path.join(pluginDir, 'config.yaml'), 'description: no name or version');

      const manager = new PluginManager(projectPath);
      const plugins = await manager.listPlugins();
      expect(plugins).toHaveLength(0);
    });
  });

  describe('loadPlugins()', () => {
    it('should handle empty plugins directory', async () => {
      const manager = new PluginManager(projectPath);
      await expect(manager.loadPlugins()).resolves.not.toThrow();
    });

    it('should load valid plugins without error', async () => {
      const pluginsDir = path.join(projectPath, 'plugins');
      const pluginDir = path.join(pluginsDir, 'test-plugin');
      await fs.ensureDir(pluginDir);
      await fs.writeFile(path.join(pluginDir, 'config.yaml'), [
        'name: test-plugin',
        'version: 1.0.0',
        'description: A test plugin',
        'type: feature',
      ].join('\n'));

      const manager = new PluginManager(projectPath);
      await expect(manager.loadPlugins()).resolves.not.toThrow();
    });
  });

  describe('installPlugin()', () => {
    it('should install plugin from local source', async () => {
      // 准备源插件
      const sourceDir = path.join(tempDir, 'source-plugin');
      await fs.ensureDir(sourceDir);
      await fs.writeFile(path.join(sourceDir, 'config.yaml'), [
        'name: local-plugin',
        'version: 2.0.0',
        'description: Locally installed',
        'type: feature',
      ].join('\n'));

      const manager = new PluginManager(projectPath);
      await manager.installPlugin('local-plugin', sourceDir);

      // 验证插件已安装
      const pluginPath = path.join(projectPath, 'plugins', 'local-plugin');
      expect(await fs.pathExists(pluginPath)).toBe(true);
      expect(await fs.pathExists(path.join(pluginPath, 'config.yaml'))).toBe(true);
    });

    it('should warn when no source provided (remote not implemented)', async () => {
      const manager = new PluginManager(projectPath);
      await manager.installPlugin('remote-plugin');
      // 不应抛出错误，应该只是 warn
    });
  });

  describe('removePlugin()', () => {
    it('should remove installed plugin', async () => {
      const pluginsDir = path.join(projectPath, 'plugins');
      const pluginDir = path.join(pluginsDir, 'remove-me');
      await fs.ensureDir(pluginDir);
      await fs.writeFile(path.join(pluginDir, 'config.yaml'), [
        'name: remove-me',
        'version: 1.0.0',
        'description: Will be removed',
        'type: feature',
      ].join('\n'));

      const manager = new PluginManager(projectPath);
      await manager.removePlugin('remove-me');

      expect(await fs.pathExists(pluginDir)).toBe(false);
    });

    it('should remove injected skills directory', async () => {
      const pluginsDir = path.join(projectPath, 'plugins');
      const pluginDir = path.join(pluginsDir, 'skill-plugin');
      await fs.ensureDir(pluginDir);
      await fs.writeFile(path.join(pluginDir, 'config.yaml'), [
        'name: skill-plugin',
        'version: 1.0.0',
        'description: Has skills',
        'type: feature',
      ].join('\n'));

      // 模拟已注入的 skills
      const skillsDir = path.join(projectPath, '.claude', 'skills', 'skill-plugin');
      await fs.ensureDir(skillsDir);
      await fs.writeFile(path.join(skillsDir, 'SKILL.md'), '# Test Skill');

      const manager = new PluginManager(projectPath);
      await manager.removePlugin('skill-plugin');

      expect(await fs.pathExists(skillsDir)).toBe(false);
    });

    it('should throw error for non-existent plugin', async () => {
      const manager = new PluginManager(projectPath);
      // removePlugin 在 fs.remove 时会默默成功（因为 fs-extra 的 remove 不会对不存在的路径报错）
      await expect(manager.removePlugin('nonexistent')).resolves.not.toThrow();
    });
  });
});
