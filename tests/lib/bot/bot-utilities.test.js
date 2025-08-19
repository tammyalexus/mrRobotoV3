const { Bot } = require('../../../src/lib/bot.js');

// Mock ttfm-socket
jest.mock('ttfm-socket', () => ({
  SocketClient: jest.fn().mockImplementation(() => ({
    joinRoom: jest.fn(),
    on: jest.fn(),
    isConnected: false,
    disconnect: jest.fn()
  })),
  ServerMessageName: {},
  StatefulServerMessageName: {},
  StatelessServerMessageName: {}
}));

// Mock fs promises
jest.mock('fs', () => ({
  promises: {
    appendFile: jest.fn()
  }
}));

describe('Bot - Utility Methods', () => {
  let bot;
  let mockServices;
  let MockSocketClient;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockServices = {
      config: {
        HANGOUT_ID: 'test-hangout-123',
        BOT_USER_TOKEN: 'test-bot-token-456',
        BOT_UID: 'test-bot-uid-789'
      },
      logger: {
        debug: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn()
      },
      messageService: {
        joinChat: jest.fn().mockResolvedValue(),
        fetchGroupMessages: jest.fn().mockResolvedValue([])
      },
      parseCommands: jest.fn(),
      commandService: jest.fn(),
      updateLastMessageId: jest.fn()
    };

    // Get reference to the mocked constructor
    MockSocketClient = require('ttfm-socket').SocketClient;
    
    bot = new Bot('test-slug', mockServices);
  });

  describe('getConnectionStatus', () => {
    test('should return connection status when connected', () => {
      // Setup socket and state
      bot.socket = { connected: true };
      bot.state = { room: 'test-room' };
      bot.lastMessageIDs = { id: 'msg-123', fromTimestamp: 1000 };
      
      const status = bot.getConnectionStatus();
      
      expect(status).toEqual({
        isConnected: true,
        hasState: true,
        lastMessageId: 'msg-123',
        lastTimestamp: 1000
      });
    });

    test('should return disconnected status when not connected', () => {
      bot.socket = null;
      bot.state = null;
      bot.lastMessageIDs = {};
      
      const status = bot.getConnectionStatus();
      
      expect(status).toEqual({
        isConnected: false,
        hasState: false,
        lastMessageId: undefined,
        lastTimestamp: undefined
      });
    });

    test('should handle missing socket client', () => {
      bot.socket = null;
      bot.state = null;
      bot.lastMessageIDs = null;
      
      const status = bot.getConnectionStatus();
      
      expect(status).toEqual({
        isConnected: false,
        hasState: false,
        lastMessageId: undefined,
        lastTimestamp: undefined
      });
    });

    test('should handle partial state', () => {
      bot.socket = { connected: true };
      bot.state = null;
      bot.lastMessageIDs = { id: 'msg-456' };
      
      const status = bot.getConnectionStatus();
      
      expect(status).toEqual({
        isConnected: true,
        hasState: false,
        lastMessageId: 'msg-456',
        lastTimestamp: undefined
      });
    });
  });

  describe('disconnect', () => {
    test('should disconnect successfully when socket exists', async () => {
      bot.socket = { connected: true };
      bot.state = { room: 'test-room' };
      
      await bot.disconnect();
      
      expect(mockServices.logger.debug).toHaveBeenCalledWith('Disconnecting bot...');
      expect(bot.socket).toBeNull();
      expect(bot.state).toBeNull();
      expect(mockServices.logger.debug).toHaveBeenCalledWith('✅ Bot disconnected');
    });

    test('should handle missing socket gracefully', async () => {
      bot.socket = null;
      bot.state = { room: 'test-room' };
      
      await bot.disconnect();
      
      expect(mockServices.logger.debug).toHaveBeenCalledWith('Disconnecting bot...');
      expect(bot.socket).toBeNull();
      expect(bot.state).toBeNull();
      expect(mockServices.logger.debug).toHaveBeenCalledWith('✅ Bot disconnected');
    });

    test('should handle all null state', async () => {
      bot.socket = null;
      bot.state = null;
      
      await bot.disconnect();
      
      expect(mockServices.logger.debug).toHaveBeenCalledWith('Disconnecting bot...');
      expect(bot.socket).toBeNull();
      expect(bot.state).toBeNull();
      expect(mockServices.logger.debug).toHaveBeenCalledWith('✅ Bot disconnected');
    });
  });
});
