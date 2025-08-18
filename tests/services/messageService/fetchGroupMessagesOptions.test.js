// Mock the modules before importing messageService
jest.mock('../../../src/lib/logging.js', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

jest.mock('../../../src/config.js', () => ({
  HANGOUT_ID: 'test-hangout-id'
}));

const { messageService } = require('../../../src/services/messageService.js');
const { logger } = require('../../../src/lib/logging.js');

describe('fetchGroupMessages - Parameter Options', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock fetchGroupMessagesRaw to track parameter calls
    messageService.fetchGroupMessagesRaw = jest.fn().mockResolvedValue([
      {
        id: 'msg-1',
        sentAt: 1640995200,
        sender: 'user-123',
        data: { text: '!test command' }
      }
    ]);
    
    // Mock getLatestGroupMessageId
    messageService.getLatestGroupMessageId = jest.fn().mockReturnValue('latest-msg-id');
  });

  test('should handle options with lastID parameter', async () => {
    const options = {
      lastID: 'custom-last-id',
      fromTimestamp: 1640995000,
      limit: 25,
      filterCommands: false
    };

    await messageService.fetchGroupMessages('custom-room-id', options);

    expect(messageService.fetchGroupMessagesRaw).toHaveBeenCalledWith(
      'custom-room-id',
      [
        ['id', 'custom-last-id'],
        ['sentAt', 1640995000],
        ['per_page', 25]
      ]
    );
  });

  test('should use latestMessageId when lastID not provided', async () => {
    const options = {
      fromTimestamp: 1640995000,
      filterCommands: true
    };

    await messageService.fetchGroupMessages('custom-room-id', options);

    expect(messageService.fetchGroupMessagesRaw).toHaveBeenCalledWith(
      'custom-room-id',
      [
        ['id', 'latest-msg-id'],
        ['sentAt', 1640995000]
      ]
    );
  });

  test('should not add per_page parameter when limit is 50 (default)', async () => {
    const options = {
      limit: 50,
      fromTimestamp: 1640995000
    };

    await messageService.fetchGroupMessages('custom-room-id', options);

    expect(messageService.fetchGroupMessagesRaw).toHaveBeenCalledWith(
      'custom-room-id',
      [
        ['id', 'latest-msg-id'],
        ['sentAt', 1640995000]
      ]
    );
  });

  test('should handle case where no IDs are available', async () => {
    messageService.getLatestGroupMessageId.mockReturnValue(null);
    
    const options = {
      fromTimestamp: 1640995000
    };

    await messageService.fetchGroupMessages('custom-room-id', options);

    expect(messageService.fetchGroupMessagesRaw).toHaveBeenCalledWith(
      'custom-room-id',
      [
        ['sentAt', 1640995000]
      ]
    );
  });

  test('should filter commands when filterCommands is true', async () => {
    const mockMessages = [
      {
        id: 'msg-1',
        sentAt: 1640995200,
        sender: 'user-123',
        data: { text: '!test command' }
      },
      {
        id: 'msg-2',
        sentAt: 1640995300,
        sender: 'user-456',
        data: { text: 'regular message' }
      }
    ];
    
    messageService.fetchGroupMessagesRaw.mockResolvedValue(mockMessages);

    const result = await messageService.fetchGroupMessages('custom-room-id', { filterCommands: true });

    expect(result).toEqual([
      {
        id: 'msg-1',
        sentAt: 1640995200,
        sender: 'user-123',
        data: { text: '!test command' }
      }
    ]);
  });

  test('should not filter when filterCommands is false', async () => {
    const mockMessages = [
      {
        id: 'msg-1',
        sentAt: 1640995200,
        sender: 'user-123',
        data: { text: '!test command' }
      },
      {
        id: 'msg-2',
        sentAt: 1640995300,
        sender: 'user-456',
        data: { text: 'regular message' }
      }
    ];
    
    messageService.fetchGroupMessagesRaw.mockResolvedValue(mockMessages);

    const result = await messageService.fetchGroupMessages('custom-room-id', { filterCommands: false });

    expect(result).toEqual(mockMessages);
  });

  test('should handle messages with undefined text gracefully', async () => {
    const mockMessages = [
      {
        id: 'msg-1',
        sentAt: 1640995200,
        sender: 'user-123',
        data: { text: undefined }
      },
      {
        id: 'msg-2',
        sentAt: 1640995300,
        sender: 'user-456',
        data: { text: '!valid command' }
      }
    ];
    
    messageService.fetchGroupMessagesRaw.mockResolvedValue(mockMessages);

    const result = await messageService.fetchGroupMessages('custom-room-id', { filterCommands: true });

    expect(result).toEqual([
      {
        id: 'msg-2',
        sentAt: 1640995300,
        sender: 'user-456',
        data: { text: '!valid command' }
      }
    ]);
  });
});
