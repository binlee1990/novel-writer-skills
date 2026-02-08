import path from 'path';
import { PluginIdentifier } from './types.js';

/**
 * 解析插件标识符，识别来源类型
 *
 * 支持格式:
 * - npm scoped: @scope/name or @scope/name@version
 * - npm: name or name@version
 * - GitHub: user/repo or user/repo@ref
 * - GitHub URL: https://github.com/user/repo
 * - Local tarball: ./path.tgz or ./path.tar.gz
 */
export function parsePluginIdentifier(input: string): PluginIdentifier {
  // npm scoped package: @scope/name@version
  const scopedNpmMatch = input.match(/^(@[\w-]+\/[\w-]+)(?:@([\w.-]+))?$/);
  if (scopedNpmMatch) {
    return {
      type: 'npm',
      name: scopedNpmMatch[1],
      version: scopedNpmMatch[2],
      scope: scopedNpmMatch[1].split('/')[0],
    };
  }

  // GitHub URL: https://github.com/user/repo
  const githubUrlMatch = input.match(/github\.com\/([\w.-]+)\/([\w.-]+)/);
  if (githubUrlMatch) {
    const repoName = githubUrlMatch[2].replace(/\.git$/, '');
    return {
      type: 'github',
      repository: `${githubUrlMatch[1]}/${repoName}`,
      name: repoName,
    };
  }

  // Local tarball: *.tgz or *.tar.gz (check before GitHub to avoid false matches)
  if (input.endsWith('.tgz') || input.endsWith('.tar.gz')) {
    const ext = input.endsWith('.tar.gz') ? '.tar.gz' : '.tgz';
    return {
      type: 'local',
      name: path.basename(input, ext),
    };
  }

  // GitHub: user/repo or user/repo@ref
  const githubMatch = input.match(/^([\w.-]+)\/([\w.-]+)(?:@([\w.-]+))?$/);
  if (githubMatch) {
    return {
      type: 'github',
      repository: `${githubMatch[1]}/${githubMatch[2]}`,
      name: githubMatch[2],
      version: githubMatch[3] || 'main',
    };
  }

  // npm package: name or name@version (must not contain /)
  const npmMatch = input.match(/^([\w-]+)(?:@([\w.-]+))?$/);
  if (npmMatch) {
    return {
      type: 'npm',
      name: npmMatch[1],
      version: npmMatch[2],
    };
  }

  throw new Error(`Invalid plugin identifier: ${input}`);
}
