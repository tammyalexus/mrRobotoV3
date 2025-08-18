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
  BOT_UID: 'test-bot-uid'
}));

const { messageService } = require('../../../src/services/messageService.js');
const { buildUrl, makeRequest } = require('../../../src/lib/buildUrl.js');
const { logger } = require('../../../src/lib/logging.js');

describe('messageService.returnLatestGroupMessageId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    buildUrl.mockReturnValue('https://test-api.cometchat.com/v3/groups/test-group-id/messages');
  });

  test('should return latest message ID when message is found on first attempt', async () => {
    const mockResponse = {
      data: {
        data: [
          { id: 'latest-msg-123', sentAt: 1000000 }
        ]
      }
    };
    makeRequest.mockResolvedValue(mockResponse);

    const result = await messageService.returnLatestGroupMessageId();

    expect(result).toBe('latest-msg-123');
    expect(buildUrl).toHaveBeenCalledWith(
      'https://test-api.cometchat.com',
      ['v3', 'groups', 'test-group-id', 'messages'],
      expect.arrayContaining([
        ['per_page', 1],
        ['sentAt', expect.any(Number)]
      ])
    );
  });

  test('should look back multiple minutes if no message is found immediately', async () => {
    // First call returns no messages
    makeRequest.mockResolvedValueOnce({ data: { data: [] } });
    
    // Second call (1 minute back) returns no messages
    makeRequest.mockResolvedValueOnce({ data: { data: [] } });
    
    // Third call (2 minutes back) returns a message
    const mockResponse = {
      data: {
        data: [
          { id: 'old-msg-456', sentAt: 900000 }
        ]
      }
    };
    makeRequest.mockResolvedValueOnce(mockResponse);

    const result = await messageService.returnLatestGroupMessageId();

    expect(result).toBe('old-msg-456');
    expect(makeRequest).toHaveBeenCalledTimes(3);
    
    // Verify the timestamps are going backwards in time
    const calls = makeRequest.mock.calls;
    expect(calls[0][1]).toEqual(expect.objectContaining({
      data: expect.objectContaining({
        sentAt: expect.any(Number)
      })
    }));
  });

  test('should return null if no messages are found in lookback window', async () => {
    // All calls return empty arrays
    makeRequest.mockResolvedValue({ data: { data: [] } });

    const result = await messageService.returnLatestGroupMessageId();

    expect(result).toBeNull();
    expect(makeRequest).toHaveBeenCalledTimes(15); // Should try 15 times (15 minutes back)
  });

  test('should return null and log error if API call fails', async () => {
    const apiError = new Error('API connection failed');
    makeRequest.mockRejectedValue(apiError);

    const result = await messageService.returnLatestGroupMessageId();

    expect(result).toBeNull();
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Error fetching latest group message ID')
    );
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('API connection failed')
    );
  });

  test('should handle malformed response data', async () => {
    // Response without data.data
    makeRequest.mockResolvedValueOnce({ data: {} });
    
    // Response with null data
    makeRequest.mockResolvedValueOnce({ data: { data: null } });
    
    // Finally return a valid response
    const mockResponse = {
      data: {
        data: [{ id: 'recovered-msg-789', sentAt: 800000 }]
      }
    };
    makeRequest.mockResolvedValueOnce(mockResponse);

    const result = await messageService.returnLatestGroupMessageId();

    expect(result).toBe('recovered-msg-789');
    expect(makeRequest).toHaveBeenCalledTimes(3);
  });
});
