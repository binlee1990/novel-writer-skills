import {
  NovelWriterError,
  ProjectNotFoundError,
  ProjectExistsError,
  NetworkError,
  PlatformError,
  ConfigError,
  MissingFileError,
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

  describe('MissingFileError', () => {
    it('should create with suggestion', () => {
      const err = new MissingFileError(
        'tracking/character-state.json',
        '运行 /track 初始化追踪系统'
      );
      expect(err).toBeInstanceOf(NovelWriterError);
      expect(err.message).toContain('tracking/character-state.json');
      expect(err.message).toContain('修复建议');
      expect(err.name).toBe('MissingFileError');
      expect(err.code).toBe('MISSING_FILE');
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
  });
});
