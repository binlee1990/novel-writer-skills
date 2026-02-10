import { getVersion, getVersionInfo } from '../../src/version.js';

describe('version.ts', () => {
  describe('getVersion()', () => {
    it('should return a valid semver version', () => {
      const version = getVersion();
      expect(version).toMatch(/^\d+\.\d+\.\d+/);
    });

    it('should return the version from package.json', () => {
      const version = getVersion();
      expect(version).toBe('1.2.0');
    });
  });

  describe('getVersionInfo()', () => {
    it('should return version prefixed with v', () => {
      const info = getVersionInfo();
      expect(info).toMatch(/^v\d+\.\d+\.\d+/);
    });

    it('should contain the version from getVersion()', () => {
      const version = getVersion();
      const info = getVersionInfo();
      expect(info).toBe(`v${version}`);
    });
  });
});
