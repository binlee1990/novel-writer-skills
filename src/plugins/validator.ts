import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import { ValidationResult } from './types.js';

export class PluginValidator {
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
      result.errors.push('config.yaml not found');
      return result;
    }

    // 2. 解析并验证 config.yaml
    let config: any;
    try {
      const content = await fs.readFile(configPath, 'utf-8');
      config = yaml.load(content);
    } catch {
      result.valid = false;
      result.errors.push('config.yaml is not valid YAML');
      return result;
    }

    if (!config || typeof config !== 'object') {
      result.valid = false;
      result.errors.push('config.yaml is empty or invalid');
      return result;
    }

    if (!config.name) {
      result.valid = false;
      result.errors.push('config.yaml missing required field: name');
    }

    if (!config.version) {
      result.warnings.push('config.yaml missing version field');
    }

    if (!config.description) {
      result.warnings.push('config.yaml missing description field');
    }

    // 3. 检查声明的命令文件是否存在
    if (config.commands && Array.isArray(config.commands)) {
      for (const cmd of config.commands) {
        const cmdFile = cmd.file || `${cmd.id || cmd}.md`;
        const cmdPath = path.join(pluginPath, cmdFile);
        if (!await fs.pathExists(cmdPath)) {
          result.warnings.push(`Declared command file not found: ${cmdFile}`);
        }
      }
    }

    // 4. 检查声明的 skills 文件是否存在
    if (config.skills && Array.isArray(config.skills)) {
      for (const skill of config.skills) {
        const skillFile = skill.file || path.join('skills', skill.id || skill, 'SKILL.md');
        const skillPath = path.join(pluginPath, skillFile);
        if (!await fs.pathExists(skillPath)) {
          result.warnings.push(`Declared skill file not found: ${skillFile}`);
        }
      }
    }

    return result;
  }
}
