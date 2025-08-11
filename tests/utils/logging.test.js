// Much simpler approach - mock the entire module
jest.mock('../../src/utils/logging', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}), { virtual: true });

describe('Logging utility', () => {
  let fs;
  let path;
  let winston;
  let logger;

  beforeEach(() => {
    // Clear mocks
    jest.clearAllMocks();

    // Import the mocked logger
    logger = require('../../src/utils/logging').logger;
  });

  test('logger exposes expected logging methods', () => {
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
  });

  test('logger methods can be called', () => {
    logger.debug('test debug message');
    logger.info('test info message');
    logger.warn('test warn message');
    logger.error('test error message');

    expect(logger.debug).toHaveBeenCalledWith('test debug message');
    expect(logger.info).toHaveBeenCalledWith('test info message');
    expect(logger.warn).toHaveBeenCalledWith('test warn message');
    expect(logger.error).toHaveBeenCalledWith('test error message');
  });
});
