// Tests specifically for private message tracking to prevent duplicate responses
const { Bot } = require('../../../src/lib/bot.js');

describe('Bot - Private Message Tracking', () => {
  let bot;
  let mockServices;

  beforeEach(() => {
    mockServices = {
      config: {
        BOT_UID: 'test-bot-uid-789',
        HANGOUT_ID: 'test-hangout'
      },
      logger: {
        debug: jest.fn(),
        error: jest.fn(),
        warn: jest.fn()
      },
      setState: jest.fn(),
      getState: jest.fn(),
      updateLastMessageId: jest.fn(),
      stateService: {
        _getAllUsers: jest.fn()
      },
      privateMessageService: {
        fetchNewPrivateUserMessages: jest.fn()
      }
    };

    bot = new Bot('test-slug', mockServices);
    bot.lastMessageIDs = { id: null, fromTimestamp: 0 };
    bot.lastPrivateMessageTracking = {};
  });

  describe('_updateMessageTracking for private messages', () => {
    test('should update private message tracking correctly', () => {
      const privateMessage = {
        id: 'pm-123',
        sentAt: 1640995200000,
        sender: 'user-456',
        isPrivateMessage: true
      };

      bot._updateMessageTracking(privateMessage);

      // Should update private message tracking
      expect(bot.lastPrivateMessageTracking['user-456']).toEqual({
        lastMessageId: 'pm-123',
        lastTimestamp: 1640995200000
      });

      // Should persist to state
      expect(mockServices.setState).toHaveBeenCalledWith(
        'lastPrivateMessageTracking',
        bot.lastPrivateMessageTracking
      );

      // Should NOT update public message tracking
      expect(mockServices.updateLastMessageId).not.toHaveBeenCalled();
      expect(bot.lastMessageIDs.id).toBeNull();
    });

    test('should handle sender as object with uid property', () => {
      const privateMessage = {
        id: 'pm-124',
        sentAt: 1640995300000,
        sender: { uid: 'user-789' },
        isPrivateMessage: true
      };

      bot._updateMessageTracking(privateMessage);

      expect(bot.lastPrivateMessageTracking['user-789']).toEqual({
        lastMessageId: 'pm-124',
        lastTimestamp: 1640995300000
      });
    });

    test('should handle multiple users independently', () => {
      const message1 = {
        id: 'pm-1',
        sentAt: 1640995100000,
        sender: 'user-1',
        isPrivateMessage: true
      };

      const message2 = {
        id: 'pm-2',
        sentAt: 1640995200000,
        sender: 'user-2',
        isPrivateMessage: true
      };

      bot._updateMessageTracking(message1);
      bot._updateMessageTracking(message2);

      expect(bot.lastPrivateMessageTracking['user-1']).toEqual({
        lastMessageId: 'pm-1',
        lastTimestamp: 1640995100000
      });

      expect(bot.lastPrivateMessageTracking['user-2']).toEqual({
        lastMessageId: 'pm-2',
        lastTimestamp: 1640995200000
      });

      // Should have called setState twice
      expect(mockServices.setState).toHaveBeenCalledTimes(2);
    });

    test('should update existing user tracking', () => {
      // Set initial tracking
      bot.lastPrivateMessageTracking['user-1'] = {
        lastMessageId: 'pm-old',
        lastTimestamp: 1640995000000
      };

      const newMessage = {
        id: 'pm-new',
        sentAt: 1640995500000,
        sender: 'user-1',
        isPrivateMessage: true
      };

      bot._updateMessageTracking(newMessage);

      expect(bot.lastPrivateMessageTracking['user-1']).toEqual({
        lastMessageId: 'pm-new',
        lastTimestamp: 1640995500000
      });
    });

    test('should handle empty/invalid sender gracefully', () => {
      const invalidMessage = {
        id: 'pm-invalid',
        sentAt: 1640995200000,
        sender: '',
        isPrivateMessage: true
      };

      bot._updateMessageTracking(invalidMessage);

      // Should not add tracking for empty sender
      expect(Object.keys(bot.lastPrivateMessageTracking)).toHaveLength(0);
      expect(mockServices.setState).not.toHaveBeenCalled();
    });
  });

  describe('Private message duplicate prevention', () => {
    test('should not fetch already processed messages', async () => {
      const mockUsers = [{ uuid: 'user-1' }];
      const mockMessages = [
        { id: 'pm-1', text: 'Message 1', sender: 'user-1', sentAt: 1640995100000 },
        { id: 'pm-2', text: 'Message 2', sender: 'user-1', sentAt: 1640995200000 }
      ];

      // Set up initial state with last processed message
      bot.lastPrivateMessageTracking['user-1'] = {
        lastMessageId: 'pm-1',
        lastTimestamp: 1640995100000
      };

      mockServices.stateService._getAllUsers.mockReturnValue(mockUsers);
      mockServices.privateMessageService.fetchNewPrivateUserMessages.mockResolvedValue(mockMessages);

      await bot._fetchNewPrivateMessages();

      // Should pass the tracking info to filter out old messages
      expect(mockServices.privateMessageService.fetchNewPrivateUserMessages).toHaveBeenCalledWith('user-1', {
        lastMessageId: 'pm-1',
        lastTimestamp: 1640995100000,
        logLastMessage: false,
        returnData: true
      });
    });

    test('should process new messages and update tracking correctly', async () => {
      const mockUsers = [{ uuid: 'user-1' }];
      const newMessages = [
        { id: 'pm-new', text: 'New message', sender: 'user-1', sentAt: 1640995300000 }
      ];

      bot.lastPrivateMessageTracking['user-1'] = {
        lastMessageId: 'pm-old',
        lastTimestamp: 1640995200000
      };

      mockServices.stateService._getAllUsers.mockReturnValue(mockUsers);
      mockServices.privateMessageService.fetchNewPrivateUserMessages.mockResolvedValue(newMessages);

      const messages = await bot._fetchNewPrivateMessages();

      // Should return the new message
      expect(messages).toHaveLength(1);
      expect(messages[0].id).toBe('pm-new');
      expect(messages[0].isPrivateMessage).toBe(true);

      // Now simulate processing this message
      await bot._processSingleMessage(messages[0]);

      // Should update tracking with the new message
      expect(bot.lastPrivateMessageTracking['user-1']).toEqual({
        lastMessageId: 'pm-new',
        lastTimestamp: 1640995300000
      });
    });

    test('should handle empty fetch results correctly', async () => {
      const mockUsers = [{ uuid: 'user-1' }];

      bot.lastPrivateMessageTracking['user-1'] = {
        lastMessageId: 'pm-latest',
        lastTimestamp: 1640995300000
      };

      mockServices.stateService._getAllUsers.mockReturnValue(mockUsers);
      mockServices.privateMessageService.fetchNewPrivateUserMessages.mockResolvedValue([]);

      const messages = await bot._fetchNewPrivateMessages();

      // Should return empty array
      expect(messages).toHaveLength(0);

      // Tracking should remain unchanged
      expect(bot.lastPrivateMessageTracking['user-1']).toEqual({
        lastMessageId: 'pm-latest',
        lastTimestamp: 1640995300000
      });
    });
  });

  describe('Integration test for complete private message flow', () => {
    test('should prevent duplicate processing in complete workflow', async () => {
      // Mock _extractChatMessage and _shouldIgnoreMessage
      bot._extractChatMessage = jest.fn().mockReturnValue('!test command');
      bot._shouldIgnoreMessage = jest.fn().mockReturnValue(false);
      bot._handleMessage = jest.fn();

      const mockUsers = [{ uuid: 'user-1' }];
      const mockMessage = {
        id: 'pm-123',
        text: '!test command',
        sender: 'user-1',
        sentAt: 1640995200000
      };

      mockServices.stateService._getAllUsers.mockReturnValue(mockUsers);
      mockServices.privateMessageService.fetchNewPrivateUserMessages.mockResolvedValue([mockMessage]);

      // First fetch - should return the message
      const messages1 = await bot._fetchNewPrivateMessages();
      expect(messages1).toHaveLength(1);

      // Process the message (this should update tracking)
      await bot._processSingleMessage(messages1[0]);

      // Second fetch - should not return the same message again
      // Reset the mock to return the same message (as if API didn't filter properly)
      mockServices.privateMessageService.fetchNewPrivateUserMessages.mockResolvedValue([mockMessage]);
      
      const messages2 = await bot._fetchNewPrivateMessages();

      // The service should have been called with updated tracking parameters
      expect(mockServices.privateMessageService.fetchNewPrivateUserMessages).toHaveBeenLastCalledWith('user-1', {
        lastMessageId: 'pm-123',
        lastTimestamp: 1640995200000,
        logLastMessage: false,
        returnData: true
      });
    });
  });

  describe('State persistence', () => {
    test('should persist tracking state on updates', () => {
      const message = {
        id: 'pm-persist',
        sentAt: 1640995200000,
        sender: 'user-persist',
        isPrivateMessage: true
      };

      bot._updateMessageTracking(message);

      expect(mockServices.setState).toHaveBeenCalledWith(
        'lastPrivateMessageTracking',
        expect.objectContaining({
          'user-persist': {
            lastMessageId: 'pm-persist',
            lastTimestamp: 1640995200000
          }
        })
      );
    });

    test('should handle setState errors gracefully', () => {
      mockServices.setState.mockImplementation(() => {
        throw new Error('State save failed');
      });

      const message = {
        id: 'pm-error',
        sentAt: 1640995200000,
        sender: 'user-error',
        isPrivateMessage: true
      };

      // Should not throw
      expect(() => {
        bot._updateMessageTracking(message);
      }).not.toThrow();

      // Should log the error
      expect(mockServices.logger.error).toHaveBeenCalledWith(
        'Failed to persist private message tracking state: State save failed'
      );

      // Tracking should still be updated locally
      expect(bot.lastPrivateMessageTracking['user-error']).toEqual({
        lastMessageId: 'pm-error',
        lastTimestamp: 1640995200000
      });
    });
  });
});