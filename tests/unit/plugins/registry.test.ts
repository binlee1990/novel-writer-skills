import path from 'path';
import fs from 'fs-extra';
import { PluginRegistry } from '../../../src/plugins/registry.js';
import { PluginMetadata } from '../../../src/plugins/types.js';
import { createTempDir, cleanup } from '../../helpers/test-utils.js';

function makeMeta(name: string, overrides?: Partial<PluginMetadata>): PluginMetadata {
  return {
    name,
    version: '1.0.0',
    source: 'local',
    installedAt: new Date().toISOString(),
    path: `/plugins/${name}`,
    ...overrides,
  };
}

describe('plugins/registry.ts', () => {
  let tempDir: string;
  let registryPath: string;

  beforeEach(() => {
    tempDir = createTempDir();
    registryPath = path.join(tempDir, '.specify', 'plugins.json');
  });

  afterEach(async () => {
    await cleanup(tempDir);
  });

  describe('load()', () => {
    it('should initialize empty registry when file does not exist', async () => {
      const registry = new PluginRegistry(registryPath);
      await registry.load();
      expect(registry.list()).toEqual([]);
      expect(registry.getData().version).toBe('1.0.0');
    });

    it('should load existing registry from disk', async () => {
      await fs.ensureDir(path.dirname(registryPath));
      await fs.writeJson(registryPath, {
        version: '1.0.0',
        plugins: [makeMeta('test-plugin')],
      });

      const registry = new PluginRegistry(registryPath);
      await registry.load();
      expect(registry.list()).toHaveLength(1);
      expect(registry.list()[0].name).toBe('test-plugin');
    });

    it('should handle corrupted registry file gracefully', async () => {
      await fs.ensureDir(path.dirname(registryPath));
      await fs.writeFile(registryPath, 'not valid json{{{');

      const registry = new PluginRegistry(registryPath);
      await registry.load();
      expect(registry.list()).toEqual([]);
    });

    it('should handle invalid structure gracefully', async () => {
      await fs.ensureDir(path.dirname(registryPath));
      await fs.writeJson(registryPath, { version: '1.0.0', plugins: 'not-array' });

      const registry = new PluginRegistry(registryPath);
      await registry.load();
      expect(registry.list()).toEqual([]);
    });
  });

  describe('add()', () => {
    it('should add a plugin', async () => {
      const registry = new PluginRegistry(registryPath);
      await registry.load();

      registry.add(makeMeta('plugin-a'));
      expect(registry.list()).toHaveLength(1);
      expect(registry.has('plugin-a')).toBe(true);
    });

    it('should replace existing plugin with same name', async () => {
      const registry = new PluginRegistry(registryPath);
      await registry.load();

      registry.add(makeMeta('plugin-a', { version: '1.0.0' }));
      registry.add(makeMeta('plugin-a', { version: '2.0.0' }));
      expect(registry.list()).toHaveLength(1);
      expect(registry.find('plugin-a')!.version).toBe('2.0.0');
    });

    it('should throw if not loaded', () => {
      const registry = new PluginRegistry(registryPath);
      expect(() => registry.add(makeMeta('x'))).toThrow('未加载');
    });
  });

  describe('remove()', () => {
    it('should remove an existing plugin and return true', async () => {
      const registry = new PluginRegistry(registryPath);
      await registry.load();
      registry.add(makeMeta('plugin-a'));

      const result = registry.remove('plugin-a');
      expect(result).toBe(true);
      expect(registry.list()).toHaveLength(0);
    });

    it('should return false when plugin not found', async () => {
      const registry = new PluginRegistry(registryPath);
      await registry.load();

      const result = registry.remove('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('find()', () => {
    it('should return plugin metadata when found', async () => {
      const registry = new PluginRegistry(registryPath);
      await registry.load();
      registry.add(makeMeta('plugin-a'));

      const found = registry.find('plugin-a');
      expect(found).toBeDefined();
      expect(found!.name).toBe('plugin-a');
    });

    it('should return undefined when not found', async () => {
      const registry = new PluginRegistry(registryPath);
      await registry.load();

      expect(registry.find('nonexistent')).toBeUndefined();
    });
  });

  describe('has()', () => {
    it('should return true for existing plugin', async () => {
      const registry = new PluginRegistry(registryPath);
      await registry.load();
      registry.add(makeMeta('plugin-a'));

      expect(registry.has('plugin-a')).toBe(true);
    });

    it('should return false for missing plugin', async () => {
      const registry = new PluginRegistry(registryPath);
      await registry.load();

      expect(registry.has('nonexistent')).toBe(false);
    });
  });

  describe('save()', () => {
    it('should persist registry to disk', async () => {
      const registry = new PluginRegistry(registryPath);
      await registry.load();
      registry.add(makeMeta('plugin-a'));
      await registry.save();

      // Read back from disk
      const raw = await fs.readJson(registryPath);
      expect(raw.plugins).toHaveLength(1);
      expect(raw.plugins[0].name).toBe('plugin-a');
    });

    it('should create parent directories if needed', async () => {
      const deepPath = path.join(tempDir, 'a', 'b', 'plugins.json');
      const registry = new PluginRegistry(deepPath);
      await registry.load();
      registry.add(makeMeta('plugin-a'));
      await registry.save();

      expect(await fs.pathExists(deepPath)).toBe(true);
    });
  });

  describe('getData()', () => {
    it('should return a copy of registry data', async () => {
      const registry = new PluginRegistry(registryPath);
      await registry.load();
      registry.add(makeMeta('plugin-a'));

      const data = registry.getData();
      expect(data.version).toBe('1.0.0');
      expect(data.plugins).toHaveLength(1);

      // Verify it's a copy
      data.plugins.push(makeMeta('plugin-b'));
      expect(registry.list()).toHaveLength(1);
    });
  });
});
