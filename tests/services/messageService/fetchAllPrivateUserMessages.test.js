// Mock modules before importing messageService
jest.mock('../../../src/lib/logging.js', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

jest.mock('../../../src/lib/buildUrl.js', () => ({
  buildUrl: jest.fn()
}));

jest.mock('../../../src/services/cometchatApi.js', () => ({
  BASE_URL: 'https://test-api.cometchat.com',
  apiClient: {
    get: jest.fn()
  }
}));

jest.mock('../../../src/config.js', () => ({
  BOT_UID: 'test-bot-uid'
}));

const { messageService } = require('../../../src/services/messageService.js');
const { buildUrl } = require('../../../src/lib/buildUrl.js');
const cometchatApi = require('../../../src/services/cometchatApi.js');
const config = require('../../../src/config.js');
const { logger } = require('../../../src/lib/logging.js');

describe('messageService.fetchAllPrivateUserMessages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    buildUrl.mockReturnValue('https://test-api.cometchat.com/v3/users/test-user/messages');
  });

  test('should return simplified messages for user with customData', async () => {
    const mockResponse = {
      data: {
        data: [
          {
            id: 'msg-1',
            data: {
              customData: {
                message: 'Hello there!'
              }
            },
            readAt: 1640995200, // Unix timestamp
            sender: 'user-123'
          },
          {
            id: 'msg-2',
            data: {
              text: 'Direct text message'
            },
            readAt: null,
            sender: 'user-456'
          }
        ]
      }
    };
    cometchatApi.apiClient.get.mockResolvedValue(mockResponse);

    const result = await messageService.fetchAllPrivateUserMessages('test-user');

    expect(buildUrl).toHaveBeenCalledWith(
      cometchatApi.BASE_URL,
      ['v3', 'users', 'test-user', 'messages'],
      [
        ['limit', 50],
        ['unread', true],
        ['uid', config.BOT_UID]
      ]
    );
    expect(result).toEqual([
      {
        id: 'msg-1',
        message: 'Hello there!',
        readAt: '2022-01-01T00:00:00.000Z',
        sender: 'user-123'
      },
      {
        id: 'msg-2',
        message: 'Direct text message',
        readAt: 'unread',
        sender: 'user-456'
      }
    ]);
  });

  test('should handle messages with no content gracefully', async () => {
    const mockResponse = {
      data: {
        data: [
          {
            id: 'msg-empty',
            data: {},
            readAt: null,
            sender: 'user-789'
          }
        ]
      }
    };
    cometchatApi.apiClient.get.mockResolvedValue(mockResponse);

    const result = await messageService.fetchAllPrivateUserMessages('test-user');

    expect(result).toEqual([
      {
        id: 'msg-empty',
        message: '[No message content]',
        readAt: 'unread',
        sender: 'user-789'
      }
    ]);
  });

  test('should return empty array when no messages found', async () => {
    const mockResponse = {
      data: {
        data: []
      }
    };
    cometchatApi.apiClient.get.mockResolvedValue(mockResponse);

    const result = await messageService.fetchAllPrivateUserMessages('test-user');

    expect(result).toEqual([]);
  });

  test('should return empty array when response data is missing', async () => {
    const mockResponse = { data: {} };
    cometchatApi.apiClient.get.mockResolvedValue(mockResponse);

    const result = await messageService.fetchAllPrivateUserMessages('test-user');

    expect(result).toEqual([]);
  });

  test('should return empty array when data is not an array', async () => {
    const mockResponse = {
      data: {
        data: 'not-an-array'
      }
    };
    cometchatApi.apiClient.get.mockResolvedValue(mockResponse);

    const result = await messageService.fetchAllPrivateUserMessages('test-user');

    expect(result).toEqual([]);
  });

  test('should handle API errors gracefully', async () => {
    const error = new Error('Network error');
    cometchatApi.apiClient.get.mockRejectedValue(error);

    const result = await messageService.fetchAllPrivateUserMessages('test-user');

    expect(logger.error).toHaveBeenCalledWith('❌ Error fetching all messages: Network error');
    expect(result).toEqual([]);
  });
});
