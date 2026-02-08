export type PluginSource = 'builtin' | 'npm' | 'github' | 'local';

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

export interface PluginRegistry {
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
