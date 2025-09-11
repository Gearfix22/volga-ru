import { logger } from '@/utils/logger';

// Mock console methods for testing
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(),
  error: jest.spyOn(console, 'error').mockImplementation(),
  warn: jest.spyOn(console, 'warn').mockImplementation(),
};

// Mock process.env for testing
const originalNodeEnv = process.env.NODE_ENV;

describe('Logger', () => {
  afterEach(() => {
    logger.clearLogs();
    consoleSpy.log.mockClear();
    consoleSpy.error.mockClear();
    consoleSpy.warn.mockClear();
    process.env.NODE_ENV = originalNodeEnv;
  });

  afterAll(() => {
    consoleSpy.log.mockRestore();
    consoleSpy.error.mockRestore();
    consoleSpy.warn.mockRestore();
  });

  test('should log to console in development', () => {
    process.env.NODE_ENV = 'development';
    
    logger.info('test message', { data: 'test' });
    
    expect(consoleSpy.log).toHaveBeenCalledWith(
      expect.stringContaining('[INFO] test message'),
      expect.stringContaining('color: #2196F3'),
      { data: 'test' }
    );
  });

  test('should not log to console in production', () => {
    process.env.NODE_ENV = 'production';
    
    logger.info('test message');
    
    expect(consoleSpy.log).not.toHaveBeenCalled();
  });

  test('should store logs internally', () => {
    logger.info('test message');
    logger.error('error message');
    
    const logs = logger.getLogs();
    
    expect(logs).toHaveLength(2);
    expect(logs[0]).toMatchObject({
      level: 'info',
      message: 'test message'
    });
    expect(logs[1]).toMatchObject({
      level: 'error', 
      message: 'error message'
    });
  });

  test('should limit stored logs to 100', () => {
    // Add 150 logs
    for (let i = 0; i < 150; i++) {
      logger.info(`message ${i}`);
    }
    
    const logs = logger.getLogs();
    expect(logs).toHaveLength(100);
    expect(logs[0].message).toBe('message 50'); // Should keep the latest 100
  });

  test('should clear logs', () => {
    logger.info('test');
    expect(logger.getLogs()).toHaveLength(1);
    
    logger.clearLogs();
    expect(logger.getLogs()).toHaveLength(0);
  });
});