// Mock the modules before importing messageService
jest.mock('../../../src/utils/logging.js', () => ({
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
const cometchatApi = require('../../../src/services/cometchatApi.js');
const { logger } = require('../../../src/utils/logging.js');

describe('returnLatestGroupMessageId', () => {
  const FIXED_NOW = 1753096800; // Mocked current time

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(FIXED_NOW * 1000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('returns latest message ID when message is found on first attempt', async () => {
    const fakeMessage = { id: 9999, sentAt: FIXED_NOW };
    cometchatApi.apiClient.get.mockResolvedValue({ data: { data: [fakeMessage] } });

    const result = await messageService.returnLatestGroupMessageId();

    expect(result).toBe(9999);
    expect(cometchatApi.apiClient.get).toHaveBeenCalledTimes(1);
    expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('✅ Found message: ID 9999'));
  });

  test('looks back multiple minutes if no message is found immediately', async () => {
    const fakeMessage = { id: 1234, sentAt: FIXED_NOW - 60 * 2 };

    cometchatApi.apiClient.get
      .mockResolvedValueOnce({ data: { data: [] } })  // Now
      .mockResolvedValueOnce({ data: { data: [] } })  // -1 min
      .mockResolvedValueOnce({ data: { data: [fakeMessage] } }); // -2 min

    const result = await messageService.returnLatestGroupMessageId();

    expect(result).toBe(1234);
    expect(cometchatApi.apiClient.get).toHaveBeenCalledTimes(3);
    expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('🔍 No messages at'));
    expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('✅ Found message: ID 1234'));
  });

  test('returns null if no messages are found in lookback window', async () => {
    cometchatApi.apiClient.get.mockResolvedValue({ data: { data: [] } });

    const result = await messageService.returnLatestGroupMessageId();

    expect(result).toBeNull();
    expect(cometchatApi.apiClient.get).toHaveBeenCalledTimes(11); // 0–10 mins
    expect(logger.warn).toHaveBeenCalledWith('⚠️ No messages found in lookback window');
  });

  test('returns null and logs error if API call fails', async () => {
    cometchatApi.apiClient.get.mockRejectedValue(new Error('API down'));

    const result = await messageService.returnLatestGroupMessageId();

    expect(result).toBeNull();
    expect(cometchatApi.apiClient.get).toHaveBeenCalledTimes(1); // exits on error
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('❌ Error fetching messages at lookback 0m:'), 'API down');
  });
});
