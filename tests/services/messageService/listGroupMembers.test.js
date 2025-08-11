const { messageService } = require('../../../src/services/messageService.js');
const cometchatApi = require('../../../src/services/cometchatApi.js');
const { buildUrl } = require('../../../src/lib/buildUrl.js');
const config = require('../../../src/config.js');

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
  let logSpy;
  let errorSpy;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

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
    await messageService.listGroupMembers();

    // Verify
    expect(logSpy).toHaveBeenCalledWith(`members: ${mockResponse}`);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  test('should handle API errors correctly', async () => {
    // Setup
    const mockError = new Error('API error');
    cometchatApi.apiClient.get.mockRejectedValueOnce(mockError);

    // Execute
    const result = await messageService.listGroupMembers();

    // Verify
    expect(errorSpy).toHaveBeenCalledWith('❌ Error fetching group members', 'API error');
    expect(result).toBeNull();
  });
});
