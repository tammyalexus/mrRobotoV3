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
  patch: jest.fn(),
  post: jest.fn()
}));

jest.mock('../../../src/services/cometchatApi.js', () => ({
  BASE_URL: 'https://test-api.cometchat.com',
  headers: {
    'Content-Type': 'application/json',
    'apiKey': 'test-api-key'
  }
}));

jest.mock('../../../src/config.js', () => ({
  COMETCHAT_RECEIVER_UID: 'test-receiver-uid'
}));

const { messageService } = require('../../../src/services/messageService.js');
const axios = require('axios');
const cometchatApi = require('../../../src/services/cometchatApi.js');
const config = require('../../../src/config.js');
const { logger } = require('../../../src/lib/logging.js');

describe('messageService - Mark Conversation Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('markMessageAsInterracted (conversation read)', () => {
    test('should successfully mark conversation as read', async () => {
      const mockResponse = { data: { success: true }, status: 200, headers: {} };
      axios.post.mockResolvedValue(mockResponse);

      await messageService.markMessageAsInterracted();

      expect(axios.post).toHaveBeenCalledWith(
        `${cometchatApi.BASE_URL}/v3/users/${config.COMETCHAT_RECEIVER_UID}/conversation/read`,
        {},
        {
          headers: {
            ...cometchatApi.headers,
            'accept': 'application/json',
            'content-type': 'application/json'
          }
        }
      );
    });

    test('should handle API errors with response', async () => {
      const error = {
        response: {
          data: { error: 'User not found' },
          status: 404,
          headers: { 'content-type': 'application/json' }
        },
        message: 'Request failed with status code 404'
      };
      axios.post.mockRejectedValue(error);

      await messageService.markMessageAsInterracted();

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining(`❌ Error marking conversation as read for user ${config.COMETCHAT_RECEIVER_UID}`)
      );
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Full error object:')
      );
    });

    test('should handle network errors', async () => {
      const error = new Error('Connection refused');
      axios.post.mockRejectedValue(error);

      await messageService.markMessageAsInterracted();

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('❌ Error marking conversation as read for user test-receiver-uid: Connection refused')
      );
    });
  });
});
