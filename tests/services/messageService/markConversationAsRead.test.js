// Mock modules before importing messageService
jest.mock('../../../src/lib/logging.js', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

jest.mock('axios', () => ({
  post: jest.fn(),
  patch: jest.fn()
}));

jest.mock('../../../src/services/cometchatApi.js', () => ({
  BASE_URL: 'https://test-api.cometchat.com',
  headers: {
    'Content-Type': 'application/json',
    'apiKey': 'test-api-key'
  }
}));

jest.mock('../../../src/config.js', () => ({
  HANGOUT_ID: 'test-group-id',
  BOT_UID: 'test-bot-uid',
  COMETCHAT_RECEIVER_UID: 'test-receiver-uid'
}));

const { messageService } = require('../../../src/services/messageService.js');
const axios = require('axios');
const { logger } = require('../../../src/lib/logging.js');

describe('messageService.markMessageAsInterracted (conversation read)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should successfully mark conversation as read', async () => {
    const mockResponse = {
      status: 200,
      data: { success: true },
      headers: { 'content-type': 'application/json' }
    };
    axios.post.mockResolvedValue(mockResponse);

    await messageService.markMessageAsInterracted();

    expect(axios.post).toHaveBeenCalledWith(
      'https://test-api.cometchat.com/v3/users/test-receiver-uid/conversation/read',
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          'apiKey': 'test-api-key',
          'accept': 'application/json',
          'content-type': 'application/json'
        }
      }
    );
  });

  test('should handle API errors with response data', async () => {
    const apiError = {
      response: {
        data: { error: 'User not found' },
        status: 404,
        headers: { 'content-type': 'application/json' }
      }
    };
    axios.post.mockRejectedValue(apiError);

    await messageService.markMessageAsInterracted();

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Error marking conversation as read for user test-receiver-uid')
    );
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('User not found')
    );
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Full error response')
    );
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Response status: 404')
    );
  });

  test('should handle network errors without response', async () => {
    const networkError = new Error('Network connection failed');
    axios.post.mockRejectedValue(networkError);

    await messageService.markMessageAsInterracted();

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Error marking conversation as read for user test-receiver-uid')
    );
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Network connection failed')
    );
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Full error object')
    );
  });

  test('should handle errors with undefined response data', async () => {
    const errorWithEmptyResponse = {
      response: {
        status: 500,
        headers: {}
      },
      message: 'Internal server error'
    };
    axios.post.mockRejectedValue(errorWithEmptyResponse);

    await messageService.markMessageAsInterracted();

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Internal server error')
    );
  });
});
