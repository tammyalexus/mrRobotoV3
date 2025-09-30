// Mock the modules before importing messageService
jest.mock('../../../src/lib/logging.js', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

jest.mock('../../../src/services/cometchatApi');

// Now import the modules that use the mocked dependencies
const { messageService } = require('../../../src/services/messageService.js');
const cometchatApi = require('../../../src/services/cometchatApi');
const { logger } = require('../../../src/lib/logging.js');

describe('fetchAllPrivateUserMessages with logging options', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    
    // Mock the fetchMessages method
    cometchatApi.fetchMessages = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('logs the sender and message when logLastMessage is true and messages exist', async () => {
    const mockMessages = [
      {
        id: '25812293',
        sender: { uid: 'abcdef-ccd3-4c1b-9846-5336fbd3b415' },
        data: {
          text: 'Hello Mr. Roboto version 3!',
          metadata: {},
          entities: {}
        },
        sentAt: 1640995200
      }
    ];

    cometchatApi.fetchMessages.mockResolvedValue({
      data: {
        data: mockMessages
      }
    });

    await messageService.fetchAllPrivateUserMessages('test-user-uuid', { logLastMessage: true, returnData: false });

    // Check that message was logged (don't test exact format)
    expect(logger.debug).toHaveBeenCalledWith(
      expect.stringContaining('Private message from abcdef-ccd3-4c1b-9846-5336fbd3b415')
    );
  });

  test('logs a fallback message if text is missing', async () => {
    const mockMessages = [
      {
        id: '25812294',
        sender: { uid: 'user-123' },
        data: {
          metadata: {},
          entities: {}
        },
        sentAt: 1640995200
      }
    ];

    cometchatApi.fetchMessages.mockResolvedValue({
      data: {
        data: mockMessages
      }
    });

    await messageService.fetchAllPrivateUserMessages('test-user-uuid', { logLastMessage: true, returnData: false });

    // Check that message was logged (don't test exact format)
    expect(logger.debug).toHaveBeenCalledWith(
      expect.stringContaining('Private message from user-123')
    );
  });

  test('logs when no messages exist', async () => {
    cometchatApi.fetchMessages.mockResolvedValue({
      data: {
        data: []
      }
    });

    await messageService.fetchAllPrivateUserMessages('test-user-uuid', { logLastMessage: true, returnData: false });

    // Check that "no messages" was logged (don't test exact format)
    expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('No private messages'));
  });

  test('logs an error when the API call fails', async () => {
    cometchatApi.fetchMessages.mockRejectedValue(new Error('Request failed'));

    await messageService.fetchAllPrivateUserMessages('test-user-uuid', { logLastMessage: true, returnData: false });

    // Check that error was logged (don't test exact format)
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Error fetching private messages')
    );
  });

  test('returns empty array when returnData is false', async () => {
    const mockMessages = [
      {
        id: '25812293',
        sender: { uid: 'test-user' },
        data: {
          text: 'Test message'
        },
        sentAt: 1640995200
      }
    ];

    cometchatApi.fetchMessages.mockResolvedValue({
      data: {
        data: mockMessages
      }
    });

    const result = await messageService.fetchAllPrivateUserMessages('test-user-uuid', { returnData: false });

    expect(result).toEqual([]);
  });

  test('returns message data when returnData is true (default)', async () => {
    const mockMessages = [
      {
        id: '25812293',
        sender: { uid: 'test-user' },
        data: {
          text: 'Test message'
        },
        sentAt: 1640995200
      }
    ];

    cometchatApi.fetchMessages.mockResolvedValue({
      data: {
        data: mockMessages
      }
    });

    const result = await messageService.fetchAllPrivateUserMessages('test-user-uuid');

    expect(result).toEqual([
      {
        id: '25812293',
        text: 'Test message',
        sender: 'test-user',
        sentAt: 1640995200,
        customData: null
      }
    ]);
  });

  test('handles both logging and data return when both options are true', async () => {
    const mockMessages = [
      {
        id: '25812293',
        sender: { uid: 'test-user' },
        data: {
          text: 'Test message'
        },
        sentAt: 1640995200
      }
    ];

    cometchatApi.fetchMessages.mockResolvedValue({
      data: {
        data: mockMessages
      }
    });

    const result = await messageService.fetchAllPrivateUserMessages('test-user-uuid', { 
      logLastMessage: true, 
      returnData: true 
    });

    // Check that message was logged (don't test exact format)
    expect(logger.debug).toHaveBeenCalledWith(
      expect.stringContaining('Private message from test-user')
    );
    expect(result).toEqual([
      {
        id: '25812293',
        text: 'Test message',
        sender: 'test-user',
        sentAt: 1640995200,
        customData: null
      }
    ]);
  });
});
