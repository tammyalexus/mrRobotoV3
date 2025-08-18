const path = require('path');

// Mock fs promises - must be done before requiring Bot
const mockAppendFile = jest.fn();
jest.mock('fs', () => ({
  promises: {
    appendFile: mockAppendFile
  }
}));

// Mock ttfm-socket
const mockSocketInstance = {
  joinRoom: jest.fn(),
  on: jest.fn()
};

const MockSocketClient = jest.fn().mockImplementation(() => mockSocketInstance);

jest.mock('ttfm-socket', () => ({
  SocketClient: MockSocketClient,
  ServerMessageName: {},
  StatefulServerMessageName: {},
  StatelessServerMessageName: {}
}));

// Now import Bot after mocks are set up
const { Bot } = require('../../../src/lib/bot.js');

describe('Bot', () => {
  let bot;
  let mockServices;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Clear mock on mockAppendFile
    mockAppendFile.mockClear();
    MockSocketClient.mockClear();
    mockSocketInstance.joinRoom.mockClear();
    mockSocketInstance.on.mockClear();

    // Create comprehensive mock services
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

    bot = new Bot('test-slug', mockServices);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Constructor', () => {
    test('should initialize with services and empty lastMessageIDs', () => {
      expect(bot.services).toBe(mockServices);
      expect(bot.lastMessageIDs).toEqual({});
    });
  });

  describe('_writeToLogFile', () => {
    test('should write formatted log entry to file', async () => {
      const filename = 'test.log';
      const data = { message: 'test data', id: 123 };
      
      // Mock Date.toISOString for consistent timestamp
      const mockTimestamp = '2023-01-01T12:00:00.000Z';
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(mockTimestamp);
      
      await bot._writeToLogFile(filename, data);
      
      const expectedPath = path.join(process.cwd(), 'logs', filename);
      const expectedContent = `${mockTimestamp}: ${JSON.stringify(data, null, 2)}\n`;
      
      expect(mockAppendFile).toHaveBeenCalledWith(expectedPath, expectedContent);
    });

    test('should handle file write errors gracefully', async () => {
      const filename = 'test.log';
      const data = { test: 'data' };
      const writeError = new Error('File write failed');
      
      mockAppendFile.mockRejectedValueOnce(writeError);
      
      await bot._writeToLogFile(filename, data);
      
      expect(mockServices.logger.error).toHaveBeenCalledWith(
        `Failed to write to log file ${filename}: ${writeError.message}`
      );
    });
  });

  describe('connect', () => {
    test('should execute full connection flow', async () => {
      // Mock all connection steps
      bot._joinCometChat = jest.fn().mockResolvedValue();
      bot._createSocketConnection = jest.fn().mockResolvedValue();
      bot._joinSocketRoom = jest.fn().mockResolvedValue();
      bot._setupReconnectHandler = jest.fn();
      
      await bot.connect();
      
      expect(bot._joinCometChat).toHaveBeenCalled();
      expect(bot._createSocketConnection).toHaveBeenCalled();
      expect(bot._joinSocketRoom).toHaveBeenCalled();
      expect(bot._setupReconnectHandler).toHaveBeenCalled();
    });

    test('should handle connection errors', async () => {
      const connectionError = new Error('Connection failed');
      bot._joinCometChat = jest.fn().mockRejectedValue(connectionError);
      bot._createSocketConnection = jest.fn();
      bot._joinSocketRoom = jest.fn();
      bot._setupReconnectHandler = jest.fn();
      
      await expect(bot.connect()).rejects.toThrow('Connection failed');
      
      expect(bot._joinCometChat).toHaveBeenCalled();
      expect(bot._createSocketConnection).not.toHaveBeenCalled();
    });
  });

  describe('_joinCometChat', () => {
    test('should call messageService.joinChat with hangout ID', async () => {
      await bot._joinCometChat();
      
      expect(mockServices.logger.debug).toHaveBeenCalledWith('Joining the chat...');
      expect(mockServices.messageService.joinChat).toHaveBeenCalledWith('test-hangout-123');
    });
  });

  describe('_createSocketConnection', () => {
    test('should create SocketClient with correct URL', async () => {
      await bot._createSocketConnection();
      
      expect(mockServices.logger.debug).toHaveBeenCalledWith('Creating SocketClient...');
      expect(MockSocketClient).toHaveBeenCalledWith('https://socket.prod.tt.fm');
      expect(bot.socket).toBeDefined();
      expect(mockServices.logger.debug).toHaveBeenCalledWith('✅ SocketClient created');
    });
  });

  describe('_joinSocketRoom', () => {
    test('should join room and set state on success', async () => {
      const mockState = { roomId: 'test-room', users: [] };
      bot._joinRoomWithTimeout = jest.fn().mockResolvedValue({ state: mockState });
      
      await bot._joinSocketRoom();
      
      expect(mockServices.logger.debug).toHaveBeenCalledWith('Joining room...');
      expect(bot._joinRoomWithTimeout).toHaveBeenCalled();
      expect(bot.state).toBe(mockState);
      expect(mockServices.logger.debug).toHaveBeenCalledWith('✅ Room joined successfully, setting up state...');
    });

    test('should handle room join errors', async () => {
      const joinError = new Error('Room join failed');
      bot._joinRoomWithTimeout = jest.fn().mockRejectedValue(joinError);
      
      await expect(bot._joinSocketRoom()).rejects.toThrow('Room join failed');
      
      expect(mockServices.logger.error).toHaveBeenCalledWith(`❌ Failed to join room: ${joinError}`);
    });
  });

  describe('_joinRoomWithTimeout', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should join room successfully within timeout', async () => {
      const mockResponse = { state: { roomId: 'test' } };
      mockSocketInstance.joinRoom.mockResolvedValue(mockResponse);
      
      // Set up socket for this test
      bot.socket = mockSocketInstance;
      
      const joinPromise = bot._joinRoomWithTimeout();
      
      // Fast-forward time but not past the timeout
      jest.advanceTimersByTime(5000);
      
      const result = await joinPromise;
      
      expect(mockSocketInstance.joinRoom).toHaveBeenCalledWith('test-bot-token-456', {
        roomUuid: 'test-hangout-123'
      });
      expect(result).toBe(mockResponse);
    });

    test('should timeout if room join takes too long', async () => {
      // Make joinRoom hang indefinitely
      mockSocketInstance.joinRoom.mockImplementation(() => new Promise(() => {}));
      
      // Set up socket for this test
      bot.socket = mockSocketInstance;
      
      const joinPromise = bot._joinRoomWithTimeout();
      
      // Fast-forward past the timeout
      jest.advanceTimersByTime(11000);
      
      await expect(joinPromise).rejects.toThrow('Socket join room timeout after 10 seconds');
    });
  });

  describe('_setupReconnectHandler', () => {
    beforeEach(() => {
      bot.socket = mockSocketInstance;
    });

    test('should register reconnect event handler', () => {
      bot._setupReconnectHandler();
      
      expect(mockServices.logger.debug).toHaveBeenCalledWith('✅ Setting up reconnect handler...');
      expect(mockSocketInstance.on).toHaveBeenCalledWith('reconnect', expect.any(Function));
    });

    test('should handle successful reconnect', async () => {
      const mockState = { roomId: 'reconnected-room' };
      mockSocketInstance.joinRoom.mockResolvedValue({ state: mockState });
      
      bot._setupReconnectHandler();
      
      // Get the reconnect handler function
      const reconnectHandler = mockSocketInstance.on.mock.calls.find(call => call[0] === 'reconnect')[1];
      
      await reconnectHandler();
      
      expect(mockServices.logger.debug).toHaveBeenCalledWith('🔄 Reconnecting to room...');
      expect(mockSocketInstance.joinRoom).toHaveBeenCalledWith('test-bot-token-456', {
        roomUuid: 'test-hangout-123'
      });
      expect(bot.state).toBe(mockState);
      expect(mockServices.logger.debug).toHaveBeenCalledWith('🔄 Reconnected successfully');
    });

    test('should handle reconnect errors', async () => {
      const reconnectError = new Error('Reconnect failed');
      mockSocketInstance.joinRoom.mockRejectedValue(reconnectError);
      
      bot._setupReconnectHandler();
      
      // Get the reconnect handler function
      const reconnectHandler = mockSocketInstance.on.mock.calls.find(call => call[0] === 'reconnect')[1];
      
      await reconnectHandler();
      
      expect(mockServices.logger.error).toHaveBeenCalledWith(`❌ Reconnection failed: ${reconnectError}`);
    });
  });

  describe('configureListeners', () => {
    beforeEach(() => {
      bot.socket = mockSocketInstance;
    });

    test('should set up all listeners', () => {
      bot._setupStatefulMessageListener = jest.fn();
      bot._setupStatelessMessageListener = jest.fn();
      bot._setupServerMessageListener = jest.fn();
      bot._setupErrorListener = jest.fn();
      
      bot.configureListeners();
      
      expect(mockServices.logger.debug).toHaveBeenCalledWith('Setting up listeners');
      expect(bot._setupStatefulMessageListener).toHaveBeenCalled();
      expect(bot._setupStatelessMessageListener).toHaveBeenCalled();
      expect(bot._setupServerMessageListener).toHaveBeenCalled();
      expect(bot._setupErrorListener).toHaveBeenCalled();
    });
  });

  describe('_setupStatefulMessageListener', () => {
    beforeEach(() => {
      bot.socket = mockSocketInstance;
    });

    test('should register statefulMessage handler', async () => {
      bot._writeToLogFile = jest.fn().mockResolvedValue();
      
      bot._setupStatefulMessageListener();
      
      expect(mockSocketInstance.on).toHaveBeenCalledWith('statefulMessage', expect.any(Function));
      
      // Test the handler
      const handler = mockSocketInstance.on.mock.calls.find(call => call[0] === 'statefulMessage')[1];
      const payload = { name: 'testStatefulMessage', data: 'test' };
      
      await handler(payload);
      
      expect(mockServices.logger.debug).toHaveBeenCalledWith('statefulMessage - testStatefulMessage');
      expect(bot._writeToLogFile).toHaveBeenCalledWith('statefulMessage.log', payload);
    });
  });

  describe('_setupStatelessMessageListener', () => {
    beforeEach(() => {
      bot.socket = mockSocketInstance;
    });

    test('should register statelessMessage handler', async () => {
      bot._writeToLogFile = jest.fn().mockResolvedValue();
      
      bot._setupStatelessMessageListener();
      
      expect(mockSocketInstance.on).toHaveBeenCalledWith('statelessMessage', expect.any(Function));
      
      // Test the handler
      const handler = mockSocketInstance.on.mock.calls.find(call => call[0] === 'statelessMessage')[1];
      const payload = { name: 'testStatelessMessage', data: 'test' };
      
      await handler(payload);
      
      expect(mockServices.logger.debug).toHaveBeenCalledWith('statelessMessage - testStatelessMessage');
      expect(bot._writeToLogFile).toHaveBeenCalledWith('statelessMessage.log', payload);
    });
  });

  describe('_setupServerMessageListener', () => {
    beforeEach(() => {
      bot.socket = mockSocketInstance;
    });

    test('should register serverMessage handler', async () => {
      bot._writeToLogFile = jest.fn().mockResolvedValue();
      
      bot._setupServerMessageListener();
      
      expect(mockSocketInstance.on).toHaveBeenCalledWith('serverMessage', expect.any(Function));
      
      // Test the handler
      const handler = mockSocketInstance.on.mock.calls.find(call => call[0] === 'serverMessage')[1];
      const payload = { message: { name: 'testServerMessage' }, data: 'test' };
      
      await handler(payload);
      
      expect(mockServices.logger.debug).toHaveBeenCalledWith('serverMessage - testServerMessage');
      expect(bot._writeToLogFile).toHaveBeenCalledWith('serverMessage.log', payload);
    });
  });

  describe('_setupErrorListener', () => {
    beforeEach(() => {
      bot.socket = mockSocketInstance;
    });

    test('should register error handler', async () => {
      bot._writeToLogFile = jest.fn().mockResolvedValue();
      
      // Mock Date.toISOString for consistent timestamp
      const mockTimestamp = '2023-01-01T12:00:00.000Z';
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(mockTimestamp);
      
      bot._setupErrorListener();
      
      expect(mockSocketInstance.on).toHaveBeenCalledWith('error', expect.any(Function));
      
      // Test the handler
      const handler = mockSocketInstance.on.mock.calls.find(call => call[0] === 'error')[1];
      const errorMessage = 'Socket connection error';
      
      await handler(errorMessage);
      
      expect(mockServices.logger.debug).toHaveBeenCalledWith(`Socket error: ${errorMessage}`);
      expect(bot._writeToLogFile).toHaveBeenCalledWith('socketError.log', {
        error: errorMessage,
        timestamp: mockTimestamp
      });
    });
  });
});
