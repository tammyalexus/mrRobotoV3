const { messageService } = require('../../../src/services/messageService.js');
const cometchatApi = require('../../../src/services/cometchatApi.js');
const { buildUrl } = require('../../../src/lib/buildUrl.js');
const config = require('../../../src/config.js');
const { logger } = require('../../../src/utils/logging.js');

jest.mock('../../../src/utils/logging.js', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

jest.mock('../../../src/services/cometchatApi.js', () => ({
  BASE_URL: 'https://test-api.cometchat.com',
  apiClient: {
    get: jest.fn()
  },
  headers: {
    'Content-Type': 'application/json',
    'apiKey': 'test-api-key'
  }
}));

jest.mock('../../../src/lib/buildUrl.js');
jest.mock('../../../src/config.js', () => ({
  HANGOUT_ID: 'test-group-id',
  BOT_UID: 'test-bot-uid'
}));

describe('messageService.listGroupMembers', () => {
  beforeEach(() => {
    // Mock buildUrl implementation
    buildUrl.mockImplementation((baseUrl, pathSegments, queryParams) => {
      return 'https://test-api.cometchat.com/v3.0/groups/test-group-id/members';
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should call the API with correct parameters', async () => {
    // Setup
    cometchatApi.apiClient.get.mockResolvedValueOnce({ data: { data: [] } });

    // Execute
    await messageService.listGroupMembers();

    // Verify
    expect(buildUrl).toHaveBeenCalledWith(
      cometchatApi.BASE_URL, 
      ['v3.0', 'groups', config.HANGOUT_ID, 'members'],
      [
        ['limit', 50],
        ['uid', config.BOT_UID]
      ]
    );
    expect(cometchatApi.apiClient.get).toHaveBeenCalledWith(
      'https://test-api.cometchat.com/v3.0/groups/test-group-id/members'
    );
  });

  test('should log members when API call is successful', async () => {
    // Setup
    const mockResponse = { data: { data: [{ uid: 'user1' }, { uid: 'user2' }] } };
    cometchatApi.apiClient.get.mockResolvedValueOnce(mockResponse);

    // Execute
    const result = await messageService.listGroupMembers();

    // Verify
    expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('members: '));
    expect(logger.error).not.toHaveBeenCalled();
    expect(result).toEqual(mockResponse.data);
  });

  test('should handle API errors correctly', async () => {
    // Setup
    const mockError = new Error('API error');
    cometchatApi.apiClient.get.mockRejectedValueOnce(mockError);

    // Execute
    const result = await messageService.listGroupMembers();

    // Verify
    expect(logger.error).toHaveBeenCalledWith('❌ Error fetching group members: API error');
    expect(result).toBeNull();
  });
});
