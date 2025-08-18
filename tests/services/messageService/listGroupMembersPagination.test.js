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

describe('messageService.listGroupMembers - Pagination', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    buildUrl.mockReturnValue('https://test-api.cometchat.com/v3.0/groups/test-group-id/members');
  });

  test('should handle multiple pages of members', async () => {
    // First page response (100 members - full page)
    const firstPageMembers = Array.from({ length: 100 }, (_, i) => ({
      uid: `user-${i}`,
      name: `User ${i}`,
      status: 'online'
    }));
    
    const firstPageResponse = {
      data: {
        data: firstPageMembers,
        meta: {
          pagination: {
            count: 100,
            current_page: 1,
            total_pages: 2
          }
        }
      }
    };

    // Second page response (50 members - partial page)
    const secondPageMembers = Array.from({ length: 50 }, (_, i) => ({
      uid: `user-${i + 100}`,
      name: `User ${i + 100}`,
      status: 'online'
    }));
    
    const secondPageResponse = {
      data: {
        data: secondPageMembers,
        meta: {
          pagination: {
            count: 50,
            current_page: 2,
            total_pages: 2
          }
        }
      }
    };

    makeRequest
      .mockResolvedValueOnce(firstPageResponse)
      .mockResolvedValueOnce(secondPageResponse);

    const result = await messageService.listGroupMembers();

    expect(result.totalCount).toBe(150);
    expect(result.data).toHaveLength(150);
    expect(result.data[0]).toEqual({
      name: 'User 0',
      uid: 'user-0',
      status: 'online'
    });
    expect(result.data[149]).toEqual({
      name: 'User 149',
      uid: 'user-149',
      status: 'online'
    });

    // Verify pagination calls
    expect(makeRequest).toHaveBeenCalledTimes(2);
    expect(buildUrl).toHaveBeenCalledWith(
      'https://test-api.cometchat.com',
      ['v3.0', 'groups', 'test-group-id', 'members'],
      [
        ['perPage', 100],
        ['uid', 'test-bot-uid'],
        ['page', 1],
        ['status', 'available']
      ]
    );
    expect(buildUrl).toHaveBeenCalledWith(
      'https://test-api.cometchat.com',
      ['v3.0', 'groups', 'test-group-id', 'members'],
      [
        ['perPage', 100],
        ['uid', 'test-bot-uid'],
        ['page', 2],
        ['status', 'available']
      ]
    );
  });

  test('should stop pagination when fewer than 100 members returned', async () => {
    const partialPageMembers = Array.from({ length: 75 }, (_, i) => ({
      uid: `user-${i}`,
      name: `User ${i}`,
      status: 'online'
    }));
    
    const response = {
      data: {
        data: partialPageMembers,
        meta: {
          pagination: {
            count: 75,
            current_page: 1,
            total_pages: 1
          }
        }
      }
    };

    makeRequest.mockResolvedValue(response);

    const result = await messageService.listGroupMembers();

    expect(result.totalCount).toBe(75);
    expect(result.data).toHaveLength(75);
    expect(makeRequest).toHaveBeenCalledTimes(1); // Only one page needed
  });

  test('should handle pages with no members', async () => {
    const emptyResponse = {
      data: {
        data: [],
        meta: {
          pagination: {
            count: 0,
            current_page: 1,
            total_pages: 0
          }
        }
      }
    };

    makeRequest.mockResolvedValue(emptyResponse);

    const result = await messageService.listGroupMembers();

    expect(result.totalCount).toBe(0);
    expect(result.data).toEqual([]);
    expect(logger.debug).toHaveBeenCalledWith(
      expect.stringContaining('No members found on page 1')
    );
  });

  test('should handle missing pagination metadata', async () => {
    const membersWithoutMeta = Array.from({ length: 50 }, (_, i) => ({
      uid: `user-${i}`,
      name: `User ${i}`,
      status: 'online'
    }));
    
    const responseWithoutMeta = {
      data: {
        data: membersWithoutMeta
        // No meta field
      }
    };

    makeRequest.mockResolvedValue(responseWithoutMeta);

    const result = await messageService.listGroupMembers();

    expect(result.totalCount).toBe(50);
    expect(result.data).toHaveLength(50);
    expect(makeRequest).toHaveBeenCalledTimes(1); // Should stop after one page
  });

  test('should handle API errors during pagination', async () => {
    // First page succeeds
    const firstPageResponse = {
      data: {
        data: Array.from({ length: 100 }, (_, i) => ({
          uid: `user-${i}`,
          name: `User ${i}`,
          status: 'online'
        })),
        meta: {
          pagination: {
            count: 100,
            current_page: 1,
            total_pages: 2
          }
        }
      }
    };

    // Second page fails
    const apiError = new Error('API timeout on page 2');

    makeRequest
      .mockResolvedValueOnce(firstPageResponse)
      .mockRejectedValueOnce(apiError);

    const result = await messageService.listGroupMembers();

    expect(result).toBeNull(); // Should return null on error
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Error fetching group members')
    );
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('API timeout on page 2')
    );
  });

  test('should handle unexpected response format', async () => {
    const malformedResponse = {
      data: null // Invalid format
    };

    makeRequest.mockResolvedValue(malformedResponse);

    const result = await messageService.listGroupMembers();

    expect(result.totalCount).toBe(0);
    expect(result.data).toEqual([]);
  });
});
