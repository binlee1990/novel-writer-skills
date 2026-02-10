export type PluginSource = 'builtin' | 'npm' | 'github' | 'local';
export type PluginType = 'feature' | 'expert' | 'workflow';

export interface PluginMetadata {
  name: string;
  version: string;
  source: PluginSource;
  installedAt: string;
  path: string;
  registry?: string;
  repository?: string;
  commit?: string;
  commands?: string[];
  skills?: string[];
  dependencies?: string[];
}

export interface PluginRegistryData {
  version: string;
  plugins: PluginMetadata[];
}

export interface PluginIdentifier {
  type: PluginSource;
  name: string;
  version?: string;
  scope?: string;
  repository?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface PluginConfig {
  name: string;
  version: string;
  description: string;
  type: PluginType;
  commands?: Array<{
    id: string;
    file: string;
    description: string;
  }>;
  skills?: Array<{
    id: string;
    file: string;
    description: string;
  }>;
  dependencies?: {
    core: string;
  };
  installation?: {
    message?: string;
  };
}

export interface InstallerOptions {
  /** 自定义 npm registry URL */
  registryUrl?: string;
  /** GitHub token（用于私有仓库） */
  githubToken?: string;
}

export interface InstallResult {
  /** 安装的版本 */
  version: string;
  /** 插件在磁盘上的路径 */
  pluginPath: string;
}
