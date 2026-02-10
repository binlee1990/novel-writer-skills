import { logger } from '../../../src/utils/logger.js';

describe('utils/logger.ts', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    logger.setLevel('info');
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    delete process.env.DEBUG;
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
      logger.setLevel('debug');
      logger.debug('Debug message');
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should log when DEBUG is set and level is debug', () => {
      process.env.DEBUG = '1';
      logger.setLevel('debug');
      logger.debug('Debug message');
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy.mock.calls[0][1]).toBe('Debug message');
    });
  });

  describe('setLevel() / getLevel()', () => {
    it('should default to info level', () => {
      expect(logger.getLevel()).toBe('info');
    });

    it('should change the log level', () => {
      logger.setLevel('warn');
      expect(logger.getLevel()).toBe('warn');
    });

    it('should suppress info when level is warn', () => {
      logger.setLevel('warn');
      logger.info('should not appear');
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should suppress info and warn when level is error', () => {
      logger.setLevel('error');
      logger.info('no');
      logger.warn('no');
      expect(consoleSpy).not.toHaveBeenCalled();
      logger.error('yes');
      expect(consoleSpy).toHaveBeenCalledTimes(1);
    });

    it('should suppress all output when level is silent', () => {
      logger.setLevel('silent');
      logger.info('no');
      logger.warn('no');
      logger.error('no');
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should allow all levels when set to debug', () => {
      logger.setLevel('debug');
      logger.info('info');
      logger.warn('warn');
      logger.error('error');
      expect(consoleSpy).toHaveBeenCalledTimes(3);
    });
  });
});
