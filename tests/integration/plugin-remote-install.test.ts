import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { PluginManager } from '../../src/plugins/manager.js';
import { parsePluginIdentifier } from '../../src/plugins/identifier.js';

describe('Plugin Remote Installation', () => {
  let tmpDir: string;
  let projectRoot: string;
  let manager: PluginManager;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nws-test-remote-'));
    projectRoot = path.join(tmpDir, 'test-project');
    await fs.ensureDir(projectRoot);
    await fs.ensureDir(path.join(projectRoot, 'resources', 'config'));
    manager = new PluginManager(projectRoot);
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  describe('parsePluginIdentifier', () => {
    it('should parse npm package', () => {
      const result = parsePluginIdentifier('my-plugin');
      expect(result.type).toBe('npm');
      expect(result.name).toBe('my-plugin');
    });

    it('should parse npm scoped package', () => {
      const result = parsePluginIdentifier('@scope/plugin@1.0.0');
      expect(result.type).toBe('npm');
      expect(result.name).toBe('@scope/plugin');
      expect(result.version).toBe('1.0.0');
    });

    it('should parse GitHub repository', () => {
      const result = parsePluginIdentifier('user/repo');
      expect(result.type).toBe('github');
      expect(result.repository).toBe('user/repo');
      expect(result.name).toBe('repo');
    });

    it('should parse GitHub URL', () => {
      const result = parsePluginIdentifier('https://github.com/user/repo');
      expect(result.type).toBe('github');
      expect(result.repository).toBe('user/repo');
    });
  });

  describe('Plugin Registry', () => {
    it('should initialize empty registry', async () => {
      const registry = await manager.getRegistry();
      const data = registry.getData();
      expect(data.version).toBe('1.0.0');
      expect(data.plugins).toEqual([]);
    });

    it('should check if plugin is installed', async () => {
      expect(await manager.isPluginInstalled('test-plugin')).toBe(false);
    });

    it('should persist registry to disk', async () => {
      // 创建一个模拟插件
      const pluginDir = path.join(projectRoot, 'plugins', 'test-plugin');
      await fs.ensureDir(pluginDir);
      await fs.writeFile(
        path.join(pluginDir, 'config.yaml'),
        'name: test-plugin\nversion: 1.0.0\ndescription: Test\ntype: feature\n'
      );

      // 手动添加到注册表
      const registryPath = path.join(projectRoot, 'resources', 'config', 'plugins.json');
      await fs.writeJson(registryPath, {
        version: '1.0.0',
        plugins: [
          {
            name: 'test-plugin',
            version: '1.0.0',
            source: 'local',
            installedAt: new Date().toISOString(),
            path: 'plugins/test-plugin',
          },
        ],
      });

      // 验证可以读取
      const registry = await manager.getRegistry();
      const data = registry.getData();
      expect(data.plugins).toHaveLength(1);
      expect(data.plugins[0].name).toBe('test-plugin');
      expect(await manager.isPluginInstalled('test-plugin')).toBe(true);
    });
  });

  describe('installRemotePlugin', () => {
    it('should reject duplicate installation', async () => {
      // 先手动添加到注册表
      const registryPath = path.join(projectRoot, 'resources', 'config', 'plugins.json');
      await fs.writeJson(registryPath, {
        version: '1.0.0',
        plugins: [
          {
            name: 'test-plugin',
            version: '1.0.0',
            source: 'local',
            installedAt: new Date().toISOString(),
            path: 'plugins/test-plugin',
          },
        ],
      });

      await expect(manager.installRemotePlugin('test-plugin')).rejects.toThrow(
        '已安装'
      );
    });

    it('should reject local tarball installation', async () => {
      await expect(manager.installRemotePlugin('./plugin.tgz')).rejects.toThrow(
        '安装失败'
      );
    });
  });

  describe('updatePlugin', () => {
    it('should reject update for non-installed plugin', async () => {
      await expect(manager.updatePlugin('non-existent')).rejects.toThrow(
        '未找到'
      );
    });
  });
});
