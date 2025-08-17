// Mock the logger before requiring the module under test
jest.mock('../../src/lib/logging.js', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

// Mock the config
jest.mock('../../src/config.js', () => ({
  COMMAND_SWITCH: '!'
}));

// Now import the modules
const parseCommands = require('../../src/services/parseCommands.js');
const { logger } = require('../../src/lib/logging.js');

describe('parseCommands', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns false for non-string input', async () => {
    const result = await parseCommands(123);
    expect(result).toBe(false);
    expect(logger.warn).toHaveBeenCalledWith('Invalid command format (not a string or empty): 123');
  });

  test('returns false for empty string', async () => {
    const result = await parseCommands('');
    expect(result).toBe(false);
  });

  test('returns false for non-command messages', async () => {
    const result = await parseCommands('Hello world');
    expect(result).toBe(false);
  });

  test('returns command object for valid commands without arguments', async () => {
    const result = await parseCommands('!help');
    
    expect(result).toEqual({
      isCommand: true,
      command: 'help',
      remainder: '',
      originalText: '!help'
    });
  });

  test('returns command object for valid commands with arguments', async () => {
    const result = await parseCommands('!echo Hello World');
    
    expect(result).toEqual({
      isCommand: true,
      command: 'echo',
      remainder: 'Hello World',
      originalText: '!echo Hello World'
    });
  });

  test('handles commands with extra whitespace', async () => {
    const result = await parseCommands('  !status   arg1   arg2  ');
    
    expect(result).toEqual({
      isCommand: true,
      command: 'status',
      remainder: 'arg1   arg2',
      originalText: '!status   arg1   arg2'
    });
  });

  test('handles command with services parameter', async () => {
    const mockServices = {
      logger: {
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
      },
      config: {
        COMMAND_SWITCH: '!'
      }
    };

    const result = await parseCommands('!test', mockServices);
    
    expect(result).toEqual({
      isCommand: true,
      command: 'test',
      remainder: '',
      originalText: '!test'
    });
    
    expect(mockServices.logger.debug).toHaveBeenCalledWith('Processing message: !test');
  });

  test('handles errors gracefully', async () => {
    // Mock logger to throw an error
    const originalLogger = require('../../src/lib/logging.js').logger;
    originalLogger.debug.mockImplementationOnce(() => {
      throw new Error('Logger error');
    });

    const result = await parseCommands('!help');
    
    expect(result).toBe(false);
    expect(logger.error).toHaveBeenCalledWith('Failed to process command: Logger error');
  });
});
