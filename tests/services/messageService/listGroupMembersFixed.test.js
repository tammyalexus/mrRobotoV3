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
  HANGOUT_ID: 'test-group-id',
  BOT_UID: 'test-bot-uid'
}));

const { messageService } = require('../../../src/services/messageService.js');
const { buildUrl } = require('../../../src/lib/buildUrl.js');
const cometchatApi = require('../../../src/services/cometchatApi.js');
const config = require('../../../src/config.js');
const { logger } = require('../../../src/lib/logging.js');

describe('messageService.listGroupMembers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    buildUrl.mockReturnValue('https://test-api.cometchat.com/v3.0/groups/test-group-id/members');
  });

  test('should return group members when API call succeeds', async () => {
    const mockResponse = {
      data: {
        data: [
          { uid: 'user1', name: 'User One' },
          { uid: 'user2', name: 'User Two' }
        ]
      }
    };
    cometchatApi.apiClient.get.mockResolvedValue(mockResponse);

    const result = await messageService.listGroupMembers();

    expect(buildUrl).toHaveBeenCalledWith(
      cometchatApi.BASE_URL,
      ['v3.0', 'groups', config.HANGOUT_ID, 'members'],
      [
        ['perPage', 100],
        ['uid', config.BOT_UID],
        ['page', 1],
        ['status', 'available']
      ]
    );
    expect(cometchatApi.apiClient.get).toHaveBeenCalledWith(
      'https://test-api.cometchat.com/v3.0/groups/test-group-id/members'
    );
    expect(result).toEqual({
      data: mockResponse.data.data,
      totalCount: 2
    });
    expect(logger.debug).toHaveBeenCalledWith(
      expect.stringContaining('Group members')
    );
  });

  test('should handle API errors gracefully', async () => {
    const error = new Error('API error');
    cometchatApi.apiClient.get.mockRejectedValue(error);

    const result = await messageService.listGroupMembers();

    expect(logger.error).toHaveBeenCalledWith('❌ Error fetching group members: API error');
    expect(result).toBeNull();
  });

  test('should handle empty response', async () => {
    const mockResponse = {
      data: {
        data: []
      }
    };
    cometchatApi.apiClient.get.mockResolvedValue(mockResponse);

    const result = await messageService.listGroupMembers();

    expect(result).toEqual({
      data: [],
      totalCount: 0
    });
  });
});
