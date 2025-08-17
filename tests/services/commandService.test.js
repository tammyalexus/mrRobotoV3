const commandService = require('../../src/services/commandService.js');

// Mock messageService
const mockMessageService = {
  sendGroupMessage: jest.fn().mockResolvedValue({ success: true })
};

// Mock services
const mockServices = {
  messageService: mockMessageService,
  logger: {
    debug: jest.fn(),
    error: jest.fn()
  },
  config: {
    COMMAND_SWITCH: '!'
  }
};

// Mock context
const mockContext = {
  sender: 'testUser',
  fullMessage: {},
  chatMessage: '!help'
};

describe('commandService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processCommand', () => {
    test('should handle help command', async () => {
      const result = await commandService('help', '', mockServices, mockContext);
      
      expect(result.success).toBe(true);
      expect(result.shouldRespond).toBe(true);
      expect(result.response).toContain('Available Commands');
      expect(mockMessageService.sendGroupMessage).toHaveBeenCalledWith(
        expect.stringContaining('Available Commands')
      );
    });

    test('should handle ping command', async () => {
      const result = await commandService('ping', '', mockServices, mockContext);
      
      expect(result.success).toBe(true);
      expect(result.shouldRespond).toBe(true);
      expect(result.response).toContain('Pong');
      expect(mockMessageService.sendGroupMessage).toHaveBeenCalledWith(
        expect.stringContaining('Pong')
      );
    });

    test('should handle status command', async () => {
      const result = await commandService('status', '', mockServices, mockContext);
      
      expect(result.success).toBe(true);
      expect(result.shouldRespond).toBe(true);
      expect(result.response).toContain('Bot Status');
      expect(mockMessageService.sendGroupMessage).toHaveBeenCalledWith(
        expect.stringContaining('Bot Status')
      );
    });

    test('should handle echo command with message', async () => {
      const testMessage = 'Hello World';
      const result = await commandService('echo', testMessage, mockServices, mockContext);
      
      expect(result.success).toBe(true);
      expect(result.shouldRespond).toBe(true);
      expect(result.response).toContain(testMessage);
      expect(mockMessageService.sendGroupMessage).toHaveBeenCalledWith(
        expect.stringContaining(testMessage)
      );
    });

    test('should handle echo command without message', async () => {
      const result = await commandService('echo', '', mockServices, mockContext);
      
      expect(result.success).toBe(false);
      expect(result.shouldRespond).toBe(true);
      expect(result.response).toContain('Echo what?');
    });

    test('should handle unknown command', async () => {
      const result = await commandService('unknown', '', mockServices, mockContext);
      
      expect(result.success).toBe(false);
      expect(result.shouldRespond).toBe(true);
      expect(result.error).toBe('Unknown command');
      expect(result.response).toContain('Unknown command');
    });

    test('should handle errors gracefully', async () => {
      // Mock messageService to throw an error
      mockMessageService.sendGroupMessage.mockRejectedValueOnce(new Error('Network error'));
      
      const result = await commandService('ping', '', mockServices, mockContext);
      
      expect(result.success).toBe(false);
      expect(result.shouldRespond).toBe(false);
      expect(result.error).toContain('Network error');
    });

    test('should work without services parameter (fallback)', async () => {
      // This test ensures backward compatibility
      const result = await commandService('help', '');
      
      // Should not throw an error, but might not send message due to missing messageService
      expect(typeof result).toBe('object');
    });
  });
});
