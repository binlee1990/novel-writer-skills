import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { PluginValidator } from '../../../src/plugins/validator.js';

describe('PluginValidator', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nws-validator-'));
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  it('should pass valid plugin', async () => {
    const pluginDir = path.join(tmpDir, 'valid-plugin');
    await fs.ensureDir(pluginDir);
    await fs.writeFile(
      path.join(pluginDir, 'config.yaml'),
      'name: valid-plugin\nversion: 1.0.0\ndescription: A valid test plugin\ntype: feature\n'
    );

    const result = await PluginValidator.validate(pluginDir);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail when config.yaml is missing', async () => {
    const pluginDir = path.join(tmpDir, 'no-config');
    await fs.ensureDir(pluginDir);

    const result = await PluginValidator.validate(pluginDir);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('config.yaml not found');
  });

  it('should fail when config.yaml has invalid YAML', async () => {
    const pluginDir = path.join(tmpDir, 'bad-yaml');
    await fs.ensureDir(pluginDir);
    await fs.writeFile(
      path.join(pluginDir, 'config.yaml'),
      '{ invalid yaml: [[[['
    );

    const result = await PluginValidator.validate(pluginDir);
    expect(result.valid).toBe(false);
  });

  it('should fail when name is missing', async () => {
    const pluginDir = path.join(tmpDir, 'no-name');
    await fs.ensureDir(pluginDir);
    await fs.writeFile(
      path.join(pluginDir, 'config.yaml'),
      'version: 1.0.0\ndescription: Missing name\n'
    );

    const result = await PluginValidator.validate(pluginDir);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('config.yaml missing required field: name');
  });

  it('should warn when version is missing', async () => {
    const pluginDir = path.join(tmpDir, 'no-version');
    await fs.ensureDir(pluginDir);
    await fs.writeFile(
      path.join(pluginDir, 'config.yaml'),
      'name: no-version-plugin\ndescription: Missing version\n'
    );

    const result = await PluginValidator.validate(pluginDir);
    expect(result.valid).toBe(true);
    expect(result.warnings).toContain('config.yaml missing version field');
  });

  it('should warn when description is missing', async () => {
    const pluginDir = path.join(tmpDir, 'no-desc');
    await fs.ensureDir(pluginDir);
    await fs.writeFile(
      path.join(pluginDir, 'config.yaml'),
      'name: no-desc-plugin\nversion: 1.0.0\n'
    );

    const result = await PluginValidator.validate(pluginDir);
    expect(result.valid).toBe(true);
    expect(result.warnings).toContain('config.yaml missing description field');
  });
});
