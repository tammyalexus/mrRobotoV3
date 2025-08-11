// Mock the logger before requiring the module under test
jest.mock('../../src/utils/logging.js', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

// Mock the messageService
jest.mock('../../src/services/messageService.js', () => ({
  messageService: {
    sendGroupMessage: jest.fn()
  }
}));

// Now import the modules
const parseCommands = require('../../src/services/parseCommands.js');
const { messageService } = require('../../src/services/messageService.js');
const { logger } = require('../../src/utils/logging.js');

describe('parseCommands', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('throws error if messages parameter is not an array', async () => {
    await expect(parseCommands('not an array')).rejects.toThrow('Invalid messages parameter: expected an array');
  });

  test('logs warning for invalid message format and continues', async () => {
    const messages = [
      { id: '1' }, // missing data.text
      { id: '2', data: { text: 'valid command' } }
    ];

    await parseCommands(messages);

    expect(logger.warn).toHaveBeenCalledWith('⚠️ Skipping invalid message format:', messages[0]);
    expect(logger.debug).toHaveBeenCalledWith('⚙️ Processing command [2]: valid command');
    expect(messageService.sendGroupMessage).toHaveBeenCalledTimes(1);
    expect(messageService.sendGroupMessage).toHaveBeenCalledWith('I heard the command valid command');
  });

  test('processes valid commands and sends responses', async () => {
    const messages = [
      { id: '1', data: { text: '!help' } },
      { id: '2', data: { text: '!status' } }
    ];

    await parseCommands(messages);

    expect(logger.debug).toHaveBeenCalledWith('⚙️ Processing command [1]: !help');
    expect(logger.debug).toHaveBeenCalledWith('⚙️ Processing command [2]: !status');
    expect(messageService.sendGroupMessage).toHaveBeenCalledTimes(2);
    expect(messageService.sendGroupMessage).toHaveBeenCalledWith('I heard the command !help');
    expect(messageService.sendGroupMessage).toHaveBeenCalledWith('I heard the command !status');
  });

  test('logs error if processing a command fails but continues with others', async () => {
    const messages = [
      { id: '1', data: { text: '!help' } },
      { id: '2', data: { text: '!error' } }
    ];

    const error = new Error('Command processing failed');
    messageService.sendGroupMessage.mockImplementationOnce(() => Promise.resolve());
    messageService.sendGroupMessage.mockImplementationOnce(() => Promise.reject(error));

    await parseCommands(messages);

    expect(logger.debug).toHaveBeenCalledWith('⚙️ Processing command [1]: !help');
    expect(logger.debug).toHaveBeenCalledWith('⚙️ Processing command [2]: !error');
    expect(logger.error).toHaveBeenCalledWith('❌ Failed to process command [2]:', 'Command processing failed');
    expect(messageService.sendGroupMessage).toHaveBeenCalledTimes(2);
  });
});
