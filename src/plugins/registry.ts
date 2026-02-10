/**
 * 插件注册表管理
 *
 * 独立管理 .specify/plugins.json 的读写，
 * 从 manager.ts 中拆出以实现职责单一。
 */

import fs from 'fs-extra';
import path from 'path';
import { PluginRegistryData, PluginMetadata } from './types.js';
import { ConfigError } from '../core/errors.js';

const EMPTY_REGISTRY: PluginRegistryData = {
  version: '1.0.0',
  plugins: [],
};

export class PluginRegistry {
  private registryPath: string;
  private data: PluginRegistryData;
  private loaded: boolean = false;

  constructor(registryPath: string) {
    this.registryPath = registryPath;
    this.data = { ...EMPTY_REGISTRY, plugins: [] };
  }

  /**
   * 从磁盘加载注册表
   */
  async load(): Promise<void> {
    try {
      if (await fs.pathExists(this.registryPath)) {
        const raw = await fs.readJson(this.registryPath);
        if (raw && typeof raw === 'object' && Array.isArray(raw.plugins)) {
          this.data = raw as PluginRegistryData;
        } else {
          this.data = { ...EMPTY_REGISTRY, plugins: [] };
        }
      } else {
        this.data = { ...EMPTY_REGISTRY, plugins: [] };
      }
    } catch {
      // 注册表损坏，使用空注册表
      this.data = { ...EMPTY_REGISTRY, plugins: [] };
    }
    this.loaded = true;
  }

  /**
   * 保存注册表到磁盘
   */
  async save(): Promise<void> {
    try {
      await fs.ensureDir(path.dirname(this.registryPath));
      await fs.writeJson(this.registryPath, this.data, { spaces: 2 });
    } catch (error) {
      throw new ConfigError(
        this.registryPath,
        `保存注册表失败: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 添加插件元数据
   */
  add(metadata: PluginMetadata): void {
    this.ensureLoaded();
    // 如果已存在同名插件，先移除
    this.data.plugins = this.data.plugins.filter(p => p.name !== metadata.name);
    this.data.plugins.push(metadata);
  }

  /**
   * 移除插件
   * 返回 true 表示成功移除，false 表示未找到
   */
  remove(name: string): boolean {
    this.ensureLoaded();
    const before = this.data.plugins.length;
    this.data.plugins = this.data.plugins.filter(p => p.name !== name);
    return this.data.plugins.length < before;
  }

  /**
   * 查找插件
   */
  find(name: string): PluginMetadata | undefined {
    this.ensureLoaded();
    return this.data.plugins.find(p => p.name === name);
  }

  /**
   * 检查插件是否存在
   */
  has(name: string): boolean {
    this.ensureLoaded();
    return this.data.plugins.some(p => p.name === name);
  }

  /**
   * 列出所有插件
   */
  list(): PluginMetadata[] {
    this.ensureLoaded();
    return [...this.data.plugins];
  }

  /**
   * 获取原始注册表数据
   */
  getData(): PluginRegistryData {
    this.ensureLoaded();
    return { ...this.data, plugins: [...this.data.plugins] };
  }

  private ensureLoaded(): void {
    if (!this.loaded) {
      throw new Error('注册表未加载，请先调用 load()');
    }
  }
}
