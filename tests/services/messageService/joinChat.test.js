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
  makeRequest: jest.fn()
}));

jest.mock('../../../src/services/cometchatApi.js', () => ({
  headers: {
    'Content-Type': 'application/json',
    'apiKey': 'test-api-key'
  }
}));

jest.mock('../../../src/config.js', () => ({
  COMETCHAT_API_KEY: 'test-api-key',
  HANGOUT_ID: 'test-hangout-id',
  BOT_UID: 'test-bot-uid'
}));

const { messageService } = require('../../../src/services/messageService.js');
const { makeRequest } = require('../../../src/lib/buildUrl.js');
const cometchatApi = require('../../../src/services/cometchatApi.js');
const config = require('../../../src/config.js');
const { logger } = require('../../../src/lib/logging.js');

describe('messageService.joinChat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should successfully join chat room', async () => {
    const mockResponse = { data: { success: true } };
    makeRequest.mockResolvedValue(mockResponse);

    const result = await messageService.joinChat('test-room-id');

    expect(makeRequest).toHaveBeenCalledWith(
      'https://test-api-key.apiclient-us.cometchat.io/v3/groups/test-room-id/members',
      {
        headers: cometchatApi.headers,
        method: 'POST',
        data: {
          participants: [config.BOT_UID]
        }
      }
    );
    expect(result).toBe(mockResponse);
  });

  test('should handle already joined error gracefully', async () => {
    const alreadyJoinedError = new Error('ERR_ALREADY_JOINED');
    makeRequest.mockRejectedValue(alreadyJoinedError);

    const result = await messageService.joinChat('test-room-id');

    expect(logger.debug).toHaveBeenCalledWith('✅ User already joined chat group - continuing');
    expect(result).toEqual({ success: true, alreadyJoined: true });
  });

  test('should handle other errors by throwing', async () => {
    const otherError = new Error('Network error');
    makeRequest.mockRejectedValue(otherError);

    await expect(messageService.joinChat('test-room-id')).rejects.toThrow('Network error');
    
    expect(logger.error).toHaveBeenCalledWith('❌ Error joining chat: Network error');
  });

  test('should handle errors without message property', async () => {
    const errorWithoutMessage = { status: 500 };
    makeRequest.mockRejectedValue(errorWithoutMessage);

    await expect(messageService.joinChat('test-room-id')).rejects.toEqual(errorWithoutMessage);
  });
});
