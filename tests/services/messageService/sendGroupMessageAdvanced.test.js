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
  buildUrl: jest.fn(),
  makeRequest: jest.fn()
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
  CHAT_AVATAR_ID: 'test-avatar',
  CHAT_NAME: 'Test Bot',
  CHAT_COLOUR: 'FF0000'
}));

const { messageService } = require('../../../src/services/messageService.js');
const { makeRequest } = require('../../../src/lib/buildUrl.js');
const { logger } = require('../../../src/lib/logging.js');

describe('messageService.sendGroupMessage - Advanced Features', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should handle object-style message with all options', async () => {
    const mockResponse = { data: { id: 'msg-123' } };
    makeRequest.mockResolvedValue(mockResponse);

    const messageObj = {
      message: 'Test message',
      room: 'custom-room-id',
      images: ['image1.jpg', 'image2.jpg'],
      mentions: ['user1', 'user2'],
      receiverType: 'group'
    };

    const result = await messageService.sendGroupMessage(messageObj);

    expect(result.message).toBe('Test message');
    expect(result.messageResponse).toEqual(mockResponse.data);
    expect(makeRequest).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        data: expect.objectContaining({
          receiver: 'custom-room-id',
          receiverType: 'group',
          data: expect.objectContaining({
            text: 'Test message',
            metadata: expect.objectContaining({
              chatMessage: expect.objectContaining({
                imageUrls: ['image1.jpg', 'image2.jpg'],
                mentions: ['user1', 'user2']
              })
            })
          })
        })
      })
    );
  });

  test('should handle string message with options parameter', async () => {
    const mockResponse = { data: { id: 'msg-456' } };
    makeRequest.mockResolvedValue(mockResponse);

    const options = {
      room: 'another-room',
      images: ['single-image.png'],
      mentions: ['mention-user']
    };

    const result = await messageService.sendGroupMessage('Another test message', options);

    expect(result.message).toBe('Another test message');
    expect(makeRequest).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        data: expect.objectContaining({
          receiver: 'another-room',
          data: expect.objectContaining({
            metadata: expect.objectContaining({
              chatMessage: expect.objectContaining({
                imageUrls: ['single-image.png'],
                mentions: ['mention-user']
              })
            })
          })
        })
      })
    );
  });

  test('should throw error when message content is missing', async () => {
    await expect(messageService.sendGroupMessage(null)).rejects.toThrow('Message content is required');
    await expect(messageService.sendGroupMessage('')).rejects.toThrow('Message content is required');
    await expect(messageService.sendGroupMessage({ message: '' })).rejects.toThrow('Message content is required');
  });

  test('should handle API errors with detailed error information', async () => {
    const apiError = {
      response: {
        data: { error: 'API rate limit exceeded' },
        status: 429
      }
    };
    makeRequest.mockRejectedValue(apiError);

    const result = await messageService.sendGroupMessage('Test message');

    expect(result.error).toEqual(apiError.response.data);
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to send group message')
    );
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('API rate limit exceeded')
    );
  });

  test('should handle API errors without response data', async () => {
    const networkError = new Error('Network connection failed');
    makeRequest.mockRejectedValue(networkError);

    const result = await messageService.sendGroupMessage('Test message');

    expect(result.error).toBe('Network connection failed');
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to send group message')
    );
  });

  test('should use default room when none specified', async () => {
    const mockResponse = { data: { id: 'msg-789' } };
    makeRequest.mockResolvedValue(mockResponse);

    await messageService.sendGroupMessage('Default room test');

    expect(makeRequest).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        data: expect.objectContaining({
          receiver: 'test-group-id' // Should use config.HANGOUT_ID
        })
      })
    );
  });
});
