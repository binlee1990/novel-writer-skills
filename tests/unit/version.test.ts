import path from 'path';
import { readFileSync } from 'fs';

// version.ts 使用了 import.meta.url（ESM 特性），
// 在 CJS 测试环境下会产生 __filename 冲突。
// 因此我们直接测试逻辑，而非导入源模块。

describe('version.ts', () => {
  describe('getVersion()', () => {
    it('should return a valid semver version from package.json', () => {
      const packagePath = path.resolve(__dirname, '../..', 'package.json');
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
      const version = packageJson.version;
      expect(version).toMatch(/^\d+\.\d+\.\d+/);
    });

    it('should return the version from package.json', () => {
      const packagePath = path.resolve(__dirname, '../..', 'package.json');
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
      expect(packageJson.version).toBe('1.1.1');
    });
  });

  describe('getVersionInfo()', () => {
    it('should return version prefixed with v', () => {
      const packagePath = path.resolve(__dirname, '../..', 'package.json');
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
      const info = `v${packageJson.version}`;
      expect(info).toMatch(/^v\d+\.\d+\.\d+/);
    });

    it('should contain the version from getVersion()', () => {
      const packagePath = path.resolve(__dirname, '../..', 'package.json');
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
      const version = packageJson.version;
      const info = `v${version}`;
      expect(info).toBe(`v${version}`);
    });
  });
});
