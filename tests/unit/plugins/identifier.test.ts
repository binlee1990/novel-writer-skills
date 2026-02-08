import { parsePluginIdentifier } from '../../../src/plugins/identifier.js';

describe('parsePluginIdentifier', () => {
  describe('npm scoped packages', () => {
    it('should parse @scope/name', () => {
      const result = parsePluginIdentifier('@novelwrite/translate');
      expect(result.type).toBe('npm');
      expect(result.name).toBe('@novelwrite/translate');
      expect(result.scope).toBe('@novelwrite');
      expect(result.version).toBeUndefined();
    });

    it('should parse @scope/name@version', () => {
      const result = parsePluginIdentifier('@novelwrite/translate@1.2.0');
      expect(result.type).toBe('npm');
      expect(result.name).toBe('@novelwrite/translate');
      expect(result.version).toBe('1.2.0');
      expect(result.scope).toBe('@novelwrite');
    });
  });

  describe('npm unscoped packages', () => {
    it('should parse simple name', () => {
      const result = parsePluginIdentifier('novelwrite-plugin-export');
      expect(result.type).toBe('npm');
      expect(result.name).toBe('novelwrite-plugin-export');
      expect(result.version).toBeUndefined();
    });

    it('should parse name@version', () => {
      const result = parsePluginIdentifier('my-plugin@2.0.0');
      expect(result.type).toBe('npm');
      expect(result.name).toBe('my-plugin');
      expect(result.version).toBe('2.0.0');
    });
  });

  describe('GitHub repositories', () => {
    it('should parse user/repo', () => {
      const result = parsePluginIdentifier('username/my-plugin');
      expect(result.type).toBe('github');
      expect(result.repository).toBe('username/my-plugin');
      expect(result.name).toBe('my-plugin');
      expect(result.version).toBe('main');
    });

    it('should parse user/repo@ref', () => {
      const result = parsePluginIdentifier('username/my-plugin@v1.0');
      expect(result.type).toBe('github');
      expect(result.repository).toBe('username/my-plugin');
      expect(result.name).toBe('my-plugin');
      expect(result.version).toBe('v1.0');
    });
  });

  describe('GitHub URLs', () => {
    it('should parse https://github.com/user/repo', () => {
      const result = parsePluginIdentifier('https://github.com/user/repo');
      expect(result.type).toBe('github');
      expect(result.repository).toBe('user/repo');
      expect(result.name).toBe('repo');
    });

    it('should parse github URL with .git suffix', () => {
      const result = parsePluginIdentifier('https://github.com/user/repo.git');
      expect(result.type).toBe('github');
      expect(result.repository).toBe('user/repo');
      expect(result.name).toBe('repo');
    });
  });

  describe('local tarballs', () => {
    it('should parse .tgz file', () => {
      const result = parsePluginIdentifier('./my-plugin.tgz');
      expect(result.type).toBe('local');
      expect(result.name).toBe('my-plugin');
    });

    it('should parse .tar.gz file', () => {
      const result = parsePluginIdentifier('/tmp/plugin-1.0.0.tar.gz');
      expect(result.type).toBe('local');
      expect(result.name).toBe('plugin-1.0.0');
    });
  });

  describe('invalid identifiers', () => {
    it('should throw on empty string', () => {
      expect(() => parsePluginIdentifier('')).toThrow('Invalid plugin identifier');
    });

    it('should throw on invalid format', () => {
      expect(() => parsePluginIdentifier('!@#$%')).toThrow('Invalid plugin identifier');
    });
  });
});
