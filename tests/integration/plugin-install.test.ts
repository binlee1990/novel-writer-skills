import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { PluginManager } from '../../src/plugins/manager.js';
import { createTempDir, createMockProject, cleanup } from '../helpers/test-utils.js';

describe('Plugin Installation Flow', () => {
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

  it('should install and then list a plugin', async () => {
    // 准备源插件
    const sourceDir = path.join(tempDir, 'source-plugin');
    await fs.ensureDir(sourceDir);
    await fs.writeFile(path.join(sourceDir, 'config.yaml'), [
      'name: integration-plugin',
      'version: 1.0.0',
      'description: Integration test plugin',
      'type: feature',
    ].join('\n'));

    const manager = new PluginManager(projectPath);

    // 安装
    await manager.installPlugin('integration-plugin', sourceDir);

    // 列出 — 应该包含刚安装的插件
    const plugins = await manager.listPlugins();
    expect(plugins).toHaveLength(1);
    expect(plugins[0].name).toBe('integration-plugin');
    expect(plugins[0].version).toBe('1.0.0');
  });

  it('should install, remove, and verify plugin is gone', async () => {
    const sourceDir = path.join(tempDir, 'removable-plugin');
    await fs.ensureDir(sourceDir);
    await fs.writeFile(path.join(sourceDir, 'config.yaml'), [
      'name: removable',
      'version: 2.0.0',
      'description: Will be removed',
      'type: feature',
    ].join('\n'));

    const manager = new PluginManager(projectPath);

    // 安装
    await manager.installPlugin('removable', sourceDir);
    let plugins = await manager.listPlugins();
    expect(plugins).toHaveLength(1);

    // 移除
    await manager.removePlugin('removable');
    plugins = await manager.listPlugins();
    expect(plugins).toHaveLength(0);

    // 验证文件系统
    const pluginDir = path.join(projectPath, 'plugins', 'removable');
    expect(await fs.pathExists(pluginDir)).toBe(false);
  });

  it('should handle multiple plugins', async () => {
    const manager = new PluginManager(projectPath);

    // 安装三个插件
    for (let i = 1; i <= 3; i++) {
      const sourceDir = path.join(tempDir, `plugin-${i}`);
      await fs.ensureDir(sourceDir);
      await fs.writeFile(path.join(sourceDir, 'config.yaml'), [
        `name: plugin-${i}`,
        `version: ${i}.0.0`,
        `description: Plugin number ${i}`,
        'type: feature',
      ].join('\n'));

      await manager.installPlugin(`plugin-${i}`, sourceDir);
    }

    const plugins = await manager.listPlugins();
    expect(plugins).toHaveLength(3);

    // 移除中间的
    await manager.removePlugin('plugin-2');
    const remaining = await manager.listPlugins();
    expect(remaining).toHaveLength(2);
    expect(remaining.map(p => p.name)).not.toContain('plugin-2');
  });

  it('should clean up injected skills on removal', async () => {
    const sourceDir = path.join(tempDir, 'skill-plugin');
    await fs.ensureDir(sourceDir);
    await fs.writeFile(path.join(sourceDir, 'config.yaml'), [
      'name: skill-plugin',
      'version: 1.0.0',
      'description: Has skills',
      'type: feature',
    ].join('\n'));

    const manager = new PluginManager(projectPath);
    await manager.installPlugin('skill-plugin', sourceDir);

    // 模拟注入的 skills
    const skillsDir = path.join(projectPath, '.claude', 'skills', 'skill-plugin');
    await fs.ensureDir(skillsDir);
    await fs.writeFile(path.join(skillsDir, 'SKILL.md'), '# Test');

    // 移除插件
    await manager.removePlugin('skill-plugin');

    // 验证 skills 也被清理
    expect(await fs.pathExists(skillsDir)).toBe(false);
  });
});
