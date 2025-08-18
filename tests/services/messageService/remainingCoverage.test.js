const axios = require('axios');
const { messageService } = require('../../../src/services/messageService');
const config = require('../../../src/config');

// Mock dependencies
jest.mock('axios');
jest.mock('../../../src/config', () => ({
  HANGOUT_ID: 'test-hangout-id',
  COMETCHAT_RECEIVER_UID: 'test-receiver-id'
}));

// Create a proper logger mock
const mockLogger = {
  debug: jest.fn(),
  error: jest.fn()
};

jest.mock('../../../src/lib/logging', () => ({
  logger: mockLogger
}));

describe('messageService - Remaining Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLogger.debug.mockClear();
    mockLogger.error.mockClear();
    axios.patch = jest.fn();
    axios.get = jest.fn();
  });

  describe('markMessageAsInterracted (message interaction)', () => {
    it('should successfully mark message as interacted', async () => {
      const mockResponse = {
        status: 200,
        data: { success: true },
        headers: { 'content-type': 'application/json' }
      };
      axios.patch.mockResolvedValue(mockResponse);

      await messageService.markMessageAsInterracted('test-message-id');

      expect(axios.patch).toHaveBeenCalledWith(
        expect.stringContaining('/v3/messages/test-message-id/interacted'),
        { interactions: ['test-message-id'] },
        expect.objectContaining({
          headers: expect.objectContaining({
            'accept': 'application/json',
            'content-type': 'application/json'
          })
        })
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Attempting to mark message as interacted')
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('✅ Marked message as interacted')
      );
    });

    it('should handle errors with response data', async () => {
      const mockError = {
        response: {
          status: 400,
          data: { error: 'Bad request' },
          headers: { 'content-type': 'application/json' }
        },
        message: 'Request failed'
      };
      axios.patch.mockRejectedValue(mockError);

      await messageService.markMessageAsInterracted('test-message-id');

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('❌ Error marking message as interacted')
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Full error response')
      );
    });

    it('should handle errors without response', async () => {
      const mockError = {
        message: 'Network error'
      };
      axios.patch.mockRejectedValue(mockError);

      await messageService.markMessageAsInterracted('test-message-id');

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('❌ Error marking message as interacted')
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Full error object')
      );
    });
  });

  describe('fetchGroupMessages - specific parameter combinations', () => {
    beforeEach(() => {
      // Mock axios.get for fetchGroupMessagesRaw
      axios.get = jest.fn();
    });

    it('should handle fromTimestamp parameter', async () => {
      const mockResponse = {
        data: {
          data: [
            {
              id: 'msg1',
              text: 'hello world',
              sender: { name: 'User1' },
              sentAt: 1234567890
            }
          ]
        }
      };
      axios.get.mockResolvedValue(mockResponse);

      const result = await messageService.fetchGroupMessages({
        roomId: 'test-room',
        fromTimestamp: 1234567890
      });

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('sentAt=1234567890'),
        expect.any(Object)
      );
    });

    it('should handle non-default limit parameter', async () => {
      const mockResponse = {
        data: {
          data: [
            {
              id: 'msg1',
              text: 'hello world',
              sender: { name: 'User1' },
              sentAt: 1234567890
            }
          ]
        }
      };
      axios.get.mockResolvedValue(mockResponse);

      const result = await messageService.fetchGroupMessages({
        roomId: 'test-room',
        limit: 25
      });

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('per_page=25'),
        expect.any(Object)
      );
    });

    it('should handle fetchGroupMessages error', async () => {
      axios.get.mockRejectedValue(new Error('API error'));

      const result = await messageService.fetchGroupMessages({
        roomId: 'test-room'
      });

      expect(result).toEqual([]);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('❌ Error fetching group messages')
      );
    });
  });

  describe('listGroupMembers - pagination', () => {
    it('should handle pagination with multiple pages', async () => {
      const page1Response = {
        data: {
          data: new Array(100).fill(null).map((_, i) => ({
            uid: `user${i}`,
            name: `User ${i}`,
            status: 'available'
          })),
          meta: {
            pagination: {
              count: 100,
              current_page: 1,
              total_pages: 3
            }
          }
        }
      };

      const page2Response = {
        data: {
          data: new Array(100).fill(null).map((_, i) => ({
            uid: `user${i + 100}`,
            name: `User ${i + 100}`,
            status: 'available'
          })),
          meta: {
            pagination: {
              count: 100,
              current_page: 2,
              total_pages: 3
            }
          }
        }
      };

      const page3Response = {
        data: {
          data: new Array(50).fill(null).map((_, i) => ({
            uid: `user${i + 200}`,
            name: `User ${i + 200}`,
            status: 'available'
          })),
          meta: {
            pagination: {
              count: 50,
              current_page: 3,
              total_pages: 3
            }
          }
        }
      };

      axios.get
        .mockResolvedValueOnce(page1Response)
        .mockResolvedValueOnce(page2Response)
        .mockResolvedValueOnce(page3Response);

      const result = await messageService.listGroupMembers('test-room');

      expect(axios.get).toHaveBeenCalledTimes(3);
      expect(result.totalCount).toBe(250);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Page 1: Found 100 members')
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Page 2: Found 100 members')
      );
    });

    it('should stop pagination when no more pages', async () => {
      const singlePageResponse = {
        data: {
          data: new Array(50).fill(null).map((_, i) => ({
            uid: `user${i}`,
            name: `User ${i}`,
            status: 'available'
          })),
          meta: {
            pagination: {
              count: 50,
              current_page: 1,
              total_pages: 1
            }
          }
        }
      };

      axios.get.mockResolvedValue(singlePageResponse);

      const result = await messageService.listGroupMembers('test-room');

      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(result.totalCount).toBe(50);
    });

    it('should handle page with no members', async () => {
      const emptyPageResponse = {
        data: {
          data: [],
          meta: {
            pagination: {
              count: 0,
              current_page: 1,
              total_pages: 1
            }
          }
        }
      };

      axios.get.mockResolvedValue(emptyPageResponse);

      const result = await messageService.listGroupMembers('test-room');

      expect(result.totalCount).toBe(0);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('No members found on page 1')
      );
    });
  });
});
