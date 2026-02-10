/**
 * 插件验证器
 *
 * 验证插件目录结构和 config.yaml 内容。
 * 增强：schema 校验、运行时类型检查、文件名合法性验证。
 */

import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import { ValidationResult, PluginConfig } from './types.js';

/** 合法的插件类型 */
const VALID_PLUGIN_TYPES = ['feature', 'expert', 'workflow'];

/** 检查 ID 是否为合法文件名 */
function isValidId(id: string): boolean {
  return /^[\w-]+$/.test(id);
}

export class PluginValidator {
  /**
   * 验证插件目录
   */
  static async validate(pluginPath: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
    };

    // 1. 检查 config.yaml 存在
    const configPath = path.join(pluginPath, 'config.yaml');
    if (!await fs.pathExists(configPath)) {
      result.valid = false;
      result.errors.push('config.yaml 未找到');
      return result;
    }

    // 2. 解析 YAML
    let rawConfig: unknown;
    try {
      const content = await fs.readFile(configPath, 'utf-8');
      rawConfig = yaml.load(content);
    } catch {
      result.valid = false;
      result.errors.push('config.yaml 不是有效的 YAML 格式');
      return result;
    }

    if (!rawConfig || typeof rawConfig !== 'object') {
      result.valid = false;
      result.errors.push('config.yaml 内容为空或无效');
      return result;
    }

    const config = rawConfig as Record<string, unknown>;

    // 3. 验证必填字段
    if (!config.name || typeof config.name !== 'string') {
      result.valid = false;
      result.errors.push('config.yaml 缺少必填字段: name');
    }

    if (!config.version || typeof config.version !== 'string') {
      result.warnings.push('config.yaml 缺少 version 字段');
    }

    if (!config.description || typeof config.description !== 'string') {
      result.warnings.push('config.yaml 缺少 description 字段');
    }

    // 4. 验证 type 字段
    if (config.type) {
      if (typeof config.type !== 'string' || !VALID_PLUGIN_TYPES.includes(config.type)) {
        result.warnings.push(
          `config.yaml 的 type 字段无效: "${config.type}"，有效值: ${VALID_PLUGIN_TYPES.join(', ')}`
        );
      }
    }

    // 5. 验证命令声明
    if (config.commands) {
      if (!Array.isArray(config.commands)) {
        result.valid = false;
        result.errors.push('config.yaml 的 commands 字段必须是数组');
      } else {
        for (const cmd of config.commands) {
          if (!cmd || typeof cmd !== 'object') {
            result.errors.push('commands 数组中包含无效条目');
            result.valid = false;
            continue;
          }

          const cmdObj = cmd as Record<string, unknown>;

          if (!cmdObj.id || typeof cmdObj.id !== 'string') {
            result.errors.push('命令缺少 id 字段');
            result.valid = false;
          } else if (!isValidId(cmdObj.id)) {
            result.errors.push(`命令 ID 不合法: "${cmdObj.id}"（只允许字母、数字、下划线、连字符）`);
            result.valid = false;
          }

          // 检查命令文件是否存在
          const cmdFile = (cmdObj.file as string) || `${cmdObj.id || 'unknown'}.md`;
          const cmdPath = path.join(pluginPath, cmdFile);
          if (!await fs.pathExists(cmdPath)) {
            result.warnings.push(`声明的命令文件不存在: ${cmdFile}`);
          }
        }
      }
    }

    // 6. 验证 Skills 声明
    if (config.skills) {
      if (!Array.isArray(config.skills)) {
        result.valid = false;
        result.errors.push('config.yaml 的 skills 字段必须是数组');
      } else {
        for (const skill of config.skills) {
          if (!skill || typeof skill !== 'object') {
            result.errors.push('skills 数组中包含无效条目');
            result.valid = false;
            continue;
          }

          const skillObj = skill as Record<string, unknown>;

          if (!skillObj.id || typeof skillObj.id !== 'string') {
            result.errors.push('Skill 缺少 id 字段');
            result.valid = false;
          } else if (!isValidId(skillObj.id)) {
            result.errors.push(`Skill ID 不合法: "${skillObj.id}"（只允许字母、数字、下划线、连字符）`);
            result.valid = false;
          }

          // 检查 Skill 文件是否存在
          const skillFile = (skillObj.file as string) || path.join('skills', String(skillObj.id || 'unknown'), 'SKILL.md');
          const skillPath = path.join(pluginPath, skillFile);
          if (!await fs.pathExists(skillPath)) {
            result.warnings.push(`声明的 Skill 文件不存在: ${skillFile}`);
          }
        }
      }
    }

    return result;
  }

  /**
   * 安全解析 config.yaml 为 PluginConfig
   * 返回 null 表示解析失败
   */
  static async parseConfig(configPath: string): Promise<PluginConfig | null> {
    try {
      const content = await fs.readFile(configPath, 'utf-8');
      const raw = yaml.load(content);

      if (!raw || typeof raw !== 'object') {
        return null;
      }

      const config = raw as Record<string, unknown>;

      if (!config.name || typeof config.name !== 'string') {
        return null;
      }

      return {
        name: config.name,
        version: typeof config.version === 'string' ? config.version : '0.0.0',
        description: typeof config.description === 'string' ? config.description : '',
        type: VALID_PLUGIN_TYPES.includes(config.type as string)
          ? (config.type as PluginConfig['type'])
          : 'feature',
        commands: Array.isArray(config.commands) ? config.commands as PluginConfig['commands'] : undefined,
        skills: Array.isArray(config.skills) ? config.skills as PluginConfig['skills'] : undefined,
        dependencies: config.dependencies as PluginConfig['dependencies'],
        installation: config.installation as PluginConfig['installation'],
      };
    } catch {
      return null;
    }
  }
}
