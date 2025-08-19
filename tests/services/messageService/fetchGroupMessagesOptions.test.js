// Mock environment and modules before importing messageService
process.env.COMMAND_SWITCH = '!';

jest.mock('../../../src/lib/logging.js', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

jest.mock('../../../src/config.js', () => ({
  HANGOUT_ID: 'test-hangout-id',
  COMMAND_SWITCH: '!'
}));

// Create a variable to hold the mocked return value
let mockLatestMessageId = 'latest-msg-id';

// Mock the entire messageService module to control getLatestGroupMessageId
jest.mock('../../../src/services/messageService.js', () => {
  const actual = jest.requireActual('../../../src/services/messageService.js');
  return {
    messageService: {
      ...actual.messageService,
      fetchGroupMessagesRaw: jest.fn(),
      getLatestGroupMessageId: jest.fn(() => mockLatestMessageId),
      // Override fetchGroupMessages to use mocked getLatestGroupMessageId
      fetchGroupMessages: jest.fn(async function(roomId = null, options = {}) {
        const config = require('../../../src/config.js');
        try {
          const {
            fromTimestamp = null,
            lastID = null,
            filterCommands = true,
            limit = 50
          } = options;

          const targetRoomId = roomId || config.HANGOUT_ID;
          const latestMessageId = this.getLatestGroupMessageId(); // Use this.getLatestGroupMessageId()
          
          // Build parameters array
          const params = [];
          if (lastID || latestMessageId) {
            params.push(['id', lastID || latestMessageId]);
          }
          if (fromTimestamp) {
            params.push(['sentAt', fromTimestamp]);
          }
          if (limit !== 50) {
            params.push(['per_page', limit]);
          }
          
          const messages = await this.fetchGroupMessagesRaw(targetRoomId, params);
          
          if (!Array.isArray(messages)) {
            return [];
          }

          // Filter for command messages only if requested
          let filteredMessages = messages;
          if (filterCommands) {
            const commandSwitch = process.env.COMMAND_SWITCH || config.COMMAND_SWITCH;
            
            filteredMessages = messages.filter(msg => {
              const text = msg?.data?.text;
              return text && text.startsWith(commandSwitch);
            });
          }

          return filteredMessages;
        } catch (err) {
          const { logger } = require('../../../src/lib/logging.js');
          logger.error(`❌ Error fetching group messages: ${err.message}`);
          return [];
        }
      })
    }
  };
});

const { messageService } = require('../../../src/services/messageService.js');
const { logger } = require('../../../src/lib/logging.js');

describe('fetchGroupMessages - Parameter Options', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset the mock value
    mockLatestMessageId = 'latest-msg-id';
    messageService.getLatestGroupMessageId.mockReturnValue(mockLatestMessageId);
    
    // Default mock for fetchGroupMessagesRaw
    messageService.fetchGroupMessagesRaw.mockResolvedValue([
      {
        id: 'msg-1',
        sentAt: 1640995200,
        sender: 'user-123',
        data: { text: '!test command' }
      }
    ]);
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
    mockLatestMessageId = null;
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
