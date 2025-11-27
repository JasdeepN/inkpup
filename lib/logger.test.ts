import { createLogger } from './logger';

describe('logger', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    jest.spyOn(console, 'debug').mockImplementation();
    jest.spyOn(console, 'info').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  describe('createLogger', () => {
    it('creates logger with namespace prefix', () => {
      process.env.LOG_LEVEL = 'debug';
      // Re-import to pick up new env
      const { createLogger: freshCreateLogger } = require('./logger');
      const log = freshCreateLogger('test-module');
      
      log.debug('test message');
      
      expect(console.debug).toHaveBeenCalledWith('[test-module]', 'test message');
    });

    it('passes multiple arguments', () => {
      process.env.LOG_LEVEL = 'debug';
      const { createLogger: freshCreateLogger } = require('./logger');
      const log = freshCreateLogger('test');
      
      log.debug('msg', { data: 1 }, 'extra');
      
      expect(console.debug).toHaveBeenCalledWith('[test]', 'msg', { data: 1 }, 'extra');
    });
  });

  describe('log levels', () => {
    it('respects LOG_LEVEL=debug (shows all)', () => {
      process.env.LOG_LEVEL = 'debug';
      const { createLogger: freshCreateLogger } = require('./logger');
      const log = freshCreateLogger('test');
      
      log.debug('d');
      log.info('i');
      log.warn('w');
      log.error('e');
      
      expect(console.debug).toHaveBeenCalled();
      expect(console.info).toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });

    it('respects LOG_LEVEL=info (hides debug)', () => {
      process.env.LOG_LEVEL = 'info';
      const { createLogger: freshCreateLogger } = require('./logger');
      const log = freshCreateLogger('test');
      
      log.debug('d');
      log.info('i');
      log.warn('w');
      log.error('e');
      
      expect(console.debug).not.toHaveBeenCalled();
      expect(console.info).toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });

    it('respects LOG_LEVEL=warn (hides debug, info)', () => {
      process.env.LOG_LEVEL = 'warn';
      const { createLogger: freshCreateLogger } = require('./logger');
      const log = freshCreateLogger('test');
      
      log.debug('d');
      log.info('i');
      log.warn('w');
      log.error('e');
      
      expect(console.debug).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });

    it('respects LOG_LEVEL=error (shows only error)', () => {
      process.env.LOG_LEVEL = 'error';
      const { createLogger: freshCreateLogger } = require('./logger');
      const log = freshCreateLogger('test');
      
      log.debug('d');
      log.info('i');
      log.warn('w');
      log.error('e');
      
      expect(console.debug).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });

    it('respects LOG_LEVEL=silent (shows nothing)', () => {
      process.env.LOG_LEVEL = 'silent';
      const { createLogger: freshCreateLogger } = require('./logger');
      const log = freshCreateLogger('test');
      
      log.debug('d');
      log.info('i');
      log.warn('w');
      log.error('e');
      
      expect(console.debug).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
    });

    it('defaults to warn in production', () => {
      delete process.env.LOG_LEVEL;
      process.env.NODE_ENV = 'production';
      const { createLogger: freshCreateLogger } = require('./logger');
      const log = freshCreateLogger('test');
      
      log.info('i');
      log.warn('w');
      
      expect(console.info).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalled();
    });

    it('defaults to info in development', () => {
      delete process.env.LOG_LEVEL;
      process.env.NODE_ENV = 'development';
      const { createLogger: freshCreateLogger } = require('./logger');
      const log = freshCreateLogger('test');
      
      log.debug('d');
      log.info('i');
      
      expect(console.debug).not.toHaveBeenCalled();
      expect(console.info).toHaveBeenCalled();
    });

    it('is case-insensitive for LOG_LEVEL', () => {
      process.env.LOG_LEVEL = 'DEBUG';
      const { createLogger: freshCreateLogger } = require('./logger');
      const log = freshCreateLogger('test');
      
      log.debug('d');
      
      expect(console.debug).toHaveBeenCalled();
    });
  });

  describe('pre-configured loggers', () => {
    it('exports r2Logger', () => {
      const { r2Logger } = require('./logger');
      expect(r2Logger).toBeDefined();
      expect(typeof r2Logger.debug).toBe('function');
      expect(typeof r2Logger.info).toBe('function');
      expect(typeof r2Logger.warn).toBe('function');
      expect(typeof r2Logger.error).toBe('function');
    });

    it('exports heroLogger', () => {
      const { heroLogger } = require('./logger');
      expect(heroLogger).toBeDefined();
    });

    it('exports dbLogger', () => {
      const { dbLogger } = require('./logger');
      expect(dbLogger).toBeDefined();
    });

    it('exports cacheLogger', () => {
      const { cacheLogger } = require('./logger');
      expect(cacheLogger).toBeDefined();
    });
  });
});
