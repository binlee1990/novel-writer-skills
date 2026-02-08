import { logger } from '../../../src/utils/logger.js';

describe('utils/logger.ts', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('info()', () => {
    it('should call console.log with message', () => {
      logger.info('Test info message');
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy.mock.calls[0][1]).toBe('Test info message');
    });

    it('should pass additional arguments', () => {
      logger.info('Message', 'extra1', 'extra2');
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy.mock.calls[0][2]).toBe('extra1');
      expect(consoleSpy.mock.calls[0][3]).toBe('extra2');
    });
  });

  describe('success()', () => {
    it('should call console.log with message', () => {
      logger.success('Success message');
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy.mock.calls[0][1]).toBe('Success message');
    });
  });

  describe('warn()', () => {
    it('should call console.log with message', () => {
      logger.warn('Warning message');
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy.mock.calls[0][1]).toBe('Warning message');
    });
  });

  describe('error()', () => {
    it('should call console.log with message', () => {
      logger.error('Error message');
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy.mock.calls[0][1]).toBe('Error message');
    });
  });

  describe('debug()', () => {
    it('should not log when DEBUG is not set', () => {
      delete process.env.DEBUG;
      logger.debug('Debug message');
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should log when DEBUG is set', () => {
      process.env.DEBUG = '1';
      logger.debug('Debug message');
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy.mock.calls[0][1]).toBe('Debug message');
      delete process.env.DEBUG;
    });
  });
});
