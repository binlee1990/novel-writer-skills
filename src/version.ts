import { readFileSync } from 'fs';
import path from 'path';
import { getPackageRoot } from './core/config.js';

let _cachedVersion: string | null = null;

export function getVersion(): string {
  if (_cachedVersion) return _cachedVersion;

  try {
    const packagePath = path.join(getPackageRoot(), 'package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
    _cachedVersion = packageJson.version;
    return _cachedVersion!;
  } catch {
    return '1.0.0';
  }
}

export function getVersionInfo(): string {
  return `v${getVersion()}`;
}
