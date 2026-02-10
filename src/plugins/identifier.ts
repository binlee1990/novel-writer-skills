/**
 * 插件标识符解析
 *
 * 支持格式:
 * - npm scoped: @scope/name 或 @scope/name@version
 * - npm: name 或 name@version（支持版本范围如 ^1.0.0、~1.2.0）
 * - GitHub URL: https://github.com/user/repo
 * - GitHub shorthand: user/repo 或 user/repo@ref
 * - Local tarball: ./path.tgz 或 ./path.tar.gz
 */

import path from 'path';
import { PluginIdentifier } from './types.js';

const SUPPORTED_FORMATS = [
  'npm 包名 (如 my-plugin 或 my-plugin@1.0.0)',
  'npm scoped 包名 (如 @scope/my-plugin)',
  'GitHub 仓库 (如 user/repo 或 user/repo@tag)',
  'GitHub URL (如 https://github.com/user/repo)',
  '本地 tarball (如 ./plugin.tgz)',
].join('\n  - ');

export function parsePluginIdentifier(input: string): PluginIdentifier {
  const trimmed = input.trim();

  if (!trimmed) {
    throw new Error(`插件标识符不能为空。支持的格式:\n  - ${SUPPORTED_FORMATS}`);
  }

  // npm scoped package: @scope/name 或 @scope/name@version
  const scopedNpmMatch = trimmed.match(/^(@[\w-]+\/[\w-]+)(?:@(.+))?$/);
  if (scopedNpmMatch) {
    return {
      type: 'npm',
      name: scopedNpmMatch[1],
      version: scopedNpmMatch[2],
      scope: scopedNpmMatch[1].split('/')[0],
    };
  }

  // GitHub URL: 严格匹配 https://github.com/user/repo
  const githubUrlMatch = trimmed.match(/^https?:\/\/github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:\/.*)?$/);
  if (githubUrlMatch) {
    return {
      type: 'github',
      repository: `${githubUrlMatch[1]}/${githubUrlMatch[2]}`,
      name: githubUrlMatch[2],
    };
  }

  // Local tarball: *.tgz 或 *.tar.gz（在 GitHub shorthand 之前检查）
  if (trimmed.endsWith('.tgz') || trimmed.endsWith('.tar.gz')) {
    const ext = trimmed.endsWith('.tar.gz') ? '.tar.gz' : '.tgz';
    return {
      type: 'local',
      name: path.basename(trimmed, ext),
    };
  }

  // GitHub shorthand: user/repo 或 user/repo@ref
  const githubMatch = trimmed.match(/^([\w.-]+)\/([\w.-]+)(?:@([\w./-]+))?$/);
  if (githubMatch) {
    return {
      type: 'github',
      repository: `${githubMatch[1]}/${githubMatch[2]}`,
      name: githubMatch[2],
      version: githubMatch[3] || 'main',
    };
  }

  // npm package: name 或 name@version（支持版本范围如 ^1.0.0、~1.2.0、>=1.0.0）
  const npmMatch = trimmed.match(/^([\w-]+)(?:@(.+))?$/);
  if (npmMatch) {
    return {
      type: 'npm',
      name: npmMatch[1],
      version: npmMatch[2],
    };
  }

  throw new Error(
    `无法识别的插件格式: "${trimmed}"。支持的格式:\n  - ${SUPPORTED_FORMATS}`
  );
}
