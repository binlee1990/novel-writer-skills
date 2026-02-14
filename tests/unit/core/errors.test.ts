import {
  NovelWriterError,
  ProjectNotFoundError,
  ProjectExistsError,
  PluginNotFoundError,
  PluginValidationError,
  PluginInstallError,
  NetworkError,
  PlatformError,
  ConfigError,
  PluginAlreadyInstalledError,
  MissingFileError,
  ModeMismatchError,
  DataIntegrityError,
  DependencyMissingError,
  handleError,
} from '../../../src/core/errors.js';

describe('core/errors.ts', () => {
  describe('NovelWriterError', () => {
    it('should set message, code, and exitCode', () => {
      const err = new NovelWriterError('test', 'TEST_CODE', 2);
      expect(err.message).toBe('test');
      expect(err.code).toBe('TEST_CODE');
      expect(err.exitCode).toBe(2);
      expect(err.name).toBe('NovelWriterError');
    });

    it('should default exitCode to 1', () => {
      const err = new NovelWriterError('test', 'TEST');
      expect(err.exitCode).toBe(1);
    });

    it('should be an instance of Error', () => {
      const err = new NovelWriterError('test', 'TEST');
      expect(err).toBeInstanceOf(Error);
    });
  });

  describe('ProjectNotFoundError', () => {
    it('should have PROJECT_NOT_FOUND code', () => {
      const err = new ProjectNotFoundError();
      expect(err.code).toBe('PROJECT_NOT_FOUND');
      expect(err).toBeInstanceOf(NovelWriterError);
    });

    it('should include dir in message when provided', () => {
      const err = new ProjectNotFoundError('/some/dir');
      expect(err.message).toContain('/some/dir');
    });

    it('should use default message when no dir provided', () => {
      const err = new ProjectNotFoundError();
      expect(err.message).toContain('当前目录不是');
    });
  });

  describe('ProjectExistsError', () => {
    it('should have PROJECT_EXISTS code', () => {
      const err = new ProjectExistsError('my-novel');
      expect(err.code).toBe('PROJECT_EXISTS');
      expect(err.message).toContain('my-novel');
    });
  });

  describe('PluginNotFoundError', () => {
    it('should have PLUGIN_NOT_FOUND code', () => {
      const err = new PluginNotFoundError('test-plugin');
      expect(err.code).toBe('PLUGIN_NOT_FOUND');
      expect(err.message).toContain('test-plugin');
    });
  });

  describe('PluginValidationError', () => {
    it('should store errors and warnings', () => {
      const err = new PluginValidationError('p', ['err1', 'err2'], ['warn1']);
      expect(err.code).toBe('PLUGIN_VALIDATION_FAILED');
      expect(err.errors).toEqual(['err1', 'err2']);
      expect(err.warnings).toEqual(['warn1']);
    });

    it('should default warnings to empty array', () => {
      const err = new PluginValidationError('p', ['err1']);
      expect(err.warnings).toEqual([]);
    });
  });

  describe('PluginInstallError', () => {
    it('should include source and reason', () => {
      const err = new PluginInstallError('p', 'npm', '下载失败');
      expect(err.code).toBe('PLUGIN_INSTALL_FAILED');
      expect(err.source).toBe('npm');
      expect(err.message).toContain('npm');
      expect(err.message).toContain('下载失败');
    });

    it('should work without reason', () => {
      const err = new PluginInstallError('p', 'github');
      expect(err.message).toContain('github');
    });
  });

  describe('NetworkError', () => {
    it('should store url and statusCode', () => {
      const err = new NetworkError('https://example.com', 404);
      expect(err.code).toBe('NETWORK_ERROR');
      expect(err.url).toBe('https://example.com');
      expect(err.statusCode).toBe(404);
      expect(err.message).toContain('404');
    });

    it('should work with reason only', () => {
      const err = new NetworkError('https://example.com', undefined, '超时');
      expect(err.message).toContain('超时');
    });
  });

  describe('PlatformError', () => {
    it('should have PLATFORM_ERROR code', () => {
      const err = new PlatformError('不支持的平台');
      expect(err.code).toBe('PLATFORM_ERROR');
    });
  });

  describe('ConfigError', () => {
    it('should store configPath', () => {
      const err = new ConfigError('/path/config.json', '格式错误');
      expect(err.code).toBe('CONFIG_ERROR');
      expect(err.configPath).toBe('/path/config.json');
      expect(err.message).toContain('格式错误');
    });
  });

  describe('PluginAlreadyInstalledError', () => {
    it('should have PLUGIN_ALREADY_INSTALLED code', () => {
      const err = new PluginAlreadyInstalledError('test-plugin');
      expect(err.code).toBe('PLUGIN_ALREADY_INSTALLED');
      expect(err.message).toContain('test-plugin');
    });
  });

  describe('MissingFileError', () => {
    it('should create with suggestion', () => {
      const err = new MissingFileError(
        'spec/tracking/character-state.json',
        '运行 /track-init 初始化追踪系统'
      );
      expect(err).toBeInstanceOf(NovelWriterError);
      expect(err.message).toContain('spec/tracking/character-state.json');
      expect(err.message).toContain('💡 修复建议');
      expect(err.message).toContain('/track-init');
      expect(err.name).toBe('MissingFileError');
      expect(err.code).toBe('MISSING_FILE');
    });
  });

  describe('ModeMismatchError', () => {
    it('should create with migration suggestion', () => {
      const err = new ModeMismatchError('mcp', 'single-file', '/search');
      expect(err).toBeInstanceOf(NovelWriterError);
      expect(err.message).toContain('single-file');
      expect(err.message).toContain('mcp');
      expect(err.message).toContain('/search');
      expect(err.message).toContain('/track --migrate');
      expect(err.name).toBe('ModeMismatchError');
      expect(err.code).toBe('MODE_MISMATCH');
    });
  });

  describe('DataIntegrityError', () => {
    it('should show auto-fix message when fixed', () => {
      const err = new DataIntegrityError('character-state.json 格式错误', true);
      expect(err).toBeInstanceOf(NovelWriterError);
      expect(err.message).toContain('character-state.json');
      expect(err.message).toContain('✅ 已自动修复');
      expect(err.name).toBe('DataIntegrityError');
      expect(err.code).toBe('DATA_INTEGRITY');
    });

    it('should show manual check message when not fixed', () => {
      const err = new DataIntegrityError('timeline.json 数据冲突', false);
      expect(err.message).toContain('⚠️ 需要手动检查');
    });
  });

  describe('DependencyMissingError', () => {
    it('should create with install instructions', () => {
      const err = new DependencyMissingError(
        'MCP服务器',
        '检查 .claude/config.json 中的 mcpServers 配置'
      );
      expect(err).toBeInstanceOf(NovelWriterError);
      expect(err.message).toContain('MCP服务器');
      expect(err.message).toContain('.claude/config.json');
      expect(err.name).toBe('DependencyMissingError');
      expect(err.code).toBe('DEPENDENCY_MISSING');
    });
  });

  describe('handleError()', () => {
    let exitSpy: jest.SpyInstance;
    let errorSpy: jest.SpyInstance;

    beforeEach(() => {
      exitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: number | string | null | undefined) => {
        throw new Error(`process.exit(${code})`);
      });
      errorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      exitSpy.mockRestore();
      errorSpy.mockRestore();
    });

    it('should exit with error exitCode for NovelWriterError', () => {
      const err = new NovelWriterError('test', 'TEST', 2);
      expect(() => handleError(err)).toThrow('process.exit(2)');
      expect(exitSpy).toHaveBeenCalledWith(2);
    });

    it('should exit with 1 for generic Error', () => {
      expect(() => handleError(new Error('generic'))).toThrow('process.exit(1)');
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('should exit with 0 for commander help output', () => {
      expect(() => handleError(new Error('(outputHelp)'))).toThrow('process.exit(0)');
      expect(exitSpy).toHaveBeenCalledWith(0);
    });

    it('should exit with 1 for unknown error', () => {
      expect(() => handleError('string error')).toThrow('process.exit(1)');
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('should print validation errors for PluginValidationError', () => {
      const err = new PluginValidationError('p', ['err1', 'err2']);
      expect(() => handleError(err)).toThrow('process.exit(1)');
      expect(errorSpy).toHaveBeenCalledTimes(3); // message + 2 errors
    });
  });
});
